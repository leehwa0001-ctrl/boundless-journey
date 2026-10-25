// 五重塔（2026-10-26 作者：繼續把城市的建模都優化）
// B.pagoda(x, z, y0, { w, n, shr, mat })：n 層的木塔（皇嶺・昭光寺）。原本是一層一層的方塊＋金字塔屋頂，改成：
// - 每層：白牆退在裡面，朱紅的柱子（四角＋每面兩根）、頭貫（上面一圈朱紅的樑）、正中間的門（朱框、深色門扇、金色的門釘），兩邊的連子窗；
// - 屋簷下一圈斗栱（小方塊）；屋頂用 CK.hipGeo 的反翹深簷（下層是一圈環狀的，最上面一層是寶形）；
// - 相輪：露盤、九輪、水煙、寶珠。
// 回傳塔頂的高度。不加碰撞（呼叫的地方自己 B.solid）。
(function (R) {
  const CK = R.CK; if (!CK) return;
  const eb0 = CK.extendBuilder;
  CK.extendBuilder = B => {
    eb0(B);
    const M = CK.M, g = B.g, P = B.part, BOX = B.box;
    B.pagoda = (x, z, y0, o) => {
      o = o || {}; const n = o.n || 5, W0 = o.w || 7.2, shr = o.shr || 0.6, RM = M(o.mat || 'kawara', o.mat ? undefined : { col: '#6A6E78' }), verm = M('verm'), white = M('white'), gold = M('gold'), dark = M('woodB');
      let y = y0, w = W0;
      for (let i = 0; i < n; i++) {
        const hh = i === 0 ? 3.4 : 2.5, last = i === n - 1, h2 = w / 2;
        BOX(white, x - h2 + 0.15, y, z - h2 + 0.15, x + h2 - 0.15, y + hh, z + h2 - 0.15);
        BOX(verm, x - h2, y + hh - 0.42, z - h2, x + h2, y + hh, z + h2);   // 頭貫
        if (i === 0) BOX(verm, x - h2 - 0.05, y, z - h2 - 0.05, x + h2 + 0.05, y + 0.25, z + h2 + 0.05);   // 地覆
        const bay = w / 3;
        [-h2, -h2 + bay, h2 - bay, h2].forEach(a => [-h2, -h2 + bay, h2 - bay, h2].forEach(b => { if (Math.abs(a) < h2 - 0.01 && Math.abs(b) < h2 - 0.01) return; P(g.box, verm, x + a, y + hh / 2, z + b, 0.3, hh, 0.3); }));
        // 每一面：中間的門、兩邊的連子窗
        [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([ax, az]) => {
          const fx = x + ax * (h2 - 0.1), fz = z + az * (h2 - 0.1), along = !ax, dh = hh - 0.75;
          const bx = (lat, out, sw, sh, sy, m) => P(g.box, m, fx + (along ? lat : ax * out), y + sy, fz + (along ? az * out : lat), along ? sw : 0.06, sh, along ? 0.06 : sw);
          bx(0, 0.02, bay - 0.5, dh, 0.1 + dh / 2, verm); bx(0, 0.05, bay - 0.8, dh - 0.25, 0.1 + dh / 2, dark);
          for (let r = 0; r < 3; r++) [-0.35, 0.35].forEach(l => bx(l * (bay - 0.8), 0.09, 0.07, 0.07, 0.6 + r * (dh - 0.6) / 2, gold));
          [-bay, bay].forEach(lat => { bx(lat, 0.02, bay - 0.7, hh * 0.38, hh * 0.45, M('black')); for (let k = -3; k <= 3; k++) bx(lat + k * (bay - 0.7) / 8, 0.05, 0.05, hh * 0.38, hh * 0.45, verm); });
        });
        // 斗栱：屋簷下一圈
        const ring = (yy, off, sz, m, step) => [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([ax, az]) => { const L = w + off * 2, k = Math.max(2, Math.round(L / step)); for (let j = 0; j <= k; j++) { const t = -L / 2 + L * j / k; P(g.box, m, x + (ax ? ax * (h2 + off) : t), yy, z + (az ? az * (h2 + off) : t), sz, sz * 0.8, sz); } });
        ring(y + hh + 0.12, 0.15, 0.32, M('woodD'), 0.75); ring(y + hh + 0.38, 0.45, 0.28, verm, 0.75);
        const ov = 1.9;
        if (!last) {
          const nw = w - 2 * shr, run = shr + ov, H = run * 0.34, ye = y + hh + 0.5;
          B.hip(x, ye, z, nw, nw, 0, RM, { o: run, ring: true, h: H, sori: 0.55, fine: true, edge: 'white', under: 'verm' });
          y = ye + H - 0.25; w = nw;
        } else {
          const rf = CK.hipGeo(w, w, { o: ov, h: (h2 + ov) * 0.42, sori: 0.6, fine: true }), ye = y + hh + 0.5;
          B.hip(x, ye, z, w, w, 0, RM, { o: ov, h: rf.H, sori: 0.6, fine: true, edge: 'white', under: 'verm' });
          y = ye + rf.H;
        }
      }
      // 相輪
      const bz = M('bronze');
      BOX(bz, x - 0.75, y - 0.1, z - 0.75, x + 0.75, y + 0.45, z + 0.75); P(g.sph, bz, x, y + 0.75, z, 0.9, 0.6, 0.9);
      P(g.cyl8, bz, x, y + 4.2, z, 0.26, 7, 0.26);
      for (let k = 0; k < 9; k++) P(g.torus, bz, x, y + 1.6 + k * 0.5, z, 0.95 - k * 0.04, 0.95 - k * 0.04, 0.95 - k * 0.04, Math.PI / 2, 0, 0);
      [0, Math.PI / 2].forEach(r => P(g.box, bz, x, y + 6.6, z, 1.1, 0.9, 0.06, 0, r, 0));   // 水煙
      P(g.sph, bz, x, y + 7.4, z, 0.36, 0.36, 0.36); P(g.sph, gold, x, y + 7.9, z, 0.3, 0.42, 0.3);
      return y + 8.1;
    };
  };
})(window.R);
