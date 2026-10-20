// 渦旗（漁港）的 3D 城（2026-10-20 作者：剩下的城市地圖照《昭旭重要城市》的順序一次做完）
// 設定：連接納瓦（＝沖繩那樣的南方島嶼）與天宮的漁港；秋天銀旗魚順著渦流海灣下大洋繁衍，漁民出海的時機，也是城名由來。
// 樣子：北邊是漁港（棧橋、插著銀色旗子的漁船）和海魚市集的大棚；海灣裡一圈銀色的魚群在繞（渦流），東邊堤防上是渦流展望台；
//   一條川從南往北流進海，川邊一整排屋台（晚上紅燈籠）；漁業會館、公會分館（魚市樓上）；東邊是蓋到一半的物流倉庫；
//   南方的味道：紅瓦屋頂、石垣、榕樹（圓的樹）。雪很少。
(function (R) {
  const CK = R.CK, W = R.W, S = () => R.S; if (!CK || !CK.H) return;
  const H = CK.H, az = () => R.azuki, C = 'woqi', COAST = -62, RV = [38, 50];
  CK.define({
    id: C, name: '渦旗', seed: 1601, stationName: '渦旗港站', fog: 1.0, sea: true, snow: 0.25,
    land: [[-1000, COAST], [1000, COAST], [1000, 980], [-1000, 980]],
    walk: [-150, -100, 150, 150], spawn: [0, 108, 0], camYaw: 0, banner: '漁港・渦流與銀旗魚', plaza: [0, 108],
    guards: [[-10, 100, Math.PI]], patrols: [[[-140, -48], [140, -48]], [[-140, 12], [140, 12]]],
    gossip: ['「秋天的海灣，魚群會畫圓。銀色的，像旗子在轉。」', '「屋台晚上才開。拉麵、關東煮、烤雞串，一攤一攤。」', '「從納瓦來的船，帶著南邊的水果。」', '「法蘭克漁業的人又來談收購了。漁協不肯。」'],
    firstTip: '第一次來渦旗：Tab 看地圖。渦流展望台（東邊的堤防）、海魚市集開市（北邊的大棚）、壽司・渦潮的櫃台（川邊）都有觀光章；公會渦旗分館在魚市樓上；晚上川邊有屋台；回東鶴到南邊的渦旗港站。',
    mapNote: '北邊是漁港和海魚市集，海灣裡有渦流。中間的川邊是屋台街，東邊是物流倉庫，南邊是渦旗港站。',
    ads: ['銀旗魚', '屋台', '法蘭克漁業', '華爾納外貿'], vendLines: ['罐裝的南國果汁，從納瓦來的。', '熱的魚湯罐頭——真的有。'], carCols: ['#E8E4DC', '#2E7A6A', '#C83A2A', '#2A2A30'],
    build(B) {
      const M = CK.M, g = B.g, P = B.part, rr = B.rr, pk = B.pk, rnd = B.rnd;
      const redRoof = (x0, z0, x1, z1, h) => B.roof((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, { type: 'hip', y: h, h: Math.min(x1 - x0, z1 - z0) * 0.25, o: 0.5, mat: 'kawaraRed' });
      // ---------- 川 ----------
      B.water([[RV[0], COAST - 20], [RV[1], COAST - 20], [RV[1], 170], [RV[0], 170]], { level: -1.6, bank: 'ishi', name: '渦旗川' });
      B.road(-150, 88, 150, 96, { sw: 4, name: '站前通' });
      B.road(-150, 8, 150, 16, { sw: 3, name: '中通' });
      B.road(-150, -52, 150, -44, { sw: 3, name: '港通' });
      B.road(-8, -44, 8, 88, { sw: 4, name: '旗通' });
      [[88, 96], [8, 16], [-52, -44]].forEach(([z0, z1]) => B.bridge(RV[0] - 0.5, z0, RV[1] + 0.5, z1, { rise: 0.6, deck: 0.14, mat: 'gran', railMat: 'verm', rail: true }));
      // ---------- 北：漁港、海魚市集 ----------
      B.plaza(-150, COAST, 150, -52, 'asph', { noCurb: true });
      B.box(M('corr', { col: '#A8B0B8' }), -130, 7, -61, -46, 7.3, -53); for (let x = -128; x <= -48; x += 10) [-60, -54].forEach(z => P(g.cyl8, M('steelD'), x, 3.5, z, 0.3, 7, 0.3));
      for (let i = 0; i < 30; i++) { const x = rr(-126, -50), z = rr(-60, -54); P(g.box, M('paint', { col: pk(['#2A5A9A', '#E8E4DC', '#E8782A']) }), x, 0.25 + (i % 3) * 0.45, z, 1.2, 0.45, 0.8); }
      for (let i = 0; i < 6; i++) { const x = -120 + i * 13; P(g.box, M('paint', { col: '#C8D0D8' }), x, 0.5, -57, 3, 0.6, 1.4); P(g.cone8, M('paint', { col: '#B8C8D8' }), x, 0.95, -57, 0.5, 2.4, 0.3, 0, 0, Math.PI / 2); }   // 台子上的銀旗魚
      B.sign('渦旗海魚市集', 's', -53, -88, 6.2, { size: 1.0, bg: '#1A3A5A', fg: '#F4ECD8', box: 1, lit: 1 });
      H.sight(B, -88, -50, C, 'wq_market'); H.fac(B, -100, -50, C, 'market', '#7AC8E8');
      B.inter(-76, -50, 2.4, '海魚市集・幫忙喊價', () => az().act(C), '#E8A03A');
      // 棧橋、漁船（銀色的旗子）
      [-30, 10, 80].forEach(x => { B.bridge(x - 2.5, -96, x + 2.5, COAST + 0.5, { deck: 0.3, mat: 'planks', rail: false }); for (let z = -94; z < COAST; z += 6) [-2.5, 2.5].forEach(dx => P(g.cyl8, M('woodB'), x + dx, -1.2, z, 0.4, 2.6, 0.4)); });
      [[-23, -86], [17, -82], [3, -90], [87, -86]].forEach(([x, z]) => { P(g.box, M('paint', { col: pk(['#E8E4DC', '#2E7A6A', '#C83A2A']) }), x, -1.0, z, 3, 1.2, 8.5); P(g.box, M('white'), x, 0.2, z + 1.5, 2.2, 1.4, 2.4); P(g.cyl8, M('steelD'), x, 2.4, z - 1.6, 0.1, 4.8, 0.1); B.flag(x, z - 1.6, 4.8, '#C8D4E0'); });
      // 渦流：海灣裡一圈銀色的魚群在繞
      const fish = [], TH = THREE, fm = CK.mat('silverFish', { col: '#E8F0F8', em: '#A8C8E8', ei: 0.6, metal: 0.6, rough: 0.3, snow: 0 });
      for (let i = 0; i < 60; i++) { const f = new TH.Mesh(new TH.ConeGeometry(0.25, 1.2, 4), fm); f.rotation.z = Math.PI / 2; B.group.add(f); fish.push({ f, a: i / 60 * Math.PI * 2 * 3, r: 6 + (i % 5) * 2.2, y: -1.5 + (i % 3) * 0.15 }); }
      const ex = 110, ez = -120;
      W.town.anim.push((dt, t) => fish.forEach(o => { const a = o.a + t * (0.5 - o.r * 0.02); o.f.position.set(ex + Math.cos(a) * o.r, o.y, ez + Math.sin(a) * o.r); o.f.rotation.y = -a; }));
      P(g.torus, CK.mat('eddyRing', { col: '#3A6A8A', op: 0.5, snow: 0 }), ex, -1.55, ez, 26, 1, 26, Math.PI / 2, 0, 0);
      // 渦流展望台（東邊的堤防盡頭）
      B.plaza(120, -100, 140, COAST, 'gran', { noCurb: true });
      B.box(M('concD'), 124, 0, -98, 136, 6, -88); B.box(M('glassL'), 124.2, 6, -97.8, 135.8, 7.2, -88.2); B.box(M('white'), 123.6, 7.2, -98.4, 136.4, 7.5, -87.6);
      B.stairs(126, -88, 134, -80, 's', 0.12, 6, { mat: 'gran' }); B.terrace(124, -98, 136, -88, 6, { wall: 'concD', top: 'gran', open: [[126, -88.4, 134, -87.6]] });
      B.Bt.yOff = 6; H.sight(B, 130, -94, C, 'wq_eddy'); B.Bt.yOff = 0;
      B.area('渦流展望台', [118, -102, 142, -78]); B.label('渦流展望台', 130, -92);
      B.area('渦旗漁港', [-150, -100, 118, -52]); B.label('渦旗漁港', -20, -70);
      // ---------- 漁業會館、公會分館（魚市樓上） ----------
      B.bld({ r: [-130, -40, -96, -18], h: 12, style: 'brick', face: 'n', col: '#D8CCB8', top: false }); redRoof(-130, -40, -96, -18, 12);
      B.sign('漁業會館', 'n', -40, -113, 8.4, { size: 0.7, bg: '#1A3A5A', fg: '#F4ECD8', box: 1 }); H.fac(B, -113, -42, C, 'hall', '#7AC8E8');
      H.guild(B, [-90, -40, -60, -18], 'n', { p: 'wq', name: '公會渦旗分館', h: 10, col: '#C8BCA8' }); redRoof(-90, -40, -60, -18, 10);
      // ---------- 川邊：屋台街（晚上紅燈籠） ----------
      for (let z = -36; z <= 80; z += 9) {
        if (z > 0 && z < 22) continue;
        const x = RV[1] + 3.2, col = pk(['#C83A2A', '#2E4A8A', '#E8A03A', '#3A3A44']);
        B.box(M('woodD'), x - 1.6, 0, z - 2, x + 1.6, 1.0, z + 2); B.box(CK.mat('yatai|' + col, { tex: 'paint', col, rough: 0.8 }), x - 2, 2.3, z - 2.4, x + 2, 2.45, z + 2.4);
        [[-1.8, -2.2], [1.8, -2.2], [-1.8, 2.2], [1.8, 2.2]].forEach(([a, b]) => P(g.box, M('woodD'), x + a, 1.15, z + b, 0.1, 2.3, 0.1));
        P(g.box, CK.mat('noren|#2A2A2A', { tex: 'paint', col: '#E8E4DC', rough: 0.9 }), x - 2.02, 1.9, z, 0.04, 0.7, 4.2);
        P(g.sph, CK.mat('chochinRed', { col: '#E8503A', em: '#FF6A3A', ei: 0, lamp: true, snow: 0 }), x - 2.2, 2.0, z - 1.6, 0.4, 0.55, 0.4); B.lampAt(x - 2, z);
        B.neonSign(pk(['拉麵', '關東煮', '雞串', '天婦羅', '餃子']), x - 2.1, 2.9, z + 1, -Math.PI / 2, { size: 0.42 });
        B.solid(x - 2, z - 2.4, x + 2, z + 2.4, 'deco');
      }
      B.plaza(RV[1], -40, RV[1] + 8, 86, 'gran', { noCurb: true });
      B.inter(RV[1] + 1.2, 30, 2.4, '屋台（吃點東西）', () => az().food(C), '#FFD84A');
      B.steal(RV[1] + 1, -18, '偷拿一串屋台的雞串', 'stall', () => ({ gift: 'dango', n: 1 }), { time: 0.9 });
      B.walk([[RV[1] + 1, -38], [RV[1] + 1, 84]], 8);
      B.area('屋台街', [RV[1], -42, RV[1] + 9, 88]); B.label('屋台街', RV[1] + 4, 30);
      // 壽司・渦潮（川西岸）
      B.bld({ r: [20, 20, 36, 34], h: 6.4, style: 'machiya', face: 'w', name: '壽司・渦潮', noren: '#1A3A5A' });
      H.door(B, 18.4, 27, 'wq_sushi', '走進壽司・渦潮（銀旗魚握壽司）', '#E8A03A', -Math.PI / 2);
      // ---------- 東：物流倉庫（蓋到一半）、華爾納外貿協會 ----------
      B.zone([62, -40, 146, 4], 'gravel', 0.02);
      for (let x = 66; x <= 140; x += 9) for (let z = -36; z <= 0; z += 9) P(g.box, M('steelD'), x, 6, z, 0.4, 12, 0.4);
      for (let z = -36; z <= 0; z += 9) P(g.box, M('steelD'), 103, 12, z, 74, 0.5, 0.4);
      B.box(M('corr', { col: '#9AA0A8' }), 66, 12.2, -36, 100, 12.5, 0);
      B.solid(64, -38, 142, 2, 'house');
      H.fac(B, 60, -18, C, 'logi', '#C8A060');
      B.bld({ r: [70, 22, 110, 50], h: 18, style: 'glass', face: 'w', col: '#B0C0C8', top: false });
      B.sign('華爾納外貿協會', 'w', 70, 36, 8, { size: 0.55, bg: '#1A2A4A', fg: '#F4E8C8', box: 1 }); H.fac(B, 67, 36, C, 'trade', '#7A98B0');
      // ---------- 其他：紅瓦的民家、石垣、榕樹 ----------
      for (let z = 22; z < 86; z += 16) { [[-30, -14], [-56, -38]].forEach(([x0, x1]) => { B.box(M('ishi'), x0 - 0.4, 0, z - 0.4, x1 + 0.4, 1.2, z + 12.4); B.bld({ r: [x0, z, x1, z + 12], h: 4.6, style: 'house', face: 'e', col: pk(['#F0E8D8', '#E8DCC8']), top: false }); redRoof(x0, z, x1, z + 12, 4.6); }); }
      for (let i = 0; i < 12; i++) B.tree(rr(-140, -64), rr(22, 84), 'round', rr(1.2, 1.7));
      B.row('w', 8, -40, 4, 12, { style: 'house', h: 7 }, 9, 13, () => ({ h: rr(6, 9), col: pk(['#F0E8D8', '#E8DCC8']) }));
      B.row('e', -8, -40, 4, 12, { style: 'house', h: 7 }, 9, 13, () => ({ h: rr(6, 9), col: pk(['#F0E8D8', '#E8DCC8']) }));
      // ---------- 南：渦旗港站 ----------
      H.station(B, { p: 'wq', name: '渦旗港站', w: 66, d: 20, h: 9, col: '#E8DCC8', style: 'brick', roof: 'kawaraRed', tt: ['渡輪：往天宮（南瀧）每天兩班、往納瓦每天一班', '往東鶴：經南瀧，兩天', '市內巴士：漁港、展望台'] });
      H.street(B, { city: C, lampsX: [[86.6, -140, 140, 18], [6.4, -140, 30, 18]], lampsZ: [[-10.4, -40, 84, 16]], walks: [[-10.5, 86, -10.5, -44], [10.5, -44, 10.5, 86], [-140, 92, 140, 92], [-140, 12, 140, 12], [-140, -48, 140, -48], [-140, -58, 30, -58]], routes: [[[[-4, 92], [-4, -48], [4, -48], [4, 92]], 3]], vends: [[-11, 60, Math.PI / 2]], vendFood: [-9.8, 60] });
      B.talker(-4, 114, Math.PI, '從納瓦來的旅客', ['「納瓦那邊是夏天，這裡已經要穿外套了。」', '「渦旗的屋台，比納瓦的夜市還多。」']);
      B.talker(-30, -50, 0, '補網的漁夫', ['「銀旗魚順著渦流下大洋。我們跟著牠們出海。」', '「法蘭克漁業的人說要收購漁協。我們不賣。」']);
      H.far(B, { coast: COAST, seed: 29, snow: 900, mh: 260, forest: true });
    },
    tick() { }
  });
  H.rooms({
    p: 'wq', city: C,
    guild: { name: '公會渦旗分館', hint: '魚市樓上，整棟都是海的味道', floor: 'wfloor', board: ['渦流灣：秋季渦流帶出了浮島型遺跡，漁民說銀旗魚繞著它游。', '漁船護衛：往納瓦的航線上，有東西在船底敲。', '市集委託：冷凍庫裡的魚，半夜自己會動。'], lines: ['「樓下是魚市，所以這裡的地板永遠是濕的。」', '「渦流灣的遺跡，秋天才浮出來。」', '「去納瓦？渡輪一天一班。」'] },
    station: { name: '渦旗港站', hint: '渡輪的汽笛和魚的味道', dest: '天宮（南瀧）　納瓦　東鶴（經南瀧）', lines: ['「往東鶴要經南瀧，兩天。」', '「往納瓦的渡輪，一天一班。」'], waiting: ['「回納瓦。帶了一箱銀旗魚給家裡。」'] },
    food: { id: 'wq_sushi', name: '壽司・渦潮', hint: '白木的吧台，師傅只收當天的魚', floor: 'tatami', bg: '#1A3A5A', say: '「今天的銀旗魚，早上才上岸。」', cook: '壽司師傅', lines: ['「只收當天的魚。賣完就關門。」', '「魚刺排成渦旗的形狀——這是本店的招牌。」'] }
  });
  // 壽司・渦潮的櫃台：觀光章
  const rd = CK.rooms.wq_sushi, b0 = rd.build; rd.build = (B, K) => { b0(B, K); H.sight(B, 3, -1.4, C, 'wq_sushi', 2.2); };
})(window.R);
