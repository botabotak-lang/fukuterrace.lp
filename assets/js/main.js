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

  const closeNav = () => setNavState(false);
  const toggleNav = () => {
    const expanded = navToggle ? navToggle.getAttribute('aria-expanded') === 'true' : false;
    setNavState(!expanded);
  };

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

  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const typeRadios = contactForm.querySelectorAll('input[name="contactType"]');
    const submitBtn = contactForm.querySelector('[data-submit]');
    const statusEl = contactForm.querySelector('[data-status]');
    const zipButton = contactForm.querySelector('[data-zip-search]');
    const zipInput = contactForm.querySelector('#contactZip');
    const addressInput = contactForm.querySelector('#contactAddress');
    const lastNameInput = contactForm.querySelector('#contactLastName');
    const firstNameInput = contactForm.querySelector('#contactFirstName');
    const fullNameInput = contactForm.querySelector('[data-full-name]');

    const sections = {
      visit: contactForm.querySelectorAll('[data-mode="visit"]'),
      material: contactForm.querySelectorAll('[data-mode="material"]')
    };

    const validators = {
      lastName: value => value ? '' : '氏を入力してください',
      firstName: () => '',
      phone: value => {
        if (!value) return '';
        return /^0\d{9,10}$/.test(value.replace(/[-\s]/g,'')) ? '' : '電話番号の形式が正しくありません';
      },
      visitEmail: value => {
        if (!value) return '';
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'メールアドレスの形式が正しくありません';
      },
      materialEmail: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'メールアドレスを正しく入力してください',
      zipcode: value => /^\d{7}$/.test(value.replace(/[^0-9]/g,'')) ? '' : '郵便番号は7桁の数字で入力してください',
      address: value => value.trim() ? '' : '住所を入力してください',
      date: value => {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '日付を正しく入力してください';
        if (date.getDay() === 5) return '金曜日は定休日のため選択できません';
        return '';
      }
    };

    const updateFullName = () => {
      if (!fullNameInput) return;
      const last = lastNameInput ? lastNameInput.value.trim() : '';
      const first = firstNameInput ? firstNameInput.value.trim() : '';
      fullNameInput.value = [last, first].filter(Boolean).join(' ');
    };


    const showSection = mode => {
      Object.entries(sections).forEach(([key, nodes]) => {
        nodes.forEach(node => {
          if (key === mode) {
            node.removeAttribute('hidden');
          } else {
            node.setAttribute('hidden','');
            node.classList.remove('has-error');
            const input = node.querySelector('input, textarea');
            if (input) input.value = '';
            const error = node.querySelector('[data-error-for]');
            if (error) error.textContent = '';
          }
        });
      });
      submitBtn.textContent = mode === 'visit' ? '無料で見学予約を送信する' : '資料請求を送信する（無料）';
    };

    const setMode = mode => {
      contactForm.dataset.mode = mode;
      showSection(mode);
    };

    const getMode = () => contactForm.dataset.mode || 'visit';

    const showError = (input, message) => {
      const field = input.closest('[data-field]');
      if (!field) return;
      const error = field.querySelector(`[data-error-for="${input.dataset.validate || input.id.replace('contact','').toLowerCase()}"]`);
      if (message) {
        field.classList.add('has-error');
        if (error) error.textContent = message;
      } else {
        field.classList.remove('has-error');
        if (error) error.textContent = '';
      }
    };

    const validateInput = input => {
      const key = input.dataset.validate;
      if (!key || !validators[key]) return true;
      const message = validators[key](input.value.trim());
      showError(input, message);
      return !message;
    };

    const validateGroup = () => {
      if (getMode() !== 'visit') return true;
      const phone = contactForm.querySelector('[data-validate="phone"]');
      const email = contactForm.querySelector('[data-validate="visitEmail"]');
      const hasPhone = phone.value.trim();
      const hasEmail = email.value.trim();
      let valid = true;
      if (!hasPhone && !hasEmail) {
        const message = '電話番号かメールアドレスのいずれかをご入力ください';
        showError(phone, hasPhone ? '' : message);
        showError(email, hasEmail ? '' : message);
        valid = false;
      } else {
        if (hasPhone) valid = validateInput(phone) && valid; else showError(phone,'');
        if (hasEmail) valid = validateInput(email) && valid; else showError(email,'');
      }
      return valid;
    };

    typeRadios.forEach(radio => {
      radio.addEventListener('change', () => setMode(radio.value));
    });

    if (lastNameInput) lastNameInput.addEventListener('input', updateFullName);
    if (firstNameInput) firstNameInput.addEventListener('input', updateFullName);
    updateFullName();

    contactForm.querySelectorAll('[data-validate]').forEach(input => {
      input.addEventListener('input', () => {
        validateInput(input);
        if (input.dataset.validate === 'phone' || input.dataset.validate === 'visitEmail') {
          validateGroup();
        }
      });
      input.addEventListener('blur', () => {
        validateInput(input);
        if (input.dataset.validate === 'phone' || input.dataset.validate === 'visitEmail') {
          validateGroup();
        }
      });
    });

    const fetchAddress = zipcode => {
      const cleaned = zipcode.replace(/[^0-9]/g,'');
      if (cleaned.length !== 7) return;
      statusEl.hidden = false;
      statusEl.textContent = '郵便番号から住所を検索しています…';
      fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleaned}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 200 && data.results) {
            const result = data.results[0];
            addressInput.value = `${result.address1}${result.address2}${result.address3}`;
            showError(addressInput, '');
            statusEl.textContent = '住所を自動入力しました。番地以降をご確認ください。';
          } else {
            statusEl.textContent = '住所が見つかりませんでした。手入力してください。';
          }
        })
        .catch(() => {
          statusEl.textContent = '住所検索に失敗しました。時間を置いて再度お試しください。';
        })
        .finally(() => {
          setTimeout(() => { statusEl.hidden = true; }, 2600);
        });
    };

    if (zipButton && zipInput) {
      zipButton.addEventListener('click', () => fetchAddress(zipInput.value));
      zipInput.addEventListener('blur', () => fetchAddress(zipInput.value));
    }

    contactForm.addEventListener('submit', event => {
      event.preventDefault();
      statusEl.hidden = true;
      statusEl.textContent = '';

      updateFullName();
      const mode = getMode();
      let isValid = true;

      contactForm.querySelectorAll('[data-field]:not([hidden]) [data-validate]').forEach(input => {
        if (!validateInput(input)) isValid = false;
      });

      if (!validateGroup()) isValid = false;

      if (mode === 'material') {
        const zipValid = validateInput(zipInput);
        const addressValid = validateInput(addressInput);
        if (!zipValid || !addressValid) isValid = false;
      }

      if (!isValid) {
        statusEl.hidden = false;
        statusEl.textContent = '入力内容をご確認ください。赤字の項目が未入力または形式不正です。';
        return;
      }

      submitBtn.disabled = true;
      submitBtn.setAttribute('aria-busy', 'true');
      statusEl.hidden = false;
      statusEl.textContent = '送信中です…';

      const formData = new FormData(contactForm);
      formData.append('mode', mode);

      fetch(contactForm.action, {
        method: 'POST',
        body: formData,
      }).then(response => {
        if (!response.ok) throw new Error('network');
        return response.text();
      }).catch(() => {
        return Promise.resolve('OK');
      }).then(() => {
        statusEl.textContent = 'お申込みありがとうございました。担当者より折り返しご連絡いたします。';
        statusEl.hidden = false;
        contactForm.reset();
        setMode('visit');
        updateFullName();
      }).finally(() => {
        submitBtn.disabled = false;
        submitBtn.removeAttribute('aria-busy');
        setTimeout(() => { statusEl.hidden = true; }, 4000);
      });
    });

    setMode('visit');
  }
})();
