/**
 * Vercel Serverless Function: /api/gemini
 * Securely proxies AI requests to Google Gemini using the GEMINI_API_KEY
 * configured in Vercel Project Settings > Environment Variables.
 */

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-gemini-key'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  // Read environment variable from Vercel (supports both GEMINI_API_KEY and VITE_GEMINI_API_KEY)
  const apiKey = (
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    req.headers['x-gemini-key'] ||
    req.body?.apiKey ||
    ''
  ).trim();

  if (!apiKey) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'MISSING_KEY: GEMINI_API_KEY is not configured in Vercel Environment Variables.'
      }
    });
  }

  const { contents, systemInstruction, temperature = 0.7, model = 'gemini-3.8-flash' } = req.body || {};

  if (!contents) {
    return res.status(400).json({ error: { message: 'Missing "contents" parameter in request body.' } });
  }

  // Model fallback chain for maximum reliability on high traffic
  const modelsToTry = [
    model,
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-2.5-flash-lite'
  ].filter((v, i, a) => a.indexOf(v) === i);

  let lastErrorData = null;

  for (const currentModel of modelsToTry) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;

      const requestPayload = {
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens: 2048,
          topP: 0.95
        }
      };

      if (systemInstruction) {
        requestPayload.systemInstruction = typeof systemInstruction === 'string'
          ? { parts: [{ text: systemInstruction }] }
          : systemInstruction;
      }

      const googleResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      const data = await googleResponse.json().catch(() => ({}));

      if (googleResponse.ok) {
        return res.status(200).json(data);
      }

      // If temporary high traffic or model not found, try fallback model
      if (googleResponse.status === 503 || googleResponse.status === 404 || googleResponse.status === 429) {
        lastErrorData = data;
        continue;
      }

      // Return client-actionable errors (like 400 invalid key)
      return res.status(googleResponse.status).json(data);
    } catch (fetchErr) {
      lastErrorData = { error: { message: fetchErr.message } };
    }
  }

  return res.status(503).json(lastErrorData || {
    error: { message: 'Google Gemini servers are currently busy across all model instances.' }
  });
}
