// 30 級技能（2026-10-15 作者：各職業 30 等學一個類似大招的小技能，冷卻 60～90 秒、收益很高）
// - 職業等級 30 自動學會，按 B（手機：右下角的「奧」鈕）放；冷卻每一趟遺跡重新算，暫停不算。
// - 2026-10-15 作者：盡量以傷害型為主——槍手 全彈發射、弓箭手 千矢、戰士 斷岳、術士 天墜（大隕石，代價：佩特拉的注意直接滿 100）、牧師 審判之光、
//   刀客 刀意解放、騎士 聖槍衝鋒、武術家 百裂拳、吟遊詩人 大合奏、召喚師 百鬼夜襲、術陣師 陣界崩落、附魔師 刻印爆裂、符卷師 千符陣。
// - 傷害的基準用大招的基準（ult.js 的 R.ultBase）。
// 放在 classcore.js、classcore2.js、bardchord.js、ult.js 後面。
(function (R) {
  const W = () => R.W, rnd = Math.random, CT = () => (R.coreTime ? R.coreTime() : performance.now() / 1000);
  const live = () => { const w = W(); return !!(w && w.run && !w.run.done && w.P && !w.P.dead && !w.paused); };
  const base = P => (R.ultBase ? R.ultBase(P) : ((P.ws && P.ws.dmg) || 10) * 3);
  const aimPt = (P, max) => { const ax = P.aimX != null ? P.aimX : P.x + Math.sin(P.aimA) * 6, az = P.aimZ != null ? P.aimZ : P.z + Math.cos(P.aimA) * 6, d = Math.hypot(ax - P.x, az - P.z), k = d > max ? max / d : 1; const p = [P.x + (ax - P.x) * k, P.z + (az - P.z) * k]; return R.nearestFloor ? R.nearestFloor(p[0], p[1]) : p; };
  const later = (f, ms) => { const run = W().run; setTimeout(() => { const w = W(); if (w.run === run && w.P && !w.P.dead && !run.done) f(); }, ms); };
  const say = (P, t) => R.num && R.num(P.x, 2.6, P.z, t, 'crit');
  const T = {};   // 進行中的效果（照遊戲時間）

  const SK = {
    gunner: { n: '全彈發射', cd: 75, d: '4 秒內攻速 ×3、不耗彈匣、每發多穿透 1 隻。', go(P) {
      const ws = P.ws; if (!ws) return false; const r0 = ws.rate, p0 = ws.pierce || 0; ws.rate = r0 * 3; ws.pierce = p0 + 1; T.gun = { ws, r0, p0, end: CT() + 4 };
      R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 2.5, color: '#FFB45A' }); } },
    archer: { n: '千矢', cd: 70, d: '準心處下 4 秒箭雨（半徑 4 公尺，每 0.25 秒一波），鷹眼直接疊滿。', go(P) {
      const [x, z] = aimPt(P, 14), dmg = base(P) * 0.35; R.fx && R.fx('mark', x, 0, z, { r: 4, t: 4 });
      for (let i = 0; i < 16; i++) later(() => { R.fx && R.fx('rain', x, 0, z, { r: 4 }); R.aoe(x, z, 4, dmg); }, i * 250);
      P._hawk = Math.max(P._hawk || 0, (R.legOf ? R.legOf(P) : null) === 'lg_hawkking' ? 8 : 5); } },
    warrior: { n: '斷岳', cd: 75, d: '往準心跳過去（最遠 8 公尺）重重砸下：落點半徑 4.5 公尺大範圍傷害、暈眩 1.5 秒，打中的每一隻多 6 怒氣。', go(P) {
      const [x, z] = aimPt(P, 8), dmg = base(P) * 3.2; P.jump = { t: 0, dur: 0.6, x0: P.x, z0: P.z, x1: x, z1: z }; P.air = 0.6; R.fx && R.fx('mark', x, 0, z, { r: 4.5, t: 0.6 });
      later(() => { R.fx && R.fx('boom', x, 0.4, z, { r: 4.5, color: '#E8503A' }); R.fx && R.fx('ring', x, 0.1, z, { r: 4.5, color: '#FFB45A' }); R.shake && R.shake(0.5);
        const n = (W().enemies || []).filter(e => !e.dead && Math.hypot(e.x - x, e.z - z) < 4.5 + e.def.size * 0.5).length; R.aoe(x, z, 4.5, dmg, { stun: 1.5, kb: 2 });
        const C = R.CORE && R.CORE.warrior; if (C && n) C.add(P, 6 * n); }, 620); } },
    mage: { n: '天墜', cd: 80, d: '1.5 秒後在準心處砸下一顆大隕石（半徑 7 公尺、非常痛、燃燒）。代價：佩特拉的注意直接滿 100。', go(P) {
      const [x, z] = aimPt(P, 16), dmg = base(P) * 4; R.fx && R.fx('mark', x, 0, z, { r: 7, t: 1.5 });
      later(() => { R.fx && R.fx('boom', x, 0.6, z, { r: 7, color: '#FF7A3A' }); R.fx && R.fx('ring', x, 0.1, z, { r: 7, color: '#FFB45A' }); R.aoe(x, z, 7, dmg, { burn: true, kb: 3 }); R.shake && R.shake(0.6);
        const run = W().run; if (run && R.addAware) R.addAware(1000, 'boom'); else if (run) run.aware = 100; }, 1500); } },
    priest: { n: '審判之光', cd: 80, d: '準心處落下三道審判光柱（半徑 5 公尺，每 0.4 秒一道），最後一道讓敵人暈眩；光柱照到的隊友各回 15% 生命。', go(P) {
      const [x, z] = aimPt(P, 13), dmg = base(P) * 1.3; R.fx && R.fx('mark', x, 0, z, { r: 5, t: 1.4 });
      for (let i = 0; i < 3; i++) later(() => { R.fx && R.fx('pillar', x, 0, z, { r: 3, color: '#FFE8A0' }); R.fx && R.fx('ring', x, 0.1, z, { r: 5, color: '#FFE8A0' }); R.aoe(x, z, 5, dmg, i === 2 ? { stun: 1.2 } : {}); R.shake && R.shake(0.25);
        if (Math.hypot(P.x - x, P.z - z) < 5) R.healP(P.hpMax * 0.15); (W().allies || []).forEach(a => { if (a && !a.dead && a.hp != null && a.hpMax && Math.hypot(a.x - x, a.z - z) < 5) a.hp = Math.min(a.hpMax, a.hp + a.hpMax * 0.15); }); }, 400 + i * 400); } },
    blade: { n: '刀意解放', cd: 60, d: '原地一圈拔刀斬（半徑 4.5 公尺、大傷害），刀意直接集滿；之後 5 秒內普攻不用衝刺、刀刀必定暴擊。', go(P) {
      R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 4.5, color: '#FFFFFF' }); R.melee(P.aimA, 4.5, Math.PI * 2, base(P) * 2.4, 0, 0, 0, { crit: true, primary: false, hs: 1, big: true }); R.shake && R.shake(0.35);
      P._iai = Math.max(P._iai || 0, P.pv && P.pv.bdMunen ? 200 : 100); P._l30BdT = CT() + 5; } },
    knight: { n: '聖槍衝鋒', cd: 75, d: '舉槍往前衝 10 公尺（衝的時候無敵），撞到的敵人大傷害、擊退；衝到底再爆開一圈（半徑 3.5 公尺）。', go(P) {
      const a = P.aimA, dmg = base(P) * 2.2; R.dash(a, 10, 0.35, { iframe: true, hit: dmg, stun: 0.8, kb: 3 });
      later(() => { R.fx && R.fx('boom', P.x, 0.4, P.z, { r: 3.5, color: '#FFE8A0' }); R.aoe(P.x, P.z, 3.5, dmg * 0.8, { kb: 2 }); R.shake && R.shake(0.35); }, 380); } },
    monk: { n: '百裂拳', cd: 60, d: '2 秒內往前連打 20 拳（每拳 0.6 倍普攻），連段直接 +20。', go(P) {
      const dmg = ((P.ws && P.ws.dmg) || 10) * 0.6; for (let i = 0; i < 20; i++) later(() => { R.swingAnim && R.swingAnim(P.h, 0.02, 0.08); R.melee(P.aimA + (rnd() - 0.5) * 0.5, 3, 1.2, dmg, 0, 0, 0, { dir: i % 2 ? -1 : 1, hs: 1, primary: false }); }, i * 100);
      const C = R.CORE && R.CORE.monk; P._combo = Math.min(C && C.max ? C.max(P) : 100, (P._combo || 0) + 20); P._comboT = CT(); } },
    bard: { n: '大合奏', cd: 75, d: '把目前的樂譜立刻演奏兩次（音符一個一個射出去），不耗魔、不用等演奏時間。', go(P) {
      if (!R.bardEncore || !R.bardEncore(P, 2)) { R.toast && R.toast('樂譜是空的：先按住 X 寫一段樂譜'); return false; } } },
    summoner: { n: '百鬼夜襲', cd: 80, d: '叫出 10 道鬼影，從四面八方撲向準心附近 6 公尺內的敵人（每道小範圍傷害），召喚物 10 秒內傷害 ×2。', go(P) {
      const [x, z] = aimPt(P, 13), dmg = base(P) * 0.55; T.pets = CT() + 10; R.fx && R.fx('mark', x, 0, z, { r: 6, t: 1.6 });
      for (let i = 0; i < 10; i++) later(() => { const es = (W().enemies || []).filter(e => !e.dead && Math.hypot(e.x - x, e.z - z) < 6), tg = es[Math.floor(rnd() * es.length)], a = rnd() * 6.28, tx = tg ? tg.x : x + Math.sin(a) * rnd() * 5, tz = tg ? tg.z : z + Math.cos(a) * rnd() * 5;
        R.fx && R.fx('poof', tx, 1, tz, { color: '#B8E07A', n: 14 }); R.fx && R.fx('ring', tx, 0.1, tz, { r: 1.6, color: '#B8E07A' }); R.aoe(tx, tz, 1.6, dmg); }, 150 + i * 150); } },
    arraymage: { n: '陣界崩落', cd: 80, d: '準心處畫一個 8 公尺的巨大法陣，1.5 秒後整片崩落（大傷害），接著外圈再爆一次。', go(P) {
      const [x, z] = aimPt(P, 14), dmg = base(P) * 3.2; R.fx && R.fx('mark', x, 0, z, { r: 8, t: 1.5 }); R.fx && R.fx('ring', x, 0.1, z, { r: 8, color: '#7AC8E8' });
      later(() => { R.fx && R.fx('boom', x, 0.5, z, { r: 8, color: '#7AC8E8' }); R.aoe(x, z, 8, dmg, { kb: 1 }); R.shake && R.shake(0.5); }, 1500);
      later(() => { R.fx && R.fx('ring', x, 0.1, z, { r: 10, color: '#BFF0FF' }); R.aoe(x, z, 10, dmg * 0.4); }, 1900); } },
    enchanter: { n: '刻印爆裂', cd: 75, d: '五種刻印依序在準心處爆開（半徑 3.5 公尺，每 0.3 秒一下）：焰燃燒、霜變慢、雷暈眩、風擊退、金讓敵人 5 秒受到的傷害 +20%。', go(P) {
      const [x, z] = aimPt(P, 12), dmg = base(P) * 0.8, RU = [['#FF6A2A', { burn: true }], ['#9AD8FF', {}], ['#FFE070', { stun: 0.8 }], ['#BFF0E0', { kb: 3 }], ['#D8C890', {}]];
      RU.forEach(([c, o], i) => later(() => { R.fx && R.fx('boom', x, 0.4, z, { r: 3.5, color: c }); R.aoe(x, z, 3.5, dmg, o);
        (W().enemies || []).forEach(e => { if (e.dead || Math.hypot(e.x - x, e.z - z) > 3.5 + e.def.size * 0.5) return; if (i === 1 && e.st) e.st.slow = Math.max(e.st.slow || 0, 3); if (i === 4) e._sunder = CT() + 5; }); }, i * 300)); } },
    scroll: { n: '千符陣', cd: 70, d: '6 秒內每 0.5 秒在身邊 6 公尺內自動落一張攻擊符（半徑 1.8 公尺）。', go(P) {
      const dmg = base(P) * 0.45;
      for (let i = 0; i < 12; i++) later(() => { const es = (W().enemies || []).filter(e => !e.dead && Math.hypot(e.x - P.x, e.z - P.z) < 6), tg = es[Math.floor(rnd() * es.length)], a = rnd() * 6.28, d = rnd() * 5, x = tg ? tg.x : P.x + Math.sin(a) * d, z = tg ? tg.z : P.z + Math.cos(a) * d;
        R.fx && R.fx('boom', x, 0.4, z, { r: 1.8, color: '#E8C86A' }); R.aoe(x, z, 1.8, dmg); }, i * 500); } }
  };
  R.LV30 = SK;
  const LV = 30, ok = P => !!P && SK[P.cls] && (P.lv || 1) >= LV;
  let cdEnd = 0, cdRun = null;
  const cdLeft = () => (cdRun === W().run ? Math.max(0, cdEnd - CT()) : 0);
  R.castLv30 = () => {
    const P = W().P; if (!live() || (R.sheetOpen && R.sheetOpen())) return;
    if (!SK[P.cls]) return; if ((P.lv || 1) < LV) { R.toast && R.toast('職業等級 30 才會學會「' + SK[P.cls].n + '」'); return; }
    const left = cdLeft(); if (left > 0) { R.toast && R.toast(SK[P.cls].n + '：冷卻還有 ' + Math.ceil(left) + ' 秒'); return; }
    const s = SK[P.cls]; if (s.go(P) === false) return;
    cdRun = W().run; cdEnd = CT() + s.cd; say(P, s.n); R.sfx && R.sfx('skill'); R.shake && R.shake(0.2);
  };

  // ---------- 持續效果 ----------
  const st0 = R.step;
  R.step = dt => {
    const r = st0(dt); const w = W(), P = w.P; if (!w.run || !P) return r; const t = CT();
    try {
      if (T.gun && t > T.gun.end) { if (P.ws === T.gun.ws) { P.ws.rate = T.gun.r0; P.ws.pierce = T.gun.p0; } T.gun = null; }
      if (T.gun && P.ws && P.ws.mag) P.ammo = P.ws.mag;
      if (T.ench && t > T.ench.end) { if (P.ws === T.ench.ws) P.ws.rate = T.ench.r0; T.ench = null; }
      const fast = (T.field && t < T.field.end && Math.hypot(P.x - T.field.x, P.z - T.field.z) < T.field.r ? 2 : 0) + (T.ench ? 1 : 0);   // 多轉幾倍的冷卻
      if (fast && !w.paused) { P.skillCd = Math.max(0, (P.skillCd || 0) - dt * fast); if (P.skCd) P.skCd = P.skCd.map(v => Math.max(0, (v || 0) - dt * fast)); }
      if (T.wall) {
        if (t > T.wall.end) T.wall = null;
        else { const { cx, cz, a, half } = T.wall, nx = Math.sin(a), nz = Math.cos(a), along = (x, z) => (x - cx) * Math.cos(a) - (z - cz) * Math.sin(a), side = (x, z) => (x - cx) * nx + (z - cz) * nz;
          (w.shots || []).forEach(q => { if (!q.dead && q.owner !== 'p' && Math.abs(side(q.x, q.z)) < 0.6 && Math.abs(along(q.x, q.z)) < half) { R.killShot ? R.killShot(q) : (q.life = -1); } });
          (w.enemies || []).forEach(e => { if (e.dead) return; const s = side(e.x, e.z), r = (e.def.size || 1) * 0.5 + 0.4; if (Math.abs(along(e.x, e.z)) < half + r && s > -r && s < r) { e.x += nx * (r - s); e.z += nz * (r - s); } });
          if (!w.paused && rnd() < dt * 10) R.fx && R.fx('spark', cx + Math.cos(a) * (rnd() * 6 - 3), 0.6 + rnd() * 1.5, cz - Math.sin(a) * (rnd() * 6 - 3), { color: '#FFE8A0' }); }
      }
      if (T.field && t > T.field.end) T.field = null;
    } catch (e) { console.warn('[lv30]', e); }
    return r;
  };
  // 傷害：召喚物 ×2、陣界裡 +50%、刻印共鳴 +25%（燃燒、變慢）
  const he0 = R.hurtEnemy;
  R.hurtEnemy = (e, raw, o) => {
    const P = W().P, t = CT();
    if (P && e && !e.dead && raw > 0 && !(o && o.reflect)) {
      if (T.pets && t < T.pets && e.petHit) raw *= 2;
      if (T.field && t < T.field.end && Math.hypot(P.x - T.field.x, P.z - T.field.z) < T.field.r) raw *= 1.5;
      if (T.ench && t < T.ench.end) { raw *= 1.25; if (e.st) { e.st.burn = Math.max(e.st.burn || 0, 3); e.st.slow = Math.max(e.st.slow || 0, 1.5); } }
    }
    return he0(e, raw, o);
  };
  // 受傷：不屈（不會被打死、一半轉成怒氣）、聖壁後面 −50%
  const hp0 = R.hurtPlayer;
  R.hurtPlayer = (raw, src, o) => {
    const P = W().P, t = CT();
    if (P && raw > 0) {
      if (T.wall && t < T.wall.end && src && src.x != null) { const { cx, cz, a } = T.wall, sP = (P.x - cx) * Math.sin(a) + (P.z - cz) * Math.cos(a), sS = (src.x - cx) * Math.sin(a) + (src.z - cz) * Math.cos(a); if (sP < 0 && sS > 0) raw *= 0.5; }
      if (T.undying && t < T.undying) { const C = R.CORE && R.CORE.warrior; if (C && P.cls === 'warrior') C.add(P, raw / P.hpMax * 100 * 0.5); if (P.hp - raw < 1) raw = Math.max(0, P.hp - 1); }
    }
    return hp0(raw, src, o);
  };
  // 新的一趟：冷卻、效果歸零
  const sr0 = R.startRun; if (sr0) R.startRun = (...a) => { cdEnd = 0; cdRun = null; Object.keys(T).forEach(k => { T[k] = null; }); return sr0(...a); };

  // ---------- 按鍵、按鈕 ----------
  window.addEventListener('keydown', e => { if ((e.key === 'b' || e.key === 'B') && !e.repeat && !(e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName))) { const w = W(); if (w && w.run && w.P) R.castLv30(); } });
  let btn = null;
  const ht0 = R.hudTick;
  R.hudTick = (...a) => {
    const r = ht0 ? ht0(...a) : undefined; const w = W(), P = w && w.P;
    try {
      const show = !!(w && w.run && ok(P));
      if (show && (!btn || !btn.isConnected)) { const host = document.getElementById('run'); if (host) { btn = document.createElement('button'); btn.type = 'button'; btn.id = 'lv30-btn'; btn.className = 'dungeon-only'; btn.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); R.castLv30(); }); host.appendChild(btn); } }
      if (btn) { btn.hidden = !show; if (show) { const s = SK[P.cls], left = cdLeft(), txt = left > 0 ? Math.ceil(left) + '' : '奧'; if (btn.textContent !== txt) btn.textContent = txt; btn.classList.toggle('cd', left > 0); const tip = s.n + '（B）：' + s.d + ' 冷卻 ' + s.cd + ' 秒'; if (btn.title !== tip) btn.title = tip; } }
    } catch (e) { }
    return r;
  };
  const css = document.createElement('style');
  css.textContent = '#lv30-btn{position:fixed;right:18px;bottom:200px;z-index:7;width:46px;height:46px;border-radius:50%;border:2px solid #FFE08A;background:radial-gradient(circle at 35% 30%,#5A4A2A,#1A1410);color:#FFE08A;font-weight:700;font-size:16px;cursor:pointer;box-shadow:0 0 12px rgba(255,224,138,.45)}'
    + '#lv30-btn.cd{border-color:#6A6050;color:#B8B0A0;box-shadow:none;background:#1A1814}#lv30-btn[hidden]{display:none}';
  document.head.appendChild(css);
})(window.R);
