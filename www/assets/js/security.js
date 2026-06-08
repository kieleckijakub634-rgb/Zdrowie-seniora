(function () {
  function text(value, maxLength = 10000) {
    return String(value == null ? '' : value).trim().slice(0, maxLength);
  }

  function escapeHTML(value) {
    return text(value).replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]);
  }

  function safeMediaUrl(value) {
    try {
      const url = new URL(text(value, 2048), window.location.origin);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
      if (url.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(url.hostname)) return '';
      return url.href;
    } catch (_) {
      return '';
    }
  }

  function appendFormattedText(container, rawText) {
    const source = text(rawText, 20000);
    const actionPattern = /\[PRZEJDŹ DO:\s*(videos|diets|meds|dogtag)\]/gi;
    let cursor = 0;
    let match;

    while ((match = actionPattern.exec(source))) {
      appendPlainText(container, source.slice(cursor, match.index));
      const tabName = match[1].toLowerCase();
      const labels = {
        videos: 'Przejdź do Ćwiczeń',
        diets: 'Przejdź do Diety',
        meds: 'Przejdź do Leków',
        dogtag: 'Przejdź do Ratunku'
      };
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chat-quick-reply';
      button.style.cssText = 'width:100%;margin-top:0.75rem;justify-content:center;text-align:center;';
      button.textContent = labels[tabName];
      button.addEventListener('click', function () {
        if (typeof toggleChat === 'function') toggleChat();
        if (typeof switchTab === 'function') switchTab(tabName);
      });
      container.appendChild(button);
      cursor = actionPattern.lastIndex;
    }
    appendPlainText(container, source.slice(cursor));
  }

  function appendPlainText(container, value) {
    const lines = value.split('\n');
    lines.forEach((line, index) => {
      if (index > 0) container.appendChild(document.createElement('br'));
      container.appendChild(document.createTextNode(line));
    });
  }

  window.VFSecurity = {
    escapeHTML,
    renderAIMessage: appendFormattedText,
    safeMediaUrl,
    text
  };
})();
