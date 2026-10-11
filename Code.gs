/**
 * Mechanical Maintenance Task Tracker — Google Apps Script backend
 * ----------------------------------------------------------------
 * Container-bound script: open your Google Sheet → Extensions → Apps Script,
 * paste this file, run setup() once, then Deploy → New deployment → Web app.
 *
 * Sheet tabs created automatically: Teams, Tasks, Updates
 * Attachments are uploaded to a Drive folder "Maintenance Task Attachments".
 *
 * Access control: two PINs stored in Script properties
 *   EDIT_PIN  – full access (add / edit / delete / upload)
 *   VIEW_PIN  – optional, read-only access for supervisors/management
 */

const SCHEMA = {
  Teams: ['id', 'name', 'supervisor', 'lead', 'members', 'order'],
  Tasks: ['id', 'teamId', 'title', 'description', 'drawing', 'responsibles', 'daysRequired',
          'startDate', 'endDate', 'actualEnd', 'status', 'progress', 'priority', 'remarks',
          'attachments', 'createdAt', 'updatedAt', 'updatedBy'],
  Updates: ['id', 'taskId', 'timestamp', 'user', 'note', 'status', 'progress', 'attachments']
};
const NUMERIC = { daysRequired: 1, progress: 1, order: 1 };
const JSON_COLS = { attachments: 1 };
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

/* ---------- one-time setup ---------- */
function setup() {
  Object.keys(SCHEMA).forEach(sheet_);
  const p = PropertiesService.getScriptProperties();
  let msg = 'Sheets are ready.';
  if (!p.getProperty('EDIT_PIN')) {
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    p.setProperty('EDIT_PIN', pin);
    msg += ' EDIT_PIN was set to ' + pin + ' (change it in Project Settings → Script properties).';
  }
  getFolder_();
  Logger.log(msg);
  try { SpreadsheetApp.getActiveSpreadsheet().toast(msg, 'Setup complete', 30); } catch (e) {}
}

