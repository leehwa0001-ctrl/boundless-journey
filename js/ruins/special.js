// 無境之旅：特殊遺跡——不照一般分級規則、超難的遺跡（2026-10-13 作者：某些特殊狀況會出現超級難的、不符合尋常遺跡分級難度的遺跡；
//   先出一座「200 層的阿彌勒級」：怪物一開始 ×0.75，越深越強，最深處 +100%）。
// - 出現規則：公會的「特殊遺跡告示」——每 30 個遊戲日只開 3 天（第 SP.offset 天起），而且要阿彌勒級已經開放。
//   開著的時候回到城裡會跳一次公會告示；沒開的時候地圖、圖鑑上照樣看得到，但顯示「還不能進」。
// - 難度：遺跡生物生命、傷害 ×SP.start（0.75），深度增幅（deepbonus.js）最深 +SP.depthMax（+100%，複利，照走到第幾成）；
//   IS（ruinis.js）照「25 層的阿彌勒級」換算，不會因為 200 層而一路疊上去。
// - 常數都在 R.SPECIAL_RUIN，改這裡就好。
(function (R) {
  const W = () => R.W;
  // 2026-10-13 作者：無底迴廊加摩爾斯級、克森特級、卡索級（各 200 層、城區型；卡索級的也不是浮島）。開放的日子錯開（30 天一輪、各開 3 天）。
  //   isFloors：IS 照「這個分級很深的一般遺跡」換算（阿彌勒 25、摩爾斯 40、克森特 60、卡索 120 層）。
  const SP = R.SPECIAL_RUIN = { floors: 200, start: 0.75, depthMax: 1.0, every: 30, open: 3 };
  const LIST = R.SPECIAL_RUINS = [
    { id: 'sp-mugen', grade: 'amile', name: '無底迴廊', offset: 11, isFloors: 25, x: 36.55, z: -21.35 },
    { id: 'sp-mugen-mors', grade: 'mors', name: '無底迴廊・摩爾斯', offset: 4, isFloors: 40, x: 35.55, z: -23.95 },
    { id: 'sp-mugen-kesent', grade: 'kesent', name: '無底迴廊・克森特', offset: 26, isFloors: 60, x: 37.85, z: -24.45 },
    { id: 'sp-mugen-kaso', grade: 'kaso', name: '無底迴廊・卡索', offset: 19, isFloors: 120, x: 39.05, z: -24.65 }
  ];
  const GN = { amile: '阿彌勒級', mors: '摩爾斯級', kesent: '克森特級', kaso: '卡索級' };
  const sites = LIST.map(d => ({ id: d.id, map: 'nation', x: d.x, z: d.z, kind: 'ruin', grade: d.grade, type: 'city', special: 1, floorsFixed: SP.floors, depthMax: SP.depthMax, spOffset: d.offset, isFloors: d.isFloors, name: d.name, src: '遊戲',
    desc: '公會特別告示的「特殊遺跡」。登記是' + GN[d.grade] + '，卻往下長了兩百層——不照尋常分級的規矩。每隔一段時間才會浮出入口，幾天後又沉下去。' + (d.grade === 'kaso' ? '卡索級的規定照舊：要有特別討伐令、要帶隊友。' : ''), status: 'lock' }));
  sites.forEach(st => { if (R.SITES && !R.SITES.some(s => s.id === st.id)) R.SITES.push(st); });
  const site = sites[0];
  const day = () => (R.S && R.S.day) || 0;
  const k = s => (((day() + (s.spOffset || 0)) % SP.every) + SP.every) % SP.every;
  const spOf = s => (typeof s === 'string' ? sites.find(x => x.id === s) : s && s.special ? s : null) || site;
  R.specialRuleText = s => { s = spOf(s); const d0 = ((SP.every - (s.spOffset || 0)) % SP.every); return '共 ' + SP.floors + ' 層・遺跡生物一開始 ×' + SP.start + '、越深越強、最深 +' + Math.round(SP.depthMax * 100) + '%・每 ' + SP.every + ' 天只開 ' + SP.open + ' 天（每輪第 ' + (d0 + 1) + '～' + (d0 + SP.open) + ' 天）'; };
  // 這一輪還剩幾天（0＝沒開）
  R.specialDaysLeft = s => { s = spOf(s); return k(s) < SP.open ? SP.open - k(s) : 0; };
  R.specialNextIn = s => { s = spOf(s); return k(s) < SP.open ? 0 : SP.every - k(s); };
  const open = s => R.specialDaysLeft(s) > 0 && (!R.gradeOpen || R.gradeOpen(s.grade));
  const sync0 = R.syncStatus;
  R.syncStatus = (...a) => { const r = sync0 ? sync0(...a) : undefined; sites.forEach(s => { s.status = open(s) || (R.S && R.S.admin) ? 'open' : 'lock'; }); return r; };
  // 公會告示：開著的時候回城跳一次（每座各一次）
  const en0 = R.enterTownNow;
  if (en0) R.enterTownNow = (...a) => {
    const r = en0(...a);
    try { R.syncStatus && R.syncStatus(); const S = R.S; if (S) { S.spNotice = S.spNotice && typeof S.spNotice === 'object' ? S.spNotice : {}; let t = 1800;
      sites.forEach(s => { const left = R.specialDaysLeft(s), key = Math.floor((day() + s.spOffset) / SP.every); if (left > 0 && open(s) && S.spNotice[s.id] !== key) { S.spNotice[s.id] = key; R.save && R.save(); setTimeout(() => R.toast && R.toast('公會告示：特殊遺跡「' + s.name + '」浮出入口了（共 ' + SP.floors + ' 層，還有 ' + left + ' 天）', '#FF6AD8'), t); t += 2600; } }); } } catch (e) { }
    return r;
  };
  const isSp = run => !!(run && run.site && run.site.special);
  // 生命、傷害 ×0.75；IS 照這個分級很深的一般遺跡換算
  const se0 = R.spawnEnemy;
  R.spawnEnemy = (id, x, z, room, o) => {
    const run = W().run; if (!isSp(run)) return se0(id, x, z, room, o);
    const own = run.isRealFloor == null, f0 = run.f0 ? 1 : 0, isF = run.site.isFloors || 25;
    if (own) run.isRealFloor = Math.round(f0 + (run.floor - f0) / Math.max(1, run.floors - 1 - f0) * (isF - 1));
    let e; try { e = se0(id, x, z, room, o); } finally { if (own) run.isRealFloor = null; }
    if (e && !e.spDone) { e.spDone = 1; e.hp *= SP.start; e.hpMax *= SP.start; e.dmg *= SP.start; }
    return e;
  };
  R.SPECIAL_SITE = site;
})(window.R);
