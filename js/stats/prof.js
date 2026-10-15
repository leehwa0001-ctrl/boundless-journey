// 熟練度（努力值；作者 2026-10-02：拿重武器去打，武器的基本數值會加；多打幾場之後拿重武器會比較敏捷；
// 練魔法看釋放的次數；敏捷靠穿比較輕的裝備）
// - 武器熟練度：每把武器（基本型）分開算。出手打到東西 +1、用它打倒 +2。每級：這種武器的基本傷害 +2%、攻擊速度 +1%。
// - 重量：重的武器走路比較慢（大劍 −7.5%、戰斧 −6%、戰錘 −5%、長槍 −4%、長劍 −2.5%……輕的武器不扣）；
//   武器熟練度每升一級，重量的拖累少一成，10 級就不拖累了。
// - 魔法熟練度：法杖、法球、聖杖每發一次 +1；魔導士、神官放技能 +2。每級：魔法武器的傷害 +2%、每發的魔力 −3%。
// - 敏捷：打倒遺跡生物的時候，身上全是輕裝 +2、上衣是輕裝 +1（重裝不加）。每級：移動 +1%、翻滾冷卻 −2%。
// - 力量（2026-10-03）：用重武器（重量 2 以上）打倒 +2、中等（重量 1 以上）+1；上衣穿重裝再 +1。每級力量 +1（穿重裝要力量，gearplus.js）。
// - 等級：熟練 n 級要 30 × n² 點（1 級 30、5 級 750、10 級 3000）。升級的效果從下一趟遺跡開始算。
// - 體力的鍛鍊（2026-10-04 作者：加可以鍛鍊體力，在熟練那邊）：翻滾、跑步、防禦每用掉 15 點體力 +1（stamina.js 呼叫 R.profGain）。每級：體力上限 +5、體力回復 +4%。
// - 存檔：R.S.prof = { w: {武器: 點數}, magic, agi, str, stam }。公會登記處的勇者證下面有一覽。
// 2026-10-15 作者《特質與熟練度》改版（上面的數字以這裡為準）：
// - 等級＝√(點數 ÷ 50)，最高 20 級：n 級要 50 × n² 點（1 級 50、5 級 1250、10 級 5000、20 級 20000）。
//   舊存檔照「等級」換：舊的點數 × 5/3（等級、進度都不變），舊 10 級（滿級）的補到 5000（R.migrate，prof.ver = 2）。
// - 訓練場裡不累積。魔法武器每發要打中才算（打到東西才 +1）。
// - 武器：基本傷害每級 +1%；攻擊速度 1～10 級每級 +0.5%、11～20 級每級 +1%（前 10 級 +5%、後 10 級 +10%，合計 +15%）；重量的拖累每級少一成。
// - 魔法：魔法傷害每級 +2%、每發的魔力每級 −3%（最多 −60%）、魔法武器攻擊速度每級 +3%。
// - 敏捷：移動 +0.3%、翻滾冷卻 −2%、閃避率 +0.5%、攻擊速度 +0.3%（每級）。
// - 力量的鍛鍊：每級力量 +1（力量本身的效果在 prof2.js）。體力的鍛鍊 → 體質：每級體質 +1（R.conOf；體質的效果：體力上限、回復在 stamina.js，生命在 prof2.js）。
// - 新的四種：智力、精神、技巧、精確（怎麼練、效果都在 prof2.js；這裡只管點數、等級、升級的說明、勇者證的一覽）。
// 放在 skillpoints.js 後面（包住 R.calcPlayer、R.attack、R.hurtEnemy、R.killEnemy、R.useSkill、R.castSlot）。
(function (R) {
  const W = () => R.W, S = () => R.S, $ = id => document.getElementById(id), esc = s => R.esc(s);
  const MAX = 20, lvOf = xp => Math.min(MAX, Math.floor(Math.sqrt((xp || 0) / 50))), need = lv => 50 * lv * lv;
  R.PROF_MAX = MAX; R.profLvOf = lvOf; R.profNeed = need;
  // 有效等級＝訓練等級＋特質額外等級（天資聰穎 +4、最高 24；資質駑鈍上限 −5）：R.profAdj（traitfx.js 換掉）
  R.profAdj = (lv, kind) => lv;
  const eff = (xp, kind) => R.profAdj(lvOf(xp), kind);
  // 每一種（除了武器）：名字、升級的說明（R.PROF_LINE 讓 prof2.js 填新的四種）
  const NAME = R.PROF_NAME = { magic: '魔法', agi: '敏捷', str: '力量的鍛鍊', stam: '體力的鍛鍊', int: '智力', spi: '精神', tech: '技巧', prec: '精確' };
  const LINE = R.PROF_LINE = R.PROF_LINE || {};
  const pc = v => (Math.round(v * 10) / 10) + '%';
  const wRate = lv => 0.5 * Math.min(10, lv) + Math.max(0, lv - 10);   // 武器的攻擊速度 %：前 10 級每級 0.5、後 10 級每級 1
  // 重量：每 1 點走路慢 2.5%
  const WEIGHT = { staffpole: 1.2, greatsword: 3, axe: 2.4, mace: 2, spear: 1.6, sword: 1, shotgun: 0.8, rifle: 0.8, crossbow: 0.8 };
  R.WEAPON_WEIGHT = WEIGHT;
  const pf = () => { const s = S(); s.prof = s.prof || { w: {}, magic: 0, agi: 0, ver: 2 }; s.prof.w = s.prof.w || {}; return s.prof; };
  R.profLv = { weapon: base => eff(pf().w[base], 'w') };
  Object.keys(NAME).forEach(k => { R.profLv[k] = () => eff(pf()[k], k); });
  R.conOf = () => R.profLv.stam();   // 體質（之後特質也會加減；可以是負的）
  // 舊存檔：30 × n² → 50 × n²，照等級換（× 5/3），舊的滿級（10 級、3000 點以上）補到 5000
  const conv = v => Math.round(Math.min(3000, Math.max(0, +v || 0)) * 5 / 3 * 10) / 10;
  const mg0 = R.migrate;
  R.migrate = s => {
    s = mg0 ? mg0(s) : s;
    try { const p = s && s.prof; if (p && p.ver !== 2) { if (p.w) Object.keys(p.w).forEach(k => { p.w[k] = conv(p.w[k]); }); ['magic', 'agi', 'str', 'stam'].forEach(k => { if (p[k] != null) p[k] = conv(p[k]); }); p.ver = 2; } else if (s && !p) s.prof = { w: {}, magic: 0, agi: 0, ver: 2 }; } catch (e) { console.warn('[prof]', e); }
    return s;
  };
  const MAGIC_CLS = ['mage', 'priest'];

  // ---------- 加點數：升級的時候說一聲 ----------
  const gain = (kind, base, v) => {
    if (!(v > 0) || (R.inTraining && R.inTraining()) || (W() && W().run && W().run.train)) return;   // 訓練場裡不累積
    if (R.profGainMul) v *= R.profGainMul();   // 特質：傻子、資質駑鈍（traitfx.js）
    const p = pf(), before = kind === 'w' ? lvOf(p.w[base]) : lvOf(p[kind]);
    if (kind === 'w') p.w[base] = (p.w[base] || 0) + v; else p[kind] = (p[kind] || 0) + v;
    const after = kind === 'w' ? lvOf(p.w[base]) : lvOf(p[kind]);
    if (after > before) {
      const name = kind === 'w' ? (R.WEAPONS[base] ? R.WEAPONS[base].name : base) + '的熟練度' : kind === 'magic' ? '魔法熟練度' : NAME[kind] || kind;
      setTimeout(() => R.banner && R.banner(name + '升到 ' + after + ' 級', lineOf(kind, base, after) + '（下一趟遺跡開始算）'), 900);
    }
  };
  const lineOf = (kind, base, lv) => {
    if (kind === 'w') { const wt = WEIGHT[base] || 0; return '基本傷害 +' + lv + '%、攻擊速度 +' + pc(wRate(lv)) + (wt ? '、重量的拖累 −' + Math.min(100, lv * 10) + '%' : ''); }
    if (kind === 'magic') return '魔法傷害 +' + 2 * lv + '%、每發的魔力 −' + Math.min(60, 3 * lv) + '%、魔法武器攻擊速度 +' + 3 * lv + '%';
    if (kind === 'str') return '力量 +' + lv + '（力量每點：物理傷害 +2%、暴擊率 +0.5%、物理武器攻擊速度 +0.7%；穿重裝也要力量）';
    if (kind === 'stam') return '體質 +' + lv + '（體質每點：生命上限 +25、體力上限 +5、體力回復 +0.2%）';
    if (kind === 'agi') return '移動 +' + pc(0.3 * lv) + '、翻滾冷卻 −' + 2 * lv + '%、閃避率 +' + pc(0.5 * lv) + '、攻擊速度 +' + pc(0.3 * lv);
    return LINE[kind] ? LINE[kind](lv) : '';
  };

  R.profGain = gain;   // stamina.js：體力的鍛鍊
  // ---------- 效果：算玩家數值的時候加上去 ----------
  const cp0 = R.calcPlayer;
  R.calcPlayer = cls => {
    const P = cp0(cls);
    try {
      const ws = P.ws, base = P.item && P.item.base, wl = base ? R.profLv.weapon(base) : 0, ml = R.profLv.magic(), al = R.profLv.agi();
      if (ws) {
        ws.dmg *= 1 + 0.01 * wl; ws.rate *= (1 + wRate(wl) / 100) * (1 + 0.003 * al);
        if (ws.kind === 'magic') { ws.dmg *= 1 + 0.02 * ml; ws.rate *= 1 + 0.03 * ml; if (ws.mp) ws.mp *= Math.max(0.4, 1 - 0.03 * ml); }
      }
      P.magicProfMul = 1 + 0.02 * ml;   // 魔法技能的傷害（prof2.js：魔法的一擊才乘；魔法武器的普攻上面已經乘過）
      const drag = (WEIGHT[base] || 0) * 0.025 * Math.max(0, 1 - wl / 10);   // 10 級就不拖累
      P.speed *= (1 - drag) * (1 + 0.003 * al);
      P.dodgeCdMax *= 1 - 0.02 * al;
      P.dodgeRate = (P.dodgeRate || 0) + 0.005 * al;   // 閃避率（prof2.js）
      P.weightDrag = drag;
    } catch (e) { }
    return P;
  };

  // ---------- 怎麼練 ----------
  // 出手：記下這一下（1.2 秒內打到東西才算；子彈飛得慢也算得到）；魔法武器每發一次就算
  let swing = null;
  const at0 = R.attack;
  R.attack = (...a) => {
    const P = W().P, run = W().run, cd0 = P ? P.atkCd : 0, mp0 = P ? P.mp : 0, r = at0(...a);
    if (P && run && P.atkCd > cd0 + 0.001) {
      const magic = P.ws && P.ws.kind === 'magic';
      if (magic && !(P.mp < mp0)) return r;   // 魔力不夠：沒發出去
      swing = { t: run.t, base: P.item && P.item.base, hit: false, run, magic };   // 魔法武器也要打中才算（2026-10-15）
    }
    return r;
  };
  const he0 = R.hurtEnemy;
  R.hurtEnemy = (e, raw, o) => {
    const run = W().run, s = swing;
    if (s && run && s.run === run && !s.hit && e && !e.dead && run.t - s.t < 1.2 && run.t >= s.t && !(o && (o.dot || o.burn))) { s.hit = true; if (s.base) gain('w', s.base, 1); if (s.magic) gain('magic', null, 1); }
    return he0(e, raw, o);
  };
  const ke0 = R.killEnemy;
  R.killEnemy = (e, by) => {
    const was = e && !e.dead, r = ke0(e, by), run = W().run, P = W().P;
    if (was && e.dead && run && P && !by && !(e.def && e.def.human)) {
      const s = swing; if (s && s.run === run && run.t - s.t < 1.5 && s.base) gain('w', s.base, 2);
      // 敏捷：看身上的裝備有多輕
      const eq = R.equipped ? R.equipped(P.cls) : {}, ws = R.SLOTS.map(sl => eq[sl.id] && R.ARMOR[eq[sl.id].base] ? R.ARMOR[eq[sl.id].base].w : 'light');
      const v = ws.every(w => w === 'light') ? 2 : ws[R.SLOTS.findIndex(sl => sl.id === 'body')] === 'light' ? 1 : 0;
      if (v) gain('agi', null, v);
      // 力量：重的武器、重的上衣
      const wt = WEIGHT[P.item && P.item.base] || 0, st = (wt >= 2 ? 2 : wt >= 1 ? 1 : 0) + (ws[R.SLOTS.findIndex(sl => sl.id === 'body')] === 'heavy' ? 1 : 0);
      if (st) gain('str', null, st);
    }
    return r;
  };
  // 魔導士、神官放技能
  const castGain = () => { const P = W().P; if (P && MAGIC_CLS.includes(P.cls)) gain('magic', null, 2); };
  const us0 = R.useSkill;
  if (us0) R.useSkill = (...a) => { const P = W().P, b = P ? P.skillCd || 0 : 0, r = us0(...a); if (P && (P.skillCd || 0) > b + 0.01) castGain(); return r; };
  const cs0 = R.castSlot;
  if (cs0) R.castSlot = i => { const P = W().P, b = P && P.skCd ? P.skCd[i] || 0 : 0, r = cs0(i); if (P && P.skCd && (P.skCd[i] || 0) > b + 0.01) castGain(); return r; };

  // ---------- 公會登記處：勇者證下面的熟練度一覽 ----------
  const bar = (xp, lv) => { const a = need(lv), b = need(Math.min(MAX, lv + 1)), f = lv >= MAX ? 1 : ((xp || 0) - a) / (b - a); return '<i style="display:inline-block;width:80px;height:5px;background:rgba(0,0,0,.25);border-radius:3px;vertical-align:middle;margin-left:6px;overflow:hidden"><em style="display:block;height:100%;width:' + Math.round(Math.max(0, Math.min(1, f)) * 100) + '%;background:#C9A13A"></em></i>'; };
  // 2026-10-15 作者：勇者證新增雷達圖（每一種熟練度的等級），下面寫清楚每一種現在的加成、怎麼練
  const HOW = R.PROF_HOW = Object.assign({
    w: '用這種武器打到東西 +1、打倒 +2',
    magic: '魔法武器打中 +1；術士、牧師放技能 +2',
    agi: '穿輕裝打倒遺跡生物：全身輕裝 +2、上衣是輕裝 +1',
    str: '用重的武器打倒 +1～2、上衣穿重裝再 +1',
    stam: '翻滾、跑步、防禦用掉體力，受傷也算（城裡跑步也算）'
  }, R.PROF_HOW || {});
  const AXES = [['w', '武器'], ['magic', '魔法'], ['str', '力量'], ['stam', '體質'], ['agi', '敏捷'], ['int', '智力'], ['spi', '精神'], ['tech', '技巧'], ['prec', '精確']];
  const radar = vals => {
    const N = AXES.length, cx = 130, cy = 118, R0 = 84, pt = (i, k) => { const a = -Math.PI / 2 + i * 2 * Math.PI / N; return [cx + Math.cos(a) * R0 * k, cy + Math.sin(a) * R0 * k]; };
    const poly = k => AXES.map((x, i) => pt(i, k).map(v => v.toFixed(1)).join(',')).join(' ');
    let g = [0.25, 0.5, 0.75, 1].map(k => '<polygon points="' + poly(k) + '" fill="none" stroke="currentColor" stroke-opacity="' + (k === 1 ? 0.35 : 0.15) + '"/>').join('');
    g += AXES.map((x, i) => { const [x1, y1] = pt(i, 1), [lx, ly] = pt(i, 1.2); return '<line x1="' + cx + '" y1="' + cy + '" x2="' + x1.toFixed(1) + '" y2="' + y1.toFixed(1) + '" stroke="currentColor" stroke-opacity="0.15"/><text x="' + lx.toFixed(1) + '" y="' + (ly + 4).toFixed(1) + '" text-anchor="middle" font-size="11" fill="currentColor">' + x[1] + ' ' + vals[i] + '</text>'; }).join('');
    g += '<polygon points="' + AXES.map((x, i) => pt(i, Math.max(0.02, Math.min(1.2, vals[i] / MAX))).map(v => v.toFixed(1)).join(',')).join(' ') + '" fill="#C9A13A" fill-opacity="0.35" stroke="#C9A13A" stroke-width="2"/>';
    return '<svg viewBox="0 0 260 236" width="260" height="236" style="display:block;margin:4px auto;max-width:100%" role="img" aria-label="熟練度雷達圖">' + g + '</svg>';
  };
  const box = () => {
    const p = pf(), cls = S().cls, mine = R.weaponsFor ? R.weaponsFor(cls) : [];
    const ws = Object.keys(R.WEAPONS).filter(k => mine.includes(k) || p.w[k]);
    const eq = R.equipped ? R.equipped(cls) : null, cur = eq && eq.weapon ? eq.weapon.base : ws.reduce((b, k) => ((p.w[k] || 0) > (p.w[b] || 0) ? k : b), ws[0]);
    const row = (name, xp, line, how, kind) => { const lv0 = lvOf(xp), lv = R.profAdj(lv0, kind); return '<li><b>' + esc(name) + '</b>　' + lv + ' 級' + (lv !== lv0 ? '（訓練 ' + lv0 + ' 級，特質 ' + (lv > lv0 ? '+' : '') + (lv - lv0) + '）' : '') + bar(xp, lv0) + ' <small class="note">' + Math.floor(xp || 0) + (lv0 < MAX ? '／' + need(lv0 + 1) : '') + '</small><br><small>' + esc(line(lv)) + '</small>' + (how ? '<br><small class="note">怎麼練：' + esc(how) + '</small>' : '') + '</li>'; };
    const vals = AXES.map(([k]) => (k === 'w' ? (cur ? R.profLv.weapon(cur) : 0) : R.profLv[k]()));
    return '<h3>熟練度</h3>' + radar(vals) + '<p class="note">雷達圖的「武器」是現在拿的這一把。每一種最高 ' + MAX + ' 級（n 級要 50 × n² 點）；效果從下一趟遺跡開始算；訓練場裡不累積。<br>武器的攻擊速度：1～10 級每級 +0.5%、11～20 級每級 +1%（前 10 級 +5%、後 10 級 +10%，合計 +15%）。</p><ul class="loot">'
      + ws.map(k => row(R.WEAPONS[k].name + (WEIGHT[k] ? '（重量 ' + WEIGHT[k] + '）' : ''), p.w[k], lv => lineOf('w', k, lv) + (WEIGHT[k] ? '；現在走路慢 ' + (WEIGHT[k] * 2.5 * Math.max(0, 1 - lv / 10)).toFixed(1) + '%' : ''), k === cur ? HOW.w : '', 'w')).join('')
      + Object.keys(NAME).map(k => row(NAME[k], p[k], lv => lineOf(k, null, lv), HOW[k], k)).join('') + '</ul>';
  };
  const hub0 = R.hub;
  R.hub = (t, f) => {
    hub0(t, f);
    const body = $('hub-body'); if (!body) return;
    const h3 = [...body.querySelectorAll('h3')].find(x => x.textContent === '勇者證'); if (!h3) return;
    let at = h3.nextElementSibling; while (at && at.tagName !== 'H3') at = at.nextElementSibling;
    const sec = document.createElement('div'); sec.className = 'prof-box'; sec.innerHTML = box();
    h3.parentNode.insertBefore(sec, at);
  };
})(window.R);
