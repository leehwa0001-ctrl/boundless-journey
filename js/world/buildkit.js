// 大樓重做：不再是貼了窗戶圖的方塊（2026-10-22 作者：除了房子，……那些也要重做；應該不只這些模型要重做）
// 包住 B.bld：style office／apt／glass／brick 照原本蓋好（窗戶的貼圖、碰撞、地圖輪廓都不變），再在外面加立體的部分：
// - 辦公（office）：一樓的石材基座、窗和窗之間的壁柱（照貼圖的窗距對齊，不會切到窗）、四個角的角柱、頂上厚一點的簷口、
//   正面的入口（玻璃門、雨遮、兩根柱子）、高的樓頂上的天線。
// - 公寓（apt）：陽台上的冷氣室外機和晒衣竿、正面的入口雨遮、樓頂的水塔和電梯機房。
// - 玻璃大樓（glass）：每層一條深色的層間帶、頂上縮進去的一圈發光的頂冠、一樓大廳的雨遮。
// - 紅磚（brick）：白色的壁柱、每層一條石材的腰帶、頂上的簷口和齒飾、正面的門廊（兩根柱子＋三角山牆）。
// 有店名的（一樓是店面）正面的壁柱從二樓開始，不擋招牌；o.plain（公會、車站這些自己會加東西的）只加基座和簷口。
// 放在 housekit.js 後面（包住 CK.extendBuilder）。
(function (R) {
  const CK = R.CK; if (!CK || !CK.extendBuilder) return;
  const eb0 = CK.extendBuilder;
  CK.extendBuilder = B => {
    eb0(B);
    const M = CK.M, g = B.g, P = B.part, BOX = B.box, rnd = B.rnd, pk = B.pk;
    const META = { office: [3, 3.5], apt: [3.6, 2.9], glass: [3, 3.6], brick: [3.4, 4.2] };
    const deco = (o, res) => {
      const st = o.style, [x0, z0, x1, z1] = o.r, h = (res && res.h) || o.h || 12, f = o.face || 's';
      const faces = { s: [z1, x0, x1], n: [z0, x0, x1], e: [x1, z0, z1], w: [x0, z0, z1] };
      const fb = (fc, aa, ab, y0, y1, o0, o1, m) => { const [c] = faces[fc], sg = fc === 's' || fc === 'e' ? 1 : -1; if (fc === 's' || fc === 'n') BOX(m, Math.min(aa, ab), y0, Math.min(c + sg * o0, c + sg * o1), Math.max(aa, ab), y1, Math.max(c + sg * o0, c + sg * o1)); else BOX(m, Math.min(c + sg * o0, c + sg * o1), y0, Math.min(aa, ab), Math.max(c + sg * o0, c + sg * o1), y1, Math.max(aa, ab)); };
      const ring2 = (a0, b0, a1, b1, y0, y1, m) => { BOX(m, a0 - 0.15, y0, b0 - 0.15, a1 + 0.15, y1, b0 + 0.15); BOX(m, a0 - 0.15, y0, b1 - 0.15, a1 + 0.15, y1, b1 + 0.15); BOX(m, a0 - 0.15, y0, b0, a0 + 0.15, y1, b1); BOX(m, a1 - 0.15, y0, b0, a1 + 0.15, y1, b1); };
      const ring = (y0, y1, out, m) => { BOX(m, x0 - out, y0, z0 - out, x1 + out, y1, z0 + 0.02); BOX(m, x0 - out, y0, z1 - 0.02, x1 + out, y1, z1 + out); BOX(m, x0 - out, y0, z0, x0 + 0.02, y1, z1); BOX(m, x1 - 0.02, y0, z0, x1 + out, y1, z1); };
      const [bay, fh] = META[st] || [3, 3.5];
      // 窗和窗中間的位置（照 citykit.js 貼圖的算法：窗距 bay，從牆面兩端平均留邊）
      const gaps = (a0, a1) => { const L = a1 - a0, n = Math.floor(L / bay + 1e-6), off = (L - n * bay) / 2, out = []; for (let k = 0; k <= n; k++) out.push(a0 + off + k * bay); return out; };
      const named = !!o.name, plain = !!o.plain;
      const w = x1 - x0, d = z1 - z0;
      if (st === 'office') {
        const base = Math.min(fh, h * 0.3), stone = M(pk(['ashlar', 'concD', 'gran']));
        if (h > 6) ['s', 'n', 'e', 'w'].forEach(fc => { if (named && fc === f) return; const [, a, b] = faces[fc]; fb(fc, a - 0.12, b + 0.12, 0, base, 0, 0.12, stone); });
        const pm = M(pk(['curb', 'curb', 'steelD', 'concD']));
        if (!plain) ['s', 'n', 'e', 'w'].forEach(fc => { const [, a, b] = faces[fc], y0 = named && fc === f ? Math.max(base, 4.8) : base; if (h - y0 < 3) return; gaps(a, b).forEach(p => { if (p - a < 0.3 || b - p < 0.3) return; fb(fc, p - 0.11, p + 0.11, y0, h - 0.1, 0, 0.18, pm); }); });
        [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].forEach(([x, z]) => BOX(pm, x - 0.22, base, z - 0.22, x + 0.22, h, z + 0.22));   // 角柱
        if (h > 10) ring(h - 0.6, h - 0.05, 0.32, M('curb'));
        if (!named && !plain && h > 6) { const [, a, b] = faces[f], m = (a + b) / 2; fb(f, m - 1.3, m + 1.3, 0.1, 2.7, 0, 0.06, M('glassL')); fb(f, m - 1.4, m + 1.4, 2.7, 2.85, 0, 0.08, M('steelD')); fb(f, m - 2.2, m + 2.2, 3.1, 3.3, 0, 1.8, M('steelD')); [-1.9, 1.9].forEach(k => fb(f, m + k - 0.08, m + k + 0.08, 0, 3.1, 1.62, 1.78, M('steelD'))); }
        // 樓頂往內縮的一段（階梯狀的頂）：用同一種窗戶貼圖
        if (h >= 14 && !plain && w >= 10 && d >= 10) { const ins = Math.min(w, d) * 0.2, uh = fh * Math.max(1, Math.round(h / 16)), fm = CK.facMat('office', pk(['#C8C4BC', '#D8D4CC', '#B8BCC0', '#E2DED6'])); BOX(fm, x0 + ins, h + 0.3, z0 + ins, x1 - ins, h + 0.3 + uh, z1 - ins); ring2(x0 + ins, z0 + ins, x1 - ins, z1 - ins, h + 0.3 + uh - 0.1, h + 0.3 + uh + 0.5, M('curb')); }
        if (h > 22 && o.top !== false) { const cx = (x0 + x1) / 2 + w * 0.2, cz = (z0 + z1) / 2; P(g.cyl8, M('steelD'), cx, h + 1.3 + 3.5, cz, 0.16, 7, 0.16); P(g.sph, CK.mat('bkRed', { col: '#FF3A2A', em: '#FF3A2A', ei: 0, lamp: true, snow: 0 }), cx, h + 8.4, cz, 0.35, 0.35, 0.35); }
      } else if (st === 'apt') {
        const sg = f === 's' || f === 'e' ? 1 : -1, [c, a, b] = faces[f], along = f === 's' || f === 'n';
        if (!plain) for (let y = fh; y < h - 1; y += fh) for (let p = a + 1.8; p < b - 1; p += 3.6) {
          // 陽台上的室外機（靠一邊）、晒衣竿
          const ax = p - 1.0, dep = 0.75;
          if (rnd() < 0.7) { if (along) BOX(M('metal', { col: '#D8D8D4' }), ax - 0.4, y + 0.06, Math.min(c + sg * 0.2, c + sg * dep), ax + 0.4, y + 0.66, Math.max(c + sg * 0.2, c + sg * dep)); else BOX(M('metal', { col: '#D8D8D4' }), Math.min(c + sg * 0.2, c + sg * dep), y + 0.06, ax - 0.4, Math.max(c + sg * 0.2, c + sg * dep), y + 0.66, ax + 0.4); }
          if (rnd() < 0.5) fb(f, p - 1.4, p + 1.4, y + 1.75, y + 1.79, 0.55, 0.59, M('metal'));
        }
        if (!plain && h > 5) { const m = (a + b) / 2; fb(f, m - 1.8, m + 1.8, 2.5, 2.65, 0, 1.4, M('curb')); fb(f, m - 1.0, m + 1.0, 0.1, 2.4, 0, 0.05, M('glassL')); }
        if (o.top !== false && w > 8 && d > 8) { const tx = x0 + w * 0.25, tz = z0 + d * 0.5; BOX(M('curb'), tx - 1.6, h + 1.0, tz - 1.6, tx + 1.6, h + 3.6, tz + 1.6); P(g.cyl, M('metal', { col: '#C8CCD0' }), x1 - w * 0.25, h + 1.0 + 2.6, tz, 2.4, 1.8, 2.4); [-0.7, 0.7].forEach(k => P(g.cyl8, M('steelD'), x1 - w * 0.25 + k, h + 1.0 + 0.85, tz + k, 0.12, 1.7, 0.12)); }
      } else if (st === 'glass') {
        const dark = M('steelD');
        ['s', 'n', 'e', 'w'].forEach(fc => { const [, a, b] = faces[fc]; for (let y = fh; y < h - 0.5; y += fh) fb(fc, a, b, y - 0.22, y + 0.12, 0, 0.05, dark); });
        if (h > 14 && o.top !== false) { const ins = Math.min(2, w * 0.15, d * 0.15); BOX(M('glass'), x0 + ins, h, z0 + ins, x1 - ins, h + 3.2, z1 - ins); BOX(CK.mat('bkCrown', { col: '#DDEEFF', em: '#BBDDFF', ei: 0, lamp: true, snow: 0 }), x0 + ins - 0.05, h + 3.0, z0 + ins - 0.05, x1 - ins + 0.05, h + 3.3, z1 - ins + 0.05); }
        if (!named && !plain) { const [, a, b] = faces[f], m = (a + b) / 2; fb(f, m - 3, m + 3, 3.4, 3.6, 0, 2.4, dark); }
      } else if (st === 'brick') {
        const stone = M('ashlar'), white = M('cream');
        if (h > 5) for (let y = 1.3 + fh; y < h - 1; y += fh) ring(y - 0.1, y + 0.12, 0.08, stone);   // 腰帶
        if (!plain) ['s', 'n', 'e', 'w'].forEach(fc => { const [, a, b] = faces[fc], y0 = named && fc === f ? 4.8 : 1.3; gaps(a, b).forEach(p => { if (p - a < 0.3 || b - p < 0.3) return; fb(fc, p - 0.16, p + 0.16, y0, h - 0.3, 0, 0.12, white); }); });
        [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].forEach(([x, z]) => BOX(stone, x - 0.3, 1.3, z - 0.3, x + 0.3, h, z + 0.3));
        ring(h - 0.7, h - 0.1, 0.35, stone);
        { const [, a, b] = faces[f]; for (let p = a + 0.4; p < b - 0.3; p += 0.6) fb(f, p - 0.12, p + 0.12, h - 0.95, h - 0.7, 0, 0.25, stone); }   // 齒飾
        // 曼薩德屋頂（黑色的斜屋頂＋老虎窗）
        if (!plain && h >= 7 && w >= 8 && d >= 8) { const ridgeX = w >= d, rw = ridgeX ? w : d, rd = ridgeX ? d : w; B.roof((x0 + x1) / 2, (z0 + z1) / 2, rw - 0.8, rd - 0.8, { type: 'hip', y: h + 0.2, h: Math.min(3.2, rd * 0.22), o: 0.3, mat: 'hRoofBlack', under: 'woodD', ridge: false, ry: ridgeX ? 0 : Math.PI / 2 }); const [c, a, b] = faces[f], sg = f === 's' || f === 'e' ? 1 : -1, along = f === 's' || f === 'n'; for (let p = a + 2; p < b - 1.5; p += 3.4) { const [dx, dz] = along ? [p, c - sg * 1.0] : [c - sg * 1.0, p]; BOX(M('cream'), dx - 0.6, h + 0.5, dz - 0.6, dx + 0.6, h + 1.9, dz + 0.6); P(g.prism, M('hRoofBlack'), dx, h + 1.9, dz, 1.5, 0.7, 1.4, 0, along ? 0 : Math.PI / 2, 0); } }
        if (!named && !plain && h > 6) { const [c, a, b] = faces[f], m = (a + b) / 2, sg = f === 's' || f === 'e' ? 1 : -1, along = f === 's' || f === 'n';
          [-1.6, 1.6].forEach(k => { const [px, pz] = along ? [m + k, c + sg * 1.6] : [c + sg * 1.6, m + k]; P(g.cyl, white, px, 1.3 + 2.0, pz, 0.5, 4.0, 0.5); });
          fb(f, m - 2.3, m + 2.3, 5.3, 5.7, 0, 2.2, stone);
          const [qx, qz] = along ? [m, c + sg * 1.1] : [c + sg * 1.1, m]; P(g.prism, stone, qx, 5.7, qz, 4.8, 1.3, 2.2, 0, along ? 0 : Math.PI / 2, 0);
        }
      }
    };
    const bld0 = B.bld;
    B.bld = o => {
      const res = bld0(o);
      if (o && o.r && META[o.style] && R.CK.buildDeco !== false) { try { deco(o, res); } catch (e) { console.warn('[buildkit]', e); } }
      return res;
    };
  };
})(window.R);
