// 30 級技能（2026-10-15 作者：各職業 30 等學一個類似大招的技能，冷卻 60～90 秒、收益很高、以傷害為主）
// - 技能書裡職業等級 30 學會，跟一般技能一樣裝在技能格放（耗 20 魔力，冷卻吃冷卻縮減）。
// - 2026-10-15 作者第三版規格（每一招照作者寫的效果）：槍手 無盡彈匣、弓箭手 千矢、戰士 斷岳、術士 天墜、牧師 審判之光、刀客 刀意解放、
//   騎士 守護意志、武術家 百裂拳、吟遊詩人 大合奏、召喚師 召喚山神、術陣師 雷魔陣、附魔師 刻印爆裂、符卷師 千符陣。
// - 傷害的基準用大招的基準（ult.js 的 R.ultBase）。時間照遊戲時間（暫停不算），用 sched 排。
// 放在 classcore.js、classcore2.js、bardchord.js、ult.js、skillbook.js 後面。
(function (R) {
  const W = () => R.W, rnd = Math.random, CT = () => (R.coreTime ? R.coreTime() : performance.now() / 1000);
  const base = P => (R.ultBase ? R.ultBase(P) : ((P.ws && P.ws.dmg) || 10) * 3);
  const aimPt = (P, max) => { const ax = P.aimX != null ? P.aimX : P.x + Math.sin(P.aimA) * 6, az = P.aimZ != null ? P.aimZ : P.z + Math.cos(P.aimA) * 6, d = Math.hypot(ax - P.x, az - P.z), k = d > max ? max / d : 1; const p = [P.x + (ax - P.x) * k, P.z + (az - P.z) * k]; return R.nearestFloor ? R.nearestFloor(p[0], p[1]) : p; };
  const mouse = P => [P.aimX != null ? P.aimX : P.x + Math.sin(P.aimA) * 6, P.aimZ != null ? P.aimZ : P.z + Math.cos(P.aimA) * 6];
  const say = (P, t, k) => R.num && R.num(P.x, 2.6, P.z, t, k || 'crit');
  const foes = () => (W().enemies || []).filter(e => !e.dead && !e.under);
  const within = (x, z, r) => foes().filter(e => Math.hypot(e.x - x, e.z - z) < r + (e.def.size || 1) * 0.5);
  const isBoss = e => !!(e.def && (e.def.boss || e.lord || e.def.lord));
  // 直接扣血（無視減傷、護盾、無敵）
  const rawHit = (e, v) => { if (e.dead) return; e.hp -= v; R.num && R.num(e.x, 1.8 * (e.def.size || 1) + 0.8, e.z, Math.round(v) + '', 'crit'); if (e.hp <= 0) { e.hp = 0; R.killEnemy && R.killEnemy(e); } };
  const slay = e => { if (e.dead) return; e.invuln = false; e.shield = 0; e.hp = 0; R.num && R.num(e.x, 1.8 * (e.def.size || 1) + 0.8, e.z, '斬殺', 'crit'); R.killEnemy && R.killEnemy(e); };
  // 遊戲時間排程（暫停不走）
  let Q = [];
  const sched = (sec, f) => { Q.push({ at: CT() + sec, f, run: W().run }); };
  const T = {};   // 進行中的效果

  const SK = {
    gunner: { n: '無盡彈匣', cd: 75, d: '5 秒內攻速 ×3、不耗彈匣，子彈穿過牆壁、無限穿透敵人。', go(P) {
      const ws = P.ws; if (!ws) return false; T.gun = { ws, r0: ws.rate, p0: ws.pierce || 0, end: CT() + 5 }; ws.rate *= 3; ws.pierce = 999;
      R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 2.5, color: '#FFB45A' }); } },
    archer: { n: '千矢', cd: 70, d: '6 秒內持續朝準心處（半徑 4 公尺）降下箭雨，每 0.3 秒一次（吃攻速，攻速越快越密）。', go(P) {
      T.arrow = { end: CT() + 6, acc: 0.3 }; } },
    warrior: { n: '斷岳', cd: 80, d: '原地蓄力 2 秒（期間無敵），接著跳到準心處（最遠 10 公尺）砸下一圈 360 度大斬擊（半徑 5.5 公尺），附帶敵人 100% 最大生命的傷害（首領 10%）。', go(P) {
      P.stance = Math.max(P.stance || 0, 2); P.iframe = Math.max(P.iframe || 0, 2.2); R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 2, color: '#E8503A' }); say(P, '蓄力…', 'heal');
      sched(2, () => { const [x, z] = aimPt(P, 10); P.jump = { t: 0, dur: 0.6, x0: P.x, z0: P.z, x1: x, z1: z }; P.air = 0.6; P.iframe = Math.max(P.iframe || 0, 0.7); R.fx && R.fx('mark', x, 0, z, { r: 5.5, t: 0.6 });
        sched(0.62, () => { R.fx && R.fx('boom', x, 0.4, z, { r: 5.5, color: '#E8503A' }); R.fx && R.fx('swing', x, 1.1, z, { a: P.aimA, range: 5.5, arc: 6.28, color: '#FFB45A', big: true }); R.shake && R.shake(0.6);
          within(x, z, 5.5).forEach(e => R.hurtEnemy(e, base(P) * 2 + e.hpMax * (isBoss(e) ? 0.1 : 1), { kb: 2, primary: false })); }); }); } },
    mage: { n: '天墜', cd: 90, d: '蓄力 2 秒後砸下大隕石（半徑 7 公尺）：範圍內的遺跡生物全部斬殺（無視減傷、護盾、無敵），首領額外受到 20% 最大生命的傷害。代價：佩特拉的注意直接滿 100。', go(P) {
      const [x, z] = aimPt(P, 16); P.stance = Math.max(P.stance || 0, 2); R.fx && R.fx('mark', x, 0, z, { r: 7, t: 2 }); say(P, '詠唱…', 'heal');
      sched(2, () => { R.fx && R.fx('boom', x, 0.6, z, { r: 7, color: '#FF7A3A' }); R.fx && R.fx('ring', x, 0.1, z, { r: 7, color: '#FFB45A' }); R.shake && R.shake(0.7);
        within(x, z, 7).forEach(e => { if (isBoss(e)) { R.hurtEnemy(e, base(P) * 3, { burn: true, primary: false }); rawHit(e, e.hpMax * 0.2); } else slay(e); });
        if (R.addAware) R.addAware(1000, 'boom'); else if (W().run) W().run.aware = 100; }); } },
    priest: { n: '審判之光', cd: 85, d: '準心處落下三道審判光柱（半徑 4、6、8 公尺，每 0.4 秒一道），最後一道暈眩；光柱照到的自己和隊友回 50% 生命，最後一道再給 25% 最大生命的護盾，並立刻把倒下的隊友救起來（回滿生命）。', go(P) {
      const [x, z] = aimPt(P, 13), dmg = base(P) * 1.2; R.fx && R.fx('mark', x, 0, z, { r: 8, t: 1.3 });
      [4, 6, 8].forEach((r, i) => sched(0.4 + i * 0.4, () => {
        const last = i === 2; R.fx && R.fx('pillar', x, 0, z, { r: r * 0.6, color: '#FFE8A0' }); R.fx && R.fx('ring', x, 0.1, z, { r, color: '#FFE8A0' }); R.shake && R.shake(0.25);
        within(x, z, r).forEach(e => R.hurtEnemy(e, dmg, last ? { stun: 1.5, primary: false } : { primary: false }));
        const inR = o => Math.hypot(o.x - x, o.z - z) < r;
        if (inR(P)) { R.healP(P.hpMax * 0.5); if (last) { P.shield = (P.shield || 0) + P.hpMax * 0.25; P.buff = P.buff || {}; P.buff.shieldT = Math.max(P.buff.shieldT || 0, 10); } }
        (W().allies || []).forEach(a => { if (!a || a.hpMax == null) return; if (last && a.downed) { a.downed = false; a.dead = false; a.hp = a.hpMax; R.num && R.num(a.x, 2.4, a.z, '復活', 'heal'); return; }
          if (!a.downed && inR(a)) { a.hp = Math.min(a.hpMax, a.hp + a.hpMax * 0.5); if (last) a.shield = (a.shield || 0) + a.hpMax * 0.25; } });
      })); } },
    blade: { n: '刀意解放', cd: 90, d: '5 秒內刀意一直是滿的：每一刀都是居合，而且一直處在刀意渾圓，攻速再 ×3；每次普攻都瞬移到 10 公尺內最近的敵人身前砍一刀，再瞬移回原位（不衝刺）。', go(P) {
      P._l30BdT = CT() + 5; P._bdSt = 'drawn'; P._bdRead = null; R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 3, color: '#FFFFFF' }); } },
    knight: { n: '守護意志', cd: 75, d: '嘲諷 10 公尺內所有敵人，把牠們拉到身邊（無視牆壁）、全部改打你；接著 2.5 秒受到的傷害 −90%、移動 −80%，記下這段時間受到的傷害，結束時反擊 5 公尺內：（受到的傷害＋1% 最大生命）× 100，並得到 40% 最大生命的護盾。', go(P) {
      const es = within(P.x, P.z, 10); es.forEach((e, i) => { const a = i / Math.max(1, es.length) * Math.PI * 2, rr = 1.4 + (e.def.size || 1) * 0.5, q = R.nearestFloor ? R.nearestFloor(P.x + Math.sin(a) * rr, P.z + Math.cos(a) * rr) : [P.x, P.z]; e.x = q[0]; e.z = q[1]; e.aggro = true; e.provoked = true; e.taunt = 2.5; });
      P.taunt = Math.max(P.taunt || 0, 2.5); R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 10, color: '#C9A13A' }); R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 2, color: '#FFE8A0' });
      T.guard = { end: CT() + 2.5, rec: 0, sp: P.speed }; P.speed *= 0.2;
      sched(2.5, () => { const g = T.guard; if (!g) return; T.guard = null; if (P.speed === g.sp * 0.2) P.speed = g.sp;
        const v = (g.rec + P.hpMax * 0.01) * 100; R.fx && R.fx('boom', P.x, 0.4, P.z, { r: 5, color: '#FFE8A0' }); R.shake && R.shake(0.5);
        within(P.x, P.z, 5).forEach(e => R.hurtEnemy(e, v, { kb: 3, primary: false })); P.shield = (P.shield || 0) + P.hpMax * 0.4; P.buff = P.buff || {}; P.buff.shieldT = Math.max(P.buff.shieldT || 0, 10); say(P, '反擊 ' + Math.round(v)); }); } },
    monk: { n: '百裂拳', cd: 60, d: '2 秒內往前連打 19 拳（每拳 0.6 倍普攻），最後一下是重拳（5 倍、擊飛；生命 30% 以下的敵人吃 3 倍——斬殺），連段直接 +20。', go(P) {
      const dmg = ((P.ws && P.ws.dmg) || 10) * 0.6; for (let i = 0; i < 19; i++) sched(i * 0.1, () => { R.swingAnim && R.swingAnim(P.h, 0.02, 0.08); R.melee(P.aimA + (rnd() - 0.5) * 0.5, 3, 1.2, dmg, 0, 0, 0, { dir: i % 2 ? -1 : 1, hs: 1, primary: false }); });
      sched(2.05, () => { const a = P.aimA; R.swingAnim && R.swingAnim(P.h, 0.05, 0.3); R.fx && R.fx('boom', P.x + Math.sin(a) * 2, 0.8, P.z + Math.cos(a) * 2, { r: 2.2, color: '#FFB45A' }); R.shake && R.shake(0.45);
        foes().forEach(e => { const dx = e.x - P.x, dz = e.z - P.z, d = Math.hypot(dx, dz), r = (e.def.size || 1) * 0.5; if (d > 3.6 + r) return; const da = Math.atan2(Math.sin(Math.atan2(dx, dz) - a), Math.cos(Math.atan2(dx, dz) - a)); if (Math.abs(da) > 0.9 && d > r + 0.8) return;
          const exe = e.hp < e.hpMax * 0.3; R.hurtEnemy(e, dmg * 5 * (exe ? 3 : 1), { kb: 4, stun: 0.6, crit: exe, primary: false }); if (exe) R.num && R.num(e.x, 1.8 * (e.def.size || 1) + 1, e.z, '斬殺', 'crit'); }); });
      const C = R.CORE && R.CORE.monk; P._combo = Math.min(C && C.max ? C.max(P) : 100, (P._combo || 0) + 20); P._comboT = CT(); } },
    bard: { n: '大合奏', cd: 75, d: '把樂譜立刻演奏兩次；演奏期間滑鼠處出現一圈 7 公尺、往中間收的音波，範圍內的敵人一直被聚到滑鼠的位置，演奏完在那裡爆開：200% 最大魔力 ×（100＋√最大魔力 ÷ 2）% 的傷害。', go(P) {
      const notes = R.bardChord && R.bardChord.SV().notes; if (!R.bardEncore || !notes || !notes.length || !R.bardEncore(P, 2)) { R.toast && R.toast('樂譜是空的：先按住 X 寫一段樂譜'); return false; }
      const dur = Math.max(1.5, notes.length * 2 * 0.1 + 0.3); T.bard = { end: CT() + dur, fx: waves() };
      sched(dur, () => { if (T.bard && T.bard.fx) T.bard.fx.rm(); T.bard = null; const [x, z] = mouse(P), v = 2 * P.mpMax * (100 + Math.sqrt(P.mpMax) / 2) / 100;   /* 2026-10-16 作者：200% 最大魔力 ×（100＋√最大魔力 ÷ 2）% */ R.fx && R.fx('boom', x, 0.5, z, { r: 7, color: '#E8A0FF' }); R.fx && R.fx('ring', x, 0.1, z, { r: 7, color: '#FFE08A' }); R.shake && R.shake(0.5);
        within(x, z, 7).forEach(e => R.hurtEnemy(e, v, { primary: false })); }); } },
    summoner: { n: '召喚山神', cd: 90, d: '花 20% 最大魔力，召喚一頭巨大的熊（大約領主一半大）：生命 5000、攻擊 500；牠在的時候你受到的所有傷害都由牠承受。每秒消耗（50＋6% 最大魔力）的魔力，魔力見底或牠倒下就消失。', go(P) {
      const need = P.mpMax * 0.2; if (P.mp < need) { R.toast && R.toast('魔力不夠（要 ' + Math.ceil(need) + '）'); return false; }
      if (T.bear) bearGone(); P.mp -= need; const w = W(); let id = 'minobear'; let m = null; try { m = R.makeBeast(id); } catch (e) { m = null; } if (!m) { id = 'okuriinu'; m = R.makeBeast(id); }
      const [x, z] = aimPt(P, 4), g = m.g; g.scale.setScalar(2.4); g.position.set(x, 0, z); w.scene.add(g);
      T.bear = { x, z, m, g, id, hp: 5000, hpMax: 5000, cd: 0, t: 0, size: 2.6 }; R.fx && R.fx('poof', x, 1, z, { color: '#B8E07A', n: 30 }); R.shake && R.shake(0.4); } },
    arraymage: { n: '雷魔陣', cd: 80, d: '準心處放一個 8 公尺的巨大法陣，蓄力 3 秒：雲的陰影慢慢聚起來，範圍內的敵人移動 −90%；蓄完劈下巨大雷電：一般遺跡生物直接擊殺（無視護盾、無敵），首領受到 15% 最大生命的傷害並暈眩 2 秒。', go(P) {
      const [x, z] = aimPt(P, 14); R.fx && R.fx('mark', x, 0, z, { r: 8, t: 3 }); T.thunder = { x, z, r: 8, end: CT() + 3, pos: new Map(), shade: shade(x, z, 8) };
      sched(3, () => { const th = T.thunder; T.thunder = null; if (th && th.shade) th.shade.rm();
        for (let i = 0; i < 9; i++) { const a = rnd() * 6.28, d = rnd() * 7; R.fx && R.fx('pillar', x + Math.sin(a) * d, 0, z + Math.cos(a) * d, { r: 1.2, color: '#FFF4A0' }); }
        R.fx && R.fx('boom', x, 0.6, z, { r: 8, color: '#FFE070' }); R.shake && R.shake(0.7);
        within(x, z, 8).forEach(e => { if (isBoss(e)) { rawHit(e, e.hpMax * 0.15); if (!e.dead && e.st) e.st.stun = Math.max(e.st.stun || 0, 2); } else slay(e); }); }); } },
    enchanter: { n: '刻印爆裂', cd: 65, d: '把武器丟到滑鼠處 6 秒：5 公尺內的敵人一直暈眩，每 0.5 秒受到兩倍的燃燒、毒、雷傷害，防禦與減傷 −50%；5～10 公尺的敵人一直被風往外推、暈眩。這段時間你不能攻擊、不能放技能；結束後取回武器，但 6 秒內失去刻印（職業特效）的能力。', go(P) {
      const [x, z] = mouse(P); T.ench = { x, z, end: CT() + 6, tick: 0 }; R.fx && R.fx('blink', x, 1, z); R.fx && R.fx('ring', x, 0.1, z, { r: 5, color: '#FF9A6A' }); R.fx && R.fx('ring', x, 0.1, z, { r: 10, color: '#BFF0E0' });
      sched(6, () => { T.ench = null; T.enchOff = CT() + 6; say(P, '取回武器', 'heal'); R.toast && R.toast('刻印暫時失去力量（6 秒）', '#FF9A6A'); }); } },
    scroll: { n: '千符陣', cd: 65, d: '5 秒內每 0.2 秒朝 14 公尺內的敵人射一張攻擊符（穿過牆壁），符貼在敵人頭上：先貼還沒有符的，全都有了就貼最大生命最高、而且身上的符還殺不死牠的；等每一隻身上的符都夠殺死牠（或時間到、最後一張貼上）就一起引爆。每張符＝基礎傷害＋40% 最大生命（首領 2%），同一隻重複貼的只有 30%。', go(P) {
      T.tal = { end: CT() + 5, acc: 0, map: new Map(), live: 0, done: false }; R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 14, color: '#E8C86A' }); } }
  };
  R.LV30 = SK;
  const LV = 30, MP = 20;
  // 放進技能表（技能書 30 級學會、裝在技能格放）
  if (R.SKILL_TYPES && R.SKILL_LIB) {
    R.SKILL_TYPES.lv30 = (p, P) => { const sk = SK[p.k]; if (!sk || P.cls !== p.k) return false; const r = sk.go(P); if (r !== false) { say(P, sk.n); R.shake && R.shake(0.2); } return r; };
    Object.keys(SK).forEach(cls => { const sk = SK[cls], id = 'l30_' + cls; R.SKILL_LIB[id] = { id, name: sk.n, cls, lv: LV, cd: sk.cd, mp: MP, type: 'lv30', p: { k: cls }, desc: '【30 級】' + sk.d }; R.SKILLS[id] = { name: sk.n, cd: sk.cd, mp: MP, desc: '【30 級】' + sk.d }; });
  }

  // ---------- 小工具：雲的陰影（雷魔陣）、山神消失 ----------
  function shade(x, z, r) {
    const TH = window.THREE, w = W(); if (!TH || !w.scene) return null;
    const m = new TH.Mesh(new TH.CircleGeometry(r, 40), new TH.MeshBasicMaterial({ color: '#10121C', transparent: true, opacity: 0, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, (R.inTraining && R.inTraining()) ? 0.28 : 0.08, z); w.scene.add(m);
    return { m, set: k => { m.material.opacity = 0.55 * k; m.scale.setScalar(0.4 + 0.6 * k); }, rm: () => { if (m.parent) m.parent.remove(m); m.geometry.dispose(); m.material.dispose(); } };
  }
  // 大合奏：滑鼠處畫出拉人的範圍（7 公尺外框）和一圈一圈往中間縮的音波
  function waves() {
    const TH = window.THREE, w = W(); if (!TH || !w.scene) return null;
    const g = new TH.Group(), y = (R.inTraining && R.inTraining()) ? 0.05 : 0.08, mat = (c, op) => new TH.MeshBasicMaterial({ color: c, transparent: true, opacity: op, depthWrite: false, side: TH.DoubleSide });
    const edge = new TH.Mesh(new TH.RingGeometry(6.85, 7, 64), mat('#E8A0FF', 0.6)); edge.rotation.x = -Math.PI / 2; g.add(edge);
    const fill = new TH.Mesh(new TH.CircleGeometry(7, 48), mat('#B070E0', 0.08)); fill.rotation.x = -Math.PI / 2; g.add(fill);
    const rings = []; for (let i = 0; i < 4; i++) { const m = new TH.Mesh(new TH.RingGeometry(0.88, 1, 48), mat(i % 2 ? '#FFE08A' : '#E8A0FF', 0.7)); m.rotation.x = -Math.PI / 2; g.add(m); rings.push(m); }
    g.position.y = y; w.scene.add(g); let t = 0;
    return { set: (x, z, dt) => { t += dt; g.position.set(x, y, z); rings.forEach((m, i) => { const k = 1 - ((t * 0.9 + i / rings.length) % 1), r = 0.3 + 6.7 * k; m.scale.set(r, r, 1); m.material.opacity = 0.75 * Math.min(1, (1 - k) * 4) * Math.min(1, k * 3); }); if (Math.random() < dt * 12) R.fx && R.fx('spark', x + (Math.random() - 0.5) * 10, 0.5, z + (Math.random() - 0.5) * 10, { color: '#E8A0FF' }); },
      rm: () => { if (g.parent) g.parent.remove(g); g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); } };
  }
  function bearGone() { const b = T.bear; if (!b) return; T.bear = null; if (b.g && b.g.parent) b.g.parent.remove(b.g); R.fx && R.fx('poof', b.x, 1, b.z, { color: '#B8E07A', n: 24 }); }
  // 千符陣：挑目標、貼符、引爆
  const talDmg = (P, e, n) => (base(P) * 0.3 + e.hpMax * (isBoss(e) ? 0.02 : 0.4)) * (n ? 0.3 : 1);
  const talPick = (P, tal) => {
    const es = within(P.x, P.z, 14); if (!es.length) return null;
    const fresh = es.filter(e => !tal.map.has(e)); if (fresh.length) return fresh.sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))[0];
    return es.filter(e => (tal.map.get(e) || { dmg: 0 }).dmg < e.hp).sort((a, b) => b.hpMax - a.hpMax)[0] || null;
  };
  const talAllDead = (P, tal) => { const es = within(P.x, P.z, 14); return es.length > 0 && es.every(e => tal.map.has(e) && tal.map.get(e).dmg >= e.hp); };
  const talBoom = tal => { if (tal.done) return; tal.done = true; tal.map.forEach((s, e) => { if (e.dead) return; R.fx && R.fx('boom', e.x, 1.2, e.z, { r: 1.4, color: '#E8C86A' }); R.hurtEnemy(e, s.dmg, { primary: false }); }); tal.map.clear(); R.shake && R.shake(0.4); };

  // ---------- 每一格 ----------
  const st0 = R.step;
  R.step = dt => {
    const r = st0(dt); const w = W(), P = w.P; if (!w.run || !P) return r;
    if (w.paused) return r;
    const t = CT();
    try {
      for (let i = Q.length - 1; i >= 0; i--) { const q = Q[i]; if (q.run !== w.run) { Q.splice(i, 1); continue; } if (t >= q.at) { Q.splice(i, 1); if (!P.dead) q.f(); } }
      // 無盡彈匣
      if (T.gun) { if (t > T.gun.end) { if (P.ws === T.gun.ws) { P.ws.rate = T.gun.r0; P.ws.pierce = T.gun.p0; } T.gun = null; } else if (P.ws && P.ws.mag) { P.ammo = P.ws.mag; P.reloadT = 0; } }
      // 千矢：每 0.3 秒（吃攻速）朝準心降一次箭雨
      if (T.arrow) { if (t > T.arrow.end) T.arrow = null; else { const w0 = R.WEAPONS[P.item && P.item.base] || {}, rk = Math.max(0.5, (P.ws && P.ws.rate || 1) / (w0.rate || P.ws.rate || 1)); T.arrow.acc += dt * rk;
        while (T.arrow.acc >= 0.3) { T.arrow.acc -= 0.3; const [x, z] = aimPt(P, 16); R.fx && R.fx('rain', x, 0, z, { r: 4 }); within(x, z, 4).forEach(e => R.hurtEnemy(e, base(P) * 0.22, { primary: false })); } } }
      // 刀意解放：刀意一直滿
      if ((P._l30BdT || 0) > t) P._iai = Math.max(P._iai || 0, P.pv && P.pv.bdMunen ? 200 : 100);
      // 大合奏：把滑鼠處 7 公尺內的敵人聚過來
      if (T.bard) { const [x, z] = mouse(P); if (T.bard.fx) T.bard.fx.set(x, z, dt); within(x, z, 7).forEach(e => { const dx = x - e.x, dz = z - e.z, d = Math.hypot(dx, dz); if (d > 0.4) { const v = Math.min(d, 9 * dt); e.x += dx / d * v; e.z += dz / d * v; } }); }
      // 雷魔陣：雲聚起來、範圍內移動 −90%（每一格把牠走的距離拉回九成）
      if (T.thunder) { const th = T.thunder, k = 1 - Math.max(0, th.end - t) / 3; if (th.shade) th.shade.set(k);
        within(th.x, th.z, th.r).forEach(e => { const p = th.pos.get(e); if (p) { e.x = p[0] + (e.x - p[0]) * 0.1; e.z = p[1] + (e.z - p[1]) * 0.1; } th.pos.set(e, [e.x, e.z]); }); }
      // 刻印爆裂
      if (T.ench) { const en = T.ench; en.tick -= dt; const hit = en.tick <= 0; if (hit) en.tick = 0.5;
        foes().forEach(e => { const d = Math.hypot(e.x - en.x, e.z - en.z), rr = (e.def.size || 1) * 0.5; if (e.st) e.st.stun = Math.max(e.st.stun || 0, d < 10 + rr ? 0.3 : 0);
          if (d < 5 + rr) { e._l30Shred = t + 1; if (hit) { if (e.st) { e.st.burn = Math.max(e.st.burn || 0, 3); e.st.poison = Math.max(e.st.poison || 0, 3); } R.fx && R.fx('bolt', en.x, 1.4, en.z, { to: e, color: '#FFE070' }); R.hurtEnemy(e, base(P) * 0.35 * 2 * 3, { primary: false }); } }
          else if (d < 10 + rr && d > 0.01) { const v = 5 * dt; e.x += (e.x - en.x) / d * v; e.z += (e.z - en.z) / d * v; if (R.collide) R.collide(e, rr); } });
        if (hit) R.fx && R.fx('ring', en.x, 0.1, en.z, { r: 5, color: '#FF9A6A' }); }
      // 千符陣
      if (T.tal && !T.tal.done) { const tal = T.tal; if (t < tal.end) { tal.acc += dt; while (tal.acc >= 0.2) { tal.acc -= 0.2; const e = talPick(P, tal); if (!e) break; R.fx && R.fx('bolt', P.x, 1.3, P.z, { to: e, color: '#E8C86A' }); tal.live++;
            sched(0.12, () => { tal.live--; if (tal.done || e.dead) return; const s = tal.map.get(e) || { n: 0, dmg: 0 }; s.dmg += talDmg(P, e, s.n); s.n++; tal.map.set(e, s); R.num && R.num(e.x, 1.8 * (e.def.size || 1) + 1.2, e.z, '符×' + s.n, 'heal'); if (talAllDead(P, tal)) talBoom(tal); }); } }
        else if (tal.live <= 0) { talBoom(tal); T.tal = null; } }
      // 山神
      if (T.bear) { const b = T.bear; P.mp -= (50 + P.mpMax * 0.06) * dt; if (P.mp <= 0 || b.hp <= 0) { P.mp = Math.max(0, P.mp); say(P, b.hp <= 0 ? '山神倒下了' : '魔力見底，山神離開了', 'hurt'); bearGone(); }
        else { b.t += dt; b.cd -= dt; let tg = null, bd = 1e9; foes().forEach(e => { const d = Math.hypot(e.x - b.x, e.z - b.z); if (d < bd && Math.hypot(e.x - P.x, e.z - P.z) < 16) { bd = d; tg = e; } });
          const goal = tg || { x: P.x - Math.sin(P.aimA || 0) * 3, z: P.z - Math.cos(P.aimA || 0) * 3 }, dx = goal.x - b.x, dz = goal.z - b.z, d = Math.hypot(dx, dz), reach = tg ? 1.6 + (tg.def.size || 1) * 0.5 : 2.5; let moving = false;
          if (d > reach) { const sp = Math.min(5.5 * dt, d - reach); b.x += dx / d * sp; b.z += dz / d * sp; if (R.collide) R.collide(b, 1.2); moving = true; }
          if (tg && d <= reach + 0.4 && b.cd <= 0) { b.cd = 1.2; tg.petHit = 1; R.petHitter = b; R.hurtEnemy(tg, 500, { primary: false, kb: 2 }); R.petHitter = null; tg.petHit = 0; R.fx && R.fx('boom', tg.x, 0.5, tg.z, { r: 1.6, color: '#B8E07A' }); R.shake && R.shake(0.2); }
          b.g.position.set(b.x, 0, b.z); if (d > 0.1) b.g.rotation.y = Math.atan2(dx, dz); if (R.animBeast) try { R.animBeast(b.m, b.id, b.t, moving); } catch (e) { } } }
    } catch (e) { console.warn('[lv30]', e); }
    return r;
  };
  // 傷害：刻印爆裂裡的敵人防禦、減傷 −50%（受到的傷害 ×1.5）
  const he0 = R.hurtEnemy;
  R.hurtEnemy = (e, raw, o) => { if (e && raw > 0 && (e._l30Shred || 0) > CT()) raw *= 1.5; return he0(e, raw, o); };
  // 受傷：守護意志（−90%，記下來）、山神替你承受
  const hp0 = R.hurtPlayer;
  R.hurtPlayer = (raw, src, o) => {
    const P = W().P;
    if (P && raw > 0) {
      if (T.guard && CT() < T.guard.end) { T.guard.rec += raw; raw *= 0.1; }
      if (T.bear && T.bear.hp > 0) { T.bear.hp -= raw; if (rnd() < 0.3) R.num && R.num(T.bear.x, 4, T.bear.z, '山神 ' + Math.max(0, Math.round(T.bear.hp)), 'hurt'); return; }
    }
    return hp0(raw, src, o);
  };
  // 子彈：無盡彈匣的子彈穿牆、無限穿透
  const fi0 = R.fire;
  R.fire = o => { const s = fi0(o); if (T.gun && s && o && o.owner === 'p') { s.ghost = true; s.pierce = 999; } return s; };
  // 刻印爆裂：武器丟出去的時候不能攻擊、放技能；之後 6 秒刻印失效
  const block = () => { const P = W().P; if (T.ench && P && P.cls === 'enchanter') { if (!block.t || performance.now() - block.t > 900) { block.t = performance.now(); R.toast && R.toast('武器丟出去了：不能攻擊、放技能'); } return true; } return false; };
  ['attack', 'castSlot', 'useSkill'].forEach(fn => { const f0 = R[fn]; if (f0) R[fn] = (...a) => (block() ? undefined : f0(...a)); });
  const EC = R.CORE && R.CORE.enchanter;
  if (EC) ['mod', 'onHit', 'act'].forEach(k => { const f0 = EC[k]; if (typeof f0 !== 'function') return; EC[k] = function (...a) { if ((T.enchOff || 0) > CT()) { if (k === 'act') R.toast && R.toast('刻印暫時失去力量'); return k === 'mod' ? a[1] : undefined; } return f0.apply(this, a); }; });
  // 新的一趟：效果歸零
  const sr0 = R.startRun; if (sr0) R.startRun = (...a) => { if (T.bear) bearGone(); if (T.thunder && T.thunder.shade) T.thunder.shade.rm(); if (T.bard && T.bard.fx) T.bard.fx.rm(); Object.keys(T).forEach(k => { T[k] = null; }); Q = []; return sr0(...a); };
})(window.R);
