// 特質的效果：死亡、受傷、AI（2026-10-15 作者《特質與熟練度》＋審查問題的答案）
// - 不死不休（第二次）：同一趟遺跡用過「不死不休」又倒下＝永久死亡——倒數 5 秒的畫面，然後刪掉整格存檔（倉庫、家、所有職業、費拉，Q14），回標題。
//   連線時隊友救援優先：有隊友站著就先等救（net2.js），沒救到（流血倒數完）才刪。匯出的存碼不擋（Q14）。第一次在 traitdown.js。
// - 越敗越退：判定死亡的生命＝倒下次數（R.S.stats.deaths，以前的也算，最多 40）× 2%，照「現在的」最大生命算（F05、F06）。
//   被救起、不死身、復活不算倒下（Q15）；連線沒人扶、遺跡崩塌、暫停選單「放棄」都算（Q12）。
//   做法：受傷的時候先把生命往下挪門檻那麼多再算，沒倒就挪回來——所以不死身、復活這些救法照樣會觸發。
// - 貪生怕死：生命低於 35% 由 AI 接手，每 1 秒重新抽（F10）：遠離怪物 70%、逃出有怪的房間 10%、亂喝藥水 2%、找最近的回歸水晶或樓梯 3%、
//   亂放技能 15%（Q13）；生命回到 36% 以上才停。接手的時候你的按鍵、搖桿不算。
// - 怕痛之人：受傷就僵住 0.15 秒（至少隔 1 秒）；翻滾中（無敵）不會。
// - 元素親和：元素反應的傷害 +15%（classcore.js 的 R.reactMul）。
// 放在 traitlife.js 後面（main.js 前面）：包在最外面。
(function (R) {
  const W = () => R.W, S = () => R.S, has = id => !!(R.hasTrait && R.hasTrait(id)), esc = s => R.esc(s);
  R.reactMul = () => 1 + (has('yuansu') ? 0.15 : 0);

  // ---------- 越敗越退 ----------
  const ybN = () => Math.min(40, (S() && S().stats && S().stats.deaths) || 0);
  R.traitDeathLine = () => (has('yuebai') ? ybN() * 0.02 : 0);
  const hp0 = R.hurtPlayer;
  R.hurtPlayer = (raw, src, o) => {
    const w = W(), P = w.P, run = w.run;
    const thr = run && P && !P.dead && !run.done ? R.traitDeathLine() * (P.hpMax || 0) : 0, h0 = P ? P.hp : 0;
    let r;
    if (thr > 0) { P.hp -= thr; try { r = hp0(raw, src, o); } finally { if (W().P === P) { if (P.dead) P.hp = 0; else P.hp += thr; } } }
    else r = hp0(raw, src, o);
    // 怕痛之人
    try { if (P && run && has('patong') && !P.dead && P.hp < h0 && !(P.dashT > 0) && (run.t || 0) >= (P._patongT || 0)) { P.knockT = Math.max(P.knockT || 0, 0.15); P._patongT = (run.t || 0) + 1; } } catch (e) { }
    return r;
  };

  // ---------- 不死不休：第二次＝永久死亡 ----------
  const upMates = () => { const N = R.net; let n = 0; if (N && N.room && N.remotes) N.remotes.forEach(r => { if (r && r.h && !r.h.down) n++; }); return n; };
  const permaDeath = (run, P) => {
    run.done = true; P.dead = true; P.hp = 0; P.dashT = 0; R.setDown && R.setDown(P.h, true);
    const s = S(), slot = R.slot, name = (s && s.name) || '勇者';
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;inset:0;z-index:9800;background:rgba(8,4,6,.92);display:grid;place-items:center;color:#F0E6E0;text-align:center;padding:16px';
    el.innerHTML = '<div style="max-width:560px"><div style="font:900 clamp(28px,6vw,54px)/1.2 serif;letter-spacing:.2em;color:#E05A4A">永久死亡</div><p style="font-size:18px;margin:18px 0">' + esc(name) + '沒有再站起來。</p>'
      + '<p style="opacity:.8;line-height:1.6">不死不休：同一趟遺跡裡第二次倒下。<br>這個角色的存檔（倉庫、家、所有職業、費拉）會被刪除。</p><p id="pd-n" style="font-size:22px;margin-top:22px">5</p></div>';
    document.body.appendChild(el);
    let n = 5; const t = setInterval(() => {
      n--; const c = document.getElementById('pd-n'); if (c) c.textContent = n > 0 ? String(n) : '';
      if (n > 0) return; clearInterval(t);
      try { R.endRun(); } catch (e) { console.warn('[traitdeath]', e); }
      R.deleteSlot(slot); R.S = null;
      try { R.goTitle && R.goTitle(); } catch (e) { console.warn('[traitdeath]', e); }
      el.remove();
    }, 1000);
  };
  const pd0 = R.onPlayerDown;
  R.onPlayerDown = (...a) => {
    const w = W(), run = w.run, P = w.P;
    if (run && P && !run.done && has('busi') && run.busiUsed && !(R.inTraining && R.inTraining())) {
      if (!P._busiNet && upMates() > 0) { P._busiNet = true; return pd0(...a); }   // 先等隊友扶
      return permaDeath(run, P);
    }
    return pd0(...a);
  };
  // 刪檔以後，endRun 回城的那一下不要做
  const en0 = R.enterTownNow;
  if (en0) R.enterTownNow = (...a) => { if (!S()) return; return en0(...a); };

  // ---------- 貪生怕死：AI 接手 ----------
  const ai = { on: false, mode: 'away', t: 0, path: null, tgt: null, pathT: 0 };
  const enemiesNear = P => (W().enemies || []).filter(e => !e.dead && e.aggro && Math.hypot(e.x - P.x, e.z - P.z) < 16);
  const awayDir = P => { let x = 0, z = 0; enemiesNear(P).forEach(e => { const dx = P.x - e.x, dz = P.z - e.z, d2 = Math.max(0.5, dx * dx + dz * dz); x += dx / d2; z += dz / d2; }); const l = Math.hypot(x, z); return l > 1e-6 ? [x / l, z / l] : null; };
  const pickTarget = (P, kind) => {
    const F = W().F || {};
    if (kind === 'exit') { const c = [].concat(F.crystals || [], F.stairs ? [F.stairs] : [], F.up ? [F.up] : []).filter(o => o && o.x != null); c.sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z)); return c[0] || null; }
    const here = R.roomAt ? R.roomAt(P.x, P.z) : null, rooms = (F.rooms || []).filter(r => r !== here && r.x != null);
    const quiet = rooms.filter(r => !(W().enemies || []).some(e => !e.dead && R.roomAt && R.roomAt(e.x, e.z) === r));
    const pool = quiet.length ? quiet : rooms; pool.sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z));
    return pool[0] ? { x: pool[0].x, z: pool[0].z } : null;
  };
  const roll = P => {
    const r = Math.random();
    ai.mode = r < 0.7 ? 'away' : r < 0.8 ? 'room' : r < 0.82 ? 'drink' : r < 0.85 ? 'exit' : 'skill';
    ai.tgt = ai.mode === 'room' || ai.mode === 'exit' ? pickTarget(P, ai.mode) : null; ai.path = null;
    if (ai.mode === 'drink') { try { R.drink && R.drink(Math.random() < 0.5 ? 'hp' : 'mp'); } catch (e) { } ai.mode = 'away'; }
    if (ai.mode === 'skill') { try { const i = Math.floor(Math.random() * 6); if (i === 0) R.useSkill && R.useSkill(); else R.castSlot && R.castSlot(i); } catch (e) { } ai.mode = 'away'; }
  };
  const steer = P => {
    if (ai.mode === 'away' || !ai.tgt) return awayDir(P);
    if (!ai.path && R.summonPath) ai.path = R.summonPath(P.x, P.z, ai.tgt.x, ai.tgt.z) || [];
    const pts = ai.path || []; while (pts.length && Math.hypot(pts[0].x - P.x, pts[0].z - P.z) < 0.7) pts.shift();
    const g = pts[0] || ai.tgt, dx = g.x - P.x, dz = g.z - P.z, l = Math.hypot(dx, dz);
    return l > 0.4 ? [dx / l, dz / l] : null;
  };
  const st0 = R.step;
  R.step = dt => {
    const w = W(), P = w.P, run = w.run, I = R.input;
    if (P && !P.dead && !P.netDown) P._busiNet = false;   // 被隊友扶起來了：下次倒下再等一次救
    if (!run || run.done || !P || P.dead || !I || w.paused || !has('tansheng') || !(P.hpMax > 0)) { ai.on = false; return st0(dt); }
    const f = P.hp / P.hpMax;
    if (!ai.on && f < 0.35) { ai.on = true; ai.t = 0; R.banner && R.banner('腦袋一片空白……', '（貪生怕死：生命回到 36% 以上才停）'); }
    else if (ai.on && f >= 0.36) { ai.on = false; R.toast && R.toast('回過神來了。', '#9AE07A'); }
    if (!ai.on) return st0(dt);
    ai.t -= dt; if (ai.t <= 0) { ai.t = 1; roll(P); }
    let dir = null; try { dir = steer(P); } catch (e) { }
    const keys = I.keys, ms = I.moveStick, fire = I.fire, cam = w.cam;
    let stick = null;
    if (dir && cam) { const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw); stick = { x: dir[0] * cy - dir[1] * sy, y: dir[0] * sy + dir[1] * cy }; }
    I.keys = {}; I.fire = false; I.moveStick = stick;
    try { return st0(dt); } finally { I.keys = keys; I.moveStick = ms; I.fire = fire; }
  };

  // ---------- 角色總數值 ----------
  const ch0 = R.charSheetHtml;
  if (ch0) R.charSheetHtml = (cls, opt) => {
    const h = ch0(cls, opt);
    try {
      const row = (a, b, c) => '<div class="cs-row"><span>' + a + '</span><b>' + b + '</b>' + (c ? '<small>' + c + '</small>' : '') + '</div>';
      let add = '';
      if (has('yuebai')) add += row('判定倒下', '生命 ' + Math.round(R.traitDeathLine() * 100) + '% 以下', '越敗越退：倒下 ' + ybN() + ' 次（最多 40）');
      if (has('busi')) add += row('不死不休', W().run && W().run.busiUsed ? '這一趟已經用過' : '這一趟還沒用', '同一趟第二次倒下＝永久死亡');
      return add ? h.replace('<h4>基本</h4>', '<h4>基本</h4>' + add) : h;
    } catch (e) { return h; }
  };
})(window.R);
