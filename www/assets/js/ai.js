(function () {
  const DEFAULT_MODEL = 'google/gemma-4-31b-it';
  const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
  const STORAGE_KEYS = {
    provider: 'kz_ai_provider',
    apiKey: 'kz_ai_api_key',
    model: 'kz_ai_model',
    endpoint: 'kz_ai_endpoint',
    disableBootstrap: 'kz_ai_disable_bootstrap'
  };

  function normalizeTextContent(content) {
    if (typeof content === 'string') return content.trim();
    if (Array.isArray(content)) {
      return content.map(part => {
        if (typeof part === 'string') return part;
        if (part && typeof part.text === 'string') return part.text;
        return '';
      }).join('\n').trim();
    }
    return '';
  }

  function normalizeConversation(messages) {
    return (messages || []).map(message => {
      const normalizedRole = message.role === 'assistant'
        ? 'model'
        : (message.role === 'model' ? 'model' : 'user');

      if (Array.isArray(message.parts)) {
        return {
          role: normalizedRole,
          parts: message.parts
            .map(part => ({ text: part && typeof part.text === 'string' ? part.text : '' }))
            .filter(part => part.text)
        };
      }

      const text = typeof message.text === 'string'
        ? message.text
        : normalizeTextContent(message.content);

      return {
        role: normalizedRole,
        parts: text ? [{ text }] : []
      };
    }).filter(message => message.parts.length > 0);
  }

  function getStoredValue(key) {
    return (localStorage.getItem(key) || '').trim();
  }

  function seedLocalConfig() {
    const localConfig = window.__VF_LOCAL_AI_CONFIG;
    if (!localConfig || typeof localConfig !== 'object') return;
    if (getStoredValue(STORAGE_KEYS.disableBootstrap) === '1') return;
    if (getStoredValue(STORAGE_KEYS.apiKey)) return;

    if (localConfig.apiKey) localStorage.setItem(STORAGE_KEYS.apiKey, String(localConfig.apiKey).trim());
    localStorage.setItem(STORAGE_KEYS.provider, 'openrouter');
    localStorage.setItem(STORAGE_KEYS.model, String(localConfig.model || DEFAULT_MODEL).trim());
    localStorage.setItem(STORAGE_KEYS.endpoint, String(localConfig.endpoint || OPENROUTER_ENDPOINT).trim());
  }

  function getConfig() {
    seedLocalConfig();

    const apiKey = getStoredValue(STORAGE_KEYS.apiKey);
    const model = getStoredValue(STORAGE_KEYS.model) || DEFAULT_MODEL;
    const endpoint = getStoredValue(STORAGE_KEYS.endpoint) || OPENROUTER_ENDPOINT;

    return {
      provider: 'openrouter',
      apiKey,
      model,
      endpoint,
      isConfigured: Boolean(apiKey)
    };
  }

  function saveConfig(config) {
    localStorage.removeItem(STORAGE_KEYS.disableBootstrap);
    localStorage.setItem(STORAGE_KEYS.provider, config && config.provider ? String(config.provider) : 'openrouter');
    localStorage.setItem(STORAGE_KEYS.model, config && config.model ? String(config.model).trim() : DEFAULT_MODEL);
    localStorage.setItem(STORAGE_KEYS.apiKey, config && config.apiKey ? String(config.apiKey).trim() : '');
    localStorage.setItem(STORAGE_KEYS.endpoint, config && config.endpoint ? String(config.endpoint).trim() : OPENROUTER_ENDPOINT);
    return getConfig();
  }

  function clearStoredConfig() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    localStorage.setItem(STORAGE_KEYS.disableBootstrap, '1');
  }

  function toOpenRouterMessages(messages, systemInstructionText) {
    const out = [];

    if (systemInstructionText) {
      out.push({ role: 'system', content: systemInstructionText });
    }

    normalizeConversation(messages).forEach(message => {
      const text = message.parts.map(part => part.text).join('\n').trim();
      if (!text) return;
      out.push({
        role: message.role === 'model' ? 'assistant' : 'user',
        content: text
      });
    });

    return out;
  }

  async function extractErrorText(response) {
    try {
      const data = await response.json();
      return data?.error?.message || data?.error || data?.message || JSON.stringify(data);
    } catch (_) {
      try {
        return await response.text();
      } catch (_) {
        return '';
      }
    }
  }

  async function requestDirectOpenRouter(config, options) {
    const route = options && options.route === 'diet' ? 'diet' : 'chat';
    const maxTokens = route === 'diet' ? 1800 : 700;
    const temperature = route === 'diet' ? 0.4 : 0.7;
    const response = await fetch(config.endpoint || OPENROUTER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location && window.location.href ? window.location.href : 'https://github.com/kieleckijakub634-rgb/Zdrowie-seniora',
        'X-Title': 'VitalFly'
      },
      body: JSON.stringify({
        model: config.model || DEFAULT_MODEL,
        messages: toOpenRouterMessages(options && options.messages, options && options.systemInstructionText ? String(options.systemInstructionText) : ''),
        max_tokens: maxTokens,
        temperature
      })
    });

    if (!response.ok) {
      const details = await extractErrorText(response);
      throw new Error(`OpenRouter error (${response.status})${details ? `: ${details}` : ''}`);
    }

    const data = await response.json();
    const text = normalizeTextContent(data?.choices?.[0]?.message?.content);
    if (!text) throw new Error('OpenRouter returned an empty response.');
    return text;
  }

  async function requestText(options) {
    const config = getConfig();
    if (!config.apiKey) {
      throw new Error('OpenRouter key is missing.');
    }

    return requestDirectOpenRouter(config, options);
  }

  window.VitalFlyAI = {
    clearStoredConfig,
    getConfig,
    saveConfig,
    seedLocalConfig,
    requestText
  };
})();
