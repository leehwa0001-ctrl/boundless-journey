// 討伐令 1433：特殊遺跡——不照一般分級規則、超難的遺跡（2026-10-13 作者：某些特殊狀況會出現超級難的、不符合尋常遺跡分級難度的遺跡；
//   先出一座「200 層的阿彌勒級」：怪物一開始 ×0.75，越深越強，最深處 +100%）。
// - 出現規則：公會的「特殊遺跡告示」——每 30 個遊戲日只開 3 天（第 SP.offset 天起），而且要阿彌勒級已經開放。
//   開著的時候回到城裡會跳一次公會告示；沒開的時候地圖、圖鑑上照樣看得到，但顯示「還不能進」。
// - 難度：遺跡生物生命、傷害 ×SP.start（0.75），深度增幅（deepbonus.js）最深 +SP.depthMax（+100%，複利，照走到第幾成）；
//   IS（ruinis.js）照「25 層的阿彌勒級」換算，不會因為 200 層而一路疊上去。
// - 常數都在 R.SPECIAL_RUIN，改這裡就好。
(function (R) {
  const W = () => R.W;
  const SP = R.SPECIAL_RUIN = { id: 'sp-mugen', floors: 200, start: 0.75, depthMax: 1.0, every: 30, open: 3, offset: 11, isFloors: 25 };
  const site = { id: SP.id, map: 'nation', x: 36.55, z: -21.35, kind: 'ruin', grade: 'amile', type: 'city', special: 1, floorsFixed: SP.floors, depthMax: SP.depthMax, name: '無底迴廊', src: '遊戲',
    desc: '公會特別告示的「特殊遺跡」。登記是阿彌勒級，卻往下長了兩百層——不照尋常分級的規矩。每隔一段時間才會浮出入口，幾天後又沉下去。', status: 'lock', lx: 18, ly: -14 };
  if (R.SITES && !R.SITES.some(s => s.id === SP.id)) R.SITES.push(site);
  R.specialRuleText = s => '共 ' + SP.floors + ' 層・遺跡生物一開始 ×' + SP.start + '、越深越強、最深 +' + Math.round(SP.depthMax * 100) + '%・每 ' + SP.every + ' 天只開 ' + SP.open + ' 天';
  const day = () => (R.S && R.S.day) || 0;
  // 這一輪還剩幾天（0＝沒開）
  R.specialDaysLeft = () => { const k = ((day() + SP.offset) % SP.every + SP.every) % SP.every; return k < SP.open ? SP.open - k : 0; };
  R.specialNextIn = () => { const k = ((day() + SP.offset) % SP.every + SP.every) % SP.every; return k < SP.open ? 0 : SP.every - k; };
  const open = () => R.specialDaysLeft() > 0 && (!R.gradeOpen || R.gradeOpen('amile'));
  const sync0 = R.syncStatus;
  R.syncStatus = (...a) => { const r = sync0 ? sync0(...a) : undefined; const s = R.SITES.find(x => x.id === SP.id); if (s) s.status = open() || (R.S && R.S.admin) ? 'open' : 'lock'; return r; };
  // 公會告示：開著的時候回城跳一次
  const en0 = R.enterTownNow;
  if (en0) R.enterTownNow = (...a) => {
    const r = en0(...a);
    try { R.syncStatus && R.syncStatus(); const S = R.S, left = R.specialDaysLeft(), key = Math.floor((day() + SP.offset) / SP.every);
      if (S && left > 0 && open() && S.spNotice !== key) { S.spNotice = key; R.save && R.save(); setTimeout(() => R.toast && R.toast('公會告示：特殊遺跡「' + site.name + '」浮出入口了（共 ' + SP.floors + ' 層，還有 ' + left + ' 天）', '#FF6AD8'), 1800); } } catch (e) { }
    return r;
  };
  const isSp = run => !!(run && run.site && run.site.special);
  // 生命、傷害 ×0.75；IS 照 25 層換算
  const se0 = R.spawnEnemy;
  R.spawnEnemy = (id, x, z, room, o) => {
    const run = W().run; if (!isSp(run)) return se0(id, x, z, room, o);
    const own = run.isRealFloor == null, f0 = run.f0 ? 1 : 0;
    if (own) run.isRealFloor = Math.round(f0 + (run.floor - f0) / Math.max(1, run.floors - 1 - f0) * (SP.isFloors - 1));
    let e; try { e = se0(id, x, z, room, o); } finally { if (own) run.isRealFloor = null; }
    if (e && !e.spDone) { e.spDone = 1; e.hp *= SP.start; e.hpMax *= SP.start; e.dmg *= SP.start; }
    return e;
  };
  R.SPECIAL_SITE = site;
})(window.R);
