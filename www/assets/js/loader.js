(function () {
  let hideRequested = false;
  let hidden = false;
  let canHide = false;
  let fallbackTimer = null;

  function videoElement() {
    return document.getElementById('loader-video');
  }

  function clearFallback() {
    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
  }

  function finishVideoGate() {
    if (canHide) return;
    canHide = true;
    clearFallback();
    if (hideRequested) hideNow();
  }

  function hideNow() {
    if (hidden || !canHide) return;
    hidden = true;
    const loader = document.getElementById('app-loading-screen');
    if (loader) {
      loader.style.pointerEvents = 'none';
      loader.style.opacity = '0';
      setTimeout(function () {
        try { loader.remove(); } catch (e) {}
      }, 300);
    }
    document.body.classList.remove('app-loading');
  }

  function armPlaybackFallback(video) {
    clearFallback();
    const durationMs = Number.isFinite(video.duration) && video.duration > 0
      ? Math.ceil(video.duration * 1000) + 800
      : 30000;
    fallbackTimer = setTimeout(finishVideoGate, durationMs);
  }

  function startLoaderVideo() {
    const video = videoElement();
    if (!video) {
      finishVideoGate();
      return;
    }

    video.muted = true;
    video.loop = false;
    video.playsInline = true;

    video.addEventListener('ended', finishVideoGate, { once: true });
    video.addEventListener('error', function () {
      clearFallback();
      fallbackTimer = setTimeout(finishVideoGate, 1800);
    }, { once: true });
    video.addEventListener('playing', function () {
      armPlaybackFallback(video);
    }, { once: true });

    const play = function () {
      const promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {
          // Autoplay blocked: do not lock. Allow hiding and show the app.
          finishVideoGate();
        });
      }
    };

    try {
      video.load();
      play();
    } catch (e) {
      fallbackTimer = setTimeout(finishVideoGate, 1800);
    }

    // Safety fallback: always allow hiding the loader after 4 seconds
    setTimeout(finishVideoGate, 4000);

    fallbackTimer = setTimeout(function () {
      if (!canHide && video.readyState === 0) finishVideoGate();
    }, 7000);
  }

  window.VFLoader = {
    hideWhenReady: function () {
      hideRequested = true;
      hideNow();
    },
    forceHide: function () {
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
