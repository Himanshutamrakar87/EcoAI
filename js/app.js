/**
 * EcoAI - Main Application Controller
 * Orchestrates UI interactions, Gemini AI workflows, carbon footprint estimation,
 * habit tracking, and responsive navigation.
 */

import { Storage } from './storage.js';
import { 
  sendEnvironmentalQuery, 
  generateSustainabilityPlan, 
  analyzeWasteDisposal, 
  formatAiResponse, 
  testApiKeyConnection 
} from './gemini.js';
import { calculateFootprint, renderCarbonChart } from './calculator.js';
import { ChallengesManager } from './challenges.js';

// Application State
const AppState = {
  currentLanguage: Storage.getLanguage() || 'en', // 'en' | 'hi'
  chatHistory: Storage.getChatHistory() || [],
  selectedWasteCategory: 'Plastic',
  challengesManager: new ChallengesManager(),
  isAiProcessing: false
};

// DOM Content Loaded Initializer
document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  initNavigation();
  initApiKeyModal();
  initChatAssistant();
  initSustainabilityPlanner();
  initCarbonCalculator();
  initWasteManager();
  initChallenges();
  initSmoothScroll();
});

/**
 * Initialize Lucide icons safely
 */
function initIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

/**
 * Toast Notification System
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle-2';
  if (type === 'error') iconName = 'alert-circle';

  toast.innerHTML = `
    <i data-lucide="${iconName}" style="width: 18px; height: 18px; flex-shrink: 0;"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  initIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Responsive Navigation & Active State Tracking
 */
