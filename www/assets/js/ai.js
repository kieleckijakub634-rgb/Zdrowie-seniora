(function () {
  [
    'kz_ai_api_key',
    'kz_ai_provider',
    'kz_ai_model',
    'kz_ai_endpoint',
    'kz_gemini_api_key'
  ].forEach(key => localStorage.removeItem(key));

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
      const role = message.role === 'assistant' || message.role === 'model' ? 'model' : 'user';
      if (Array.isArray(message.parts)) {
        return {
          role,
          parts: message.parts
            .map(part => ({ text: part && typeof part.text === 'string' ? part.text : '' }))
            .filter(part => part.text)
        };
      }
      const text = typeof message.text === 'string'
        ? message.text
        : normalizeTextContent(message.content);
      return { role, parts: text ? [{ text }] : [] };
    }).filter(message => message.parts.length > 0);
  }

  async function requestText(options) {
    if (!window.initSupabase || !window.initSupabase()) {
      throw new Error('Nie udało się połączyć z usługą konta.');
    }

    const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();
    if (sessionError || !session) {
      throw new Error('Zaloguj się ponownie, aby skorzystać z asystenta AI.');
    }

    const { data, error } = await window.supabaseClient.functions.invoke('ai-proxy', {
      body: {
        route: options && options.route === 'diet' ? 'diet' : 'chat',
        messages: normalizeConversation(options && options.messages),
        systemInstructionText: options && options.systemInstructionText
          ? String(options.systemInstructionText)
          : ''
      }
    });

    if (error) {
      let details = error.message || 'Nie udało się połączyć z asystentem AI.';
      if (error.context && typeof error.context.json === 'function') {
        try {
          const body = await error.context.json();
          if (body && body.error) details = body.error;
        } catch (_) {}
      }
      throw new Error(details);
    }

    const text = normalizeTextContent(data && data.text);
    if (!text) throw new Error('Asystent AI zwrócił pustą odpowiedź.');
    return text;
  }

  async function requestDietPlan(options) {
    if (!window.initSupabase || !window.initSupabase()) {
      throw new Error('Nie udało się połączyć z usługą konta.');
    }

    const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();
    if (sessionError || !session) {
      throw new Error('Zaloguj się ponownie, aby wygenerować jadłospis.');
    }

    const { data, error } = await window.supabaseClient.functions.invoke('ai-proxy', {
      body: {
        route: 'diet',
        dietRequest: {
          dayNames: Array.isArray(options && options.dayNames) ? options.dayNames : [],
          preferences: options && options.preferences ? String(options.preferences) : ''
        }
      }
    });

    if (error) {
      let details = error.message || 'Nie udało się przygotować jadłospisu.';
      if (error.context && typeof error.context.json === 'function') {
        try {
          const body = await error.context.json();
          if (body && body.error) details = body.error;
        } catch (_) {}
      }
      throw new Error(details);
    }
    if (!data || !data.plan) throw new Error('Asystent AI nie zwrócił kompletnego jadłospisu.');
    return data.plan;
  }

  window.VitalFlyAI = {
    getConfig: function () {
      return { provider: 'supabase-edge-function', isConfigured: true };
    },
    requestText,
    requestDietPlan
  };
})();
