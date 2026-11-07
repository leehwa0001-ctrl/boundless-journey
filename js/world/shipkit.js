// 船重做（2026-10-22 作者：除了房子，車子和火車、神社、軍艦那些也要重做）
// 船身用一段一段的斷面接起來（不再是方塊＋三角錐的船頭）：船首收尖、船尾平的、甲板往船首翹（舷弧）、水線上直的舷側、水線下圓的船底（紅色的船底漆）。
// 種類（船首朝 +x，水線在 y＝0）：
//   fishing 漁船（駕駛艙、桅桿和吊桿、旗子、浮球）、tug 拖船（一圈黑色的防碰墊、兩層的艙、煙囪）、
//   ferry 渡輪（三層甲板一層一層往後退、每層一排窗、救生艇、兩根煙囪）、cargo 貨輪（船尾的高樓艙、煙囪、整船的貨櫃、兩座甲板吊車）、
//   warship 軍艦（灰色、尖的船首、階梯狀的艦橋、三腳桅和雷達、兩根煙囪、前二後一的砲塔、副砲）、boat 觀光的小船（篷子）。
// 用法：
//   CK.makeShip(kind, o) → THREE.Group（合成一塊，給會動的船：漁船晃、拖船繞圈）；
//   B.ship(kind, x, z, ry, o) → 直接蓋進城的幾何（停著的船）；o.y＝水線的高度。
//   o：{ L（長）, col（船身）, top（上層建築）, stripe, wreck（半沉：往一邊傾、只露上半）, seed }。
// 放在 citykit*.js 後面（包住 CK.extendBuilder 加 B.ship）。
(function (R) {
  const CK = R.CK; if (!CK) return;
  const T = () => window.THREE;
  // ---------- 船身 ----------
  // L 長、W 寬、D 甲板在水線上多高、Dr 吃水；bow：船首收尖的長度比例；sheer：甲板往船首翹多少
  const HG = new Map();
  const hull = (L, W, D, Dr, o) => {
    o = o || {}; const key = [L, W, D, Dr, o.bow || 0.22, o.sheer || 0, o.part || 'all'].join('|'); if (HG.has(key)) return HG.get(key);
    const TH = T(), N = 28, bowF = o.bow || 0.22, sternF = 0.08, sh = o.sheer || 0;
    const halfW = t => { // t：0 船尾 → 1 船首
      if (t > 1 - bowF) { const u = (t - (1 - bowF)) / bowF; return (W / 2) * Math.sqrt(Math.max(0, 1 - u * u * 1.02)) * (1 - u * 0.15); }
      if (t < sternF) { const u = 1 - t / sternF; return (W / 2) * (1 - u * u * 0.12); }
      return W / 2;
    };
    const deck = t => D + sh * Math.pow(Math.max(0, t - 0.55) / 0.45, 2);
    // 一個斷面上，高度 y 的半寬：水線以上直的，以下往下收成圓的船底
    const at = (b, y) => (y >= 0 ? b : b * Math.sqrt(Math.max(0, 1 - Math.pow(-y / Dr, 2.2))));
    const ys = [], part = o.part || 'all';
    const top = t => deck(t), M = 5;
    const pos = [];
    const sec = t => { const b = halfW(t), x = -L / 2 + L * t, d = top(t), pts = []; const yl = []; if (part !== 'below') { yl.push(d, d * 0.5, 0); } if (part !== 'above') { for (let k = part === 'below' ? 0 : 1; k <= M; k++) yl.push(-Dr * k / M); } yl.forEach(y => pts.push([x, y, at(b, y)])); return pts; };
    const S = []; for (let i = 0; i <= N; i++) S.push(sec(i / N));
    const quad = (a, b, c, d) => { pos.push(...a, ...c, ...b, ...a, ...d, ...c); };   // 下面列的四個角都是往內的順序：反過來，法線才朝外
    for (let i = 0; i < N; i++) { const A = S[i], Bq = S[i + 1]; for (let k = 0; k < A.length - 1; k++) { [1, -1].forEach(sd => { const p = (P, j) => [P[j][0], P[j][1], P[j][2] * sd]; if (sd > 0) quad(p(A, k), p(Bq, k), p(Bq, k + 1), p(A, k + 1)); else quad(p(A, k), p(A, k + 1), p(Bq, k + 1), p(Bq, k)); }); } }
    // 船尾（平的）
    { const A = S[0]; for (let k = 0; k < A.length - 1; k++) quad([A[k][0], A[k][1], -A[k][2]], [A[k][0], A[k][1], A[k][2]], [A[k + 1][0], A[k + 1][1], A[k + 1][2]], [A[k + 1][0], A[k + 1][1], -A[k + 1][2]]); }
    // 甲板（上蓋）
    if (part !== 'below') for (let i = 0; i < N; i++) { const a = S[i][0], b = S[i + 1][0]; quad([a[0], a[1], -a[2]], [b[0], b[1], -b[2]], [b[0], b[1], b[2]], [a[0], a[1], a[2]]); }
    // 只有水線以上的話，底下也蓋起來（不然從下面看是空的）
    if (part === 'above') for (let i = 0; i < N; i++) { const a = S[i][S[i].length - 1], b = S[i + 1][S[i + 1].length - 1]; quad([a[0], a[1], a[2]], [b[0], b[1], b[2]], [b[0], b[1], -b[2]], [a[0], a[1], -a[2]]); }
    const g = new TH.BufferGeometry(); g.setAttribute('position', new TH.Float32BufferAttribute(pos, 3));
    const uv = []; for (let i = 0; i < pos.length; i += 3) uv.push(pos[i] * 0.25, pos[i + 1] * 0.25); g.setAttribute('uv', new TH.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals(); g.userData.deck = deck; g.userData.halfW = halfW; HG.set(key, g); return g;
  };
  CK.hullGeo = hull;
  // ---------- 一艘船的零件：[形狀, 材質, x, y, z, sx, sy, sz, rx, ry, rz] ----------
  const parts = (kind, o) => {
    const TH = T(), g = CK.geo(), out = [], add = (geo, m, x, y, z, sx, sy, sz, rx, ry, rz) => out.push([geo, m, x, y, z, sx || 1, sy || 1, sz || 1, rx || 0, ry || 0, rz || 0]);
    const box = (m, x, y, z, sx, sy, sz, ry) => add(g.box, m, x, y, z, sx, sy, sz, 0, ry || 0, 0);
    const cyl = (m, x, y, z, r, h, rx, rz) => add(g.cyl, m, x, y, z, r * 2, h, r * 2, rx || 0, 0, rz || 0);
    const wins = (x0, x1, y, z, h, m) => { box(m || 'glass', (x0 + x1) / 2, y, z, x1 - x0, h, 0.05); box(m || 'glass', (x0 + x1) / 2, y, -z, x1 - x0, h, 0.05); };
    const rail = (x0, x1, y, hw) => { [hw, -hw].forEach(z => { box('rail', (x0 + x1) / 2, y + 0.9, z, x1 - x0, 0.06, 0.06); for (let x = x0; x <= x1; x += 1.6) box('rail', x, y + 0.45, z, 0.05, 0.9, 0.05); }); };
    const lifeboat = (x, y, z) => { add(hull(4.2, 1.5, 0.5, 0.45, { bow: 0.4 }), 'boat', x, y, z); box('boatTop', x, y + 0.6, z, 3.2, 0.3, 1.2); };
    if (kind === 'fishing' || kind === 'boat') {
      const L = o.L || 9, W = L * 0.29, D = 0.9, Dr = 0.55;
      add(hull(L, W, D, Dr, { bow: 0.32, sheer: 0.5, part: 'above' }), 'hull', 0, 0, 0); add(hull(L, W, D, Dr, { bow: 0.32, sheer: 0.5, part: 'below' }), 'anti', 0, 0, 0);
      box('stripe', 0.1, D - 0.15, 0, L * 0.9, 0.12, W + 0.02);
      if (kind === 'boat') { // 觀光船：篷子＋座位
        [-L * 0.3, 0, L * 0.3].forEach(x => [-1, 1].forEach(s => box('rail', x, D + 0.9, s * (W / 2 - 0.15), 0.08, 1.8, 0.08)));
        box('top', -0.2, D + 1.85, 0, L * 0.75, 0.1, W - 0.1); box('top', -0.2, D + 1.95, 0, L * 0.7, 0.08, W * 0.6);
        for (let x = -L * 0.3; x <= L * 0.25; x += 1.2) box('wood', x, D + 0.3, 0, 0.5, 0.25, W - 0.6);
      } else {
        box('top', -L * 0.12, D + 0.85, 0, L * 0.26, 1.7, W * 0.62); box('roof', -L * 0.12, D + 1.75, 0, L * 0.3, 0.12, W * 0.7); wins(-L * 0.24, L * 0.0, D + 1.2, W * 0.31 + 0.01, 0.5); box('glass', L * 0.01, D + 1.2, 0, 0.05, 0.5, W * 0.5);
        cyl('mast', L * 0.15, D + 2.4, 0, 0.07, 4.2); add(g.box, 'mast', L * 0.15 + 1.2, D + 2.2, 0, 2.6, 0.06, 0.06, 0, 0, -0.5);   // 桅桿、吊桿
        add(g.plane, 'flag', L * 0.15 + 0.4, D + 4.2, 0, 0.8, 0.45, 1, 0, 0, 0);
        for (let k = 0; k < 5; k++) add(g.sph, 'float', -L * 0.38 + k * 0.4, D + 0.25, (k % 2 ? 0.3 : -0.3), 0.3, 0.3, 0.3);
        box('wood', -L * 0.4, D + 0.15, 0, 0.9, 0.3, W * 0.5);
        cyl('lampR', L * 0.15, D + 4.5, 0, 0.12, 0.18);
      }
      rail(L * 0.08, L * 0.38, D, W / 2 - 0.08);
    } else if (kind === 'tug') {
      const L = o.L || 10, W = 4, D = 1.3, Dr = 1.1;
      add(hull(L, W, D, Dr, { bow: 0.3, sheer: 0.4, part: 'above' }), 'hull', 0, 0, 0); add(hull(L, W, D, Dr, { bow: 0.3, sheer: 0.4, part: 'below' }), 'anti', 0, 0, 0);
      [-1, 1].forEach(s => box('fender', -0.3, D - 0.3, s * (W / 2 + 0.05), L * 0.8, 0.45, 0.25)); box('fender', L / 2 - 0.1, D - 0.3, 0, 0.4, 0.45, 1.6); box('fender', -L / 2 + 0.05, D - 0.3, 0, 0.3, 0.45, W - 0.4);
      box('top', -0.6, D + 0.9, 0, 4.6, 1.8, 3.0); box('top', -0.2, D + 2.4, 0, 2.6, 1.2, 2.4); wins(-1.4, 1.0, D + 2.45, 1.21, 0.55); box('glass', 1.11, D + 2.45, 0, 0.05, 0.55, 2.0);
      wins(-2.8, 1.6, D + 1.1, 1.51, 0.4, 'dark'); box('roof', -0.2, D + 3.05, 0, 2.9, 0.1, 2.7);
      cyl('funnel', -2.0, D + 2.6, 0, 0.4, 1.6); cyl('stripe', -2.0, D + 3.1, 0, 0.42, 0.3); cyl('mast', 0, D + 4.0, 0, 0.06, 1.8);
      box('dark', -L * 0.4, D + 0.25, 0, 0.6, 0.5, 0.6);   // 拖纜的樁
    } else if (kind === 'ferry') {
      const L = o.L || 64, W = o.W || 11, D = 4.5, Dr = 2.5;
      add(hull(L, W, D, Dr, { bow: 0.24, sheer: 1.2, part: 'above' }), 'hull', 0, 0, 0); add(hull(L, W, D, Dr, { bow: 0.24, sheer: 1.2, part: 'below' }), 'anti', 0, 0, 0);
      box('stripe', 0, D - 1.3, 0, L * 0.92, 0.6, W + 0.05); box('stripe', 0, D - 0.4, 0, L * 0.92, 0.15, W + 0.05);
      for (let x = -L * 0.42; x < L * 0.3; x += 1.6) [1, -1].forEach(s => add(g.cyl8, 'glass', x, D - 2.4, s * (W / 2 + 0.01), 0.45, 0.06, 0.45, 0, Math.PI / 2, Math.PI / 2));   // 舷窗
      const deckY = [D, D + 2.6, D + 5.2], len = [L * 0.66, L * 0.5, L * 0.32], x0s = [-L * 0.42, -L * 0.38, -L * 0.3];
      deckY.forEach((y, k) => { const x0 = x0s[k], x1 = x0 + len[k], w = W - 1 - k * 0.8; box('top', (x0 + x1) / 2, y + 1.3, 0, len[k], 2.6, w); wins(x0 + 0.6, x1 - 0.8, y + 1.5, w / 2 + 0.01, 1.0); box('glass', x1 - 0.02, y + 1.5, 0, 0.05, 1.0, w - 1); rail(x0, x1 + 1.5, y + 2.6, w / 2 - 0.1); });
      box('top', x0s[2] + len[2] - 3, D + 8.4, 0, 3, 0.6, W + 1.2);   // 艦橋的兩翼
      [-L * 0.12, -L * 0.2].forEach(x => { cyl('funnel', x, D + 9.6, 0, 1.3, 4.4); cyl('stripe', x, D + 11.2, 0, 1.33, 0.9); });
      [-L * 0.32, -L * 0.2, -L * 0.08, L * 0.04].forEach(x => [1, -1].forEach(s => lifeboat(x, D + 3.2, s * (W / 2 - 0.2))));
      cyl('mast', L * 0.28, D + 4, 0, 0.12, 8);
    } else if (kind === 'cargo') {
      const L = o.L || 96, W = o.W || 15, D = 6, Dr = 4;
      add(hull(L, W, D, Dr, { bow: 0.18, sheer: 1.5, part: 'above' }), 'hull', 0, 0, 0); add(hull(L, W, D, Dr, { bow: 0.18, sheer: 1.5, part: 'below' }), 'anti', 0, 0, 0);
      box('white', 0, D - 0.15, 0, L * 0.96, 0.15, W + 0.04);
      // 船尾的樓（五層，每層一排窗）＋煙囪
      const ax = -L / 2 + 7; box('top', ax, D + 6, 0, 9, 12, W - 2); for (let k = 0; k < 5; k++) wins(ax - 4, ax + 4, D + 1.5 + k * 2.3, (W - 2) / 2 + 0.01, 0.8); box('glass', ax + 4.52, D + 10.7, 0, 0.05, 1.0, W - 3);
      box('top', ax + 3, D + 11.4, 0, 3.4, 1.0, W + 1.5);
      cyl('funnel', ax - 3.4, D + 14.5, 0, 1.6, 6); cyl('stripe', ax - 3.4, D + 16.4, 0, 1.63, 1.2); cyl('mast', ax, D + 15, 0, 0.12, 6);
      // 貨櫃：一排一排疊起來
      const cols = o.boxes || ['#C8402A', '#2E5A9A', '#E8C040', '#3E7A52', '#E8E4DC', '#7A4A8A', '#D87A3A'], rnd = CK.rng(o.seed || 7);
      for (let x = ax + 7; x < L / 2 - 14; x += 6.5) for (let z = -W / 2 + 1.6; z <= W / 2 - 1.5; z += 2.55) { const n = 1 + Math.floor(rnd() * 3); for (let k = 0; k < n; k++) add(g.box, 'c' + Math.floor(rnd() * cols.length), x, D + 1.3 + k * 2.6, z, 6.0, 2.55, 2.44); }
      // 甲板吊車、船首的桅桿
      [L * 0.0, L * 0.2].forEach(x => { cyl('crane', x, D + 4, W / 2 - 1.5, 0.45, 8); add(g.box, 'crane', x + 3.5, D + 7.5, W / 2 - 1.5, 9, 0.4, 0.4, 0, 0, 0.35); });
      cyl('mast', L / 2 - 8, D + 4, 0, 0.15, 7); box('hull', L / 2 - 6, D + 0.6, 0, 6, 1.2, W - 3);
    } else if (kind === 'warship') {
      // 2026-10-22 作者：軍艦精細度不夠──照戰列艦重做（防雷突出部、舷窗、木甲板、舷側副砲、四座三聯裝砲塔、寶塔式艦橋、測距儀、探照燈、
      // 往後傾的大煙囪、前後桅和吊索、小艇和吊艇架、防空機槍、艦尾的吊車和水上飛機、艦首旗竿和錨鏈、艦尾軍旗）
      const L = o.L || 90, W = o.W || 12, D = 4.5, Dr = 3.5, hg = hull(L, W, D, Dr, { bow: 0.3, sheer: 1.6, part: 'above' });
      add(hg, 'hull', 0, 0, 0); add(hull(L, W, D, Dr, { bow: 0.3, sheer: 1.6, part: 'below' }), 'anti', 0, 0, 0);
      const dk = x => hg.userData.deck((x + L / 2) / L), hw = x => hg.userData.halfW((x + L / 2) / L);
      const zc = (x, y, z, r, h, m) => add(g.cyl8, m, x, y, z, r * 2, h, r * 2, 0, Math.PI / 2, Math.PI / 2);   // 軸朝 z 的圓柱（先繞 z、再轉 90°：船轉方向也對）
      const xc = (x, y, z, r, h, m, n) => add(n || g.cyl8, m, x, y, z, r * 2, h, r * 2, 0, 0, Math.PI / 2);      // 軸朝 x 的圓柱
      const strut = (x0, y0, x1, y1, z, r, m) => { const dx = x1 - x0, dy = y1 - y0; add(g.cyl8, m, (x0 + x1) / 2, (y0 + y1) / 2, z, r * 2, Math.hypot(dx, dy), r * 2, 0, 0, Math.atan2(-dx, dy)); };
      // 防雷突出部、水線的深色帶、舷窗
      [1, -1].forEach(sd => box('hull', 0, 0.2, sd * (W / 2 + 0.05), L * 0.58, 1.6, 0.5));
      box('dark', 0, D - 0.12, 0, L * 0.94, 0.12, W + 0.02);
      for (let x = -L * 0.42; x < L * 0.36; x += 1.6) [1, -1].forEach(sd => { const z = sd * (hw(x) + 0.01); zc(x, dk(x) - 1.3, z, 0.16, 0.06, 'dark'); });
      // 木甲板：照舷弧一段一段鋪
      for (let k = 0; k < 14; k++) { const x0 = -L * 0.46 + L * 0.88 * k / 14, x1 = -L * 0.46 + L * 0.88 * (k + 1) / 14, xm = (x0 + x1) / 2; box('deckwood', xm, dk(xm) + 0.04, 0, x1 - x0 + 0.02, 0.06, Math.max(0.5, hw(xm) * 2 - 0.5)); }
      // 舷側的副砲：一排砲郭＋砲管
      for (let k = 0; k < 6; k++) { const x = -L * 0.16 + k * L * 0.065; [1, -1].forEach(sd => { box('top', x, dk(x) - 0.75, sd * (hw(x) - 0.1), 1.1, 0.8, 0.6); zc(x, dk(x) - 0.75, sd * (hw(x) + 0.9), 0.1, 2.0, 'dark'); }); }
      // 主砲塔：砲座、圓弧的正面、斜的頂、三根砲管和砲口罩、測距儀的耳朵
      const turret = (x, y, dir) => {
        add(g.cyl24, 'top', x, y + 0.5, 0, 5.0, 1.0, 5.0);
        box('top', x - dir * 0.5, y + 1.9, 0, 3.6, 1.8, 4.2); add(g.cyl24, 'top', x + dir * 1.3, y + 1.9, 0, 4.2, 1.8, 4.2);
        box('top', x - dir * 0.2, y + 2.85, 0, 3.8, 0.15, 3.8);
        [-1, 1].forEach(s2 => zc(x - dir * 1.6, y + 2.5, s2 * 2.2, 0.28, 0.8, 'top'));
        [-1.0, 0, 1.0].forEach(z => { xc(x + dir * 5.4, y + 2.0, z, 0.2, 7.2, 'dark'); xc(x + dir * 3.5, y + 2.0, z, 0.34, 0.6, 'dark'); });
      };
      turret(L * 0.33, dk(L * 0.33), 1); add(g.cyl24, 'top', L * 0.22, dk(L * 0.22) + 0.9, 0, 5.4, 1.8, 5.4); turret(L * 0.22, dk(L * 0.22) + 1.8, 1);
      turret(-L * 0.33, dk(-L * 0.33), -1); add(g.cyl24, 'top', -L * 0.22, dk(-L * 0.22) + 0.9, 0, 5.4, 1.8, 5.4); turret(-L * 0.22, dk(-L * 0.22) + 1.8, -1);
      // 寶塔式艦橋：甲板室＋一層一層的平台（欄杆）＋艦橋窗＋最上面的測距儀
      const bx = L * 0.1, by = dk(bx);
      box('top', bx - 2, by + 1.6, 0, 14, 3.2, W - 2.6); [1, -1].forEach(sd => { for (let x = bx - 8; x < bx + 4.5; x += 1.4) zc(x, by + 2.0, sd * ((W - 2.6) / 2 + 0.01), 0.15, 0.05, 'dark'); });
      add(g.cyl8, 'top', bx, by + 12, 0, 1.6, 18, 1.6);
      [[3.2, 9, 6.5], [6.0, 7.5, 5.5], [8.6, 6.4, 4.6], [11.2, 5.4, 4.0], [13.6, 4.2, 3.4], [15.8, 3.4, 2.8]].forEach(([y, l, w], k) => {
        box('top', bx, by + y, 0, l, 0.25, w); [w / 2, -w / 2].forEach(z => box('rail', bx, by + y + 0.5, z, l, 0.06, 0.05)); [l / 2, -l / 2].forEach(xx => box('rail', bx + xx, by + y + 0.5, 0, 0.05, 0.06, w));
        if (k % 2 === 1) { box('top', bx + 0.4, by + y + 1.0, 0, l * 0.55, 1.6, w * 0.7); box('glass', bx + 0.4 + l * 0.275 + 0.01, by + y + 1.3, 0, 0.05, 0.5, w * 0.62); }
      });
      box('top', bx, by + 17.6, 0, 1.6, 1.2, 1.6); box('top', bx, by + 18.5, 0, 0.6, 0.6, 6.0); [3, -3].forEach(z => zc(bx, by + 18.5, z, 0.42, 0.5, 'top'));   // 測距儀
      [[1, 2.4], [-1, 2.4], [1, -2.4], [-1, -2.4]].forEach(([xx, z]) => { add(g.cyl8, 'top', bx + xx * 2.4, by + 9.4, z, 0.9, 0.7, 0.9); xc(bx + xx * 2.4 + 0.4, by + 9.4, z, 0.36, 0.1, 'lens'); });   // 探照燈
      // 大煙囪（往後傾）＋蒸汽管
      const fx = -L * 0.04, fy = dk(fx);
      add(g.cyl8, 'top', fx, fy + 5.5, 0, 4.0, 9, 2.8, 0, 0, 0.12); add(g.cyl8, 'dark', fx - 0.55, fy + 10.1, 0, 3.6, 0.6, 2.5, 0, 0, 0.12); add(g.cyl8, 'top', fx - 0.6, fy + 10.5, 0, 4.2, 0.25, 3.0, 0, 0, 0.12);
      [-0.9, 0.9].forEach(z => add(g.cyl8, 'mast', fx - 1.9, fy + 6, z, 0.24, 9, 0.24, 0, 0, 0.12));
      // 後桅（三腳）、橫桁、吊索
      const mx = -L * 0.14, my = dk(mx);
      [[0, 0.4], [-1.4, -0.5], [1.4, -0.5]].forEach(([z, dx]) => strut(mx + dx * 2.2, my, mx, my + 12, z * 0.7, 0.2, 'top'));
      box('top', mx, my + 10, 0, 1.8, 0.2, 5.0); box('mast', mx, my + 12, 0, 0.12, 0.12, 6.0);
      strut(bx, by + 19, L / 2 - 3, dk(L / 2 - 3) + 1.4, 0, 0.03, 'mast'); strut(bx, by + 19, mx, my + 12, 0, 0.03, 'mast'); strut(mx, my + 12, -L / 2 + 3, dk(-L / 2 + 3) + 1.2, 0, 0.03, 'mast');
      // 小艇和吊艇架、防空機槍
      [[-L * 0.09, 1], [-L * 0.09, -1], [-L * 0.17, 1], [-L * 0.17, -1]].forEach(([x, sd]) => { add(hull(5.2, 1.6, 0.6, 0.5, { bow: 0.4 }), 'boat', x, dk(x) + 1.2, sd * (W / 2 - 1.4)); strut(x - 1.8, dk(x), x - 1.8, dk(x) + 2.4, sd * (W / 2 - 0.5), 0.07, 'mast'); strut(x + 1.8, dk(x), x + 1.8, dk(x) + 2.4, sd * (W / 2 - 0.5), 0.07, 'mast'); });
      [[bx - 6, 1], [bx - 6, -1], [bx + 3.5, 1], [bx + 3.5, -1], [fx - 3, 1], [fx - 3, -1]].forEach(([x, sd]) => { const y = dk(x) + 3.4, z = sd * (W / 2 - 1.8); add(g.cyl8, 'top', x, y + 0.3, z, 1.0, 0.6, 1.0); [-0.15, 0.15].forEach(zz => strut(x, y + 0.5, x + 1.3, y + 1.4, z + zz, 0.05, 'dark')); });
      // 艦尾：吊車、彈射器、水上飛機、軍旗
      const sx2 = -L * 0.42, sy = dk(sx2);
      add(g.cyl8, 'top', sx2 + 2, sy + 2.5, W * 0.25, 0.5, 5, 0.5); strut(sx2 + 2, sy + 4.8, sx2 - 3, sy + 6.2, W * 0.25, 0.14, 'top');
      box('dark', sx2 + 1, sy + 0.9, -W * 0.15, 10, 0.4, 0.6);   // 彈射器
      xc(sx2 + 1, sy + 1.9, -W * 0.15, 0.4, 4.6, 'top'); box('top', sx2 + 1.4, sy + 2.1, -W * 0.15, 1.0, 0.08, 6.0); box('top', sx2 - 0.9, sy + 2.0, -W * 0.15, 0.6, 0.06, 2.2); [-1, 1].forEach(z => xc(sx2 + 1, sy + 1.2, -W * 0.15 + z * 1.0, 0.22, 2.6, 'top'));   // 水上飛機（機身、主翼、尾翼、浮筒）
      add(g.cyl8, 'mast', -L / 2 + 0.6, sy + 3, 0, 0.12, 6, 0.12); add(g.plane, 'flag', -L / 2 + 0.0, sy + 5.3, 0, 1.6, 1.0, 1, 0, 0, 0);
      // 艦首：旗竿、錨鏈、絞盤
      add(g.cyl8, 'mast', L / 2 - 1.2, dk(L / 2 - 1.2) + 1.6, 0, 0.1, 3.2, 0.1);
      [1, -1].forEach(sd => { box('dark', L * 0.43, dk(L * 0.43) + 0.08, sd * 1.1, 4.0, 0.12, 0.25); add(g.cyl8, 'dark', L * 0.4, dk(L * 0.4) + 0.4, sd * 1.1, 0.9, 0.7, 0.9); zc(L / 2 - 4, dk(L / 2 - 4) - 0.4, sd * (hw(L / 2 - 4) + 0.02), 0.4, 0.1, 'dark'); });
      rail(-L * 0.45, L * 0.42, D, W / 2 - 0.1);
    }
    return out;
  };
  // 材質（顏色照 o 換）
  const mats = o => {
    const M = CK.M, pc = (k, c, x) => CK.mat('ship|' + k + '|' + c, Object.assign({ col: c, rough: 0.6, snow: 0.6 }, x || {}));
    const box = ['#C8402A', '#2E5A9A', '#E8C040', '#3E7A52', '#E8E4DC', '#7A4A8A', '#D87A3A'];
    const m = { hull: pc('hull', o.col || '#2A2E36', { tex: 'paint' }), anti: pc('anti', o.anti || '#8A2A24', { tex: 'paint', snow: 0 }), top: pc('top', o.top || '#ECEAE4', { tex: 'paint' }), roof: pc('roof', o.roof || '#5A6068'), stripe: pc('stripe', o.stripe || '#2E5A9A'),
      glass: M('glass'), dark: pc('dark', '#202226'), rail: pc('rail', o.railCol || '#E8E4DC', { snow: 0.2 }), mast: M('steelD'), funnel: pc('funnel', o.funnel || o.col || '#2A2E36'), crane: pc('crane', '#D8A030'),
      boat: pc('boat', '#E8782A'), deckwood: pc('deckwood', '#9A7A56', { tex: 'planks' }), lens: CK.mat('ship|lens', { col: '#F4F8FF', em: '#E8F0FF', ei: 0, lamp: true, snow: 0 }), boatTop: pc('boatTop', '#F2F0EA'), wood: M('woodD'), white: M('white'), fender: pc('fender', '#18181C', { rough: 0.9 }), float: pc('float', '#E8782A'),
      flag: CK.mat('ship|flag|' + (o.flag || '#C8323A'), { col: o.flag || '#C8323A', side: 1, snow: 0 }), lampR: CK.mat('ship|lamp', { col: '#FFE8C0', em: '#FFD08A', ei: 0, lamp: true, snow: 0 }) };
    (o.boxes || box).forEach((c, i) => { m['c' + i] = CK.mat('fac|corr|' + c, { tex: 'corrugated', col: c, snow: 0.8 }); });
    return m;
  };
  // 會動的船：一個 Group（合成一塊）
  CK.makeShip = (kind, o) => {
    o = o || {}; const TH = T(), grp = new TH.Group(), M = mats(o), Bt = CK.batch();
    parts(kind, o).forEach(([geo, m, x, y, z, sx, sy, sz, rx, ry, rz]) => Bt.add(geo, M[m] || M.hull, x, y, z, sx, sy, sz, rx, ry, rz, { uv: 'keep' }));
    Bt.flush(grp); return grp;
  };
  // 停著的船：直接蓋進城的幾何
  const eb0 = CK.extendBuilder;
  if (eb0) CK.extendBuilder = B => {
    eb0(B);
    B.ship = (kind, x, z, ry, o) => {
      o = o || {}; const y0 = o.y || 0, Mt = mats(o), fr0 = B.Bt.getFrame(), [wx, wz] = B.toWorld(x, z), a = (fr0 ? fr0.a : 0) + (ry || 0);
      const tilt = o.wreck ? 0.22 : 0, sink = o.wreck ? -2.5 : 0;
      B.Bt.setFrame(wx, wz, a);
      try {
        parts(kind, o).forEach(([geo, m, px, py, pz, sx, sy, sz, rx, ry2, rz]) => {
          // 半沉的舊艦：整艘往一邊傾（繞 x 軸），再往下沉
          const yy = py * Math.cos(tilt) - pz * Math.sin(tilt), zz = py * Math.sin(tilt) + pz * Math.cos(tilt);
          B.part(geo, Mt[m] || Mt.hull, px, y0 + yy + sink, zz, sx, sy, sz, rx + tilt, ry2, rz, { uv: 'keep' });
        });
        const L = o.L || { fishing: 9, boat: 9, tug: 10, ferry: 64, cargo: 96, warship: 90 }[kind] || 10, W = o.W || { fishing: L * 0.29, boat: L * 0.29, tug: 4, ferry: 11, cargo: 15, warship: 12 }[kind] || 4;
        if (o.solid !== false) B.solid(-L / 2, -W / 2, L / 2, W / 2, 'house');
      } finally { if (fr0) B.Bt.setFrame(fr0.x, fr0.z, fr0.a); else B.Bt.setFrame(null); }
    };
  };
})(window.R);
