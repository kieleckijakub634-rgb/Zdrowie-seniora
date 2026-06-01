import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const requiredFiles = [
  'www/index.html',
  'www/assets/app.js',
  'www/assets/style.css',
  'www/assets/js/loader.js',
  'www/assets/css/fixes.css',
  'www/pages/home.html',
  'www/pages/kontakt.html',
  'www/pages/polityka.html',
  'www/pages/regulamin.html',
  'www/pages/facebook.html',
  'www/404.html',
  'www/_redirects',
  'www/.htaccess'
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
const app = read('www/assets/app.js');
const loader = read('www/assets/js/loader.js');
const fixes = read('www/assets/css/fixes.css');
const home = read('www/pages/home.html');
const kontakt = read('www/pages/kontakt.html');
const facebook = read('www/pages/facebook.html');

new vm.Script(app, { filename: 'www/assets/app.js' });
new vm.Script(loader, { filename: 'www/assets/js/loader.js' });

const count = (text, pattern) => (text.match(new RegExp(pattern, 'g')) || []).length;
assert(count(app, 'function setFontSize') === 1, 'setFontSize jest zduplikowane.');
assert(count(app, 'function setTheme') === 1, 'setTheme jest zduplikowane.');
assert(app.includes("const PAGES = ['polityka', 'regulamin', 'kontakt', 'facebook']"), 'Router nie ma listy podstron.');
assert(app.includes('window.addEventListener(\'popstate\''), 'Brakuje obsługi cofania w przeglądarce.');
assert(app.includes('window.VFLoader.hideWhenReady'), 'Aplikacja nie czeka na loader.');

assert(index.includes('id="loader-video"'), 'Brakuje elementu video loadera.');
assert(index.includes('assets/loader.mp4'), 'Loader nie wskazuje na assets/loader.mp4.');
assert(index.includes('assets/js/loader.js'), 'Brakuje modułu loader.js.');
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
assert(facebook.includes('https://www.facebook.com/groups/2017205645541173/'), 'Facebook nie zachowuje linku do grupy.');

for (const file of ['home', 'kontakt', 'polityka', 'regulamin', 'facebook']) {
  assert(index.includes('assets/app.js'), 'Brakuje app.js w index.html.');
}

console.log('OK - kod, routing, loader i punkty funkcjonalne są poprawne.');
