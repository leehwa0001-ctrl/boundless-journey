// 渦旗（漁港）的 3D 城（2026-10-20 作者：剩下的城市地圖照《昭旭重要城市》的順序做；2026-10-21 重蓋：豐富度對齊吉山、奉主，修掉房子壓在人行道上的 bug）
// 設定：連接納瓦（＝沖繩那樣的南方島嶼）與天宮的漁港；秋天銀旗魚順著渦流海灣下大洋繁衍，漁民出海的時機，也是城名由來。
// 地圖（北是 -z，海在北邊）：
//   北：漁港（棧橋、插銀色旗子的漁船）、海魚市集的大棚；海灣裡一圈銀色魚群（渦流），東邊堤防上的渦流展望台
//   中：渦旗川（南北向），東岸一整排屋台（晚上紅燈籠）；漁業會館、公會分館（魚市樓上）、壽司・渦潮；物流倉庫、華爾納外貿協會
//   其他街區照 CK.H.grid 自動排：南方的紅瓦民家（石垣）、港町的店；南：渦旗港站
(function (R) {
  const CK = R.CK, W = R.W, S = () => R.S; if (!CK || !CK.H) return;
  const H = CK.H, az = () => R.azuki, C = 'woqi', COAST = -62, RV = [38, 50];
  const CUT = { port: [-150, -62, 150, -54], hall: [-150, -42, -116.5, 5.5], guild: [-103.5, -42, -66.5, 5.5], sushi: [8, 18.5, 38, 46], yatai: [50, -42, 62, 84], logi: [62, -42, 93.5, 5.5], trade: [106.5, 18.5, 150, 45.5], station: [-46, 100, 46, 150] };
  CK.define({
    id: C, name: '渦旗', seed: 1601, stationName: '渦旗港站', fog: 1.0, sea: true, snow: 0.25,
    land: [[-1000, COAST], [1000, COAST], [1000, 980], [-1000, 980]],
    walk: [-150, -100, 150, 150], spawn: [0, 108, 0], camYaw: 0, banner: '漁港・渦流與銀旗魚', plaza: [0, 108],
    guards: [[-12, 100, Math.PI]], patrols: [[[-146, -48], [146, -48]], [[-146, 12], [146, 12]]],
    gossip: ['「秋天的海灣，魚群會畫圓。銀色的，像旗子在轉。」', '「屋台晚上才開。拉麵、關東煮、烤雞串，一攤一攤。」', '「從納瓦來的船，帶著南邊的水果。」', '「法蘭克漁業的人又來談收購了。漁協不肯。」'],
    firstTip: '第一次來渦旗：Tab 看地圖。渦流展望台（東邊的堤防）、海魚市集開市（北邊的大棚）、壽司・渦潮的櫃台（川西岸）都有觀光章；公會渦旗分館在港通南邊；晚上川邊有屋台；回東鶴到南邊的渦旗港站。',
    mapNote: '北邊是漁港和海魚市集，海灣裡有渦流。中間的川東岸是屋台街，南邊是渦旗港站。',
    ads: ['銀旗魚', '屋台', '法蘭克漁業', '華爾納外貿'], vendLines: ['罐裝的南國果汁，從納瓦來的。', '熱的魚湯罐頭——真的有。'], carCols: ['#E8E4DC', '#2E7A6A', '#C83A2A', '#2A2A30'],
    build(B) {
      const M = CK.M, g = B.g, P = B.part, rr = B.rr, pk = B.pk, rnd = B.rnd;
      const redRoof = (x0, z0, x1, z1, h) => B.roof((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, { type: 'hip', y: h, h: Math.min(x1 - x0, z1 - z0) * 0.25, o: 0.5, mat: 'kawaraRed' });
      B.water([[RV[0], COAST - 20], [RV[1], COAST - 20], [RV[1], 170], [RV[0], 170]], { level: -1.6, bank: 'ishi', name: '渦旗川' });
      H.grid(B, {
        city: C, bounds: [-150, COAST, 150, 150], water: [[RV[0], COAST, RV[1], 150]], cuts: Object.values(CUT), railMat: 'verm',
        hz: [[-48, 3, 3, '港通'], [12, 3, 3.5, '中通'], [52, 3, 3, '南通'], [92, 4, 4, '站前通']],
        vx: [[0, 4, 4, '旗通', 'y', -48, 96], [-60, 3, 3.5, '漁協通'], [-110, 3, 3.5, '西通'], [100, 3, 3.5, '東通']],
        pal: [{ style: 'house', w: 5, h: [5, 8], shop: 0.35, cols: ['#F0E8D8', '#E8DCC8', '#F4F0E4'], extra: { roof: 'hip', roofMat: 'kawaraRed' } }, { style: 'machiya', w: 2, shop: 0.6 }, { style: 'brick', w: 2, h: [8, 12], shop: 0.5, cols: ['#D8CCB8', '#C8BCA8'] }, { style: 'apt', w: 1, h: [9, 14] }],
        shops: ['鮮魚店', '乾貨・昆布', '漁具', '南國果物', '明太子', '拉麵・豚骨', '餃子', '烏龍麵', '冰店', '納瓦黑糖', '布行', '雜貨', '酒屋', '定食・漁師'],
        lines: [['補網的漁夫', ['「銀旗魚順著渦流下大洋。我們跟著牠們出海。」', '「法蘭克漁業的人說要收購漁協。我們不賣。」']], ['從納瓦來的旅客', ['「納瓦那邊是夏天，這裡已經要穿外套了。」', '「渦旗的屋台，比納瓦的夜市還多。」']], ['魚販的大嬸', ['「今天的銀旗魚很肥。」']], ['屋台的老闆', ['「晚上才開。白天在睡覺。」']], ['漁協的人', ['「秋天的漁汛，一年就靠這幾個禮拜。」']], ['小學生', ['「渦流灣的魚群，從展望台看得最清楚！」']], ['外貿協會的翻譯', ['「華爾納的船帶來的是香料。」']], ['釣魚的老人', ['「堤防上釣得到小銀旗。不能帶走，要放回去。」']], ['冰店的女孩', ['「南國果物冰，納瓦的芒果。」']]],
        talkers: 9, steals: 4, carsOnBridge: true
      });
      // ---------- 北：漁港、海魚市集 ----------
      B.plaza(-150, COAST, 150, -54, 'asph', { noCurb: true });
      B.box(M('corr', { col: '#A8B0B8' }), -130, 7, -61, -46, 7.3, -55); for (let x = -128; x <= -48; x += 10) [-60.5, -55.5].forEach(z => { P(g.cyl8, M('steelD'), x, 3.5, z, 0.3, 7, 0.3); B.solid(x - 0.2, z - 0.2, x + 0.2, z + 0.2, 'deco'); });
      for (let i = 0; i < 26; i++) { const x = rr(-126, -50), z = rr(-60, -56); P(g.box, M('paint', { col: pk(['#2A5A9A', '#E8E4DC', '#E8782A']) }), x, 0.25 + (i % 3) * 0.45, z, 1.2, 0.45, 0.8); }
      for (let i = 0; i < 6; i++) { const x = -120 + i * 13; P(g.box, M('paint', { col: '#C8D0D8' }), x, 0.5, -58, 3, 0.6, 1.4); P(g.cone8, M('paint', { col: '#B8C8D8' }), x, 0.95, -58, 0.5, 2.4, 0.3, 0, 0, Math.PI / 2); }
      B.sign('渦旗海魚市集', 's', -55, -88, 6.2, { size: 1.0, bg: '#1A3A5A', fg: '#F4ECD8', box: 1, lit: 1 });
      H.sight(B, -88, -55.4, C, 'wq_market'); H.fac(B, -100, -55.4, C, 'market', '#7AC8E8');
      B.inter(-76, -55.4, 2.4, '漁港：出海釣魚（魚餌 15 費拉）', () => az().act(C), '#E8A03A');
      [-30, 10, 80].forEach(x => { B.bridge(x - 2.5, -96, x + 2.5, COAST + 0.5, { deck: 0.3, mat: 'planks', rail: false }); for (let z = -94; z < COAST; z += 6) [-2.5, 2.5].forEach(dx => P(g.cyl8, M('woodB'), x + dx, -1.2, z, 0.4, 2.6, 0.4)); });
      // 2026-10-22 棧橋兩邊停著插銀色旗子的漁船（shipkit.js；設定寫了、原本沒有放）
      [-30, 10, 80].forEach((x, i) => [-1, 1].forEach(sd => B.ship('fishing', x + sd * 5.2, -78 - (i + (sd > 0 ? 1 : 0)) % 2 * 9, Math.PI / 2, { y: -1.2, L: 9 + (i % 2), col: pk(['#E8E4DC', '#2E7A6A', '#2A5A9A', '#C83A2A']), flag: '#C8D0D8', solid: false })));
      [[-23, -86], [17, -82], [3, -90], [87, -86]].forEach(([x, z]) => { P(g.box, M('paint', { col: pk(['#E8E4DC', '#2E7A6A', '#C83A2A']) }), x, -1.0, z, 3, 1.2, 8.5); P(g.box, M('white'), x, 0.2, z + 1.5, 2.2, 1.4, 2.4); P(g.cyl8, M('steelD'), x, 2.4, z - 1.6, 0.1, 4.8, 0.1); });
      for (let x = -142; x <= 142; x += 18) if (x < RV[0] - 2 || x > RV[1] + 2) H.gas(B, x, -54.8);
      // 渦流：海灣裡一圈銀色的魚群在繞
      const fish = [], TH = THREE, fm = CK.mat('silverFish', { col: '#E8F0F8', em: '#A8C8E8', ei: 0.6, metal: 0.6, rough: 0.3, snow: 0 });
      for (let i = 0; i < 60; i++) { const f = new TH.Mesh(new TH.ConeGeometry(0.25, 1.2, 4), fm); f.rotation.z = Math.PI / 2; B.group.add(f); fish.push({ f, a: i / 60 * Math.PI * 2 * 3, r: 6 + (i % 5) * 2.2, y: -1.5 + (i % 3) * 0.15 }); }
      const ex = 108, ez = -122;
      W.town.anim.push((dt, t) => fish.forEach(o => { const a = o.a + t * (0.5 - o.r * 0.02); o.f.position.set(ex + Math.cos(a) * o.r, o.y, ez + Math.sin(a) * o.r); o.f.rotation.y = -a; }));
      P(g.torus, CK.mat('eddyRing', { col: '#3A6A8A', op: 0.5, snow: 0 }), ex, -1.55, ez, 26, 1, 26, Math.PI / 2, 0, 0);
      // 渦流展望台：堤防盡頭（跟地面一樣高的平台＋亭子）
      B.plaza(120, -100, 140, COAST, 'gran', { noCurb: true });
      B.roof(130, -94, 10, 8, { type: 'hip', y: 3.2, h: 1.6, o: 0.6, mat: 'kawaraRed' }); [[-4.5, -3.5], [4.5, -3.5], [-4.5, 3.5], [4.5, 3.5]].forEach(([a, b]) => { P(g.cyl8, M('woodD'), 130 + a, 1.6, -94 + b, 0.3, 3.2, 0.3); B.solid(130 + a - 0.2, -94 + b - 0.2, 130 + a + 0.2, -94 + b + 0.2, 'deco'); });
      B.fence(120.5, -99.5, 139.5, -99.5, 1.1, 'steelD');
      H.sight(B, 130, -94, C, 'wq_eddy'); B.bench(126, -90, Math.PI); B.bench(134, -90, Math.PI);
      B.area('渦流展望台', [118, -102, 142, -62]); B.label('渦流展望台', 130, -96);
      B.area('渦旗漁港', [-150, -100, 118, -54]); B.label('渦旗漁港', -20, -70);
      // ---------- 漁業會館、公會分館（魚市樓上） ----------
      { const [x0, z0, x1, z1] = CUT.hall; B.bld({ r: [x0 + 2, z0 + 1, x1 - 2, z1 - 12], h: 12, style: 'brick', face: 'n', col: '#D8CCB8', top: false }); redRoof(x0 + 2, z0 + 1, x1 - 2, z1 - 12, 12);
        B.sign('漁業會館', 'n', z0 + 1, (x0 + x1) / 2, 8.4, { size: 0.7, bg: '#1A3A5A', fg: '#F4ECD8', box: 1 }); H.fac(B, (x0 + x1) / 2, z0 - 0.8, C, 'hall', '#7AC8E8');
        H.door(B, (x0 + x1) / 2 + 8, z0 - 0.8, 'wq_hall', '走進漁業會館的食堂（味噌湯）', '#E8A03A', Math.PI);
        B.zone([x0, z1 - 12, x1, z1], 'gran', 0.03); for (let i = 0; i < 3; i++) B.tree(x0 + 6 + i * 11, z1 - 6, 'round', rr(1.2, 1.6)); }
      { const [x0, z0, x1, z1] = CUT.guild; H.guild(B, [x0 + 2, z0 + 1, x1 - 2, z1 - 12], 'n', { p: 'wq', name: '公會渦旗分館', h: 10, col: '#C8BCA8' }); redRoof(x0 + 2, z0 + 1, x1 - 2, z1 - 12, 10); B.zone([x0, z1 - 12, x1, z1], 'gran', 0.03); }
      // ---------- 川東岸：屋台街 ----------
      { const [x0, z0, x1, z1] = CUT.yatai; [[z0, 5.5], [18.5, 46], [58, z1]].forEach(([a0, a1]) => B.plaza(x0, a0, x1, a1, 'gran', { noCurb: true }));
        for (let z = z0 + 4; z <= z1 - 4; z += 9) {
          if (z > 3 && z < 21 || z > 43 && z < 61) continue;
          const x = x1 - 3.2, col = pk(['#C83A2A', '#2E4A8A', '#E8A03A', '#3A3A44']);
          B.box(M('woodD'), x - 1.6, 0, z - 2, x + 1.6, 1.0, z + 2); B.box(CK.mat('yatai|' + col, { tex: 'paint', col, rough: 0.8 }), x - 2, 2.3, z - 2.4, x + 2, 2.45, z + 2.4);
          [[-1.8, -2.2], [1.8, -2.2], [-1.8, 2.2], [1.8, 2.2]].forEach(([a, b]) => P(g.box, M('woodD'), x + a, 1.15, z + b, 0.1, 2.3, 0.1));
          P(g.sph, CK.mat('chochinRed', { col: '#E8503A', em: '#FF6A3A', ei: 0, lamp: true, snow: 0 }), x - 2.2, 2.0, z - 1.6, 0.4, 0.55, 0.4); B.lampAt(x - 2, z);
          B.neonSign(pk(['拉麵', '關東煮', '雞串', '天婦羅', '餃子']), x - 2.1, 2.9, z + 1, -Math.PI / 2, { size: 0.42 });
          B.solid(x - 2, z - 2.4, x + 2, z + 2.4, 'deco');
        }
        B.inter(x0 + 3, 30, 2.4, '屋台（吃點東西）', () => az().food(C), '#FFD84A');
        B.steal(x0 + 3, -22, '偷拿一串屋台的雞串', 'stall', () => ({ gift: 'dango', n: 1 }), { time: 0.9 });
        B.talker(x0 + 4.6, 70, Math.PI / 2, '屋台的大叔', ['「豚骨拉麵，湯熬了一整天。」', '「喝一杯再走？」']);
        [[z0 + 2, 4], [20, 44], [60, z1 - 2]].forEach(([a0, a1]) => B.walk([[x0 + 2.5, a0], [x0 + 2.5, a1]], 3));
        B.area('屋台街', CUT.yatai); B.label('屋台街', (x0 + x1) / 2, 30); }
      // ---------- 壽司・渦潮（川西岸） ----------
      { const [x0, z0, x1, z1] = CUT.sushi; B.bld({ r: [x0 + 10, z0 + 2, x1 - 2, z1 - 12], h: 6.4, style: 'machiya', face: 'w', name: '壽司・渦潮', noren: '#1A3A5A' }); H.door(B, x0 + 8.4, (z0 + z1 - 10) / 2, 'wq_sushi', '走進壽司・渦潮（銀旗魚握壽司）', '#E8A03A', -Math.PI / 2); B.zone([x0, z1 - 10, x1, z1], 'grass', 0.02); for (let i = 0; i < 3; i++) B.tree(x0 + 6 + i * 9, z1 - 5, 'round', rr(1.2, 1.6)); }
      // ---------- 東：物流倉庫（蓋到一半）、華爾納外貿協會 ----------
      { const [x0, z0, x1, z1] = CUT.logi; B.zone(CUT.logi, 'gravel', 0.02);
        for (let x = x0 + 4; x <= x1 - 4; x += 9) for (let z = z0 + 4; z <= z1 - 4; z += 9) P(g.box, M('steelD'), x, 6, z, 0.4, 12, 0.4);
        for (let z = z0 + 4; z <= z1 - 4; z += 9) P(g.box, M('steelD'), (x0 + x1) / 2, 12, z, x1 - x0 - 8, 0.5, 0.4);
        B.box(M('corr', { col: '#9AA0A8' }), x0 + 4, 12.2, z0 + 4, (x0 + x1) / 2, 12.5, z1 - 4);
        B.solid(x0 + 3, z0 + 3, x1 - 3, z1 - 3, 'house');
        H.fac(B, (x0 + x1) / 2, z0 - 0.8, C, 'logi', '#C8A060'); }
      { const [x0, z0, x1, z1] = CUT.trade; B.bld({ r: [x0 + 2, z0 + 1, x1 - 2, z1 - 1], h: 18, style: 'glass', face: 'w', col: '#B0C0C8', top: false });
        B.sign('華爾納外貿協會', 'w', x0 + 2, (z0 + z1) / 2, 8, { size: 0.55, bg: '#1A2A4A', fg: '#F4E8C8', box: 1 }); H.fac(B, x0 - 0.8, (z0 + z1) / 2, C, 'trade', '#7A98B0'); }
      // ---------- 南：渦旗港站 ----------
      H.station(B, { p: 'wq', name: '渦旗港站', w: 66, d: 20, h: 9, col: '#E8DCC8', style: 'brick', roof: 'kawaraRed', tt: ['渡輪：往天宮（南瀧）每天兩班、往納瓦每天一班', '往東鶴：經南瀧，兩天', '市內巴士：漁港、展望台'] });
      B.talker(-4, 114, Math.PI, '剛下船的旅客', ['「漁港在北邊，旗通一直走。」', '「屋台在川邊，晚上才熱鬧。」']);
      H.far(B, { coast: COAST, seed: 29, snow: 900, mh: 260 });
    },
    tick() { }
  });
  H.rooms({
    p: 'wq', city: C,
    guild: { name: '公會渦旗分館', hint: '魚市樓上，整棟都是海的味道', floor: 'wfloor', board: ['渦流灣：秋季渦流帶出了浮島型遺跡，漁民說銀旗魚繞著它游。', '漁船護衛：往納瓦的航線上，有東西在船底敲。', '市集委託：冷凍庫裡的魚，半夜自己會動。'], lines: ['「樓下是魚市，所以這裡的地板永遠是濕的。」', '「渦流灣的遺跡，秋天才浮出來。」', '「去納瓦？渡輪一天一班。」'] },
    station: { name: '渦旗港站', floor: 'wfloor', deco: (B, K, M) => { B.box(M('woodD'), -10.6, 0, -5.4, -7.6, 0.9, -3.8); B.box(CK.mat('wqTank', { col: '#3A8AC8', em: '#5AB8F0', ei: 0.45 }), -10.5, 0.9, -5.3, -7.7, 2.2, -3.9); B.inter(-9, -3, 2.2, '水族箱（看看）', () => R.townTalk('水族箱', ['竹筴魚和鯖魚在箱子裡繞圈。', '牌子：「秋天的渦流裡有銀旗魚。想看真的就去漁港出海。」'])); B.box(M('paint', { col: '#8A9AB0' }), -6.4, 2.4, -5.95, -3.4, 3, -5.9); }, hint: '渡輪的汽笛和魚的味道', dest: '天宮（南瀧）　納瓦　東鶴（經南瀧）', lines: ['「往東鶴要經南瀧，兩天。」', '「往納瓦的渡輪，一天一班。」'], waiting: ['「回納瓦。帶了一箱銀旗魚給家裡。」'] },
    food: { id: 'wq_sushi', name: '壽司・渦潮', hint: '白木的吧台，師傅只收當天的魚', floor: 'tatami', bg: '#1A3A5A', say: '「今天的銀旗魚，早上才上岸。」', cook: '壽司師傅', lines: ['「只收當天的魚。賣完就關門。」', '「魚刺排成渦旗的形狀——這是本店的招牌。」'] }
  });
  const rd = CK.rooms.wq_sushi, b0 = rd.build; rd.build = (B, K) => { b0(B, K); H.sight(B, 3, -1.4, C, 'wq_sushi', 2.2); B.inter(-3, -1.4, 2.2, '請師傅捏自己釣的魚', () => R.azuki.fac('woqi', 'sushi'), '#7AC8E8'); };
  CK.defineRoom({ id: 'wq_hall', name: '漁業會館・食堂', hint: '牆上記著歷年的漁獲，大鍋裡的味噌湯', w: 14, d: 10, h: 3.6, floor: 'wfloor', wall: 'plaster', wain: 'woodB', build(B, K) {
    K.counter(0, -2.8, 8, 0.7, { mat: 'woodB', top: 'woodD' }); K.wallSign('渦旗漁業會館', 'n', 0, 2.8, { size: 0.5, bg: '#1A3A5A', fg: '#F4ECD8', lit: 1 });
    B.inter(0, -1.6, 2.2, '點菜', () => H.eat(C, '漁業會館・食堂', '「漁師吃的，份量很大。」', H.menu(C)), '#E8A03A');
    B.talker(0, -3.8, 0, '食堂的大嬸', ['「味噌湯是用魚骨熬的。」', '「牆上的數字，是每年的漁獲。今年比去年少。」']);
    B.talker(-5, 2, Math.PI / 2, '漁協的會長', ['「法蘭克漁業的牌子掛在那邊，我每天看了都生氣。」']);
    [[-3, 2], [2, 2.5]].forEach(([x, z]) => K.cafeSet(x, z, { top: 'wood' })); K.lamp(-3, 0); K.lamp(3, 0);
  } });
  // 2026-10-26 作者：各城的公會分館不要同一間——渦旗分館在漁業會館隔壁：魚拓牆、漁網、浮球、鐵桶裡的冰
  CK.defineRoom({ id: 'wq_guild', name: '公會渦旗分館', hint: '魚腥味和海風，牆上掛滿魚拓', w: 16, d: 12, h: 4.2, floor: 'wfloor', wall: 'plaster', wain: 'woodB', amb: 1, build(B, K) {
    const M = CK.M;
    K.counter(-3, -3.8, 7, 0.9, { mat: 'woodB', top: 'wood' });
    K.wallSign('公會渦旗分館', 'n', -3, 3.4, { size: 0.55, bg: '#1A3A5A', fg: '#F4ECD8' });
    B.inter(-3, -2.6, 2.2, '櫃台：今日地方委託', () => R.azuki.quest('woqi'), '#3E9A5A');
    B.talker(-1, -4.8, 0, '分館的館員（漁師出身）', ['「秋天的委託一半是銀旗魚。」', '「想釣大的就去征遠買船。防波堤只有小魚。」', '「華爾納的人收魚收得很兇，價錢也給得兇。」']);
    for (let i = 0; i < 4; i++) B.box(M('paint', { col: '#F4ECD8' }), 3 + i * 1.3, 1.4, -5.95, 4 + i * 1.3, 2.4, -5.9);   // 魚拓
    B.inter(4.9, -4.8, 2.4, '魚拓牆：你釣到過的魚', () => R.woqiPrints(), '#7AC8E8');
    B.box(M('paint', { col: '#5A4A3A' }), 7.6, 0.4, -2, 7.75, 3.4, 2);   // 漁網
    [[6.8, 2.6], [6.4, 3.4]].forEach(([x, z]) => B.box(M('paint', { col: '#E8A03A' }), x - 0.3, 0, z - 0.3, x + 0.3, 0.6, z + 0.3));   // 浮球
    B.talker(-5.4, 2, Math.PI / 2, '曬黑的勇者', ['「我在渦流裡看過一條很大的影子。他們說那是渦流王。」', '「藍鰭鮪要一拉一放。死命拉一定斷。」']);
    K.bench(-6, 1.4, 3, Math.PI / 2); K.lamp(-3, -1); K.lamp(3, 1);
  } });
})(window.R);
