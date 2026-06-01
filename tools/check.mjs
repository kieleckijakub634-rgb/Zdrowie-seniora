import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const required = [
  'www/index.html',
  'www/manifest.json',
  'www/assets/app.js',
  'www/assets/style.css',
  'www/assets/style-overrides.css',
  'www/assets/js/early-boot.js',
  'www/assets/js/config.js',
  'www/assets/js/router.js',
  'www/assets/js/patches.js',
  'www/assets/logo.png',
  'www/pages/home.html',
  'www/pages/kontakt.html',
  'www/pages/polityka.html',
  'www/pages/regulamin.html',
  'www/pages/facebook.html'
];

const missing = required.filter((file) => !existsSync(file));
if (missing.length) {
  console.error('Brakujące pliki:', missing.join(', '));
  process.exit(1);
}

for (const file of required.filter((name) => name.endsWith('.js'))) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf-8' });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(result.status || 1);
  }
}

const html = readFileSync('www/index.html', 'utf-8');
const neededIds = ['page-content', 'signupModal', 'loginModal', 'adminShell', 'app-loading-screen'];
for (const id of neededIds) {
  if (!html.includes(`id="${id}"`)) {
    console.error(`Brak wymaganego id: ${id}`);
    process.exit(1);
  }
}

console.log('OK - struktura, skrypty i wymagane punkty montowania są poprawne.');
