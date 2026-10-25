// 天守、櫓細化（2026-10-26 作者：繼續把城市的建模都優化）
// 包住 citykit6.js 的 B.tenshu、B.yagura：原本的照舊（窗在牆的貼圖裡），再加：
// - 天守：最上面一層的迴緣（外廊）＋黑色的高欄（欄杆），一樓四個角的石落（往外凸、底下斜的小箱），各層屋簷下一條黑色的長押；
// - 櫓：一樓兩個角的石落。
// 層的大小照 B.tenshu 的算法重算一次（不改原本的函式）。
(function (R) {
  const CK = R.CK; if (!CK) return;
  const eb0 = CK.extendBuilder;
  CK.extendBuilder = B => {
    eb0(B);
    const M = CK.M, g = B.g, P = B.part, BOX = B.box;
    // 石落：(x, z) 是牆角，sx、sz 往外的方向；y 底
    const ishiotoshi = (x, z, sx, sz, y, k) => {
      const a = 1.4 * k, h = 1.5 * k, out = 0.55 * k, wall = M('white');
      [[sx, 0], [0, sz]].forEach(([ax, az]) => {
        const cx = x + ax * out / 2 - (ax ? 0 : sx * a / 2), cz = z + az * out / 2 - (az ? 0 : sz * a / 2);
        P(g.box, wall, cx, y + h / 2 + 0.3 * k, cz, ax ? out : a, h - 0.6 * k, ax ? a : out);
        P(g.box, M('black'), cx, y + 0.18 * k, cz, ax ? out * 0.7 : a, 0.36 * k, ax ? a : out * 0.7);   // 下面的開口（黑）
        P(g.box, M('kawara', { col: '#767C88' }), cx, y + h + 0.06, cz, ax ? out + 0.3 : a + 0.2, 0.14, ax ? a + 0.2 : out + 0.3);
      });
    };
    const ts0 = B.tenshu;
    B.tenshu = (x, z, y0, o) => {
      const top = ts0(x, z, y0, o);
      try {
        o = o || {}; const k = o.s || 1, W0 = o.w || 26, D0 = o.d || 20, base = o.base || 6, floors = o.floors || 6;
        let y = y0 + base, w = W0, d = D0;
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => ishiotoshi(x + sx * w / 2, z + sz * d / 2, sx, sz, y + 1.4 * k, k));
        for (let i = 0; i < floors; i++) {
          const hh = (i === 0 ? 5.2 : 4.2) * k, last = i === floors - 1;
          if (!last) {
            const lb = y + hh - 1.6 * k * 0.55 - 0.45 * k;   // 長押：屋簷下面一點
            BOX(M('black'), x - w / 2 - 0.04, lb, z - d / 2 - 0.04, x + w / 2 + 0.04, lb + 0.14 * k, z + d / 2 + 0.04);
            const shr = (i < 2 ? 2.0 : 1.5) * k; w -= 2 * shr; d -= 2 * shr; y += hh;
          } else {
            // 迴緣＋高欄
            const e = 0.9 * k, fy = y + 0.3 * k, rm = M('black');
            BOX(M('woodD'), x - w / 2 - e, fy - 0.16, z - d / 2 - e, x + w / 2 + e, fy, z + d / 2 + e);
            [[x - w / 2 - e + 0.06, z - d / 2 - e + 0.06, x + w / 2 + e - 0.06, z - d / 2 - e + 0.06], [x - w / 2 - e + 0.06, z + d / 2 + e - 0.06, x + w / 2 + e - 0.06, z + d / 2 + e - 0.06], [x - w / 2 - e + 0.06, z - d / 2 - e + 0.06, x - w / 2 - e + 0.06, z + d / 2 + e - 0.06], [x + w / 2 + e - 0.06, z - d / 2 - e + 0.06, x + w / 2 + e - 0.06, z + d / 2 + e - 0.06]].forEach(([a0, b0, a1, b1]) => {
              const L = Math.hypot(a1 - a0, b1 - b0), n = Math.max(2, Math.round(L / (1.1 * k)));
              for (let j = 0; j <= n; j++) P(g.box, rm, a0 + (a1 - a0) * j / n, fy + 0.5 * k, b0 + (b1 - b0) * j / n, 0.12, 1.0 * k, 0.12);
              BOX(rm, Math.min(a0, a1) - 0.07, fy + 0.95 * k, Math.min(b0, b1) - 0.07, Math.max(a0, a1) + 0.07, fy + 1.05 * k, Math.max(b0, b1) + 0.07);
              BOX(rm, Math.min(a0, a1) - 0.04, fy + 0.45 * k, Math.min(b0, b1) - 0.04, Math.max(a0, a1) + 0.04, fy + 0.52 * k, Math.max(b0, b1) + 0.04);
            });
          }
        }
      } catch (e) { console.warn('[castlekit] tenshu', e); }
      return top;
    };
    const yg0 = B.yagura;
    B.yagura = (x, z, y0, n, s, o) => {
      const top = yg0(x, z, y0, n, s, o);
      try { s = s || 1; const w = ((o && o.w) || 8) * s, d = ((o && o.d) || 7) * s; [[-1, 1], [1, 1]].forEach(([sx, sz]) => ishiotoshi(x + sx * w / 2, z + sz * d / 2, sx, sz, y0 + 0.8 * s, s * 0.8)); } catch (e) { console.warn('[castlekit] yagura', e); }
      return top;
    };
  };
})(window.R);
