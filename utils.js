'use strict';

/* ═══════════════════════════════════════
   THEME
   Reads/writes localStorage key 'darts-theme'.
   Call initTheme() on every page load.
   The toggle button is only on the hub; all
   other pages just call initTheme() to apply.
═══════════════════════════════════════ */
function initTheme() {
  let bright = false;
  try { bright = localStorage.getItem('darts-theme') === 'bright'; } catch(e) {}
  document.body.classList.toggle('theme-bright', bright);
  return bright;
}

function toggleTheme() {
  const bright = !document.body.classList.contains('theme-bright');
  document.body.classList.toggle('theme-bright', bright);
  try { localStorage.setItem('darts-theme', bright ? 'bright' : 'dark'); } catch(e) {}
  return bright;
}

/* ═══════════════════════════════════════
   TOAST
═══════════════════════════════════════ */
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 1800);
}

/* ═══════════════════════════════════════
   BUST FLASH
═══════════════════════════════════════ */
function bustFlash() {
  const f = document.getElementById('bust-flash');
  f.classList.add('show');
  setTimeout(() => f.classList.remove('show'), 300);
}

/* ═══════════════════════════════════════
   NAME INPUTS
   containerId — id of the wrapper div
   n           — number of inputs to build
   prefix      — placeholder prefix e.g. "PLAYER"
═══════════════════════════════════════ */
function buildNameInputs(containerId, n, prefix) {
  const w = document.getElementById(containerId);
  const old = [...w.querySelectorAll('input')].map(i => i.value);
  w.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const inp = document.createElement('input');
    inp.className = 'led-input';
    inp.type = 'text';
    inp.placeholder = `${prefix} ${i + 1}`;
    inp.value = old[i] || '';
    if (i > 0) inp.style.marginTop = '0.4rem';
    w.appendChild(inp);
  }
}

function getNames(containerId, fallbackPrefix) {
  return [...document.getElementById(containerId).querySelectorAll('input')]
    .map((x, i) => x.value.trim().toUpperCase() || `${fallbackPrefix}${i + 1}`);
}

/* ═══════════════════════════════════════
   WIN OVERLAY
   Shows the shared #win-overlay.
   onNewGame — callback for the NEW GAME btn.
═══════════════════════════════════════ */
function showWin(name, sub, onNewGame) {
  SFX.win();
  document.getElementById('win-name').textContent = name;
  document.getElementById('win-sub').textContent = sub;
  renderStats(name);
  document.getElementById('win-overlay').classList.add('show');
  document.getElementById('win-new-btn').onclick = onNewGame;
}

/* ═══════════════════════════════════════
   GAME STATS
   Games log every throw into G.log:
     Stats.log(G, { p, m, v, pts, ... })
       p   — player name
       m   — multiplier hit (0 = miss)
       v   — number hit (25 = bull), optional
       pts — points scored, optional
       n   — darts in this entry (default 1)
       h   — darts that hit (default m > 0 ? 1 : 0)
     Round is taken from G.round.
   Undo: store Stats.mark(G) in the snapshot,
   then Stats.rewind(G, snapshot.log).
   Each game sets Stats.rows to the rows
   shown on the win screen:
     [label, (entries, player) => value]
═══════════════════════════════════════ */
const Stats = {
  rows: null,

  log(G, e)      { (G.log = G.log || []).push({ r: G.round, n: 1, ...e }); },
  mark(G)        { return (G.log = G.log || []).length; },
  rewind(G, len) { if (G.log && len !== undefined) G.log.length = len; },

  darts: es => es.reduce((s, e) => s + e.n, 0),
  hits:  es => es.reduce((s, e) => s + (e.h !== undefined ? e.h : (e.m > 0 ? 1 : 0)), 0),
  pts:   es => es.reduce((s, e) => s + (e.pts || 0), 0),
  count: (es, fn) => es.filter(fn).length,

  // Points per round, keyed by round number
  turns(es) {
    const t = {};
    es.forEach(e => { t[e.r] = (t[e.r] || 0) + (e.pts || 0); });
    return Object.values(t);
  },

  pct(a, b)   { return b ? Math.round(a / b * 100) + '%' : '—'; },
  avg3(p, d)  { return d ? (p / d * 3).toFixed(1) : '—'; },
};

// Ready-made rows shared by several games
Stats.DARTS    = ['Darts',      es => Stats.darts(es)];
Stats.HITRATE  = ['Hit rate',   es => Stats.pct(Stats.hits(es), Stats.darts(es))];
Stats.AVG3     = ['3-dart avg', es => Stats.avg3(Stats.pts(es), Stats.darts(es))];
Stats.BESTTURN = ['Best turn',  es => es.length ? Math.max(...Stats.turns(es)) : '—'];
Stats.TREBLES  = ['Trebles',    es => Stats.count(es, e => e.m === 3)];
Stats.DOUBLES  = ['Doubles',    es => Stats.count(es, e => e.m === 2)];
Stats.BULLS    = ['Bulls',      es => Stats.count(es, e => e.v === 25 && e.m > 0)];
Stats.MISSES   = ['Misses',     es => Stats.count(es, e => e.m === 0)];

function renderStats(winner) {
  const ov = document.getElementById('win-overlay');
  let box = document.getElementById('win-stats');
  if (!box) {
    box = document.createElement('div');
    box.id = 'win-stats';
    ov.insertBefore(box, ov.querySelector('.win-btns'));
  }
  const g = typeof G !== 'undefined' ? G : null;
  if (!Stats.rows || !g || !g.log || !g.log.length) { box.innerHTML = ''; return; }

  const byP = {};
  g.players.forEach(p => byP[p] = g.log.filter(e => e.p === p));

  let h = '<table class="stats-table"><thead><tr><th></th>';
  g.players.forEach(p => h += `<th${p === winner ? ' class="win-col"' : ''}>${p}</th>`);
  h += '</tr></thead><tbody>';
  Stats.rows.forEach(([label, fn]) => {
    h += `<tr><td class="stats-lbl">${label}</td>`;
    g.players.forEach(p => h += `<td${p === winner ? ' class="win-col"' : ''}>${fn(byP[p], p)}</td>`);
    h += '</tr>';
  });
  box.innerHTML = h + '</tbody></table>';
}
