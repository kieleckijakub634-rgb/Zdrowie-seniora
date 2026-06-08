/* Global health/diet/video state to prevent ReferenceErrors */
window.selectedDiet = window.selectedDiet || parseInt(localStorage.getItem('kz_selected_diet') || '1');
window.dietPrefs = window.dietPrefs || JSON.parse(localStorage.getItem('kz_diet_prefs') || '[]');
window.likedVideos = window.likedVideos || JSON.parse(localStorage.getItem('kz_liked_videos') || '[]');

window.asyncSetItem = window.asyncSetItem || async function(key, value) {
  localStorage.setItem(key, value);
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
    try {
      await window.Capacitor.Plugins.Preferences.set({ key, value });
    } catch (e) {
      console.error("Capacitor Preference set error:", e);
    }
  }
};

window.asyncRemoveItem = window.asyncRemoveItem || async function(key) {
  localStorage.removeItem(key);
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
    try {
      await window.Capacitor.Plugins.Preferences.remove({ key });
    } catch (e) {
      console.error("Capacitor Preference remove error:", e);
    }
  }
};

window.applyUserProfileData = async function(cloud) {
  cloud = cloud || {};
  const hasCloudField = (key) => Object.prototype.hasOwnProperty.call(cloud, key);
  const readJsonItem = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (e) {
      return fallback;
    }
  };
  
  // 1. Medications
  const medicationsVal = hasCloudField('medications')
    ? (cloud.medications || [])
    : (typeof APP_DATA !== 'undefined' ? (APP_DATA.medications || []) : readJsonItem('kz_medications', []));
  if (typeof APP_DATA !== 'undefined') {
    APP_DATA.medications = medicationsVal;
  }
  await window.asyncSetItem('kz_medications', JSON.stringify(medicationsVal));
  
  // 2. Dogtag
  if (hasCloudField('dogtag')) {
    if (cloud.dogtag) {
      await window.asyncSetItem('vf_dogtag', JSON.stringify(cloud.dogtag));
    } else {
      await window.asyncRemoveItem('vf_dogtag');
    }
  }
  
  // 3. Profile Name
  const profileName = hasCloudField('profileName') ? (cloud.profileName || '') : (localStorage.getItem('kz_name') || '');
  await window.asyncSetItem('kz_name', profileName);
  await window.asyncSetItem('kz_logged_in_name', profileName);
  
  // 4. Profile Phone
  const profilePhone = hasCloudField('profilePhone') ? (cloud.profilePhone || '') : (localStorage.getItem('kz_phone') || '');
  await window.asyncSetItem('kz_phone', profilePhone);
  
  // 5. Profile Email
  const profileEmail = hasCloudField('profileEmail') ? (cloud.profileEmail || '') : (localStorage.getItem('kz_email') || '');
  await window.asyncSetItem('kz_email', profileEmail);
  
  // 6. Selected Diet
  const selectedDietSource = hasCloudField('selectedDiet')
    ? cloud.selectedDiet
    : (localStorage.getItem('kz_selected_diet') || window.selectedDiet || 1);
  const selectedDietVal = parseInt(selectedDietSource) || 1;
  await window.asyncSetItem('kz_selected_diet', selectedDietVal.toString());
  window.selectedDiet = selectedDietVal;
  
  // 7. Diet Prefs
  const dietPrefsVal = hasCloudField('dietPrefs')
    ? (Array.isArray(cloud.dietPrefs) ? cloud.dietPrefs : [])
    : readJsonItem('kz_diet_prefs', window.dietPrefs || []);
  await window.asyncSetItem('kz_diet_prefs', JSON.stringify(dietPrefsVal));
  window.dietPrefs = dietPrefsVal;
  
  // 8. Liked Videos
  const likedVideosVal = hasCloudField('likedVideos')
    ? (Array.isArray(cloud.likedVideos) ? cloud.likedVideos : [])
    : readJsonItem('kz_liked_videos', window.likedVideos || []);
  await window.asyncSetItem('kz_liked_videos', JSON.stringify(likedVideosVal));
  window.likedVideos = likedVideosVal;
  
  // 9. Health Issues
  const healthIssuesVal = hasCloudField('healthIssues') ? (cloud.healthIssues || '') : (localStorage.getItem('kz_health_issues') || '');
  await window.asyncSetItem('kz_health_issues', healthIssuesVal);

};

