// 板北（橋樑・開放港）的 3D 城（2026-10-20 作者：剩下的城市地圖照《昭旭重要城市》的順序做；2026-10-21 重蓋：豐富度對齊吉山、奉主，修掉房子壓在人行道上的 bug）
// 設定：連結天宮與北州（＝北海道）的海峽大橋；會戰後外國長期駐紮，兩板中較開放也較有限制。外資、夜生活。
// 地圖（北是 -z，海峽在東邊 x＞92）：
//   東岸：海峽大橋往東跨出去（晚上主纜亮藍燈）、渡輪港（往岳北、古森的夜船）、港灣酒店（高樓）、公會板北分館
//   中：霓虹的夜店街（紅燈區只在入口掛一塊牌子）、世界央行；西北：外國駐軍基地；西：艾美利亞造車廠展示間、英尼爾斯製藥廠、朝日科技板北所
//   其他街區照 CK.H.grid 自動排（外資的辦公樓、洋館、公寓、酒吧）；南：板北站
(function (R) {
  const CK = R.CK, W = R.W, S = () => R.S; if (!CK || !CK.H) return;
  const H = CK.H, az = () => R.azuki, C = 'banbei', SEA = 92;
  const CUT = { front: [66.5, -130, 92, 150], base: [-150, -90, -8, -17], night: [-93.5, 18, -8, 40], car: [-150, -3, -106.5, 43.5], pharma: [-150, 56.5, -106.5, 84], tech: [-93.5, 56.5, -56.5, 84], bank: [8, -40, 53.5, -17], station: [-46, 100, 46, 150] };
  CK.define({
    id: C, name: '板北', seed: 1959, stationName: '板北站', fog: 1.2, sea: true,
    land: [[-1000, -1000], [SEA, -1000], [SEA, 1000], [-1000, 1000]],
    walk: [-150, -130, 132, 150], spawn: [0, 108, 0], camYaw: 0, banner: '海峽的橋・不夜的港', plaza: [0, 108],
    guards: [[-6, -12, 0], [-12, 100, Math.PI]], patrols: [[[-146, -10], [88, -10]], [[-4, -94], [-4, 90]]],
    alleys: [[-90, 26, -12, 32]], brawl: [[-50, 29], [40, 60]],
    gossip: ['「大橋的主纜晚上亮藍燈，北州那邊看得到。」', '「駐軍的人週末都在夜店街。衛兵巡邏的時候會躲。」', '「港灣酒店的大廳，鋼琴師在彈華爾納的曲子。」', '「去岳北的夜船，十點開。睡一覺就到了。」'],
    firstTip: '第一次來板北：Tab 看地圖。渡輪港夜景（東岸）、造車廠展示間（西邊）、港灣酒店大廳（東岸）都有觀光章；公會板北分館在渡輪港旁邊；夜店街在中間；回東鶴到南邊的板北站。',
    mapNote: '東邊是海峽和大橋，東岸是渡輪港、港灣酒店、公會，中間是夜店街，西北是駐軍基地，西邊是工廠，南邊是板北站。',
    ads: ['艾美利亞汽車', '英尼爾斯製藥', '朝日科技', '港灣酒店', '夜船・往岳北'], vendLines: ['艾美利亞的可樂，瓶子是曲線的。', '英尼爾斯的能量飲料。藥味很重。'], carCols: ['#C83A3A', '#E8E4DC', '#2A2A30', '#E8B830', '#2E4A8A'],
    build(B) {
      const M = CK.M, g = B.g, P = B.part, rr = B.rr, pk = B.pk, rnd = B.rnd;
      H.grid(B, {
        city: C, bounds: [-150, -130, SEA, 150], cuts: Object.values(CUT),
        hz: [[-96, 3, 3, '橋頭通'], [-10, 3, 4, '本通'], [50, 3, 3.5, '山手通'], [92, 4, 4, '站前通']],
        vx: [[0, 4, 4, '中央通', 'y', -96, 96], [-100, 3, 3.5, '西通', null, -10, 150], [-50, 3, 3.5, '元町通', null, 50, 92], [60, 3, 3.5, '港通']],
        pal: [{ style: 'office', w: 4, h: [16, 34], cols: ['#A8B0B8', '#9AA4B0', '#B8B4AC'] }, { style: 'glass', w: 2, h: [20, 40] }, { style: 'brick', w: 3, h: [9, 14], shop: 0.55, cols: ['#A0503A', '#C8B8A0', '#8A7A6A'] }, { style: 'house', w: 2, h: [7, 10], shop: 0.5, cols: ['#E8DCC4', '#D8E0E4', '#F0ECE0'] }, { style: 'apt', w: 2, h: [12, 22] }],
        shops: ['外幣兌換', 'BAR・海峽', '艾美利亞漢堡', '中華街・飯店', '洋服・外資', '咖哩麵包', '酒吧・駐軍', '珈琲・夜霧', '撞球', '外國書店', '鐘錶', '洋菓子', '花店', '靴店'],
        lines: [['剛下車的外國人', ['「（共通語）港灣酒店怎麼走？」', '「板北的夜，比我們國家還吵。」']], ['駐軍的士兵', ['「（共通語）週末見。」', '「……別跟長官說你看到我。」']], ['外資公司的職員', ['「三點開會、五點開會、七點喝酒。」']], ['等夜船的旅客', ['「去岳北的夜船十點開。我先去吃咖哩麵包。」']], ['中華街的師傅', ['「港口開了以後，我爺爺就來了。」']], ['巡邏的衛兵', ['「夜店街鬧事的，一律帶走。」']], ['洋菓子店的店員', ['「酒店的下午茶太貴了，來我們這裡吧。」']], ['製藥廠的研究員', ['「英尼爾斯的藥，三分之一是在這裡做的。」']], ['看海的老人', ['「橋蓋好以前，要坐一天的船才到北州。」']]],
        talkers: 9, steals: 4
      });
      // ---------- 東岸：海峽大橋、渡輪港、港灣酒店、公會 ----------
      const [fx0, fz0, fx1, fz1] = CUT.front;
      [[fz0, -102], [-90, -17], [-3, 43.5], [56.5, 84], [100, fz1]].forEach(([a0, a1]) => B.plaza(fx0, a0, fx1, a1, 'gran', { noCurb: true }));   // 東西向的路經過的地方留給路面
      B.suspension(SEA, 520, -96, 14, { w: 10, h: 46 });
      B.label('海峽大橋', 130, -96, 1);
      B.inter(78, -106, 2.6, '海峽大橋（看看）', () => R.townTalk('海峽大橋', ['連結天宮與北州的大橋。主纜晚上亮藍燈。', '「橋墩下面那一座……聽說往下長成了遺跡。」']), '#7AC8E8');
      // 港灣酒店（本通北邊）＋後門的賭場
      B.bld({ r: [72, -86, 88, -24], h: 58, style: 'glass', face: 'w', col: '#C8B890', top: false });
      B.sign('港灣酒店', 'w', 72, -55, 50, { size: 2.2, bg: '#2A2420', fg: '#F4D88A', box: 1, lit: 1 });
      H.door(B, 70.4, -55, 'bb_hotel', '走進港灣酒店（下午茶、大廳）', '#F4D88A', -Math.PI / 2);
      H.door(B, 80, -21.4, 'bb_casino', '酒店的後門（骰子的聲音）', '#FF4A4A', 0);
      // 渡輪港（本通和山手通中間）：候船室＋棧橋＋夜船
      B.box(M('glassL'), 72, 0, 2, 86, 6, 18); B.box(M('white'), 71.6, 6, 1.6, 86.4, 6.4, 18.4); B.solid(72, 2, 86, 18, 'house'); B.foot([72, 2, 86, 18], 'glass', 6.4);
      B.sign('板北渡輪港', 'w', 72, 10, 7.4, { size: 0.7, bg: '#1A2A4A', fg: '#F4E8C8', box: 1, lit: 1 });
      H.fac(B, 69.6, 10, C, 'ferry', '#7AC8E8');
      B.bridge(SEA - 0.5, 24, 128, 32, { deck: 0.3, mat: 'planks', rail: true, railMat: 'steelD' });
      P(g.box, M('white'), 126, -0.6, 48, 10, 4, 30); P(g.box, M('white'), 126, 3.4, 51, 8, 4, 16); P(g.box, M('glassL'), 126, 4.4, 42.9, 7, 1.2, 0.1); P(g.cyl8, M('paint', { col: '#2E4A8A' }), 126, 7.6, 54, 1.4, 4, 1.4);
      B.sign('夜船・往岳北', 'w', 121, 52, 5.6, { size: 0.6, bg: '#1A2A4A', fg: '#F4E8C8', box: 1, lit: 1 });
      H.sight(B, 89, 28, C, 'bb_ferry');
      // 公會（山手通南邊）
      H.guild(B, [72, 60, 88, 82], 'w', { p: 'bb', name: '公會板北分館', h: 10, col: '#C8C0B0' });
      for (const z of [-126, -110, -80, -60, -40, -24, 2, 22, 38, 62, 78, 106, 124, 142]) H.gas(B, SEA - 1.2, z);
      B.walk([[SEA - 3, -126], [SEA - 3, -104]], 2); B.walk([[SEA - 3, -88], [SEA - 3, -19]], 3); B.walk([[SEA - 3, -1], [SEA - 3, 41]], 2); B.walk([[SEA - 3, 58], [SEA - 3, 82]], 1); B.walk([[SEA - 3, 102], [SEA - 3, 146]], 2);
      B.talker(70.5, 110, -Math.PI / 2, '渡輪港的票務員', ['「往岳北的夜船十點開、往古森的十一點。」', '「船上可以睡。毯子另外租。」']);
      B.area('渡輪港', CUT.front);
      // ---------- 西北：外國駐軍基地 ----------
      { const [x0, z0, x1, z1] = CUT.base; B.zone(CUT.base, 'asph', 0.03);
        [[x0 + 2, z0 + 2, x1 - 2, z0 + 2], [x0 + 2, z1 - 2, (x0 + x1) / 2 - 6, z1 - 2], [(x0 + x1) / 2 + 6, z1 - 2, x1 - 2, z1 - 2], [x0 + 2, z0 + 2, x0 + 2, z1 - 2], [x1 - 2, z0 + 2, x1 - 2, z1 - 2]].forEach(([a, b, c, d]) => B.fence(a, b, c, d, 3, 'steelD'));
        [[x0 + 8, z0 + 6, x0 + 48, z0 + 20], [x0 + 8, z0 + 30, x0 + 48, z0 + 44]].forEach(r => B.bld({ r, h: 6, style: 'factory', face: 's', col: '#8A9A7A', top: false }));
        B.box(M('concD'), x0 + 60, 0, z0 + 6, x1 - 8, 0.3, z1 - 10); for (let i = 0; i < 4; i++) { const x = x0 + 70 + i * 12; P(g.box, M('paint', { col: '#4A5A3A' }), x, 1, z0 + 30, 3, 2, 6); B.solid(x - 1.5, z0 + 27, x + 1.5, z0 + 33, 'deco'); }
        [-6, 0, 6].forEach((dx, i) => B.flag((x0 + x1) / 2 + dx, z1 - 4, 10, ['#2E4A8A', '#C8202A', '#E8E4DC'][i]));
        B.talker((x0 + x1) / 2, z1 + 1.4, 0, '駐軍的哨兵', ['「（共通語）基地內禁止進入。」', '「……你是勇者？週末夜店街見。」']);
        B.area('駐軍基地', CUT.base); B.label('駐軍基地', (x0 + x1) / 2, (z0 + z1) / 2); }
      // ---------- 中：夜店街（霓虹） ----------
      { const [x0, z0, x1, z1] = CUT.night, NZ0 = 26, NZ1 = 32;
        B.plaza(x0, NZ0, x1, NZ1, 'tile', { noCurb: true });
        const NC = ['#FF4A9A', '#4AE8FF', '#C86AFF', '#FFE24A', '#8AFF6A'], NM = ['CLUB', 'BAR', '夜光', 'JAZZ', '舞廳', 'PUB', '撞球', '卡拉OK'];
        const sR = B.row('s', NZ0, x0, x1, NZ0 - z0, { style: 'brick', h: 10 }, 7, 11, () => ({ h: rr(8, 14), col: pk(['#3A3440', '#2A2A30', '#4A3A44']) }));
        const nR = B.row('n', NZ1, x0, x1, z1 - NZ1, { style: 'brick', h: 10 }, 7, 11, () => ({ h: rr(8, 14), col: pk(['#3A3440', '#2A2A30', '#4A3A44']) }));
        [[sR, NZ0, 0.5], [nR, NZ1, -0.5]].forEach(([L, c, sg]) => L.forEach(o => { if (!o || !o.r) return; const [a0, , a1] = o.r; B.neon(a0 + 0.4, 3.4, c + sg * 0.5, a1 - 0.4, 3.5, c + sg * 0.6, pk(NC)); if (rnd() < 0.7) B.neonSign(pk(NM), (a0 + a1) / 2, 5.4, c + sg * 0.7, 0, { size: 0.8 }); }));
        for (let x = x0 + 4; x < x1 - 2; x += 8) B.lampAt(x, (NZ0 + NZ1) / 2);
        H.fac(B, (x0 + x1) / 2, (NZ0 + NZ1) / 2, C, 'club', '#FF4A9A');
        B.box(M('steelD'), x1 - 0.6, 0, NZ1 + 0.2, x1 - 0.3, 4, NZ1 + 0.5); B.sign('未成年人禁止', 'e', x1 - 0.3, NZ1 + 3, 3.4, { size: 0.42, bg: '#1A0A0A', fg: '#FF6A6A', box: 1, lit: 1 });
        B.talker(x0 + 20, NZ0 + 1, Math.PI, '夜店街的保鑣', ['「勇者證？在這條街沒用。……開玩笑的，進去吧。」', '「駐軍的人鬧事，我們先叫衛兵。」']);
        B.walk([[x0 + 1, (NZ0 + NZ1) / 2], [x1 - 1, (NZ0 + NZ1) / 2]], 8);
        B.area('夜店街', CUT.night); B.label('夜店街', (x0 + x1) / 2, (NZ0 + NZ1) / 2); }
      // ---------- 西：造車廠展示間、製藥廠、朝日科技 ----------
      { const [x0, z0, x1, z1] = CUT.car; B.bld({ r: [x0 + 2, z0 + 2, x1 - 2, z1 - 2], h: 9, style: 'glass', face: 'e', col: '#D8E0E8', top: false });
        B.sign('艾美利亞汽車', 'e', x1 - 2, (z0 + z1) / 2, 7, { size: 0.7, bg: '#F4F4F8', fg: '#C8202A', box: 1, lit: 1 });
        H.door(B, x1 + 0.2, (z0 + z1) / 2, 'bb_car', '走進艾美利亞造車廠展示間', '#C83A3A', Math.PI / 2); }
      { const [x0, z0, x1, z1] = CUT.pharma; B.bld({ r: [x0 + 2, z0 + 1, x1 - 2, z1 - 1], h: 12, style: 'factory', face: 'e', col: '#F0F0EC', top: false }); B.sign('英尼爾斯製藥', 'e', x1 - 2, (z0 + z1) / 2, 8, { size: 0.7, bg: '#F4F4F8', fg: '#2E6A5A', box: 1 }); H.fac(B, x1 + 0.2, (z0 + z1) / 2, C, 'pharma', '#2E6A5A'); }
      { const [x0, z0, x1, z1] = CUT.tech; B.bld({ r: [x0 + 1, z0 + 1, x1 - 1, z1 - 1], h: 26, style: 'glass', face: 'n', col: '#A8B8C8', top: false }); B.sign('朝日科技 板北所', 'n', z0 + 1, (x0 + x1) / 2, 18, { size: 0.9, bg: '#F4F4F8', fg: '#C8202A', box: 1, lit: 1 }); H.fac(B, (x0 + x1) / 2, z0 - 0.8, C, 'tech', '#FF8AE8'); }
      // ---------- 世界央行 ----------
      { const [x0, z0, x1, z1] = CUT.bank; B.bld({ r: [x0 + 3, z0 + 1, x1 - 1, z1 - 1], h: 16, style: 'brick', face: 'w', col: '#E8E0D4', top: false }); for (let i = 0; i < 4; i++) { const z = z0 + 4 + i * (z1 - z0 - 8) / 3; P(g.cyl24, M('white'), x0 + 1.5, 5, z, 1, 10, 1); B.solid(x0 + 1, z - 0.5, x0 + 2, z + 0.5, 'deco'); }
        B.sign('世界中央銀行・板北分館', 'w', x0 + 3, (z0 + z1) / 2, 11.6, { size: 0.5, bg: '#F2F0EA', fg: '#3A2E20' }); H.fac(B, x0 - 1, (z0 + z1) / 2, C, 'bank', '#C8A040'); }
      // ---------- 南：板北站 ----------
      H.station(B, { p: 'bb', name: '板北站', w: 76, d: 22, h: 12, col: '#9AB0C0', style: 'glass', bg: '#1A2A4A', fg: '#F4E8C8', tt: ['往東鶴：每天四班（魔導電車，一天）', '往板南：每小時一班', '往征遠：每天兩班', '板北國際機場：接駁巴士在站前', '夜船（往岳北、古森）：渡輪港'] });
      B.busStop(36, 101, Math.PI, '往板北國際機場'); H.fac(B, 36, 104, C, 'air', '#7AC8E8');
      B.talker(-4, 114, Math.PI, '剛下車的旅客', ['「渡輪港在東邊，夜船十點開。」', '「中央通一直走是橋頭。」']);
      H.far(B, { seed: 31, snow: 380 });
    },
    tick() { }
  });
  H.rooms({
    p: 'bb', city: C,
    guild: { name: '公會板北分館', hint: '渡輪港旁邊，窗外是大橋的藍燈', board: ['海峽大橋橋墩：其中一座往下長成了遺跡，維修隊不敢下去。', '渡輪護衛：往岳北的夜船，海上有東西跟著。', '駐軍委託：基地的倉庫晚上有聲音。他們不說是什麼。'], lines: ['「橋墩的遺跡，要從維修通道下去。」', '「駐軍的委託報酬很好，可是規矩很多。」', '「去岳北、古森？渡輪港的夜船。」'] },
    station: { name: '板北站', dest: '東鶴　板南　征遠', lines: ['「往東鶴的票嗎？」', '「去岳北要搭渡輪港的夜船。」'], waiting: ['「回板南。姊妹城，一個鐘頭。」'] },
    food: null
  });
  CK.defineRoom({ id: 'bb_hotel', name: '港灣酒店・大廳', hint: '水晶燈很亮，鋼琴師在彈華爾納的曲子', w: 22, d: 14, h: 6.4, floor: 'marble', wall: 'plaster', wain: 'woodB', trim: 'gold', amb: 1.0, build(B, K) {
    K.counter(-5, -3.6, 7, 0.9, { mat: 'woodB', top: 'marble', h: 1.1 });
    K.wallSign('港灣酒店', 'n', 0, 4.8, { size: 0.8, bg: '#2A2420', fg: '#F4D88A' });
    B.box(CK.M('black'), 5, 0, -4, 8, 1, -2.4); B.solid(5, -4, 8, -2.4, 'deco');
    H.sight(B, 2, 0, C, 'bb_hotel', 2.6);
    B.inter(-5, -2.4, 2.4, '點東西吃（下午茶、咖哩麵包）', () => H.eat(C, '港灣酒店・下午茶', '「今天的蛋糕，是華爾納的師傅做的。」', H.menu(C)), '#F4D88A');
    H.fac(B, 6, 4, C, 'hotel', '#F4D88A');
    B.talker(6.5, -1.6, Math.PI, '鋼琴師', ['「這首是華爾納的民謠。沒有人聽過，所以沒有人會說我彈錯。」']);
    B.talker(-5, -4.8, 0, '酒店的櫃台', ['「外資蓋的。大廳的水晶燈從艾美利亞運來。」', '「住宿？今天客滿了，抱歉。」']);
    [[-6, 3], [-2, 4], [2, 4]].forEach(([x, z]) => K.cafeSet(x, z, {}));
    K.plant(-9, -6, 1.3); K.plant(9, -6, 1.3); K.lamp(-4, 0); K.lamp(4, 0); K.lamp(0, 4);
  } });
  CK.defineRoom({ id: 'bb_casino', name: '地下賭場（板北）', hint: '燈光很暗，骰子的聲音', w: 14, d: 10, h: 3.4, floor: 'carpet', wall: 'plaster', wain: 'woodB', trim: 'gold', amb: 0.55, build(B, K) {
    K.wallSign('會員制', 'n', 0, 2.6, { size: 0.5, bg: '#1A0A0A', fg: '#FF4A4A', lit: 1 });
    [[-3.5, -1], [3.5, -1]].forEach(([x, z]) => { B.part(B.g.cyl24, CK.M('woodB'), x, 0.4, z, 3, 0.8, 1.8); B.solid(x - 1.5, z - 0.9, x + 1.5, z + 0.9, 'deco'); });
    B.inter(-3.5, 0.6, 2.4, '地下賭場・骰子（25 費拉）', () => az().act(C), '#FF4A4A');
    B.talker(-3.5, -2.6, 0, '莊家', ['「骰子三顆。大還是小？」', '「贏或輸都算體驗。」']);
    B.talker(4, 3, Math.PI, '駐軍的客人', ['「（共通語）……今天運氣不好。」']);
    K.lamp(-3.5, -1); K.lamp(3.5, -1);
  } });
  CK.defineRoom({ id: 'bb_car', name: '艾美利亞造車廠・展示間', hint: '車漆亮得像鏡子', w: 20, d: 12, h: 5, floor: 'marble', wall: 'plaster', wain: 'metal', trim: 'steelD', amb: 1.1, build(B, K) {
    K.wallSign('艾美利亞汽車', 'n', 0, 4, { size: 0.8, bg: '#F4F4F8', fg: '#C8202A' });
    const P = B.part, g = B.g, M = CK.M;
    [['#C83A3A', -5], ['#E8B830', 0], ['#2E4A8A', 5]].forEach(([c, x]) => { P(g.cyl24, M('marble'), x, 0.1, -2, 4, 0.2, 4); P(g.box, M('paint', { col: c }), x, 0.8, -2, 1.9, 0.9, 4.2); P(g.box, M('glassL'), x, 1.5, -1.8, 1.7, 0.6, 2); B.solid(x - 1.2, -4.2, x + 1.2, 0.2, 'deco'); });
    H.sight(B, 0, 1.8, C, 'bb_car', 2.6); H.fac(B, 5, 3, C, 'car', '#C83A3A');
    B.talker(-7, 2, Math.PI / 2, '展示間的業務', ['「可以坐進駕駛座。試駕？那個不開放。」', '「艾美利亞的車，在昭旭只有這裡造。」']);
    K.plant(-9, -5, 1.2); K.plant(9, -5, 1.2); K.lamp(-5, 0); K.lamp(0, 0); K.lamp(5, 0);
  } });
})(window.R);
