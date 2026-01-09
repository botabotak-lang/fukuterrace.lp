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
    // console.log('Setting Nav State:', expanded);
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
  let lastScrollY = window.pageYOffset || document.documentElement.scrollTop;
  const scrollThreshold = 10;

  if (header) {
    window.addEventListener('scroll', () => {
      // メニューが開いているときは何もしない
      if (body.classList.contains('nav-open')) return;
      
      const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
      const diff = currentScrollY - lastScrollY;

      if (currentScrollY <= 50) {
        header.classList.remove('is-hidden');
      } else if (Math.abs(diff) > scrollThreshold) {
        if (diff > 0) {
          // 下スクロールで隠す
          header.classList.add('is-hidden');
        } else {
          // 上スクロールで表示
          header.classList.remove('is-hidden');
        }
        lastScrollY = currentScrollY;
      }
    }, { passive: true });
  }

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
    // console.log('Toggle Nav Clicked');
    const expanded = navToggle ? navToggle.getAttribute('aria-expanded') === 'true' : false;
    setNavState(!expanded);
  };

  if (navToggle && siteNav) {
    setNavState(false);

    navToggle.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      setNavState(!expanded);
    });

    document.addEventListener('click', (event) => {
      // メニューが開いていない場合は何もしない
      if (navToggle.getAttribute('aria-expanded') !== 'true') return;
      
      const target = event.target;
      // ボタン自体またはメニューの中身をクリックした場合は閉じない
      if (navToggle.contains(target) || siteNav.contains(target)) {
        return;
      }
      
      setNavState(false);
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
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    });

    revealTargets.forEach((target) => {
      target.classList.add('reveal-on-scroll');
      observer.observe(target);
    });
  }

  // --- Contact Form Logic ---
  const contactForm = document.getElementById('lpContactForm');
  const modeButtons = document.querySelectorAll('.mode-btn');
  const formModeInput = document.getElementById('formMode');
  const visitFields = document.querySelector('.mode-fields.mode-visit');
  const materialFields = document.querySelector('.mode-fields.mode-material');
  const formStatus = document.getElementById('formStatus');
  const submitBtn = document.getElementById('submitBtn');
  const zipcode = document.getElementById('zipcode');
  const address = document.getElementById('address');

  // 郵便番号から住所を自動入力
  if (zipcode && address) {
    zipcode.addEventListener('input', async (e) => {
      const val = e.target.value.replace(/[^0-9]/g, '');
      if (val.length === 7) {
        try {
          const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${val}`);
          const data = await response.json();
          if (data.results) {
            const res = data.results[0];
            address.value = res.address1 + res.address2 + res.address3;
            address.focus();
          }
        } catch (error) {
          console.error('Zipcode search failed:', error);
        }
      }
    });
  }

  if (contactForm) {
    console.log('Contact form initialized'); // デバッグ用

    // Define setFormMode function
    const setFormMode = (mode) => {
        console.log('Switching to mode:', mode);
        
        // Update Buttons
        modeButtons.forEach(b => {
            if (b.getAttribute('data-mode') === mode) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });
        
        // Update Hidden Input
        if (formModeInput) formModeInput.value = mode;
        
        // Show/Hide Fields
        if (mode === 'visit') {
          if (visitFields) visitFields.style.display = 'block';
          if (materialFields) materialFields.style.display = 'none';
          
          // Toggle required attributes safely
          const phoneInput = document.getElementById('phone');
          const zipInput = document.getElementById('zipcode');
          const addrInput = document.getElementById('address');
          
          if (phoneInput) phoneInput.required = true;
          if (zipInput) zipInput.required = false;
          if (addrInput) addrInput.required = false;
        } else {
          if (visitFields) visitFields.style.display = 'none';
          if (materialFields) materialFields.style.display = 'block';
          
          const phoneInput = document.getElementById('phone');
          const zipInput = document.getElementById('zipcode');
          const addrInput = document.getElementById('address');
          
          if (phoneInput) phoneInput.required = false;
          if (zipInput) zipInput.required = true;
          if (addrInput) addrInput.required = true;
        }
    };

    // Mode Toggling
    modeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const mode = btn.getAttribute('data-mode');
        setFormMode(mode);
      });
    });

    // Handle URL Params on Load
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode');
    if (modeParam === 'document' || modeParam === 'material') {
        setFormMode('material');
    } else {
        // Default to visit if explicitly requested or no param
        // (Existing logic: hidden input value is 'visit' initially)
        // If we want to force visit mode on load if ?mode=visit is present:
        if (modeParam === 'visit') {
            setFormMode('visit');
        }
        // If no param, we leave it as per HTML default (usually visit)
        // But let's sync it just in case
        if (!modeParam) setFormMode('visit');
    }

    // Handle CTA Links with Smooth Scroll
    document.querySelectorAll('.js-cta-link').forEach(link => {
        link.addEventListener('click', (e) => {
            // Prevent default anchor jump to allow smooth scroll handling
            e.preventDefault();
            
            const mode = link.getAttribute('data-mode');
            if (mode) {
                // Map 'document' to 'material' as per form logic
                const formMode = mode === 'document' ? 'material' : 'visit';
                setFormMode(formMode);
            }
            
            // Smooth scroll to contact form
            const contactSection = document.getElementById('contact');
            if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth' });
                // Update URL hash without jumping
                history.pushState(null, '', '#contact?mode=' + mode);
            }
        });
    });

    // Form Submission
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!submitBtn) return;
      
      submitBtn.disabled = true;
      const originalText = submitBtn.textContent;
      submitBtn.textContent = '送信中...';
      if (formStatus) formStatus.style.display = 'none';

      const formData = new FormData(contactForm);

      try {
        const response = await fetch('./send.php', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          // Success
          window.location.href = './thanks.html';
        } else {
          // Error
          const errorText = await response.text();
          throw new Error(errorText || '送信に失敗しました。');
        }
      } catch (err) {
        if (formStatus) {
          formStatus.textContent = err.message;
          formStatus.style.display = 'block';
          formStatus.className = 'form-status error';
        }
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

})();
