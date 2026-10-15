// 特質的效果：數值、開局、裝備和職業的限制（2026-10-15 作者《特質與熟練度》＋審查問題的答案）
// 資料、點數在 races/traits.js；選擇畫面在 races/traitpick.js。
// - 力量（R.strOf）、體質（R.conOf）、幸運（R.luckOf）、經驗（R.gainXp）、熟練度獲得（R.profGainMul）、熟練度等級（R.profAdj）。
// - 全屬性（Q05、F07、F08）：特質之間相加，合計最低 −90%。本來就是 % 的（閃避率、暴擊率、暴擊傷害）直接加減、最低 0；
//   其他（生命上限、攻擊、物防、魔防、移動、攻擊距離、每秒回魔、攻擊速度、技能急速）照 % 乘。
//   公子 −8%、裸體行者 +10%、孤掌難鳴（下遺跡時同行的勇者 0／1／2 位：−35%／−5%／0；連線的朋友也算）。
// - 減傷係數（P.dmgRed，Q30、F16）：硬身、皮薄、體弱多病；負的閃避每 −1% 算 −0.25%。全部相加，最高 75%、最低 −100%（受到的傷害 ×2）；
//   在 R.hurtPlayer 乘在最前面（遺跡崩塌的 9999 不算）。之後減傷的改版（第 3 步）會把其他「受到的傷害減少」也併進來。
// - 生命上限：先加減（硬身、身強體壯、越戰越勇、殘疾之人 ×0.8、全屬性），玻璃大砲 ×0.15 最後才扣；最低 1。
// - 弱法之人：不能用魔法武器、不能造成魔法攻擊（用物理武器打的普攻帶元素也照算）；殘疾之人：不能用物理武器、不能造成物理攻擊。
//   建角色、公會改登記都擋住衝突的職業（Q03、F02）；轉職路線不擋。反傷、荊棘不算。
// - 裸體行者：不能穿頭、上衣、褲子、鞋子（舊角色選了會脫下來放進倉庫）。
// - 開局（R.traitApplyStart）：公子 +2000 費拉；準備完善 +200 費拉＋一整套「稀有」（武器＋四件護具，護具照力量挑穿得動的最重的；裸體行者的護具放倉庫）；
//   英雄後裔：一把 25 級的「史詩」武器（照登記的武器）。
// 放在 prof2.js 後面（main.js 前面）。
(function (R) {
  const W = () => R.W, S = () => R.S, has = id => !!(R.hasTrait && R.hasTrait(id));
  const sum = map => Object.keys(map).reduce((a, k) => a + (has(k) ? map[k] : 0), 0);
  const MAG_CLS = { mage: 1, priest: 1, bard: 1, summoner: 1, arraymage: 1, enchanter: 1, scroll: 1 };

  // ---------- 力量、體質、幸運、經驗、熟練度 ----------
  const STR = { lishi: 2, qiangzhuang: 4, leiruo: -2, duobing: -2 };
  const CON = { qiangshen: 3, qiangzhuang: 4, leiruo: -1, pibao: -2, tiruo: -3, duobing: -4, canji: -2 };
  const LUCK = { haoyun: 3, qiangyun: 9, huaiyun: -3, dimei: -9 };
  const XP = { xuetu: 0.02, lieshou: 0.02, tianfu: 0.45, lanren: -0.05, shazi: -0.1 };
  const PROFG = { shazi: -0.15, zhidun: -0.05 };
  const so0 = R.strOf; if (so0) R.strOf = cls => so0(cls) + sum(STR);
  const co0 = R.conOf; if (co0) R.conOf = () => co0() + sum(CON);
  const lu0 = R.luckOf; if (lu0) R.luckOf = () => Math.round((lu0() + sum(LUCK)) * 10) / 10;
  const gx0 = R.gainXp; R.gainXp = v => gx0(v > 0 ? Math.max(0, Math.round(v * (1 + sum(XP)))) : v);
  R.profGainMul = () => Math.max(0, 1 + sum(PROFG));
  R.profAdj = (lv, kind) => { let x = lv; if (has('zhidun')) x = Math.min(15, x); if (has('congying')) x = Math.min(24, x + 4); return x; };

  // ---------- 天賦點、被動格 ----------
  const spT0 = R.spTotal; if (spT0) R.spTotal = st => spT0(st) + (has('jingjin') && st ? 2 * Math.max(0, (st.lv || 1) - 1) : 0);   // 精進修行：升級拿到的才算（Q21）
  const tS0 = R.talentSpent; if (tS0) R.talentSpent = st => tS0(st) * (has('dunxue') ? 2 : 1);   // 鈍學累功：花的點數兩倍
  const stOf = cls => S().classes[cls || S().cls];
  const tA0 = R.talentAdd; if (tA0) R.talentAdd = (id, cls) => { if (has('dunxue') && R.spFree(stOf(cls)) < 2 * (R.talentCost ? R.talentCost(id) : 1)) return false; return tA0(id, cls); };
  const tB0 = R.talentBuySlot; if (tB0) R.talentBuySlot = cls => { if (has('dunxue') && R.spFree(stOf(cls)) < 20) return false; return tB0(cls); };
  R.pvSlotLv = arr => { let a = arr.slice(); if (has('jusha')) a = a.concat([4, 12]); if (has('xiantian')) [4, 12].forEach(l => { const i = a.indexOf(l); if (i >= 0) a.splice(i, 1); }); return a.sort((x, y) => x - y); };
  R.bagCellBonus = () => (has('qiaoshou') ? 2 : 0) - (has('benzhuo') ? 2 : 0);
  const ws0 = R.workSpeed; if (ws0) R.workSpeed = () => ws0() * (1 + (has('qiaoshou') ? 0.05 : 0) - (has('benzhuo') ? 0.05 : 0));

  // ---------- 職業、武器、護具的限制 ----------
  const okCls = (cls, list) => { const h = id => (list ? list.indexOf(id) >= 0 : has(id)); if (h('ruofa') && MAG_CLS[cls]) return false; if (h('canji') && !(R.weaponsFor(cls) || []).some(w => R.WEAPONS[w].kind === 'magic')) return false; return true; };
  R.traitClassOk = okCls;
  R.traitWeaponOk = (cls, w, list) => { if (!okCls(cls, list)) return false; const h = id => (list ? list.indexOf(id) >= 0 : has(id)), k = R.WEAPONS[w] && R.WEAPONS[w].kind; if (h('ruofa') && k === 'magic') return false; if (h('canji') && k !== 'magic') return false; return true; };
  const cu0 = R.canUse;
  R.canUse = (it, cls) => {
    if (it && it.kind === 'weapon' && !R.traitWeaponOk(cls || S().cls, it.base)) return false;
    if (it && it.kind === 'armor' && has('luoti')) return false;
    return cu0(it, cls);
  };
  // 公會改登記：衝突的職業按不下去
  const hub0 = R.hub;
  R.hub = (...a) => {
    const r = hub0(...a);
    try { document.querySelectorAll('#hub-body [data-cls]').forEach(b => { if (!okCls(b.dataset.cls)) { b.disabled = true; b.title = '你的特質不能登記這一類'; if (!/特質/.test(b.textContent)) b.textContent += '（特質不合）'; } }); } catch (e) { }
    return r;
  };

  // ---------- 開局 ----------
  const give = it => { S().stash.push(it); return it; };
  const armorFor = (slot, cls) => { const need = R.strOf ? R.strOf(cls) : 99; return ['heavy', 'medium', 'light'].map(w => slot + '_' + w).find(b => R.ARMOR[b] && (!R.strNeed || R.strNeed({ kind: 'armor', base: b }) <= need)) || slot + '_light'; };
  R.traitApplyStart = (cls, weapon, old) => {
    const s = S(); if (!s) return;
    cls = cls || s.cls; weapon = weapon || (R.equipped(cls).weapon && R.equipped(cls).weapon.base) || R.STARTER[cls];
    if (has('gongzi')) s.gold += 2000;
    if (has('zhunbei')) {
      s.gold += 200;
      const w = give(R.makeItem({ kind: 'weapon', base: weapon, ilvl: 1, rarity: 2, identified: true })); s.equip[cls].weapon = w.id;
      R.SLOTS.forEach(sl => { const a = give(R.makeItem({ kind: 'armor', base: armorFor(sl.id, cls), ilvl: 1, rarity: 2, identified: true })); if (!has('luoti')) s.equip[cls][sl.id] = a.id; });
    }
    if (has('yingxiong')) { const w = give(R.makeItem({ kind: 'weapon', base: weapon, ilvl: 25, rarity: 3, identified: true })); if (!has('zhunbei')) s.equip[cls].weapon = w.id; }
    if (has('luoti')) Object.keys(s.equip || {}).forEach(c => R.SLOTS.forEach(sl => { if (s.equip[c]) s.equip[c][sl.id] = null; }));
    if (old && (has('ruofa') || has('canji')) && !okCls(cls)) R.toast && R.toast('你的特質跟現在登記的職業不合：到公會改登記。', '#F0A060');
    R.save && R.save();
  };

  // ---------- 數值 ----------
  const companions = () => { const N = R.net, online = N && N.room ? Math.max(0, (N.members || []).length - 1) : 0; return (S().party || []).length + online; };
  R.traitAllStat = () => {
    let a = (has('gongzi') ? -0.08 : 0) + (has('luoti') ? 0.1 : 0);
    if (W() && W().run && has('guzhang')) { const n = companions(); a += n >= 2 ? 0 : n === 1 ? -0.05 : -0.35; }
    if (W() && W().run && has('qiongxiong') && R.traitHungry && R.traitHungry()) a -= 0.35;
    return Math.max(-0.9, a);
  };
  const cp0 = R.calcPlayer;
  R.calcPlayer = cls => {
    const P = cp0(cls);
    try {
      const t = has, ws = P.ws || {}, pts = t('yuezhan') ? Math.min(150, (S().traits && S().traits.yz) || 0) : 0;
      P.speed *= 1 + (t('paozhe') ? 0.1 : 0) - (t('lanren') ? 0.15 : 0);
      if (t('paozhe')) P.ttStam = (P.ttStam || 0) + 0.05;
      P.matk = (P.matk || 1) * (1 + (t('xuetu') ? 0.05 : 0) + (t('damodao') ? 0.35 : 0) - (t('wucan') ? 0.25 : 0));
      P.patk = (P.patk || 1) * (1 + (t('lieshou') ? 0.03 : 0) - (t('wucan') ? 0.25 : 0));
      P.dmgRed = (P.dmgRed || 0) + (t('yingshen') ? 0.02 : 0) - (t('pibao') ? 0.05 : 0) - (t('duobing') ? 0.15 : 0);
      P.hpMax += (t('yingshen') ? 100 : 0) + (t('qiangzhuang') ? 150 : 0) + 5 * pts;
      if (t('canji')) P.hpMax *= 0.8;
      P.mpMax += (t('moxue') ? 150 : 0) + (t('damoli') ? 350 : 0) + (t('damodao') ? 600 : 0);
      if (t('xiaomoli')) P.mpMax *= 0.75; if (t('ruofa')) P.mpMax *= 0.8;
      if (ws.kind === 'magic') ws.rate *= 1 + (t('moxue') ? 0.15 : 0) + (t('damodao') ? 0.2 : 0);
      if (ws.range) ws.range *= 1 + (t('changshou') ? 0.1 : 0) - (t('duanbi') ? 0.1 : 0);
      if (t('fangun')) P.dodgeCdMax *= 0.9;
      P.rollMul = 1 + (t('fangun') ? 0.1 : 0) - (t('daruo') ? 0.05 : 0);
      P.dodgeRate = (P.dodgeRate || 0) + (t('ganzhi') ? 0.06 : 0) - (t('daruo') ? 0.09 : 0);
      if (t('zhongji')) { ws.crit = (ws.crit || 0) + 0.1; P.critMult += 0.1; }
      if (t('ruofa')) { P.haste = P.haste * 0.9; P.mdef = (P.mdef || 0) * 0.55; }
      if (t('canji')) P.def = (P.def || 0) * 0.55;
      P.dmgMult *= (t('boli') ? 2.5 : 1) * (t('yingxiong') ? 1.1 : 1) * (1 + 0.005 * pts);
      // 全屬性
      const a = R.traitAllStat(); P.allStat = a;
      if (a) {
        const k = 1 + a;
        P.hpMax *= k; P.dmgMult *= k; P.def = (P.def || 0) * k; P.mdef = (P.mdef || 0) * k; P.speed *= k; if (ws.range) ws.range *= k; if (ws.rate) ws.rate *= k; P.haste = P.haste * k;
        P.dodgeRate = Math.max(0, P.dodgeRate + a); ws.crit = Math.max(0, (ws.crit || 0) + a); P.critMult = Math.max(1, P.critMult + a);
      }
      if (P.dodgeRate < 0) P.dmgRed += P.dodgeRate * 0.25;   // 負的閃避：每 −1% 受到的傷害 +0.25%（算進減傷係數）
      if (t('boli')) P.hpMax *= 0.15;   // 最後才扣
      P.hpMax = Math.max(1, Math.round(P.hpMax)); P.mpMax = Math.max(0, Math.round(P.mpMax));
    } catch (e) { console.warn('[traitfx]', e); }
    return P;
  };
  const mr0 = R.mpRegenOf; if (mr0) R.mpRegenOf = P => mr0(P) * (1 + (P.allStat || 0));
  // 翻滾距離
  const dg0 = R.dodge;
  R.dodge = (...a) => { const P = W().P, cd0 = P ? P.dodgeCd : 0, r = dg0(...a); try { if (P && P.dodgeCd > cd0 && P.dashT > 0 && P.rollMul && P.rollMul !== 1) P.dashSp *= P.rollMul; } catch (e) { } return r; };

  // ---------- 減傷係數 ----------
  const hp0 = R.hurtPlayer;
  R.hurtPlayer = (raw, src, o) => {
    const P = W().P;
    if (P && raw > 0 && !(!src && raw >= 9999) && P.dmgRed) raw *= 1 - Math.max(-1, Math.min(0.75, P.dmgRed));
    return hp0(raw, src, o);
  };

  // ---------- 弱法之人、殘疾之人：打不出去的傷害 ----------
  const he0 = R.hurtEnemy;
  R.hurtEnemy = (e, raw, o) => {
    const P = W().P;
    if (P && e && (has('ruofa') || has('canji')) && !(o && (o.reflect || o.thorns))) {
      const mag = R.isMagHit ? R.isMagHit(o) : false, physWeapon = o && o.primary && P.ws && P.ws.kind !== 'magic';
      if (has('ruofa') && mag && !physWeapon) return;
      if (has('canji') && !mag) return;
    }
    return he0(e, raw, o);
  };

  // ---------- 角色總數值：特質一行 ----------
  const ch0 = R.charSheetHtml;
  if (ch0) R.charSheetHtml = (cls, opt) => {
    const h = ch0(cls, opt);
    try {
      const l = R.traitList(); if (!l.length) return h;
      const P = opt && opt.live && W().P && W().run ? W().P : R.calcPlayer(cls || S().cls);
      const row = (a, b, c) => '<div class="cs-row"><span>' + a + '</span><b>' + b + '</b>' + (c ? '<small>' + c + '</small>' : '') + '</div>';
      return h.replace('<h4>基本</h4>', '<h4>基本</h4>' + row('特質', l.map(id => R.TRAITS[id].name).join('、'))
        + (P.dmgRed ? row('減傷係數', (P.dmgRed > 0 ? '+' : '') + Math.round(P.dmgRed * 1000) / 10 + '%', '受到的傷害 ×' + (1 - Math.max(-1, Math.min(0.75, P.dmgRed))).toFixed(3)) : '')
        + (P.allStat ? row('全屬性', (P.allStat > 0 ? '+' : '') + Math.round(P.allStat * 100) + '%') : ''));
    } catch (e) { return h; }
  };
})(window.R);
