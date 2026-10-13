// 術士：自己配法術（2026-10-13 作者：上一版咒文編排太難懂——改成三個選擇就好）
// 每一句法術＝元素（火／冰／雷）＋形狀（彈／扇／柱／球／牆）＋效果（爆炸／穿透／追蹤／反彈）。
//   魔力、傷害、範圍、冷卻都自動算好，畫面上只顯示數字。元素反應照舊（火＋冰＝蒸發、冰＋雷＝碎冰、雷＋火＝過載）。
// 留下地形：「牆」一定會留下 8 秒的地形；「球＋爆炸」也會在落點留下。火＝熔岩（燒人）、冰＝冰刺（擋路、變慢）、雷＝雷柱（擋路、電人）。
//   地形擋得住敵人和敵人的投射物，你和隊友可以穿過去。
// 法術書（城裡選單、暫停選單）：最多 6 句，綁到技能格；沒綁的格子照舊用原本的技能。
// X：把「剛剛放的那一句」換成下一個元素（火→冰→雷），普攻也跟著換。
// 大招「三重咒」：下一句法術傷害 ×3、不耗魔力。
// 轉職：元素師＝選一個拿手元素（傷害 +30%、魔力 −20%）；咒術師＝多一種效果「詛咒」（被打到的敵人受到的傷害 +30%）；外修者＝多一種形狀「罩」（瞬間的魔力護盾，順便震開身邊的敵人）。
// 武器：法杖＝傷害 +15%；法球＝連放同一句每次 −5% 魔力（最多 −25%）；短杖＝冷卻 −25%、傷害 −10%。
// 符卷師（scrollwrite.js）也用這一套：法術書＝符卷書，寫成卷軸後撕開。
// 舊存檔（上一版的咒文）：照名字、元素字自動換成新的三選。
// 放在 archerdraw.js 後面（包 R.castSlot／R.useSkill／R.slotSkill 最外面）。
(function (R) {
  if (!R || !R.CORE || !R.CORE.mage) return;
  const W = () => R.W, S = () => R.S, $ = id => document.getElementById(id), esc = s => (R.esc ? R.esc(String(s == null ? '' : s)) : String(s));
  const CT = () => (R.coreTime ? R.coreTime() : performance.now() / 1000), rnd = Math.random;
  const isM = P => !!(P && P.cls === 'mage'), isSc = P => !!(P && P.cls === 'scroll'), isMS = P => isM(P) || isSc(P);
  const scCls = () => !!(S() && S().cls === 'scroll');
  const live = () => { const w = W(); return !!(w && w.run && !w.run.done && w.P && !w.P.dead && !w.town); };
  const toast = (t, c) => R.toast && R.toast(t, c || '#C8B0FF');
  const say = (P, t, c) => R.num && R.num(P.x, 2.8, P.z, t, c || 'crit');
  const advOf = P => (P && P.adv) || '';
  const base = P => (P && P.item && P.item.base) || '';
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const foes = () => (W().enemies || []).filter(e => !e.dead && !e.under);
  // ---------- 三個選擇 ----------
  const ELS = { fire: { n: '火', c: '#FF6A3A', t: 'lava', tn: '熔岩' }, frost: { n: '冰', c: '#9AD8FF', t: 'ice', tn: '冰刺' }, shock: { n: '雷', c: '#FFE070', t: 'spark', tn: '雷柱' } };
  const ELK = ['fire', 'frost', 'shock'];
  const SHP = {
    bolt: { n: '彈', d: '一發快速的法術彈', k: 2.2, mp: 10, cd: 3, sp: 24, life: 0.8, rad: 0.3, size: 0.28, cnt: 1 },
    fan: { n: '扇', d: '五發散開的小彈，近距離很痛', k: 0.62, mp: 14, cd: 5, sp: 20, life: 0.6, rad: 0.25, size: 0.2, cnt: 5, spread: 0.9 },
    pillar: { n: '柱', d: '準心處從天上打下來', k: 3, mp: 18, cd: 6, r: 2, delay: 0.35 },
    orb: { n: '球', d: '又大又慢的法術球，撞到就炸', k: 3.2, mp: 20, cd: 7, sp: 9, life: 1.4, rad: 0.7, size: 0.65, cnt: 1, burst: 1.8 },
    wall: { n: '牆', d: '準心處立起一道牆（留下地形）', k: 1.6, mp: 22, cd: 10, segs: 5 },
    shield: { n: '罩', d: '瞬間的魔力護盾，順便震開身邊的敵人（外修者）', k: 1.2, mp: 16, cd: 9, only: 'waixiu' }
  };
  const SHK = ['bolt', 'fan', 'pillar', 'orb', 'wall', 'shield'];
  const EFX = {
    boom: { n: '爆炸', d: '打到就炸開一圈（範圍 +2 公尺）' },
    pierce: { n: '穿透', d: '穿過所有敵人' },
    home: { n: '追蹤', d: '自己轉彎追最近的敵人' },
    bounce: { n: '反彈', d: '打到之後彈到下一隻，最多再彈 2 次' },
    curse: { n: '詛咒', d: '打到的敵人 6 秒內受到的傷害 +30%（咒術師）', only: 'hexer' },
    seal: { n: '封印', d: '不造成傷害，把身邊的敵人定住 1.2 秒（封印師的封印符）', only: 'sealer' }
  };
  const EFK = ['boom', 'pierce', 'home', 'bounce', 'curse', 'seal'];
  const okFor = (P, o) => !o.only || advOf(P) === o.only;
  const toCode = sp => sp.el + '-' + sp.sh + '-' + sp.fx;
  const autoName = sp => ELS[sp.el].n + SHP[sp.sh].n + '・' + EFX[sp.fx].n;   // 改了三選、沒自己取名＝名字跟著變
  // 讀一句法術（新的格式；舊的咒文照元素字、形狀字猜）
  const OLDN = { 火射線: 'fire-bolt-pierce', 屏障: 'frost-wall-bounce', 爆炸: 'fire-orb-boom', 水流: 'frost-fan-pierce', 火彈: 'fire-bolt-boom', 冰槍: 'frost-bolt-pierce', 雷擊: 'shock-pillar-boom', 魔力飛彈: 'shock-fan-home', 石牆: 'frost-wall-boom' };
  const parse = (code, name) => {
    code = String(code || '');
    let m = code.match(/^(fire|frost|shock)-(bolt|fan|pillar|orb|wall|shield)-(boom|pierce|home|bounce|curse|seal)$/);
    if (!m && name && OLDN[name]) m = OLDN[name].match(/^(\w+)-(\w+)-(\w+)$/);
    if (!m) {   // 舊咒文
      const el = /Bo|La/.test(code) && !/^Ya/.test(code) ? 'frost' : /Lo/.test(code) && !/^Ya/.test(code) ? 'shock' : 'fire';
      const sh = /Fy/.test(code) ? 'wall' : /-Tr|-Dr/.test(code) ? 'pillar' : /Gf|Uf|Pf|Zf|Hf/.test(code) ? 'orb' : /Fk|Lk/.test(code) ? 'fan' : 'bolt';
      const fx = /Mmˊ/.test(code) ? 'seal' : /Xl/.test(code) ? 'boom' : /Py|Ky/.test(code) ? 'home' : /Wl/.test(code) ? 'bounce' : /ZyZyZy/.test(code) ? 'pierce' : 'boom';
      m = [0, el, sh, fx];
    }
    return { n: name || '', el: m[1], sh: m[2], fx: m[3] };
  };
  const hasSt = (sp, st) => st === 'Dx' && sp && sp.fx === 'seal';
  const PRESETS = [['火彈', 'fire-bolt-boom'], ['冰槍', 'frost-bolt-pierce'], ['落雷', 'shock-pillar-boom'], ['爆炎球', 'fire-orb-boom'], ['冰牆', 'frost-wall-bounce'], ['雷扇', 'shock-fan-home'], ['火扇', 'fire-fan-pierce']];
  R.SPELL_PRESETS = PRESETS;
  const OLD2SP = { fireball: '火彈', m_bolt: '雷扇', m_lance: '冰槍', m_thunder: '落雷', m_manashield: '冰牆', m_flamewall: '火扇' };
  const NSLOT = 5, NSP = 6;
  const fixB = b => {
    if (!Array.isArray(b.bind)) b.bind = Array(NSLOT).fill(null);
    while (b.bind.length < NSLOT) b.bind.push(null);
    b.spells = b.spells.slice(0, NSP).map(x => { const sp = parse(x.code, x.n); return { n: String(x.n || '法術').slice(0, 10), code: toCode(sp), own: x.n && !OLDN[x.n] && !PRESETS.some(q => q[0] === x.n) ? 1 : 0 }; });
    if (b.mainEl && !ELS[b.mainEl]) b.mainEl = ({ Ya: 'fire', Bo: 'frost', La: 'frost', Lo: 'shock' })[b.mainEl] || '';
    b.v = 2; return b;
  };
  const book = () => {
    const s = S(); if (!s) return null;
    const sc = s.cls === 'scroll', KEY = sc ? 'scrollbook' : 'spellbook';
    let b = s[KEY];
    if (!b || !Array.isArray(b.spells)) {
      b = s[KEY] = { v: 2, spells: PRESETS.slice(0, NSP).map(p => ({ n: p[0], code: p[1] })), bind: Array(NSLOT).fill(null), mainEl: '' };
      if (!sc) {
        const fresh = !s.classes || !s.classes.mage || (s.classes.mage.lv || 1) <= 1;
        let lo = []; try { lo = R.loadoutOf ? R.loadoutOf('mage') : []; } catch (e) { lo = []; }
        for (let i = 0; i < NSLOT; i++) { const want = OLD2SP[lo[i]]; const k = want ? b.spells.findIndex(x => x.n === want) : -1; if (k >= 0 && !b.bind.includes(k)) b.bind[i] = k; else if (fresh && i < 4 && !b.bind.includes(i)) b.bind[i] = i; }
      }
    }
    if (b.v !== 2) fixB(b); else if (!Array.isArray(b.bind) || b.bind.length < NSLOT) fixB(b);
    return b;
  };
  R.spellBook = book;
  const mg0 = R.migrate;
  R.migrate = s => { s = mg0 ? mg0(s) : s; try { ['spellbook', 'scrollbook'].forEach(k => { if (s && s[k] && Array.isArray(s[k].spells) && s[k].v !== 2) fixB(s[k]); }); if (s && s.scrollBag && !s._bag2) { const nb = {}; Object.keys(s.scrollBag).forEach(c => { const k = toCode(parse(c)); nb[k] = (nb[k] || 0) + (s.scrollBag[c] || 0); }); s.scrollBag = nb; s._bag2 = 1; } } catch (e) { } return s; };
  if (S()) R.migrate(S());
  // ---------- 計算 ----------
  const pwOf = P => (R.SKILL_KIT && R.SKILL_KIT.power && P && P.ws && P.ws.dmg ? R.SKILL_KIT.power(P.ws) : 30);
  const evalSpell = (sp, ctx) => {
    ctx = ctx || {}; const P = ctx.P || (W() && W().P) || {}, Sh = SHP[sp.sh] || SHP.bolt, F = EFX[sp.fx] || EFX.boom, errs = [];
    if (!okFor(P, Sh) && !isSc(P)) errs.push('「' + Sh.n + '」只有外修者能用');
    if (!okFor(P, F)) errs.push('「' + F.n + '」只有' + (F.only === 'hexer' ? '咒術師' : '封印師') + '能用');
    if (Sh.only && isSc(P)) errs.push('符卷師不能寫「' + Sh.n + '」');
    let mp = Sh.mp, k = Sh.k, cd = Sh.cd, r = Sh.r || 0;
    if (sp.fx === 'boom') { mp += 3; r = (r || 0) + 2; }
    if (sp.fx === 'pierce') { k *= 0.9; mp += 2; }
    if (sp.fx === 'home') { k *= 0.9; mp += 2; }
    if (sp.fx === 'bounce') { k *= 0.85; mp += 3; }
    if (sp.fx === 'curse') { k *= 0.9; mp += 2; }
    if (sp.fx === 'seal') { k = 0; mp += 4; cd += 4; }
    const b = ctx.book || (S() ? book() : null);
    if (advOf(P) === 'elementalist' && b && b.mainEl === sp.el) { k *= 1.3; mp *= 0.8; }
    if (base(P) === 'staff') k *= 1.15; else if (base(P) === 'wand') { k *= 0.9; cd *= 0.75; }
    if (ctx.orbK) mp *= ctx.orbK;
    const f = ctx.field;
    if (f && f.has('zp')) mp *= 0.8;
    if (f && f.has('gk')) k *= 1.3;
    if (f && f.has('dp')) k *= 1.15;
    if (ctx.ult) { k *= 3; mp = 0; }
    const pw = ctx.pw || pwOf(P), dmg = pw * k;
    const leaves = sp.sh === 'wall' || (sp.sh === 'orb' && sp.fx === 'boom');
    const cnt = Sh.cnt || (sp.sh === 'wall' ? Sh.segs : 1);
    const range = Sh.sp ? Math.round(Sh.sp * Sh.life * 10) / 10 : sp.sh === 'shield' ? 2.5 : 11;
    return { sp, errs, mp: Math.round(mp * 10) / 10, cd: Math.round(cd * 10) / 10, dmg, dmgShow: Math.round(dmg * (sp.sh === 'fan' ? 5 : 1)), r: Math.round(r * 10) / 10, range, leaves, terr: ELS[sp.el].tn, cnt, cast: sp.sh === 'shield' ? 0 : 0.25 * (f && f.has('tx') ? 0.6 : 1), Sh, el: sp.el };
  };
  // ---------- 執行期 ----------
  const RT = { cast: null, bolts: [], solids: [], lastK: -1, orb: { k: -1, n: 0 } };
  R.spellRT = RT;
  const TH = () => window.THREE, scene = () => W() && W().scene;
  const mk = (geo, col, op) => { const t = TH(), sc = scene(); if (!t || !sc) return null; const me = new t.Mesh(geo, new t.MeshBasicMaterial({ color: col, transparent: true, opacity: op || 0.9, side: t.DoubleSide, depthWrite: (op || 0.9) > 0.7 })); sc.add(me); return me; };
  const drop = me => { try { if (me) { if (me.parent) me.parent.remove(me); if (me.geometry) me.geometry.dispose(); if (me.material) me.material.dispose(); } } catch (e) { } };
  const clearAll = () => { RT.bolts.forEach(b => drop(b.mesh)); RT.solids.forEach(s => drop(s.mesh)); RT.bolts = []; RT.solids = []; RT.cast = null; };
  const field = () => (R.souyuMage ? R.souyuMage() : null);
  const fieldAt = (x, z) => { const f = field(); return f && f.inside(x, z) ? f : null; };
  const hit = (e, dmg, b, extra) => {
    if (!e || e.dead) return;
    let el = b.el; const f = b.field || fieldAt(e.x, e.z);
    if (f && f.has('zd') && e._el && (e._el[el] || 0) > CT()) el = ELK[(ELK.indexOf(el) + 1) % 3];   // 魔法場「變調」
    const o = Object.assign({ spell: 1, vSk: 'spell', primary: false, elem: el }, extra || {});
    R.hurtEnemy(e, dmg, o);
    if (b.fx === 'curse' && !e.dead) { e.st.curse = Math.max(e.st.curse || 0, 6); R.fx && R.fx('ring', e.x, 0.6, e.z, { r: 0.9, color: '#A86AE8' }); }
  };
  const boom = (x, z, r, dmg, b) => { R.fx && R.fx('boom', x, 0.4, z, { r, color: ELS[b.el].c }); R.shake && R.shake(0.12); foes().forEach(e => { if (Math.hypot(e.x - x, e.z - z) < r + e.def.size * 0.5) hit(e, dmg, b); }); };
  // 地形
  const addTerrain = (kind, x, z, a, el, dmg, P) => {
    if (R.isFloor && W().F && !R.isFloor(x, z)) return null;
    const t = TH(); let me = null;
    if (t) {
      if (kind === 'lava') { me = mk(new t.CircleGeometry(1.1, 20), '#FF5A1A', 0.6); if (me) { me.rotation.x = -Math.PI / 2; me.position.set(x, 0.07, z); } }
      else if (kind === 'ice') { me = mk(new t.ConeGeometry(0.5, 1.8, 6), '#BFE8FF', 0.9); if (me) me.position.set(x, 0.9, z); }
      else { me = mk(new t.CylinderGeometry(0.35, 0.45, 2, 8), '#FFE070', 0.8); if (me) me.position.set(x, 1, z); }
    }
    const s = { kind, x, z, r: kind === 'lava' ? 1.1 : 0.65, block: kind !== 'lava', t: 8, el, mesh: me, dmg, tick: 0 };
    RT.solids.push(s); return s;
  };
  const terrainOf = el => ELS[el].t;
  const stepSolids = dt => {
    const w = W();
    for (const s of RT.solids) {
      s.t -= dt; if (s.mesh && s.t < 1) s.mesh.scale.setScalar(Math.max(0.05, s.t));
      if (s.block) {
        (w.shots || []).forEach(q => { if (!q.dead && q.owner !== 'p' && Math.hypot(q.x - s.x, q.z - s.z) < s.r + (q.rad || 0.2)) { if (s.bounce && q.vx != null) { q.owner = 'p'; q.vx = -q.vx; q.vz = -q.vz; if (q.a != null) q.a += Math.PI; } else R.killShot(q); } });
        foes().forEach(e => { const d = Math.hypot(e.x - s.x, e.z - s.z), need = s.r + e.def.size * 0.5; if (d < need && d > 1e-4) { const k = (need - d) / d; e.x += (e.x - s.x) * k; e.z += (e.z - s.z) * k; } });
      }
      s.tick -= dt;
      if (s.tick <= 0) { s.tick = 0.5; foes().forEach(e => { const d = Math.hypot(e.x - s.x, e.z - s.z); if (d < s.r + e.def.size * 0.5 + 0.4) { if (s.kind === 'lava') hit(e, s.dmg * 0.3, { el: 'fire' }); else if (s.kind === 'ice') e.st.slow = Math.max(e.st.slow || 0, 1); else { R.fx && R.fx('bolt', s.x, 1.6, s.z, { to: e, color: '#FFE070' }); hit(e, s.dmg * 0.25, { el: 'shock' }); } } }); }
      if (s.t <= 0) { s.dead = true; drop(s.mesh); }
    }
    RT.solids = RT.solids.filter(s => !s.dead);
  };
  R.spellSolids = () => RT.solids;
  const aimPt = (P, max) => { if (R.SKILL_KIT && R.SKILL_KIT.aimIn) return R.SKILL_KIT.aimIn(P, max); return [P.x + Math.sin(P.aimA || 0) * 6, P.z + Math.cos(P.aimA || 0) * 6]; };
  const nearest = (x, z, R2, skip) => { let best = null, bd = R2; foes().forEach(e => { if (skip && skip.has(e)) return; const d = Math.hypot(e.x - x, e.z - z); if (d < bd) { bd = d; best = e; } }); return best; };
  // 放出去
  const release = (P, r, slot) => {
    const sp = r.sp, Sh = r.Sh, col = ELS[sp.el].c, f = fieldAt(P.x, P.z), b0 = { el: sp.el, fx: sp.fx };
    if (sp.fx === 'seal') {
      foes().forEach(e => { if (dist(e, P) < 6 + e.def.size * 0.5) { e.st.stun = Math.max(e.st.stun || 0, e.def.boss ? 0.4 : 1.2); if (e.cd != null) e.cd = Math.max(e.cd, 1.2); } });
      R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 6, color: '#F2E6A0' }); say(P, '封印'); return;
    }
    if (sp.sh === 'shield') {
      P.shield = Math.max(P.shield || 0, 0) + P.hpMax * 0.25; if (P.buff) P.buff.shieldT = Math.max(P.buff.shieldT || 0, 6);
      R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 2.5, color: col }); foes().forEach(e => { if (dist(e, P) < 2.5 + e.def.size * 0.5) hit(e, r.dmg, b0, { kb: 3 }); });
      say(P, '魔力罩'); return;
    }
    if (sp.sh === 'pillar') {
      const [x, z] = aimPt(P, 12), rad = r.r || 2;
      R.fx && R.fx('ring', x, 0.1, z, { r: rad, color: col });
      setTimeout(() => { if (!live()) return; R.fx && R.fx('pillar', x, 0, z, { color: col }); boom(x, z, rad, r.dmg, b0); if (sp.fx === 'bounce') { const e = nearest(x, z, 8); if (e) { R.fx && R.fx('bolt', x, 1, z, { to: e, color: col }); hit(e, r.dmg * 0.6, b0); } } }, Sh.delay * 1000);
      return;
    }
    if (sp.sh === 'wall') {
      let [x, z] = aimPt(P, 8); if (sp.fx === 'home') { const e = nearest(P.x, P.z, 12); if (e) { x = e.x; z = e.z; } }
      const a = Math.atan2(x - P.x, z - P.z), n = sp.fx === 'pierce' ? 7 : Sh.segs, kind = terrainOf(sp.el), made = [];
      for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * 1.1, s = addTerrain(kind, x + Math.cos(a) * o, z - Math.sin(a) * o, a, sp.el, r.dmg, P); if (s) { s.block = true; s.bounce = sp.fx === 'bounce'; made.push(s); } }
      made.forEach(s => foes().forEach(e => { if (Math.hypot(e.x - s.x, e.z - s.z) < 1.2 + e.def.size * 0.5) hit(e, r.dmg / 2, b0); }));
      if (sp.fx === 'boom') made.forEach(s => { s.boomAt = 1; });
      R.fx && R.fx('poof', x, 0.6, z, { color: col, n: 14 }); say(P, '留下地形：' + ELS[sp.el].tn, 'heal');
      return;
    }
    const n = Sh.cnt, a0 = P.aimA || 0;
    for (let i = 0; i < n; i++) {
      const a = a0 + (n > 1 ? (i - (n - 1) / 2) * (Sh.spread / (n - 1)) : 0), t = TH();
      const mesh = t ? mk(new t.SphereGeometry(Sh.size * (sp.fx === 'pierce' ? 0.8 : 1), 10, 8), col, 0.92) : null;
      if (mesh && sp.fx === 'pierce') mesh.scale.set(1, 1, 2.6);
      RT.bolts.push({ x: P.x + Math.sin(a) * 0.6, z: P.z + Math.cos(a) * 0.6, a, sp: Sh.sp, life: Sh.life * (sp.fx === 'home' ? 1.6 : 1), rad: Sh.rad, dmg: r.dmg, el: sp.el, fx: sp.fx, sh: sp.sh, mesh, hitSet: new Set(), hops: sp.fx === 'bounce' ? 2 : 0, leaves: r.leaves, burst: (Sh.burst || 0) + (sp.fx === 'boom' ? 2 : 0), field: f, t: 0 });
    }
  };
  const endBolt = (b, P) => {
    b.dead = true; drop(b.mesh);
    if (b.burst) boom(b.x, b.z, b.burst, b.dmg * (b.sh === 'orb' ? 0.6 : 0.5), b);
    if (b.leaves) { const kind = terrainOf(b.el); [0, 1, 2].forEach(i => addTerrain(kind, b.x + Math.cos(i * 2.1) * (i ? 0.9 : 0), b.z + Math.sin(i * 2.1) * (i ? 0.9 : 0), 0, b.el, b.dmg, P)); say(P, '留下地形：' + ELS[b.el].tn, 'heal'); }
  };
  const stepBolts = dt => {
    const P = W().P;
    for (const b of RT.bolts) {
      if (b.dead) continue;
      b.t += dt; b.life -= dt;
      if (b.fx === 'home' || (b.field && b.field.has('dp'))) { const e = nearest(b.x, b.z, 10, b.hitSet); if (e) { const want = Math.atan2(e.x - b.x, e.z - b.z); let d = want - b.a; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; b.a += Math.max(-7 * dt, Math.min(7 * dt, d)); } }
      const nx = b.x + Math.sin(b.a) * b.sp * dt, nz = b.z + Math.cos(b.a) * b.sp * dt;
      if (R.isFloor && W().F && !R.isFloor(nx, nz)) { endBolt(b, P); continue; }
      b.x = nx; b.z = nz; if (b.mesh) { b.mesh.position.set(b.x, 1.1, b.z); b.mesh.rotation.y = b.a; }
      // 撞到別種元素的地形＝反應
      for (const s of RT.solids) { if (s.dead || s.el === b.el || !s.block) continue; if (Math.hypot(s.x - b.x, s.z - b.z) < s.r + b.rad) { s.dead = true; s.t = 0; drop(s.mesh); boom(s.x, s.z, 2.6, b.dmg * 1.2, b); say(P, '地形引爆'); if (b.fx !== 'pierce') { endBolt(b, P); } break; } }
      if (b.dead) continue;
      for (const e of foes()) {
        if (b.hitSet.has(e)) continue;
        if (Math.hypot(e.x - b.x, e.z - b.z) < b.rad + e.def.size * 0.5) {
          b.hitSet.add(e); hit(e, b.dmg, b);
          if (b.fx === 'pierce') continue;
          if (b.hops > 0) { const n2 = nearest(e.x, e.z, 7, b.hitSet); if (n2) { b.hops--; b.dmg *= 0.75; b.a = Math.atan2(n2.x - e.x, n2.z - e.z); R.fx && R.fx('bolt', e.x, 1.1, e.z, { to: n2, color: ELS[b.el].c }); b.life = Math.max(b.life, 0.6); break; } }
          endBolt(b, P); break;
        }
      }
      if (!b.dead && b.life <= 0) endBolt(b, P);
    }
    RT.bolts = RT.bolts.filter(b => !b.dead);
    if (P) RT.solids.forEach(s => { if (s.boomAt && s.t <= 0.05 && !s.boomed) { s.boomed = 1; boom(s.x, s.z, 1.8, s.dmg * 0.6, { el: s.el }); } });
  };
  // ---------- 施法 ----------
  const UNLOCK = i => (R.SKILL_UNLOCK || [1, 3, 6, 10, 15])[i] || 1;
  const cdGet = (P, i) => (i === 0 ? P.skillCd || 0 : (P.skCd && P.skCd[i]) || 0);
  const cdSet = (P, i, v) => { if (i === 0) P.skillCd = v; else { P.skCd = P.skCd || [0, 0, 0, 0, 0]; P.skCd[i] = v; } };
  const boundK = (P, i) => { if (!isMS(P)) return -1; const b = book(); if (!b) return -1; const k = b.bind[i]; return k != null && b.spells[k] ? k : -1; };
  const curSpell = k => { const b = book(), x = b && b.spells[k]; return x ? parse(x.code, x.n) : null; };
  const ctxFor = (P, k) => { let orbK = 0; if (base(P) === 'orb') { const n = RT.orb.k === k ? Math.min(5, RT.orb.n + 1) : 0; orbK = 1 - 0.05 * n; } return { P, ult: !!P._spUlt, field: fieldAt(P.x, P.z), orbK }; };
  const castSpell = (P, slot, k) => {
    if (isSc(P)) return R.scrollTear ? R.scrollTear(P, slot, k) : undefined;
    if (RT.cast) return;
    if ((P.lv || 1) < UNLOCK(slot)) { toast('職業等級 ' + UNLOCK(slot) + ' 才會打開這一格'); return; }
    if (cdGet(P, slot) > 0 || P.dead || P.knockT > 0) return;
    const sp = curSpell(k); if (!sp) return;
    const r = evalSpell(sp, ctxFor(P, k));
    if (r.errs.length) { toast(r.errs[0], '#FF9A8A'); return; }
    if (P.mp < r.mp) { toast('魔力不夠（要 ' + r.mp + '）'); return; }
    P.mp -= r.mp; cdSet(P, slot, r.cd * (P.skillCdMult || 1));
    if (P._spUlt) { P._spUlt = false; say(P, '三重咒！'); }
    if (base(P) === 'orb') { RT.orb.n = RT.orb.k === k ? Math.min(5, RT.orb.n + 1) : 0; RT.orb.k = k; }
    P._el = sp.el; RT.lastK = k;
    RT.cast = { slot, k, r, t: 0, dur: r.cast };
    R.sfx && R.sfx('skill');
    if (r.cast <= 0) finishCast(P);
  };
  const finishCast = P => { const c = RT.cast; RT.cast = null; if (c) release(P, c.r, c.slot); };
  R.spellCast = slot => { const P = W().P, k = boundK(P, slot); if (k >= 0) castSpell(P, slot, k); };
  // ---------- 包外面 ----------
  const cs0 = R.castSlot, us0 = R.useSkill, ss0 = R.slotSkill;
  const mine = (P, i) => isMS(P) && live() && boundK(P, i) >= 0;
  R.castSlot = i => { const P = W() && W().P; if (mine(P, i | 0)) return castSpell(P, i | 0, boundK(P, i | 0)); return cs0 ? cs0(i) : undefined; };
  R.useSkill = (...a) => { const P = W() && W().P; if (mine(P, 0)) return castSpell(P, 0, boundK(P, 0)); return us0 ? us0(...a) : undefined; };
  const skCache = {};
  const descOf = (sp, r) => ELS[sp.el].n + '・' + SHP[sp.sh].n + '・' + EFX[sp.fx].n + '：魔力 ' + r.mp + '、傷害 ' + r.dmgShow + (r.r ? '、範圍 ' + r.r + ' 公尺' : '') + '、冷卻 ' + r.cd + ' 秒' + (r.leaves ? '、留下地形（' + r.terr + '）' : '');
  R.slotSkill = (P, i) => {
    const k = boundK(P, i); if (k < 0) return ss0 ? ss0(P, i) : null;
    if ((P.lv || 1) < UNLOCK(i)) return null;
    const id = 'sp_' + k, x = book().spells[k];
    if (!skCache[id] || skCache[id].code !== x.code || skCache[id].n !== x.n) {
      let r = null; const sp = parse(x.code, x.n); try { r = evalSpell(sp, { P }); } catch (e) { }
      skCache[id] = { code: x.code, n: x.n };
      R.SKILLS[id] = { name: x.n, cls: P.cls, cd: r ? r.cd : 2, mp: isSc(P) ? 0 : r ? r.mp : 0, spell: 1, desc: r ? descOf(sp, r) : '' };
    }
    return id;
  };
  const resetCache = () => Object.keys(skCache).forEach(k => delete skCache[k]);
  const st0 = R.step;
  R.step = dt => {
    const r = st0(dt), w = W();
    try {
      if (w && !w.paused && w.run && w.P) {
        const P = w.P;
        if (RT.cast) { if (!isMS(P) || P.dead || !live()) RT.cast = null; else { RT.cast.t += dt; if (RT.cast.t >= RT.cast.dur) finishCast(P); } }
        if (RT.bolts.length) stepBolts(dt);
        if (RT.solids.length) stepSolids(dt);
      }
    } catch (e) { console.warn('[spellcraft]', e); }
    return r;
  };
  const lf0 = R.loadFloor; R.loadFloor = (...a) => { clearAll(); return lf0(...a); };
  const sr0 = R.startRun; if (sr0) R.startRun = (...a) => { RT.orb = { k: -1, n: 0 }; RT.lastK = -1; clearAll(); return sr0(...a); };
  // ---------- 職業核心：X 換元素 ----------
  const C = R.CORE.mage;
  const pickK = P => { const b = book(); if (RT.lastK >= 0 && b.spells[RT.lastK]) return RT.lastK; const k = boundK(P, 0); return k >= 0 ? k : -1; };
  C.act = function (P) {
    const k = pickK(P), b = book();
    if (k < 0) { P._el = ELK[(ELK.indexOf(P._el || 'fire') + 1) % 3]; say(P, ELS[P._el].n, 'heal'); return; }
    const sp = parse(b.spells[k].code, b.spells[k].n); sp.el = ELK[(ELK.indexOf(sp.el) + 1) % 3]; b.spells[k].code = toCode(sp); if (!b.spells[k].own) b.spells[k].n = autoName(sp); P._el = sp.el; resetCache();
    say(P, b.spells[k].n + '→' + ELS[sp.el].n, 'heal'); R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 1.4, color: ELS[sp.el].c }); R.save && R.save();
  };
  C.help = P => '自己配法術：每一句＝元素（火／冰／雷）＋形狀（彈／扇／柱／球／牆）＋效果（爆炸／穿透／追蹤／反彈），在「法術書」裡配好、綁到技能格。X：把剛剛放的那一句換成下一個元素（普攻也跟著換）。同一隻敵人身上碰到兩種元素就引爆：火＋冰＝蒸發、冰＋雷＝碎冰、雷＋火＝過載。「牆」和「球＋爆炸」會留下 8 秒的地形（擋敵人，不擋隊友）。'
    + ({ elementalist: '元素師：在法術書選一個拿手元素，那個元素的法術傷害 +30%、魔力 −20%。', hexer: '咒術師：多一種效果「詛咒」。', waixiu: '外修者：多一種形狀「罩」（魔力護盾）。' }[advOf(P)] || '');
  C.gauge = function (P) {
    const k = pickK(P), b = book(), x = k >= 0 ? b.spells[k] : null, sp = x ? parse(x.code, x.n) : null, el = sp ? sp.el : P._el || 'fire';
    return { name: '元素：' + ELS[el].n + (x ? '（' + x.n + '）' : ''), col: ELS[el].c, text: P._spUlt ? '下一句：三重咒（×3、不耗魔）' : '火＋冰 蒸發・冰＋雷 碎冰・雷＋火 過載', x: '換成' + ELS[ELK[(ELK.indexOf(el) + 1) % 3]].n };
  };
  if (R.ULTS && R.ULTS.mage) Object.assign(R.ULTS.mage, { name: '三重咒', sub: '術士的大招：下一句法術傷害 ×3、不耗魔力，技能冷卻全部歸零', go: P => { P._spUlt = true; [0, 1, 2, 3, 4].forEach(i => cdSet(P, i, 0)); say(P, '三重咒'); toast('下一句法術：傷害 ×3、不耗魔力！', '#FFE08A'); } });
  // ---------- 法術書 ----------
  const css = document.createElement('style');
  css.textContent = 'body:has(#sp-book:not([hidden])) #tu2-card,body:has(#sp-book:not([hidden])) #tu2-ring,body:has(#sp-book:not([hidden])) #tu2-arrow{display:none!important}'
    + '#sp-book{position:fixed;inset:0;z-index:9990;background:rgba(6,4,10,.72);display:flex;align-items:center;justify-content:center}'
    + '#sp-book .spb{width:min(860px,calc(100vw - 16px));max-height:calc(100dvh - 16px);overflow:auto;background:linear-gradient(180deg,#1E1A26,#16131C);color:#E8E0D0;border:1px solid rgba(184,138,255,.45);border-top:3px solid #7A5AB8;border-radius:8px;padding:12px 14px;font-size:13px;box-shadow:0 10px 40px rgba(0,0,0,.6)}'
    + '#sp-book .sp-h{display:flex;align-items:center;gap:10px;margin-bottom:8px}#sp-book .sp-h h3{margin:0;font-size:17px;color:#F0E6FF}#sp-book .sp-h small{flex:1;color:#A89CB8}'
    + '#sp-book .sp-cols{display:grid;grid-template-columns:220px 1fr;gap:12px}@media (max-width:640px){#sp-book .sp-cols{grid-template-columns:1fr}}'
    + '#sp-book .sp-list>div{background:#221D2B;border:1px solid #3E3550;border-radius:6px;padding:6px 8px;margin-bottom:5px;cursor:pointer}#sp-book .sp-list>div.on{border-color:#B88AFF;box-shadow:0 0 0 1px #B88AFF inset}#sp-book .sp-list small{color:#A89CB8;display:block}'
    + '#sp-book button,#sp-book select,#sp-book input{background:#2E2836;color:#E8E0D0;border:1px solid #5A5070;border-radius:4px;padding:4px 9px;font-size:13px;min-height:30px}#sp-book button{cursor:pointer}#sp-book button:disabled{opacity:.4;cursor:default}'
    + '#sp-book .chips{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 10px}#sp-book .chips button{min-width:58px}#sp-book .chips button.on{background:#4A3478;border-color:#B88AFF;color:#fff}'
    + '#sp-book .sp-row>b{display:block;color:#D8C8F0;margin-top:4px}#sp-book .hint{color:#A89CB8;font-size:12px}'
    + '#sp-book .sp-out{display:flex;flex-wrap:wrap;gap:6px 16px;background:#120F17;border:1px solid #352D44;border-radius:6px;padding:8px 10px;margin-top:6px;font-size:14px}#sp-book .sp-out b{color:#FFE7A8}'
    + '#sp-book .sp-err{color:#FF9A8A;margin-top:6px}#sp-book .sp-bind{display:flex;flex-wrap:wrap;gap:6px 12px;margin-top:10px;padding-top:8px;border-top:1px solid #352D44}';
  document.head.appendChild(css);
  const BK = { i: 0, paused: false };
  const opt = (v, t, cur) => '<option value="' + esc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(t) + '</option>';
  const chips = (f, keys, tbl, cur, P) => '<div class="chips">' + keys.filter(k => okFor(P, tbl[k]) && !(isSc(P) && tbl[k].only === 'waixiu')).map(k => '<button type="button" data-f="' + f + '" data-v="' + k + '" class="' + (k === cur ? 'on' : '') + '" title="' + esc(tbl[k].d || '') + '">' + esc(tbl[k].n) + '</button>').join('') + '</div>';
  const bookHtml = () => {
    const w = W(), P = (w && w.P) || { cls: S().cls, adv: (S().classes[S().cls] || {}).adv || '', lv: (S().classes[S().cls] || {}).lv || 1 }, b = book(), sc = scCls();
    BK.i = Math.max(0, Math.min(b.spells.length - 1, BK.i));
    const x = b.spells[BK.i], sp = x ? parse(x.code, x.n) : null, r = sp ? evalSpell(sp, { P, book: b }) : null;
    const skillName = i => { let id = null; try { id = ss0 ? ss0(P, i) : null; } catch (e) { } return id && R.SKILLS[id] ? R.SKILLS[id].name : '（空）'; };
    const ttl = sc ? '符卷書' : '法術書';
    return '<div class="spb" role="dialog" aria-label="' + ttl + '"><div class="sp-h"><h3>' + ttl + '</h3><small>' + (sc ? '配好的法術要到白藤堂的書桌寫成卷軸，戰鬥中按技能鍵撕開。' : '每一句法術選三樣：元素、形狀、效果。魔力和傷害會自動算好。') + '</small><button type="button" data-a="x">關閉</button></div>'
      + '<div class="sp-cols"><div><div class="sp-list">' + b.spells.map((y, i) => { let q = null; try { q = evalSpell(parse(y.code, y.n), { P, book: b }); } catch (e) { } const s2 = parse(y.code, y.n); return '<div data-a="pick" data-i="' + i + '" class="' + (i === BK.i ? 'on' : '') + '"><b>' + esc(y.n) + '</b><small>' + esc(ELS[s2.el].n + '・' + SHP[s2.sh].n + '・' + EFX[s2.fx].n) + (q && !sc ? '　魔力 ' + q.mp : '') + '</small></div>'; }).join('') + '</div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:4px"><button type="button" data-a="new"' + (b.spells.length >= NSP ? ' disabled' : '') + '>新增</button><button type="button" data-a="del"' + (b.spells.length ? '' : ' disabled') + '>刪掉</button></div>'
      + (advOf(P) === 'elementalist' ? '<div class="sp-row"><b>拿手元素（元素師）</b><div class="chips">' + ELK.map(k => '<button type="button" data-a="mainEl" data-v="' + k + '" class="' + (b.mainEl === k ? 'on' : '') + '">' + ELS[k].n + '</button>').join('') + '</div><span class="hint">這個元素的法術傷害 +30%、魔力 −20%。</span></div>' : '')
      + '</div><div>' + (sp ? '<div class="sp-row"><b>名字</b><input data-f="name" value="' + esc(x.n) + '" maxlength="10"></div>'
        + '<div class="sp-row"><b>元素</b>' + chips('el', ELK, ELS, sp.el, P) + '</div>'
        + '<div class="sp-row"><b>形狀</b>' + chips('sh', SHK, SHP, sp.sh, P) + '<span class="hint">' + esc(SHP[sp.sh].d) + '</span></div>'
        + '<div class="sp-row"><b>效果</b>' + chips('fx', EFK, EFX, sp.fx, P) + '<span class="hint">' + esc(EFX[sp.fx].d) + '</span></div>'
        + '<div class="sp-out">' + (sc ? '' : '<span>魔力 <b>' + r.mp + '</b></span>') + '<span>傷害 <b>' + r.dmgShow + '</b></span><span>範圍 <b>' + (r.r ? r.r + ' 公尺' : '單體') + '</b></span><span>射程 <b>' + r.range + ' 公尺</b></span><span>冷卻 <b>' + r.cd + ' 秒</b></span>' + (r.leaves ? '<span>留下地形 <b>' + esc(r.terr) + ' 8 秒</b></span>' : '') + '</div>'
        + (r.errs.length ? '<div class="sp-err">⚠ ' + r.errs.map(esc).join('；') + '</div>' : '') : '<p>還沒有法術，按「新增」。</p>')
      + '</div></div>'
      + '<div class="sp-bind"><b>技能格</b>' + b.bind.map((k, i) => '<label>技能' + '一二三四五'[i] + ' <select data-a="bind" data-i="' + i + '">' + opt('', '原本的：' + skillName(i), k == null ? '' : k) + b.spells.map((y, j) => opt(j, y.n, k == null ? '' : k)).join('') + '</select></label>').join('') + '</div></div>';
  };
  const render = () => {
    const el = $('sp-book'); if (!el || el.hidden) return; const b = book(); el.innerHTML = bookHtml();
    const done = () => { resetCache(); R.save && R.save(); render(); };
    el.querySelectorAll('[data-f]').forEach(n => {
      const f = n.dataset.f;
      if (f === 'name') { n.onchange = () => { const x = b.spells[BK.i], v = n.value.trim().slice(0, 10); x.n = v || autoName(parse(x.code)); x.own = !!v; done(); }; return; }
      n.onclick = () => { const x = b.spells[BK.i], sp = parse(x.code, x.n); sp[f] = n.dataset.v; x.code = toCode(sp); if (!x.own) x.n = autoName(sp); done(); };
    });
    el.querySelectorAll('[data-a]').forEach(n => {
      const a = n.dataset.a;
      if (a === 'bind') { n.onchange = () => { const i = +n.dataset.i; b.bind[i] = n.value === '' ? null : +n.value; done(); }; return; }
      n.onclick = () => {
        if (a === 'x') return R.closeSpellBook();
        if (a === 'pick') BK.i = +n.dataset.i;
        if (a === 'mainEl') b.mainEl = n.dataset.v;
        if (a === 'new' && b.spells.length < NSP) { b.spells.push({ n: '火彈・爆炸', code: 'fire-bolt-boom' }); BK.i = b.spells.length - 1; }
        if (a === 'del' && b.spells.length) { b.spells.splice(BK.i, 1); b.bind = b.bind.map(k => (k == null ? null : k === BK.i ? null : k > BK.i ? k - 1 : k)); BK.i = Math.max(0, BK.i - 1); }
        done();
      };
    });
  };
  R.openSpellBook = () => {
    const P = W() && W().P; if (!S() || (P && !isMS(P)) || (!P && S().cls !== 'mage' && S().cls !== 'scroll')) return;
    let el = $('sp-book'); if (!el) { el = document.createElement('div'); el.id = 'sp-book'; document.body.appendChild(el); el.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); R.closeSpellBook(); } }); el.addEventListener('pointerdown', e => { if (e.target === el) R.closeSpellBook(); }); }
    el.hidden = false; const w = W(); BK.paused = !!(w && w.run && !w.paused); if (BK.paused) w.paused = true;
    render();
  };
  R.closeSpellBook = () => { const el = $('sp-book'); if (el) el.hidden = true; const w = W(); if (BK.paused && w) w.paused = false; BK.paused = false; };
  const addBtn = () => { const P = W() && W().P; if (!isMS(P) && !(S() && (S().cls === 'mage' || S().cls === 'scroll'))) return; const row = $('r-sheet') && $('r-sheet').querySelector('.row'); if (!row || row.querySelector('#sp-open')) return; const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.id = 'sp-open'; b.textContent = scCls() ? '符卷書' : '法術書'; b.onclick = () => { R.closeSheet && R.closeSheet(); R.openSpellBook(); }; row.appendChild(b); };
  const ps = R.pauseSheet; if (ps) R.pauseSheet = (...a) => { const r = ps(...a); try { addBtn(); } catch (e) { } return r; };
  const tm = R.townMenu; if (tm) R.townMenu = (...a) => { const r = tm(...a); try { addBtn(); } catch (e) { } return r; };
  R.spellKit = { isSc, ctxFor, curSpell, hasSt, cdSet, cdGet, UNLOCK, parse, toCode, evalSpell, PRESETS, OLD2SP, RT, book, boundK, castSpell, finishCast, release, ELS, SHP, EFX };
})(window.R);
