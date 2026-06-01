# VitalFly - Zdrowie Seniora

Gotowa wersja statycznej aplikacji web/Capacitor po przeglądzie i uporządkowaniu struktury.

## Szybkie uruchomienie

```bash
npm install
npm start
```

Strona uruchomi się na `http://localhost:4173`.

## Sprawdzenie projektu

```bash
npm test
```

Test sprawdza obecność plików, składnię JavaScript oraz kluczowe punkty montowania HTML.

## Struktura

```text
www/
  index.html                 - główny shell strony, modale, panel admina, szablony stron
  pages/                     - edytowalne podstrony publiczne
  assets/app.js              - zachowana logika aplikacji użytkownika i admina
  assets/js/router.js        - router hash z obsługą historii przeglądarki
  assets/js/patches.js       - poprawki produkcyjne i zabezpieczenia runtime
  assets/js/early-boot.js    - awaryjne zdjęcie ekranu ładowania
  assets/style.css           - zachowane style projektu
  assets/style-overrides.css - poprawki layoutu, overflow i mobile
```

## Najważniejsze zmiany

- Strona nie zostaje już na nieskończonym ekranie ładowania, nawet gdy Supabase/CDN/fetch się nie powiedzie.
- Router działa na `#/kontakt`, `#/regulamin`, `#/polityka`, `#/facebook` i wspiera przycisk Wstecz w przeglądarce.
- Podstrony są rozdzielone do `www/pages`, a jednocześnie mają szablony awaryjne w `index.html`, więc nie psują się przy problemie z `fetch` lub uruchomieniu lokalnym.
- Zachowana została logika aplikacji: konto, panel użytkownika, ćwiczenia, dieta, leki, ustawienia, AI, panel administratora, ceny, moduły i ogłoszenia.
- Dodano poprawki CSS dla responsywności, scrolla, modali i wyjeżdżających elementów.
- Naprawiono błąd składni w `app.js` wynikający z podwójnej deklaracji `setFontSize` i `setTheme`.

## Pliki do dalszych zmian w Antigravity

- Zmiana tekstów landing page: `www/pages/home.html`
- Zmiana regulaminu: `www/pages/regulamin.html`
- Zmiana polityki prywatności: `www/pages/polityka.html`
- Zmiana kontaktu: `www/pages/kontakt.html`
- Zmiana tras: `www/assets/js/router.js`
- Poprawki runtime: `www/assets/js/patches.js`
- Poprawki wizualne bez ruszania logiki: `www/assets/style-overrides.css`
- Logika aplikacji użytkownika/admina: `www/assets/app.js`