function initNavigation() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.getElementById('navLinks');
  const navLinkItems = document.querySelectorAll('.nav-link');

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      const isOpen = navLinks.classList.contains('open');
      mobileMenuBtn.innerHTML = isOpen 
        ? '<i data-lucide="x"></i>' 
        : '<i data-lucide="menu"></i>';
      initIcons();
    });

    // Close mobile nav on link click
    navLinkItems.forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        if (mobileMenuBtn) {
          mobileMenuBtn.innerHTML = '<i data-lucide="menu"></i>';
          initIcons();
        }
      });
    });
  }

  // Active section observer on scroll
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    let current = '';
    const scrollY = window.pageYOffset;
    sections.forEach(section => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 120;
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinkItems.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

/**
 * API Key Configuration Modal & Indicator
 */
function initApiKeyModal() {
  const triggerBtn = document.getElementById('apiKeyTriggerBtn');
  const footerApiKeyLink = document.getElementById('footerApiKeyLink');
  const footerResetDataLink = document.getElementById('footerResetDataLink');
  const modal = document.getElementById('apiKeyModal');
  const closeBtn = document.getElementById('closeApiKeyModalBtn');
  const saveBtn = document.getElementById('saveApiKeyBtn');
  const testBtn = document.getElementById('testKeyConnectionBtn');
  const clearBtn = document.getElementById('clearSavedKeyBtn');
  const keyInput = document.getElementById('apiKeyInput');
  const toggleVisibilityBtn = document.getElementById('toggleKeyVisibilityBtn');
  const feedback = document.getElementById('keyTestFeedback');
  const statusLabel = document.getElementById('apiKeyStatusLabel');

  function updateStatusIndicator() {
    const key = Storage.getApiKey();
    if (key && key.length > 5) {
      triggerBtn?.classList.add('active');
      if (statusLabel) statusLabel.textContent = 'Key Active';
    } else {
      triggerBtn?.classList.remove('active');
      if (statusLabel) statusLabel.textContent = 'API Key';
    }
  }

  function openModal() {
    if (modal) {
      modal.classList.add('open');
      if (keyInput) {
        keyInput.value = Storage.getApiKey() || '';
      }
      if (feedback) feedback.style.display = 'none';
    }
  }

  function closeModal() {
    if (modal) modal.classList.remove('open');
  }

  triggerBtn?.addEventListener('click', openModal);
  footerApiKeyLink?.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });

  footerResetDataLink?.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('Clear all local data including chat history, challenges progress, and saved plan?')) {
      Storage.clearChatHistory();
      Storage.resetChallenges();
      Storage.clearSavedPlan();
      location.reload();
    }
  });

  closeBtn?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  toggleVisibilityBtn?.addEventListener('click', () => {
    if (keyInput.type === 'password') {
      keyInput.type = 'text';
      toggleVisibilityBtn.textContent = 'Hide Key';
    } else {
      keyInput.type = 'password';
      toggleVisibilityBtn.textContent = 'Show Key';
    }
  });

  saveBtn?.addEventListener('click', () => {
    const keyVal = keyInput.value.trim();
    if (keyVal.length === 0) {
      Storage.clearApiKey();
      updateStatusIndicator();
      showToast('API key removed from local storage.', 'info');
      closeModal();
      return;
    }

    Storage.setApiKey(keyVal);
    updateStatusIndicator();
    showToast('Gemini API key saved to LocalStorage.', 'success');
    closeModal();
  });

  clearBtn?.addEventListener('click', () => {
    Storage.clearApiKey();
    if (keyInput) keyInput.value = '';
    updateStatusIndicator();
    showToast('API key cleared.', 'info');
    if (feedback) feedback.style.display = 'none';
  });

  testBtn?.addEventListener('click', async () => {
    const keyVal = keyInput.value.trim();
    if (!keyVal) {
      showToast('Please enter an API key to test.', 'error');
      return;
    }

    testBtn.disabled = true;
    testBtn.textContent = 'Testing...';
    if (feedback) {
      feedback.style.display = 'block';
      feedback.style.background = '#F0FDF4';
      feedback.style.color = '#14532D';
      feedback.style.border = '1px solid #BBF7D0';
      feedback.textContent = 'Connecting to Google Generative Language API...';
    }

    try {
      await testApiKeyConnection(keyVal);
      if (feedback) {
        feedback.style.background = '#DCFCE7';
        feedback.style.color = '#14532D';
        feedback.style.border = '1px solid #86EFAC';
        feedback.innerHTML = '<strong>Success!</strong> API key verified with Gemini 3.8 Flash.';
      }
      showToast('Gemini API connection test passed!', 'success');
    } catch (err) {
      if (feedback) {
        feedback.style.background = '#FEE2E2';
        feedback.style.color = '#991B1B';
        feedback.style.border = '1px solid #FCA5A5';
        feedback.innerHTML = `<strong>Connection Failed:</strong> ${err.message}`;
      }
      showToast('Connection failed. Please check the key.', 'error');
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = 'Test Connection';
    }
  });

  updateStatusIndicator();
}

/**
 * FEATURE 2: AI Environmental Assistant (Chatbot)
 */
