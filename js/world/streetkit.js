// 街上的東西重做（2026-10-22 作者：除了房子，……那些也要重做；應該不只這些模型要重做）
// - 路燈 B.lamp：往上變細的燈桿、底座、彎的燈臂、扁的燈罩＋燈面（碰撞、照明點跟原本一樣）。
// - 長椅 B.bench：三片木條的座面、兩片靠背、鑄鐵的椅腳和扶手（碰撞照舊）。
// - 郵筒 B.mailbox：紅色的圓筒＋圓頂、投信口、白色的標示牌（碰撞照舊）。
// - 自動販賣機 B.vend：原本的本體和「買熱飲」的互動照舊，外面加上：上面發光的招牌帶、展示窗裡一排一排的飲料、投幣口、退幣鈕、出貨口的框、側面的散熱孔。
// - 公車站 B.busStop：原本的照舊，再加站牌的柱子和圓牌、屋頂的簷板、時刻表板。
// 參數都跟原本一樣（citykit3.js）。放在 citykit*.js 後面（包住 CK.extendBuilder）。
(function (R) {
  const CK = R.CK; if (!CK || !CK.extendBuilder) return;
  const eb0 = CK.extendBuilder;
  CK.extendBuilder = B => {
    eb0(B);
    const M = CK.M, g = B.g, P = B.part, pk = B.pk, TH = () => window.THREE;
    const GEO = {}; const taper = (k, rt, rb, n) => GEO[k] || (GEO[k] = new (TH().CylinderGeometry)(rt, rb, 1, n || 10));
    // 一個方向（ry）上的點：沿著 ry 往前 f、往右 r
    const at = (x, z, ry, f, r) => [x + Math.sin(ry) * f + Math.cos(ry) * r, z + Math.cos(ry) * f - Math.sin(ry) * r];
    // ---------- 路燈 ----------
    const lamp0 = B.lamp;
    B.lamp = (x, z, ry, o) => {
      try {
        ry = ry || 0; const st = M('steelD');
        P(taper('lb', 0.22, 0.26), st, x, 0.25, z, 1, 0.5, 1);                 // 底座
        P(taper('lp', 0.07, 0.12), st, x, 2.85, z, 1, 4.7, 1);                 // 燈桿（往上變細）
        // 彎的燈臂：三段往前、往下
        const seg = [[0.25, 5.36], [0.65, 5.46], [1.05, 5.42]]; let px = 0, py = 5.2;
        // 歐拉角是 XYZ（繞 x 的傾斜在世界座標上）：先繞 z 傾斜、再轉 ry − 90°，傾斜的方向才會跟著燈的方向
        seg.forEach(([f, y]) => { const [sx, sz] = at(x, z, ry, (px + f) / 2, 0), phi = Math.atan2(f - px, y - py); P(g.cyl8, st, sx, (py + y) / 2, sz, 0.09, Math.hypot(f - px, y - py) + 0.04, 0.09, 0, ry - Math.PI / 2, -phi); px = f; py = y; });
        const [hx, hz] = at(x, z, ry, 1.25, 0);
        P(g.box, st, hx, 5.38, hz, 0.42, 0.14, 0.78, 0, ry, 0); P(g.box, M('lamp'), hx, 5.29, hz, 0.34, 0.05, 0.66, 0, ry, 0);
        B.lampAt(hx, hz); B.solid(x - 0.15, z - 0.15, x + 0.15, z + 0.15, 'deco');
      } catch (e) { console.warn('[streetkit]', e); lamp0(x, z, ry, o); }
    };
    // ---------- 長椅 ----------
    const bench0 = B.bench;
    B.bench = (x, z, ry) => {
      try {
        ry = ry || 0; const wd = M('wood'), ir = M('steelD');
        [-0.14, 0, 0.14].forEach(k => { const [sx, sz] = at(x, z, ry, k, 0); P(g.box, wd, sx, 0.45, sz, 1.8, 0.05, 0.12, 0, ry, 0); });
        [0.6, 0.82].forEach(y => { const [sx, sz] = at(x, z, ry, -0.24, 0); P(g.box, wd, sx, y, sz, 1.8, 0.1, 0.04, 0, ry, 0); });
        [-0.78, 0.78].forEach(k => { const [lx, lz] = at(x, z, ry, 0, k); P(g.box, ir, lx, 0.22, lz, 0.06, 0.44, 0.5, 0, ry, 0); const [bx, bz] = at(x, z, ry, -0.22, k); P(g.box, ir, bx, 0.62, bz, 0.06, 0.5, 0.06, 0, ry, 0); const [ax, az] = at(x, z, ry, 0, k); P(g.box, ir, ax, 0.62, az, 0.06, 0.05, 0.48, 0, ry, 0); });
        B.solid(x - 0.5, z - 0.5, x + 0.5, z + 0.5, 'deco');
      } catch (e) { console.warn('[streetkit]', e); bench0(x, z, ry); }
    };
    // ---------- 郵筒 ----------
    const mail0 = B.mailbox;
    B.mailbox = (x, z) => {
      try {
        const red = M('red');
        P(g.cyl, M('steelD'), x, 0.1, z, 0.5, 0.2, 0.5); P(g.cyl, red, x, 0.7, z, 0.46, 1.0, 0.46); P(g.hemi, red, x, 1.2, z, 0.46, 0.28, 0.46);
        P(g.box, M('black'), x, 1.02, z + 0.23, 0.26, 0.04, 0.03); P(g.box, M('white'), x, 0.72, z + 0.235, 0.22, 0.26, 0.02);
        B.solid(x - 0.25, z - 0.25, x + 0.25, z + 0.25, 'deco');
      } catch (e) { console.warn('[streetkit]', e); mail0(x, z); }
    };
    // ---------- 自動販賣機：原本的＋細節 ----------
    const vend0 = B.vend;
    B.vend = (x, z, ry, col) => {
      const it = vend0(x, z, ry, col);
      try {
        const f = (d, r, y, sx, sy, sz, m) => { const [px, pz] = at(x, z, ry, d, r); P(g.box, m, px, y, pz, sx, sy, sz, 0, ry, 0); };
        f(0.42, 0, 1.76, 0.86, 0.14, 0.02, CK.mat('vendTop', { col: '#FFFFFF', em: '#FFF4E0', ei: 0.6, neon: true, snow: 0 }));   // 招牌帶
        const C = ['#C83A3A', '#2E5A9A', '#E8C040', '#3A7A4A', '#E8782A', '#F2F0EA'];
        for (let row = 0; row < 3; row++) for (let k = -3; k <= 3; k++) f(0.425, k * 0.1, 0.98 + row * 0.24, 0.06, 0.14, 0.02, M('paint', { col: C[(k + 3 + row) % C.length] }));   // 展示的飲料
        for (let row = 0; row < 3; row++) f(0.426, 0, 0.9 + row * 0.24, 0.78, 0.015, 0.02, M('steelD'));   // 層板
        f(0.42, 0.3, 0.78, 0.08, 0.12, 0.03, M('steelD')); f(0.42, 0.3, 0.68, 0.05, 0.05, 0.03, M('red'));   // 投幣口、退幣鈕
        f(0.42, 0, 0.5, 0.66, 0.24, 0.02, M('steelD'));   // 出貨口的框
        [-1, 1].forEach(s => { for (let k = 0; k < 4; k++) { const [px, pz] = at(x, z, ry, -0.2 + k * 0.12, s * 0.48); P(g.box, M('black'), px, 1.5, pz, 0.02, 0.2, 0.06, 0, ry, 0); } });   // 散熱孔
      } catch (e) { console.warn('[streetkit]', e); }
      return it;
    };
    // ---------- 公車站：原本的＋站牌、簷板、時刻表 ----------
    const bus0 = B.busStop;
    B.busStop = (x, z, ry, name) => {
      bus0(x, z, ry, name);
      try {
        ry = ry || 0; const [px, pz] = at(x, z, ry, 0.9, -2.3);
        P(g.cyl8, M('steelD'), px, 1.4, pz, 0.1, 2.8, 0.1); P(g.cyl24, M('white'), px, 2.75, pz, 0.62, 0.06, 0.62, Math.PI / 2, ry, 0); P(g.cyl24, M('red'), px, 2.75, pz, 0.5, 0.07, 0.5, Math.PI / 2, ry, 0);
        P(g.box, M('steelD'), px, 1.45, pz, 0.32, 0.5, 0.05, 0, ry, 0); P(g.box, M('white'), px, 1.45, pz, 0.28, 0.44, 0.06, 0, ry, 0);   // 時刻表
        const [ex, ez] = at(x, z, ry, 0.72, 0); P(g.box, M('steelD'), ex, 2.46, ez, 3.3, 0.16, 0.06, 0, ry, 0);   // 屋頂的簷板
        B.solid(px - 0.12, pz - 0.12, px + 0.12, pz + 0.12, 'deco');
      } catch (e) { console.warn('[streetkit]', e); }
    };
  };
})(window.R);
