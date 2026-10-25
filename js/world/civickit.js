// 車站、公會分館細化（2026-10-26 作者：繼續把城市的建模都優化，全部優化）
// 包住 cityhelp.js 的 CK.H.station、CK.H.guild（八座城共用），原本的照舊（門、互動、招牌不動），再加：
// - 車站：大樓上一座鐘塔（四面的鐘、寄棟的小屋頂、尖頂）、入口的石框；站前廣場兩邊的花壇（矮籬笆）、腳踏車架、計程車招呼站的站牌；
//   平頂的車站另加女兒牆、玻璃天窗、冷氣室外機。
// - 公會分館：門口的門廊（兩根柱子、三角山牆）、石階、兩盞門燈、門上方綠色的公會紋章（盾形＋交叉的兩把金色的劍）。
// 放在 cityhelp.js 後面、city_*.js 前面。
(function (R) {
  const CK = R.CK; if (!CK || !CK.H) return;
  const H = CK.H;
  const st0 = H.station;
  H.station = (B, o) => {
    st0(B, o);
    try {
      const M = CK.M, g = B.g, P = B.part, cx = o.cx || 0, z0 = o.z0 || 124, w = o.w || 70, d = o.d || 22, h = o.h || 10;
      // 鐘塔（大樓裡面、入口的正上方）
      const tz = z0 + 3.2, th = 7.5, tw = 4.4, col = o.col || '#A0503A';
      B.box(M('paint', { col }), cx - tw / 2, h, tz - tw / 2, cx + tw / 2, h + th, tz + tw / 2);
      B.box(M('ashlar'), cx - tw / 2 - 0.2, h + th - 0.4, tz - tw / 2 - 0.2, cx + tw / 2 + 0.2, h + th, tz + tw / 2 + 0.2);
      [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([sx, sz]) => {
        const x = cx + sx * (tw / 2 + 0.03), z = tz + sz * (tw / 2 + 0.03), ry = sx ? Math.PI / 2 : 0;
        P(g.cyl24, M('white'), x, h + th - 2.2, z, 2.6, 0.08, 2.6, sx ? 0 : Math.PI / 2, 0, sx ? Math.PI / 2 : 0);
        P(g.cyl24, M('black'), x - sx * 0.03, h + th - 2.2, z - sz * 0.03, 2.8, 0.05, 2.8, sx ? 0 : Math.PI / 2, 0, sx ? Math.PI / 2 : 0);
        P(g.box, M('black'), x + sx * 0.08, h + th - 1.85, z + sz * 0.08, sx ? 0.05 : 0.12, 0.8, sx ? 0.12 : 0.05);   // 長針
        P(g.box, M('black'), x + sx * 0.08 + (sx ? 0 : 0.25), h + th - 2.2, z + sz * 0.08 + (sx ? 0.25 : 0), sx ? 0.05 : 0.55, 0.12, sx ? 0.55 : 0.05);   // 短針
      });
      B.roof(cx, tz, tw + 0.4, tw + 0.4, { type: 'hip', y: h + th, h: 2.2, o: 0.4, mat: o.roof || 'copper', ridge: false });
      P(g.cyl8, M('gold'), cx, h + th + 3.4, tz, 0.12, 2.4, 0.12); P(g.sph, M('gold'), cx, h + th + 2.3, tz, 0.4, 0.4, 0.4);
      // 入口的石框（兩根壁柱、上面的楣石和拱心石；招牌「入口・售票口」在楣石下面）
      const ly = Math.min(6.2, h - 3.2);
      B.box(M('ashlar'), cx - 5.0, 0.3, z0 - 0.45, cx - 4.45, ly, z0 + 0.05); B.box(M('ashlar'), cx + 4.45, 0.3, z0 - 0.45, cx + 5.0, ly, z0 + 0.05);
      B.box(M('ashlar'), cx - 5.3, ly, z0 - 0.5, cx + 5.3, ly + 0.5, z0 + 0.05); B.box(M('ashlar'), cx - 0.4, ly - 0.15, z0 - 0.6, cx + 0.4, ly + 0.65, z0 - 0.45);
      // 站前廣場：花壇（矮籬笆，擋人）、腳踏車架、計程車招呼站
      [-1, 1].forEach(sd => {
        const bx = cx + sd * (w / 2 - 7), bz = z0 - 10.5;   // 花壇：雨棚前面、靠兩端（廣場中間留給人走）
        B.box(M('ashlar'), bx - 3.6, 0, bz - 1.4, bx + 3.6, 0.45, bz + 1.4); B.box(M('soil'), bx - 3.3, 0.45, bz - 1.1, bx + 3.3, 0.5, bz + 1.1);
        for (let k = 0; k < 5; k++) P(g.ico, M('hedge'), bx - 2.6 + k * 1.3, 0.9, bz + (k % 2 ? 0.35 : -0.35), 1.1, 0.85, 1.1);
        B.solid(bx - 3.6, bz - 1.4, bx + 3.6, bz + 1.4, 'deco');
        const rx = cx + sd * (w / 2 - 1), rz = z0 - 8;   // 腳踏車架
        for (let k = 0; k < 6; k++) { P(g.box, M('steelD'), rx, 0.45, rz - 2.5 + k * 1.0, 0.04, 0.9, 0.5); }
        B.box(M('steelD'), rx - 0.05, 0.02, rz - 3, rx + 0.05, 0.08, rz + 3); B.solid(rx - 0.3, rz - 3, rx + 0.3, rz + 3, 'deco');
      });
      // 平頂（沒有 o.roof）的車站：女兒牆、屋頂中間一條長的玻璃天窗、後面一排冷氣室外機
      if (!o.roof) {
        const x0 = cx - w / 2, x1 = cx + w / 2, z1 = z0 + d, pm = M('ashlar');
        B.box(pm, x0, h, z0, x1, h + 0.7, z0 + 0.3); B.box(pm, x0, h, z1 - 0.3, x1, h + 0.7, z1); B.box(pm, x0, h, z0, x0 + 0.3, h + 0.7, z1); B.box(pm, x1 - 0.3, h, z0, x1, h + 0.7, z1);
        const sz = z0 + d * 0.62, sl = w * 0.72;
        B.box(M('steelD'), cx - sl / 2 - 0.2, h, sz - 1.8, cx + sl / 2 + 0.2, h + 0.4, sz + 1.8);
        P(g.prism, M('glassL'), cx, h + 0.4, sz, 3.4, 1.3, sl, 0, Math.PI / 2, 0);
        for (let k = 0; k <= Math.round(sl / 3); k++) P(g.prism, M('steelD'), cx - sl / 2 + k * sl / Math.round(sl / 3), h + 0.4, sz, 3.5, 1.35, 0.1, 0, Math.PI / 2, 0);
        for (let k = 0; k < 6; k++) { const ax = x0 + 4 + k * 2.4; if (ax > cx - 4) break; B.box(M('metal', { col: '#D8D8D4' }), ax - 0.9, h, z1 - 3.2, ax + 0.9, h + 1.1, z1 - 1.6); P(g.cyl24, M('steelD'), ax, h + 1.12, z1 - 2.4, 1.1, 0.04, 1.1); }
      }
      const ts = [cx + 12, z0 - 16];   // 計程車招呼站的站牌
      P(g.cyl8, M('steelD'), ts[0], 1.5, ts[1], 0.12, 3.0, 0.12); B.sign('計程車', 'n', ts[1] - 0.08, ts[0], 2.8, { size: 0.36, bg: '#1A3A6A', fg: '#FFFFFF', box: 1, lit: 1 }); B.solid(ts[0] - 0.15, ts[1] - 0.15, ts[0] + 0.15, ts[1] + 0.15, 'deco');
      void d;
    } catch (e) { console.warn('[civickit] station', e); }
  };
  const gd0 = H.guild;
  H.guild = (B, r, face, o) => {
    gd0(B, r, face, o);
    try {
      const M = CK.M, g = B.g, P = B.part, [x0, z0, x1, z1] = r, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      const c = { s: z1, n: z0, e: x1, w: x0 }[face], sg = face === 's' || face === 'e' ? 1 : -1, along = face === 's' || face === 'n', m = along ? cx : cz;
      const at = (out, lat) => (along ? [m + lat, c + sg * out] : [c + sg * out, m + lat]);
      // 門廊：兩根柱子、上面的平台、三角山牆
      [-1.9, 1.9].forEach(lat => { const [px, pz] = at(1.4, lat); P(g.cyl, M('cream'), px, 1.5, pz, 0.5, 3.0, 0.5); P(g.box, M('ashlar'), px, 0.15, pz, 0.8, 0.3, 0.8); B.solid(px - 0.3, pz - 0.3, px + 0.3, pz + 0.3, 'deco'); });
      { const [px, pz] = at(0.8, 0); P(g.box, M('ashlar'), px, 3.2, pz, along ? 5.0 : 1.9, 0.4, along ? 1.9 : 5.0); P(g.prism, M('ashlar'), px, 3.4, pz, 5.2, 0.7, 1.9, 0, along ? 0 : Math.PI / 2, 0); }
      { const [px, pz] = at(0.35, 0); P(g.box, M('ashlar'), px, 0.08, pz, along ? 4.6 : 0.7, 0.16, along ? 0.7 : 4.6); }   // 石階
      // 門燈
      [-2.9, 2.9].forEach(lat => { const [px, pz] = at(0.25, lat); P(g.box, M('black'), px, 2.4, pz, 0.32, 0.5, 0.32); P(g.box, CK.mat('toroLamp', { col: '#FFF0D0', em: '#FFC27A', ei: 0, lamp: true, snow: 0 }), px, 2.4, pz, 0.24, 0.38, 0.24); B.lampAt(px, pz); });
      // 公會紋章（綠底的盾＋交叉的兩把金色的劍）：門上方、招牌的上面
      if ((o.h || 12) >= 8.5) {
        const [px, pz] = at(0.08, 0), [qx, qz] = at(0.17, 0), gold = M('gold');
        P(g.box, M('green'), px, 7.3, pz, along ? 1.6 : 0.12, 1.8, along ? 0.12 : 1.6);
        [0.62, -0.62].forEach(r => {
          if (along) { P(g.box, gold, qx, 7.3, qz, 0.12, 1.6, 0.04, 0, 0, r); P(g.box, gold, qx - Math.sin(-r) * 0.55, 7.3 - Math.cos(r) * 0.55, qz, 0.36, 0.08, 0.05, 0, 0, r); }
          else { P(g.box, gold, qx, 7.3, qz, 0.04, 1.6, 0.12, r, 0, 0); P(g.box, gold, qx, 7.3 - Math.cos(r) * 0.55, qz - Math.sin(r) * 0.55, 0.05, 0.08, 0.36, r, 0, 0); }
        });
      }
      void cz; void x1; void z1;
    } catch (e) { console.warn('[civickit] guild', e); }
  };
})(window.R);