/* ---------- web entry points ---------- */
function doGet(e) {
  try {
    const q = (e && e.parameter) || {};
    if (q.action === 'ping') return json_({ ok: true, app: 'maintenance-tracker' });
    const role = role_(q.pin);
    if (!role) return json_({ ok: false, error: 'auth' });
    return json_({
      ok: true,
      role: role,
      teams: readAll_('Teams'),
      tasks: readAll_('Tasks'),
      updates: readAll_('Updates').slice(-600)
    });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);
    const req = JSON.parse(e.postData.contents);
    const role = role_(req.pin);
    if (!role) return json_({ ok: false, error: 'auth' });
    if (role !== 'editor') return json_({ ok: false, error: 'This PIN is read-only.' });
    const d = req.data || {};
    const user = String(req.user || '').slice(0, 60);
    switch (req.action) {
      case 'saveTask':    return json_(saveTask_(d, user));
      case 'deleteTask':  return json_(deleteTask_(d.id));
      case 'saveTeam':    return json_(saveTeam_(d));
      case 'deleteTeam':  return json_(deleteTeam_(d.id));
      case 'addUpdate':   return json_(addUpdate_(d, user));
      case 'uploadFile':  return json_(uploadFile_(d));
      case 'bulkImport':  return json_(bulkImport_(d, user));
      default: return json_({ ok: false, error: 'Unknown action' });
    }
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

/* ---------- actions ---------- */
function saveTask_(t, user) {
  if (!t.id) throw new Error('Task id missing');
  if (!String(t.title || '').trim()) throw new Error('Task title is required');
  const existing = findById_('Tasks', t.id);
  const task = normTask_(t, existing, user);
  upsert_('Tasks', task);
  return { ok: true, task: outTask_(task) };
}

function deleteTask_(id) {
  deleteRow_('Tasks', id);
  // remove its update log too
  const sh = sheet_('Updates');
  const last = sh.getLastRow();
  if (last > 1) {
    const ids = sh.getRange(2, 2, last - 1, 1).getValues();
    for (let i = ids.length - 1; i >= 0; i--) if (String(ids[i][0]) === String(id)) sh.deleteRow(i + 2);
  }
  return { ok: true };
}

function saveTeam_(t) {
  if (!t.id) throw new Error('Team id missing');
  if (!String(t.name || '').trim()) throw new Error('Team name is required');
  const team = { id: String(t.id), name: t.name, supervisor: t.supervisor || '', lead: t.lead || '',
                 members: t.members || '', order: Number(t.order) || 0 };
  upsert_('Teams', team);
  return { ok: true, team: team };
}

function deleteTeam_(id) {
  const has = readAll_('Tasks').some(function (t) { return String(t.teamId) === String(id); });
  if (has) throw new Error('This team still has tasks. Move or delete them first.');
  deleteRow_('Teams', id);
  return { ok: true };
}

function addUpdate_(d, user) {
  const task = findById_('Tasks', d.taskId);
  if (!task) throw new Error('Task not found');
  const now = new Date().toISOString();
  const status = d.status || task.status;
  const progress = Math.max(0, Math.min(100, Number(d.progress)));
  const upd = {
    id: 'U' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    taskId: String(d.taskId), timestamp: now, user: user, note: d.note || '',
    status: status, progress: isNaN(progress) ? task.progress : progress,
    attachments: JSON.stringify(Array.isArray(d.attachments) ? d.attachments : [])
  };
  upsert_('Updates', upd);
  const merged = normTask_({ status: upd.status, progress: upd.progress }, task, user);
  upsert_('Tasks', merged);
  upd.attachments = Array.isArray(d.attachments) ? d.attachments : [];
  return { ok: true, update: upd, task: outTask_(merged) };
}

function uploadFile_(d) {
  if (!d.base64 || !d.name) throw new Error('No file data');
  const bytes = Utilities.base64Decode(d.base64);
  if (bytes.length > MAX_UPLOAD_BYTES) throw new Error('File is larger than 12 MB');
  const safe = String(d.name).replace(/[\\/:*?"<>|]+/g, '_');
  const blob = Utilities.newBlob(bytes, d.mime || 'application/octet-stream',
    (d.taskId ? d.taskId + '_' : '') + Date.now().toString(36) + '_' + safe);
  const file = getFolder_().createFile(blob);
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
  const id = file.getId();
  return { ok: true, file: {
    id: id, name: safe, mime: d.mime || '', size: bytes.length,
    url: 'https://drive.google.com/file/d/' + id + '/view',
    thumb: 'https://drive.google.com/thumbnail?id=' + id + '&sz=w1000'
  } };
}

function bulkImport_(d, user) {
  const now = new Date().toISOString();
  const teams = (d.teams || []).map(function (t) {
    return SCHEMA.Teams.map(function (c) { return t[c] === undefined ? '' : t[c]; });
  });
  const tasks = (d.tasks || []).map(function (t) {
    const o = normTask_(t, null, user);
    o.createdAt = now;
    return SCHEMA.Tasks.map(function (c) { return o[c] === undefined ? '' : o[c]; });
  });
  appendRows_('Teams', teams);
  appendRows_('Tasks', tasks);
  return { ok: true, teams: teams.length, tasks: tasks.length };
}

/* ---------- helpers ---------- */
function role_(pin) {
  const p = PropertiesService.getScriptProperties();
  const edit = String(p.getProperty('EDIT_PIN') || '');
  const view = String(p.getProperty('VIEW_PIN') || '');
  pin = String(pin || '');
  if (edit && pin === edit) return 'editor';
  if (view && pin === view) return 'viewer';
  return null;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function today_() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'); }

function getFolder_() {
  const p = PropertiesService.getScriptProperties();
  const id = p.getProperty('FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const folder = DriveApp.createFolder('Maintenance Task Attachments');
  p.setProperty('FOLDER_ID', folder.getId());
  return folder;
}

function sheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  const cols = SCHEMA[name];
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, sh.getMaxRows(), cols.length).setNumberFormat('@'); // plain text → dates stay as typed
    sh.getRange(1, 1, 1, cols.length).setValues([cols])
      .setFontWeight('bold').setBackground('#1f2937').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  } else if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, cols.length).setValues([cols])
      .setFontWeight('bold').setBackground('#1f2937').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  return sh;
}

function readAll_(name) {
  const sh = sheet_(name), cols = SCHEMA[name], n = sh.getLastRow() - 1;
  if (n < 1) return [];
  const tz = Session.getScriptTimeZone();
  const vals = sh.getRange(2, 1, n, cols.length).getValues();
  const rows = vals.filter(function (r) { return r[0] !== ''; }).map(function (r) {
    const o = {};
    cols.forEach(function (c, i) {
      let v = r[i];
      if (v instanceof Date) {
        v = Utilities.formatDate(v, tz, /At$|timestamp/.test(c) ? "yyyy-MM-dd'T'HH:mm:ssXXX" : 'yyyy-MM-dd');
      }
      if (NUMERIC[c]) v = (v === '' ? '' : Number(v));
      if (JSON_COLS[c]) { try { v = v ? JSON.parse(v) : []; } catch (e) { v = []; } }
      o[c] = v;
    });
    return o;
  });
  if (name === 'Teams') rows.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  return rows;
}

function findById_(name, id) {
  const all = readAll_(name);
  for (let i = 0; i < all.length; i++) if (String(all[i].id) === String(id)) return all[i];
  return null;
}

function upsert_(name, obj) {
  const sh = sheet_(name), cols = SCHEMA[name];
  const row = cols.map(function (c) { return obj[c] === undefined || obj[c] === null ? '' : obj[c]; });
  const last = sh.getLastRow();
  if (last > 1) {
    const ids = sh.getRange(2, 1, last - 1, 1).getValues().map(function (r) { return String(r[0]); });
    const i = ids.indexOf(String(obj.id));
    if (i >= 0) { sh.getRange(i + 2, 1, 1, cols.length).setValues([row]); return; }
  }
  sh.getRange(last + 1, 1, 1, cols.length).setValues([row]);
}

function appendRows_(name, rows) {
  if (!rows.length) return;
  const sh = sheet_(name), cols = SCHEMA[name];
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, cols.length).setValues(rows);
}

function deleteRow_(name, id) {
  const sh = sheet_(name), last = sh.getLastRow();
  if (last < 2) return;
  const ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) { sh.deleteRow(i + 2); return; }
  }
}

function normTask_(t, existing, user) {
  const now = new Date().toISOString();
  const o = Object.assign({}, existing || {}, t);
  o.id = String(o.id);
  o.daysRequired = (o.daysRequired === '' || o.daysRequired == null) ? '' : Number(o.daysRequired);
  o.progress = Math.max(0, Math.min(100, Number(o.progress) || 0));
  if (o.status === 'Completed') {
    o.progress = 100;
    if (!o.actualEnd) o.actualEnd = today_();
  }
  if (!o.createdAt) o.createdAt = now;
  o.updatedAt = now;
  o.updatedBy = user || o.updatedBy || '';
  const att = Array.isArray(t.attachments) ? t.attachments : (existing && existing.attachments) || [];
  o.attachments = JSON.stringify(att);
  return o;
}

function outTask_(o) {
  const c = Object.assign({}, o);
  if (typeof c.attachments === 'string') { try { c.attachments = JSON.parse(c.attachments); } catch (e) { c.attachments = []; } }
  return c;
}
