(function(){
  var KEY = 'chat_theme';

  function applyTheme(theme) {
    var t = (theme === 'dark') ? 'dark' : 'light';
    document.documentElement.setAttribute('data-bs-theme', t);
    var toggle = document.getElementById('themeToggle');
    if (toggle) toggle.checked = (t === 'dark');
    try { localStorage.setItem(KEY, t); } catch(e) {}
  }

  function initTheme() {
    var stored = null;
    try { stored = localStorage.getItem(KEY); } catch(e) {}
    if (!stored) {
      // Prefer user’s OS setting on first load
      stored = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    applyTheme(stored);
  }

  document.addEventListener('DOMContentLoaded', function(){
    initTheme();
    var toggle = document.getElementById('themeToggle');
    if (toggle) {
      toggle.addEventListener('change', function(){
        applyTheme(toggle.checked ? 'dark' : 'light');
      });
    }
  });
})();

