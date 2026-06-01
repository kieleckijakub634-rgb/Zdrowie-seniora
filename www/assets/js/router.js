(function () {
  var routes = window.VF_ROUTES || {};
  var cache = Object.create(null);

  function normalizeRoute(id) {
    var clean = String(id || 'home').replace(/^#\/?/, '').replace(/^\//, '').trim();
    if (!clean) clean = 'home';
    return routes[clean] ? clean : 'home';
  }

  function routeFromLocation() {
    var hash = window.location.hash || '';
    if (hash) return normalizeRoute(hash);
    var path = window.location.pathname.split('/').filter(Boolean).pop();
    if (!path || path === 'index.html') return 'home';
    return normalizeRoute(path.replace(/\.html$/, ''));
  }

  function routeUrl(id) {
    var route = normalizeRoute(id);
    return route === 'home' ? '#/' : '#/' + route;
  }

  function templateHtml(route) {
    var tpl = document.getElementById('tpl-page-' + route);
    return tpl ? tpl.innerHTML.trim() : '';
  }

  async function loadPage(route) {
    route = normalizeRoute(route);
    if (cache[route]) return cache[route];

    var fromTemplate = templateHtml(route);
    if (fromTemplate) {
      cache[route] = fromTemplate;
      return fromTemplate;
    }

    var meta = routes[route];
    if (!meta || !meta.file) return templateHtml('home');

    try {
      var res = await fetch(meta.file, { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      cache[route] = await res.text();
      return cache[route];
    } catch (error) {
      console.warn('Router fallback:', error);
      return templateHtml(route) || templateHtml('home') || '<section class="vf-page section-wrap"><h1>VitalFly</h1><p>Nie udało się wczytać podstrony.</p></section>';
    }
  }

  async function render(route, options) {
    var opts = options || {};
    var pageId = normalizeRoute(route);
    var container = document.getElementById('page-content');
    if (!container) return;

    var html = await loadPage(pageId);
    container.innerHTML = html;
    document.title = routes[pageId].title || 'VitalFly';
    container.focus({ preventScroll: true });

    if (opts.replace) {
      history.replaceState({ page: pageId }, '', routeUrl(pageId));
    } else if (opts.push !== false && window.location.hash !== routeUrl(pageId)) {
      history.pushState({ page: pageId }, '', routeUrl(pageId));
    }

    window.scrollTo({ top: 0, behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });
    document.dispatchEvent(new CustomEvent('vf:routechange', { detail: { page: pageId } }));
  }

  function navigateTo(id) {
    return render(id || 'home', { push: true });
  }

  window.VitalFlyRouter = {
    navigateTo: navigateTo,
    render: render,
    current: routeFromLocation,
    routes: routes
  };

  window.navigateTo = navigateTo;

  window.addEventListener('popstate', function () {
    render(routeFromLocation(), { push: false });
  });

  document.addEventListener('click', function (event) {
    var link = event.target.closest('[data-route]');
    if (!link) return;
    var route = link.getAttribute('data-route') || link.getAttribute('href');
    event.preventDefault();
    navigateTo(route);
  });

  document.addEventListener('DOMContentLoaded', function () {
    var container = document.getElementById('page-content');
    if (container && !container.innerHTML.trim()) {
      render(routeFromLocation(), { replace: true });
    }
  });
})();
