/**
 * EcoAI - Google Gemini API Integration Module
 * 
 * ============================================================================
 * ACADEMIC DEMONSTRATION & SECURITY ARCHITECTURE NOTICE:
 * ============================================================================
 * This is a static frontend-only web application built for a college BCA project.
 * Because there is strictly NO backend server, HTTP requests to the Gemini API
 * originate directly from the user's browser client.
 * 
 * IMPORTANT SECURITY DISCLOSURE:
 * - A pure frontend application CANNOT completely hide an API key. Any user can
 *   inspect the key in browser Developer Tools (Network tab -> payload/headers).
 * - For college demonstrations, evaluation, or personal academic testing, you can
 *   enter your Gemini API Key in the UI settings (stored in LocalStorage) or
 *   configure a `.env` variable for your local Vite/development server.
 * - NEVER commit your real Gemini API key to a public GitHub repository.
 * - For production commercial deployments, requests MUST be proxied through a
 *   backend server (Node.js/Cloud Function) to protect API credentials.
 * ============================================================================
 */

import { Storage } from './storage.js';

export const GEMINI_CONFIG = {
  // Primary model
  MODEL_NAME: 'gemini-3.8-flash',
  // Highly available fallback models if a temporary high-demand spike (503/429) occurs on Google servers
  FALLBACK_MODELS: ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'],
  BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models',
  
  // Timeout in milliseconds
  REQUEST_TIMEOUT_MS: 30000,
  
  // In-flight request lock
  isRequestInProgress: false
};

/**
 * Format markdown-like text to sanitized HTML for clean chat and plan rendering
 */
