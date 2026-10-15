// 職業的核心玩法（作者 2026-10-05：我要有趣又好玩、多樣性的職業——十三個職業的核心玩法一次做）
// 每個職業一個別人沒有的機制，三、四條轉職路線各自把它往不同方向改；X 鍵（原本的「換彈」）變成「職業鍵」。
// 這個檔：共用的部分（R.CORE 登記、X 鍵、包 R.hurtEnemy／R.hurtPlayer／R.castSlot／R.step、職業量表）
//   ＋戰士、術士、槍手、弓箭手、刀客、騎士、武術家。牧師、吟遊詩人、召喚師、術陣師、附魔師、符卷師在 classcore2.js。
// 職業量表：生命圓表的上面一條（名字、數值、狀態、X 做什麼），滑鼠放上去看完整說明。
// - 戰士「怒氣」：魔力換成怒氣（0～100），打中、被打都會漲，技能吃怒氣，不打會慢慢掉；X（50 以上）怒吼：把怒氣全部吼出去，越多越痛、之後 6 秒傷害提高。
//   狂戰士：怒氣不會掉、殘血時被打漲兩倍；劍鬥士：6 秒內放三種不同的技能，下一下普攻變「終幕」（4 倍範圍）；
//   鬼武者：怒吼時戴上鬼面（扣 10% 生命，6 秒傷害 +30%、吸血系數 +100）；內修者：站著不動每秒 +8 怒氣。
// - 術士「元素反應」：X 換元素（火、冰、雷），之後的攻擊、法術都帶著這個元素；同一隻遺跡生物身上疊到不同元素就引爆：
//   火＋冰＝蒸發（大傷害）、冰＋雷＝碎冰（暈眩＋小範圍）、雷＋火＝過載（大範圍爆炸）。元素師反應 ×1.5；咒術師反應順便詛咒周圍；式神使、外修者反應回魔力。
// - 槍手「彈種＋完美換彈」：換彈的時候再按一次 X，按在中間那一格＝完美換彈（馬上換好、這一匣 +25%），按錯會卡彈；
//   彈匣滿的時候按 X 換彈種：一般→穿甲（對有甲的 +30%）→燃燒→冰凍。狙擊手打背後、暈住的 ×1.5；魔導槍手彈種效果兩倍；爆破手燃燒彈打倒的會炸開。
// - 弓箭手「完美蓄力」：X 拉滿弓，圈縮到金色那一格時再按 X＝完美射擊（四倍、貫穿全部、必定暴擊、疊一層鷹眼：每層 +6%、最多 5 層、被打就沒了）；
//   沒抓到就是普通的兩倍箭。魔弓手完美箭分成三支追蹤；遊俠在準心處放一個捕獸夾；破魔弓手射中的留破魔印（8 秒，你的傷害 +20%）。
// - 刀客（2026-10-13 重製）：X 收刀／拔刀（各讀 2 秒）、刀意、居合、殘心、刀意渾圓、反切；普攻先衝再砍（橫斬／直劈／突刺）。細節見下面刀客那段。
// - 騎士「格擋」：（2026-10-13 改成按住 X）按住 Z 防禦的頭 0.3 秒被打＝完美格擋（不受傷、對方暈 1.5 秒、盾反擊、回體力）；防禦時身邊的隊友受到的傷害 −40%；
//   X 盾擊往前衝（完美格擋後 2 秒內＝反制，三倍）。殿堂騎士完美格擋把傷害整個彈回去；聖騎士完美格擋回 8% 生命；龍騎士完美格擋後的盾擊變成龍躍。
// - 武術家「連段」：打中就疊連段，2.5 秒沒打中或被打（掉超過 2% 生命）就斷；每 5 段普攻 +1%（最多 +20%）；
//   X（10 段以上）終結技：前方一大掌，連段越多越痛。拳聖連段上限 150、不容易斷；棍僧終結技是一圈；內修者站著不動連段不會掉；外修者魔力罩擋下的不會斷。
// 放在 skillbook.js、stamina.js、talentcap.js 後面、dmgmeter.js 前面（index.html 後段）。
(function (R) {
  const W = () => R.W, rnd = Math.random, $ = id => document.getElementById(id), esc = s => R.esc(s);
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z), angTo = (a, b) => Math.atan2(b.x - a.x, b.z - a.z), wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  const CORE = R.CORE = R.CORE || {};
  let CT = 0;   // 遊戲時間（暫停不算）
  R.coreTime = () => CT;
  const pw = P => (R.SKILL_KIT && R.SKILL_KIT.power && P.ws ? R.SKILL_KIT.power(P.ws) : 20);
  const adv = P => P.adv || '';
  const live = () => { const w = W(); return !!(w.run && !w.run.done && w.P && !w.P.dead); };
  const coreOf = P => (P && live() ? CORE[P.cls] || null : null);
  const toast = (t, c) => R.toast && R.toast(t, c || '#FFE08A');
  const say = (P, t, c) => R.num && R.num(P.x, 2.8, P.z, t, c || 'crit');
  const front = (P, r, arc) => (W().enemies || []).filter(e => !e.dead && !e.under && dist(e, P) < r + e.def.size * 0.5 && (arc >= 6.2 || Math.abs(wrap(angTo(P, e) - P.aimA)) < arc / 2));
  R.coreKit = { W, pw, adv, live, toast, say, front, dist, angTo, wrap, rnd, CT: () => CT };

  // ---------- 共用的掛鉤 ----------
  let depth = 0;   // 職業效果自己打出去的傷害不再觸發職業效果
  const he0 = R.hurtEnemy;
  R.hurtEnemy = (e, raw, o) => {
    const P = W().P, c = depth ? null : coreOf(P);
    if (!c || !e || e.dead) return he0(e, raw, o);
    o = o || {};
    depth++;
    try {
      if (c.mod) { const r2 = c.mod(e, raw, o, P); if (typeof r2 === 'number') raw = r2; else if (r2 && typeof r2 === 'object') { raw = r2.raw; o = r2.o || o; } }
      const h0 = e.hp, r = he0(e, raw, o), dealt = Math.max(0, h0 - Math.max(0, e.hp));
      if (c.onHit) try { c.onHit(e, dealt, o, P, e.dead); } catch (err) { console.warn('[classcore]', err); }
      return r;
    } finally { depth--; }
  };
  R.coreHit = (e, raw, o) => { depth++; try { return R.hurtEnemy(e, raw, o); } finally { depth--; } };   // 職業效果的傷害（走完整的傷害流程，但不再觸發職業效果）
  R.coreAoe = (x, z, r, dmg, o) => { depth++; try { return R.aoe(x, z, r, dmg, o); } finally { depth--; } };
  const hp0 = R.hurtPlayer;
  R.hurtPlayer = (raw, src, o) => {
    const P = W().P, c = coreOf(P);
    if (!c) return hp0(raw, src, o);
    if (c.onHurt) { const v = c.onHurt(raw, src, o || {}, P); if (v === false) return; if (typeof v === 'number') raw = v; }
    const h0 = P.hp + (P.shield || 0), r = hp0(raw, src, o), took = h0 - (P.hp + (P.shield || 0));
    if (c.afterHurt && took > 0) try { c.afterHurt(took, src, P); } catch (err) { console.warn('[classcore]', err); }
    return r;
  };
  // 放技能：冷卻有變長＝放出去了
  const cdOf = (P, i) => (i === 0 ? P.skillCd || 0 : (P.skCd && P.skCd[i]) || 0);
  const wrapCast = (f, slotOf) => (...a) => {
    const P = W().P, c = coreOf(P); if (!c || !c.onCast || !P) return f(...a);
    const i = slotOf(a), c0 = cdOf(P, i), r = f(...a);
    if (cdOf(P, i) > c0 + 0.01) { const id = i === 0 ? P.skill : R.slotSkill ? R.slotSkill(P, i) : null; try { c.onCast(P, i, id, R.SKILLS[id]); } catch (err) { console.warn('[classcore]', err); } }
    return r;
  };
  if (R.castSlot) R.castSlot = wrapCast(R.castSlot, a => a[0] || 0);
  if (R.useSkill) R.useSkill = wrapCast(R.useSkill, () => 0);
  // X：職業鍵（槍手照舊換彈，另外多完美換彈、換彈種）
  const rl0 = R.reload;
  R.reload = (...a) => {
    const P = W().P, c = coreOf(P);
    if (c && c.act) return c.act(P, () => rl0(...a));
    return rl0(...a);
  };
  R.classAction = () => R.reload();
  // 能力值（戰士的魔力上限＝怒氣 100）
  const cp0 = R.calcPlayer;
  R.calcPlayer = cls => { const P = cp0(cls), c = CORE[cls]; if (c && c.calc) try { c.calc(P); } catch (e) { } return P; };
  const lf0 = R.loadFloor;
  R.loadFloor = (...a) => { const r = lf0(...a); const P = W().P, c = coreOf(P); if (c && c.floor) try { c.floor(P); } catch (e) { } return r; };
  let uiT = 0;
  const st0 = R.step;
  R.step = dt => {
    const r = st0(dt), w = W();
    if (!w.paused) CT += dt;
    try { const P = w.P, c = coreOf(P); if (c && c.step && !w.paused) c.step(dt, P); uiT -= dt; if (uiT <= 0) { uiT = 0.1; render(); } } catch (e) { console.warn('[classcore]', e); }
    return r;
  };

  // ---------- 職業量表 ----------
  const css = document.createElement('style');
  css.textContent = '#core-g{position:fixed;z-index:6;width:236px;padding:4px 7px 5px;border-radius:7px;background:rgba(16,12,20,.86);border:1px solid var(--cc,#6A5A70);color:#EDE6DA;font-size:11.5px;pointer-events:auto;cursor:help}'
    + '#core-g .cg-h{display:flex;justify-content:space-between;gap:6px}#core-g .cg-h b{color:var(--cc);font-size:12px}#core-g .cg-h span{color:#C8C0B0;font-variant-numeric:tabular-nums}'
    + '#core-g .cg-bar{position:relative;height:7px;margin-top:3px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden}#core-g .cg-bar i{position:absolute;left:0;top:0;bottom:0;background:var(--cc)}#core-g .cg-bar em{position:absolute;top:0;bottom:0;background:rgba(255,230,140,.55)}'
    + '#core-g .cg-x{margin-top:3px;color:#A89CA8;font-size:10.5px;display:flex;flex-wrap:wrap;justify-content:space-between;gap:1px 12px}#core-g .cg-x span,#core-g .cg-x b{white-space:nowrap}#core-g .cg-x b{color:#FFE08A;font-weight:600;margin-left:auto}#core-g.full{box-shadow:0 0 10px -2px var(--cc)}';
  document.head.appendChild(css);
  let g = null;
  const render = () => {
    const P = W().P, c = coreOf(P);
    if (!g || !g.isConnected) { const host = $('run'); if (!host) return; g = document.createElement('div'); g.id = 'core-g'; g.className = 'dungeon-only'; host.appendChild(g); }
    if (!c || !c.gauge) { g.hidden = true; return; }
    const hp = $('h2-hp'), r0 = hp && hp.getBoundingClientRect();
    if (!r0 || !r0.width) { g.hidden = true; return; }
    const bl = $('r-bl'), r1 = bl && bl.getBoundingClientRect();
    g.hidden = false;
    const left = Math.max(6, Math.round(Math.min(r0.left - 4, r1 && r1.height ? r1.left : 1e9))), gw = g.offsetWidth || 236;
    // 2026-10-05 作者：量表還是黏在角色卡上——以前只看「角色卡有沒有碰到生命球」才決定要不要往上放，
    // 但量表本身是對齊角色卡的左邊放的，窄螢幕角色卡縮成 178px 碰不到生命球，量表就被放在生命球的高度、壓住角色卡的上半。
    // 改成：用量表自己會佔的左右範圍，去比對生命球、角色卡、隊友列（貼在角色卡上面那條），碰得到的都要放在它們上面，再留 8px 空隙。
    const pt = $('r-party'), r2 = pt && !pt.hidden && pt.classList.contains('hf-dock') ? pt.getBoundingClientRect() : null;
    let top = r0.top;
    [r1, r2].forEach(r => { if (r && r.height && r.left < left + gw && r.right > left) top = Math.min(top, r.top); });
    g.style.left = left + 'px'; g.style.bottom = Math.round(innerHeight - top + 8) + 'px';
    const s = c.gauge(P) || {}, col = s.col || c.col || '#C8A86A';
    g.style.setProperty('--cc', col); g.classList.toggle('full', !!s.full);
    const tip = (c.help ? c.help(P) : '') || '';
    if (g.title !== tip) g.title = tip;
    const pct = s.max ? Math.max(0, Math.min(1, s.v / s.max)) : 0;
    const html = '<div class="cg-h"><b>' + esc(s.name || c.name) + '</b><span>' + esc(s.text != null ? s.text : Math.floor(s.v || 0) + (s.max ? '／' + s.max : '')) + '</span></div>'
      + (s.max ? '<div class="cg-bar"><i style="width:' + (pct * 100).toFixed(1) + '%"></i>' + (s.zone ? '<em style="left:' + (s.zone[0] * 100) + '%;width:' + ((s.zone[1] - s.zone[0]) * 100) + '%"></em>' : '') + '</div>' : '')
      + '<div class="cg-x"><span>' + esc(s.sub || '') + '</span><b>' + esc(s.x ? 'X：' + s.x : '') + '</b></div>';
    if (g.innerHTML !== html) g.innerHTML = html;
  };

  // ======================= 戰士：怒氣 =======================
  CORE.warrior = {
    name: '怒氣', col: '#E8503A',
    // 2026-10-15 作者：怒氣條就是大招條——怒氣 100 才能放大招（放了怒氣歸零）；技能不再吃怒氣；怒氣滿的時候受到的傷害 −20%。
    help: P => '怒氣（取代魔力）：打中、被打都會漲，4 秒沒打沒被打就慢慢掉。怒氣滿 100 才能放大招（放了歸零），滿的時候受到的傷害 −20%；技能不吃怒氣。X：怒氣 50 以上時怒吼（全部吼出去，越多越痛，之後 6 秒傷害提高）。'
      + ({ berserker: '狂戰士：怒氣不會掉，生命三成以下被打漲兩倍。', gladiator: '劍鬥士：6 秒內放三種不同的技能，下一下普攻變「終幕」（4 倍、範圍）。', onimusha: '鬼武者：怒吼時戴上鬼面（扣 10% 生命，6 秒傷害 +30%、吸血系數 +100）。', inner: '內修者：站著不動每秒 +8 怒氣。' }[adv(P)] || ''),
    calc: P => { P.mpMax = 100; },
    floor: P => { P._rage = 30; P.mp = 30; P._rageT = CT; },
    add(P, n) { P._rage = Math.min(100, (P._rage == null ? P.mp : P._rage) + n); P.mp = P._rage; P._rageT = CT; },
    step(dt, P) {
      if (P._rage == null) P._rage = Math.min(P.mp, 100);
      // 魔力的自然回復、魔力藥（2026-10-05 作者：魔力恢復等價轉成怒氣恢復，魔力藥不能變擺設）：多出來的魔力一律換成怒氣
      if (P.mp > P._rage + 1e-6) { P._rage = Math.min(100, P._rage + (P.mp - P._rage)); P.mp = P._rage; } else P._rage = P.mp;
      if (adv(P) === 'inner' && P.still > 0.5) this.add(P, 8 * dt);
      else if (adv(P) !== 'berserker' && CT - (P._rageT || 0) > 4 && P._rage > 0) { P._rage = Math.max(0, P._rage - 4 * dt); P.mp = P._rage; }
      if (P._mask > 0) P._mask -= dt;
      // 大招條跟著怒氣：放大招（ult.js 把 P.ult 歸零、P.ulting）就把怒氣用掉
      if (P.ulting) { if (!P._wUlt) { P._wUlt = true; P._rage = 0; P.mp = 0; } } else P._wUlt = false;
      P.ult = P.ulting ? 0 : P._rage;
    },
    onHit(e, d, o, P, killed) {
      if (d <= 0) return;
      if (o.primary) { if (!P._rageHit || CT - P._rageHit > 0.12) { P._rageHit = CT; this.add(P, 4); } } else if (!o.reflect) this.add(P, 1);
      if (killed) this.add(P, 5);
    },
    mod(e, raw, o, P) {
      if (P._finale && o.primary) { P._finale = false; say(P, '終幕', 'crit'); R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 3.2, color: '#FFB45A' }); R.coreAoe(P.x, P.z, 3.2, raw * 3, { kb: 2 }); return raw * 4; }
      return raw;
    },
    onHurt(raw, src, o, P) { if ((P._rage || 0) >= 100 && raw > 0) return raw * 0.8; },   // 怒氣滿：受到的傷害 −20%
    afterHurt(took, src, P) { let n = took / P.hpMax * 100 * 0.8; if (adv(P) === 'berserker' && P.hp < P.hpMax * 0.3) n *= 2; this.add(P, n); },
    onCast(P, i, id) {
      if (adv(P) !== 'gladiator' || !id) return;
      const L = (P._glad || []).filter(x => CT - x[1] < 6 && x[0] !== id); L.push([id, CT]); P._glad = L;
      if (new Set(L.map(x => x[0])).size >= 3) { P._glad = []; P._finale = true; say(P, '終幕準備', 'heal'); }
    },
    act(P) {
      const r = P._rage || 0; if (r < 50) { toast('怒氣 50 以上才能怒吼（現在 ' + Math.floor(r) + '）'); return; }
      const k = r / 50; P._rage = 0; P.mp = 0;
      R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 4.5, color: '#E8503A' }); R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 2.5, color: '#FFB45A' }); R.shake && R.shake(0.3);
      R.coreAoe(P.x, P.z, 4.5, pw(P) * 1.2 * k, { stun: 0.8, kb: 1.5 });
      P.sb = P.sb || {}; P.sb['core:roar'] = { left: 6, t: 6, dmg: 1 + 0.12 * k, color: '#E8503A' };
      if (adv(P) === 'onimusha') { P.hp = Math.max(1, P.hp - P.hpMax * 0.1); P._mask = 6; P.sb['core:mask'] = { left: 6, t: 6, dmg: 1.3, vamp: 0.05, color: '#C83A3A' }; say(P, '鬼面', 'crit'); }
      else say(P, '怒吼', 'crit');
    },
    gauge(P) { const r = P._rage || 0; return { v: r, max: 100, full: r >= 100, sub: P._finale ? '下一下普攻：終幕' : P._mask > 0 ? '鬼面 ' + P._mask.toFixed(1) + ' 秒' : r >= 100 ? '滿怒：可以放大招、受到傷害 −20%' : adv(P) === 'berserker' ? '怒氣不會掉' : '怒氣滿 100 才能放大招', x: r >= 50 ? '怒吼' : '' }; }
  };

  // ======================= 術士：元素反應 =======================
  const EL = { fire: ['火', '#FF6A2A'], frost: ['冰', '#9AD8FF'], shock: ['雷', '#FFE070'], wood: ['木', '#7ACF5A'], wind: ['風', '#BFF0E0'], metal: ['金', '#D8C890'] }, ELS = ['fire', 'frost', 'shock', 'wood'], AUX = ['wind', 'metal'];
  const REACT = { 'fire+frost': '蒸發', 'frost+shock': '碎冰', 'fire+shock': '過載', 'shock+wood': '激化', 'fire+wood': '燃燒', 'frost+wood': '凍藤' };
  CORE.mage = {
    name: '元素', col: '#B88AFF',
    help: P => '元素反應：X 換元素（火、冰、雷），之後的攻擊、法術都帶著這個元素。同一隻遺跡生物身上疊到不同元素就引爆——火＋冰＝蒸發（大傷害）、冰＋雷＝碎冰（暈眩＋小範圍）、雷＋火＝過載（大範圍爆炸）。元素在牠身上留 4 秒。'
      + ({ elementalist: '元素師：反應的威力 ×1.5。', hexer: '咒術師：反應順便詛咒周圍 4 公尺。', shikigami: '式神使：反應回 6 點魔力。', waixiu: '外修者：反應回 6 點魔力。' }[adv(P)] || ''),
    floor: P => { P._el = P._el || 'fire'; },
    onHit(e, d, o, P, killed) {
      if (!e || o.reflect || o.thorns || o.dot || o.tick || o.burn || o.env) return;
      // 2026-10-14 修正「沒有元素也觸發反應」：只有普攻和玩家自己的技能／法術／大招算元素攻擊；燒傷、陷阱、岩漿、連鎖、寵物、隊友都不算。
      // 每個印記記下是哪一次施放留下的（e._elSrc）：同一次施放（多段、範圍、地形、變調、三相、隕星、擴散）不會拿自己留的印記引爆。
      const D = R.elemDbg || (R.elemDbg = { react: 0, aux: 0, mark: 0, skip: 0, self: 0 });
      if (e.petHit || R.petHitter) { D.skip++; return; }
      const m = e._el || (e._el = {}), S = e._elSrc || (e._elSrc = {});
      if (o.primary && !AUX.includes(P._el)) { if (e.dead) return; const pe = EL[P._el] ? P._el : 'fire'; ELS.forEach(x => { if (x !== pe) { delete m[x]; delete S[x]; } }); m[pe] = CT + 5; S[pe] = 'p'; D.mark++; return; }
      const skill = o.primary || o.spell || o.vSk || (o.elem && EL[o.elem]) || (R.vampInSkill && R.vampInSkill());
      if (!skill) { D.skip++; return; }
      const tok = o.primary ? 'atk' : 'c' + (R._elCid || 0), ok = x => (m[x] || 0) > CT && S[x] !== tok;
      const el = o.primary ? P._el : o.elem && EL[o.elem] ? o.elem : P._el || 'fire';
      if (AUX.includes(el)) {   // 風、金：碰到之前留下的元素印記就觸發（不用掉印記；同一隻 1 秒一次）
        const mk = ELS.find(ok); if (!mk || e.dead || (e._auxT || 0) > CT) { if (!mk && ELS.some(x => (m[x] || 0) > CT)) D.self++; return; } e._auxT = CT + 1; D.aux++;
        const k2 = (adv(P) === 'elementalist' ? 1.5 : 1) * pw(P);
        if (el === 'wind') { R.num && R.num(e.x, 2.6, e.z, '擴散', 'crit'); R.fx && R.fx('ring', e.x, 0.1, e.z, { r: 4, color: EL.wind[1] }); (W().enemies || []).forEach(x => { if (x !== e && !x.dead && dist(x, e) < 4) { const mm = x._el || (x._el = {}), ss = x._elSrc || (x._elSrc = {}); ELS.forEach(y => { delete mm[y]; delete ss[y]; }); mm[mk] = CT + 5; ss[mk] = tok; } }); }
        else { R.num && R.num(e.x, 2.6, e.z, '破甲', 'crit'); R.fx && R.fx('ring', e.x, 0.6, e.z, { r: 1.2, color: EL.metal[1] }); if (!e._brk) { e._brk = e.def; e.def = Object.assign({}, e.def, { armor: Math.max(0, (e.def.armor || 0) - 0.3) }); } e._brkT = CT + 4; }
        if (!e.dead) R.coreHit(e, k2 * 0.6, {});
        return;
      }
      const other = ELS.find(x => x !== el && ok(x));
      if (!other) {   // 沒有之前留下的別種印記：留下自己的元素 5 秒（同一次施放自己留的別種印記就不動它）
        if (ELS.some(x => x !== el && (m[x] || 0) > CT)) { D.self++; return; }
        if (!e.dead && ELS.includes(el)) { ELS.forEach(x => { if (x !== el) { delete m[x]; delete S[x]; } }); m[el] = CT + 5; S[el] = tok; D.mark++; } return;
      }
      delete m[other]; delete m[el]; delete S[other]; delete S[el]; D.react++;
      const key = [el, other].sort().join('+'), name = REACT[key], tri = (R.legOf ? R.legOf(P) : null) === 'lg_tri', k = (adv(P) === 'elementalist' ? 1.5 : 1) * (tri ? 1.5 : 1) * pw(P);
      if (tri) P._el = ELS[(Math.max(0, ELS.indexOf(P._el || 'fire')) + 1) % ELS.length];   // 三相之杖：反應之後自動換元素
      R.num && R.num(e.x, 2.6, e.z, name, 'crit');
      if (key === 'fire+frost') { R.fx && R.fx('poof', e.x, 1, e.z, { color: '#F0F0F0', n: 18 }); if (!e.dead) R.coreHit(e, k * 1.6, {}); }
      else if (key === 'frost+shock') { R.fx && R.fx('ring', e.x, 0.1, e.z, { r: 2.5, color: '#BFE8FF' }); if (!e.dead) e.st.stun = Math.max(e.st.stun || 0, 1.5); R.coreAoe(e.x, e.z, 2.5, k * 1.0, {}); }
      else if (key === 'shock+wood') { R.fx && R.fx('bolt', e.x, 2.5, e.z, { to: e, color: '#B8FF6A' }); if (!e.dead) { e.st.stun = Math.max(e.st.stun || 0, 1.2); e.st.root = Math.max(e.st.root || 0, 1.2); R.coreHit(e, k * 1.4, {}); } }
      else if (key === 'fire+wood') { R.fx && R.fx('poof', e.x, 1, e.z, { color: '#C8701A', n: 14 }); e._mBurn = { left: 5, tick: 0.5, per: k * 0.18 }; }
      else if (key === 'frost+wood') { R.fx && R.fx('ring', e.x, 0.1, e.z, { r: 1.4, color: '#7AD8B0' }); if (!e.dead) { e.st.slow = Math.max(e.st.slow || 0, 4); e._mSlowT = CT + 4; R.coreHit(e, k * 1.0, {}); } }
      else { R.fx && R.fx('boom', e.x, 0.4, e.z, { r: 3.5, color: '#FFB45A' }); R.shake && R.shake(0.2); R.coreAoe(e.x, e.z, 3.5, k * 1.8, { kb: 2 }); }
      if (adv(P) === 'hexer') (W().enemies || []).forEach(x => { if (!x.dead && dist(x, e) < 4) x.st.curse = Math.max(x.st.curse || 0, 4); });
      if (adv(P) === 'shikigami' || adv(P) === 'waixiu') P.mp = Math.min(P.mpMax, P.mp + 6);
    },
    step(dt, P) {   // 燃燒（5 秒 10 下，共 180%）、凍藤（再慢一點，總共約 −60%）、破甲到期
      (W().enemies || []).forEach(e => {
        if (e._brk && (e.dead || CT > (e._brkT || 0))) { e.def = e._brk; e._brk = null; }
        if (e.dead) return;
        const b = e._mBurn; if (b) { b.left -= dt; b.tick -= dt; if (b.tick <= 0) { b.tick += 0.5; R.coreHit(e, b.per, { dot: 'burn', critChance: 0 }); } if (b.left <= 0 || e.dead) e._mBurn = null; }
        if ((e._mSlowT || 0) > CT && e._px != null) { e.x = e._px + (e.x - e._px) * 0.73; e.z = e._pz + (e.z - e._pz) * 0.73; }
        e._px = e.x; e._pz = e.z;
      });
    },
    act(P) { const i = Math.max(0, ELS.indexOf(P._el || 'fire')); P._el = ELS[(i + 1) % ELS.length]; say(P, EL[P._el][0], 'heal'); R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 1.4, color: EL[P._el][1] }); },
    gauge(P) { const el = P._el || 'fire'; return { name: '元素：' + EL[el][0], col: EL[el][1], text: '火＋冰 蒸發・冰＋雷 碎冰・雷＋火 過載', x: '換成' + EL[ELS[(ELS.indexOf(el) + 1) % 3]][0] }; }
  };

  // ======================= 槍手：彈種＋完美換彈 =======================
  const AMMO = { normal: ['一般彈', '#C8C0B0'], pierce: ['穿甲彈', '#C8D0DC'], fire: ['燃燒彈', '#FF7A3A'], frost: ['冰凍彈', '#9AD8FF'] }, AM = ['normal', 'pierce', 'fire', 'frost'];
  const ZONE = [0.45, 0.65];
  CORE.gunner = {
    name: '彈藥', col: '#C8A86A',
    help: P => '彈種＋完美換彈：換彈的時候再按一次 X，按在中間金色那一格＝完美換彈（馬上換好、這一匣傷害 +25%），按錯會卡彈（多 0.5 秒）。彈匣滿的時候按 X 換彈種：一般→穿甲（對有甲的 +30%）→燃燒（18% 燃燒）→冰凍（25% 減速）。'
      + ({ sniper: '狙擊手：打背後、暈住的 ×1.5。', magigun: '魔導槍手：彈種的效果兩倍。', bomber: '爆破手：燃燒彈打倒的會炸開。' }[adv(P)] || ''),
    floor: P => { P._ammoT = P._ammoT || 'normal'; P._tried = false; },
    act(P, orig) {
      const ws = P.ws; if (!ws || ws.kind !== 'gun') return orig();
      if (P.reloadT > 0) {
        if (P._tried) return; P._tried = true;
        const p = 1 - P.reloadT / (ws.reload || 1);
        const Z = (R.legOf ? R.legOf(P) : null) === 'lg_receiver' ? [0.35, 0.75] : ZONE; if (p >= Z[0] && p <= Z[1]) { P.reloadT = 0.001; P._perfect = true; say(P, '完美換彈', 'heal'); R.sfx && R.sfx('pick'); }
        else { P.reloadT += 0.5; say(P, '卡彈', 'hurt'); }
        return;
      }
      if (P.ammo >= (ws.mag || 0)) { const i = AM.indexOf(P._ammoT || 'normal'); P._ammoT = AM[(i + 1) % AM.length]; say(P, AMMO[P._ammoT][0], 'heal'); return; }
      P._tried = false; P._perfect = false; return orig();
    },
    step(dt, P) { if (P.reloadT > 0 && P._reloading !== true) { P._reloading = true; P._tried = false; P._perfect = false; } if (!(P.reloadT > 0)) P._reloading = false; },
    mod(e, raw, o, P) {
      if (!o.primary) return raw;
      let k = P._perfect ? 1.25 : 1; const t = P._ammoT || 'normal', dbl = adv(P) === 'magigun' ? 2 : 1;
      if (t === 'pierce' && e.def.armor) k *= 1 + 0.3 * dbl;
      if (t === 'fire' && rnd() < 0.18 * dbl) e.st.burn = 3;
      if (t === 'frost' && rnd() < 0.25 * dbl) e.st.slow = Math.max(e.st.slow || 0, 2);
      if (adv(P) === 'sniper' && ((e.st.stun || 0) > 0 || Math.abs(wrap(angTo(e, P) - (e.yaw || 0))) > 2.1)) { k *= 1.5; if (rnd() < 0.3) say(P, '弱點', 'crit'); }
      return raw * k;
    },
    onHit(e, d, o, P, killed) { if (killed && o.primary && adv(P) === 'bomber' && (P._ammoT === 'fire')) { R.fx && R.fx('boom', e.x, 0.3, e.z, { r: 2, color: '#FF8A3A' }); R.coreAoe(e.x, e.z, 2, pw(P) * 0.6, {}); } },
    gauge(P) {
      const ws = P.ws || {}, t = P._ammoT || 'normal';
      if (P.reloadT > 0) return { name: '換彈中', col: '#FFE08A', v: 1 - P.reloadT / (ws.reload || 1), max: 1, text: P._tried ? '' : '抓金色那一格', zone: (R.legOf ? R.legOf(P) : null) === 'lg_receiver' ? [0.35, 0.75] : ZONE, x: P._tried ? '' : '完美換彈' };
      return { name: AMMO[t][0], col: AMMO[t][1], text: (P.ammo || 0) + '／' + (ws.mag || 0) + (P._perfect ? '・完美 +25%' : ''), sub: '', x: P.ammo >= (ws.mag || 0) ? '換彈種' : '換彈' };
    }
  };

  // ======================= 弓箭手：完美蓄力 =======================
  const DRAW = 1.0, WIN = [0.78, 0.95];
  CORE.archer = {
    name: '鷹眼', col: '#9AE07A',
    help: P => '完美蓄力：X 拉滿弓（走路變慢），圈縮到金色那一格時再按一次 X＝完美射擊：四倍傷害、貫穿全部、必定暴擊，疊一層鷹眼（每層 +6% 傷害、最多 5 層、8 秒，被打就沒了）。沒抓到就是普通的兩倍箭。冷卻 2.5 秒、花 12 體力。'
      + ({ arcane: '魔弓手：完美箭分成三支，會追蹤。', ranger: '遊俠：完美射擊在準心處放一個捕獸夾。', hama: '破魔弓手：完美箭射中的留破魔印（8 秒，你的傷害 +20%）。' }[adv(P)] || ''),
    shoot(P, perfect) {
      const ws = P.ws || {}, base = (ws.dmg || 10) * (perfect ? 4 : 2), a = P.aimA;
      const one = (da, hm) => R.fire({ kind: 'arrow', owner: 'p', x: P.x, z: P.z, a: a + da, speed: (ws.speed || 24) * 1.25, dmg: base, life: (ws.range || 15) / (ws.speed || 24) * 1.4, pierce: perfect ? 99 : 1, primary: false, crit: perfect, elem: perfect ? 'perfect' : null, homing: hm ? 1 : 0 });
      one(0, false);
      if (perfect && adv(P) === 'arcane') { one(0.22, true); one(-0.22, true); }
      if (perfect && adv(P) === 'ranger' && R.addZone) { const ax = P.aimX != null ? P.aimX : P.x + Math.sin(a) * 6, az = P.aimZ != null ? P.aimZ : P.z + Math.cos(a) * 6, q = R.nearestFloor ? R.nearestFloor(ax, az) : [ax, az]; R.addZone({ kind: 'trap', x: q[0], z: q[1], r: 1.1, life: 12, dmg: pw(P) * 1.5 }); }
      if (perfect) { P._hawk = Math.min((R.legOf ? R.legOf(P) : null) === 'lg_hawkking' ? 8 : 5, (P._hawk || 0) + 1); P._hawkT = CT + 8; say(P, '完美射擊', 'crit'); } else { say(P, '射擊', 'heal'); }
      R.sfx && R.sfx('bow'); P.h && (P.h.recoil = 1);
    },
    act(P) {
      if (P._draw) { const t = P._draw.t, ok = t >= WIN[0] * DRAW && t <= WIN[1] * DRAW; P._draw = null; P._drawCd = CT + 2.5; this.shoot(P, ok); return; }
      if ((P._drawCd || 0) > CT) { toast('還在冷卻（' + (P._drawCd - CT).toFixed(1) + ' 秒）'); return; }
      if (P.stam != null && P.stam < 12) { toast('體力不夠'); return; }
      if (P.stam != null) P.stam -= 12;
      P._draw = { t: 0 };
    },
    step(dt, P) {
      if (P._draw) { P._draw.t += dt; P.slowT = Math.max(P.slowT || 0, 0.1); if (P._draw.t > DRAW * 1.4) { P._draw = null; P._drawCd = CT + 2.5; this.shoot(P, false); } }
      if (P._hawk && CT > (P._hawkT || 0)) P._hawk = 0;
    },
    mod(e, raw, o, P) {
      let k = 1 + 0.06 * (P._hawk || 0);
      if ((e._hama || 0) > CT) k *= 1.2;
      if (o.elem === 'perfect' && adv(P) === 'hama') e._hama = CT + 8;
      return raw * k;
    },
    afterHurt(took, src, P) { if (P._hawk) { P._hawk = (R.legOf ? R.legOf(P) : null) === 'lg_hawkking' ? Math.floor(P._hawk / 2) : 0; say(P, '鷹眼斷了', 'hurt'); } },
    gauge(P) {
      if (P._draw) { const t = P._draw.t / DRAW; return { name: '拉弓', col: t >= WIN[0] && t <= WIN[1] ? '#FFE08A' : '#9AE07A', v: Math.min(1, t), max: 1, zone: WIN, text: '在金色那一格放', x: '放箭' }; }
      const cd = Math.max(0, (P._drawCd || 0) - CT);
      return { name: '鷹眼 ' + (P._hawk || 0) + ' 層', v: P._hawk || 0, max: (R.legOf ? R.legOf(P) : null) === 'lg_hawkking' ? 8 : 5, text: '+' + 6 * (P._hawk || 0) + '%', x: cd > 0 ? '冷卻 ' + cd.toFixed(1) : '拉滿弓' };
    }
  };

  // ======================= 刀客：收刀・刀意・居合・殘心・反切（2026-10-13 作者重製）=======================
  // 普攻（R.bladeAttack，combat.js 的 R.attack 轉過來）：先往前衝一段再出手，前面有敵人就停在牠前面 2 公尺（×攻擊距離增幅）。
  //   橫斬：120 度、衝 1 公尺；直劈：寬 0.4、長＝攻擊距離、傷害 +40%、衝 2 公尺；突刺：寬 0.4、長＝攻擊距離 ×1.2、穿透 +40%、衝 4 公尺。
  //   長度、寬度、角度、衝刺距離都照「攻擊距離增幅」（目前攻擊距離 ÷ 武器原本的攻擊距離）放大；衝刺速度＝移動速度 ×3。
  //   選招：10 公尺（×增幅）內 1 隻：比（攻擊距離＋直劈衝刺距離）遠用突刺，不然直劈；2～4 隻：橫斬→直劈→突刺輪流；5 隻以上：橫斬；
  //   沒有敵人：橫斬（2026-10-15 作者，原本直劈）。翻滾後的下一刀必定突刺（居合除外）。
  //   2026-10-15 作者：出刀（揮出劍氣、刺擊）的時候移動 −80%；刀光留在場上 0.25 秒才消失（10-15 前 0.5 秒），這段時間刀光範圍裡的敵方子彈全部擋掉。
  // X 職業鍵：收刀／拔刀，各要讀 2 秒（不會被打斷，期間移動 −50%）；收刀中、讀條中不能普攻、不能放技能（大招可以）。
  // 刀意（0～100）：不會自己漲；收刀狀態下 4 秒集滿；普攻打中每一刀 +15（雙刀每下 +7.5，約 7 刀集滿）。滿了：移動 +25%，
  //   收刀中→下一次普攻或技能＝居合（消耗全部刀意、直接拔刀；普攻必定橫斬、範圍 +40%、傷害 ×2、穿透 +40%、衝 4 公尺；技能傷害 +40%）→之後進入殘心；
  //   拔刀中→刀意渾圓（攻速 +25%、範圍 +10%、傷害 +10%）；渾圓時被打＝反切：免疫這一下、無敵 0.4 秒、原地橫斬，用掉 100 刀意（2026-10-14 前是歸零）。
  // 殘心（5 秒）：收刀／拔刀時間 ×0.5、刀意獲得 +40%、受到傷害 −20%。
  // 劍豪：居合加成 ×1.5、殘心效果 ×2（時間 ×0.25、刀意 +80%、減傷 40%）且 10 秒、收刀時間 ×0.5。
  // 2026-10-14 作者重做被動（passives.js 的 bl4／bl8／bl11／bl9，效果寫在這裡）：
  //   穿心（原殘心）：翻滾後的下一發普攻傷害 +50%（沒有時間限制）。
  //   刀意：攻擊與收刀得到的刀意 +50%，每秒自動 +5 刀意。
  //   無我：生命高於 50% 傷害 +30%；低於 50% 每秒消耗 3 點刀意，每消耗 1 點回復 1% 最大生命。
  //   無念：刀意上限 200（居合、刀意渾圓、反切照樣 100 就觸發，各用掉 100）。集滿 200：收刀中＝「無念．居合」（居合加成 ×2、用掉 200）；
  //     拔刀中＝「無念．刀意渾圓」（渾圓效果 ×2）。反切只在真的會受傷時觸發（無敵、跳起來的時候不算），所以 200 刀意可以反切兩次。
  // 影刃：反切砍 2 刀、無敵 1 秒、反切後也進殘心；普攻衝刺速度 ×10、距離 ×2。
  // 妖刀使：渾圓效果 ×2，渾圓時吸血系數 +75；每次普攻扣 1% 目前生命、放技能扣 10% 目前生命（不會扣到死）。
  // 武器：刀 1 秒一刀、傷害 ×2.5；雙刀 1.5 秒一次、每刀傷害跟刀一樣、一次砍 2 下、收刀時間 ×1.5、不能反切；野太刀 1.5 秒一刀、傷害 ×2。
  //   （只改普攻：武器卡片、技能威力照舊，避免技能跟著變兩三倍。）
  const BD = {
    W: { katana: { rate: 1, dmg: 2.5 }, dualblades: { rate: 1 / 1.5, dmg: 37.5 / 8.5, hits: 2, sheath: 1.5, noCounter: true }, nodachi: { rate: 1 / 1.5, dmg: 2 } },
    GAIN: 15, FULL_T: 4, READ: 2
  };
  const legOf = P => (R.legOf ? R.legOf(P) : null);
  const bw = P => { const b = P.item && P.item.base, w = BD.W[b] || BD.W.katana, w0 = R.WEAPONS[b] || R.WEAPONS.katana; return { w, w0, b }; };
  const bdState = P => P._bdSt || 'drawn';   // drawn／sheathing／sheathed／drawing
  const zanOn = P => (P._zanT || 0) > CT;
  const zanK = P => (adv(P) === 'kensei' ? 2 : 1);
  const pvB = (P, k) => !!(P && P.pv && P.pv[k]);   // 2026-10-14 刀客被動
  const cap = P => (pvB(P, 'bdMunen') ? 200 : 100);
  const full = P => (P._iai || 0) >= 100;
  const munen = P => pvB(P, 'bdMunen') && (P._iai || 0) >= 200;   // 無念：集滿 200
  const enso = P => full(P) && bdState(P) === 'drawn';
  const iaiReady = P => full(P) && bdState(P) === 'sheathed';
  const ensoK = P => (adv(P) === 'yoto' ? 2 : 1) * (munen(P) ? 2 : 1);
  const iaiKOf = P => (adv(P) === 'kensei' ? 1.5 : 1) * (munen(P) ? 2 : 1);
  const iaiName = P => (munen(P) ? '無念．居合' : '居合'), ensoName = P => (munen(P) ? '無念．刀意渾圓' : '刀意渾圓');
  const rangeK = P => { const { w0 } = bw(P); return Math.max(0.5, (P.ws.range || w0.range) / (w0.range || 2.6)); };
  const readT = P => { let t = BD.READ * (bw(P).w.sheath || 1); if (adv(P) === 'kensei') t *= 0.5; if (zanOn(P)) t *= Math.pow(0.5, zanK(P)); return t; };
  const gainK = P => (zanOn(P) ? 1 + 0.4 * zanK(P) : 1) * (legOf(P) === 'lg_sheathless' ? 2 : 1) * (pvB(P, 'bdIntent') ? 1.5 : 1);   // 被動「刀意」：攻擊、收刀得到的 +50%
  const addIaiRaw = (P, n) => {
    const was = full(P), wasM = munen(P); P._iai = Math.min(cap(P), (P._iai || 0) + n);
    if (!was && full(P)) { say(P, bdState(P) === 'drawn' ? '刀意渾圓' : '居合', 'crit'); R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 1.6, color: '#DDEEFF' }); }
    if (!wasM && munen(P)) { say(P, bdState(P) === 'drawn' ? '無念．刀意渾圓' : '無念．居合', 'crit'); R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 2.2, color: '#FFE08A' }); }
  };
  const addIai = (P, n) => addIaiRaw(P, n * gainK(P));
  const noVampO = o => (R.markNoVamp ? R.markNoVamp(o || {}) : Object.assign(o || {}, { reflect: true, noVamp: true }));
  const startZan = P => { P._zanT = CT + 5 * zanK(P); say(P, '殘心', 'heal'); if (legOf(P) === 'lg_seam') P._seamT = CT + 3; };
  // 2026-10-13：刀意渾圓、居合、殘心、貫勢顯示在下面的狀態圖示（statusicons.js 的 R.STATUS_EXTRA）
  (R.STATUS_EXTRA = R.STATUS_EXTRA || []).push((P, run, add) => {
    if (!P || P.cls !== 'blade') return;
    const ik = iaiKOf(P), pc = v => Math.round(v * 100) / 100;
    if (enso(P)) add('bd:enso', ensoName(P), 'spark', munen(P) ? '#FFE08A' : '#DDEEFF', ['攻速 +' + 25 * ensoK(P) + '%、範圍 +' + 10 * ensoK(P) + '%、傷害 +' + 10 * ensoK(P) + '%、移動 +25%', '這時被打會反切：免疫這一下、原地橫斬，用掉 100 刀意'], null, null, false, munen(P) ? '刀意 200、拔刀中' : '刀意滿、拔刀中');
    if (iaiReady(P)) add('bd:iai', iaiName(P), 'swords', munen(P) ? '#FFE08A' : '#FFFFFF', ['下一次普攻或技能是' + iaiName(P) + '（用掉 ' + (munen(P) ? 200 : 100) + ' 刀意）', '普攻：必定橫斬、範圍 +' + pc(40 * ik) + '%、傷害 ×' + pc(1 + ik) + '、穿透 +' + pc(40 * ik) + '%；技能：傷害 +' + pc(40 * ik) + '%'], null, null, false, munen(P) ? '刀意 200、收刀中' : '刀意滿、收刀中');
    if ((P._iaiSkT || 0) > CT) add('bd:iaisk', (P._iaiSkK > (adv(P) === 'kensei' ? 1.5 : 1) ? '無念．居合' : '居合') + '（技能）', 'swords', '#FFFFFF', ['技能傷害 +' + pc(40 * (P._iaiSkK || 1)) + '%'], P._iaiSkT - CT, 1.2);
    if (zanOn(P)) add('bd:zan', '殘心', 'barrier', '#BFE8FF', ['收刀／拔刀時間 ×' + Math.pow(0.5, zanK(P)), '刀意獲得 +' + 40 * zanK(P) + '%、受到的傷害 −' + 20 * zanK(P) + '%'], P._zanT - CT, 5 * zanK(P));
  });
  R.STATUS_EXTRA.push((P, run, add) => { if (P && P.tkKan > 0) add('tk:kan', '貫勢', 'spark', '#BFE8FF', ['傷害 +30%、受到的傷害 −20%'], P.tkKan, 5); });
  const nowMs = () => performance.now();
  const blockMsg = (P, t) => { if (nowMs() - (P._bdMsgT || 0) > 900) { P._bdMsgT = nowMs(); toast(t, '#DDEEFF'); } };
  const bdLater = (P, f, ms) => { const run = W().run, sc = W().scene; setTimeout(() => { const w = W(); if (w.run === run && w.scene === sc && w.P === P && !P.dead && !run.done) f(); }, ms); };
  const hpCost = (P, frac) => { if (adv(P) !== 'yoto' || !(P.hp > 1)) return; P.hp = Math.max(1, P.hp - P.hp * frac); };
  // 2026-10-15 作者：普攻的刀光留 0.25 秒（原本 0.5）（照原本的速度掃出去，停在最亮的那一格，最後照原本的速度淡掉）；這段時間擋子彈、出刀的人移動 −80%
  const HOLD = 0.25;   // 2026-10-15 作者：0.5 → 0.25 秒
  const holdFx = n0 => { const fx = W().fxs || []; for (let i = n0; i < fx.length; i++) { const f = fx[i]; if (!f || f._bdHold || !(f.life > 0) || f.life >= HOLD) continue; const L0 = f.life, tk = f.tick; f._bdHold = 1; f.life = HOLD;
    if (tk) f.tick = k => { const t = k * HOLD, a = L0 * 0.45, b = HOLD - L0 * 0.55; tk(t < a ? t / L0 : t < b ? 0.45 : 0.45 + (t - b) / L0); }; } };
  const walls = [];   // 擋子彈的刀光：{ x, z, a, range, arc, width, until }
  const inWall = (w, x, z, r) => { const dx = x - w.x, dz = z - w.z, d = Math.hypot(dx, dz);
    if (w.width) { const along = dx * Math.sin(w.a) + dz * Math.cos(w.a), side = Math.abs(dx * Math.cos(w.a) - dz * Math.sin(w.a)); return along > -0.6 && along < w.range + r + 0.3 && side < w.width + r + 0.2; }
    return d < w.range + r + 0.3 && (d < 0.8 || Math.abs(wrap(Math.atan2(dx, dz) - w.a)) < w.arc / 2 + 0.15); };
  const blockShots = () => { if (!walls.length) return; for (let i = walls.length - 1; i >= 0; i--) if (walls[i].until <= CT) walls.splice(i, 1);
    (W().shots || []).forEach(q => { if (q.dead || q.owner === 'p') return; if (walls.some(w => inWall(w, q.x, q.z, q.rad || 0.2))) { R.fx && R.fx('spark', q.x, 1, q.z, {}); R.killShot ? R.killShot(q) : (q.life = -1); } }); };
  // 一刀（不含衝刺）：kind 'slash'／'cleave'／'thrust'
  const strike = (P, a, kind, o) => {
    o = o || {};
    const { w } = bw(P), k = rangeK(P) * (enso(P) && !o.counter ? 1 + 0.1 * ensoK(P) : 1) * (o.iai ? 1 + 0.4 * o.iaiK : 1);
    let dmg = P.ws.dmg * w.dmg * (kind === 'cleave' ? 1.4 : 1) * (o.iai ? 1 + 1 * o.iaiK : 1) * (enso(P) && !o.counter ? 1 + 0.1 * ensoK(P) : 1) * (o.pierceK || 1);   // pierceK：被動「穿心」
    const pen = (kind === 'thrust' ? 0.4 : 0) + (o.iai ? 0.4 * o.iaiK : 0);
    const range = P.ws.range * (kind === 'thrust' ? 1.2 : 1) * (kind === 'slash' ? k : k), arc = kind === 'slash' ? Math.min(Math.PI * 2, (2 * Math.PI / 3) * k) : 0, width = kind === 'slash' ? 0 : (kind === 'cleave' ? 0.4 : 0.2) * k;   // 半寬：直劈 0.8 公尺（2026-10-13）、突刺 0.4
    const hits = o.counter ? 1 : (w.hits || 1), id = (P._bdId = (P._bdId || 0) + 1);
    R.swingAnim && R.swingAnim(P.h, 0.04, 0.3);
    for (let i = 0; i < hits; i++) {
      const go = () => {
        const p0 = P.pen, n0 = (W().fxs || []).length; P.pen = Math.min(0.95, (p0 || 0) + pen);
        if (!o.counter) { P._bdSlowT = CT + HOLD; walls.push({ x: P.x, z: P.z, a, range, arc: arc || 0.5, width, until: CT + HOLD }); }
        try { R.melee(a, range, arc, dmg, width, 0, 0, Object.assign(o.counter ? noVampO({ primary: false, bdCounter: 1 }) : { bd: id, bdHits: hits }, { dir: (P._bdN + i) % 2 ? -1 : 1, big: !!(o.iai || kind !== 'slash'), bladeCleave: kind === 'cleave' && !o.iai, hs: 1 })); }
        finally { P.pen = p0; if (!o.counter) holdFx(n0); }
      };
      if (i === 0) go(); else bdLater(P, go, 120 * i);
    }
    if (o.iai || kind === 'thrust') { const n0 = (W().fxs || []).length; R.fx && R.fx('slash', P.x, 1, P.z, { a, len: range }); if (!o.counter) holdFx(n0); }
    R.sfx && R.sfx('swing');
  };
  const pickForm = (P, k) => {
    if (P._bdRolled) { P._bdRolled = false; return 'thrust'; }
    const R10 = 10 * k, es = (W().enemies || []).filter(e => !e.dead && !e.under && dist(e, P) < R10 + e.def.size * 0.5);
    if (es.length === 1) return dist(es[0], P) - es[0].def.size * 0.5 > P.ws.range * k + 2 * k ? 'thrust' : 'cleave';
    if (es.length >= 5) return 'slash';
    if (es.length >= 2) { P._bdCyc = ((P._bdCyc == null ? -1 : P._bdCyc) + 1) % 3; return ['slash', 'cleave', 'thrust'][P._bdCyc]; }
    return 'slash';
  };
  // 往前衝多遠：停在路上第一隻敵人前面 stop 公尺；不衝出地板
  const dashLen = (P, a, len, stop) => {
    const sx = Math.sin(a), sz = Math.cos(a); let d = len;
    (W().enemies || []).forEach(e => { if (e.dead || e.under) return; const dx = e.x - P.x, dz = e.z - P.z, along = dx * sx + dz * sz, side = Math.abs(dx * sz - dz * sx), r = e.def.size * 0.5; if (along > 0 && side < 0.9 + r) d = Math.min(d, Math.max(0, along - r - stop)); });
    if (R.isFloor && W().F) { let ok = 0; for (let t = 0.25; t <= d + 1e-6; t += 0.25) { const x = P.x + sx * t, z = P.z + sz * t; if (!R.isFloor(x, z) || (R.pointBlocked && R.pointBlocked(x, z))) break; ok = t; } d = Math.min(d, ok); }
    return d;
  };
  // 普攻衝刺用的移動速度：扣掉出刀時的 −80%（不然連砍的時候下一刀衝得很慢）
  const runSpeed = P => (P._bdSpSet === P.speed && P._bdSpBase ? P._bdSpBase * (full(P) ? 1.25 : 1) : P.speed);
  // 技能「拔刀」（skillbook.js 的 line 型 dash 參數）：跟普攻一樣往前衝（同樣的速度、停在敵人前 2 公尺、不衝出地板），回傳衝刺秒數
  R.bladeSkillDash = (P, a, len) => { const d = dashLen(P, a, len, 2), dur = d > 0.05 ? d / (runSpeed(P) * (adv(P) === 'shadow' ? 10 : 3)) : 0; if (dur > 0 && R.dash) { R.dash(a, d, dur, {}); P._bdBusy = CT + dur; } return dur; };
  // 刀客武器實際的攻速（普攻是 classcore 自己算的：刀 1 秒一刀、雙刀和野太刀 1.5 秒一次，再照詞綴、天賦的攻速比例）、實際的一刀傷害；給說明、角色數值用
  R.bladeWeaponReal = (base, ws) => { const w = BD.W[base], w0 = R.WEAPONS[base]; if (!w || !w0 || !ws) return null; return { rate: w.rate * (ws.rate || w0.rate) / (w0.rate || 1), dmg: (ws.dmg || 0) * w.dmg }; };
  R.bladeAttack = () => {
    const P = W().P; if (!P || P.dead) return;
    if ((P._bdBusy || 0) > CT) return;
    const st = bdState(P);
    if (st === 'sheathing' || st === 'drawing') { blockMsg(P, st === 'sheathing' ? '正在收刀…' : '正在拔刀…'); return; }
    const iai = st === 'sheathed';
    if (iai && !full(P)) { blockMsg(P, '收刀中：等刀意集滿再出居合，或按 X 拔刀'); return; }
    const { w } = bw(P), k = rangeK(P), iaiK = iaiKOf(P), iaiNm = iaiName(P);
    const kind = iai ? 'slash' : pickForm(P, k);
    if (iai) { P._iai = Math.max(0, (P._iai || 0) - (munen(P) ? 200 : 100)); P._bdSt = 'drawn'; }   // 2026-10-14：居合用掉 100，無念．居合用掉 200
    const pierceK = P._bdPierce ? 1.5 : 1; P._bdPierce = false;   // 被動「穿心」：翻滾後的下一發普攻 +50%
    const a = P.aimA, shadow = adv(P) === 'shadow';
    let len = (iai ? 4 : { slash: 1, cleave: 2, thrust: 4 }[kind]) * k * (shadow ? 2 : 1);
    const reach = P.ws.range * k * (kind === 'thrust' ? 1.2 : 1) * (iai ? 1 + 0.4 * iaiK : 1) * (enso(P) ? 1 + 0.1 * ensoK(P) : 1);
    len = dashLen(P, a, len, Math.min(2 * k, reach * 0.8));   // 停在敵人前 2 公尺；武器比 2 公尺短（雙刀）就停在砍得到的地方
    const sp = runSpeed(P) * (shadow ? 10 : 3), dur = len > 0.05 ? len / sp : 0;
    let rate = w.rate * (P.ws.rate / ((R.WEAPONS[bw(P).b] || {}).rate || P.ws.rate)) * (enso(P) ? 1 + 0.25 * ensoK(P) : 1);
    P.atkCd = 1 / rate; P.atkHold = 0.35 + dur; P._bdBusy = CT + dur; P._bdN = (P._bdN || 0) + 1;
    if (dur > 0 && R.dash) R.dash(a, len, dur, {});
    hpCost(P, 0.01);
    const fire = () => { P.aimA = a; strike(P, a, kind, { iai, iaiK, pierceK }); if (iai) { say(P, iaiNm, 'crit'); R.shake && R.shake(iaiK > 1.5 ? 0.4 : 0.25); startZan(P); } };
    if (dur > 0) bdLater(P, fire, dur * 1000); else fire();
  };
  CORE.blade = {
    name: '刀意', col: '#DDEEFF',
    help: P => '收刀（X）：收刀、拔刀各讀 2 秒（不會被打斷、期間移動 −50%），收刀時不能普攻、不能放技能（大招可以）。刀意只在收刀狀態下（4 秒集滿）或普攻打中時漲。'
      + '刀意滿：移動 +25%；收刀中→下一次普攻或技能是居合（普攻必定橫斬、範圍 +40%、傷害 ×2、穿透 +40%；技能傷害 +40%），之後進入殘心 5 秒（收刀快一倍、刀意 +40%、減傷 20%）；'
      + '拔刀中→刀意渾圓（攻速 +25%、範圍 +10%、傷害 +10%），這時被打就反切：免疫這一下、無敵 0.4 秒、原地橫斬，用掉 100 刀意（無敵、跳起來時不會反切）。'
      + (pvB(P, 'bdMunen') ? '無念：刀意上限 200，集滿 200 時是「無念．居合」（雙倍居合加成、用掉 200）或「無念．刀意渾圓」（雙倍渾圓效果）；200 刀意可以反切兩次。' : '')
      + '普攻會先往前衝再出手：橫斬（120 度）、直劈（+40% 傷害）、突刺（長 1.2 倍、穿透 +40%），照周圍敵人數自動選（附近沒有敵人時橫斬）；翻滾後下一刀是突刺。出刀時移動 −80%，刀光留在場上 0.25 秒，擋下碰到的所有子彈。'
      + ({ kensei: '劍豪：居合加成 ×1.5、殘心效果 ×2 且 10 秒、收刀時間 ×0.5。', shadow: '影刃：反切砍 2 刀、無敵 1 秒、反切後也進殘心；普攻衝刺快 10 倍、距離 ×2。', yoto: '妖刀使：刀意渾圓效果 ×2、渾圓時吸血系數 +75；每次普攻扣 1% 目前生命、放技能扣 10%（不會扣到死）。' }[adv(P)] || '')
      + ({ dualblades: '雙刀：一次砍兩下，收刀時間 ×1.5，不能反切。' }[P.item && P.item.base] || ''),
    max: P => cap(P),
    floor(P) { if (P._bdWant && P._bdSpSet === P.speed) P.speed /= P._bdWant; P._bdWant = 1; P._bdSpBase = P.speed; P._bdSpSet = P.speed; P._bdSt = 'drawn'; P._bdRead = null; P._iai = 0; P._zanT = 0; P._bdSlowT = 0; walls.length = 0; },
    step(dt, P) {
      const roll = P.h && P.h.roll > 0; if (roll && !P._rolling) { P._bdRolled = true; if (pvB(P, 'bdPierce')) P._bdPierce = true; } P._rolling = roll;
      if (pvB(P, 'bdIntent')) addIaiRaw(P, 5 * dt);   // 被動「刀意」：每秒自動 +5
      if (pvB(P, 'bdMuga') && P.hp < P.hpMax * 0.5 && (P._iai || 0) > 0 && !P.dead) {   // 被動「無我」：生命低於一半，每秒用 3 點刀意，每點回 1% 最大生命
        const use = Math.min(P._iai, 3 * dt); P._iai -= use; R.healP && R.healP(P.hpMax * 0.01 * use, true);
      }
      const rd = P._bdRead;
      if (rd) { rd.t += dt; if (rd.t >= rd.dur) { P._bdSt = rd.to; P._bdRead = null; say(P, rd.to === 'sheathed' ? '收刀' : '拔刀', 'heal'); } }
      if (bdState(P) === 'sheathed') addIai(P, 100 / BD.FULL_T * dt / 1);
      // 移動：讀條 −50%、刀意滿 +25%（記住自己乘上去的倍率；別人重算過 P.speed 就重來）
      const want = (P._bdRead ? 0.5 : 1) * (full(P) ? 1.25 : 1) * ((P._bdSlowT || 0) > CT ? 0.2 : 1);   // 2026-10-15：出刀時 −80%
      blockShots();
      // 2026-10-13 修：以前別人改過 P.speed（技能增益、刀勢的 ×1.03 等都是「乘上去／除回來」）就把「已經乘過 want 的速度」當新的底，再乘一次 want → 一直疊。
      // 改成先除掉自己上次乘的倍率，再乘這次的。
      if (P._bdSpSet !== P.speed) P._bdSpBase = P.speed / (P._bdWant || 1);
      P.speed = P._bdSpBase * want; P._bdSpSet = P.speed; P._bdWant = want;
      // 妖刀使：渾圓時吸血系數 +75
      const vx = adv(P) === 'yoto' && enso(P) ? 75 : 0; if ((P._bdVx || 0) !== vx) { P.vampX = (P.vampX || 0) - (P._bdVx || 0) + vx; P._bdVx = vx; }
    },
    mod(e, raw, o, P) {
      if (o.reflect || o.bdCounter) return raw;
      let k = 1;
      if (!o.primary && (P._iaiSkT || 0) > CT) k *= 1 + 0.4 * (P._iaiSkK || (adv(P) === 'kensei' ? 1.5 : 1));   // 居合的技能（無念．居合 ×2）
      if (!o.primary && enso(P)) k *= 1 + 0.1 * ensoK(P);   // 渾圓：所有傷害 +10%（普攻在 strike 裡算過）
      if ((P._seamT || 0) > CT) k *= 1.5;   // 影縫（buildfx.js 的傳說雙刀）
      if (pvB(P, 'bdMuga') && P.hp > P.hpMax * 0.5) k *= 1.3;   // 被動「無我」：生命高於一半傷害 +30%
      return raw * k;
    },
    onHit(e, d, o, P) { if (!o.primary || o.bdCounter || !o.bd || d <= 0) return; P._bdHitIds = P._bdHitIds || {}; const key = o.bd + ':' + (o.dir || 0); if (P._bdHitIds.last === key) return; P._bdHitIds.last = key; addIai(P, BD.GAIN / (o.bdHits || 1)); },
    counter(P, src) {
      const shadow = adv(P) === 'shadow';
      P._iai = Math.max(0, (P._iai || 0) - 100); P.iframe = Math.max(P.iframe || 0, shadow ? 1 : 0.4);   // 2026-10-14：用掉 100（無念集滿 200 可以反切兩次）
      say(P, '反切', 'crit'); R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 2.5, color: '#FFFFFF' }); R.shake && R.shake(0.2);
      const a = src && src.x != null ? angTo(P, src) : P.aimA;
      strike(P, a, 'slash', { counter: true });
      if (shadow) { bdLater(P, () => strike(P, a, 'slash', { counter: true }), 150); startZan(P); }
    },
    onHurt(raw, src, o, P) {
      if ((P.iframe || 0) > 0 || (P.air || 0) > 0 || P.dead || !(raw > 0)) return;   // 無敵、跳起來的時候本來就不會受傷：不反切
      if (enso(P) && !bw(P).w.noCounter && !P._bdRead) { this.counter(P, src); return false; }
      if (zanOn(P)) return raw * (1 - 0.2 * zanK(P));
    },
    onCast(P, i, id) { hpCost(P, 0.1); if ((P._iaiSkPend || 0) > CT) { const nm = iaiName(P); P._iaiSkPend = 0; P._iaiSkK = iaiKOf(P); P._iai = Math.max(0, (P._iai || 0) - (munen(P) ? 200 : 100)); P._bdSt = 'drawn'; P._iaiSkT = CT + 1.2; say(P, nm, 'crit'); bdLater(P, () => startZan(P), 1200); } },
    act(P) {
      if (P._bdRead) { blockMsg(P, '讀條中，不能中斷'); return; }
      const to = bdState(P) === 'sheathed' ? 'drawn' : 'sheathed';
      P._bdRead = { to, t: 0, dur: readT(P) }; P._bdSt = to === 'sheathed' ? 'sheathing' : 'drawing';
      say(P, to === 'sheathed' ? '收刀…' : '拔刀…', 'heal');
    },
    gauge(P) {
      const v = P._iai || 0, st = bdState(P), rd = P._bdRead, zan = zanOn(P) ? '・殘心 ' + Math.max(0, P._zanT - CT).toFixed(1) + 's' : '';
      if (rd) return { name: (rd.to === 'sheathed' ? '收刀中' : '拔刀中') + ' ' + Math.max(0, rd.dur - rd.t).toFixed(1) + 's', col: '#9AB0D0', v: rd.t, max: rd.dur, text: '刀意 ' + Math.floor(v), sub: '讀條中：移動 −50%、不能攻擊' + zan, x: '' };
      const mx = cap(P);
      if (st === 'sheathed') return { name: '【收刀】刀意', v, max: mx, full: v >= mx, sub: (v >= 100 ? iaiName(P) + '就緒：普攻或技能出手' : '收刀累積中（4 秒集滿 100）') + zan, x: '拔刀' };
      return { name: '【拔刀】刀意', v, max: mx, full: v >= mx, col: v >= 100 ? '#FFE08A' : null, sub: (v >= 100 ? (bw(P).w.noCounter ? ensoName(P) : ensoName(P) + '・被打反切') : '普攻打中累積') + zan, x: '收刀' };
    }
  };
  // 收刀中、讀條中不能放技能（大招可以）；收刀＋刀意滿＝居合技能
  ['castSlot', 'useSkill'].forEach(fn => {
    const f0 = R[fn]; if (!f0) return;
    R[fn] = (...a) => {
      const P = W().P;
      if (P && P.cls === 'blade' && live()) {
        const st = bdState(P);
        if (st === 'sheathing' || st === 'drawing') { blockMsg(P, st === 'sheathing' ? '正在收刀…' : '正在拔刀…'); return; }
        if (st === 'sheathed') { if (!full(P)) { blockMsg(P, '收刀中不能放技能（大招可以）；按 X 拔刀'); return; } P._iaiSkPend = CT + 0.05; }
      }
      return f0(...a);
    };
  });
  // 戰士（2026-10-15 作者）：技能不吃怒氣——放技能那一下把魔力（＝怒氣）暫時當成無限，放完還原
  ['castSlot', 'useSkill'].forEach(fn => {
    const f0 = R[fn]; if (!f0) return;
    R[fn] = (...a) => { const P = W().P; if (!P || P.cls !== 'warrior' || !live()) return f0(...a); const r = P._rage == null ? P.mp : P._rage; P.mp = 1e9; try { return f0(...a); } finally { P.mp = r; P._rage = r; } };
  });
  // 手機：點職業條＝職業鍵
  document.addEventListener('pointerdown', e => { const P = W().P; if (P && P.cls === 'blade' && live() && e.target && e.target.closest && e.target.closest('#core-g')) { e.preventDefault(); R.reload(); } });


  // ======================= 騎士：格擋 =======================
  CORE.knight = {
    name: '格擋', col: '#C9A13A',
    // 2026-10-13 作者：按住職業鍵（X）才防禦；防禦擋 80%、完美防禦擋 90%（減傷在 stamina.js）；
    //   盾擊只在防禦中被打到時自動出手（內置冷卻 0.5 秒），完美防禦被打到＝反制（三倍、暈眩）。按 X 不再自己往前衝盾擊。
    help: P => '格擋（騎士專屬）：按住 X（職業鍵；手機按住這條）才會舉盾防禦，擋前面的攻擊 80%。剛舉起的頭 0.3 秒被打＝完美防禦：擋 90%、對方暈 1.5 秒、回 20 體力。防禦中被打到會自動盾擊（內置冷卻 0.5 秒），完美防禦時是反制（三倍傷害、暈眩）。防禦的時候身邊 3.5 公尺的隊友受到的傷害 −40%。'
      + ({ templar: '殿堂騎士：完美防禦把傷害整個彈回去。', paladin: '聖騎士：完美防禦回 8% 生命。', dragoon: '龍騎士：完美防禦後的反制變成龍躍（跳到準心處砸下）。' }[adv(P)] || ''),
    onHurt(raw, src, o, P) {
      if (!R.guardBlocks || !R.guardBlocks(P, src) || !(raw > 0)) return;   // 沒在防禦、或從背後打來的，照常受傷
      const perfect = R.guardPerfect && R.guardPerfect(P);
      if (perfect) {
        say(P, '完美格擋', 'crit'); R.fx && R.fx('block', P.x, 1.2, P.z); R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 2, color: '#FFE08A' });
        if (src.st) src.st.stun = Math.max(src.st.stun || 0, 1.5);
        if (adv(P) === 'templar' && src.hp != null && src.def) R.coreHit(src, raw, R.markNoVamp ? R.markNoVamp({}) : { reflect: true, noVamp: true });   // 殿堂騎士：傷害整個彈回去
        if (P.stam != null) P.stam = Math.min(P.stamMax || 100, P.stam + 20);
        if (adv(P) === 'paladin') R.healP(P.hpMax * 0.08);
      }
      if ((P._bashIcd || 0) <= CT) { P._bashIcd = CT + 0.5; if (perfect) P._riposte = CT + 2; this.act(P, true); }   // 盾擊：內置冷卻 0.5 秒
      // 不改 raw：80%／90% 的減傷交給 stamina.js
    },
    act(P, auto) {
      if (auto !== true) return;   // X 是按住防禦（stamina.js），不再自己出盾擊
      const rip = (P._riposte || 0) > CT, a = P.aimA;
      if (rip && adv(P) === 'dragoon') {
        const ax = P.aimX != null ? P.aimX : P.x + Math.sin(a) * 6, az = P.aimZ != null ? P.aimZ : P.z + Math.cos(a) * 6, d = Math.min(8, Math.hypot(ax - P.x, az - P.z)), q = R.nearestFloor ? R.nearestFloor(P.x + Math.sin(a) * d, P.z + Math.cos(a) * d) : [ax, az];
        R.fx && R.fx('blink', P.x, 1, P.z); P.x = q[0]; P.z = q[1]; P.iframe = Math.max(P.iframe || 0, 0.4); R.fx && R.fx('boom', P.x, 0.3, P.z, { r: 3.2, color: '#9AD8FF' }); R.shake && R.shake(0.3);
        R.coreAoe(P.x, P.z, 3.2, pw(P) * 3, R.markNoVamp ? R.markNoVamp({ stun: 1, kb: 2 }) : { stun: 1, kb: 2, reflect: true, noVamp: true }); P._riposte = 0; say(P, '龍躍', 'crit'); return;   // 反制龍躍：不觸發吸血
      }
      const jd = rip && (R.legOf ? R.legOf(P) : null) === 'lg_judge'; front(P, jd ? 5 : 3.5, jd ? 2.6 : 1.8).forEach(e => R.coreHit(e, pw(P) * (rip ? 3 : 1.2), rip ? (R.markNoVamp ? R.markNoVamp({ stun: jd ? 3 : 1, kb: 2 }) : { stun: jd ? 3 : 1, kb: 2, reflect: true, noVamp: true }) : { stun: jd ? 3 : 1, kb: 2 }));   // 反制盾擊不吸血；一般盾擊照常
      if (R.dash && !auto) R.dash(a, 2.4, 0.18, { iframe: true });   // 自動的反制原地出手（舉著盾不往前衝）
      R.fx && R.fx('swing', P.x, 1.1, P.z, { a, range: 3.5, arc: 1.8, color: rip ? '#FFE08A' : '#C9A13A' });
      say(P, rip ? '反制' : '盾擊', rip ? 'crit' : 'heal'); P._riposte = 0;
    },
    gauge(P) { const rip = (P._riposte || 0) > CT; return { name: rip ? '反制！' : P.guard ? '防禦中' : '格擋', col: rip ? '#FFE08A' : '#C9A13A', text: P.guard ? (R.guardPerfect && R.guardPerfect(P) ? '完美防禦（擋 90%）' : '擋 80%・被打自動盾擊') : '按住 X 防禦', x: '按住防禦' }; }
  };
  // 防禦的時候護著身邊的隊友
  const ha0 = R.hurtAlly;
  if (ha0) R.hurtAlly = (a, raw, src, ...rest) => { const P = W().P; if (P && P.cls === 'knight' && P.guard && a && dist(a, P) < 3.5 && live()) raw *= 0.6; return ha0(a, raw, src, ...rest); };

  // ======================= 武術家：連段 =======================
  CORE.monk = {
    name: '連段', col: '#FFB45A',
    help: P => '連段：打中就疊連段，' + (adv(P) === 'fistsaint' ? '3.5' : '2.5') + ' 秒沒打中、或被打掉超過 2% 生命就斷。每 5 段普攻 +1%（最多 +20%）。X（10 段以上）終結技：前方一大掌，連段越多越痛（每 10 段 +1 倍）。'
      + ({ fistsaint: '拳聖：連段上限 150、3.5 秒才斷。', staffmonk: '棍僧：終結技是身邊一圈。', inner: '內修者：站著不動連段不會掉。', waixiu: '外修者：被打的傷害被魔力罩擋下時，連段不會斷。' }[adv(P)] || ''),
    max: P => (adv(P) === 'fistsaint' ? 150 : 100) + ((R.legOf ? R.legOf(P) : null) === 'lg_thousand' ? 100 : 0),
    step(dt, P) { const keep = adv(P) === 'inner' && P.still > 0.3, gap = adv(P) === 'fistsaint' ? 3.5 : 2.5; if (!keep && (P._combo || 0) > 0 && CT - (P._comboT || 0) > gap) P._combo = 0; },
    onHit(e, d, o, P) { if (d <= 0 || o.reflect) return; if (!P._cbF || CT - P._cbF > 0.05) { P._cbF = CT; P._combo = Math.min(this.max(P), (P._combo || 0) + 1); } P._comboT = CT; },
    mod(e, raw, o, P) { return o.primary ? raw * (1 + Math.min(0.2, (P._combo || 0) * 0.002)) : raw; },
    afterHurt(took, src, P) { if (took > P.hpMax * ((R.legOf ? R.legOf(P) : null) === 'lg_immovable' ? 0.1 : 0.02) && (P._combo || 0) > 0 && !(adv(P) === 'waixiu' && P.shield > 0)) { if (P._combo >= 10) say(P, '連段斷了', 'hurt'); P._combo = 0; } },
    act(P) {
      const c = P._combo || 0; if (c < 10) { toast('連段 10 以上才能放終結技（現在 ' + c + '）'); return; }
      const ring = adv(P) === 'staffmonk', k = pw(P) * 0.8 * (1 + c / 10);
      front(P, ring ? 4 : 3.5, ring ? 6.3 : 1.8).forEach(e => R.coreHit(e, k, { stun: 1, kb: 2 }));
      R.fx && R.fx(ring ? 'ring' : 'swing', P.x, ring ? 0.1 : 1.1, P.z, ring ? { r: 4, color: '#FFB45A' } : { a: P.aimA, range: 3.5, arc: 1.8, color: '#FFB45A' }); R.shake && R.shake(0.25);
      say(P, '終結 ×' + (1 + c / 10).toFixed(1), 'crit'); P._combo = (R.legOf ? R.legOf(P) : null) === 'lg_thousand' ? Math.floor(c / 2) : 0;
    },
    gauge(P) { const c = P._combo || 0, m = this.max(P); return { name: '連段 ' + c, v: c, max: m, full: c >= m, text: '普攻 +' + Math.min(20, Math.floor(c / 5)) + '%', x: c >= 10 ? '終結技 ×' + (1 + c / 10).toFixed(1) : '' }; }
  };
})(window.R);
