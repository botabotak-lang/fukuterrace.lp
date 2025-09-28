// fukuterace-lp/assets/js/main.js
(function(){
  const navToggle = document.getElementById('navToggle');
  const siteNav = document.getElementById('siteNav');
  if (navToggle && siteNav){
    navToggle.addEventListener('click', () => {
      const visible = getComputedStyle(siteNav).display !== 'none';
      siteNav.style.display = visible ? 'none' : 'flex';
    });
  }

  // Smooth scroll for same-page anchors
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Demo submit
  const btn = document.getElementById('btnSubmit');
  if (btn){
    btn.addEventListener('click', () => {
      alert('デモのため送信は行っていません。実運用向けのフォーム連携（メール/外部サービス）も対応可能です。');
    });
  }
})();
