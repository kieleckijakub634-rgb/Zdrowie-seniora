    function adminLogin() {
      const pass = document.getElementById('admin-pass-input').value;
      if (pass === ADMIN_PASS) {
        document.getElementById('adminLoginView').style.display = 'none';
        document.getElementById('adminPanelView').style.display = 'block';
        renderAdminContent();
        loadModuleSettings();
        updateAdminStats();
      } else {
        document.getElementById('admin-login-err').style.display = 'block';
      }
    }

    function adminLogout() {
      document.getElementById('adminLoginView').style.display = 'block';
      document.getElementById('adminPanelView').style.display = 'none';
      document.getElementById('admin-pass-input').value = '';
    }

    function closeAdmin() {
      document.getElementById('adminShell').style.display = 'none';
    }

    function switchAdminTab(name, btn) {
      document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
      document.getElementById('atab-' + name).classList.add('active');
      btn.classList.add('active');
    }

    function updateAdminStats() {
      const meds = JSON.parse(localStorage.getItem('kz_medications') || '[]');
      const el = document.getElementById('a-stat-meds');
      if (el) el.textContent = meds.length;
      const users = document.getElementById('a-stat-users');
      if (users) users.textContent = localStorage.getItem('kz_name') ? '1' : '0';
    }

    async function saveData(type) {
      if (type === 'videos') {
        localStorage.setItem('kz_videos', JSON.stringify(APP_DATA.videos));
        renderVideos();
      } else if (type === 'diets') {
        localStorage.setItem('kz_diets', JSON.stringify(APP_DATA.diets));
        renderDiets();
      }
      showToast('⏳ Zapisywanie do chmury...');
      const ok = await saveToCloud();
      if (ok) showToast('✅ Zmiany zapisane w chmurze (widoczne dla wszystkich)!');
    }

    function addAdminVideo() {
      APP_DATA.videos.push({ id: Date.now(), title: 'Nowy Film', duration: '10 min', tag: 'Nowe', emoji: '🎥', desc: 'Opis filmu...', day: 'Codziennie', url: '' });
      renderAdminContent();
      saveData('videos');
    }

    function delAdminVideo(i) {
      if (confirm('Na pewno chcesz usunąć ten film? Ta operacja jest nieodwracalna.')) {
        APP_DATA.videos.splice(i, 1);
        renderAdminContent();
        saveData('videos');
      }
    }


    async function saveAdminPrices() {
      const pm = document.getElementById('admin-price-monthly').value;
      const py = document.getElementById('admin-price-yearly').value;
      const promoE = document.getElementById('admin-promo-enabled').checked ? '1' : '0';
      const promoP = document.getElementById('admin-promo-percent').value;
      const presaleE = document.getElementById('admin-presale-enabled').checked ? '1' : '0';
      const presalePm = document.getElementById('admin-presale-price-monthly').value;
      const presalePy = document.getElementById('admin-presale-price-yearly').value;
      
      if (pm) localStorage.setItem('kz_price_monthly', pm);
      if (py) localStorage.setItem('kz_price_yearly', py);
      localStorage.setItem('kz_promo_enabled', promoE);
      if (promoP) localStorage.setItem('kz_promo_percent', promoP);
      localStorage.setItem('kz_presale_enabled', presaleE);
      if (presalePm) localStorage.setItem('kz_presale_price_monthly', presalePm);
      if (presalePy) localStorage.setItem('kz_presale_price_yearly', presalePy);
      
      if (typeof switchPlan === 'function' && typeof currentPlan !== 'undefined') switchPlan(currentPlan);
      if (typeof updateDynamicPrices === 'function') updateDynamicPrices();
      if (typeof loadPlanSettings === 'function') loadPlanSettings();

      showToast('⏳ Zapisywanie cennika do chmury...');
      const ok = await saveToCloud();
      if (ok) showToast('💰 Cennik pomyślnie zaktualizowany na serwerze!');
    }

    function loadAdminPrices() {
      const pm = document.getElementById('admin-price-monthly');
      const py = document.getElementById('admin-price-yearly');
      const promoE = document.getElementById('admin-promo-enabled');
      const promoP = document.getElementById('admin-promo-percent');
      const presaleE = document.getElementById('admin-presale-enabled');
      const presalePm = document.getElementById('admin-presale-price-monthly');
      const presalePy = document.getElementById('admin-presale-price-yearly');
      
      if (pm) pm.value = localStorage.getItem('kz_price_monthly') || '39';
      if (py) py.value = localStorage.getItem('kz_price_yearly') || '390';
      if (promoE) promoE.checked = localStorage.getItem('kz_promo_enabled') === '1';
      if (promoP) promoP.value = localStorage.getItem('kz_promo_percent') || '10';
      if (presaleE) presaleE.checked = localStorage.getItem('kz_presale_enabled') === '1';
      if (presalePm) presalePm.value = localStorage.getItem('kz_presale_price_monthly') || '29';
      if (presalePy) presalePy.value = localStorage.getItem('kz_presale_price_yearly') || '290';
    }

    function renderAdminContent() {
      const vList = document.getElementById('admin-videos-list');
      if (vList) vList.innerHTML = APP_DATA.videos.map((v, i) => `
      <div style="background:#f8f9fa;border:1px solid #e2e8f0;border-radius:12px;padding:1rem;margin-bottom:1rem;position:relative;">
        <button onclick="delAdminVideo(${i})" style="position:absolute;top:1rem;right:1rem;background:none;border:none;color:#e53e3e;cursor:pointer;font-weight:bold;padding:0;">✕ Usuń</button>
        <div style="display:flex;gap:.5rem;margin-bottom:.5rem;padding-right:4rem;flex-wrap:wrap;">
          <input class="admin-input" style="width:4rem;text-align:center;" value="${v.emoji}" onchange="APP_DATA.videos[${i}].emoji=this.value" placeholder="🎥" />
          <input class="admin-input" style="flex:1;min-width:150px;" value="${v.title}" onchange="APP_DATA.videos[${i}].title=this.value" placeholder="Tytuł filmu" />
          <input class="admin-input" style="width:7rem;" value="${v.tag}" onchange="APP_DATA.videos[${i}].tag=this.value" placeholder="Tag" />
        </div>
        <div style="display:flex;gap:.5rem;margin-bottom:.5rem;flex-wrap:wrap;">
          <input class="admin-input" style="width:6rem;" value="${v.duration}" onchange="APP_DATA.videos[${i}].duration=this.value" placeholder="15 min" />
          <input class="admin-input" style="width:8rem;" value="${v.day}" onchange="APP_DATA.videos[${i}].day=this.value" placeholder="Dzień" />
          <input class="admin-input" style="flex:1;min-width:150px;" value="${v.desc}" onchange="APP_DATA.videos[${i}].desc=this.value" placeholder="Krótki opis..." />
        </div>
        
        <div style="border:2px dashed #DDE6F0; border-radius:8px; padding:0.4rem; text-align:center; font-size:0.8rem; color:var(--warm-gray); transition:all 0.2s;"
          ondragover="event.preventDefault(); this.style.borderColor='#4DBFA8'; this.style.background='#F0F8F5';" 
          ondragleave="this.style.borderColor='#DDE6F0'; this.style.background='transparent';" 
          ondrop="handleVideoDrop(event, ${i})">
          <input class="admin-input" style="width:100%; padding:0.3rem; margin-bottom:0.2rem; font-size:0.8rem;" value="${v.url && v.url.startsWith('blob:') ? '(Wgrano plik lokalny)' : (v.url || '')}" onchange="if(!this.value.includes('Wgrano')){APP_DATA.videos[${i}].url=this.value}" placeholder="Link YouTube lub przeciągnij plik .mp4 z komputera tutaj" />
        </div>
        <div style="text-align:right;margin-top:.5rem;"><button class="admin-btn" style="padding:.4rem 1rem;" onclick="saveData('videos')">Zapisz ten film</button></div>
      </div>
    `).join('') + `<button class="admin-btn" style="width:100%;background:#e2e8f0;color:#2d3748;margin-top:.5rem;" onclick="addAdminVideo()">+ Dodaj nowy film</button>`;


      loadAdminPrices();
    }

    async function toggleModule(name, enabled) {
      localStorage.setItem('kz_mod_' + name, enabled ? '1' : '0');
      if (name === 'shop') {
        const shopTab = document.querySelector('.video-library-tab[onclick*="\'shop\'"]');
        if (shopTab) shopTab.style.display = enabled ? '' : 'none';
      } else {
        const tabBtn = document.querySelector(`.tab-btn[onclick*="'${name}'"]`);
        if (tabBtn) tabBtn.style.display = enabled ? '' : 'none';
      }
      if (typeof saveToCloud === 'function') {
        showToast('⏳ Zapisywanie konfiguracji modułów w chmurze...');
        const ok = await saveToCloud();
        if (ok) showToast('✅ Ustawienia modułów zaktualizowane globalnie!');
      }
    }

    function loadModuleSettings() {
      ['videos', 'diets', 'meds', 'settings', 'shop'].forEach(name => {
        const enabled = localStorage.getItem('kz_mod_' + name) !== '0';
        if (name === 'shop') {
          const shopTab = document.querySelector('.video-library-tab[onclick*="\'shop\'"]');
          if (shopTab) shopTab.style.display = enabled ? '' : 'none';
        } else {
          const tabBtn = document.querySelector('.tab-btn[onclick*="\'' + name + '\'"]');
          if (tabBtn) tabBtn.style.display = enabled ? '' : 'none';
        }
        const adminChk = document.getElementById('mod-' + name);
        if (adminChk) adminChk.checked = enabled;
      });
      const gkInput = document.getElementById('admin-gemini-key');
      if (gkInput) gkInput.value = localStorage.getItem('kz_gemini_api_key') || '';
    }

    async function saveAnnounce() {
      const txt = document.getElementById('announce-text')?.value.trim();
      if (!txt) return;
      localStorage.setItem('kz_announce', txt);
      showToast('⏳ Zapisywanie w chmurze...');
      const ok = await saveToCloud();
      if (ok) showToast('📢 Ogłoszenie zapisane w chmurze! Widoczne od razu.');
    }

    async function clearAnnounce() {
      localStorage.removeItem('kz_announce');
      const el = document.getElementById('announce-text');
      if (el) el.value = '';
      showToast('⏳ Usuwanie z chmury...');
      const ok = await saveToCloud();
      if (ok) showToast('🗑 Ogłoszenie usunięte na stałe.');
    }

    /* ── ADMIN DRAG & DROP ── */
    function handleVideoDrop(e, index) {
      e.preventDefault();
      e.currentTarget.style.borderColor = '#DDE6F0';
      e.currentTarget.style.background = 'transparent';
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('video/')) {
        const localUrl = URL.createObjectURL(file);
        APP_DATA.videos[index].url = localUrl;
        renderAdminContent();

        alert('🎬 Plik .mp4 załadowany do odtwarzacza!\n\nUWAGA: Ponieważ platforma znajduje się w trybie wdrożeniowym bez serwera bazodanowego, ten plik ładuje się bezpośrednio z Twojego dysku (zniknie po odświeżeniu). W pełnej wersji ten plik fizycznie wyśle się na serwer.');
      } else {
        showToast('❌ Możesz upuścić tylko plik wideo (.mp4)');
      }
    }

    /* Patch showApp — zapisz sesję i init ustawień */
    const _origShowApp = showApp;
    window.showApp = function (userName) {
      asyncSetItem('kz_session', JSON.stringify({ name: userName, plan: localStorage.getItem('kz_plan') || 'monthly', ts: Date.now() }));
      _origShowApp(userName);
      setTimeout(() => { initSettings(); showAnnounceIfExists(); }, 100);
    };

    /* Przy starcie sprawdź czy jest aktywna sesja */
    window.addEventListener('DOMContentLoaded', async () => {
      let sessionStr = localStorage.getItem('kz_session');
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
        try {
          const capSession = await window.Capacitor.Plugins.Preferences.get({ key: 'kz_session' });
          if (capSession && capSession.value) {
            sessionStr = capSession.value;
            localStorage.setItem('kz_session', sessionStr);
          }
        } catch (e) {
          console.error("Błąd odczytu sesji z Preferences:", e);
        }
      }

      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          if (session && session.name) {
            showApp(session.name);
          }
        } catch (e) {
          console.error("Błąd wczytywania sesji:", e);
        }
      }

      syncFromCloud(); // non-blocking fetch from Supabase

      /* Sprawdź hash #admin */
      if (window.location.hash === '#admin') { openAdmin(); }
    });

    /* ── UWIELBIANE DIETY I LISTY ZAKUPÓW ── */
    function isDietLiked(dietTitle) {
      const liked = JSON.parse(localStorage.getItem('kz_liked_diets') || '[]');
      return liked.some(d => d.title === dietTitle);
    }

    window.toggleLikeCurrentDiet = function () {
      const currentDietDuration = parseInt(localStorage.getItem('kz_diet_duration') || '1');
      const cached = localStorage.getItem(`kz_cached_diet_${currentDietDuration}`);
      if (!cached) return;
      try {
        const dietPlan = JSON.parse(cached);
        let liked = JSON.parse(localStorage.getItem('kz_liked_diets') || '[]');
        const index = liked.findIndex(d => d.title === dietPlan.title);
        if (index > -1) {
          liked.splice(index, 1);
          showToast('💔 Usunięto jadłospis z ulubionych');
        } else {
          liked.push(dietPlan);
          showToast('❤️ Dodano jadłospis do ulubionych');
        }
        localStorage.setItem('kz_liked_diets', JSON.stringify(liked));
        updateDietLikeBtn();
        syncToCloud();
      } catch (e) {
        console.error(e);
      }
    };

    window.updateDietLikeBtn = function () {
      const btn = document.getElementById('diet-like-btn');
      if (!btn) return;
      const currentDietDuration = parseInt(localStorage.getItem('kz_diet_duration') || '1');
      const cached = localStorage.getItem(`kz_cached_diet_${currentDietDuration}`);
      if (!cached) {
        btn.style.display = 'none';
        return;
      }
      try {
        const dietPlan = JSON.parse(cached);
        btn.style.display = 'block';
        if (isDietLiked(dietPlan.title)) {
          btn.textContent = '❤️';
        } else {
          btn.textContent = '🤍';
        }
      } catch (e) {
        btn.style.display = 'none';
      }
    };

    function isShoppingLiked(title) {
      const liked = JSON.parse(localStorage.getItem('kz_liked_shopping') || '[]');
      return liked.some(s => s.title === title);
    }

    window.toggleLikeShopping = function () {
      const currentDietDuration = parseInt(localStorage.getItem('kz_diet_duration') || '1');
      const cached = localStorage.getItem(`kz_cached_diet_${currentDietDuration}`);
      if (!cached) return;
      try {
        const dietPlan = JSON.parse(cached);
        if (!dietPlan.shopping || dietPlan.shopping.length === 0) return;

        const shoppingTitle = `Lista zakupów z jadłospisu: ${dietPlan.title}`;
        let liked = JSON.parse(localStorage.getItem('kz_liked_shopping') || '[]');
        const index = liked.findIndex(s => s.title === shoppingTitle);

        if (index > -1) {
          liked.splice(index, 1);
          showToast('💔 Usunięto listę zakupów z ulubionych');
        } else {
          liked.push({
            title: shoppingTitle,
            items: dietPlan.shopping
          });
          showToast('❤️ Dodano listę zakupów do ulubionych');
        }
        localStorage.setItem('kz_liked_shopping', JSON.stringify(liked));

        displayDietPlan(dietPlan);
        syncToCloud();
      } catch (e) {
        console.error(e);
      }
    };

    window.removeLikedDiet = function (idx) {
      let liked = JSON.parse(localStorage.getItem('kz_liked_diets') || '[]');
      liked.splice(idx, 1);
      localStorage.setItem('kz_liked_diets', JSON.stringify(liked));
      showToast('💔 Usunięto jadłospis z ulubionych');
      if (typeof renderLikedTab === 'function') renderLikedTab();
      updateDietLikeBtn();
      syncToCloud();
    };

    window.removeLikedShopping = function (idx) {
      let liked = JSON.parse(localStorage.getItem('kz_liked_shopping') || '[]');
      liked.splice(idx, 1);
      localStorage.setItem('kz_liked_shopping', JSON.stringify(liked));
      showToast('💔 Usunięto listę zakupów z ulubionych');
      if (typeof renderLikedTab === 'function') renderLikedTab();
      const currentDietDuration = parseInt(localStorage.getItem('kz_diet_duration') || '1');
      const cached = localStorage.getItem(`kz_cached_diet_${currentDietDuration}`);
      if (cached) {
        try {
          displayDietPlan(JSON.parse(cached));
        } catch (e) { }
      }
      syncToCloud();
    };
