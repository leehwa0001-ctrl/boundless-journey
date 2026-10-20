// 府廳（軍事城市）的 3D 城（2026-10-20 作者：剩下的城市地圖照《昭旭重要城市》的順序做；同一天重蓋：豐富度對齊吉山、奉主，修掉房子壓在人行道上的 bug）
// 設定：昭旭軍事重鎮、訓練皇武軍；多數區域不開放一般民眾，公會只有限定駐紮的「特劃區」。
// 地圖（北是 -z）：
//   北：軍部（鐵柵欄、衛兵、旗桿），定禪大道（中間一排欅樹）從軍部一路到府廳站
//   西北：軍營和操場（只能走黃線）；東北：戰爭公園（舊火砲、紀念碑）
//   西：台地上的軍神社；東：軍眷宿舍（晾著制服）；西南：公會特劃區（鐵絲網）；東南：特劃區食堂
//   其他街區：照 CK.H.grid 自動排房子（官舍、軍用品店、理髮、食堂、公寓）
(function (R) {
  const CK = R.CK, S = () => R.S; if (!CK || !CK.H) return;
  const H = CK.H, az = () => R.azuki, C = 'futing';
  const CUT = { hq: [-48, -130, 48, -104], camp: [-150, -92, -16, -28], park: [16, -92, 150, -28], shrine: [-150, -12, -107.5, 29.5], homes: [107.5, -12, 150, 29.5], guild: [-100.5, 42.5, -55.5, 84], mess: [16, 42.5, 48.5, 66], station: [-46, 100, 46, 150] };
  CK.define({
    id: C, name: '府廳', seed: 1951, stationName: '府廳站', fog: 1.2, snow: 1.2,
    walk: [-150, -130, 150, 150], spawn: [0, 108, 0], camYaw: 0, banner: '軍事城市・欅樹大道', plaza: [0, 108],
    guards: [[-8, -94, Math.PI], [8, -94, Math.PI], [-20, 100, Math.PI], [-52, 30, 0]],
    patrols: [[[-14, -90], [-14, 86]], [[-146, -20], [146, -20]]],
    gossip: ['「操場那邊又在喊號了。新兵的聲音一年比一年小。」', '「特劃區的鐵絲網，是遺跡出現以後才拉的。」', '「戰爭公園的砲，小孩會爬上去。衛兵假裝沒看到。」', '「皇武軍的人在食堂吃飯很快，五分鐘。」'],
    firstTip: '第一次來府廳：Tab 看地圖。很多地方不開放，只能走大道和黃線。戰爭公園紀念碑（東北）、軍神社（西邊台地）有觀光章；公會特劃區在西南的鐵絲網裡；回東鶴到南邊的府廳站。',
    mapNote: '北邊是軍部，西北是軍營，東北是戰爭公園，西邊是軍神社，南邊是府廳站。',
    ads: ['皇武軍', '昭旭鐵道', '軍糧便當'], vendLines: ['罐裝黑咖啡，軍部販賣部同款。', '熱的麥茶。'], carCols: ['#3A4A3A', '#2A2A30', '#5A5A62', '#E8E4DC'],
    build(B) {
      const M = CK.M, g = B.g, P = B.part, rr = B.rr, pk = B.pk;
      H.grid(B, {
        city: C, bounds: [-150, -130, 150, 150], cuts: Object.values(CUT),
        hz: [[-98, 3, 3, '軍部前通'], [-20, 4, 4, '中通'], [36, 3, 3.5, '營前通'], [92, 4, 4, '站前通']],
        vx: [[0, 12, 4, '定禪大道', 'y', -98, 96], [-104, 3, 3.5, '西通', null, -20, 150], [-52, 3, 3.5, '營區通', null, -20, 150], [52, 3, 3.5, '官舍通', null, -20, 150], [104, 3, 3.5, '東通', null, -20, 150]],
        pal: [{ style: 'office', w: 3, h: [10, 18], cols: ['#A8A8A0', '#9A9A92', '#B8B4AC'] }, { style: 'apt', w: 3, h: [9, 15], cols: ['#D8D0C0', '#C8C0B0'] }, { style: 'house', w: 4, h: [6, 9], shop: 0.45, cols: ['#C8C0B0', '#B8B0A0', '#D0C8B8'] }, { style: 'brick', w: 1, h: [8, 11], shop: 0.5 }],
        shops: ['軍用品・陸', '理髮・角刈', '食堂・皇武', '靴店', '洗衣・制服', '書店・兵學', '雜貨', '定食・營門', '鐘錶', '藥局'],
        lines: [['休假的新兵', ['「三天的假。先回家吃一頓。」', '「軍營的伙食……不說了。」']], ['軍用品店的老闆', ['「靴子要大半號。行軍的時候腳會腫。」']], ['等公車的軍眷', ['「我先生在軍部上班，一個月回家兩次。」']], ['巡邏的憲兵', ['「勇者證。……好，走吧。」', '「黃線外面不准拍照。」']], ['退伍的老兵', ['「第二次大陸會戰的時候，我就在這條大道上行軍。」', '「欅樹是戰後種的。一棵一個名字。」']], ['理髮店的師傅', ['「這裡的客人，十個有九個要剪角刈。」']], ['送報的少年', ['「軍部的報紙比東鶴的晚一天。」']], ['學生', ['「我爸要我考皇武軍。我想去大學。」']]],
        talkers: 8, steals: 3
      });
      // 大道中間的欅樹
      // 分隔島在路口斷開（2026-10-21 作者：車子直接開過分隔島）：中通、營前通的車要過得去，北端留給車迴轉
      [[-90, -28], [-12, 29], [43, 84]].forEach(([z0, z1]) => { B.box(M('kerb'), -1.8, 0, z0, 1.8, 0.2, z1); B.solid(-1.8, z0, 1.8, z1, 'deco'); for (let z = z0 + 3; z <= z1 - 3; z += 9) B.tree(0, z, 'bare', rr(1.2, 1.5)); });
      // ---------- 北：軍部 ----------
      B.bld({ r: [-46, -128, 46, -108], h: 18, style: 'office', face: 's', col: '#9A9A92', top: false });
      B.box(M('concD'), -12, 0, -108, 12, 8, -105); B.box(M('glassL'), -10, 0.4, -105.05, 10, 7, -105);
      B.sign('昭旭軍部', 's', -105, 0, 9.4, { size: 1.4, bg: '#2A2A2A', fg: '#F4ECD8', box: 1 });
      [-30, -22, 22, 30].forEach(x => B.flag(x, -104.6, 14, x < 0 ? '#C8202A' : '#2E4A6A'));
      [[-48, -104.4, -13.5, -104.4], [13.5, -104.4, 48, -104.4]].forEach(([a, b, c, d]) => B.fence(a, b, c, d, 2.6, 'black'));
      B.box(M('concD'), -13.5, 0, -105, -12, 3, -103.6); B.box(M('concD'), 12, 0, -105, 13.5, 3, -103.6);
      H.fac(B, 0, -102.5, C, 'hq', '#C8C0A0', 2.6);
      B.area('軍部', CUT.hq); B.label('軍部', 0, -118);
      // ---------- 西北：軍營、操場（只能走黃線） ----------
      const [cx0, cz0, cx1, cz1] = CUT.camp;
      B.zone(CUT.camp, 'asph', 0.03);
      for (let x = cx0 + 4; x <= cx1 - 6; x += 6) B.box(M('lineY'), x, 0.03, cz1 - 2.2, x + 3.2, 0.06, cz1 - 1.8);
      [[cx0 + 2, cz0 + 2, cx1 - 2, cz0 + 2], [cx0 + 2, cz0 + 2, cx0 + 2, cz1 - 4], [cx1 - 2, cz0 + 2, cx1 - 2, cz1 - 4], [cx0 + 2, cz1 - 4, cx1 - 30, cz1 - 4], [cx1 - 22, cz1 - 4, cx1 - 2, cz1 - 4]].forEach(([a, b, c, d]) => B.fence(a, b, c, d, 2.2, 'steelD'));
      for (let i = 0; i < 3; i++) { const z0 = cz0 + 4 + i * 10; B.box(M('concD'), cx0 + 6, 0, z0, cx0 + 70, 4.2, z0 + 7); B.box(M('corr', { col: '#6A7A6A' }), cx0 + 5.7, 4.2, z0 - 0.3, cx0 + 70.3, 4.5, z0 + 7.3); B.solid(cx0 + 6, z0, cx0 + 70, z0 + 7, 'house'); B.foot([cx0 + 6, z0, cx0 + 70, z0 + 7], 'house', 4.5); B.box(M('winLit'), cx0 + 10, 1.4, z0 + 7, cx0 + 66, 2.6, z0 + 7.05); }
      B.box(M('concD'), cx1 - 40, 0, cz0 + 4, cx1 - 6, 7, cz0 + 20); B.solid(cx1 - 40, cz0 + 4, cx1 - 6, cz0 + 20, 'house'); B.foot([cx1 - 40, cz0 + 4, cx1 - 6, cz0 + 20], 'house', 7); B.sign('皇武軍 府廳營', 's', cz0 + 20, cx1 - 23, 5, { size: 0.7, bg: '#2A3A2A', fg: '#F4ECD8', box: 1 });
      B.walk([[cx0 + 10, cz1 - 14], [cx1 - 30, cz1 - 14], [cx1 - 30, cz0 + 40], [cx0 + 10, cz0 + 40], [cx0 + 10, cz1 - 14]], 10);
      [[cx0 + 30, cz1 - 20], [cx0 + 60, cz1 - 26], [cx0 + 90, cz1 - 20]].forEach(([x, z]) => { P(g.box, M('concD'), x, 0.8, z, 4, 1.6, 0.6); B.solid(x - 2, z - 0.3, x + 2, z + 0.3, 'deco'); });
      H.fac(B, cx1 - 26, cz1 - 2, C, 'camp', '#C8C0A0');
      B.talker(cx1 - 18, cz1 - 2.5, 0, '帶隊的教官', ['「勇者？黃線外面一步都不准踩。」', '「新兵！再跑三圈！」', '「皇武軍的訓練，遺跡的人也來借場地。」']);
      B.area('軍營・操場', CUT.camp); B.label('操場', -80, -50);
      // ---------- 東北：戰爭公園 ----------
      const [px0, pz0, px1, pz1] = CUT.park, pcx = (px0 + px1) / 2, pcz = (pz0 + pz1) / 2;
      B.zone(CUT.park, 'grass', 0.02); B.plaza(pcx - 16, pcz - 8, pcx + 16, pcz + 8, 'gran');
      P(g.box, M('ashlar'), pcx, 1, pcz, 4, 2, 4); P(g.box, M('ashlar'), pcx, 7, pcz, 1.8, 12, 1.8); P(g.cone, M('ashlar'), pcx, 13.6, pcz, 2, 1.4, 2); B.solid(pcx - 2.2, pcz - 2.2, pcx + 2.2, pcz + 2.2, 'deco');
      B.sign('記得回來的人，也記得沒回來的人', 's', pcz + 2.1, pcx, 1.2, { size: 0.32, bg: '#3A3A36', fg: '#F4ECD8' });
      const cannon = (x, z, ry) => { P(g.cyl, M('steelD'), x, 1.1, z, 0.5, 5, 0.5, Math.PI / 2 - 0.2, ry, 0); [-0.9, 0.9].forEach(o => P(g.cyl8, M('woodB'), x + Math.cos(ry) * o, 0.7, z - Math.sin(ry) * o, 1.4, 0.2, 1.4, 0, ry, Math.PI / 2)); B.solid(x - 1.4, z - 1.4, x + 1.4, z + 1.4, 'deco'); };
      cannon(px0 + 14, pz0 + 12, 0.4); cannon(px1 - 14, pz0 + 12, -0.4); cannon(px0 + 16, pz1 - 12, 2.6); cannon(px1 - 16, pz1 - 12, -2.4);
      for (let i = 0; i < 18; i++) { const x = rr(px0 + 4, px1 - 4), z = rr(pz0 + 4, pz1 - 4); if (Math.abs(x - pcx) < 20 && Math.abs(z - pcz) < 14) continue; if (Math.abs(z - pcz - 12) < 2 || Math.abs(x - pcx - 24) < 2) continue; B.tree(x, z, pk(['bare', 'pine', 'bare']), rr(1, 1.4)); }
      [[pcx - 10, pcz + 10], [pcx + 10, pcz + 10], [pcx - 10, pcz - 10], [pcx + 10, pcz - 10]].forEach(([x, z]) => B.bench(x, z, 0));
      B.walk([[px0 + 4, pcz + 12], [px1 - 4, pcz + 12]], 4); B.walk([[pcx + 24, pz0 + 4], [pcx + 24, pz1 - 4]], 3);
      H.sight(B, pcx, pcz + 5, C, 'ft_park'); B.inter(pcx - 9, pcz + 5, 2.4, '戰爭公園・體能課（10 費拉）', () => az().act(C), '#C8A040'); H.fac(B, pcx + 9, pcz + 5, C, 'park', '#8AA07A');
      B.talker(pcx - 14, pcz - 4, Math.PI / 2, '公園的解說員', ['「這些砲，是第二次大陸會戰的時候守北邊的。」', '「紀念碑上沒有名字。太多了，刻不完。」']);
      B.area('戰爭公園', CUT.park); B.label('戰爭公園', pcx, pz0 + 6);
      // ---------- 西：台地上的軍神社 ----------
      const [sx0, sz0, sx1, sz1] = CUT.shrine, scz = (sz0 + sz1) / 2;
      B.terrace(sx0 + 2, sz0 + 1, sx1 - 8, sz1 - 1, 5, { wall: 'ishi', top: 'gravel', open: [[sx1 - 8.4, scz - 4, sx1 - 7.6, scz + 4]] });
      B.ishigaki(sx0 + 2, sz0 + 1, sx1 - 8, sz1 - 1, 0, 5, { batter: 0.2, sides: 'nse' });
      B.stairs(sx1 - 8, scz - 4, sx1 - 0.5, scz + 4, 'w', 0.12, 5, { mat: 'gran' });
      B.Bt.yOff = 5;
      B.roof(sx0 + 18, scz, 16, 10, { type: 'irimoya', y: 4.6, h: 2.8, o: 1.2, sori: 0.3, mat: 'copper' });
      B.box(M('woodB'), sx0 + 11, 0, scz - 4.4, sx0 + 25, 4.6, scz + 4.4); B.box(M('shopLit'), sx0 + 24.95, 0.6, scz - 3, sx0 + 25, 4, scz + 3);
      for (let i = 0; i < 6; i++) P(g.hemi, M('paint', { col: '#4A5A3A' }), sx0 + 27.5, 0.9, scz - 3.5 + i * 1.4, 0.5, 0.4, 0.5);
      P(g.box, M('woodB'), sx0 + 27.5, 0.4, scz, 0.8, 0.8, 8.6);
      H.sight(B, sx0 + 31, scz, C, 'ft_shrine'); H.fac(B, sx0 + 31, scz + 7, C, 'shrine', '#E8C04A');
      B.Bt.yOff = 0;
      B.torii(sx1 - 4, scz, Math.PI / 2, 5, 4.4, 'black');
      B.solid(sx0 + 10.6, scz - 4.8, sx0 + 25.4, scz + 4.8, 'house');
      for (let i = 0; i < 8; i++) B.tree(rr(sx0 + 4, sx0 + 9), rr(sz0 + 3, sz1 - 3), 'cedar', rr(1.1, 1.4));
      B.area('軍神社', CUT.shrine); B.label('軍神社', sx0 + 20, sz0 + 4);
      // ---------- 東：軍眷宿舍（晾衣繩） ----------
      const [hx0, hz0, hx1] = CUT.homes;
      for (let i = 0; i < 2; i++) { const z0 = hz0 + 2 + i * 21; B.bld({ r: [hx0 + 2, z0, hx1 - 2, z0 + 11], h: 11.6, style: 'apt', face: 's', col: '#D8D0C0', top: false }); for (let x = hx0 + 6; x < hx1 - 6; x += 8) { P(g.box, M('black'), x + 3, 2.6, z0 + 14, 6, 0.03, 0.03); [-2, 0, 2].forEach(o => P(g.box, M('paint', { col: pk(['#4A5A3A', '#E8E4DC', '#4A5A3A']) }), x + 3 + o, 2.1, z0 + 14, 1.2, 0.9, 0.04)); } }
      H.fac(B, hx0 + 1, hz0 + 18, C, 'house', '#C8A060');
      B.talker(hx0 + 1.2, hz0 + 26, -Math.PI / 2, '軍眷的太太', ['「我先生在軍部上班，一個月回家兩次。」', '「晾衣繩上全是制服。分不出是誰的。」']);
      B.area('軍眷宿舍', CUT.homes);
      // ---------- 西南：公會特劃區（鐵絲網裡的臨時館舍） ----------
      const [gx0, gz0, gx1, gz1] = CUT.guild, gcz = (gz0 + gz1) / 2;
      [[gx0 + 1, gz0 + 1, gx1 - 1, gz0 + 1], [gx0 + 1, gz1 - 1, gx1 - 1, gz1 - 1], [gx0 + 1, gz0 + 1, gx0 + 1, gz1 - 1], [gx1 - 1, gz0 + 1, gx1 - 1, gcz - 4], [gx1 - 1, gcz + 4, gx1 - 1, gz1 - 1]].forEach(([a, b, c, d]) => B.fence(a, b, c, d, 2.4, 'steelD'));
      H.guild(B, [gx0 + 5, gz0 + 6, gx1 - 14, gz1 - 6], 'e', { p: 'ft', name: '公會府廳特劃區', h: 5, style: 'factory', col: '#B8BCB4' });
      B.box(M('concD'), gx1 - 5, 0, gcz - 6, gx1 - 3, 3, gcz - 4.4); B.box(M('concD'), gx1 - 5, 0, gcz + 4.4, gx1 - 3, 3, gcz + 6); B.solid(gx1 - 5, gcz - 6, gx1 - 3, gcz - 4.4, 'deco'); B.solid(gx1 - 5, gcz + 4.4, gx1 - 3, gcz + 6, 'deco');
      B.talker(gx1 - 0.2, gcz + 5, Math.PI / 2, '特劃區的衛兵', ['「通行證。……勇者證？好，進去吧。」', '「特劃區裡面不准拍照。」']);
      B.area('公會特劃區', CUT.guild);
      // ---------- 東南：特劃區食堂 ----------
      const [mx0, mz0, mx1, mz1] = CUT.mess;
      B.bld({ r: [mx0 + 3, mz0 + 2, mx1 - 1, mz1 - 1], h: 6, style: 'factory', face: 'w', col: '#C0B8A8', top: false });
      B.sign('特劃區食堂', 'w', mx0 + 3, (mz0 + mz1) / 2, 4.4, { size: 0.6, bg: '#2A3A2A', fg: '#F4ECD8', box: 1, lit: 1 });
      H.door(B, mx0 + 1.4, (mz0 + mz1) / 2, 'ft_mess', '走進特劃區食堂（軍糧便當、黑咖啡）', '#E8A03A', -Math.PI / 2);
      // ---------- 南：府廳站 ----------
      H.station(B, { p: 'ft', name: '府廳站', w: 80, d: 20, h: 10, col: '#8A8A84', style: 'office', bg: '#2A2A2A', fg: '#F4ECD8', tt: ['往東鶴：每天兩班（魔導電車，一天）', '往皇嶺：每天四班', '往吉山：每天兩班', '軍用列車：不對一般乘客開放'] });
      B.talker(-4, 114, Math.PI, '剛下車的新兵', ['「我、我是來報到的。軍營是那邊嗎？」', '「媽媽說府廳的冬天很冷。她說對了。」']);
      B.busStop(30, 102, Math.PI, '往軍營');
      H.far(B, { seed: 13, snow: 220 });
    },
    tick() { }
  });
  H.rooms({
    p: 'ft', city: C,
    guild: { name: '公會府廳特劃區', hint: '鐵絲網裡的臨時館舍，衛兵比館員多', board: ['舊兵營遺跡外圍：特劃區只開放討伐段以上。今天的巡邏缺一個人。', '軍部委託：營區的倉庫晚上有東西在翻箱子。', '戰爭公園：舊火砲裡面好像住了什麼。'], lines: ['「特劃區只開放給登記過的勇者。軍方看得很嚴。」', '「舊兵營那邊的遺跡，越來越往營區裡面長。」', '「我們跟軍方借地方。椅子都是軍用的。」'] },
    station: { name: '府廳站', dest: '東鶴　皇嶺　吉山', lines: ['「往東鶴的票嗎？」', '「軍用列車不賣票。」'], waiting: ['「休假三天。先回家吃一頓。」'] },
    food: { id: 'ft_mess', name: '特劃區食堂', hint: '鐵盤子、長桌，吃飯很快', say: '「今天的便當，跟皇武軍吃的一樣。」', cook: '食堂的大嬸', lines: ['「軍糧便當，份量是照新兵算的。」', '「黑咖啡苦到說話變少。軍部的人都喝這個。」'] }
  });
})(window.R);
