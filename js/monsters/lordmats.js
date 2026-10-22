// 領主體的素材（2026-10-22 作者：像魔物獵人一樣細分素材——領主體會掉很多種素材，還有特別難掉的寶玉；紅武要幾個寶玉；圖鑑寫掉落機率）
// - 每一隻領主體五種素材：一般（皮、鱗、甲）、部位（爪、牙、角）、骨／殼、稀有部位、寶玉（很難掉）。
// - 打倒一隻：抽 5 次（異變多抽 2 次）；每次照下面的機率抽一種。另外寶玉單獨再抽一次（3%，異變 9%）。
// - 用途：鐵匠鋪「領主裝備」照那隻的素材打造牠的專屬裝備（掉落的機率改成第一次一定、之後一成二）；
//   紅武（異變）要：異變核心 ×3、任一種領主寶玉 ×1、高純度魔力水晶 ×2、150,000 費拉。
// - 專屬裝備的效果都是每個職業都用得上的（作者：不要做成只適合某個職業的效果）。
// - 素材很多種，背包每一種長寬再各 +1。
// 放在 lordplus.js、lordvariant.js、crafting.js、raid.js 後面，maticons.js 前面。
(function (R) {
  const W = () => R.W, S = () => R.S, rnd = Math.random, esc = s => R.esc(s);
  const LM = R.LORD_MATS = {"gashadokuro":{"c":"#E8E0CC","p":[["gsk_bone","巨骸骨片"],["gsk_finger","骸王指骨"],["gsk_spine","骸王脊椎"],["gsk_crown","骸王頭骨冠"],["gsk_gem","萬骸之魂玉"]]},"spikewolf":{"c":"#2A2A32","p":[["spw_pelt","棘狼毛皮"],["spw_claw","棘狼利爪"],["spw_thorn","黑棘刺"],["spw_crown","狼王的棘冠"],["spw_gem","千棘寶玉"]]},"kraken":{"c":"#5A2A4A","p":[["krk_arm","深淵觸腕"],["krk_sucker","王蛸吸盤"],["krk_ink","深淵墨囊"],["krk_eye","王蛸之眼"],["krk_gem","深淵寶玉"]]},"tsuchigumo":{"c":"#B08AFF","p":[["tsg_silk","巢織蛛絲"],["tsg_fang","織母毒牙"],["tsg_shell","織母甲殼"],["tsg_sac","織母卵囊"],["tsg_gem","巢織寶玉"]]},"windelder":{"c":"#C83A3A","p":[["wnd_feather","風神羽"],["wnd_talon","風神鉤爪"],["wnd_mask","緋色面皮"],["wnd_wingbone","天狂之翼骨"],["wnd_gem","天狂寶玉"]]},"bonewyvern":{"c":"#D8D0BC","p":[["bwv_wingbone","朽翼骨"],["bwv_fang","亡骸龍牙"],["bwv_scale","朽龍鱗"],["bwv_horn","亡骸龍角"],["bwv_gem","亡骸寶玉"]]},"omukade":{"c":"#8A3A2A","p":[["omk_plate","千足甲節"],["omk_jaw","噬骨顎"],["omk_gland","千足毒腺"],["omk_head","千足頭甲"],["omk_gem","噬骨寶玉"]]},"muhyo":{"c":"#2A2A34","p":[["mhy_iron","大鎧鐵片"],["mhy_blade","大鎧刀片"],["mhy_lacquer","黑漆胴甲"],["mhy_mask","無主的鬼面"],["mhy_gem","魔王寶玉"]]},"frostdeer":{"c":"#9AD8FF","p":[["frd_pelt","霜鹿毛皮"],["frd_shard","冰角碎片"],["frd_hoof","霜鹿蹄"],["frd_crown","永凍冰冠"],["frd_gem","永凍寶玉"]]},"lavajaw":{"c":"#FF5A1A","p":[["lvj_scale","熔顎鱗"],["lvj_fang","熔顎牙"],["lvj_plate","熔岩甲片"],["lvj_jaw","熔獄之顎骨"],["lvj_gem","熔獄寶玉"]]},"thunderape":{"c":"#FFE84A","p":[["thp_fur","雷猿毛皮"],["thp_knuckle","雷猿拳骨"],["thp_mane","帶電的鬃毛"],["thp_heart","萬雷之心"],["thp_gem","萬雷寶玉"]]},"sandwhale":{"c":"#C8A868","p":[["sdw_hide","沙鯨皮"],["sdw_baleen","沙鯨鬚"],["sdw_bone","沙鯨骨"],["sdw_tooth","吞天鯨牙"],["sdw_gem","沙海寶玉"]]},"faceforest":{"c":"#4A3424","p":[["ffr_bark","千面樹皮"],["ffr_fruit","人面果"],["ffr_root","古樹根"],["ffr_core","萬面之核"],["ffr_gem","千面寶玉"]]},"carrionvulture":{"c":"#9A221C","p":[["cvl_feather","屍鷲羽"],["cvl_beak","緋喙"],["cvl_talon","屍鷲爪"],["cvl_plume","緋冠羽"],["cvl_gem","緋喙寶玉"]]}};
  const TIER = [['一般', 45, 30], ['部位', 30, 45], ['骨殼', 18, 60], ['稀有', 6, 150], ['寶玉', 1, 600]];   // [名稱, 每次抽到的機率（%）, 價值]
  const GEM = 3, GEM_MUT = 9, ROLLS = 5, ROLLS_MUT = 7;
  Object.keys(LM).forEach(id => { const L = LM[id], nm = ((R.ENEMIES[id] || {}).name || '').replace(/^領主體・/, ''); L.p.forEach(([k, n], i) => { R.MATS[k] = { name: n, color: L.c, value: TIER[i][2], lord: id, tier: i, desc: nm + '身上的' + TIER[i][0] + '素材。' + (i === 4 ? '很難掉，紅武要用。' : '') }; }); });
  // 任一種領主寶玉（紅武的配方用）
  R.MATS.anygem = { name: '任一種領主寶玉', color: '#FF5A8A', value: 600, desc: '哪一隻領主體的寶玉都可以。' };
  const gems = () => Object.keys(LM).map(id => LM[id].p[4][0]);
  const mh0 = R.matHave, ms0 = R.matSpend;
  R.matHave = k => (k === 'anygem' ? gems().reduce((a, g) => a + mh0(g), 0) : mh0(k));
  R.matSpend = (k, n) => { if (k !== 'anygem') return ms0(k, n); let left = n; gems().map(g => [g, mh0(g)]).sort((a, b) => b[1] - a[1]).forEach(([g, h]) => { const t = Math.min(h, left); if (t > 0) { ms0(g, t); left -= t; } }); };
  const cc0 = R.canCraft; if (cc0) R.canCraft = rc => R.S.gold >= rc.gold && Object.keys(rc.mats).every(k => R.matHave(k) >= rc.mats[k]);
  // ---------- 掉落 ----------
  const isLord = e => e && e.def && /^領主體/.test(e.def.name || '');
  const roll = () => { let r = rnd() * 100; for (let i = 0; i < 4; i++) { if (r < TIER[i][1]) return i; r -= TIER[i][1]; } return 4; };
  const ke0 = R.killEnemy;
  R.killEnemy = (e, by) => {
    const was = e && !e.dead, r = ke0(e, by);
    try {
      const L = was && e.dead && LM[e.id]; if (L && isLord(e) && !e.mirror && W().run) {
        const mut = !!e.variant, got = {};
        for (let i = 0; i < (mut ? ROLLS_MUT : ROLLS); i++) { const t = roll(), k = L.p[t][0]; got[k] = (got[k] || 0) + 1; }
        if (rnd() * 100 < (mut ? GEM_MUT : GEM)) { const k = L.p[4][0]; got[k] = (got[k] || 0) + 1; }
        Object.keys(got).forEach((k, i) => setTimeout(() => R.dropMat(k, got[k], e.x + Math.sin(i * 1.3) * 1.2, e.z + Math.cos(i * 1.3) * 1.2), 300 + i * 120));
        if (got[L.p[4][0]]) setTimeout(() => R.banner && R.banner('掉了寶玉！', R.MATS[L.p[4][0]].name), 1500);
      }
    } catch (err) { console.warn('[lordmats]', err); }
    return r;
  };
  // ---------- 專屬裝備：效果改成每個職業都用得上 ----------
  const G = R.LORD_GEAR || {};
  if (G.kraken) { G.kraken[2] = { dmg: 0.08, mpRegen: 1 }; G.kraken[3] = '傷害 +8%、每秒回復魔力 +1'; }
  if (G.thunderape) { G.thunderape[2] = { stun: 0.15, dmg: 0.08 }; G.thunderape[3] = '打中時 15% 機率暈眩、傷害 +8%'; }
  if (!G.muhyo) G.muhyo = ['無主鬼面', 'head_horn', { def: 4, hp: 0.08 }, '物防 +4、生命 +8%'];
  // ---------- 鐵匠鋪：領主裝備 ----------
  const lv = () => { const s = S(); return Math.max(12, s && s.classes && s.classes[s.cls] ? s.classes[s.cls].lv : 12); };
  if (R.RECIPES) Object.keys(LM).forEach(id => { const g = G[id]; if (!g) return; const p = LM[id].p;
    R.RECIPES.push({ tier: 3, name: '領主裝備：' + g[0], get ilvl() { return lv(); }, mats: { [p[0][0]]: 5, [p[1][0]]: 3, [p[2][0]]: 2, [p[3][0]]: 1 }, gold: 20000, weights: [0, 0, 0, 0, 1, 0], lordGear: id, note: '專屬裝備：' + g[3] }); });
  const cr0 = R.craft;
  R.craft = (rc, kind, base) => {
    if (!rc || !rc.lordGear) return cr0(rc, kind, base);
    if (!R.canCraft(rc)) return null; const g = G[rc.lordGear];
    R.S.gold -= rc.gold; Object.keys(rc.mats).forEach(k => R.matSpend(k, rc.mats[k]));
    const it = R.makeItem({ kind: 'armor', base: g[1], ilvl: rc.ilvl, rarity: 4, identified: true }); it.lord = rc.lordGear; R.S.stash.push(it); R.save && R.save(); return it;
  };
  // 紅武：異變核心 ×3、任一種領主寶玉 ×1
  (R.RECIPES || []).forEach(rc => { if (rc.name === '異變（紅武）') rc.mats = { mutacore: 3, anygem: 1, purecry: 2 }; });
  // ---------- 背包：每一種長寬再 +1 ----------
  if (R.PACKS && !R.PACKS._lm) { Object.values(R.PACKS).forEach(p => { if (p && p.w) { p.w++; p.h++; } }); Object.defineProperty(R.PACKS, '_lm', { value: 1 }); }
  // ---------- 圖鑑：掉落機率 ----------
  R.dexDrops = id => {
    const L = LM[id]; if (!L) return R.dexWildDrops ? R.dexWildDrops(id) : '';
    const one = i => 1 - Math.pow(1 - TIER[i][1] / 100, ROLLS), oneM = i => 1 - Math.pow(1 - TIER[i][1] / 100, ROLLS_MUT);
    const pct = v => (v >= 0.995 ? '幾乎一定' : (v * 100 < 10 ? (v * 100).toFixed(1) : Math.round(v * 100)) + '%');
    const rows = L.p.map(([k, n], i) => { const p = i < 4 ? one(i) : 1 - (1 - TIER[4][1] / 100) ** ROLLS * (1 - GEM / 100), pm = i < 4 ? oneM(i) : 1 - (1 - TIER[4][1] / 100) ** ROLLS_MUT * (1 - GEM_MUT / 100);
      return '<tr><td>' + (R.matIconTag ? R.matIconTag(k, 'chip') : '') + esc(n) + '</td><td>' + TIER[i][0] + '</td><td>' + pct(p) + '</td><td>' + pct(pm) + '</td></tr>'; }).join('');
    return '<h4 class="dx-h">掉落素材（打倒一隻至少掉一個的機率）</h4><table class="dx-drop"><tr><th>素材</th><th>種類</th><th>本體</th><th>異變</th></tr>' + rows + '</table>'
      + '<p class="note">一隻抽 ' + ROLLS + ' 次（異變 ' + ROLLS_MUT + ' 次），每次：一般 ' + TIER[0][1] + '%、部位 ' + TIER[1][1] + '%、骨殼 ' + TIER[2][1] + '%、稀有 ' + TIER[3][1] + '%、寶玉 ' + TIER[4][1] + '%；寶玉另外再抽一次（' + GEM + '%，異變 ' + GEM_MUT + '%）。</p>';
  };
  const css = document.createElement('style'); css.textContent = '.dx-drop{width:100%;border-collapse:collapse;font-size:13px;margin:4px 0}.dx-drop td,.dx-drop th{padding:3px 6px;border-bottom:1px solid rgba(255,255,255,.08);text-align:left}.dx-drop th{opacity:.7;font-weight:normal}';
  document.head.appendChild(css);
})(window.R);
