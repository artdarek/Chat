// Name handling using Bootstrap modal
(function () {
  function getStoredName() {
    return window.localStorage.getItem('chat_username');
  }

  function hashString(s) {
    var hash = 0;
    for (var i = 0; i < s.length; i++) {
      hash = ((hash << 5) - hash) + s.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function colorForName(name) {
    var h = hashString(String(name || 'user')) % 360;
    return 'hsl(' + h + ', 65%, 45%)';
  }

  function initials(name) {
    var s = String(name || '').trim();
    if (!s) return '?';
    var parts = s.split(/\s+/);
    var first = parts[0] ? parts[0][0] : '';
    var second = parts[1] ? parts[1][0] : '';
    return (first + second).toUpperCase();
  }

  function updateCurrentName(name) {
    var el = document.getElementById('current-name');
    if (!el) return;
    el.innerHTML = '';
    if (!name) return;
    var avatar = document.createElement('span');
    avatar.className = 'nav-avatar';
    avatar.style.backgroundColor = colorForName(name);
    avatar.textContent = initials(name);
    var nameSpan = document.createElement('span');
    nameSpan.textContent = name;
    el.appendChild(avatar);
    el.appendChild(nameSpan);
  }

  function setStoredName(name) {
    var n = (name || '').trim().slice(0, 30);
    if (!n) return null;
    window.localStorage.setItem('chat_username', n);
    updateCurrentName(n);
    try {
      if (window.ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'set_name', name: n }));
      }
    } catch (e) {}
    return n;
  }

  function openNameModal() {
    var modalEl = document.getElementById('nameModal');
    if (!modalEl || !window.bootstrap) return;
    var input = document.getElementById('nameInput');
    input.value = getStoredName() || '';
    var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
    setTimeout(function(){ input && input.focus(); }, 150);
  }

  // Expose helpers for app.js
  window.getStoredName = getStoredName;
  window.setStoredName = setStoredName;
  window.openNameModal = openNameModal;
  window.updateCurrentName = updateCurrentName;

  document.addEventListener('DOMContentLoaded', function () {
    updateCurrentName(getStoredName() || '');
    var btn = document.getElementById('changeNameBtn');
    if (btn) {
      btn.addEventListener('click', function(){ openNameModal(); });
    }
    var form = document.getElementById('nameForm');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = document.getElementById('nameInput');
        var saved = setStoredName(input && input.value);
        if (saved && window.bootstrap) {
          var modalEl = document.getElementById('nameModal');
          var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
          modal.hide();
        }
      });
    }
  });
})();
