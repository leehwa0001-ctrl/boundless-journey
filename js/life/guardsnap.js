// 衛兵不站在車道上（2026-10-21 作者：還有衛兵在馬路上的）
// 城的設定 guards／patrols 有不少點落在車道（B.road 的範圍＝車走的部分，不含人行道）。
// 進城時（ckcrime.js 讀設定之前）把這些點挪到最近的人行道：
// - 站崗：往最近的路邊推出去，落在沒有東西擋著的地方；
// - 巡邏：沿著路走的那一段，整段挪到同一邊的人行道（挑擋路的東西比較少的那邊）。
// R.cityCheck() 多兩項：衛兵站在車道上、衛兵巡邏穿過東西。
// 放在 ckcrime.js 後面。
(function (R) {
  const CK = R.CK, W = R.W; if (!CK || !CK.spawnLife) return;
  const CURB = 1.1;   // 離路邊多遠（人行道靠車道那一側，比較少招牌、盆栽）
  let D0 = null;      // 正在蓋的城（clearLine 繞路時避開車道）
  const inR = (x, z, r, m) => x > r[0] - m && x < r[2] + m && z > r[1] - m && z < r[3] + m;
  const free = (x, z) => { const p = { x, z }; R.collide(p, 0.4); return Math.hypot(p.x - x, p.z - z) < 0.02; };
  const onRoad = (D, x, z, m) => D.roads.some(rd => inR(x, z, rd.r, m == null ? 0.1 : m));
  // 一個點：從它所在的每條路往四邊推出去，挑最近、不在車道上、沒被擋住的
  const snapPt = (D, x, z) => {
    const hit = D.roads.filter(rd => inR(x, z, rd.r, 0.1)); if (!hit.length) return [x, z];
    const cand = [];
    hit.forEach(({ r }) => { cand.push([r[0] - CURB, z], [r[2] + CURB, z], [x, r[1] - CURB], [x, r[3] + CURB]); });
    for (let k = 0; k < 2; k++) {   // 第二輪：路口推一次還在別條路上，就再推一次
      const ok = cand.filter(c => !onRoad(D, c[0], c[1]) && free(c[0], c[1])).sort((a, b) => Math.hypot(a[0] - x, a[1] - z) - Math.hypot(b[0] - x, b[1] - z));
      if (ok.length) return ok[0];
      cand.splice(0).forEach(c => D.roads.filter(rd => inR(c[0], c[1], rd.r, 0.1)).forEach(({ r }) => cand.push([r[0] - CURB, c[1]], [r[2] + CURB, c[1]], [c[0], r[1] - CURB], [c[0], r[3] + CURB])));
    }
    return [x, z];
  };
  // 一段巡邏：中點在某條路上、而且順著路走 → 兩端一起挪到同一邊
  const blockedAlong = (a, c) => { const L = Math.hypot(c[0] - a[0], c[1] - a[1]); let n = 0; for (let t = 0; t <= L; t += 1) if (!free(a[0] + (c[0] - a[0]) * t / L, a[1] + (c[1] - a[1]) * t / L)) n++; return n; };
  const snapSeg = (D, a, c) => {
    const mx = (a[0] + c[0]) / 2, mz = (a[1] + c[1]) / 2, horiz = Math.abs(c[0] - a[0]) >= Math.abs(c[1] - a[1]);
    const rd = D.roads.find(q => inR(mx, mz, q.r, 0.1) && ((q.r[2] - q.r[0] >= q.r[3] - q.r[1]) === horiz));
    if (!rd) return null;
    // 兩邊各試幾個離路邊的距離（路燈、行道樹多半排在路邊 0.5 公尺那條線上），挑擋到最少的
    const r = rd.r, sw = rd.sw || 3, opts = [];
    for (let d = 0.8; d <= Math.max(0.8, sw - 0.5); d += 0.3) (horiz ? [r[1] - d, r[3] + d].map(v => [[a[0], v], [c[0], v]]) : [r[0] - d, r[2] + d].map(v => [[v, a[1]], [v, c[1]]])).forEach(o => { o.n = blockedAlong(o[0], o[1]) + Math.abs(d - 1.4) * 0.1; opts.push(o); });
    opts.sort((p, q) => p.n - q.n);
    return clearLine(opts[0][0], opts[0][1]);
  };
  // 線上還有擋路的：短的（路燈、郵筒）從旁邊繞過去；長的（地標、房子）就在那裡折返，只留最長的那一段
  const clearLine = (a, c) => {
    const L = Math.hypot(c[0] - a[0], c[1] - a[1]), ux = (c[0] - a[0]) / L, uz = (c[1] - a[1]) / L, S = 0.5;
    const at = t => [a[0] + ux * t, a[1] + uz * t];
    const runs = []; let cur = null, gap0 = -1;
    for (let t = 0; t <= L + 1e-6; t += S) {
      const p = at(t);
      if (free(p[0], p[1])) {
        if (gap0 >= 0 && cur) {   // 剛走過一段擋住的
          const g0 = gap0 - S, g1 = t, mid = at((g0 + g1) / 2); let det = null;
          if (g1 - g0 <= 2.6) for (const road of [false, true]) { for (const o of [0.7, -0.7, 1.2, -1.2, 1.7, -1.7, 2.2, -2.2]) { const d = [mid[0] - uz * o, mid[1] + ux * o], h = (g1 - g0) / 2; if ((road || !onRoad(D0, d[0], d[1])) && free(d[0], d[1]) && free(d[0] + ux * h, d[1] + uz * h) && free(d[0] - ux * h, d[1] - uz * h)) { det = d; break; } } if (det) break; }
          if (det) cur.push([det[0] - ux * (g1 - g0) / 2, det[1] - uz * (g1 - g0) / 2], [det[0] + ux * (g1 - g0) / 2, det[1] + uz * (g1 - g0) / 2], p);
          else { runs.push(cur); cur = null; }
        }
        if (!cur) cur = [p, p]; else cur[cur.length - 1] = p;
        gap0 = -1;
      } else if (gap0 < 0) gap0 = t;
    }
    if (cur) runs.push(cur);
    const rl = r => r.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - r[i - 1][0], p[1] - r[i - 1][1]) : 0), 0);
    const best = runs.sort((p, q) => rl(q) - rl(p))[0];
    if (!best || rl(best) < 6) return [a, c];
    return best.filter((p, i) => !i || Math.hypot(p[0] - best[i - 1][0], p[1] - best[i - 1][1]) > 0.05);
  };
  const snapRoute = (D, pts) => {
    const out = pts.map(p => [p[0], p[1]]);
    if (out.length === 2) { const s = snapSeg(D, out[0], out[1]); if (s) return s; const p = out.map(q => snapPt(D, q[0], q[1])); return clearLine(p[0], p[1]); }
    return out.map(p => snapPt(D, p[0], p[1]));
  };
  const sl0 = CK.spawnLife;
  CK.spawnLife = B => {
    const D = B.D, tw = W.town, city = tw && tw.city;
    if (D && D.roads && D.roads.length && city && !tw.room) {
      try {
        D0 = D;
        if (!D.guards.length && city.guards) D.guards = city.guards.map(g => { const p = snapPt(D, g[0], g[1]); return [p[0], p[1], g[2], g[3]]; });
        else D.guards = D.guards.map(g => { const p = snapPt(D, g[0], g[1]); return [p[0], p[1], g[2], g[3]]; });
        const routes = D.patrols.length ? D.patrols : (city.patrols || []);
        const raw = routes.map(pts => pts.map(p => [p[0], p[1]]));
        D.patrols = raw.map(pts => snapRoute(D, pts));
        // 有些路邊的東西（長椅、柵欄）是蓋完城才加上碰撞的：下一格再算一次巡邏路線
        setTimeout(() => {
          if (W.town !== tw || tw.room) return;
          try {
            D0 = D;
            const pg = tw.watchers.filter(n => n.guard && n.patrolGuard);
            pg.forEach((n, i) => {
              if (!raw[i]) return; const p = snapRoute(D, raw[i]), route = p.length > 2 ? p.concat(p.slice(1, -1).reverse()) : p;
              let k = 0, best = 1e9; route.forEach((q, j) => { const d = Math.hypot(q[0] - n.x, q[1] - n.z); if (d < best) { best = d; k = j; } });
              n.patrol = route; n.pi = k;
            });
          } catch (e) { console.warn('[guardsnap]', e); }
        }, 0);
      } catch (e) { console.warn('[guardsnap]', e); }
    }
    sl0(B);
  };
  // ---------- R.cityCheck() 多兩項 ----------
  const cc0 = R.cityCheck;
  if (cc0) R.cityCheck = () => {
    const out = cc0(); if (typeof out !== 'object') return out;
    const tw = W.town, D = tw.D; out.衛兵站在車道上 = []; out.衛兵巡邏穿過東西 = [];
    tw.watchers.filter(n => n.guard && n.post).forEach(n => { if (onRoad(D, n.post[0], n.post[1], 0)) out.衛兵站在車道上.push('站崗 @' + n.post[0].toFixed(1) + ',' + n.post[1].toFixed(1)); });
    tw.watchers.filter(n => n.guard && n.patrol).forEach((n, gi) => {
      const P = n.patrol; let road = 0, hit = null;
      for (let k = 0; k < P.length - 1; k++) { const a = P[k], c = P[k + 1], L = Math.hypot(c[0] - a[0], c[1] - a[1]); for (let t = 0; t <= L; t += 0.5) { const x = a[0] + (c[0] - a[0]) * t / L, z = a[1] + (c[1] - a[1]) * t / L; if (onRoad(D, x, z, 0)) road++; if (!hit && !free(x, z)) hit = x.toFixed(1) + ',' + z.toFixed(1); } }
      const tot = P.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - P[i - 1][0], p[1] - P[i - 1][1]) : 0), 0) / 0.5;
      if (road > tot * 0.3) out.衛兵站在車道上.push('巡邏 ' + gi + '：' + Math.round(road / tot * 100) + '% 走在車道上');
      if (hit) out.衛兵巡邏穿過東西.push('巡邏 ' + gi + ' @' + hit);
    });
    return out;
  };
})(window.R);
