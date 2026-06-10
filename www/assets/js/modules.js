/* ── DOG TAG ── */
    function toggleDogTagEdit(showEdit) {
      document.getElementById('dogtag-edit').style.display = showEdit ? 'block' : 'none';
      document.getElementById('dogtag-view').style.display = showEdit ? 'none' : 'block';
    }

    function saveDogTag() {
      const data = {
        name: document.getElementById('dt-e-name') ? document.getElementById('dt-e-name').value.trim() : '',
        address: document.getElementById('dt-e-address') ? document.getElementById('dt-e-address').value.trim() : '',
        ice: document.getElementById('dt-e-ice') ? document.getElementById('dt-e-ice').value.trim() : '',
        illness: document.getElementById('dt-e-illness') ? document.getElementById('dt-e-illness').value.trim() : '',
        meds: document.getElementById('dt-e-meds') ? document.getElementById('dt-e-meds').value.trim() : ''
      };
      
      localStorage.setItem('vf_dogtag', JSON.stringify(data));
      
      try {
        if (typeof window.asyncSetItem === 'function') {
          window.asyncSetItem('vf_dogtag', JSON.stringify(data));
        }
        if (typeof window.syncToCloud === 'function') {
          window.syncToCloud();
        }
      } catch(e) { console.error(e); }
      
      toggleDogTagEdit(false);
      loadDogTag();
      if (typeof updateLiveHelpPopup === 'function') updateLiveHelpPopup();
      if (typeof showToast === 'function') showToast('🚑 Nieśmiertelnik został pomyślnie zapisany!');
    }

    function loadDogTag() {
      const dataStr = localStorage.getItem('vf_dogtag');
      let medsText = APP_DATA.medications.map(m => `• ${window.VFSecurity.escapeHTML(m.name)} ${m.dose ? '(' + window.VFSecurity.escapeHTML(m.dose) + ')' : ''} ${window.VFSecurity.escapeHTML(m.time)}`).join('<br/>');
      if (!medsText) medsText = '<span style="color:#8A9BB0;">Brak wpisanych leków w zakładce "Leki"</span>';

      // Zawsze aktualizujemy listę leków w trybie odczytu i edycji
      document.getElementById('dt-v-meds').innerHTML = medsText;
      const elEditList = document.getElementById('dt-e-meds-list');
      if (elEditList) elEditList.innerHTML = medsText;

      if (dataStr) {
        const data = JSON.parse(dataStr);
        document.getElementById('dt-v-name').textContent = data.name || 'Brak danych';
        document.getElementById('dt-v-address').textContent = data.address || 'Brak danych';
        document.getElementById('dt-v-ice').textContent = data.ice || 'Brak danych';
        document.getElementById('dt-v-illness').textContent = data.illness || 'Brak danych';

        document.getElementById('dt-e-name').value = data.name || '';
        document.getElementById('dt-e-address').value = data.address || '';
        document.getElementById('dt-e-ice').value = data.ice || '';
        document.getElementById('dt-e-illness').value = data.illness || '';

        // Pokazujemy tryb odczytu (View) skoro dane już są w systemie
        toggleDogTagEdit(false);
      } else {
        // Brak danych, wymuszamy tryb edycji
        toggleDogTagEdit(true);
      }
      updateLiveHelpPopup();
    }

    /* ── VIDEOS ── */
    let playerState = { playing: false, current: null, elapsed: 0, interval: null };
    window.likedVideos = window.likedVideos || JSON.parse(localStorage.getItem('kz_liked_videos') || '[]');
    let videoLibraryView = localStorage.getItem('kz_video_library_view') || 'recommended';
    let videoCart = JSON.parse(localStorage.getItem('kz_video_cart') || '[]');

    function isLiked(id) {
      return window.likedVideos.includes(id);
    }

    function toggleLikeVideo(id) {
      const idx = window.likedVideos.indexOf(id);
      if (idx > -1) {
        window.likedVideos.splice(idx, 1);
      } else {
        window.likedVideos.push(id);
      }
      localStorage.setItem('kz_liked_videos', JSON.stringify(window.likedVideos));
      renderVideos();
      if (typeof renderLikedTab === 'function') renderLikedTab();
      syncToCloud();
    }

    function setVideoLibraryView(view, btn) {
      videoLibraryView = view;
      localStorage.setItem('kz_video_library_view', view);
      document.querySelectorAll('.video-library-tab').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      renderVideos();
    }

    function getVideoRecommendationData() {
      const health = (localStorage.getItem('kz_health_issues') || '').toLowerCase();
      const likedTags = APP_DATA.videos
        .filter(v => isLiked(v.id))
        .map(v => (v.tag || '').toLowerCase());
      const day = new Date().getDay();
      const dayMap = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
      const todayName = dayMap[day];

      return APP_DATA.videos.map(v => {
        const tag = (v.tag || '').toLowerCase();
        const title = (v.title || '').toLowerCase();
        let score = 0;
        const reasons = [];

        if (v.day === 'Dzisiaj' || v.day === todayName) {
          score += 4;
          reasons.push('pasuje na dziś');
        }
        if (likedTags.includes(tag)) {
          score += 3;
          reasons.push('podobne do polubionych');
        }
        if (/kolan|biodr|staw|bark|łok|lok/.test(health) && /staw|równowaga|rownowaga|górna|gorna/.test(tag + ' ' + title)) {
          score += 3;
          reasons.push('uwzględnia stawy');
        }
        if (/kręgos|kregos|plec|lędź|ledz|szyj/.test(health) && /kręgos|kregos|relaks|oddech/.test(tag + ' ' + title)) {
          score += 3;
          reasons.push('łagodniejsze dla pleców');
        }
        if (/nadciś|nadcis|serc|cukrzyc|krąż|kraz/.test(health) && /oddech|relaks|cardio|spacer/.test(tag + ' ' + title)) {
          score += 2;
          reasons.push('spokojne tempo');
        }
        if (score === 0) {
          score = 1;
          reasons.push('dobry wybór ogólny');
        }
        return { video: v, score, reason: reasons.slice(0, 2).join(' • ') };
      }).sort((a, b) => b.score - a.score || a.video.id - b.video.id);
    }

    function renderVideoCard(v, reason = '') {
      const safeId = Number(v.id);
      return `
      <div class="video-card" id="vcard-${safeId}" onclick="playVideo(${safeId})">
        <span class="video-emoji">${window.VFSecurity.escapeHTML(v.emoji)}</span>
        <div class="video-tag">${window.VFSecurity.escapeHTML(v.tag)}</div>
        <div class="video-title">${window.VFSecurity.escapeHTML(v.title)}</div>
        <div class="video-desc">${window.VFSecurity.escapeHTML(v.desc)}</div>
        ${reason ? `<div class="video-reason">✨ ${window.VFSecurity.escapeHTML(reason)}</div>` : ''}
        <div class="video-meta">
          <div>
            <div class="video-dur">⏱ ${window.VFSecurity.escapeHTML(v.duration)}</div>
            <div class="video-day">${window.VFSecurity.escapeHTML(v.day)}</div>
          </div>
          <div style="display:flex; gap:0.5rem; align-items:center;">
            <button onclick="event.stopPropagation(); toggleLikeVideo(${safeId})" class="video-like-btn" aria-label="Polub film">
              ${isLiked(safeId) ? '❤️' : '🤍'}
            </button>
            <div class="video-play-btn">▶</div>
          </div>
        </div>
      </div>
    `;
    }

    function getShopVideoMatch(item) {
      const health = (localStorage.getItem('kz_health_issues') || '').toLowerCase();
      const tag = (item.tag || '').toLowerCase();
      const likedTags = APP_DATA.videos.filter(v => isLiked(v.id)).map(v => (v.tag || '').toLowerCase());
      if (likedTags.includes(tag)) return 'Dopasowane do polubionych filmów';
      if (/kolan|biodr|staw|bark|łok|lok/.test(health) && /staw|równowaga|rownowaga/.test(tag)) return 'Polecane przy dolegliwościach stawów';
      if (/kręgos|kregos|plec|lędź|ledz|szyj/.test(health) && /kręgos|kregos/.test(tag)) return 'Polecane przy napięciach pleców';
      if (/sen|stres|nadciś|nadcis/.test(health) && /relaks/.test(tag)) return 'Spokojny pakiet regeneracyjny';
      return 'Popularny dodatek do biblioteki';
    }

    function toggleVideoCart(id) {
      const idx = videoCart.indexOf(id);
      if (idx > -1) {
        videoCart.splice(idx, 1);
        showToast('🛒 Usunięto pakiet z listy zakupów');
      } else {
        videoCart.push(id);
        showToast('🛒 Dodano pakiet do listy zakupów');
      }
      localStorage.setItem('kz_video_cart', JSON.stringify(videoCart));
      renderVideos();
    }

    function renderShopVideoCard(item) {
      const inCart = videoCart.includes(item.id);
      const safeItemId = window.VFSecurity.escapeHTML(item.id);
      return `
      <div class="video-card video-shop-card">
        <span class="video-emoji">${window.VFSecurity.escapeHTML(item.emoji)}</span>
        <div class="video-tag">${window.VFSecurity.escapeHTML(item.tag)}</div>
        <div class="video-title">${window.VFSecurity.escapeHTML(item.title)}</div>
        <div class="video-desc">${window.VFSecurity.escapeHTML(item.desc)}</div>
        <div class="shop-match">${window.VFSecurity.escapeHTML(getShopVideoMatch(item))}</div>
        <div class="video-meta">
          <div>
            <div class="video-dur">${window.VFSecurity.escapeHTML(item.duration)}</div>
            <div class="video-day">${window.VFSecurity.escapeHTML(item.price)}</div>
          </div>
          <button type="button" data-shop-id="${safeItemId}" class="video-play-btn" onclick="toggleVideoCart(this.dataset.shopId)">${inCart ? '✓ Na liście' : 'Dodaj'}</button>
        </div>
      </div>
    `;
    }

    window.setDailyFocus = function(focus) {
      localStorage.setItem('kz_daily_focus', focus);
      localStorage.setItem('kz_daily_focus_date', new Date().toISOString().split('T')[0]);
      renderVideos();
    };

    function renderVideos() {
      const grid = document.getElementById('videoGrid');
      if (!grid) return;
      document.querySelectorAll('.video-library-tab').forEach(b => b.classList.remove('active'));
      const activeBtn = document.querySelector(`.video-library-tab[onclick*="${videoLibraryView}"]`);
      if (activeBtn) activeBtn.classList.add('active');

      const notice = document.getElementById('videoLibraryNotice');
      if (videoLibraryView === 'recommended') {
        const todayStr = new Date().toISOString().split('T')[0];
        const focusDate = localStorage.getItem('kz_daily_focus_date');
        const focus = localStorage.getItem('kz_daily_focus');
        
        if (notice) notice.textContent = 'Propozycje powstają z dnia tygodnia, profilu zdrowotnego i polubionych filmów.';
        
        if (focusDate === todayStr && focus) {
          // Show one featured video matching the focus
          let recs = getVideoRecommendationData();
          let focusWord = focus.toLowerCase().replace(/[^a-zęóąśłżźćń]/g, '').trim();
          if (focusWord === 'oglnawitalno' || focusWord === 'oglnawitalnosc') focusWord = 'cardio'; // fallback or matching logic
          if (focusWord === 'krgosup') focusWord = 'kręgos'; 
          
          let match = recs.find(r => (r.video.tag || '').toLowerCase().includes(focusWord) || (r.video.title || '').toLowerCase().includes(focusWord));
          if (!match) match = recs[0]; // fallback
          
          if (match) {
            grid.innerHTML = `
              <div class="daily-focus-header" style="text-align:center; font-size:1.2rem; margin-bottom:1rem; font-weight:600; color:var(--text);">Twój cel na dziś: <strong style="color:var(--mint);">${window.VFSecurity.escapeHTML(focus)}</strong></div>
              <div class="featured-video-wrapper">
                ${renderVideoCard(match.video, match.reason).replace('class="video-card"', 'class="video-card featured-video-card"')}
              </div>
              <div class="daily-focus-footer" style="text-align:center; margin-top:1.5rem; font-size:0.95rem; color:var(--warm-gray);">To Twój główny trening na dziś! Jeśli masz siłę na więcej, pełny katalog znajdziesz w zakładce Wszystkie.</div>
              <button class="btn-send" style="margin: 1.5rem auto; display: block; width: auto; padding: 0.6rem 2rem; background: #e2e8f0; color: var(--navy);" onclick="setVideoLibraryView('all', document.querySelector('.video-library-tab:last-child'))">Przejdź do wszystkich →</button>
            `;
          } else {
            grid.innerHTML = '';
          }
        } else {
          // Ask for focus
          grid.innerHTML = `
            <div class="daily-focus-prompt" style="text-align:center; padding: 2rem 1rem; background:white; border-radius:16px; box-shadow:0 4px 15px rgba(0,0,0,0.03);">
              <h4 style="font-size:1.3rem; margin-bottom:0.5rem;">Nad czym chcesz dzisiaj popracować?</h4>
              <p style="color:var(--warm-gray); margin-bottom:1.5rem; font-size:0.95rem;">Wybierz jeden główny cel na dziś, a my dobierzemy idealny trening.</p>
              <div class="focus-buttons" style="display:flex; flex-wrap:wrap; gap:0.75rem; justify-content:center;">
                <button onclick="setDailyFocus('🦴 Stawy')" style="padding:0.75rem 1.25rem; border:2px solid var(--mint); border-radius:12px; background:transparent; color:var(--navy); font-weight:600; cursor:pointer; transition:0.2s;">🦴 Stawy</button>
                <button onclick="setDailyFocus('🧘 Kręgosłup')" style="padding:0.75rem 1.25rem; border:2px solid var(--mint); border-radius:12px; background:transparent; color:var(--navy); font-weight:600; cursor:pointer; transition:0.2s;">🧘 Kręgosłup</button>
                <button onclick="setDailyFocus('🌬️ Oddech')" style="padding:0.75rem 1.25rem; border:2px solid var(--mint); border-radius:12px; background:transparent; color:var(--navy); font-weight:600; cursor:pointer; transition:0.2s;">🌬️ Oddech</button>
                <button onclick="setDailyFocus('💪 Ogólna Witalność')" style="padding:0.75rem 1.25rem; border:2px solid var(--mint); border-radius:12px; background:transparent; color:var(--navy); font-weight:600; cursor:pointer; transition:0.2s;">💪 Ogólna Witalność</button>
              </div>
            </div>
          `;
        }
        return;
      }



      if (videoLibraryView === 'shop') {
        if (notice) notice.textContent = `Pakiety do kupienia są dopasowane prostym algorytmem do profilu i polubionych tematów. Na liście zakupów: ${videoCart.length}.`;
        grid.innerHTML = (APP_DATA.shopVideos || []).map(renderShopVideoCard).join('');
        return;
      }

      if (notice) notice.textContent = 'Pełna biblioteka ćwiczeń dostępnych w Twojej subskrypcji.';
      grid.innerHTML = APP_DATA.videos.map(v => renderVideoCard(v)).join('');
    }

    function playVideo(id) {
      const v = APP_DATA.videos.find(x => x.id === id);
      if (!v) return;
      
      let watched = parseInt(localStorage.getItem('kz_videos_watched') || '0');
      localStorage.setItem('kz_videos_watched', watched + 1);
      if (typeof updateDashboardStats === 'function') updateDashboardStats();
      
      clearInterval(playerState.interval);
      playerState = { playing: true, current: id, elapsed: 0, interval: null, total: 15 * 60 };
      document.querySelectorAll('.video-card').forEach(c => c.classList.remove('playing'));
      document.getElementById('vcard-' + id)?.classList.add('playing');
      const player = document.getElementById('videoPlayer');
      player.classList.add('show');

      if (v.url && v.url.trim() !== '') {
        document.getElementById('vp-fake-media').style.display = 'none';
        const rm = document.getElementById('vp-real-media');
        rm.style.display = 'block';
        let url = window.VFSecurity.safeMediaUrl(v.url);
        if (!url) {
          rm.textContent = 'Nieprawidłowy lub niedozwolony adres filmu.';
          return;
        }
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
          const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
          const ytId = match ? match[1] : null;
          if (ytId) {
            rm.replaceChildren();
            const iframe = document.createElement('iframe');
            iframe.width = '100%';
            iframe.height = '100%';
            iframe.src = `https://www.youtube-nocookie.com/embed/${ytId}?origin=https://vitalfly.pl`;
            iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
            iframe.allowFullscreen = true;
            iframe.referrerPolicy = 'strict-origin-when-cross-origin';
            rm.appendChild(iframe);
          } else {
            rm.innerHTML = `<div style="color:white;padding:2rem;text-align:center;font-family:sans-serif;">Błędny link YouTube. Skopiuj poprawny link.</div>`;
          }
        } else {
          rm.replaceChildren();
          const video = document.createElement('video');
          video.width = 100;
          video.height = 100;
          video.style.width = '100%';
          video.style.height = '100%';
          video.controls = true;
          video.autoplay = true;
          video.src = url;
          rm.appendChild(video);
        }
      } else {
        document.getElementById('vp-real-media').style.display = 'none';
        document.getElementById('vp-real-media').innerHTML = '';
        document.getElementById('vp-fake-media').style.display = 'block';
        document.getElementById('vp-title').textContent = v.title;
        document.getElementById('vp-emoji').textContent = v.emoji;
        document.getElementById('vp-dur').textContent = '15:00';
        document.getElementById('vp-playpause').textContent = '⏸ Pauza';
        runPlayerTimer();
      }

      player.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function runPlayerTimer() {
      playerState.interval = setInterval(() => {
        if (!playerState.playing) return;
        playerState.elapsed = Math.min(playerState.elapsed + 1, playerState.total);
        const pct = (playerState.elapsed / playerState.total) * 100;
        const fill = document.getElementById('vp-fill');
        if (fill) fill.style.width = pct + '%';
        const m = Math.floor(playerState.elapsed / 60);
        const s = playerState.elapsed % 60;
        const cur = document.getElementById('vp-cur');
        if (cur) cur.textContent = `${m}:${String(s).padStart(2, '0')}`;
        if (playerState.elapsed >= playerState.total) clearInterval(playerState.interval);
      }, 1000);
    }

    function togglePlay() {
      playerState.playing = !playerState.playing;
      const btn = document.getElementById('vp-playpause');
      if (btn) btn.textContent = playerState.playing ? '⏸ Pauza' : '▶ Graj';
    }

    function playerRewind() {
      playerState.elapsed = Math.max(0, playerState.elapsed - 10);
      const cur = document.getElementById('vp-cur');
      const m = Math.floor(playerState.elapsed / 60), s = playerState.elapsed % 60;
      if (cur) cur.textContent = `${m}:${String(s).padStart(2, '0')}`;
    }

    function playerForward() {
      playerState.elapsed = Math.min(playerState.total, playerState.elapsed + 10);
      const cur = document.getElementById('vp-cur');
      const m = Math.floor(playerState.elapsed / 60), s = playerState.elapsed % 60;
      if (cur) cur.textContent = `${m}:${String(s).padStart(2, '0')}`;
    }

    function closePlayer() {
      clearInterval(playerState.interval);
      playerState.playing = false;
      document.getElementById('videoPlayer').classList.remove('show');
      document.querySelectorAll('.video-card').forEach(c => c.classList.remove('playing'));
      const rm = document.getElementById('vp-real-media');
      if (rm) rm.innerHTML = '';
    }

    /* ══════════════════════════════════════════════════════════════════
         AUTONOMICZNY MODUŁ DIETETYCZNY AI (LLM GEMINI OS)
      ══════════════════════════════════════════════════════════════════ */

    function getDietProfileCacheKey(activePrefs, healthIssues) {
      const prefs = Array.isArray(activePrefs) ? [...activePrefs].sort() : [];
      return JSON.stringify({ prefs, health: (healthIssues || '').trim().toLowerCase() });
    }

    function clearDietCache() {
      localStorage.removeItem('kz_cached_diet');
      localStorage.removeItem('kz_cached_diet_day');
      localStorage.removeItem('kz_cached_diet_profile_key');
    }

    function calculateTodayDietDayIndex(dietPlan) {
      if (!dietPlan || !dietPlan.days || dietPlan.days.length <= 1) {
        return 0;
      }

      const currentDietDuration = parseInt(localStorage.getItem('kz_diet_duration') || '1');

      if (currentDietDuration === 7) {
        const daysOfWeek = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
        const todayName = daysOfWeek[new Date().getDay()];
        const todayIdx = dietPlan.days.findIndex(day => day.dayName && day.dayName.trim().toLowerCase() === todayName.toLowerCase());
        if (todayIdx !== -1) {
          return todayIdx;
        }
      }

      if (currentDietDuration === 3) {
        let genTimeStr = localStorage.getItem(`kz_cached_diet_time_${currentDietDuration}`);
        if (!genTimeStr) {
          genTimeStr = Date.now().toString();
          localStorage.setItem(`kz_cached_diet_time_${currentDietDuration}`, genTimeStr);
        }
        const genTime = parseInt(genTimeStr, 10);
        const d1 = new Date(genTime);
        const d2 = new Date();
        d1.setHours(0, 0, 0, 0);
        d2.setHours(0, 0, 0, 0);
        const diffTime = d2.getTime() - d1.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, Math.min(diffDays, dietPlan.days.length - 1));
      }

      return 0;
    }

    // Główna funkcja generująca dietę za pomocą LLM
    // Funkcja pomocnicza renderująca widok jadłospisu z obiektu JSON
    // Funkcja pomocnicza renderująca widok jadłospisu z obiektu JSON
    function displayDietPlan(dietPlan) {
      const container = document.getElementById('diet-meals-container');
      const titleDisplay = document.getElementById('diet-title-display');
      const statusTag = document.getElementById('diet-status-tag');
      if (!container || !titleDisplay || !statusTag) return;

      titleDisplay.textContent = dietPlan.title;
      statusTag.textContent = 'PLAN GOTOWY';
      statusTag.className = "font-cyber text-[10px] bg-teal-500/10 text-[#00ffcc] px-2 py-0.5 border border-teal-500/30 uppercase tracking-widest";

      // Kompatybilność wsteczna ze starą strukturą jednodniową
      if (dietPlan.meals && !dietPlan.days) {
        dietPlan.days = [{
          dayName: 'Dzisiaj',
          meals: dietPlan.meals
        }];
      }

      if (!dietPlan.days || dietPlan.days.length === 0) {
        container.innerHTML = `<p class="text-sm text-red-400 p-4 border border-red-500/20 bg-red-500/5 font-mono">Błąd struktury jadłospisu: Brak posiłków.</p>`;
        return;
      }

      const todayIdx = calculateTodayDietDayIndex(dietPlan);

      if (typeof window.activeDietDayIndex === 'undefined') {
        window.activeDietDayIndex = todayIdx;
      }
      if (window.activeDietDayIndex >= dietPlan.days.length) {
        window.activeDietDayIndex = todayIdx;
      }

      // Generowanie poziomej nawigacji dni, jeśli dni jest więcej niż 1
      let htmlNav = '';
      if (dietPlan.days.length > 1) {
        htmlNav = `
        <div class="diet-days-nav" style="display:flex; gap:0.5rem; overflow-x:auto; padding-bottom:0.75rem; margin-bottom:1.25rem; -webkit-overflow-scrolling:touch;">
          ${dietPlan.days.map((day, idx) => {
            const isActive = idx === window.activeDietDayIndex;
            const isCompleted = idx < todayIdx;
            const displayText = VFSecurity.escapeHTML(isCompleted ? `✓ ${day.dayName}` : day.dayName);
            return `
              <button onclick="setActiveDietDay(${idx})" class="diet-day-pill ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}" type="button">
                ${displayText}
              </button>
            `;
          }).join('')}
        </div>
      `;
      }

      // Generowanie posiłków dla wybranego dnia
      const activeDay = dietPlan.days[window.activeDietDayIndex];
      let htmlMeals = `
      <div class="diet-ai-meals-day-content">
        ${activeDay.meals.map(meal => `
          <div class="diet-ai-meal-row">
            <span class="diet-ai-meal-type">[ ${VFSecurity.escapeHTML(meal.type)} ]</span>
            <span class="diet-ai-meal-content">${VFSecurity.escapeHTML(meal.content)}</span>
          </div>
        `).join('')}
      </div>
    `;

      // Generowanie skonsolidowanej listy zakupów na cały okres
      let htmlShopping = '';
      if (dietPlan.shopping && dietPlan.shopping.length > 0) {
        const shoppingTitle = `Lista zakupów z jadłospisu: ${dietPlan.title}`;
        const isShopLiked = isShoppingLiked(shoppingTitle);
        const heartIcon = isShopLiked ? '❤️' : '🤍';

        htmlShopping = `
        <div class="diet-ai-shopping-section" style="margin-top:1.5rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <span class="diet-ai-shopping-title" style="margin:0;">WYGENEROWANA LISTA ZAKUPÓW (${dietPlan.days.length > 1 ? 'NA CAŁY OKRES' : 'NA DZIŚ'})</span>
            <button type="button" onclick="toggleLikeShopping()" style="background:transparent; border:none; font-size:1.4rem; cursor:pointer;" title="Polub listę zakupów">
              ${heartIcon}
            </button>
          </div>
          <div class="diet-ai-shopping-tags-wrapper">
            ${dietPlan.shopping.map(item => `<span class="diet-ai-shopping-tag">${VFSecurity.escapeHTML(item)}</span>`).join('')}
          </div>
        </div>
      `;
      }

      container.innerHTML = htmlNav + htmlMeals + htmlShopping;
      updateDietLikeBtn();
    }

    // Funkcja zmiany wybranego dnia diety
    window.setActiveDietDay = function (idx) {
      window.activeDietDayIndex = idx;
      const currentDietDuration = parseInt(localStorage.getItem('kz_diet_duration') || '1');
      const cached = localStorage.getItem(`kz_cached_diet_${currentDietDuration}`);
      if (cached) {
        try {
          displayDietPlan(JSON.parse(cached));
        } catch (e) {
          console.error("Błąd ładowania wybranego dnia:", e);
        }
      }
    };

    // Funkcja zmiany okresu trwania diety
    window.setDietDuration = function (days) {
      if (window.dietGenerationInProgress) {
        if (typeof showToast === 'function') showToast('Poczekaj na zakończenie generowania jadłospisu.', 2500);
        return;
      }
      localStorage.setItem('kz_diet_duration', days);
      window.activeDietDayIndex = undefined;

      // Zmiana aktywnej klasy na przyciskach okresu
      document.querySelectorAll('.diet-dur-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      const activeBtn = document.getElementById(`btn-duration-${days}`);
      if (activeBtn) activeBtn.classList.add('active');

      // Odświeżenie widoku
      renderPersonalizedDiet();
    };

    // Funkcja pomocnicza chroniąca przed błędem braku definicji
    window.renderDiets = function () {
      if (document.getElementById('adminPanelView')?.style.display !== 'none') {
        renderAdminContent();
      }
    };

    // Główna funkcja generująca dietę za pomocą LLM
    async function renderPersonalizedDiet(forceRefresh = false) {
      const container = document.getElementById('diet-meals-container');
      const titleDisplay = document.getElementById('diet-title-display');
      const statusTag = document.getElementById('diet-status-tag');

      if (!container) return;
      if (forceRefresh && window.dietGenerationInProgress) {
        if (typeof showToast === 'function') showToast('Jadłospis jest już przygotowywany.', 2500);
        return;
      }

      const btn = document.getElementById('diet-like-btn');
      if (btn) btn.style.display = 'none';

      const currentDietDuration = parseInt(localStorage.getItem('kz_diet_duration') || '1');

      // Synchronizacja klasy active przycisków wyboru okresu na starcie
      document.querySelectorAll('.diet-dur-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      const activeBtn = document.getElementById(`btn-duration-${currentDietDuration}`);
      if (activeBtn) activeBtn.classList.add('active');

      // Pobranie konfiguracji i klucza API z systemu
      const aiConfig = window.VitalFlyAI
        ? window.VitalFlyAI.getConfig()
        : { isConfigured: false };
      const activePrefs = JSON.parse(localStorage.getItem('kz_diet_prefs') || '[]');
      const shareHealthWithAI = localStorage.getItem('kz_ai_health_consent') === '1';
      const healthIssues = shareHealthWithAI ? (localStorage.getItem('kz_health_issues') || '') : '';
      const dietProfileCacheKey = getDietProfileCacheKey(activePrefs, healthIssues);

      // Pobranie aktualnego dnia, aby LLM wiedział, na jaki dzień generuje dietę
      const daysOfWeek = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
      const currentDay = daysOfWeek[new Date().getDay()];

      // Sprawdzenie czy mamy już zapisaną dietę w pamięci lokalnej dla danej długości
      let cached = localStorage.getItem(`kz_cached_diet_${currentDietDuration}`);
      let cachedDay = localStorage.getItem(`kz_cached_diet_day_${currentDietDuration}`);
      let cachedProfileKey = localStorage.getItem(`kz_cached_diet_profile_key_${currentDietDuration}`);

      // Migracja starej jednodniowej pamięci cache (jeśli istnieje)
      if (currentDietDuration === 1 && !cached && localStorage.getItem('kz_cached_diet')) {
        cached = localStorage.getItem('kz_cached_diet');
        cachedDay = localStorage.getItem('kz_cached_diet_day');
        cachedProfileKey = localStorage.getItem('kz_cached_diet_profile_key');
        if (cached) {
          localStorage.setItem('kz_cached_diet_1', cached);
          localStorage.setItem('kz_cached_diet_day_1', cachedDay);
          localStorage.setItem('kz_cached_diet_profile_key_1', cachedProfileKey);
        }
      }

      if (!forceRefresh && cached && (currentDietDuration !== 1 || cachedDay === currentDay) && cachedProfileKey === dietProfileCacheKey) {
        try {
          const dietPlan = JSON.parse(cached);
          if (!localStorage.getItem(`kz_cached_diet_time_${currentDietDuration}`)) {
            localStorage.setItem(`kz_cached_diet_time_${currentDietDuration}`, Date.now().toString());
          }
          displayDietPlan(dietPlan);
          return;
        } catch (e) {
          console.error("Błąd parsowania zapisanej diety:", e);
        }
      }

      // Jeśli nie ma zapisanego planu i nie wywołano ręcznego generowania
      if (!forceRefresh && !cached) {
        const periodName = currentDietDuration === 1 ? 'dziś' : (currentDietDuration === 3 ? '3 dni' : 'tydzień');
        const buttonText = currentDietDuration === 1 ? 'na dziś' : (currentDietDuration === 3 ? 'na 3 dni' : 'na tydzień');
        container.innerHTML = `
        <div style="text-align:center; padding:2rem 0; color:var(--warm-gray);">
          <span style="font-size:2.5rem; display:block; margin-bottom:0.75rem;">🍽️</span>
          <p style="font-size:0.92rem; font-weight:600; margin-bottom:1rem;">Brak aktywnego planu na ${periodName}.</p>
          <button onclick="renderPersonalizedDiet(true)" class="btn-cta diet-generate-btn" style="display:inline-block; font-size:0.88rem; padding:0.6rem 1.5rem;">
            ⚡ Wygeneruj jadłospis ${buttonText}
          </button>
        </div>
      `;
        titleDisplay.textContent = "Twój Spersonalizowany Jadłospis";
        statusTag.textContent = 'BRAK PLANU';
        statusTag.className = "font-cyber text-[10px] bg-[#4DBFA8]/10 text-[#4DBFA8] px-2 py-0.5 border border-[#4DBFA8]/30 uppercase tracking-widest";
        return;
      }

      // Stan ładowania (Loader AI)
      window.dietGenerationInProgress = true;
      document.querySelectorAll('.diet-dur-btn, .diet-generate-btn').forEach(button => {
        button.disabled = true;
      });

      titleDisplay.textContent = 'Tworzymy Twój jadłospis...';
      statusTag.textContent = 'PRZYGOTOWYWANIE';
      statusTag.className = "font-cyber text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 border border-amber-500/30 uppercase tracking-widest";

      const durationName = currentDietDuration === 7 ? "tydzień (7 dni)" : (currentDietDuration === 3 ? "3 dni" : "dziś");
      container.innerHTML = `
      <div class="py-8 text-center space-y-3">
        <div class="inline-block w-8 h-8 border-4 border-t-transparent border-[#4DBFA8] rounded-full animate-spin"></div>
        <p style="font-size:0.92rem;color:var(--warm-gray);font-weight:600;">Przygotowujemy plan na ${durationName}. Zwykle trwa to kilkanaście sekund.</p>
      </div>
    `;

      // Weryfikacja obecności klucza API
      if (!aiConfig.isConfigured) {
        window.dietGenerationInProgress = false;
        document.querySelectorAll('.diet-dur-btn, .diet-generate-btn').forEach(button => {
          button.disabled = false;
        });
        titleDisplay.textContent = 'Nie można teraz utworzyć jadłospisu';
        statusTag.textContent = 'USŁUGA NIEDOSTĘPNA';
        statusTag.className = "font-cyber text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 border border-red-500/30 uppercase tracking-widest";
        container.innerHTML = `
        <p class="text-sm text-red-400 p-4 border border-red-500/20 bg-red-500/5 font-mono">
          CRITICAL ERROR: AI nie jest skonfigurowane.<br/>
          Ustaw klucz OpenRouter i model w panelu administratora.
        </p>
      `;
        return;
      }

      // Budowanie intencji (Prompt Engineering) dla dietetycznego LLM
      let preferencesPrompt = activePrefs.length > 0
        ? `Wskazania i restrykcje zdrowotne pacjenta: ${activePrefs.join(', ')}.`
        : 'Brak restrykcji, zastosuj standardową dietę przeciwzapalną.';
      if (healthIssues) {
        preferencesPrompt += ` Dodatkowo pacjent zgłasza następujące dolegliwości i stan zdrowia: "${healthIssues}". Dostosuj dietę tak, aby wspierać leczenie tych dolegliwości i była bezpieczna dla pacjenta.`;
      }

      let durationPrompt = "";
      let formatPrompt = "";
      if (currentDietDuration === 3) {
        durationPrompt = `Wygeneruj jadłospis dokładnie na 3 dni (Dzień 1, Dzień 2, Dzień 3).`;
        formatPrompt = `
        "days": [
          {
            "dayName": "Dzień 1",
            "meals": [
              {"type": "Śniadanie", "content": "Dokładny opis posiłku dopasowany do restrykcji"},
              {"type": "Obiad", "content": "Dokładny opis obiadu"},
              {"type": "Kolacja", "content": "Dokładny opis kolacji"}
            ]
          },
          {
            "dayName": "Dzień 2",
            "meals": [
              {"type": "Śniadanie", "content": "Dokładny opis posiłku"},
              {"type": "Obiad", "content": "Dokładny opis obiadu"},
              {"type": "Kolacja", "content": "Dokładny opis kolacji"}
            ]
          },
          {
            "dayName": "Dzień 3",
            "meals": [
              {"type": "Śniadanie", "content": "Dokładny opis posiłku"},
              {"type": "Obiad", "content": "Dokładny opis obiadu"},
              {"type": "Kolacja", "content": "Dokładny opis kolacji"}
            ]
          }
        ]
      `;
      } else if (currentDietDuration === 7) {
        durationPrompt = `Wygeneruj jadłospis dokładnie na cały tydzień (7 dni: Poniedziałek, Wtorek, Środa, Czwartek, Piątek, Sobota, Niedziela).`;
        formatPrompt = `
        "days": [
          {
            "dayName": "Poniedziałek",
            "meals": [
              {"type": "Śniadanie", "content": "Dokładny opis posiłlu dopasowany do restrykcji"},
              {"type": "Obiad", "content": "Dokładny opis obiadu"},
              {"type": "Kolacja", "content": "Dokładny opis kolacji"}
            ]
          },
          {
            "dayName": "Wtorek",
            "meals": [
              {"type": "Śniadanie", "content": "Dokładny opis posiłku"},
              {"type": "Obiad", "content": "Dokładny opis obiadu"},
              {"type": "Kolacja", "content": "Dokładny opis kolacji"}
            ]
          },
          {
            "dayName": "Środa",
            "meals": [
              {"type": "Śniadanie", "content": "Dokładny opis posiłku"},
              {"type": "Obiad", "content": "Dokładny opis obiadu"},
              {"type": "Kolacja", "content": "Dokładny opis kolacji"}
            ]
          },
          {
            "dayName": "Czwartek",
            "meals": [
              {"type": "Śniadanie", "content": "Dokładny opis posiłku"},
              {"type": "Obiad", "content": "Dokładny opis obiadu"},
              {"type": "Kolacja", "content": "Dokładny opis kolacji"}
            ]
          },
          {
            "dayName": "Piątek",
            "meals": [
              {"type": "Śniadanie", "content": "Dokładny opis posiłku"},
              {"type": "Obiad", "content": "Dokładny opis obiadu"},
              {"type": "Kolacja", "content": "Dokładny opis kolacji"}
            ]
          },
          {
            "dayName": "Sobota",
            "meals": [
              {"type": "Śniadanie", "content": "Dokładny opis posiłku"},
              {"type": "Obiad", "content": "Dokładny opis obiadu"},
              {"type": "Kolacja", "content": "Dokładny opis kolacji"}
            ]
          },
          {
            "dayName": "Niedziela",
            "meals": [
              {"type": "Śniadanie", "content": "Dokładny opis posiłku"},
              {"type": "Obiad", "content": "Dokładny opis obiadu"},
              {"type": "Kolacja", "content": "Dokładny opis kolacji"}
            ]
          }
        ]
      `;
      } else {
        durationPrompt = `Wygeneruj jadłospis na 1 dzień (dzisiejszy dzień tygodnia to: ${currentDay}). Dieta musi być unikalna dla tego dnia.`;
        formatPrompt = `
        "days": [
          {
            "dayName": "Dzisiaj",
            "meals": [
              {"type": "Śniadanie", "content": "Dokładny opis posiłku dopasowany do restrykcji"},
              {"type": "Obiad", "content": "Dokładny opis obiadu"},
              {"type": "Kolacja", "content": "Dokładny opis kolacji"}
            ]
          }
        ]
      `;
      }

      const systemPrompt = `
      Jesteś zaawansowanym systemem dietetycznym AI w aplikacji VitalFly dla seniorów (osób 50+).
      Twoim zadaniem jest wygenerowanie zbalansowanej, łatwostrawnej i przeciwzapalnej diety dla użytkownika aplikacji.
      
      Czas trwania: ${durationPrompt}
      ${preferencesPrompt}

      Zwróć odpowiedź w czystym formacie JSON (bez żadnych znaczników markdown typu \`\`\`json \`\`\`), który zawiera dokładnie taką strukturę pól:
      {
        "title": "Nazwa diety uwzględniająca preferencje i wybrany okres",
        "days": [
          ${formatPrompt.trim()}
        ],
        "shopping": ["Składnik 1", "Składnik 2", "Składnik 3", ...] // skonsolidowana, łączna lista zakupów na cały ten okres
      }
      Używaj prostych, tanich i łatwo dostępnych produktów w polskich sklepach. Podawaj krótkie opisy.
    `;

      try {
        let rawJsonText = await window.VitalFlyAI.requestText({
          route: 'diet',
          messages: [{ role: 'user', text: systemPrompt }]
        });

        rawJsonText = rawJsonText.replace(/^\`\`\`(?:json)?/i, '').replace(/\`\`\`$/, '').trim();
        const jsonStart = rawJsonText.indexOf('{');
        const jsonEnd = rawJsonText.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          rawJsonText = rawJsonText.slice(jsonStart, jsonEnd + 1);
        }

        // Parsowanie odpowiedzi z LLM
        const dietPlan = JSON.parse(rawJsonText);
        if (!dietPlan || !Array.isArray(dietPlan.days) || dietPlan.days.length === 0) {
          throw new Error('Model nie zwrócił kompletnego jadłospisu. Spróbuj wygenerować go ponownie.');
        }

        // Zapisujemy wygenerowaną dietę w localStorage
        localStorage.setItem(`kz_cached_diet_${currentDietDuration}`, JSON.stringify(dietPlan));
        
        let dietCount = parseInt(localStorage.getItem('kz_generated_diets_count') || '0');
        localStorage.setItem('kz_generated_diets_count', dietCount + 1);
        if (typeof updateDashboardStats === 'function') updateDashboardStats();
        localStorage.setItem(`kz_cached_diet_day_${currentDietDuration}`, currentDay);
        localStorage.setItem(`kz_cached_diet_profile_key_${currentDietDuration}`, dietProfileCacheKey);
        localStorage.setItem(`kz_cached_diet_time_${currentDietDuration}`, Date.now().toString());

        displayDietPlan(dietPlan);

      } catch (error) {
        console.error("LLM Generation Error:", error);
        titleDisplay.textContent = 'Nie udało się utworzyć jadłospisu';
        statusTag.textContent = 'SPRÓBUJ PONOWNIE';
        statusTag.className = "font-cyber text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 border border-red-500/30 uppercase tracking-widest";
        container.innerHTML = `
        <div style="text-align:center;padding:1.5rem;">
          <p style="color:#b42318;font-size:0.95rem;font-weight:600;margin-bottom:1rem;">${VFSecurity.escapeHTML(error?.message || 'Wystąpił problem podczas przygotowywania planu.')}</p>
          <button onclick="renderPersonalizedDiet(true)" class="btn-cta diet-generate-btn" style="display:inline-block;font-size:0.88rem;padding:0.6rem 1.5rem;">Spróbuj ponownie</button>
        </div>
      `;
      } finally {
        window.dietGenerationInProgress = false;
        document.querySelectorAll('.diet-dur-btn, .diet-generate-btn').forEach(button => {
          button.disabled = false;
        });
      }
    }

    // Funkcja drukowania i zapisywania do PDF spersonalizowanej diety AI
    function printAIDiet() {
      const currentDietDuration = parseInt(localStorage.getItem('kz_diet_duration') || '1');
      const cached = localStorage.getItem(`kz_cached_diet_${currentDietDuration}`);
      if (!cached) {
        showToast('❌ Najpierw wygeneruj dietę, aby móc ją wydrukować!');
        return;
      }

      try {
        const dietPlan = JSON.parse(cached);
        const patientName = localStorage.getItem('kz_name') || 'Pacjent VitalFly';

        // Kompatybilność wsteczna ze starą strukturą jednodniową
        if (dietPlan.meals && !dietPlan.days) {
          dietPlan.days = [{
            dayName: 'Dzisiaj',
            meals: dietPlan.meals
          }];
        }

        const w = window.open('', '_blank');
        w.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>VitalFly – Jadłospis AI (${VFSecurity.escapeHTML(dietPlan.title)})</title>
          <style>
            body {
              font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
              color: #0B3934;
              line-height: 1.6;
              max-width: 750px;
              margin: 0 auto;
              padding: 2.5rem;
            }
            .header-print {
              border-bottom: 3px solid #3EAE96;
              padding-bottom: 1rem;
              margin-bottom: 1.5rem;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .title-print {
              font-size: 1.8rem;
              font-weight: 800;
              margin: 0;
            }
            .patient-name {
              font-size: 0.95rem;
              color: #666;
              margin: 0;
            }
            .day-section {
              margin-bottom: 2.5rem;
              page-break-inside: avoid;
            }
            .day-title {
              font-size: 1.3rem;
              font-weight: 700;
              color: #0B3934;
              margin-top: 1.5rem;
              margin-bottom: 1rem;
              background: #F0FAF7;
              padding: 0.5rem 1rem;
              border-radius: 8px;
            }
            .meal-box {
              border-bottom: 1px solid #E5EDE9;
              padding: 1rem 0;
            }
            .meal-box:last-of-type {
              border-bottom: none;
            }
            .meal-type {
              font-size: 0.85rem;
              font-weight: 800;
              color: #3EAE96;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin-bottom: 0.25rem;
            }
            .meal-content {
              font-size: 1.05rem;
              color: #2D3748;
              font-weight: 500;
            }
            .shopping-box {
              margin-top: 2.5rem;
              padding: 1.5rem;
              background: #F0FAF7;
              border: 1px solid #C5EDE5;
              border-radius: 14px;
              page-break-inside: avoid;
            }
            .shopping-title {
              font-size: 0.95rem;
              font-weight: 800;
              color: #0B3934;
              margin-top: 0;
              margin-bottom: 0.75rem;
              text-transform: uppercase;
              letter-spacing: 0.04em;
            }
            .shopping-list {
              list-style: none;
              padding: 0;
              margin: 0;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 0.5rem;
            }
            .shopping-list li {
              font-size: 0.95rem;
              color: #2D3748;
              background: #fff;
              border: 1px solid #E5EDE9;
              padding: 0.4rem 0.75rem;
              border-radius: 6px;
              display: flex;
              align-items: center;
              gap: 0.5rem;
            }
            .footer-print {
              margin-top: 3.5rem;
              padding-top: 1.5rem;
              border-top: 1px solid #E5EDE9;
              text-align: center;
              font-size: 0.82rem;
              color: #888;
            }
            @media print {
              body { padding: 1rem; }
              .shopping-box { background: #fff; border-color: #ccc; }
            }
          </style>
        </head>
        <body>
          <div class="header-print">
            <div>
              <h1 class="title-print">VitalFly – Jadłospis AI</h1>
              <p class="patient-name">Dla pacjenta: <strong>${VFSecurity.escapeHTML(patientName)}</strong></p>
            </div>
            <div style="font-size:0.85rem; text-align:right; color:#888;">
              Długość planu: ${dietPlan.days.length > 1 ? dietPlan.days.length + ' dni' : '1 dzień'}<br>
              vitalfly.pl
            </div>
          </div>
          
          <div style="font-size:1.4rem; font-weight:700; color:#0B3934; margin-bottom:1.5rem;">🥗 Plan: ${VFSecurity.escapeHTML(dietPlan.title)}</div>
          
          <div>
            ${dietPlan.days.map(day => `
              <div class="day-section">
                <div class="day-title">📅 ${VFSecurity.escapeHTML(day.dayName)}</div>
                <div>
                  ${day.meals.map(m => `
                    <div class="meal-box">
                      <div class="meal-type">${VFSecurity.escapeHTML(m.type)}</div>
                      <div class="meal-content">${VFSecurity.escapeHTML(m.content)}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
          
          ${dietPlan.shopping && dietPlan.shopping.length > 0 ? `
            <div class="shopping-box">
              <h3 class="shopping-title">🛒 Lista zakupów (${dietPlan.days.length > 1 ? 'na cały okres' : 'na dziś'})</h3>
              <ul class="shopping-list">
                ${dietPlan.shopping.map(s => `<li><span style="font-size:1.1rem; color:#bbb;">☐</span> ${VFSecurity.escapeHTML(s)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          <div class="footer-print">
            Generowane przez VitalFly Cognitive AI • Życzymy zdrowia i smacznego!
          </div>
        </body>
        </html>
      `);
        w.document.close();
        setTimeout(() => {
          w.print();
        }, 500);
      } catch (e) {
        console.error(e);
        showToast('❌ Błąd przygotowywania wydruku!');
      }
    }

    /* ── MEDICATIONS ── */
    function renderMeds() {
      const list = document.getElementById('medList');
      if (!list) return;
      updateMedStatPill();
      if (APP_DATA.medications.length === 0) {
        list.innerHTML = `<div class="empty-meds">💊 Nie dodałeś/aś jeszcze żadnych leków.<br/><span style="font-size:.9rem;margin-top:.5rem;display:block;">Użyj formularza powyżej, aby dodać pierwszy lek.</span></div>`;
        return;
      }
      list.innerHTML = APP_DATA.medications.map((m, i) => `
      <div class="med-item" id="mitem-${i}">
        <div class="med-icon">💊</div>
        <div class="med-info">
          <div class="med-name">${VFSecurity.escapeHTML(m.name)}</div>
          <div class="med-time">
            🕐 ${VFSecurity.escapeHTML(m.time)}
            ${m.dose ? `<span class="med-dose">${VFSecurity.escapeHTML(m.dose)}</span>` : ''}
            ${m.note ? `<span style="font-size:.85rem;color:#8A9BB0;">– ${VFSecurity.escapeHTML(m.note)}</span>` : ''}
          </div>
        </div>
        <button class="med-del" onclick="deleteMed(${i})" title="Usuń lek">🗑</button>
      </div>
    `).join('');
    }

    function updateMedStatPill() {
      const el = document.getElementById('med-count-stat');
      if (el) el.textContent = APP_DATA.medications.length;
      updateLiveHelpPopup();
    }


    async function addMedication() {
      const name = document.getElementById('med-name-input').value.trim();
      const dose = document.getElementById('med-dose-input').value.trim();
      const time = document.getElementById('med-time-input').value;
      const note = document.getElementById('med-note-input').value.trim();
      if (!name) { document.getElementById('med-name-input').style.borderColor = '#E05252'; return; }
      if (!time) { document.getElementById('med-time-input').style.borderColor = '#E05252'; return; }
      document.getElementById('med-name-input').style.borderColor = '';
      document.getElementById('med-time-input').style.borderColor = '';
      const medId = Date.now();
      APP_DATA.medications.push({ name, dose, time, note, id: medId });
      saveMeds();

      // Powiadomienia Natywne (Capacitor)
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
        try {
          let perm = await window.Capacitor.Plugins.LocalNotifications.checkPermissions();
          if (perm.display !== 'granted') perm = await window.Capacitor.Plugins.LocalNotifications.requestPermissions();
          if (perm.display === 'granted') {
            const [hh, mm] = time.split(':');
            await window.Capacitor.Plugins.LocalNotifications.schedule({
              notifications: [{
                id: Math.floor(medId % 2147483647),
                title: `💊 Czas na lek: ${name}`,
                body: `Dawka: ${dose || '-'} ${note ? '(' + note + ')' : ''}`,
                schedule: { on: { hour: parseInt(hh), minute: parseInt(mm) }, repeats: true }
              }]
            });
          }
        } catch (e) { console.error('LocalNotifications błąd:', e); }
      }

      // Clear form
      document.getElementById('med-name-input').value = '';
      document.getElementById('med-dose-input').value = '';
      document.getElementById('med-time-input').value = '08:00';
      document.getElementById('med-note-input').value = '';
      renderMeds();
      loadDogTag();
      showToast(`✅ Lek „${name}" dodany! Przypomnę Ci o godz. ${time}.`);
    }

    async function deleteMed(i) {
      const name = APP_DATA.medications[i]?.name;
      const medId = APP_DATA.medications[i]?.id;
      APP_DATA.medications.splice(i, 1);
      saveMeds();
      renderMeds();
      loadDogTag();
      if (name) showToast(`🗑 Usunięto lek „${name}"`);

      // Usunięcie powiadomienia natywnego
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications && medId) {
        try {
          await window.Capacitor.Plugins.LocalNotifications.cancel({
            notifications: [{ id: Math.floor(medId % 2147483647) }]
          });
        } catch (e) { }
      }
    }

    /* ── NOTIFICATIONS ── */
    function checkNotifStatus() {
      if (!checkNotifSupport()) return;
      if (Notification.permission === 'granted') {
        document.getElementById('notifBanner').style.display = 'none';
        const g = document.getElementById('notifGranted');
        if (g) { g.classList.add('show'); }
        APP_DATA.notifPermission = true;
      }
    }

    async function requestNotifPermission() {
      if (!checkNotifSupport()) {
        showToast('⚠️ Twoja przeglądarka nie obsługuje powiadomień.');
        return;
      }

      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
        const perm = await window.Capacitor.Plugins.LocalNotifications.requestPermissions();
        if (perm.display === 'granted') {
          APP_DATA.notifPermission = true;
          document.getElementById('notifBanner').style.display = 'none';
          const g = document.getElementById('notifGranted');
          if (g) g.classList.add('show');
          showToast('🔔 Powiadomienia włączone! Będę przypominał o lekach.');

          window.Capacitor.Plugins.LocalNotifications.schedule({
            notifications: [{
              title: "🌿 VitalFly",
              body: "Powiadomienia działają! Będę przypominał Ci o lekach o wybranej porze.",
              id: Date.now() % 2147483647,
              schedule: { at: new Date(Date.now() + 1000) }
            }]
          });
        } else {
          showToast('⚠️ Nie przyznano zgody na powiadomienia.');
        }
        return;
      }

      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          APP_DATA.notifPermission = true;
          document.getElementById('notifBanner').style.display = 'none';
          const g = document.getElementById('notifGranted');
          if (g) g.classList.add('show');
          showToast('🔔 Powiadomienia włączone! Będę przypominał o lekach.');
          setTimeout(() => {
            new Notification('🌿 VitalFly', {
              body: 'Powiadomienia działają! Będę przypominał Ci o lekach o wybranej porze.',
              icon: 'https://via.placeholder.com/64/4DBFA8/white?text=KZ'
            });
          }, 1000);
        } else {
          showToast('⚠️ Nie przyznano zgody na powiadomienia.');
        }
      });
    }

    /* ── MED CHECKER (co minutę sprawdza godzinę) ── */
    function startMedChecker() {
      checkMedAlarms(); // Od razu sprawdź
      setInterval(checkMedAlarms, 60000); // Potem co minutę
    }

    function checkMedAlarms() {
      if (!APP_DATA.notifPermission && Notification.permission !== 'granted') return;
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      APP_DATA.medications.forEach(med => {
        if (med.time === hhmm) {
          // Browser notification
          if (Notification.permission === 'granted') {
            new Notification(`💊 Czas na lek: ${med.name}`, {
              body: `Dawka: ${med.dose || '–'}${med.note ? ' (' + med.note + ')' : ''}`,
              icon: 'https://via.placeholder.com/64/4DBFA8/white?text=💊',
              tag: 'med-' + med.id
            });
          }
          // In-app modal
          showMedModal(`${med.name}${med.dose ? ' – ' + med.dose : ''}`);
        }
      });
    }

    /* ── TOAST ── */
    let toastTimeout;
    function showToast(msg, duration = 4000) {
      const box = document.getElementById('medToast');
      const body = document.getElementById('medToastText');
      if (!box || !body) return;

      body.textContent = msg;
      box.classList.add('show');
      document.body.classList.add('toast-open');

      clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => {
        box.classList.remove('show');
        document.body.classList.remove('toast-open');
      }, duration);
    }

    function showMedModal(msg) {
      document.getElementById('medModalText').textContent = msg;
      const modal = document.getElementById('medModal');
      if (typeof window.openAccessibleModal === 'function') {
        window.openAccessibleModal(modal, modal?.querySelector('button'));
      } else {
        modal?.classList.add('open');
        modal?.setAttribute('aria-hidden', 'false');
      }
    }
    function closeMedModal() {
      const modal = document.getElementById('medModal');
      if (typeof window.closeAccessibleModal === 'function') {
        window.closeAccessibleModal(modal);
      } else {
        modal?.classList.remove('open');
        modal?.setAttribute('aria-hidden', 'true');
      }
    }

    function renderLikedTab() {
      const grid = document.getElementById('likedVideoGrid');
      if (!grid) return;

      const liked = APP_DATA.videos.filter(v => isLiked(v.id));
      const likedDiets = JSON.parse(localStorage.getItem('kz_liked_diets') || '[]');
      const likedShopping = JSON.parse(localStorage.getItem('kz_liked_shopping') || '[]');

      const notice = document.getElementById('likedLibraryNotice');
      if (notice) {
        notice.textContent = (liked.length || likedDiets.length || likedShopping.length)
          ? 'Twoje polubione ćwiczenia, jadłospisy i listy zakupów.'
          : 'Polub ćwiczenie, jadłospis lub listę zakupów serduszkiem, a pojawią się tutaj.';
      }

      let html = '';

      if (liked.length > 0) {
        html += `
        <div style="grid-column:1/-1; margin-top:0.5rem; margin-bottom:0.75rem;">
          <h3 style="font-family:'Lora',serif; color:var(--navy); font-size:1.2rem; display:flex; align-items:center; gap:0.5rem; font-weight:700;">🎬 Polubione ćwiczenia</h3>
        </div>
        ${liked.map(v => renderVideoCard(v, 'zapisane w ulubionych')).join('')}
      `;
      }

      if (likedDiets.length > 0) {
        html += `
        <div style="grid-column:1/-1; margin-top:1.5rem; margin-bottom:0.75rem;">
          <h3 style="font-family:'Lora',serif; color:var(--navy); font-size:1.2rem; display:flex; align-items:center; gap:0.5rem; font-weight:700;">🥗 Polubione jadłospisy</h3>
        </div>
        ${likedDiets.map((diet, idx) => `
          <div class="diet-card" style="grid-column: 1 / -1; padding: 1.5rem; border-radius: 16px; background: rgba(255,255,255,0.78); border: 1px solid rgba(0,0,0,0.06); position: relative; margin-bottom: 0.5rem;">
            <button onclick="removeLikedDiet(${idx})" style="position:absolute; top:1rem; right:1rem; background:transparent; border:none; font-size:1.3rem; cursor:pointer;" title="Usuń z ulubionych">❤️</button>
            <h4 style="font-weight:700; color:var(--navy); font-size:1.05rem; margin-bottom:0.75rem; padding-right:2rem;">${VFSecurity.escapeHTML(diet.title)} (${diet.days.length > 1 ? diet.days.length + ' dni' : '1 dzień'})</h4>
            <div class="diet-ai-meals-day-content" style="max-height: 200px; overflow-y: auto; padding-right: 0.5rem;">
              ${diet.days.map(day => `
                <div style="font-weight:700; font-size:0.85rem; color:#4DBFA8; margin-top:0.5rem; margin-bottom:0.25rem; text-transform:uppercase;">${VFSecurity.escapeHTML(day.dayName)}</div>
                ${day.meals.map(meal => `
                  <div class="diet-ai-meal-row" style="margin-bottom:0.2rem;">
                    <span class="diet-ai-meal-type" style="font-size:0.75rem; font-weight:700;">[ ${VFSecurity.escapeHTML(meal.type)} ]</span>
                    <span class="diet-ai-meal-content" style="font-size:0.85rem;">${VFSecurity.escapeHTML(meal.content)}</span>
                  </div>
                `).join('')}
              `).join('')}
            </div>
          </div>
        `).join('')}
      `;
      }

      if (likedShopping.length > 0) {
        html += `
        <div style="grid-column:1/-1; margin-top:1.5rem; margin-bottom:0.75rem;">
          <h3 style="font-family:'Lora',serif; color:var(--navy); font-size:1.2rem; display:flex; align-items:center; gap:0.5rem; font-weight:700;">🛒 Polubione listy zakupów</h3>
        </div>
        ${likedShopping.map((shop, idx) => `
          <div class="diet-card" style="grid-column: 1 / -1; padding: 1.5rem; border-radius: 16px; background: rgba(255,255,255,0.78); border: 1px solid rgba(0,0,0,0.06); position: relative; margin-bottom: 0.5rem;">
            <button onclick="removeLikedShopping(${idx})" style="position:absolute; top:1rem; right:1rem; background:transparent; border:none; font-size:1.3rem; cursor:pointer;" title="Usuń z ulubionych">❤️</button>
            <h4 style="font-weight:700; color:var(--navy); font-size:1.05rem; margin-bottom:0.75rem; padding-right:2rem;">${VFSecurity.escapeHTML(shop.title)}</h4>
            <div class="diet-ai-shopping-tags-wrapper" style="margin-top:0.5rem;">
              ${shop.items.map(item => `<span class="diet-ai-shopping-tag">${VFSecurity.escapeHTML(item)}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      `;
      }

      if (!liked.length && !likedDiets.length && !likedShopping.length) {
        grid.innerHTML = `<div class="video-empty-state" style="grid-column: 1 / -1;">❤️ Nie masz jeszcze żadnych polubionych pozycji.<br><span style="font-weight:600; color:#8A9BB0;">Kliknij serduszko na ćwiczeniu, jadłospisie lub liście zakupów.</span></div>`;
      } else {
        grid.innerHTML = html;
      }
    }

    window.renderLikedTab = renderLikedTab;
