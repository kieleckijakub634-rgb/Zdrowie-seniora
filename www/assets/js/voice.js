(function () {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const synth = window.speechSynthesis;

  let recognition = null;
  let isListening = false;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'pl-PL';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = function () {
      isListening = true;
      const btn = document.getElementById('chatVoiceBtn');
      if (btn) btn.style.color = '#E05252'; // red when listening
    };

    recognition.onresult = function (event) {
      const transcript = event.results[0][0].transcript;
      const input = document.getElementById('chatInput');
      if (input) {
        input.value = transcript;
        if (window.sendChatMessage) {
          window.sendChatMessage();
        }
      }
    };

    recognition.onerror = function (event) {
      console.error('Speech recognition error', event.error);
      stopListening();
    };

    recognition.onend = function () {
      stopListening();
    };
  }

  function stopListening() {
    isListening = false;
    const btn = document.getElementById('chatVoiceBtn');
    if (btn) btn.style.color = '';
    if (recognition) recognition.stop();
  }

  function toggleListening() {
    if (!SpeechRecognition) {
      alert('Twoja przeglądarka nie obsługuje rozpoznawania mowy. Spróbuj użyć Chrome lub systemowego dyktowania.');
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      // stop synth if talking
      if (synth.speaking) synth.cancel();
      recognition.start();
    }
  }

  function speak(text) {
    if (!synth) return;
    synth.cancel(); // stop previous

    // strip emoji and markdown for speaking
    const cleanText = text.replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, '')
                          .replace(/[*_#]/g, '')
                          .replace(/\[PRZEJDŹ DO: .*?\]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pl-PL';
    utterance.rate = 1.0;
    
    synth.speak(utterance);
  }

  function stopSpeaking() {
    if (synth) synth.cancel();
  }

  // Override AIMessage renderer to speak the response
  const originalRenderAIMessage = window.VFSecurity?.renderAIMessage;
  if (originalRenderAIMessage) {
    window.VFSecurity.renderAIMessage = function(el, text) {
      originalRenderAIMessage(el, text);
      speak(text);
    };
  } else {
    // wait for VFSecurity to be ready
    document.addEventListener('DOMContentLoaded', () => {
       if (window.VFSecurity && window.VFSecurity.renderAIMessage) {
         const orig = window.VFSecurity.renderAIMessage;
         window.VFSecurity.renderAIMessage = function(el, text) {
           orig(el, text);
           speak(text);
         };
       }
    });
  }

  window.VFVoice = {
    toggleListening,
    stopListening,
    speak,
    stopSpeaking
  };
})();
