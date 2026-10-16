// 無境之旅：浮島型遺跡的新邏輯——「層 → 區 → 房間」（2026-10-13 作者）
// - 浮島是一座島，層數少：哈米莉亞、阿彌勒 1 層、摩爾斯 2、克森特 3、卡索 4（depth.js 的 R.ISLAND_FLOORS）。
//   景色照第幾層：1 森林或沙灘、2 石壁穴或礦洞（晶洞）、3 城區牆（古代遺構）或水下（深海）、4 極端地形（岩漿海、火山、凍原）。
// - 每層由好幾個「區」組成：基本 7～9 區 × 分級倍率（哈米莉亞 ×1、阿彌勒 ×1.35、摩爾斯 ×2.15、克森特 ×4.30、卡索 ×6，四捨五入）。
//   每區 12～16 間房（dungeon.js 的 R.roomsPerFloor），房間比其他遺跡再大 35%，戰鬥房的遺跡生物多 65%。
// - 區和區之間用綠色的「渡島晶」連起來（回歸水晶是藍的、回地面；渡島晶是綠的、到別的區）：一條連結兩頭各一顆；
//   區的連結圖一定連通、不一定是一直線，一區最多連 5 區（最多 5 顆渡島晶）。2026-10-16：每一區在海上有位置、照遠近連得更密；
//   渡島晶放在這一區朝向那一區那一側最外面的房間、房間裡靠那一邊（A、B、C 一排：A 的右邊、B 的左右、C 的左邊）。
// - 每次回到某一區，那一區的樣子會重新長過；但這一層的連結圖（幾區、誰連誰）整層固定（照種子算，房主、隊員算出來一樣）。
// - 同一時間只長、只跑玩家所在的那一區（跟一層一樣），不會一次長出整層的一百多間房。
// - 每層有一個「中心區」，裡面的「中心房間」一定是領主房：分級有領主體就是領主體，沒有就放一隻強化 ×2.15 的精英。
//   中心房間有往下的樓層通道，房間裡的遺跡生物全部打倒才打開。最後一層的中心房間照舊是最深處（佩特拉核心／保留區的核心）。
// - 多人連線：房主決定換區（隊員跟著，跟換樓層一樣）；換區時房主多送一則 { k: 'iz', n, z }，隊員照這個長同一區。
// 放在 biome.js、net.js、net2.js、ruinis.js、lordwing.js 後面（包 R.loadFloor、R.spawnEnemy、R.nearestInteract、R.descend 最外面）。
(function (R) {
  const W = () => R.W;
  const ZK = { hamilia: 1, amile: 1.35, mors: 2.15, kesent: 4.30, kaso: 6, kansait: 6 };
  R.IZ_ZONE_K = ZK;
  R.IZ_ELITE_MUL = 2.15;   // 沒有領主體的分級：中心房間的精英強化倍率
  R.IZ_FIGHT_MUL = 1.65;   // 浮島區的戰鬥房：遺跡生物 +65%
  const AVG = { hamilia: 10, amile: 21.5, mors: 30, kesent: 47.5, kaso: 95, kansait: 95 };   // IS／難度換算：浮島第幾層 ≈ 一般遺跡第幾層
  const mul32 = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const isIsland = run => !!(run && run.type === 'island' && run.site && run.site.id !== 'kanko' && !run.site.outdoor && run.grade && run.grade.id !== 'hunt');
  const has0 = run => !!(run && run.grade && run.grade.floor0);
  const fIdx = (run, f) => f - (has0(run) ? 1 : 0);
  const coop = run => !!(run && run.coop && !run.coop.solo);
  const guest = run => coop(run) && !run.coop.host;
  R.isIslandRun = isIsland;
  const THEMES = [
    [{ biome: 'forest', n: '森林' }, { biome: 'beach', n: '沙灘' }],
    [{ biome: 'cave', n: '石壁穴' }, { biome: 'crystal', n: '礦洞' }],
    [{ biome: 'ruin', n: '城區牆' }, { env: 'deep', n: '水下' }],
    [{ biome: 'lava', n: '岩漿海' }, { env: 'volcano', n: '火山' }, { env: 'snow', n: '凍原' }]
  ];
  if (R.BIOMES && !R.BIOMES.beach) R.BIOMES.beach = { n: '沙灘', d: '浮島的岸邊，白沙和潮水聲。', floor: '#C8B48A', wall: '#9A8A6A', top: '#E0D0A8', light: '#FFF4D8', fog: '#4A6A7A', accent: '#7AD8E8', deco: 'plain', fav: ['kappa', 'karasu'] };

  // ---------- 一層的區連結圖（整層固定） ----------
  R.izGraph = (run, f) => {
    run.iz = run.iz || { seed: (Math.random() * 4294967296) >>> 0, g: {}, boss: {}, cur: -1, f: -1, zoneByN: {} };
    if (run.iz.g[f]) return run.iz.g[f];
    const base = coop(run) ? run.coop.seed : run.iz.seed, rng = mul32((base ^ Math.imul(f + 1, 0x9E3779B1) ^ 0x51ED270B) >>> 0), ri = (a, b) => a + Math.floor(rng() * (b - a + 1));
    const n = Math.max(2, Math.round(ri(7, 9) * (ZK[run.grade.id] || 1))), adj = Array.from({ length: n }, () => new Set());
    const link = (a, b) => { adj[a].add(b); adj[b].add(a); };
    // 2026-10-16 作者：每一區在海上有自己的位置，照遠近連起來（島和島之間連得更密），渡島晶放在朝向對方的那一側
    // 位置：一區一區撒在 √n×1.6 見方的海面上，每次挑離已經放好的區最遠的一個點（分得開）
    const S = Math.sqrt(n) * 1.6, pos = [];
    for (let i = 0; i < n; i++) { let bp = null, bd = -1; for (let t = 0; t < 30; t++) { const p = [rng() * S, rng() * S], d = pos.length ? Math.min(...pos.map(q => Math.hypot(q[0] - p[0], q[1] - p[1]))) : 9; if (d > bd) { bd = d; bp = p; } } pos.push(bp); }
    const D = (a, b) => Math.hypot(pos[a][0] - pos[b][0], pos[a][1] - pos[b][1]);
    // 先照遠近長一棵最小生成樹（一定連通、只連近的）
    const inT = [0]; while (inT.length < n) { let ba = -1, bb = -1, bd = 1e9; inT.forEach(a => { if (adj[a].size >= 5) return; for (let b = 0; b < n; b++) if (!inT.includes(b) && D(a, b) < bd) { bd = D(a, b); ba = a; bb = b; } }); if (bb < 0) break; link(ba, bb); inT.push(bb); }
    // 再把最近的幾對補連起來（約 0.8 × 區數條），一區最多連 5 區
    const pairs = []; for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) pairs.push([D(a, b), a, b]); pairs.sort((x, y) => x[0] - y[0]);
    let extra = Math.round(n * 0.8); for (const [, a, b] of pairs) { if (extra <= 0) break; if (adj[a].has(b) || adj[a].size >= 5 || adj[b].size >= 5) continue; link(a, b); extra--; }
    const bfs = s => { const d = Array(n).fill(-1); d[s] = 0; const q = [s]; for (let i = 0; i < q.length; i++) adj[q[i]].forEach(j => { if (d[j] < 0) { d[j] = d[q[i]] + 1; q.push(j); } }); return d; };
    let center = 0, best = 1e9; for (let i = 0; i < n; i++) { const e = Math.max(...bfs(i)); if (e < best || (e === best && adj[i].size > adj[center].size)) { best = e; center = i; } }
    const dc = bfs(center); let entry = center === 0 ? 1 : 0; for (let i = 0; i < n; i++) if (i !== center && dc[i] > dc[entry]) entry = i;
    const fi = fIdx(run, f), opts = THEMES[Math.min(3, Math.max(0, fi))], theme = opts[Math.floor(rng() * opts.length)];
    return (run.iz.g[f] = { n, adj: adj.map(s => [...s].sort((a, b) => a - b)), center, entry, dc, theme, pos });
  };
  R.izInfo = () => { const run = W().run; return run && run.izZ ? { f: run.floor, zone: run.izZ.zone, graph: run.iz.g[run.floor] } : null; };

  // 領主體：lordfloor.js 在沒有領主的層會把 g.lords 暫時拿掉、lords.js 會多放領主房——浮島的區只留中心房間一間
  const gf0 = R.genFloor;
  R.genFloor = (run, f) => {
    const F = gf0(run, f);
    if (run && run.izZ && F && F.rooms) {
      const lords = run.grade.lords && run.grade.lords.length;
      F.rooms.forEach(r => { if (r.type === 'lord' && !r.izCenter) r.type = 'fight'; if (r.izCenter && !F.last) { r.type = lords ? 'lord' : 'fight'; r.izElite = lords ? 0 : 1; r.cleared = false; } });
      F.lordGate = null; F.wing = null;
    }
    return F;
  };
  // ---------- 換層／換區 ----------
  const lf0 = R.loadFloor;
  R.loadFloor = (f, o) => {
    o = o || {}; const run = W().run;
    if (!isIsland(run) || fIdx(run, f) < 0) { if (run) run.izZ = null; if (run && isIsland(run)) { run.biomeOrder = null; } return lf0(f, o); }
    const G = R.izGraph(run, f), sameFloor = run.iz.f === f;
    let z, from = o.izFrom != null ? o.izFrom : null;
    if (o.izTo != null) z = o.izTo;
    else if (guest(run) && run.iz.zoneByN[run.coop.n]) { const m = run.iz.zoneByN[run.coop.n]; z = m.z; from = m.from; }
    else if (guest(run) && sameFloor) z = run.iz.cur;
    else z = o.up ? G.center : G.entry;
    z = Math.max(0, Math.min(G.n - 1, z | 0));
    run.iz.f = f; run.iz.cur = z;
    // dirs：這一區往每一條連結的方向（區的位置 x→房間格 gx、y→gy），渡島晶照這個方向放
    const dirs = G.pos ? G.adj[z].map(to => { const dx = G.pos[to][0] - G.pos[z][0], dy = G.pos[to][1] - G.pos[z][1], L = Math.hypot(dx, dy) || 1; return [dx / L, dy / L]; }) : null;
    run.izZ = { zone: z, links: G.adj[z].slice(), dirs, center: z === G.center, entry: z === G.entry, from };
    run.iz.seen = run.iz.seen || {}; (run.iz.seen[f] = run.iz.seen[f] || {})[z] = 1;   // 2026-10-17：探索過的區（ruinmap.js 的大地圖只畫這些）
    // 景色：照第幾層（biome.js 的 biomeFor 照 R.saveEvery＝1 一層一段）
    const order = []; for (let i = 0; i <= fIdx(run, run.floors - 1); i++) { const g2 = R.izGraph(run, i + (has0(run) ? 1 : 0)); order.push(g2.theme.biome || 'ruin'); }
    run.biomeOrder = has0(run) ? order : order; run.env = G.theme.env || null;
    const r = lf0(f, o);
    try { after(run, f, G, o, from); } catch (e) { console.warn('[island]', e); }
    if (coop(run) && run.coop.host && R.net) { const msg = { k: 'iz', rid: run.coop.seed, n: run.coop.n, f, z, from }; [0, 400, 1200].forEach(t => setTimeout(() => { try { if (W().run === run && run.coop.n === msg.n) R.net.send(msg); } catch (e) { } }, t)); }
    return r;
  };
  // 隊員：收到房主換到哪一區
  const hookNet = () => {
    const N = R.net; if (!N || N.__iz) return; N.__iz = 1;
    const m0 = N.onMsg2;
    N.onMsg2 = (from, d) => {
      if (d && d.k === 'iz') {
        const run = W().run; if (!run || !run.coop || run.coop.host || d.rid !== run.coop.seed || from !== N.host) return;
        run.iz = run.iz || { seed: 0, g: {}, boss: {}, cur: -1, f: -1, zoneByN: {} }; run.iz.zoneByN[d.n] = { z: d.z, from: d.from };
        if (run.coop.n === d.n && run.floor === d.f && run.izZ && run.izZ.zone !== d.z) R.fade(() => R.loadFloor(run.floor, { netFollow: true }));
        return;
      }
      return m0 ? m0(from, d) : undefined;
    };
  };
  hookNet(); setTimeout(hookNet, 0);

  const T = () => window.THREE;
  const after = (run, f, G, o, from) => {
    const F = W().F, P = W().P, TH = T(); if (!F) return;
    F.iz = { zone: run.izZ.zone, graph: G, crystals: [] };
    // 渡島晶（綠色）
    F.rooms.forEach(r => {
      (r.izTo || []).forEach((to, k, arr) => {
        // 放在房間朝向那一區的那一邊（同一間房有好幾顆就沿著那一邊排開）；落點要是空地
        const d = r.izDir && r.izDir[k], off = (k - (arr.length - 1) / 2) * 4.5;
        let px = r.x + off, pz = r.z;
        if (d) { px = r.x + d[0] * r.hx * 0.6 - d[1] * off; pz = r.z + d[1] * r.hz * 0.6 + d[0] * off; }
        let [x, z] = R.nearestFloor(px, pz);
        for (let t = 0; t < 8 && R.pointBlocked && (R.pointBlocked(x, z) || R.pointBlocked(x + 0.8, z) || R.pointBlocked(x - 0.8, z) || R.pointBlocked(x, z + 0.8) || R.pointBlocked(x, z - 0.8)); t++) [x, z] = R.nearestFloor(x + (r.x - x) * 0.25, z + (r.z - z) * 0.25);   // 卡到牆或擺設就往房間中間挪
        const g = new TH.Group();
        const c = new TH.Mesh(new TH.OctahedronGeometry(0.9, 0), new TH.MeshLambertMaterial({ color: '#7CFF9A', emissive: new TH.Color('#1FAF4A'), emissiveIntensity: 0.9, transparent: true, opacity: 0.9 }));
        c.scale.y = 1.8; c.position.y = 1.9; g.add(c);
        const ring = new TH.Mesh(new TH.TorusGeometry(1.3, 0.08, 6, 24), new TH.MeshLambertMaterial({ color: '#BFFFD0', emissive: new TH.Color('#3AD86A') })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.2; g.add(ring);
        const L = new TH.PointLight('#6AFF8A', 1.1, 12, 1.6); L.position.y = 2.5; g.add(L);
        g.position.set(x, 0, z); F.group.add(g);
        R.addBox(x - 0.7, x + 0.7, z - 0.7, z + 0.7, 'crystal');
        F.iz.crystals.push({ x, z, to, room: r.i, mesh: c });
      });
    });
    // 中心房間：領主房；不是最後一層的話有往下的樓層通道（打倒才開）
    const cr = F.rooms.find(r => r.izCenter);
    if (cr) {
      F.iz.center = cr.i;
      if (!F.last) {
        const [sx, sz] = R.nearestFloor(cr.x, cr.z + cr.hz * 0.45); R.addStairs(F.group, F, sx, sz, cr.i, R.theme(run));
        if (run.iz.boss[f]) { cr.cleared = true; }
        else { const cov = new TH.Mesh(new TH.BoxGeometry(4.2, 0.4, 4.2), new TH.MeshLambertMaterial({ color: '#3A8A4A', emissive: new TH.Color('#0A3A1A') })); cov.position.set(sx, 0.2, sz); F.group.add(cov); F.stairs.izGate = cov; }
      }
    }
    // 落點：從別的區過來站在對應的渡島晶旁邊；從下一層走上來站在樓層通道旁
    let ax = null, az = null;
    if (from != null) { const c = F.iz.crystals.find(c => c.to === from); if (c) { [ax, az] = R.nearestFloor(c.x, c.z + 2.6); const rr = F.rooms[c.room]; if (rr && rr.type !== 'start') { rr.cleared = true; rr.izSafe = 1; W().enemies.forEach(e => { if (e.room === rr.i && !e.dead) { e.dead = true; if (e.m && e.m.g && e.m.g.parent) e.m.g.parent.remove(e.m.g); else if (e.m && e.m.parent) e.m.parent.remove(e.m); } }); W().enemies = W().enemies.filter(e => !e.dead); } } }
    else if (o.up && F.stairs) [ax, az] = R.nearestFloor(F.stairs.x, F.stairs.z + 3.2);
    if (ax != null && P) { P.x = ax; P.z = az; (W().allies || []).forEach((a, i) => { const [x2, z2] = R.nearestFloor(ax + (i % 2 ? 1.5 : -1.5), az + 1); a.x = x2; a.z = z2; if (a.h && a.h.g) a.h.g.position.set(x2, 0, z2); }); if (P.h && P.h.g) P.h.g.position.set(ax, 0, az); R.placeCam && R.placeCam(null); }
    chip(run);
    if (R.drawMinimap) R.drawMinimap(true);
  };

  // ---------- HUD：第 N 層・第 M 區 ----------
  const fl0 = R.floorLabel;
  R.floorLabel = run => { const b = fl0 ? fl0(run) : ''; if (!run || !run.izZ || !run.iz) return b; const G = run.iz.g[run.floor]; return b + '・第 ' + (run.izZ.zone + 1) + ' 區／共 ' + G.n + ' 區' + (run.izZ.center ? '（中心區）' : ''); };
  const chip = run => {
    let el = document.getElementById('iz-chip');
    if (!run || !run.izZ) { if (el) el.hidden = true; return; }
    if (!el) { el = document.createElement('div'); el.id = 'iz-chip'; el.style.cssText = 'position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 54px);transform:translateX(-50%);z-index:30;pointer-events:none;background:rgba(8,20,12,.72);border:1px solid #3AD86A;color:#D8FFE2;font:12px/1.5 system-ui;padding:3px 10px;border-radius:8px;white-space:nowrap;max-width:92vw;overflow:hidden;text-overflow:ellipsis'; document.body.appendChild(el); }
    const G = run.iz.g[run.floor], z = run.izZ.zone, fi = fIdx(run, run.floor) + 1;
    el.hidden = false;
    el.textContent = '浮島 第 ' + fi + ' 層・第 ' + (z + 1) + ' 區（共 ' + G.n + ' 區）・' + (G.theme.n || '') + '｜' + (run.izZ.center ? '這裡是中心區' : '中心區：第 ' + (G.center + 1) + ' 區（還隔 ' + G.dc[z] + ' 區）') + '｜渡島晶通往：' + G.adj[z].map(k => '第 ' + (k + 1) + ' 區' + (k === G.center ? '★' : '')).join('、');
  };
  R.izChip = () => chip(W().run);
  const er0 = R.endRun; if (er0) R.endRun = (...a) => { const r = er0(...a); chip(null); return r; };
  const ex0 = R.extract; if (ex0) R.extract = (...a) => { const r = ex0(...a); chip(null); return r; };
  // 小地圖：渡島晶畫成綠點、中心房間的樓梯畫成金點
  const mm0 = R.drawMinimap;
  if (mm0) R.drawMinimap = (...a) => {
    const r = mm0(...a);
    try {
      const w = W(), F = w.F, P = w.P, cv = document.getElementById('r-map'); if (!w.run || w.town || w.inside || !F || !F.iz || !P || !cv) return r;
      const x = cv.getContext('2d'), s = cv.width, sc = 1.3, yaw = w.cam ? w.cam.yaw : 0, cy = Math.cos(yaw), sy = Math.sin(yaw);
      const pt = (wx, wz) => { const dx = (wx - P.x) / sc, dz = (wz - P.z) / sc; return [s / 2 + dx * cy - dz * sy, s / 2 + dx * sy + dz * cy]; };
      x.font = 'bold ' + Math.round(s / 14) + 'px system-ui'; x.textAlign = 'center';
      F.iz.crystals.forEach(c => { const room = F.rooms[c.room]; if (!room || !(room.visited || Object.values(room.links).some(j => F.rooms[j].visited))) return; const [px, pz] = pt(c.x, c.z); x.fillStyle = '#5CFF84'; x.beginPath(); x.arc(px, pz, s / 40, 0, 7); x.fill(); x.fillStyle = '#EFFFF2'; x.fillText(String(c.to + 1), px, pz - s / 28); });
    } catch (e) { }
    return r;
  };

  // ---------- 渡島晶的互動 ----------
  const ni0 = R.nearestInteract;
  R.nearestInteract = () => {
    const best = ni0(), w = W(), F = w.F, P = w.P, run = w.run;
    if (best && F && F.stairs && F.stairs.izGate && /樓層通道/.test(best.label || '') && !/走上/.test(best.label)) best.label = '樓層通道被封住了（打倒中心房間的遺跡生物才會打開）';
    if (!F || !F.iz || !P) return best;
    let bd = best ? Math.hypot(best.x - P.x, best.z - P.z) : 1e9, out = best;
    F.iz.crystals.forEach(c => { const d = Math.hypot(c.x - P.x, c.z - P.z); if (d < 2.4 && d < bd) { bd = d; const G = run.iz.g[run.floor]; out = { x: c.x, z: c.z, r: 2.4, label: '渡島晶：前往第 ' + (c.to + 1) + ' 區' + (c.to === G.center ? '（中心區）' : ''), act: () => R.izTravel(c.to) }; } });
    return out;
  };
  R.izTravel = to => {
    const run = W().run; if (!run || !run.izZ) return;
    if (guest(run)) { R.toast && R.toast('多人連線：換區跟著房主走。'); return; }
    if (R.stairBusy && R.stairBusy()) return;
    const from = run.izZ.zone;
    R.fade(() => { R.loadFloor(run.floor, { izTo: to, izFrom: from }); R.banner && R.banner('渡島晶', '來到第 ' + (to + 1) + ' 區' + (run.izZ && run.izZ.center ? '（中心區）' : '')); });
  };
  const de0 = R.descend;
  R.descend = () => { const F = W().F; if (F && F.stairs && F.stairs.izGate) { R.toast && R.toast('樓層通道被封住了：打倒中心房間裡的遺跡生物才會打開。'); return; } return de0(); };

  // ---------- 中心房間：精英（沒有領主體的分級）、打倒就開樓梯 ----------
  const pf0 = R.populateFloor;
  R.populateFloor = () => { const F = W().F, tmp = F ? F.rooms.filter(r => r.izElite && !r.cleared) : []; tmp.forEach(r => { r.cleared = true; }); try { return pf0(); } finally { tmp.forEach(r => { r.cleared = false; }); } };
  const en0 = R.enterRoom;
  R.enterRoom = r => {
    const run = W().run, fresh = r && r.izElite && !r.cleared && !r.locked && !r.izDone;
    const out = en0(r);
    if (fresh && run && !(run.iz && run.iz.boss[run.floor]) && !guest(run)) {
      r.izDone = 1; const pool = run.grade.pool.filter(id => R.ENEMIES[id] && R.ENEMIES[id].elite), id = pool.length ? pool[Math.floor(Math.random() * pool.length)] : run.grade.pool[run.grade.pool.length - 1];
      const [x, z] = R.nearestFloor(r.x, r.z - 2), e = R.spawnEnemy(id, x, z, r.i, { aggro: true, hpMul: 2 });
      if (e) { const k = R.IZ_ELITE_MUL; e.hp *= k; e.hpMax *= k; e.dmg *= k; e.izElite = 1; }
      R.banner && R.banner('中心房間的守護者', (R.ENEMIES[id] ? R.ENEMIES[id].name : '') + '（強化 ×' + R.IZ_ELITE_MUL + '）');
      if (!r.locked && !run.grade.passive && R.lockRoom) R.lockRoom(r, true);
    }
    return out;
  };
  const st0 = R.step;
  R.step = dt => {
    const out = st0(dt), w = W(), run = w.run, F = w.F;
    if (run && F && F.iz && F.iz.center != null && F.stairs && F.stairs.izGate) {
      const cr = F.rooms[F.iz.center];
      if (cr && cr.cleared && cr.visited && !w.enemies.some(e => !e.dead && e.room === cr.i)) {
        run.iz.boss[run.floor] = true; F.group.remove(F.stairs.izGate); F.stairs.izGate = null;
        R.banner && R.banner('中心房間清空了', '往下的樓層通道打開了'); R.sfx && R.sfx('chest');
      }
    }
    return out;
  };

  // ---------- 數量、難度 ----------
  const rc0 = R.ruinRoomCount;
  if (rc0) R.ruinRoomCount = (r, run) => { const n = rc0(r, run); return n != null && run && run.izZ && r.type === 'fight' ? Math.round(n * R.IZ_FIGHT_MUL) : n; };
  const se0 = R.spawnEnemy;
  R.spawnEnemy = (id, x, z, room, o) => {
    const run = W().run;
    if (!run || !run.izZ || run.isRealFloor != null) return se0(id, x, z, room, o);
    const n = Math.max(1, fIdx(run, run.floors - 1) + 1), fi = fIdx(run, run.floor) + 1, eq = Math.max(1, Math.round(fi / n * (AVG[run.grade.id] || 10)));
    run.isRealFloor = has0(run) ? eq : eq - 1;   // ruinis.js 的 IS：照換算的深度
    try { return se0(id, x, z, room, o); } finally { run.isRealFloor = null; }
  };
  // 浮島不走領主長廊（中心房間就是領主房）
  const lfo0 = R.lordFloorsOf;
  if (lfo0) R.lordFloorsOf = run => (isIsland(run) ? [] : lfo0(run));
  // 浮島一區的大小（委託時限用）：大約要走過幾區
  R.islandZonesAvg = gradeId => Math.round(8 * (ZK[gradeId] || 1));
})(window.R);
