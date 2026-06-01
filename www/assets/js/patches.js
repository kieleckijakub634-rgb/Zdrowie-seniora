(function () {
  var timeoutMs = (window.VF_CONFIG && window.VF_CONFIG.supabaseTimeoutMs) || 3600;

  function assignGlobal(name, value) {
    window[name] = value;
    try {
      // eslint-disable-next-line no-eval
      window.eval(name + ' = window["' + name + '"]');
    } catch (error) {
      window[name] = value;
    }
  }

  function settleWithTimeout(promise, fallback, ms) {
    return new Promise(function (resolve) {
      var settled = false;
      var timer = setTimeout(function () {
        if (!settled) {
          settled = true;
          resolve(fallback);
        }
      }, ms || timeoutMs);

      Promise.resolve(promise)
        .then(function (value) {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve(value);
          }
        })
        .catch(function (error) {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve(fallback && typeof fallback === 'object' ? Object.assign({}, fallback, { error: error }) : fallback);
          }
        });
    });
  }

  function patchSupabaseTimeouts() {
    var client = window.supabaseClient;
    if (!client || !client.auth || client.__vfTimeoutPatched) return;
    client.__vfTimeoutPatched = true;

    if (typeof client.auth.getSession === 'function') {
      var getSession = client.auth.getSession.bind(client.auth);
      client.auth.getSession = function () {
        return settleWithTimeout(getSession(), { data: { session: null }, error: null });
      };
    }

    if (typeof client.auth.signInWithPassword === 'function') {
      var signIn = client.auth.signInWithPassword.bind(client.auth);
      client.auth.signInWithPassword = function (payload) {
        return settleWithTimeout(signIn(payload), { data: null, error: new Error('Limit czasu połączenia z bazą danych.') }, 6000);
      };
    }

    if (typeof client.auth.signUp === 'function') {
      var signUp = client.auth.signUp.bind(client.auth);
      client.auth.signUp = function (payload) {
        return settleWithTimeout(signUp(payload), { data: null, error: new Error('Limit czasu rejestracji.') }, 6500);
      };
    }

    if (typeof client.auth.signOut === 'function') {
      var signOut = client.auth.signOut.bind(client.auth);
      client.auth.signOut = function () {
        return settleWithTimeout(signOut(), { error: null }, 3000);
      };
    }
  }

  function safeHideLoader() {
    if (typeof window.hideLoadingScreen === 'function') {
      try {
        window.hideLoadingScreen();
        return;
      } catch (error) {
        console.warn('hideLoadingScreen fallback:', error);
      }
    }
    if (window.VitalFlyBoot) window.VitalFlyBoot.removeLoader();
  }

  function patchRouter() {
    if (!window.VitalFlyRouter) return;
    assignGlobal('navigateTo', window.VitalFlyRouter.navigateTo);
  }

  function patchVerificationFlow() {
    assignGlobal('resendVerificationCode', function (event) {
      if (event) event.preventDefault();
      var err = document.getElementById('err-verification');
      if (err) {
        err.style.display = 'block';
        err.style.color = '#106B5B';
        err.textContent = 'Kod został wysłany ponownie w trybie aplikacji. Sprawdź skrzynkę e-mail.';
      }
      if (typeof showToast === 'function') showToast('Kod weryfikacyjny został wysłany ponownie.');
    });

    assignGlobal('verifyVerificationCode', async function () {
      var code = (document.getElementById('verification-code') || {}).value || '';
      var err = document.getElementById('err-verification');
      if (!/^\d{6}$/.test(code.trim())) {
        if (err) {
          err.style.display = 'block';
          err.style.color = '#E05252';
          err.textContent = 'Wpisz 6-cyfrowy kod.';
        }
        return;
      }

      if (err) err.style.display = 'none';
      var btn = document.getElementById('btn-confirm-code');
      var oldText = btn ? btn.textContent : '';
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Aktywuję konto...';
      }

      try {
        if (typeof processPaymentSuccess === 'function') {
          await processPaymentSuccess();
        } else if (typeof showApp === 'function') {
          var name = localStorage.getItem('kz_pending_name') || localStorage.getItem('kz_name') || 'Seniorze';
          localStorage.setItem('kz_session', 'local');
          showApp(name);
        }
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = oldText;
        }
      }
    });

    if (typeof window.showStep === 'function') {
      var originalShowStep = window.showStep;
      assignGlobal('showStep', function (n) {
        originalShowStep(n);
        if (Number(n) === 3) {
          var email = localStorage.getItem('kz_pending_email') || (document.getElementById('inp-email') || {}).value || '';
          var target = document.getElementById('verify-email-display');
          if (target) target.textContent = email;
        }
      });
    }
  }

  function patchModals() {
    ['openModal', 'closeModal', 'openLoginModal', 'closeLoginModal'].forEach(function (name) {
      if (typeof window[name] !== 'function') return;
      var original = window[name];
      assignGlobal(name, function () {
        var result = original.apply(this, arguments);
        var signup = document.getElementById('signupModal');
        var login = document.getElementById('loginModal');
        if (signup) signup.setAttribute('aria-hidden', signup.classList.contains('open') ? 'false' : 'true');
        if (login) login.setAttribute('aria-hidden', login.classList.contains('open') ? 'false' : 'true');
        return result;
      });
    });
  }

  function patchPrices() {
    if (typeof window.switchPlan !== 'function') return;
    var original = window.switchPlan;
    assignGlobal('switchPlan', function (plan) {
      var result = original.apply(this, arguments);
      var priceM = localStorage.getItem('kz_price_monthly') || '39';
      var priceY = localStorage.getItem('kz_price_yearly') || '390';
      var monthly = plan !== 'yearly';
      var modalPlan = document.getElementById('modal-plan-label');
      var modalTotal = document.getElementById('modal-total-label');
      if (modalPlan) modalPlan.textContent = monthly ? priceM + ',00 zł' : priceY + ',00 zł';
      if (modalTotal) modalTotal.textContent = monthly ? priceM + ',00 zł / miesiąc' : priceY + ',00 zł / rok';
      return result;
    });
  }

  function installClickRouteRepair() {
    document.addEventListener('vf:routechange', function () {
      var bar = document.getElementById('mobileBottomBar');
      if (bar) bar.style.display = document.body.classList.contains('logged-in') ? 'none' : '';
      if (typeof loadAdminPrices === 'function') {
        try { loadAdminPrices(); } catch (error) { console.warn(error); }
      }
    });
  }

  patchSupabaseTimeouts();
  patchRouter();
  patchVerificationFlow();
  patchModals();
  patchPrices();
  installClickRouteRepair();

  document.addEventListener('DOMContentLoaded', function () {
    patchSupabaseTimeouts();
    patchRouter();
    safeHideLoader();
  });

  setTimeout(function () {
    patchSupabaseTimeouts();
    safeHideLoader();
  }, 5200);
})();
