// 奏域（2026-10-08 作者：諧鳴 22 招同質性太高，全部刪掉，只留一招 9 星的「奏域」）
// - 術士二轉「諧鳴」只剩一個選項（原本瑟蘭派＋鎮頻、共振、轉調、定頻四派）：40 級學會「奏域」，常駐效果照舊（promote2.js、adv2plus.js）。
//   舊存檔選了四派之一的 → 改回「諧鳴」；技能欄上被刪掉的招 → 空出來（用預設）。
// - 奏域可以練到 ★9（skillpoints.js 的 R.SKILL_MAXR；一般的冷卻、傷害星數加成照舊最多算 ★5）。
//   ★0、★3、★6、★9 各四選一（技能書裡奏域下面點）：
//     ★0〔共鳴・鎮頻・定頻・轉調〕 ★3〔共振・壓制・鎖定・變化〕 ★6〔協振・鎮壓・擴散・極化〕 ★9〔劇烈・高壓・廣域・魔化〕
//   另外選一種形態（可以不選）：輕便（跟著你移動、效果 −10%）、沉穩（效果 +20%）、拓展（半徑 +30%）。
// - 奏域本身：準心處（最遠 10 公尺；輕便＝腳下）展開半徑 5、8 秒的奏域；同時只能有一個，再放一次會換掉舊的。
//   奏域打出去的傷害算奏域這一招（吸血照技能算）。
// 2026-10-13 作者：奏域拆成兩招——術士「諧鳴奏域」（改寫頻率：鎮頻、共振、轉調、定頻，也改寫敵人的投射物，配咒文編排 spellcraft.js）
//   和吟遊詩人「奏域師・演奏場」（跟著和弦、鼓點脈動的增益場）。各自存在 s.souyuM／s.souyuB；舊的 s.souyu 照對照表搬過去，不會掉選項。
// 放在 skillpoints.js、skillvar.js、adv2more.js、adv2plus.js、promote2.js 後面。
(function (R) {
  const W = () => R.W, S = () => R.S, esc = s => R.esc(s), CT = () => performance.now() / 1000, rnd = Math.random;
  const L = R.SKILL_LIB, T = R.SKILL_TYPES; if (!L || !T) return;
  const ID = 'hm_field', COL = '#FFB8E0';
  // ---------- 選項 ----------
  const TIERS_B = [
    { star: 0, opts: [['gm', '震動', '每個音符、鼓點都讓場地震一下：裡面的敵人受傷'], ['zp', '減速', '裡面的敵人變慢 50%；敵人的投射物飛進來就消失'], ['dp', '音波', '每 0.35 秒朝裡面的一隻敵人射出必中的音波'], ['zd', '元素', '每個音符輪流讓裡面的敵人燃燒、變慢、被雷電到']] },
    { star: 3, opts: [['gz', '鼓舞', '你和隊友站在裡面時傷害 +20%'], ['yz', '削弱', '裡面的敵人造成的傷害 −25%'], ['sd', '吸引', '裡面的敵人受到你的傷害 +15%，而且慢慢被往中間拉'], ['bh', '亂流', '每個鼓點隨機讓裡面的敵人燃燒、中毒、破甲或變慢']] },
    { star: 6, opts: [['xz', '回魔', '站在裡面放技能退回 30% 魔力'], ['zy', '暈眩', '每 2 秒讓裡面的敵人暈 0.6 秒'], ['ks', '擴散', '每個鼓點朝場外 6 公尺內的兩隻敵人射出音波'], ['jh', '加劇', '裡面的敵人燃燒、中毒的傷害 ×2；第一次被變慢會先定住 0.5 秒']] },
    { star: 9, opts: [['jl', '爆發', '場地打出的傷害 ×2，結束時整個炸開'], ['gy', '重壓', '裡面的敵人一直被往中間壓、攻擊慢 40%'], ['gw', '廣域', '半徑 +60%、持續時間 +50%'], ['mh', '附魔', '你打裡面的敵人傷害 +40%，每一下普攻都隨機帶一種元素']] }
  ];
  const P4 = [['zp', '省魔', '在裡面放法術魔力 −20%；敵人和敵人的投射物變慢 50%'], ['gk', '增幅', '在裡面放法術傷害 +30%；敵人的投射物飛進來傷害 −50%'], ['zd', '變調', '法術打到已經有同元素的敵人會自動換元素引爆；每 0.6 秒把一發敵人的投射物轉向變成你的'], ['dp', '必中', '在裡面放的法術會自己追敵人；裡面的敵人受到法術傷害 +15%']];
  const TIERS_M = [
    { star: 0, opts: P4 },
    { star: 3, opts: P4, extra: 1 },
    { star: 6, opts: [['tx', '快速', '站在裡面施法更快'], ['cj', '持久', '持續時間 +50%'], ['kz', '擴大', '半徑 +40%'], ['mw', '震波', '每 0.5 秒震一下：裡面的敵人受傷']] },
    { star: 9, opts: P4, extra: 1 }
  ];
  const TIERS = TIERS_B;
  const FORMS = [['qb', '輕便', '奏域跟著你移動，效果 −10%'], ['cw', '沉穩', '效果 +20%'], ['tz', '拓展', '半徑 +30%']];
  R.SOUYU = { TIERS: TIERS_B, TIERS_M, TIERS_B, FORMS };
  R.SKILL_MAXR = Object.assign(R.SKILL_MAXR || {}, { [ID]: 9 });
  // 2026-10-12 作者：吟遊詩人奏域師的二轉（覺醒）跟術士諧鳴一樣——原本的「大奏域」（a2_bard_serane_0）換成同一招 9 星的奏域（BID）
  const BID = 'a2_bard_serane_0';
  R.SKILL_MAXR[BID] = 9;
  const curId = () => (S() && S().cls === 'bard' ? BID : ID);
  const star = () => (R.skillRank ? R.skillRank(curId(), S() && S().cls === 'bard' ? 'bard' : 'mage') : 0);
  const isB = () => !!(S() && S().cls === 'bard');
  const MAPM = { 0: { gm: 'gk', zp: 'zp', dp: 'dp', zd: 'zd' }, 3: { gz: 'gk', yz: 'zp', sd: 'dp', bh: 'zd' }, 6: { xz: 'tx', zy: 'mw', ks: 'kz', jh: 'cj' }, 9: { jl: 'gk', gy: 'zp', gw: 'dp', mh: 'zd' } };
  const mig = s => {
    if (!s) return;
    if (s.souyu && !s._souyuSplit) {
      const o = s.souyu; s.souyuB = s.souyuB || Object.assign({}, o);
      if (!s.souyuM) { const m = {}; [0, 3, 6, 9].forEach(t => { if (o[t] && MAPM[t][o[t]]) m[t] = MAPM[t][o[t]]; }); m.form = o.form || ''; s.souyuM = m; }
      s._souyuSplit = 1;
    }
    s.souyuM = s.souyuM || {}; s.souyuB = s.souyuB || {};
  };
  const conf = () => { const s = S(); if (!s) return {}; mig(s); return isB() ? s.souyuB : s.souyuM; };
  const tiers = () => (isB() ? TIERS_B : TIERS_M);
  const pick = () => {
    const c = conf(), st = star(), out = new Set(), at = {};
    tiers().forEach(t => { if (st < t.star) return; const ok = t.opts.filter(o => !(t.extra && out.has(o[0]))); const v = ok.some(o => o[0] === c[t.star]) ? c[t.star] : ok[0] && ok[0][0]; if (v) { out.add(v); at[t.star] = v; } });
    return { has: k => out.has(k), at, form: FORMS.some(f => f[0] === c.form) ? c.form : '', keys: [...out] };
  };
  R.souyuPick = pick;

  // ---------- 刪掉諧鳴的其他招、四派 ----------
  const HF = ['hm_zhen', 'hm_gong', 'hm_zhuan', 'hm_ding'];
  const gone = Object.keys(L).filter(id => /^hm_/.test(id) && id !== ID && L[id].cls === 'mage');
  gone.forEach(id => { delete L[id]; if (R.SKILLS) delete R.SKILLS[id]; });
  L[ID] = Object.assign(L[ID] || { id: ID, cls: 'mage', adv2: 'harmonic' }, { name: '諧鳴奏域', lv: 40, cd: 18, mp: 28, type: 'souyu', p: { r: 5, life: 8 } });
  R.SKILLS[ID] = Object.assign(R.SKILLS[ID] || {}, { name: '諧鳴奏域', cd: 18, mp: 28, desc: '（二轉・諧鳴）準心處展開 8 秒的魔法場：站在裡面放法術會變強，飛進來的敵人投射物也會被改掉。★0、★3、★9 各選一種（省魔、增幅、變調、必中，可以疊），★6 選快速、持久、擴大或震波；在技能書這張卡片最下面選。' });
  if (L[BID]) {
    L[BID] = Object.assign(L[BID], { name: '演奏場', cd: 18, mp: 28, type: 'souyu', p: { r: 5, life: 8 } });
    R.SKILLS[BID] = Object.assign(R.SKILLS[BID] || {}, { name: '演奏場', cd: 18, mp: 28, desc: '（二轉・覺醒）準心處展開 8 秒的演奏場：你每彈一個音符、每一下鼓點，場就脈動一次；場裡的人吃到你現在和弦的加成（大調＝傷害、小調＝恢復、七和弦＝敵人受傷增加、九和弦＝攻速、十一和弦＝回魔）。可以練到 ★9，★0、★3、★6、★9 各選一種效果，在技能書這張卡片最下面選。' });
  }
  const op0 = R.ADV2_OPTS;
  if (op0) R.ADV2_OPTS = cls => op0(cls).filter(o => !HF.includes(o.id)).map(o => (o.id === 'harmonic' ? Object.assign({}, o, { name: '諧鳴', desc: '用共振圍出閉環的「奏域」，在裡面改寫法術的頻率。學會「諧鳴奏域」（40 級）：展開魔法場：在裡面放法術會變強（省魔、增幅、變調、必中），敵人的投射物也會被改掉。可以練到 ★9，再選輕便、沉穩或拓展。常駐：魔攻 +10%、魔力 +15%、技能冷卻 −5%。' }) : o));
  const sv0 = R.skillVariants;
  if (sv0) R.skillVariants = id => (id === ID || id === BID ? [] : sv0(id));   // 奏域用自己的選項，不用技能變化
  const fix = s => {
    try { mig(s); } catch (e) { }
    if (!s || !s.classes) return s;
    Object.values(s.classes).forEach(st => { if (st && HF.includes(st.adv2)) st.adv2 = 'harmonic'; });
    if (s.loadout) Object.keys(s.loadout).forEach(c => { const lo = s.loadout[c]; if (Array.isArray(lo)) s.loadout[c] = lo.map(id => (id && /^hm_/.test(id) && id !== ID && (!L[id]) ? null : id)); });
    return s;
  };
  const mg0 = R.migrate;
  R.migrate = s => fix(mg0 ? mg0(s) : s);
  if (S()) fix(S());

  // ---------- 奏域本身 ----------
  let F = null;
  const TH = () => window.THREE;
  const inF = (o, pad) => F && o && Math.hypot(o.x - F.x, o.z - F.z) < F.r + (pad || 0) + (o.def ? o.def.size * 0.5 : 0);
  const kill = () => { if (!F) return; try { F.objs.forEach(m => { if (m.parent) m.parent.remove(m); if (m.geometry) m.geometry.dispose(); if (m.material) m.material.dispose(); }); } catch (e) { } F = null; };
  const mesh = (x, z, r) => {
    const t = TH(), w = W(); if (!t || !w.scene) return [];
    const ring = new t.Mesh(new t.RingGeometry(Math.max(0.1, r - 0.18), r, 56), new t.MeshBasicMaterial({ color: COL, transparent: true, opacity: 0.85, side: t.DoubleSide, depthWrite: false }));
    const disc = new t.Mesh(new t.CircleGeometry(r, 48), new t.MeshBasicMaterial({ color: COL, transparent: true, opacity: 0.12, side: t.DoubleSide, depthWrite: false }));
    [ring, disc].forEach((m, i) => { m.rotation.x = -Math.PI / 2; m.position.set(x, 0.06 + i * 0.01, z); w.scene.add(m); });
    return [ring, disc];
  };
  const hit = (e, raw, o) => R.hurtEnemy(e, raw, Object.assign({ vSk: ID }, o || {}));
  const inside = () => (W().enemies || []).filter(e => !e.dead && !e.under && inF(e));
  const slowIn = e => { const was = e.st.slow > 0; e.st.slow = Math.max(e.st.slow || 0, 0.3); if (F.c.has('jh') && !was && !F.rooted.has(e)) { F.rooted.add(e); e.st.root = Math.max(e.st.root || 0, 0.5); } };
  const elemOn = (e, k) => { if (k === 'burn') e.st.burn = 3; else if (k === 'slow') { e.st.slow = Math.max(e.st.slow || 0, 2); slowIn(e); } else if (k === 'shock') R.chain && R.chain(e, F.pw * 0.2 * F.eff); else if (k === 'poison') R.elemPoison && R.elemPoison(e, W().P); else if (k === 'break') R.elemBreak && R.elemBreak(e); };
  const bolt = (e, from) => { R.fx && R.fx('bolt', from ? from.x : F.x, 1.1, from ? from.z : F.z, { to: e, color: COL }); };
  const step = dt => {
    const w = W(), P = w.P; if (!F || !P || P.dead || !w.run || w.run.done) { kill(); return false; }
    F.t -= dt; if (F.follow) { F.x = P.x; F.z = P.z; F.objs.forEach(m => { m.position.x = F.x; m.position.z = F.z; }); }
    const k = Math.max(0, F.t / F.life); if (F.objs[0]) F.objs[0].material.opacity = 0.55 + 0.3 * Math.abs(Math.sin(CT() * 4));
    const c = F.c, L2 = inside(), dmgK = F.eff * (c.has('jl') ? 2 : 1);
    // 每一格
    if (F.mage) {
      (w.shots || []).forEach(s => {
        if (s.owner === 'p' || s.dead || !inF(s)) return;
        if (c.has('zp') && !s._syZp) { s._syZp = 1; if (s.vx != null) { s.vx *= 0.5; s.vz *= 0.5; } }
        if (c.has('gk') && !s._syGk) { s._syGk = 1; if (typeof s.dmg === 'number') s.dmg *= 0.5; R.fx && R.fx('ring', s.x, s.y || 1, s.z, { r: 0.5, color: COL }); }
      });
      if (c.has('zp')) L2.forEach(slowIn);
      F.turn -= dt;
      if (c.has('zd') && F.turn <= 0) { const s = (w.shots || []).find(s => s.owner !== 'p' && !s.dead && !s._syZd && inF(s) && s.vx != null); if (s) { F.turn = 0.6; s._syZd = 1; s.owner = 'p'; s.vx = -s.vx; s.vz = -s.vz; if (s.a != null) s.a += Math.PI; s.dmg = Math.max(typeof s.dmg === 'number' ? s.dmg : 0, F.pw * 0.4); s.life = Math.max(s.life || 0, 1.5); R.fx && R.fx('ring', s.x, s.y || 1, s.z, { r: 0.6, color: '#9AD8FF' }); } }
    } else if (c.has('zp')) { L2.forEach(slowIn); (w.shots || []).forEach(s => { if (s.owner !== 'p' && !s.dead && inF(s)) { s.life = -1; } }); }
    if (!F.mage) { const ch = chord(); if (ch === 'nin') L2.forEach(e => { e.st.slow = Math.max(e.st.slow || 0, 0.3); }); }
    if (c.has('gy') || c.has('sd')) { const pull = c.has('gy') ? 1.2 : 0.4; L2.forEach(e => { if (e.def && e.def.boss) return; e.x += (F.x - e.x) * Math.min(1, dt * pull); e.z += (F.z - e.z) * Math.min(1, dt * pull); if (c.has('gy') && e.cd != null) e.cd += dt * 0.4; }); }
    F.shot -= dt; if (!F.mage && c.has('dp') && F.shot <= 0) { F.shot = 0.35; const e = L2[Math.floor(rnd() * L2.length)]; if (e) { bolt(e); hit(e, F.pw * 0.3 * dmgK); } }
    F.stun -= dt; if (c.has('zy') && F.stun <= 0) { F.stun = 2; L2.forEach(e => { e.st.stun = Math.max(e.st.stun || 0, 0.6); }); R.fx && R.fx('ring', F.x, 0.1, F.z, { r: F.r, color: '#9AD8FF' }); }
    // 每 0.5 秒
    F.pulse -= dt;
    if (F.mage && c.has('mw') && F.pulse <= 0) { F.pulse = 0.5; R.fx && R.fx('ring', F.x, 0.1, F.z, { r: F.r, color: COL }); L2.forEach(e => hit(e, F.pw * 0.25 * dmgK)); }
    if (!F.mage && F.beat) {
      F.beat = 0; F.n++;
      if (c.has('gm')) { R.fx && R.fx('ring', F.x, 0.1, F.z, { r: F.r, color: COL }); L2.forEach(e => hit(e, F.pw * 0.35 * dmgK)); }
      if (c.has('zd')) { const kk = ['burn', 'slow', 'shock'][F.n % 3]; L2.slice(0, 6).forEach(e => elemOn(e, kk)); }
      if (c.has('bh')) L2.forEach(e => elemOn(e, ['burn', 'poison', 'break', 'slow'][Math.floor(rnd() * 4)]));
      if (c.has('ks')) (w.enemies || []).filter(e => !e.dead && !e.under && !inF(e) && inF(e, 6)).sort(() => rnd() - 0.5).slice(0, 2).forEach(e => { bolt(e); hit(e, F.pw * 0.3 * dmgK); });
    }
    if (F.t <= 0) {
      if (c.has('jl')) { R.fx && R.fx('boom', F.x, 0.4, F.z, { r: F.r, color: COL }); (w.enemies || []).filter(e => !e.dead && inF(e)).forEach(e => hit(e, F.pw * 3 * F.eff)); }
      kill(); return false;
    }
    return true;
  };
  // 演奏場：每個音符、鼓點脈動一次（最快 0.12 秒一次），場裡的人吃到現在和弦的加成
  const chord = () => { try { const P = W().P; return R.bardChord ? R.bardChord.chordOf(P).id : ''; } catch (e) { return ''; } };
  const beat = () => {
    if (!F || F.mage) return; const t = CT(); if (t - (F.lastBeat || 0) < 0.12) return; F.lastBeat = t; F.beat = 1;
    const w = W(), P = w.P, L2 = inside(), ch = chord(), k = F.eff * (P && P.adv === 'drummer' ? 1.5 : 1) * (F.c.has('jl') ? 2 : 1);
    if (F.objs[0]) F.objs[0].material.opacity = 1;
    L2.forEach(e => hit(e, F.pw * 0.12 * k));
    if (P && inF(P)) { if (ch === 'min') P.hp = Math.min(P.hpMax || P.hp, P.hp + (P.hpMax || 0) * 0.01 * F.eff); if (ch === 'ele') P.mp = Math.min(P.mpMax, P.mp + 1); }
  };
  const fiB = R.fire;
  if (fiB) R.fire = o => { const s = fiB(o); try { if (F && !F.mage && o && o._bd) beat(); } catch (e) { } return s; };
  R.souyuMage = () => (F && F.mage ? { has: k => F.c.has(k), inside: (x, z) => Math.hypot(x - F.x, z - F.z) < F.r, x: F.x, z: F.z, r: F.r } : null);
  R.souyuField = () => F;
  T.souyu = (s, P, w, pw) => {
    const c = pick(), eff = c.form === 'qb' ? 0.9 : c.form === 'cw' ? 1.2 : 1;
    const mage = !isB();
    const r = (s.r || 5) * (c.form === 'tz' ? 1.3 : 1) * (!mage && c.has('gw') ? 1.6 : 1) * (mage && c.has('kz') ? 1.4 : 1), life = (s.life || 8) * (!mage && c.has('gw') ? 1.5 : 1) * (mage && c.has('cj') ? 1.5 : 1);
    let x = P.x, z = P.z;
    if (c.form !== 'qb' && R.SKILL_KIT && R.SKILL_KIT.aimIn) [x, z] = R.SKILL_KIT.aimIn(P, 10);
    kill();
    F = { x, z, r, life, t: life, pw: pw || 20, eff, c, follow: c.form === 'qb', mage, turn: 0, beat: 0, pulse: 0, shot: 0, stun: 0.5, n: 0, rooted: new Set(), objs: mesh(x, z, r) };
    w.dyn.push(step);
    R.fx && R.fx('ring', x, 0.1, z, { r, color: COL });
  };
  const lf0 = R.loadFloor;
  R.loadFloor = (...a) => { kill(); return lf0(...a); };
  // 共振、鎖定、魔化、極化（傷害）
  const he0 = R.hurtEnemy;
  R.hurtEnemy = (e, raw, o) => {
    if (F && e && !e.dead && !(o && (o.reflect || o.thorns))) {
      const c = F.c, P = W().P, din = inF(e);
      if (F.mage) { if (din && c.has('dp') && o && o.spell) raw *= 1 + 0.15 * F.eff; return he0(e, raw, o); }
      const ch = chord(); if (ch === 'maj' && P && inF(P)) raw *= 1 + 0.1 * F.eff; if (ch === 'sev' && din) raw *= 1 + 0.1 * F.eff;
      if (c.has('gz') && P && inF(P)) raw *= 1 + 0.2 * F.eff;
      if (din && c.has('sd')) raw *= 1 + 0.15 * F.eff;
      if (din && c.has('mh') && !(o && o.dot)) { raw *= 1 + 0.4 * F.eff; if (o && o.primary) { const r = he0(e, raw, o); if (!e.dead) elemOn(e, ['burn', 'slow', 'shock', 'poison', 'break'][Math.floor(rnd() * 5)]); return r; } }
      if (din && c.has('jh') && o && o.dot) raw *= 2;
    }
    return he0(e, raw, o);
  };
  // 壓制：裡面的敵人打你 −25%
  const hp0 = R.hurtPlayer;
  R.hurtPlayer = (raw, src, o) => { if (F && !F.mage && F.c.has('yz') && src && src.def && inF(src)) raw *= 1 - 0.25 * F.eff; return hp0(raw, src, o); };
  // 協振：站在裡面放技能退回 30% 魔力
  const refund = f => (...a) => { const P = W().P, m0 = P ? P.mp : 0, r = f(...a); if (F && !F.mage && P && F.c.has('xz') && inF(P) && P.mp < m0) P.mp = Math.min(P.mpMax, P.mp + (m0 - P.mp) * 0.3 * F.eff); return r; };
  if (R.castSlot) R.castSlot = refund(R.castSlot);

  // ---------- 技能書：奏域下面的選項 ----------
  const css = document.createElement('style');
  css.textContent = '.sy-box{margin:2px 0 0;padding:8px;border:1px solid var(--line);border-radius:10px;background:rgba(255,184,224,.06)}'
    + '.sy-box h4{margin:0 0 6px;font-size:13px}.sy-row{display:flex;flex-wrap:wrap;align-items:center;gap:4px;margin:4px 0}'
    + '.sy-row .sy-st{min-width:64px;font-size:11px;color:#E8C04A;letter-spacing:-1px}.sy-row .sy-st i{color:var(--muted,#888);font-style:normal}'
    + '.sy-row button{font-size:11px;padding:2px 8px;border-radius:999px;border:1px solid var(--line);background:rgba(255,255,255,.05);color:inherit;cursor:pointer}'
    + '.sy-row button.on{outline:2px solid #E8C04A;background:rgba(232,192,74,.2);border-color:transparent}.sy-row button:disabled{opacity:.4;cursor:default}'
    + '.sy-row .sy-lock{font-size:10.5px;opacity:.7}.sy-desc{font-size:11px;opacity:.8;margin-top:4px;min-height:1.3em}';
  document.head.appendChild(css);
  const learned = () => { const s = S(); if (!s) return false; if (s.cls === 'bard') { const sb = s.classes && s.classes.bard; return !!(sb && sb.adv2 === 'awaken' && R.skillsLearned && R.skillsLearned('bard').includes(BID)); } if (s.cls !== 'mage') return false; const st = s.classes && s.classes.mage; return !!(st && st.adv2 === 'harmonic' && R.skillsLearned && R.skillsLearned('mage').includes(ID)); };
  const html = () => {
    const c = conf(), st = star(), p = pick();
    const stars = n => '★'.repeat(Math.min(n, 9)) || '★0';
    return '<h4>' + (isB() ? '演奏場 ' : '諧鳴奏域 ') + '★'.repeat(st) + '<span style="opacity:.4">' + '☆'.repeat(9 - st) + '</span>（' + st + '／9）</h4>'
      + tiers().map(t => { const open = st >= t.star, cur = v => p.at[t.star] === v; return '<div class="sy-row"><span class="sy-st">' + (t.star ? '★' + t.star : '★0') + '</span>' + (open ? t.opts.map(o => '<button type="button" data-sy="' + t.star + '" data-v="' + o[0] + '" class="' + (cur(o[0]) ? 'on' : '') + '" title="' + esc(o[2]) + '">' + esc(o[1]) + '</button>').join('') : '<span class="sy-lock">' + t.opts.map(o => o[1]).join('・') + '（奏域練到 ★' + t.star + ' 才能選）</span>') + '</div>'; }).join('')
      + '<div class="sy-row"><span class="sy-st">形態</span><button type="button" data-sy="form" data-v="" class="' + (p.form ? '' : 'on') + '" title="不選">不選</button>' + FORMS.map(f => '<button type="button" data-sy="form" data-v="' + f[0] + '" class="' + (p.form === f[0] ? 'on' : '') + '" title="' + esc(f[2]) + '">' + esc(f[1]) + '</button>').join('') + '</div>'
      + '<div class="sy-desc">' + esc([].concat(...tiers().map(t => t.opts)).filter((o, i, a) => a.findIndex(q => q[0] === o[0]) === i).concat(FORMS).filter(o => p.has(o[0]) || p.form === o[0]).map(o => o[1] + '：' + o[2]).join('；')) + '</div>';
  };
  // 2026-10-08 作者：選項放在技能書裡奏域那張卡片的最下面（不放在上面換技能的地方）
  const fill = (foot, id) => {
    if (id !== curId() || !learned()) return;
    let box = foot.querySelector('.sy-box'); if (!box) { box = document.createElement('div'); box.className = 'sy-box'; foot.appendChild(box); }
    box.innerHTML = html();
    box.querySelectorAll('[data-sy]').forEach(b => { b.onclick = e => { e.stopPropagation(); const c = conf(); c[b.dataset.sy] = b.dataset.v; R.save && R.save(); fill(foot, id); }; });
  };
  (R.SB_FOOT = R.SB_FOOT || []).push(fill);
})(window.R);
