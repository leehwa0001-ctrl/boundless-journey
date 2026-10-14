// 技能圖示改版（作者 2026-10-05：幫我優化技能圖示；同日再調亮；同日再依職業改武器圖示；同日再調亮一次、二轉覺醒也照職業）
// 原本（hud2.js）照技能的「型」只有三十種 16×16 圖示，六百多招共用，劈砍、斬首、撕裂長得一模一樣。現在每一招自己畫一張 24×24：
// - 底：圓角方塊，顏色照技能自己的顏色（沒有就用職業的顏色），左上亮、右下暗，像一般 RPG 的技能格。
// - 中間：照技能做的事畫（斬、刺、射、爆、落雷、法陣、增益、治療、盾、衝刺、瞬移、鎖鏈、光束、砲台、波、鉤、跳、召喚、環繞、標記、吸、
//   吸取、風暴、吐息、舞、復活、十字斬、迴旋刃、架勢、拳、掌、氣、踢、棍……），顏色也照技能。
// - 職業覆寫：武術家（拳／掌／氣／踢／棍）不再用長槍、劍弧；槍手直線技改畫光束，不再長槍。
// - 角落的小徽章：燃燒、冰凍／減速、雷、暈眩、詛咒、吸血、定身、暴擊、隱身、挑釁、貫穿。
// - 上緣的小點：打幾下（段數、波數、連發）。
// - 外框：轉職技銀框、二轉技紫框、覺醒技金框＋閃光。
// 快捷欄（hud2.js 改一行）、技能點畫面（talentui.js）都用 R.skillIconURL。
// 放在 hud2.js、talentui.js 後面。
(function (R) {
  // 技能 → 畫什麼
  const BASE_KIND = { roll: 'dash', volley: 'arrow', whirl: 'spin', fireball: 'fireball', heal: 'heal', flash: 'xslash', charge: 'dash', snipe: 'snipe', element: 'shot', grenade: 'boom', homing: 'shot', trap: 'trap', hamaya: 'arrow', rage: 'rage', combo: 'spin', qijin: 'palm', meteor: 'meteor',
    flashbang: 'boom', barrage: 'shot', pin: 'arrow', leap: 'jump', quake: 'quake', warcry: 'horn', frostnova: 'frost', chain: 'bolt', smite: 'pillar', ward: 'guard', flurry: 'xslash', parry: 'parry', shieldbash: 'guard', guard: 'guard' };
  const TYPE_KIND = { shots: 'shot', shotx: 'shot', line: 'thrust', at: 'pillar', zone: 'zone', mark: 'mark', dash: 'dash', arc: 'slash', nova: 'nova', pull: 'vortex', blink: 'blink', heal: 'heal', parry: 'parry', drain: 'drain', orbit: 'orbit', reload: 'shot', turret: 'turret', hook: 'hook',
    chainx: 'bolt', wave: 'wave', storm: 'storm', boomer: 'boomer', jumpx: 'jump', beam: 'beam', breath: 'breath', aura: 'aura', xslash: 'xslash', dance: 'dance', pet: 'paw', guard: 'guard', revive: 'revive', infuse: 'infuse', buff: 'buff' };
  const SHOT_BY_CLS = { archer: 'arrow', gunner: 'shot', mage: 'orb', priest: 'orb', bard: 'note', summoner: 'orb', arraymage: 'orb', scroll: 'scroll', enchanter: 'slashwave', monk: 'qi' };
  const info = id => {
    const L = R.SKILL_LIB && R.SKILL_LIB[id], sk = R.SKILLS && R.SKILLS[id], cls = (L && L.cls) || (sk && sk.cls) || (R.S && R.S.cls) || 'warrior';
    let type = L ? L.type : null, p = L ? L.p || {} : {};
    if (type === 'combo' && p.parts && p.parts.length) { const parts = p.parts; p = Object.assign({}, ...parts.map(x => x[1] || {})); type = (parts.find(x => !['buff', 'guard'].includes(x[0])) || parts[0])[0]; }
    let kind = L ? TYPE_KIND[type] || 'star' : BASE_KIND[id] || 'star';
    if (kind === 'shot') kind = SHOT_BY_CLS[cls] || 'shot';
    if (type === 'heal' && (p.allyShield || p.shield) && !(p.pct > 0) && !(p.allies > 0)) kind = 'guard';
    if (type === 'buff') kind = p.def > 0 ? 'guard' : p.invis ? 'ghost' : p.vamp ? 'fang' : p.speed > 1 && !(p.dmg > 1) ? 'wing' : p.crit && !(p.dmg > 1) ? 'eye' : 'buff';
    if (type === 'arc' && p.arc >= 6) kind = 'spin';
    if (type === 'at' && p.waves > 1) kind = 'meteor';
    if (type === 'line' && p.width > 1.2) kind = 'beam';
    const color = p.color || (R.CLASS_GLOW && R.CLASS_GLOW[cls]) || (R.CLASSES[cls] && R.CLASSES[cls].color) || '#C8A86A';
    const n = Math.max(p.hits || 1, p.waves || 1, p.burst || 1, type === 'shots' && p.n ? Math.min(p.n, 5) : 1);
    const badges = [];
    if (p.burn || p.elem === 'fire') badges.push('burn');
    if (p.frost || p.slow || p.slowAura) badges.push('frost');
    if (p.shock) badges.push('shock');
    if (p.stun) badges.push('stun');
    if (p.curse) badges.push('curse');
    if (p.vamp || p.heal && type === 'drain') badges.push('vamp');
    if (p.root) badges.push('root');
    if (p.crit || p.crits) badges.push('crit');
    if (p.invis) badges.push('ghost');
    if (p.taunt) badges.push('taunt');
    if (p.pierce) badges.push('pierce');
    const tier = /_aw$/.test(id) ? 'aw' : /^sp2_|^a2_/.test(id) ? 'sp' : L && L.adv ? 'adv' : '';
    // 依技能 ID／職業改圖：武術家不該出現長槍、劍；槍手直線是光束不是刺
    const ID_KIND = {
      // 武術家基礎
      m_flurry: 'fist', m_step: 'dash', m_palm: 'palm', m_kick: 'kick', m_focus: 'qi', m_counter: 'parry',
      m_wave: 'qi', m_stomp: 'quake', m_breathe: 'heal', m_meteor: 'kick',
      m_dragon: 'palm', m_iron: 'guard', m_storm: 'fist', m_leap: 'kick', m_final: 'qi',
      // 拳聖
      fs_hundred: 'fist', fs_rising: 'fist', fs_iron: 'guard', fs_tiger: 'fist', fs_thousand: 'fist', fs_heaven: 'fist',
      // 棍僧
      sm_wheel: 'pole', sm_vault: 'pole', sm_sweep: 'pole', sm_pole: 'pole', sm_dragon: 'pole', sm_mountain: 'pole',
      // 內修者
      in_breath: 'heal', in_palm: 'palm', in_wave: 'qi', in_iron: 'guard', in_burst: 'nova', qijin: 'palm',
      // 外修者（術士路線，隔空掌用氣／掌）
      wx_burst: 'nova', wx_palm: 'palm', wx_shell: 'guard',
      // 二轉、覺醒（2026-10-05 作者：快捷欄上還有長槍、槍的圖——破山拳、寸勁原本畫成光束，看起來像長槍）
      sp2_monk_0: 'fist', sp2_monk_1: 'kick', sp2_monk_2: 'guard',
      a2_monk_fistsaint_0: 'fist', a2_monk_fistsaint_1: 'kick', a2_monk_staffmonk_0: 'pole', a2_monk_staffmonk_1: 'pole',
      a2_monk_inner_0: 'palm', a2_monk_inner_1: 'heal', a2_monk_waixiu_0: 'qi', a2_monk_waixiu_1: 'guard'
    };
    const bid = id.replace(/_aw$/, '');   // 覺醒技跟原本那招同一種圖（外框另外是金的）
    if (ID_KIND[id] || ID_KIND[bid]) kind = ID_KIND[id] || ID_KIND[bid];
    else if (cls === 'monk' || (R.S && R.S.cls === 'monk' && !(L && L.cls && L.cls !== 'monk'))) {
      if (['thrust', 'slash', 'xslash', 'slashwave', 'beam', 'dance', 'pillar', 'spin'].includes(kind)) kind = 'fist';
      else if (['shot', 'orb', 'arrow', 'snipe', 'wave', 'aura', 'breath'].includes(kind)) kind = 'qi';
    } else if ((cls === 'gunner' || cls === 'archer') && kind === 'thrust') kind = 'beam';
    // 現在的職業是武術家、快捷欄放的是別的職業的技能（技能書學來的）：一樣不畫長槍、槍、箭，改成拳／氣
    if (R.S && R.S.cls === 'monk' && !ID_KIND[id] && !ID_KIND[bid]) { if (['thrust', 'beam', 'slash', 'xslash', 'slashwave'].includes(kind)) kind = 'fist'; else if (['shot', 'arrow', 'snipe', 'orb'].includes(kind)) kind = 'qi'; }
    return { kind, color, n: Math.min(5, n), badges: badges.slice(0, 2), tier, key: [kind, color, n, badges.slice(0, 2).join('+'), tier].join('|') };
  };


  R.skillIconInfo = info;   // 測試用
})(window.R);
