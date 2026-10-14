// 望月瀧的「刀勢」流派（2026-10-13 作者：瀧在別的遊戲裡的招式——抓破綻累積刀勢、納刀存起來、滿了進入貫勢爆發；她教的可以類似，但要轉成這個遊戲、不能跟現有技能像）
// - 跟刀客本身的刀意／收刀／居合／殘心／反切分開：刀勢只有學了瀧這一派的招式才有，存在 P.tkSei（未收）／P.tkBank（已存 0～5）。
// - 未收的刀勢（最多 5）三種來源各 +1：
//   看破：遺跡生物正在出招或剛出完招（破綻）時打中牠（王的霸體／無敵不算），一次破綻只算一次；
//   斷矢：用「流斷」斬掉飛過來的投射物；
//   連打：敵人被暈住／定住時連續打中 2 下，每次暈住只給一次。
// - 納勢（技能；瀧那邊叫納刀，跟刀客職業鍵的收刀分開，所以改名）：0.8 秒收刀，期間受到的傷害減半；收完把未收的刀勢存起來，存滿 5 層進入「貫勢」。
// - 被重擊（一下超過最大生命 12%）：未收的刀勢全沒、已存的少 1 層。
// - 已存的每層：受到的傷害 −4%（最多 −20%）、移動 +3%；3 層起傷害 +10%／層（最多 +30%）。
// - 貫勢 5 秒：傷害 +30%、受到的傷害 −20%、護盾（最大生命 15%）；第一下普攻打中時放出一道劍氣「霜斷」（每次貫勢一道，延長不補發）。結束後刀勢歸零，護盾每秒少 1% 最大生命。
// - 招式（照 takiteach.js 的方式教：戀人、刀客等級、隔 7 天）：霜返 15、流斷 25、納勢 35、霜斷 45。原本的靜水、三圈一結、瀧落照舊，學過的不會不見。
// - 瀧自己下遺跡也這樣打（看破反擊、存滿進貫勢、放劍氣）。
// 放在 takiteach.js 後面。
(function (R) {
  const W = () => R.W, S = () => R.S;
  const NEW = ['tk_kaeshi', 'tk_nagare', 'tk_noto', 'tk_soudan'];
  const knows = () => { const t = (S() && S().taught) || {}; return NEW.some(id => t[id]); };
  const on = P => P && P.cls === 'blade' && knows();
  const ang = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
  const later = (f, ms) => { const run = W().run; setTimeout(() => { const w = W(); if (w.run === run && run && !run.done && w.P && !w.P.dead) f(); }, ms); };
  const pw = P => (R.SKILL_KIT && R.SKILL_KIT.power ? R.SKILL_KIT.power(P.ws) : 10);
  const KAN = 5, CAP = 5;
  // ---------- 刀勢 ----------
  const gain = (P, n, why, e) => {
    if (!on(P)) return; const b = P.tkSei || 0; P.tkSei = Math.min(CAP, b + n); if (P.tkSei === b) return;
    R.num && R.num(e ? e.x : P.x, 2.4, e ? e.z : P.z, why + ' 刀勢+' + (P.tkSei - b), 'heal');
  };
  R.tkGain = gain;
  const bankFx = P => { const n = P.tkBank || 0; if (R.SKILL_TYPES && R.SKILL_TYPES.buff) R.SKILL_TYPES.buff({ _id: 'tk_bank', t: 9999, speed: 1 + 0.03 * n, color: '#BFE8FF' }, P); };
  const enterKan = (P, refresh) => {
    const fresh = !(P.tkKan > 0);
    P.tkKan = KAN; P.tkWave = fresh ? 1 : (P.tkWave || 0);
    if (fresh) { P.shield = Math.max(P.shield || 0, P.hpMax * 0.15); P.buff.shieldT = Math.max(P.buff.shieldT || 0, KAN); R.banner && R.banner('貫勢', '刀勢灌滿全身'); }
    R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 3, color: '#BFE8FF' }); R.sfx && R.sfx('magic');
  };
  R.tkEnterKan = enterKan;
  const wave = P => {
    R.fire({ kind: 'eorb', owner: 'p', x: P.x, z: P.z, a: P.aimA, speed: 22, dmg: pw(P) * 2, life: 0.5, pierce: 99, radius: 1.2, primary: false, tkWave: 1 });
    R.fx && R.fx('slash', P.x, 1, P.z, { a: P.aimA, len: 11 }); R.num && R.num(P.x, 2.6, P.z, '霜斷', 'heal');
  };
  // ---------- 遺跡生物的破綻：出招中、剛出完招 ----------
  const track = (w, dt) => (w.enemies || []).forEach(e => {
    if (e.dead) return;
    if (e.tkOpen > 0) e.tkOpen -= dt;
    const cd = e.cd || 0; if (e._tkCd != null && cd > e._tkCd + 0.25) e.tkOpen = 0.8; e._tkCd = cd;
    if (e.lunge > 0 || e.roll || e.wind > 0 || e.charge > 0) e.tkOpen = Math.max(e.tkOpen || 0, 0.15);
    const held = (e.st && ((e.st.stun || 0) > 0 || (e.st.root || 0) > 0));
    if (!held) { e.tkCombo = 0; e.tkComboGiven = 0; }
  });
  R.tkOpen = e => e && !e.dead && e.tkOpen > 0 && !e.invuln && !e.superArmor;
  const fr0 = R.fire;
  R.fire = o => { if (o && o.owner === 'e' && o.src) o.src.tkOpen = 0.8; return fr0(o); };
  const he0 = R.hurtEnemy;
  R.hurtEnemy = (e, raw, o) => {
    const P = W().P; o = o || {};
    if (!e || e.dead || o.reflect || o.thorns || o.dot || !on(P)) return he0(e, raw, o);
    const held = e.st && ((e.st.stun || 0) > 0 || (e.st.root || 0) > 0);
    if (R.tkOpen(e)) { e.tkOpen = 0; gain(P, 1, '看破', e); R.fx && R.fx('spark', e.x, 1.2, e.z, { crit: true }); }
    else if (held && !e.tkComboGiven) { e.tkCombo = (e.tkCombo || 0) + 1; if (e.tkCombo >= 2) { e.tkComboGiven = 1; gain(P, 1, '連打', e); } }
    const n = P.tkBank || 0; let k = n >= 3 ? 1 + 0.1 * (n - 2) : 1;
    if (P.tkKan > 0) k *= 1.3;
    const r = he0(e, raw * k, o);
    if (P.tkKan > 0 && o.primary && P.tkWave) { P.tkWave = 0; wave(P); }
    return r;
  };
  const hp0 = R.hurtPlayer;
  R.hurtPlayer = (raw, src, o) => {
    const P = W().P; if (src && src.def) src.tkOpen = 0.8;
    if (!P || !on(P)) return hp0(raw, src, o);
    let k = 1 - Math.min(0.2, 0.04 * (P.tkBank || 0));
    if (P.tkKan > 0) k *= 0.8; if (P.tkNoto > 0) k *= 0.5; if (P.tkArmor > 0) k *= 0.5;
    const h = P.hp, sh = P.shield || 0, r = hp0(raw * k, src, o), lost = (h - P.hp) + (sh - (P.shield || 0));
    if (lost > P.hpMax * 0.12 && ((P.tkSei || 0) > 0 || (P.tkBank || 0) > 0) && !(P.tkKan > 0)) {
      P.tkSei = 0; P.tkBank = Math.max(0, (P.tkBank || 0) - 1); bankFx(P); R.num && R.num(P.x, 2.6, P.z, '刀勢散了', '');
    }
    return r;
  };
  // ---------- 每一幀 ----------
  const st0 = R.step;
  R.step = dt => {
    st0(dt); const w = W(), P = w.P; if (!w.run || w.paused) { hud(null); return; }
    track(w, dt);
    if (P && on(P)) {
      if (P.tkArmor > 0) P.tkArmor -= dt;
      if (P.tkNoto > 0) { P.tkNoto -= dt; if (P.tkNoto <= 0) noto(P); }
      if (P.tkKan > 0) { P.tkKan -= dt; if (P.tkKan <= 0) { P.tkKan = 0; P.tkSei = 0; P.tkBank = 0; P.tkDecay = 1; bankFx(P); R.num && R.num(P.x, 2.6, P.z, '貫勢結束', ''); } }
      else if (P.tkDecay && P.shield > 0) { P.shield = Math.max(0, P.shield - P.hpMax * 0.01 * dt); if (!P.shield) P.tkDecay = 0; }
      if (P.tkCut > 0) cutShots(P, w, dt);
      hud(P);
    } else hud(null);
  };
  // ---------- 招式 ----------
  const cdRefund = (P, id, frac) => {
    if (P.skill === id) P.skillCd = (P.skillCd || 0) * (1 - frac);
    for (let i = 1; i < 4; i++) if (R.slotSkill && R.slotSkill(P, i) === id && P.skCd) P.skCd[i] *= 1 - frac;
  };
  const inLine = (P, e, a, len, wid) => { const dx = e.x - P.x, dz = e.z - P.z, al = dx * Math.sin(a) + dz * Math.cos(a), sd = Math.abs(dx * Math.cos(a) - dz * Math.sin(a)), r = e.def.size * 0.5; return al > -0.3 && al < len + r && sd < wid + r; };
  const noto = P => {
    const n = P.tkSei || 0; P.tkSei = 0;
    R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 1.6, color: '#FFFFFF' }); R.sfx && R.sfx('swing');
    if (!n) { R.num && R.num(P.x, 2.6, P.z, '納勢', ''); return; }
    P.tkBank = Math.min(5, (P.tkBank || 0) + n); bankFx(P); R.num && R.num(P.x, 2.6, P.z, '納勢・刀勢 ' + P.tkBank + '／5', 'heal');
    if (P.tkBank >= 5) enterKan(P);
  };
  const cutShots = (P, w, dt) => {
    P.tkCut -= dt;
    (w.shots || []).forEach(s => {
      if (s.owner !== 'e' || s.dead || s.tkCutDone) return; const d = Math.hypot(s.x - P.x, s.z - P.z); if (d > 2.6) return;
      if (Math.abs(ang(Math.atan2(s.x - P.x, s.z - P.z), P.aimA)) > 1.25) return;
      s.tkCutDone = 1; R.killShot ? R.killShot(s) : (s.life = 0); R.fx && R.fx('spark', s.x, 1.1, s.z, { crit: true });
      P.tkCutN = (P.tkCutN || 0) + 1; if (P.tkCutN <= 2) gain(P, 1, '斷矢');
    });
    if (P.tkCut <= 0 && P.tkCutN) { R.melee && R.melee(P.aimA, 3, 1.8, pw(P) * 1.2, 0, 0, 0, { primary: false }); R.fx && R.fx('slash', P.x, 1, P.z, { a: P.aimA, len: 3 }); }
  };
  const T = R.SKILL_TYPES || {};
  T.tkKaeshi = (s, P, w, p) => {
    const a = P.aimA; R.swingAnim && R.swingAnim(P.h, 0.02, 0.15); R.fx && R.fx('slash', P.x, 1, P.z, { a, len: s.len });
    let ctr = 0;
    (w.enemies || []).forEach(e => {
      if (e.dead || e.under || !inLine(P, e, a, s.len, s.width)) return;
      const open = R.tkOpen(e); if (open) ctr++;
      R.hurtEnemy(e, p * s.k * (open ? s.ctr : 1), { primary: false, stun: open ? s.stun : 0.15 });
    });
    if (ctr) { cdRefund(P, s._id, s.refund); R.num && R.num(P.x, 2.6, P.z, '霜返！', 'heal'); R.shake && R.shake(0.15); }
    R.sfx && R.sfx('swing');
  };
  T.tkNagare = (s, P) => { P.tkCut = s.t; P.tkCutN = 0; P.stance = Math.max(P.stance || 0, 0.25); R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 2.6, color: '#BFE8FF' }); };
  T.tkNoto = (s, P) => { P.tkNoto = s.t; P.stance = Math.max(P.stance || 0, s.t); R.swingAnim && R.swingAnim(P.h, s.t, s.t + 0.02); R.num && R.num(P.x, 2.6, P.z, '納勢…', ''); };
  T.tkSoudan = (s, P, w, p) => {
    const strong = P.tkKan > 0; P.tkArmor = 0.55; P.stance = Math.max(P.stance || 0, 0.5);
    R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 1.8, color: strong ? '#FFFFFF' : '#BFE8FF' }); R.num && R.num(P.x, 2.6, P.z, strong ? '霜斷・極' : '霜斷', 'heal');
    later(() => {
      const tg = R.nearestEnemy(P.x, P.z, strong ? 9 : 10, P.aimA) || R.nearestEnemy(P.x, P.z, strong ? 6 : 8);
      if (!tg) { cdRefund(P, s._id, strong ? 1 / 3 : 2 / 3); R.toast && R.toast(strong ? '揮空了（只退回三分之一冷卻）' : '附近沒有敵人'); return; }
      const a = Math.atan2(tg.x - P.x, tg.z - P.z), d = Math.max(0, Math.hypot(tg.x - P.x, tg.z - P.z) - 1.4);
      R.fx && R.fx('blink', P.x, 1, P.z);
      const [x, z] = R.nearestFloor ? R.nearestFloor(P.x + Math.sin(a) * d, P.z + Math.cos(a) * d) : [tg.x, tg.z]; P.x = x; P.z = z; R.collide && R.collide(P, 0.42); P.aimA = a;
      R.fx && R.fx('blink', P.x, 1, P.z); P.iframe = Math.max(P.iframe || 0, 0.3);
      if (!strong) {
        [0, 160].forEach((t, i) => later(() => { R.swingAnim && R.swingAnim(P.h, 0.02, 0.12); R.fx && R.fx('slash', P.x, 1, P.z, { a: P.aimA + (i ? 0.6 : -0.6), len: 3 }); if (!tg.dead) R.hurtEnemy(tg, p * s.k, { primary: false }); R.sfx && R.sfx('swing'); }, t));
        later(() => enterKan(P), 340);
        return;
      }
      // 強化：附近的遺跡生物幾乎停住，六連斬、收刀、拔刀斬收尾
      const near = (w.enemies || []).filter(e => !e.dead && Math.hypot(e.x - P.x, e.z - P.z) < 10);
      near.forEach(e => { if (e.def.boss) e.st.slow = Math.max(e.st.slow || 0, 2); else e.st.stun = Math.max(e.st.stun || 0, 1.9); });
      P.iframe = Math.max(P.iframe || 0, 1.9); R.banner && R.banner('霜斷・極', '');
      for (let i = 0; i < 6; i++) later(() => { R.fx && R.fx('slash', tg.x, 1, tg.z, { a: P.aimA + (i % 2 ? 1 : -1) * (0.4 + i * 0.15), len: 3 }); if (!tg.dead) R.hurtEnemy(tg, p * s.k6, { primary: false }); R.sfx && R.sfx('swing'); }, 120 + i * 130);
      later(() => { R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 1.4, color: '#FFFFFF' }); R.num && R.num(P.x, 2.6, P.z, '納', ''); }, 1050);
      later(() => {
        R.fx && R.fx('slash', P.x, 1, P.z, { a: P.aimA, len: 7 }); R.shake && R.shake(0.35);
        (w.enemies || []).forEach(e => { if (!e.dead && inLine(P, e, P.aimA, 7, 1)) R.hurtEnemy(e, p * s.kEnd, { primary: false, crit: true }); });
        enterKan(P);
      }, 1450);
    }, 500);
  };
  // ---------- 教學（照 takiteach.js：戀人、刀客等級、隔 7 天） ----------
  const LESSONS = [
    { id: 'tk_kaeshi', name: '霜返', cd: 5, mp: 8, type: 'tkKaeshi', p: { len: 3.6, width: 0.5, k: 1.4, ctr: 2.2, stun: 0.9, refund: 0.6 }, need: 15,
      desc: '短促的一刀直斬（3.6 公尺）。砍中正在出招、剛出完招的遺跡生物（破綻）算「看破」：傷害 ×2.2、暈 0.9 秒、冷卻退回六成，並得到刀勢。望月瀧教的。',
      lines: ['「牠出手的時候，身體是空的。你等的就是那一下。」', '瀧要你別先動，看清楚對方肩膀抬起來才出刀。', '「慢一點沒關係，砍在牠出手的地方。」'] },
    { id: 'tk_nagare', name: '流斷', cd: 8, mp: 10, type: 'tkNagare', p: { t: 0.6 }, need: 25,
      desc: '0.6 秒內把正面飛來的箭、魔彈、毒液斬掉（每斬掉一發得到刀勢，最多 2 層）；有斬掉東西的話，最後順勢往前一刀。望月瀧教的。',
      lines: ['瀧撿了幾顆小石子，往你身上丟。', '「不要躲。看著它，刀放在它要來的地方。」', '「……打到了也不要皺眉，再一次。」'] },
    { id: 'tk_noto', name: '納勢', cd: 3, mp: 0, type: 'tkNoto', p: { t: 0.8 }, need: 35,
      desc: '用 0.8 秒把刀收回鞘裡（這段時間受到的傷害減半）：把還沒收起來的刀勢存起來，存滿 5 層進入「貫勢」。已存的刀勢每層受傷 −4%、移動 +3%，3 層起傷害 +10%／層。被重擊會散掉。跟刀客的「收刀」不同，不會進入收刀狀態。望月瀧教的。',
      lines: ['「砍完了不是結束。刀收回來，才是你的。」', '瀧把刀收回鞘的動作做得很慢，讓你看清楚每一寸。', '「收不好的話，剛剛那些都白費了。」'] },
    { id: 'tk_soudan', name: '霜斷', cd: 36, mp: 30, type: 'tkSoudan', p: { k: 2.4, k6: 1.3, kEnd: 5 }, need: 45,
      desc: '蓄勢 0.5 秒（受傷減半），瞬間踏到前方最近的敵人面前連斬兩刀，直接進入「貫勢」。在貫勢中放會變成「霜斷・極」：附近的遺跡生物幾乎停住，六連斬後收刀，再一記拔刀斬收尾（必定暴擊）；揮空只退回三分之一冷卻。望月瀧教的。',
      lines: ['「這是我自己的刀。」', '瀧沒有拔刀，只是站著。下一瞬間，她已經在院子另一頭了。', '「你現在還看不到也沒關係。先記住要站穩。」'] }
  ];
  const L = R.TAKI_LESSONS;
  LESSONS.forEach(x => {
    if (R.SKILL_LIB) R.SKILL_LIB[x.id] = { id: x.id, name: x.name, cls: 'blade', lv: 1, cd: x.cd, mp: x.mp, type: x.type, p: x.p, desc: x.desc, taught: 'taki' };
    if (R.SKILLS) R.SKILLS[x.id] = { name: x.name, cd: x.cd, mp: x.mp, desc: x.desc };
    if (L && !L.find(y => y.id === x.id)) L.push(x);
  });
  if (L) L.sort((a, b) => a.need - b.need);   // 照等級排：靜水 10、霜返 15、三圈一結 20、流斷 25、瀧落 30、納勢 35、霜斷 45
  R.TAKI_SEI = LESSONS;
  // 圖示
  // 2026-10-13：skill-art-map.js 比這個檔案晚載入、會把 R.SKILL_ART_MAP 整個換掉——等全部載完再登記，不然刀勢四招沒有圖示
  const regArt = () => { const map = R.SKILL_ART_MAP;
  if (map) { map.sheets['taki-sei'] = { file: 'taki-sei-v1.png', cols: 4, rows: 1, count: 4 }; NEW.forEach((id, i) => { if (!map.icons[id]) map.icons[id] = { sheet: 'taki-sei', tile: i, name: LESSONS[i].name, family: id }; }); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', regArt); else regArt();
  // ---------- 畫面左邊的刀勢 ----------
  let el = null, last = '';
  const hud = P => {
    if (!P) { if (el && last) { el.style.display = 'none'; last = ''; } return; }
    if (!el) { el = document.createElement('div'); el.id = 'tk-sei'; el.style.cssText = 'position:fixed;left:12px;top:58%;z-index:30;pointer-events:none;font:600 13px/1.4 system-ui,sans-serif;color:#DDEEFF;background:rgba(14,18,28,.78);border:1px solid #7FA8C8;border-radius:6px;padding:4px 8px;text-shadow:0 1px 2px #000'; document.body.appendChild(el); }
    const b = P.tkBank || 0, u = P.tkSei || 0;
    const s = '刀勢 ' + '◆'.repeat(b) + '◇'.repeat(5 - b) + (u ? '　未收 +' + u : '') + (P.tkKan > 0 ? '　<b style="color:#FFFFFF">貫勢 ' + P.tkKan.toFixed(1) + '</b>' : '') + (P.tkNoto > 0 ? '　納勢中' : '');
    if (s !== last) { el.innerHTML = s; el.style.display = ''; el.style.borderColor = P.tkKan > 0 ? '#FFFFFF' : '#7FA8C8'; last = s; }
  };
  // ---------- 瀧自己也這樣打 ----------
  const ah0 = R.allyHit;
  R.allyHit = (e, dmg, by) => ah0(e, by && by.tkKan > 0 ? dmg * 1.3 : dmg, by);
  const ua0 = R.updateAllies;
  R.updateAllies = dt => {
    ua0(dt); const w = W(); if (!w.run || w.paused) return;
    (w.allies || []).forEach(a => {
      if (!a.m || a.m.story !== 'taki' || a.downed || a.dead) return;
      a.tkC = (a.tkC || 0) - dt;
      if (a.tkKan > 0) { a.tkKan -= dt; a.tkRing = (a.tkRing || 0) - dt; if (a.tkRing <= 0) { a.tkRing = 0.6; R.fx('ring', a.x, 0.1, a.z, { r: 1.3, color: '#FFFFFF' }); } if (a.tkKan <= 0) a.tkSei = 0; }
      if (a.tkC > 0) return;
      const tg = (w.enemies || []).find(e => R.tkOpen(e) && Math.hypot(e.x - a.x, e.z - a.z) < 3.6 + e.def.size * 0.4);
      if (tg) {
        a.tkC = 1.4; tg.tkOpen = 0; a.h.swing = 0.2; const an = Math.atan2(tg.x - a.x, tg.z - a.z);
        R.fx('slash', a.x, 1, a.z, { a: an, len: 3.6 }); tg.st.stun = Math.max(tg.st.stun || 0, 0.9); R.allyHit(tg, a.st.dmg * 2.2, a); R.num(a.x, 2.6, a.z, '看破', 'heal');
        if (!(a.tkKan > 0)) { a.tkSei = (a.tkSei || 0) + 1; if (a.tkSei >= 4) { a.tkKan = 5; R.num(a.x, 3, a.z, '貫勢', 'heal'); R.fx('ring', a.x, 0.1, a.z, { r: 3, color: '#BFE8FF' });
          later(() => { R.fx('slash', a.x, 1, a.z, { a: an, len: 11 }); (w.enemies || []).forEach(e => { if (e.dead) return; const dx = e.x - a.x, dz = e.z - a.z, al = dx * Math.sin(an) + dz * Math.cos(an), sd = Math.abs(dx * Math.cos(an) - dz * Math.sin(an)); if (al > -0.3 && al < 11 && sd < 1.3 + e.def.size * 0.5) R.allyHit(e, a.st.dmg * 3, a); }); R.num(a.x, 2.6, a.z, '霜斷', 'heal'); }, 250); } }
      } else a.tkC = 0.2;
    });
  };
})(window.R);
