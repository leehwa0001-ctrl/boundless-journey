// 無境之旅：特殊遺跡「無底迴廊」——不照一般分級規則、超難的遺跡。
// 2026-10-17 作者：只剩一座、全天開放；共 300 層（另有第 0 層休息區），每層固定增幅 4%；
//   遺跡等級跟著樓層走：第 0～5 層哈米莉亞級、6～30 阿彌勒級、31～70 摩爾斯級、71～150 克森特級、151～300 卡索級；存檔點固定每 10 層一個。
// - 換分級：包 R.loadFloor，進每一層前把 run.grade 換成那一層的分級（遺跡生物、寶物、陷阱都照它）。
// - 增幅：R.depthBonus 對這座改成「第 n 層 +4%×n」（生命 +4%×n、傷害一半，跟其他遺跡一樣）。
// - IS（ruinis.js）：照「這一層在該分級區段裡的位置」換算成該分級很深的一般遺跡（不會因為 300 層一路疊上去）。
// - 常數都在 R.SPECIAL_RUIN，改這裡就好。
(function (R) {
  const W = () => R.W;
  const SP = R.SPECIAL_RUIN = { floors: 300, per: 0.04, every: 10,
    bands: [[5, 'hamilia', 12], [30, 'amile', 25], [70, 'mors', 40], [150, 'kesent', 60], [300, 'kaso', 120]] };   // [到第幾層, 分級, IS 換算的層數]
  const site = { id: 'sp-mugen', map: 'nation', x: 36.55, z: -21.35, kind: 'ruin', grade: 'hamilia', type: 'city', special: 1, floorsFixed: SP.floors, name: '無底迴廊', src: '遊戲',
    desc: '公會特別告示的「特殊遺跡」。入口看起來只是哈米莉亞級，卻往下長了三百層——越往下，遺跡的等級一路升上去，最底下是卡索級。', status: 'open' };
  if (R.SITES) { for (let i = R.SITES.length - 1; i >= 0; i--) if (/^sp-mugen/.test(R.SITES[i].id)) R.SITES.splice(i, 1); R.SITES.push(site); }
  const bandOf = n => SP.bands.find(b => n <= b[0]) || SP.bands[SP.bands.length - 1];
  const isSp = run => !!(run && run.site && run.site.special);
  const shown = run => (run.f0 ? run.floor : run.floor + 1);
  R.specialGradeAt = n => bandOf(n)[1];
  R.specialRuleText = () => '共 ' + SP.floors + ' 層（另有第 0 層）・每層增幅 +' + Math.round(SP.per * 100) + '%・第 0～5 層哈米莉亞級、6～30 阿彌勒級、31～70 摩爾斯級、71～150 克森特級、151～300 卡索級・每 ' + SP.every + ' 層一個存檔點・全天開放';
  R.specialDaysLeft = () => 99; R.specialNextIn = () => 0;
  const sync0 = R.syncStatus;
  R.syncStatus = (...a) => { const r = sync0 ? sync0(...a) : undefined; site.status = 'open'; return r; };
  // 進每一層前換分級
  const setGrade = (run, f) => { const n = run.f0 ? f : f + 1, g = R.gradeById(bandOf(Math.max(0, n))[1]); if (g) run.grade = g.floor0 ? g : Object.assign({}, g, { floor0: 1 }); };   // 第 0 層一直都在（樓層數字才不會錯開）
  const lf0 = R.loadFloor;
  R.loadFloor = (f, o) => { const run = W().run; if (isSp(run)) setGrade(run, f); return lf0(f, o); };
  // 哈米莉亞那幾層：「前一半沒有遺跡生物」只算到第 2 層（不然 300 層的一半都是空的）
  const gf0 = R.genFloor;
  R.genFloor = (run, f) => {
    if (!isSp(run) || run.grade.id !== 'hamilia') return gf0(run, f);
    const n = run.floors; run.floors = 6; try { return gf0(run, f); } finally { run.floors = n; }
  };
  // 增幅：第 n 層 +4%×n
  const db0 = R.depthBonus;
  R.depthBonus = run => {
    if (!isSp(run)) return db0(run);
    const n = Math.max(0, shown(run)), amp = SP.per * n, total = SP.floors;
    return { n, total, p: n / total, k: n > 0 ? 1 : 0, amp, cap: SP.per * total, rate: SP.per, hp: amp, dmg: amp * 0.5, qty: Math.min(1, amp * 0.1), rare: Math.min(1, amp * 0.1), xp: Math.min(3, amp * 0.25) };
  };
  // 存檔點：固定每 10 層
  const se1 = R.saveEvery;
  R.saveEvery = run => (isSp(run) ? SP.every : se1(run));
  // IS：照這一層在分級區段裡的位置換算
  const se0 = R.spawnEnemy;
  R.spawnEnemy = (id, x, z, room, o) => {
    const run = W().run; if (!isSp(run) || run.isRealFloor != null) return se0(id, x, z, room, o);
    const n = shown(run), b = bandOf(n), i = SP.bands.indexOf(b), lo = i ? SP.bands[i - 1][0] + 1 : 1;
    run.isRealFloor = Math.max(0, Math.round((n - lo) / Math.max(1, b[0] - lo) * (b[2] - 1)));
    try { return se0(id, x, z, room, o); } finally { run.isRealFloor = null; }
  };
  R.SPECIAL_RUINS = [site]; R.SPECIAL_SITE = site;
})(window.R);
