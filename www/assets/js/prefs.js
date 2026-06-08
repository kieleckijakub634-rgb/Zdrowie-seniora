window.kzSelectedDietPrefs = new Set();

window.toggleDietPref = function(val, btn) {
  if (window.kzSelectedDietPrefs.has(val)) {
    window.kzSelectedDietPrefs.delete(val);
    btn.classList.remove('selected');
    btn.style.borderColor = 'rgba(255,255,255,0.1)';
    btn.style.background = 'rgba(255,255,255,0.05)';
  } else {
    window.kzSelectedDietPrefs.add(val);
    btn.classList.add('selected');
    btn.style.borderColor = 'var(--mint)';
    btn.style.background = 'rgba(168, 237, 224, 0.1)';
  }
};

window.saveDietPrefs = function() {
  const arr = Array.from(window.kzSelectedDietPrefs);
  localStorage.setItem('kz_diet_preferences', JSON.stringify(arr));
  
  const toast = document.getElementById('medToast');
  const text = document.getElementById('medToastText');
  if (toast && text) {
    text.textContent = 'Preferencje dietetyczne zapisane.';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
  
  if (typeof renderPersonalizedDiet === 'function') {
    window.activeDietDayIndex = undefined;
    renderPersonalizedDiet(true);
  }
};

window.saveHealthProfile = function() {
  const issues = document.getElementById('health-issues-input')?.value || '';
  const consent = document.getElementById('ai-health-consent')?.checked ? '1' : '0';
  localStorage.setItem('kz_health_issues', issues);
  localStorage.setItem('kz_ai_health_consent', consent);
  
  const toast = document.getElementById('medToast');
  const text = document.getElementById('medToastText');
  if (toast && text) {
    text.textContent = 'Profil zdrowotny zaktualizowany.';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
};

window.syncQuizToProfile = function() {
  // Przenieś dane z ankiety do głównych ustawień, jeśli są puste
  let savedDiet = localStorage.getItem('kz_diet_preferences');
  const quizDiet = localStorage.getItem('kz_quiz_diet');
  if ((!savedDiet || savedDiet === '[]') && quizDiet) {
    localStorage.setItem('kz_diet_preferences', quizDiet);
    savedDiet = quizDiet;
  }

  if (savedDiet) {
    try {
      const arr = JSON.parse(savedDiet);
      window.kzSelectedDietPrefs = new Set(arr);
      
      // Reset all buttons first
      document.querySelectorAll('.diet-pref-chip').forEach(btn => {
        btn.classList.remove('selected');
        btn.style.borderColor = 'rgba(255,255,255,0.1)';
        btn.style.background = 'rgba(255,255,255,0.05)';
      });

      arr.forEach(val => {
        const btns = document.querySelectorAll(`.diet-pref-chip[onclick*="${val}"]`);
        btns.forEach(btn => {
          btn.classList.add('selected');
          btn.style.borderColor = 'var(--mint)';
          btn.style.background = 'rgba(168, 237, 224, 0.1)';
        });
      });
    } catch(e) {
      console.error('Error parsing diet prefs:', e);
    }
  }

  let health = localStorage.getItem('kz_health_issues');
  const quizHealth = localStorage.getItem('kz_quiz_health');
  if (!health && quizHealth) {
    localStorage.setItem('kz_health_issues', quizHealth);
    health = quizHealth;
  }
  
  if (health) {
    const inp = document.getElementById('health-issues-input');
    if (inp) inp.value = health;
  }

  const consent = localStorage.getItem('kz_ai_health_consent');
  if (consent === '1') {
    const cb = document.getElementById('ai-health-consent');
    if (cb) cb.checked = true;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    window.syncQuizToProfile();
  }, 1000);
});