export function formatAiResponse(rawText) {
  if (!rawText) return '';
  
  let text = rawText
    // Escape standard HTML characters for security
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold (**text**)
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic (*text*)
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Headers (### Heading or ## Heading)
  text = text.replace(/^### (.*$)/gim, '<h4 class="text-base font-semibold text-emerald-900 mt-3 mb-1.5">$1</h4>');
  text = text.replace(/^## (.*$)/gim, '<h3 class="text-lg font-bold text-emerald-950 mt-4 mb-2 pb-1 border-b border-emerald-100">$1</h3>');
  
  // Bullet points
  const lines = text.split('\n');
  let inList = false;
  let formattedLines = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      if (!inList) {
        formattedLines.push('<ul class="list-disc pl-5 my-2 space-y-1.5 text-slate-700">');
        inList = true;
      }
      formattedLines.push(`<li>${trimmed.substring(2)}</li>`);
    } else if (/^\d+\.\s/.test(trimmed)) {
      if (!inList) {
        formattedLines.push('<ol class="list-decimal pl-5 my-2 space-y-1.5 text-slate-700">');
        inList = true;
      }
      formattedLines.push(`<li>${trimmed.replace(/^\d+\.\s/, '')}</li>`);
    } else {
      if (inList) {
        formattedLines.push('</ul>');
        inList = false;
      }
      if (trimmed.length > 0) {
        formattedLines.push(`<p class="my-2 leading-relaxed text-slate-700">${trimmed}</p>`);
      }
    }
  }
  if (inList) {
    formattedLines.push('</ul>');
  }

  return formattedLines.join('\n');
}

/**
 * Core HTTP Dispatcher to official Google Gemini API (v1beta)
 * Implements automatic retry with exponential backoff on 503 (high demand)
 * and seamless fallback across compatible Gemini Flash models.
 */
async function callGeminiApi({ contents, systemInstruction, temperature = 0.7 }) {
  if (GEMINI_CONFIG.isRequestInProgress) {
    throw new Error('BUSY: Another AI analysis is currently running. Please wait a moment.');
  }

  GEMINI_CONFIG.isRequestInProgress = true;
  const clientApiKey = Storage.getApiKey();

  try {
    // 1. Try Vercel Serverless Function (/api/gemini)
    // Uses GEMINI_API_KEY configured in Vercel Project Settings automatically
    try {
      const vController = new AbortController();
      const vTimeout = setTimeout(() => vController.abort(), 25000);

      const vercelRes = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(clientApiKey ? { 'x-gemini-key': clientApiKey } : {})
        },
        body: JSON.stringify({
          contents,
          systemInstruction,
          temperature,
          model: GEMINI_CONFIG.MODEL_NAME
        }),
        signal: vController.signal
      });

      clearTimeout(vTimeout);

      if (vercelRes.ok) {
        const data = await vercelRes.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } else if (vercelRes.status === 400) {
        const errJson = await vercelRes.json().catch(() => ({}));
        if (errJson?.error?.message?.includes('MISSING_KEY') && !clientApiKey) {
          throw new Error('MISSING_KEY: GEMINI_API_KEY is not configured. Please add GEMINI_API_KEY in Vercel Project Settings > Environment Variables.');
        }
      }
    } catch (proxyError) {
      if (proxyError.message && proxyError.message.includes('MISSING_KEY')) {
        throw proxyError;
      }
      // If /api/gemini is unavailable (e.g. static local preview), proceed to direct client API call
    }

    // 2. Direct client-side fetch (for local preview or when client key is provided)
    const apiKey = clientApiKey;
    if (!apiKey) {
      throw new Error(
        'MISSING_KEY: Gemini API Key is not configured. Please configure GEMINI_API_KEY in Vercel Environment Variables or click "API Key" to add it.'
      );
    }

    const modelsToTry = [
      GEMINI_CONFIG.MODEL_NAME,
      ...GEMINI_CONFIG.FALLBACK_MODELS.filter(m => m !== GEMINI_CONFIG.MODEL_NAME)
    ];
    let lastError = null;

    for (const model of modelsToTry) {
      const endpoint = `${GEMINI_CONFIG.BASE_URL}/${model}:generateContent?key=${apiKey}`;

      const requestBody = {
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens: 2048,
          topP: 0.95
        }
      };

      if (systemInstruction) {
        requestBody.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      // Retry up to 2 attempts on 503 before moving to next model
      for (let attempt = 1; attempt <= 2; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), GEMINI_CONFIG.REQUEST_TIMEOUT_MS);

        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            const candidate = data.candidates?.[0];
            const generatedText = candidate?.content?.parts?.[0]?.text;

            if (!generatedText) {
              if (candidate?.finishReason === 'SAFETY') {
                throw new Error('SAFETY_TRIGGER: The response was filtered due to Gemini environmental safety guidelines.');
              }
              throw new Error('EMPTY_RESPONSE: The AI model returned an empty response. Please retry your question.');
            }

            return generatedText;
          }

          const errorData = await response.json().catch(() => ({}));
          const message = errorData?.error?.message || response.statusText;

          // 503 High Demand / Service Unavailable handling
          if (response.status === 503 || message.includes('high demand') || message.includes('temporarily unavailable')) {
            console.warn(`[EcoAI] Model ${model} returned 503 High Demand (attempt ${attempt}/2).`);
            lastError = new Error(`HIGH_DEMAND (503): Google's servers for ${model} are experiencing high traffic.`);
            if (attempt === 1) {
              // Wait 1.2 seconds and retry once
              await new Promise(r => setTimeout(r, 1200));
              continue;
            } else {
              // Move to next fallback model
              break;
            }
          }

          // 400 Bad Request
          if (response.status === 400) {
            if (message.includes('API_KEY_INVALID') || message.includes('API key not valid')) {
              throw new Error('INVALID_KEY: The provided Gemini API Key is invalid. Please check your Google AI Studio key in Settings.');
            }
            throw new Error(`API Request Error (400): ${message}`);
          } else if (response.status === 404) {
            console.warn(`[EcoAI] Model ${model} returned 404. Switching to fallback.`);
            lastError = new Error(`MODEL_NOT_FOUND (404): ${message}`);
            break;
          } else if (response.status === 429) {
            console.warn(`[EcoAI] Rate limit hit on ${model}. Trying next available model.`);
            lastError = new Error('QUOTA_EXCEEDED: Gemini API rate limit reached. Retrying with alternate model.');
            await new Promise(r => setTimeout(r, 800));
            break;
          } else if (response.status === 403) {
            throw new Error('FORBIDDEN: Permission denied. Verify your API key has Generative Language API access enabled.');
          } else {
            throw new Error(`Gemini API Error (${response.status}): ${message}`);
          }
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          if (fetchErr.name === 'AbortError') {
            lastError = new Error('TIMEOUT: The request took longer than 30 seconds. Please check your internet connection.');
            break;
          }
          if (fetchErr.message && (fetchErr.message.includes('INVALID_KEY') || fetchErr.message.includes('FORBIDDEN'))) {
            throw fetchErr;
          }
          lastError = fetchErr;
        }
      }
    }

    throw lastError || new Error('HIGH_DEMAND (503): Google Gemini servers are experiencing temporary high traffic across all model instances. Please try again in 10-15 seconds.');
  } finally {
    GEMINI_CONFIG.isRequestInProgress = false;
  }
}

