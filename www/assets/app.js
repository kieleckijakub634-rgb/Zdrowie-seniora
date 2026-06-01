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
