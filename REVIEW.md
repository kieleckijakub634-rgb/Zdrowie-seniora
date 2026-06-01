# Code review i zakres poprawek

## Naprawione

- Przywrócony oryginalny styl landing page z wersji `0c1cc9b` bez zastępowania go nowym designem.
- Przywrócony loader jako wideo `assets/loader.mp4`.
- Loader nie znika przed końcem animacji. Ma fallback na błąd wideo, żeby strona nie zawisła.
- Router działa po adresach `/kontakt`, `/regulamin`, `/polityka`, `/facebook`.
- Dodano obsługę przycisków wstecz i dalej w przeglądarce.
- Dodano fallbacki dla statycznego hostingu: `_redirects`, `.htaccess`, `404.html`.
- Usunięto ryzyko błędu składni przez zduplikowane funkcje `setFontSize` i `setTheme`.
- Formularz kontaktowy zachowuje istniejący handler `handleContact(event)`.
- Poprawki overflow i modali przeniesione do `www/assets/css/fixes.css`.
- Dodano `tools/check.mjs`, żeby przed commitem sprawdzać strukturę i krytyczne punkty funkcjonalne.

## Celowy brak zmian

- Nie przepisywałem całej aplikacji na framework.
- Nie zmieniałem designu na nowy.
- Nie usuwałem istniejących funkcji panelu użytkownika, admina, logowania, diet, wideo, leków, ustawień i integracji zapisanych w `app.js`.
- Nie usuwałem folderów platformowych i binarek. Ta paczka jest bezpiecznym overlayem na istniejące repo.

## Pliki do edycji w przyszłości

- Nowe sekcje strony głównej: `www/pages/home.html`.
- Nowa podstrona statyczna: dodaj plik w `www/pages/` i dopisz jej nazwę w tablicy `PAGES` w `www/assets/app.js`.
- Poprawki layoutu: `www/assets/css/fixes.css`.
- Zmiany logiki aplikacji: konkretna funkcja w `www/assets/app.js`.
