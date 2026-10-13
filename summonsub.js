// 召喚師的轉職（2026-10-13 作者決定）
// - 拿掉「圖鑑打倒 10 隻以上的變成召喚形態」（classcore2.js）。
// - 刪掉「遺跡馴獸師」：存檔裡選了它的召喚師改回未轉職、退還那顆魔力核心，可以免費重選；等級不動。
// - 靈媒師 → 死靈法師（id 照舊 medium）：打倒的敵人叫起來當亡者（牠原本的樣子＋簡化的招式），最多 4 隻；牆、眼球、砲台、圖騰、水晶、物品、領主不行。
//   「獻祭」只有死靈法師能學：炸掉亡者（不是一般召喚物），每隻回 5% 生命、5% 魔力。
// - 萬獸師：召喚技能重放會一直疊（最多 12 隻），每隻少吃一半魔力（summoncraft.js），倒下時損失的魔力退回 80%。
// - 式神使：式神最多 2 隻，傷害 ×2.5、血量 ×3；你受到的傷害 30% 由式神分擔。
// 放在 summoncraft.js 後面。
(function (R) {
  const W = () => R.W, CT = () => (R.coreTime ? R.coreTime() : performance.now() / 1000), rnd = Math.random;
  const adv = P => (P && P.adv) || '', isS = P => !!(P && P.cls === 'summoner');
  const pets = () => (R.PETS || []).filter(p => !p.gone && p.left > 0);
  const toast = (t, c) => R.toast && R.toast(t, c);
  const say = (P, t, k) => R.num && R.num(P.x, 2.6, P.z, t, k || 'heal');
  const L = R.SKILL_LIB || {}, T = R.SKILL_TYPES || {};
  const MAT = R.SUMMON_MAT || {};
  // ---------- 遺跡馴獸師：刪掉＋存檔轉移 ----------
  Object.keys(L).forEach(id => { if (L[id] && L[id].adv === 'tamer') { delete L[id]; if (R.SKILLS) delete R.SKILLS[id]; } });
  if (R.ADV && R.ADV.summoner) R.ADV.summoner = R.ADV.summoner.filter(a => a.id !== 'tamer');
  const migrate = () => {
    try {
      const S = R.S, st = S && S.classes && S.classes.summoner; if (!st) return;
      if (st.adv === 'tamer') {
        st.adv = null; S.mats = S.mats || {}; S.mats.core = (S.mats.core || 0) + 1; st.tamerGone = 1;
        if (S.loadout && S.loadout.summoner) S.loadout.summoner = S.loadout.summoner.map(id => (id && (/^tm_/.test(id) || /tamer/.test(id)) ? null : id));
        setTimeout(() => toast('「遺跡馴獸師」拿掉了：召喚師改回未轉職，退還一顆魔力核心，可以免費重選轉職（等級不變）', '#B8E07A'), 600);
      }
      if (st.adv2 === 'tamer') st.adv2 = null;
      // 獻祭只剩死靈法師：其他人裝著的拿下來
      if (st.adv !== 'medium' && S.loadout && S.loadout.summoner) S.loadout.summoner = S.loadout.summoner.map(id => (id === 'sn_sacrifice' ? null : id));
    } catch (e) { }
  };
  R.summonMigrate = migrate;
  migrate();
  const cp0 = R.calcPlayer; R.calcPlayer = cls => { if (cls === 'summoner') migrate(); return cp0(cls); };
  ['useSlot', 'hub', 'enterTown', 'startRun', 'save'].forEach(k => { const f = R[k]; if (typeof f === 'function') R[k] = (...a) => { if (k !== 'save') migrate(); const r = f(...a); if (k === 'useSlot') migrate(); return r; }; });
  if (R.loadoutOf) { const lo0 = R.loadoutOf; R.loadoutOf = cls => { if (cls === 'summoner') migrate(); return lo0(cls); }; }
  // ---------- 上限 ----------
  const capOf = P => (adv(P) === 'beastlord' ? 12 : adv(P) === 'shikigami' ? 2 : 6);
  const RAISE_CAP = 4;
  const fadeOne = p => { p.left = 0; R.fx && R.fx('poof', p.x, 0.6, p.z, { color: '#C8A878', n: 10 }); };
  const enforce = P => {
    const L1 = pets(), nor = L1.filter(p => !p.raised), rz = L1.filter(p => p.raised);
    const byAge = a => a.slice().sort((x, y) => (x.born || 0) - (y.born || 0));
    if (nor.length > capOf(P)) byAge(nor).slice(0, nor.length - capOf(P)).forEach(fadeOne);
    if (rz.length > RAISE_CAP) byAge(rz).slice(0, rz.length - RAISE_CAP).forEach(fadeOne);
  };
  // ---------- 召喚物出生：式神、亡者 ----------
  const pi0 = R.petInit;
  R.petInit = (pet, P, s, w) => {
    if (pi0) pi0(pet, P, s, w);
    if (!isS(P)) return;
    if (s && s.raised) {
      pet.raised = 1; pet.mat = 'Nc'; pet.elem = null; pet.dK = 1; pet.kbK = 0; pet.spK = 1;
      pet.ranged = !!s.ranged; pet.upkeep = 0.5;
      if (pet.g) { try { const TH = window.THREE, c = new TH.Color('#2A1438'); pet.g.traverse(o => { if (o.isMesh && o.material && o.material.color) { o.material = o.material.clone(); o.material.color.lerp(c, 0.55); if (o.material.emissive) o.material.emissive.set('#3A0A4A'); } }); } catch (e) { } }
      R.fx && R.fx('ring', pet.x, 0.1, pet.z, { r: 1.2, color: '#8A4AB8' });
    } else if (adv(P) === 'shikigami') {
      pet.shiki = 1; pet.pK = 2.5; pet.hpMax = Math.round((pet.hpMax || 100) * 3); pet.hp = pet.hpMax; pet.upkeep = (pet.upkeep || 1) * 1.6;
      if (pet.g && R.summonTint) R.summonTint(pet.g, '#F4EEDC');
    } else if (adv(P) === 'beastlord') {
      pet.hpMax = Math.round((pet.hpMax || 100) * 0.7); pet.hp = pet.hpMax;
    }
  };
  if (T.pet) { const pet0 = T.pet; T.pet = (s, P, w, pw) => { const r = pet0(s, P, w, pw); try { if (isS(P)) enforce(P); } catch (e) { } return r; }; }
  // 萬獸師：召喚物倒下，損失的魔力退回 80%（其他人：倒下就沒了）
  R.onPetDeath = (pet, P) => { if (adv(P) === 'beastlord' && pet.mp0) { P.mp = Math.min(P.mpMax, P.mp + pet.mp0 * 0.8); say(P, '+' + Math.round(pet.mp0 * 0.8) + ' 魔力'); } };
  // ---------- 死靈法師 ----------
  // 叫不起來的：牆、眼球、砲台、圖騰、水晶、物品、領主、人類
  const NO_AI = new Set(['wall', 'eye', 'judge', 'laser', 'turret', 'sentry', 'mine', 'core', 'crystalcore', 'dummy', 'alarm', 'healer', 'wisplure', 'scroll', 'dropper', 'ladle', 'oxcart', 'ceiling', 'sinkhole', 'tentacle', 'wellhand', 'mortar', 'smoke', 'icecoffin', 'bean', 'footsteps', 'kprism', 'kecho', 'lord', 'giant', 'centipede']);
  const NO_ID = new Set(['hatarei', 'petra', 'tdummy', 'nurikabe', 'hyakume', 'prismeye', 'judgeeye', 'gearsentry', 'jinmenju', 'corebeast', 'chochin', 'kyorinrin', 'tsurube', 'funa', 'oboro', 'enenra', 'sporepuff', 'dankara', 'acidbubble', 'mistwisp', 'lanternwisp', 'icewarden', 'k_prism', 'k_echo', 'k_echo_s']);
  const base = id => String(id || '').replace(/_v\d$/, '');
  const raisable = (id, d) => !!(d && id && !d.boss && !d.lordPlus && !d.human && !d.elite && !/^l_/.test(d.ai || '') && !NO_AI.has(d.ai) && !NO_ID.has(base(id)) && !/牆|壁|眼|瞳|砲|塔|圖騰|水晶|晶核|木樁|燈|桶|車/.test(d.name || ''));
  R.necroRaisable = id => raisable(id, R.ENEMIES[id]);
  R.NECRO_EXCLUDE = { ai: [...NO_AI], id: [...NO_ID] };
  const isN = P => isS(P) && adv(P) === 'medium';
  const corpses = [];
  const powOf = P => ((P.ws && P.ws.dmg) || 10) * 1.5 * (P.dmgMult || 1);
  const raise = (P, c, pw) => {
    const w = W(), d = R.ENEMIES[c.id]; if (!d || !T.pet) return false;
    if (pets().filter(p => p.raised).length >= RAISE_CAP) return false;
    const k = Math.min(1.4, 0.55 + (d.size || 0.7) * 0.35), shoot = !!(d.shoot || d.shot || d.fan);
    const sv = w.P.aimA; w.P.aimA = Math.atan2(c.x - P.x, c.z - P.z);
    const n0 = (R.PETS || []).length;
    T.pet({ beast: c.id, n: 1, k, raised: 1, mat: 'Nc', ranged: shoot, speed: Math.max(3, Math.min(7, d.speed || 4)), rate: shoot ? 1.3 : 0.9, color: '#6A3A8A' }, P, w, pw || powOf(P));
    w.P.aimA = sv;
    const p = (R.PETS || [])[n0]; if (p) { p.x = c.x; p.z = c.z; if (p.g) p.g.position.set(p.x, 0, p.z); }
    R.fx && R.fx('poof', c.x, 0.4, c.z, { color: '#4A1A5A', n: 18 });
    c.used = 1; return true;
  };
  R.necroRaise = (P, c, pw) => raise(P, c, pw);
  R.necroCorpses = corpses;
  const he0 = R.hurtEnemy;
  R.hurtEnemy = (e, raw, o) => {
    const was = e && e.dead, r = he0(e, raw, o);
    try {
      const P = W().P;
      if (e && !was && e.dead && isN(P)) {
        const id = e.id || (e.def && e.def.id);
        if (raisable(id, e.def || R.ENEMIES[id])) {
          const c = { id, x: e.x, z: e.z, t: CT() }; corpses.push(c); while (corpses.length > 12) corpses.shift();
          if (rnd() < 0.25 && Math.hypot(e.x - P.x, e.z - P.z) < 16) setTimeout(() => { if (!c.used && W().P === P && !P.dead) raise(P, c); }, 400);
        }
      }
    } catch (err) { }
    return r;
  };
  // 亡者的招式（簡化）：會射的在遠處放一道暗紫的魂彈；其他的照原本的咬
  const pt0 = R.petThink;
  R.petThink = (pet, P, dt, tg, w) => {
    const h = pt0 ? pt0(pet, P, dt, tg, w) : null;
    try {
      if (pet.raised && pet.ranged && !pet.gone && pet.left > 0) {
        const t = h && 'tg' in h ? h.tg : tg;
        if (t && !t.dead) {
          const d = Math.hypot(t.x - pet.x, t.z - pet.z);
          if (d < 8) {
            if (pet.cd <= 0) {
              pet.cd = (pet.s && pet.s.rate) || 1.3;
              R.fx && R.fx('bolt', pet.x, 0.9, pet.z, { to: t, color: '#9A5AD8' });
              t.petHit = 1; R.petHitter = pet; R.hurtEnemy(t, (pet.pw || 10) * ((pet.s && pet.s.k) || 0.6) * (pet.mul || 1) * (pet.dK || 1), { primary: false }); R.petHitter = null; t.petHit = 0;
            }
            return { tg: null, goal: { x: pet.x, z: pet.z }, skip: true };
          }
        }
      }
    } catch (e) { }
    return h;
  };
  if (R.loadFloor) { const lf0 = R.loadFloor; R.loadFloor = (...a) => { corpses.length = 0; return lf0(...a); }; }
  // 技能「起屍」（取代原本的「附身」）
  T.nc_raise = (s, P, w, pw) => {
    const now = CT(), L1 = corpses.filter(c => !c.used && now - c.t < 12 && Math.hypot(c.x - P.x, c.z - P.z) < 12).sort((a, b) => b.t - a.t);
    let n = 0; for (const c of L1) { if (n >= (s.n || 3)) break; if (raise(P, c, pw)) n++; else break; }
    R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 3, color: '#8A4AB8' });
    if (!n) toast(pets().filter(p => p.raised).length >= RAISE_CAP ? '亡者已經滿了（最多 ' + RAISE_CAP + ' 隻）' : '附近沒有剛倒下的敵人', '#B8A8E8'); else say(P, '起屍 ×' + n, 'crit');
  };
  if (L.md_haunt) {
    Object.assign(L.md_haunt, { name: '起屍', type: 'nc_raise', p: { n: 3 }, desc: '讓附近 12 秒內倒下的敵人（最多三隻）站起來當你的亡者：牠原本的樣子、簡化的招式，在場時每隻每秒吃 0.5 魔力。亡者最多 4 隻。牆、眼球、砲台、圖騰、水晶、物品和領主叫不起來。' });
    if (R.SKILLS && R.SKILLS.md_haunt) Object.assign(R.SKILLS.md_haunt, { name: '起屍', desc: L.md_haunt.desc });
  }
  // 獻祭：只有死靈法師；炸掉亡者（一般召喚物不算）
  if (L.sn_sacrifice) {
    T.sm_sac = (s, P, w, pw) => {
      const ps = pets().filter(p => p.raised);
      if (!ps.length) { toast('沒有亡者可以獻祭（先用「起屍」）', '#B8A8E8'); return; }
      ps.forEach(p => {
        R.fx && R.fx('boom', p.x, 0.4, p.z, { r: 2.5, color: '#7A3AA8' });
        (w.enemies || []).forEach(e => { if (!e.dead && Math.hypot(e.x - p.x, e.z - p.z) < 2.5 + e.def.size * 0.5) R.hurtEnemy(e, pw * 1.8, { kb: 1.2 }); });
        p.left = 0;
        if (R.healP) R.healP(P.hpMax * 0.05, true); P.mp = Math.min(P.mpMax, P.mp + P.mpMax * 0.05);
      });
      R.shake && R.shake(0.2); say(P, '獻祭 ×' + ps.length + '（+' + ps.length * 5 + '% 生命／魔力）', 'crit');
    };
    Object.assign(L.sn_sacrifice, { type: 'sm_sac', adv: 'medium', lv: Math.max(10, L.sn_sacrifice.lv || 10) });
    if (R.SKILLS && R.SKILLS.sn_sacrifice) R.SKILLS.sn_sacrifice.desc = '（死靈法師）讓你的亡者在原地炸開，炸傷周圍的敵人；每炸一隻回你 5% 最大生命、5% 最大魔力。一般的召喚物不會被炸。';
  }
  // ---------- 式神使 ----------
  const hp0 = R.hurtPlayer;
  R.hurtPlayer = (raw, src, o) => {
    try {
      const P = W().P;
      if (raw > 0 && isS(P) && adv(P) === 'shikigami' && !P.dead) {
        const sh = pets().filter(p => p.shiki && p.hp > 0);
        if (sh.length) {
          const k = (P._shWard > CT() ? 0.6 : 0.3), part = raw * k;
          sh.forEach(p => { p.hp -= part / sh.length; if (p.hp <= 0) { p.hp = 0; p.left = 0; } });
          raw -= part; R.summonShare = (R.summonShare || 0) + part;
        }
      }
    } catch (e) { }
    return hp0(raw, src, o);
  };
  // 技能：白狐（取代原本繞圈的「式神」）、牛鬼（取代「狐式神」）、護符結界（取代「紙吹雪」）
  const setSk = (id, o, desc) => { if (!L[id]) return; Object.assign(L[id], o, { desc }); if (R.SKILLS && R.SKILLS[id]) Object.assign(R.SKILLS[id], { name: o.name || R.SKILLS[id].name, desc, cd: o.cd || R.SKILLS[id].cd, mp: o.mp || R.SKILLS[id].mp }); };
  setSk('ss_shiki', { name: '式神・白狐', type: 'pet', cd: 14, mp: 24, p: { beast: 'kitsune', n: 1, k: 1.2, speed: 7, color: '#F4EEDC' } }, '折一隻白狐式神：很強（傷害 ×2.5、血量 ×3），會替你分擔 30% 的傷害。式神最多 2 隻，多的會換掉最早的那隻。');
  setSk('ss_fox', { name: '式神・牛鬼', type: 'pet', cd: 20, mp: 34, p: { beast: 'ushioni', n: 1, k: 1.6, speed: 4, rate: 1.1, kb: 2, scale: 0.8, color: '#F4EEDC' } }, '折一尊牛鬼式神：慢，但一下很重、會把敵人撞開。式神最多 2 隻。');
  T.ss_ward = (s, P, w, pw) => {
    const sh = pets().filter(p => p.shiki); P._shWard = CT() + 6;
    sh.forEach(p => { p.hp = Math.min(p.hpMax, p.hp + p.hpMax * 0.4); R.fx && R.fx('ring', p.x, 0.1, p.z, { r: 1.2, color: '#F4EEDC' }); });
    R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 2, color: '#F4EEDC' }); say(P, sh.length ? '護符結界' : '護符結界（沒有式神）', 'heal');
  };
  setSk('ss_paper', { name: '護符結界', type: 'ss_ward', cd: 18, mp: 16, p: {} }, '貼護符：式神回 40% 血量；6 秒內式神分擔的傷害從 30% 變成 60%。');
  // 萬獸師：說明
  ['bl_pack', 'bl_zoo', 'bl_alpha'].forEach(id => { if (R.SKILLS && R.SKILLS[id] && !/疊/.test(R.SKILLS[id].desc)) R.SKILLS[id].desc += '（萬獸師：重放會一直疊上去，最多 12 隻）'; });
  R.summonCapOf = capOf; R.SUMMON_RAISE_CAP = RAISE_CAP;
})(window.R);
