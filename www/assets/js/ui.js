    /* ── Formularz kontaktowy ── */
    function handleContact(e) {
      e.preventDefault();
      const btn = e.target.querySelector('.btn-send');
      btn.innerHTML = '⏳ Wysyłam...'; btn.disabled = true;
      setTimeout(() => {
        document.getElementById('contactForm').style.display = 'none';
        document.getElementById('contactSuccess').style.display = 'block';
      }, 1200);
    }

    /* ══════════════════════════════════════════════════════════════════
       APP ENGINE – Panel Członkowski
    ══════════════════════════════════════════════════════════════════ */
    if (window.KZ_EXPORTED_DATA) {
      const eid = window.KZ_EXPORTED_DATA.exportId;
      if (!localStorage.getItem('kz_imported_' + eid)) {
        if (window.KZ_EXPORTED_DATA.videos) localStorage.setItem('kz_videos', JSON.stringify(window.KZ_EXPORTED_DATA.videos));
        if (window.KZ_EXPORTED_DATA.diets) localStorage.setItem('kz_diets', JSON.stringify(window.KZ_EXPORTED_DATA.diets));
        if (window.KZ_EXPORTED_DATA.priceM) localStorage.setItem('kz_price_monthly', window.KZ_EXPORTED_DATA.priceM);
        if (window.KZ_EXPORTED_DATA.priceY) localStorage.setItem('kz_price_yearly', window.KZ_EXPORTED_DATA.priceY);
        if (window.KZ_EXPORTED_DATA.announce) localStorage.setItem('kz_announce', window.KZ_EXPORTED_DATA.announce);
        localStorage.setItem('kz_imported_' + eid, '1');
      }
    }

    // Dane aplikacji
    const exp = window.KZ_EXPORTED_DATA || {};
    const APP_DATA = {
      videos: JSON.parse(localStorage.getItem('kz_videos')) || exp.videos || [
        { id: 1, title: 'Rozgrzewka kręgosłupa', duration: '15 min', tag: 'Kręgosłup', emoji: '🦴', desc: 'Łagodne mobilizacje odcinka lędźwiowego i szyjnego. Idealne na dobry początek dnia.', day: 'Dzisiaj', url: '' },
        { id: 2, title: 'Stawy – bez bólu', duration: '15 min', tag: 'Stawy', emoji: '🦵', desc: 'Ćwiczenia poprawiające ruchomość kolan, bioder i łokci. Bez klęczenia.', day: 'Wczoraj', url: '' },
        { id: 3, title: 'Równowaga i stabilność', duration: '15 min', tag: 'Równowaga', emoji: '⚖️', desc: 'Trening propriocepcji – ćwiczenia przy krześle, które zmniejszają ryzyko upadków.', day: 'Poniedziałek', url: '' },
        { id: 4, title: 'Oddech i relaksacja', duration: '15 min', tag: 'Relaks', emoji: '🌬️', desc: 'Techniki oddechowe i stretching całego ciała. Redukuje napięcie i stres.', day: 'Niedziela', url: '' },
        { id: 5, title: 'Ręce i ramiona', duration: '12 min', tag: 'Górna część', emoji: '💪', desc: 'Ćwiczenia wzmacniające ramiona, nadgarstki i dłonie. Przydatne do codziennych czynności.', day: 'Sobota', url: '' },
        { id: 6, title: 'Spacer w miejscu', duration: '18 min', tag: 'Cardio', emoji: '🚶', desc: 'Energiczne ćwiczenia w miejscu poprawiające krążenie i wydolność oddechową.', day: 'Piątek', url: '' },
      ],
      shopVideos: JSON.parse(localStorage.getItem('kz_shop_videos') || 'null') || [
        { id: 'pack-stawy', title: 'Pakiet Zdrowe Stawy', duration: '4 filmy', tag: 'Stawy', emoji: '🦵', price: '19 zł', desc: 'Łagodne ćwiczenia na kolana, biodra i barki z wersjami przy krześle.' },
        { id: 'pack-kregoslup', title: 'Pakiet Spokojny Kręgosłup', duration: '5 filmów', tag: 'Kręgosłup', emoji: '🦴', price: '24 zł', desc: 'Mobilność, rozluźnianie i bezpieczne sekwencje dla pleców.' },
        { id: 'pack-rownowaga', title: 'Pakiet Równowaga 50+', duration: '4 filmy', tag: 'Równowaga', emoji: '⚖️', price: '19 zł', desc: 'Ćwiczenia stabilizacji i koordynacji, które pomagają ograniczać ryzyko potknięć.' },
        { id: 'pack-oddech', title: 'Pakiet Oddech i Sen', duration: '3 filmy', tag: 'Relaks', emoji: '🌙', price: '14 zł', desc: 'Spokojne sesje oddechowe, rozciąganie i wyciszenie wieczorne.' }
      ],
      diets: JSON.parse(localStorage.getItem('kz_diets')) || exp.diets || [
        { id: 1, title: 'Tydzień 1 – Przeciwzapalny start', emoji: '🥗', tag: 'Przeciwzapalna', meals: ['Śniadanie: owsianka z siemieniem lnianym i jagodami', 'Obiad: zupa z soczewicy, pieczone warzywa', 'Kolacja: twaróg z rzodkiewką i pieczywem żytnim'], shopping: ['Soczewica czerwona 500g', 'Jagody mrożone 300g', 'Siemię lniane', 'Pieczone buraki', 'Twaróg półtłusty', 'Pieczywo żytnie'] },
        { id: 2, title: 'Tydzień 2 – Zdrowe stawy', emoji: '🐟', tag: 'Omega-3', meals: ['Śniadanie: jajecznica z pomidorami i koperkiem', 'Obiad: makrela pieczona z ziemniakami', 'Kolacja: jogurt naturalny z orzechami włoskimi'], shopping: ['Makrela świeża lub wędzona', 'Jajka 10szt', 'Pomidory 1kg', 'Orzechy włoskie', 'Jogurt naturalny', 'Koperek'] },
        { id: 3, title: 'Tydzień 3 – Energia i witalność', emoji: '🌿', tag: 'Witaminy', meals: ['Śniadanie: kasza jaglana z miodem i cynamonem', 'Obiad: kurczak duszony z warzywami', 'Kolacja: sałatka z burakiem i fetą'], shopping: ['Kasza jaglana', 'Pierś z kurczaka 500g', 'Burak gotowany', 'Ser feta', 'Miód', 'Cynamon'] },
        { id: 4, title: 'Tydzień 4 – Lekko i smacznie', emoji: '🍲', tag: 'Lekkostrawna', meals: ['Śniadanie: ryż na mleku z rodzynkami', 'Obiad: zupa pomidorowa z makaronem', 'Kolacja: gotowana marchewka z masłem i pietruszką'], shopping: ['Ryż biały', 'Mleko 2%', 'Rodzynki', 'Passata pomidorowa', 'Makaron drobny', 'Marchew 1kg'] },
      ],
      medications: JSON.parse(localStorage.getItem('kz_medications') || '[]'),
      notifPermission: false,
    };

    const ALLERGEN_DICT = {
      'bezlaktozy': [
        { find: /mleko(?: krowie)?/gi, replace: 'mleko owsiane (bez laktozy)' },
        { find: /twaróg(?: półtłusty| chudy)?/gi, replace: 'tofu naturalne' },
        { find: /jogurt(?: naturalny)?/gi, replace: 'jogurt sojowy' },
        { find: /masł(?:o|em)/gi, replace: 'oliwa z oliwek' },
        { find: /ser feta/gi, replace: 'wegańska feta' },
        { find: /ser(?! feta)/gi, replace: 'ser bez laktozy' }
      ],
      'bezglutenu': [
        { find: /pieczyw(?:o|em) żytni(?:e|m)/gi, replace: 'pieczywem bezglutenowym' },
        { find: /makaron(?: drobny)?/gi, replace: 'makaron ryżowy (bezglutenowy)' },
        { find: /owsianka/gi, replace: 'owsianka (z płatków bezglutenowych)' }
      ],
      'wegetarianska': [
        { find: /kurczak(?: duszony)?/gi, replace: 'tofu wędzone' },
        { find: /pierś z kurczaka/gi, replace: 'tofu lub ciecierzyca' },
        { find: /makrela(?: pieczona| świeża lub wędzona)?/gi, replace: 'pasta z fasoli i wędzonego tofu' }
      ]
    };

    function applyAllergens(text, activePrefs) {
      let result = text;
      activePrefs.forEach(pref => {
        if (ALLERGEN_DICT[pref]) {
          ALLERGEN_DICT[pref].forEach(rule => {
            result = result.replace(rule.find, rule.replace);
          });
        }
      });
      return result;
    }

    // Asynchroniczna warstwa pamięci (Preferences + Supabase)
    async function asyncSetItem(key, value) {
      localStorage.setItem(key, value);
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
        await window.Capacitor.Plugins.Preferences.set({ key, value });
      }
    }

    async function syncToCloud() {
      if (window.supabaseClient) {
        const { data: sessionData } = await window.supabaseClient.auth.getSession();
        if (sessionData?.session?.user) {
          const userId = sessionData.session.user.id;
          let dogtag = null;
          let dietPrefs = [];
          let likedVideos = [];
          try { dogtag = JSON.parse(localStorage.getItem('vf_dogtag') || 'null'); } catch (e) { console.error("Error parsing vf_dogtag in syncToCloud:", e); }
          try { dietPrefs = JSON.parse(localStorage.getItem('kz_diet_prefs') || '[]'); } catch (e) { console.error("Error parsing dietPrefs in syncToCloud:", e); }
          try { likedVideos = JSON.parse(localStorage.getItem('kz_liked_videos') || '[]'); } catch (e) { console.error("Error parsing likedVideos in syncToCloud:", e); }

          const payload = {
            medications: APP_DATA.medications,
            dogtag: dogtag,
            profileName: localStorage.getItem('kz_name') || '',
            profilePhone: localStorage.getItem('kz_phone') || '',
            profileEmail: localStorage.getItem('kz_email') || sessionData.session.user.email || '',
            selectedDiet: selectedDiet,
            dietPrefs: dietPrefs,
            likedVideos: likedVideos,
            healthIssues: localStorage.getItem('kz_health_issues') || ''
          };
          window.supabaseClient.from('user_profiles').upsert({ id: userId, app_data: payload }).then().catch(e => console.log('Sync err', e));
        }
      }
    }

    // Zapis leków
    function saveMeds() {
      asyncSetItem('kz_medications', JSON.stringify(APP_DATA.medications));
      syncToCloud();
    }

    // Sprawdź czy powiadomienia są obsługiwane
    function checkNotifSupport() {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) return true;
      return 'Notification' in window && 'serviceWorker' in navigator;
    }

    function hideLoadingScreen() {
      if (window.VFLoader && typeof window.VFLoader.hideWhenReady === 'function') {
        window.VFLoader.hideWhenReady();
        return;
      }

      const loader = document.getElementById('app-loading-screen');
      if (loader) {
        loader.style.pointerEvents = 'none';
        loader.style.opacity = '0';
        setTimeout(() => {
          try { loader.remove(); } catch (e) { }
        }, 300);
      }
      // Usunięto natychmiastowe usuwanie klasy app-loading (loader.js to zrobi)
    }

    /* ── POKAŻ APLIKACJĘ ── */
    function showApp(userName) {
      document.body.classList.add('logged-in');
      // Usunięto natychmiastowe usuwanie klasy app-loading (loader.js to zrobi)
      hideLoadingScreen();

      // Ukryj całą stronę lądowania
      document.querySelectorAll('body > *:not(#appShell):not(.modal-overlay)').forEach(el => {
        if (el.id !== 'app-loading-screen') {
          el.style.display = 'none';
        }
      });
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.background = '#F0F4F8';

      // Utwórz powłokę aplikacji jeśli nie istnieje
      if (!document.getElementById('appShell')) {
        const shell = document.createElement('div');
        shell.id = 'appShell';
        shell.innerHTML = buildAppHTML(userName);
        document.body.appendChild(shell);
        initApp();
      } else {
        document.getElementById('appShell').style.display = 'block';
        const firstName = (userName || '').split(' ')[0] || 'Seniorze';
        const el = document.getElementById('app-username');
        if (el) el.textContent = `${firstName}! 👋`;
      }
    }

    function buildAppHTML(name) {
      const firstName = (name || '').split(' ')[0] || 'Seniorze';
      const now = new Date();
      const hour = now.getHours();
      let greeting = hour < 12 ? 'Dzień dobry' : hour < 18 ? 'Miłego popołudnia' : 'Dobry wieczór';
      const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
      const monthNames = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
      const dateStr = `${dayNames[now.getDay()]}, ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

      return `


<!-- ══════ APP HEADER ══════ -->
<div class="app-header">
  <div class="app-header-inner">
    <span class="app-logo" onclick="adminClickTrigger()">
      <img src="assets/logo.png" alt="VitalFly Logo" style="height:35px; width:auto; border-radius:6px;" />
      <span>VitalFly</span>
    </span>
    <div style="display:flex; align-items:center; gap:0.6rem;">
      <span class="app-badge" id="app-plan-badge" style="display:none;">✓ AKTYWNA SUBSKRYPCJA</span>
      <button onclick="switchTab('settings', null)" class="app-logout-btn" style="padding:0; width:38px; height:38px; display:flex; align-items:center; justify-content:center; border-radius:50%; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.1); cursor:pointer;">
        <span style="font-size:1.15rem; line-height:1;">⚙️</span>
      </button>
      <button class="app-logout-btn" onclick="logout()" style="padding:0; width:38px; height:38px; display:flex; align-items:center; justify-content:center; border-radius:50%; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.1); cursor:pointer;">
        <span style="font-size:1.15rem; line-height:1;">🚪</span>
      </button>
    </div>
  </div>
</div>

<!-- ══════ APP MAIN ══════ -->
<div class="app-main">

  <!-- Welcome card -->
  <div class="welcome-card">
    <div class="welcome-greeting">${greeting},</div>
    <div class="welcome-name" id="app-username">${firstName}! 👋</div>
    <div class="welcome-date">${dateStr}</div>
    <div class="stat-row">
      <div class="stat-pill">🎬 6 filmów</div>
      <div class="stat-pill">🥗 4 diety</div>
      <div class="stat-pill" id="med-stat-pill">💊 <span id="med-count-stat">0</span> leków</div>
    </div>
    <a href="https://www.facebook.com/groups/2017205645541173/" target="_blank" style="display:flex; align-items:center; justify-content:center; gap:0.65rem; background:#1877F2; color:white; text-decoration:none; font-weight:700; font-size:1.02rem; padding:1rem 1.5rem; border-radius:16px; margin-top:1.5rem; transition:var(--transition-smooth); box-shadow:0 6px 18px rgba(24,119,242,0.25);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 24px rgba(24,119,242,0.35)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 6px 18px rgba(24,119,242,0.25)'">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
      Dołącz do grupy na Facebooku
    </a>
  </div>

  <div class="quick-actions" aria-label="Szybkie akcje">
    <button type="button" onclick="switchTab('videos', document.querySelector('.tab-btn:nth-child(1)'))"><span>🎬</span><strong>Ćwicz teraz</strong><small>otwórz filmy</small></button>
    <button type="button" onclick="switchTab('diets', document.querySelector('.tab-btn:nth-child(2)'))"><span>🥗</span><strong>Jadłospis</strong><small>plan na dziś</small></button>
    <button type="button" onclick="switchTab('meds', document.querySelector('.tab-btn:nth-child(3)'))"><span>💊</span><strong>Leki</strong><small>przypomnienia</small></button>
    <button type="button" onclick="toggleChat(event)"><span>💬</span><strong>Asystent</strong><small>zapytaj AI</small></button>
  </div>

  <!-- Tab navigation -->
  <div class="tab-nav">
    <button class="tab-btn active" data-tab="videos" onclick="switchTab('videos',this)"><span style="font-size:1.45rem; line-height:1;">🎬</span><span>Ćwiczenia</span></button>
    <button class="tab-btn" data-tab="diets" onclick="switchTab('diets',this)"><span style="font-size:1.45rem; line-height:1;">🥗</span><span>Dieta</span></button>
    <button class="tab-btn" data-tab="meds" onclick="switchTab('meds',this)"><span style="font-size:1.45rem; line-height:1;">💊</span><span>Leki</span></button>
    <button class="tab-btn" data-tab="dogtag" onclick="switchTab('dogtag',this)"><span style="font-size:1.45rem; line-height:1;">🚑</span><span>Ratunek</span></button>
  </div>

  <!-- TAB: VIDEOS -->
  <div class="tab-panel active" id="tab-videos">
    <div class="sec-title">🎬 Dzisiejsze i archiwalne ćwiczenia</div>
    <div class="video-library-hero">
      <div>
        <div class="video-library-kicker">Biblioteka dopasowana do Ciebie</div>
        <h3>Filmy, które warto zrobić dzisiaj</h3>
        <p id="videoLibraryNotice">Prosty algorytm bierze pod uwagę dzień tygodnia, polubione filmy i profil zdrowotny.</p>
      </div>
      <div class="video-library-orb" aria-hidden="true">✦</div>
    </div>
    <div class="video-library-tabs" role="tablist" aria-label="Biblioteka filmów">
      <button class="video-library-tab active" type="button" onclick="setVideoLibraryView('recommended', this)">✨ Proponowane</button>
      <button class="video-library-tab" type="button" onclick="setVideoLibraryView('liked', this)">❤️ Polubione</button>
      <button class="video-library-tab" type="button" onclick="setVideoLibraryView('shop', this)">🛒 Do kupienia</button>
      <button class="video-library-tab" type="button" onclick="setVideoLibraryView('all', this)">🎬 Wszystkie</button>
    </div>
    <!-- Video player -->
    <div class="video-player" id="videoPlayer">
      <button class="vp-close" onclick="closePlayer()">✕</button>
      <div id="vp-real-media" style="display:none; width:100%; aspect-ratio:16/9; background:#000; border-radius:14px; overflow:hidden; margin-bottom:1rem; margin-top:2rem;"></div>
      <div id="vp-fake-media">
        <div class="vp-title" id="vp-title">Ćwiczenie</div>
        <div class="vp-screen" id="vp-emoji">🦴</div>
        <div class="vp-bar"><div class="vp-fill" id="vp-fill"></div></div>
        <div style="display:flex; justify-content:space-between; font-size:0.85rem; opacity:0.75; margin-top:-0.25rem; font-weight:600;"><span id="vp-cur">0:00</span><span id="vp-dur">15:00</span></div>
        <div class="vp-controls">
          <button class="vp-btn" onclick="playerRewind()">⏮ 10s</button>
          <button class="vp-btn" id="vp-playpause" onclick="togglePlay()">⏸ Pauza</button>
          <button class="vp-btn" onclick="playerForward()">10s ⏭</button>
        </div>
      </div>
    </div>
    <div class="video-grid" id="videoGrid"></div>
  </div>

  <!-- TAB: DIETS -->
  <div class="tab-panel" id="tab-diets">
    <div class="sec-title" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
      <span style="font-family:'Lora', serif; font-size:1.6rem; font-weight:700; color:var(--navy);">🥗 Twój Jadłospis AI</span>
      <span id="diet-status-tag" class="font-cyber text-[10px] bg-[#4DBFA8]/10 text-[#4DBFA8] px-2 py-0.5 border border-[#4DBFA8]/30 uppercase tracking-widest">
        GOTOWY DO GENERACJI
      </span>
    </div>
    
    <div class="diet-ai-shell">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem; border-bottom:1px solid var(--border-light); padding-bottom:1rem;">
        <div style="display:flex; flex-direction:column; gap:0.25rem;">
          <span style="font-size:0.75rem; font-weight:700; color:var(--warm-gray); text-transform:uppercase; letter-spacing:0.05em;">Okres planu dietetycznego</span>
          <div class="diet-duration-selector">
            <button onclick="setDietDuration(1)" id="btn-duration-1" class="diet-dur-btn active" type="button">Dzisiaj</button>
            <button onclick="setDietDuration(3)" id="btn-duration-3" class="diet-dur-btn" type="button">3 dni</button>
            <button onclick="setDietDuration(7)" id="btn-duration-7" class="diet-dur-btn" type="button">Tydzień</button>
          </div>
        </div>
      </div>
      <div style="display:flex; align-items:center; justify-content:space-between; width:100%; margin-bottom:1.25rem; gap:1rem;">
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <span style="font-size:2.2rem; line-height:1;">🧠</span>
          <div>
            <h3 id="diet-title-display" style="font-family:'Lora', serif; font-size:1.35rem; font-weight:700; color:var(--navy); margin:0;">
              Twój Spersonalizowany Jadłospis
            </h3>
            <p style="font-size:0.85rem; color:var(--warm-gray); margin:0; font-weight:500;">
              Generowany automatycznie w oparciu o Twoje preferencje i zalecenia zdrowotne.
            </p>
          </div>
        </div>
        <button id="diet-like-btn" onclick="toggleLikeCurrentDiet()" style="background:transparent; border:none; font-size:1.6rem; cursor:pointer; padding:0.5rem; display:none;" title="Polub jadłospis">🤍</button>
      </div>

      <!-- Kontener z posiłkami -->
      <div id="diet-meals-container" class="diet-ai-meals-box">
        <div style="text-align:center; padding:2rem 0; color:var(--warm-gray);">
          <span style="font-size:2.5rem; display:block; margin-bottom:0.75rem;">🍽️</span>
          <p style="font-size:0.92rem; font-weight:600; margin-bottom:1rem;">Brak aktywnego planu na dziś.</p>
          <button onclick="renderPersonalizedDiet()" class="btn-cta" style="display:inline-block; font-size:0.88rem; padding:0.6rem 1.5rem;">
            ⚡ Wygeneruj jadłospis na dziś
          </button>
        </div>
      </div>
      
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1.5rem; flex-wrap:wrap; gap:0.75rem;">
        <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
          <button onclick="renderPersonalizedDiet(true)" style="background:var(--mint); color:white; border:none; padding:0.75rem 1.5rem; border-radius:999px; font-weight:700; font-size:0.9rem; cursor:pointer; display:flex; align-items:center; gap:0.5rem; transition:var(--transition-smooth); box-shadow:var(--shadow-sm);" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
            🔄 Generuj ponownie
          </button>
          <button id="diet-print-btn" onclick="printAIDiet()" style="background:var(--mint-light); border:2px solid var(--mint); color:var(--navy); padding:0.75rem 1.5rem; border-radius:999px; font-weight:700; font-size:0.9rem; cursor:pointer; display:flex; align-items:center; gap:0.5rem; transition:var(--transition-smooth);" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
            🖨 Zapisz / Drukuj PDF
          </button>
        </div>
        <button onclick="switchTab('settings', null)" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.1); color:var(--navy); padding:0.75rem 1.5rem; border-radius:999px; font-weight:700; font-size:0.9rem; cursor:pointer; transition:var(--transition-smooth);" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
          ⚙️ Ustawienia preferencji
        </button>
      </div>
    </div>
  </div>

  <!-- TAB: MEDICATIONS -->
  <div class="tab-panel" id="tab-meds">
    <div class="sec-title">💊 Moje leki i powiadomienia</div>

    <div class="notif-banner" id="notifBanner">
      <div style="font-size:2rem;">🔔</div>
      <div style="flex:1;">
        <div style="font-weight:700; font-size:1.05rem;">Włącz przypomnienia o lekach</div>
        <div style="font-size:0.88rem; opacity:0.9; margin-top:0.2rem; font-weight:500;">Dostaniesz powiadomienie na telefon o wybranej porze.</div>
      </div>
      <button class="notif-btn" onclick="requestNotifPermission()">Włącz powiadomienia</button>
    </div>
    <div class="notif-granted" id="notifGranted">✅ Powiadomienia są włączone! Przypomnę Ci o każdym leku o wybranej porze.</div>

    <!-- Add medication form -->
    <div class="med-form">
      <div style="font-family:'Lora',serif; font-size:1.25rem; font-weight:700; color:var(--navy); margin-bottom:0.25rem;">➕ Dodaj nowy lek</div>
      <div style="font-size:0.92rem; color:var(--warm-gray); margin-bottom:1rem; font-weight:500;">Wpisz nazwę leku, dawkę i godzinę przyjmowania.</div>
      <div class="med-field-row">
        <div>
          <label class="med-label" for="med-name-input">Nazwa leku</label>
          <input class="med-input" id="med-name-input" type="text" placeholder="np. Metformin" />
        </div>
        <div>
          <label class="med-label" for="med-dose-input">Dawka</label>
          <input class="med-input" id="med-dose-input" type="text" placeholder="np. 500mg" />
        </div>
        <div></div>
      </div>
      <div class="med-field-row" style="margin-top:0.75rem;">
        <div>
          <label class="med-label" for="med-time-input">Godzina przyjęcia</label>
          <input class="med-input" id="med-time-input" type="time" value="08:00" />
        </div>
        <div>
          <label class="med-label" for="med-note-input">Uwagi (opcjonalne)</label>
          <input class="med-input" id="med-note-input" type="text" placeholder="np. po posiłku" />
        </div>
        <button class="med-add-btn" onclick="addMedication()">Dodaj lek</button>
      </div>
    </div>

    <!-- Medication list -->
    <div class="sec-title" style="margin-top:1.75rem;">📋 Moja lista leków</div>
    <div class="med-list" id="medList"></div>
  </div>

  <!-- TAB: DOG TAG (Nieśmiertelnik) -->
  <div class="tab-panel" id="tab-dogtag">
    <div class="sec-title">🚑 Mój Nieśmiertelnik (ICE)</div>
    
    <!-- SOS BUTTON -->
    <a href="tel:112" style="display:flex; align-items:center; justify-content:center; gap:0.75rem; background:linear-gradient(135deg, #FF3B30 0%, #E05252 100%); color:white; font-weight:900; font-size:1.45rem; padding:1.5rem; border-radius:20px; text-decoration:none; box-shadow:0 8px 24px rgba(224,82,82,0.35); margin-bottom:1.75rem; transition:var(--transition-smooth);" onmouseover="this.style.transform='scale(1.015)'; this.style.boxShadow='0 12px 30px rgba(224,82,82,0.45)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 8px 24px rgba(224,82,82,0.35)'">
      <span style="font-size:2rem; line-height:1;">🚨</span> WEZWIJ POMOC (112)
    </a>
    <!-- View Mode -->
    <div id="dogtag-view" style="display:none; background:white; border-radius:24px; padding:2rem; box-shadow:0 12px 40px rgba(224,82,82,0.15); border:2px solid #E05252; margin-bottom:1.75rem; transition:var(--transition-smooth);">
      <div style="background:#E05252; color:white; font-weight:800; text-align:center; padding:1rem; border-radius:14px; margin-bottom:1.75rem; font-size:1.25rem; text-transform:uppercase; letter-spacing:0.04em;">W nagłym wypadku (ICE)</div>
      
      <div style="margin-bottom:1.25rem;">
        <div style="font-size:0.82rem; color:var(--warm-gray); text-transform:uppercase; font-weight:700; letter-spacing:0.05em;">Imię i nazwisko</div>
        <div id="dt-v-name" style="font-size:1.4rem; font-weight:700; color:var(--navy); margin-top:0.2rem;">Brak danych</div>
      </div>
      <div style="margin-bottom:1.25rem;">
        <div style="font-size:0.82rem; color:var(--warm-gray); text-transform:uppercase; font-weight:700; letter-spacing:0.05em;">Adres zamieszkania</div>
        <div id="dt-v-address" style="font-size:1.15rem; color:var(--navy); font-weight:600; margin-top:0.2rem;">Brak danych</div>
      </div>
      <div style="margin-bottom:1.5rem;">
        <div style="font-size:0.82rem; color:var(--warm-gray); text-transform:uppercase; font-weight:700; letter-spacing:0.05em;">Kontakt do najbliższych (ICE)</div>
        <div id="dt-v-ice" style="font-size:1.25rem; color:#E05252; font-weight:800; margin-top:0.2rem;">Brak danych</div>
      </div>
      
      <div style="margin-bottom:1.25rem; border-top:1px solid var(--border-light); padding-top:1.25rem;">
        <div style="font-size:0.82rem; color:var(--warm-gray); text-transform:uppercase; font-weight:700; letter-spacing:0.05em;">Choroby przewlekłe</div>
        <div id="dt-v-illness" style="font-size:1.15rem; color:var(--navy); font-weight:600; margin-top:0.2rem;">Brak danych</div>
      </div>
      <div style="margin-bottom:1.25rem;">
        <div style="font-size:0.82rem; color:var(--warm-gray); text-transform:uppercase; font-weight:700; letter-spacing:0.05em;">Przyjmowane leki</div>
        <div id="dt-v-meds" style="font-size:1.15rem; color:var(--navy); font-weight:600; margin-top:0.2rem;">Brak danych</div>
      </div>
      
      <button onclick="toggleDogTagEdit(true)" class="btn-send" style="background:var(--warm-gray); margin-top:1.5rem; width:100%; border-radius:14px; padding:0.9rem;">✏️ Edytuj dane</button>
    </div>

    <!-- Edit Mode -->
    <div id="dogtag-edit" class="med-form">
      <div style="font-family:'Lora',serif; font-size:1.25rem; font-weight:700; color:var(--navy); margin-bottom:0.5rem;">Wypełnij swój Nieśmiertelnik</div>
      <p style="font-size:0.92rem; color:var(--warm-gray); margin-bottom:1.5rem; font-weight:500;">Dane zostaną zapisane tylko na Twoim telefonie. W razie nagłego wypadku ratownicy medyczni będą mieli do nich łatwy dostęp.</p>
      
      <div class="mb-4">
        <label class="form-label">Imię i nazwisko</label>
        <input class="form-input" id="dt-e-name" type="text" placeholder="np. Jan Kowalski" />
      </div>
      <div class="mb-4">
        <label class="form-label">Adres zamieszkania</label>
        <input class="form-input" id="dt-e-address" type="text" placeholder="np. ul. Kwiatowa 12/4, Warszawa" />
      </div>
      <div class="mb-4">
        <label class="form-label" style="color:#E05252;">Kontakt do najbliższych (ICE)</label>
        <input class="form-input" id="dt-e-ice" type="text" placeholder="np. Córka Anna: 600 123 456" />
      </div>
      <div class="mb-4">
        <label class="form-label">Choroby przewlekłe</label>
        <textarea class="form-input" id="dt-e-illness" placeholder="np. Cukrzyca typu 2, Nadciśnienie" style="min-height:80px;"></textarea>
      </div>
      <div class="mb-4">
        <label class="form-label">Przyjmowane leki (nazwa i dawka)</label>
        <div style="padding:0.9rem 1.1rem; background:var(--mint-light); color:var(--navy); border-radius:14px; font-size:0.95rem; display:flex; gap:0.6rem; align-items:flex-start; border: 1px solid rgba(62, 174, 150, 0.15);">
          <span style="font-size:1.25rem; line-height:1;">💊</span>
          <div style="font-weight:500;">Lista leków pobierana jest automatycznie z Twojej zakładki <strong>Leki</strong>. Oto one:</div>
        </div>
        <div id="dt-e-meds-list" style="margin-top:0.85rem; padding-left:0.75rem; font-size:1rem; color:var(--navy); line-height:1.6; border-left:3px solid var(--mint-mid); margin-left:0.5rem; font-weight:600;"></div>
      </div>
      
      <button onclick="saveDogTag()" class="btn-send" style="background:#E05252; width:100%; border-radius:14px; padding:0.9rem;">💾 Zapisz Nieśmiertelnik</button>
      <button onclick="toggleDogTagEdit(false)" class="btn-send" style="background:transparent; color:var(--warm-gray); box-shadow:none; width:100%; margin-top:0.5rem; border: 1px solid #E2E8F0; border-radius:14px; padding:0.9rem;">Anuluj</button>
    </div>
  </div>

  <!-- TAB: SETTINGS -->
  <div class="tab-panel" id="tab-settings">
    <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1.5rem;">
      <button type="button" onclick="switchTab(window.lastActiveTab || 'videos', null)" class="settings-back-btn">
        ← Powrót
      </button>
      <div class="sec-title" style="margin:0;">⚙️ Ustawienia i profil</div>
    </div>

    <!-- Profil -->
    <div class="settings-section">
      <div class="settings-title">👤 Mój profil</div>
      <div style="text-align:center; margin-bottom:1.5rem;">
        <div class="profile-avatar" id="profile-avatar-display" onclick="changeAvatar()" title="Kliknij aby zmienić">🧓</div>
        <p style="font-size:0.82rem; color:var(--warm-gray); font-weight:600; margin-top:0.4rem;">Kliknij, aby zmienić awatar</p>
      </div>
      <div class="settings-row"><div><div class="settings-label">Imię i nazwisko</div></div><input id="s-name" class="form-input" style="max-width:260px; padding:0.65rem 0.95rem; font-size:1rem;" /></div>
      <div class="settings-row"><div><div class="settings-label">E-mail</div></div><input id="s-email" class="form-input" style="max-width:260px; padding:0.65rem 0.95rem; font-size:1rem;" /></div>
      <div class="settings-row"><div><div class="settings-label">Telefon <span style="color:var(--warm-gray); font-size:0.88rem;">(opcjonalny)</span></div></div><input id="s-phone" class="form-input" style="max-width:260px; padding:0.65rem 0.95rem; font-size:1rem;" placeholder="np. 600 123 456" /></div>
      <div style="margin-top:1.5rem; text-align:right;"><button class="btn-send" style="width:auto; padding:0.75rem 2.25rem; font-size:1rem; border-radius:14px;" onclick="saveProfile()">Zapisz profil</button></div>
    </div>

    <!-- Plan -->
    <div class="settings-section">
      <div class="settings-title">🏦 Mój plan</div>
      <div class="settings-row">
        <div><div class="settings-label">Aktualny plan</div><div class="settings-desc" id="plan-renewal-info">Odnawia się automatycznie</div></div>
        <span class="plan-current-badge" id="plan-current-label">📅 Miesięczny &bull; 39 zł/miesiąc</span>
      </div>
      <div class="settings-row">
        <div><div class="settings-label">Upgrade do planu rocznego</div><div class="settings-desc">390 zł/rok zamiast 468 zł — 2 miesiące gratis!</div></div>
        <button class="plan-upgrade-btn" id="upgrade-btn" onclick="upgradePlan()">Przejdź na Roczny →</button>
      </div>
      <div class="settings-row">
        <div><div class="settings-label">Anuluj subskrypcję</div><div class="settings-desc">Dostęp do końca opłaconego okresu.</div></div>
        <button class="plan-cancel-btn" id="cancel-sub-btn" onclick="cancelSubscription()">Rezygnuj z subskrypcji</button>
      </div>
    </div>

    <!-- Personalizacja diety & Zdrowie -->
