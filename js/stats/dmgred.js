// 減傷係數（2026-10-15 作者《特質與熟練度》第二節＋審查問題 Q30、F16）
// - 取代原本各自相乘的「受到的傷害減少」：所有來源全部相加，最高 75%、最低 −100%（受到的傷害 ×2）。
//   減傷 +20%＝受到的傷害 ×0.8；−20%＝×1.2。獨立在物防、魔防之外：先乘減傷係數，再算防禦。
// - 每一下受傷開一個合計（R.dmgRedBegin，traitfx.js 的 R.hurtPlayer 最外面開），途中各個來源 R.dmgRedAdd(x)，
//   最後在 combat.js 的 R.hurtPlayer 本體乘上 R.dmgRedMul()。
// - 併進來的來源：特質、負的閃避（P.dmgRed）、飾品「守護」、技能點天賦、天賦樹、套裝、頭飾（場地傷害）、被動、低血被動、技能的增益、
//   轉職（要塞、殿堂騎士、鬼武者、棍僧、結界、守護者）、騎士的盾（正面）、戰士怒氣滿、刀客殘心、阿瀧的教導、獸王、奏域；
//   受到的傷害增加也算負的：破甲（debuff）、虛弱（場地）、理智崩潰邊緣。（加注條款「易傷」2026-10-21 起不算在這裡，pact.js 直接乘，不受上限影響）
// - 沒併進來（不是減傷，是別的機制）：騎士的格擋（擋下來就不受傷）、式神分擔、被動「低血少扣」（固定點數）、難度的 dmgScale。
// 放在 combat.js、haste.js 後面。
(function (R) {
  const stack = [];
  R.DMGRED_MAX = 0.75; R.DMGRED_MIN = -1;
  R.dmgRedBegin = base => { stack.push(+base || 0); };
  R.dmgRedEnd = () => { stack.pop(); };
  R.dmgRedAdd = x => { if (stack.length && x) stack[stack.length - 1] += x; };
  R.dmgRedNow = () => (stack.length ? stack[stack.length - 1] : 0);
  R.dmgRedClamp = v => Math.max(R.DMGRED_MIN, Math.min(R.DMGRED_MAX, v || 0));
  R.dmgRedMul = () => 1 - R.dmgRedClamp(R.dmgRedNow());
  // 角色總數值用：一直有的來源（不含條件、暫時的）
  R.dmgRedStatic = P => {
    if (!P) return 0;
    const f = P.pv || {};
    return (P.dmgRed || 0) + (P.accGuard || 0) + (P.talGuard || 0) + Math.min(0.5, P.ttGuard || 0) + (P.setGuard || 0) + Math.min(0.5, f.guard || 0)
      + (P.adv === 'warder' ? 0.12 : 0) + (P.adv === 'templar' ? 0.15 : 0) + (P.adv === 'staffmonk' ? 0.1 : 0);
  };
})(window.R);