function initChatAssistant() {
  const chatMessages = document.getElementById('chatMessages');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');
  const clearChatBtn = document.getElementById('clearChatBtn');
  const langEnBtn = document.getElementById('chatLangEn');
  const langHiBtn = document.getElementById('chatLangHi');
  const suggestedChips = document.querySelectorAll('.suggested-chip');

  // Update language buttons
  function setLanguage(lang) {
    AppState.currentLanguage = lang;
    Storage.setLanguage(lang);
    if (lang === 'hi') {
      langHiBtn?.classList.add('active');
      langEnBtn?.classList.remove('active');
      if (chatInput) chatInput.placeholder = 'पर्यावरण, ऊर्जा बचत, या कचरा प्रबंधन के बारे में पूछें...';
    } else {
      langEnBtn?.classList.add('active');
      langHiBtn?.classList.remove('active');
      if (chatInput) chatInput.placeholder = 'Ask EcoAI about climate change, saving energy, waste sorting...';
    }
  }

  langEnBtn?.addEventListener('click', () => setLanguage('en'));
  langHiBtn?.addEventListener('click', () => setLanguage('hi'));
  setLanguage(AppState.currentLanguage);

  // Render initial greeting or restored history
  function renderChat() {
    if (!chatMessages) return;
    chatMessages.innerHTML = '';

    if (AppState.chatHistory.length === 0) {
      const welcomeText = AppState.currentLanguage === 'hi'
        ? `नमस्ते! मैं आपका **EcoAI पर्यावरण स्थिरता सहायक** हूँ। 🌱\n\nआप मुझसे जलवायु परिवर्तन, बिजली और पानी की बचत, सिंगल-यूज़ प्लास्टिक के विकल्प या कॉलेज कैंपस को हरित बनाने के उपाय पूछ सकते हैं। नीचे दिए गए सुझाए गए प्रश्नों में से चुनें या अपना प्रश्न टाइप करें!`
        : `Hello! I am your **EcoAI Environmental Sustainability Assistant**. 🌱\n\nI can help you understand climate change science, reduce campus electricity and water waste, properly segregate recyclables, or calculate carbon footprints. Ask me anything or click a suggested prompt below!`;

      appendMessage('ai', welcomeText, false);
    } else {
      AppState.chatHistory.forEach(item => {
        appendMessage(item.role, item.text, false, item.timestamp);
      });
    }
    scrollChatToBottom();
  }

  function appendMessage(role, text, persist = true, timestamp = null) {
    if (!chatMessages) return;

    const timeStr = timestamp 
      ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${role}`;

    const formattedContent = role === 'ai' ? formatAiResponse(text) : escapeHtml(text);

    messageEl.innerHTML = `
      <div class="chat-bubble">
        ${formattedContent}
        <div class="chat-time">${timeStr}</div>
      </div>
    `;

    chatMessages.appendChild(messageEl);

    if (persist) {
      AppState.chatHistory.push({
        role,
        text,
        timestamp: new Date().toISOString()
      });
      Storage.saveChatHistory(AppState.chatHistory);
    }

    scrollChatToBottom();
  }

  function appendLoadingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'chat-message ai';
    indicator.id = 'chatLoadingIndicator';
    indicator.innerHTML = `
      <div class="chat-bubble" style="display: flex; align-items: center; gap: 0.5rem;">
        <span style="font-size: 0.8rem; color: #16A34A; font-weight: 600;">EcoAI is thinking</span>
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;
    chatMessages?.appendChild(indicator);
    scrollChatToBottom();
  }

  function removeLoadingIndicator() {
    const el = document.getElementById('chatLoadingIndicator');
    if (el) el.remove();
  }

  function scrollChatToBottom() {
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  async function handleSend(userText) {
    const cleanText = userText.trim();
    if (!cleanText || AppState.isAiProcessing) return;

    // Check API Key
    const apiKey = Storage.getApiKey();
    if (!apiKey) {
      appendMessage('user', cleanText, true);
      appendMessage('ai', '⚠️ **Gemini API Key Required**\n\nTo communicate with the AI model, please configure your Google AI Studio API key. Click the **"API Key"** button in the top navigation bar to enter your key.', true);
      const modal = document.getElementById('apiKeyModal');
      if (modal) modal.classList.add('open');
      return;
    }

    appendMessage('user', cleanText, true);
    if (chatInput) chatInput.value = '';

    AppState.isAiProcessing = true;
    if (chatSendBtn) chatSendBtn.disabled = true;
    appendLoadingIndicator();

    try {
      const response = await sendEnvironmentalQuery(
        cleanText, 
        AppState.chatHistory.slice(-8), 
        AppState.currentLanguage
      );
      removeLoadingIndicator();
      appendMessage('ai', response, true);
    } catch (err) {
      removeLoadingIndicator();
      let errorExplanation = `⚠️ **Request Error:** ${err.message}`;
      if (err.message.includes('MISSING_KEY')) {
        errorExplanation = '⚠️ **API Key Missing:** Please click "API Key" in the top bar to configure your Google AI Studio key.';
      } else if (err.message.includes('INVALID_KEY')) {
        errorExplanation = '⚠️ **Invalid API Key:** Your Gemini API Key was rejected by Google. Please verify it in Settings.';
      } else if (err.message.includes('HIGH_DEMAND') || err.message.includes('503')) {
        errorExplanation = '⏳ **Temporary High Traffic (503):** Google\'s AI servers are experiencing a brief spike in global demand. EcoAI automatically attempted multiple fallback models. Please wait 10 seconds and click send again.';
      } else if (err.message.includes('MODEL_NOT_FOUND') || err.message.includes('404')) {
        errorExplanation = '⚠️ **Model Unavailable (404):** The AI model requested was not found or is no longer available. EcoAI has been upgraded to use the latest supported Gemini 3.8 Flash model.';
      } else if (err.message.includes('QUOTA_EXCEEDED')) {
        errorExplanation = '⚠️ **Rate Limit Exceeded:** The Gemini API free tier rate limit was reached. Please wait a minute and retry.';
      }
      appendMessage('ai', errorExplanation, true);
    } finally {
      AppState.isAiProcessing = false;
      if (chatSendBtn) chatSendBtn.disabled = false;
      if (chatInput) chatInput.focus();
    }
  }

  chatForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (chatInput) handleSend(chatInput.value);
  });

  // Suggested Prompts
  suggestedChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      if (prompt) handleSend(prompt);
    });
  });

  // Clear Chat
  clearChatBtn?.addEventListener('click', () => {
    if (confirm('Clear the current chat history?')) {
      AppState.chatHistory = [];
      Storage.clearChatHistory();
      renderChat();
      showToast('Chat history cleared', 'info');
    }
  });

  renderChat();
}

