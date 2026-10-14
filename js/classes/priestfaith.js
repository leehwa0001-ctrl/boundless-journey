// 牧師信仰（2026-10-13 作者）：補隊友、給護盾也攢信仰
// - 原本只有「自己被補到的血」（R.healP）和放治療／祝福技能（+12）會攢信仰；補隊友、給護盾（自己或隊友）都不算。
// - 現在：自己回血 每 1% 生命＝1 信仰（照舊）；隊友回血 每 1% 他的生命＝0.5；護盾（自己或隊友）每 1% 生命＝0.3。
//   連線隊友看不到實際補了多少，照送出去的量算（同樣 0.5／0.3）。
// - 神蹟（花信仰的那招）補的血、給的盾不算，免得自己補回來。
// 放在 netaid.js 後面。
(function (R) {
  const C = R.CORE && R.CORE.priest; if (!C) return;
  const W = () => R.W, K = R.coreKit;
  const me = () => { const P = W() && W().P; return P && P.cls === 'priest' && (!K || !K.live || K.live()) ? P : null; };
  let depth = 0, miracle = false;
  const snap = P => ({ sh: P.shield || 0, al: (W().allies || []).filter(a => a && !a.downed && !a.rival).map(a => [a, a.hp || 0, a.shield || 0]) });
  const gain = (P, s) => {
    let f = Math.max(0, (P.shield || 0) - s.sh) / P.hpMax * 30;
    s.al.forEach(([a, hp, sh]) => { if (a.downed || !(a.hpMax > 0)) return; f += Math.max(0, a.hp - hp) / a.hpMax * 50 + Math.max(0, (a.shield || 0) - sh) / a.hpMax * 30; });
    if (f > 0) C.add(P, f);
  };
  const wrap = (obj, k) => {
    const f0 = obj && obj[k]; if (typeof f0 !== 'function') return;
    obj[k] = function (...a) {
      const P = me(); if (!P || miracle) return f0.apply(this, a);
      const s = snap(P); depth++;
      try { return f0.apply(this, a); } finally { depth--; if (!miracle) gain(P, s); }
    };
  };
  // 技能、大招、光環：前後比一下自己護盾、電腦隊友的血和盾
  const T = R.SKILL_TYPES; if (T) Object.keys(T).forEach(k => wrap(T, k));
  if (R.ULTS && R.ULTS.priest) wrap(R.ULTS.priest, 'go');
  // 神蹟：不算
  const act0 = C.act;
  C.act = function (...a) { miracle = true; try { return act0.apply(this, a); } finally { miracle = false; } };
  // R.aidAlly：連線隊友照送出的量；技能外面（被動、光環每秒）呼叫的電腦隊友照實際量
  const aid0 = R.aidAlly;
  if (aid0) R.aidAlly = (al, o) => {
    const P = me(); if (!P || miracle || !al || !o) return aid0(al, o);
    if (al.remote != null) {
      const hp = al.hpMax || 100, f = ((o.healPct || 0) * 100 + (o.healAbs || 0) / Math.max(1, P.hpMax) * 100) * 0.5 + ((o.shieldPct || 0) * 100 + (o.shieldAbs || 0) / Math.max(1, P.hpMax) * 100) * 0.3;
      const r = aid0(al, o); if (f > 0 && !(al.downed && !o.revive)) C.add(P, Math.min(25, f)); return r;
    }
    if (depth) return aid0(al, o);
    const s = { sh: P.shield || 0, al: [[al, al.hp || 0, al.shield || 0]] }; const r = aid0(al, o); gain(P, s); return r;
  };
})(window.R);
