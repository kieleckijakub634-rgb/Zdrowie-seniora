/* Global health/diet/video state to prevent ReferenceErrors */
window.selectedDiet = window.selectedDiet || parseInt(localStorage.getItem('kz_selected_diet') || '1');
window.dietPrefs = window.dietPrefs || JSON.parse(localStorage.getItem('kz_diet_prefs') || '[]');
window.likedVideos = window.likedVideos || JSON.parse(localStorage.getItem('kz_liked_videos') || '[]');

/* ── Modal ── */
    function openModal() { document.getElementById('signupModal').classList.add('open'); document.body.style.overflow = 'hidden'; showStep(1); }
    function closeModal() { document.getElementById('signupModal').classList.remove('open'); document.body.style.overflow = ''; }
    function handleOverlayClick(e) { if (e.target === document.getElementById('signupModal')) closeModal(); }

    function openLoginModal() { document.getElementById('loginModal').classList.add('open'); document.body.style.overflow = 'hidden'; }
    function closeLoginModal() { 
      document.getElementById('loginModal').classList.remove('open'); 
      document.body.style.overflow = ''; 
      const successEl = document.getElementById('login-confirm-success');
      if (successEl) successEl.style.display = 'none';
    }
    function openPaymentSuccessModal() { document.getElementById('paymentSuccessModal').classList.add('open'); document.body.style.overflow = 'hidden'; }
    function closePaymentSuccessModal() { document.getElementById('paymentSuccessModal').classList.remove('open'); document.body.style.overflow = ''; }
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
      window.location.href = '/';
    }

    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeLoginModal(); closeResetPasswordModal(); } });

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

    /* ── CLOUD DATABASE (SUPABASE) ── */
    const SUPA_URL = "https://idpwlfgicadaeqakhkqa.supabase.co/rest/v1/vitalfly_data";
    const SUPA_KEY = "sb_publishable___S6vns0m3SKvlFngRtpFA_NDUwSATq";

    if (typeof supabase !== 'undefined' && !window.supabaseClient) {
      window.supabaseClient = supabase.createClient("https://idpwlfgicadaeqakhkqa.supabase.co", SUPA_KEY);
    }

    if (window.supabaseClient) {
      window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          openResetPasswordModal();
        }
      });
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

    /* ── RESET / ZMIANA HASŁA ── */

    function showForgotPasswordForm(e) {
      if (e) e.preventDefault();
      document.getElementById('login-view-main').style.display = 'none';
      document.getElementById('login-view-forgot').style.display = 'block';
      document.getElementById('forgot-email').value = '';
      const err = document.getElementById('err-forgot');
      if (err) err.style.display = 'none';
    }

    function showLoginView(e) {
      if (e) e.preventDefault();
      document.getElementById('login-view-forgot').style.display = 'none';
      document.getElementById('login-view-main').style.display = 'block';
      document.getElementById('login-email').value = '';
      document.getElementById('login-password').value = '';
      const err = document.getElementById('err-login');
      if (err) err.style.display = 'none';
    }

    async function handleForgotPasswordSubmit() {
      const email = document.getElementById('forgot-email').value.trim();
      const errEl = document.getElementById('err-forgot');
      if (errEl) errEl.style.display = 'none';

      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(email)) {
        if (errEl) {
          errEl.textContent = 'Proszę wpisać poprawny adres e-mail.';
          errEl.style.display = 'block';
        }
        return;
      }

      const btn = document.getElementById('btn-forgot-submit');
      const origText = btn ? btn.innerHTML : 'Wyślij';
      if (btn) {
        btn.innerHTML = 'Wysyłanie...';
        btn.disabled = true;
      }

      if (window.supabaseClient) {
        const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/'
        });

        if (error) {
          if (errEl) {
            errEl.textContent = 'Błąd: ' + error.message;
            errEl.style.display = 'block';
          }
          if (btn) {
            btn.innerHTML = origText;
            btn.disabled = false;
          }
        } else {
          alert('Link do zresetowania hasła został wysłany na podany e-mail.');
          closeLoginModal();
          showLoginView();
          if (btn) {
            btn.innerHTML = origText;
            btn.disabled = false;
          }
        }
      } else {
        if (errEl) {
          errEl.textContent = 'Błąd połączenia z bazą danych.';
          errEl.style.display = 'block';
        }
        if (btn) {
          btn.innerHTML = origText;
          btn.disabled = false;
        }
      }
    }

    function openResetPasswordModal() {
      closeLoginModal();
      closeModal();
      const modal = document.getElementById('resetPasswordModal');
      if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
      const p1 = document.getElementById('reset-password');
      const p2 = document.getElementById('reset-password-confirm');
      if (p1) p1.value = '';
      if (p2) p2.value = '';
      const errEl = document.getElementById('err-reset');
      if (errEl) errEl.style.display = 'none';
    }

    function closeResetPasswordModal() {
      const modal = document.getElementById('resetPasswordModal');
      if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
      }
    }

    async function handlePasswordResetSubmit() {
      const pwd = document.getElementById('reset-password').value.trim();
      const pwdConfirm = document.getElementById('reset-password-confirm').value.trim();
      const errEl = document.getElementById('err-reset');
      if (errEl) errEl.style.display = 'none';

      if (pwd.length < 6) {
        if (errEl) {
          errEl.textContent = 'Hasło musi mieć co najmniej 6 znaków.';
          errEl.style.display = 'block';
        }
        return;
      }

      if (pwd !== pwdConfirm) {
        if (errEl) {
          errEl.textContent = 'Hasła nie pasują do siebie.';
          errEl.style.display = 'block';
        }
        return;
      }

      const btn = document.getElementById('btn-reset-submit');
      const origText = btn ? btn.innerHTML : 'Zmień hasło';
      if (btn) {
        btn.innerHTML = 'Zapisywanie...';
        btn.disabled = true;
      }

      if (window.supabaseClient) {
        const { error } = await window.supabaseClient.auth.updateUser({ password: pwd });

        if (error) {
          if (errEl) {
            errEl.textContent = 'Błąd zapisu: ' + error.message;
            errEl.style.display = 'block';
          }
          if (btn) {
            btn.innerHTML = origText;
            btn.disabled = false;
          }
        } else {
          alert('Hasło zostało pomyślnie zmienione! Zostałeś automatycznie zalogowany.');
          closeResetPasswordModal();
          if (btn) {
            btn.innerHTML = origText;
            btn.disabled = false;
          }

          // Pobierz aktualne dane użytkownika i przejdź do aplikacji
          const { data: { user } } = await window.supabaseClient.auth.getUser();
          let displayName = user?.user_metadata?.full_name || 'Seniorze';
          try {
            const { data: profile } = await window.supabaseClient.from('user_profiles').select('app_data').eq('id', user.id).single();
            if (profile && profile.app_data) {
              const cloud = profile.app_data;
              if (cloud.profileName) displayName = cloud.profileName;
            }
          } catch (e) {
            console.error("Błąd wczytywania profilu po zmianie hasła:", e);
          }
          showApp(displayName);
        }
      } else {
        if (errEl) {
          errEl.textContent = 'Błąd połączenia z bazą danych.';
          errEl.style.display = 'block';
        }
        if (btn) {
          btn.innerHTML = origText;
          btn.disabled = false;
        }
      }
    }

    async function triggerPasswordResetFromSettings() {
      if (!window.supabaseClient) {
        alert('Błąd połączenia z bazą danych.');
        return;
      }

      const { data: { user } } = await window.supabaseClient.auth.getUser();
      const email = user?.email || localStorage.getItem('kz_email');

      if (!email) {
        alert('Nie udało się ustalić Twojego adresu e-mail. Skontaktuj się ze wsparciem.');
        return;
      }

      const btn = document.querySelector('.settings-row button[onclick="triggerPasswordResetFromSettings()"]');
      let origText = '';
      if (btn) {
        origText = btn.innerHTML;
        btn.innerHTML = 'Wysyłanie...';
        btn.disabled = true;
      }

      const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/'
      });

      if (error) {
        alert('Błąd wysyłania e-maila: ' + error.message);
        if (btn) {
          btn.innerHTML = origText;
          btn.disabled = false;
        }
      } else {
        alert('Link do zmiany hasła został wysłany na Twój adres e-mail: ' + email);
        if (btn) {
          btn.innerHTML = origText;
          btn.disabled = false;
        }
      }
    }
