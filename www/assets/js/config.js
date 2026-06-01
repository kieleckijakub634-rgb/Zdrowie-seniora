window.VF_ROUTES = Object.freeze({
  home: { title: 'VitalFly | Ćwiczenia i dieta dla seniorów', file: 'pages/home.html' },
  kontakt: { title: 'Kontakt | VitalFly', file: 'pages/kontakt.html' },
  polityka: { title: 'Polityka prywatności | VitalFly', file: 'pages/polityka.html' },
  regulamin: { title: 'Regulamin | VitalFly', file: 'pages/regulamin.html' },
  facebook: { title: 'Facebook | VitalFly', file: 'pages/facebook.html' }
});

window.VF_CONFIG = Object.freeze({
  appName: 'VitalFly',
  supportEmail: 'kontakt@vitalfly.pl',
  routerMode: 'hash',
  startupFallbackMs: 5200,
  supabaseTimeoutMs: 3600
});
