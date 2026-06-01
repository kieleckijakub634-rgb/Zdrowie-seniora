(function () {
  var done = false;

  function removeLoader() {
    if (done) return;
    var loader = document.getElementById('app-loading-screen');
    var content = document.getElementById('page-content');
    var hasApp = document.body && document.body.classList.contains('logged-in');
    if (!loader && (!content || content.innerHTML.trim())) return;

    done = true;
    if (loader) {
      loader.style.pointerEvents = 'none';
      loader.style.opacity = '0';
      setTimeout(function () {
        if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
      }, 260);
    }
    if (document.body) document.body.classList.remove('app-loading');
    if (!hasApp && content && !content.innerHTML.trim()) {
      content.innerHTML = '<section class="vf-public-shell vf-page section-wrap"><h1>VitalFly</h1><p>Aplikacja uruchamia się w trybie awaryjnym. Odśwież stronę lub sprawdź połączenie z internetem.</p><button class="btn-cta" type="button" onclick="location.reload()">Odśwież</button></section>';
    }
  }

  window.VitalFlyBoot = {
    removeLoader: removeLoader
  };

  window.addEventListener('error', function () {
    setTimeout(removeLoader, 50);
  });

  window.addEventListener('unhandledrejection', function () {
    setTimeout(removeLoader, 50);
  });

  setTimeout(removeLoader, 5200);
})();
