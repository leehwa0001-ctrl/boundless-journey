// 無境之旅：同一種遺跡生物，分級越高越兇（作者：阿彌勒級和哈米莉亞級同地區的會有相似性，但攻擊性徵截然不同；
//   出個同類型的怪，照難度外觀越來越可怕的版本）
// 每一種「本來是低分級」的遺跡生物，到更高分級的遺跡會變成變種（照原本的點陣圖自動改）：
//   荒（高一級）：顏色變暗偏紅、眼睛發紅、背上長出短刺。
//   獰（高兩級）：更暗、刺更長、露出獠牙，身體大一成。
//   淵（高三級以上）：幾乎全黑帶紫、眼睛發紫光、一圈紫色的光邊，身體大兩成。
// 數值只多一點（生命 +15／30／45%、傷害 +10／20／30%，跑快一點）——分級本來就有加強。
// 2026-10-04 作者：同種怪物越深層越容易出現變種；變異種只在深層出現，越深外觀越危險——
//   出現的機率、兇的程度照走到第幾成（R.variantAt；淺層沒有、最深全是）。原本固定七成、只看分級。圖鑑不另外列（noDex），打倒的次數算在原本那一種上。
// 有特別寫法的不變（三連貂、福影童、預言犢、分裂膠、喚群燈、行壁、礦殼的礦脈房……）。
(function (R) {
  const W = R.W, rnd = Math.random;
  const TIER = [null, { pre: '荒', hp: 1.15, dmg: 1.1, sp: 1.04, sc: 1.0, eye: '#FF5A2A', spike: '#3A2A24' }, { pre: '獰', hp: 1.3, dmg: 1.2, sp: 1.08, sc: 1.1, eye: '#FF2A2A', spike: '#24160F' }, { pre: '淵', hp: 1.45, dmg: 1.3, sp: 1.12, sc: 1.2, eye: '#C88AFF', spike: '#180A22' }];
  const SKIP_AI = ['trio', 'luck', 'prophet', 'core', 'lord', 'split', 'alarm', 'wall', 'giant'], SKIP_ID = ['kamaitachi', 'kudan', 'fukudo', 'splitgel', 'splitgel_s', 'chochin', 'nurikabe', 'petra', 'muddoll_s', 'kitsune_ghost'];
  const hex = c => { const n = parseInt(String(c).slice(1, 7), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const toHex = ([r, g, b]) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const shade = (c, t) => {
    if (!/^#[0-9a-fA-F]{6}/.test(c)) return c; let [r, g, b] = hex(c); const L = (r * 0.3 + g * 0.59 + b * 0.11);
    if (t === 1) return toHex([r * 0.82 + 22, g * 0.72, b * 0.7]);
    if (t === 2) return toHex([L * 0.25 + r * 0.45 + 18, L * 0.25 + g * 0.35, L * 0.2 + b * 0.35]);
    // 2026-10-22 作者：淵看不出是誰——保留原本的顏色、花紋，整體壓暗、帶一點紫（原本整隻變成單一的深紫）
    return toHex([r * 0.6 + L * 0.06 + 22, g * 0.5 + L * 0.04 + 6, b * 0.62 + L * 0.08 + 38]);
  };
  R.VARIANT_TIER = TIER; R.variantShade = shade;   // beastpaint.js 的手點新圖也照這套改（顏色、紅眼、刺、淵的紫光邊）
  // 圖：荒、獰、淵都有重新畫的點陣圖（beastpix.js 的 id_v1～3；沒有的照本體換色：beastpaint.js 的 variantPix）。2026-10-26 舊的換色點陣圖刪掉了

  // 每一種生物「本來」在哪一級（最低出現的分級）
  const home = {};
  const order = ['hamilia', 'amile', 'mors', 'kesent'];
  order.forEach((gid, i) => { const g = R.gradeById(gid); (g && g.pool || []).forEach(id => { if (home[id] == null) home[id] = i + 1; }); });
  const VAR = {};
  Object.keys(home).forEach(id => {
    const d = R.ENEMIES[id]; if (!d || d.boss || d.elite || d.env || d.noDex || SKIP_ID.includes(id) || SKIP_AI.includes(d.ai) || home[id] > 4) return;   /* 克森特級原生的也有變種（深層才出現） */
    for (let t = 1; t <= 3; t++) {
      const vid = id + '_v' + t, T = TIER[t];
      R.ENEMIES[vid] = Object.assign({}, d, { name: T.pre + d.name, hp: Math.round(d.hp * T.hp), dmg: Math.round(d.dmg * T.dmg * 10) / 10, speed: d.speed * T.sp, xp: Math.round(d.xp * (1 + 0.15 * t)), size: d.size * T.sc, noDex: 1, vbase: id, vtier: t, desc: (d.desc || '') + '（' + T.pre + '：更高分級的遺跡裡長出來的變種）' });
      (VAR[id] = VAR[id] || [])[t] = vid;
    }
  });
  R.VARIANTS = VAR;
  // 照深度（0～1，走到第幾成）決定變種的機率、變成哪一級；gd＝這座遺跡比牠原本的分級高幾級
  // 2026-10-04 作者：越深越容易出現變種要再極端一點——第一層就遇到理論上深層才會出現的怪物了。
  //   （原本：第一層就有一成、而且照分級差直接是「淵」。）現在：
  //   淺層（前三分之一）：沒有變種。中層：兩成到六成，「荒」（遺跡比牠高兩級以上是「獰」）。
  //   深層：七成到全部，「獰」；最深的一成五、或遺跡比牠高兩級以上是「淵」。圖鑑的遺跡頁（dexruins.js）也照這個。
  // 2026-10-14 作者：哈米莉亞級的遺跡不會出現變種（spawnEnemy、圖鑑都跳過）。
  R.variantAt = (dep, gd) => {
    if (dep < 1 / 3) return { chance: 0, tier: 0 };
    if (dep < 2 / 3) return { chance: 0.2 + 1.2 * (dep - 1 / 3), tier: gd >= 2 ? 2 : 1 };
    return { chance: Math.min(1, 0.7 + 0.9 * (dep - 2 / 3)), tier: dep >= 0.85 || gd >= 2 ? 3 : 2 };
  };
  // 生出來的時候換成變種
  const se = R.spawnEnemy;
  R.spawnEnemy = (id, x, z, room, o) => {
    const run = W.run, h = home[id];
    if (run && VAR[id] && h && !(run.grade && run.grade.id === 'hamilia') && !(o && (o.human || o.role || o.netMirror))) { const dep = Math.max(0, Math.min(1, (run.floor || 0) / Math.max(1, ((run.floors || 1) - 1) * (run.depthK && run.depthK < 1 ? run.depthK : 1)))),   /* depth.js 生怪時把 run.floor 換算成舊的層數，總層數也要一起換算 */ v = R.variantAt(dep, Math.max(0, (run.grade.lv || 1) - h)); let diff = v.tier; while (diff > 0 && !VAR[id][diff]) diff--; if (diff >= 1 && rnd() < v.chance) { const e = se(VAR[id][diff], x, z, room, o); if (e) { e.vbase = id; const k = TIER[diff].sc; if (k !== 1 && e.m && e.m.g) e.m.g.scale.multiplyScalar(k); } return e; } }
    return se(id, x, z, room, o);
  };
  // 打倒的次數也算在原本那一種上（圖鑑、之後的寵物）
  const k0 = R.killEnemy;
  R.killEnemy = (e, by) => { const r = k0(e, by); const run = W.run; if (e && e.vbase && run) { run.killIds = run.killIds || {}; run.killIds[e.vbase] = (run.killIds[e.vbase] || 0) + 1; } return r; };
  R.variantDebug = { home, VAR };
})(window.R);