/**
 * Test key validity with fallback support
 */
export async function testApiKeyConnection(testKey) {
  const models = [GEMINI_CONFIG.MODEL_NAME, ...GEMINI_CONFIG.FALLBACK_MODELS];
  let lastErr = null;

  for (const m of models) {
    try {
      const endpoint = `${GEMINI_CONFIG.BASE_URL}/${m}:generateContent?key=${testKey.trim()}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Respond with the word "CONNECTED".' }] }],
          generationConfig: { maxOutputTokens: 10 }
        })
      });

      if (response.ok) {
        const data = await response.json();
        return !!data.candidates?.[0]?.content?.parts?.[0]?.text;
      }

      const errorData = await response.json().catch(() => ({}));
      lastErr = new Error(errorData?.error?.message || `HTTP ${response.status}`);
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr || new Error('Unable to connect to Google Gemini API.');
}

/**
 * Feature 2: Interactive Environmental Chatbot
 */
export async function sendEnvironmentalQuery(userMessage, conversationHistory = [], language = 'en') {
  const systemPrompt = `You are "EcoAI", an expert Environmental Sustainability & SDG 13 (Climate Action) Assistant designed for students, educators, and citizens.
Guidelines:
1. Always base advice on factual climate science, international environmental guidelines (UNEP, UNFCCC, IPCC, WHO), and realistic student-friendly conservation habits.
2. Structure answers cleanly with bullet points, brief paragraphs, and clear subheadings.
3. If the user asks in Hindi or asks for Hindi, respond in fluent, easy-to-understand Hindi (Devanagari script) with technical terms explained.
4. Language preference is set to: "${language === 'hi' ? 'Hindi (हिंदी)' : 'English'}".
5. Do not invent real-time weather alerts or unverified scientific data. If live verified sensor readings are requested, explain that live regional sensor measurements require municipal telemetry.
6. Provide actionable, practical advice for saving electricity, reducing plastic, conserving water, composting, public transit, and campus green initiatives.`;

  // Build conversational turns
  const contents = [];
  
  // Include recent history (up to last 6 turns to manage context window)
  const recentHistory = conversationHistory.slice(-6);
  for (const item of recentHistory) {
    contents.push({
      role: item.role === 'user' ? 'user' : 'model',
      parts: [{ text: item.text }]
    });
  }

  // Add current user prompt
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  return await callGeminiApi({
    contents,
    systemInstruction: systemPrompt,
    temperature: 0.6
  });
}

/**
 * Feature 3: Personalized AI Sustainability Planner
 */
export async function generateSustainabilityPlan(habits, language = 'en') {
  const systemPrompt = `You are the EcoAI Sustainability Planner. Your task is to analyze an individual's daily lifestyle habits and produce a structured, practical, and inspiring personal Sustainability Action Plan aligned with UN SDG 13.
Structure your output into these explicit sections using markdown:
## 1. Lifestyle Impact Summary
(An empathetic, objective assessment of their current footprint and strong vs improvable areas)

## 2. Top Three Priority Improvements
(The 3 highest impact lifestyle modifications they should focus on first)

## 3. Daily Sustainable Micro-Actions
(Specific, low-friction habits to practice every single day)

## 4. Weekly Conservation Routines
(Weekend or weekly habits such as batch meal prep, laundry temperature, waste segregation audit)

## 5. Monthly Sustainability Milestones
(Measurable targets for 30, 60, and 90 days)

## 6. Practical Campus & Student Tips
(Cost-effective or zero-cost strategies tailored for college students, dorms, and budget-conscious youth)

## 7. Estimated Environmental Benefit & Difficulty
(Provide an honest, cautious qualitative estimation of impact: e.g., Low / Medium / High difficulty, with estimated CO2 & resource conservation potentials, explaining that figures are educational estimates).

Respond in ${language === 'hi' ? 'Hindi' : 'English'}. Avoid unrealistic or overly expensive demands.`;

  const habitSummary = `User Profile & Habits:
- Daily Commute Mode: ${habits.commuteMode}
- Daily Commute Distance: ${habits.commuteDistance} km
- Electricity Awareness & Conservation: ${habits.electricityHabits}
- Water Conservation Practices: ${habits.waterHabits}
- Single-use Plastic Frequency: ${habits.plasticUsage}
- Waste Disposal & Segregation: ${habits.wasteHabits}
- Dietary Preference: ${habits.dietType}
- Specific Student / Living Context: ${habits.livingContext || 'College Student'}`;

  const contents = [{
    role: 'user',
    parts: [{ text: habitSummary }]
  }];

  return await callGeminiApi({
    contents,
    systemInstruction: systemPrompt,
    temperature: 0.5
  });
}

/**
 * Feature 5: AI Waste Management Assistant
 */
export async function analyzeWasteDisposal(wasteCategory, specificItem = '', language = 'en') {
  const systemPrompt = `You are the EcoAI Waste Management Specialist.
Provide an authoritative, clear, and actionable guide for disposing, segregating, or upcycling the designated waste item or material.
Important safety rule: Never advise burning plastic or mishandling chemical/electronic hazards. Always remind users that municipal segregation rules (dry/wet/hazardous) take precedence.

Structure your advice with the following clear headings:
## Material Overview: ${wasteCategory} ${specificItem ? '(' + specificItem + ')' : ''}
- **Category & Recyclability Code:** (e.g., PET 1, HDPE 2, E-Waste Class, Organic Biodegradable)
- **Primary Segregation Bin:** (e.g., Blue Dry Bin, Green Wet/Compost Bin, Red Hazardous Collection)
- **Preparation Step:** (Cleaning, rinsing, removing tape, drying)
- **Upcycling & Reuse Options:** (Practical ways to extend lifespan before disposal)
- **Safe Municipal Disposal / Recycling Process:** (How it should be handed over to local centers)
- **Environmental Hazard if Dumped/Burned:** (Toxicity, microplastics, methane emissions)
- **Local Rule Advisory:** "Note: Local municipal regulations may vary. Always check with your local municipal corporation or campus waste management authority."

Respond in ${language === 'hi' ? 'Hindi' : 'English'}.`;

  const promptText = `Analyze waste item: Category: "${wasteCategory}", Item description: "${specificItem || 'General category items'}". Provide comprehensive segregation, recycling, and safe disposal advice.`;

  const contents = [{
    role: 'user',
    parts: [{ text: promptText }]
  }];

  return await callGeminiApi({
    contents,
    systemInstruction: systemPrompt,
    temperature: 0.4
  });
}
