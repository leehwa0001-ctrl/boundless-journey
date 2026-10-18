// 無境之旅：遺跡的大地圖（作者：遺跡的地圖要豐富）
// 遺跡裡按 Tab（或 M）：可以拖曳、縮放的整層地圖。
// - 走過的房間亮、看過的（隔壁的）暗；通道、橋、牆的邊、鎖住的房間（紅）。
// - 圖示：入口、樓層通道、寶箱（開過的變灰）、回歸水晶、礦、謎題房、領主區、最深處；走過的房間裡還活著的遺跡生物是紅點；自己、隊友。
// - 旁邊：這一層的資訊（遺跡、分級、形式、第幾層、環境、佩特拉的注意、探索了幾間）和圖例。
(function (R) {
  const W = R.W, $ = id => document.getElementById(id), esc = s => R.esc(s);
  const PX = 6;   // 離屏畫布：一格幾個像素
  let cv = null, view = { cx: 0, cz: 0, k: 3 }, off = null;
  const known = (F, r) => r.visited || Object.values(r.links).some(j => F.rooms[j] && F.rooms[j].visited);
  const paint = F => {
    const t = F.tile, c = document.createElement('canvas'); c.width = t.nx * PX; c.height = t.nz * PX; const x = c.getContext('2d');
    const vis = new Uint8Array(t.nx * t.nz);
    for (let k = 0; k < t.nx * t.nz; k++) {
      if (t.T[k] !== 1) continue; const ri = t.RM[k];
      if (ri >= 0) { const r = F.rooms[ri]; vis[k] = r.visited ? 3 : known(F, r) ? 1 : 0; }
      else { const L = F.links[t.CR[k]]; vis[k] = L && ((F.rooms[L.a] && F.rooms[L.a].visited) || (F.rooms[L.b] && F.rooms[L.b].visited)) ? (L.bridge ? 4 : 2) : 0; }
    }
    for (let k = 0; k < t.nx * t.nz; k++) {
      const v = vis[k], tx = k % t.nx, tz = (k - tx) / t.nx; if (!v) continue;
      const ri = t.RM[k], r = ri >= 0 ? F.rooms[ri] : null;
      x.fillStyle = v === 3 ? (r && r.locked ? '#B86A5A' : r && r.type === 'lord' ? '#A8889A' : r && r.type === 'puzzle' ? '#9AA08A' : '#B0A696') : v === 1 ? '#5A5064' : v === 4 ? '#96704A' : '#8C8478';
      x.fillRect(tx * PX, tz * PX, PX, PX);
    }
    // 牆的邊：看得到的地板旁邊的牆／深淵
    x.fillStyle = '#2A2430';
    for (let k = 0; k < t.nx * t.nz; k++) { if (t.T[k] === 1) continue; const tx = k % t.nx, tz = (k - tx) / t.nx; let near = false; for (let dz = -1; dz <= 1 && !near; dz++) for (let dx = -1; dx <= 1 && !near; dx++) { const m = (tz + dz) * t.nx + tx + dx; if (m >= 0 && m < vis.length && vis[m]) near = true; } if (near) { x.fillStyle = t.T[k] === 3 ? '#0A080E' : '#3A3444'; x.fillRect(tx * PX, tz * PX, PX, PX); } }
    return c;
  };
  // ---------- 浮島型的大地圖（2026-10-17 作者）：各區之間的相對位置、渡島晶的連結，只畫探索過的區 ----------
  const izMode = run => (run && run.izZ && run.iz && run._rmMode === 'zones' ? 'zones' : 'rooms');
  const drawZones = () => {
    const run = W.run, g = cv.getContext('2d'), cw = cv.width, ch = cv.height, G = run.iz.g[run.floor], seen = (run.iz.seen && run.iz.seen[run.floor]) || {}, cur = run.izZ.zone;
    g.fillStyle = '#0E0B12'; g.fillRect(0, 0, cw, ch);
    const pos = G.pos || Array.from({ length: G.n }, (_, i) => [Math.cos(i / G.n * 6.283), Math.sin(i / G.n * 6.283)]);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; pos.forEach(([a, b]) => { x0 = Math.min(x0, a); x1 = Math.max(x1, a); y0 = Math.min(y0, b); y1 = Math.max(y1, b); });
    const M = 56, k = Math.min((cw - M * 2) / Math.max(0.01, x1 - x0), (ch - M * 2) / Math.max(0.01, y1 - y0)), ox = (cw - (x1 - x0) * k) / 2, oy = (ch - (y1 - y0) * k) / 2;
    const pt = i => [ox + (pos[i][0] - x0) * k, oy + (pos[i][1] - y0) * k], R0 = Math.max(16, Math.min(26, k * 0.32));
    // 連結：兩邊都探索過＝實線，兩端各一顆渡島晶；只探索過一邊＝往外的虛線（還沒去過）
    G.adj.forEach((L, a) => L.forEach(b => {
      if (!seen[a] && !seen[b]) return; if (seen[a] && seen[b] && b < a) return;
      const [ax, ay] = pt(a), [bx, by] = pt(b), dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
      if (seen[a] && seen[b]) { g.strokeStyle = '#4FB873'; g.lineWidth = 3; g.setLineDash([]); g.beginPath(); g.moveTo(ax + ux * R0, ay + uy * R0); g.lineTo(bx - ux * R0, by - uy * R0); g.stroke();
        [[ax + ux * (R0 + 7), ay + uy * (R0 + 7)], [bx - ux * (R0 + 7), by - uy * (R0 + 7)]].forEach(([px, py]) => { g.beginPath(); g.arc(px, py, 5, 0, 7); g.fillStyle = '#5CFF84'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = '#0E0B12'; g.stroke(); }); return; }
      const [sx, sy] = seen[a] ? [ax, ay] : [bx, by], vx = seen[a] ? ux : -ux, vy = seen[a] ? uy : -uy, L2 = Math.min(d * 0.45, 70);
      g.strokeStyle = 'rgba(92,255,132,.55)'; g.lineWidth = 2; g.setLineDash([5, 5]); g.beginPath(); g.moveTo(sx + vx * R0, sy + vy * R0); g.lineTo(sx + vx * (R0 + L2), sy + vy * (R0 + L2)); g.stroke(); g.setLineDash([]);
      g.beginPath(); g.arc(sx + vx * (R0 + 7), sy + vy * (R0 + 7), 5, 0, 7); g.fillStyle = '#5CFF84'; g.fill();
      g.fillStyle = 'rgba(244,233,205,.6)'; g.font = 'bold 13px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', sx + vx * (R0 + L2 + 9), sy + vy * (R0 + L2 + 9));
    }));
    // 區：只畫探索過的
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 0; i < G.n; i++) { if (!seen[i]) continue; const [px, py] = pt(i), here = i === cur;
      g.beginPath(); g.arc(px, py, R0, 0, 7); g.fillStyle = here ? '#2E2616' : '#1C1822'; g.fill(); g.lineWidth = here ? 4 : 2; g.strokeStyle = here ? '#FFE08A' : i === G.center ? '#FFC94A' : '#8A7E9A'; g.stroke();
      g.fillStyle = '#F4E9CD'; g.font = 'bold ' + Math.round(R0 * 0.62) + 'px sans-serif'; g.fillText(String(i + 1), px, py + 1);
      const tag = (t, col, dy) => { g.font = 'bold 12px sans-serif'; const w = g.measureText(t).width + 10; g.fillStyle = 'rgba(14,11,18,.85)'; g.fillRect(px - w / 2, py + dy - 9, w, 18); g.fillStyle = col; g.fillText(t, px, py + dy); };
      let dy = R0 + 14; if (i === G.center) { tag('▼ 中心區・樓層通道', '#FFE08A', dy); dy += 19; } if (i === G.entry) { tag('晶 入口・回歸水晶', '#7FE8FF', dy); dy += 19; } if (here) tag('你在這裡', '#FFE08A', -R0 - 13);
    }
    const n = Object.keys(seen).length; g.font = '12px sans-serif'; g.textAlign = 'left'; g.fillStyle = 'rgba(244,233,205,.75)'; g.fillText('探索了 ' + n + '／' + G.n + ' 區・綠點是渡島晶、虛線是還沒去過的區', 12, ch - 14);
  };
  const draw = () => {
    if (!cv || !cv.isConnected) return; const F = W.F, run = W.run, P = W.P; if (!F || !run || !P) return;
    if (izMode(run) === 'zones') { drawZones(); return; }
    run._rmView = { f: run.floor, cx: view.cx, cz: view.cz, k: view.k };
    const g = cv.getContext('2d'), cw = cv.width, ch = cv.height, t = F.tile;
    g.fillStyle = '#0E0B12'; g.fillRect(0, 0, cw, ch);
    // 世界座標 → 畫布
    const pt = (wx, wz) => [cw / 2 + (wx - view.cx) * view.k, ch / 2 + (wz - view.cz) * view.k];
    const [ox, oy] = pt(t.X0, t.Z0); g.imageSmoothingEnabled = false; g.drawImage(off, ox, oy, t.nx * t.TS * view.k, t.nz * t.TS * view.k);
    g.font = 'bold ' + Math.max(11, Math.round(view.k * 2.6)) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const icon = (wx, wz, txt, col, bg) => { const [mx, my] = pt(wx, wz), r = Math.max(7, view.k * 2.2); g.beginPath(); g.arc(mx, my, r, 0, 7); g.fillStyle = bg || 'rgba(20,16,24,.85)'; g.fill(); g.lineWidth = 2; g.strokeStyle = col; g.stroke(); g.fillStyle = col; g.fillText(txt, mx, my + 1); };
    F.rooms.forEach(r => {
      if (!known(F, r)) return;
      const lab = r.type === 'start' ? ['入', '#F4E9CD'] : r.type === 'stairs' ? [F.stairs && F.stairs.sealed ? '✕' : '▼', '#FFE08A'] : r.type === 'boss' ? ['◉', '#FF6A7A'] : r.type === 'lord' ? ['領', '#FF8A6A'] : r.type === 'deep' ? ['◆', '#C8A0FF'] : r.type === 'puzzle' ? ['?', '#B8E07A'] : r.type === 'ore' ? ['◇', '#9AE0FF'] : r.type === 'trap' ? ['！', '#FF8A3A'] : null;
      if (lab && !r.wingHide && (r.visited || r.type === 'stairs' || r.type === 'boss' || r.type === 'lord')) icon(r.x, r.z, lab[0], lab[1]);   // wingHide：領主長廊的出口，領主體倒下之前不標（lordwing.js）
    });
    (F.puzzles || []).forEach(pz => { if (pz.r.visited && pz.solved) icon(pz.r.x + 2.5, pz.r.z - 2.5, '✓', '#B8E07A'); });
    (F.chests || []).forEach(c => { if (!F.rooms[c.room] || !F.rooms[c.room].visited) return; icon(c.x, c.z, '▣', c.state === 'closed' ? ['#C8A060', '#D8B060', '#FFD84A'][c.tier] || '#D8B060' : '#7A7068'); });
    (F.crystals || []).forEach(c => { if (!F.rooms[c.room] || !F.rooms[c.room].visited) return; icon(c.x, c.z, '晶', '#7FE8FF'); });
    (F.ores || []).forEach(o => { if (o.left > 0) { const ri = R.roomIndexAt ? R.roomIndexAt(o.x, o.z) : -1; if (ri < 0 || F.rooms[ri].visited) icon(o.x, o.z, '礦', '#9AE0FF'); } });
    if (F.up) icon(F.up.x, F.up.z, F.up.exit ? '出' : '▲', '#FFF1D0');
    // 遺跡生物：走過的房間裡、或離你 14 公尺內的
    (W.enemies || []).forEach(e => { if (e.dead) return; const ri = R.roomIndexAt ? R.roomIndexAt(e.x, e.z) : -1; if (!(ri >= 0 && F.rooms[ri].visited) && Math.hypot(e.x - P.x, e.z - P.z) > 14) return; const [mx, my] = pt(e.x, e.z); g.fillStyle = e.def.boss ? '#FF3A5A' : e.def.elite ? '#FF9A3A' : '#E0584A'; g.beginPath(); g.arc(mx, my, e.def.boss ? 5 : 3, 0, 7); g.fill(); });
    (W.allies || []).forEach(a => { if (a.downed) return; const [mx, my] = pt(a.x, a.z); g.fillStyle = '#6FE08A'; g.beginPath(); g.arc(mx, my, 3.5, 0, 7); g.fill(); });
    if (R.coopDraw) R.coopDraw(g, pt, 9, 'bold 12px sans-serif');   // 連線隊友（coopmap.js）
    // 自己
    const [mx, my] = pt(P.x, P.z), a = P.aimA || 0; g.save(); g.translate(mx, my); g.rotate(Math.PI - a); g.beginPath(); g.moveTo(0, -11); g.lineTo(7, 7); g.lineTo(0, 3); g.lineTo(-7, 7); g.closePath(); g.fillStyle = '#FFE08A'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#141018'; g.stroke(); g.restore();
    const bar = view.k * 10; g.fillStyle = 'rgba(20,16,24,.8)'; g.fillRect(10, ch - 26, bar + 60, 18); g.fillStyle = '#F4E9CD'; g.fillRect(16, ch - 18, bar, 3); g.font = '11px sans-serif'; g.textAlign = 'left'; g.fillText('10 公尺', 22 + bar, ch - 16);
  };
  const open = () => {
    const F = W.F, run = W.run, P = W.P; if (!F || !run || !P) return;
    off = paint(F);
    const side = window.innerWidth > 820, cw = Math.max(260, Math.round(Math.min(window.innerWidth - 72 - (side ? 292 : 0), 1040))), ch = Math.max(240, Math.round(Math.min(window.innerHeight * (side ? 0.74 : 0.52), side ? 780 : cw)));
    // 2026-10-14：縮放、位置記在這一趟（同一層再打開照上次的樣子）
    const sv = run._rmView; view = sv && sv.f === run.floor ? { cx: sv.cx, cz: sv.cz, k: sv.k } : { cx: P.x, cz: P.z, k: Math.max(2, Math.min(5, cw / 90)) };
    const vis = F.rooms.filter(r => r.visited).length, aw = Math.floor(run.aware || 0);
    const info = '<p><b>' + esc(run.site.name) + '</b><br><small>' + esc(run.grade.name) + '・' + esc(R.TYPES[run.type] ? R.TYPES[run.type].name : '') + (run.env ? '・' + esc(R.ENVS[run.env].name) : '') + '</small></p>'
      + '<p class="note">第 ' + (run.floor + 1) + '／' + run.floors + ' 層・探索了 ' + vis + '／' + F.rooms.length + ' 間<br>佩特拉的注意 ' + aw + '%' + (F.puzzles && F.puzzles.length ? '<br>這一層有 ' + F.puzzles.length + ' 間謎題房（支線）' : '') + '</p>';
    const lg = [['入', '#F4E9CD', '入口'], ['▼', '#FFE08A', '樓層通道'], ['出', '#FFF1D0', '出口'], ['▣', '#D8B060', '寶箱（灰色：開過了）'], ['晶', '#7FE8FF', '回歸水晶'], ['礦', '#9AE0FF', '礦'], ['?', '#B8E07A', '謎題房'], ['領', '#FF8A6A', '領主區'], ['◉', '#FF6A7A', '核心'], ['◆', '#C8A0FF', '最深處'], ['！', '#FF8A3A', '陷阱區']];
    const izTabs = run.izZ && run.iz ? '<div class="rm-tabs"><button type="button" class="tab' + (izMode(run) === 'rooms' ? ' on' : '') + '" data-rmmode="rooms">小地圖（這一區的房間）</button><button type="button" class="tab' + (izMode(run) === 'zones' ? ' on' : '') + '" data-rmmode="zones">大地圖（各區的關係）</button></div>' : '';
    R.sheet('<h2>遺跡地圖</h2>' + izTabs + '<div class="gmap"><canvas id="rm-cv" width="' + cw + '" height="' + ch + '"></canvas><div class="gmap-side">' + info
      + '<h3>圖例</h3><div class="glegend">' + lg.map(([g2, c, n]) => '<span class="gl"><b style="background:#141018;color:' + c + ';border-color:' + c + '">' + g2 + '</b>' + n + '</span>').join('') + '<span class="gl"><b style="background:#E0584A"> </b>遺跡生物</span><span class="gl"><b style="background:#6FE08A"> </b>隊友</span></div>'
      + '<p class="note">拖曳移動、滾輪縮放（手機兩指）、＋／− 按鈕；雙擊回到自己的位置。只畫走過、看過的地方；紅色的房間是鎖住的。</p></div></div>',
      '<div class="row"><button type="button" class="btn pri" id="rm-x">關上（Tab）</button><button type="button" class="btn" id="rm-in">＋ 放大</button><button type="button" class="btn" id="rm-out">− 縮小</button><button type="button" class="btn" id="rm-me">回到自己的位置</button><button type="button" class="btn" id="rm-all">整層</button></div>');
    $('r-sheet').classList.add('wide');
    cv = $('rm-cv'); cv.style.touchAction = 'none'; cv.style.cursor = 'grab';
    document.querySelectorAll('[data-rmmode]').forEach(b => { b.onclick = () => { run._rmMode = b.dataset.rmmode; document.querySelectorAll('[data-rmmode]').forEach(x => x.classList.toggle('on', x === b)); draw(); }; });
    if (!document.getElementById('rm-tabs-css')) { const st = document.createElement('style'); st.id = 'rm-tabs-css'; st.textContent = '.rm-tabs{display:flex;gap:6px;margin:0 0 8px;flex-wrap:wrap}'; document.head.appendChild(st); }
    const zc = f => { view.k = Math.max(1, Math.min(14, view.k * f)); draw(); };
    $('rm-in').onclick = () => zc(1.4); $('rm-out').onclick = () => zc(1 / 1.4);
    cv.addEventListener('dblclick', e => { e.preventDefault(); view.cx = P.x; view.cz = P.z; draw(); });
    $('rm-x').onclick = R.closeSheet; $('rm-me').onclick = () => { view.cx = P.x; view.cz = P.z; draw(); };
    $('rm-all').onclick = () => { const t = F.tile, w = t.nx * t.TS, h = t.nz * t.TS; view.cx = t.X0 + w / 2; view.cz = t.Z0 + h / 2; view.k = Math.min(cw / w, ch / h) * 0.95; draw(); };
    const pts = new Map(); let pinch = 0;
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
    cv.addEventListener('pointermove', e => { if (!pts.has(e.pointerId)) return; const [ox, oy] = pts.get(e.pointerId), rc = cv.getBoundingClientRect(), sc = cv.width / rc.width; pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) view.k = Math.max(1, Math.min(14, view.k * d / pinch)); pinch = d; draw(); return; }
      view.cx -= (e.clientX - ox) * sc / view.k; view.cz -= (e.clientY - oy) * sc / view.k; draw(); });
    const up = e => pts.delete(e.pointerId); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', e => { e.preventDefault(); const rc = cv.getBoundingClientRect(), u = (e.clientX - rc.left) / rc.width * cv.width, v = (e.clientY - rc.top) / rc.height * cv.height, wx = view.cx + (u - cv.width / 2) / view.k, wz = view.cz + (v - cv.height / 2) / view.k; view.k = Math.max(1, Math.min(14, view.k * (e.deltaY > 0 ? 1 / 1.18 : 1.18))); view.cx = wx - (u - cv.width / 2) / view.k; view.cz = wz - (v - cv.height / 2) / view.k; draw(); }, { passive: false });
    draw();
  };
  const big0 = R.bigMap;
  R.bigMap = () => { if (W.run && !W.town) { if (R.sheetOpen && R.sheetOpen()) { R.closeSheet(); return; } if (document.body.classList.contains('rv-lost')) { R.toast && R.toast('迷途：這一層看不到地圖，只能靠自己記路。'); return; } open(); return; } big0(); };
  // M 在遺跡裡也打開地圖
  window.addEventListener('keydown', e => { if (e.key.toLowerCase() !== 'm' || !W.run || W.town || !$('run') || $('run').hidden || e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return; if (R.sheetOpen && R.sheetOpen()) { if (cv && cv.isConnected) R.closeSheet(); return; } R.bigMap(); });
})(window.R);
