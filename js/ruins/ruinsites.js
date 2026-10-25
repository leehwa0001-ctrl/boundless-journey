// 每座城附近的遺跡各有自己的樣子（2026-10-20 作者：各城市的遺跡特色要更能區分開來；照《昭旭重要城市》的設定）
// 原本遺跡的外觀只看分級、特殊環境，和共用的六種景色（biome.js）——同分級、沒有特殊環境的遺跡看起來幾乎一樣。
// 這裡給遺跡「招牌景色」：自己的牆和地面顏色、光、霧、擺設、調色（ruinfx.js 的 GRADE）；前三段都是招牌景色，越深才混進共用的洞窟、晶洞、岩漿海。
// 第一批：
// - 吉山近郊・工廠遺跡（吉山：賽博＋和式的第一大工業城）→ 鏽鐵工廠：管線、齒輪、機械殘骸、霓虹燈條、火花；冷青色的光和粉紅霓虹。
// - 皇嶺北麓・陵墓遺跡（皇嶺：山嶺都城、皇室）→ 皇家陵墓：白石、石燈籠、金邊石棺、香爐的火光、金色的柱子。
// - 古森・樹根迷宮（古森：大古森木、古森精靈部落）→ 大古森木的根盤成拱、苔、發光蘑菇、螢火、刻著精靈紋的石頭。
// - 征遠・舊艦遺址（征遠：海軍重鎮；擱淺的是武聖號的姊妹艦武德號——武聖號照設定「再次下海」，沒有沉）→ 戰列艦內部：鋼板、鉚釘、管線、艙門、砲彈箱、砲塔座、積水、暖黃的艙燈。
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
    ship: { n: '武德號的船艙', d: '鉚釘鋼板的艙壁，水從縫裡滲進來。', floor: '#363A40', wall: '#464A52', top: '#666A72', light: '#FFD08A', fog: '#0C0E12', accent: '#C8323A', deco: 'ship', fav: FAV }
  });
  // 第二批（2026-10-20 作者：照《昭旭重要城市》一次做完剩下的城市，遺跡沒有差很多的話再區分開）
  Object.assign(B, {
    barracks: { n: '舊兵營', d: '水泥的營舍、沙包和彈藥箱，探照燈還亮著一盞。', floor: '#4A4E44', wall: '#5E6456', top: '#7A806E', light: '#E8F0FF', fog: '#14160F', accent: '#C8A040', deco: 'barracks', fav: FAV },
    bombed: { n: '轟炸過的城區', d: '紅磚的殖民地商館街，到處是彈坑和燒黑的樑。', floor: '#5A4A40', wall: '#8A4A3A', top: '#A8705A', light: '#FFB070', fog: '#1E140E', accent: '#FF8A3A', deco: 'bombed', fav: FAV },
    sunken: { n: '沉沒的港', d: '淹在水裡的紅磚拱廊，海藻和發光的水母。', floor: '#2E4A4A', wall: '#4A5A58', top: '#6A7A76', light: '#8AE8FF', fog: '#061418', accent: '#FF8AD8', deco: 'sunken', fav: FAV },
    fogdock: { n: '霧港倉庫', d: '貨櫃堆成迷宮，霧燈在濃霧裡一盞一盞。', floor: '#3A3C3E', wall: '#4A4E52', top: '#6A6E72', light: '#FFE0A0', fog: '#4A5258', accent: '#E8A03A', deco: 'fogdock', fav: FAV },
    eddy: { n: '渦流灣', d: '漁網、浮標、銀色的魚鱗，地上一圈一圈的渦紋。', floor: '#6A8A86', wall: '#7A9A96', top: '#9ABAB4', light: '#E8F8FF', fog: '#2A4A54', accent: '#E8F0F8', deco: 'eddy', fav: FAV },
    bridgepier: { n: '大橋的橋墩', d: '巨大的水泥橋墩和鋼樑，牆上有霓虹的塗鴉。', floor: '#4A4C50', wall: '#6A6C70', top: '#8A8C90', light: '#A8C8FF', fog: '#0E1016', accent: '#FF4A9A', deco: 'bridgepier', fav: FAV },
    ofuda: { n: '封印的碉堡', d: '碉堡和壕溝上貼滿了妖物寺的封印札，紅燈籠一晃一晃。', floor: '#4A4438', wall: '#5A5446', top: '#7A7260', light: '#FF6A4A', fog: '#140C08', accent: '#F4ECD8', deco: 'ofuda', fav: FAV },
    minetomb: { n: '礦山陵墓', d: '礦道的木頭支架、軌道和礦車，礦脈裡的晶石泛著冷光。', floor: '#4A4A50', wall: '#5A5A62', top: '#7A7A84', light: '#FFC870', fog: '#0C0E14', accent: '#7AE8FF', deco: 'minetomb', fav: FAV }
  });
  // 遺跡 → 招牌景色
  const SIG = { 'js-factory': 'factory', hokuroku: 'tomb', 'gs-root': 'roots', 'zy-wreck': 'ship', 'ft-camp': 'barracks', seigan: 'bombed', 'xj-under': 'sunken', 'nl-fog': 'fogdock', 'wq-eddy': 'eddy', 'bb-bridge': 'bridgepier', 'bn-army': 'ofuda', 'yb-mine': 'minetomb' };
  R.RUIN_SIG = SIG;
  if (R.RUIN_GRADE) Object.assign(R.RUIN_GRADE, {
    factory: { tint: [0.9, 1.0, 1.1], lift: [0.01, 0.02, 0.035], sat: 1.12, expo: 1.0, bloom: 0.62, th: 0.82 },
    tomb: { tint: [1.06, 1.0, 0.9], lift: [0.03, 0.022, 0.01], sat: 0.98, expo: 0.92, bloom: 0.5, th: 0.86 },
    roots: { tint: [0.93, 1.06, 0.9], lift: [0.008, 0.02, 0.01], sat: 1.08, expo: 1.0, bloom: 0.58, th: 0.8 },
    ship: { tint: [1.04, 0.99, 0.92], lift: [0.012, 0.016, 0.022], sat: 1.0, expo: 1.0, bloom: 0.55, th: 0.84 },
    barracks: { tint: [0.96, 1.0, 0.98], lift: [0.012, 0.016, 0.012], sat: 0.86, expo: 1.0, bloom: 0.5, th: 0.86 },
    bombed: { tint: [1.1, 0.96, 0.86], lift: [0.03, 0.016, 0.008], sat: 1.02, expo: 0.98, bloom: 0.6, th: 0.82 },
    sunken: { tint: [0.84, 1.0, 1.1], lift: [0.0, 0.02, 0.035], sat: 1.12, expo: 1.0, bloom: 0.68, th: 0.78, force: 1 },
    fogdock: { tint: [0.98, 0.98, 1.0], lift: [0.05, 0.05, 0.055], sat: 0.8, expo: 1.0, bloom: 0.6, th: 0.8, force: 1 },
    eddy: { tint: [0.92, 1.02, 1.08], lift: [0.01, 0.022, 0.03], sat: 1.06, expo: 1.04, bloom: 0.62, th: 0.8, force: 1 },
    bridgepier: { tint: [0.9, 0.96, 1.1], lift: [0.012, 0.014, 0.03], sat: 1.1, expo: 1.0, bloom: 0.64, th: 0.8 },
    ofuda: { tint: [1.1, 0.92, 0.88], lift: [0.03, 0.01, 0.008], sat: 1.0, expo: 0.94, bloom: 0.62, th: 0.8 },
    minetomb: { tint: [1.04, 0.98, 0.94], lift: [0.012, 0.016, 0.026], sat: 0.96, expo: 1.0, bloom: 0.6, th: 0.8, force: 1 }
  });
  const sigOf = run => (run && run.site && SIG[run.site.id]) || null;
  // ---------- 景色順序：前三段招牌景色 ----------
  const lf0 = R.loadFloor;
  R.loadFloor = (f, o) => {
    const run = W().run, s = sigOf(run);
    if (run && s && !run.env && !run.biomeOrder) run.biomeOrder = [s, s, s, 'cave', 'crystal', 'lava'];
    const r = lf0(f, o);
    try { if (run && s && (run.biome === s || run.env)) { decorate(run, W().F, s); floorSkin(W().F, s); } } catch (e) { console.warn('[ruinsites]', e); }
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
  R.theme = run => { const t = th0(run), s = sigOf(run), b = s && B[s]; if (!b || !(run.env || run.biome === s)) return t; return Object.assign({}, t, { floor: b.floor, wall: b.wall, top: b.top, light: b.light, fog: run.env === 'deep' && s === 'ship' ? '#0A161C' : b.fog, accent: b.accent }); };   // 第二批的深海遺跡（水下迷宮、霧港、渦流灣）用自己的霧色
  // 調色：ruinfx.js 照 run.biome 找色溫；特殊環境的遺跡讓它找招牌景色的
  // （ruinfx.js 的 gradeKey 先看 run.env：征遠舊艦是 deep，維持深海的青綠色溫，跟艙燈的暖黃形成冷暖對比）
  // ---------- 地面的花樣（像素版才有；照 sprites.js 的 R.worldUV 照世界座標貼，一個點陣像素＝1/12 公尺） ----------
  // factory：鐵格板——兩公尺一塊的鋼板，有的是一條一條的格柵（縫是黑的）、有的是止滑紋鋼板，邊框、鉚釘、鏽斑
  const SKIN = {};
  const skinTex = key => {
    if (SKIN[key]) return SKIN[key];
    const S = 48, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), img = x.createImageData(S, S);
    let sd = 7; const sr = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    const P = (px, py, v, r) => { const i = (py * S + px) * 4; img.data[i] = Math.min(255, v * (r || 1)); img.data[i + 1] = Math.min(255, v * (r ? 0.86 : 1)); img.data[i + 2] = Math.min(255, v * (r ? 0.72 : 1)); img.data[i + 3] = 255; };
    if (key === 'factory') {
      for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) {
        const bx = Math.floor(px / 24), by = Math.floor(py / 24), u = px % 24, w = py % 24, grate = (bx + by) % 2 === 0;
        let v;
        if (u === 0 || w === 0) v = 96; else if (u === 1 || w === 1) v = 226; else if (u === 23 || w === 23) v = 150;   // 邊框：暗縫、亮邊、暗邊
        else if ((u === 3 || u === 20) && (w === 3 || w === 20)) v = 236;   // 鉚釘
        else if (grate) v = (bx ? u : w) % 3 === 0 ? 70 : (w % 8 === 4 && !bx) || (u % 8 === 4 && bx) ? 150 : 205 + (sr() - 0.5) * 10;   // 格柵：一條一條，黑縫
        else v = ((u + w) % 6 === 0 && (u - w + 48) % 6 === 3) || ((u + w) % 6 === 3 && (u - w + 48) % 6 === 0) ? 228 : 186 + (sr() - 0.5) * 12;   // 止滑紋
        P(px, py, v, sr() < 0.035 && v > 120 ? 1.25 : 0);   // 零星鏽斑
      }
    }
    x.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.LinearEncoding; t.userData.shared = true;
    return (SKIN[key] = t);
  };
  const SKIN_FLOOR = { factory: '#666E78' };   // 貼了花樣以後地板的底色（花樣本身偏暗，底色要亮一點）
  const floorSkin = (F, key) => {
    if (!SKIN_FLOOR[key] || !F || !F.group || !R.worldUV || !R.pixTex || !(R.pixelOn && R.pixelOn())) return;
    const ft = R.pixTex('floor'), fm = F.group.children.find(o => o.isInstancedMesh && o.material && o.material.map === ft); if (!fm) return;
    const m = R.worldUV(new THREE.MeshLambertMaterial({ map: skinTex(key) }), 48); m.userData.shared = true; fm.material = m;
    const c = new THREE.Color(), base = new THREE.Color(SKIN_FLOOR[key]);
    if (fm.instanceColor) { for (let i = 0; i < fm.count; i++) { fm.getColorAt(i, c); c.lerp(base, 0.8); fm.setColorAt(i, c); } fm.instanceColor.needsUpdate = true; }
  };
  // ---------- 擺東西 ----------
  let G = null;
  const geo = () => G || (G = (() => { const TH = THREE, g = { box: new TH.BoxGeometry(1, 1, 1), cyl: new TH.CylinderGeometry(0.5, 0.5, 1, 8), cyl12: new TH.CylinderGeometry(0.5, 0.5, 1, 12), cone: new TH.ConeGeometry(0.5, 1, 7), sph: new TH.SphereGeometry(0.5, 8, 6), disc: new TH.CircleGeometry(0.5, 10), tor: new TH.TorusGeometry(0.5, 0.14, 5, 10), dod: new TH.DodecahedronGeometry(0.5, 0), oct: new TH.OctahedronGeometry(0.5, 0) }; Object.values(g).forEach(x => { x.userData.shared = true; }); return g; })());
  const mats = {};
  const lam = (c, em, ei) => { const k = c + (em || '') + (ei || ''); if (mats[k]) return mats[k]; const m = new THREE.MeshLambertMaterial({ color: c }); if (em) { m.emissive = new THREE.Color(em); m.emissiveIntensity = ei || 0.9; } m.userData.shared = true; return (mats[k] = m); };
  const PATCH = { factory: ['#24282E', '#2A2620'], tomb: ['#8E8676', '#9A9282'], roots: ['#2A4422', '#34522A'], ship: ['#1E3A44', '#22424C'], barracks: ['#3A3E36', '#44483C'], bombed: ['#2A2420', '#3A2A22'], sunken: ['#2A5A52', '#245048'], fogdock: ['#2A3438', '#30383C'], eddy: ['#5A7A70', '#4A6A66'], bridgepier: ['#3A3C40', '#2E3034'], ofuda: ['#3A3428', '#2E2A22'], minetomb: ['#3A3A40', '#44444A'] };
  // 第二批景色的擺設：k（0～1）決定擺哪一種；戰鬥房（fight）k 只會落在 0.55 以上＝不擋路的那幾種放後面
  const sandbag = (o, x, z, n, a) => { for (let j = 0; j < n; j++) o.add(o.g.sph, o.lam('#A8946A'), x + Math.cos(a) * (j - n / 2) * 0.7, 0.22 + (j % 2) * 0.3, z - Math.sin(a) * (j - n / 2) * 0.7, 0.8, 0.36, 0.5, 0, a, 0); };
  const DECO2 = {
    barracks: o => { const { add, g, lam, x, z, s, k, a, block, rnd } = o;
      if (k < 0.2) { sandbag(o, x, z, 5, a); sandbag(o, x + 0.1, z, 4, a); block(x, z, 1.2); }
      else if (k < 0.36) { [0, 0.9].forEach(y => add(g.box, lam('#6A6E62'), x, 0.5 + y, z, 2.0, 0.08, 0.9, 0, a, 0)); [[-0.95, -0.4], [0.95, -0.4], [-0.95, 0.4], [0.95, 0.4]].forEach(([u, v]) => add(g.box, lam('#4A4E44'), x + Math.cos(a) * u + Math.sin(a) * v, 0.75, z - Math.sin(a) * u + Math.cos(a) * v, 0.06, 1.5, 0.06, 0, a, 0)); block(x, z, 0.9); }   // 上下舖
      else if (k < 0.5) { for (let j = 0; j < 3; j++) add(g.box, lam('#4A5A3A'), x + (rnd() - 0.5) * 1.2, 0.3 + (j === 2 ? 0.6 : 0), z + (rnd() - 0.5) * 0.6, 1.0, 0.6, 0.6, 0, a, 0); block(x, z, 0.7); }   // 彈藥箱
      else if (k < 0.62) { add(g.cyl, lam('#3A3E36'), x, 0.8, z, 0.12, 1.6, 0.12); add(g.cyl12, lam('#2A2A2A', '#F4F8FF', 1.8), x, 1.7, z, 0.7, 0.4, 0.7, 0.6, a, 0); block(x, z, 0.3); }   // 探照燈
      else if (k < 0.8) for (let j = 0; j < 3; j++) add(g.tor, lam('#6A6A66'), x + j * 0.8 - 0.8, 0.35, z, 0.8, 0.8, 0.8, 0, a, 0);   // 鐵絲網
      else add(g.sph, lam('#4A5A3A'), x, 0.12, z, 0.5, 0.3, 0.5); },   // 掉在地上的頭盔
    bombed: o => { const { add, g, lam, x, z, s, k, a, block, rnd, pick } = o;
      if (k < 0.24) { for (let j = 0; j < 7; j++) add(g.box, lam(pick(['#8A4A3A', '#7A3E30', '#A0583E'])), x + (rnd() - 0.5) * 1.8, 0.15 + rnd() * 0.4, z + (rnd() - 0.5) * 1.8, 0.5, 0.22, 0.3, rnd(), rnd() * 3, rnd()); block(x, z, 0.8); }   // 紅磚瓦礫
      else if (k < 0.4) { add(g.cyl12, lam('#E8E0D0'), x, 1.1 * s, z, 0.6, 2.2 * s, 0.6); add(g.box, lam('#D8D0C0'), x, 0.1, z, 1.0, 0.2, 1.0); block(x, z, 0.45); }   // 斷掉的白柱
      else if (k < 0.52) { add(g.box, lam('#1A1410'), x, 0.5, z, 0.35, 0.35, 3.2, 0.5, a, 0.2); add(g.box, lam('#1A1410'), x + 0.6, 0.25, z + 0.3, 0.3, 0.3, 2.4, 0.2, a + 0.8, 0); }   // 燒黑的樑
      else if (k < 0.7) { add(g.disc, lam('#1E1814'), x, 0.016, z, 2.4 * s, 2.4 * s, 1, -Math.PI / 2, 0, 0); for (let j = 0; j < 8; j++) { const t = j / 8 * 6.28; add(g.box, lam('#5A4A40'), x + Math.cos(t) * 1.3 * s, 0.1, z + Math.sin(t) * 1.3 * s, 0.5, 0.2, 0.3, 0, -t, 0); } }   // 彈坑
      else if (k < 0.84) for (let j = 0; j < 4; j++) add(g.sph, lam('#FF8A3A', '#FF5A1A', 1.6), x + (rnd() - 0.5) * 1.2, 0.08, z + (rnd() - 0.5) * 1.2, 0.18, 0.1, 0.18);   // 還在燒的餘燼
      else add(g.box, lam('#C8B898'), x, 0.04, z, 0.6, 0.02, 0.8, 0, rnd() * 3, 0); },   // 地上的舊報紙
    sunken: o => { const { add, g, lam, x, z, s, k, a, block, rnd } = o;
      if (k < 0.2) { [-1, 1].forEach(sd => add(g.box, lam('#6A4A3E'), x + Math.cos(a) * sd * 1.2, 1.2, z - Math.sin(a) * sd * 1.2, 0.5, 2.4, 0.5, 0, a, 0)); add(g.tor, lam('#6A4A3E'), x, 2.4, z, 1.2, 1.2, 1.0, 0, a, 0); add(g.cone, lam('#2E6A4A'), x, 1.4, z, 0.3, 2.6, 0.3); block(x, z, 1.3); }   // 淹掉的紅磚拱
      else if (k < 0.34) { add(g.cyl, lam('#4A4E54'), x, 1.0, z, 0.18, 2.0, 0.18); add(g.box, lam('#4A4E54'), x, 0.25, z, 1.6, 0.18, 0.18, 0, a, 0); add(g.tor, lam('#4A4E54'), x, 2.0, z, 0.4, 0.4, 0.4, Math.PI / 2, a, 0); block(x, z, 0.4); }   // 錨
      else if (k < 0.48) { add(g.cyl12, lam('#5A4A3A'), x, 0.5, z, 0.8, 1.0, 0.8); for (let j = 0; j < 5; j++) add(g.sph, lam('#D8D0C0'), x + (rnd() - 0.5) * 0.8, 0.3 + rnd() * 0.6, z + 0.4, 0.14, 0.14, 0.14); block(x, z, 0.45); }   // 長滿藤壺的桶子
      else if (k < 0.7) for (let j = 0; j < 3; j++) { const xx = x + (rnd() - 0.5) * 2, zz = z + (rnd() - 0.5) * 2, c = rnd() < 0.5 ? '#FF8AD8' : '#8AE8FF'; add(g.sph, lam(c, c, 1.6), xx, 1.4 + rnd(), zz, 0.5, 0.35, 0.5); for (let t = 0; t < 3; t++) add(g.cyl, lam(c, c, 0.8), xx + (t - 1) * 0.15, 1.0, zz, 0.03, 0.7, 0.03); }   // 發光的水母
      else for (let j = 0; j < 4; j++) add(g.cone, lam('#2E6A4A'), x + (rnd() - 0.5) * 1.4, 0.9, z + (rnd() - 0.5) * 1.4, 0.25, 1.8 + rnd(), 0.25, (rnd() - 0.5) * 0.3, 0, (rnd() - 0.5) * 0.3); },   // 海藻
    fogdock: o => { const { add, g, lam, x, z, s, k, a, fight, block, rnd, pick } = o;
      if (k < 0.24) { if (!fight) { add(g.box, lam(pick(['#2E5A8A', '#8A2A2A', '#3A6A4A', '#C88A2A'])), x, 1.3, z, 6, 2.6, 2.5, 0, a, 0); block(x, z, 1.6); } }   // 貨櫃
      else if (k < 0.4) { for (let j = 0; j < 3; j++) add(g.box, lam('#8A6A4A'), x + (j % 2) * 0.9, 0.45 + (j === 2 ? 0.9 : 0), z, 0.9, 0.9, 0.9, 0, a, 0); block(x, z, 0.8); }   // 木箱
      else if (k < 0.55) { add(g.box, lam('#6A4A30'), x, 0.08, z, 1.4, 0.16, 1.2, 0, a, 0); add(g.box, lam('#6A4A30'), x, 0.24, z, 1.4, 0.16, 1.2, 0, a + 0.1, 0); }   // 棧板
      else if (k < 0.72) { add(g.cyl, lam('#3A3A3A'), x, 1.3, z, 0.12, 2.6, 0.12); add(g.sph, lam('#2A2010', '#FFE0A0', 2), x, 2.7, z, 0.5, 0.5, 0.5); block(x, z, 0.2); }   // 霧燈
      else if (k < 0.86) { add(g.cyl, lam('#5A5A5A'), x, 2.2, z, 0.05, 1.6, 0.05); add(g.tor, lam('#6A6A6A'), x, 1.3, z, 0.4, 0.4, 0.4, 0, a, 0); }   // 吊鉤
      else add(g.disc, lam('#1A2A30'), x, 0.017, z, 1.8, 1.4, 1, -Math.PI / 2, 0, rnd()); },   // 積水
    eddy: o => { const { add, g, lam, x, z, s, k, a, block, rnd, pick } = o;
      if (k < 0.2) { add(g.sph, lam('#2E4A3A'), x, 0.3, z, 1.8, 0.6, 1.4); for (let j = 0; j < 4; j++) add(g.sph, lam('#E8E4DC'), x + (rnd() - 0.5) * 1.4, 0.55, z + (rnd() - 0.5), 0.2, 0.16, 0.2); block(x, z, 0.8); }   // 一堆漁網、浮子
      else if (k < 0.34) { for (let j = 0; j < 3; j++) add(g.box, lam(pick(['#2A5A9A', '#E8E4DC', '#E8782A'])), x + (j % 2) * 1.0, 0.25 + Math.floor(j / 2) * 0.5, z, 1.0, 0.5, 0.7, 0, a, 0); block(x, z, 0.7); }   // 魚箱
      else if (k < 0.5) { add(g.sph, lam('#E83A2A'), x, 0.5, z, 0.8, 0.8, 0.8); add(g.cyl, lam('#E8E4DC'), x, 0.5, z, 0.82, 0.2, 0.82); add(g.cyl, lam('#4A4A4A'), x, 1.2, z, 0.06, 0.8, 0.06); block(x, z, 0.4); }   // 浮標
      else if (k < 0.66) for (let j = 0; j < 5; j++) add(g.cone, lam('#E8F0F8', '#A8C8E8', 1.2), x + (rnd() - 0.5) * 2, 0.12, z + (rnd() - 0.5) * 2, 0.15, 0.6, 0.1, 0, rnd() * 3, Math.PI / 2);   // 銀色的魚
      else if (k < 0.82) { const c = pick(['#FF7A8A', '#FF9A5A', '#E87AE0']); for (let j = 0; j < 5; j++) add(g.cone, lam(c), x + (rnd() - 0.5) * 0.9, 0.4, z + (rnd() - 0.5) * 0.9, 0.2, 0.8 + rnd() * 0.6, 0.2, (rnd() - 0.5) * 0.6, 0, (rnd() - 0.5) * 0.6); }   // 南方的珊瑚（往納瓦的海）
      else for (let j = 0; j < 3; j++) add(g.tor, lam('#3A5A66'), x, 0.02, z, 0.8 + j * 0.7, 0.8 + j * 0.7, 0.3, Math.PI / 2, 0, 0); },   // 地上的渦紋
    bridgepier: o => { const { add, g, lam, x, z, s, k, a, fight, block, rnd, pick } = o;
      if (k < 0.2) { if (!fight) { add(g.box, lam('#7A7C80'), x, 2.5, z, 2.6, 5, 2.6); add(g.box, lam('#5A5C60'), x, 5.1, z, 3.2, 0.3, 3.2); block(x, z, 1.4); } }   // 橋墩的柱
      else if (k < 0.36) { add(g.box, lam('#5A6068'), x, 0.25, z, 4, 0.12, 0.8, 0, a, 0); add(g.box, lam('#5A6068'), x, 0.6, z, 4, 0.7, 0.12, 0, a, 0); add(g.box, lam('#5A6068'), x, 0.95, z, 4, 0.12, 0.8, 0, a, 0); block(x, z, 1.0); }   // 倒下的工字鋼
      else if (k < 0.5) { add(g.cyl12, lam('#6A4A30'), x, 0.6, z, 1.2, 0.2, 1.2, Math.PI / 2, a, 0); add(g.cyl12, lam('#3A3A3A'), x, 0.6, z, 0.9, 0.9, 0.9, Math.PI / 2, a, 0); block(x, z, 0.6); }   // 電纜捲
      else if (k < 0.68) { add(g.box, lam('#1A1A20', pick(['#FF4A9A', '#4AE8FF', '#C86AFF']), 1.6), x, 1.0, z, 1.6, 0.6, 0.06, 0, a, 0); add(g.box, lam('#3A3C40'), x, 0.5, z - 0.06, 1.8, 1.0, 0.08, 0, a, 0); }   // 霓虹塗鴉的板子
      else if (k < 0.84) for (let j = 0; j < 3; j++) add(g.cone, lam('#E8782A'), x + (rnd() - 0.5) * 1.4, 0.35, z + (rnd() - 0.5) * 1.4, 0.4, 0.7, 0.4);   // 三角錐
      else add(g.box, lam('#6A6C70'), x, 0.04, z, 1.2, 0.08, 1.2, 0, rnd() * 3, 0); },   // 鉚釘的鋼板
    ofuda: o => { const { add, g, lam, x, z, s, k, a, block, rnd } = o;
      if (k < 0.2) { sandbag(o, x, z, 4, a); add(g.box, lam('#6A6658'), x, 0.8, z + 0.6, 2.4, 1.6, 0.4, 0, a, 0); for (let j = 0; j < 5; j++) add(g.box, lam('#F4ECD8', '#FF4A3A', 0.7), x + (j - 2) * 0.46, 1.0, z + 0.82, 0.32, 0.9, 0.03, 0, a, 0); block(x, z, 1.2); }   // 貼了札的碉堡牆
      else if (k < 0.36) { add(g.box, lam('#3A2A2A'), x, 1.6, z, 0.2, 3.2, 0.2); add(g.box, lam('#D8C8A0'), x, 2.9, z, 2.4, 0.22, 0.22, 0, a, 0); for (let j = 0; j < 4; j++) add(g.box, lam('#F4F0E4'), x + Math.cos(a) * (j - 1.5) * 0.5, 2.5, z - Math.sin(a) * (j - 1.5) * 0.5, 0.16, 0.5, 0.02, 0, a, 0); block(x, z, 0.3); }   // 注連繩
      else if (k < 0.52) { add(g.cyl, lam('#3A2A2A'), x, 0.9, z, 0.1, 1.8, 0.1); add(g.sph, lam('#E8503A', '#FF4A2A', 1.6), x, 1.9, z, 0.5, 0.65, 0.5); block(x, z, 0.3); }   // 紅燈籠
      else if (k < 0.66) { add(g.box, lam('#8A867A'), x, 0.3, z, 0.7, 0.6, 0.7); add(g.cyl, lam('#8A867A'), x, 0.85, z, 0.25, 0.5, 0.25); add(g.box, lam('#3A2010', '#FF8A4A', 1.2), x, 1.3, z, 0.5, 0.4, 0.5); add(g.cone, lam('#8A867A'), x, 1.7, z, 0.9, 0.35, 0.9); block(x, z, 0.4); }   // 石燈籠
      else if (k < 0.84) for (let j = 0; j < 8; j++) add(g.box, lam('#F4ECD8', '#FF4A3A', 0.8), x + (rnd() - 0.5) * 2.2, 0.02, z + (rnd() - 0.5) * 2.2, 0.36, 0.01, 0.9, 0, rnd() * 3, 0);   // 掉在地上的札
      else add(g.disc, lam('#1A1410'), x, 0.016, z, 1.6, 0.8, 1, -Math.PI / 2, 0, a); },   // 壕溝的影子
    minetomb: o => { const { add, g, lam, x, z, s, k, a, fight, block, rnd } = o;
      if (k < 0.2) { [-1, 1].forEach(sd => add(g.box, lam('#5A4030'), x + Math.cos(a) * sd * 1.3, 1.5, z - Math.sin(a) * sd * 1.3, 0.3, 3, 0.3, 0, a, 0)); add(g.box, lam('#5A4030'), x, 3.0, z, 3.0, 0.3, 0.3, 0, a, 0); add(g.box, lam('#2A2010', '#FFC870', 1.6), x, 2.6, z, 0.3, 0.36, 0.3); block(x, z, 1.4); }   // 木頭支架＋礦燈
      else if (k < 0.36) { const L = 4; [-0.45, 0.45].forEach(o2 => add(g.box, lam('#6A6A70'), x + Math.sin(a) * o2, 0.06, z + Math.cos(a) * o2, L, 0.08, 0.08, 0, a, 0)); for (let j = -1.5; j <= 1.5; j += 0.75) add(g.box, lam('#4A3828'), x + Math.cos(a) * j, 0.03, z - Math.sin(a) * j, 0.2, 0.06, 1.2, 0, a, 0); }   // 軌道
      else if (k < 0.5) { if (!fight) { add(g.box, lam('#5A5E66'), x, 0.6, z, 1.4, 0.8, 1.0, 0, a, 0); for (let j = 0; j < 4; j++) add(g.dod, lam('#6A6460'), x + (rnd() - 0.5) * 0.9, 1.1, z + (rnd() - 0.5) * 0.6, 0.35, 0.35, 0.35); block(x, z, 0.8); } }   // 礦車
      else if (k < 0.68) { add(g.dod, lam('#5A5A62'), x, 0.4, z, 1.2, 0.8, 1.0); for (let j = 0; j < 3; j++) add(g.oct, lam('#7AE8FF', '#3AA8D8', 1.4), x + (rnd() - 0.5) * 0.8, 0.8, z + (rnd() - 0.5) * 0.6, 0.25, 0.7, 0.25, (rnd() - 0.5) * 0.6, 0, (rnd() - 0.5) * 0.6); block(x, z, 0.6); }   // 帶晶石的礦堆
      else if (k < 0.84) for (let j = 0; j < 4; j++) add(g.oct, lam('#E4F0FA'), x + (rnd() - 0.5) * 1.4, 0.3, z + (rnd() - 0.5) * 1.4, 0.2, 0.6, 0.2);   // 冰柱（地上）
      else add(g.cyl, lam('#8A7A5A'), x, 0.3, z, 0.08, 0.6, 0.08); }   // 鶴嘴鋤的柄
  };
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
        } else if (DECO2[key]) DECO2[key]({ add, g, lam, x, z, s, k, a, fight, block, rnd, pick });
      }
    });
    Bt.flush(F.group);
  };
})(window.R);
