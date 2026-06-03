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
    function getPlanPrices() {
      let pM = parseInt(localStorage.getItem('kz_price_monthly') || '39');
      let pY = parseInt(localStorage.getItem('kz_price_yearly') || '390');
      
      const presaleEnabled = localStorage.getItem('kz_presale_enabled') === '1';
      const promoEnabled = localStorage.getItem('kz_promo_enabled') === '1';
      const promoPercent = parseInt(localStorage.getItem('kz_promo_percent') || '10');
      
      if (presaleEnabled) {
        pM = parseInt(localStorage.getItem('kz_presale_price_monthly') || '29');
        pY = parseInt(localStorage.getItem('kz_presale_price_yearly') || '290');
      } else if (promoEnabled) {
        pM = Math.round(pM * (1 - promoPercent / 100));
        pY = Math.round(pY * (1 - promoPercent / 100));
      }
      
      return {
        monthly: pM,
        yearly: pY,
        isPresale: presaleEnabled,
        isPromo: promoEnabled && !presaleEnabled,
        promoPercent: promoPercent
      };
    }

    function getMonthsGratisText(months) {
      const rounded = Math.round(months * 10) / 10;
      if (rounded <= 0) return '';
      if (rounded % 1 !== 0) {
        return `${rounded.toFixed(1).replace('.', ',')} miesiąca gratis`;
      }
      const m = Math.round(rounded);
      if (m === 1) return '1 miesiąc gratis';
      const lastDigit = m % 10;
      const lastTwo = m % 100;
      if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 10 || lastTwo >= 20)) {
        return `${m} miesiące gratis`;
      }
      return `${m} miesięcy gratis`;
    }

    function updateDynamicPrices() {
      const prices = getPlanPrices();
      const pM = prices.monthly;
      const pY = prices.yearly;

      document.querySelectorAll('.dynamic-price-m').forEach(el => {
        if (el.tagName === 'BUTTON') {
          if (el.textContent.includes('Chcę to wszystko')) {
            el.textContent = `Chcę to wszystko – dołączam za ${pM} zł/m-c →`;
          } else if (el.textContent.includes('Dołączam do Klubu')) {
            el.textContent = `Dołączam do Klubu za ${pM} zł/m-c →`;
          } else if (el.textContent.includes('Dołącz za')) {
            el.textContent = `Dołącz za ${pM} zł/m-c`;
          } else {
            el.textContent = `Dołącz do Klubu za ${pM} zł/m-c`;
          }
        } else {
          el.textContent = `${pM} zł`;
        }
      });

      document.querySelectorAll('.dynamic-price-regular-m-full').forEach(el => {
        el.textContent = `${pM},00 zł`;
      });

      const upgradeDesc = document.getElementById('upgrade-plan-desc');
      if (upgradeDesc) {
        const savings = pM * 12 - pY;
        const monthsFree = savings / pM;
        const gratisText = getMonthsGratisText(monthsFree);
        if (gratisText) {
          upgradeDesc.textContent = `${pY} zł/rok zamiast ${pM * 12} zł — ${gratisText}! (Oszczędzasz ${savings} zł)`;
        } else {
          upgradeDesc.textContent = `${pY} zł/rok zamiast ${pM * 12} zł — oszczędzasz ${savings} zł!`;
        }
      }
    }

    function switchPlan(plan) {
      currentPlan = plan;
      const isYearly = plan === 'yearly';
      const prices = getPlanPrices();
      const pM = prices.monthly;
      const pY = prices.yearly;
      const bM = document.getElementById('btn-monthly');
      const bY = document.getElementById('btn-yearly');
      if (bM) bM.classList.toggle('active', !isYearly);
      if (bY) bY.classList.toggle('active', isYearly);

      const pNum = document.getElementById('price-num');
      if (pNum) pNum.textContent = isYearly ? pY : pM;

      const pPer = document.getElementById('price-period');
      if (pPer) pPer.textContent = isYearly ? '/ rok' : '/ miesiąc';

      const pSub = document.getElementById('price-sub');
      if (prices.isPresale) {
        if (pSub) pSub.textContent = isYearly ? `Przedsprzedaż roczna! Oszczędzasz ${pM * 12 - pY} zł 🎉` : 'Przedsprzedaż miesięczna! Złap najniższą cenę 💥';
      } else {
        if (pSub) {
          if (isYearly) {
            const savings = pM * 12 - pY;
            const monthsFree = savings / pM;
            const gratisText = getMonthsGratisText(monthsFree);
            if (gratisText) {
              pSub.textContent = `${gratisText}! Oszczędzasz ${savings} zł 🎉`;
            } else {
              pSub.textContent = `Oszczędzasz ${savings} zł 🎉`;
            }
          } else {
            pSub.textContent = 'To mniej niż dwie kawy tygodniowo ☕';
          }
        }
      }

      const mBtn = document.getElementById('main-join-btn');
      if (mBtn) mBtn.textContent = isYearly ? `Dołączam na rok za ${pY} zł →` : `Dołączam do VitalFly za ${pM} zł/miesiąc →`;

      localStorage.setItem('kz_plan', plan);
      updateDynamicPrices();
    }

    // Wymuszenie odświeżenia cen po wejściu na stronę główną
    window.addEventListener('DOMContentLoaded', () => { 
      switchPlan('monthly'); 
      updateDynamicPrices();
      loadPlanSettings();
    });



    async function viewTerms(page) {
      const wasLoggedIn = document.body.classList.contains('logged-in');
      if (wasLoggedIn) {
        document.body.classList.remove('logged-in');
      }

      document.getElementById('appShell').style.display = 'none';

      document.querySelectorAll('body > *:not(#appShell):not(.modal-overlay):not(#adminShell)').forEach(el => {
        el.style.display = 'none';
      });

      let target = document.getElementById('pg-' + page);
      if (!target) {
        try {
          const path = (window.Capacitor || window.location.protocol === 'file:') ? 'pages/' + page + '.html' : '/pages/' + page + '.html';
          const res = await fetch(path);
          if (res.ok) {
            const html = await res.text();
            const temp = document.createElement('div');
            temp.innerHTML = html;
            target = temp.firstElementChild;
            document.body.appendChild(target);
          }
        } catch (e) {
          console.error("Error loading terms:", e);
        }
      }

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
        if (wasLoggedIn) {
          document.body.classList.add('logged-in');
        }
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
      showToast('✅ Profil zapisany!', 800);
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
      const email = localStorage.getItem('kz_email') || '';
      const STRIPE_LINK_YEARLY = 'https://buy.stripe.com/test_cNi28rdrU5MCfjwa7P9Zm01';
      
      localStorage.setItem('kz_pending_upgrade', 'yearly');
      
      const btn = document.getElementById('upgrade-btn');
      if (btn) {
        btn.textContent = '⏳ Przekierowuję do Stripe...';
        btn.disabled = true;
      }
      
      // Redirect to Stripe with prefilled email
      window.location.href = `${STRIPE_LINK_YEARLY}?prefilled_email=${encodeURIComponent(email)}`;
    }
    function cancelSubscription() {
      if (confirm('Czy na pewno chcesz anulować subskrypcję? Zachowasz dostęp do końca opłaconego okresu.')) {
        localStorage.setItem('kz_subscription_status', 'cancelled');
        loadPlanSettings();
        syncToCloud();
        showToast('🔒 Subskrypcja została anulowana.', 800);
      }
    }
    function loadPlanSettings() {
      const plan = localStorage.getItem('kz_plan') || 'monthly';
      const subStatus = localStorage.getItem('kz_subscription_status') || 'active';
      const label = document.getElementById('plan-current-label');
      const btn = document.getElementById('upgrade-btn');
      const badge = document.getElementById('app-plan-badge');
      const upgradeRow = document.getElementById('upgrade-plan-row');
      const cancelBtn = document.getElementById('cancel-sub-btn');
      
      const prices = getPlanPrices();
      const pM = prices.monthly;
      const pY = prices.yearly;

      if (plan === 'yearly') {
        if (label) label.textContent = `📅 Roczny • ${pY} zł/rok`;
        if (badge) {
          badge.textContent = '✓ PLAN ROCZNY';
          badge.style.display = 'inline-block';
          badge.style.background = '';
        }
        if (upgradeRow) upgradeRow.style.display = 'none';
      } else {
        if (label) label.textContent = `📅 Miesięczny • ${pM} zł/miesiąc`;
        if (badge) {
          badge.textContent = '✓ PLAN MIESIĘCZNY';
          badge.style.display = 'inline-block';
          badge.style.background = '';
        }
        if (upgradeRow) upgradeRow.style.display = 'flex';
      }

      if (subStatus === 'cancelled') {
        if (cancelBtn) {
          cancelBtn.textContent = 'Subskrypcja anulowana';
          cancelBtn.disabled = true;
          cancelBtn.style.background = '#6B7A8D';
          cancelBtn.style.color = '#fff';
          cancelBtn.style.borderColor = 'transparent';
          cancelBtn.style.cursor = 'default';
        }
      } else {
        if (cancelBtn) {
          cancelBtn.textContent = 'Rezygnuj z subskrypcji';
          cancelBtn.disabled = false;
          cancelBtn.style.background = '';
          cancelBtn.style.color = '';
          cancelBtn.style.borderColor = '';
          cancelBtn.style.cursor = 'pointer';
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
      showToast('✅ Preferencje diety zapisane!', 800);
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
      showToast('🔔 Ustawienia powiadomień zapisane!', 800);
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
      showToast('🩺 Profil zdrowotny został zaktualizowany w pamięci AI!', 800);
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