<div class="settings-section">
  <div class="settings-title">🥗 Personalizacja diety & Zdrowie</div>
  
  <!-- Sub-tabs navigation -->
  <div class="sub-tabs-container">
    <button class="sub-tab-btn active" id="btn-sub-tab-prefs" onclick="switchSubTab('prefs')">🥗 Preferencje i Wykluczenia</button>
    <button class="sub-tab-btn" id="btn-sub-tab-health" onclick="switchSubTab('health')">🩺 Stan zdrowia i Dolegliwości</button>
  </div>

  <!-- Tab Content: Preferencje i Wykluczenia -->
  <div id="sub-tab-prefs-content">
    <p style="font-size:0.95rem; color:var(--warm-gray); margin-bottom:1.25rem; font-weight:500;">Zaznacz swoje preferencje — będziemy filtrować jadłospisy.</p>
    <div id="diet-prefs-chips" style="margin: -0.25rem;">
      <button class="diet-pref-chip" onclick="toggleDietPref('wegetarianska',this)">🥕 Wegetariańska</button>
      <button class="diet-pref-chip" onclick="toggleDietPref('bezglutenu',this)">🌾 Bez glutenu</button>
      <button class="diet-pref-chip" onclick="toggleDietPref('bezlaktozy',this)">🥛 Bez laktozy</button>
      <button class="diet-pref-chip" onclick="toggleDietPref('niskotluszczowa',this)">🫒 Niskotłuszczowa</button>
      <button class="diet-pref-chip" onclick="toggleDietPref('bogataobialk',this)">👊 Bogata w białko</button>
      <button class="diet-pref-chip" onclick="toggleDietPref('lekkostrawna',this)">🌵 Lekkostrawna</button>
    </div>
    <div style="margin-top:1.5rem; text-align:right;">
      <button class="btn-send" style="width:auto; padding:0.75rem 2.25rem; font-size:1rem; border-radius:14px;" onclick="saveDietPrefs()">Zapisz preferencje</button>
    </div>
  </div>

  <!-- Tab Content: Stan zdrowia i Dolegliwości -->
  <div id="sub-tab-health-content" style="display:none;">
    <p style="font-size:0.95rem; color:var(--warm-gray); margin-bottom:1rem; font-weight:500;">
      Wpisz swoje schorzenia lub dolegliwości (np. nadciśnienie, bóle lędźwiowe, cukrzyca, osteoporoza). Nasz autonomiczny silnik AI dostosuje jadłospisy oraz porady wirtualnego asystenta do Twojego stanu zdrowia.
    </p>
    <div class="mb-4">
      <textarea class="form-input" id="health-issues-input" placeholder="Wpisz np. nadciśnienie tętnicze, ból kolana przy chodzeniu, cukrzyca typu 2..." style="min-height:100px; width:100%; border-radius:14px; padding:0.9rem; font-size:1rem; resize:vertical;"></textarea>
    </div>
    <div style="margin-top:1rem; text-align:right;">
      <button class="btn-send" style="width:auto; padding:0.75rem 2.25rem; font-size:1rem; border-radius:14px;" onclick="saveHealthProfile()">Zapisz profil zdrowotny</button>
    </div>
  </div>
