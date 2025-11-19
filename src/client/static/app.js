const log = document.getElementById('log');
const form = document.getElementById('bar');
const input = document.getElementById('text');
const usersList = document.getElementById('users');
const currentNameEl = document.getElementById('current-name');
const changeNameBtn = document.getElementById('changeNameBtn');
const nameModalEl = document.getElementById('nameModal');
let nameModal = null;
let myId = null;

function addLine(text) {
  const p = document.createElement('p');
  p.className = 'msg';
  p.textContent = text;
  log.appendChild(p);
  log.scrollTop = log.scrollHeight;
}

// Avatar/color helpers
const userColors = {};
function colorFor(id) {
  if (userColors[id]) return userColors[id];
  const h = hashString(String(id));
  const hue = h % 360;
  const color = `hsl(${hue}, 65%, 45%)`;
  userColors[id] = color;
  return color;
}

function hashString(s) {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function initials(nameOrId) {
  const s = String(nameOrId || '').trim();
  if (!s) return '?';
  const parts = s.split(/\s+/);
  const first = parts[0][0] || '';
  const second = parts.length > 1 ? parts[1][0] : '';
  return (first + second).toUpperCase();
}

function addMessage(data) {
  const id = data.from;
  const name = data.from_name || id;
  const time = formatTime(data.ts);
  const container = document.createElement('div');
  container.className = 'chat-msg';
  const isMe = (id === myId);
  if (isMe) container.classList.add('me');

  const avatar = document.createElement('span');
  avatar.className = 'chat-avatar';
  avatar.style.backgroundColor = colorFor(id);
  avatar.textContent = initials(name);

  const content = document.createElement('div');
  content.className = 'chat-content';
  if (isMe) content.classList.add('me');
  const metaEl = document.createElement('div');
  metaEl.className = 'chat-meta';
  const nameEl = document.createElement('div');
  nameEl.className = 'chat-name';
  nameEl.textContent = name;
  const timeEl = document.createElement('div');
  timeEl.className = 'chat-time';
  timeEl.textContent = time;
  metaEl.appendChild(nameEl);
  metaEl.appendChild(timeEl);
  const textEl = document.createElement('span');
  textEl.className = 'chat-text';
  textEl.textContent = ` ${data.text}`;
  content.appendChild(metaEl);
  content.appendChild(textEl);

  container.appendChild(avatar);
  container.appendChild(content);
  log.appendChild(container);
  log.scrollTop = log.scrollHeight;
}

function formatTime(ts) {
  try {
    if (!ts) return new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
  } catch (e) {
    return '';
  }
}

const params = new URLSearchParams(window.location.search);
const serverHost = params.get('server_host') || window.location.hostname;
const serverPort = params.get('server_port') || '8000';
const wsScheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
const wsUrl = `${wsScheme}://${serverHost}:${serverPort}/api/ws`;
const ws = new WebSocket(wsUrl);
// Expose for name.js to send set_name when changed
window.ws = ws;
const statusBadge = document.getElementById('status-badge');

function setStatus(kind, text) {
  const base = 'badge text-bg-';
  statusBadge.className = base + kind;
  statusBadge.textContent = text;
}

ws.addEventListener('open', () => {
  setStatus('success', 'Connected');
  const nameToSend = getStoredName();
  if (!nameToSend) {
    openNameModal();
  }
  if (nameToSend) {
    ws.send(JSON.stringify({ type: 'set_name', name: nameToSend }));
  }
  updateCurrentName(nameToSend || '');
});
ws.addEventListener('close', () => {
  setStatus('secondary', 'Disconnected');
  addLine('Disconnected.');
});
ws.addEventListener('error', () => {
  setStatus('danger', 'Error');
  addLine('WebSocket error.');
});
ws.addEventListener('message', (ev) => {
  try {
    const data = JSON.parse(ev.data);
    switch (data.type) {
      case 'welcome':
        myId = data.you;
        setUsers(data.users || []);
        break;
      case 'users':
        setUsers(data.users || []);
        break;
      case 'message':
        addMessage(data);
        break;
      default:
        addLine(ev.data);
    }
  } catch (e) {
    addLine(ev.data);
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value.trim() && ws.readyState === WebSocket.OPEN) {
    ws.send(input.value);
    input.value = '';
  }
});

function setUsers(users) {
  usersList.innerHTML = '';
  users.forEach(u => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    const name = u.name || u.id;
    if (u.id === myId) {
      li.innerHTML = `${escapeHtml(name)} <span class="badge bg-primary rounded-pill">you</span>`;
    } else {
      li.textContent = name;
    }
    usersList.appendChild(li);
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}
