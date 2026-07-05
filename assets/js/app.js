/* ============================================
   app.js — comportamenti condivisi su tutte le pagine
   - toggle lingua IT/EN (persistito in localStorage)
   - menu mobile
   - applica le stringhe i18n dal dizionario di pagina
   ============================================ */
(function () {
  const STORAGE_KEY = 'site-lang';

  function getLang() {
    return localStorage.getItem(STORAGE_KEY) || (navigator.language || 'it').slice(0, 2) === 'it' ? 'it' : 'en';
  }

  function setLang(lang) {
    localStorage.setItem(STORAGE_KEY, lang);
    applyLang(lang);
  }

  function applyLang(lang) {
    document.documentElement.setAttribute('lang', lang);
    document.querySelectorAll('[data-it][data-en]').forEach((el) => {
      const text = lang === 'it' ? el.getAttribute('data-it') : el.getAttribute('data-en');
      if (text !== null) el.textContent = text;
    });
    document.querySelectorAll('[data-it-html][data-en-html]').forEach((el) => {
      const html = lang === 'it' ? el.getAttribute('data-it-html') : el.getAttribute('data-en-html');
      if (html !== null) el.innerHTML = html;
    });
    document.querySelectorAll('[data-lang-toggle] button').forEach((btn) => {
      btn.setAttribute('aria-pressed', btn.dataset.lang === lang ? 'true' : 'false');
    });
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  }

  document.addEventListener('DOMContentLoaded', () => {
    const initialLang = localStorage.getItem(STORAGE_KEY) || 'it';
    applyLang(initialLang);

    document.querySelectorAll('[data-lang-toggle] button').forEach((btn) => {
      btn.addEventListener('click', () => setLang(btn.dataset.lang));
    });

    const navToggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.main-nav');
    if (navToggle && nav) {
      navToggle.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
  });

  window.getCurrentLang = () => localStorage.getItem(STORAGE_KEY) || 'it';
})();