</div>

<!-- Powiadomienia -->
    <div class="settings-section">
      <div class="settings-title">🔔 Powiadomienia</div>
      <div class="settings-row">
        <div><div class="settings-label">Przypomnienie o ćwiczeniach</div><div class="settings-desc">Codzienne powiadomienie o podanej godzinie</div></div>
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <input type="time" class="settings-notif-time" id="notif-exercise-time" value="08:00" />
          <label class="toggle-sw"><input type="checkbox" id="notif-exercise-enabled" onchange="saveNotifSettings()" /><span class="toggle-sw-slider"></span></label>
        </div>
      </div>
      <div class="settings-row">
        <div><div class="settings-label">Tryb ciszy nocnej</div><div class="settings-desc">Brak powiadomień między 22:00 a 07:00</div></div>
        <label class="toggle-sw"><input type="checkbox" id="notif-quiet" onchange="saveNotifSettings()" /><span class="toggle-sw-slider"></span></label>
      </div>
      <div class="settings-row">
        <div><div class="settings-label">Powiadomienia o lekach</div><div class="settings-desc">Zarządzaj w zakładce 💊 Leki</div></div>
        <span style="font-size:0.95rem; color:var(--mint); font-weight:700;">Aktywne ✓</span>
      </div>
    </div>

    <!-- Wygląd -->
    <div class="settings-section">
      <div class="settings-title">🎨 Widok strony</div>
      <div class="settings-row">
        <div><div class="settings-label">Rozmiar tekstu</div></div>
        <div class="font-size-row">
          <button class="fs-btn" id="fs-sm" onclick="setFontSize('sm')">A (mały)</button>
          <button class="fs-btn active" id="fs-md" onclick="setFontSize('md')">A (normalny)</button>
          <button class="fs-btn" id="fs-lg" onclick="setFontSize('lg')">A (duży)</button>
          <button class="fs-btn" id="fs-xl" onclick="setFontSize('xl')">A (bardzo duży)</button>
        </div>
      </div>
      <div class="settings-row">
        <div><div class="settings-label">Motyw kolorystyczny</div></div>
        <div style="display:flex; gap:0.5rem;">
          <button class="fs-btn active" id="theme-light" onclick="setTheme('light')">☀️ Jasny</button>
          <button class="fs-btn" id="theme-dark" onclick="setTheme('dark')">🌙 Ciemny</button>
        </div>
      </div>
    </div>

    <!-- Grupa Facebook -->
    <div class="settings-section">
      <div class="settings-title">👥 Grupa na Facebooku</div>
      <div class="settings-row">
        <div><div class="settings-label">Status członkostwa</div><div class="settings-desc">Zamknięta grupa wsparcia</div></div>
        <a href="https://www.facebook.com/groups/2017205645541173/" target="_blank" rel="noopener" class="btn-send" style="display:inline-flex; align-items:center; gap:0.5rem; width:auto; padding:0.65rem 1.5rem; font-size:0.95rem; text-decoration:none; border-radius:14px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.27h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
          Otwórz grupę
        </a>
      </div>
    </div>

    <!-- Konto -->
    <div class="settings-section">
      <div class="settings-title">🔒 Konto</div>
      <div class="settings-row">
        <div><div class="settings-label">Wyloguj się</div><div class="settings-desc">Wrócisz do strony głównej</div></div>
        <button class="plan-upgrade-btn" style="background:linear-gradient(135deg, #6B7A8D 0%, #4A5251 100%);" onclick="logout()">Wyloguj →</button>
      </div>
      <div class="settings-row">
        <div><div class="settings-label">Regulamin</div></div>
        <a onclick="viewTerms('regulamin')" style="color:var(--mint); font-weight:700; cursor:pointer; text-decoration:underline;">Przejdź →</a>
      </div>
      <div class="settings-row">
        <div><div class="settings-label">Polityka prywatności</div></div>
        <a onclick="viewTerms('polityka')" style="color:var(--mint); font-weight:700; cursor:pointer; text-decoration:underline;">Przejdź →</a>
      </div>
    </div>
  </div>