/* ── Modal ── */
    let lastModalTrigger = null;
    function openAccessibleModal(modal, preferredFocus) {
      if (!modal) return;
      lastModalTrigger = document.activeElement;
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        const target = preferredFocus || modal.querySelector('input:not([type="hidden"]), button, select, textarea, a[href]');
        if (target) target.focus();
      });
    }
    function closeAccessibleModal(modal) {
      if (!modal) return;
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      if (!document.querySelector('.modal-overlay.open')) document.body.style.overflow = '';
      if (lastModalTrigger && typeof lastModalTrigger.focus === 'function') lastModalTrigger.focus();
      lastModalTrigger = null;
    }
    window.openAccessibleModal = openAccessibleModal;
    window.closeAccessibleModal = closeAccessibleModal;

    document.addEventListener('keydown', (event) => {
      const modal = document.querySelector('.modal-overlay.open');
      if (!modal) return;
      if (event.key === 'Escape') {
        const closeButton = modal.querySelector('.modal-close');
        if (closeButton && closeButton.offsetParent !== null) closeButton.click();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        .filter(element => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    function openModal() { openAccessibleModal(document.getElementById('signupModal'), document.getElementById('inp-name')); showStep(1); }
    function closeModal() { 
      const step3 = document.getElementById('step3');
      if (step3 && step3.style.display === 'block') {
        alert('Musisz autoryzować konto, wpisując kod lub klikając link w e-mailu, aby móc przejść dalej.');
        return;
      }
      closeAccessibleModal(document.getElementById('signupModal'));
    }
    function handleOverlayClick(e) { if (e.target === document.getElementById('signupModal')) closeModal(); }

    function openLoginModal() { openAccessibleModal(document.getElementById('loginModal'), document.getElementById('login-email')); }
    function closeLoginModal() { 
      closeAccessibleModal(document.getElementById('loginModal'));
      const successEl = document.getElementById('login-confirm-success');
      if (successEl) successEl.style.display = 'none';
    }
    function openAccessRequiredModal() {
      const error = document.getElementById('err-access-checkout');
      if (error) {
        error.textContent = '';
        error.style.display = 'none';
      }
      openAccessibleModal(document.getElementById('accessRequiredModal'), document.getElementById('btn-access-checkout'));
    }
    function closeAccessRequiredModal() {
      closeAccessibleModal(document.getElementById('accessRequiredModal'));
    }
    function returnToLoginFromAccess() {
      closeAccessRequiredModal();
      openLoginModal();
    }
    async function startAccessCheckout() {
      const button = document.getElementById('btn-access-checkout');
      const error = document.getElementById('err-access-checkout');
      const originalText = button ? button.textContent : '';
      if (error) {
        error.textContent = '';
        error.style.display = 'none';
      }
      if (button) {
        button.textContent = 'Przekierowanie do Stripe...';
        button.disabled = true;
      }

      try {
        window.initSupabase();
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) throw new Error('Sesja wygasła. Zaloguj się ponownie.');
        const plan = localStorage.getItem('kz_plan') === 'yearly' ? 'yearly' : 'monthly';
        await window.startTestStripeCheckout(user, plan);
      } catch (checkoutError) {
        if (error) {
          error.textContent = checkoutError.message || 'Nie udało się rozpocząć płatności testowej.';
          error.style.display = 'block';
        }
        if (button) {
          button.textContent = originalText;
          button.disabled = false;
        }
      }
    }
    function openPaymentSuccessModal() { openAccessibleModal(document.getElementById('paymentSuccessModal')); }
    function closePaymentSuccessModal() { closeAccessibleModal(document.getElementById('paymentSuccessModal')); }
    async function handleLogin() {
      window.initSupabase();
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
          if (error.message && (error.message.toLowerCase().includes('confirm') || error.message.toLowerCase().includes('potwierdź'))) {
            localStorage.setItem('kz_pending_email', e);
            closeLoginModal();
            const emailDisp = document.getElementById('verify-email-display');
            if (emailDisp) emailDisp.textContent = e;
            const signupModal = document.getElementById('signupModal');
            if (signupModal) {
              openAccessibleModal(signupModal, document.getElementById('verification-code'));
            }
            showStep(3);
            btn.innerHTML = origText; btn.disabled = false;
            return;
          }
          errEl.textContent = 'Nieprawidłowy e-mail lub hasło.';
          errEl.style.display = 'block';
          btn.innerHTML = origText; btn.disabled = false; return;
        }

        // Wczytaj profil użytkownika z bazy i zsynchronizuj stan lokalny
        let displayName = data.user?.user_metadata?.full_name || 'Seniorze';
        try {
          const { data: profile } = await window.supabaseClient.from('user_profiles').select('app_data').eq('id', data.user.id).single();
          const cloud = (profile && profile.app_data) ? profile.app_data : {};
          
          // Uzupełnij brakujące dane profilu z metadanych sesji
          if (!cloud.profileName && data.user?.user_metadata?.full_name) {
            cloud.profileName = data.user.user_metadata.full_name;
          }
          if (data.user?.email && cloud.profileEmail !== data.user.email) {
            cloud.profileEmail = data.user.email;
          }
          if (!cloud.profilePhone && data.user?.user_metadata?.phone) {
            cloud.profilePhone = data.user.user_metadata.phone;
          }

          await window.applyUserProfileData(cloud);
          if (cloud.profileName) {
            displayName = cloud.profileName;
          }
        } catch (e) {
          console.error("Błąd wczytywania profilu:", e);
        }

        const billing = await window.fetchBillingState();
        closeLoginModal();
        if (billing.hasAccess) {
          showApp(displayName);
        } else {
          openAccessRequiredModal();
        }
        btn.innerHTML = origText; btn.disabled = false;
      } else {
        errEl.textContent = 'Błąd połączenia z bazą danych.'; errEl.style.display = 'block';
      }
    }
    async function logout() {
      window.initSupabase();
      if (!confirm('Na pewno chcesz się wylogować?')) return;
      
      // Wyloguj z Supabase (try-catch w razie braku sieci)
      if (window.supabaseClient) {
        try {
          await window.supabaseClient.auth.signOut();
        } catch (e) {
          console.error("Supabase signOut error:", e);
        }
      }

      // Wyczyść localStorage z kluczy kz_*, sb-* oraz vf_dogtag
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('kz_') || key.startsWith('sb-') || key === 'vf_dogtag')) {
          localStorage.removeItem(key);
        }
      }

      // Wyczyść te same klucze z Capacitor Preferences
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
        try {
          const { keys } = await window.Capacitor.Plugins.Preferences.keys();
          for (const key of keys) {
            if (key.startsWith('kz_') || key.startsWith('sb-') || key === 'vf_dogtag') {
              await window.Capacitor.Plugins.Preferences.remove({ key });
            }
          }
        } catch (e) {
          console.error("Capacitor clear preferences error:", e);
        }
      }

      // Reset zmiennych w pamięci RAM
      if (typeof APP_DATA !== 'undefined') {
        APP_DATA.medications = [];
      }
      window.selectedDiet = 1;
      window.dietPrefs = [];
      window.likedVideos = [];

      window.location.href = '/';
    }

    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeLoginModal(); closeResetPasswordModal(); } });

    function getEmailProviderUrl(email) {
      if (!email) return null;
      const domain = email.split('@')[1]?.toLowerCase();
      if (!domain) return null;
      
      if (domain.includes('gmail.com')) return { name: 'Gmail', url: 'https://mail.google.com/' };
      if (domain.includes('wp.pl')) return { name: 'WP Poczta', url: 'https://poczta.wp.pl/' };
      if (domain.includes('onet.pl') || domain.includes('poczta.onet.pl')) return { name: 'Poczta Onet', url: 'https://poczta.onet.pl/' };
      if (domain.includes('o2.pl')) return { name: 'Poczta o2', url: 'https://poczta.o2.pl/' };
      if (domain.includes('interia.pl') || domain.includes('poczta.interia.pl')) return { name: 'Poczta Interia', url: 'https://poczta.interia.pl/' };
      if (domain.includes('gazeta.pl')) return { name: 'Poczta Gazeta.pl', url: 'https://poczta.gazeta.pl/' };
      if (domain.includes('yahoo.com')) return { name: 'Yahoo Mail', url: 'https://mail.yahoo.com/' };
      if (domain.includes('outlook.com') || domain.includes('hotmail.com') || domain.includes('live.com')) return { name: 'Outlook', url: 'https://outlook.live.com/' };
      
      return { name: domain, url: 'https://' + domain };
    }
    window.getEmailProviderUrl = getEmailProviderUrl;

    function showStep(n) {
      [1, 2, 3].forEach(i => {
        const s = document.getElementById('step' + i);
        if (s) s.style.display = (i === n) ? 'block' : 'none';
        const d = document.getElementById('dot' + i);
        if (d) d.classList.toggle('active', i <= n);
      });
      document.getElementById('stepDots').style.display = (n === 3) ? 'none' : 'flex';
      
      const closeBtn = document.querySelector('#signupModal .modal-close');
      if (closeBtn) {
        closeBtn.style.display = (n === 3) ? 'none' : 'block';
      }

      if (n === 3) {
        const email = localStorage.getItem('kz_pending_email') || '';
        const providerBtn = document.getElementById('btn-go-to-email');
        if (providerBtn && email) {
          const provider = getEmailProviderUrl(email);
          if (provider) {
            providerBtn.href = provider.url;
            providerBtn.textContent = `Przejdź do poczty ${provider.name} ✉️`;
            providerBtn.style.display = 'block';
          } else {
            providerBtn.style.display = 'none';
          }
        }
      }
    }
    window.showStep = showStep;

    async function verifyVerificationCode() {
      window.initSupabase();
      const codeInput = document.getElementById('verification-code');
      const errEl = document.getElementById('err-verification');
      const btn = document.getElementById('btn-confirm-code');
      
      if (!codeInput || !errEl || !btn) return;
      
      errEl.style.display = 'none';
      const code = codeInput.value.trim();
      
      if (code.length !== 8 || !/^\d+$/.test(code)) {
        errEl.textContent = 'Kod musi składać się z 8 cyfr.';
        errEl.style.display = 'block';
        return;
      }
      
      const email = localStorage.getItem('kz_pending_email');
      if (!email) {
        errEl.textContent = 'Błąd: Brak zapisanego adresu e-mail. Rozpocznij rejestrację ponownie.';
        errEl.style.display = 'block';
        return;
      }
      
      const origText = btn.innerHTML;
      btn.innerHTML = 'Weryfikacja...';
      btn.disabled = true;
      
      if (window.supabaseClient) {
        try {
          const { data, error } = await window.supabaseClient.auth.verifyOtp({
            email: email,
            token: code,
            type: 'signup'
          });
          
          if (error) {
            errEl.textContent = 'Błąd weryfikacji: ' + error.message;
            errEl.style.display = 'block';
            btn.innerHTML = origText;
            btn.disabled = false;
          } else {
            // Sukces!
            const userId = data.user ? data.user.id : null;
            const pName = localStorage.getItem('kz_pending_name') || 'Seniorze';
            const pPhone = localStorage.getItem('kz_pending_phone') || '';
            
            if (userId) {
              // Zapisz profil, a następnie przejdź do testowej płatności.
              if (typeof saveProfileAndEnterApp === 'function') {
                await saveProfileAndEnterApp(userId, email, pName, pPhone, true, false);
              }
              const plan = localStorage.getItem('kz_pending_checkout_plan') || 'monthly';
              await window.startTestStripeCheckout(data.user, plan);
            } else {
              errEl.textContent = 'Weryfikacja powiodła się, ale nie udało się pobrać danych użytkownika. Spróbuj się zalogować.';
              errEl.style.display = 'block';
              btn.innerHTML = origText;
              btn.disabled = false;
            }
          }
        } catch (e) {
          errEl.textContent = 'Błąd systemu: ' + e.message;
          errEl.style.display = 'block';
          btn.innerHTML = origText;
          btn.disabled = false;
        }
      } else {
        errEl.textContent = 'Błąd połączenia z bazą danych.';
        errEl.style.display = 'block';
        btn.innerHTML = origText;
        btn.disabled = false;
      }
    }
    window.verifyVerificationCode = verifyVerificationCode;

    async function resendVerificationCode(e) {
      if (e) e.preventDefault();
      window.initSupabase();
      const email = localStorage.getItem('kz_pending_email');
      const errEl = document.getElementById('err-verification');
      
      if (!email) {
        alert('Brak zapisanego adresu e-mail. Rozpocznij rejestrację ponownie.');
        return;
      }
      
      if (window.supabaseClient) {
        try {
          const { error } = await window.supabaseClient.auth.resend({
            type: 'signup',
            email: email,
            options: {
              emailRedirectTo: window.getAuthRedirectUrl()
            }
          });
          
          if (error) {
            alert('Błąd wysyłania: ' + error.message);
          } else {
            alert('Nowy kod weryfikacyjny został wysłany na Twój e-mail.');
            if (errEl) errEl.style.display = 'none';
          }
        } catch (err) {
          alert('Błąd systemu: ' + err.message);
        }
      } else {
        alert('Błąd połączenia z bazą danych.');
      }
    }
    window.resendVerificationCode = resendVerificationCode;

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
    async function redirectToStripe() {
      const name = document.getElementById('inp-name').value.trim();
      const email = document.getElementById('inp-email').value.trim();
      const btn = document.querySelector('.btn-stripe');
      const isYearly = localStorage.getItem('kz_plan') === 'yearly';
      const pwd = document.getElementById('inp-password').value.trim();
      const phone = document.getElementById('inp-phone') ? document.getElementById('inp-phone').value.trim() : '';
      const plan = isYearly ? 'yearly' : 'monthly';

      btn.innerHTML = 'Tworzenie bezpiecznego konta...';
      btn.disabled = true;

      localStorage.setItem('kz_pending_email', email);
      localStorage.setItem('kz_pending_name', name);
      localStorage.setItem('kz_pending_phone', phone);
      localStorage.setItem('kz_pending_checkout_plan', plan);

      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
        window.Capacitor.Plugins.Preferences.set({ key: 'kz_pending_email', value: email });
        window.Capacitor.Plugins.Preferences.set({ key: 'kz_pending_name', value: name });
        window.Capacitor.Plugins.Preferences.set({ key: 'kz_pending_phone', value: phone });
      }

      try {
        window.initSupabase();
        let { data: { session } } = await window.supabaseClient.auth.getSession();
        let user = session && session.user;

        if (!user) {
          const { data, error } = await window.supabaseClient.auth.signUp({
            email,
            password: pwd,
            options: {
              emailRedirectTo: window.getAuthRedirectUrl(),
              data: { full_name: name, phone }
            }
          });
          if (error) throw error;
          user = data.user;
          session = data.session;
        }

        if (!user) throw new Error('Nie udało się utworzyć konta.');
        if (!session) {
          const emailDisp = document.getElementById('verify-email-display');
          if (emailDisp) emailDisp.textContent = email;
          showStep(3);
          return;
        }

        await window.startTestStripeCheckout(user, plan);
      } catch (error) {
        const err = document.getElementById('err-email');
        if (err) {
          err.textContent = error.message || 'Nie udało się utworzyć konta.';
          err.style.display = 'block';
        }
        showStep(1);
        btn.innerHTML = 'Płacę przez Stripe';
        btn.disabled = false;
      }
    }

    /* ── FAQ accordion ── */
    function toggleFaq(el) {
      const a = el.nextElementSibling;
      const isOpen = el.getAttribute('aria-expanded') === 'true';
      document.querySelectorAll('.faq-q').forEach(button => button.setAttribute('aria-expanded', 'false'));
      document.querySelectorAll('.faq-a').forEach(answer => {
        answer.hidden = true;
        answer.parentElement?.classList.remove('active');
      });
      if (!isOpen) {
        el.setAttribute('aria-expanded', 'true');
        a.hidden = false;
        el.parentElement?.classList.add('active');
      }
    }

    /* ── CLOUD DATABASE (SUPABASE) ── */
    const SUPA_URL = "https://idpwlfgicadaeqakhkqa.supabase.co/rest/v1/vitalfly_data";
    const SUPA_KEY = "sb_publishable___S6vns0m3SKvlFngRtpFA_NDUwSATq";

    window.getAuthRedirectUrl = function() {
      return window.location.origin + '/';
    };

    window.initSupabase = function() {
      if (!window.supabaseClient && typeof supabase !== 'undefined') {
        window.supabaseClient = supabase.createClient("https://idpwlfgicadaeqakhkqa.supabase.co", SUPA_KEY);
        
        window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
          if (event === 'PASSWORD_RECOVERY') {
            openResetPasswordModal();
          }
        });
      }
      return window.supabaseClient;
    };

    window.initSupabase();

    window.fetchBillingState = async function(action = 'status', extra = {}) {
      window.initSupabase();
      const { data, error } = await window.supabaseClient.functions.invoke('billing', {
        body: { action, ...extra }
      });
      if (error) throw error;
      if (!data) throw new Error('Brak odpowiedzi usługi rozliczeniowej.');

      if (data.subscription) {
        localStorage.setItem('kz_plan', data.subscription.plan || 'monthly');
        localStorage.setItem('kz_subscription_status', data.subscription.status || 'inactive');
        if (data.subscription.currentPeriodEnd) {
          localStorage.setItem('kz_subscription_end_date', data.subscription.currentPeriodEnd);
        } else {
          localStorage.removeItem('kz_subscription_end_date');
        }
      }
      return data;
    };

    window.startTestStripeCheckout = async function(user, plan) {
      if (!user || !user.id) throw new Error('Brak zalogowanego użytkownika.');
      const links = {
        monthly: 'https://buy.stripe.com/test_8x29AT4Vo2Aq4ESdk19Zm00',
        yearly: 'https://buy.stripe.com/test_cNi28rdrU5MCfjwa7P9Zm01'
      };
      const checkoutUrl = new URL(links[plan === 'yearly' ? 'yearly' : 'monthly']);
      checkoutUrl.searchParams.set('prefilled_email', user.email || '');
      checkoutUrl.searchParams.set('client_reference_id', user.id);
      window.location.href = checkoutUrl.toString();
    };

    window.openBillingPortal = async function() {
      const billing = await window.fetchBillingState('portal');
      if (!billing.url) throw new Error('Stripe nie zwrócił adresu portalu klienta.');
      window.location.href = billing.url;
    };

    async function syncFromCloud() {
      window.initSupabase();
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
          if (cloud.promoEnabled !== undefined) localStorage.setItem('kz_promo_enabled', cloud.promoEnabled);
          if (cloud.promoPercent !== undefined) localStorage.setItem('kz_promo_percent', cloud.promoPercent);
          if (cloud.presaleEnabled !== undefined) localStorage.setItem('kz_presale_enabled', cloud.presaleEnabled);
          if (cloud.presalePriceM !== undefined) localStorage.setItem('kz_presale_price_monthly', cloud.presalePriceM);
          if (cloud.presalePriceY !== undefined) localStorage.setItem('kz_presale_price_yearly', cloud.presalePriceY);
          if (cloud.announce !== undefined) localStorage.setItem('kz_announce', cloud.announce);
          // Sync module settings
          if (cloud.modVideos !== undefined) localStorage.setItem('kz_mod_videos', cloud.modVideos);
          if (cloud.modDiets !== undefined) localStorage.setItem('kz_mod_diets', cloud.modDiets);
          if (cloud.modMeds !== undefined) localStorage.setItem('kz_mod_meds', cloud.modMeds);
          if (cloud.modSettings !== undefined) localStorage.setItem('kz_mod_settings', cloud.modSettings);
          if (cloud.modShop !== undefined) localStorage.setItem('kz_mod_shop', cloud.modShop);
          
          if (typeof loadModuleSettings === 'function') loadModuleSettings();

          // Odśwież UI, jeśli zdążyło się już załadować z defaults
          renderVideos();
          renderDiets();
          showAnnounceIfExists();
          if (typeof switchPlan === 'function' && typeof currentPlan !== 'undefined') switchPlan(currentPlan);
          if (typeof updateDynamicPrices === 'function') updateDynamicPrices();
          if (typeof loadPlanSettings === 'function') loadPlanSettings();
          if (document.getElementById('adminPanelView').style.display !== 'none') {
            renderAdminContent();
            if (typeof loadAdminPrices === 'function') loadAdminPrices();
          }
        }
      } catch (e) {
        console.warn("Brak połączenia z Supabase lub brak danych:", e);
      }
    }

    async function saveToCloud() {
      window.initSupabase();
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
        promoEnabled: localStorage.getItem('kz_promo_enabled') || '0',
        promoPercent: localStorage.getItem('kz_promo_percent') || '10',
        presaleEnabled: localStorage.getItem('kz_presale_enabled') || '0',
        presalePriceM: localStorage.getItem('kz_presale_price_monthly') || '29',
        presalePriceY: localStorage.getItem('kz_presale_price_yearly') || '290',
        announce: localStorage.getItem('kz_announce') || '',
        modVideos: localStorage.getItem('kz_mod_videos') || '1',
        modDiets: localStorage.getItem('kz_mod_diets') || '1',
        modMeds: localStorage.getItem('kz_mod_meds') || '1',
        modSettings: localStorage.getItem('kz_mod_settings') || '1',
        modShop: localStorage.getItem('kz_mod_shop') || '1'
      };

      try {
        const { data, error } = await window.supabaseClient.functions.invoke('admin-config', {
          body: { action: 'update', payload }
        });
        if (error) throw error;
        if (!data || data.saved !== true) throw new Error('Serwer nie potwierdził zapisu.');
        return true;
      } catch (e) {
        if (typeof showToast === 'function') {
          showToast('❌ Nie udało się zapisać zmian w chmurze.', 2500);
        }
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
      window.initSupabase();
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
        openAccessibleModal(modal, document.getElementById('reset-password'));
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
        closeAccessibleModal(modal);
      }
    }

    async function handlePasswordResetSubmit() {
      window.initSupabase();
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
          const billing = await window.fetchBillingState();
          if (billing.hasAccess) {
            showApp(displayName);
          } else {
            openAccessRequiredModal();
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

    async function triggerPasswordResetFromSettings() {
      window.initSupabase();
      if (!window.supabaseClient) {
        if (typeof showToast === 'function') {
          showToast('❌ Błąd połączenia z bazą danych.', 2500);
        }
        alert('Błąd połączenia z bazą danych.');
        return;
      }

      const { data: { user } } = await window.supabaseClient.auth.getUser();
      const email = user?.email || localStorage.getItem('kz_email');

      if (!email) {
        if (typeof showToast === 'function') {
          showToast('❌ Nie udało się ustalić adresu e-mail konta.', 2500);
        }
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
        if (typeof showToast === 'function') {
          showToast('❌ Nie udało się wysłać linku do zmiany hasła.', 2500);
        }
        alert('Błąd wysyłania e-maila: ' + error.message);
        if (btn) {
          btn.innerHTML = origText;
          btn.disabled = false;
        }
      } else {
        if (typeof showToast === 'function') {
          showToast('✅ Link do zmiany hasła został wysłany na Twój e-mail.', 3000);
        }
        alert('Link do zmiany hasła został wysłany na Twój adres e-mail: ' + email);
        if (btn) {
          btn.innerHTML = origText;
          btn.disabled = false;
        }
      }
    }
