// 2026-10-14 作者：「委託按下去要有指示（指引地圖）」——有目的地的時候（跑腿、或自己在地圖上點的），畫面上方多一個方向箭頭和直線距離。
// - 箭頭照鏡頭看出去的方向轉（把目的地投影到畫面上算角度），轉視角也對；走到 6 公尺內就不顯示（errands.js 會自動換下一站、跑完就指回公會）。
// - 目的地：可以走的 3D 城（ckmove.js：R.S.ckWaypoint，世界座標）、東鶴近郊（gtamap.js：R.S.waypoint，示意圖座標）。下遺跡不顯示。
// 放在 gtamap.js、errands.js、ckmove.js 後面。
(function (R) {
  const W = R.W;
  const target = () => {
    const s = R.S, t = W.town; if (!s || !t || W.run || t.room || W.inside) return null;
    if (t.ck) { const w = s.ckWaypoint; return w && w.city === t.ck ? [w.x, w.z, w.name] : null; }
    const w = s.waypoint, C = R.CITY; return w && C && C.S ? [(w.sx - 500) * C.S, (w.sy - 500) * C.S, w.name] : null;
  };
  let el = null, v1 = null, v2 = null;
  const ui = () => { if (el) return el; el = document.createElement('div'); el.id = 'qg-arrow'; el.innerHTML = '<i>➜</i><span></span>'; document.body.appendChild(el); return el; };
  const tick = () => {
    try {
      const P = W.P, tg = target(), cam = W.camera, run = document.getElementById('run');
      const show = tg && P && cam && typeof THREE !== 'undefined' && !(R.sheetOpen && R.sheetOpen()) && !(run && run.hidden), d = show ? Math.hypot(tg[0] - P.x, tg[1] - P.z) : 0;
      if (!show || d < 6) { if (el) el.hidden = true; return; }
      ui().hidden = false; v1 = v1 || new THREE.Vector3(); v2 = v2 || new THREE.Vector3();
      v1.set(P.x, 1, P.z).project(cam); v2.set(tg[0], 1, tg[1]);
      // 目的地在鏡頭後面時投影會翻過來：改用往目的地方向走 5 公尺的點
      const k = Math.min(1, 5 / d); v2.set(P.x + (tg[0] - P.x) * k, 1, P.z + (tg[1] - P.z) * k).project(cam);
      const a = Math.atan2(-(v2.y - v1.y) * innerHeight, (v2.x - v1.x) * innerWidth);
      el.querySelector('i').style.transform = 'rotate(' + a + 'rad)';
      el.querySelector('span').textContent = String(tg[2] || '目的地').replace(/^跑腿：/, '') + '・' + Math.round(d) + ' 公尺';
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
