// 左上角的地名：走在街上也顯示街名（2026-10-21 作者：每一個不同的地點左上的框框，都有客製化嗎？）
// 精緻城市的地名照 B.area 登記的範圍找（citykit2.js 的 areaAt：找第一個包住你的）；沒登記的地方只顯示城名。
// 蓋完城以後照這個順序補在原本的地名後面（地標、車站、港……照舊優先）：
// 1. 路和兩邊的人行道 → 「南瀧・平和通」（B.road 的 name）；
// 2. 河、運河、濠 → 「南瀧・西瀧川」（B.water 的 name，連兩岸 4 公尺）；
// 3. 每座城補的海邊、森林、郊外（EXTRA；2026-10-21 作者：河、海邊、森林補上名字）；
// 4. 路兩側 16 公尺內（街區裡面） → 「南瀧・平和通一帶」；
// 5. 還是沒名字的地方：最近的地標、河、海邊（40 公尺內） → 「南瀧・南瀧站附近」。
// 寬的路排前面（路口、兩條路中間的街區算大條的那一條）。
(function (R) {
  const CK = R.CK, W = R.W; if (!CK || !CK.spawnLife) return;
  const NEAR = 16, FAR = 40, CELL = 4;
  // [名字, [x0, z0, x1, z1]]：北是 -z
  const EXTRA = {
    huangling: [['城牆外的杉林', [170, -400, 400, 400]], ['城牆外的杉林', [-400, -400, -170, 400]], ['北山腳', [-180, -400, 180, -158]]],
    jishan: [['吉川西岸', [-400, -400, -150, 400]], ['神社的山腳', [-140, -400, 178, -123]], ['高架下', [-140, 125, 178, 400]]],
    yuebei: [['岳北灣', [-400, -400, 400, -80]], ['站南的住宅', [-150, 118, -46, 400]], ['站南的住宅', [46, 118, 150, 400]], ['西町的住宅', [-150, 14, -52, 66]]],
    futing: [['站南的住宅', [-150, 116, 150, 400]]],
    xijian: [['西見灣', [-400, -400, 400, -70]], ['站南的住宅', [-150, 116, 150, 400]]],
    nanlong: [['南瀧灣', [-400, -400, 400, -76]], ['站南的住宅', [-150, 116, 150, 400]]],
    woqi: [['渦流海灣', [-400, -400, 400, -62]], ['站南的住宅', [-150, 116, 150, 400]]],
    zhengyuan: [['征遠港・岸壁', [-400, -400, 52, -56]], ['站南的住宅', [-150, 116, 150, 400]]],
    banbei: [['海峽沿岸步道', [92, -400, 400, 400]], ['站南的住宅', [-150, 116, 92, 400]]],
    bannan: [['站南的住宅', [-150, 116, 150, 400]]],
    gusen: [['古森原生林', [-400, -400, 400, -66]], ['站南的住宅', [-150, 116, 150, 400]]]
  };
  const inR = (x, z, r) => x >= r[0] && x <= r[2] && z >= r[1] && z <= r[3];
  const dist = (x, z, r) => Math.hypot(Math.max(r[0] - x, 0, x - r[2]), Math.max(r[1] - z, 0, z - r[3]));
  const sl0 = CK.spawnLife;
  CK.spawnLife = B => {
    try {
      const D = B.D, tw = W.town, city = tw && tw.city;
      if (D && D.roads && D.areas && city && !tw.room && !D.streetNamed) {
        D.streetNamed = true;
        const marks = D.areas.slice();   // 原本的地標（「附近」只照這些、河、海邊找）
        const rs = D.roads.filter(rd => rd.name && rd.r).map(rd => { const r = rd.r, ew = r[2] - r[0] >= r[3] - r[1]; return { rd, r, ew, w: ew ? r[3] - r[1] : r[2] - r[0], sw: rd.sw == null ? 3.5 : rd.sw }; }).sort((a, b) => b.w - a.w);
        const grow = (q, k) => (q.ew ? [q.r[0], q.r[1] - k, q.r[2], q.r[3] + k] : [q.r[0] - k, q.r[1], q.r[2] + k, q.r[3]]);
        rs.forEach(q => D.areas.push([q.rd.name, grow(q, q.sw)]));
        (D.water || []).forEach(w => { if (!w.name || !w.poly) return; const xs = w.poly.map(p => p[0]), zs = w.poly.map(p => p[1]), a = [w.name, [Math.min(...xs) - 4, Math.min(...zs) - 4, Math.max(...xs) + 4, Math.max(...zs) + 4]]; D.areas.push(a); marks.push(a); });
        (EXTRA[city.id] || []).forEach(a => { D.areas.push(a); marks.push(a); });
        rs.forEach(q => D.areas.push([q.rd.name + '一帶', grow(q, q.sw + NEAR)]));
        // 還是沒名字的格子：最近的地標
        const b = city.walk, cells = [];
        if (b && marks.length) for (let x = b[0]; x < b[2]; x += CELL) for (let z = b[1]; z < b[3]; z += CELL) {
          const cx = x + CELL / 2, cz = z + CELL / 2; if (D.areas.some(a => inR(cx, cz, a[1]))) continue;
          let best = null, bd = FAR; marks.forEach(a => { const d = dist(cx, cz, a[1]); if (d < bd && a[0] !== city.name) { bd = d; best = a[0]; } });
          if (best) cells.push([best + '附近', [x, z, x + CELL, z + CELL]]);
        }
        cells.forEach(a => D.areas.push(a));
      }
    } catch (e) { console.warn('[streetnames]', e); }
    return sl0(B);
  };
})(window.R);
