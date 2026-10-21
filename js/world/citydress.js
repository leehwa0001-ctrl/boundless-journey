// 八座新城的街景細節（2026-10-21 作者：新八座城的細節）
// CK.H.grid 蓋好棋盤街區以後，沿著每條路的人行道再擺一輪（跟吉山、奉主看得到的那些）：
// - 路邊那一條線（路燈那一排）：路燈和路燈中間輪流放行道樹、電線桿（電線一路牽過去）；路口留空。
// - 貼著房子那一邊：長椅、郵筒、公車站（一城一兩個）；店門口插旗子（幟）、掛提燈（照城的風格）。
// - 車道上：人孔蓋。路口四個角：矮柱。
// 每座城一種樣子（DRESS）：樹種、有沒有電線桿（板北是新市區，電線埋在地下）、旗子顏色……
// 只擺不會擋路的東西：都在人行道的兩條邊線上，路人走中線、車走車道（R.cityCheck 照樣是 0）。
(function (R) {
  const CK = R.CK; if (!CK || !CK.H || !CK.H.grid) return;
  const H = CK.H;
  const DRESS = {
    futing: { tree: 'bare', poles: 1, bollard: 1, mail: 2, bench: 4, bus: 1, nobori: ['#4A5A3A', '#2E3A4A'] },
    xijian: { tree: 'round', poles: 1, bollard: 1, mail: 2, bench: 6, bus: 2, nobori: ['#8A2A2A', '#2E4A6A'] },
    nanlong: { tree: 'bare', poles: 1, mail: 2, bench: 5, bus: 2, nobori: ['#C83A3A', '#2E5A9A', '#E8B830'], chochin: 0.25 },
    woqi: { tree: 'round', poles: 1, mail: 2, bench: 5, bus: 1, nobori: ['#C83A3A', '#E8B830', '#2E8A9A'], chochin: 0.45 },
    zhengyuan: { tree: 'pine', poles: 1, bollard: 1, mail: 2, bench: 4, bus: 1, nobori: ['#2E3A5A', '#8A2A2A'] },
    banbei: { tree: 'round', poles: 0, bollard: 1, mail: 2, bench: 8, bus: 2, nobori: ['#2E2E3A', '#C8202A'] },
    bannan: { tree: 'pine', poles: 1, mail: 2, bench: 5, bus: 1, nobori: ['#C83A3A', '#2E5A3A', '#E8E4DC'], chochin: 0.35 },
    gusen: { tree: 'cedar', poles: 1, mail: 1, bench: 6, bus: 1, nobori: ['#3A5A3A', '#6A4A2A'] }
  };
  const g0 = H.grid;
  H.grid = (B, o) => {
    const res = g0(B, o), D = o.dress === false ? null : Object.assign({}, DRESS[o.city] || {}, o.dress || {});
    if (!D || !res) return res;
    try { dress(B, o, res, D); } catch (e) { console.warn('[citydress]', e); }
    return res;
  };
  const dress = (B, o, res, D) => {
    const { HZ, VX, shops } = res, rnd = B.rnd, rr = B.rr, pk = B.pk, water = o.water || [], cuts = o.cuts || [];
    const inWater = (x, z) => water.some(w => x > w[0] - 1.5 && x < w[2] + 1.5 && z > w[1] - 1.5 && z < w[3] + 1.5);
    const inCut = (x, z, m) => cuts.some(c => x > c[0] - m && x < c[2] + m && z > c[1] - m && z < c[3] + m);
    const nearCross = (rd, v, t, m) => (v ? HZ : VX).some(c => v ? Math.abs(t - c.z) < c.hw + c.sw + m && rd.x >= c.r[0] && rd.x <= c.r[2] : Math.abs(t - c.x) < c.hw + c.sw + m && rd.z >= c.r[1] && rd.z <= c.r[3]);
    const used = [], free = (x, z, r) => !used.some(p => Math.hypot(p[0] - x, p[1] - z) < r + p[2]), take = (x, z, r) => used.push([x, z, r]);
    const lampEvery = o.lampEvery || 18;
    const roads = HZ.map(rd => ({ rd, v: false })).concat(VX.map(rd => ({ rd, v: true })));
    let nb = 0, nm = 0;
    const edges = [];   // 貼著房子那一邊、可以放東西的點（之後挑長椅、郵筒、公車站）
    roads.forEach(({ rd, v }) => {
      const a0 = v ? rd.r[1] : rd.r[0], a1 = v ? rd.r[3] : rd.r[2], c0 = v ? rd.x : rd.z;
      [-1, 1].forEach(sd => {
        const curb = c0 + sd * (rd.hw + 0.6), edge = c0 + sd * (rd.hw + rd.sw - 0.55), ry = v ? (sd < 0 ? Math.PI / 2 : -Math.PI / 2) : (sd < 0 ? 0 : Math.PI);
        const P = t => (v ? [curb, t] : [t, curb]), E = t => (v ? [edge, t] : [t, edge]);
        // 路邊：路燈中間的空檔。電線桿排在路的一邊（北、西那一邊），電線跨過路口一路牽過去，遇到水、地標才斷開；另一邊種行道樹
        let run = [];
        const flushPoles = () => { if (run.length >= 2) B.poles(run, { ry: v ? 0 : Math.PI / 2 }); run = []; };
        const poleSide = D.poles && sd < 0 && rd.sw >= 3;
        for (let t = a0 + 6 + (sd > 0 ? 9 : 0) + lampEvery / 2; t < a1 - 4; t += lampEvery) {
          const [x, z] = P(t);
          if (inWater(x, z) || inCut(x, z, 0.8)) { flushPoles(); continue; }
          if (nearCross(rd, v, t, 1.5)) continue;
          if (poleSide) { run.push([x, z]); take(x, z, 0.6); continue; }
          if (rd.sw >= 3 && D.tree) { B.tree(x, z, D.tree, rr(0.75, 0.95)); take(x, z, 1.0); }
        }
        flushPoles();
        // 貼著房子那一邊：記下候選點
        if (rd.sw >= 3) for (let t = a0 + 8; t < a1 - 8; t += 7) { const [x, z] = E(t); if (!nearCross(rd, v, t, 2.5) && !inWater(x, z) && !inCut(x, z, 1.5)) edges.push({ x, z, ry, rd, v, sd, t }); }
        // 車道上的人孔蓋
        for (let t = a0 + 12 + rnd() * 20; t < a1 - 6; t += rr(28, 46)) { const [x, z] = v ? [c0 + sd * rd.hw * 0.45, t] : [t, c0 + sd * rd.hw * 0.45]; if (!inWater(x, z) && !inCut(x, z, 0.5)) B.manhole(x, z); }
      });
    });
    // 路口四個角的矮柱
    if (D.bollard) HZ.forEach(h => VX.forEach(vv => {
      if (vv.r[1] > h.z || vv.r[3] < h.z || h.r[0] > vv.x || h.r[2] < vv.x) return;
      [-1, 1].forEach(a => [-1, 1].forEach(b => { const x = vv.x + a * (vv.hw + 0.5), z = h.z + b * (h.hw + 0.5); if (!inWater(x, z) && !inCut(x, z, 0.5) && free(x, z, 0.5)) { B.bollard(x + a * 0.9, z); B.bollard(x, z + b * 0.9); take(x, z, 1.2); } }));
    }));
    // 長椅、郵筒、公車站：從候選點隨機挑，互相隔開
    const pick = (n, r, fn) => { for (let i = 0, tries = 0; i < n && tries < 80 && edges.length; tries++) { const k = Math.floor(rnd() * edges.length), e = edges[k]; if (!free(e.x, e.z, r)) continue; edges.splice(k, 1); take(e.x, e.z, r); fn(e); i++; } };
    // 公車站：靠房子那一邊（長椅背對房子），人行道中間留給路人
    pick(D.bus || 0, 4, e => {
      const x = e.x + (e.v ? e.sd * 0.25 : 0), z = e.z + (e.v ? 0 : e.sd * 0.25);
      B.busStop(x, z, e.ry, '');
      B.inter(x - (e.v ? e.sd * 1.1 : 0), z - (e.v ? 0 : e.sd * 1.1), 1.6, '看公車的時刻表', () => R.townTalk('公車站', [pk(['時刻表上的字被雪打濕了一半。下一班十二分。', '「往車站方向」，一小時三班。', '站牌旁邊貼著失物招領：一隻手套。'])]), '#7A8AA0');
    });
    pick(D.mail || 0, 2, e => { B.mailbox(e.x, e.z); nm++; });
    pick(D.bench || 0, 2.2, e => { B.bench(e.x, e.z, e.ry); nb++; });   // 椅背靠房子
    // 店門口：幟（旗子）、提燈
    (shops || []).forEach(f => {
      const r = f.r, out = f.side === 's' ? [0, 1] : f.side === 'n' ? [0, -1] : f.side === 'e' ? [1, 0] : [-1, 0];
      const cx = (r[0] + r[2]) / 2, cz = (r[1] + r[3]) / 2, fx = f.side === 'e' ? r[2] : f.side === 'w' ? r[0] : cx, fz = f.side === 's' ? r[3] : f.side === 'n' ? r[1] : cz;
      const along = out[0] ? [0, 1] : [1, 0], half = out[0] ? (r[3] - r[1]) / 2 : (r[2] - r[0]) / 2;
      if (D.nobori && rnd() < 0.55) { const s = rnd() < 0.5 ? -1 : 1, x = fx + out[0] * 0.45 + along[0] * s * (half - 0.7), z = fz + out[1] * 0.45 + along[1] * s * (half - 0.7); if (!inCut(x, z, 0.3) && free(x, z, 0.5)) { B.nobori(x, z, out[0] ? Math.PI / 2 : 0, { h: 3.3, w: 0.55, bh: 2.3, side: s }); take(x, z, 0.5); } }
      if (D.chochin && rnd() < D.chochin) { const s = rnd() < 0.5 ? -1 : 1, x = fx + out[0] * 0.15 + along[0] * s * (half - 1.4), z = fz + out[1] * 0.15 + along[1] * s * (half - 1.4); if (!inCut(x, z, 0.3) && free(x, z, 0.6)) { B.chochin(x, z, Math.atan2(out[0], out[1]), { h: 3.1 }); take(x, z, 0.6); } }
    });
    void nb; void nm;
  };
})(window.R);
