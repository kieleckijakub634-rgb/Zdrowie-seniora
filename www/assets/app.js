/* ── Modal ── */
    function openModal() { document.getElementById('signupModal').classList.add('open'); document.body.style.overflow = 'hidden'; showStep(1); }
    function closeModal() { document.getElementById('signupModal').classList.remove('open'); document.body.style.overflow = ''; }
    function handleOverlayClick(e) { if (e.target === document.getElementById('signupModal')) closeModal(); }

    function openLoginModal() { document.getElementById('loginModal').classList.add('open'); document.body.style.overflow = 'hidden'; }
    function closeLoginModal() { document.getElementById('loginModal').classList.remove('open'); document.body.style.overflow = ''; }
    async function handleLogin() {
      const e = document.getElementById('login-email').value.trim();
      const p = document.getElementById('login-password').value.trim();
      if (!e || !p) return;
      const errEl = document.getElementById('err-login');
      errEl.style.display = 'none';
      if (window.supabaseClient) {
        const btn = document.querySelector('#loginModal .btn-cta');
        const origText = btn.innerHTML;
        btn.innerHTML = 'Logowanie...'; btn.disabled = true;
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email: e, password: p });
        if (error) {
          errEl.textContent = 'Nieprawidłowy e-mail lub hasło.';
          errEl.style.display = 'block';
          btn.innerHTML = origText; btn.disabled = false; return;
        }

        // Wczytaj profil użytkownika z bazy i zsynchronizuj stan lokalny
        let displayName = data.user?.user_metadata?.full_name || 'Seniorze';
        try {
          const { data: profile } = await window.supabaseClient.from('user_profiles').select('app_data').eq('id', data.user.id).single();
          if (profile && profile.app_data) {
            const cloud = profile.app_data;
            if (cloud.medications) APP_DATA.medications = cloud.medications;
            if (cloud.dogtag) localStorage.setItem('vf_dogtag', JSON.stringify(cloud.dogtag));
            if (cloud.profileName) {
              localStorage.setItem('kz_name', cloud.profileName);
              localStorage.setItem('kz_logged_in_name', cloud.profileName);
              displayName = cloud.profileName;
            }
            if (cloud.profilePhone) {
              localStorage.setItem('kz_phone', cloud.profilePhone);
            }
            if (cloud.selectedDiet) {
              localStorage.setItem('kz_selected_diet', cloud.selectedDiet);
              selectedDiet = parseInt(cloud.selectedDiet);
            }
            if (cloud.dietPrefs) {
              localStorage.setItem('kz_diet_prefs', JSON.stringify(cloud.dietPrefs));
              dietPrefs = cloud.dietPrefs;
            }
            if (cloud.likedVideos) {
              localStorage.setItem('kz_liked_videos', JSON.stringify(cloud.likedVideos));
              likedVideos = cloud.likedVideos;
            }
            if (cloud.healthIssues) {
              localStorage.setItem('kz_health_issues', cloud.healthIssues);
            }
          }
        } catch (e) {
          console.error("Błąd wczytywania profilu:", e);
        }

        closeLoginModal();
        showApp(displayName);
        btn.innerHTML = origText; btn.disabled = false;
      } else {
        errEl.textContent = 'Błąd połączenia z bazą danych.'; errEl.style.display = 'block';
      }
    }
    async function logout() {
      if (!confirm('Na pewno chcesz się wylogować?')) return;
      if (window.supabaseClient) await window.supabaseClient.auth.signOut();
      localStorage.removeItem('kz_session');
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
        await window.Capacitor.Plugins.Preferences.remove({ key: 'kz_session' });
      }
      window.location.reload();
    }

    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeLoginModal(); } });

    function showStep(n) {
      [1, 2, 3].forEach(i => {
        const s = document.getElementById('step' + i);
        if (s) s.style.display = (i === n) ? 'block' : 'none';
        const d = document.getElementById('dot' + i);
        if (d) d.classList.toggle('active', i <= n);
      });
      document.getElementById('stepDots').style.display = (n === 3) ? 'none' : 'flex';
    }

    function goStep2() {
      let valid = true;
      const name = document.getElementById('inp-name');
      const email = document.getElementById('inp-email');
      const pwd = document.getElementById('inp-password');
      const consent = document.getElementById('inp-consent');
      if (!name.value.trim() || name.value.trim().split(' ').length < 2) { name.classList.add('error'); document.getElementById('err-name').style.display = 'block'; valid = false; }
      else { name.classList.remove('error'); document.getElementById('err-name').style.display = 'none'; }
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(email.value.trim())) { email.classList.add('error'); document.getElementById('err-email').style.display = 'block'; valid = false; }
      else { email.classList.remove('error'); document.getElementById('err-email').style.display = 'none'; }
      if (pwd.value.trim().length < 6) { pwd.classList.add('error'); document.getElementById('err-password').style.display = 'block'; valid = false; }
      else { pwd.classList.remove('error'); document.getElementById('err-password').style.display = 'none'; }
      if (!consent.checked) { document.getElementById('err-consent').style.display = 'block'; valid = false; }
      else { document.getElementById('err-consent').style.display = 'none'; }
      if (valid) {
        const welcomeEl = document.getElementById('welcome-name') || document.getElementById('app-username');
        if (welcomeEl) {
          welcomeEl.textContent = name.value.trim().split(' ')[0];
        }
        showStep(2);
      }
    }
    function goStep1() { showStep(1); }

    /* ── Stripe Payment Links ─────────────────────────────────────────
       INSTRUKCJA KONFIGURACJI:
       1. Zaloguj się do Stripe (dashboard.stripe.com)
       2. Przejdź do "Product catalog" -> dodaj "Subskrypcja miesięczna" (39 zł)
       3. Przejdź do "Payment links" -> stwórz link dla subskrypcji miesięcznej
       4. Skopiuj wygenerowany link URL i wklej go poniżej (zastąp STRIPE_LINK_MONTHLY)
       5. Powtórz kroki dla "Subskrypcji rocznej" (390 zł) i wklej w STRIPE_LINK_YEARLY
    ──────────────────────────────────────────────────────────────── */
    function redirectToStripe() {
      // ↓↓↓ PODMIEŃ NA SWOJE LINKI Z PANELU STRIPE ↓↓↓
      const STRIPE_LINK_MONTHLY = 'https://buy.stripe.com/test_8x29AT4Vo2Aq4ESdk19Zm00'; // np. "https://buy.stripe.com/test_12345"
      const STRIPE_LINK_YEARLY = 'https://buy.stripe.com/test_cNi28rdrU5MCfjwa7P9Zm01';      // np. "https://buy.stripe.com/test_67890"
      // ↑↑↑ PODMIEŃ NA SWOJE DANE ↑↑↑

      const name = document.getElementById('inp-name').value.trim();
      const email = document.getElementById('inp-email').value.trim();
      const btn = document.querySelector('.btn-stripe');
      const isYearly = localStorage.getItem('kz_plan') === 'yearly';

      if (STRIPE_LINK_MONTHLY === 'TWOJ_LINK_MIESIECZNY') {
        // Tryb demo – symulacja
        btn.innerHTML = '⏳ Przetwarzam płatność... (TRYB DEMO)';
        btn.disabled = true;
        setTimeout(() => showStep(3), 1800);
        return;
      }

      btn.innerHTML = '⏳ Przekierowuję do Stripe...';
      btn.disabled = true;

      // Tymczasowy zapis danych do zalogowania po udanej płatności
      const pwd = document.getElementById('inp-password').value.trim();
      const phone = document.getElementById('inp-phone') ? document.getElementById('inp-phone').value.trim() : '';
      localStorage.setItem('kz_pending_email', email);
      localStorage.setItem('kz_pending_name', name);
      localStorage.setItem('kz_pending_pwd', pwd);
      localStorage.setItem('kz_pending_phone', phone);

      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
        window.Capacitor.Plugins.Preferences.set({ key: 'kz_pending_email', value: email });
        window.Capacitor.Plugins.Preferences.set({ key: 'kz_pending_name', value: name });
        window.Capacitor.Plugins.Preferences.set({ key: 'kz_pending_pwd', value: pwd });
        window.Capacitor.Plugins.Preferences.set({ key: 'kz_pending_phone', value: phone });
      }

      // Przekierowanie na odpowiedni link Stripe z automatycznie uzupełnionym emailem
      const baseUrl = isYearly ? STRIPE_LINK_YEARLY : STRIPE_LINK_MONTHLY;
      const returnUrl = encodeURIComponent(window.location.href.split('?')[0] + '?sukces=1');

      // Stripe Payment Links pozwala przekazać e-mail jako parametr, ale powrót ustawia się w panelu
      window.location.href = `${baseUrl}?prefilled_email=${encodeURIComponent(email)}`;
    }

    /* ── FAQ accordion ── */
    function toggleFaq(el) {
      const a = el.nextElementSibling;
      const isOpen = a.style.display === 'block';
      document.querySelectorAll('.faq-a').forEach(x => x.style.display = 'none');
      if (!isOpen) a.style.display = 'block';
    }

    /* ── Router podstron ── */
    const PAGES = ['polityka', 'regulamin', 'kontakt', 'facebook'];
    function navigateTo(id) {
      document.getElementById('pg-home').style.display = id ? 'none' : 'block';
      PAGES.forEach(p => {
        const el = document.getElementById('pg-' + p);
        if (el) el.style.display = (p === id) ? 'block' : 'none';
      });
      window.scrollTo(0, 0);
      history.pushState({}, '', '#' + (id || ''));
    }
    window.addEventListener('popstate', () => {
      const id = window.location.hash.replace('#', '');
      navigateTo(PAGES.includes(id) ? id : '');
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
          } else {
            console.log("SignUp did not return user (possibly already exists). Trying login...");
            const logRes = await window.supabaseClient.auth.signInWithPassword({
              email: pEmail,
              password: pPwd
            });
            if (!logRes.error && logRes.data && logRes.data.user) {
              userId = logRes.data.user.id;
            }
          }
        } catch (e) {
          console.error("SignUp/Login exception:", e);
        }
      }

      if (userId) {
        await saveProfileAndEnterApp(userId, pEmail, pName, pPhone);
      } else {
        if (pName) {
          localStorage.setItem('kz_logged_in_name', pName);
          localStorage.setItem('kz_name', pName);
        }
        closeModal();
        showApp(pName || 'Seniorze');
      }
    }

    async function saveProfileAndEnterApp(userId, email, name, phone) {
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
      showApp(name || 'Seniorze');
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

        await processPaymentSuccess();
        hasSession = true;
        history.replaceState({}, '', window.location.pathname);
      }
      hideLoadingScreen();
      const hash = window.location.hash.replace('#', '');
      if (!hasSession) {
        navigateTo(PAGES.includes(hash) ? hash : '');
      }
    });

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

    function setFontSize(size) {
      document.documentElement.className = document.documentElement.className.replace(/fs-(sm|md|lg|xl)/g, '') + ' fs-' + size;
      document.body.className = document.body.className.replace(/fs-(sm|md|lg|xl)/g, '') + ' fs-' + size;
      document.querySelectorAll('.fs-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('fs-' + size).classList.add('active');
    }

    function setTheme(theme) {
      document.body.classList.toggle('theme-dark', theme === 'dark');
      document.getElementById('theme-light').classList.toggle('active', theme === 'light');
      document.getElementById('theme-dark').classList.toggle('active', theme === 'dark');
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
      const loader = document.getElementById('app-loading-screen');
      if (loader) {
        loader.style.pointerEvents = 'none';
        loader.style.opacity = '0';
        setTimeout(() => {
          try { loader.remove(); } catch (e) { }
        }, 300);
      }
      document.body.classList.remove('app-loading');
    }

    /* ── POKAŻ APLIKACJĘ ── */
    function showApp(userName) {
      document.body.classList.add('logged-in');
      document.body.classList.remove('app-loading');
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

    /* ── DOG TAG ── */
    function toggleDogTagEdit(showEdit) {
      document.getElementById('dogtag-edit').style.display = showEdit ? 'block' : 'none';
      document.getElementById('dogtag-view').style.display = showEdit ? 'none' : 'block';
    }

    function saveDogTag() {
      const data = {
        name: document.getElementById('dt-e-name').value.trim(),
        address: document.getElementById('dt-e-address').value.trim(),
        ice: document.getElementById('dt-e-ice').value.trim(),
        illness: document.getElementById('dt-e-illness').value.trim(),
        meds: document.getElementById('dt-e-meds').value.trim()
      };
      asyncSetItem('vf_dogtag', JSON.stringify(data));
      syncToCloud();
      toggleDogTagEdit(false);
      loadDogTag();
      updateLiveHelpPopup();
      showToast('🚑 Nieśmiertelnik został pomyślnie zapisany!');
    }

    function loadDogTag() {
      const dataStr = localStorage.getItem('vf_dogtag');
      let medsText = APP_DATA.medications.map(m => `• ${m.name} ${m.dose ? '(' + m.dose + ')' : ''} ${m.time}`).join('<br/>');
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
    let likedVideos = JSON.parse(localStorage.getItem('kz_liked_videos') || '[]');
    let videoLibraryView = localStorage.getItem('kz_video_library_view') || 'recommended';
    let videoCart = JSON.parse(localStorage.getItem('kz_video_cart') || '[]');

    function isLiked(id) {
      return likedVideos.includes(id);
    }

    function toggleLikeVideo(id) {
      const idx = likedVideos.indexOf(id);
      if (idx > -1) {
        likedVideos.splice(idx, 1);
      } else {
        likedVideos.push(id);
      }
      localStorage.setItem('kz_liked_videos', JSON.stringify(likedVideos));
      renderVideos();
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
      return `
      <div class="video-card" id="vcard-${v.id}" onclick="playVideo(${v.id})">
        <span class="video-emoji">${v.emoji}</span>
        <div class="video-tag">${v.tag}</div>
        <div class="video-title">${v.title}</div>
        <div class="video-desc">${v.desc}</div>
        ${reason ? `<div class="video-reason">✨ ${reason}</div>` : ''}
        <div class="video-meta">
          <div>
            <div class="video-dur">⏱ ${v.duration}</div>
            <div class="video-day">${v.day}</div>
          </div>
          <div style="display:flex; gap:0.5rem; align-items:center;">
            <button onclick="event.stopPropagation(); toggleLikeVideo(${v.id})" class="video-like-btn" aria-label="Polub film">
              ${isLiked(v.id) ? '❤️' : '🤍'}
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
      return `
      <div class="video-card video-shop-card">
        <span class="video-emoji">${item.emoji}</span>
        <div class="video-tag">${item.tag}</div>
        <div class="video-title">${item.title}</div>
        <div class="video-desc">${item.desc}</div>
        <div class="shop-match">${getShopVideoMatch(item)}</div>
        <div class="video-meta">
          <div>
            <div class="video-dur">${item.duration}</div>
            <div class="video-day">${item.price}</div>
          </div>
          <button type="button" onclick="toggleVideoCart('${item.id}')" class="video-play-btn">${inCart ? '✓ Na liście' : 'Dodaj'}</button>
        </div>
      </div>
    `;
    }

    function renderVideos() {
      const grid = document.getElementById('videoGrid');
      if (!grid) return;
      document.querySelectorAll('.video-library-tab').forEach(b => b.classList.remove('active'));
      const activeBtn = document.querySelector(`.video-library-tab[onclick*="${videoLibraryView}"]`);
      if (activeBtn) activeBtn.classList.add('active');

      const notice = document.getElementById('videoLibraryNotice');
      if (videoLibraryView === 'recommended') {
        const recs = getVideoRecommendationData().slice(0, 4);
        if (notice) notice.textContent = 'Propozycje powstają z dnia tygodnia, profilu zdrowotnego i polubionych filmów.';
        grid.innerHTML = recs.map(x => renderVideoCard(x.video, x.reason)).join('');
        return;
      }

      if (videoLibraryView === 'liked') {
        const liked = APP_DATA.videos.filter(v => isLiked(v.id));
        const likedDiets = JSON.parse(localStorage.getItem('kz_liked_diets') || '[]');
        const likedShopping = JSON.parse(localStorage.getItem('kz_liked_shopping') || '[]');

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
              <h4 style="font-weight:700; color:var(--navy); font-size:1.05rem; margin-bottom:0.75rem; padding-right:2rem;">${diet.title} (${diet.days.length > 1 ? diet.days.length + ' dni' : '1 dzień'})</h4>
              <div class="diet-ai-meals-day-content" style="max-height: 200px; overflow-y: auto; padding-right: 0.5rem;">
                ${diet.days.map(day => `
                  <div style="font-weight:700; font-size:0.85rem; color:#4DBFA8; margin-top:0.5rem; margin-bottom:0.25rem; text-transform:uppercase;">${day.dayName}</div>
                  ${day.meals.map(meal => `
                    <div class="diet-ai-meal-row" style="margin-bottom:0.2rem;">
                      <span class="diet-ai-meal-type" style="font-size:0.75rem; font-weight:700;">[ ${meal.type} ]</span>
                      <span class="diet-ai-meal-content" style="font-size:0.85rem;">${meal.content}</span>
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
              <h4 style="font-weight:700; color:var(--navy); font-size:1.05rem; margin-bottom:0.75rem; padding-right:2rem;">${shop.title}</h4>
              <div class="diet-ai-shopping-tags-wrapper" style="margin-top:0.5rem;">
                ${shop.items.map(item => `<span class="diet-ai-shopping-tag">${item}</span>`).join('')}
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
        let url = v.url.trim();
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
          const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
          const ytId = match ? match[1] : null;
          if (ytId) {
            rm.innerHTML = `<iframe width="100%" height="100%" src="https://www.youtube-nocookie.com/embed/${ytId}?origin=https://vitalfly.pl" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
          } else {
            rm.innerHTML = `<div style="color:white;padding:2rem;text-align:center;font-family:sans-serif;">Błędny link YouTube. Skopiuj poprawny link.</div>`;
          }
        } else {
          rm.innerHTML = `<video width="100%" height="100%" controls autoplay src="${url}"></video>`;
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

    // Główna funkcja generująca dietę za pomocą LLM
    // Funkcja pomocnicza renderująca widok jadłospisu z obiektu JSON
    // Funkcja pomocnicza renderująca widok jadłospisu z obiektu JSON
    function displayDietPlan(dietPlan) {
      const container = document.getElementById('diet-meals-container');
      const titleDisplay = document.getElementById('diet-title-display');
      const statusTag = document.getElementById('diet-status-tag');
      if (!container || !titleDisplay || !statusTag) return;

      titleDisplay.textContent = dietPlan.title;
      statusTag.textContent = `PLAN SPERSONALIZOWANY // ZAPISANY W PAMIĘCI`;
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

      if (typeof window.activeDietDayIndex === 'undefined') {
        window.activeDietDayIndex = 0;
      }
      if (window.activeDietDayIndex >= dietPlan.days.length) {
        window.activeDietDayIndex = 0;
      }

      // Generowanie poziomej nawigacji dni, jeśli dni jest więcej niż 1
      let htmlNav = '';
      if (dietPlan.days.length > 1) {
        htmlNav = `
        <div class="diet-days-nav" style="display:flex; gap:0.5rem; overflow-x:auto; padding-bottom:0.75rem; margin-bottom:1.25rem; -webkit-overflow-scrolling:touch;">
          ${dietPlan.days.map((day, idx) => `
            <button onclick="setActiveDietDay(${idx})" class="diet-day-pill ${idx === window.activeDietDayIndex ? 'active' : ''}" type="button">
              ${day.dayName}
            </button>
          `).join('')}
        </div>
      `;
      }

      // Generowanie posiłków dla wybranego dnia
      const activeDay = dietPlan.days[window.activeDietDayIndex];
      let htmlMeals = `
      <div class="diet-ai-meals-day-content">
        ${activeDay.meals.map(meal => `
          <div class="diet-ai-meal-row">
            <span class="diet-ai-meal-type">[ ${meal.type} ]</span>
            <span class="diet-ai-meal-content">${meal.content}</span>
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
            ${dietPlan.shopping.map(item => `<span class="diet-ai-shopping-tag">${item}</span>`).join('')}
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
      localStorage.setItem('kz_diet_duration', days);
      window.activeDietDayIndex = 0;

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
      const apiKey = localStorage.getItem('kz_gemini_api_key') || '';
      const activePrefs = JSON.parse(localStorage.getItem('kz_diet_prefs') || '[]');
      const patientName = localStorage.getItem('kz_name') || 'Pacjent VitalFly';
      const healthIssues = localStorage.getItem('kz_health_issues') || '';
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
          <button onclick="renderPersonalizedDiet(true)" class="btn-cta" style="display:inline-block; font-size:0.88rem; padding:0.6rem 1.5rem;">
            ⚡ Wygeneruj jadłospis ${buttonText}
          </button>
        </div>
      `;
        titleDisplay.textContent = "Twój Spersonalizowany Jadłospis";
        statusTag.textContent = "GOTOWY DO GENERACJI";
        statusTag.className = "font-cyber text-[10px] bg-[#4DBFA8]/10 text-[#4DBFA8] px-2 py-0.5 border border-[#4DBFA8]/30 uppercase tracking-widest";
        return;
      }

      // Stan ładowania (Loader AI)
      titleDisplay.textContent = "GENEROWANIE DIETY PRZEZ COGNITIVE AI...";
      statusTag.textContent = "SYNCHRONIZACJA Z LLM...";
      statusTag.className = "font-cyber text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 border border-amber-500/30 uppercase tracking-widest";

      const durationName = currentDietDuration === 7 ? "tydzień (7 dni)" : (currentDietDuration === 3 ? "3 dni" : "dziś");
      container.innerHTML = `
      <div class="py-8 text-center space-y-3">
        <div class="inline-block w-8 h-8 border-4 border-t-transparent border-[#4DBFA8] rounded-full animate-spin"></div>
        <p class="text-xs font-cyber text-slate-500 tracking-widest uppercase">Model LLM optymalizuje plan żywieniowy na ${durationName} dla: ${patientName}...</p>
      </div>
    `;

      // Weryfikacja obecności klucza API
      if (!apiKey) {
        titleDisplay.textContent = "BŁĄD SYSTEMU DIETY";
        statusTag.textContent = "BRAK KLUCZA API";
        statusTag.className = "font-cyber text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 border border-red-500/30 uppercase tracking-widest";
        container.innerHTML = `
        <p class="text-sm text-red-400 p-4 border border-red-500/20 bg-red-500/5 font-mono">
          CRITICAL ERROR: Klucz API Gemini nie został wykryty w bazie danych.<br/>
          Wklej swój klucz API w Panelu Administratora (zakładka Moduły) lub zapisz go w pamięci lokalnej jako 'kz_gemini_api_key'.
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
      Twoim zadaniem jest wygenerowanie zbalansowanej, łatwostrawnej i przeciwzapalnej diety dla pacjenta o imieniu: ${patientName}.
      
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
        // Zapytanie do endpointu Google Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: systemPrompt }] }]
          })
        });

        if (!response.ok) throw new Error(`HTTP Error Status: ${response.status}`);

        const data = await response.json();
        let rawJsonText = data.candidates[0].content.parts[0].text.trim();

        // Zabezpieczenie na wypadek gdyby model mimo wszystko dodał bloki kodu markdown
        rawJsonText = rawJsonText.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();

        // Parsowanie odpowiedzi z LLM
        const dietPlan = JSON.parse(rawJsonText);

        // Zapisujemy wygenerowaną dietę w localStorage
        localStorage.setItem(`kz_cached_diet_${currentDietDuration}`, JSON.stringify(dietPlan));
        localStorage.setItem(`kz_cached_diet_day_${currentDietDuration}`, currentDay);
        localStorage.setItem(`kz_cached_diet_profile_key_${currentDietDuration}`, dietProfileCacheKey);

        displayDietPlan(dietPlan);

      } catch (error) {
        console.error("LLM Generation Error:", error);
        titleDisplay.textContent = "BŁĄD PRZETWARZANIA SYSTEMU AI";
        statusTag.textContent = "BŁĄD INTEGRACJI MODELU";
        statusTag.className = "font-cyber text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 border border-red-500/30 uppercase tracking-widest";
        container.innerHTML = `
        <p class="text-sm text-red-400 p-4 border border-red-500/20 bg-red-500/5 font-mono">
          Wygenerowanie autonomicznego planu nie powiodło się. Model LLM zwrócił nieprawidłową strukturę danych lub przekroczono limit zapytania.<br/>
          Upewnij się, że Twój klucz API jest aktywny i spróbuj ponownie za chwilę.
        </p>
      `;
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
          <title>VitalFly – Jadłospis AI (${dietPlan.title})</title>
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
              <p class="patient-name">Dla pacjenta: <strong>${patientName}</strong></p>
            </div>
            <div style="font-size:0.85rem; text-align:right; color:#888;">
              Długość planu: ${dietPlan.days.length > 1 ? dietPlan.days.length + ' dni' : '1 dzień'}<br>
              vitalfly.pl
            </div>
          </div>
          
          <div style="font-size:1.4rem; font-weight:700; color:#0B3934; margin-bottom:1.5rem;">🥗 Plan: ${dietPlan.title}</div>
          
          <div>
            ${dietPlan.days.map(day => `
              <div class="day-section">
                <div class="day-title">📅 ${day.dayName}</div>
                <div>
                  ${day.meals.map(m => `
                    <div class="meal-box">
                      <div class="meal-type">${m.type}</div>
                      <div class="meal-content">${m.content}</div>
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
                ${dietPlan.shopping.map(s => `<li><span style="font-size:1.1rem; color:#bbb;">☐</span> ${s}</li>`).join('')}
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
          <div class="med-name">${m.name}</div>
          <div class="med-time">
            🕐 ${m.time}
            ${m.dose ? `<span class="med-dose">${m.dose}</span>` : ''}
            ${m.note ? `<span style="font-size:.85rem;color:#8A9BB0;">– ${m.note}</span>` : ''}
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
    function showToast(msg) {
      const t = document.getElementById('medToast');
      if (!t) return;
      document.getElementById('medToastText').textContent = msg;
      t.classList.add('show');
      clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => t.classList.remove('show'), 4500);
    }

    function showMedModal(msg) {
      document.getElementById('medModalText').textContent = msg;
      document.getElementById('medModal').classList.add('open');
    }
    function closeMedModal() {
      document.getElementById('medModal').classList.remove('open');
    }

    /* ── TRIGGER APP on payment success OR ?app=1 demo ── */
    // Override the showStep(3) modal success to also launch app
    const _origShowStep = showStep;
    window.showStep = function (n) {
      _origShowStep(n);
      if (n === 3) {
        const name = document.getElementById('inp-name')?.value || '';
        // Delay app launch until user clicks close, or auto after 3s
        setTimeout(() => { closeModal(); showApp(name); }, 3000);
      }
    };

    // Check URL for demo mode
    window.addEventListener('DOMContentLoaded', () => {
      if (new URLSearchParams(window.location.search).get('app') === '1') {
        showApp('Krystyna Wiśniewska');
      }
    });

    /* ══════ NOWE FUNKCJE ══════ */

    /* Plan toggle (landing) */
    let currentPlan = 'monthly';
    function switchPlan(plan) {
      currentPlan = plan;
      const isYearly = plan === 'yearly';
      const pM = parseInt(localStorage.getItem('kz_price_monthly') || '39');
      const pY = parseInt(localStorage.getItem('kz_price_yearly') || '390');
      const bM = document.getElementById('btn-monthly');
      const bY = document.getElementById('btn-yearly');
      if (bM) bM.classList.toggle('active', !isYearly);
      if (bY) bY.classList.toggle('active', isYearly);

      const pNum = document.getElementById('price-num');
      if (pNum) pNum.textContent = isYearly ? pY : pM;

      const pPer = document.getElementById('price-period');
      if (pPer) pPer.textContent = isYearly ? '/ rok' : '/ miesiąc';

      const pSub = document.getElementById('price-sub');
      if (pSub) pSub.textContent = isYearly ? `2 miesiące gratis! Oszczędzasz ${pM * 12 - pY} zł 🎉` : 'To mniej niż dwie kawy tygodniowo ☕';

      const mBtn = document.getElementById('main-join-btn');
      if (mBtn) mBtn.textContent = isYearly ? `Dołączam na rok za ${pY} zł →` : `Dołączam do VitalFly za ${pM} zł/miesiąc →`;

      localStorage.setItem('kz_plan', plan);
    }

    // Wymuszenie odświeżenia cen po wejściu na stronę główną
    window.addEventListener('DOMContentLoaded', () => { switchPlan('monthly'); });



    function viewTerms(page) {
      document.getElementById('appShell').style.display = 'none';

      document.querySelectorAll('body > *:not(#appShell):not(.modal-overlay):not(#adminShell)').forEach(el => {
        el.style.display = 'none';
      });

      const target = document.getElementById('pg-' + page);
      if (target) target.style.display = 'block';

      if (!document.getElementById('backToAppBtn')) {
        const btn = document.createElement('button');
        btn.id = 'backToAppBtn';
        btn.innerHTML = '← Wróć do Panelu';
        btn.style.cssText = 'position:fixed;top:20px;left:20px;z-index:99999;background:var(--navy);color:white;border:none;padding:12px 24px;border-radius:30px;cursor:pointer;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,0.4);font-size:1rem;';
        document.body.appendChild(btn);
      }

      const btn = document.getElementById('backToAppBtn');
      btn.style.display = 'block';
      btn.onclick = () => {
        if (target) target.style.display = 'none';
        document.getElementById('appShell').style.display = 'block';
        btn.style.display = 'none';
      };
      window.scrollTo(0, 0);
    }

    /* Profil */
    const AVATARS = ['🧓', '👴', '👵', '🧑', '👨', '👩', '🏃', '🧘', '🌿', '🌟'];
    let avatarIdx = 0;
    function changeAvatar() {
      avatarIdx = (avatarIdx + 1) % AVATARS.length;
      const el = document.getElementById('profile-avatar-display');
      if (el) el.textContent = AVATARS[avatarIdx];
      localStorage.setItem('kz_avatar', avatarIdx);
    }
    function saveProfile() {
      const name = document.getElementById('s-name')?.value.trim();
      const email = document.getElementById('s-email')?.value.trim();
      const phone = document.getElementById('s-phone')?.value.trim();
      if (name) {
        localStorage.setItem('kz_name', name);
        localStorage.setItem('kz_logged_in_name', name);
        const firstName = name.split(' ')[0] || 'Seniorze';
        const el = document.getElementById('app-username');
        if (el) el.textContent = `${firstName}! 👋`;
      }
      if (email) localStorage.setItem('kz_email', email);
      if (phone) localStorage.setItem('kz_phone', phone);
      syncToCloud();
      showToast('✅ Profil zapisany!');
    }
    function loadProfile() {
      const n = localStorage.getItem('kz_name'), e = localStorage.getItem('kz_email'), p = localStorage.getItem('kz_phone');
      const ni = document.getElementById('s-name'), ei = document.getElementById('s-email'), pi = document.getElementById('s-phone');
      if (n && ni) ni.value = n; if (e && ei) ei.value = e; if (p && pi) pi.value = p;
      const ai = parseInt(localStorage.getItem('kz_avatar') || '0');
      avatarIdx = ai;
      const av = document.getElementById('profile-avatar-display');
      if (av) av.textContent = AVATARS[ai];
    }

    /* Plan w ustawieniach */
    function upgradePlan() {
      const btn = document.getElementById('upgrade-btn');
      const label = document.getElementById('plan-current-label');
      const badge = document.getElementById('app-plan-badge');
      localStorage.setItem('kz_plan', 'yearly');
      if (label) label.textContent = '📅 Roczny • 390 zł/rok';
      if (btn) { btn.textContent = '✓ Plan roczny aktywny'; btn.disabled = true; btn.style.background = '#4DBFA8'; }
      if (badge) badge.textContent = '✓ PLAN ROCZNY';
      showToast('🎉 Upgrade na plan roczny! Zaoszczędzasz 78 zł.');
      loadPlanSettings();
      syncToCloud();
    }
    function cancelSubscription() {
      if (confirm('Czy na pewno chcesz anulować subskrypcję? Zachowasz dostęp do końca opłaconego okresu.')) {
        localStorage.setItem('kz_plan', 'cancelled');
        loadPlanSettings();
        syncToCloud();
        showToast('✅ Subskrypcja została anulowana.');
      }
    }
    function loadPlanSettings() {
      const plan = localStorage.getItem('kz_plan') || 'monthly';
      const label = document.getElementById('plan-current-label');
      const btn = document.getElementById('upgrade-btn');
      const badge = document.getElementById('app-plan-badge');
      const cancelBtn = document.getElementById('cancel-sub-btn');

      // Przywrócenie domyślnych stanów przycisków
      if (btn) {
        btn.style.display = 'inline-block';
        btn.disabled = false;
        btn.textContent = 'Przejdź na Roczny →';
        btn.style.background = '';
      }
      if (cancelBtn) {
        cancelBtn.style.display = 'inline-block';
        cancelBtn.disabled = false;
        cancelBtn.textContent = 'Rezygnuj z subskrypcji';
        cancelBtn.style.background = '';
        cancelBtn.style.color = '';
        cancelBtn.style.borderColor = '';
        cancelBtn.style.cursor = 'pointer';
      }

      if (plan === 'yearly') {
        if (label) label.textContent = '📅 Roczny • 390 zł/rok';
        if (btn) { btn.textContent = '✓ Plan roczny aktywny'; btn.disabled = true; btn.style.background = '#4DBFA8'; }
        if (badge) {
          badge.textContent = '✓ PLAN ROCZNY';
          badge.style.display = 'inline-block';
          badge.style.background = '';
        }
      } else if (plan === 'cancelled') {
        if (label) label.textContent = '❌ Anulowana (wygaśnie wkrótce)';
        if (btn) btn.style.display = 'none';
        if (badge) {
          badge.textContent = '❌ SUB. ANULOWANA';
          badge.style.display = 'inline-block';
          badge.style.background = '#E05252';
        }
        if (cancelBtn) {
          cancelBtn.textContent = '✓ Subskrypcja anulowana';
          cancelBtn.disabled = true;
          cancelBtn.style.background = 'rgba(0,0,0,0.05)';
          cancelBtn.style.color = 'var(--warm-gray)';
          cancelBtn.style.borderColor = 'transparent';
          cancelBtn.style.cursor = 'default';
        }
      } else {
        if (label) label.textContent = '📅 Miesięczny • 39 zł/miesiąc';
        if (badge) {
          badge.textContent = '✓ PLAN MIESIĘCZNY';
          badge.style.display = 'inline-block';
          badge.style.background = '';
        }
      }
    }

    /* Personalizacja diety */
    let dietPrefs = JSON.parse(localStorage.getItem('kz_diet_prefs') || '[]');
    function toggleDietPref(pref, el) {
      const idx = dietPrefs.indexOf(pref);
      if (idx > -1) { dietPrefs.splice(idx, 1); el.classList.remove('active'); }
      else { dietPrefs.push(pref); el.classList.add('active'); }
    }
    function saveDietPrefs() {
      localStorage.setItem('kz_diet_prefs', JSON.stringify(dietPrefs));
      clearDietCache();
      syncToCloud();
      showToast('✅ Preferencje diety zapisane!');
    }
    function loadDietPrefs() {
      dietPrefs = JSON.parse(localStorage.getItem('kz_diet_prefs') || '[]');
      document.querySelectorAll('.diet-pref-chip').forEach(chip => {
        const pref = chip.getAttribute('onclick').match(/'([^']+)'/)?.[1];
        if (pref && dietPrefs.includes(pref)) chip.classList.add('active');
      });
    }

    /* Powiadomienia – ustawienia */
    function saveNotifSettings() {
      const time = document.getElementById('notif-exercise-time')?.value;
      const enabled = document.getElementById('notif-exercise-enabled')?.checked;
      const quiet = document.getElementById('notif-quiet')?.checked;
      localStorage.setItem('kz_notif', JSON.stringify({ time, enabled, quiet }));
      showToast('🔔 Ustawienia powiadomień zapisane!');
    }
    function loadNotifSettings() {
      const s = JSON.parse(localStorage.getItem('kz_notif') || '{}');
      const t = document.getElementById('notif-exercise-time');
      const e = document.getElementById('notif-exercise-enabled');
      const q = document.getElementById('notif-quiet');
      if (t && s.time) t.value = s.time;
      if (e) e.checked = !!s.enabled;
      if (q) q.checked = !!s.quiet;
    }

    /* Stan zdrowia i dolegliwości */
    function switchSubTab(tabName) {
      const prefsContent = document.getElementById('sub-tab-prefs-content');
      const healthContent = document.getElementById('sub-tab-health-content');
      const prefsBtn = document.getElementById('btn-sub-tab-prefs');
      const healthBtn = document.getElementById('btn-sub-tab-health');

      if (tabName === 'prefs') {
        if (prefsContent) prefsContent.style.display = 'block';
        if (healthContent) healthContent.style.display = 'none';
        if (prefsBtn) prefsBtn.classList.add('active');
        if (healthBtn) healthBtn.classList.remove('active');
      } else if (tabName === 'health') {
        if (prefsContent) prefsContent.style.display = 'none';
        if (healthContent) healthContent.style.display = 'block';
        if (prefsBtn) prefsBtn.classList.remove('active');
        if (healthBtn) healthBtn.classList.add('active');
        loadHealthProfile();
      }
    }

    function saveHealthProfile() {
      const text = document.getElementById('health-issues-input')?.value.trim() || '';
      localStorage.setItem('kz_health_issues', text);
      clearDietCache();
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
        window.Capacitor.Plugins.Preferences.set({ key: 'kz_health_issues', value: text });
      }
      syncToCloud();
      showToast('🩺 Profil zdrowotny został zaktualizowany w pamięci AI!');
    }
    async function loadHealthProfile() {
      let text = localStorage.getItem('kz_health_issues') || '';
      if (!text && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
        const stored = await window.Capacitor.Plugins.Preferences.get({ key: 'kz_health_issues' });
        if (stored.value) {
          text = stored.value;
          localStorage.setItem('kz_health_issues', text);
        }
      }
      const input = document.getElementById('health-issues-input');
      if (input) input.value = text;
    }

    /* Rozmiar tekstu */
    function setFontSize(size) {
      ['sm', 'md', 'lg', 'xl'].forEach(s => {
        document.body.classList.remove('fs-' + s);
        document.documentElement.classList.remove('fs-' + s);
        const btn = document.getElementById('fs-' + s);
        if (btn) btn.classList.remove('active');
      });
      document.body.classList.add('fs-' + size);
      document.documentElement.classList.add('fs-' + size);
      const btn = document.getElementById('fs-' + size);
      if (btn) btn.classList.add('active');
      localStorage.setItem('kz_fontsize', size);
    }

    /* Motyw */
    function setTheme(theme) {
      document.body.classList.toggle('theme-dark', theme === 'dark');
      ['light', 'dark'].forEach(t => {
        const btn = document.getElementById('theme-' + t);
        if (btn) btn.classList.toggle('active', t === theme);
      });
      localStorage.setItem('kz_theme', theme);
    }

    /* Init ustawień przy showApp */
    function initSettings() {
      const fs = localStorage.getItem('kz_fontsize') || 'md';
      const theme = localStorage.getItem('kz_theme') || 'light';
      setFontSize(fs);
      setTheme(theme);
      try { loadProfile(); } catch (e) { console.error('Error loading profile:', e); }
      loadPlanSettings();
      loadDietPrefs();
      loadNotifSettings();
      try { loadHealthProfile(); } catch (e) { console.error('Error loading health profile:', e); }
    }

    /* Ogłoszenia admina */
    function showAnnounceIfExists() {
      const txt = localStorage.getItem('kz_announce');
      if (!txt) return;
      const wc = document.querySelector('.welcome-card');
      if (!wc) return;
      const banner = document.createElement('div');
      banner.style.cssText = 'background:linear-gradient(135deg,#FF6B35,#FF8C42);border-radius:14px;padding:1rem 1.5rem;margin-bottom:1rem;color:white;font-weight:600;font-size:1rem;';
      banner.textContent = '📢 ' + txt;
      wc.parentNode.insertBefore(banner, wc);
    }

    /* ══ ADMIN ══ */
    const ADMIN_PASS = 'admin2025';
    let adminClickCount = 0;
    let adminClickTimer = null;

    function adminClickTrigger() {
      adminClickCount++;
      clearTimeout(adminClickTimer);
      adminClickTimer = setTimeout(() => adminClickCount = 0, 2500);
      if (adminClickCount >= 5) { adminClickCount = 0; openAdmin(); }
    }

    function openAdmin() {
      const shell = document.getElementById('adminShell');
      if (!shell) return;
      shell.style.display = 'block';
      document.getElementById('adminLoginView').style.display = 'block';
      document.getElementById('adminPanelView').style.display = 'none';
      document.getElementById('admin-login-err').style.display = 'none';
      document.getElementById('admin-pass-input').value = '';
      document.getElementById('admin-pass-input').focus();
    }

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

    function addAdminDiet() {
      APP_DATA.diets.push({ id: Date.now(), title: 'Nowy Jadłospis', emoji: '🥗', tag: 'Nowa', meals: ['Śniadanie: ...', 'Obiad: ...', 'Kolacja: ...'], shopping: ['Składnik 1'] });
      renderAdminContent();
      saveData('diets');
    }

    function delAdminDiet(i) {
      if (confirm('Na pewno chcesz usunąć ten jadłospis?')) {
        APP_DATA.diets.splice(i, 1);
        renderAdminContent();
        saveData('diets');
      }
    }

    async function saveAdminPrices() {
      const pm = document.getElementById('admin-price-monthly').value;
      const py = document.getElementById('admin-price-yearly').value;
      if (pm) localStorage.setItem('kz_price_monthly', pm);
      if (py) localStorage.setItem('kz_price_yearly', py);
      if (typeof switchPlan === 'function' && typeof currentPlan !== 'undefined') switchPlan(currentPlan);

      showToast('⏳ Zapisywanie cennika do chmury...');
      const ok = await saveToCloud();
      if (ok) showToast('💰 Cennik pomyślnie zaktualizowany na serwerze!');
    }

    function loadAdminPrices() {
      const pm = document.getElementById('admin-price-monthly');
      const py = document.getElementById('admin-price-yearly');
      if (pm) pm.value = localStorage.getItem('kz_price_monthly') || '39';
      if (py) py.value = localStorage.getItem('kz_price_yearly') || '390';
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

      const dList = document.getElementById('admin-diets-list');
      if (dList) dList.innerHTML = APP_DATA.diets.map((d, i) => `
      <div style="background:#f8f9fa;border:1px solid #e2e8f0;border-radius:12px;padding:1rem;margin-bottom:1rem;position:relative;">
        <button onclick="delAdminDiet(${i})" style="position:absolute;top:1rem;right:1rem;background:none;border:none;color:#e53e3e;cursor:pointer;font-weight:bold;padding:0;">✕ Usuń</button>
        <div style="display:flex;gap:.5rem;margin-bottom:.5rem;padding-right:4rem;flex-wrap:wrap;">
          <input class="admin-input" style="width:4rem;text-align:center;" value="${d.emoji}" onchange="APP_DATA.diets[${i}].emoji=this.value" placeholder="🥗" />
          <input class="admin-input" style="flex:1;min-width:150px;" value="${d.title}" onchange="APP_DATA.diets[${i}].title=this.value" placeholder="Tytuł jadłospisu" />
          <input class="admin-input" style="width:7rem;" value="${d.tag}" onchange="APP_DATA.diets[${i}].tag=this.value" placeholder="Tag" />
        </div>
        <div style="margin-bottom:.5rem;">
          <div style="font-size:.85rem;color:var(--navy);font-weight:600;margin-bottom:.2rem;">Posiłki (każdy w osobnej linii):</div>
          <textarea class="admin-input" style="min-height:90px;resize:vertical;" onchange="APP_DATA.diets[${i}].meals=this.value.split('\\n').filter(x=>x.trim())">${d.meals.join('\n')}</textarea>
        </div>
        <div>
          <div style="font-size:.85rem;color:var(--navy);font-weight:600;margin-bottom:.2rem;">Zakupy (każdy w osobnej linii):</div>
          <textarea class="admin-input" style="min-height:90px;resize:vertical;" onchange="APP_DATA.diets[${i}].shopping=this.value.split('\\n').filter(x=>x.trim())">${d.shopping.join('\n')}</textarea>
        </div>
        <div style="text-align:right;margin-top:.5rem;"><button class="admin-btn" style="padding:.4rem 1rem;" onclick="saveData('diets')">Zapisz ten jadłospis</button></div>
      </div>
    `).join('') + `<button class="admin-btn" style="width:100%;background:#e2e8f0;color:#2d3748;margin-top:.5rem;" onclick="addAdminDiet()">+ Dodaj nowy jadłospis</button>`;

      loadAdminPrices();
    }

    function toggleModule(name, enabled) {
      localStorage.setItem('kz_mod_' + name, enabled ? '1' : '0');
      if (name === 'shop') {
        const shopTab = document.querySelector('.video-library-tab[onclick*="\'shop\'"]');
        if (shopTab) shopTab.style.display = enabled ? '' : 'none';
      } else {
        const tabBtn = document.querySelector(`.tab-btn[onclick*="'${name}'"]`);
        if (tabBtn) tabBtn.style.display = enabled ? '' : 'none';
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

    /* ── CLOUD DATABASE (SUPABASE) ── */
    const SUPA_URL = "https://idpwlfgicadaeqakhkqa.supabase.co/rest/v1/vitalfly_data";
    const SUPA_KEY = "sb_publishable___S6vns0m3SKvlFngRtpFA_NDUwSATq";

    if (typeof supabase !== 'undefined' && !window.supabaseClient) {
      window.supabaseClient = supabase.createClient("https://idpwlfgicadaeqakhkqa.supabase.co", SUPA_KEY);
    }

    async function syncFromCloud() {
      try {
        const res = await fetch(`${SUPA_URL}?id=eq.1`, {
          headers: { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY }
        });
        const data = await res.json();
        if (data && data.length > 0 && data[0].payload) {
          const cloud = data[0].payload;
          if (cloud.videos && cloud.videos.length > 0) APP_DATA.videos = cloud.videos;
          if (cloud.diets && cloud.diets.length > 0) APP_DATA.diets = cloud.diets;
          if (cloud.priceM) localStorage.setItem('kz_price_monthly', cloud.priceM);
          if (cloud.priceY) localStorage.setItem('kz_price_yearly', cloud.priceY);
          if (cloud.announce !== undefined) localStorage.setItem('kz_announce', cloud.announce);
          if (cloud.geminiApiKey !== undefined) localStorage.setItem('kz_gemini_api_key', cloud.geminiApiKey);

          // Odśwież UI, jeśli zdążyło się już załadować z defaults
          renderVideos();
          renderDiets();
          showAnnounceIfExists();
          if (typeof switchPlan === 'function' && typeof currentPlan !== 'undefined') switchPlan(currentPlan);
          if (document.getElementById('adminPanelView').style.display !== 'none') {
            renderAdminContent();
          }
        }
      } catch (e) {
        console.warn("Brak połączenia z Supabase lub brak danych:", e);
      }
    }

    async function saveToCloud() {
      const vids = APP_DATA.videos;
      if (vids.some(v => v.url && v.url.includes('blob:'))) {
        alert('❌ ZATRZYMANO ZAPIS - WYKRYTO PLIK Z KOMPUTERA!\n\nJeden lub więcej filmów w panelu został wgrany poprzez przeciągnięcie z dysku. Taki plik nie zadziała w internecie!\nZmień ten film na poprawny link YouTube przed zapisem w chmurze.');
        return false;
      }

      const payload = {
        videos: APP_DATA.videos,
        diets: APP_DATA.diets,
        priceM: localStorage.getItem('kz_price_monthly') || '39',
        priceY: localStorage.getItem('kz_price_yearly') || '390',
        announce: localStorage.getItem('kz_announce') || '',
        geminiApiKey: localStorage.getItem('kz_gemini_api_key') || ''
      };

      try {
        const res = await fetch(`${SUPA_URL}?id=eq.1`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPA_KEY,
            'Authorization': 'Bearer ' + SUPA_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ payload })
        });
        if (!res.ok) {
          const errBody = await res.text();
          throw new Error('Status ' + res.status + '\nSzczegóły: ' + errBody);
        }
        return true;
      } catch (e) {
        alert("Błąd zapisu w chmurze! Upewnij się, że wykonałeś KROK 2 (kod SQL) z instrukcji.\n\nDokładny błąd serwera:\n" + e.message);
        console.error(e);
        return false;
      }
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
      renderVideos();
      updateDietLikeBtn();
      syncToCloud();
    };

    window.removeLikedShopping = function (idx) {
      let liked = JSON.parse(localStorage.getItem('kz_liked_shopping') || '[]');
      liked.splice(idx, 1);
      localStorage.setItem('kz_liked_shopping', JSON.stringify(liked));
      showToast('💔 Usunięto listę zakupów z ulubionych');
      renderVideos();
      const currentDietDuration = parseInt(localStorage.getItem('kz_diet_duration') || '1');
      const cached = localStorage.getItem(`kz_cached_diet_${currentDietDuration}`);
      if (cached) {
        try {
          displayDietPlan(JSON.parse(cached));
        } catch (e) { }
      }
      syncToCloud();
    };
