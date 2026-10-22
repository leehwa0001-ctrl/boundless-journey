// 神社重做（2026-10-22 作者：除了房子，車子和火車、神社、軍艦那些也要重做）
// - B.jinja(cx, cz, o)：拜殿＋本殿一整組。o：{ face（拜殿正面朝哪：'s'／'n'／'e'／'w'）, w, d（拜殿的寬、深）, mat（屋頂：copper、kawara…）,
//   honden（後面要不要本殿，預設要）, komainu（狛犬，預設要）, temizu（手水舍，預設要）, name（扁額的字）}。
//   拜殿：石的台基、架高的木地板＋迴廊和朱紅的欄杆、柱子、正面的格子門、白牆、樑；入母屋的屋頂（反翹、上面一小塊山牆）、屋脊和鰹木；
//   正面的向拜（伸出去的小屋頂和兩根柱子）、台階、賽錢箱、鈴和繩、注連繩和紙垂。本殿：小一號、玉垣圍起來。
//   碰撞：台基、本殿、狛犬、手水舍（台階前面留著走得到賽錢箱）。
// - B.torii、B.lantern 換成新的：鳥居（柱子腳下黑色的根卷、貫伸出柱外、笠木和島木兩端往上翹、額束上的扁額）；
//   石燈籠（六角的基礎、竿、中台、火袋四面亮著、六角的笠和蕨手、寶珠）。參數跟原本一樣。
// 放在 citykit*.js、housekit.js 後面（包住 CK.extendBuilder）。
(function (R) {
  const CK = R.CK; if (!CK || !CK.extendBuilder) return;
  const eb0 = CK.extendBuilder;
  CK.extendBuilder = B => {
    eb0(B);
    // 盒子至少 1 公分厚：厚度 0 的盒子法線會變成 0，泛光一擴散就是一大塊黑的（2026-10-22 迴廊欄杆的下橫木就是這樣）
    const M = CK.M, g = B.g, P = B.part, TH = () => window.THREE;
    const BOX = (m, x0, y0, z0, x1, y1, z1, o) => { const fx = (a, b) => (Math.abs(b - a) < 0.01 ? [Math.min(a, b) - 0.005, Math.max(a, b) + 0.005] : [a, b]); [x0, x1] = fx(x0, x1); [y0, y1] = fx(y0, y1); [z0, z1] = fx(z0, z1); return B.box(m, x0, y0, z0, x1, y1, z1, o); };
    const GEO = {}; const hex = (k, rt, rb) => GEO[k] || (GEO[k] = new (TH().CylinderGeometry)(rt, rb, 1, 6));
    const lampM = () => CK.mat('toroLamp', { col: '#FFF0D0', em: '#FFC27A', ei: 0, lamp: true, snow: 0 });
    // ---------- 石燈籠 ----------
    const lantern0 = B.lantern;
    B.lantern = (x, z, s, ry) => {
      try {
        s = s || 1; ry = ry || 0; const st = M('ashlar');
        P(hex('t0', 0.5, 0.55), st, x, 0.12 * s, z, s, 0.24 * s, s, 0, ry, 0);          // 基礎
        P(hex('t1', 0.17, 0.2), st, x, 0.75 * s, z, s, 1.0 * s, s, 0, ry, 0);           // 竿
        P(hex('t2', 0.42, 0.3), st, x, 1.33 * s, z, s, 0.16 * s, s, 0, ry, 0);          // 中台
        P(g.box, st, x, 1.68 * s, z, 0.5 * s, 0.52 * s, 0.5 * s, 0, ry, 0);             // 火袋
        const c = Math.cos(ry), sn = Math.sin(ry);
        [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([a, b]) => { const ox = (a * c + b * sn) * 0.255 * s, oz = (-a * sn + b * c) * 0.255 * s; P(g.box, lampM(), x + ox, 1.7 * s, z + oz, (a ? 0.02 : 0.26) * s, 0.26 * s, (b ? 0.02 : 0.26) * s, 0, ry, 0); });
        P(hex('t3', 0.12, 0.62), M('ashlar'), x, 2.08 * s, z, s, 0.3 * s, s, 0, ry, 0);  // 笠
        for (let k = 0; k < 6; k++) { const a = ry + k * Math.PI / 3; P(g.box, st, x + Math.cos(a) * 0.6 * s, 2.02 * s, z - Math.sin(a) * 0.6 * s, 0.1 * s, 0.14 * s, 0.1 * s); }   // 蕨手
        P(g.sph, st, x, 2.32 * s, z, 0.2 * s, 0.24 * s, 0.2 * s);                        // 寶珠
        B.lampAt(x, z); B.solid(x - 0.4 * s, z - 0.4 * s, x + 0.4 * s, z + 0.4 * s, 'deco');
      } catch (e) { console.warn('[shrinekit]', e); lantern0(x, z, s, ry); }
    };
    // ---------- 鳥居 ----------
    const torii0 = B.torii;
    B.torii = (x, z, ry, w, h, mat) => {
      try {
        w = w || 4; h = h || 4.6; ry = ry || 0; const m = M(mat || 'verm'), bk = M('black'), ca = Math.cos(ry), sa = Math.sin(ry), k = w / 4;
        const at = (a, cb) => [x + ca * a, z - sa * a];
        [-1, 1].forEach(sd => {
          const [px, pz] = at(sd * w / 2);
          P(g.cyl, m, px, h / 2, pz, 0.38 * k, h, 0.38 * k, 0, 0, sd * 0.03); P(g.cyl, bk, px, 0.3, pz, 0.48 * k, 0.6, 0.48 * k); P(g.cyl, bk, px, 0.66, pz, 0.44 * k, 0.1, 0.44 * k);
          B.solid(px - 0.28, pz - 0.28, px + 0.28, pz + 0.28, 'deco');
        });
        P(g.box, m, x, h * 0.76, z, w + 1.0 * k, 0.28 * k, 0.24 * k, 0, ry, 0);          // 貫
        [-1, 1].forEach(sd => { const [px, pz] = at(sd * (w / 2 + 0.5 * k)); P(g.box, bk, px, h * 0.76, pz, 0.05, 0.3 * k, 0.26 * k, 0, ry, 0); });   // 貫的楔
        // 島木＋笠木：中間一段平的，兩端各兩段往上翹
        const segs = [[0, w + 0.6 * k, 0], [1, 0.75 * k, 0.1], [2, 0.6 * k, 0.24]];
        [[m, h + 0.06, 0.34 * k, 0.44 * k], [bk, h + 0.34, 0.24 * k, 0.56 * k]].forEach(([mm, y, th, dp], li) => {
          P(g.box, mm, x, y, z, w + 0.6 * k + li * 0.3 * k, th, dp, 0, ry, 0);
          [-1, 1].forEach(sd => { let a = (w + 0.6 * k + li * 0.3 * k) / 2, yy = y; segs.slice(1).forEach(([, L, rz]) => { const [px, pz] = at(sd * (a + L / 2 * Math.cos(rz))); yy += Math.sin(rz) * L / 2; P(g.box, mm, px, yy, pz, L, th, dp, 0, ry, sd * rz); yy += Math.sin(rz) * L / 2; a += L * Math.cos(rz); }); });
        });
        P(g.box, m, x, (h * 0.76 + h) / 2 + 0.04, z, 0.24 * k, h * 0.22, 0.2 * k, 0, ry, 0);   // 額束
        P(g.box, bk, x, (h * 0.76 + h) / 2 + 0.04, z, 0.5 * k, 0.6 * k, 0.26 * k, 0, ry, 0);    // 扁額
        P(g.box, M('gold'), x, (h * 0.76 + h) / 2 + 0.04, z, 0.38 * k, 0.48 * k, 0.28 * k, 0, ry, 0);
      } catch (e) { console.warn('[shrinekit]', e); torii0(x, z, ry, w, h, mat); }
    };
    // ---------- 狛犬（石的台座＋坐著的獅子：身體、頭、鬃毛、尾巴） ----------
    B.komainu = (x, z, ry) => {
      const st = M('ashlar'), c = Math.cos(ry || 0), sn = Math.sin(ry || 0), fw = (a, b) => [x + a * c + b * sn, z - a * sn + b * c];
      P(g.box, st, x, 0.45, z, 1.1, 0.9, 1.3, 0, ry || 0, 0); P(g.box, st, x, 0.95, z, 0.9, 0.1, 1.1, 0, ry || 0, 0);
      let [bx, bz] = fw(0, -0.1); P(g.sph, st, bx, 1.35, bz, 0.7, 0.7, 0.9);
      [bx, bz] = fw(0, 0.25); P(g.sph, st, bx, 1.85, bz, 0.62, 0.6, 0.6); P(g.sph, st, bx, 1.72, bz, 0.8, 0.5, 0.6);   // 頭、鬃毛
      [bx, bz] = fw(0, -0.55); P(g.cone8, st, bx, 1.65, bz, 0.35, 0.6, 0.35);   // 尾巴
      [-0.2, 0.2].forEach(a => { const [lx, lz] = fw(a, 0.38); P(g.cyl8, st, lx, 1.2, lz, 0.16, 0.5, 0.16); });
      B.solid(x - 0.6, z - 0.6, x + 0.6, z + 0.6, 'deco');
    };
    // ---------- 拜殿＋本殿 ----------
    B.jinja = (cx, cz, o) => {
      o = o || {}; const face = o.face || 's', rot = { s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 }[face];
      const fr0 = B.Bt.getFrame(), [wcx, wcz] = B.toWorld(cx, cz), a0 = (fr0 ? fr0.a : 0) + rot;
      B.Bt.setFrame(wcx, wcz, a0);
      try {
        const w = o.w || 10, d = o.d || 8, mat = o.mat || 'copper', FL = 1.35, WH = 3.6, top = FL + WH;
        const verm = M('verm'), woodB = M('woodB'), woodD = M('woodD'), wall = M('white'), st = M('ashlar');
        // 台基、地板下的柱子、地板（迴廊）、欄杆
        BOX(st, -w / 2 - 1.2, 0, -d / 2 - 1.2, w / 2 + 1.2, 0.5, d / 2 + 1.2);
        for (let x = -w / 2 - 0.4; x <= w / 2 + 0.41; x += (w + 0.8) / Math.round((w + 0.8) / 1.8)) [-d / 2 - 0.4, d / 2 + 0.4].forEach(z => P(g.cyl8, woodB, x, 0.5 + (FL - 0.5) / 2, z, 0.24, FL - 0.5, 0.24));
        BOX(woodD, -w / 2 - 0.75, FL - 0.14, -d / 2 - 0.75, w / 2 + 0.75, FL, d / 2 + 0.75);
        const rail = (x0, z0, x1, z1) => { BOX(verm, Math.min(x0, x1) - 0.05, FL + 0.82, Math.min(z0, z1) - 0.05, Math.max(x0, x1) + 0.05, FL + 0.9, Math.max(z0, z1) + 0.05); const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 1.2)); for (let i = 0; i <= n; i++) P(g.box, verm, x0 + (x1 - x0) * i / n, FL + 0.45, z0 + (z1 - z0) * i / n, 0.1, 0.9, 0.1); BOX(verm, Math.min(x0, x1) - 0.04, FL + 0.3, Math.min(z0, z1) - 0.04, Math.max(x0, x1) + 0.04, FL + 0.36, Math.max(z0, z1) + 0.04); };
        const ex = w / 2 + 0.7, ez = d / 2 + 0.7;
        rail(-ex, -ez, ex, -ez); rail(-ex, -ez, -ex, ez); rail(ex, -ez, ex, ez); rail(-ex, ez, -1.8, ez); rail(1.8, ez, ex, ez);
        // 牆：白牆、正面格子門、柱子、樑
        BOX(wall, -w / 2 + 0.1, FL, -d / 2 + 0.1, w / 2 - 0.1, top - 0.5, d / 2 - 0.1);
        const bays = Math.max(3, Math.round(w / 2.2)); for (let i = 0; i <= bays; i++) { const x = -w / 2 + w * i / bays; [-d / 2, d / 2].forEach(z => P(g.cyl, verm, x, FL + WH / 2, z, 0.32, WH, 0.32)); if (i < bays) BOX(M('lattice'), x + 0.2, FL + 0.1, d / 2 - 0.08, x + w / bays - 0.2, top - 0.9, d / 2 - 0.02); }
        const sb = Math.max(2, Math.round(d / 2.2)); for (let i = 1; i < sb; i++) { const z = -d / 2 + d * i / sb; [-w / 2, w / 2].forEach(x => P(g.cyl, verm, x, FL + WH / 2, z, 0.32, WH, 0.32)); }
        [FL + 0.1, top - 0.85, top - 0.4].forEach((y, k) => BOX(k === 1 ? verm : woodB, -w / 2 - 0.08, y - 0.08, -d / 2 - 0.08, w / 2 + 0.08, y + 0.08, d / 2 + 0.08));
        // 屋頂：入母屋（下面寄棟＋上面一小塊切妻）、屋脊、鰹木
        const H = d * 0.3, rf = B.roof(0, 0, w, d, { type: 'hip', y: top, h: H, o: 1.5, sori: 0.38, mat, ridge: false, under: 'woodD' });
        B.roof(0, 0, w * 0.6, d * 0.42, { type: 'gable', y: top + H * 0.62, h: H * 0.5, o: 0.4, sori: 0.15, mat, gableMat: 'woodB', under: 'woodD' });
        const rtop = top + H * 0.62 + H * 0.5;
        P(g.box, M(mat), 0, rtop + 0.18, 0, w * 0.6 + 1.0, 0.36, 0.5); void rf;
        for (let i = -1; i <= 1; i++) P(g.cyl8, M('gold'), i * w * 0.15, rtop + 0.48, 0, 0.26, 0.9, 0.26, 0, 0, Math.PI / 2);   // 鰹木
        // 向拜：正面伸出去的小屋頂＋兩根柱子；台階；賽錢箱；鈴；注連繩
        const kz = d / 2 + 2.3;
        [-1.6, 1.6].forEach(x => P(g.cyl, verm, x, (FL + top) / 2 - 0.3, kz, 0.28, top - 0.6, 0.28));
        B.roof(0, kz - 0.9, 4.4, 3.0, { type: 'gable', y: top - 0.55, h: 0.9, o: 0.45, sori: 0.25, mat, ridge: false, gableWall: false, under: 'woodD', ry: Math.PI / 2 });
        for (let k = 0; k < 4; k++) BOX(woodD, -1.5, 0, ez + k * 0.38, 1.5, FL - k * (FL / 4), ez + (k + 1) * 0.38);
        BOX(woodD, -0.9, 0, kz + 0.45, 0.9, 0.85, kz + 1.15); BOX(woodB, -0.95, 0.85, kz + 0.4, 0.95, 0.92, kz + 1.2);   // 賽錢箱
        P(g.cyl8, M('verm'), 0, top - 1.6, kz - 0.2, 0.08, 2.2, 0.08); P(g.cyl8, M('white'), 0.06, top - 1.6, kz - 0.2, 0.05, 2.2, 0.05); P(g.sph, M('gold'), 0, top - 0.55, kz - 0.2, 0.5, 0.5, 0.5);   // 鈴和繩
        P(g.cyl8, M('cream'), 0, top - 0.75, d / 2 + 0.9, 0.28, w - 1.0, 0.28, 0, 0, Math.PI / 2);   // 注連繩
        for (let i = -2; i <= 2; i++) P(g.box, M('white'), i * (w - 1.6) / 4.4, top - 1.15, d / 2 + 0.9, 0.18, 0.5, 0.02);   // 紙垂
        if (o.name) B.sign(o.name, 's', d / 2 + 0.12, 0, top - 0.25, { size: 0.42, bg: '#1A1410', fg: '#E8C860', vert: 0 });
        B.solid(-w / 2 - 1.2, -d / 2 - 1.2, w / 2 + 1.2, d / 2 + 1.2, 'house');
        B.solid(-0.95, kz + 0.4, 0.95, kz + 1.2, 'deco');
        // 本殿：後面小一號，玉垣圍起來
        if (o.honden !== false) {
          const hw = w * 0.5, hd = d * 0.6, hz = -d / 2 - 1.2 - hd / 2 - 1.6, hf = 1.0, ht = hf + 2.6;
          BOX(st, -hw / 2 - 0.6, 0, hz - hd / 2 - 0.6, hw / 2 + 0.6, 0.6, hz + hd / 2 + 0.6);
          BOX(woodD, -hw / 2 - 0.3, hf - 0.12, hz - hd / 2 - 0.3, hw / 2 + 0.3, hf, hz + hd / 2 + 0.3);
          BOX(wall, -hw / 2, hf, hz - hd / 2, hw / 2, ht, hz + hd / 2);
          [-hw / 2, hw / 2].forEach(x => [-hd / 2, hd / 2].forEach(z => P(g.cyl, verm, x, (hf + ht) / 2, hz + z, 0.26, ht - hf, 0.26)));
          BOX(M('lattice'), -hw / 2 + 0.3, hf + 0.1, hz + hd / 2 - 0.04, hw / 2 - 0.3, ht - 0.4, hz + hd / 2 + 0.02);
          B.roof(0, hz + 0.3, hw, hd + 0.6, { type: 'gable', y: ht, h: hd * 0.42, o: 0.7, sori: 0.25, mat, gableMat: 'woodB', under: 'woodD', ry: 0 });
          const gx = hw / 2 + 1.4, gz0 = hz - hd / 2 - 1.2, gz1 = hz + hd / 2 + 1.2;
          [[-gx, gz0, gx, gz0], [-gx, gz0, -gx, gz1], [gx, gz0, gx, gz1], [-gx, gz1, -0.9, gz1], [0.9, gz1, gx, gz1]].forEach(([a, b, c2, d2]) => { BOX(verm, Math.min(a, c2) - 0.06, 0.95, Math.min(b, d2) - 0.06, Math.max(a, c2) + 0.06, 1.05, Math.max(b, d2) + 0.06); const L = Math.hypot(c2 - a, d2 - b), n = Math.max(1, Math.round(L / 0.9)); for (let i = 0; i <= n; i++) P(g.box, verm, a + (c2 - a) * i / n, 0.5, b + (d2 - b) * i / n, 0.12, 1.0, 0.12); B.solid(Math.min(a, c2) - 0.1, Math.min(b, d2) - 0.1, Math.max(a, c2) + 0.1, Math.max(b, d2) + 0.1, 'fence'); });
          B.solid(-hw / 2 - 0.6, hz - hd / 2 - 0.6, hw / 2 + 0.6, hz + hd / 2 + 0.6, 'house');
        }
        // 狛犬（台階前面兩邊、面對面）、手水舍（右前方）
        if (o.komainu !== false) [-1, 1].forEach(sd => B.komainu(sd * 3.2, kz + 3.2, sd * Math.PI / 2));
        if (o.temizu !== false) {
          const tx = w / 2 + 2.8, tz = kz + 1.5;
          [[-1, -0.8], [1, -0.8], [-1, 0.8], [1, 0.8]].forEach(([a, b]) => P(g.cyl8, woodB, tx + a, 1.3, tz + b, 0.2, 2.6, 0.2));
          B.roof(tx, tz, 2.6, 2.2, { type: 'gable', y: 2.6, h: 0.8, o: 0.4, sori: 0.2, mat, under: 'woodD', gableWall: false });
          BOX(st, tx - 0.85, 0, tz - 0.45, tx + 0.85, 0.75, tz + 0.45); BOX(M('glass'), tx - 0.7, 0.72, tz - 0.32, tx + 0.7, 0.76, tz + 0.32);
          [-0.4, 0, 0.4].forEach(a => P(g.cyl8, M('wood'), tx + a, 0.85, tz, 0.1, 0.12, 0.1));
          B.solid(tx - 0.95, tz - 0.5, tx + 0.95, tz + 0.5, 'deco');
        }
        // 地圖的輪廓
        const pts = [[-w / 2 - 1.2, -d / 2 - 1.2], [w / 2 + 1.2, -d / 2 - 1.2], [w / 2 + 1.2, d / 2 + 1.2], [-w / 2 - 1.2, d / 2 + 1.2]].map(p => B.toWorld(p[0], p[1]));
        B.D.foot.push({ poly: pts, kind: 'temple', h: top + 3 });
        return { kz, front: B.toWorld(0, kz + 1.8) };
      } finally { if (fr0) B.Bt.setFrame(fr0.x, fr0.z, fr0.a); else B.Bt.setFrame(null); }
    };
  };
})(window.R);
