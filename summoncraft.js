// 召喚師（2026-10-13 作者：霍克派——召喚物的身體是用元素「材質」捏出來的，材質看遺跡的環境；X 換意念）
// 2026-10-13 第二版（作者回饋）：
// - 拿掉「精神」條（遊戲本來就有理智條，不另外加新的資源）。理智照舊：召喚物打倒的人不算你親手殺的（san.js）。
// - 召喚物不再有時間限制：在場的每一隻每秒吃一點魔力（小隻約 0.6、大隻約 2 魔力/秒）。魔力見底時，最弱、最早的那隻先散掉（一次一隻）。
// - 按住 X（0.5 秒）＝收回：所有召喚物安靜地回來，不爆炸，退回一半的召喚魔力。手機：長按職業條。
// - 獻祭不再放在 X 上，變成可以自己選要不要帶的技能「獻祭」；執念改成讓召喚物變強（每 2 點執念 +1% 傷害，最多 +50%）。
// - 材質：火＝燃燒、冰＝變慢、雷＝連鎖、土＝擊退、少吃 20% 魔力、金＝傷害 +15%、破甲、水＝每一下回你 0.5% 生命、木＝定身 0.3 秒、風＝移動 +40%。
// - 意念（X 點一下換）：集火 → 護衛 → 狂奔。
// - 轉職：萬獸師＝維持魔力 −25%；靈媒師＝收回時每隻回 3% 生命；遺跡馴獸師＝集火時傷害 +30%（照舊）；式神使＝收回退回 80% 魔力。
// 放在 classes2b.js、classcore2.js、netsummon.js 後面。
(function (R) {
  const W = () => R.W, CT = () => (R.coreTime ? R.coreTime() : performance.now() / 1000), rnd = Math.random;
  const C = R.CORE && R.CORE.summoner; if (!C) return;
  const adv = P => (P && P.adv) || '';
  const isS = P => !!(P && P.cls === 'summoner');
  const live = () => { const w = W(); return !!(w && w.run && !w.run.done && w.P && !w.P.dead && !w.paused); };
  const toast = (t, c) => R.toast && R.toast(t, c);
  const say = (P, t, k) => R.num && R.num(P.x, 2.6, P.z, t, k || 'heal');
  const MAT = {
    Ya: { n: '火', col: '#FF6A3A', elem: 'fire' }, Bo: { n: '冰', col: '#9AD8FF', elem: 'frost' }, Lo: { n: '雷', col: '#FFE070', elem: 'shock' },
    Ta: { n: '土', col: '#A88A5A', up: 0.8, kb: 0.6 }, Ga: { n: '金', col: '#D8D8E0', dK: 1.15, brk: 1 }, La: { n: '水', col: '#4AA8E8', heal: 0.005 },
    Za: { n: '木', col: '#5AA84A', root: 0.3 }, No: { n: '風', col: '#BFF0D0', spK: 1.4 }
  };
  R.SUMMON_MAT = MAT;
  const ENV = { ruin: ['Ta', 'Ga'], forest: ['Za', 'No'], plain: ['No', 'Ta'], cave: ['La', 'Ta'], crystal: ['Lo', 'Bo'], lava: ['Ya', 'Ga'], snow: ['Bo', 'La'], volcano: ['Ya', 'Ga'], deep: ['La', 'Bo'], desert: ['Ta', 'No'] };
  const envKey = () => { const r = W().run; return (r && (r.env || r.biome)) || 'ruin'; };
  const matsHere = () => ENV[envKey()] || ENV.ruin;
  R.summonMats = matsHere;
  const MODES = [['focus', '集火'], ['guard', '護衛'], ['wild', '狂奔']];
  const modeOf = P => (P && MODES.some(m => m[0] === P._petMode) ? P._petMode : 'focus');
  const tint = (g, col) => { try { const TH = window.THREE, c = new TH.Color(col); g.traverse(o => { if (o.isMesh && o.material && o.material.color) { o.material = o.material.clone(); o.material.color.lerp(c, 0.45); } }); } catch (e) { } };
  R.summonTint = tint;
  const pets = () => (R.PETS || []).filter(p => !p.gone && p.left > 0);
  // ---------- 維持魔力 ----------
  const upOfK = k => Math.round((0.6 + Math.max(0, (k || 0.6) - 0.5) * 1.27) * 10) / 10;   // k 0.5→0.6、0.7→0.85、1.6→2.0
  const upMul = P => (adv(P) === 'beastlord' ? 0.75 : 1) / Math.max(0.5, P.petLife || 1);   // 原本「召喚時間 +」的加成 → 少吃魔力
  R.summonUpkeep = (k, P) => Math.round(upOfK(k) * upMul(P || W().P || {}) * 10) / 10;
  const totalUp = P => pets().reduce((a, p) => a + (p.upkeep || 0), 0) * upMul(P);
  // 技能說明多一行「維持：每隻 X 魔力/秒」
  const descFix = () => { const L = R.SKILL_LIB || {}; Object.keys(L).forEach(id => { const l = L[id], sk = R.SKILLS && R.SKILLS[id]; if (!l || l.cls !== 'summoner' || l.type !== 'pet' || !sk || sk._upd) return; sk._upd = 1; sk.desc = String(sk.desc || '').replace(/\d+ 秒內|\s*\d+ 秒/g, '') + '（不限時間；在場時每隻每秒吃 ' + upOfK(l.p && l.p.k) + ' 魔力）'; }); };
  descFix();
  // ---------- 召喚物出生 ----------
  let castMp = 0;
  R.petInit = (pet, P, s, w) => {
    if (!isS(P)) return;
    const pair = matsHere(), k = s && s.mat && MAT[s.mat] ? s.mat : rnd() < 0.7 ? pair[0] : pair[1], M = MAT[k];
    pet.mat = k; pet.elem = M.elem || null; pet.dK = M.dK || 1; pet.spK = M.spK || 1; pet.kbK = M.kb || 0;
    pet.upkeep = upOfK(s && s.k) * (M.up || 1); pet.born = CT(); pet.left = 1e9;   // 不限時間（魔力見底才散）
    pet.mp0 = castMp / Math.max(1, (s && s.n) || 1);
    if (pet.g) tint(pet.g, M.col);
    R._petMat = k;   // netsummon.js 送給隊友
  };
  // 召喚技能花了多少魔力（收回時退一半）
  const wrapCast = f => (...a) => { const P = W() && W().P; if (!isS(P)) return f(...a); const m0 = P.mp; castMp = 0; const L0 = pets().length; const r = f(...a); const used = m0 - P.mp; if (used > 0 && pets().length > L0) { const nw = pets().slice(L0); nw.forEach(p => { p.mp0 = used / nw.length; }); } return r; };
  if (R.castSlot) R.castSlot = wrapCast(R.castSlot);
  if (R.useSkill) R.useSkill = wrapCast(R.useSkill);
  // ---------- 意念 ----------
  R.petThink = (pet, P, dt, tg, w) => {
    if (!isS(P)) return null;
    const M = MAT[pet.mat] || {}, mode = modeOf(P), d2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z), obs = 1 + Math.min(0.5, (P._obs || 0) / 200);
    pet.spK = (M.spK || 1) * (mode === 'wild' ? 1.25 : 1); pet.dK = (M.dK || 1) * (mode === 'wild' ? 1.1 : 1) * obs;
    if (mode === 'guard') {
      let best = null, bd = 5; (w.enemies || []).forEach(e => { if (e.dead || e.under || e.invuln) return; const d = d2(e, P); if (d < bd) { bd = d; best = e; } });
      return { tg: best, goal: { x: P.x + Math.sin(pet.t) * 1.4, z: P.z + Math.cos(pet.t) * 1.4 } };
    }
    if (mode === 'wild') {
      let best = null, bd = 1e9; (w.enemies || []).forEach(e => { if (e.dead || e.under || e.invuln) return; const d = d2(e, pet); if (d < bd && d2(e, P) < 18) { bd = d; best = e; } });
      return { tg: best };
    }
    return null;
  };
  // 材質命中效果
  const he0 = R.hurtEnemy;
  R.hurtEnemy = (e, raw, o) => {
    const pet = R.petHitter, P = W().P;
    if (pet && e && !e.dead && isS(P)) {
      const M = MAT[pet.mat] || {}, r = he0(e, raw, o);
      try { if (!e.dead) { if (M.root) e.st.root = Math.max(e.st.root || 0, M.root); if (M.brk && R.elemBreak && rnd() < 0.3) R.elemBreak(e); } if (M.heal && R.healP) R.healP(P.hpMax * M.heal, true); } catch (err) { }
      return r;
    }
    return he0(e, raw, o);
  };
  // ---------- 每一格：吃魔力；見底＝最弱、最早的先散 ----------
  let fadeT = 0;
  const st0 = R.step;
  R.step = dt => {
    const r = st0(dt);
    try {
      const w = W(), P = w && w.P;
      if (P && isS(P) && w.run && !w.paused && !P.dead) {
        const L = pets();
        if (L.length) {
          const cost = totalUp(P) * dt; fadeT -= dt;
          if (P.mp >= cost) P.mp -= cost;
          else { P.mp = 0; if (fadeT <= 0) { fadeT = 0.8; const p = L.slice().sort((a, b) => (a.upkeep - b.upkeep) || (a.born - b.born))[0]; p.left = 0; toast('魔力不夠，一隻召喚物散掉了', '#B8E07A'); } }
        }
      }
    } catch (e) { }
    return r;
  };
  // ---------- 收回 ----------
  const recall = P => {
    const L = pets(); if (!L.length) { toast('沒有召喚物可以收回'); return false; }
    const k = adv(P) === 'shikigami' ? 0.8 : 0.5; let mp = 0;
    L.forEach(p => { mp += (p.mp0 || 0) * k; p.left = 0; if (adv(P) === 'medium' && R.healP) R.healP(P.hpMax * 0.03, true); });
    P.mp = Math.min(P.mpMax, P.mp + mp);
    R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 1.6, color: '#B8E07A' }); say(P, '收回 ×' + L.length + (mp >= 1 ? '（+' + Math.round(mp) + ' 魔力）' : ''));
    return true;
  };
  R.summonRecall = () => { const P = W().P; return isS(P) ? recall(P) : false; };
  // X：點一下＝換意念；按住 0.5 秒＝收回（剛剛換的意念換回來）
  C.act = function (P) { P._modePrev = modeOf(P); const i = MODES.findIndex(m => m[0] === modeOf(P)); P._petMode = MODES[(i + 1) % MODES.length][0]; say(P, '意念：' + MODES.find(m => m[0] === P._petMode)[1]); };
  let holdT = null;
  const holdStart = () => { const P = W().P; if (!isS(P) || !live()) return; clearTimeout(holdT); holdT = setTimeout(() => { holdT = null; const Q = W().P; if (!isS(Q) || !live()) return; Q._petMode = Q._modePrev || modeOf(Q); recall(Q); }, 500); };
  const holdEnd = () => { clearTimeout(holdT); holdT = null; };
  const typing = e => { const t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable); };
  window.addEventListener('keydown', e => { if (typing(e) || e.repeat) return; if ((e.key || '').toLowerCase() === 'x') holdStart(); }, true);
  window.addEventListener('keyup', e => { if ((e.key || '').toLowerCase() === 'x') holdEnd(); }, true);
  // 手機／滑鼠：點職業條＝換意念、長按＝收回
  let tapOn = false;
  document.addEventListener('pointerdown', e => { const P = W().P; if (!isS(P) || !live() || !(e.target && e.target.closest && e.target.closest('#core-g'))) return; e.preventDefault(); tapOn = true; P._modePrev = modeOf(P); holdStart(); }, true);
  document.addEventListener('pointerup', () => { if (!tapOn) return; tapOn = false; if (holdT) { holdEnd(); const P = W().P; if (isS(P) && live()) C.act(P); } }, true);
  document.addEventListener('pointercancel', () => { tapOn = false; holdEnd(); }, true);
  // ---------- 獻祭：自己選要不要帶的技能 ----------
  const L = R.SKILL_LIB, T = R.SKILL_TYPES;
  if (L && T && L.sn_sacrifice) {
    T.sm_sac = (s, P, w, pw) => {
      const ps = pets();
      if (!ps.length) { R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 3.4, color: '#C8A878' }); (w.enemies || []).forEach(e => { if (!e.dead && Math.hypot(e.x - P.x, e.z - P.z) < 3.4 + e.def.size * 0.5) R.hurtEnemy(e, pw * 2, { kb: 1.5 }); }); return; }
      ps.forEach(p => { R.fx && R.fx('boom', p.x, 0.4, p.z, { r: 2.5, color: '#B8E07A' }); (w.enemies || []).forEach(e => { if (!e.dead && Math.hypot(e.x - p.x, e.z - p.z) < 2.5 + e.def.size * 0.5) R.hurtEnemy(e, pw * 2.2, { kb: 1.5 }); }); p.left = 0; });
      R.shake && R.shake(0.25); say(P, '獻祭 ×' + ps.length, 'crit');
    };
    L.sn_sacrifice.type = 'sm_sac';
    if (R.SKILLS && R.SKILLS.sn_sacrifice) R.SKILLS.sn_sacrifice.desc = '（想用再帶）讓在場的召喚物在原地炸開；沒有召喚物時改成在身邊炸一圈。不用也完全沒關係——想收回召喚物請按住 X。';
  }
  C.gauge = function (P) {
    const o = P._obs || 0, n = pets().length, m = MODES.find(x => x[0] === modeOf(P))[1], pair = matsHere(), up = Math.round(totalUp(P) * 10) / 10;
    return { name: '意念：' + m, v: o, max: 100, full: o >= 100, text: '執念 ' + Math.floor(o) + '（召喚物傷害 +' + Math.round(Math.min(50, o / 2)) + '%）', sub: '召喚物 ' + n + ' 隻・維持 ' + up + ' 魔力/秒・材質 ' + MAT[pair[0]].n + '／' + MAT[pair[1]].n, x: '換意念（按住＝收回）' };
  };
  C.act0 = null;
  C.help = P => '召喚物的身體用元素材質捏成，材質看這一層的環境（現在：' + matsHere().map(k => MAT[k].n).join('／') + '）。召喚物不限時間，在場時每隻每秒吃一點魔力；魔力見底，最弱的那隻先散掉。X 點一下換意念：集火（打你最後打的那隻）→ 護衛（守在你身邊）→ 狂奔（各打各的）；按住 X＝收回所有召喚物，退回一半魔力。召喚物打中、打倒都攢執念，執念讓召喚物更痛。'
    + ({ beastlord: '萬獸師：維持魔力 −25%。', medium: '靈媒師：收回時每隻回你 3% 生命。', tamer: '遺跡馴獸師：集火的時候召喚物傷害 +30%。', shikigami: '式神使：收回退回 80% 魔力。' }[adv(P)] || '');
  // 拿掉上一版的精神條
  try { const el = document.getElementById('sm-spirit'); if (el) el.remove(); } catch (e) { }
})(window.R);
