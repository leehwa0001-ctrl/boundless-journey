// 2026-10-14 作者：「委託按下去要有指示（指引地圖）」——有目的地的時候（跑腿、或自己在地圖上點的），畫面上方多一個方向箭頭和直線距離。
// - 箭頭照鏡頭看出去的方向轉（把目的地投影到畫面上算角度），轉視角也對；走到 6 公尺內就不顯示（errands.js 會自動換下一站、跑完就指回公會）。
// - 目的地：可以走的 3D 城（ckmove.js：R.S.ckWaypoint，世界座標）、東鶴近郊（gtamap.js：R.S.waypoint，示意圖座標）。下遺跡不顯示。
// 放在 gtamap.js、errands.js、ckmove.js 後面。
(function (R) {
  const W = R.W;
  // 2026-10-14 修正：上方箭頭寫直線距離、雷達旁邊寫路線距離（而且在可以走的城裡，雷達旁邊看的是近郊的舊目的地）→ 兩個數字不一樣。
  //   現在只有一個來源：在 3D 城（W.town.ck）用 ckmove.js 的目的地和路線，其他用 gtamap.js 的；有路線就算「沿著路」的距離，箭頭指向路線上的下一個轉角，沒有路線才算直線。
  const target = () => {
    const s = R.S, t = W.town; if (!s || !t || W.run || t.room || W.inside) return null;
    if (t.ck) { const w = s.ckWaypoint; return w && w.city === t.ck ? [w.x, w.z, w.name] : null; }
    const w = s.waypoint, C = R.CITY; if (!w || !C) return null; return [C.WX ? C.WX(w.sx) : (w.sx - 500) * C.S, C.WZ ? C.WZ(w.sy) : (w.sy - 500) * C.S, w.name];
  };
  const nav = () => {
    const tg = target(), P = W.P; if (!tg || !P) return null;
    const pts = (W.town.ck ? R.ckRoute && R.ckRoute() : R.gtaRoute && R.gtaRoute()) || null;
    if (!pts || pts.length < 2) return { name: tg[2], d: Math.hypot(tg[0] - P.x, tg[1] - P.z), nx: tg[0], nz: tg[1], route: false, tx: tg[0], tz: tg[1] };
    const rem = new Array(pts.length).fill(0); for (let i = pts.length - 2; i >= 0; i--) rem[i] = rem[i + 1] + Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    // 玩家最靠近路線上的哪一段：從那裡沿著路走到底（不是直接連到終點）
    let best = Infinity, d = 0, j = 1;
    for (let i = 0; i < pts.length - 1; i++) { const ax = pts[i][0], az = pts[i][1], bx = pts[i + 1][0], bz = pts[i + 1][1], vx = bx - ax, vz = bz - az, L2 = vx * vx + vz * vz || 1, t = Math.max(0, Math.min(1, ((P.x - ax) * vx + (P.z - az) * vz) / L2)), qx = ax + vx * t, qz = az + vz * t, off = Math.hypot(P.x - qx, P.z - qz);
      if (off < best - 0.01) { best = off; j = i + 1; d = off + Math.hypot(bx - qx, bz - qz) + rem[i + 1]; } }
    best = d;
    let k = j; while (k < pts.length - 1 && Math.hypot(pts[k][0] - P.x, pts[k][1] - P.z) < 4) k++;   // 已經走到這個轉角了：指下一個
    return { name: tg[2], d: best, nx: pts[k][0], nz: pts[k][1], route: true, tx: tg[0], tz: tg[1] };
  };
  const label = n => String(n.name || '目的地').replace(/^跑腿：/, '') + '・' + (n.route ? '沿路約 ' : '直線 ') + Math.round(n.d) + ' 公尺';
  R.navInfo = nav;
  // 雷達旁邊那一行也用同一個數字
  const th0 = R.townHud;
  if (th0) R.townHud = (...a) => { const r = th0(...a); try { const el = document.getElementById('r-wp'); if (el) { const n = W.run ? null : nav(); el.hidden = !n; if (n) el.textContent = '◆ ' + (/^跑腿：/.test(n.name || '') ? '跑腿：' : '') + label(n); } } catch (e) { } return r; };
  let el = null, v1 = null, v2 = null;
  const ui = () => { if (el) return el; el = document.createElement('div'); el.id = 'qg-arrow'; el.innerHTML = '<i>➜</i><span></span>'; document.body.appendChild(el); return el; };
  const tick = () => {
    try {
      const P = W.P, n = nav(), cam = W.camera, run = document.getElementById('run');
      const show = n && P && cam && typeof THREE !== 'undefined' && !(R.sheetOpen && R.sheetOpen()) && !(run && run.hidden), close = show ? Math.hypot(n.tx - P.x, n.tz - P.z) : 0;
      if (!show || close < 6) { if (el) el.hidden = true; return; }
      ui().hidden = false; v1 = v1 || new THREE.Vector3(); v2 = v2 || new THREE.Vector3();
      // 往下一個轉角方向走 5 公尺的點投影到畫面上算角度（目的地在鏡頭後面也不會翻過來）
      const dd = Math.hypot(n.nx - P.x, n.nz - P.z) || 1, k = Math.min(1, 5 / dd);
      v1.set(P.x, 1, P.z).project(cam); v2.set(P.x + (n.nx - P.x) * k, 1, P.z + (n.nz - P.z) * k).project(cam);
      const a = Math.atan2(-(v2.y - v1.y) * innerHeight, (v2.x - v1.x) * innerWidth);
      el.querySelector('i').style.transform = 'rotate(' + a + 'rad)';
      el.querySelector('span').textContent = label(n);
      el.dataset.ang = a.toFixed(3);
    } catch (e) { }
  };
  setInterval(tick, 100);
  const css = document.createElement('style');
  css.textContent = '#qg-arrow{position:fixed;top:64px;left:50%;transform:translateX(-50%);z-index:25;display:flex;align-items:center;gap:8px;padding:4px 12px 4px 6px;border-radius:18px;background:rgba(20,16,24,.82);border:1px solid #C9A13A;color:#F4E9CD;font-size:13px;pointer-events:none;max-width:calc(100vw - 24px)}'
    + '#qg-arrow i{font-style:normal;display:inline-block;width:26px;height:26px;line-height:26px;text-align:center;font-size:20px;color:#FFE08A;transition:transform .1s linear}#qg-arrow span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    + '@media (max-width:640px){#qg-arrow{top:auto;bottom:178px;font-size:12px}}';
  document.head.appendChild(css);
  R.questGuide = { target };
})(window.R);
