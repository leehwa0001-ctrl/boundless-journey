// 五重塔、本堂、鐘樓（2026-10-26 作者：繼續把城市的建模都優化）
// B.pagoda(x, z, y0, { w, n, shr, mat })：n 層的木塔（皇嶺・昭光寺）。原本是一層一層的方塊＋金字塔屋頂，改成：
// - 每層：白牆退在裡面，朱紅的柱子（四角＋每面兩根）、頭貫（上面一圈朱紅的樑）、正中間的門（朱框、深色門扇、金色的門釘），兩邊的連子窗；
// - 屋簷下一圈斗栱（小方塊）；屋頂用 CK.hipGeo 的反翹深簷（下層是一圈環狀的，最上面一層是寶形）；
// - 相輪：露盤、九輪、水煙、寶珠。
// 回傳塔頂的高度。不加碰撞（呼叫的地方自己 B.solid）。
// B.hondo(x0, z0, x1, z1, { face, h, mat, lit })：寺的本堂（東鶴寺、板南・仰天寺）。石的基壇、繞一圈的緣側和欄杆、柱子、白的小壁、
//   腰板、正面中間亮著的格子門、前面的木階和向拜（小的切妻屋頂＋兩根柱子）、入母屋的大屋頂。只有向拜的兩根柱子加碰撞（本體呼叫的地方自己 B.solid）。
// B.shoro(x, z, { s, mat })：鐘樓。石的基壇、四根往內斜一點的柱子、上下兩道貫、吊著的梵鐘（龍頭、撞座）、用繩子吊著的撞木、入母屋的屋頂。不加碰撞。
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
    B.hondo = (x0, z0, x1, z1, o) => {
      o = o || {}; const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, face = o.face || 's', a = { s: 0, e: Math.PI / 2, n: Math.PI, w: -Math.PI / 2 }[face];
      const ew = face === 'e' || face === 'w', W = ew ? z1 - z0 : x1 - x0, D = ew ? x1 - x0 : z1 - z0, h = o.h || 6, wood = M('woodB'), woodD = M('woodD'), wall = M('cream');
      B.frame(cx, cz, a, () => {
        const hw = W / 2, hd = D / 2, fy = 0.7;
        BOX(M('ashlar'), -hw - 0.4, 0, -hd - 0.4, hw + 0.4, 0.55, hd + 0.4);
        BOX(woodD, -hw - 0.2, 0.55, -hd - 0.2, hw + 0.2, fy, hd + 0.2);   // 緣側
        BOX(wall, -hw + 0.9, fy, -hd + 0.9, hw - 0.9, h, hd - 0.9);
        BOX(wood, -hw + 0.88, fy, -hd + 0.88, hw - 0.88, fy + 1.0, hd - 0.88);   // 腰板
        BOX(wood, -hw + 0.85, h - 1.4, -hd + 0.85, hw - 0.85, h - 1.15, hd - 0.85);   // 長押
        BOX(wood, -hw + 0.85, h - 0.4, -hd + 0.85, hw - 0.85, h, hd - 0.85);   // 頭貫
        const nx = Math.max(3, Math.round((W - 1.8) / 2.4)), nz = Math.max(2, Math.round((D - 1.8) / 2.4)), bx = (W - 1.8) / nx, bz = (D - 1.8) / nz;
        for (let i = 0; i <= nx; i++) [-1, 1].forEach(sd => P(g.cyl8, wood, -hw + 0.9 + i * bx, (fy + h) / 2, sd * (hd - 0.9), 0.36, h - fy, 0.36));
        for (let j = 1; j < nz; j++) [-1, 1].forEach(sd => P(g.cyl8, wood, sd * (hw - 0.9), (fy + h) / 2, -hd + 0.9 + j * bz, 0.36, h - fy, 0.36));
        // 正面：中間幾格是亮著的格子門
        const lit = o.lit === false ? M('woodD') : M('shopLit'), mid = Math.max(1, nx - 2);
        for (let i = Math.floor((nx - mid) / 2); i < Math.floor((nx - mid) / 2) + mid; i++) {
          const l = -hw + 0.9 + i * bx + 0.22, r = l + bx - 0.44;
          BOX(lit, l, fy + 0.15, hd - 0.92, r, h - 1.45, hd - 0.86);
          for (let k = 1; k < 6; k++) BOX(wood, l + (r - l) * k / 6 - 0.03, fy + 0.15, hd - 0.87, l + (r - l) * k / 6 + 0.03, h - 1.45, hd - 0.83);
          for (let k = 1; k < 5; k++) { const yy = fy + 0.15 + (h - 1.6 - fy) * k / 5; BOX(wood, l, yy - 0.03, hd - 0.87, r, yy + 0.03, hd - 0.83); }
        }
        // 緣側的欄杆（正面中間留給階梯）
        const rail = (ax0, az0, ax1, az1) => { const L = Math.hypot(ax1 - ax0, az1 - az0), n = Math.max(1, Math.round(L / 1.6)); for (let k = 0; k <= n; k++) P(g.box, wood, ax0 + (ax1 - ax0) * k / n, fy + 0.4, az0 + (az1 - az0) * k / n, 0.12, 0.8, 0.12); BOX(wood, Math.min(ax0, ax1) - 0.05, fy + 0.72, Math.min(az0, az1) - 0.05, Math.max(ax0, ax1) + 0.05, fy + 0.82, Math.max(az0, az1) + 0.05); };
        const e = hw + 0.1, f2 = hd + 0.1; rail(-e, -f2, e, -f2); rail(-e, -f2, -e, f2); rail(e, -f2, e, f2); rail(-e, f2, -2.4, f2); rail(2.4, f2, e, f2);
        // 木階＋向拜
        for (let k = 0; k < 4; k++) BOX(woodD, -2.2, fy - 0.175 * (k + 1), f2 + 0.1 + k * 0.35, 2.2, fy - 0.175 * k, f2 + 0.45 + k * 0.35);
        [-2.5, 2.5].forEach(lx => { P(g.cyl8, wood, lx, (fy + h - 1.2) / 2, hd + 2.0, 0.3, h - 1.2 - fy, 0.3); B.solid(lx - 0.2, hd + 1.8, lx + 0.2, hd + 2.2, 'deco'); });
        BOX(wood, -2.8, h - 1.5, hd + 1.82, 2.8, h - 1.2, hd + 2.18);
        B.roof(0, hd + 1.4, 3.2, 6.0, { type: 'gable', y: h - 1.2, h: 1.3, o: 0.5, ry: Math.PI / 2, sori: 0.25, mat: o.mat || 'kawara', gableWall: false, ridge: false });
        B.roof(0, 0, W - 0.6, D - 0.6, { type: 'irimoya', y: h, h: Math.min(5, D * 0.32), o: 1.9, sori: 0.45, mat: o.mat || 'kawara' });
      });
    };
    B.shoro = (x, z, o) => {
      o = o || {}; const k = o.s || 1, wood = M('woodB'), bz = M('bronze'), hw = 2.4 * k, H = 5.2 * k;
      BOX(M('ashlar'), x - hw - 0.7 * k, 0, z - hw - 0.7 * k, x + hw + 0.7 * k, 0.7 * k, z + hw + 0.7 * k);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => P(g.cyl8, wood, x + sx * hw * 0.96, 0.7 * k + H / 2, z + sz * hw * 0.96, 0.34 * k, H, 0.34 * k, sz * 0.03, 0, -sx * 0.03));
      [0.7 * k + 0.9 * k, 0.7 * k + H - 0.3 * k].forEach(yy => { BOX(wood, x - hw - 0.2, yy - 0.12 * k, z - hw, x + hw + 0.2, yy + 0.12 * k, z - hw + 0.22 * k); BOX(wood, x - hw - 0.2, yy - 0.12 * k, z + hw - 0.22 * k, x + hw + 0.2, yy + 0.12 * k, z + hw); BOX(wood, x - hw, yy - 0.12 * k, z - hw - 0.2, x - hw + 0.22 * k, yy + 0.12 * k, z + hw + 0.2); BOX(wood, x + hw - 0.22 * k, yy - 0.12 * k, z - hw - 0.2, x + hw, yy + 0.12 * k, z + hw + 0.2); });
      const top = 0.7 * k + H;
      BOX(wood, x - 0.15 * k, top - 0.5 * k, z - hw, x + 0.15 * k, top - 0.2 * k, z + hw);   // 吊鐘的樑
      const by = top - 2.9 * k;   // 梵鐘：本體、肩（半球）、龍頭、撞座、下緣
      P(g.cyl24, bz, x, by, z, 1.5 * k, 1.9 * k, 1.5 * k); P(g.hemi, bz, x, by + 0.95 * k, z, 1.5 * k, 0.5 * k, 1.5 * k); P(g.box, bz, x, by + 1.35 * k, z, 0.22 * k, 0.4 * k, 0.5 * k);
      P(g.cyl24, bz, x, by - 0.9 * k, z, 1.62 * k, 0.14 * k, 1.62 * k); [-0.3, 0.3].forEach(dy => P(g.cyl24, bz, x, by + dy * k, z, 1.54 * k, 0.06 * k, 1.54 * k));
      P(g.cyl24, M('gold'), x + 0.76 * k, by - 0.35 * k, z, 0.3 * k, 0.05 * k, 0.3 * k, 0, 0, Math.PI / 2);
      P(g.cyl8, M('woodD'), x + 1.9 * k, by - 0.35 * k, z, 0.34 * k, 1.6 * k, 0.34 * k, 0, 0, Math.PI / 2);   // 撞木
      [-0.5, 0.5].forEach(dz => P(g.box, M('kawara', { col: '#C8B890' }), x + 1.9 * k + dz * 0.6 * k, by + 0.85 * k, z, 0.04, 2.4 * k, 0.04));
      B.roof(x, z, hw * 2 + 0.6, hw * 2 + 0.6, { type: 'irimoya', y: top, h: 2.2 * k, o: 1.0 * k, sori: 0.4, mat: o.mat || 'kawara' });
    };
  };
})(window.R);
