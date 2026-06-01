# Code review - wykonane poprawki

## Krytyczne problemy

1. Ekran ładowania mógł zostać na zawsze, gdy Supabase lub ładowanie podstron nie odpowiadało. Dodano `early-boot.js`, timeouty Supabase i awaryjne renderowanie strony.
2. Router używał `pushState` także podczas `popstate`, co mogło psuć cofanie w przeglądarce. Dodano nowy router hash z rozróżnieniem `push`, `replace` i `popstate`.
3. Podstrony były zależne od `fetch('pages/...')`, co często psuje się przy lokalnym pliku, Capacitor lub błędnej ścieżce. Dodano fallback przez szablony w `index.html`.
4. `app.js` miał podwójną deklarację `setFontSize` i `setTheme`. Usunięto starszą, mniej kompletną wersję.
5. Formularz weryfikacji miał odwołania do brakujących funkcji. Dodano `verifyVerificationCode` i `resendVerificationCode`.

## Uporządkowanie

- Publiczne podstrony przeniesione do `www/pages`.
- Routing, boot, konfiguracja i poprawki runtime są w osobnych plikach w `www/assets/js`.
- Style naprawcze są w `style-overrides.css`, żeby nie mieszać ich z dużym istniejącym arkuszem.
- Dodano `tools/serve.mjs` i `tools/check.mjs` bez dodatkowych zależności.

## Zachowane funkcje

- Rejestracja, logowanie i płatność Stripe.
- Panel użytkownika z ćwiczeniami, dietą, lekami, ustawieniami i kartą ICE.
- Asystent Gemini po skonfigurowaniu klucza.
- Panel administratora z edycją treści, cen, modułów i ogłoszeń.
- LocalStorage, Capacitor Preferences, powiadomienia i synchronizacja z Supabase, gdy usługi są dostępne.

## Rekomendacje produkcyjne na później

- Przenieść linki Stripe, hasło administratora i klucze usług do bezpiecznego backendu lub zmiennych środowiskowych.
- Dodać prawdziwy endpoint formularza kontaktowego.
- Uzupełnić finalne dane firmy, pełne RODO i regulamin prawny.
- Dodać testy E2E na login, routing, panel admina i ścieżkę płatności.
