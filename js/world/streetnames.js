// 左上角的地名：走在街上也顯示街名（2026-10-21 作者：每一個不同的地點左上的框框，都有客製化嗎？）
// 精緻城市的地名照 B.area 登記的範圍找（citykit2.js 的 areaAt：找第一個包住你的）；沒登記的地方只顯示城名。
// 新八座城的路都有名字（B.road 的 name：港通、平和通、定禪大道……），只是沒登記成地名。這裡在蓋完城以後補上，排在原本的地名後面
// （地標、車站、港……照舊優先）：
// - 路和兩邊的人行道 → 「南瀧・平和通」；
// - 路兩側 16 公尺內（街區裡面） → 「南瀧・平和通一帶」。
// 寬的路排前面（路口、兩條路中間的街區算大條的那一條）。
(function (R) {
  const CK = R.CK, W = R.W; if (!CK || !CK.spawnLife) return;
  const NEAR = 16;
  const sl0 = CK.spawnLife;
  CK.spawnLife = B => {
    try {
      const D = B.D, tw = W.town;
      if (D && D.roads && D.areas && tw && !tw.room && !D.streetNamed) {
        D.streetNamed = true;
        const rs = D.roads.filter(rd => rd.name && rd.r).map(rd => { const r = rd.r, ew = r[2] - r[0] >= r[3] - r[1]; return { rd, r, ew, w: ew ? r[3] - r[1] : r[2] - r[0], sw: rd.sw == null ? 3.5 : rd.sw }; }).sort((a, b) => b.w - a.w);
        const grow = (q, k) => (q.ew ? [q.r[0], q.r[1] - k, q.r[2], q.r[3] + k] : [q.r[0] - k, q.r[1], q.r[2] + k, q.r[3]]);
        rs.forEach(q => D.areas.push([q.rd.name, grow(q, q.sw)]));
        rs.forEach(q => D.areas.push([q.rd.name + '一帶', grow(q, q.sw + NEAR)]));
      }
    } catch (e) { console.warn('[streetnames]', e); }
    return sl0(B);
  };
})(window.R);
