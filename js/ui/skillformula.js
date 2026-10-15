// 技能卡片的「?」：點了看這一招傷害、治療、護盾怎麼算（2026-10-16 作者：方便平衡）
// - 技能書的卡片、Esc「查看目前技能」的卡片右上角都有一個「?」，點一下展開公式（再點收起來）。
// - 公式照技能的參數自動寫：技能威力（照武器算）× 倍率 × 次數、範圍、時間、回復、護盾；後面附上現在角色代進去的數字。
// - 內建的老技能（combat.js 寫死的）照那邊的數字寫；30 級技能（lv30.js）用它自己寫的公式（f）。
// 放在 skillbook.js、escmenu.js、lv30.js 後面。
(function (R) {
  const W = () => R.W, esc = t => R.esc(String(t == null ? '' : t)), n1 = v => (Math.round(v * 10) / 10).toLocaleString(), pc = v => Math.round(v * 1000) / 10 + '%';
  const Pnow = () => { const w = W(); if (w && w.P && w.run) return w.P; try { return R.calcPlayer && R.S ? R.calcPlayer(R.S.cls) : null; } catch (e) { return null; } };
  // 技能威力（skillbook.js 的 power）
  const powerOf = ws => (R.SKILL_KIT && R.SKILL_KIT.power ? R.SKILL_KIT.power(ws) : 0);
  const naOf = ws => ws.dmg * (R.multiN ? R.multiN(ws) : (ws.pellets > 1 ? ws.pellets : 1) * (ws.hits || 1));
  const powerLines = P => {
    if (!P || !P.ws) return ['技能威力 W = max(一下普攻 N × 攻速 ÷ 2, N × min(2.5, max(2, 攻速)))；N ＝ 武器傷害 × 發數 × 段數'];
    const ws = P.ws, na = naOf(ws), r = ws.rate || 1, Wv = powerOf(ws);
    return ['技能威力 W = max(N × 攻速 ÷ 2, N × min(2.5, max(2, 攻速)))', '　N（一下普攻）= ' + n1(na) + '、攻速 = ' + n1(r) + ' → W = ' + n1(Wv)];
  };
  const NAME = { r: '半徑', range: '施放距離', len: '長度', width: '半寬', scatter: '散開', hitR: '每下半徑', arc: '角度', t: '持續', life: '持續', stun: '暈眩', slow: '變慢', root: '定身', curse: '詛咒', invis: '隱身', iframe: '無敵', burnT: '燃燒' };
  const UNIT = { r: ' 公尺', range: ' 公尺', len: ' 公尺', width: ' 公尺', scatter: ' 公尺', hitR: ' 公尺', t: ' 秒', life: ' 秒', stun: ' 秒', slow: ' 秒', root: ' 秒', curse: ' 秒', invis: ' 秒', iframe: ' 秒', burnT: ' 秒' };
  const TYPE = { shots: '射擊', at: '落點', line: '直線', arc: '揮砍', nova: '身邊一圈', dash: '衝刺', blink: '瞬移', buff: '強化', heal: '治療', zone: '陣地', mark: '標記', pull: '拉近', chain: '連鎖', drain: '吸取', orbit: '環繞', parry: '架開', shotx: '射擊', chainx: '彈跳', wave: '波', storm: '持續落下', aura: '光環', hook: '鉤索', pet: '召喚', guard: '防禦', combo: '連段' };
  // 一段參數 → 幾行公式
  const partLines = (type, p, P, Wv) => {
    const L = [], cnt = [];
    if (p.n > 1) cnt.push(p.n + ' 發'); if (p.burst > 1) cnt.push(p.burst + ' 輪'); if (p.waves > 1) cnt.push(p.waves + ' 波'); if (p.hits > 1) cnt.push(p.hits + ' 下'); if (p.count > 1) cnt.push(p.count + ' 個');
    const times = (p.n || 1) * (p.burst || 1) * (p.waves || 1) * (p.hits || 1) * (p.count || 1);
    if (typeof p.k === 'number' && p.k > 0) {
      L.push('每下傷害 = W × ' + p.k + (Wv ? ' = ' + n1(Wv * p.k) : '') + (cnt.length ? '；共 ' + cnt.join(' × ') + (Wv ? '（全中 ' + n1(Wv * p.k * times) + '）' : '') : ''));
      if (p.falloff) L.push('每跳一次 × ' + p.falloff); if (p.execute) L.push('生命 30% 以下的敵人 × 2'); if (p.crit >= 1) L.push('必定暴擊'); else if (p.crit) L.push(pc(p.crit) + ' 機率暴擊');
    }
    if (p.pct) L.push('回復 = 生命上限 × ' + pc(p.pct) + (P ? ' = ' + n1(P.hpMax * p.pct) : ''));
    if (p.shield) L.push('護盾 = 生命上限 × ' + pc(p.shield) + (P ? ' = ' + n1(P.hpMax * p.shield) : ''));
    if (p.allies) L.push('身邊 7 公尺的隊友回復 = 他的生命上限 × ' + pc(p.allies)); if (p.allyShield) L.push('隊友護盾 = 他的生命上限 × ' + pc(p.allyShield));
    if (p.mp) L.push('回魔 = 最大魔力 × ' + pc(p.mp)); if (p.regen) L.push('每秒回復 = 生命上限 × ' + pc(p.regen)); if (p.vamp) L.push('吸血 ' + pc(p.vamp));
    if (type === 'buff' || type === 'aura') { if (p.dmg > 1) L.push('傷害 × ' + p.dmg); if (p.speed) L.push('移動 × ' + p.speed); if (p.rate) L.push('攻速 × ' + p.rate); if (p.crit && !p.k) L.push('暴擊率 +' + pc(p.crit)); if (p.def) L.push('受到的傷害 −' + pc(p.def)); }
    const g = Object.keys(NAME).filter(k => typeof p[k] === 'number' && p[k] > 0).map(k => NAME[k] + ' ' + (k === 'arc' ? Math.round(p[k] * 57.3) + ' 度' : n1(p[k]) + UNIT[k]));
    if (g.length) L.push(g.join('、'));
    if (p.end) L.push('結束時：' + partLines('nova', p.end, P, Wv).join('；'));
    if (p.then) L.push('接著：' + partLines(p.then.type || '', p.then, P, Wv).join('；'));
    if (p.nova) L.push('再加一圈：' + partLines('nova', p.nova, P, Wv).join('；'));
    return L;
  };
  // 內建的老技能（combat.js 的 R.useSkill）：基準 B = 武器傷害 × 發數 × 段數 × 1.5
  const BI = {
    volley: ['3 波箭雨，每波 B × 0.9（半徑 2.8 公尺）'], fireball: ['火球 B × 2.4，爆開半徑 3 公尺'], heal: ['回復生命上限 × 35%＋20 點護盾（4 秒）'], flash: ['衝 6.5 公尺，路上 B × 2'], charge: ['衝 7 公尺，撞到 B × 1.5、暈 1.2 秒'],
    snipe: ['瞄準 0.5 秒，B × 5，必定暴擊、貫穿'], grenade: ['手榴彈 B × 3（爆開）'], homing: ['8 支追蹤箭，每支 B × 0.9'], trap: ['陷阱 B × 2、定身 3 秒（半徑 1.2 公尺）'], hamaya: ['破魔矢 B × 3，貫穿'],
    combo: ['3 圈，每圈 B × 0.9（半徑 3.2 公尺）'], qijin: ['身邊 3.5 公尺 B × 2'], meteor: ['0.8 秒後 B × 4、燃燒（半徑 3.8 公尺）'], hex: ['半徑 4 公尺：詛咒、變慢 5 秒'], sanctuary: ['6 秒陣地，每跳 B × 0.3（半徑 4 公尺）'],
    wild: ['半徑 5 公尺定身 2.5 秒＋回血'], iai: ['0.4 秒後一直線 8 公尺 B × 4，必定暴擊'], shadowstep: ['瞬移到敵人背後 B × 3、隱身 2 秒'], yotoRelease: ['身邊 4 公尺 B ×（1.5＋0.05 × 層數）'], holycharge: ['衝 7 公尺撞到 B × 1.5，終點一圈 B × 1.2、回生命上限 15%'],
    whirl: ['1.2 秒內每 0.2 秒轉一圈：普攻傷害 × 0.55（半徑 3 公尺）'], rage: ['狂怒 6 秒'], kekkai: ['結界 5 秒'], fortress: ['不動如山 5 秒'], shiki: ['3 隻式神環繞 10 秒']
  };
  R.skillFormula = id => {
    const P = Pnow(), L = [], lib = R.SKILL_LIB && R.SKILL_LIB[id], sk = R.SKILLS && R.SKILLS[id];
    if (!sk) return ['（沒有這招）'];
    const cdK = (P && P.skillCdMult) || 1;
    L.push('冷卻 ' + sk.cd + ' 秒' + (Math.abs(cdK - 1) > 0.01 ? ' × 冷卻倍率 ' + n1(cdK) + ' = ' + n1(sk.cd * cdK) + ' 秒' : '') + '・魔力 ' + sk.mp);
    if (lib && lib.type === 'lv30') {
      const S = R.LV30 && R.LV30[lib.p.k], ub = P && R.ultBase ? R.ultBase(P) : 0;
      L.push('大招基準 U = 武器傷害 × 發數 × 段數 × 職業倍率' + (ub ? '（現在 ' + n1(ub) + '）' : ''));
      ((S && S.f) || [S ? S.d : '']).forEach(x => L.push(typeof x === 'function' ? x(P) : x));
    } else if (lib) {
      const Wv = P && P.ws ? powerOf(P.ws) : 0;
      powerLines(P).forEach(x => L.push(x));
      L.push('型：' + (TYPE[lib.type] || lib.type));
      if (lib.type === 'combo') (lib.p.parts || []).forEach((pt, i) => { const ls = partLines(pt[0], pt[1] || {}, P, Wv); L.push('第 ' + (i + 1) + ' 段（' + (TYPE[pt[0]] || pt[0]) + '）：' + (ls.join('；') || '—')); });
      else partLines(lib.type, lib.p || {}, P, Wv).forEach(x => L.push(x));
    } else {
      const b = P && P.ws ? naOf(P.ws) * 1.5 : 0;
      L.push('內建技能：基準 B = 一下普攻 × 1.5' + (b ? '（現在 ' + n1(b) + '）' : ''));
      (BI[id] || ['照說明']).forEach(x => L.push(x));
    }
    // 其他會乘上去的
    if (P && P.cls === 'bard' && !(lib && lib.type === 'lv30')) { const k = (100 + Math.sqrt(Math.max(0, P.mpMax || 0))) / 100; L.push('吟遊詩人：技能傷害再 ×（100＋√最大魔力）% = × ' + n1(k)); }
    if (P && P.ttCaps && P.ttCaps.C2) L.push('天啟（魔力滿時）：多消耗的魔力 m → 傷害、時間、範圍、效果 +m%（超過 100 的部分改成 +√m%）');
    if (P) L.push('最後再乘：角色傷害 × ' + n1(P.dmgMult || 1) + '、暴擊（' + pc(Math.min(1, (P.ws && P.ws.crit) || 0)) + ' 機率 × ' + n1(P.critMult || 1.5) + '）、遺跡生物的防禦和減傷');
    return L;
  };
  // ---------- 卡片上的「?」 ----------
  const btn = id => '<span class="sk-q" role="button" tabindex="0" data-fq="' + esc(id) + '" title="看公式">?</span>';
  R.skillQ = btn;
  const toggle = el => {
    const card = el.closest('.sb-card,.sv-card'); if (!card) return; let box = card.querySelector(':scope > .sk-f');
    if (box) { box.remove(); return; }
    box = document.createElement('div'); box.className = 'sk-f'; box.innerHTML = R.skillFormula(el.dataset.fq).map(x => '<div>' + esc(x) + '</div>').join(''); card.appendChild(box);
  };
  document.addEventListener('click', e => { const q = e.target && e.target.closest && e.target.closest('.sk-q'); if (!q) return; e.preventDefault(); e.stopPropagation(); toggle(q); }, true);
  document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.classList && e.target.classList.contains('sk-q')) { e.preventDefault(); toggle(e.target); } }, true);
  const css = document.createElement('style');
  css.textContent = '.sb-card,.sv-card{position:relative}.sv-card{flex-wrap:wrap}.sv-card>div:not(.sk-f){flex:1 1 0;min-width:0}.sb-card .sk-f{grid-column:1/-1}.sb-pick{padding-right:30px}.sk-q{position:absolute;top:6px;right:6px;z-index:2;width:20px;height:20px;border-radius:50%;border:1px solid #8A7A5A;background:#221C16;color:#FFE08A;font:700 12px/18px sans-serif;text-align:center;cursor:pointer}'
    + '.sk-q:hover{background:#3A2E1E;border-color:#FFE08A}.sk-f{flex-basis:100%;width:100%;box-sizing:border-box;margin:6px 0 0;padding:8px 10px;border-radius:6px;background:rgba(0,0,0,.35);border:1px dashed #6A5A3A;font-size:12px;line-height:1.55;color:#E8DCC0}.sk-f div+div{margin-top:2px}';
  document.head.appendChild(css);
})(window.R);
