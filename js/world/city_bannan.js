// 板南（觀光：城、寺、鐵路）的 3D 城（2026-10-20 作者：剩下的城市地圖照《昭旭重要城市》的順序做；2026-10-21 重蓋：豐富度對齊吉山、奉主，修掉房子壓在人行道上的 bug）
// 設定：板北的姊妹觀光城；橫山的建築與碉堡曾是昭光帝國的北方防禦線；有妖物寺。
// 地圖（北是 -z）：
//   北：高台上的板南城（大石垣、天守）；東北：通天道（長石階、兩邊的茶店）上去的仰天寺和鐘樓；西北：橫山上一排碉堡（封鎖線）
//   中：城下町（照 CK.H.grid 自動排：町家、土產、烏龍麵、刀劍店）、妖物寺（西）、日下森電器和森川重工兩棟大樓對望
//   南：板南中樞站、高架鐵路
(function (R) {
  const CK = R.CK, W = R.W, S = () => R.S; if (!CK || !CK.H) return;
  const H = CK.H, az = () => R.azuki, C = 'bannan';
  const CUT = { castle: [-56, -150, 56, -66.5], temple: [74, -150, 150, -66.5], bunker: [-150, -150, -74, -66.5], yokai: [-150, -53.5, -66.5, 5.5], corpW: [-34, 18.5, -8, 46], corpE: [8, 18.5, 34, 46], guild: [-103.5, 58, -66.5, 84], station: [-46, 100, 46, 150] };
  CK.define({
    id: C, name: '板南', seed: 1607, stationName: '板南中樞站', fog: 1.2, snow: 1.0,
    walk: [-150, -150, 150, 150], spawn: [0, 108, 0], camYaw: 0, banner: '觀光・城與寺與鐵路', plaza: [0, 108],
    guards: [[-12, 100, Math.PI], [-8, -62, Math.PI]], patrols: [[[-146, 12], [146, 12]], [[-4, -56], [-4, 88]]],
    gossip: ['「從天守看橫山，碉堡像一排牙齒。」', '「仰天寺的鐘朝北。冬天的鐘聲，北州聽得到。」', '「妖物寺的住持不喜歡被拍照。札也不要念出聲音。」', '「中樞鐵路往皇嶺、東鶴、板北都有車。」'],
    firstTip: '第一次來板南：Tab 看地圖。板南城天守（北邊的高台）、仰天寺大鐘（東北，走通天道的石階上去）、妖物寺山門（西邊）都有觀光章；公會板南分館在站前通北邊；回東鶴到南邊的板南中樞站。',
    mapNote: '北邊高台上是板南城，東北是通天道和仰天寺，西北的橫山上是碉堡，西邊是妖物寺，南邊是板南中樞站。',
    ads: ['日下森電器', '森川重工', '板南城', '中樞鐵路'], vendLines: ['熱的焙茶，罐子上畫著天守。', '城下烏龍麵的高湯罐——真的有人買。'], carCols: ['#2A2A30', '#E8E4DC', '#8A2A2A', '#2E4A6A', '#5A5A62'],
    build(B) {
      const M = CK.M, g = B.g, P = B.part, rr = B.rr, pk = B.pk;
      H.grid(B, {
        city: C, bounds: [-150, -150, 150, 150], cuts: Object.values(CUT),
        hz: [[-60, 3, 3.5, '城前通'], [12, 3, 3.5, '城下通'], [52, 3, 3, '新町通'], [92, 4, 4, '站前通']],
        vx: [[0, 4, 4, '大手通', 'y', -60, 96], [-60, 3, 3.5, '紺屋町', null, -60, 150], [60, 3, 3.5, '呉服町', null, -60, 150], [-110, 3, 3.5, '西通', null, 12, 150], [110, 3, 3.5, '東通', null, -60, 150]],
        pal: [{ style: 'machiya', w: 5, shop: 0.55 }, { style: 'kura', w: 1, h: [6, 7] }, { style: 'house', w: 3, h: [6, 9], shop: 0.35, extra: { roof: 'hip', roofMat: 'kawara' } }, { style: 'office', w: 1, h: [12, 22] }, { style: 'apt', w: 1, h: [9, 15] }],
        shops: ['城下烏龍麵', '和菓子・天守', '土產・板南', '刀劍店', '御守・仰天', '茶舖', '陶器', '酒藏', '蕎麥麵', '馬肉料理', '團子', '甘酒', '書店', '漆器'],
        lines: [['來看城的觀光客', ['「天守在北邊的高台上。大手通一直走就到了。」', '「通天道的石階有三百多階。走完要喝甘酒。」']], ['導遊', ['「板南城是北方防禦線的中心。」', '「碉堡的那一帶是封鎖區，從天守上看就好。」']], ['刀劍店的老闆', ['「這把是複製品。真的在城裡的展示室。」']], ['妖物寺的小和尚', ['「師父說札上的字不能念出來。我也不知道為什麼。」']], ['電器公司的職員', ['「日下森和森川，兩棟樓隔著大道吵了五十年。」']], ['騎腳踏車的學生', ['「放學去通天道的茶店吃團子。」']], ['賣團子的阿婆', ['「醬油團子，三串十費拉。」']], ['鐵路迷', ['「中樞站的高架，每小時都有車過。」']], ['巡邏的衛兵', ['「舊陸軍營地那邊不准靠近。」']]],
        talkers: 9, steals: 4
      });
      // ---------- 北：板南城 ----------
      { const [x0, z0, x1, z1] = CUT.castle;
        B.terrace(x0, z0, x1, z1 - 15, 9, { wall: 'ishi', top: 'gravel', open: [[-5, z1 - 15.4, 5, z1 - 14.6]] });
        B.ishigaki(x0, z0, x1, z1 - 15, 0, 9, { batter: 0.3 });
        B.stairs(-5, z1 - 15, 5, z1 - 1, 'n', 0.12, 9, { mat: 'gran' });
        B.tenshu(0, -122, 9, { w: 24, d: 18, base: 5, floors: 5, s: 1.1 });
        B.tenshu(-34, -108, 9, { w: 10, d: 9, base: 3, floors: 3 });
        B.Bt.yOff = 9; for (let x = -48; x <= 48; x += 12) if (Math.abs(x) > 8) B.lantern(x, z1 - 22);
        H.sight(B, 0, -98, C, 'bn_castle'); H.fac(B, 12, -98, C, 'castle', '#E8C04A');
        B.talker(-12, -98, 0, '城的導覽員', ['「從天守看橫山，碉堡像一排牙齒。」', '「觀光票含導覽。天守裡面的樓梯很陡。」']); B.Bt.yOff = 0;
        [-12, 12].forEach(x => B.lantern(x, z1 - 6));
        B.area('板南城', CUT.castle); B.label('板南城', 0, -128, 1); }
      // ---------- 東北：通天道、仰天寺 ----------
      { const [x0, z0, x1, z1] = CUT.temple, sx = 101;
        B.terrace(x0 + 6, z0, x1, z0 + 52, 16, { wall: 'ishi', top: 'gravel', open: [[sx - 5, z0 + 51.6, sx + 5, z0 + 52.4]] });
        B.ishigaki(x0 + 6, z0, x1, z0 + 52, 0, 16, { batter: 0.25 });
        B.stairs(sx - 5, z0 + 52, sx + 5, z1 - 1, 'n', 0.12, 16, { mat: 'gran' });
        for (let z = z0 + 56; z <= z1 - 4; z += 6) [sx - 6.6, sx + 6.6].forEach(x => B.lantern(x, z, 0.8));
        [[x0 + 2, sx - 8], [sx + 8, x1 - 2]].forEach(([a0, a1], i) => { for (let z = z0 + 56; z + 6 <= z1 - 2; z += 7) { B.bld({ r: [i ? a0 : a1 - 7, z, i ? a0 + 7 : a1, z + 6], h: 6.4, style: 'machiya', face: i ? 'w' : 'e', name: pk(['茶店・通天', '甘酒', '團子', '御守']), noren: pk(['#4A5A3A', '#5A2A2A']) }); } });
        H.door(B, sx - 7.4, z0 + 66, 'bn_tea', '走進通天道的茶店（茶菓子、烏龍麵）', '#E8A03A', Math.PI / 2);
        B.inter(sx, z1 - 3, 2.6, '通天道參拜（5 費拉）', () => az().act(C), '#E8C04A'); H.fac(B, sx, z1 - 8, C, 'road', '#C8A060');
        B.Bt.yOff = 16;
        B.roof(126, z0 + 22, 20, 14, { type: 'irimoya', y: 6, h: 3.6, o: 1.6, sori: 0.4, mat: 'kawara' }); B.box(M('woodB'), 117, 0, z0 + 16, 135, 6, z0 + 28); B.box(M('shopLit'), 117.5, 0.6, z0 + 28.05, 134.5, 5, z0 + 28.1);
        P(g.box, M('woodB'), 92, 3, z0 + 22, 6, 6, 6); B.roof(92, z0 + 22, 7, 7, { type: 'pyramid', y: 6, h: 2.6, o: 0.9, sori: 0.3, mat: 'kawara' }); P(g.cyl, M('bronze'), 92, 3.6, z0 + 22, 2.2, 2.8, 2.2); P(g.hemi, M('bronze'), 92, 5, z0 + 22, 2.2, 0.8, 2.2);
        H.sight(B, 98, z0 + 30, C, 'bn_temple'); H.fac(B, 126, z0 + 32, C, 'temple', '#E8C04A');
        B.Bt.yOff = 0;
        B.solid(117, z0 + 16, 135, z0 + 28, 'house'); B.solid(89, z0 + 19, 95, z0 + 25, 'house');
        for (let i = 0; i < 10; i++) B.tree(rr(138, 148), rr(z0 + 2, z0 + 48), 'cedar', rr(1.1, 1.5));
        B.area('通天道・仰天寺', CUT.temple); B.label('仰天寺', 112, z0 + 8); B.label('通天道', sx, z0 + 70); }
      // ---------- 西北：橫山的碉堡 ----------
      { const [x0, z0, x1, z1] = CUT.bunker;
        B.terrace(x0, z0, x1, z1 - 14, 6, { wall: 'concD', top: 'grass', open: [] });
        B.Bt.yOff = 6; for (let i = 0; i < 4; i++) { const x = x0 + 12 + i * 18; P(g.box, M('concD'), x, 1.4, z1 - 28, 10, 2.8, 7); P(g.box, M('black'), x, 1.8, z1 - 24.4, 6, 0.6, 0.2); P(g.box, M('concD'), x, 2.9, z1 - 28, 11, 0.3, 8); } B.Bt.yOff = 0;
        B.fence(x0 + 2, z1 - 8, x1 - 2, z1 - 8, 2.4, 'steelD');
        B.sign('封鎖區・舊陸軍營地', 's', z1 - 7.9, (x0 + x1) / 2, 1.6, { size: 0.45, bg: '#5A1A1A', fg: '#F4ECD8', box: 1 });
        H.fac(B, (x0 + x1) / 2 + 12, z1 - 4, C, 'camp', '#9AA0A8');
        B.talker((x0 + x1) / 2 - 12, z1 - 5, Math.PI, '封鎖線的衛兵', ['「碉堡可以看，鐵絲網不能過。」', '「舊陸軍營地裡長出了迷宮。妖物寺的札貼到碉堡上都沒用。」']);
        B.area('橫山・碉堡', CUT.bunker); B.label('碉堡', (x0 + x1) / 2, z0 + 20); }
      // ---------- 西：妖物寺 ----------
      { const [x0, z0, x1, z1] = CUT.yokai, cz = (z0 + z1) / 2;
        B.zone(CUT.yokai, 'gravel', 0.02);
        B.box(M('woodB'), x0 + 10, 0, cz - 12, x0 + 40, 7, cz + 12); B.roof(x0 + 25, cz, 32, 26, { type: 'irimoya', y: 7, h: 4.4, o: 1.6, sori: 0.4, mat: 'kawara' });
        B.box(M('black'), x0 + 40.05, 0.6, cz - 8, x0 + 40.1, 6, cz + 8); B.solid(x0 + 10, cz - 12, x0 + 40, cz + 12, 'house'); B.foot([x0 + 10, cz - 12, x0 + 40, cz + 12], 'house', 7);
        for (let z = cz - 10; z < cz + 10; z += 1.2) P(g.box, M('white'), x0 + 40.2, 4.6 + (Math.abs(z * 7) % 3) * 0.3, z, 0.02, 0.9, 0.36);
        P(g.box, M('paint', { col: '#D8C8A0' }), x0 + 40.3, 6.4, cz, 0.4, 0.5, 18);
        B.box(M('woodB'), x1 - 8, 0, cz - 9, x1 - 4, 6, cz - 7); B.box(M('woodB'), x1 - 8, 0, cz + 7, x1 - 4, 6, cz + 9); B.roof(x1 - 6, cz, 4, 20, { type: 'gable', y: 6, h: 1.6, o: 0.6, mat: 'kawara', ry: Math.PI / 2 }); B.solid(x1 - 8, cz - 9, x1 - 4, cz - 7, 'deco'); B.solid(x1 - 8, cz + 7, x1 - 4, cz + 9, 'deco');
        for (let z = z0 + 6; z <= z1 - 6; z += 8) { P(g.sph, CK.mat('chochinRed', { col: '#E8503A', em: '#FF6A3A', ei: 0, lamp: true, snow: 0 }), x1 - 14, 3.2, z, 0.6, 0.8, 0.6); P(g.box, M('woodB'), x1 - 14, 1.6, z, 0.15, 3.2, 0.15); B.solid(x1 - 14.1, z - 0.1, x1 - 13.9, z + 0.1, 'deco'); B.lampAt(x1 - 14, z); }
        H.sight(B, x1 - 2, cz, C, 'bn_yokai'); H.fac(B, x1 - 2, cz - 12, C, 'yokai', '#C83A2A');
        B.talker(x0 + 44, cz + 4, Math.PI / 2, '妖物寺的住持', ['「……拍照的話，請出去。」', '「札上的字，不要念出聲音。」', '「舊陸軍營地那邊的東西，跟我們這裡封著的是同一種。」']);
        B.area('妖物寺', CUT.yokai); B.label('妖物寺', x0 + 25, cz); }
      // ---------- 中：日下森電器、森川重工 ----------
      { const [x0, z0, x1, z1] = CUT.corpW; B.bld({ r: [x0 + 1, z0 + 1, x1 - 1, z1 - 1], h: 48, style: 'office', face: 'e', col: '#C8D0D8', top: false }); B.sign('日下森電器', 'e', x1 - 1, (z0 + z1) / 2, 40, { size: 1.6, bg: '#1A2A6A', fg: '#FFFFFF', box: 1, lit: 1 }); H.fac(B, x1 + 0.8, (z0 + z1) / 2, C, 'corp', '#7A98B0'); }
      { const [x0, z0, x1, z1] = CUT.corpE; B.bld({ r: [x0 + 1, z0 + 1, x1 - 1, z1 - 1], h: 48, style: 'office', face: 'w', col: '#B8B0A8', top: false }); B.sign('森川重工', 'w', x0 + 1, (z0 + z1) / 2, 40, { size: 1.6, bg: '#5A1A1A', fg: '#FFFFFF', box: 1, lit: 1 }); }
      // ---------- 公會板南分館 ----------
      { const [x0, z0, x1, z1] = CUT.guild; H.guild(B, [x0 + 2, z0 + 1, x1 - 2, z1 - 1], 's', { p: 'bn', name: '公會板南分館', h: 10, col: '#D0C8B8', roof: 'kawara' }); }
      // ---------- 南：板南中樞站、高架 ----------
      H.station(B, { p: 'bn', name: '板南中樞站', w: 84, d: 24, h: 14, col: '#C8C0B4', style: 'glass', bg: '#2A2420', fg: '#F4E8C8', tt: ['往皇嶺：每小時一班', '往東鶴：每天四班（魔導電車，一天）', '往板北：每小時一班', '板南機場：接駁巴士'] });
      B.viaduct([[-700, 156], [700, 156]], 9, { skip: x => Math.abs(x) < 50 });
      B.rail([[-700, 156], [700, 156]], { y: 9, col: '#E8E4DC', stripe: '#C83A2A', cars: 6, v: 16 });
      B.busStop(-30, 101, Math.PI, '往板南機場'); H.fac(B, -30, 104, C, 'air', '#7AC8E8'); H.fac(B, 30, 104, C, 'rail', '#5A8AC8');
      H.far(B, { seed: 37, snow: 300, mh: 360 });
    },
    tick() { }
  });
  H.rooms({
    p: 'bn', city: C,
    guild: { name: '公會板南分館', hint: '牆上掛著碉堡的舊地圖', board: ['舊陸軍營地：封鎖區長出的迷宮，碉堡、壕溝和妖物寺的封印混在一起。', '妖物寺的委託：住持說封著的東西最近很吵。', '通天道：石階上的燈籠晚上自己滅。'], lines: ['「舊陸軍營地的遺跡，裡面的碉堡和壕溝跟以前的地圖對不上。」', '「妖物寺的札，連遺跡生物都怕。」', '「觀光客比勇者多。委託大多是護送。」'] },
    station: { name: '板南中樞站', dest: '皇嶺　東鶴　板北', lines: ['「往東鶴的票嗎？」', '「往皇嶺、板北每小時一班。」'], waiting: ['「去皇嶺開會。日下森電器的。」'] },
    food: { id: 'bn_tea', name: '通天道的茶店', hint: '石階旁的長椅，甘酒和茶菓子', floor: 'tatami', bg: '#4A5A3A', say: '「走完通天道，先坐一下。」', cook: '茶店的阿婆', lines: ['「三百二十四階。我年輕的時候一天走兩趟。」', '「城下烏龍麵，車站前那間也好吃。」'] }
  });
})(window.R);
