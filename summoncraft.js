// 召喚師重做（2026-10-13 作者：照《法術統整》霍克派——召喚物的身體是用元素「材質」捏出來的，材質看遺跡的環境；X 換意念；精神條）
// - 材質：每一隻召喚物捏出來時，照這一層的環境（run.env 優先，其次 run.biome）挑主材質（70%）或副材質（30%）。
//   火＝燃燒、冰＝變慢、雷＝連鎖、土＝生命 +30%、擊退、金＝傷害 +15%、破甲、水＝每一下回你 0.5% 生命、木＝定身 0.3 秒、風＝移動 +40%。
//   召喚物身上染一層材質的顏色；多人連線時隊友的影子也照材質染色（netsummon.js 多送一個材質）。
// - 意念（X 點一下換）：集火（照舊：打你最後打的那一隻）→ 護衛（只打你身邊 5 公尺內的敵人，會回到你身邊）→ 狂奔（各打各的最近的，移動 +25%、傷害 +10%）。
//   X 快速點兩下＝獻祭（執念照舊：50，式神使 30）。手機：點兩下職業條。
// - 精神（0～100）：每有一隻召喚物在場，每秒 −1.2；沒有召喚物時每秒 +6；每捏一隻 −4。
//   精神 25 以下＝召喚物失控：不照意念、亂跑，每一下 25% 打空；精神歸零＝「剝離」6 秒：召喚技能魔力 +50%、你受到的傷害 +15%、精神不回。
// - 轉職：萬獸師＝精神消耗 −30%；靈媒師＝獻祭每一隻回 10 精神、剝離只有 3 秒；遺跡馴獸師＝精神 10 以上都不會失控；式神使＝精神回復 +50%。
// 放在 classes2b.js、classcore2.js、netsummon.js 後面。
(function (R) {
  const W = () => R.W, CT = () => (R.coreTime ? R.coreTime() : performance.now() / 1000), rnd = Math.random;
  const C = R.CORE && R.CORE.summoner; if (!C) return;
  const adv = P => (P && P.adv) || '';
  const isS = P => !!(P && P.cls === 'summoner');
  const toast = (t, c) => R.toast && R.toast(t, c);
  const say = (P, t, k) => R.num && R.num(P.x, 2.6, P.z, t, k || 'heal');
  const MAT = {
    Ya: { n: '火', col: '#FF6A3A', elem: 'fire' }, Bo: { n: '冰', col: '#9AD8FF', elem: 'frost' }, Lo: { n: '雷', col: '#FFE070', elem: 'shock' },
    Ta: { n: '土', col: '#A88A5A', life: 1.3, kb: 0.6 }, Ga: { n: '金', col: '#D8D8E0', dK: 1.15, brk: 1 }, La: { n: '水', col: '#4AA8E8', heal: 0.005 },
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
  // ---------- 精神 ----------
  const sp = P => (P._spirit == null ? (P._spirit = 100) : P._spirit);
  const peeled = P => (P._peelT || 0) > CT();
  const pets = () => (R.PETS || []).filter(p => !p.gone && p.left > 0);
  const lose = (P, n) => {
    const before = sp(P); P._spirit = Math.max(0, before - n * (adv(P) === 'beastlord' ? 0.7 : 1));
    if (before > 0 && P._spirit <= 0 && !peeled(P)) { P._peelT = CT() + (adv(P) === 'medium' ? 3 : 6); say(P, '剝離', 'hurt'); toast('精神歸零：剝離（召喚耗魔 +50%、受到的傷害 +15%）', '#C8A8E8'); }
  };
  const wild = P => { const v = sp(P); return v < (adv(P) === 'tamer' ? 10 : 25); };
  // ---------- 召喚物出生 ----------
  R.petInit = (pet, P, s, w) => {
    if (!isS(P)) return;
    const pair = matsHere(), k = s && s.mat && MAT[s.mat] ? s.mat : rnd() < 0.7 ? pair[0] : pair[1], M = MAT[k];
    pet.mat = k; pet.elem = M.elem || null; pet.dK = M.dK || 1; pet.spK = M.spK || 1; pet.kbK = M.kb || 0;
    if (M.life) pet.left *= M.life;
    if (pet.g) tint(pet.g, M.col);
    R._petMat = k;   // netsummon.js 送給隊友
    lose(P, 4);
  };
  // ---------- 意念、失控 ----------
  R.petThink = (pet, P, dt, tg, w) => {
    if (!isS(P)) return null;
    const M = MAT[pet.mat] || {}, mode = modeOf(P), d2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
    pet.spK = (M.spK || 1) * (mode === 'wild' ? 1.25 : 1); pet.dK = (M.dK || 1) * (mode === 'wild' ? 1.1 : 1);
    if (wild(P)) {   // 失控：亂跑、打空
      pet.wT = (pet.wT || 0) - dt; if (pet.wT <= 0 || !pet.wGoal) { pet.wT = 1 + rnd() * 1.5; const a = rnd() * 6.28; pet.wGoal = { x: pet.x + Math.sin(a) * 3, z: pet.z + Math.cos(a) * 3 }; }
      const near = (w.enemies || []).filter(e => !e.dead && !e.under && d2(e, pet) < 2.5)[0] || null;
      return { tg: near, goal: pet.wGoal, skip: rnd() < 0.25 * dt * 10 };
    }
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
      const M = MAT[pet.mat] || {};
      const r = he0(e, raw, o);
      try {
        if (!e.dead) { if (M.root) e.st.root = Math.max(e.st.root || 0, M.root); if (M.brk && R.elemBreak && rnd() < 0.3) R.elemBreak(e); }
        if (M.heal && R.healP) R.healP(P.hpMax * M.heal, true);
      } catch (err) { }
      return r;
    }
    return he0(e, raw, o);
  };
  // 剝離：受到的傷害 +15%
  const hp0 = R.hurtPlayer;
  if (hp0) R.hurtPlayer = (raw, src, o) => { const P = W().P; if (isS(P) && peeled(P)) raw *= 1.15; return hp0(raw, src, o); };
  // 剝離：召喚類技能魔力 +50%（先扣，事後補扣差額）
  const SUMT = ['pet', 'turret', 'orbit'];
  const wrapMp = f => (...a) => {
    const P = W() && W().P; if (!isS(P) || !peeled(P)) return f(...a);
    const m0 = P.mp, r = f(...a), used = m0 - P.mp;
    if (used > 0) P.mp = Math.max(0, P.mp - used * 0.5);
    return r;
  };
  if (R.castSlot) { const cs = R.castSlot; R.castSlot = i => { const P = W() && W().P, id = P && R.slotSkill ? R.slotSkill(P, i | 0) : null, L = id && R.SKILL_LIB && R.SKILL_LIB[id]; return L && SUMT.includes(L.type) ? wrapMp(cs)(i) : cs(i); }; }
  // ---------- 每一格：精神 ----------
  const st0 = R.step;
  R.step = dt => {
    const r = st0(dt);
    try {
      const w = W(), P = w && w.P;
      if (P && isS(P) && w.run && !w.paused && !P.dead) {
        const n = pets().length;
        if (n) lose(P, 1.2 * n * dt);
        else if (!peeled(P)) P._spirit = Math.min(100, sp(P) + 6 * dt * (adv(P) === 'shikigami' ? 1.5 : 1));
      }
    } catch (e) { }
    return r;
  };
  const sr0 = R.startRun; if (sr0) R.startRun = (...a) => { const r = sr0(...a); try { const P = W().P; if (P) { P._spirit = 100; P._peelT = 0; } } catch (e) { } return r; };
  // ---------- 職業核心：X 換意念、點兩下獻祭 ----------
  const act0 = C.act.bind(C);
  C.act = function (P) {
    const t = CT();
    if (t - (P._modeT || -9) < 0.35) {   // 點兩下：把剛剛換的意念換回來，然後獻祭
      P._petMode = P._modePrev || 'focus'; P._modeT = -9;
      const before = pets().length; act0(P);
      if (adv(P) === 'medium' && before && !pets().length) P._spirit = Math.min(100, sp(P) + 10 * before);
      return;
    }
    P._modePrev = modeOf(P); const i = MODES.findIndex(m => m[0] === modeOf(P)); P._petMode = MODES[(i + 1) % MODES.length][0]; P._modeT = t;
    say(P, '意念：' + MODES.find(m => m[0] === P._petMode)[1]);
  };
  const g0 = C.gauge.bind(C);
  C.gauge = function (P) {
    const g = g0(P), v = Math.round(sp(P)), m = MODES.find(x => x[0] === modeOf(P))[1], pair = matsHere();
    g.name = '執念・意念：' + m;
    g.sub = '精神 ' + v + (peeled(P) ? '（剝離 ' + Math.ceil(P._peelT - CT()) + ' 秒）' : wild(P) ? '（失控）' : '') + '・材質 ' + MAT[pair[0]].n + '／' + MAT[pair[1]].n + '・召喚物 ' + pets().length;
    g.x = '換意念（點兩下＝獻祭）';
    return g;
  };
  const h0 = C.help;
  C.help = P => '霍克派：召喚物的身體用元素材質捏成，材質看這一層的環境（現在：' + matsHere().map(k => MAT[k].n).join('／') + '）。X 換意念：集火→護衛→狂奔；X 點兩下＝獻祭（執念 ' + (adv(P) === 'shikigami' ? 30 : 50) + '）。精神：召喚物在場會慢慢消耗，25 以下召喚物失控，歸零＝剝離。 ' + (typeof h0 === 'function' ? h0(P) : '')
    + ({ beastlord: '萬獸師：精神消耗 −30%。', medium: '靈媒師：獻祭每隻回 10 精神、剝離只有 3 秒。', tamer: '遺跡馴獸師：精神 10 以上都不會失控。', shikigami: '式神使：精神回復 +50%。' }[adv(P)] || '');
  // 精神條（遺跡裡、召喚師）
  const css = document.createElement('style');
  css.textContent = '#sm-spirit{position:fixed;left:50%;bottom:118px;transform:translateX(-50%);width:160px;height:6px;background:#1A1622;border:1px solid #3E3550;border-radius:4px;z-index:40;pointer-events:none}#sm-spirit i{display:block;height:100%;background:#A88AE8;border-radius:3px}#sm-spirit.wild i{background:#C86A5A}#sm-spirit.peel{border-color:#C86A5A}';
  document.head.appendChild(css);
  let hudT = 0;
  const st1 = R.step;
  R.step = dt => {
    const r = st1(dt); hudT -= dt; if (hudT > 0) return r; hudT = 0.2;
    try {
      const w = W(), P = w && w.P, on = !!(P && isS(P) && w.run && !w.run.done); let el = document.getElementById('sm-spirit');
      if (!on) { if (el) el.hidden = true; return r; }
      if (!el) { el = document.createElement('div'); el.id = 'sm-spirit'; el.title = '精神'; el.innerHTML = '<i></i>'; document.body.appendChild(el); }
      el.hidden = false; el.firstChild.style.width = sp(P) + '%'; el.className = peeled(P) ? 'peel wild' : wild(P) ? 'wild' : '';
    } catch (e) { }
    return r;
  };
})(window.R);
