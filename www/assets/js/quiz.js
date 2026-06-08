const QUIZ_QUESTIONS = [
  {
    id: 'goal',
    title: 'Jaki jest Twój główny cel na najbliższe tygodnie?',
    multi: false,
    options: [
      { text: 'Zadbać o stawy i kręgosłup', icon: '🦴', value: 'stawy' },
      { text: 'Mieć więcej energii w ciągu dnia', icon: '⚡', value: 'energia' },
      { text: 'Zgubić kilka zbędnych kilogramów', icon: '⚖️', value: 'waga' },
      { text: 'Poprawić ogólną sprawność i elastyczność', icon: '🧘‍♀️', value: 'sprawnosc' }
    ]
  },
  {
    id: 'age',
    title: 'W jakim jesteś wieku?',
    multi: false,
    options: [
      { text: '50 - 60 lat', icon: '🎂', value: '50-60' },
      { text: '61 - 70 lat', icon: '🎂', value: '61-70' },
      { text: '71 - 80 lat', icon: '🎂', value: '71-80' },
      { text: '80+ lat', icon: '🎂', value: '80+' }
    ]
  },
  {
    id: 'health',
    title: 'Z czym na co dzień masz największy problem?',
    multi: true,
    options: [
      { text: 'Bóle kolan / bioder', icon: '🦵', value: 'ból kolan/bioder' },
      { text: 'Sztywność karku i pleców', icon: '🔙', value: 'sztywność pleców' },
      { text: 'Brak motywacji do ruchu', icon: '🛋️', value: 'brak motywacji' },
      { text: 'Pamiętanie o regularnym braniu leków', icon: '💊', value: 'zapominanie o lekach' }
    ]
  },
  {
    id: 'activity',
    title: 'Jaki jest Twój aktualny poziom aktywności?',
    multi: false,
    options: [
      { text: 'Niska (większość czasu na siedząco)', icon: '🛋️', value: 'niska' },
      { text: 'Umiarkowana (spokojne spacery)', icon: '🚶', value: 'umiarkowana' },
      { text: 'Wysoka (regularnie ćwiczę / pracuję fizycznie)', icon: '🏃‍♀️', value: 'wysoka' }
    ]
  },
  {
    id: 'diet',
    title: 'Zaznacz swoje preferencje dietetyczne:',
    multi: true,
    options: [
      { text: 'Wegetariańska', icon: '🥕', value: 'wegetarianska' },
      { text: 'Bez glutenu', icon: '🌾', value: 'bezglutenu' },
      { text: 'Bez laktozy', icon: '🥛', value: 'bezlaktozy' },
      { text: 'Niskotłuszczowa', icon: '🫒', value: 'niskotluszczowa' },
      { text: 'Bogata w białko', icon: '👊', value: 'bogataobialk' },
      { text: 'Lekkostrawna', icon: '🌵', value: 'lekkostrawna' }
    ]
  }
];

let currentQuestionIndex = 0;
let quizAnswers = {};

function startQuiz() {
  currentQuestionIndex = 0;
  quizAnswers = {
    goal: [],
    age: [],
    health: [],
    activity: [],
    diet: []
  };
  
  const modal = document.getElementById('quiz-modal');
  if (modal) {
    modal.classList.add('open');
    renderQuestion();
  }
}

function closeQuiz() {
  const modal = document.getElementById('quiz-modal');
  if (modal) {
    modal.classList.remove('open');
    setTimeout(() => { modal.style.display = 'none'; }, 300);
  }
  localStorage.setItem('kz_quiz_completed', '1');
}

function renderQuestion() {
  const container = document.getElementById('quiz-content-area');
  const progressBar = document.getElementById('quiz-progress-fill');
  
  if (!container || !progressBar) return;
  
  const q = QUIZ_QUESTIONS[currentQuestionIndex];
  
  // Progress
  const progressPercent = ((currentQuestionIndex) / QUIZ_QUESTIONS.length) * 100;
  progressBar.style.width = progressPercent + '%';
  
  let html = `<div class="quiz-question-title">${q.title}</div>`;
  html += `<div class="quiz-options">`;
  
  q.options.forEach(opt => {
    const isSelected = quizAnswers[q.id].includes(opt.value);
    html += `
      <div class="quiz-option ${isSelected ? 'selected' : ''}" onclick="toggleQuizOption('${q.id}', '${opt.value}', ${q.multi})">
        <span style="font-size:1.5rem">${opt.icon}</span>
        <span>${opt.text}</span>
      </div>
    `;
  });
  
  html += `</div>`;
  
  // Next button
  const canProceed = quizAnswers[q.id].length > 0 || q.multi; // if multi, can be 0 (none)
  html += `<button class="quiz-next-btn" onclick="nextQuizStep()" ${!canProceed ? 'disabled' : ''}>Dalej ➔</button>`;
  
  container.innerHTML = html;
}

function toggleQuizOption(qId, val, multi) {
  if (multi) {
    const idx = quizAnswers[qId].indexOf(val);
    if (idx === -1) {
      quizAnswers[qId].push(val);
    } else {
      quizAnswers[qId].splice(idx, 1);
    }
  } else {
    quizAnswers[qId] = [val];
  }
  renderQuestion();
}

function nextQuizStep() {
  currentQuestionIndex++;
  if (currentQuestionIndex >= QUIZ_QUESTIONS.length) {
    finishQuiz();
  } else {
    renderQuestion();
  }
}

function finishQuiz() {
  const container = document.getElementById('quiz-content-area');
  const progressBar = document.getElementById('quiz-progress-fill');
  if (progressBar) progressBar.style.width = '100%';
  
  // Zapisz do localStorage
  localStorage.setItem('kz_quiz_diet', JSON.stringify(quizAnswers.diet));
  localStorage.setItem('kz_quiz_health', quizAnswers.health.join(', '));
  localStorage.setItem('kz_quiz_goal', quizAnswers.goal[0] || '');
  
  // Ekran ladowania
  container.innerHTML = `
    <div class="quiz-loader">
      <div class="quiz-spinner"></div>
      <h2 style="font-family:'Lora',serif; margin-bottom:10px;">Analizujemy Twoje odpowiedzi...</h2>
      <p style="color:#A8EDE0;">Dobieramy najlepszy plan dla Ciebie</p>
    </div>
  `;
  
  setTimeout(() => {
    closeQuiz();
    // Otworz oryginalny modal po quizie
    window.quizCompleted = true;
    localStorage.setItem('kz_quiz_completed', '1');
    if (window.openModal) {
      const modalBox = document.querySelector('#signupModal .modal-box');
      if (modalBox) {
        const title = modalBox.querySelector('h2');
        if (title) title.textContent = 'Twój spersonalizowany plan jest gotowy! ✨';
        const desc = modalBox.querySelector('p');
        if (desc) desc.textContent = 'Załóż konto i zasubskrybuj Klub, aby odebrać swój plan i w pełni korzystać z dopasowanej diety i ćwiczeń.';
      }
      window.openModal();
    }
    
    // Sprobuj od razu zaktualizowac UI jesli uzytkownik jest gdzies zalogowany/ma otwarte okno
    if (window.syncQuizToProfile) {
      window.syncQuizToProfile();
    }
  }, 2500);
}

window.startQuiz = startQuiz;
window.closeQuiz = closeQuiz;
