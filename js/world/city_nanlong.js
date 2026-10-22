// 南瀧（國際港都）的 3D 城（2026-10-20 作者：剩下的城市地圖照《昭旭重要城市》的順序做；2026-10-21 重蓋：豐富度對齊吉山、奉主，修掉房子壓在人行道上的 bug）
// 設定：西見沒落後的第二港都；深海港、國際停靠；清晨川湍急、夜晚霧朦朧。
// 地圖（北是 -z，海在北邊）：兩條川（西瀧川、東瀧川）從南往北流進海，每條路過川都是橋。
//   北：貨輪港（起重機、貨櫃、大貨輪、燈塔、卸貨第一雕像）
//   西岸：造船廠；中：拱廊商店街（玻璃屋頂）、公會南瀧分館（轉角）、世界央行、德克斯凡領事館（玻璃大樓）
//   東岸：湍遊國際大學（鐘樓）；其他街區照 CK.H.grid 自動排；南：南瀧站
(function (R) {
  const CK = R.CK, S = () => R.S; if (!CK || !CK.H) return;
  const H = CK.H, az = () => R.azuki, C = 'nanlong', COAST = -76;
  const RIV = [[-72, -100, -60, 170], [60, -100, 72, 170]];
  // 2026-10-22 修：地標的範圍要在路（半寬）＋人行道外面——平和通、本通原本少算了，拱廊的磚房、公會、宿舍伸進人行道
  const CUT = { port: [-150, -76, 150, -56], yard: [-150, -44, -116.5, 4], arcade: [-60, 26, -8, 46], guild: [8, 20, 25.5, 42], bank: [8, -44, 25.5, -14], consul: [38.5, 58.5, 60, 84], uni: [72, -44, 103.5, 4], dorm: [72, 20, 103.5, 46], station: [-46, 100, 46, 150] };
  CK.define({
    id: C, name: '南瀧', seed: 1945, stationName: '南瀧站', fog: 2.2, sea: true,
    land: [[-1000, COAST], [1000, COAST], [1000, 980], [-1000, 980]],
    walk: [-150, -108, 150, 150], spawn: [0, 108, 0], camYaw: 0, banner: '國際港都・川與霧', plaza: [0, 108],
    guards: [[-12, 100, Math.PI], [12, -62, 0]], patrols: [[[-146, -50], [146, -50]], [[-146, 12], [146, 12]]],
    gossip: ['「清晨的川很急，船夫說那是山在推海。」', '「霧夜的碼頭，只剩霧笛和腳步聲。」', '「卸貨第一的銅像，肩膀被摸得發亮。」', '「拱廊裡什麼國家的東西都有。德克斯凡罐頭堆成山。」'],
    firstTip: '第一次來南瀧：Tab 看地圖。卸貨第一雕像、霧夜碼頭（北邊的港）、湍遊國際大學鐘樓（東瀧川東岸）都有觀光章；公會南瀧分館在平和通和中央通的轉角；回東鶴到南邊的南瀧站。晚上霧很濃。',
    mapNote: '兩條川從南往北流進海。北邊是貨輪港，中間是拱廊商店街，東岸是大學，西岸是造船廠。',
    ads: ['德克斯凡罐頭', '南瀧霧茶', '湍遊國際大學', '外貿商社'], vendLines: ['南瀧霧茶，罐子上畫著燈塔。', '德克斯凡的罐裝咖啡。'], carCols: ['#2A2A30', '#E8E4DC', '#2E4A6A', '#5A5A62', '#8A2A2A'],
    build(B) {
      const M = CK.M, g = B.g, P = B.part, rr = B.rr, pk = B.pk, rnd = B.rnd;
      RIV.forEach((r, i) => B.water([[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]], { level: -1.8, bank: 'ishi', name: i ? '東瀧川' : '西瀧川' }));
      H.grid(B, {
        city: C, bounds: [-150, COAST, 150, 150], water: RIV.map(r => [r[0], COAST, r[2], 150]), cuts: Object.values(CUT),
        hz: [[-50, 3, 3, '港通'], [12, 4, 4, '平和通'], [52, 3, 3, '本通'], [92, 4, 4, '站前通']],
        vx: [[0, 4, 4, '中央通', 'y', -50, 96], [-32, 3, 3.5, '紙屋通', null, -50, 12], [-110, 3, 3.5, '西通'], [32, 3, 3.5, '銀山通', null, -50, 96], [110, 3, 3.5, '東通']],
        pal: [{ style: 'office', w: 4, h: [14, 30], cols: ['#A8B0B8', '#B8B4AC', '#9AA4B0'] }, { style: 'brick', w: 3, h: [9, 14], shop: 0.55, cols: ['#C8B8A0', '#D8D0C0', '#A8988A'] }, { style: 'glass', w: 1, h: [18, 34] }, { style: 'apt', w: 2, h: [12, 20] }, { style: 'house', w: 2, h: [7, 10], shop: 0.5 }],
        shops: ['外貿商社', '德克斯凡雜貨', '英尼爾斯藥局', '華爾納茶葉', '外幣兌換', '碼頭炒麵', '舶來品', '霧茶屋', '船員酒場', '鐘錶・港', '珈琲・霧笛', '洋服店', '書店・湍遊'],
        lines: [['外國來的商人', ['「南瀧的港，比我們國家的還深。」', '「霧夜的時候別去碼頭。迷路的人，早上才找得到。」']], ['橋上的船夫', ['「清晨的川很急，船要順著水走。」', '「兩條川夾著城。下雨的時候，整座城像一艘船。」']], ['碼頭工人', ['「起重機日夜不停。我們也是。」']], ['大學生', ['「湍遊國際大學一半的學生是外國人。」']], ['商社的職員', ['「三國語言都要會。不然升不上去。」']], ['賣霧茶的阿婆', ['「霧茶要趁熱。」']], ['巡警', ['「霧太濃的時候，別靠近川邊。」']], ['外國水手', ['「（共通語）哪裡有便宜的旅館？」']], ['畫家', ['「霧裡的燈塔，是南瀧最好看的東西。」']], ['送貨的少年', ['「拱廊的店一天要送三次貨。」']]],
        talkers: 10, steals: 4, carsOnBridge: true
      });
      // ---------- 北：貨輪港 ----------
      B.plaza(-150, COAST, 150, -56, 'asph', { noCurb: true });
      [-40, -10, 20, 110].forEach(x => { [-1, 1].forEach(sd => P(g.box, M('paint', { col: '#E8A03A' }), x + sd * 5, 10, -66, 1, 20, 1)); P(g.box, M('paint', { col: '#E8A03A' }), x, 20.5, -71, 1.4, 1.4, 24); B.solid(x - 5.5, -66.5, x - 4.5, -65.5, 'deco'); B.solid(x + 4.5, -66.5, x + 5.5, -65.5, 'deco'); B.lampAt(x, -66); });
      for (let i = 0; i < 18; i++) { const x = -54 + (i % 9) * 8.5 + (i % 9 > 5 ? 50 : 0), z = i < 9 ? -72 : -63, n = 1 + Math.floor(rnd() * 3), c = pk(['#2E5A8A', '#C83A2A', '#3A7A4A', '#E8A03A', '#5A5A62', '#E8E4DC']); if (RIV.some(r => x > r[0] - 5 && x < r[2] + 5)) continue; for (let j = 0; j < n; j++) P(g.box, M('corr', { col: c }), x, 1.3 + j * 2.6, z, 7.6, 2.6, 2.6); B.solid(x - 3.8, z - 1.3, x + 3.8, z + 1.3, 'deco'); }
      P(g.box, M('paint', { col: '#2A3A5A' }), -10, -0.6, -92, 70, 5, 11); P(g.box, M('paint', { col: '#8A2A2A' }), -10, -2.6, -92, 70.2, 1.2, 11.2);
      P(g.box, M('white'), 18, 4.6, -92, 9, 6, 9); P(g.box, M('glassL'), 18, 6.6, -96.6, 8, 1, 0.1); P(g.cyl8, M('paint', { col: '#C83A2A' }), 18, 9.6, -92, 1.6, 4, 1.6);
      for (let i = 0; i < 8; i++) P(g.box, M('corr', { col: pk(['#2E5A8A', '#C83A2A', '#3A7A4A', '#E8A03A']) }), -40 + i * 6.5, 3.2, -92, 6, 2.6, 9);
      B.plaza(124, -108, 140, COAST, 'gran', { noCurb: true });
      for (let i = 0; i < 6; i++) P(g.cyl24, M(i % 2 ? 'white' : 'verm'), 132, 1.6 + i * 2.6, -100, 3 - i * 0.18, 2.6, 3 - i * 0.18);
      P(g.cyl24, M('glassL'), 132, 17.6, -100, 2, 1.6, 2); P(g.sph, M('lamp'), 132, 17.6, -100, 1, 1, 1); P(g.cone, M('verm'), 132, 19.2, -100, 2.6, 1.6, 2.6); B.solid(130.4, -101.6, 133.6, -98.4, 'deco'); B.lampAt(132, -100);
      B.plaza(-10, -64, 10, -57, 'gran');
      P(g.box, M('ashlar'), 0, 0.9, -61, 2.6, 1.8, 2.6); P(g.box, M('bronze'), 0, 2.9, -61, 0.9, 1.6, 0.5); P(g.sph, M('bronze'), 0, 4.0, -61, 0.5, 0.55, 0.5); P(g.box, M('bronze'), 0.3, 4.4, -61, 1.3, 0.9, 0.9);
      B.solid(-1.3, -62.3, 1.3, -59.7, 'deco');
      H.sight(B, 0, -58, C, 'nl_statue'); H.fac(B, -6, -58, C, 'statue', '#C8A040');
      H.sight(B, 132, -84, C, 'nl_fog'); H.fac(B, 90, -60, C, 'cargo', '#7AC8E8');
      B.inter(-30, -58, 2.4, '外貿公司臨工（搬半天貨）', () => az().act(C), '#E8A03A');
      for (let x = -142; x <= 142; x += 20) if (!RIV.some(r => x > r[0] - 2 && x < r[2] + 2)) H.gas(B, x, -56.8);
      B.talker(40, -58, 0, '港務局的職員', ['「國際船今天三艘。霧太濃就延到明天。」', '「燈塔的光要照到外海的岩礁。」']);
      B.area('貨輪港', [-150, -108, 150, -56]); B.label('貨輪港', 40, -70);
      // ---------- 西岸：造船廠 ----------
      { const [x0, z0, x1, z1] = CUT.yard; B.zone(CUT.yard, 'gravel', 0.02);
        P(g.box, M('concD'), (x0 + x1) / 2, 0.3, (z0 + z1) / 2, 20, 0.6, z1 - z0 - 6); P(g.box, M('paint', { col: '#8A9098' }), (x0 + x1) / 2, 4, (z0 + z1) / 2 + 2, 11, 7, z1 - z0 - 18); P(g.cone, M('paint', { col: '#8A9098' }), (x0 + x1) / 2, 4, z0 + 8, 11, 6, 7, -Math.PI / 2, 0, 0);
        for (let z = z0 + 6; z <= z1 - 6; z += 8) [-1, 1].forEach(sd => P(g.box, M('steelD'), (x0 + x1) / 2 + sd * 8.5, 6, z, 0.4, 12, 0.4));
        B.solid((x0 + x1) / 2 - 10, z0 + 3, (x0 + x1) / 2 + 10, z1 - 3, 'house');
        B.smoke((x0 + x1) / 2, 8, (z0 + z1) / 2, { s: 1.2, rise: 4, drift: 1, n: 3, col: '#FFC060', per: 1.5, op: 0.6 }); B.lampAt((x0 + x1) / 2, (z0 + z1) / 2);
        H.fac(B, x1 + 1.2, (z0 + z1) / 2, C, 'yard', '#FFB04A');
        B.area('造船廠', CUT.yard); B.label('造船廠', (x0 + x1) / 2, (z0 + z1) / 2); }
      // ---------- 中：拱廊商店街 ----------
      { const [x0, z0, x1, z1] = CUT.arcade, AZ0 = 33, AZ1 = 41;
        B.plaza(x0, AZ0, x1, AZ1, 'tile', { noCurb: true });
        B.box(M('glassL'), x0, 7.2, AZ0, x1, 7.4, AZ1); for (let x = x0; x <= x1; x += 6.5) { P(g.box, M('steelD'), x, 7.6, (AZ0 + AZ1) / 2, 0.3, 0.5, AZ1 - AZ0 + 0.4); }
        B.sign('南瀧拱廊商店街', 'e', x1, (AZ0 + AZ1) / 2, 8.6, { size: 0.8, bg: '#1A2A4A', fg: '#F4E8C8', box: 1, lit: 1 });
        const SH = ['德克斯凡雜貨', '英尼爾斯藥局', '華爾納茶葉', '霧茶屋', '外幣兌換', '艾美利亞服飾', '碼頭炒麵', '舶來品', '珈琲・霧笛'];
        const s1 = B.row('s', AZ0, x0, x1, AZ0 - z0, { style: 'brick', h: 9 }, 7, 10, i => ({ name: SH[i % SH.length], vsign: SH[i % SH.length].slice(0, 2), h: rr(8, 11), col: pk(['#C8B8A0', '#D8D0C0', '#A8988A']) }));
        B.row('n', AZ1, x0, x1, z1 - AZ1, { style: 'brick', h: 9 }, 7, 10, i => ({ name: SH[(i + 4) % SH.length], h: rr(8, 11), col: pk(['#C8B8A0', '#D8D0C0', '#A8988A']) }));
        for (let x = x0 + 4; x < x1 - 2; x += 8) { B.lampAt(x, (AZ0 + AZ1) / 2); P(g.sph, M('lamp'), x, 6.6, (AZ0 + AZ1) / 2, 0.5, 0.5, 0.5); }
        H.door(B, (x0 + x1) / 2, AZ1 + 0.4, 'nl_tea', '走進霧茶屋（南瀧霧茶、碼頭炒麵）', '#E8A03A', 0);
        H.fac(B, x0 + 14, (AZ0 + AZ1) / 2, C, 'mall', '#E8C04A');
        B.talker(x0 + 30, AZ0 + 1.2, Math.PI, '拱廊的老闆', ['「這條拱廊，賣的是全世界的東西。」', '「下雨的時候，拱廊裡比外面還擠。」']);
        B.walk([[x0 + 1, (AZ0 + AZ1) / 2], [x1 - 1, (AZ0 + AZ1) / 2]], 6);
        B.steal(x0 + 20, AZ0 + 0.8, '摸走拱廊攤子上的一罐德克斯凡罐頭', 'shop', () => ({ gold: 4 }), { time: 1.2 });
        void s1;
        B.area('拱廊商店街', CUT.arcade); B.label('拱廊商店街', (x0 + x1) / 2, 37); }
      // ---------- 商業區：公會（轉角）、世界央行、德克斯凡領事館 ----------
      H.guild(B, [CUT.guild[0] + 1, CUT.guild[1] + 1, CUT.guild[2] - 1, CUT.guild[3] - 1], 'w', { p: 'nl', name: '公會南瀧分館', h: 14, col: '#C8C0B0' });
      { const [x0, z0, x1, z1] = CUT.bank; B.bld({ r: [x0 + 3, z0 + 1, x1 - 1, z1 - 1], h: 16, style: 'brick', face: 'w', col: '#E8E0D4', top: false }); for (let i = 0; i < 4; i++) { const z = z0 + 5 + i * (z1 - z0 - 10) / 3; P(g.cyl24, M('white'), x0 + 1.5, 5, z, 1, 10, 1); B.solid(x0 + 1, z - 0.5, x0 + 2, z + 0.5, 'deco'); }
        B.sign('世界中央銀行・南瀧分館', 'w', x0 + 3, (z0 + z1) / 2, 11.6, { size: 0.5, bg: '#F2F0EA', fg: '#3A2E20' }); H.fac(B, x0 - 1, (z0 + z1) / 2, C, 'bank', '#C8A040'); }
      { const [x0, z0, x1, z1] = CUT.consul; B.bld({ r: [x0 + 1, z0 + 1, x1 - 1, z1 - 1], h: 54, style: 'glass', face: 'w', col: '#7A98B0', top: false });
        B.sign('德克斯凡領事館', 'w', x0 + 1, (z0 + z1) / 2, 8, { size: 0.7, bg: '#1A2A4A', fg: '#F4E8C8', box: 1, lit: 1 }); H.fac(B, x0 - 1.2, (z0 + z1) / 2, C, 'consul', '#7A98B0'); }
      // ---------- 東岸：湍遊國際大學 ----------
      { const [x0, z0, x1, z1] = CUT.uni; B.zone(CUT.uni, 'grass', 0.02);
        B.bld({ r: [x0 + 4, z0 + 2, x1 - 2, z0 + 22], h: 14, style: 'brick', face: 's', col: '#B88A6A', top: false });
        const tx = x0 + 9, tz = z0 + 36; P(g.box, M('brick', { col: '#A87A5A' }), tx, 13, tz, 7, 26, 7); P(g.cyl24, M('white'), tx, 21, tz - 3.6, 3, 0.15, 3, Math.PI / 2, 0, 0); P(g.box, M('black'), tx, 21.4, tz - 3.7, 0.12, 1.2, 0.04); P(g.cone, M('copper'), tx, 28, tz, 8, 4, 8); B.solid(tx - 3.5, tz - 3.5, tx + 3.5, tz + 3.5, 'house');
        H.sight(B, tx, tz - 6, C, 'nl_uni'); H.fac(B, (x0 + x1) / 2, z0 + 24, C, 'uni', '#C8A060');
        for (let i = 0; i < 8; i++) { const x = rr(x0 + 16, x1 - 3), z = rr(z0 + 28, z1 - 3); if (Math.hypot(x - tx, z - tz) < 7) continue; B.tree(x, z, pk(['bare', 'round', 'pine']), rr(1, 1.3)); }
        B.talker(x0 + 20, z0 + 26, 0, '大學的學生', ['「鐘聲混著汽笛。外籍學生在草坪野餐。」', '「聖教學院的學生不太跟我們說話。」']);
        B.area('湍遊國際大學', CUT.uni); B.label('湍遊國際大學', (x0 + x1) / 2, z0 + 12); }
      { const [x0, z0, x1, z1] = CUT.dorm; B.bld({ r: [x0 + 2, z0 + 1, x1 - 2, z1 - 4], h: 12, style: 'brick', face: 'n', col: '#C89A7A', top: false }); B.sign('湍遊國際大學・學生宿舍', 'n', z0 + 1, (x0 + x1) / 2, 9, { size: 0.5, bg: '#2A2420', fg: '#F4ECD8', box: 1 }); B.zone([x0, z1 - 4, x1, z1], 'grass', 0.02); }
      // ---------- 南：南瀧站 ----------
      H.station(B, { p: 'nl', name: '南瀧站', w: 80, d: 22, h: 12, col: '#9AB0C0', style: 'glass', bg: '#1A2A4A', fg: '#F4E8C8', tt: ['往東鶴：每天六班（魔導電車，一天）', '往西見：每天四班', '往渦旗：接渡輪，兩天', '國際航線：港務局'] });
      B.talker(-4, 114, Math.PI, '剛下車的觀光客', ['「港在北邊，中央通一直走。」', '「拱廊在西瀧川旁邊。」']);
      H.far(B, { coast: COAST, seed: 19, snow: 360 });
    },
    tick() { }
  });
  H.rooms({
    p: 'nl', city: C,
    guild: { name: '公會南瀧分館', hint: '商業區轉角，館員會說三國語言', board: ['霧港倉庫街：夜霧裡的倉庫被遺跡吃了進去。只在白天進。', '貨輪護衛：外國貨輪進港，船上有東西跟著上岸。', '大學委託：鐘樓的鐘晚上自己響。'], lines: ['「南瀧分館的委託，一半是外國人的。」', '「倉庫街的遺跡，霧越濃越危險。」', '「Hello、你好、多謝——我們三種都說。」'] },
    station: { name: '南瀧站', dest: '東鶴　西見　渦旗（渡輪）', lines: ['「往東鶴的票嗎？一天六班。」', '「國際航線請到港務局。」'], waiting: ['「去西見的大學面試。緊張。」'] },
    food: { id: 'nl_tea', name: '霧茶屋', hint: '茶的蒸氣像港口的霧', say: '「霧茶要趁熱。炒麵是碼頭工人的最愛。」', cook: '茶屋的老闆娘', lines: ['「霧茶是用港口的霧水泡的——騙你的，是山泉。」', '「拱廊裡的外國人，最喜歡這一杯。」'] }
  });
})(window.R);
