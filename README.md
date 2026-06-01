# VitalFly - poprawka 0c1cc9b

Ta paczka jest poprawką kodu na bazie commita `0c1cc9b` (`Podział na strony`). Nie zmienia założonego designu landing page i nie usuwa funkcjonalności aplikacji.

## Najważniejsze

- `www/pages/home.html` zachowuje układ, sekcje, klasy i CTA z wersji `0c1cc9b`.
- `www/assets/app.js` zachowuje istniejący silnik aplikacji, rejestrację, logowanie, panel użytkownika, leki, dietę, wideo, admina i ustawienia.
- Dodany jest routing po prawdziwych adresach: `/kontakt`, `/regulamin`, `/polityka`, `/facebook`.
- Działa cofanie i dalej w przeglądarce.
- Loader wrócił do `assets/loader.mp4` i czeka na koniec animacji zamiast ucinać ją po chwili.
- Poprawki CSS są w osobnym pliku `www/assets/css/fixes.css`, żeby nie mieszać ich z oryginalnym stylem.

## Struktura dla Antigravity

- `www/pages/home.html` - landing page.
- `www/pages/kontakt.html` - kontakt i formularz.
- `www/pages/polityka.html` - polityka prywatności.
- `www/pages/regulamin.html` - regulamin.
- `www/pages/facebook.html` - grupa Facebook.
- `www/assets/app.js` - logika aplikacji i panelu użytkownika.
- `www/assets/js/loader.js` - tylko startowa animacja.
- `www/assets/css/fixes.css` - tylko małe poprawki layoutu i overflow.

## Ważne przy kopiowaniu

Nie używaj `robocopy /MIR` z tą paczką. ZIP ma nadpisać kod, ale nie ma usuwać istniejących binarek i folderów platformowych z repo, takich jak `android/`, `package-lock.json`, `assets/`, `www/assets/loader.mp4`.

## Test

W PowerShell użyj:

```powershell
npm.cmd test
```

Lokalny podgląd:

```powershell
npm.cmd start
```

Potem otwórz `http://localhost:4173`.
