// fukuterrace-LP/assets/js/main.js
(() => {
  const body = document.body;
  body.classList.remove('no-js');
  body.classList.add('has-js');
  const navToggle = document.getElementById('navToggle');
  const siteNav = document.getElementById('siteNav');
  const srLabel = navToggle ? navToggle.querySelector('.sr-only') : null;
  const mobileQuery = window.matchMedia('(max-width: 820px)');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const setNavState = (expanded) => {
    if (!navToggle || !siteNav) return;
    navToggle.setAttribute('aria-expanded', String(expanded));
    if (srLabel) {
      srLabel.textContent = expanded ? 'メニューを閉じる' : 'メニューを開く';
    }
    siteNav.classList.toggle('is-open', expanded);
    body.classList.toggle('nav-open', expanded);
  };

  // Ensure the viewport is anchored to the left edge when horizontal scrolling is disabled.
  // DevTools device emulation can keep a residual scrollLeft; harden with multi-attempt resets.
  const resetHScrollOnce = () => {
    // snap window first
    if (window.scrollX !== 0) {
      try { window.scrollTo({ left: 0, top: window.scrollY, behavior: 'instant' }); }
      catch { window.scrollTo(0, window.scrollY); }
    }
    // then both scrolling roots
    document.documentElement.scrollLeft = 0;
    document.body.scrollLeft = 0;
  };
  const resetHScroll = () => {
    // run a few times over time and frames to defeat late layout shifts
    resetHScrollOnce();
    requestAnimationFrame(() => {
      resetHScrollOnce();
      setTimeout(resetHScrollOnce, 50);
      setTimeout(resetHScrollOnce, 200);
    });
  };
  const hookLeftAnchor = () => {
    resetHScroll();
    // also repeat briefly after load to defeat late layout
    let attempts = 0;
    const id = setInterval(() => {
      resetHScrollOnce();
      if (++attempts > 15) clearInterval(id); // ~1s @ 66ms
    }, 66);
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hookLeftAnchor, { once: true });
  } else {
    hookLeftAnchor();
  }
  window.addEventListener('resize', resetHScroll);
  window.addEventListener('orientationchange', resetHScroll);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) resetHScroll(); });
  // If any horizontal scroll sneaks in, snap it back while preserving vertical position
  window.addEventListener('scroll', () => {
    if (window.scrollX !== 0) {
      try { window.scrollTo({ left: 0, top: window.scrollY, behavior: 'instant' }); }
      catch { window.scrollTo(0, window.scrollY); }
      document.documentElement.scrollLeft = 0;
      document.body.scrollLeft = 0;
    }
  }, { passive: true });

  // Header hide/show on scroll
  const header = document.querySelector('.site-header');
  let lastScrollY = window.scrollY;
  let scrollThreshold = 10; // Scroll difference to trigger hide/show

  window.addEventListener('scroll', () => {
    if (body.classList.contains('nav-open')) return; // Don't hide if menu is open

    const currentScrollY = window.scrollY;
    const diff = currentScrollY - lastScrollY;

    if (currentScrollY <= 100) {
      // Always show at the top of the page
      header.style.transform = 'translateY(0)';
    } else if (Math.abs(diff) > scrollThreshold) {
      if (diff > 0) {
        // Scrolling down - hide
        header.style.transform = 'translateY(-100%)';
      } else {
        // Scrolling up - show
        header.style.transform = 'translateY(0)';
      }
      lastScrollY = currentScrollY;
    }
  }, { passive: true });

  // Track touch gestures to cancel horizontal pans on mobile devices.
  let touchLockDirection;
  let touchStartX = 0;
  let touchStartY = 0;

  document.addEventListener('touchstart', (event) => {
    if (!mobileQuery.matches) return;
    if (event.touches.length !== 1) {
      touchLockDirection = undefined;
      return;
    }
    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchLockDirection = undefined;
  }, { passive: true, capture: true });

  document.addEventListener('touchmove', (event) => {
    if (!mobileQuery.matches) return;
    if (event.touches.length !== 1) {
      touchLockDirection = undefined;
      return;
    }
    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartX);
    const deltaY = Math.abs(touch.clientY - touchStartY);

    if (touchLockDirection === undefined) {
      const threshold = 6;
      if (deltaX <= threshold && deltaY <= threshold) return;
      if (deltaX > deltaY && deltaX > threshold) {
        touchLockDirection = 'horizontal';
      } else {
        touchLockDirection = 'vertical';
      }
    }

    if (touchLockDirection === 'horizontal' && event.cancelable) {
      event.preventDefault();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
      resetHScrollOnce();
    }
  }, { passive: false, capture: true });

  const clearTouchLock = () => { touchLockDirection = undefined; };
  document.addEventListener('touchend', clearTouchLock, { passive: true, capture: true });
  document.addEventListener('touchcancel', clearTouchLock, { passive: true, capture: true });

  const closeNav = () => setNavState(false);
  const toggleNav = () => {
    const expanded = navToggle ? navToggle.getAttribute('aria-expanded') === 'true' : false;
    setNavState(!expanded);
  };

  if (navToggle && siteNav) {
    setNavState(false);

    // avoid double-binding
    if (!navToggle.dataset.bound) {
      navToggle.dataset.bound = 'true';
      navToggle.addEventListener('click', (event) => {
        // prevent duplicate handlers from re-toggling
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
        const next = navToggle.getAttribute('aria-expanded') !== 'true';
        setNavState(next);
      });
    }

    document.addEventListener('click', (event) => {
      if (!mobileQuery.matches || navToggle.getAttribute('aria-expanded') !== 'true') return;
      const target = event.target;
      if (target instanceof Element && (siteNav.contains(target) || navToggle.contains(target))) {
        return;
      }
      closeNav();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
        closeNav();
        navToggle.focus();
      }
    });

    if (typeof mobileQuery.addEventListener === 'function') {
      mobileQuery.addEventListener('change', (event) => {
        if (!event.matches) closeNav();
      });
    } else if (typeof mobileQuery.addListener === 'function') {
      mobileQuery.addListener((event) => {
        if (!event.matches) closeNav();
      });
    }

    siteNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        if (mobileQuery.matches) closeNav();
      });
    });
  }

  const getScrollOptions = () => ({
    behavior: prefersReducedMotion.matches ? 'auto' : 'smooth',
    block: 'start'
  });

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const hash = anchor.getAttribute('href');
      if (!hash || hash === '#') return;
      const target = document.querySelector(hash);
      if (!target) return;

      event.preventDefault();

      if (mobileQuery.matches && siteNav && siteNav.contains(anchor)) {
        closeNav();
      }

      try {
        target.scrollIntoView(getScrollOptions());
      } catch (_) {
        target.scrollIntoView();
      }
      if (history.replaceState) {
        history.replaceState(null, '', hash);
      } else {
        window.location.hash = hash;
      }
    });
  });

  // Scroll-triggered reveal animations
  const revealSelectors = [
    'section',
    '.card',
    '.hero-inner > *',
    '.site-footer .container'
  ];
  const revealTargets = Array.from(
    document.querySelectorAll(revealSelectors.join(', '))
  ).filter((element, index, array) => array.indexOf(element) === index);

  if (revealTargets.length) {
    revealTargets.forEach((element) => element.classList.add('reveal-on-scroll'));
    const markVisible = (element) => element.classList.add('is-visible');

    if (prefersReducedMotion.matches || typeof IntersectionObserver === 'undefined') {
      revealTargets.forEach(markVisible);
    } else {
      let viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      const updateViewportHeight = () => {
        viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      };
      window.addEventListener('resize', updateViewportHeight);
      window.addEventListener('orientationchange', updateViewportHeight);

      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            markVisible(entry.target);
            obs.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.15,
        rootMargin: '0px 0px -5% 0px'
      });

      revealTargets.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const alreadyVisible = rect.top <= viewportHeight * 0.9 && rect.bottom >= 0;
        if (alreadyVisible) {
          markVisible(element);
        } else {
          observer.observe(element);
        }
      });

      const handleMotionChange = (event) => {
        if (!event.matches) return;
        revealTargets.forEach(markVisible);
        observer.disconnect();
      };
      if (typeof prefersReducedMotion.addEventListener === 'function') {
        prefersReducedMotion.addEventListener('change', handleMotionChange);
      } else if (typeof prefersReducedMotion.addListener === 'function') {
        prefersReducedMotion.addListener(handleMotionChange);
      }
    }
  }

})();