/**
 * FEATURE 3: AI Sustainability Planner
 */
function initSustainabilityPlanner() {
  const form = document.getElementById('sustainabilityPlannerForm');
  const generateBtn = document.getElementById('generatePlanBtn');
  const emptyState = document.getElementById('planEmptyState');
  const contentBox = document.getElementById('planContentBox');
  const outputText = document.getElementById('planOutputText');
  const printBtn = document.getElementById('printPlanBtn');

  // Restore saved plan if exists
  const savedData = Storage.getSavedPlan();
  if (savedData && savedData.plan) {
    if (emptyState) emptyState.style.display = 'none';
    if (contentBox) contentBox.style.display = 'block';
    if (outputText) outputText.innerHTML = formatAiResponse(savedData.plan);
  }

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const apiKey = Storage.getApiKey();
    if (!apiKey) {
      showToast('Please configure your Gemini API Key first.', 'error');
      const modal = document.getElementById('apiKeyModal');
      if (modal) modal.classList.add('open');
      return;
    }

    const habits = {
      commuteMode: document.getElementById('planCommute')?.value || '',
      commuteDistance: document.getElementById('planDistance')?.value || '10',
      electricityHabits: document.getElementById('planElectricity')?.value || '',
      waterHabits: document.getElementById('planWater')?.value || '',
      plasticUsage: document.getElementById('planPlastic')?.value || '',
      dietType: document.getElementById('planDiet')?.value || 'Vegetarian',
      livingContext: document.getElementById('planContext')?.value || 'College Student'
    };

    generateBtn.disabled = true;
    generateBtn.innerHTML = `
      <div class="typing-indicator" style="display: inline-flex;">
        <div class="typing-dot" style="background: #FFFFFF;"></div>
        <div class="typing-dot" style="background: #FFFFFF;"></div>
        <div class="typing-dot" style="background: #FFFFFF;"></div>
      </div>
      <span>Synthesizing Plan...</span>
    `;

    if (emptyState) emptyState.style.display = 'none';
    if (contentBox) contentBox.style.display = 'block';
    if (outputText) {
      outputText.innerHTML = `
        <div style="padding: 3rem 1rem; text-align: center; color: var(--primary-green);">
          <i data-lucide="sparkles" style="width: 36px; height: 36px; margin: 0 auto 1rem auto; animation: spin 2s linear infinite;"></i>
          <h4 style="font-weight: 700; color: var(--dark-green);">Analyzing Lifestyle Patterns</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">
            EcoAI is formulating high-impact priority improvements, weekly routines, and student tips...
          </p>
        </div>
      `;
      initIcons();
    }

    try {
      const planMarkdown = await generateSustainabilityPlan(habits, AppState.currentLanguage);
      if (outputText) {
        outputText.innerHTML = formatAiResponse(planMarkdown);
      }
      Storage.savePlan(planMarkdown);
      showToast('Personalized Sustainability Plan generated!', 'success');
    } catch (err) {
      if (outputText) {
        outputText.innerHTML = `
          <div style="padding: 1.5rem; background: #FEE2E2; border-radius: var(--radius-md); color: #991B1B;">
            <strong>Unable to generate plan:</strong> ${err.message}
          </div>
        `;
      }
      showToast('Plan generation failed.', 'error');
    } finally {
      generateBtn.disabled = false;
      generateBtn.innerHTML = `
        <i data-lucide="sparkles" style="width: 18px; height: 18px;"></i>
        <span>Generate My Sustainability Plan</span>
      `;
      initIcons();
    }
  });

  printBtn?.addEventListener('click', () => {
    window.print();
  });
}

