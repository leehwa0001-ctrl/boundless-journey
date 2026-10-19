// 每座城附近的遺跡各有自己的樣子（2026-10-20 作者：各城市的遺跡特色要更能區分開來；照《昭旭重要城市》的設定）
// 原本遺跡的外觀只看分級、特殊環境，和共用的六種景色（biome.js）——同分級、沒有特殊環境的遺跡看起來幾乎一樣。
// 這裡給遺跡「招牌景色」：自己的牆和地面顏色、光、霧、擺設、調色（ruinfx.js 的 GRADE）；前三段都是招牌景色，越深才混進共用的洞窟、晶洞、岩漿海。
// 第一批：
// - 吉山近郊・工廠遺跡（吉山：賽博＋和式的第一大工業城）→ 鏽鐵工廠：管線、齒輪、機械殘骸、霓虹燈條、火花；冷青色的光和粉紅霓虹。
// - 皇嶺北麓・陵墓遺跡（皇嶺：山嶺都城、皇室）→ 皇家陵墓：白石、石燈籠、金邊石棺、香爐的火光、金色的柱子。
// - 古森・樹根迷宮（古森：大古森木、古森精靈部落）→ 大古森木的根盤成拱、苔、發光蘑菇、螢火、刻著精靈紋的石頭。
// - 征遠・舊艦遺址（征遠：海軍重鎮、戰列艦「武聖號」）→ 戰列艦內部：鋼板、鉚釘、管線、艙門、砲彈箱、砲塔座、積水、暖黃的艙燈。
//   （征遠舊艦本來是深海環境：水壓變慢照舊，只換外觀。）
// 放在 biome.js、ruinfx.js 後面（包 R.loadFloor、R.theme 最外面）。
(function (R) {
  const W = () => R.W, rnd = Math.random, pick = a => a[Math.floor(rnd() * a.length)];
  const B = R.BIOMES; if (!B) return;
  const FAV = ['rustknight', 'gearsentry', 'setosho', 'muddoll', 'honemusha', 'ruinrat'];
  Object.assign(B, {
    factory: { n: '鏽鐵工廠', d: '停擺的生產線和管線，霓虹燈條還在閃。', floor: '#2C3036', wall: '#3A3E46', top: '#5A606A', light: '#7AE8FF', fog: '#0C1016', accent: '#FF5AB8', deco: 'factory', fav: FAV },
    tomb: { n: '皇家陵墓', d: '白石砌的墓道，香爐裡的火還沒熄。', floor: '#9C9484', wall: '#B4AC9A', top: '#E2DAC6', light: '#FFDDA0', fog: '#241E14', accent: '#E8C04A', deco: 'tomb', fav: FAV },
    roots: { n: '古森木之根', d: '大古森木的根盤成了牆和拱門，空氣潮濕又安靜。', floor: '#2E3A24', wall: '#3E3024', top: '#5E4A32', light: '#C8F08A', fog: '#10180C', accent: '#9AE07A', deco: 'roots', fav: (B.forest && B.forest.fav) || FAV },
    ship: { n: '武聖號的船艙', d: '鉚釘鋼板的艙壁，水從縫裡滲進來。', floor: '#363A40', wall: '#464A52', top: '#666A72', light: '#FFD08A', fog: '#0C0E12', accent: '#C8323A', deco: 'ship', fav: FAV }
  });
  // 遺跡 → 招牌景色
  const SIG = { 'js-factory': 'factory', hokuroku: 'tomb', 'gs-root': 'roots', 'zy-wreck': 'ship' };
  R.RUIN_SIG = SIG;
  if (R.RUIN_GRADE) Object.assign(R.RUIN_GRADE, {
    factory: { tint: [0.9, 1.0, 1.1], lift: [0.01, 0.02, 0.035], sat: 1.12, expo: 1.0, bloom: 0.62, th: 0.82 },
    tomb: { tint: [1.06, 1.0, 0.9], lift: [0.03, 0.022, 0.01], sat: 0.98, expo: 0.92, bloom: 0.5, th: 0.86 },
    roots: { tint: [0.93, 1.06, 0.9], lift: [0.008, 0.02, 0.01], sat: 1.08, expo: 1.0, bloom: 0.58, th: 0.8 },
    ship: { tint: [1.04, 0.99, 0.92], lift: [0.012, 0.016, 0.022], sat: 1.0, expo: 1.0, bloom: 0.55, th: 0.84 }
  });
  const sigOf = run => (run && run.site && SIG[run.site.id]) || null;
  // ---------- 景色順序：前三段招牌景色 ----------
  const lf0 = R.loadFloor;
  R.loadFloor = (f, o) => {
    const run = W().run, s = sigOf(run);
    if (run && s && !run.env && !run.biomeOrder) run.biomeOrder = [s, s, s, 'cave', 'crystal', 'lava'];
    const r = lf0(f, o);
    try { if (run && s && (run.biome === s || run.env)) decorate(run, W().F, s); } catch (e) { console.warn('[ruinsites]', e); }
    return r;
  };
  // 浮島型（征遠舊艦）：景色是 island.js 照每一層的區圖決定的，換掉區圖的景色——最後一層以外都是招牌景色（只有一兩層的：第一層）
  const iz0 = R.izGraph;
  if (iz0) R.izGraph = (run, f) => {
    const g = iz0(run, f), s = sigOf(run); if (!g || !g.theme || !s || g.sig) return g;
    const fi = f - (run.grade && run.grade.floor0 ? 1 : 0), last = run.floors - 1 - (run.grade && run.grade.floor0 ? 1 : 0);
    g.sig = 1; if (fi < Math.max(1, last)) g.theme = Object.assign({}, g.theme, { biome: s, env: null });   // 區圖的 theme 是共用的那張表：換一份新的，不改原本的
    return g;
  };
  // 顏色：特殊環境的遺跡（征遠舊艦＝深海）也換成招牌景色的顏色
  const th0 = R.theme;
  R.theme = run => { const t = th0(run), s = sigOf(run), b = s && B[s]; if (!b || !(run.env || run.biome === s)) return t; return Object.assign({}, t, { floor: b.floor, wall: b.wall, top: b.top, light: b.light, fog: run.env === 'deep' ? '#0A161C' : b.fog, accent: b.accent }); };
  // 調色：ruinfx.js 照 run.biome 找色溫；特殊環境的遺跡讓它找招牌景色的
  // （ruinfx.js 的 gradeKey 先看 run.env：征遠舊艦是 deep，維持深海的青綠色溫，跟艙燈的暖黃形成冷暖對比）
  // ---------- 擺東西 ----------
  let G = null;
  const geo = () => G || (G = (() => { const TH = THREE, g = { box: new TH.BoxGeometry(1, 1, 1), cyl: new TH.CylinderGeometry(0.5, 0.5, 1, 8), cyl12: new TH.CylinderGeometry(0.5, 0.5, 1, 12), cone: new TH.ConeGeometry(0.5, 1, 7), sph: new TH.SphereGeometry(0.5, 8, 6), disc: new TH.CircleGeometry(0.5, 10), tor: new TH.TorusGeometry(0.5, 0.14, 5, 10), dod: new TH.DodecahedronGeometry(0.5, 0), oct: new TH.OctahedronGeometry(0.5, 0) }; Object.values(g).forEach(x => { x.userData.shared = true; }); return g; })());
  const mats = {};
  const lam = (c, em, ei) => { const k = c + (em || '') + (ei || ''); if (mats[k]) return mats[k]; const m = new THREE.MeshLambertMaterial({ color: c }); if (em) { m.emissive = new THREE.Color(em); m.emissiveIntensity = ei || 0.9; } m.userData.shared = true; return (mats[k] = m); };
  const PATCH = { factory: ['#24282E', '#2A2620'], tomb: ['#8E8676', '#9A9282'], roots: ['#2A4422', '#34522A'], ship: ['#1E3A44', '#22424C'] };
  const decorate = (run, F, key) => {
    if (!F || !F.group || !F.rooms || !R.Batch || !R.roomPoint) return;
    const g = geo(), Bt = R.Batch(), add = (gm, m, x, y, z, sx, sy, sz, rx, ry, rz) => Bt.add(gm, m, x, y, z, sx, sy, sz, rx || 0, ry || 0, rz || 0);
    const avoid = []; [F.stairs, F.up, F.save, F.warp, F.camp].concat(F.stairsAll || [], F.crystals || [], F.chests || []).forEach(o => { if (o && o.x != null) avoid.push([o.x, o.z]); });
    const free = (x, z) => avoid.every(([ax, az]) => Math.hypot(ax - x, az - z) > 3.2) && !(R.pointBlocked && R.pointBlocked(x, z));
    const block = (x, z, r) => { R.addBox(x - r, x + r, z - r, z + r, 'deco'); avoid.push([x, z]); };
    F.rooms.forEach(rm => {
      if (rm.type === 'puzzle' || rm.spec || rm.wingHall || (rm.type === 'start' && run.floor === 0)) return;
      const area = (rm.hx || 8) * (rm.hz || 8), n = Math.round(Math.min(24, area / 6)), fight = rm.type === 'boss' || rm.type === 'lord';
      // 地上一塊一塊的顏色（油漬、苔、積水）
      const pc = PATCH[key];
      if (pc) for (let i = 0; i < Math.round(area / 34); i++) { const [x, z] = R.roomPoint(rm, {}), m = lam(pick(pc)); for (let j = 0; j < 3; j++) { const s = 1.2 + rnd() * 1.4; add(g.disc, m, x + (rnd() - 0.5) * 2.2, 0.013 + (i * 3 + j) * 0.0015, z + (rnd() - 0.5) * 2.2, s * (0.8 + rnd() * 0.5), s, 1, -Math.PI / 2, 0, rnd() * 3); } }
      for (let i = 0; i < n; i++) {
        const [x, z] = R.roomPoint(rm, {}); if (!free(x, z)) continue;
        const s = 0.8 + rnd() * 0.5, k = fight ? 0.55 + rnd() * 0.45 : rnd(), a = rnd() * Math.PI;
        if (key === 'factory') {
          if (k < 0.2) {   // 機台：箱子＋發光的面板
            add(g.box, lam('#4A4E56'), x, 0.7 * s, z, 1.6 * s, 1.4 * s, 1.1 * s, 0, a, 0); add(g.box, lam('#2A2E34'), x, 1.45 * s, z, 1.7 * s, 0.1, 1.2 * s, 0, a, 0);
            add(g.box, lam('#1A2A30', pick(['#5AE8FF', '#FF5AB8']), 1.4), x + Math.sin(a + Math.PI / 2) * 0.56 * s, 0.9 * s, z + Math.cos(a + Math.PI / 2) * 0.56 * s, 0.7 * s, 0.35 * s, 0.04, 0, a, 0); block(x, z, 0.75 * s);
          } else if (k < 0.38) {   // 管線：橫的兩條，架子撐著
            const L = 2.6 + rnd() * 2; [-0.35, 0.35].forEach(o => add(g.cyl, lam(pick(['#7A5A44', '#6A6E76'])), x + Math.sin(a) * o, 0.9, z + Math.cos(a) * o, 0.28, L, 0.28, 0, a, Math.PI / 2));
            [-1, 1].forEach(e => add(g.box, lam('#3A3E44'), x + Math.cos(a) * e * L * 0.4, 0.45, z - Math.sin(a) * e * L * 0.4, 0.15, 0.9, 1.0, 0, a, 0));
          } else if (k < 0.52) {   // 大齒輪倒在地上
            add(g.tor, lam('#8A6A4A'), x, 0.16, z, 1.6 * s, 1.6 * s, 1.6 * s, Math.PI / 2, 0, 0); add(g.cyl12, lam('#6A5040'), x, 0.1, z, 0.9 * s, 0.2, 0.9 * s);
          } else if (k < 0.66) {   // 霓虹燈條：柱子上掛發光的直條（和式的字樣用顏色塊代替）
            add(g.box, lam('#2A2E34'), x, 1.3, z, 0.18, 2.6, 0.18); add(g.box, lam('#3A1A30', pick(['#FF5AB8', '#5AE8FF', '#FFD24A']), 1.6), x + 0.2, 1.7, z, 0.06, 1.3, 0.42, 0, a, 0); block(x, z, 0.2);
          } else if (k < 0.8) {   // 機械人的殘骸
            add(g.box, lam('#5A5E66'), x, 0.35, z, 0.9 * s, 0.7 * s, 0.6 * s, 0.3, a, 0.2); add(g.sph, lam('#4A4E56'), x + 0.5, 0.25, z + 0.3, 0.5, 0.45, 0.5); add(g.sph, lam('#1A1A1A', '#FF3A3A', 1.2), x + 0.62, 0.32, z + 0.48, 0.12, 0.12, 0.12);
            add(g.cyl, lam('#6A6E76'), x - 0.6, 0.12, z - 0.2, 0.14, 0.9, 0.14, 0, a, Math.PI / 2);
          } else if (k < 0.9) for (let j = 0; j < 3; j++) add(g.box, lam(pick(['#3A3E46', '#4A3E30'])), x + (rnd() - 0.5) * 1.4, 0.3 + j * 0.0, z + (rnd() - 0.5) * 1.4, 0.7, 0.6, 0.7, 0, rnd() * 3, 0);   // 零件箱
          else for (let j = 0; j < 4; j++) add(g.sph, lam('#FFB04A', '#FF8A2A', 1.4), x + (rnd() - 0.5) * 1.6, 0.3 + rnd() * 1.6, z + (rnd() - 0.5) * 1.6, 0.1, 0.1, 0.1);   // 火花
        } else if (key === 'tomb') {
          if (k < 0.22) {   // 石燈籠（裡面的火）
            add(g.box, lam('#C8C0AE'), x, 0.15, z, 0.8, 0.3, 0.8); add(g.cyl, lam('#BEB6A4'), x, 0.7, z, 0.28, 0.8, 0.28); add(g.box, lam('#D2CAB8'), x, 1.25, z, 0.7, 0.4, 0.7);
            add(g.box, lam('#3A2A1A', '#FFB060', 1.3), x, 1.25, z, 0.42, 0.24, 0.72); add(g.cone, lam('#BEB6A4'), x, 1.65, z, 1.0, 0.4, 1.0); block(x, z, 0.4);
          } else if (k < 0.4) {   // 金邊石棺
            add(g.box, lam('#CFC7B4'), x, 0.4, z, 2.0 * s, 0.8, 1.0 * s, 0, a, 0); add(g.box, lam('#D8C070'), x, 0.82, z, 2.06 * s, 0.06, 1.06 * s, 0, a, 0); add(g.box, lam('#E2DAC6'), x, 0.9, z, 1.9 * s, 0.12, 0.9 * s, 0, a, 0); block(x, z, 0.8 * s);
          } else if (k < 0.55) {   // 香爐：三腳鼎，炭火
            add(g.cyl12, lam('#8A6A3A'), x, 0.5, z, 0.9, 0.5, 0.9); add(g.cyl12, lam('#3A1A0A', '#FF7A2A', 1.2), x, 0.76, z, 0.75, 0.04, 0.75);
            for (let j = 0; j < 3; j++) { const t = j * 2.09; add(g.cyl, lam('#6A5030'), x + Math.cos(t) * 0.32, 0.15, z + Math.sin(t) * 0.32, 0.1, 0.3, 0.1); } block(x, z, 0.45);
          } else if (k < 0.7) {   // 金色的柱子（有的倒了）
            if (rnd() < 0.5) { add(g.cyl12, lam('#E2DAC6'), x, 1.4, z, 0.7, 2.8, 0.7); add(g.cyl12, lam('#D8C070'), x, 2.85, z, 0.86, 0.12, 0.86); add(g.cyl12, lam('#D8C070'), x, 0.06, z, 0.9, 0.12, 0.9); block(x, z, 0.4); }
            else add(g.cyl12, lam('#D6CEBA'), x, 0.35, z, 0.7, 2.4, 0.7, 0, a, Math.PI / 2);
          } else if (k < 0.85) for (let j = 0; j < 3; j++) add(g.box, lam(pick(['#C8C0AE', '#B4AC9A'])), x + (rnd() - 0.5) * 1.4, 0.15, z + (rnd() - 0.5) * 1.4, 0.5 + rnd() * 0.4, 0.3, 0.4 + rnd() * 0.3, 0, rnd() * 3, 0);   // 碎石
          else for (let j = 0; j < 3; j++) add(g.sph, lam('#FFE0A0', '#FFC060', 1.3), x + (rnd() - 0.5) * 1.4, 0.8 + rnd() * 1.2, z + (rnd() - 0.5) * 1.4, 0.1, 0.1, 0.1);   // 浮著的香火
        } else if (key === 'roots') {
          if (k < 0.3) {   // 粗根拱起來（三段）
            const L = 3 + rnd() * 2, c = pick(['#4A3624', '#3E2E1E', '#56402A']);
            add(g.cyl, lam(c), x, 0.55, z, 0.6 * s, L, 0.6 * s, 0, a, Math.PI / 2 - 0.35); add(g.cyl, lam(c), x + Math.cos(a) * L * 0.42, 0.25, z - Math.sin(a) * L * 0.42, 0.5 * s, L * 0.6, 0.5 * s, 0, a, Math.PI / 2 + 0.3);
            add(g.sph, lam('#3A5A2A'), x, 1.05, z, 0.9, 0.35, 0.9); block(x, z, 0.5);
          } else if (k < 0.45) {   // 大根柱（從地面竄上來）
            add(g.cyl, lam('#4A3624'), x, 1.5, z, 1.1 * s, 3, 1.1 * s); add(g.cone, lam('#3E2E1E'), x, 3.2, z, 1.5 * s, 0.8, 1.5 * s); add(g.sph, lam('#3A6A30'), x + 0.3, 2.2, z, 1.0, 0.6, 1.0); block(x, z, 0.6 * s);
          } else if (k < 0.6) for (let j = 0; j < 4; j++) { const xx = x + (rnd() - 0.5) * 1.4, zz = z + (rnd() - 0.5) * 1.4, h = 0.2 + rnd() * 0.35; add(g.cyl, lam('#D8D0B0'), xx, h / 2, zz, 0.1, h, 0.1); add(g.sph, lam('#B8F07A', '#7AE03A', 1.1), xx, h + 0.05, zz, 0.55, 0.24, 0.55); }   // 發光蘑菇
          else if (k < 0.72) {   // 刻著精靈紋的石頭
            add(g.box, lam('#5A5A4E'), x, 0.6, z, 0.9, 1.2, 0.4, 0, a, 0); add(g.box, lam('#1A2A1A', '#9AE07A', 1.3), x + Math.sin(a) * 0.21, 0.7, z + Math.cos(a) * 0.21, 0.5, 0.7, 0.02, 0, a, 0); block(x, z, 0.4);
          } else if (k < 0.86) for (let j = 0; j < 5; j++) add(g.cone, lam(pick(['#3A6A30', '#4A7A3A', '#2E5A28'])), x + (rnd() - 0.5) * 1.6, 0.35, z + (rnd() - 0.5) * 1.6, 0.4, 0.7, 0.4, (rnd() - 0.5) * 0.5, 0, (rnd() - 0.5) * 0.5);   // 蕨類
          else for (let j = 0; j < 4; j++) add(g.sph, lam('#E8F87A', '#C8F04A', 1.4), x + (rnd() - 0.5) * 2, 0.7 + rnd() * 1.6, z + (rnd() - 0.5) * 2, 0.12, 0.12, 0.12);   // 螢火
        } else if (key === 'ship') {
          if (k < 0.18) {   // 砲彈箱
            for (let j = 0; j < 2; j++) add(g.box, lam('#4A5A3A'), x + j * 0.95 - 0.45, 0.4, z, 0.9, 0.8, 0.7, 0, a, 0); add(g.box, lam('#C8A040'), x, 0.82, z, 1.9, 0.05, 0.1, 0, a, 0); block(x, z, 0.7);
          } else if (k < 0.32) {   // 管線（沿著地面）
            const L = 2.4 + rnd() * 2; add(g.cyl, lam('#6A6E76'), x, 0.25, z, 0.3, L, 0.3, 0, a, Math.PI / 2); add(g.cyl12, lam('#8A2A2A'), x, 0.25, z, 0.5, 0.2, 0.5, 0, a, Math.PI / 2);
          } else if (k < 0.44) {   // 砲塔座（大的、擋路）
            if (!fight) { add(g.cyl12, lam('#555A62'), x, 0.6, z, 2.4, 1.2, 2.4); add(g.cyl12, lam('#3A3E44'), x, 1.25, z, 2.0, 0.1, 2.0); add(g.cyl, lam('#4A4E54'), x + Math.cos(a) * 1.6, 0.95, z - Math.sin(a) * 1.6, 0.36, 2.4, 0.36, 0, a, Math.PI / 2); block(x, z, 1.2); }
          } else if (k < 0.56) {   // 艙門（立著的、紅色把手）
            add(g.box, lam('#4E5258'), x, 1.0, z, 1.2, 2.0, 0.16, 0, a, 0); add(g.box, lam('#8A2A2A'), x + Math.sin(a) * 0.1, 1.0, z + Math.cos(a) * 0.1, 0.46, 0.08, 0.05, 0, a, 0); add(g.box, lam('#8A2A2A'), x + Math.sin(a) * 0.1, 1.0, z + Math.cos(a) * 0.1, 0.08, 0.46, 0.05, 0, a, 0); block(x, z, 0.4);
          } else if (k < 0.68) {   // 艙燈（暖黃，掛在柱子上）
            add(g.box, lam('#3A3E44'), x, 1.2, z, 0.16, 2.4, 0.16); add(g.box, lam('#2A2010', '#FFD08A', 1.6), x, 2.1, z, 0.34, 0.24, 0.34); block(x, z, 0.2);
          } else if (k < 0.82) for (let j = 0; j < 3; j++) add(g.box, lam(pick(['#4A4E54', '#555A62'])), x + (rnd() - 0.5) * 1.6, 0.06, z + (rnd() - 0.5) * 1.6, 0.9 + rnd() * 0.6, 0.12, 0.6 + rnd() * 0.4, 0, rnd() * 3, 0);   // 掉下來的鋼板
          else { add(g.tor, lam('#5A5E66'), x, 0.1, z, 0.7, 0.7, 0.7, Math.PI / 2, 0, 0); add(g.tor, lam('#5A5E66'), x + 0.5, 0.1, z + 0.2, 0.7, 0.7, 0.7, Math.PI / 2, 0, 0.6); add(g.tor, lam('#5A5E66'), x + 1.0, 0.1, z + 0.1, 0.7, 0.7, 0.7, Math.PI / 2, 0, 0); }   // 鐵鍊
        }
      }
    });
    Bt.flush(F.group);
  };
})(window.R);