</div>

<!-- Toast notification -->
<div class="med-toast" id="medToast">
  <span id="medToastText">Powiadomienie</span>
</div>

<!-- Live Help Popup: karta pomocy na telefonie -->
<div id="liveHelpPopup" class="live-help-popup" aria-live="polite">
  <button type="button" class="live-help-close" onclick="dismissLiveHelpPopup(event)" aria-label="Zamknij komunikat">×</button>
  <div class="live-help-kicker">Live pomoc</div>
  <div class="live-help-title">Najnowsze informacje o użytkowniku</div>
  <div class="live-help-body" id="liveHelpBody">Ładowanie danych...</div>
  <button type="button" class="live-help-action" onclick="openDogTagFromLive(event)">Otwórz kartę ratunkową</button>
</div>

<!-- Floating Chatbot FAB -->
<button id="chatFab" class="chat-fab" onclick="toggleChat(event)" aria-label="Otwórz wirtualnego asystenta">
  <span aria-hidden="true">💬</span>
</button>

<!-- Chat Window -->
<div id="chatWindow" class="chat-window">
  <div class="chat-header">
    <div>
      <div style="font-family:'Lora',serif; font-weight:700; font-size:1.15rem; line-height:1.2;">Wirtualny Asystent VitalFly</div>
      <div style="font-size:0.75rem; color:#A8EDE0; font-weight:600; letter-spacing:0.05em; text-transform:uppercase; margin-top:2px;">Medycyna, Dieta i Ruch ✦ Asystent AI</div>
    </div>
    <button class="chat-close-btn" onclick="toggleChat(event)">×</button>
  </div>
  <div id="chatMessages" class="chat-messages">
    <!-- Messages dynamically rendered -->
  </div>
  <div class="chat-input-area">
    <textarea id="chatInput" class="chat-input" placeholder="Wpisz pytanie..." rows="1" onkeydown="handleChatKeydown(event)"></textarea>
    <button id="chatSendBtn" class="chat-send-btn" onclick="sendChatMessage()">➔</button>
  </div>
