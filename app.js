/* Maintenance Tracker — front-end (vanilla JS, no build step) */
(() => {
'use strict';

/* =============================== config / constants =============================== */
const CFG = Object.assign({ API_URL: '', APP_TITLE: 'Maintenance Tracker', DEPARTMENT: 'Mechanical Maintenance Team', REFRESH_SECONDS: 60 }, window.APP_CONFIG || {});
const DEMO = !CFG.API_URL;
const STATUSES = ['Not Started', 'In Progress', 'On Hold', 'Blocked', 'Completed'];
const PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];
const STATUS_COLOR = { 'Not Started': '#6b7280', 'In Progress': '#2563eb', 'On Hold': '#d97706', 'Blocked': '#dc2626', 'Completed': '#16a34a' };
const MAX_FILE = 12 * 1024 * 1024;

const ICONS = {
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
  gantt: '<line x1="3" y1="6" x2="14" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="17" y2="18"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  refresh: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  clip: '<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
  alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  report: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'
};
const icon = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* =============================== helpers =============================== */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const fmtDate = iso => iso ? String(iso).slice(0, 10).split('-').reverse().join('/') : '—';
const fmtDT = iso => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? '' : `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const slug = s => String(s).toLowerCase().replace(/\s+/g, '-');
const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const initials = s => (String(s).trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2) || '?').toUpperCase();
const members = t => String((t && t.members) || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
const clone = o => JSON.parse(JSON.stringify(o));
const fmtSize = b => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';

function toast(msg, type) {
  const el = document.createElement('div');
  el.className = 'toast ' + (type || '');
  el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), type === 'err' ? 6000 : 2800);
}

/* =============================== state =============================== */
const state = {
  teams: [], tasks: [], updates: [],
  role: 'editor', view: 'dashboard', loading: true, lastSync: null, online: true,
  filters: { q: '', team: '', status: '', overdue: false },
  sort: { key: 'endDate', dir: 1 }
};
const auth = { pin: '', user: '' };
let draft = null;      // task drawer draft
let updDraft = null;   // "post update" draft
let refreshTimer = null;

const isEditor = () => state.role === 'editor';
const teamById = id => state.teams.find(t => String(t.id) === String(id));
const taskById = id => state.tasks.find(t => String(t.id) === String(id));
const isOverdue = t => t.status !== 'Completed' && t.endDate && t.endDate < todayISO();
const tasksOf = id => state.tasks.filter(t => String(t.teamId) === String(id));
function stats(tasks) {
  const n = tasks.length, done = tasks.filter(t => t.status === 'Completed').length;
  const avg = n ? Math.round(tasks.reduce((s, t) => s + (Number(t.progress) || 0), 0) / n) : 0;
  return { n, done, avg, over: tasks.filter(isOverdue).length, active: tasks.filter(t => t.status === 'In Progress').length,
           blocked: tasks.filter(t => t.status === 'Blocked' || t.status === 'On Hold').length };
}

/* =============================== data layer =============================== */
const demo = {
  get() {
    try { const d = JSON.parse(localStorage.getItem('mmt_demo')); if (d && d.tasks) return d; } catch (e) {}
    const d = { teams: clone(window.SEED.teams), tasks: clone(window.SEED.tasks).map(t => Object.assign(t, { createdAt: new Date().toISOString() })), updates: [] };
    demo.put(d); return d;
  },
  put(d) { try { localStorage.setItem('mmt_demo', JSON.stringify(d)); } catch (e) { throw new Error('Browser storage is full — remove some attachments.'); } }
};

function demoCall(action, data) {
  const d = demo.get();
  const now = new Date().toISOString();
  const norm = (t, ex) => {
    const o = Object.assign({}, ex || {}, t);
    o.progress = Math.max(0, Math.min(100, Number(o.progress) || 0));
    if (o.status === 'Completed') { o.progress = 100; if (!o.actualEnd) o.actualEnd = todayISO(); }
    if (!o.createdAt) o.createdAt = now;
    o.updatedAt = now; o.updatedBy = auth.user || 'Demo user';
    return o;
  };
  switch (action) {
    case 'saveTask': {
      const i = d.tasks.findIndex(t => t.id === data.id);
      const t = norm(data, i >= 0 ? d.tasks[i] : null);
      if (i >= 0) d.tasks[i] = t; else d.tasks.push(t);
      demo.put(d); return { ok: true, task: t };
    }
    case 'deleteTask': d.tasks = d.tasks.filter(t => t.id !== data.id); d.updates = d.updates.filter(u => u.taskId !== data.id); demo.put(d); return { ok: true };
    case 'saveTeam': {
      const i = d.teams.findIndex(t => t.id === data.id);
      if (i >= 0) d.teams[i] = data; else d.teams.push(data);
      demo.put(d); return { ok: true, team: data };
    }
    case 'deleteTeam':
      if (d.tasks.some(t => t.teamId === data.id)) return { ok: false, error: 'This team still has tasks. Move or delete them first.' };
      d.teams = d.teams.filter(t => t.id !== data.id); demo.put(d); return { ok: true };
    case 'addUpdate': {
      const i = d.tasks.findIndex(t => t.id === data.taskId);
      if (i < 0) return { ok: false, error: 'Task not found' };
      const upd = { id: uid('U'), taskId: data.taskId, timestamp: now, user: auth.user || 'Demo user', note: data.note || '',
                    status: data.status, progress: Number(data.progress), attachments: data.attachments || [] };
      d.updates.push(upd);
      d.tasks[i] = norm({ status: upd.status, progress: upd.progress }, d.tasks[i]);
      demo.put(d); return { ok: true, update: upd, task: d.tasks[i] };
    }
    case 'uploadFile':
      return { ok: true, file: { id: uid('F'), name: data.name, mime: data.mime, size: Math.round(data.base64.length * 0.75),
        url: 'data:' + data.mime + ';base64,' + data.base64, thumb: 'data:' + data.mime + ';base64,' + data.base64 } };
    case 'bulkImport': return { ok: true };
  }
  return { ok: false, error: 'Unknown action' };
}

const api = {
  async load() {
    if (DEMO) { const d = demo.get(); return { ok: true, role: 'editor', teams: d.teams, tasks: d.tasks, updates: d.updates }; }
    const r = await fetch(`${CFG.API_URL}?action=getAll&pin=${encodeURIComponent(auth.pin)}`);
    return r.json();
  },
  async call(action, data) {
    if (DEMO) { try { return demoCall(action, data); } catch (e) { return { ok: false, error: e.message }; } }
    const r = await fetch(CFG.API_URL, { method: 'POST', body: JSON.stringify({ action, pin: auth.pin, user: auth.user, data }) });
    return r.json();
  }
};

async function request(action, data) {
  setSync('busy');
  try {
    const res = await api.call(action, data);
    if (!res.ok) { if (res.error === 'auth') { logout(); throw new Error('PIN no longer valid'); } throw new Error(res.error || 'Request failed'); }
    setSync('ok');
    return res;
  } catch (e) {
    setSync(e.message === 'Failed to fetch' ? 'off' : 'ok');
    throw new Error(e.message === 'Failed to fetch' ? 'Cannot reach the server — check your connection.' : e.message);
  }
}

function setSync(s) {
  const d = $('#sync-dot'), l = $('#sync-label');
  if (!d) return;
  d.className = 'dot' + (s === 'busy' ? ' busy' : s === 'off' ? ' off' : '');
  if (s === 'busy') l.textContent = 'Saving…';
  else if (s === 'off') l.textContent = 'Offline';
  else l.textContent = state.lastSync ? 'Synced ' + pad(state.lastSync.getHours()) + ':' + pad(state.lastSync.getMinutes()) : 'Ready';
}

async function load(silent) {
  if (!silent) setSync('busy');
  try {
    const d = await api.load();
    if (!d.ok) { if (d.error === 'auth') { logout(); return false; } throw new Error(d.error); }
    state.teams = (d.teams || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
    state.tasks = (d.tasks || []).map(t => Object.assign({ attachments: [] }, t, { attachments: Array.isArray(t.attachments) ? t.attachments : [] }));
    state.updates = (d.updates || []).map(u => Object.assign({}, u, { attachments: Array.isArray(u.attachments) ? u.attachments : [] }));
    state.role = d.role || 'editor';
    state.lastSync = new Date(); state.loading = false; state.online = true;
    setSync('ok');
    return true;
  } catch (e) {
    state.online = false; state.loading = false; setSync('off');
    if (!silent) toast(e.message === 'Failed to fetch' ? 'Cannot reach the server.' : e.message, 'err');
    return false;
  }
}

/* =============================== auth / boot =============================== */
function logout() {
  try { localStorage.removeItem('mmt_auth'); } catch (e) {}
  auth.pin = ''; clearInterval(refreshTimer);
  closeDrawer(); closeModal();
  showLogin();
}

function showLogin(msg) {
  $('#app').innerHTML = `
  <div class="login"><div class="card box">
    <div class="logo">${icon('gear')}</div>
    <h1>${esc(CFG.APP_TITLE)}</h1>
    <div class="muted">${esc(CFG.DEPARTMENT)}</div>
    <form id="login-form">
      <label class="fld">Your name<input id="lg-name" placeholder="e.g. Rafid" autocomplete="name" required value="${esc(auth.user)}"></label>
      <label class="fld">Access PIN<input id="lg-pin" type="password" inputmode="numeric" autocomplete="current-password" required></label>
      <div class="err-msg" id="lg-err">${esc(msg || '')}</div>
      <button class="btn primary" style="justify-content:center">Sign in</button>
    </form>
  </div></div>`;
  $('#login-form').addEventListener('submit', async e => {
    e.preventDefault();
    auth.user = $('#lg-name').value.trim(); auth.pin = $('#lg-pin').value.trim();
    const btn = $('#login-form button'); btn.disabled = true; btn.textContent = 'Checking…';
    const ok = await load(true);
    if (ok) {
      try { localStorage.setItem('mmt_auth', JSON.stringify({ pin: auth.pin, user: auth.user })); } catch (e) {}
      start();
    } else {
      btn.disabled = false; btn.textContent = 'Sign in';
      $('#lg-err').textContent = 'Wrong PIN or the server cannot be reached.';
    }
  });
}

async function boot() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem('mmt_auth') || 'null'); } catch (e) {}
  if (DEMO) { auth.user = (saved && saved.user) || 'Demo user'; await load(true); return start(); }
  if (saved && saved.pin) {
    auth.pin = saved.pin; auth.user = saved.user || '';
    if (await load(true)) return start();
  }
  showLogin();
}

function start() {
  buildShell();
  setView(state.view);
  clearInterval(refreshTimer);
  refreshTimer = setInterval(async () => {
    if (document.hidden || $('#drawer-root').children.length || $('#modal-root').children.length) return;
    if (await load(true)) renderView(true);
  }, Math.max(15, CFG.REFRESH_SECONDS) * 1000);
}

/* =============================== shell / routing =============================== */
const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid', title: 'Dashboard', sub: 'Overview of all maintenance work' },
  { id: 'teams', label: 'Teams', icon: 'users', title: 'Teams & work', sub: 'Who is doing what, and how far along' },
  { id: 'tasks', label: 'All tasks', icon: 'list', title: 'All tasks', sub: 'Sortable list across every team' },
  { id: 'timeline', label: 'Timeline', icon: 'gantt', title: 'Timeline', sub: 'Planned dates versus today' }
];

function buildShell() {
  $('#app').innerHTML = `
  <div class="layout">
    <aside class="side">
      <div class="brand"><div class="logo">${icon('gear')}</div><div><b>${esc(CFG.APP_TITLE)}</b><small>${esc(CFG.DEPARTMENT)}</small></div></div>
      <nav class="nav">${NAV.map(n => `<button data-act="nav" data-v="${n.id}" id="nav-${n.id}">${icon(n.icon)}<span>${n.label}</span></button>`).join('')}</nav>
      <div class="side-foot">
        <div class="who" data-act="rename" title="Click to change your name">
          <div class="avatar" id="who-av"></div><div><b id="who-name"></b><small id="who-role"></small></div>
        </div>
        <div class="sync"><span class="dot" id="sync-dot"></span><span id="sync-label">Ready</span></div>
        <div class="side-btns">
          <button data-act="theme" title="Toggle dark mode">${icon('moon')}<span>Theme</span></button>
          ${DEMO ? '' : `<button data-act="logout" title="Sign out">${icon('logout')}<span>Sign out</span></button>`}
        </div>
      </div>
    </aside>
    <main class="main">
      <div class="top">
        <div><h1 id="v-title"></h1><div class="sub" id="v-sub"></div></div><div class="grow"></div>
        <button class="btn" data-act="refresh" title="Reload from sheet">${icon('refresh')}Refresh</button>
        <button class="btn" data-act="report" title="Daily report for WhatsApp">${icon('report')}Daily report</button>
        <button class="btn" data-act="csv">${icon('download')}Export</button>
        <button class="btn" data-act="team-new" id="b-team">${icon('users')}Add team</button>
        <button class="btn primary" data-act="task-new" id="b-task">${icon('plus')}New task</button>
      </div>
      ${DEMO ? `<div class="banner"><b>Demo mode</b> — data is saved only in this browser. Add your Apps Script URL in <code>js/config.js</code> to use the Google Sheet.</div>` : ''}
      <div id="view"></div>
    </main>
  </div>`;
  refreshWho();
}

function refreshWho() {
  if (!$('#who-name')) return;
  $('#who-name').textContent = auth.user || 'Guest';
  $('#who-av').textContent = initials(auth.user || 'G');
  $('#who-role').textContent = isEditor() ? 'Editor' : 'View only';
  $('#b-task').style.display = $('#b-team').style.display = isEditor() ? '' : 'none';
  setSync('ok');
}

function setView(v) {
  state.view = v;
  $$('.nav button').forEach(b => b.classList.toggle('active', b.dataset.v === v));
  const n = NAV.find(x => x.id === v);
  $('#v-title').textContent = n.title; $('#v-sub').textContent = n.sub;
  renderView();
}

function renderView(keepScroll) {
  refreshWho();
  const el = $('#view'); if (!el) return;
  const y = window.scrollY;
  const v = state.view;
  if (v === 'dashboard') { el.innerHTML = '<div id="vbody"></div>'; renderBody(); }
  else { el.innerHTML = filterBar() + '<div id="vbody"></div>'; renderBody(); }
  if (keepScroll) window.scrollTo(0, y);
}

function renderBody() {
  const b = $('#vbody'); if (!b) return;
  if (state.loading) { b.innerHTML = '<div class="empty">Loading…</div>'; return; }
  if (!state.teams.length && !state.tasks.length) { b.innerHTML = emptyStart(); return; }
  ({ dashboard: viewDashboard, teams: viewTeams, tasks: viewTable, timeline: viewTimeline })[state.view](b);
}

function emptyStart() {
  return `<div class="card empty"><h3>Nothing here yet</h3>
    <p>${isEditor() ? 'Add your first team, or load the starter data from your Team-wise Task List.' : 'No data has been added yet.'}</p>
    ${isEditor() ? `<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
      <button class="btn primary" data-act="seed">Load starter data (Teams A–F)</button>
      <button class="btn" data-act="team-new">Add a team</button></div>` : ''}</div>`;
}

/* =============================== filters =============================== */
function filterBar() {
  const f = state.filters;
  return `<div class="fbar">
    <div class="search">${icon('search')}<input id="flt-q" placeholder="Search task, person, remark…" value="${esc(f.q)}"></div>
    <select id="flt-team"><option value="">All teams</option>${state.teams.map(t => `<option value="${esc(t.id)}" ${f.team === String(t.id) ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select>
    <select id="flt-status"><option value="">All statuses</option>${STATUSES.map(s => `<option ${f.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
    <label class="chk"><input type="checkbox" id="flt-over" ${f.overdue ? 'checked' : ''}> Overdue only</label>
    <button class="btn ghost sm" data-act="clear-filters">Clear</button></div>`;
}
const filtersActive = () => { const f = state.filters; return !!(f.q || f.team || f.status || f.overdue); };
function filtered() {
  const f = state.filters, q = f.q.trim().toLowerCase();
  return state.tasks.filter(t => {
    if (f.team && String(t.teamId) !== f.team) return false;
    if (f.status && t.status !== f.status) return false;
    if (f.overdue && !isOverdue(t)) return false;
    if (q) {
      const team = teamById(t.teamId);
      const hay = [t.title, t.description, t.drawing, t.responsibles, t.remarks, team && team.name].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/* =============================== views =============================== */
function progressBar(p, done) { return `<div class="bar ${done ? 'done' : ''}"><i style="width:${Math.max(0, Math.min(100, p))}%"></i></div>`; }
const pill = s => `<span class="pill st-${slug(s)}">${esc(s)}</span>`;

function viewDashboard(b) {
  const all = state.tasks, s = stats(all);
  const attention = all.filter(t => isOverdue(t) || t.status === 'Blocked' || t.status === 'On Hold')
    .sort((a, b) => (a.endDate || '9').localeCompare(b.endDate || '9')).slice(0, 8);
  const counts = STATUSES.map(st => all.filter(t => t.status === st).length);
  let acc = 0;
  const grad = all.length ? counts.map((c, i) => { const from = acc / all.length * 100; acc += c; return `${STATUS_COLOR[STATUSES[i]]} ${from}% ${acc / all.length * 100}%`; }).join(',') : 'var(--line) 0 100%';
  const recent = state.updates.slice().sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp))).slice(0, 8);

  b.innerHTML = `
  <div class="kpis">
    <div class="card kpi"><small>Total tasks</small><div class="n">${s.n}</div></div>
    <div class="card kpi"><small>In progress</small><div class="n">${s.active}</div></div>
    <div class="card kpi ok"><small>Completed</small><div class="n">${s.done}</div></div>
    <div class="card kpi ${s.over ? 'warn' : ''}"><small>Overdue</small><div class="n">${s.over}</div></div>
    <div class="card kpi"><small>Overall progress</small><div class="n">${s.avg}%</div></div>
  </div>
  <div class="dash-grid">
    <div style="display:flex;flex-direction:column;gap:14px;min-width:0">
      <div class="card panel"><h3>Progress by team</h3>
        ${state.teams.map(t => { const ts = stats(tasksOf(t.id)); return `
          <div class="team-prog" data-act="open-team" data-id="${esc(t.id)}">
            <b>${esc(t.name)}</b>${progressBar(ts.avg, ts.n && ts.done === ts.n)}<span class="pct">${ts.avg}%</span></div>`; }).join('') || '<div class="muted">No teams yet.</div>'}
      </div>
      <div class="card panel"><h3>Needs attention</h3>
        <div class="att-list">${attention.length ? attention.map(t => { const tm = teamById(t.teamId); return `
          <div class="att-item" data-act="task-open" data-id="${esc(t.id)}">
            <div style="flex:1;min-width:0"><div class="t">${esc(t.title)}</div>
            <small>${esc(tm ? tm.name : '')} · due ${fmtDate(t.endDate)}${t.remarks ? ' · ' + esc(t.remarks) : ''}</small></div>
            <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">${pill(t.status)}${isOverdue(t) ? `<span class="tag over">${icon('alert')}Overdue</span>` : ''}</div>
          </div>`; }).join('') : '<div class="muted">Nothing overdue or blocked — nice.</div>'}</div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:14px;min-width:0">
      <div class="card panel"><h3>Status breakdown</h3>
        <div class="donut-wrap"><div class="donut" style="background:conic-gradient(${grad})" data-center="${s.n}"></div>
        <div class="legend">${STATUSES.map((st, i) => `<span><i style="background:${STATUS_COLOR[st]}"></i>${st} <b class="mono">${counts[i]}</b></span>`).join('')}</div></div>
      </div>
      <div class="card panel"><h3>Recent updates</h3>
        <div class="att-list">${recent.length ? recent.map(u => { const t = taskById(u.taskId); return `
          <div class="att-item" data-act="task-open" data-id="${esc(u.taskId)}">
            <div class="avatar" style="background:var(--side);color:#fff;flex:none">${esc(initials(u.user))}</div>
            <div style="min-width:0"><div class="t">${esc(t ? t.title : 'Deleted task')}</div>
            <small>${esc(u.user || '')} · ${fmtDT(u.timestamp)} · ${esc(u.status)} ${u.progress}%</small>
            ${u.note ? `<div>${esc(u.note)}</div>` : ''}</div></div>`; }).join('') : '<div class="muted">Updates you post on tasks will show here.</div>'}</div>
      </div>
    </div>
  </div>`;
}

function taskRow(t) {
  const n = (t.attachments || []).length;
  const sub = [t.description, t.drawing ? 'Dwg: ' + t.drawing : '', t.responsibles ? '👷 ' + t.responsibles : ''].filter(Boolean).join(' · ');
  return `<div class="trow" data-act="task-open" data-id="${esc(t.id)}">
    <div style="min-width:0"><div class="ttitle">${esc(t.title)}</div>${sub ? `<div class="tsub">${esc(sub)}</div>` : ''}</div>
    <div class="tmeta">
      <div class="row">${pill(t.status)}${t.priority === 'Urgent' || t.priority === 'High' ? `<span class="tag ${slug(t.priority)}">${esc(t.priority)}</span>` : ''}</div>
      <div class="row">${progressBar(t.progress, t.status === 'Completed')}<span class="pc">${Number(t.progress) || 0}%</span></div>
      <div class="row">
        ${isOverdue(t) ? `<span class="tag over">${icon('alert')}Overdue</span>` : ''}
        ${t.endDate ? `<span class="tag">Due ${fmtDate(t.endDate)}</span>` : ''}
        ${n ? `<span class="tag">${icon('clip')}${n}</span>` : ''}
      </div>
    </div>
    ${t.remarks ? `<div class="tremark">${esc(t.remarks)}</div>` : ''}
  </div>`;
}

function viewTeams(b) {
  const list = filtered();
  const cards = state.teams.filter(t => !state.filters.team || String(t.id) === state.filters.team).map(team => {
    const mine = list.filter(t => String(t.teamId) === String(team.id));
    if (filtersActive() && !mine.length) return '';
    const s = stats(tasksOf(team.id));
    return `<section class="card team" id="team-${esc(team.id)}">
      <div class="team-head">
        <div class="badge">${esc(String(team.name).replace(/^team\s*/i, '').slice(0, 2).toUpperCase())}</div>
        <div class="info"><h2>${esc(team.name)}</h2>
          <div class="roles">Supervisor: <b>${esc(team.supervisor || '—')}</b> · Lead: <b>${esc(team.lead || '—')}</b></div>
          <div class="members">${members(team).map(m => `<span class="member">${esc(m)}</span>`).join('')}</div></div>
        ${isEditor() ? `<button class="icon-btn" data-act="team-edit" data-id="${esc(team.id)}" title="Edit team">${icon('edit')}</button>` : ''}
      </div>
      <div class="team-sum">${progressBar(s.avg, s.n && s.done === s.n)}<span><b>${s.avg}%</b> · ${s.done}/${s.n} done${s.over ? ` · <span style="color:var(--st-blocked)">${s.over} overdue</span>` : ''}</span></div>
      ${mine.length ? mine.map(taskRow).join('') : '<div class="empty" style="padding:22px">No tasks yet.</div>'}
      ${isEditor() ? `<div class="team-foot"><button class="btn sm" data-act="task-new" data-team="${esc(team.id)}">${icon('plus')}Add task</button></div>` : ''}
    </section>`;
  }).join('');
  b.innerHTML = cards ? `<div class="teams">${cards}</div>` : '<div class="card empty"><h3>No matching tasks</h3>Try clearing the filters.</div>';
}

function viewTable(b) {
  const { key, dir } = state.sort;
  const list = filtered().sort((a, c) => {
    const get = t => key === 'team' ? (teamById(t.teamId) || {}).name || '' : (t[key] == null ? '' : t[key]);
    const x = get(a), y = get(c);
    if (typeof x === 'number' || typeof y === 'number') return ((Number(x) || 0) - (Number(y) || 0)) * dir;
    if (!x && y) return 1; if (x && !y) return -1;
    return String(x).localeCompare(String(y), undefined, { numeric: true }) * dir;
  });
  const th = (k, label) => `<th data-act="sort" data-k="${k}" class="${key === k ? 'sorted ' + (dir < 0 ? 'desc' : '') : ''}">${label}</th>`;
  b.innerHTML = `<div class="card tbl-wrap"><table><thead><tr>
    ${th('team', 'Team')}${th('title', 'Task')}${th('responsibles', 'Responsible')}${th('daysRequired', 'Days')}${th('startDate', 'Start')}${th('endDate', 'Due')}${th('actualEnd', 'Actual end')}${th('status', 'Status')}${th('progress', 'Progress')}<th>Files</th></tr></thead>
    <tbody>${list.map(t => { const tm = teamById(t.teamId); return `<tr data-act="task-open" data-id="${esc(t.id)}">
      <td class="nowrap"><b>${esc(tm ? tm.name : '—')}</b></td>
      <td style="min-width:220px"><div class="ttitle">${esc(t.title)}</div><div class="tsub">${esc([t.description, t.remarks].filter(Boolean).join(' · '))}</div></td>
      <td>${esc(t.responsibles || '—')}</td><td class="mono">${t.daysRequired === '' || t.daysRequired == null ? '—' : esc(t.daysRequired)}</td>
      <td class="nowrap">${fmtDate(t.startDate)}</td>
      <td class="nowrap">${fmtDate(t.endDate)} ${isOverdue(t) ? `<span class="tag over">${icon('alert')}</span>` : ''}</td>
      <td class="nowrap">${fmtDate(t.actualEnd)}</td><td>${pill(t.status)}</td>
      <td><div style="display:flex;gap:8px;align-items:center">${progressBar(t.progress, t.status === 'Completed')}<span class="mono">${Number(t.progress) || 0}%</span></div></td>
      <td>${(t.attachments || []).length ? `<span class="tag">${icon('clip')}${t.attachments.length}</span>` : ''}</td></tr>`; }).join('')
      || '<tr><td colspan="10"><div class="empty">No matching tasks.</div></td></tr>'}</tbody></table></div>`;
}

function viewTimeline(b) {
  const list = filtered().filter(t => t.startDate || t.endDate);
  if (!list.length) { b.innerHTML = '<div class="card empty"><h3>No dated tasks</h3>Add start and due dates to see tasks here.</div>'; return; }
  const D = 864e5, toD = iso => new Date(iso + 'T00:00:00').getTime();
  const today = toD(todayISO());
  let min = today, max = today;
  list.forEach(t => { min = Math.min(min, toD(t.startDate || t.endDate)); max = Math.max(max, toD(t.endDate || t.startDate)); });
  min -= D; max += 2 * D;
  const N = Math.round((max - min) / D) + 1;
  const days = Array.from({ length: N }, (_, i) => new Date(min + i * D));
  const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const todayPct = ((today - min) / D + 0.5) / N * 100;
  const groups = state.teams.map(tm => ({ tm, ts: list.filter(t => String(t.teamId) === String(tm.id)) })).filter(g => g.ts.length);
  b.innerHTML = `<div class="card tl-scroll"><div class="tl" style="--n:${N}">
    <div class="tl-row tl-head"><div class="tl-label">Task</div><div class="tl-track">
      ${days.map((d, i) => `<div class="tl-day">${d.getDate() === 1 || i === 0 ? `<em>${MN[d.getMonth()]}</em>` : '<em>&nbsp;</em>'}${d.getDate()}</div>`).join('')}</div></div>
    ${groups.map(g => `<div class="tl-group">${esc(g.tm.name)} · ${esc(g.tm.lead || '')}</div>` + g.ts.map(t => {
      const s = toD(t.startDate || t.endDate), e = toD(t.endDate || t.startDate);
      const left = (s - min) / D / N * 100, width = ((e - s) / D + 1) / N * 100;
      return `<div class="tl-row"><div class="tl-label"><b data-act="task-open" data-id="${esc(t.id)}">${esc(t.title)}</b><small>${esc(t.responsibles || '')} · ${Number(t.progress) || 0}%</small></div>
        <div class="tl-track"><div class="tl-today" style="left:${todayPct}%"></div>
        <div class="tl-bar st-${slug(t.status)} ${isOverdue(t) ? 'over' : ''}" style="left:${left}%;width:${width}%" data-act="task-open" data-id="${esc(t.id)}" title="${esc(t.title)} · ${fmtDate(t.startDate)} → ${fmtDate(t.endDate)}"><i style="width:${Number(t.progress) || 0}%"></i></div></div></div>`;
    }).join('')).join('')}
  </div></div>
  <p class="muted" style="margin-top:10px">Orange line = today. Bar fill = progress. Red glow = overdue.</p>`;
}

/* =============================== attachments =============================== */
function attGrid(list, editable, scope) {
  if (!list.length) return `<div class="noatt">No files attached yet.</div>`;
  return `<div class="atts">${list.map((a, i) => {
    const img = /^image\//.test(a.mime || '');
    return `<div class="att" data-act="att-open" data-scope="${scope}" data-i="${i}" title="${esc(a.name)}">
      <div class="th">${img ? `<img loading="lazy" src="${esc(a.thumb || a.url)}" alt="">` : icon('file')}</div>
      <div class="nm">${esc(a.name)}</div>
      ${editable ? `<button class="rm" data-act="att-rm" data-scope="${scope}" data-i="${i}" title="Remove">${icon('x')}</button>` : ''}</div>`;
  }).join('')}</div>`;
}
const uploadButtons = scope => `<div class="upl">
  <button class="btn sm" type="button" data-act="pick-file" data-scope="${scope}">${icon('clip')}Attach file / drawing</button>
  <button class="btn sm" type="button" data-act="pick-cam" data-scope="${scope}">${icon('camera')}Take photo</button>
  <input type="file" id="in-${scope}-file" data-scope="${scope}" multiple hidden accept="image/*,.pdf,.dwg,.dxf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip">
  <input type="file" id="in-${scope}-cam" data-scope="${scope}" hidden accept="image/*" capture="environment"></div>`;

const scopeList = scope => scope === 'upd' ? updDraft.attachments : draft.task.attachments;
function refreshAtts(scope) {
  const el = $(scope === 'upd' ? '#upd-atts' : '#task-atts'); if (!el) return;
  el.innerHTML = attGrid(scopeList(scope), isEditor(), scope);
}

function readAsBase64(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(file); });
}
async function shrinkImage(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 400 * 1024) return file;
  try {
    const url = URL.createObjectURL(file);
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const max = DEMO ? 1000 : 1800, k = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.82));
    return blob && blob.size < file.size ? new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file;
  } catch (e) { return file; }
}

async function handleFiles(input) {
  const scope = input.dataset.scope, files = Array.from(input.files); input.value = '';
  for (let f of files) {
    if (f.size > MAX_FILE) { toast(`${f.name} is larger than 12 MB`, 'err'); continue; }
    toast('Uploading ' + f.name + '…');
    try {
      f = await shrinkImage(f);
      const base64 = await readAsBase64(f);
      const res = await request('uploadFile', { name: f.name, mime: f.type || 'application/octet-stream', base64, taskId: draft ? draft.task.id : '' });
      scopeList(scope).push(res.file);
      refreshAtts(scope);
      toast('Attached ' + f.name, 'ok');
    } catch (e) { toast(e.message, 'err'); }
  }
}

function openAttachment(a) {
  if (/^image\//.test(a.mime || '')) {
    $('#lightbox-root').innerHTML = `<div class="lb" data-act="lb-close"><img src="${esc(a.thumb || a.url)}" alt="${esc(a.name)}"><a href="${esc(a.url)}" target="_blank" rel="noopener">Open original · ${esc(a.name)}</a></div>`;
  } else window.open(a.url, '_blank', 'noopener');
}

/* =============================== task drawer =============================== */
function blankTask(teamId) {
  return { id: uid('T-'), teamId: teamId || (state.teams[0] && state.teams[0].id) || '', title: '', description: '', drawing: '', responsibles: '',
    daysRequired: '', startDate: '', endDate: '', actualEnd: '', status: 'Not Started', progress: 0, priority: 'Normal', remarks: '', attachments: [] };
}
function openTask(id, teamId) {
  const ex = id && taskById(id);
  draft = { isNew: !ex, task: ex ? clone(ex) : blankTask(teamId) };
  updDraft = { attachments: [] };
  $('#drawer-root').innerHTML = drawerHTML();
  const t = $('#f-title'); if (t && !ex && isEditor()) t.focus();
}
function closeDrawer() { $('#drawer-root').innerHTML = ''; draft = null; updDraft = null; }

function respChips(teamId, current) {
  const team = teamById(teamId);
  const cur = String(current || '').split(',').map(s => s.trim().toLowerCase());
  return ['All'].concat(members(team)).map(m => `<span class="chip ${cur.includes(m.toLowerCase()) ? 'on' : ''}" data-act="chip" data-name="${esc(m)}">${esc(m)}</span>`).join('');
}
const opt = (list, v) => list.map(x => `<option ${x === v ? 'selected' : ''}>${esc(x)}</option>`).join('');

function activityList(taskId) {
  const list = state.updates.filter(u => String(u.taskId) === String(taskId)).sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
  if (!list.length) return '<div class="muted">No updates posted yet.</div>';
  return list.map((u, k) => `<div class="act"><div class="avatar">${esc(initials(u.user))}</div><div style="min-width:0;flex:1">
    <div class="hd"><b>${esc(u.user || 'Unknown')}</b><span class="muted">${fmtDT(u.timestamp)}</span>${pill(u.status)}<span class="tag">${Number(u.progress) || 0}%</span></div>
    ${u.note ? `<p>${esc(u.note)}</p>` : ''}
    ${(u.attachments || []).length ? `<div class="atts" style="margin-top:8px">${u.attachments.map((a, i) => `<div class="att" data-act="att-open" data-scope="log" data-uid="${esc(u.id)}" data-i="${i}">
      <div class="th">${/^image\//.test(a.mime || '') ? `<img loading="lazy" src="${esc(a.thumb || a.url)}" alt="">` : icon('file')}</div><div class="nm">${esc(a.name)}</div></div>`).join('')}</div>` : ''}
    </div></div>`).join('');
}

function drawerHTML() {
  const t = draft.task, ro = !isEditor(), dis = ro ? 'disabled' : '';
  return `<div class="backdrop" data-act="close-drawer"></div>
  <aside class="drawer" role="dialog" aria-label="Task details">
    <header class="dr-head"><div><small>${draft.isNew ? 'NEW TASK' : esc(t.id)}</small><h2 id="dr-title">${esc(t.title || 'Untitled task')}</h2></div>
      <button class="icon-btn" data-act="close-drawer" aria-label="Close">${icon('x')}</button></header>
    <div class="dr-body">
      <div class="sec"><h3>Details</h3><div class="grid2">
        <label class="fld span2">Task title *<input id="f-title" value="${esc(t.title)}" ${dis}></label>
        <label class="fld">Team<select id="f-team" ${dis}>${state.teams.map(x => `<option value="${esc(x.id)}" ${String(x.id) === String(t.teamId) ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
        <label class="fld">Priority<select id="f-priority" ${dis}>${opt(PRIORITIES, t.priority)}</select></label>
        <label class="fld span2">Task description<textarea id="f-desc" rows="2" ${dis}>${esc(t.description)}</textarea></label>
        <label class="fld">Drawing / reference no.<input id="f-drawing" value="${esc(t.drawing)}" ${dis}></label>
        <label class="fld">Responsible<input id="f-resp" value="${esc(t.responsibles)}" placeholder="All, or names" ${dis}></label>
        ${ro ? '' : `<div class="chips span2" id="resp-chips">${respChips(t.teamId, t.responsibles)}</div>`}
        <label class="fld">Days required<input id="f-days" type="number" min="0" step="0.5" value="${esc(t.daysRequired)}" ${dis}></label>
        <label class="fld">Status<select id="f-status" ${dis}>${opt(STATUSES, t.status)}</select></label>
        <label class="fld">Start date<input id="f-start" type="date" value="${esc(t.startDate)}" ${dis}></label>
        <label class="fld">Due date<input id="f-end" type="date" value="${esc(t.endDate)}" ${dis}></label>
        <label class="fld">Actual end date<input id="f-actual" type="date" value="${esc(t.actualEnd)}" ${dis}></label>
        <label class="fld">Progress <output id="f-prog-out">${Number(t.progress) || 0}%</output><input id="f-progress" type="range" min="0" max="100" step="5" value="${Number(t.progress) || 0}" ${dis}></label>
        <label class="fld span2">Remarks<textarea id="f-remarks" rows="2" ${dis}>${esc(t.remarks)}</textarea></label>
      </div></div>
      <div class="sec"><h3>Drawings &amp; attachments</h3><div id="task-atts">${attGrid(t.attachments, isEditor(), 'task')}</div>${ro ? '' : uploadButtons('task')}</div>
      ${draft.isNew ? '' : `<div class="sec"><h3>Progress updates</h3>
        ${ro ? '' : `<div class="postbox">
          <textarea id="u-note" rows="2" placeholder="What was done today? Any problem or material needed?"></textarea>
          <div class="grid2"><label class="fld">Status<select id="u-status">${opt(STATUSES, t.status)}</select></label>
            <label class="fld">Progress <output id="u-prog-out">${Number(t.progress) || 0}%</output><input id="u-progress" type="range" min="0" max="100" step="5" value="${Number(t.progress) || 0}"></label></div>
          <div id="upd-atts"></div>${uploadButtons('upd')}
          <div><button class="btn primary" data-act="post-update">Post update</button></div></div>`}
        <div id="act-list">${activityList(t.id)}</div></div>`}
    </div>
    ${ro ? `<footer class="dr-foot"><span class="sp"></span><button class="btn" data-act="close-drawer">Close</button></footer>` :
    `<footer class="dr-foot">${draft.isNew ? '' : `<button class="btn danger" data-act="task-delete">${icon('trash')}Delete</button>`}<span class="sp"></span>
      <button class="btn" data-act="close-drawer">Cancel</button><button class="btn primary" data-act="task-save">Save task</button></footer>`}
  </aside>`;
}

function readTaskForm() {
  const t = draft.task;
  return Object.assign({}, t, {
    title: $('#f-title').value.trim(), teamId: $('#f-team').value, priority: $('#f-priority').value,
    description: $('#f-desc').value.trim(), drawing: $('#f-drawing').value.trim(), responsibles: $('#f-resp').value.trim(),
    daysRequired: $('#f-days').value === '' ? '' : Number($('#f-days').value), status: $('#f-status').value,
    startDate: $('#f-start').value, endDate: $('#f-end').value, actualEnd: $('#f-actual').value,
    progress: Number($('#f-progress').value) || 0, remarks: $('#f-remarks').value.trim()
  });
}

async function saveTask(btn) {
  const t = readTaskForm();
  if (!t.title) { toast('Please enter a task title', 'err'); $('#f-title').focus(); return; }
  if (!t.teamId) { toast('Create a team first', 'err'); return; }
  if (t.startDate && t.endDate && t.endDate < t.startDate) { toast('Due date is before the start date', 'err'); return; }
  btn.disabled = true;
  try {
    const res = await request('saveTask', t);
    const i = state.tasks.findIndex(x => x.id === res.task.id);
    if (i >= 0) state.tasks[i] = res.task; else state.tasks.push(res.task);
    closeDrawer(); renderView(true); toast('Task saved', 'ok');
  } catch (e) { toast(e.message, 'err'); btn.disabled = false; }
}

async function deleteTask() {
  if (!confirm('Delete this task and its update log? This cannot be undone.')) return;
  try {
    await request('deleteTask', { id: draft.task.id });
    state.tasks = state.tasks.filter(t => t.id !== draft.task.id);
    state.updates = state.updates.filter(u => u.taskId !== draft.task.id);
    closeDrawer(); renderView(true); toast('Task deleted');
  } catch (e) { toast(e.message, 'err'); }
}

async function postUpdate(btn) {
  const note = $('#u-note').value.trim(), status = $('#u-status').value, progress = Number($('#u-progress').value);
  const t = draft.task;
  if (!note && !updDraft.attachments.length && status === t.status && progress === (Number(t.progress) || 0)) { toast('Write a note, attach a photo, or change progress', 'err'); return; }
  btn.disabled = true;
  try {
    const res = await request('addUpdate', { taskId: t.id, note, status, progress, attachments: updDraft.attachments });
    state.updates.push(res.update);
    const i = state.tasks.findIndex(x => x.id === t.id); if (i >= 0) state.tasks[i] = res.task;
    draft.task = Object.assign({}, draft.task, { status: res.task.status, progress: res.task.progress, actualEnd: res.task.actualEnd });
    $('#f-status').value = res.task.status; $('#f-progress').value = res.task.progress; $('#f-prog-out').textContent = res.task.progress + '%';
    $('#f-actual').value = res.task.actualEnd || '';
    $('#u-note').value = ''; updDraft.attachments = []; refreshAtts('upd');
    $('#act-list').innerHTML = activityList(t.id);
    renderView(true); toast('Update posted', 'ok');
  } catch (e) { toast(e.message, 'err'); }
  btn.disabled = false;
}

/* =============================== team modal =============================== */
function openModal(html, wide) {
  $('#modal-root').innerHTML = `<div class="modal-wrap" data-act="modal-bg"><div class="modal ${wide ? 'wide' : ''}" role="dialog">${html}</div></div>`;
}
function closeModal() { $('#modal-root').innerHTML = ''; }

function openTeam(id) {
  const t = id ? teamById(id) : { id: '', name: '', supervisor: '', lead: '', members: '', order: state.teams.length + 1 };
  openModal(`<header><h2>${id ? 'Edit team' : 'Add team'}</h2><button class="icon-btn" data-act="modal-close">${icon('x')}</button></header>
    <div class="mb" data-team-id="${esc(t.id)}" data-order="${esc(t.order)}">
      <label class="fld">Team name *<input id="m-name" value="${esc(t.name)}" placeholder="Team G"></label>
      <div class="grid2"><label class="fld">Supervisor<input id="m-sup" value="${esc(t.supervisor)}"></label>
      <label class="fld">Team lead<input id="m-lead" value="${esc(t.lead)}"></label></div>
      <label class="fld">Team members (one per line)<textarea id="m-mem" rows="6">${esc(t.members)}</textarea></label></div>
    <footer>${id ? `<button class="btn danger" data-act="team-delete" data-id="${esc(id)}" style="margin-right:auto">${icon('trash')}Delete</button>` : ''}
      <button class="btn" data-act="modal-close">Cancel</button><button class="btn primary" data-act="team-save">Save team</button></footer>`);
  $('#m-name').focus();
}
async function saveTeam(btn) {
  const mb = $('#modal-root .mb'), name = $('#m-name').value.trim();
  if (!name) { toast('Team name is required', 'err'); return; }
  const team = { id: mb.dataset.teamId || uid('G'), name, supervisor: $('#m-sup').value.trim(), lead: $('#m-lead').value.trim(),
    members: $('#m-mem').value.split(/\r?\n/).map(s => s.trim()).filter(Boolean).join('\n'), order: Number(mb.dataset.order) || state.teams.length + 1 };
  btn.disabled = true;
  try {
    const res = await request('saveTeam', team);
    const i = state.teams.findIndex(x => String(x.id) === String(team.id));
    if (i >= 0) state.teams[i] = res.team; else state.teams.push(res.team);
    state.teams.sort((a, b) => (a.order || 0) - (b.order || 0));
    closeModal(); renderView(true); toast('Team saved', 'ok');
  } catch (e) { toast(e.message, 'err'); btn.disabled = false; }
}
async function deleteTeam(id) {
  if (!confirm('Delete this team?')) return;
  try { await request('deleteTeam', { id }); state.teams = state.teams.filter(t => String(t.id) !== String(id)); closeModal(); renderView(true); toast('Team deleted'); }
  catch (e) { toast(e.message, 'err'); }
}

/* =============================== report / export / seed =============================== */
function buildReport() {
  const d = new Date(), s = stats(state.tasks);
  const L = [`*${CFG.DEPARTMENT} — Daily Report*`, `Date: ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`,
    `Overall: ${s.avg}% · ${s.done}/${s.n} tasks done${s.over ? ' · ' + s.over + ' overdue' : ''}`, ''];
  state.teams.forEach(tm => {
    const ts = tasksOf(tm.id); if (!ts.length) return;
    L.push(`*${tm.name}* (Lead: ${tm.lead || '—'})`);
    ts.forEach((t, i) => {
      const bits = [`${t.status} ${Number(t.progress) || 0}%`];
      if (t.endDate) bits.push('due ' + fmtDate(t.endDate) + (isOverdue(t) ? ' ⚠ OVERDUE' : ''));
      if (t.remarks) bits.push(t.remarks);
      L.push(`${i + 1}. ${t.title} — ${bits.join(' | ')}`);
    });
    L.push('');
  });
  return L.join('\n').trim();
}
function openReport() {
  openModal(`<header><h2>Daily report</h2><button class="icon-btn" data-act="modal-close">${icon('x')}</button></header>
    <div class="mb"><textarea id="rep" class="report" rows="16" readonly>${esc(buildReport())}</textarea></div>
    <footer><button class="btn" data-act="modal-close">Close</button><button class="btn primary" data-act="copy-report">${icon('copy')}Copy for WhatsApp</button></footer>`, true);
}

function exportCSV() {
  const cols = ['Team', 'Task', 'Description', 'Drawing', 'Responsible', 'Days', 'Start', 'Due', 'Actual end', 'Status', 'Progress %', 'Priority', 'Remarks', 'Attachments'];
  const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const rows = filtered().map(t => { const tm = teamById(t.teamId); return [tm ? tm.name : '', t.title, t.description, t.drawing, t.responsibles, t.daysRequired,
    fmtDate(t.startDate), fmtDate(t.endDate), fmtDate(t.actualEnd), t.status, t.progress, t.priority, t.remarks, (t.attachments || []).map(a => a.url).join(' ')].map(q).join(','); });
  const blob = new Blob(['﻿' + [cols.map(q).join(',')].concat(rows).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `maintenance-tasks-${todayISO()}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

async function seedData() {
  if (!confirm('Load the starter teams and tasks from your task list into the sheet?')) return;
  try {
    await request('bulkImport', { teams: window.SEED.teams, tasks: window.SEED.tasks });
    await load(true); renderView(); toast('Starter data loaded', 'ok');
  } catch (e) { toast(e.message, 'err'); }
}

/* =============================== events =============================== */
function applyTaskAutoRules(src) {
  const v = id => $(id);
  if (src === 'progress') {
    const p = Number(v('#f-progress').value); v('#f-prog-out').textContent = p + '%';
    if (p === 100 && v('#f-status').value !== 'Completed') { v('#f-status').value = 'Completed'; if (!v('#f-actual').value) v('#f-actual').value = todayISO(); }
    else if (p > 0 && p < 100 && v('#f-status').value === 'Not Started') v('#f-status').value = 'In Progress';
  } else if (src === 'status') {
    const s = v('#f-status').value;
    if (s === 'Completed') { v('#f-progress').value = 100; v('#f-prog-out').textContent = '100%'; if (!v('#f-actual').value) v('#f-actual').value = todayISO(); }
    else if (s === 'Not Started') { v('#f-progress').value = 0; v('#f-prog-out').textContent = '0%'; }
  } else if (src === 'days' || src === 'start') {
    const days = Number(v('#f-days').value), st = v('#f-start').value;
    if (days > 0 && st) v('#f-end').value = addDays(st, Math.max(0, Math.ceil(days) - 1));
  }
}

document.addEventListener('input', e => {
  const id = e.target.id;
  if (id === 'flt-q') { state.filters.q = e.target.value; renderBody(); }
  else if (id === 'f-progress') applyTaskAutoRules('progress');
  else if (id === 'f-title') $('#dr-title').textContent = e.target.value || 'Untitled task';
  else if (id === 'u-progress') $('#u-prog-out').textContent = e.target.value + '%';
  else if (id === 'f-days') applyTaskAutoRules('days');
});

document.addEventListener('change', e => {
  const id = e.target.id;
  if (id === 'flt-team') { state.filters.team = e.target.value; renderBody(); }
  else if (id === 'flt-status') { state.filters.status = e.target.value; renderBody(); }
  else if (id === 'flt-over') { state.filters.overdue = e.target.checked; renderBody(); }
  else if (id === 'f-status') applyTaskAutoRules('status');
  else if (id === 'f-start') applyTaskAutoRules('start');
  else if (id === 'f-team') { const c = $('#resp-chips'); if (c) c.innerHTML = respChips(e.target.value, $('#f-resp').value); }
  else if (e.target.type === 'file' && e.target.dataset.scope) handleFiles(e.target);
});

document.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const act = el.dataset.act, d = el.dataset;
  switch (act) {
    case 'nav': setView(d.v); break;
    case 'theme': { const n = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', n); try { localStorage.setItem('mmt_theme', n); } catch (x) {} break; }
    case 'logout': logout(); break;
    case 'rename': { const n = prompt('Your name (shown on updates you post):', auth.user); if (n && n.trim()) { auth.user = n.trim(); try { const s = JSON.parse(localStorage.getItem('mmt_auth') || '{}'); s.user = auth.user; localStorage.setItem('mmt_auth', JSON.stringify(s)); } catch (x) {} refreshWho(); } break; }
    case 'refresh': el.disabled = true; if (await load(false)) { renderView(true); toast('Reloaded', 'ok'); } el.disabled = false; break;
    case 'clear-filters': state.filters = { q: '', team: '', status: '', overdue: false }; renderView(); break;
    case 'sort': state.sort = { key: d.k, dir: state.sort.key === d.k ? -state.sort.dir : 1 }; renderBody(); break;
    case 'open-team': state.filters.team = ''; setView('teams'); setTimeout(() => { const t = document.getElementById('team-' + d.id); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30); break;
    case 'task-open': openTask(d.id); break;
    case 'task-new': openTask(null, d.team); break;
    case 'close-drawer': closeDrawer(); break;
    case 'task-save': saveTask(el); break;
    case 'task-delete': deleteTask(); break;
    case 'post-update': postUpdate(el); break;
    case 'chip': {
      const inp = $('#f-resp'); let list = inp.value.split(',').map(s => s.trim()).filter(Boolean);
      const i = list.findIndex(x => x.toLowerCase() === d.name.toLowerCase());
      if (i >= 0) list.splice(i, 1); else list.push(d.name);
      inp.value = list.join(', '); $('#resp-chips').innerHTML = respChips($('#f-team').value, inp.value); break;
    }
    case 'pick-file': $('#in-' + d.scope + '-file').click(); break;
    case 'pick-cam': $('#in-' + d.scope + '-cam').click(); break;
    case 'att-rm': e.stopPropagation(); scopeList(d.scope).splice(Number(d.i), 1); refreshAtts(d.scope); break;
    case 'att-open': {
      let a;
      if (d.scope === 'log') { const u = state.updates.find(x => x.id === d.uid); a = u && u.attachments[Number(d.i)]; }
      else a = scopeList(d.scope)[Number(d.i)];
      if (a) openAttachment(a); break;
    }
    case 'lb-close': $('#lightbox-root').innerHTML = ''; break;
    case 'team-new': openTeam(); break;
    case 'team-edit': openTeam(d.id); break;
    case 'team-save': saveTeam(el); break;
    case 'team-delete': deleteTeam(d.id); break;
    case 'modal-close': closeModal(); break;
    case 'modal-bg': if (e.target === el) closeModal(); break;
    case 'report': openReport(); break;
    case 'copy-report': { const ta = $('#rep'); try { await navigator.clipboard.writeText(ta.value); } catch (x) { ta.select(); document.execCommand('copy'); } toast('Report copied', 'ok'); break; }
    case 'csv': exportCSV(); break;
    case 'seed': seedData(); break;
  }
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if ($('#lightbox-root').children.length) $('#lightbox-root').innerHTML = '';
  else if ($('#modal-root').children.length) closeModal();
  else if ($('#drawer-root').children.length) closeDrawer();
});

window.addEventListener('online', () => load(true).then(ok => ok && renderView(true)));
boot();
})();
