// 第三人稱肩部視角（2026-10-18 作者：鏡頭在玩家角色的左肩上方、往後一點；視角中心跟著準心，滑鼠移動就轉視角。先做一版看看）
// - 設定→畫面「鏡頭：一般／肩部視角」切換（存在 localStorage 的 tfl-shouldercam）；遊戲中也可以按 P 切換（不能自訂；V 是大招）。
// - 第一版只在遺跡裡有效；城裡（立體城市 citykit 有自己的鏡頭）、觸控照原本的鏡頭。
// - 滑鼠：點一下遊戲畫面就鎖定滑鼠（pointer lock），左右轉視角、上下抬頭低頭；Esc 會放開（同時打開選單）。
//   沒鎖定的時候滑鼠移到畫面邊緣也會慢慢轉。Q／E 一次轉 22.5 度。滾輪：鏡頭遠近。
// - 準心固定在畫面正中間：瞄準點＝從鏡頭穿過準心的直線打到離地 1 公尺高的平面（run.js 的 W.plane）的那一點，
//   太遠或抬頭看天空就取前方 25 公尺。W、S 往鏡頭前後走（run.js、town.js 本來就照 W.cam.yaw 算）。
// - 鏡頭不會穿牆：從肩膀往後一格一格看是不是地板，碰到牆就停在牆前面。
// - 人物的點陣大約 3 公尺高，所以「肩膀」是左邊 1.5、高 3.1 公尺，鏡頭往後 6 公尺（滾輪 3.5～10）。
// - 鏡頭：透視 60 度、近平面 0.1（pixel.js 照原本的方式畫成點陣，只是鏡頭換位置）。
// 放在 pixel.js、所有包 R.placeCam、R.step 的檔案後面（main.js 前面）。
(function (R) {
  const W = () => R.W || {}, $ = id => document.getElementById(id), T = () => window.THREE;
  const KEY = 'tfl-shouldercam';
  const LS = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { } return null; };
  R.shoulderOn = () => LS(KEY) === '1' && !R.touch;
  const st = { yaw: null, pitch: -0.2, dist: 6, locked: false, edgeX: 0 };
  const SIDE = 1.5, HIGH = 3.1;   // 人物（點陣）大約 3 公尺高：肩膀往左 1.5、高 3.1，往後 6 公尺
  R.setShoulder = on => {
    LS(KEY, on ? '1' : '0'); st.yaw = null;
    if (!on && document.pointerLockElement) document.exitPointerLock();
    hud(); if (R.toast) R.toast(on ? '肩部視角：點一下畫面鎖定滑鼠，移動滑鼠轉視角（Esc 放開；按 P 切回一般鏡頭）。' : '一般鏡頭。', '#C8E0FF');
    if (W().camera && R.placeCam) try { R.placeCam(null); } catch (e) { }
  };
  // 現在能不能用
  const active = () => {
    const w = W(); if (!R.shoulderOn() || !w.P || !w.camera || !w.cam) return false;
    return !!(w.run && !w.town);
  };
  R.shoulderActive = active;
  R.shoulderState = () => st;   // 測試用
  const fwd = y => [-Math.sin(y), -Math.cos(y)];   // 鏡頭在 yaw 的方向後面、往反方向看（run.js 的 placeCam）
  const left = y => [-Math.cos(y), Math.sin(y)];
  // 鏡頭往後退的時候碰到牆：看是不是地板格
  const clear = (x, z) => {
    return !R.isFloor || R.isFloor(x, z);
  };
  const fit = (px, pz, tx, tz) => {   // 從 (px,pz) 往 (tx,tz) 走，回傳能走到的比例
    const d = Math.hypot(tx - px, tz - pz); if (d < 0.01) return 1;
    const n = Math.ceil(d / 0.2); for (let i = 1; i <= n; i++) { const k = i / n; if (!clear(px + (tx - px) * k, pz + (tz - pz) * k)) return Math.max(0.12, (i - 1.5) / n); }
    return 1;
  };
  // 人物變透明（a＝1 還原）
  const fade = (P, a) => {
    if (!P || !P.h || !P.h.g || P._scFade === a) return; P._scFade = a;
    P.h.g.traverse(o => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; ms.forEach(m => { if (m._scOp == null) { m._scOp = m.opacity; m._scTr = m.transparent; } m.opacity = m._scOp * a; m.transparent = a < 1 ? true : m._scTr; }); });
  };
  // ---------- 鏡頭 ----------
  const pc0 = R.placeCam;
  R.placeCam = (dt, shake) => {
    const w = W(), on = active();
    if (on) { if (st.yaw == null) st.yaw = w.cam.yaw; w.cam.yaw = w.cam.yawT = st.yaw; }
    const r = pc0(dt, shake);
    if (!on) { if (w.P && w.P._scFade != null && w.P._scFade !== 1) fade(w.P, 1); return r; }
    try {
      const cam = w.camera, P = w.P; if (!cam.isPerspectiveCamera) return r;
      const y = st.yaw, [fx, fz] = fwd(y), [lx, lz] = left(y), cp = Math.cos(st.pitch), sp = Math.sin(st.pitch);
      const hx = P.x + lx * SIDE, hy = HIGH, hz = P.z + lz * SIDE;   // 左肩上方
      const k = fit(P.x, P.z, hx, hz), sx = P.x + (hx - P.x) * k, sz = P.z + (hz - P.z) * k;
      const bx = sx - fx * cp * st.dist, bz = sz - fz * cp * st.dist, by = hy - sp * st.dist;
      const kb = fit(sx, sz, bx, bz), j = shake ? (Math.random() - 0.5) * shake * 0.15 : 0;
      cam.position.set(sx + (bx - sx) * kb + j, Math.max(0.6, hy + (by - hy) * kb), sz + (bz - sz) * kb + j);
      cam.lookAt(cam.position.x + fx * cp * 10, cam.position.y + sp * 10, cam.position.z + fz * cp * 10);
      const dd = Math.hypot(cam.position.x - P.x, cam.position.z - P.z); fade(P, dd < 2.6 ? 0.3 : dd < 3.6 ? 0.6 : 1);   // 靠牆時鏡頭被擠到人物旁邊：人物變透明，不擋視線
      cam.fov = 60; cam.near = 0.1; cam.far = 160; cam.userData.shift = null; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    } catch (e) { console.warn('[shouldercam]', e); }
    return r;
  };
  const rc0 = R.rotateCam;
  R.rotateCam = d => { if (active()) { st.yaw = (st.yaw == null ? W().cam.yaw : st.yaw) + d * Math.PI / 8; return; } return rc0(d); };
  const zc0 = R.zoomCam;
  R.zoomCam = z => { if (active()) { st.dist = Math.max(3.5, Math.min(10, 6 * z)); return; } return zc0(z); };
  // ---------- 瞄準：準心＝畫面正中間 ----------
  const aim = () => {
    const w = W(), P = w.P, cam = w.camera, I = R.input; if (!P || !cam || !T()) return;
    if (I) I.mouseNDC = { x: 0, y: 0 };
    const d = new (T().Vector3)(); cam.getWorldDirection(d); const o = cam.position;
    let tx, tz;
    if (d.y < -0.01) { const t = (1 - o.y) / d.y; if (t > 0 && t < 40) { tx = o.x + d.x * t; tz = o.z + d.z * t; } }
    if (tx == null) { const [fx, fz] = fwd(st.yaw); tx = P.x + fx * 25; tz = P.z + fz * 25; }
    if (Math.hypot(tx - P.x, tz - P.z) < 1.2) { const [fx, fz] = fwd(st.yaw); tx = P.x + fx * 3; tz = P.z + fz * 3; }
    P.aimA = Math.atan2(tx - P.x, tz - P.z); P.aimX = tx; P.aimZ = tz;
  };
  const turnEdge = dt => { if (st.locked || !st.edgeX) return; st.yaw -= st.edgeX * dt * 1.6; };
  const s0 = R.step;
  R.step = dt => { if (active() && !W().paused) { turnEdge(dt); aim(); } return s0(dt); };
  // ---------- 滑鼠 ----------
  const canvas = () => { const w = W(); return w.renderer && w.renderer.domElement; };
  document.addEventListener('mousedown', e => {
    const cv = canvas(); if (!cv || e.target !== cv || !active() || W().paused || document.pointerLockElement === cv) return;
    try { const p = cv.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (err) { }
  }, true);
  document.addEventListener('pointerlockchange', () => { st.locked = document.pointerLockElement === canvas(); hud(); });
  document.addEventListener('mousemove', e => {
    if (!active()) { st.edgeX = 0; return; }
    if (st.locked) {
      if (W().paused) return;
      st.yaw -= (e.movementX || 0) * 0.0032; st.pitch = Math.max(-0.75, Math.min(0.3, st.pitch - (e.movementY || 0) * 0.0026));
      return;
    }
    const cv = canvas(); if (!cv) return; const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width;
    st.edgeX = x < 0.06 ? -1 : x > 0.94 ? 1 : 0;
  });
  // 選單打開（暫停）就放開滑鼠
  setInterval(() => { if (st.locked && (W().paused || !active())) { try { document.exitPointerLock(); } catch (e) { } } hud(); }, 300);
  // P：切換
  window.addEventListener('keydown', e => {
    if (e.code !== 'KeyP' || e.repeat || e.ctrlKey || e.altKey || e.metaKey || R.touch) return;
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    const run = $('run'); if (!run || run.hidden || (R.sheetOpen && R.sheetOpen())) return;
    e.preventDefault(); R.setShoulder(!R.shoulderOn());
  });
  // ---------- 準心、提示 ----------
  const cross = document.createElement('div'); cross.id = 'sc-cross'; cross.hidden = true;
  cross.innerHTML = '<i></i><b></b><span>點一下畫面鎖定滑鼠</span>';
  let lastShow = null;
  const hud = () => {
    const run = $('run'); if (run && cross.parentNode !== run) run.appendChild(cross);
    const show = !!(run && !run.hidden && active() && !W().paused);
    if (show !== lastShow) { cross.hidden = !show; lastShow = show; document.body.classList.toggle('sc-on', show); }
    cross.classList.toggle('locked', st.locked);
  };
  R.shoulderHud = hud;
  const css = document.createElement('style');
  css.textContent = '#sc-cross{position:absolute;left:50%;top:50%;width:0;height:0;pointer-events:none;z-index:6}'
    + '#sc-cross[hidden]{display:none}'
    + '#sc-cross i{position:absolute;left:-11px;top:-1px;width:22px;height:2px;background:rgba(255,255,255,.9);box-shadow:0 0 2px #000}'
    + '#sc-cross b{position:absolute;left:-1px;top:-11px;width:2px;height:22px;background:rgba(255,255,255,.9);box-shadow:0 0 2px #000}'
    + '#sc-cross span{position:absolute;left:-90px;top:22px;width:180px;text-align:center;font-size:12px;color:#fff;text-shadow:0 0 3px #000;white-space:nowrap}'
    + '#sc-cross.locked span{display:none}'
    + 'body.sc-on #r-field,body.sc-on canvas{cursor:crosshair}';
  document.head.appendChild(css);
})(window.R = window.R || {});
