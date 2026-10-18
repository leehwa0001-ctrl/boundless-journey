// 第三人稱肩部視角（2026-10-18 作者：鏡頭在玩家角色的左肩上方、往後一點；視角中心跟著準心，滑鼠移動就轉視角。先做一版看看）
// - 鏡頭的位置可以自己調（前後、左右、上下、換邊）：設定→畫面「肩部視角的位置」或 Shift＋P。
// - 設定→畫面「鏡頭：一般／肩部視角」切換（存在 localStorage 的 tfl-shouldercam）；遊戲中也可以按 P 切換（不能自訂；V 是大招）。
// - 遺跡裡、立體城市的街上（citykit：東鶴、皇嶺……）有效（2026-10-18 作者：城裡按 P 也要換）；室內、觸控照原本的鏡頭。
//   城裡：citykit2.js 的 step 先 R.placeCam、再自己擺鏡頭（fixCam）、再 CK.fixSprites——這裡包 CK.fixSprites，在最後把鏡頭換到肩膀；
//   CK.camMode 在肩部視角時當成「漫遊（low）」（天空、太陽陰影照低角度），CK.camPitch 照肩部視角的俯角（人物看板的高度）。
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
  R.shoulderOn = () => LS(KEY) === '1';   // 2026-10-18：有觸控螢幕的筆電也會被當成觸控（R.touch），不再擋
  // 鏡頭的位置（2026-10-18 作者：玩家可以自己調前後、左右、上下）：存在 localStorage 的 tfl-shouldercam-pos
  //   back＝往後幾公尺、side＝往左幾公尺（負的＝右肩）、high＝高幾公尺。人物（點陣）大約 3 公尺高，預設左 1.5、高 3.1、往後 6。
  const DEF = { back: 6, side: 1.5, high: 3.1 }, LIM = { back: [2, 14], side: [-3.5, 3.5], high: [1, 7] };
  const loadPos = () => { let o = {}; try { o = JSON.parse(LS(KEY + '-pos') || '{}') || {}; } catch (e) { } const r = {}; Object.keys(DEF).forEach(k => { const v = +o[k]; r[k] = isFinite(v) ? Math.max(LIM[k][0], Math.min(LIM[k][1], v)) : DEF[k]; }); return r; };
  let POS = loadPos();
  const st = { yaw: null, pitch: -0.2, dist: POS.back, locked: false, edgeX: 0 };
  R.setShoulder = on => {
    LS(KEY, on ? '1' : '0'); st.yaw = null;
    if (!on && document.pointerLockElement) document.exitPointerLock();
    hud(); if (R.toast) R.toast(on ? (active() ? '肩部視角：點一下畫面鎖定滑鼠，移動滑鼠轉視角（Esc 放開；按 P 切回一般鏡頭）。' : '肩部視角：這裡暫時還是原本的鏡頭，到街上、店裡或遺跡裡就會換。') : '一般鏡頭。', '#C8E0FF');
    if (W().camera && R.placeCam) try { R.placeCam(null); } catch (e) { }
  };
  // 現在能不能用
  // 在哪裡：ruin 遺跡、city 立體城市的街上（精緻版的東鶴、皇嶺……）、room 室內（店、家；interior.js）、town 像素版的東鶴街上
  //  （2026-10-18 作者：城裡按 P 還是不行——比較慢的電腦東鶴會自動換成像素版 dhswitch.js，第一版只接了精緻版）
  const where = () => {
    const w = W(); if (!w.P || !w.camera || !w.cam) return null;
    if (w.run && !w.town) return 'ruin';
    if (!w.town || w.run) return null;
    if (w.inside) return w.inside.pl ? 'room' : null;
    if (w.town.ck) return w.town.room || !R.CK ? null : 'city';
    return w.town.hosu ? null : 'town';
  };
  const active = () => R.shoulderOn() && !!where();
  const inCity = () => where() === 'city';
  R.shoulderActive = active;
  R.shoulderState = () => st;   // 測試用
  const fwd = y => [-Math.sin(y), -Math.cos(y)];   // 鏡頭在 yaw 的方向後面、往反方向看（run.js 的 placeCam）
  const left = y => [-Math.cos(y), Math.sin(y)];
  // 鏡頭往後退的時候碰到牆：看是不是地板格
  const clear = (x, z) => {
    const m = where();
    if (m === 'room') { const pl = W().inside.pl; return Math.abs(x) < pl.w / 2 - 0.4 && Math.abs(z) < pl.d / 2 - 0.4; }
    if (m === 'city' || m === 'town') { if (!R.collide) return true; const p = { x, z }; try { R.collide(p, 0.3); } catch (e) { return true; } return Math.hypot(p.x - x, p.z - z) < 0.05; }
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
    if (!inCity()) put(shake, 0);   // 城裡在 CK.fixSprites 之後才擺（citykit2.js 的 fixCam 會蓋掉）
    return r;
  };
  const put = (shake, gy) => {
    const w = W();
    try {
      const cam = w.camera, P = w.P; if (!cam.isPerspectiveCamera) return;
      const y = st.yaw, [fx, fz] = fwd(y), [lx, lz] = left(y), cp = Math.cos(st.pitch), sp = Math.sin(st.pitch);
      const m = where(), K = m === 'city' ? 0.8 : m === 'room' ? 0.85 : 1, dist = st.dist * K;   // 精緻版城裡的人物比較小、室內比較窄：位置照比例縮
      const hx = P.x + lx * POS.side * K, hy = gy + POS.high * K, hz = P.z + lz * POS.side * K;   // 肩膀上方（預設左肩）
      const k = fit(P.x, P.z, hx, hz), sx = P.x + (hx - P.x) * k, sz = P.z + (hz - P.z) * k;
      const bx = sx - fx * cp * dist, bz = sz - fz * cp * dist, by = hy - sp * dist;
      const kb = fit(sx, sz, bx, bz), j = shake ? (Math.random() - 0.5) * shake * 0.15 : 0;
      const cx = sx + (bx - sx) * kb + j, cz = sz + (bz - sz) * kb + j, floorY = inCity() && R.CK.heightAt ? R.CK.heightAt(cx, cz) + 0.8 : 0.6;
      cam.position.set(cx, Math.max(floorY, hy + (by - hy) * kb), cz);
      cam.lookAt(cam.position.x + fx * cp * 10, cam.position.y + sp * 10, cam.position.z + fz * cp * 10);
      const dd = Math.hypot(cam.position.x - P.x, cam.position.z - P.z); fade(P, dd < 2.6 ? 0.3 : dd < 3.6 ? 0.6 : 1);   // 靠牆時鏡頭被擠到人物旁邊：人物變透明，不擋視線
      cam.fov = 60; cam.near = 0.1; cam.far = inCity() ? Math.max(cam.far, 600) : 160; cam.userData.shift = null; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    } catch (e) { console.warn('[shouldercam]', e); }
  };
  // 立體城市：鏡頭在 fixCam 之後擺；漫遊模式、俯角
  const CK = R.CK;
  if (CK) {
    const fs0 = CK.fixSprites;
    if (fs0) CK.fixSprites = (...a) => { if (inCity() && R.shoulderOn()) put(0, W().P.yv || 0); return fs0(...a); };
    const cm0 = CK.camMode;
    if (cm0) CK.camMode = () => (R.shoulderOn() && inCity() ? 'low' : cm0());
    const cp1 = CK.camPitch;
    if (cp1) CK.camPitch = () => (R.shoulderOn() && inCity() ? Math.max(0.05, -st.pitch) : cp1());
  }
  const rc0 = R.rotateCam;
  R.rotateCam = d => { if (active()) { st.yaw = (st.yaw == null ? W().cam.yaw : st.yaw) + d * Math.PI / 8; return; } return rc0(d); };
  const zc0 = R.zoomCam;
  R.zoomCam = z => { if (active()) { st.dist = Math.max(LIM.back[0], Math.min(LIM.back[1] + 4, POS.back * z)); return; } return zc0(z); };
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
  const ts0 = R.townStep;
  if (ts0) R.townStep = dt => { if (active() && !W().paused) turnEdge(dt); return ts0(dt); };
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
  // ---------- 調整鏡頭的位置（設定→畫面「肩部視角的位置」、Shift＋P） ----------
  const panel = document.createElement('div'); panel.id = 'sc-pos'; panel.hidden = true;
  const ROWS = [['back', '前後（往後幾公尺）', 0.1], ['side', '左右（正的＝左肩、負的＝右肩）', 0.1], ['high', '上下（高幾公尺）', 0.1]];
  let wasPaused = false;
  const savePos = () => { LS(KEY + '-pos', JSON.stringify(POS)); st.dist = POS.back; };
  const preview = () => { try { if (active() && R.placeCam) R.placeCam(null); } catch (e) { } };
  const paint = () => {
    panel.innerHTML = '<b>肩部視角的位置</b><small>拖曳滑桿，畫面會馬上換（遺跡裡）；點一下滑桿之後也可以用 ← → 微調。</small>'
      + ROWS.map(([k, n, stp]) => '<label><span>' + n + '</span><input type="range" min="' + LIM[k][0] + '" max="' + LIM[k][1] + '" step="' + stp + '" value="' + POS[k] + '" data-scp="' + k + '"><em>' + POS[k].toFixed(1) + '</em></label>').join('')
      + '<div class="row"><button type="button" class="btn" id="sc-pos-def">回到預設</button><button type="button" class="btn" id="sc-pos-flip">換邊（左肩／右肩）</button><button type="button" class="btn pri" id="sc-pos-ok">好</button></div>';
    panel.querySelectorAll('[data-scp]').forEach(inp => { inp.oninput = () => { const k = inp.dataset.scp; POS[k] = +inp.value; inp.nextElementSibling.textContent = POS[k].toFixed(1); savePos(); preview(); }; });
    panel.querySelector('#sc-pos-def').onclick = () => { POS = Object.assign({}, DEF); savePos(); paint(); preview(); };
    panel.querySelector('#sc-pos-flip').onclick = () => { POS.side = -POS.side; savePos(); paint(); preview(); };
    panel.querySelector('#sc-pos-ok').onclick = () => R.shoulderPosClose();
  };
  R.shoulderPos = () => {
    const run = $('run'); if (run && panel.parentNode !== run) run.appendChild(panel);
    if (R.closeSheet) R.closeSheet();
    if (!R.shoulderOn()) R.setShoulder(true);
    wasPaused = !!W().paused; if (W().run) W().paused = true;   // 調的時候遊戲停住，畫面照樣畫
    if (document.pointerLockElement) document.exitPointerLock();
    paint(); panel.hidden = false; preview();
  };
  R.shoulderPosClose = () => { panel.hidden = true; if (W().run && !wasPaused) W().paused = false; };
  R.shoulderPosValue = () => Object.assign({}, POS);
  // P：切換
  window.addEventListener('keydown', e => {
    if (e.code !== 'KeyP' || e.repeat || e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    const run = $('run'); if (!run || run.hidden || (R.sheetOpen && R.sheetOpen() && panel.hidden)) return;
    e.preventDefault(); if (e.shiftKey) { if (panel.hidden) R.shoulderPos(); else R.shoulderPosClose(); return; } R.setShoulder(!R.shoulderOn());
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
    + 'body.sc-on #r-field,body.sc-on canvas{cursor:crosshair}'
    + '#sc-pos{position:absolute;right:16px;top:50%;transform:translateY(-50%);width:min(340px,calc(100vw - 32px));z-index:40;background:rgba(20,16,12,.92);border:1px solid #6A5A3A;border-radius:10px;padding:12px 14px;color:#EDE4D0;display:flex;flex-direction:column;gap:8px}'
    + '#sc-pos[hidden]{display:none}#sc-pos small{color:#B8AC94}#sc-pos label{display:grid;grid-template-columns:1fr 44px;gap:2px 8px;align-items:center;font-size:13px}'
    + '#sc-pos label span{grid-column:1/3}#sc-pos input{width:100%}#sc-pos em{font-style:normal;text-align:right;color:#FFE08A}#sc-pos .row{display:flex;flex-wrap:wrap;gap:6px}';
  document.head.appendChild(css);
})(window.R = window.R || {});
