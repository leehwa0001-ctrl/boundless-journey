// 詞綴調整與新增（2026-10-15 作者《特質與熟練度》第六節＋審查問題 Q51～Q56）
// - 每一條詞綴前面加上詞綴的名字：［鋒利：傷害 +15%］。
// - 換算：全部照稀有度（balance20261006.js 的 PCT）；剛猛、奧秘、疾風、蝕毒、破甲原本照物品等級，改成照稀有度（Q51）。
// - 沉重：攻擊速度照舊 −10%，說明補上（Q52）。
// - 新增（照稀有度換算；「只出在裝備」＝頭、上衣、褲子、鞋子，Q53）：
//   幻影 閃避率 +0.5～2%（裝備）、偏移 減傷係數 +4～9%（裝備，跟飾品的守護可以並存，Q54）、浮彈 換彈速度 +5～15%（槍）、
//   魔弦 拉弓速度 +6～18%（弓）、自然 每秒回血 +3～12%（護符、飾品；只算每秒回血，Q56）、超頻 技能急速 +5～8（點，跟專注可以並存，Q54）、
//   強體 體質 +1～2（裝備）、聚力 力量 +1～2（裝備）。
// - 詞綴出在哪裡：a.armor（只有裝備）、a.charm（只有護符、飾品）、a.gun、a.bow（只有槍、弓）——R.affixAllowed（items.js、affixplus.js、crafting.js 呼叫）。
// 放在 balance20261006.js、prof2.js、traitfx.js 後面（main.js 前面）。
(function (R) {
  const W = () => R.W, S = () => R.S;
  const WA = R.W_AFFIX, AA = R.A_AFFIX;
  const heavy = WA.find(a => a.id === 'heavy'); if (heavy) heavy.txt = v => '擊退 +' + v + '%、攻擊速度 −10%';
  WA.push(
    { id: 'float', name: '浮彈', roll: [5, 15], gun: 1, txt: v => '換彈速度 +' + v + '%' },
    { id: 'bowstr', name: '魔弦', roll: [6, 18], bow: 1, txt: v => '拉弓速度 +' + v + '%' });
  AA.push(
    { id: 'phantom', name: '幻影', roll: [5, 20], armor: 1, txt: v => '閃避率 +' + (Math.round(v * 10) / 100) + '%' },   // 存十分之一：5～20＝0.5～2%
    { id: 'deflect', name: '偏移', roll: [4, 9], armor: 1, txt: v => '減傷係數 +' + v + '%' },
    { id: 'overclock', name: '超頻', roll: [5, 8], txt: v => '技能急速 +' + v },
    { id: 'conA', name: '強體', roll: [1, 2], armor: 1, txt: v => '體質 +' + v },
    { id: 'strA', name: '聚力', roll: [1, 2], armor: 1, txt: v => '力量 +' + v },
    { id: 'nature', name: '自然', roll: [3, 12], charm: 1, txt: v => '每秒回血 +' + v + '%' });
  const wkind = it => it && it.kind === 'weapon' && R.WEAPONS[it.base] ? R.WEAPONS[it.base].kind : null;
  R.affixAllowed = (a, it) => {
    if (!a || !it) return true;
    if (a.armor && it.kind !== 'armor') return false;
    if (a.charm && it.kind !== 'charm' && it.kind !== 'acc') return false;
    if (a.gun && wkind(it) !== 'gun') return false;
    if (a.bow && wkind(it) !== 'bow') return false;
    return true;
  };

  // ---------- 效果 ----------
  const eqList = cls => { try { return Object.values(R.equipped(cls || S().cls) || {}).filter(Boolean); } catch (e) { return []; } };
  const sum = (id, cls) => (R.affixSum ? R.affixSum(eqList(cls), id) : 0);
  const so0 = R.strOf; if (so0) R.strOf = cls => so0(cls) + sum('strA', cls);
  const co0 = R.conOf; if (co0) R.conOf = () => co0() + sum('conA');
  const cp0 = R.calcPlayer;
  R.calcPlayer = cls => {
    const P = cp0(cls);
    try {
      const ws = P.ws || {};
      P.dodgeRate = (P.dodgeRate || 0) + sum('phantom', cls) / 1000;
      P.dmgRed = (P.dmgRed || 0) + sum('deflect', cls) / 100;
      const oc = sum('overclock', cls); if (oc) P.haste += oc;
      const fl = sum('float', cls); if (fl && ws.kind === 'gun' && ws.reload) ws.reload /= 1 + fl / 100;
      const bs = sum('bowstr', cls); if (bs) P.drawSpd = (P.drawSpd || 1) * (1 + bs / 100);
      const na = sum('nature', cls); if (na && P.regen) P.regen *= 1 + na / 100;
    } catch (e) { console.warn('[affix1015]', e); }
    return P;
  };

  // ---------- 詞綴前面加名字 ----------
  const named = a => { if (!a || a._named || typeof a.txt !== 'function') return; const t0 = a.txt; a.txt = v => '［' + a.name + '：' + t0(v) + '］'; a._named = 1; };
  const all = () => ['W_AFFIX', 'A_AFFIX', 'ACC_AFFIX'].forEach(k => (R[k] || []).forEach(named));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', all); else all();
})(window.R);
