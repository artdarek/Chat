(function(){
  // Compute API base from query like app.js
  var params = new URLSearchParams(window.location.search);
  var serverHost = params.get('server_host') || window.location.hostname;
  var serverPort = params.get('server_port') || '8000';
  var apiBase = window.location.protocol + '//' + serverHost + ':' + serverPort + '/api';

  function api(path, options) {
    options = options || {};
    options.credentials = 'include';
    options.headers = options.headers || {};
    if (options.body && !options.headers['Content-Type']) {
      options.headers['Content-Type'] = 'application/json';
    }
    return fetch(apiBase + path, options)
      .then(function(res){
        if (!res.ok) return res.json().catch(function(){return {detail: res.statusText};}).then(function(j){throw j;});
        return res.json();
      });
  }

  var signInBtn = document.getElementById('signInBtn');
  var signUpBtn = document.getElementById('signUpBtn');
  var logoutBtn = document.getElementById('logoutBtn');
  var authUserEl = document.getElementById('auth-user');

  function setAuthUser(user) {
    window.__authUser = user || null;
    if (authUserEl) {
      authUserEl.textContent = user ? (user.username || user.email || '') : '';
    }
    if (logoutBtn) logoutBtn.classList.toggle('d-none', !user);
    if (signInBtn) signInBtn.classList.toggle('d-none', !!user);
    if (signUpBtn) signUpBtn.classList.toggle('d-none', !!user);
    // Toggle chat input availability
    try {
      var input = document.getElementById('text');
      var btn = document.getElementById('sendBtn');
      if (input) {
        input.disabled = !user;
        input.placeholder = user ? 'Type a message...' : 'Sign in to chat...';
      }
      if (btn) btn.disabled = !user;
    } catch (e) {}
    // If user logs in and chat display name is empty, default to username
    if (user && window.getStoredName && !window.getStoredName()) {
      var defaultName = user.username || (user.email ? user.email.split('@')[0] : '');
      if (defaultName && window.setStoredName) window.setStoredName(defaultName);
    }
  }

  function refreshMe() {
    return api('/auth/me', { method: 'GET' })
      .then(function(me){ setAuthUser(me && me.id ? me : (me && me.user ? me.user : null)); })
      .catch(function(){ setAuthUser(null); });
  }

  // Sign in modal/form
  var signInModalEl = document.getElementById('signInModal');
  var signInForm = document.getElementById('signInForm');
  var signInError = document.getElementById('signInError');

  function openSignIn() {
    if (!window.bootstrap) return;
    var m = bootstrap.Modal.getOrCreateInstance(signInModalEl);
    if (signInError) signInError.textContent = '';
    m.show();
    setTimeout(function(){ var i = document.getElementById('loginInput'); i && i.focus(); }, 150);
  }

  if (signInBtn) signInBtn.addEventListener('click', openSignIn);

  if (signInForm) {
    signInForm.addEventListener('submit', function(e){
      e.preventDefault();
      var login = document.getElementById('loginInput').value;
      var password = document.getElementById('passwordInput').value;
      api('/auth/login', { method: 'POST', body: JSON.stringify({ login: login, password: password }) })
        .then(function(user){
          setAuthUser(user);
          var m = bootstrap.Modal.getOrCreateInstance(signInModalEl);
          m.hide();
        })
        .catch(function(err){ if (signInError) signInError.textContent = err && err.detail ? err.detail : 'Login failed'; });
    });
  }

  // Sign up modal/form
  var signUpModalEl = document.getElementById('signUpModal');
  var signUpForm = document.getElementById('signUpForm');
  var signUpError = document.getElementById('signUpError');

  function openSignUp() {
    if (!window.bootstrap) return;
    var m = bootstrap.Modal.getOrCreateInstance(signUpModalEl);
    if (signUpError) signUpError.textContent = '';
    m.show();
    setTimeout(function(){ var i = document.getElementById('suUsername'); i && i.focus(); }, 150);
  }

  if (signUpBtn) signUpBtn.addEventListener('click', openSignUp);

  if (signUpForm) {
    signUpForm.addEventListener('submit', function(e){
      e.preventDefault();
      var username = document.getElementById('suUsername').value || null;
      var email = document.getElementById('suEmail').value || null;
      var password = document.getElementById('suPassword').value;
      if ((!username || username.trim()==='') && (!email || email.trim()==='')) {
        if (signUpError) signUpError.textContent = 'Provide username or email.';
        return;
      }
      api('/auth/signup', { method: 'POST', body: JSON.stringify({ username: username || null, email: email || null, password: password }) })
        .then(function(_){
          // Auto-login after signup
          var login = username || email;
          return api('/auth/login', { method: 'POST', body: JSON.stringify({ login: login, password: password }) });
        })
        .then(function(user){
          setAuthUser(user);
          var m = bootstrap.Modal.getOrCreateInstance(signUpModalEl);
          m.hide();
        })
        .catch(function(err){ if (signUpError) signUpError.textContent = err && err.detail ? err.detail : 'Sign up failed'; });
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(){
      api('/auth/logout', { method: 'POST' }).finally(function(){ setAuthUser(null); });
    });
  }

  // Initialize auth state on load
  document.addEventListener('DOMContentLoaded', function(){ refreshMe(); });
})();
