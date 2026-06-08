    /* Global health/diet/video state to prevent ReferenceErrors */
    window.selectedDiet = window.selectedDiet || parseInt(localStorage.getItem('kz_selected_diet') || '1');
    window.dietPrefs = window.dietPrefs || JSON.parse(localStorage.getItem('kz_diet_prefs') || '[]');
    window.likedVideos = window.likedVideos || JSON.parse(localStorage.getItem('kz_liked_videos') || '[]');

    /* ── Router podstron ── */
    const PAGES = ['polityka', 'regulamin', 'kontakt', 'facebook'];
    const pageCache = {};
    const cleanPathRouting = window.location.protocol !== 'file:' && !window.Capacitor;
    const PAGE_META = {
      home: ['VitalFly | Ćwiczenia i dieta dla seniorów', 'Codzienne ćwiczenia dla seniorów, jadłospisy, przypomnienia o lekach i prosty panel użytkownika.'],
      polityka: ['Polityka prywatności | VitalFly', 'Informacje o przetwarzaniu danych osobowych, danych zdrowotnych i usługach wykorzystywanych przez VitalFly.'],
      regulamin: ['Regulamin | VitalFly', 'Warunki korzystania z serwisu VitalFly i subskrypcji.'],
      kontakt: ['Kontakt | VitalFly', 'Skontaktuj się z zespołem VitalFly w sprawie konta, dostępu i subskrypcji.'],
      facebook: ['Grupa Facebook | VitalFly', 'Informacje o społeczności VitalFly na Facebooku.']
    };

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

    function updatePageMetadata(pageId) {
      const meta = PAGE_META[pageId] || PAGE_META.home;
      const canonicalUrl = `https://vitalfly.pl${pageId === 'home' ? '/' : `/${pageId}`}`;
      document.title = meta[0];
      const setAttribute = (selector, attribute, value) => {
        const element = document.querySelector(selector);
        if (element) element.setAttribute(attribute, value);
      };
      setAttribute('meta[name="description"]', 'content', meta[1]);
      setAttribute('link[rel="canonical"]', 'href', canonicalUrl);
      setAttribute('meta[property="og:title"]', 'content', meta[0]);
      setAttribute('meta[property="og:description"]', 'content', meta[1]);
      setAttribute('meta[property="og:url"]', 'content', canonicalUrl);
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
        updatePageMetadata(pageId);
        window.scrollTo(0, 0);
        if (typeof window.applyQuizCTAs === 'function') window.applyQuizCTAs();

        const nextUrl = routePath(routeId);
        const currentUrl = cleanPathRouting ? window.location.pathname : window.location.hash || '#';
        if (!options.skipHistory && currentUrl !== nextUrl) {
          history.pushState({ page: routeId }, '', nextUrl);
        } else if (options.replace && currentUrl !== nextUrl) {
          history.replaceState({ page: routeId }, '', nextUrl);
        }
        requestAnimationFrame(() => {
          const heading = container.querySelector('h1');
          if (heading) {
            heading.setAttribute('tabindex', '-1');
            heading.focus();
          } else {
            container.focus();
          }
        });
      } catch (err) {
        console.error('Błąd nawigacji:', err);
        container.innerHTML = '<div style="padding:4rem 1.5rem;text-align:center;"><h2 style="font-size:1.5rem;color:#0B3934;margin-bottom:1rem;">Wystąpił błąd</h2><p>Nie udało się wczytać podstrony.</p><button onclick="navigateTo(\'\')" style="margin-top:1.5rem;padding:0.75rem 1.5rem;background:#35BBA0;color:white;border:none;border-radius:8px;cursor:pointer;">Wróć na stronę główną</button></div>';
      }
    }

    window.addEventListener('popstate', () => {
      navigateTo(routeFromLocation(), { skipHistory: true });
    });
    /* ── Deep Link & Payment Success Handling ── */
    function getSupabaseAuthRedirectUrl() {
      if (typeof window.getAuthRedirectUrl === 'function') return window.getAuthRedirectUrl();
      return window.location.origin + '/';
    }

    function showSignupVerification(email) {
      if (email) localStorage.setItem('kz_pending_email', email);

      const emailDisp = document.getElementById('verify-email-display');
      if (emailDisp) {
        emailDisp.textContent = email || localStorage.getItem('kz_pending_email') || 'Twój e-mail';
      }

      const errEl = document.getElementById('err-verification');
      if (errEl) errEl.style.display = 'none';

      const signupModal = document.getElementById('signupModal');
      if (signupModal) {
        if (typeof window.openAccessibleModal === 'function') {
          window.openAccessibleModal(signupModal, document.getElementById('verification-code'));
        } else {
          signupModal.classList.add('open');
          signupModal.setAttribute('aria-hidden', 'false');
        }
      }

      if (typeof showStep === 'function') {
        showStep(3);
      }
    }
    window.showSignupVerification = showSignupVerification;

    async function processPaymentSuccess(sessionId) {
      if (!sessionId || !window.fetchBillingState) {
        throw new Error('Brak identyfikatora Checkout Session.');
      }
      const billing = await window.fetchBillingState('verify-checkout', { sessionId });
      if (!billing.hasAccess) {
        throw new Error('Stripe nie potwierdził aktywnej subskrypcji.');
      }
      localStorage.removeItem('kz_pending_checkout_plan');
      localStorage.removeItem('kz_checkout_started');
      return billing;
    }

    async function saveProfileAndEnterApp(userId, email, name, phone, hasSess = false, enterApp = true) {
      window.saveProfileAndEnterApp = saveProfileAndEnterApp;
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

      if (hasSess && window.initSupabase && window.initSupabase()) {
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
          if (userId) {
            const { error } = await window.supabaseClient.from('user_profiles').upsert({ id: userId, app_data: payload }, { onConflict: 'id' });
            if (error) throw error;
          }
        } catch (e) {
          console.error("Upsert profile error:", e);
        }
      }

      if (hasSess) {
        // Usuń dane tymczasowe rejestracji dopiero po realnym potwierdzeniu i sesji.
        localStorage.removeItem('kz_pending_email');
        localStorage.removeItem('kz_pending_name');
        localStorage.removeItem('kz_pending_phone');
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
          window.Capacitor.Plugins.Preferences.remove({ key: 'kz_pending_email' });
          window.Capacitor.Plugins.Preferences.remove({ key: 'kz_pending_name' });
          window.Capacitor.Plugins.Preferences.remove({ key: 'kz_pending_phone' });
        }

        if (enterApp) {
          const billing = await window.fetchBillingState();
          if (!billing.hasAccess) {
            throw new Error('Konto nie ma aktywnego dostępu do aplikacji.');
          }
          closeModal();
          showApp(name || 'Seniorze');
        }
      } else {
        showSignupVerification(email);
      }
    }


    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
      window.Capacitor.Plugins.App.addListener('appUrlOpen', async (data) => {
        console.log('App opened with URL:', data.url);
        if (data.url) {
          try {
            const parsedUrl = new URL(data.url);
            const checkoutSessionId = parsedUrl.searchParams.get('session_id');
            if (checkoutSessionId) {
              await processPaymentSuccess(checkoutSessionId);
            }
          } catch (e) {
            console.error('Błąd obsługi powrotu z płatności:', e);
          }
        }
      });
    }

    window.addEventListener('DOMContentLoaded', async () => {
      // Wykrywanie potwierdzenia rejestracji z e-maila
      const isSignupConfirm = window.location.hash.includes('type=signup');
      const isEmailChangeConfirm = window.location.hash.includes('type=email_change');
      const checkoutSessionId = new URLSearchParams(window.location.search).get('session_id');
      if (isSignupConfirm) {
        history.replaceState({}, '', window.location.pathname);
        setTimeout(async () => {
          try {
            window.initSupabase();
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (session?.user) {
              const plan = localStorage.getItem('kz_pending_checkout_plan') || 'monthly';
              await window.startStripeCheckout(session.user, plan);
              return;
            }
          } catch (error) {
            console.error('Nie udało się przejść do płatności po potwierdzeniu e-maila:', error);
          }
          const successEl = document.getElementById('login-confirm-success');
          if (successEl) successEl.style.display = 'block';
          openLoginModal();
        }, 700);
      }

      let hasSession = false;
      // Check if user is logged in
      if (window.initSupabase && window.initSupabase()) {
        const withTimeout = (promise, ms, defaultVal) => {
          return new Promise((resolve) => {
            let timer = setTimeout(() => {
              timer = null;
              resolve(defaultVal);
            }, ms);
            promise.then(
              (val) => {
                if (timer) {
                  clearTimeout(timer);
                  resolve(val);
                }
              },
              () => {
                if (timer) {
                  clearTimeout(timer);
                  resolve(defaultVal);
                }
              }
            );
          });
        };

        const sessionPromise = window.supabaseClient.auth.getSession().catch(() => ({ data: { session: null } }));
        const sessionRes = await withTimeout(sessionPromise, 1500, { data: { session: null } });
        const session = sessionRes?.data?.session;

        // Async Data Loading (Preferences & Supabase)
        let sessionDataCloud = null;
        if (session) {
          try {
            const queryPromise = window.supabaseClient.from('user_profiles').select('app_data').eq('id', session.user.id).single().catch(() => ({ data: null }));
            const queryRes = await withTimeout(queryPromise, 1500, { data: null });
            const data = queryRes?.data;
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

        if (session) {
          const cloud = sessionDataCloud || {};
          const shouldSyncProfileEmail = !!(sessionDataCloud && session.user?.email && sessionDataCloud.profileEmail !== session.user.email);
          if (!cloud.profileName && session.user?.user_metadata?.full_name) {
            cloud.profileName = session.user.user_metadata.full_name;
          }
          if (session.user?.email && cloud.profileEmail !== session.user.email) {
            cloud.profileEmail = session.user.email;
          }
          if (!cloud.profilePhone && session.user?.user_metadata?.phone) {
            cloud.profilePhone = session.user.user_metadata.phone;
          }
          await window.applyUserProfileData(cloud);
          if (shouldSyncProfileEmail && typeof syncToCloud === 'function') {
            await syncToCloud();
          }
        }

        if (session) {
          let billing;
          try {
            billing = checkoutSessionId
              ? await processPaymentSuccess(checkoutSessionId)
              : await window.fetchBillingState();
          } catch (error) {
            console.error('Weryfikacja dostępu nie powiodła się:', error);
            billing = { hasAccess: false };
          }

          hasSession = Boolean(billing.hasAccess);
          const displayName = (sessionDataCloud && sessionDataCloud.profileName) || session.user?.user_metadata?.full_name || localStorage.getItem('kz_name') || 'Seniorze';
          if (billing.hasAccess) showApp(displayName);
          const checkoutWasStarted = localStorage.getItem('kz_checkout_started') === '1';
          if (checkoutSessionId) {
            history.replaceState({}, '', window.location.pathname);
            if (billing.hasAccess && typeof showToast === 'function') {
              setTimeout(() => openPaymentSuccessModal(), 300);
            }
          } else if (billing.hasAccess && checkoutWasStarted) {
            localStorage.removeItem('kz_checkout_started');
            setTimeout(() => openPaymentSuccessModal(), 300);
          }
        }
      }


      if (!hasSession && checkoutSessionId) {
        history.replaceState({}, '', window.location.pathname);
        localStorage.removeItem('kz_checkout_started');
        setTimeout(() => openPaymentSuccessModal(), 300);
      }

      if (isEmailChangeConfirm) {
        history.replaceState({}, '', window.location.pathname);
        setTimeout(() => {
          if (typeof showToast === 'function') {
            showToast('✅ Nowy adres e-mail został potwierdzony.', 1600);
          } else {
            alert('Nowy adres e-mail został potwierdzony.');
          }
        }, 500);
      }
      hideLoadingScreen();
      if (!hasSession) {
        navigateTo(routeFromLocation(), { replace: true });
        if (!localStorage.getItem('kz_quiz_completed')) {
          setTimeout(() => {
            if (typeof window.startQuiz === 'function') {
              window.startQuiz();
            }
          }, 600);
        } else {
          if (typeof window.applyQuizCTAs === 'function') window.applyQuizCTAs();
        }
      }
    });