/**
 * FEATURE 4: Carbon Footprint Calculator
 */
function initCarbonCalculator() {
  const form = document.getElementById('carbonCalcForm');
  const canvas = document.getElementById('carbonDonutChart');

  const yearlyTonnesVal = document.getElementById('yearlyTonnesVal');
  const monthlyKgVal = document.getElementById('monthlyKgVal');
  const dailyKgVal = document.getElementById('dailyKgVal');
  const benchmarkYourVal = document.getElementById('benchmarkYourVal');
  const benchmarkYourFill = document.getElementById('benchmarkYourFill');
  const recommendationsList = document.getElementById('calculatorRecommendationsList');

  function runCalculation() {
    const inputs = {
      dailyKm: document.getElementById('calcDistance')?.value || 15,
      transportMode: document.getElementById('calcTransportMode')?.value || 'public_bus',
      monthlyKwh: document.getElementById('calcElectricity')?.value || 140,
      householdMembers: document.getElementById('calcMembers')?.value || 2,
      lpgCylindersPerMonth: document.getElementById('calcLpg')?.value || 0.5,
      dietType: document.getElementById('calcDiet')?.value || 'vegetarian'
    };

    const results = calculateFootprint(inputs);

    // Update Numerical Metric Labels
    if (yearlyTonnesVal) yearlyTonnesVal.textContent = results.yearlyTonnes.toFixed(2);
    if (monthlyKgVal) monthlyKgVal.textContent = results.monthlyKg.toFixed(1);
    if (dailyKgVal) dailyKgVal.textContent = results.dailyKg.toFixed(1);

    // Update Benchmark Bar (4.70 tonnes global average = 100% scale)
    if (benchmarkYourVal) benchmarkYourVal.textContent = `${results.yearlyTonnes.toFixed(2)} tonnes`;
    if (benchmarkYourFill) {
      const pct = Math.min(100, Math.round((results.yearlyTonnes / 4.7) * 100));
      benchmarkYourFill.style.width = `${pct}%`;
      // Color coded based on comparison to 2.0 tonnes Paris goal
      if (results.yearlyTonnes <= 2.0) {
        benchmarkYourFill.style.backgroundColor = '#16A34A';
      } else if (results.yearlyTonnes <= 3.5) {
        benchmarkYourFill.style.backgroundColor = '#F59E0B';
      } else {
        benchmarkYourFill.style.backgroundColor = '#DC2626';
      }
    }

    // Render Chart.js
    if (canvas) {
      renderCarbonChart(canvas, results.categories);
    }

    // Render Practical Recommendations
    if (recommendationsList) {
      recommendationsList.innerHTML = results.recommendations.map(tip => `
        <div style="background: #FFFFFF; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.85rem 1rem; display: flex; align-items: flex-start; gap: 0.75rem;">
          <div style="width: 32px; height: 32px; border-radius: 8px; background: var(--light-green); color: var(--primary-green); display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">
            <i data-lucide="${tip.icon || 'leaf'}" style="width: 16px; height: 16px;"></i>
          </div>
          <div>
            <div style="font-weight: 700; font-size: 0.875rem; color: var(--dark-green);">${tip.title}</div>
            <div style="font-size: 0.775rem; color: var(--primary-green); font-weight: 600; margin-bottom: 0.2rem;">${tip.impact}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.45;">${tip.description}</div>
          </div>
        </div>
      `).join('');
      initIcons();
    }
  }

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    runCalculation();
    showToast('Carbon Footprint calculated!', 'success');
  });

  // Run initial calculation with defaults
  runCalculation();
}

