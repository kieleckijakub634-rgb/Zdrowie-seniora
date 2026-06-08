(function () {
  let hideRequested = false;
  let hidden = false;
  let canHide = false;
  let fallbackTimer = null;

  function clearFallback() {
    if (fallbackTimer) clearTimeout(fallbackTimer);
    fallbackTimer = null;
  }

  function hideNow() {
    if (hidden || !canHide) return;
    hidden = true;
    const loader = document.getElementById('app-loading-screen');
    if (loader) {
      loader.style.pointerEvents = 'none';
      loader.style.opacity = '0';
      setTimeout(() => loader.remove(), 300);
    }
    document.body.classList.remove('app-loading');
  }

  function finishVideoGate() {
    if (canHide) return;
    canHide = true;
    clearFallback();
    if (hideRequested) hideNow();
  }

  function startLoaderVideo() {
    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const video = document.getElementById('loader-video');
    if (reducedMotion || !video) {
      finishVideoGate();
      return;
    }

    video.muted = true;
    video.loop = false;
    video.playsInline = true;
    video.addEventListener('ended', finishVideoGate, { once: true });
    video.addEventListener('error', finishVideoGate, { once: true });

    try {
      const playback = video.play();
      if (playback && typeof playback.catch === 'function') playback.catch(finishVideoGate);
    } catch (_) {
      finishVideoGate();
    }

    fallbackTimer = setTimeout(finishVideoGate, 1500);
  }

  window.VFLoader = {
    hideWhenReady() {
      hideRequested = true;
      hideNow();
    },
    forceHide() {
      canHide = true;
      clearFallback();
      hideRequested = true;
      hideNow();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startLoaderVideo, { once: true });
  } else {
    startLoaderVideo();
  }
})();
