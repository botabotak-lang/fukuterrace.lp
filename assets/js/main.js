// fukuterrace-LP/assets/js/main.js
(() => {
  const body = document.body;
  body.classList.remove('no-js');
  body.classList.add('has-js');
  const navToggle = document.getElementById('navToggle');
  const siteNav = document.getElementById('siteNav');
  const srLabel = navToggle?.querySelector('.sr-only') || null;
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

  const closeNav = () => setNavState(false);
  const toggleNav = () => setNavState(navToggle?.getAttribute('aria-expanded') !== 'true');

  if (navToggle && siteNav) {
    setNavState(false);

    navToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleNav();
    });

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

      if (mobileQuery.matches && siteNav?.contains(anchor)) {
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

  const form = document.querySelector('.contact-form');
  if (form) {
    const statusEl = document.getElementById('formStatus');
    const submitBtn = document.getElementById('btnSubmit');

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.setAttribute('aria-busy', 'true');
      }

      if (statusEl) {
        statusEl.hidden = false;
        statusEl.textContent = '現在オンライン送信の準備中です。お急ぎの場合はお電話またはLINEをご利用ください。';
      }

      window.setTimeout(() => {
        form.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.removeAttribute('aria-busy');
        }
      }, 800);
    });
  }
})();
