import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const requiredFiles = [
  'www/index.html',
  'www/assets/app.js',
  'www/assets/style.css',
  'www/assets/js/loader.js',
  'www/assets/js/security.js',
  'www/assets/css/tailwind.css',
  'www/assets/css/fixes.css',
  'www/pages/home.html',
  'www/pages/kontakt.html',
  'www/pages/polityka.html',
  'www/pages/regulamin.html',
  'www/pages/facebook.html',
  'www/404.html',
  'functions/_middleware.js',
  'www/robots.txt',
  'www/sitemap.xml'
];

function read(file) {
  const path = join(root, file);
  if (!existsSync(path)) throw new Error(`Brakuje pliku: ${file}`);
  return readFileSync(path, 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const file of requiredFiles) read(file);

if (!existsSync(join(root, 'www/assets/loader.mp4'))) {
  console.warn('UWAGA - w tej paczce nie ma binarnego www/assets/loader.mp4. Skopiuj ją na repo, w którym ten plik już istnieje z commita 0c1cc9b.');
}

const index = read('www/index.html');
const loader = read('www/assets/js/loader.js');
const router = read('www/assets/js/router.js');
const ui = read('www/assets/js/ui.js');
const auth = read('www/assets/js/auth.js');
const modules = read('www/assets/js/modules.js');
const admin = read('www/assets/js/admin.js');
const ai = read('www/assets/js/ai.js');
const security = read('www/assets/js/security.js');
const fixes = read('www/assets/css/fixes.css');
const home = read('www/pages/home.html');
const kontakt = read('www/pages/kontakt.html');
const facebook = read('www/pages/facebook.html');
const middleware = read('functions/_middleware.js');

const jsFiles = [
  'www/assets/app.js',
  ...readdirSync(join(root, 'www/assets/js'))
    .filter(name => name.endsWith('.js'))
    .map(name => `www/assets/js/${name}`)
];
for (const file of jsFiles) {
  new vm.Script(read(file), { filename: file });
}

const count = (text, pattern) => (text.match(new RegExp(pattern, 'g')) || []).length;
const app = read('www/assets/app.js');
assert(count(app, 'function setFontSize') === 1, 'setFontSize jest zduplikowane.');
assert(count(app, 'function setTheme') === 1, 'setTheme jest zduplikowane.');
assert(router.includes("const PAGES = ['polityka', 'regulamin', 'kontakt', 'facebook']"), 'Router nie ma listy podstron.');
assert(router.includes('window.addEventListener(\'popstate\''), 'Brakuje obsługi cofania w przeglądarce.');
assert(ui.includes('window.VFLoader.hideWhenReady'), 'Aplikacja nie czeka na loader.');

assert(index.includes('id="loader-video"'), 'Brakuje elementu video loadera.');
assert(index.includes('assets/loader.mp4') || index.includes('assets/loader.webm'), 'Loader nie wskazuje na assets/loader.mp4 ani loader.webm.');
assert(index.includes('assets/js/loader.js'), 'Brakuje modułu loader.js.');
assert(index.includes('assets/css/tailwind.css'), 'Brakuje lokalnie zbudowanego Tailwind CSS.');
assert(!index.includes('cdn.tailwindcss.com'), 'Tailwind nie może być kompilowany z CDN w przeglądarce.');
assert(index.includes('assets/css/fixes.css'), 'Brakuje bezpiecznych poprawek CSS.');
assert(index.includes('id="page-content"'), 'Brakuje punktu montowania podstron.');
assert(index.includes('id="signupModal"'), 'Brakuje modala rejestracji.');
assert(index.includes('id="loginModal"'), 'Brakuje modala logowania.');
assert(index.includes('id="adminShell"'), 'Brakuje panelu administratora.');
assert(!index.includes('style-overrides.css'), 'Nie powinno być starego style-overrides.css zmieniającego design.');

assert(loader.includes('ended') && loader.includes('hideWhenReady'), 'loader.js nie czeka na koniec animacji.');
assert(fixes.includes('overflow-x: hidden'), 'Brakuje poprawki overflow-x.');

assert(home.includes('app-hero') && home.includes('hero-floating-card') && home.includes('mobile-app-bar'), 'Home nie zachowuje oryginalnego hero.');
assert(home.includes('id="price-num"') && home.includes('id="main-join-btn"'), 'Home nie zachowuje cennika z aplikacji.');
assert(home.includes('toggleFaq(this)'), 'Home nie zachowuje FAQ.');
assert(kontakt.includes('id="contactForm"') && kontakt.includes('handleContact(event)'), 'Kontakt nie zachowuje formularza.');
assert(kontakt.includes('Otwórz wiadomość e-mail'), 'Formularz kontaktowy nie informuje, że otwiera program pocztowy.');
assert(!kontakt.includes('Wiadomość wysłana!'), 'Formularz kontaktowy nie może udawać dostarczenia wiadomości.');
assert(facebook.includes('https://www.facebook.com/groups/2017205645541173/'), 'Facebook nie zachowuje linku do grupy.');

assert(!router.includes('?app=1'), 'Router nadal zawiera obejście dostępu ?app=1.');
assert(!auth.includes('kz_pending_pwd'), 'Hasło nadal jest zapisywane na czas płatności.');
assert(!auth.includes('kz_session'), 'Klient nadal ufa lokalnej, fałszywej sesji.');
assert(auth.includes('openAccessibleModal') && auth.includes("aria-hidden', 'false"), 'Modale nie aktualizują stanu ARIA.');
assert(home.includes('aria-expanded="false"') && home.includes('aria-controls="faq-answer-1"'), 'FAQ nie jest dostępne klawiaturowo.');
assert(ai.includes("functions.invoke('ai-proxy'"), 'AI nie korzysta z zabezpieczonej Edge Function.');
assert(!ai.includes('OPENROUTER_API_KEY'), 'Sekret OpenRouter nie może występować w kliencie.');
assert(security.includes('document.createTextNode') && security.includes('safeMediaUrl'), 'Brakuje bezpiecznego renderowania treści i URL.');
assert(ui.includes("kz_ai_health_consent") && modules.includes("kz_ai_health_consent"), 'Dane zdrowotne trafiają do AI bez sprawdzenia zgody.');
assert(!ui.includes('botReply.innerHTML'), 'Odpowiedź AI nadal jest renderowana przez innerHTML.');
assert(admin.includes("functions.invoke('admin-config'"), 'Panel administratora omija zabezpieczoną Edge Function.');
assert(index.includes('Tryb testowy:') && home.includes('Środowisko testowe Stripe'), 'Interfejs nie informuje jasno o testowym Stripe.');
assert(read('www/robots.txt').includes('sitemap.xml'), 'robots.txt nie wskazuje sitemap.xml.');
assert(middleware.includes("headers.set('Content-Security-Policy'"), 'Brakuje Content-Security-Policy dla Cloudflare Pages.');
assert(middleware.includes("script-src 'self' 'unsafe-hashes'"), 'CSP nie ogranicza wykonywania skryptów.');
assert(!middleware.includes("script-src 'self' 'unsafe-inline'"), 'CSP nie może zezwalać na dowolne skrypty inline.');
assert(middleware.includes("headers.set('Strict-Transport-Security'"), 'Brakuje HSTS.');
assert(middleware.includes("headers.set('X-Content-Type-Options', 'nosniff')"), 'Brakuje ochrony MIME sniffing.');
assert(middleware.includes("frame-ancestors 'none'"), 'Brakuje ochrony przed osadzaniem strony w ramce.');

console.log('OK - kod, routing, loader i punkty funkcjonalne są poprawne.');
