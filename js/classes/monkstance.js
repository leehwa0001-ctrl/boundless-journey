// 武術家的職業特效：四種「法」（2026-10-08 作者：武術家比較注重一招一式；把附魔師那套搬過來——拳法、掌法、步法、腿法，
// 不同的「法」各有特色，可以頻繁切換接招，也可以維持同一種法；每次攻擊累積能量，能量滿了強化下次切換的那一法）
// 取代原本的「連段」（classcore.js 的 CORE.monk）。X 依序換：拳法 → 掌法 → 步法 → 腿法 → 拳法。
// 2026-10-09 作者調整：
// - 能量改叫「勢」（每次普攻打中 +10，最多 100）；勢滿了換過去的那一法會「X勢爆發」（拳勢爆發、掌勢爆發、步勢爆發、腿勢爆發）。
//   爆發都是增益，畫面下方的狀態格看得到（還剩幾秒、幾下）。
// - 拿長棍的時候四法改叫：連棍（拳法）、甩棍（掌法）、跳棍（步法）、怒棍（腿法），效果一樣；爆發叫連勢爆發、甩勢爆發、跳勢爆發、怒勢爆發。
// - 拳法：攻速 +30%。拳勢爆發（從腿法換成拳法時勢滿：勢清空才進入）：5 秒內每一下普攻多揮一下（不再加攻速）；換成別的法照樣有。
// - 掌法：擊退 +100%。掌勢爆發（從拳法換成掌法時勢滿）：強化下一次普攻——範圍 +100%、擊退再 +800%，打中的敵人 6 秒內受到的傷害 +20%；
//   被打飛的敵人撞到牆會暈眩 1.5 秒，你的勢馬上回滿。揮出這一下才用掉勢；揮之前換成別的法，爆發取消、勢留著。
// - 步法：攻速 −25%；每次揮拳往前跨一步（往準心 2 公尺，前面有敵人就停在牠面前）。
//   步勢爆發（從掌法換成步法時勢滿）：強化接下來 3 下普攻——每下傷害 +25%，跨步的距離 3 倍、而且是瞬間到（揮拳的那一刻就閃過去）：
//   準心方向 45 度內有敵人就閃到牠面前；沒有就往準心閃到最遠（也可以拿來逃跑）。3 下打完才清空勢。
//   換成別的法：閃的效果沒了，傷害 +25% 留著（剩幾下照算）。
// - 腿法：攻速 −40%、普攻傷害 +100%、範圍 +30%。腿勢爆發（從步法換成腿法時勢滿：勢馬上歸 0）：
//   下兩次普攻傷害再 ×2（跟其他加成相乘）、範圍 +50%、攻速 +25%、暈眩 1 秒；打倒敵人回 50 勢。換成拳法的時候腿勢爆發直接消失（步勢爆發沒用完的照樣留著）。
// - 路線：拳聖＝拳法攻速再 +15%；棍僧＝腿法範圍 +60%（原本 +30%）、掌法擊退再 +50%；內修者＝勢多 50%；外修者＝步法不減攻速。
// - 傳說：千手＝勢累積快一倍；不動明王棍＝腿法不減攻速。
// 2026-10-09 作者再調整：步法多技能急速 +25；腿法改成攻速 −60%、普攻傷害 +150%、範圍 +35%；腿勢爆發的每一下普攻畫面都會震。
//   二轉「武聖」的被動「四象輪轉」：勢滿了自動換法（爆發還壓著勢的時候不換）；每一法的增益 +25%（攻速、擊退、跨步距離、技能急速、腿法的傷害和範圍；減攻速的照舊）。
// 放在 classcore.js、classcore2.js、buildfx.js 後面。
(function (R) {
  const W = () => R.W, CORE = R.CORE; if (!CORE) return;
  const CT = () => (R.coreTime ? R.coreTime() : performance.now() / 1000);
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z), angTo = (a, b) => Math.atan2(b.x - a.x, b.z - a.z), wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  const adv = P => P.adv || '', leg = P => (R.legOf ? R.legOf(P) : null);
  const say = (P, t, c) => R.num && R.num(P.x, 2.8, P.z, t, c || 'crit');
  const live = () => { const w = W(); return !!(w.run && !w.run.done && w.P && !w.P.dead); };
  const ORDER = ['fist', 'palm', 'step', 'leg'];
  const COL = { fist: '#FF8A5A', palm: '#7AC8FF', step: '#8AE07A', leg: '#E8C04A' };
  const NAME = { fist: '拳法', palm: '掌法', step: '步法', leg: '腿法' }, STAFF = { fist: '連棍', palm: '甩棍', step: '跳棍', leg: '怒棍' };
  const isStaff = P => { const b = P && P.item && P.item.base; return b === 'staffpole' || !!(R.WEAPON_LOOK && R.WEAPON_LOOK[b] === 'staffpole'); };
  const nm = (P, s) => (isStaff(P) ? STAFF : NAME)[s];
  const burstNm = (P, s) => nm(P, s)[0] + '勢爆發';
  const PALM_K = 8, STEP_N = 3, LEG_N = 2, FIST_T = 5, VULN_T = 6;
  // ---------- 攻速、範圍 ----------
  const BO = P => (P && P.adv2 === 'sp' ? 1.25 : 1);   // 武聖「四象輪轉」：每一法的增益 +25%
  const LEG_DMG = 1.5, LEG_RANGE = 0.35, STEP_HASTE = 25;
  // 2026-10-17 作者：基礎被動（passives.js 的 mo4～mo12）
  const pv = (P, k) => !!(P && P.pv && P.pv[k]);
  const CAP = P => 100 + (pv(P, 'mkQixue') ? 25 : 0);                      // 氣血活絡：勢的上限 +25
  const fistUp = P => (pv(P, 'mkLian') ? 0.45 : 0.3);                     // 連斷：拳法攻速 45%
  const legDmg = P => (pv(P, 'mkBen') ? 2.5 : LEG_DMG), legRange = P => (pv(P, 'mkBen') ? 0.4 : LEG_RANGE);   // 奔雷
  const stepHaste = P => (pv(P, 'mkFei') ? 50 : STEP_HASTE);             // 飛燕
  // 收放自如：選了哪幾種法（存在存檔裡；沒有這個被動就四種都用）
  const onList = P => { if (!pv(P, 'mkFree')) return ORDER; const st = R.S && R.S.classes && R.S.classes.monk, on = st && st.mkOn; const L = ORDER.filter((s, i) => !on || on[i] !== false); return L.length ? L : ORDER; };
  const rateOf = P => {
    const s = P._fa || 'fist';
    if (s === 'fist') return 1 + (fistUp(P) + (adv(P) === 'fistsaint' ? 0.15 : 0)) * BO(P) * (pv(P, 'mkLian') && P._fistB && CT() < P._fistB.until ? 4 / 3 : 1);
    if (s === 'step') return adv(P) === 'waixiu' ? 1 : 0.75;
    if (s === 'leg') return (leg(P) === 'lg_immovable' ? 1 : pv(P, 'mkBen') ? 0.3 : 0.4) * (P._legB ? 1.25 : 1);
    return 1;
  };
  const rangeOf = P => {
    const s = P._fa || 'fist';
    if (s === 'leg') return (1 + (legRange(P) + (adv(P) === 'staffmonk' ? 0.3 : 0)) * BO(P)) * (P._legB ? 1.5 : 1);
    if (s === 'palm') return (pv(P, 'mkCun') ? 1.2 : 1) * (P._palmB ? 2 : 1);   // 寸勁：掌法範圍 +20%
    return 1;
  };
  // 把倍率套在武器上（相對的：別的效果乘上去的照樣留著；換武器、重算數值後重新套）
  const apply = P => {
    const ws = P.ws; if (!ws) return;
    if (P._faWs !== ws) { P._faWs = ws; P._faR = 1; P._faG = 1; P._faHb = 0; }
    const r = rateOf(P), g = rangeOf(P);
    // 步法：技能急速（冷卻 × (100＋急速) ÷ (100＋急速＋加的)；換掉就拿回來）
    const hb = (P._fa === 'step' ? stepHaste(P) * BO(P) : 0), H = P.haste || 0;
    if (Math.abs(hb - (P._faHb || 0)) > 1e-4 && P.skillCdMult > 0) { const b0 = P.skillCdMult * (100 + H + (P._faHb || 0)) / (100 + H); P.skillCdMult = b0 * (100 + H) / (100 + H + hb); P._faHb = hb; }
    if (Math.abs(r - P._faR) > 1e-4) { ws.rate *= r / P._faR; P._faR = r; }
    if (Math.abs(g - P._faG) > 1e-4) { ws.range = (ws.range || 2) * g / P._faG; if (ws.arc) ws.arc = Math.min(6.28, ws.arc * g / P._faG); P._faG = g; }
  };
  const gain = (P, n) => { const k = (adv(P) === 'inner' ? 1.5 : 1) * (leg(P) === 'lg_thousand' ? 2 : 1) * (pv(P, 'mkTian') ? 1.4 : 1); P._faEn = Math.min(CAP(P), (P._faEn || 0) + n * k); };   // 天地借勢：勢 +40%
  const baseRange = P => { const wd = P.item && R.WEAPONS[P.item.base]; return (wd && wd.range) || 2; };
  // ---------- 步法：每次揮拳往前跨一步；步勢爆發＝瞬間閃 3 倍距離（45 度內有敵人就到牠面前） ----------
  const stepMove = (P, boosted) => {
    const a = P.aimA != null ? P.aimA : P.yaw, k = Math.max(0.5, ((P.ws && P.ws.range) || 2) / baseRange(P) / rangeOf(P)), far = 2 * k * BO(P) * (boosted ? 3 : 1) * (pv(P, 'mkFei') ? 1.5 : 1), cone = boosted ? Math.PI / 8 : 0.6;
    const tgt = (W().enemies || []).filter(e => !e.dead && !e.under && dist(e, P) < far + (e.def.size || 1) * 0.5 + 0.8 && Math.abs(wrap(angTo(P, e) - a)) < cone).sort((p, q) => dist(p, P) - dist(q, P))[0];
    let len = far, dir = a; if (tgt) { dir = angTo(P, tgt); len = Math.max(0, dist(tgt, P) - (tgt.def.size || 1) * 0.5 - 0.7); }
    if (len < 0.2) return;
    if (boosted) {
      let x = P.x + Math.sin(dir) * len, z = P.z + Math.cos(dir) * len;
      if (R.lineOpen && !R.lineOpen(P.x, P.z, x, z)) { const p = R.openFloorNear ? R.openFloorNear(x, z, [P.x, P.z]) : [P.x, P.z]; x = p[0]; z = p[1]; }
      R.fx && R.fx('blink', P.x, 1, P.z); P.x = x; P.z = z; R.collide(P, 0.42); R.fx && R.fx('blink', P.x, 1, P.z);
      if (tgt) P.aimA = angTo(P, tgt);
    } else if (R.dash) R.dash(a, len, 0.14, {});
  };
  // 2026-10-17 作者：左側框的法加成照被動、路線算（連斷、寸勁、飛燕、奔雷、拳聖、棍僧、外修者、四象輪轉）
  const pc = v => Math.round(v * 1000) / 10;
  const baseTxt = (P, s) => {
    if (s === 'fist') return '攻速 +' + pc((fistUp(P) + (adv(P) === 'fistsaint' ? 0.15 : 0)) * BO(P) * (pv(P, 'mkLian') && P._fistB && CT() < P._fistB.until ? 4 / 3 : 1)) + '%';
    if (s === 'palm') return '擊退 +' + pc(BO(P) + (adv(P) === 'staffmonk' ? 0.5 : 0)) + '%' + (pv(P, 'mkCun') ? '、傷害 +20%、範圍 +20%' : '');
    if (s === 'step') return (adv(P) === 'waixiu' ? '' : '攻速 −25%、') + '每次揮拳往前跨一步（' + Math.round(2 * BO(P) * (pv(P, 'mkFei') ? 1.5 : 1) * 10) / 10 + ' 公尺）、技能急速 +' + Math.round(stepHaste(P) * BO(P) * 10) / 10;
    const slow = leg(P) === 'lg_immovable' ? 0 : pv(P, 'mkBen') ? 70 : 60;
    return (slow ? '攻速 −' + slow + '%、' : '') + '傷害 +' + pc(legDmg(P) * BO(P)) + '%、範圍 +' + pc((legRange(P) + (adv(P) === 'staffmonk' ? 0.3 : 0)) * BO(P)) + '%';
  };
  CORE.monk = {
    name: '四法', col: '#FFB45A',
    help: P => {
      const n = s => nm(P, s), b = s => burstNm(P, s);
      return 'X 換「法」（' + ORDER.map(n).join(' → ') + '），可以頻繁切換接招，也可以一直用同一種。'
        + n('fist') + '：攻速 +30%；' + n('palm') + '：擊退 +100%；' + n('step') + '：攻速 −25%、技能急速 +25，每次揮拳往前跨一步（往準心 2 公尺，前面有敵人就停在牠面前）；' + n('leg') + '：攻速 −60%、普攻傷害 +150%、範圍 +35%。'
        + '每次普攻打中 +10「勢」；勢滿了換「法」，換過去的那一法會爆發（都是增益，畫面下方看得到）：'
        + b('palm') + '（' + n('fist') + '→' + n('palm') + '）下一次普攻範圍 +100%、擊退 +800%，打中的敵人 6 秒內受到的傷害 +20%，撞牆暈眩、勢馬上回滿（揮出這一下才用掉勢）；'
        + b('step') + '（' + n('palm') + '→' + n('step') + '）接下來 3 下傷害 +25%，跨步 3 倍距離、瞬間閃到準心 45 度內的敵人面前（沒有就閃到最遠），換別的法閃的效果沒了、傷害照算，3 下打完才清空勢；'
        + b('leg') + '（' + n('step') + '→' + n('leg') + '，勢馬上歸 0）下兩次普攻傷害 ×2、範圍 +50%、攻速 +25%、暈眩 1 秒、每一下畫面都會震，打倒敵人回 50 勢，換成' + n('fist') + '就消失；'
        + b('fist') + '（' + n('leg') + '→' + n('fist') + '，勢清空）5 秒內每一下普攻多揮一下，換別的法也有。'
        + ({ fistsaint: '拳聖：' + n('fist') + '攻速再 +15%。', staffmonk: '棍僧：' + n('leg') + '範圍再 +30%、' + n('palm') + '擊退再 +50%。', inner: '內修者：勢多 50%。', waixiu: '外修者：' + n('step') + '不減攻速。' }[adv(P)] || '')
        + (P && P.adv2 === 'sp' ? '武聖「四象輪轉」：勢滿了自動換法；每一法的增益 +25%（減攻速的不變）。' : '');
    },
    floor: P => { P._fa = P._fa || 'fist'; apply(P); },
    step(dt, P) {
      P._fa = P._fa || 'fist'; apply(P);
      if (pv(P, 'mkTian')) P._faEn = Math.min(CAP(P), (P._faEn || 0) + 5 * dt);   // 天地借勢：每秒 +5
      if (P._mkPend) { const I = R.input || { keys: {} }; if (!I.keys.x) { P._mkPend = 0; doAct(P); } else if (CT() - P._mkPend > 0.35) { P._mkPend = 0; freePanel(P); } }   // 收放自如：按一下＝換法，按住＝選單
      // 武聖「四象輪轉」：勢滿了自動換法（掌勢爆發還沒揮出去、步勢爆發還壓著勢的時候不換）
      if (P.adv2 === 'sp' && (P._faEn || 0) >= CAP(P) && !P._palmB && !(P._stepB && P._stepB.held) && CT() - (P._faSw || 0) > 0.6) doAct(P);
      if (P._fistB && CT() >= P._fistB.until) P._fistB = null;
      // 掌勢爆發打飛的敵人：撞牆 → 暈眩、勢回滿
      (W().enemies || []).forEach(e => {
        if (!e._palmT || e.dead) return; if (CT() > e._palmT) { e._palmT = 0; return; }
        const sp = Math.hypot(e.kx || 0, e.kz || 0); if (sp < 1) return;
        const ux = e.kx / sp, uz = e.kz / sp, r = (e.def.size || 1) * 0.5 + 0.35, x = e.x + ux * r, z = e.z + uz * r;
        const wall = (R.isFloor && !R.isFloor(x, z)) || (R.pointBlocked && R.pointBlocked(x, z));
        if (wall) { e._palmT = 0; e.kx = e.kz = 0; e.st.stun = Math.max(e.st.stun || 0, 1.5 + (pv(P, 'mkDian') ? 1 : 0)); P._faEn = CAP(P); say(e, '撞牆！', 'crit'); say(P, '勢 回滿', 'heal'); R.shake && R.shake(0.22); R.fx && R.fx('ring', e.x, 0.3, e.z, { r: 1.2, color: COL.palm }); }
      });
    },
    // 每一下普攻：傷害、擊退、強化
    mod(e, raw, o, P) {
      if (!o.primary || o.reflect) return raw;
      const s = P._fa || 'fist';
      let r = raw, o2 = o;
      if (s === 'leg') r *= 1 + legDmg(P) * BO(P);
      if (P._stepB && P._stepB.n > 0) r *= 1 + (pv(P, 'mkFei') ? 0.3 * (s === 'step' ? 1 : 0.5) : 0.25);   // 飛燕：30%（換別的法剩一半）
      if (s === 'palm' && pv(P, 'mkCun')) r *= 1.2;   // 寸勁：掌法傷害 +20%                                             // 步勢爆發：傷害 +25%（換法也算）
      if (s === 'palm') {
        const cun = P._palmB && pv(P, 'mkCun'), ws = P.ws || {}, kb0 = o.kb != null ? o.kb : ws.kb || 1, up = BO(P) + (adv(P) === 'staffmonk' ? 0.5 : 0) + (P._palmB && !cun ? PALM_K : 0);
        o2 = Object.assign({}, o, { kb: cun ? 0 : kb0 * (1 + up) });
        if (cun) e._cunMark = CT();   // 寸勁第一段：打中的敵人等一下拍到正中間
        else if (P._palmB) { e._palmT = CT() + 1.2; e._palmVuln = CT() + VULN_T; }
      }
      if (s === 'leg' && P._legB) { r *= 2; o2 = Object.assign({}, o2, { stun: Math.max(o2.stun || 0, 1) }); e._legMark = CT();
        if (pv(P, 'mkBen')) { o2 = Object.assign({}, o2, { crit: true }); r *= 1 + Math.min(0.25, ((P.ws && P.ws.crit) || 0) * 0.5); } }   // 奔雷：必定暴擊，每 1% 暴擊率 +0.5%（最多 25%）
      if (pv(P, 'mkDian')) { if (o2.stun > 0) o2 = Object.assign({}, o2, { stun: o2.stun + 1 }); else if (Math.random() < 0.15) o2 = Object.assign({}, o2, { stun: 1 }); }   // 點穴
      P._faHitT = CT();
      return o2 === o ? r : { raw: r, o: o2 };
    },
    act(P, rl) {
      if (typeof rl === 'function' && pv(P, 'mkFree') && W().run) { if (!P._mkPend) P._mkPend = CT() || 1e-6; return; }   // 收放自如：先看是按一下還是按住（step 裡判斷）
      return doAct(P);
    },
    act0(P) {
      if (CT() - (P._faSw || 0) < 0.2) return; P._faSw = CT();
      const on = onList(P), from = P._fa || 'fist', full = (P._faEn || 0) >= CAP(P);
      const same = on.length === 1 && on[0] === from;   // 只剩這一種法：不換，只觸發爆發
      let next = from; if (!same) { for (let i = 1; i <= 4; i++) { const c = ORDER[(ORDER.indexOf(from) + i) % 4]; if (on.includes(c)) { next = c; break; } } }
      if (same && !full) { say(P, nm(P, from) + '（只用這一法）', 'heal'); return; }
      if (from === 'leg') P._legB = null;            // 腿勢爆發：換成拳法直接消失
      if (from === 'palm') P._palmB = false;         // 掌勢爆發還沒揮出去就換：取消（勢留著）
      P._fa = next;
      let burst = false;
      if (full) {
        burst = true;
        if (next === 'palm') P._palmB = true;
        else if (next === 'step') P._stepB = { n: STEP_N, held: true };
        else if (next === 'leg') { P._legB = { n: LEG_N }; P._faEn = 0; if (P._stepB) P._stepB.held = false; }
        else { P._fistB = { until: CT() + FIST_T }; P._faEn = 0; if (P._stepB) P._stepB.held = false; }
      }
      apply(P);
      if (burst && !same && pv(P, 'mkQixue') && R.healP) R.healP(P.hpMax * 0.01, true);   // 氣血活絡：真的換了法才回血
      if (burst) { say(P, burstNm(P, next), 'crit'); R.fx && R.fx('ring', P.x, 0.2, P.z, { r: 2.2, color: COL[next] }); R.fx && R.fx('pillar', P.x, 0, P.z, { r: 0.9, color: COL[next] }); }
      else say(P, nm(P, next), 'heal');
    },
    gauge(P) {
      const s = P._fa || 'fist', en = Math.round(P._faEn || 0), next = ORDER[(ORDER.indexOf(s) + 1) % ORDER.length];
      const on = [P._fistB && burstNm(P, 'fist'), P._palmB && burstNm(P, 'palm'), P._stepB && burstNm(P, 'step'), P._legB && burstNm(P, 'leg')].filter(Boolean);
      return { name: nm(P, s), col: COL[s], v: en, max: CAP(P), full: en >= CAP(P), text: '勢 ' + en + '／' + CAP(P), sub: baseTxt(P, s) + (on.length ? '・' + on.join('、') : ''), x: en >= CAP(P) ? '換法（' + burstNm(P, next) + '）' : '換法' };
    }
  };
  const doAct = P => CORE.monk.act0(P);
  // ---------- 收放自如：按住職業鍵打開的選單（選要用哪幾種法，順序不能換，至少留一種） ----------
  const freePanel = P => {
    if (document.getElementById('mk-free')) return; const st = R.S && R.S.classes && R.S.classes.monk; if (!st) return;
    st.mkOn = st.mkOn || [true, true, true, true]; const w = W(), was = w.paused; w.paused = true;
    const box = document.createElement('div'); box.id = 'mk-free';
    const draw = () => { const n = st.mkOn.filter(Boolean).length; box.innerHTML = '<div class="mkf-card"><h3>收放自如</h3><p>選要用哪幾種法（順序固定，至少留一種）。只留一種的時候，按職業鍵只觸發那一法的爆發。</p><div class="mkf-row">'
      + ORDER.map((s, i) => '<button type="button" class="mkf-b' + (st.mkOn[i] ? ' on' : '') + '" data-i="' + i + '" style="--c:' + COL[s] + '"' + (st.mkOn[i] && n <= 1 ? ' disabled' : '') + '><b>' + nm(P, s) + '</b><small>' + (st.mkOn[i] ? '使用中' : '不用') + '</small></button>' + (i < 3 ? '<i>→</i>' : '')).join('') + '</div><button type="button" class="mkf-x">完成</button></div>';
      box.querySelectorAll('.mkf-b').forEach(b => { b.onclick = () => { const i = +b.dataset.i; if (st.mkOn[i] && st.mkOn.filter(Boolean).length <= 1) return; st.mkOn[i] = !st.mkOn[i]; if (!st.mkOn[ORDER.indexOf(P._fa || 'fist')]) { P._fa = onList(P)[0]; P._palmB = false; P._legB = null; apply(P); } R.save && R.save(); draw(); }; });
      box.querySelector('.mkf-x').onclick = close; };
    const close = () => { box.remove(); w.paused = was; document.removeEventListener('keydown', esc, true); };
    const esc = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    document.addEventListener('keydown', esc, true); draw(); document.body.appendChild(box);
  };
  { const css = document.createElement('style'); css.textContent = '#mk-free{position:fixed;inset:0;z-index:60;display:grid;place-items:center;background:rgba(10,8,6,.55)}.mkf-card{background:var(--bg,#1E1A17);border:1px solid var(--line,#3A322B);border-radius:10px;padding:16px 18px;max-width:min(560px,92vw);display:grid;gap:10px;color:inherit}.mkf-card h3{margin:0}.mkf-card p{margin:0;font-size:13px;opacity:.8}.mkf-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.mkf-row i{opacity:.5;font-style:normal}.mkf-b{display:grid;gap:2px;min-width:84px;padding:8px 10px;border-radius:8px;border:2px solid var(--c);background:transparent;color:inherit;font:inherit;cursor:pointer;opacity:.45}.mkf-b.on{opacity:1;background:color-mix(in srgb,var(--c) 18%,transparent)}.mkf-b b{color:var(--c)}.mkf-b small{font-size:11px;opacity:.8}.mkf-b:disabled{cursor:not-allowed}.mkf-x{justify-self:end;padding:6px 16px;border-radius:6px;border:1px solid var(--line,#3A322B);background:var(--bg2,#2A2420);color:inherit;font:inherit;cursor:pointer}'; document.head.appendChild(css); }
  // ---------- 普攻真的出手了（攻擊冷卻變長）：步法跨步、掌勢爆發用掉勢、拳勢爆發多揮一下、算勢 ----------
  const at0 = R.attack;
  if (at0) R.attack = (...a) => {
    const P = W().P, mk = P && P.cls === 'monk' && live() && CORE.monk;
    const c0 = P ? P.atkCd || 0 : 0, h0 = P ? P._faHitT || 0 : 0, r = at0(...a);
    if (!mk || (P.atkCd || 0) <= c0 + 0.01) return r;
    const s = P._fa || 'fist', palm = s === 'palm' && P._palmB, step = P._stepB && P._stepB.n > 0, legB = s === 'leg' && P._legB;
    const cun = palm && pv(P, 'mkCun'), t0 = CT() - 0.05, rng = (P.ws && P.ws.range) || 2, aim = P.aimA != null ? P.aimA : P.yaw;
    if (s === 'step') stepMove(P, step);                           // 步勢爆發的瞬間閃只在步法
    if (palm) P._faEn = 0;                                         // 揮出掌勢爆發的那一下就用掉勢（撞牆回滿在這之後）
    if (legB && R.shake) R.shake(0.28);                             // 腿勢爆發：每一下都震
    if (P._fistB && CT() < P._fistB.until) setTimeout(() => {      // 拳勢爆發：多揮一下
      if (!live() || W().P !== P) return; const rem = P.atkCd || 0; P.atkCd = 0; P._faExtra = 1;
      try { at0(...a); } finally { P._faExtra = 0; P.atkCd = rem; }
    }, 120);
    setTimeout(() => {   // 這一下的傷害結算完（近戰有一點延遲）再算勢、用掉強化
      if (!live() || W().P !== P) return;
      const hit = (P._faHitT || 0) > h0;
      if (palm) { P._palmB = false; apply(P); }
      if (cun) cunPalm(P, t0, rng, aim);   // 寸勁：拍到正中間，0.3 秒後第二掌
      if (step && pv(P, 'mkFei')) { const red = s === 'step' ? 1 : 0.5; P.skillCd = Math.max(0, (P.skillCd || 0) - red); if (P.skCd) P.skCd = P.skCd.map(c => Math.max(0, (c || 0) - red)); }   // 飛燕：步勢爆發每一下技能冷卻 −1 秒
      const held = !!(P._stepB && P._stepB.held);                  // 步勢爆發還壓著勢：這幾下（含最後一下）不加勢
      if (step && P._stepB) { P._stepB.n--; if (P._stepB.n <= 0) { if (P._stepB.held) P._faEn = 0; P._stepB = null; } }
      if (legB && P._legB) { P._legB.n--; if (P._legB.n <= 0) P._legB = null; apply(P); }
      if (hit && !held) gain(P, 10);
    }, 260);
    return r;
  };
  // ---------- 寸勁的掌勢爆發：第一段把打中的敵人拍到攻擊範圍正中間；0.3 秒後第二掌打出往前推進的掌氣 ----------
  const wallAt = (x, z) => (R.isFloor && !R.isFloor(x, z)) || (R.pointBlocked && R.pointBlocked(x, z));
  const cunPalm = (P, t0, rng, a) => {
    const sx = Math.sin(a), sz = Math.cos(a), cx = P.x + sx * rng * 0.5, cz = P.z + sz * rng * 0.5;
    (W().enemies || []).forEach(e => { if (e.dead || !(e._cunMark >= t0)) return; const p = R.nearestFloor ? R.nearestFloor(cx + (Math.random() - 0.5) * 0.6, cz + (Math.random() - 0.5) * 0.6) : [cx, cz]; e.x = p[0]; e.z = p[1]; e.kx = e.kz = 0; });
    R.fx && R.fx('ring', cx, 0.2, cz, { r: rng * 0.5, color: COL.palm }); say(P, '寸勁', 'crit');
    setTimeout(() => {
      if (!live() || W().P !== P) return;
      const w = W(), run = w.run, len = 1.1 * rng, half = 0.5 * ((P.ws && P.ws.range) || 2) / baseRange(P), dmg = ((P.ws && P.ws.dmg) || 10) * 1.2, carried = new Set();
      let d = 0, x = P.x, z = P.z, tick = 0; R.shake && R.shake(0.2);
      const hitWall = () => { carried.forEach(e => { if (e.dead) return; e.st.stun = Math.max(e.st.stun || 0, 1.5 + (pv(P, 'mkDian') ? 1 : 0)); e._cunVuln = CT() + VULN_T; say(e, '撞牆！', 'crit'); });
        if (carried.size) { P._faEn = CAP(P); say(P, '勢 回滿', 'heal'); } R.fx && R.fx('boom', x, 0.6, z, { r: 1.4, color: COL.palm }); R.shake && R.shake(0.3); };
      w.dyn.push(dt => {
        if (W().run !== run || P.dead) return false;
        const step = Math.min(len - d, dt * len / 0.45), nx = x + sx * step, nz = z + sz * step;
        let ahead = 0.5; carried.forEach(e => { if (!e.dead) ahead = Math.max(ahead, 0.6 + (e.def.size || 1)); });   // 被推著走的敵人前緣碰到牆就算撞牆（不會把敵人塞進牆裡）
        if (wallAt(nx + sx * ahead, nz + sz * ahead)) { hitWall(); return false; }   // 撞到牆：掌氣消失
        x = nx; z = nz; d += step;
        (w.enemies || []).forEach(e => { if (e.dead || e.under || carried.has(e)) return; const ex = e.x - x, ez = e.z - z, along = ex * sx + ez * sz, side = Math.abs(ex * sz - ez * sx), r = (e.def.size || 1) * 0.5;
          if (Math.abs(along) < 0.6 + r && side < half + r) { carried.add(e); R.hurtEnemy(e, dmg, { kb: 0, primary: false }); gain(P, 35); } });   // 碰到一隻回 35 勢
        carried.forEach(e => { if (e.dead) return; const r = (e.def.size || 1) * 0.5; e.x = x + sx * (0.4 + r); e.z = z + sz * (0.4 + r); e.kx = e.kz = 0; });
        tick -= dt; if (tick <= 0) { tick = 0.06; R.fx && R.fx('ring', x, 0.5, z, { r: half, color: COL.palm }); }
        return d < len - 1e-3;
      });
    }, 300);
  };
  // 掌勢爆發打中的敵人：受到的傷害 +20%；寸勁的掌氣撞牆：+25%
  const he0 = R.hurtEnemy;
  R.hurtEnemy = (e, raw, o) => { if (!e || e.dead || (o && o.reflect)) return he0(e, raw, o); const k = (e._palmVuln > CT() ? 1.2 : 1) * (e._cunVuln > CT() ? 1.25 : 1); return he0(e, raw * k, o); };
  // 腿勢爆發打倒敵人：回 50 勢
  const ke0 = R.killEnemy;
  if (ke0) R.killEnemy = (e, by) => { const was = e && !e.dead, r = ke0(e, by), P = W().P; if (was && e && e._legMark && CT() - e._legMark < 0.6 && P && P.cls === 'monk' && !e.fake) { gain(P, 50); say(P, '勢 +50', 'heal'); } return r; };
  // ---------- 狀態格（畫面下方的小方格） ----------
  (R.STATUS_EXTRA = R.STATUS_EXTRA || []).push((P, run, add) => {
    if (!P || P.cls !== 'monk') return;
    if (P._fistB) { const t = P._fistB.until - CT(); if (t > 0) add('mk-fist', burstNm(P, 'fist'), 'flame', COL.fist, ['每一下普攻多揮一下（換別的法也有）'].concat(pv(P, 'mkLian') ? ['連斷：拳法的攻速加成再 +33.3%'] : []), t, FIST_T, false); }
    if (P._palmB && P._fa === 'palm') add('mk-palm', burstNm(P, 'palm'), 'swirl', COL.palm, (pv(P, 'mkCun') ? ['寸勁：下一次普攻範圍 +100%，把打中的敵人拍到正中間', '0.3 秒後第二掌：掌氣推著敵人往前，撞牆暈眩 ' + (pv(P, 'mkDian') ? 2.5 : 1.5) + ' 秒、受到的傷害 +25%', '掌氣碰到一隻回 35 勢，撞牆勢回滿'] : ['下一次普攻：範圍 +100%、擊退 +800%', '打中的敵人 6 秒內受到的傷害 +20%', '撞到牆：暈眩 ' + (pv(P, 'mkDian') ? 2.5 : 1.5) + ' 秒、勢馬上回滿']).concat(['揮出去才用掉勢；換別的法就取消']), null, null, false);
    if (P._stepB) add('mk-step', burstNm(P, 'step'), 'speed', COL.step, ['普攻傷害 +' + (pv(P, 'mkFei') ? (P._fa === 'step' ? 30 : 15) : 25) + '%' + (pv(P, 'mkFei') ? '、每一下技能冷卻 −' + (P._fa === 'step' ? 1 : 0.5) + ' 秒' : '')].concat(P._fa === 'step' ? ['揮拳時瞬間閃 3 倍距離：準心 45 度內有敵人就到牠面前，沒有就閃到最遠'] : ['（換成別的法：閃的效果沒了，傷害照算）']), null, null, false);
    if (P._legB && P._fa === 'leg') add('mk-leg', burstNm(P, 'leg'), 'spark', COL.leg, ['傷害再 ×2、範圍 +50%、攻速 +25%、暈眩 ' + (pv(P, 'mkDian') ? 2 : 1) + ' 秒' + (pv(P, 'mkBen') ? '、必定暴擊（暴擊率每 1% 傷害 +0.5%，最多 25%）' : '') + '（每一下畫面都會震）', '打倒敵人回 50 勢', '換成' + nm(P, 'fist') + '就消失'], null, null, false);
  });
  // 傳說武器的說明
  (R.LEGENDS || []).forEach(l => { if (l.id === 'lg_thousand') l.desc = '「四法」的勢累積快一倍。'; if (l.id === 'lg_immovable') l.desc = '腿法（怒棍）不減攻速。'; });
  R.monkDebug = { apply, stepMove, isStaff, nm, burstNm };
})(window.R);
