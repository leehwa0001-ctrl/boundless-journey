// 橋的欄杆細化（2026-10-26 作者：繼續把城市的建模都優化）
// 原本每座橋的欄杆是一整條 0.9 公尺高的實心方塊；citykit2.js 畫橋面的時候改呼叫 CK.bridgeRail（碰撞照舊），照 railMat 換成：
// - verm（朱紅的木拱橋）：柱子每 1.8 公尺、上中下三條橫木、兩端的柱子較粗，頂上有擬寶珠；
// - woodB（木橋）：柱子每 2 公尺、上下兩條橫木；
// - steelD／black（鐵）：細的支柱每 1.5 公尺、扶手、兩條中間的橫桿；black 另加直的鐵條（老港的鑄鐵欄杆）；
// - ashlar／ishi（石）：矮的石座＋頂上的笠石，中間一排瓶形的欄杆柱；
// - conc（水泥）：實心的護牆＋寬一點的壓頂，每 6 公尺一根粗一點的柱子。
// 其他沒列到的材質照原本的實心欄杆。
(function (R) {
  const CK = R.CK; if (!CK) return;
  CK.bridgeRail = (Bt, g, M, b, s) => {
    const { ax, cx, cz, y0, y1, len, slope, Wd, i, n, a, c } = s, kind = b.railMat, mat = M(kind), start = ax ? b.r[0] : b.r[1], end = ax ? b.r[2] : b.r[3];
    const rot = ax ? [0, 0, slope] : [-slope, 0, 0], ym = (y0 + y1) / 2;
    const rail = (o, h, th, tw, m) => { if (ax) Bt.add(g.box, m || mat, cx, ym + h, cz + o, len, th, tw, ...rot); else Bt.add(g.box, m || mat, cx + o, ym + h, cz, tw, th, len, ...rot); };
    const post = (p, o, h, w, m, geo) => { const t = (p - a) / c, y = y0 + (y1 - y0) * t; if (ax) Bt.add(geo || g.box, m || mat, p, y + h / 2, cz + o, w, h, w); else Bt.add(geo || g.box, m || mat, cx + o, y + h / 2, p, w, h, w); return y; };
    const posts = (sp, fn) => { for (let k = Math.ceil((a - start - 0.3) / sp); ; k++) { const p = start + 0.3 + k * sp; if (p >= a + c - 1e-6 || p > end - 0.3 + 1e-6) break; if (p >= a - 1e-6) fn(p); } };
    const first = i === 0, last = i === n - 1;
    [-1, 1].forEach(sd => {
      const o = sd * (Wd / 2 - 0.15);
      if (kind === 'verm' || kind === 'woodB') {
        const red = kind === 'verm', sp = red ? 1.8 : 2.0, H = red ? 0.95 : 0.9;
        rail(o, H, 0.12, 0.16); rail(o, red ? 0.52 : 0.3, red ? 0.08 : 0.1, 0.1); if (red) rail(o, 0.16, 0.08, 0.1);
        posts(sp, p => post(p, o, H + 0.04, 0.15));
        if (first || last) { const p = first ? start + 0.2 : end - 0.2, y = post(p, o, H + 0.16, 0.24); if (red) { const [px, pz] = ax ? [p, cz + o] : [cx + o, p]; Bt.add(g.sph, M('gold'), px, y + H + 0.3, pz, 0.26, 0.3, 0.26); Bt.add(g.cone, M('gold'), px, y + H + 0.52, pz, 0.12, 0.2, 0.12); Bt.add(g.cyl8, M('gold'), px, y + H + 0.18, pz, 0.28, 0.06, 0.28); } }
      } else if (kind === 'steelD' || kind === 'black') {
        const H = 1.0, m2 = M(kind);
        rail(o, H, 0.07, 0.09, m2); rail(o, 0.62, 0.04, 0.04, m2); rail(o, 0.28, 0.04, 0.04, m2);
        posts(1.5, p => post(p, o, H, 0.07, m2));
        if (kind === 'black') posts(0.16, p => { const t = (p - a) / c, y = y0 + (y1 - y0) * t; if (ax) Bt.add(g.box, m2, p, y + 0.15 + 0.4, cz + o, 0.025, 0.8, 0.025); else Bt.add(g.box, m2, cx + o, y + 0.15 + 0.4, p, 0.025, 0.8, 0.025); });
        if (first || last) post(first ? start + 0.12 : end - 0.12, o, H + 0.1, 0.14, m2);
      } else if (kind === 'ashlar' || kind === 'ishi') {
        rail(o, 0.18, 0.36, 0.34); rail(o, 0.88, 0.12, 0.4);
        posts(0.42, p => { const t = (p - a) / c, y = y0 + (y1 - y0) * t; if (ax) Bt.add(g.cyl8, mat, p, y + 0.6, cz + o, 0.16, 0.46, 0.16); else Bt.add(g.cyl8, mat, cx + o, y + 0.6, p, 0.16, 0.46, 0.16); });
        posts(4.2, p => post(p, o, 1.0, 0.42));
        if (first || last) post(first ? start + 0.25 : end - 0.25, o, 1.12, 0.5);
      } else if (kind === 'conc') {
        rail(o, 0.42, 0.84, 0.26); rail(o, 0.9, 0.1, 0.38);
        posts(6, p => post(p, o, 1.0, 0.4));
        if (first || last) post(first ? start + 0.25 : end - 0.25, o, 1.06, 0.46);
      } else rail(o, 0.45, 0.9, 0.3);
    });
  };
})(window.R);
