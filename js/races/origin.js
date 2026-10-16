// 出身（2026-10-16 作者）：建角色第二頁、角色圖旁邊選一種（creator2.js 的 .c2-org），存在 R.S.origin
// - 昭旭新興勇者 zhaoxu：出生在固定出生點（東鶴城裡原本的位置）、新人段・初心階開始；在昭旭內的所有花費 −5%。
// - 外邦冒險勇者 foreign：出生在東鶴港的海港旁（客船航站前）、冒險段・青銅階開始、初始資金 +200、
//   狩獵考核當作已經合格兩次（R.S.hunt.passed＝2，狩獵委託直接開放）；在昭旭內的所有花費 +10%。
// - 「所有花費」＝包住 R.spendMul（商品、服務、老岩、僱用都乘）和 R.priceMul（商店的標價）；跟特質的折扣相乘。
//   R.inZhaoxu()：現在遊戲裡的城市都在昭旭，一律 true；之後加了國外的城市，在那裡改成照所在地判斷。
// - 舊存檔沒有 R.S.origin：花費不變。
// 放在 traitlife.js、ranks.js、hunt.js 後面，creator2.js 前面。
(function (R) {
  const W = () => R.W, S = () => R.S;
  R.ORIGINS = {
    zhaoxu: { name: '昭旭新興勇者', short: '新人段・初心階　花費 −5%', mul: 0.95,
      lines: ['出生在東鶴城裡的固定出生點', '以新人段・初心階的段位開始', '在昭旭內的所有花費 −5%'] },
    foreign: { name: '外邦冒險勇者', short: '冒險段・青銅階　花費 +10%', mul: 1.1,
      lines: ['出生在東鶴港的海港旁', '以冒險段・青銅階的段位開始', '初始資金 +200 費拉', '已經通過兩次狩獵考核', '在昭旭內的所有花費 +10%'] }
  };
  R.inZhaoxu = R.inZhaoxu || (() => true);
  R.originOf = () => (S() && S().origin) || null;
  const om = () => { const o = R.ORIGINS[R.originOf()]; return o && R.inZhaoxu() ? o.mul : 1; };

  // ---------- 花費 ----------
  const sm0 = R.spendMul; if (sm0) R.spendMul = kind => sm0(kind) * om();
  const pm0 = R.priceMul; if (pm0) R.priceMul = shop => { const m = pm0(shop); return m == null ? m : m * om(); };

  // ---------- 開局 ----------
  R.applyOrigin = id => {
    const s = S(); if (!s || !R.ORIGINS[id]) return;
    s.origin = id;
    if (id === 'foreign') {
      s.gold = (s.gold || 0) + 200;
      s.rank = { dan: 1, tier: 0 };
      s.hunt = Object.assign({ passed: 0, tries: 0 }, s.hunt || {}); s.hunt.passed = Math.max(2, s.hunt.passed); s.hunt.tries = Math.max(2, s.hunt.tries);
      s.originSpawn = 1;
    } else s.rank = { dan: 0, tier: 0 };
  };
  // 外邦冒險勇者第一次進城：站到東鶴港的客船航站前（找不到就留在原本的出生點）
  const et0 = R.enterTownNow;
  if (et0) R.enterTownNow = (from, at) => {
    const r = et0(from, at), s = S(), w = W();
    if (s && s.originSpawn && !from && !at && w.town && w.P) {
      delete s.originSpawn;
      const it = (w.town.inter || []).find(i => /^東鶴港客船航站/.test(i.label || i.name || ''));
      if (it) { w.P.x = it.x; w.P.z = it.z; if (w.P.h && w.P.h.g) w.P.h.g.position.set(it.x, 0, it.z); R.placeCam && R.placeCam(null); R.banner && R.banner('東鶴港', '搭了好幾天的船，終於到了昭旭'); }
      R.save && R.save();
    }
    return r;
  };
})(window.R);
