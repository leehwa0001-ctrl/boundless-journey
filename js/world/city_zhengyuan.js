// 征遠（海軍造船）的 3D 城（2026-10-20 作者：剩下的城市地圖照《昭旭重要城市》的順序一次做完）
// 設定：西北海軍重鎮、國內最大造船場；曾造戰列艦「武聖號」；會戰後以商用、民用船為主。
// 樣子：北邊的港：正中間停著武聖號（退役後當軍艦博物館），東邊是造船廠（巨大的錘頭吊臂、船台上蓋到一半的船殼、電焊火花）
//   和鋼鐵廠（煙囪）、用柵欄隔開的軍港；西邊海上是船屋區（高腳屋、木板路）；東北岸邊半沉著一艘舊艦（舊艦遺址）；
//   西南是坡地上的洋館（英尼爾斯領事館）；南邊是征遠站。
(function (R) {
  const CK = R.CK, W = R.W, S = () => R.S; if (!CK || !CK.H) return;
  const H = CK.H, az = () => R.azuki, C = 'zhengyuan', COAST = -56;
  CK.define({
    id: C, name: '征遠', seed: 1905, stationName: '征遠站', fog: 1.3, sea: true,
    land: [[-1000, COAST], [1000, COAST], [1000, 980], [-1000, 980]],
    walk: [-150, -104, 150, 150], spawn: [0, 108, 0], camYaw: 0, banner: '海軍造船・武聖號的港', plaza: [0, 108],
    guards: [[54, -40, 0], [-10, 100, Math.PI]], patrols: [[[-140, -40], [50, -40]], [[-140, 12], [140, 12]]],
    gossip: ['「武聖號再次下海那天，整座城放假。」', '「造船廠的火花整夜不停，像夏天的祭典。」', '「船屋區的木板路會晃，喝醉的人常常掉下去。」', '「舊艦遺址旁邊，公會設了監看站。」'],
    firstTip: '第一次來征遠：Tab 看地圖。軍艦博物館的武聖號模型（北邊的港）、舊艦遺址（東北岸邊）、造船廠夜景（東邊）都有觀光章；公會征遠分館在軍港檢查哨旁邊；回東鶴到南邊的征遠站。',
    mapNote: '北邊是港和武聖號，東邊是造船廠和軍港，西邊海上是船屋區，西南的坡上是洋館，南邊是征遠站。',
    ads: ['征遠造船', '英尼爾斯製藥', '海軍訓練所', '昭旭鐵道'], vendLines: ['罐裝的海軍咖哩湯——真的有。', '熱的薑茶。'], carCols: ['#5A6068', '#2A2A30', '#E8E4DC', '#2E4A6A'],
    build(B) {
      const M = CK.M, g = B.g, P = B.part, rr = B.rr, pk = B.pk, rnd = B.rnd;
      B.road(-150, 88, 150, 96, { sw: 4, name: '站前通' });
      B.road(-150, 8, 150, 16, { sw: 3, name: '中通' });
      B.road(-150, -44, 150, -36, { sw: 3, name: '港通' });
      B.road(-8, -36, 8, 88, { sw: 4, name: '造船通', line: 'y' });
      // ---------- 北：港、武聖號（軍艦博物館） ----------
      B.plaza(-100, COAST, 50, -44, 'asph', { noCurb: true });
      const sx = -24, sz = -76, gray = M('paint', { col: '#6A7078' }), gray2 = M('paint', { col: '#7A8088' });
      P(g.box, gray, sx, -0.2, sz, 84, 4.4, 13); P(g.box, M('paint', { col: '#8A2A2A' }), sx, -2.6, sz, 84.2, 1, 13.2);
      P(g.cone, gray, sx - 46, -0.2, sz, 13, 8, 4.4, 0, 0, Math.PI / 2);
      P(g.box, gray2, sx + 4, 4.2, sz, 26, 4.4, 9); P(g.box, gray2, sx + 6, 8.6, sz, 10, 4.4, 7); P(g.box, gray2, sx + 6, 12.4, sz, 5, 3.2, 5); P(g.cyl8, M('steelD'), sx + 6, 17, sz, 0.5, 6, 0.5);
      P(g.cyl, gray2, sx - 4, 7.4, sz, 3, 6, 3); P(g.cyl, gray2, sx + 16, 7.4, sz, 2.6, 5, 2.6);
      [[-26, 1], [-14, 1], [26, -1]].forEach(([dx, dir]) => { P(g.cyl24, M('paint', { col: '#5A6068' }), sx + dx, 2.8, sz, 6.4, 1.8, 6.4); [-1.1, 0, 1.1].forEach(o => P(g.cyl8, M('steelD'), sx + dx - dir * 6, 3.2, sz + o, 0.7, 9, 0.7, 0, 0, Math.PI / 2)); });
      B.sign('武聖號', 'n', sz - 6.6, sx - 30, 1.4, { size: 1.2, bg: '#2A2A2A', fg: '#F4ECD8' });
      B.bridge(sx + 18, sz + 6.5, sx + 22, COAST + 0.5, { deck: 2.2, rise: 0, mat: 'planks', rail: true, railMat: 'steelD' });
      // 博物館（岸上）
      B.bld({ r: [-70, -34, -30, -14], h: 9, style: 'brick', face: 'n', col: '#B8B0A0', top: false });
      B.sign('征遠軍艦博物館', 'n', -34, -50, 7, { size: 0.8, bg: '#2A2A2A', fg: '#F4ECD8', box: 1, lit: 1 });
      H.door(B, -50, -35.6, 'zy_museum', '走進征遠軍艦博物館（武聖號模型）', '#C8C0A0', Math.PI);
      for (let x = -96; x <= 46; x += 18) H.gas(B, x, -45);
      // ---------- 東：軍港（柵欄、檢查哨）、造船廠、鋼鐵廠 ----------
      B.fence(52, -36, 52, 6, 3, 'steelD'); B.fence(52, -36, 52, -56, 3, 'steelD');
      B.box(M('concD'), 46, 0, -34, 50, 3, -30); B.box(M('white'), 45.6, 3, -34.4, 50.4, 3.4, -29.6);
      B.sign('軍港檢查哨', 'w', 46, -32, 2.4, { size: 0.4, bg: '#2A3A2A', fg: '#F4ECD8', box: 1 });
      B.talker(44.6, -32, -Math.PI / 2, '檢查哨的衛兵', ['「這裡往東是軍港。勇者證只能看，不能進。」', '「造船廠的夜景，從港通的西邊看最清楚。」']);
      H.guild(B, [16, -32, 42, -14], 'n', { p: 'zy', name: '公會征遠分館', h: 11, col: '#B8B4A8' });
      B.zone([54, -104, 150, 6], 'gravel', 0.02);
      // 船台＋蓋到一半的船殼
      B.box(M('concD'), 64, 0, -96, 100, 0.6, -10);
      P(g.box, M('paint', { col: '#8A6A5A' }), 82, 5, -50, 14, 10, 60); P(g.cone, M('paint', { col: '#8A6A5A' }), 82, 5, -84, 14, 8, 10, -Math.PI / 2, 0, 0);
      for (let z = -78; z <= -22; z += 8) [-1, 1].forEach(sd => P(g.box, M('steelD'), 82 + sd * 9, 8, z, 0.4, 16, 0.4));
      B.solid(64, -96, 100, -10, 'house');
      // 錘頭吊臂
      P(g.box, M('paint', { col: '#C83A2A' }), 112, 24, -50, 4, 48, 4); P(g.box, M('paint', { col: '#C83A2A' }), 102, 49, -50, 60, 3, 3); P(g.box, M('concD'), 128, 47, -50, 8, 6, 5);
      P(g.box, M('steelD'), 84, 40, -50, 0.2, 18, 0.2); P(g.box, M('steelD'), 84, 31, -50, 3, 1.4, 3); B.solid(110, -52, 114, -48, 'deco');
      B.smoke(82, 10, -46, { s: 1, rise: 3, drift: 1, n: 3, col: '#FFC060', per: 1.2, op: 0.7 }); B.smoke(82, 10, -30, { s: 1, rise: 3, drift: 1, n: 3, col: '#FFC060', per: 1.4, op: 0.7 });
      B.lampAt(82, -46); B.lampAt(82, -30);
      // 鋼鐵廠
      B.bld({ r: [104, -20, 146, 4], h: 14, style: 'factory', face: 'w', top: false }); B.chimney(138, -30, 44); B.chimney(128, -30, 38);
      H.fac(B, 54.5, -44, C, 'yard', '#FFB04A'); H.fac(B, 54.5, -10, C, 'steel', '#9AA0A8'); H.fac(B, 54.5, -20, C, 'harbor', '#7AC8E8');
      B.inter(40, -40, 2.6, '觀光景點：造船廠夜景（觀光章）', () => az().stamp(C, 'zy_yard'), '#E8C04A').sight = 'zy_yard';
      B.area('造船廠・軍港', [52, -104, 150, 6]); B.label('造船廠', 90, -50);
      // 舊艦遺址（東北岸外，半沉）
      P(g.box, M('paint', { col: '#4A5058' }), 76, -2.5, -100, 10, 6, 30, 0.25, 0.9, 0.12); P(g.box, M('paint', { col: '#5A5048' }), 74, 1.2, -96, 5, 4, 8, 0.25, 0.9, 0.2);
      B.plaza(38, -80, 48, COAST, 'gran', { noCurb: true });
      B.inter(43, -78, 2.6, '觀光景點：舊艦遺址（觀光章）', () => az().stamp(C, 'zy_wreck'), '#E8C04A').sight = 'zy_wreck';
      B.inter(43, -68, 2.4, '舊艦遺址（岸邊・公會的監看站）', () => az().fac(C, 'wreck'), '#9AA0A8');
      // ---------- 西：船屋區（海上的高腳屋、木板路） ----------
      B.plaza(-150, COAST, -100, -44, 'planks', { noCurb: true });
      [[-140, -96, -136, COAST + 0.5], [-116, -96, -112, COAST + 0.5], [-140, -98, -112, -94]].forEach(([a, b, c, d]) => B.bridge(a, b, c, d, { deck: 0.6, mat: 'planks', rail: false }));
      [[-146, -86], [-146, -72], [-130, -88], [-130, -70], [-106, -86], [-106, -72], [-124, -104], [-146, -104]].forEach(([x, z]) => { for (const [a, b] of [[-2.4, -2.4], [2.4, -2.4], [-2.4, 2.4], [2.4, 2.4]]) P(g.cyl8, M('woodB'), x + a, -0.6, z + b, 0.35, 3.6, 0.35); B.box(M('woodD'), x - 3, 1.2, z - 3, x + 3, 4.4, z + 3); B.roof(x, z, 6, 6, { type: 'gable', y: 4.4, h: 1.6, o: 0.5, mat: 'corr' }); B.box(M('winLit'), x - 1, 2.2, z + 3, x + 1, 3.4, z + 3.06); });
      H.fac(B, -126, -50, C, 'house', '#C8A060');
      B.talker(-138, -50, 0, '船屋區的老奶奶', ['「我在水上住了六十年。地上的房子反而睡不著。」', '「船屋海鮮鍋，就是從我們這裡傳出去的。」']);
      B.area('船屋區', [-150, -104, -100, -44]); B.label('船屋區', -126, -80);
      // ---------- 西南：坡地的洋館、英尼爾斯領事館 ----------
      B.terrace(-150, 22, -90, 86, 4, { wall: 'ishi', top: 'grass', open: [[-90.4, 46, -89.6, 54]] });
      B.ishigaki(-150, 22, -90, 86, 0, 4, { batter: 0.2, sides: 'nse' });
      B.stairs(-90, 46, -82, 54, 'w', 0.12, 4, { mat: 'gran' });
      B.Bt.yOff = 4;
      [[-144, 28, -120, 44, '#F0ECE0'], [-144, 58, -120, 80, '#E8E0D0']].forEach(([x0, z0, x1, z1, col], i) => { B.box(M('white', { col }), x0, 0, z0, x1, 7, z1); B.roof((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, { type: 'hip', y: 7, h: 3, o: 0.8, mat: 'kawara' }); B.box(M('white'), x1, 2.8, z0 + 2, x1 + 2.4, 3, z1 - 2); for (let z = z0 + 3; z < z1 - 2; z += 4) P(g.cyl8, M('white'), x1 + 2, 1.4, z, 0.3, 2.8, 0.3); if (i) B.flag(x1 + 3, z0 + 2, 7, '#2E6A5A'); });
      B.Bt.yOff = 0;
      B.solid(-144, 28, -120, 44, 'house'); B.solid(-144, 58, -120, 80, 'house');
      for (let i = 0; i < 6; i++) B.tree(rr(-116, -96), rr(26, 84), pk(['round', 'pine']), rr(1, 1.3));
      B.Bt.yOff = 4; H.fac(B, -114, 69, C, 'consul', '#7A98B0'); B.Bt.yOff = 0;
      B.area('坡上的洋館', [-150, 20, -80, 88]); B.label('英尼爾斯領事館', -132, 69);
      // ---------- 中：海軍訓練所、街區 ----------
      B.bld({ r: [16, 20, 46, 44], h: 9, style: 'office', face: 'w', col: '#D8D4CC', top: false });
      B.sign('海軍訓練所', 'w', 16, 32, 6, { size: 0.6, bg: '#1A2A4A', fg: '#F4ECD8', box: 1 });
      H.fac(B, 13, 26, C, 'train', '#7AC8E8'); B.inter(13, 38, 2.4, '海軍訓練所・操艇體驗（12 費拉）', () => az().act(C), '#7AC8E8');
      B.row('e', -8, -32, 4, 14, { style: 'brick', h: 10 }, 10, 14, () => ({ h: rr(8, 12), col: pk(['#B8B0A0', '#A89A8A']) }));
      B.row('e', -8, 20, 86, 14, { style: 'house', h: 9 }, 9, 13, i => (i === 1 ? { name: '船屋海鮮', noren: '#1A3A5A', style: 'machiya', h: 6.4 } : { h: rr(7, 11) }));
      H.door(B, -9.4, 34, 'zy_food', '走進船屋海鮮（海鮮鍋、鋼鐵廠咖哩）', '#E8A03A', -Math.PI / 2);
      B.row('w', 8, 50, 86, 14, { style: 'house', h: 9 }, 9, 13, () => ({ h: rr(7, 11) }));
      B.row('e', -76, -32, 4, 14, { style: 'house', h: 8 }, 9, 13, () => ({ h: rr(6, 9) }));
      B.row('s', 88, 40, 150, 14, { style: 'apt', h: 14 }, 12, 16, () => ({ h: 2.9 * Math.round(rr(3, 6)) }));
      // ---------- 南：征遠站 ----------
      H.station(B, { p: 'zy', name: '征遠站', w: 70, d: 22, h: 11, col: '#8A9098', style: 'office', bg: '#1A2A4A', fg: '#F4ECD8', tt: ['往東鶴：每天兩班（魔導電車，一天）', '往西見：每天兩班', '往板北：每天兩班', '軍港專用線：不載客'] });
      H.street(B, { city: C, lampsX: [[86.6, -140, 140, 18], [6.4, -140, 140, 18]], lampsZ: [[-10.4, -30, 84, 16]], walks: [[-10.5, 86, -10.5, -36], [10.5, -36, 10.5, 86], [-140, 92, 140, 92], [-140, 12, 140, 12], [-96, -40, 48, -40], [-96, -50, 48, -50]], routes: [[[[-4, 92], [-4, -40], [4, -40], [4, 92]], 3], [[[-146, 12], [146, 12], [146, 14], [-146, 14]], 2, { kinds: ['truck'] }]], vends: [[-11, 60, Math.PI / 2], [30, 98.6, Math.PI]], vendFood: [-9.8, 60] });
      B.talker(-4, 114, Math.PI, '來看武聖號的觀光客', ['「武聖號就停在港的正中間。走造船通一直往北。」', '「聽說砲塔裡面也可以進去。」']);
      H.far(B, { coast: COAST, seed: 23, snow: 340 });
    },
    tick() { }
  });
  H.rooms({
    p: 'zy', city: C,
    guild: { name: '公會征遠分館', hint: '軍港檢查哨旁邊，窗外是造船廠的火花', board: ['舊艦遺址：岸邊的監看站報告，艦體裡有光。', '造船廠委託：夜班的船台下面，焊條一直不見。', '船屋區：木板路下面有東西在游。'], lines: ['「舊艦遺址就在東北的岸邊。我們在那裡設了監看站。」', '「武聖號的船艙裡，聽說也長了遺跡。」', '「軍港那邊別亂走，衛兵不會跟你開玩笑。」'] },
    station: { name: '征遠站', dest: '東鶴　西見　板北', lines: ['「往東鶴的票嗎？」', '「軍港專用線不賣票。」'], waiting: ['「回造船廠上夜班。」'] },
    food: { id: 'zy_food', name: '船屋海鮮', hint: '大鍋裡的海鮮在滾', floor: 'tatami', bg: '#1A3A5A', say: '「海鮮鍋要兩個人吃。一個人？那就吃咖哩。」', cook: '船屋海鮮的老闆', lines: ['「這個鍋，是船屋區的老奶奶教我的。」', '「鋼鐵廠食堂的咖哩，份量驚人。我們的也是。」'] }
  });
  // 征遠軍艦博物館：武聖號模型（觀光章）
  CK.defineRoom({ id: 'zy_museum', name: '征遠軍艦博物館', hint: '正中央的玻璃櫃裡，是武聖號的模型', w: 22, d: 14, h: 6, floor: 'marble', wall: 'plaster', wain: 'woodB', trim: 'steelD', amb: 1.0, build(B, K) {
    K.wallSign('征遠軍艦博物館', 'n', 0, 4.6, { size: 0.8, bg: '#2A2A2A', fg: '#F4ECD8' });
    const g = B.g, P = B.part, M = CK.M;
    B.box(M('woodB'), -5, 0, -2, 5, 1, 2); B.box(M('glassL'), -5, 1, -2, 5, 2.6, 2); P(g.box, M('paint', { col: '#6A7078' }), 0, 1.3, 0, 7.6, 0.5, 1.2); P(g.box, M('paint', { col: '#7A8088' }), 0.4, 1.8, 0, 2.4, 0.6, 0.8);
    B.solid(-5, -2, 5, 2, 'deco');
    H.sight(B, 0, 3, C, 'zy_museum', 2.6); B.inter(5, 3, 2.2, '軍艦博物館（看看）', () => az().fac(C, 'museum'), '#C8C0A0');
    B.talker(-7, 3, Math.PI / 2, '博物館的解說員', ['「武聖號，昭旭最大的戰列艦。現在停在外面，你看到了吧。」', '「它再次下海那天，整座城放假。」', '「船艙底下的那一層，現在不開放。」']);
    K.shelf(-9, -5.6, 4, 0, { cols: ['#6A7078', '#8A2A2A', '#C8A040'] }); K.shelf(9, -5.6, 4, 0, { cols: ['#6A7078', '#2E4A6A', '#C8A040'] });
    K.bench(-6, 5, 3, 0); K.bench(6, 5, 3, 0); K.lamp(-4, 0); K.lamp(4, 0);
  } });
})(window.R);