/**
 * FEATURE 5: Waste Management Assistant
 */
function initWasteManager() {
  const chipsContainer = document.getElementById('wasteChipsContainer');
  const searchForm = document.getElementById('wasteSearchForm');
  const itemInput = document.getElementById('wasteItemInput');
  const analyzeBtn = document.getElementById('analyzeWasteBtn');
  const placeholder = document.getElementById('wasteResultPlaceholder');
  const contentBox = document.getElementById('wasteResultContent');

  // Handle Category Chips
  chipsContainer?.querySelectorAll('.waste-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chipsContainer.querySelectorAll('.waste-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      AppState.selectedWasteCategory = chip.getAttribute('data-category') || 'Plastic';
      if (itemInput) itemInput.value = '';
      runWasteAnalysis(AppState.selectedWasteCategory, '');
    });
  });

  // Handle Specific Item Search
  searchForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const item = itemInput?.value.trim() || '';
    runWasteAnalysis(AppState.selectedWasteCategory, item);
  });

  async function runWasteAnalysis(category, item) {
    const apiKey = Storage.getApiKey();
    if (!apiKey) {
      showToast('Please configure your Gemini API Key first.', 'error');
      const modal = document.getElementById('apiKeyModal');
      if (modal) modal.classList.add('open');
      return;
    }

    if (analyzeBtn) analyzeBtn.disabled = true;
    if (placeholder) placeholder.style.display = 'none';
    if (contentBox) {
      contentBox.style.display = 'block';
      contentBox.innerHTML = `
        <div style="padding: 2.5rem 1rem; text-align: center; color: var(--primary-green);">
          <i data-lucide="recycle" style="width: 36px; height: 36px; margin: 0 auto 1rem auto; animation: spin 2s linear infinite;"></i>
          <h4 style="font-weight: 700; color: var(--dark-green);">Analyzing Material & Disposal Protocols</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">
            Consulting waste segregation standards and recycling preparation guidelines...
          </p>
        </div>
      `;
      initIcons();
    }

    try {
      const resultText = await analyzeWasteDisposal(category, item, AppState.currentLanguage);
      if (contentBox) {
        contentBox.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-color);">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span class="brand-badge" style="margin-left: 0;">Verified Guide</span>
              <span style="font-size: 0.95rem; font-weight: 700; color: var(--dark-green);">${category} ${item ? '— ' + item : ''}</span>
            </div>
          </div>
          <div class="prose" style="font-size: 0.925rem; line-height: 1.6;">
            ${formatAiResponse(resultText)}
          </div>
        `;
      }
      showToast('Waste segregation analysis loaded.', 'success');
    } catch (err) {
      if (contentBox) {
        contentBox.innerHTML = `
          <div style="padding: 1.5rem; background: #FEE2E2; border-radius: var(--radius-md); color: #991B1B;">
            <strong>Analysis Failed:</strong> ${err.message}
          </div>
        `;
      }
      showToast('Analysis error.', 'error');
    } finally {
      if (analyzeBtn) analyzeBtn.disabled = false;
    }
  }
}

/**
 * FEATURE 6: Green Challenges
 */
function initChallenges() {
  const manager = AppState.challengesManager;
  const grid = document.getElementById('challengesGrid');
  const levelBadge = document.getElementById('challengeLevelBadge');
  const levelTitle = document.getElementById('challengeLevelTitle');
  const completedText = document.getElementById('completedCountText');
  const totalText = document.getElementById('totalCountText');
  const percentageText = document.getElementById('challengePercentageText');
  const resetBtn = document.getElementById('resetChallengesBtn');

  // Spotlight Elements
  const spotlightTitle = document.getElementById('dailySpotlightTitle');
  const spotlightDesc = document.getElementById('dailySpotlightDesc');
  const spotlightBtn = document.getElementById('dailySpotlightBtn');

  function renderChallenges() {
    const progress = manager.getProgress();
    if (levelBadge) levelBadge.textContent = progress.levelBadge;
    if (levelTitle) levelTitle.textContent = progress.levelTitle;
    if (completedText) completedText.textContent = progress.completed;
    if (totalText) totalText.textContent = progress.total;
    if (percentageText) percentageText.textContent = `${progress.percentage}%`;

    // Render Daily Spotlight
    const daily = manager.getDailyChallenge();
    if (spotlightTitle) spotlightTitle.textContent = daily.title;
    if (spotlightDesc) spotlightDesc.textContent = daily.description;
    if (spotlightBtn) {
      if (daily.completed) {
        spotlightBtn.className = 'btn btn-primary btn-sm';
        spotlightBtn.innerHTML = '<i data-lucide="check-circle" style="width: 14px; height: 14px;"></i> Completed Today';
      } else {
        spotlightBtn.className = 'btn btn-outline-green btn-sm';
        spotlightBtn.innerHTML = '<i data-lucide="check" style="width: 14px; height: 14px;"></i> Mark Completed';
      }
    }

    // Render Cards Grid
    if (grid) {
      grid.innerHTML = manager.challenges.map(c => `
        <div class="challenge-card ${c.completed ? 'completed' : ''}" data-id="${c.id}">
          <div class="challenge-top">
            <span class="challenge-badge">${c.category} • ${c.difficulty}</span>
            <div style="display: flex; align-items: center; gap: 0.35rem;">
              <input 
                type="checkbox" 
                id="chk_${c.id}" 
                class="challenge-checkbox" 
                ${c.completed ? 'checked' : ''} 
                style="width: 18px; height: 18px; accent-color: var(--primary-green); cursor: pointer;"
              />
            </div>
          </div>
          <h4 class="challenge-title">${c.title}</h4>
          <p class="challenge-desc">${c.description}</p>
          <div class="challenge-footer">
            <span class="challenge-sdg">${c.sdgTarget}</span>
            <span style="font-size: 0.75rem; color: #64748B;">Impact: <strong>${c.impactLevel}</strong></span>
          </div>
        </div>
      `).join('');

      // Attach checkbox listeners
      grid.querySelectorAll('.challenge-checkbox').forEach(chk => {
        chk.addEventListener('change', (e) => {
          const card = e.target.closest('.challenge-card');
          const id = card?.getAttribute('data-id');
          if (id) {
            manager.toggleChallenge(id);
            renderChallenges();
            showToast('Habit progress updated!', 'success');
          }
        });
      });
    }

    initIcons();
  }

  spotlightBtn?.addEventListener('click', () => {
    const daily = manager.getDailyChallenge();
    manager.toggleChallenge(daily.id);
    renderChallenges();
    showToast('Daily Spotlight updated!', 'success');
  });

  resetBtn?.addEventListener('click', () => {
    if (confirm('Reset all challenge progress to zero?')) {
      manager.resetAll();
      renderChallenges();
      showToast('Challenge checklist reset.', 'info');
    }
  });

  renderChallenges();
}

/**
 * Smooth scrolling helper
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });
}

/**
 * HTML escaper utility
 */
function escapeHtml(string) {
  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return String(string).replace(/[&<>"']/g, s => entityMap[s]);
}