</div>

<!-- Medication Modal -->
<div class="modal-overlay" id="medModal" style="z-index: 1000;" onclick="if(event.target===this)closeMedModal()">
  <div class="modal-box" style="text-align:center; padding:2.5rem 1.5rem; max-width:340px; margin:0 auto; display:flex; flex-direction:column; align-items:center;">
    <div style="font-size:4rem; margin-bottom:1rem; line-height:1;">💊</div>
    <h2 class="font-serif font-bold mb-2" style="font-size:1.6rem; color:var(--navy);">Czas na leki</h2>
    <p id="medModalText" style="color:#444; margin-bottom:2rem; font-size:1.1rem; line-height:1.4;"></p>
    <button onclick="closeMedModal()" class="btn-cta" style="width:100%; font-size:1.15rem; padding:1rem; border-radius:12px;">Tak, leki zostały zażyte</button>
  </div>
</div>
`;
    }
    /* ── Wirtualny Asystent Chatbot ── */
    let chatHistory = [];
    let chatIsOpen = false;

    function toggleChat(e) {
      if (e) e.stopPropagation();
      const win = document.getElementById('chatWindow');
      if (!win) return;
      chatIsOpen = !chatIsOpen;
      win.classList.toggle('open', chatIsOpen);
      document.body.classList.toggle('chat-open', chatIsOpen);
      if (chatIsOpen) {
        const msgList = document.getElementById('chatMessages');
        if (msgList && msgList.children.length === 0) {
          renderWelcomeMessage();
        }
        setTimeout(() => document.getElementById('chatInput')?.focus(), 100);
      }
    }

    function renderWelcomeMessage() {
      const msgList = document.getElementById('chatMessages');
      if (!msgList) return;

      const name = localStorage.getItem('kz_name') || 'Seniorze';
      const firstName = name.split(' ')[0];

      const healthIssues = localStorage.getItem('kz_health_issues') || '';
      const botMsg = document.createElement('div');
      botMsg.className = 'chat-msg bot';
      botMsg.textContent = healthIssues
        ? `Witaj ${firstName}! Jestem Twoim asystentem VitalFly. Widzę zapisany profil zdrowotny, więc będę odpowiadać ostrożnie i dopasuję porady do Twoich ograniczeń. Mogę pomóc w ćwiczeniach, diecie, lekach przypominanych w aplikacji i obsłudze panelu. Przy objawach, chorobach lub lekach zawsze warto skonsultować się z lekarzem.`
        : `Witaj ${firstName}! Jestem Twoim asystentem VitalFly. Mogę pomóc w ćwiczeniach, diecie, przypomnieniach o lekach i obsłudze aplikacji. Nie zastępuję lekarza, ale pomogę Ci przygotować bezpieczne pytania i kolejne kroki.`;
      msgList.appendChild(botMsg);

      chatHistory = [
        {
          role: "model",
          parts: [{ text: botMsg.textContent }]
        }
      ];
    }

    function handleChatKeydown(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    }

    async function sendChatMessage() {
      const input = document.getElementById('chatInput');
      const msgList = document.getElementById('chatMessages');
      if (!input || !msgList) return;

      const text = input.value.trim();
      if (!text) return;

      const userMsg = document.createElement('div');
      userMsg.className = 'chat-msg user';
      userMsg.textContent = text;
      msgList.appendChild(userMsg);

      input.value = '';
      msgList.scrollTop = msgList.scrollHeight;

      chatHistory.push({
        role: "user",
        parts: [{ text: text }]
      });

      const loader = document.createElement('div');
      loader.className = 'chat-loading';
      loader.id = 'chatLoader';
      loader.innerHTML = '<span></span><span></span><span></span>';
      msgList.appendChild(loader);
      msgList.scrollTop = msgList.scrollHeight;

      const apiKey = localStorage.getItem('kz_gemini_api_key') || '';
      if (!apiKey) {
        loader.remove();
        const errMsg = document.createElement('div');
        errMsg.className = 'chat-msg bot';
        errMsg.style.color = '#E05252';
        errMsg.textContent = 'Błąd: Klucz API Gemini nie jest skonfigurowany. Poproś administratora o wklejenie klucza w panelu administracyjnym aplikacji.';
        msgList.appendChild(errMsg);
        msgList.scrollTop = msgList.scrollHeight;
        return;
      }

      try {
        const patientName = localStorage.getItem('kz_name') || 'Senior';
        const healthIssues = localStorage.getItem('kz_health_issues') || '';
        let systemInstructionText = `Jesteś przyjaznym, empatycznym i cierpliwym wirtualnym asystentem dla seniorów w aplikacji VitalFly. Pomagasz w zdrowym stylu życia, ćwiczeniach, diecie przeciwzapalnej, przypomnieniach o lekach i obsłudze aplikacji. Odpowiadaj po polsku, krótko, jasno i spokojnie. Najpierw podawaj praktyczną odpowiedź, potem 1-3 bezpieczne kroki. Nie diagnozuj, nie zmieniaj dawek leków, nie odstawiaj leków i nie zastępuj lekarza. Przy objawach alarmowych, chorobach, lekach, dawkowaniu, pogorszeniu samopoczucia albo diecie przy schorzeniach zalecaj kontakt z lekarzem, farmaceutą lub dietetykiem klinicznym. Pacjent ma na imię: ${patientName}.`;
        if (healthIssues) {
          systemInstructionText += ` Pacjent zgłasza następujące dolegliwości i stan zdrowia: "${healthIssues}". Dostosuj język, poziom ostrożności, propozycje aktywności, diety i codziennego wsparcia do tych ograniczeń. Przy ruchu proponuj łagodniejsze warianty i przerwanie ćwiczeń przy bólu, duszności, zawrotach głowy lub nietypowych objawach. Nie przedstawiaj zaleceń jako leczenia.`;
        }

        const payload = {
          contents: chatHistory,
          systemInstruction: {
            parts: [{ text: systemInstructionText }]
          }
        };

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          throw new Error(`Status ${res.status}`);
        }

        const resData = await res.json();
        loader.remove();

        let replyText = '';
        if (resData.candidates && resData.candidates[0] && resData.candidates[0].content && resData.candidates[0].content.parts[0]) {
          replyText = resData.candidates[0].content.parts[0].text;
        } else {
          replyText = "Przepraszam, ale nie mogłem wygenerować odpowiedzi w tym momencie. Spróbuj zadać pytanie inaczej.";
        }

        const botReply = document.createElement('div');
        botReply.className = 'chat-msg bot';

        let formattedText = replyText
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/\n\n/g, '<br><br>')
          .replace(/\n/g, '<br>')
          .replace(/^- (.*)/gm, '• $1');

        botReply.innerHTML = formattedText;
        msgList.appendChild(botReply);
        msgList.scrollTop = msgList.scrollHeight;

        chatHistory.push({
          role: "model",
          parts: [{ text: replyText }]
        });

      } catch (err) {
        console.error("Gemini API Error:", err);
        loader.remove();
        const botErr = document.createElement('div');
        botErr.className = 'chat-msg bot';
        botErr.style.color = '#E05252';
        botErr.textContent = "Przepraszam, wystąpił błąd połączenia z asystentem AI. Upewnij się, że klucz API jest poprawny lub spróbuj ponownie później.";
        msgList.appendChild(botErr);
        msgList.scrollTop = msgList.scrollHeight;
      }
    }

    function saveGeminiKey() {
      const key = document.getElementById('admin-gemini-key')?.value.trim();
      localStorage.setItem('kz_gemini_api_key', key);
      showToast('⏳ Zapisywanie klucza w chmurze...');
      saveToCloud().then(ok => {
        if (ok) showToast('✅ Klucz API Gemini został zapisany!');
      });
    }

    /* ── Tab switcher ── */
    function switchTab(name, btn) {
      if (name !== 'settings') {
        window.lastActiveTab = name;
      }
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('tab-' + name).classList.add('active');
      if (!btn) btn = document.querySelector(`.tab-btn[data-tab="${name}"]`);
      if (btn) btn.classList.add('active');

      if (name === 'settings') {
        document.body.classList.add('settings-active');
      } else {
        document.body.classList.remove('settings-active');
      }

      window.scrollTo(0, 0);
      if (name === 'diets') {
        renderPersonalizedDiet();
      }
      updateLiveHelpPopup();
    }

    /* ── Init App ── */
    function initApp() {
      renderVideos();
      renderPersonalizedDiet();
      renderMeds();
      checkNotifStatus();
      startMedChecker();
      loadDogTag();
      loadModuleSettings();
      initChatPopupGuards();
      initLiveHelpPopup();

      // Reakcja na fizyczny przycisk "Wstecz" na Androidzie
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        window.Capacitor.Plugins.App.addListener('backButton', ({ canGoBack }) => {
          const vp = document.getElementById('videoPlayer');
          const medMod = document.getElementById('medModal');
          if (chatIsOpen) {
            toggleChat();
          } else if (vp && vp.style.display === 'flex') {
            closePlayer();
          } else if (medMod && medMod.classList.contains('open')) {
            closeMedModal();
          } else {
            // Jeśli nie ma nic do cofnięcia, wyjdź z aplikacji
            if (!canGoBack) window.Capacitor.Plugins.App.exitApp();
          }
        });
      }
    }

    function initChatPopupGuards() {
      if (window.vfChatGuardsInit) return;
      window.vfChatGuardsInit = true;
      document.addEventListener('click', (ev) => {
        if (!chatIsOpen) return;
        const win = document.getElementById('chatWindow');
        const fab = document.getElementById('chatFab');
        if (win && !win.contains(ev.target) && fab && !fab.contains(ev.target)) {
          toggleChat();
        }
      });
      document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape' && chatIsOpen) toggleChat();
      });
    }

    function initLiveHelpPopup() {
      updateLiveHelpPopup();
      if (window.vfLiveHelpTimer) clearInterval(window.vfLiveHelpTimer);
      window.vfLiveHelpTimer = setInterval(updateLiveHelpPopup, 30000);
    }

    function updateLiveHelpPopup() {
      const box = document.getElementById('liveHelpPopup');
      const body = document.getElementById('liveHelpBody');
      if (!box || !body) return;
      if (sessionStorage.getItem('kz_live_help_dismissed') === '1') {
        box.classList.add('dismissed');
        return;
      }

      let dog = {};
      try { dog = JSON.parse(localStorage.getItem('vf_dogtag') || '{}'); } catch (e) { dog = {}; }
      const name = dog.name || localStorage.getItem('kz_name') || 'Użytkownik VitalFly';
      const health = localStorage.getItem('kz_health_issues') || dog.illness || 'brak wpisanych schorzeń';
      const ice = dog.ice || 'brak kontaktu ICE';
      const medsCount = APP_DATA.medications.length;
      const nextMed = getNextMedicationLabel();

      body.innerHTML = `
      <strong>${name}</strong><br>
      ICE: ${ice}<br>
      Leki: ${medsCount} ${medsCount === 1 ? 'pozycja' : 'pozycji'}${nextMed ? ` • najbliżej: ${nextMed}` : ''}<br>
      Zdrowie: ${String(health).slice(0, 72)}${String(health).length > 72 ? '…' : ''}
    `;
    }

    function getNextMedicationLabel() {
      if (!APP_DATA.medications.length) return '';
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const sorted = APP_DATA.medications
        .filter(m => m.time)
        .map(m => {
          const [h, min] = String(m.time).split(':').map(Number);
          const total = (h || 0) * 60 + (min || 0);
          return { ...m, sort: total >= nowMinutes ? total - nowMinutes : total + 1440 - nowMinutes };
        })
        .sort((a, b) => a.sort - b.sort);
      if (!sorted.length) return '';
      return `${sorted[0].time} ${sorted[0].name}`;
    }

    function dismissLiveHelpPopup(e) {
      if (e) e.stopPropagation();
      sessionStorage.setItem('kz_live_help_dismissed', '1');
      const box = document.getElementById('liveHelpPopup');
      if (box) box.classList.add('dismissed');
    }

    function openDogTagFromLive(e) {
      if (e) e.stopPropagation();
      switchTab('dogtag', null);
    }
