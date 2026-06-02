    /* Global health/diet/video state to prevent ReferenceErrors */
    window.selectedDiet = window.selectedDiet || parseInt(localStorage.getItem('kz_selected_diet') || '1');
    window.dietPrefs = window.dietPrefs || JSON.parse(localStorage.getItem('kz_diet_prefs') || '[]');
    window.likedVideos = window.likedVideos || JSON.parse(localStorage.getItem('kz_liked_videos') || '[]');

    /* ── Router podstron ── */
    const PAGES = ['polityka', 'regulamin', 'kontakt', 'facebook'];
    const pageCache = {};
    const cleanPathRouting = window.location.protocol !== 'file:' && !window.Capacitor;

    function routeFromLocation() {
      const hashRoute = window.location.hash.replace('#', '').replace(/^\//, '');
      if (PAGES.includes(hashRoute)) return hashRoute;

      const path = window.location.pathname.replace(/\/+$/, '').split('/').filter(Boolean).pop() || '';
      return PAGES.includes(path) ? path : '';
    }

    function routePath(id) {
      if (!cleanPathRouting) return id ? '#' + id : '#';
      return id ? '/' + id : '/';
    }

    function pageFilePath(pageId) {
      if (window.Capacitor || window.location.protocol === 'file:') return 'pages/' + pageId + '.html';
      return '/pages/' + pageId + '.html';
    }

    function normalizeInternalLinks(root) {
      if (!root) return;
      root.querySelectorAll('a[href^="#"], a[data-route]').forEach((link) => {
        const attrRoute = link.dataset.route || '';
        const hrefRoute = (link.getAttribute('href') || '').replace('#', '').replace(/^\//, '');
        const route = attrRoute || hrefRoute;
        if (route === '' || PAGES.includes(route)) {
          link.setAttribute('href', routePath(route));
          link.onclick = function (event) {
            event.preventDefault();
            navigateTo(route);
          };
        }
      });
    }

    async function navigateTo(id, options = {}) {
      const pageId = id || 'home';
      const routeId = pageId === 'home' ? '' : pageId;
      const container = document.getElementById('page-content');
      if (!container) return;

      try {
        if (!pageCache[pageId]) {
          const res = await fetch(pageFilePath(pageId));
          if (!res.ok) throw new Error('Błąd ładowania: ' + res.statusText);
          pageCache[pageId] = await res.text();
        }

        container.innerHTML = pageCache[pageId];
        normalizeInternalLinks(container);
        window.scrollTo(0, 0);

        const nextUrl = routePath(routeId);
        const currentUrl = cleanPathRouting ? window.location.pathname : window.location.hash || '#';
        if (!options.skipHistory && currentUrl !== nextUrl) {
          history.pushState({ page: routeId }, '', nextUrl);
        } else if (options.replace && currentUrl !== nextUrl) {
          history.replaceState({ page: routeId }, '', nextUrl);
        }
      } catch (err) {
        console.error('Błąd nawigacji:', err);
        container.innerHTML = '<div style="padding:4rem 1.5rem;text-align:center;"><h2 style="font-size:1.5rem;color:#0B3934;margin-bottom:1rem;">Wystąpił błąd</h2><p>Nie udało się wczytać podstrony.</p><button onclick="navigateTo(\'\')" style="margin-top:1.5rem;padding:0.75rem 1.5rem;background:#35BBA0;color:white;border:none;border-radius:8px;cursor:pointer;">Wróć na stronę główną</button></div>';
      }
    }

    window.addEventListener('popstate', () => {
      navigateTo(routeFromLocation(), { skipHistory: true });
    });
    /* ── Deep Link & Payment Success Handling ── */
    async function processPaymentSuccess() {
      let pEmail = localStorage.getItem('kz_pending_email');
      let pName = localStorage.getItem('kz_pending_name');
      let pPwd = localStorage.getItem('kz_pending_pwd');
      let pPhone = localStorage.getItem('kz_pending_phone') || '';

      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
        try {
          if (!pEmail) { const pe = await window.Capacitor.Plugins.Preferences.get({ key: 'kz_pending_email' }); if (pe.value) pEmail = pe.value; }
          if (!pName) { const pn = await window.Capacitor.Plugins.Preferences.get({ key: 'kz_pending_name' }); if (pn.value) pName = pn.value; }
          if (!pPwd) { const pp = await window.Capacitor.Plugins.Preferences.get({ key: 'kz_pending_pwd' }); if (pp.value) pPwd = pp.value; }
          if (!pPhone) { const ph = await window.Capacitor.Plugins.Preferences.get({ key: 'kz_pending_phone' }); if (ph.value) pPhone = ph.value; }
        } catch (e) {
          console.error("Preferences load error:", e);
        }
      }

      if (!pEmail || !pPwd) {
        console.error("No pending email or password found");
        closeModal();
        return;
      }

      let userId = null;
      let hasSess = false;

      if (window.supabaseClient) {
        // Inicjalizacja rejestracji
        try {
          const { data, error } = await window.supabaseClient.auth.signUp({
            email: pEmail,
            password: pPwd,
            options: {
              data: {
                full_name: pName,
                phone: pPhone
              }
            }
          });

          if (!error && data && data.user) {
            userId = data.user.id;
            hasSess = !!data.session;
          } else {
            console.log("SignUp did not return user (possibly already exists). Trying login...");
            const logRes = await window.supabaseClient.auth.signInWithPassword({
              email: pEmail,
              password: pPwd
            });
            if (!logRes.error && logRes.data && logRes.data.user) {
              userId = logRes.data.user.id;
              hasSess = !!logRes.data.session;
            }
          }
        } catch (e) {
          console.error("SignUp/Login exception:", e);
        }
      }

      if (userId) {
        await saveProfileAndEnterApp(userId, pEmail, pName, pPhone, hasSess);
      } else {
        if (pName) {
          localStorage.setItem('kz_logged_in_name', pName);
          localStorage.setItem('kz_name', pName);
        }
        closeModal();
        showApp(pName || 'Seniorze');
      }
    }

    async function saveProfileAndEnterApp(userId, email, name, phone, hasSess = false) {
      if (name) {
        localStorage.setItem('kz_logged_in_name', name);
        localStorage.setItem('kz_name', name);
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
          window.Capacitor.Plugins.Preferences.set({ key: 'kz_logged_in_name', value: name });
          window.Capacitor.Plugins.Preferences.set({ key: 'kz_name', value: name });
        }
      }
      if (phone) {
        localStorage.setItem('kz_phone', phone);
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
          window.Capacitor.Plugins.Preferences.set({ key: 'kz_phone', value: phone });
        }
      }
      if (email) {
        localStorage.setItem('kz_email', email);
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
          window.Capacitor.Plugins.Preferences.set({ key: 'kz_email', value: email });
        }
      }

      if (window.supabaseClient) {
        let dogtag = null;
        try {
          dogtag = JSON.parse(localStorage.getItem('vf_dogtag') || 'null');
        } catch (e) {
          console.error("Błąd parsowania vf_dogtag:", e);
        }

        const payload = {
          medications: APP_DATA.medications,
          dogtag: dogtag,
          profileName: name,
          profilePhone: phone,
          profileEmail: email,
          selectedDiet: selectedDiet,
          dietPrefs: dietPrefs,
          healthIssues: localStorage.getItem('kz_health_issues') || ''
        };
        try {
          await window.supabaseClient.from('user_profiles').upsert({ id: userId, app_data: payload });
        } catch (e) {
          console.error("Upsert profile error:", e);
        }
      }

      // Usuń dane tymczasowe rejestracji
      localStorage.removeItem('kz_pending_email');
      localStorage.removeItem('kz_pending_pwd');
      localStorage.removeItem('kz_pending_name');
      localStorage.removeItem('kz_pending_phone');
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
        window.Capacitor.Plugins.Preferences.remove({ key: 'kz_pending_email' });
        window.Capacitor.Plugins.Preferences.remove({ key: 'kz_pending_pwd' });
        window.Capacitor.Plugins.Preferences.remove({ key: 'kz_pending_name' });
        window.Capacitor.Plugins.Preferences.remove({ key: 'kz_pending_phone' });
      }

      closeModal();
      if (hasSess) {
        showApp(name || 'Seniorze');
      } else {
        if (typeof openPaymentSuccessModal === 'function') {
          openPaymentSuccessModal();
        } else {
          alert('Płatność przyjęta! Rejestracja zakończona sukcesem. Sprawdź e-mail, aby aktywować konto.');
        }
      }
    }


    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
      window.Capacitor.Plugins.App.addListener('appUrlOpen', async (data) => {
        console.log('App opened with URL:', data.url);
        if (data.url) {
          try {
            const parsedUrl = new URL(data.url);
            if (parsedUrl.searchParams.get('sukces') === '1' || parsedUrl.href.includes('sukces=1')) {
              await processPaymentSuccess();
            }
          } catch (e) {
            if (data.url.includes('sukces=1')) {
              await processPaymentSuccess();
            }
          }
        }
      });
    }

    window.addEventListener('DOMContentLoaded', async () => {
      // Wykrywanie potwierdzenia rejestracji z e-maila
      const isSignupConfirm = window.location.hash.includes('type=signup');
      if (isSignupConfirm) {
        history.replaceState({}, '', window.location.pathname);
        if (window.supabaseClient) {
          try {
            await window.supabaseClient.auth.signOut();
          } catch (e) {}
        }
        localStorage.removeItem('kz_session');
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
          try {
            await window.Capacitor.Plugins.Preferences.remove({ key: 'kz_session' });
          } catch (e) {}
        }
        setTimeout(() => {
          const successEl = document.getElementById('login-confirm-success');
          if (successEl) successEl.style.display = 'block';
          openLoginModal();
        }, 500);
      }

      let hasSession = false;
      if (localStorage.getItem('kz_session')) {
        hasSession = true;
      } else if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
        try {
          const capSession = await window.Capacitor.Plugins.Preferences.get({ key: 'kz_session' });
          if (capSession && capSession.value) {
            hasSession = true;
            localStorage.setItem('kz_session', capSession.value);
          }
        } catch (e) {}
      }
      // Check if user is logged in
      if (window.supabaseClient && new URLSearchParams(window.location.search).get('sukces') !== '1') {
        const { data: { session } } = await window.supabaseClient.auth.getSession();

        // Async Data Loading (Preferences & Supabase)
        let sessionDataCloud = null;
        if (session) {
          try {
            const { data } = await window.supabaseClient.from('user_profiles').select('app_data').eq('id', session.user.id).single();
            if (data && data.app_data) sessionDataCloud = data.app_data;
          } catch (e) { }
        }

        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
          const getPref = async (k) => {
            const { value } = await window.Capacitor.Plugins.Preferences.get({ key: k });
            if (!value) return null;
            try { return JSON.parse(value); } catch (e) { return value; }
          };
          const meds = await getPref('kz_medications');
          if (meds) APP_DATA.medications = meds;
          const dt = await window.Capacitor.Plugins.Preferences.get({ key: 'vf_dogtag' });
          if (dt.value) localStorage.setItem('vf_dogtag', dt.value);
          const healthPref = await window.Capacitor.Plugins.Preferences.get({ key: 'kz_health_issues' });
          if (healthPref.value) localStorage.setItem('kz_health_issues', healthPref.value);
        }

        if (sessionDataCloud) {
          if (sessionDataCloud.medications) APP_DATA.medications = sessionDataCloud.medications;
          if (sessionDataCloud.dogtag) localStorage.setItem('vf_dogtag', JSON.stringify(sessionDataCloud.dogtag));
          if (sessionDataCloud.profileName) {
            localStorage.setItem('kz_name', sessionDataCloud.profileName);
            localStorage.setItem('kz_logged_in_name', sessionDataCloud.profileName);
          }
          if (sessionDataCloud.profilePhone) {
            localStorage.setItem('kz_phone', sessionDataCloud.profilePhone);
          }
          if (sessionDataCloud.selectedDiet) {
            localStorage.setItem('kz_selected_diet', sessionDataCloud.selectedDiet);
            selectedDiet = parseInt(sessionDataCloud.selectedDiet);
          }
          if (sessionDataCloud.dietPrefs) {
            localStorage.setItem('kz_diet_prefs', JSON.stringify(sessionDataCloud.dietPrefs));
            dietPrefs = sessionDataCloud.dietPrefs;
          }
          if (sessionDataCloud.likedVideos) {
            localStorage.setItem('kz_liked_videos', JSON.stringify(sessionDataCloud.likedVideos));
            likedVideos = sessionDataCloud.likedVideos;
          }
          if (sessionDataCloud.healthIssues) {
            localStorage.setItem('kz_health_issues', sessionDataCloud.healthIssues);
          }
        }

        if (session) {
          hasSession = true;
          const displayName = (sessionDataCloud && sessionDataCloud.profileName) || session.user?.user_metadata?.full_name || localStorage.getItem('kz_name') || 'Seniorze';
          showApp(displayName);
        }
      }

      const isSuccess = new URLSearchParams(window.location.search).get('sukces') === '1';
      if (isSuccess) {
        const isMobileDevice = /android|iphone|ipad|ipod/i.test(navigator.userAgent || navigator.vendor || window.opera);
        const isCapacitor = !!window.Capacitor;

        if (isMobileDevice && !isCapacitor) {
          // Przekierowanie do natywnej aplikacji
          window.location.href = 'com.zdrowieseniora.app://?sukces=1';

          document.body.innerHTML = `
            <div style="font-family:'Source Sans 3',sans-serif;text-align:center;padding:3rem 1.5rem;background:#0B3934;color:#fff;min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;">
              <div style="font-size:5rem;margin-bottom:1.5rem;">🌿</div>
              <h1 style="font-family:'Lora',serif;font-size:2.0rem;margin-bottom:1rem;">Płatność powiodła się!</h1>
              <p style="font-size:1.1rem;opacity:0.9;max-width:400px;margin-bottom:2rem;line-height:1.5;">Otwieramy aplikację VitalFly na Twoim telefonie, abyś mógł od razu przejść do panelu.</p>
              <a href="com.zdrowieseniora.app://?sukces=1" style="background:#4DBFA8;color:#0B3934;padding:1rem 2rem;border-radius:12px;font-weight:700;text-decoration:none;font-size:1.2rem;display:inline-block;box-shadow:0 4px 15px rgba(0,0,0,0.2);">Przejdź do aplikacji →</a>
              <p style="font-size:0.85rem;opacity:0.6;margin-top:2rem;">Jeśli aplikacja nie otworzyła się automatycznie, kliknij przycisk powyżej.</p>
            </div>
          `;
          return;
        }

        try {
          await processPaymentSuccess();
        } catch (e) {
          console.error("Błąd przetwarzania sukcesu płatności:", e);
        }
        hasSession = true;
        history.replaceState({}, '', window.location.pathname);
      }
      hideLoadingScreen();
      if (!hasSession) {
        navigateTo(routeFromLocation(), { replace: true });
      }
    });
