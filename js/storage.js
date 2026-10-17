/**
 * EcoAI - LocalStorage Management Module
 * Handles local persistence for user preferences, chat logs, challenges, and audit estimates.
 * Complies with strict client-only architecture (no remote DBs).
 */

const STORAGE_KEYS = {
  API_KEY: 'ecoai_gemini_api_key',
  CHAT_HISTORY: 'ecoai_chat_history',
  CHALLENGES: 'ecoai_challenges_data',
  CARBON_HISTORY: 'ecoai_carbon_history',
  SAVED_PLAN: 'ecoai_saved_plan',
  LANGUAGE: 'ecoai_language_pref'
};

export const Storage = {
  // API Key operations
  getApiKey() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEYS.API_KEY);
        if (stored && stored.trim().length > 0) return stored.trim();
      }
      
      // Fallback to environment define if supplied
      if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
        return process.env.GEMINI_API_KEY.trim();
      }
      return '';
    } catch (e) {
      if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
        return process.env.GEMINI_API_KEY.trim();
      }
      return '';
    }
  },

  setApiKey(key) {
    try {
      if (key && key.trim()) {
        localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());
      } else {
        localStorage.removeItem(STORAGE_KEYS.API_KEY);
      }
      return true;
    } catch (e) {
      console.error('Failed to save API key to LocalStorage:', e);
      return false;
    }
  },

  clearApiKey() {
    try {
      localStorage.removeItem(STORAGE_KEYS.API_KEY);
      return true;
    } catch (e) {
      return false;
    }
  },

  // Chat History
  getChatHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Failed to parse chat history:', e);
      return [];
    }
  },

  saveChatHistory(history) {
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(history.slice(-50))); // Keep last 50 msgs
      return true;
    } catch (e) {
      console.error('Failed to save chat history:', e);
      return false;
    }
  },

  clearChatHistory() {
    try {
      localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
      return true;
    } catch (e) {
      return false;
    }
  },

  // Green Challenges
  getChallenges() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHALLENGES);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  saveChallenges(challengesData) {
    try {
      localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challengesData));
      return true;
    } catch (e) {
      console.error('Failed to save challenges:', e);
      return false;
    }
  },

  resetChallenges() {
    try {
      localStorage.removeItem(STORAGE_KEYS.CHALLENGES);
      return true;
    } catch (e) {
      return false;
    }
  },

  // Carbon Footprint Estimates
  getCarbonHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CARBON_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveCarbonCalculation(record) {
    try {
      const history = this.getCarbonHistory();
      history.unshift({
        ...record,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem(STORAGE_KEYS.CARBON_HISTORY, JSON.stringify(history.slice(0, 10)));
      return true;
    } catch (e) {
      return false;
    }
  },

  // Sustainability Plan
  getSavedPlan() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SAVED_PLAN);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  savePlan(plan) {
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_PLAN, JSON.stringify({
        plan,
        savedAt: new Date().toISOString()
      }));
      return true;
    } catch (e) {
      return false;
    }
  },

  clearSavedPlan() {
    try {
      localStorage.removeItem(STORAGE_KEYS.SAVED_PLAN);
      return true;
    } catch (e) {
      return false;
    }
  },

  // Language Preference
  getLanguage() {
    return localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'en';
  },

  setLanguage(lang) {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang === 'hi' ? 'hi' : 'en');
  }
};
