// 岳北（北州的美食觀光城）的 3D 城（2026-10-20 作者：把剩下的城市地圖做一做，岳北要有日本老街的感覺）
// 設定（azukicities.js、《昭旭重要城市》）：北州美食都城，山、礦、洋一體；翠晶粉條、土鎧大烤肉、藍殼蟹膏拌飯；
//   公會岳北分館（食品大樓旁邊）、岳北漁港、獵人營地、礦山纜車、食品大樓、老字號店鋪街、岳北國際酒店、德克斯凡美食盟會、蘭斯－波旁觀光局。
// 老街的樣子：雪很多的港町──石板路的老街（町家、土藏、兩層的洋風石造店）、暖簾、布旗、瓦斯燈；
//   北邊一條運河，對岸一整排石造倉庫，瓦斯燈沿著河邊亮；再往北是漁港。
// 地圖（北是 -z）：
//   南：岳北站（紅磚的老車站、站前廣場）、觀光局
//   中：老字號店鋪街（站前一路走到運河的石板路，只能走路）；兩邊的巷子
//   北：岳北運河、運河廣場、對岸的石造倉庫街；最北是漁港（棧橋、蟹籠、漁船、燈塔）
//   東：食品大樓、公會岳北分館、德克斯凡美食盟會、岳北國際酒店
//   西：住宅、礦山纜車站（往西邊的雪山）、獵人營地
(function (R) {
  const CK = R.CK, W = R.W, S = () => R.S; if (!CK) return;
  const az = () => R.azuki;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const CANAL = [-34, -22], COAST = -80;

  CK.define({
    id: 'yuebei', name: '岳北', seed: 3104, stationName: '岳北站', fog: 1.6, sea: true, snow: 1.6,
    land: [[-1000, COAST], [1000, COAST], [1000, 980], [-1000, 980]],
    walk: [-150, -112, 150, 150], spawn: [0, 108, 0], camYaw: 0,
    banner: '北州・雪的港町與老街',
    plaza: [0, 108],
    guards: [[-9, 102, Math.PI], [9, -12, 0]],
    patrols: [[[-140, 92], [140, 92]], [[-140, -10], [140, -10]]],
    gossip: ['「藍殼蟹今年特別肥，漁港清晨的聲音像鼓掌。」', '「礦山的纜車今天又停了一陣子──說是山上的風太大。」', '「老街那間玻璃工房，聽說是從德克斯凡來的師傅開的。」', '「土鎧大烤肉要配雪看。坐在窗邊吃。」', '「運河的瓦斯燈，一盞一盞是人點的。」', '「獵人營地的人說，山裡的遺跡生物今年下山下得早。」'],
    firstTip: '第一次來岳北：Tab 看地圖。站前的石板路是老字號店鋪街，一直走到北邊的運河；食品大樓的展望餐廳、礦山纜車（西邊）、漁港清晨（北邊）都有觀光章；公會岳北分館在食品大樓旁邊；回東鶴到南邊的岳北站。',
    mapNote: '南邊是岳北站，站前的石板路是老街，北邊是運河和漁港，東邊是食品大樓，西邊是礦山纜車。',
    ads: ['藍殼蟹', '翠晶粉條', '土鎧大烤肉', '岳北牛乳', '北州鐵道', '德克斯凡'],
    vendLines: ['熱的岳北牛乳，瓶子很燙。', '罐裝的玉米濃湯。底下的玉米粒要敲出來。', '翠晶汽水，喝起來有一點薄荷。'],
    carCols: ['#2A2A30', '#E8E4DC', '#8A2A2A', '#2E4A6A', '#5A5A62', '#6A5A3A'],
    build(B) {
      const M = CK.M, g = B.g, P = B.part, rr = B.rr, pk = B.pk, rnd = B.rnd;
      // 瓦斯燈：黑的鐵柱、方的燈罩（晚上會亮，也算路燈的光）
      const gas = (x, z) => { P(g.cyl8, M('black'), x, 1.8, z, 0.14, 3.6, 0.14); P(g.box, M('black'), x, 3.62, z, 0.52, 0.06, 0.52); P(g.box, M('lamp'), x, 3.95, z, 0.38, 0.6, 0.38); P(g.cone, M('black'), x, 4.38, z, 0.66, 0.3, 0.66); P(g.sph, M('black'), x, 4.6, z, 0.12, 0.12, 0.12); B.lampAt(x, z); B.solid(x - 0.16, z - 0.16, x + 0.16, z + 0.16, 'deco'); };
      // ---------- 道路 ----------
      B.road(-150, 88, 150, 96, { sw: 4, name: '站前通' });
      B.road(-150, -14, 150, -6, { sw: 3, name: '運河通' });
      B.road(-30, -6, -22, 88, { sw: 3, name: '西通' });
      B.road(22, -6, 30, 88, { sw: 3, name: '東通' });
      B.road(-150, -68, 150, -60, { sw: 3, name: '港通' });
      // ---------- 中：老字號店鋪街（石板路、只能走路） ----------
      oldStreet(B, gas);
      // ---------- 北：運河、倉庫街、漁港 ----------
      canal(B, gas);
      harbor(B, gas);
      // ---------- 東：食品大樓、公會、美食盟會、酒店 ----------
      east(B);
      // ---------- 西：住宅、纜車、獵人營地 ----------
      west(B);
      // ---------- 南：岳北站、觀光局 ----------
      station(B, [-40, 124, 40, 146]);
      B.plaza(-46, 96, 46, 124, 'gran');
      tourism(B, [-72, 100, -52, 120]);
      B.area('岳北站', [-48, 96, 48, 150]); B.label('岳北站', 0, 136, 1);
      B.row('n', 96, 52, 140, 14, { style: 'house', h: 9 }, 10, 14, () => ({ h: rr(7, 11) }));
      B.row('n', 96, -140, -76, 14, { style: 'house', h: 9 }, 10, 14, () => ({ h: rr(7, 11) }));
      B.inter(-20, 108, 2.2, '站前的地圖看板', () => R.townTalk('岳北・站前的地圖看板', ['往北直走：老字號店鋪街 → 運河 → 漁港', '往東：食品大樓、公會岳北分館、岳北國際酒店', '往西：礦山纜車、獵人營地', '「岳北國際機場：接駁巴士在站前（德克斯凡直航）」']), '#5A8AC8');
      for (let x = -40; x <= 40; x += 16) { gas(x, 98.6); }
      B.busStop(30, 98, Math.PI, '往岳北國際機場');
      // ---------- 街上的東西 ----------
      for (let x = -140; x <= 140; x += 18) { if (Math.abs(x) < 10 || Math.abs(Math.abs(x) - 26) < 6) continue; B.lamp(x, 86.6, Math.PI); B.lamp(x + 9, -4.4, Math.PI); }
      for (let z = 4; z <= 80; z += 16) { B.lamp(-20.6, z, Math.PI / 2); B.lamp(20.6, z + 8, -Math.PI / 2); }
      [[-20.4, 40, Math.PI / 2], [20.4, 60, -Math.PI / 2], [-30, 98.6, Math.PI], [48, -4.6, Math.PI]].forEach(([x, z, ry]) => B.vend(x, z, ry, pk(['#E8E4DC', '#2E5A9A', '#8A2A2A'])));
      B.inter(-20.4 + 1.2, 40, 1.8, '自動販賣機（熱的牛乳、玉米濃湯）', () => az().food('yuebei'), '#E8A03A');
      B.mailbox(-8.4, 100); B.mailbox(24.6, 20);
      // ---------- 路人、車 ----------
      [[-2, 88, -2, -4], [2, -4, 2, 88], [-140, 92, 140, 92], [-140, -10, 140, -10], [-26, -4, -26, 86], [26, -4, 26, 86], [-140, -19, 140, -19], [-140, -37, 140, -37], [-140, -64, 140, -64]].forEach(([a, b, c, d]) => B.walk([[a, b], [c, d]], Math.max(2, Math.round(Math.hypot(c - a, d - b) / 20))));
      B.route([[-26, 92], [-26, -10], [26, -10], [26, 92]], 3);
      B.route([[-146, 94], [146, 94], [146, 90], [-146, 90]], 2);
      B.route([[-146, -64], [146, -64], [146, -62], [-146, -62]], 2, { kinds: ['truck'] });
      // ---------- 說話的人 ----------
      B.talker(-4, 114, Math.PI, '剛下車的觀光客', ['「北州的雪，跟東鶴的雪不一樣。比較乾，踩起來會叫。」', '「老街一路走到運河，邊走邊吃。我是為了這個來的。」', '「藍殼蟹膏拌飯──我想吃這個想了一年。」']);
      B.talker(3, 70, -Math.PI / 2, '老街的老闆娘', ['「這條街的暖簾，比我奶奶還老。」', '「下雪的日子客人比較少，可是店裡比較暖。」', '「德克斯凡的人來買玻璃，一買就是一箱。」']);
      B.talker(-3, -17, Math.PI, '運河邊的畫家', ['「倉庫的石頭在雪裡最好看。傍晚瓦斯燈一亮，就畫不完了。」', '「以前這條運河是運礦的，現在只運觀光客。」']);
      B.talker(40, -71, 0, '漁港的漁夫', ['「藍殼蟹清晨上岸。你早一點來，能聽到牠們在籠子裡敲殼。」', '「冬天的海很兇。遺跡生物也從海那邊來。」', '「蟹籠別亂碰，夾到手指可不是開玩笑。」']);
      B.talker(-114, 50, Math.PI / 2, '纜車的售票員', ['「纜車一半運礦、一半運人。礦車在下面那條。」', '「山頂看得到整個港。天氣好的話，連古森都看得到。」']);
      B.talker(-100, 74, Math.PI, '獵人營地的獵人', ['「進山之前在這裡登記。回不來的人，名字會留在這本冊子上。」', '「土鎧的肉要燒一整晚。牠們的殼比盾還硬。」', '「山裡的遺跡，入口被雪埋了一半。」']);
      B.talker(31.6, 40, Math.PI / 2, '食品大樓的導覽員', ['「一樓是市場、二樓是名物、頂樓是展望餐廳。」', '「三樣名物一天吃齊，是岳北的『三吃挑戰』。」']);
      // ---------- 遠景 ----------
      [[-1000, 160, 1000, 980], [-1000, COAST, -170, 160], [170, COAST, 1000, 160]].forEach(r => B.zone(r, 'grass', 0.01));
      CK.mountains(B, { r0: 420, r1: 2400, h: 520, seed: 31, low: [[Math.PI * 1.25, Math.PI * 1.75, 0.05]], snow: 160 });
      B.forest([-600, -60, -180, 600], 320, { skip: (x, z) => Math.hypot(x, z) > 560 || (x > -260 && z < 40) });
      B.forest([180, 160, 600, 600], 220, { skip: (x, z) => Math.hypot(x, z) > 560 });
    },
    tick() { }
  });

  // ================= 地標 =================
  // ---- 老字號店鋪街：石板路兩邊是町家、土藏、兩層的洋風石造店；暖簾、布旗、吊招牌、瓦斯燈 ----
  function oldStreet(B, gas) {
    const M = CK.M, g = B.g, P = B.part, rnd = B.rnd, pk = B.pk, rr = B.rr;
    B.plaza(-6, -6, 6, 88, 'gran', { noCurb: true });
    const NM = ['玻璃工房・北一', '音樂盒堂', '蟹屋・藍殼', '翠晶粉條・本店', '昆布・海產', '和菓子・雪月', '乳酪蛋糕・牧場', '烤肉・土鎧', '酒藏・北の誉', '燒玉米', '海膽丼', '古書・雪見', '茶屋', '手織・羊毛'];
    let k = 0;
    const each = side => (i, r) => {
      const t = rnd();
      if (t < 0.22) return { style: 'kura', h: rr(6, 7.5) };   // 土藏（白牆、黑腰）
      if (t < 0.42) return { style: 'brick', h: rr(7.5, 9), col: pk(['#A89A88', '#9A9080', '#B4A894', '#8A7E70']), top: false, name: NM[k++ % NM.length] };   // 兩層的石造店（洋風）
      const nm = NM[k++ % NM.length]; return { name: nm, vsign: nm.split('・')[0], noren: pk(['#2A3A5A', '#5A2A2A', '#2E2E2E', '#4A5A3A', '#6A4A2A']) };
    };
    const W0 = B.row('e', -6, -4, 86, 10, { style: 'machiya', h: 6.4 }, 6, 9, each('w'));
    const E0 = B.row('w', 6, -4, 86, 10, { style: 'machiya', h: 6.4 }, 6, 9, each('e'));
    // 石造店的屋頂：瓦、山牆朝街（北海道的港町那種）
    [[W0, -1], [E0, 1]].forEach(([L, sd]) => L.forEach(o => { if (!o || !o.r) return; const [x0, z0, x1, z1] = o.r, h = o.h || 6.4; if (h < 7.4) return; B.roof((x0 + x1) / 2, (z0 + z1) / 2, z1 - z0, x1 - x0, { type: 'gable', y: h, ry: Math.PI / 2, h: (x1 - x0) * 0.22, o: 0.35, mat: 'kawara' }); }));
    // 瓦斯燈、布旗、長椅
    for (let z = 2; z <= 84; z += 10) { gas(-4.6, z); gas(4.6, z + 5); }
    for (let z = 8; z <= 80; z += 18) { B.nobori(-4.2, z + 2, Math.PI / 2, { h: 4.2, w: 0.8, bh: 2.6 }); B.nobori(4.2, z + 11, -Math.PI / 2, { h: 4.2, w: 0.8, bh: 2.6, side: -1 }); }
    B.bench(-4.4, 47, Math.PI / 2); B.bench(4.4, 30, -Math.PI / 2);
    // 店：玻璃工房（音樂盒）、蟹屋
    const shopAt = (L, i, id, label, icon, ry, dx) => { const o = L[i]; if (!o || !o.r) return; const cz = (o.r[1] + o.r[3]) / 2; CK.door(B, dx, cz, id, label, icon, ry); };
    shopAt(W0, 2, 'yb_glass', '走進玻璃工房・北一（玻璃、音樂盒）', '#7AC8E8', -Math.PI / 2, -5.2);
    shopAt(E0, 3, 'yb_crab', '走進蟹屋・藍殼（藍殼蟹膏拌飯）', '#E8A03A', Math.PI / 2, 5.2);
    B.inter(0, 62, 2.6, '老字號店鋪街（逛逛）', () => az().fac('yuebei', 'shop'), '#E8C04A');
    B.steal(-4.8, 24, '順手拿走店門口的烤玉米', 'stall', () => ({ gift: 'dango', n: 1 }), { time: 1.0 });
    // 屋簷上的積雪、路邊鏟起來的雪堆
    for (let z = 4; z <= 84; z += 7) { if (rnd() < 0.5) P(g.hemi, M('white'), -5.2, 0.05, z + rr(0, 4), 1.6, 0.7, 1.0); if (rnd() < 0.5) P(g.hemi, M('white'), 5.2, 0.05, z + rr(0, 4), 1.6, 0.7, 1.0); }
    B.area('老字號店鋪街', [-17, -6, 17, 88]); B.label('老字號店鋪街', 0, 40);
    // 兩邊的巷子：後面的住家
  }
  // ---- 岳北運河：石岸、瓦斯燈的河邊步道、橋；對岸的石造倉庫 ----
  function canal(B, gas) {
    const M = CK.M, g = B.g, P = B.part, rnd = B.rnd, rr = B.rr;
    B.water([[-170, CANAL[0]], [170, CANAL[0]], [170, CANAL[1]], [-170, CANAL[1]]], { level: -1.6, bank: 'ishi', name: '岳北運河' });
    B.plaza(-150, CANAL[1], 150, -14, 'gran', { noCurb: true }); B.plaza(-150, -40, 150, CANAL[0], 'gran', { noCurb: true });
    [0, -84, 84].forEach(x => B.bridge(x - 5, CANAL[0] - 0.5, x + 5, CANAL[1] + 0.5, { rise: 0.7, deck: 0.14, mat: 'gran', railMat: 'black', rail: true }));
    for (let x = -138; x <= 138; x += 24) { if (Math.abs(x) < 8 || Math.abs(Math.abs(x) - 84) < 8) continue; gas(x, CANAL[1] + 0.9); gas(x + 12, CANAL[0] - 0.9); }
    // 運河上的小船（觀光船）
    [[-46, -28], [58, -28]].forEach(([x, z]) => B.ship('boat', x, z, 0, { y: -1.6, L: 7, col: '#5A3A2A', top: '#C83A2A', stripe: '#E8C060', solid: false }));   // 2026-10-22 船重做（shipkit.js）
    // 對岸的石造倉庫（山牆朝河、瓦屋頂、拱形的鐵門）
    for (let x = -144; x < 140; x += 22) {
      if (Math.abs(x + 11) < 12 || Math.abs(x + 11 - 84) < 12 || Math.abs(x + 11 + 84) < 12) { continue; }
      const x0 = x, x1 = x + 19, z0 = -58, z1 = -41, h = rr(7.5, 9.5), col = B.pk(['#8E887C', '#9A9488', '#847E72']);
      B.box(M('concD'), x0 - 0.05, 0, z0 - 0.05, x1 + 0.05, 0.4, z1 + 0.05);
      B.box(M('ashlar', { col }), x0, 0.4, z0, x1, h, z1);
      B.roof((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, { type: 'gable', y: h, ry: Math.PI / 2, h: (x1 - x0) * 0.24, o: 0.4, mat: 'kawara', gableMat: 'ashlar' });
      [x0 + 5, x1 - 5].forEach(cx => { B.box(M('steelD'), cx - 1.6, 0.4, z1, cx + 1.6, 3.6, z1 + 0.12); P(g.cyl, M('steelD'), cx, 3.6, z1 + 0.06, 3.2, 0.12, 3.2, Math.PI / 2, 0, 0); });
      B.box(M('winLit'), (x0 + x1) / 2 - 1.2, 5.2, z1, (x0 + x1) / 2 + 1.2, 6.6, z1 + 0.08);
      B.solid(x0, z0, x1, z1, 'house'); B.foot([x0, z0, x1, z1], 'house', h);
      if (rnd() < 0.5) B.sign(B.pk(['北の誉 酒藏', '岳北倉庫 三號', '海產問屋', '玻璃倉庫', '舊礦石倉庫']), 's', z1 + 0.06, (x0 + x1) / 2, h - 1.4, { size: 0.55, bg: '#2A2420', fg: '#F4ECD8' });
    }
    B.area('岳北運河', [-150, -42, 150, -14]); B.label('岳北運河', -40, -28); B.label('倉庫街', 40, -50);
    B.inter(0, -17, 2.6, '運河廣場（看看）', () => R.townTalk('岳北運河', ['石造倉庫一整排倒映在水上。', '「以前是運礦石的，倉庫裡堆的都是從山上來的東西。現在一半是酒藏、一半是玻璃店。」', '傍晚瓦斯燈一盞一盞亮起來，雪落在水面上就不見了。']), '#7AC8E8');
  }
  // ---- 漁港：岸壁、棧橋、蟹籠、漁船、燈塔 ----
  function harbor(B, gas) {
    const M = CK.M, g = B.g, P = B.part, rnd = B.rnd, pk = B.pk, rr = B.rr;
    B.plaza(-150, -80, 150, -68, 'asph', { noCurb: true });
    // 棧橋（伸進海裡）
    [-90, -20, 50, 110].forEach(x => { B.bridge(x - 3, -110, x + 3, COAST + 0.5, { deck: 0.3, rise: 0, mat: 'planks', rail: false }); for (let z = -108; z < COAST; z += 6) [-3, 3].forEach(dx => P(g.cyl8, M('woodB'), x + dx, -1.2, z, 0.4, 2.6, 0.4)); });
    // 漁船（停在棧橋旁邊）
    [[-82, -96], [-28, -100], [58, -94], [102, -102]].forEach(([x, z]) => B.ship('fishing', x, z, Math.PI / 2, { y: -1.2, L: 10, col: pk(['#2E4A8A', '#8A2A2A', '#E8E4DC', '#3A6A4A']), solid: false }));   // 2026-10-22 船重做（shipkit.js）：藍殼蟹漁船（船首朝北）
    // 蟹籠（堆成牆）、魚箱
    for (let i = 0; i < 26; i++) { const x = rr(-140, 140), z = rr(-78, -71); if (Math.abs(x + 90) < 5 || Math.abs(x + 20) < 5 || Math.abs(x - 50) < 5 || Math.abs(x - 110) < 5) continue; const c = pk(['#2A5A9A', '#E8782A', '#3A3A44', '#2E7A6A']), n = 1 + Math.floor(rnd() * 3); for (let j = 0; j < n; j++) P(g.box, M('paint', { col: c }), x, 0.45 + j * 0.9, z, 1.4, 0.88, 1.0, 0, rnd() * 0.3, 0); B.solid(x - 0.8, z - 0.6, x + 0.8, z + 0.6, 'deco'); }
    // 燈塔（東邊的堤防盡頭）
    B.plaza(130, -112, 146, -80, 'gran', { noCurb: true });
    for (let i = 0; i < 6; i++) P(g.cyl24, M(i % 2 ? 'white' : 'verm'), 138, 1.6 + i * 2.6, -104, 3.2 - i * 0.18, 2.6, 3.2 - i * 0.18);
    P(g.cyl24, M('glassL'), 138, 17.6, -104, 2.0, 1.6, 2.0); P(g.sph, M('lamp'), 138, 17.6, -104, 1.0, 1.0, 1.0); P(g.cone, M('verm'), 138, 19.2, -104, 2.6, 1.6, 2.6);
    B.solid(136.2, -105.8, 139.8, -102.2, 'deco'); B.lampAt(138, -104);
    // 市場的棚
    B.box(M('corr', { col: '#9AA0A8' }), -60, 4.2, -79, -6, 4.4, -70); for (let x = -58; x <= -8; x += 10) P(g.cyl8, M('steelD'), x, 2.1, -71, 0.2, 4.2, 0.2);
    B.inter(-34, -74, 2.6, '岳北漁港（看看）', () => az().fac('yuebei', 'port'), '#7AC8E8');
    B.inter(-20, -104, 2.6, '觀光景點：漁港清晨（觀光章）', () => az().stamp('yuebei', 'yb_port'), '#E8C04A').sight = 'yb_port';
    for (let x = -140; x <= 140; x += 20) gas(x, -69.2);
    B.area('岳北漁港', [-150, -112, 150, -60]); B.label('岳北漁港', 0, -90);
  }
  // ---- 東：食品大樓（磚造六層、屋頂的展望餐廳）、公會岳北分館、德克斯凡美食盟會、岳北國際酒店 ----
  function east(B) {
    const M = CK.M, g = B.g, P = B.part, rr = B.rr;
    // 食品大樓（正面朝西，對著東通）
    const fx0 = 34, fz0 = 6, fx1 = 74, fz1 = 50;
    B.bld({ r: [fx0, fz0, fx1, fz1], h: 22, style: 'brick', face: 'w', col: '#B4704A', top: false });
    B.box(M('glassL'), fx0 + 4, 22, fz0 + 4, fx1 - 4, 26, fz1 - 4); B.box(M('steelD'), fx0 + 3.6, 26, fz0 + 3.6, fx1 - 3.6, 26.4, fz1 - 3.6);   // 頂樓的展望餐廳（玻璃）
    B.box(M('shopLit'), fx0 - 0.1, 0.4, fz0 + 4, fx0, 4, fz1 - 4);
    B.sign('岳北食品大樓', 'w', fx0, (fz0 + fz1) / 2, 15, { size: 1.6, bg: '#F4ECD8', fg: '#8A2A1A', box: 1, lit: 1 });
    [-1, 1].forEach(sd => B.nobori(fx0 - 1.2, (fz0 + fz1) / 2 + sd * 8, -Math.PI / 2, { h: 4.6, w: 0.9, bh: 3 }));
    CK.door(B, fx0 - 1.4, (fz0 + fz1) / 2, 'yb_food', '走進岳北食品大樓（市場、名物、展望餐廳）', '#E8A03A', -Math.PI / 2);
    B.label('食品大樓', 54, 28);
    // 公會岳北分館（食品大樓旁邊，石造三層，正面朝西）
    const gx0 = 34, gz0 = 58, gx1 = 54, gz1 = 84;
    B.bld({ r: [gx0, gz0, gx1, gz1], h: 12, style: 'brick', face: 'w', col: '#D0C8B8', top: false });
    B.roof((gx0 + gx1) / 2, (gz0 + gz1) / 2, gz1 - gz0, gx1 - gx0, { type: 'hip', y: 12, ry: Math.PI / 2, h: 3.6, o: 0.5, mat: 'copper' });
    B.flag(gx0 - 1.2, gz0 + 2, 11, '#2E6A3E');
    B.sign('公會岳北分館', 'w', gx0, (gz0 + gz1) / 2, 6.2, { size: 0.62, bg: '#2E5A3A', fg: '#F4ECD8', box: 1, lit: 1 });
    CK.door(B, gx0 - 1.4, (gz0 + gz1) / 2, 'yb_guild', '走進公會岳北分館（地方委託）', '#3E9A5A', -Math.PI / 2);
    B.label('公會岳北分館', 44, 71);
    // 德克斯凡美食盟會（白色的洋館）
    B.bld({ r: [84, 8, 112, 36], h: 11, style: 'brick', face: 'w', col: '#ECE6DA', top: false });
    B.roof(98, 22, 28, 28, { type: 'pyramid', y: 11, h: 5, o: 0.4, mat: 'copper' });
    B.sign('德克斯凡美食盟會', 'w', 84, 22, 7.6, { size: 0.5, bg: '#1A2A4A', fg: '#F4E8C8', box: 1 });
    B.inter(82.4, 22, 2.4, '德克斯凡美食盟會（看看）', () => az().fac('yuebei', 'dex'), '#C8A040');
    // 岳北國際酒店（高樓）
    B.bld({ r: [92, 46, 132, 84], h: 46, style: 'office', face: 'w', col: '#C8C0B4', top: false });
    B.sign('岳北國際酒店', 'w', 92, 65, 40, { size: 2.0, bg: '#2A2420', fg: '#F4D88A', box: 1, lit: 1 });
    CK.door(B, 90.6, 65, 'yb_hotel', '走進岳北國際酒店（住宿）', '#7AC8E8', -Math.PI / 2);
    B.plaza(30, 52, 92, 56, 'gran', { noCurb: true });
    B.area('食品大樓・酒店', [30, -6, 150, 88]);
    void g; void P;
  }
  // ---- 西：住宅、礦山纜車站（纜線往西邊的雪山）、獵人營地 ----
  function west(B) {
    const M = CK.M, g = B.g, P = B.part, rr = B.rr, rnd = B.rnd;
    B.row('e', -33, -4, 86, 12, { style: 'machiya', h: 6.4 }, 6, 9, () => (rnd() < 0.3 ? { style: 'kura', h: 6 } : {}));
    B.row('w', -57, -4, 40, 12, { style: 'house', h: 7 }, 8, 12, () => ({ h: rr(6, 9) }));
    // 纜車站（台地上）
    B.terrace(-140, 6, -104, 40, 4, { wall: 'ishi', top: 'gran', open: [[-104.4, 30, -103.6, 38]] });
    B.stairs(-104, 30, -96, 38, 'w', 0.12, 4, { mat: 'gran' });
    B.Bt.yOff = 4;
    B.box(M('concD'), -136, 0, 10, -112, 7, 26); B.box(M('glassL'), -112.1, 0.4, 12, -112, 6, 24);
    B.roof(-124, 18, 26, 18, { type: 'gable', y: 7, h: 2.4, o: 0.5, mat: 'corr' });
    B.sign('礦山纜車 岳北山麓站', 'e', -112, 18, 8.6, { size: 0.55, bg: '#2A3A4A', fg: '#F4ECD8', box: 1, lit: 1 });
    B.Bt.yOff = 0;
    B.solid(-136, 10, -112, 26, 'house');
    // 纜線、吊廂（往西北的山上）：兩條線，吊廂慢慢上下
    const A = [-130, 10.5, 18], Bp = [-520, 150, -180], dx = Bp[0] - A[0], dy = Bp[1] - A[1], dz = Bp[2] - A[2], L = Math.hypot(dx, dy, dz);
    const TH = THREE, cabs = [];
    [-2.2, 2.2].forEach(off => {
      const cable = new TH.Mesh(new TH.CylinderGeometry(0.05, 0.05, L, 4), M('black')), mid = new TH.Vector3(A[0] + dx / 2, A[1] + dy / 2, A[2] + dz / 2 + off);
      cable.position.copy(mid); cable.quaternion.setFromUnitVectors(new TH.Vector3(0, 1, 0), new TH.Vector3(dx, dy, dz).normalize()); B.group.add(cable);
      for (let i = 0; i < 4; i++) { const c = new TH.Mesh(new TH.BoxGeometry(2.2, 2.0, 1.8), CK.mat('gondola' + (i % 2), { tex: 'paint', col: i % 2 ? '#C83A2A' : '#2E5A8A' })); B.group.add(c); cabs.push({ c, off, t0: i / 4 + (off > 0 ? 0.125 : 0), dir: off > 0 ? 1 : -1 }); }
    });
    W.town.anim.push((dt, t) => cabs.forEach(o => { const u = ((o.t0 + o.dir * t * 0.008) % 1 + 1) % 1; o.c.position.set(A[0] + dx * u, A[1] + dy * u - 1.6, A[2] + dz * u + o.off); }));
    // 鐵塔
    [0.25, 0.5, 0.75].forEach(u => { const x = A[0] + dx * u, z = A[2] + dz * u, top = A[1] + dy * u; P(g.box, M('steelD'), x, top / 2, z, 1.2, top, 1.2); P(g.box, M('steelD'), x, top, z, 1, 0.4, 6); });
    B.inter(-102, 34, 2.4, '礦山纜車（看看）', () => az().fac('yuebei', 'mine'), '#7AC8E8');
    B.Bt.yOff = 4; B.inter(-109, 18, 2.6, '觀光景點：礦山纜車（觀光章）', () => az().stamp('yuebei', 'yb_mine'), '#E8C04A').sight = 'yb_mine'; B.Bt.yOff = 0;
    B.area('礦山纜車', [-142, 4, -94, 42]); B.label('礦山纜車', -122, 24);
    // 獵人營地：木屋、帳篷、營火、肉架
    B.zone([-142, 52, -90, 86], 'gravel', 0.02);
    [[-136, 56, -122, 66], [-118, 56, -106, 64]].forEach(([x0, z0, x1, z1]) => { B.box(M('woodD'), x0, 0, z0, x1, 3.2, z1); B.roof((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, { type: 'gable', y: 3.2, h: 1.6, o: 0.5, mat: 'woodB' }); B.solid(x0, z0, x1, z1, 'house'); B.foot([x0, z0, x1, z1], 'house', 3.2); });
    [[-132, 78], [-120, 80]].forEach(([x, z]) => { P(g.cone8, CK.mat('tent', { tex: 'paint', col: '#8A6A3A', rough: 0.9 }), x, 1.4, z, 4, 2.8, 4); B.solid(x - 1.6, z - 1.6, x + 1.6, z + 1.6, 'deco'); });
    P(g.cyl8, M('ashlar'), -108, 0.15, 76, 1.8, 0.3, 1.8); P(g.cone, CK.mat('fireGlow', { col: '#FF8A3A', em: '#FF6A1A', ei: 2.2, snow: 0 }), -108, 0.7, 76, 0.9, 1.0, 0.9); B.lampAt(-108, 76);
    B.smoke(-108, 1.2, 76, { s: 1.2, rise: 6, drift: 1, n: 4, col: '#E8E8E8', per: 4, op: 0.4 });
    [[-104, 72], [-104, 80]].forEach(([x, z]) => P(g.box, M('woodB'), x, 1.2, z, 0.2, 2.4, 0.2)); P(g.box, M('woodB'), -104, 2.3, 76, 0.16, 0.16, 8.4); P(g.box, M('paint', { col: '#6A2A1A' }), -104, 1.7, 76, 0.5, 0.9, 1.2);
    B.inter(-112, 70, 2.4, '獵人營地（進山前登記）', () => az().fac('yuebei', 'hunt'), '#C87A3A');
    B.area('獵人營地', [-144, 50, -88, 88]); B.label('獵人營地', -118, 70);
    void rnd;
  }
  // ---- 觀光局：小小的木造洋館 ----
  function tourism(B, r) {
    const M = CK.M, [x0, z0, x1, z1] = r;
    B.bld({ r, h: 7, style: 'house', face: 'e', col: '#E4DCC8', top: false, plain: 1 });
    B.roof((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, { type: 'gable', y: 7, h: 2.6, o: 0.5, mat: 'copper' });
    B.sign('蘭斯－波旁觀光局', 'e', x1, (z0 + z1) / 2, 4.6, { size: 0.45, bg: '#2A4A3A', fg: '#F4ECD8', box: 1 });
    B.inter(x1 + 1.4, (z0 + z1) / 2, 2.2, '蘭斯－波旁觀光局（地圖送很多）', () => az().fac('yuebei', 'tour'), '#5A8AC8');
    void M;
  }
  // ---- 岳北站：紅磚的老車站、時鐘、三角的屋頂 ----
  function station(B, r) {
    const M = CK.M, g = B.g, P = B.part, [x0, z0, x1, z1] = r, cx = (x0 + x1) / 2;
    B.bld({ r, h: 9, style: 'brick', face: 'n', col: '#A0503A', top: false });
    B.roof(cx, (z0 + z1) / 2, x1 - x0, z1 - z0, { type: 'hip', y: 9, h: 4, o: 0.6, mat: 'copper' });
    // 正中間的山牆、時鐘
    B.box(M('brick', { col: '#A0503A' }), cx - 6, 9, z0 - 0.2, cx + 6, 13, z0 + 1.2);
    B.roof(cx, z0 + 0.5, 13, 3, { type: 'gable', y: 13, h: 2.4, o: 0.3, mat: 'copper' });
    P(g.cyl24, M('white'), cx, 11.2, z0 - 0.25, 2.4, 0.12, 2.4, Math.PI / 2, 0, 0); P(g.box, M('black'), cx, 11.5, z0 - 0.33, 0.12, 0.9, 0.04); P(g.box, M('black'), cx + 0.25, 11.2, z0 - 0.33, 0.6, 0.1, 0.04);
    // 入口：深色的門框、亮著的門、雨棚、燈箱（2026-10-20 皇嶺站的教訓：入口要好找）
    B.box(M('woodB'), cx - 4, 0.3, z0 - 0.3, cx - 3.5, 4.2, z0 + 0.2); B.box(M('woodB'), cx + 3.5, 0.3, z0 - 0.3, cx + 4, 4.2, z0 + 0.2); B.box(M('woodB'), cx - 4, 3.8, z0 - 0.3, cx + 4, 4.2, z0 + 0.2);
    B.box(M('winLit'), cx - 3.45, 0.3, z0 - 0.12, cx + 3.45, 3.75, z0 - 0.06);
    B.box(M('woodB'), cx - 7, 4.4, z0 - 4, cx + 7, 4.65, z0); [-6.4, 6.4].forEach(dx => { P(g.cyl8, M('woodB'), cx + dx, 2.2, z0 - 3.6, 0.3, 4.4, 0.3); B.solid(cx + dx - 0.2, z0 - 3.8, cx + dx + 0.2, z0 - 3.4, 'deco'); });
    B.sign('入口・售票口', 'n', z0 - 4.05, cx, 5.1, { size: 0.7, bg: '#C8A040', fg: '#1A1A1A', box: 1, lit: 1 });
    B.sign('岳北站', 'n', z0 - 0.3, cx, 7.4, { size: 1.6, bg: '#F4ECD8', fg: '#2A1A10', box: 1, lit: 1 });
    B.box(M('rubber'), cx - 3, 0.12, z0 - 6, cx + 3, 0.15, z0);
    [-12, -8, 8, 12].forEach(dx => B.box(M('winLit'), cx + dx - 1.2, 1.4, z0 - 0.06, cx + dx + 1.2, 4, z0));
    B.inter(cx, z0 - 2, 4, '走進岳北站（售票口：回東鶴、轉往他城）', () => { const [wx, wz] = B.toWorld(cx, z0 - 2); CK.enterRoom('yb_station', { x: wx, z: wz, yaw: Math.PI + B.yaw() }); }, '#5A8AC8');
    B.inter(cx - 10, z0 - 2, 2.4, '岳北站的時刻表', () => R.townTalk('岳北站的時刻表', ['往板北（渡輪接駁）：每天兩班', '往古森：每天一班', '往東鶴：經板北，兩天', '機場接駁巴士：站前，每三十分鐘']));
  }

  // ================= 走得進去的店、空間 =================
  const eatMenu = (title, say, menu) => {
    const s = S();
    R.sheet('<p class="kicker">岳北</p><h2>' + R.esc(title) + '</h2><p>' + R.esc(say) + '</p><p class="note">吃了之後，今天下遺跡有加成（一天算最後吃的那一餐）。費拉 ' + s.gold + '</p><div class="dn-menu">'
      + menu.map((m, i) => '<button type="button" class="btn" data-ybf="' + i + '"' + (s.gold < R.cost(m[1]) ? ' disabled' : '') + '><b>' + R.esc(m[0]) + '</b>　' + R.cost(m[1]) + ' 費拉<br><small>' + R.esc(m[2]) + '</small></button>').join('') + '</div>',
      '<div class="row"><button type="button" class="btn pri" id="ybf-x">不吃了</button></div>');
    document.getElementById('ybf-x').onclick = R.closeSheet;
    document.querySelectorAll('[data-ybf]').forEach(b => { b.onclick = () => { const m = menu[+b.dataset.ybf]; if (s.gold < R.cost(m[1])) return; s.gold -= R.cost(m[1]); s.buff = { kind: 'food', b: m[3], until: s.day }; R.ateFood && R.ateFood(s.buff); R.save(); R.sfx && R.sfx('coin'); R.closeSheet(); R.toast('吃了' + m[0] + '。今天下遺跡有加成。', '#E8C04A'); }; });
  };
  const MEIBUTSU = [['翠晶粉條', 15, '岳北名物：透明的翠綠粉條，湯是礦山的泉水熬的', { mp: 0.06, skillCd: 0.03 }], ['土鎧大烤肉', 18, '岳北名物：土鎧的肉烤一整晚，殼當盤子', { hp: 0.08, dmg: 0.04 }], ['藍殼蟹膏拌飯', 16, '岳北名物：藍殼蟹的蟹膏拌熱飯，上面撒海苔', { hp: 0.06, mp: 0.05 }]];
  // 公會岳北分館
  CK.defineRoom({ id: 'yb_guild', name: '公會岳北分館', hint: '暖爐燒得很旺，委託板上一半是山裡、一半是海上的委託', w: 16, d: 12, h: 4.4, floor: 'wfloor', wall: 'plaster', wain: 'woodD', build(B, K) {
    K.counter(0, -3.6, 8, 0.9, { mat: 'woodB', top: 'wood' }); K.register(-2.6, -3.6);
    K.wallSign('公會岳北分館', 'n', 0, 3.3, { size: 0.65, bg: '#2E5A3A', fg: '#F4ECD8' });
    K.board(-5.6, -5.9, 3); K.board(5.6, -5.9, 3);
    B.inter(0, -2.5, 2.2, '櫃台：今日地方委託', () => R.azuki.quest('yuebei'), '#3E9A5A');
    B.inter(-5.6, -4.9, 2, '委託板（看看）', () => R.townTalk('公會岳北分館・委託板', [pick(['獵人營地協助：山裡的遺跡生物下山了，跟獵人一起巡一趟山麓。', '漁港護衛：藍殼蟹漁船出港，海上最近有東西跟著船。', '礦山纜車：山頂站的人說，纜線上有東西爬過去。', '食品大樓急件：土鎧的肉不夠了，要人上山獵。'])]));
    B.talker(2.4, -4.6, 0, '分館的館員', ['「我們館員都偏胖一點──在食品大樓旁邊上班，你試試看。」', '「山裡、海上的委託都有。冬天的山很危險，裝備帶夠。」', '「委託做完，隔壁三吃挑戰我請一樣。……開玩笑的。」']);
    B.talker(-4.6, 2, Math.PI / 2, '烤著手的勇者', ['「暖爐旁邊的位子是搶的。」', '「北州的遺跡入口一半被雪埋著，找的時候要用鏟子。」']);
    K.bench(-5.4, 0.5, 3, Math.PI / 2); K.bench(5.4, 0.5, 3, -Math.PI / 2);
    K.plant(-7.2, 4.8); K.plant(7.2, 4.8); K.rug(0, 1.5, 4, 6, '#2E5A3A');
    K.lamp(-3.5, 0); K.lamp(3.5, 0);
  } });
  // 岳北食品大樓
  CK.defineRoom({ id: 'yb_food', name: '岳北食品大樓', hint: '整棟都是吃的。湯氣像霧', w: 22, d: 14, h: 5, floor: 'tile', wall: 'plaster', wain: 'woodB', amb: 1.05, build(B, K) {
    K.wallSign('岳北食品大樓', 'n', 0, 4, { size: 0.8, bg: '#F4ECD8', fg: '#8A2A1A' });
    [-7, 0, 7].forEach((x, i) => { K.counter(x, -3.5, 5, 1, { mat: 'woodB', top: 'wood' }); K.showcase(x, -2.6, 4, 0, [['#7AE0A8', '#E8C878', '#E87A4A'][i]]); });
    K.wallSign('翠晶粉條', 'n', -7, 2.6, { size: 0.45, bg: '#2A5A4A', fg: '#F4ECD8', lit: 1 }); K.wallSign('土鎧大烤肉', 'n', 0, 2.6, { size: 0.45, bg: '#6A2A1A', fg: '#F4ECD8', lit: 1 }); K.wallSign('藍殼蟹膏', 'n', 7, 2.6, { size: 0.45, bg: '#2A3A6A', fg: '#F4ECD8', lit: 1 });
    B.inter(0, -1.6, 2.6, '名物（買來吃）', () => eatMenu('岳北食品大樓・名物', '「三樣名物，今天想吃哪一樣？」', MEIBUTSU), '#E8A03A');
    B.inter(-7, -1.6, 2.2, '名物三吃挑戰（40 費拉）', () => az().act('yuebei'), '#E8A03A');
    B.inter(7, 3.2, 2.6, '觀光景點：食品大樓展望餐廳（觀光章）', () => az().stamp('yuebei', 'yb_food'), '#E8C04A').sight = 'yb_food';
    B.inter(7, -1.6, 2.2, '食品大樓（逛逛）', () => az().fac('yuebei', 'food'), '#E8A03A');
    B.talker(0, -4.6, 0, '烤肉攤的老闆', ['「土鎧的殼燒起來比柴還耐。肉要等一晚。」', '「三吃挑戰？吃完記得走樓梯，別搭電梯。」']);
    B.talker(-7, -4.6, 0, '粉條攤的阿姨', ['「翠晶粉條是用礦山的泉水做的。礦工說吃了魔力比較順。」']);
    B.talker(7, -4.6, 0, '蟹膏攤的小哥', ['「早上才上岸的，你看，還在動。」']);
    [[-5, 3], [0, 3], [-9, 3.5]].forEach(([x, z]) => K.cafeSet(x, z, { top: 'wood' }));
    K.lamp(-7, -1); K.lamp(0, -1); K.lamp(7, -1); K.lamp(0, 3.5);
  } });
  // 玻璃工房・北一（玻璃、音樂盒）
  CK.defineRoom({ id: 'yb_glass', name: '玻璃工房・北一', hint: '架子上一排一排的玻璃杯、油燈，角落的音樂盒在唱', w: 14, d: 10, h: 3.8, floor: 'wfloor', wall: 'ashlar', wain: 'woodB', amb: 1.1, build(B, K) {
    K.wallSign('玻璃工房・北一', 'n', 0, 3, { size: 0.5, bg: '#2A2420', fg: '#F4ECD8' });
    K.shelf(-4, -4.4, 5, 0, { h: 2.2, cols: ['#7AC8E8', '#9AE0C8', '#E8C878', '#C8A8E8', '#F4F4F4', '#E87A8A'] }); K.shelf(4, -4.4, 5, 0, { h: 2.2, cols: ['#7AC8E8', '#F4F4F4', '#E8A04A', '#9AE0C8'] });
    K.showcase(0, 0, 4, 0, ['#7AC8E8', '#E8C878', '#C8A8E8']);
    K.counter(4.5, 3, 3.5, 0.8, { mat: 'woodB', top: 'wood' });
    B.inter(0, 1.2, 2.4, '看看玻璃（買一個小玻璃杯 8 費拉）', () => { const s = S(); if (s.gold < 8) { R.toast('錢不夠。'); return; } s.gold -= 8; R.save(); R.townTalk('玻璃工房・北一', ['買了一個小玻璃杯。拿到窗邊，雪的光透進去，杯底有一點點藍。', '「這是用礦山的砂吹的。藍色是砂裡的魔力。」']); }, '#7AC8E8');
    B.inter(-4, -3, 2.2, '音樂盒（聽聽）', () => R.townTalk('玻璃工房・北一・音樂盒', [pick(['轉了一下發條，是很慢的搖籃曲。', '轉了一下發條，是昭旭的民謠〈雪之港〉。', '轉了一下發條，是德克斯凡的舞曲──師傅說是從老家帶來的。'])]), '#E8C04A');
    B.talker(4.5, 4, Math.PI, '玻璃師傅', ['「我從德克斯凡來，二十年了。這裡的砂吹出來的玻璃，在別的地方吹不出來。」', '「冬天的窯最好燒。外面越冷，玻璃越清。」']);
    K.lamp(-3, -1); K.lamp(3, -1);
  } });
  // 蟹屋・藍殼
  CK.defineRoom({ id: 'yb_crab', name: '蟹屋・藍殼', hint: '水槽裡的藍殼蟹敲著殼，蒸籠的熱氣', w: 12, d: 9, h: 3.4, floor: 'tatami', wall: 'plaster', wain: 'woodB', build(B, K) {
    K.counter(0, -2.6, 8, 0.7, { mat: 'woodB', top: 'woodD' });
    B.box(CK.M('glassL'), 3.2, 0.8, -4.2, 5.6, 1.8, -3.4); B.box(CK.M('paint', { col: '#2A4A8A' }), 3.3, 0.8, -4.1, 5.5, 1.1, -3.5);
    K.wallSign('蟹屋・藍殼', 'n', 0, 2.6, { size: 0.5, bg: '#2A3A6A', fg: '#F4ECD8', lit: 1 });
    B.inter(0, -1.4, 2.2, '點菜', () => eatMenu('蟹屋・藍殼', '「今天的藍殼蟹肥喔，殼都快撐開了。」', [['藍殼蟹膏拌飯', 16, '岳北名物：蟹膏拌熱飯', { hp: 0.06, mp: 0.05 }], ['整隻蒸藍殼蟹', 22, '殼是藍的，煮熟了還是藍的', { hp: 0.09, regen: 0.1 }], ['蟹味噌湯', 6, '暖身子，便宜', { hp: 0.03 }]]), '#E8A03A');
    B.talker(0, -3.6, 0, '蟹屋的大將', ['「藍殼蟹煮熟了也是藍的。客人第一次都以為沒熟。」', '「拌飯的蟹膏，一隻只有一小匙。」']);
    [[-3, 1.8], [0, 1.8], [3, 1.8]].forEach(([x, z]) => { K.lowTable(x, z, 1.6, 1); K.cushion(x - 0.6, z + 0.9); K.cushion(x + 0.6, z + 0.9); });
    K.lamp(-2, -1); K.lamp(2, -1);
  } });
  // 岳北國際酒店
  CK.defineRoom({ id: 'yb_hotel', name: '岳北國際酒店・大廳', hint: '整面的落地窗，看得到雪山和海', w: 20, d: 14, h: 5.6, floor: 'marble', wall: 'plaster', wain: 'woodB', trim: 'gold', amb: 1.0, build(B, K) {
    K.counter(-4, -3, 6, 0.9, { mat: 'woodB', top: 'marble', h: 1.1 });
    K.wallSign('岳北國際酒店', 'n', 0, 4.2, { size: 0.7, bg: '#2A2420', fg: '#F4D88A' });
    B.inter(-4, -1.8, 2.4, '住一晚（60 費拉）', () => { const d = W.town.outer && W.town.outer.P; CK.innStay('yuebei', 60, d || { x: 90.6, z: 65, yaw: -Math.PI / 2 }); }, '#7AC8E8');
    B.inter(5, 4, 2.4, '岳北國際酒店（看看）', () => az().fac('yuebei', 'hotel'), '#7AC8E8');
    B.talker(-4, -4, 0, '酒店的櫃台', ['「一晚六十費拉，附早餐。早餐有藍殼蟹。」', '「海景房今天滿了。雪山景也很好喔。」']);
    B.talker(5, 1, Math.PI, '德克斯凡的觀光客', ['「直航過來四個鐘頭。為了這三樣名物，值得。」']);
    K.bench(3, 4.5, 4, 0); K.bench(-6, 4.5, 4, 0); K.plant(-9, -6, 1.3); K.plant(9, -6, 1.3);
    K.lamp(-4, 0); K.lamp(4, 0); K.lamp(0, 4);
  } });
  // 岳北站・大廳
  CK.defineRoom({ id: 'yb_station', name: '岳北站・大廳', hint: '木頭的長椅、燒得很旺的暖爐，「往板北的渡輪接駁，即將出發──」', w: 22, d: 12, h: 6, floor: 'wfloor', wall: 'plaster', wain: 'woodB', trim: 'woodD', amb: 1.0, build(B, K) {
    K.counter(-7, 1.0, 5, 0.9, { mat: 'woodB', top: 'wood' });
    K.wallSign('岳北站', 'n', 0, 4.8, { size: 1.0, bg: '#F4ECD8', fg: '#2A1A10' });
    K.wallSign('板北　古森　東鶴（經板北）', 'n', 0, 3.8, { size: 0.42, bg: '#2A2420', fg: '#F4D88A', lit: 1 });
    B.inter(-7, 2.2, 2.4, '售票口（回東鶴、轉往他城）', () => CK.ticket(), '#5A8AC8');
    B.talker(-7, 0, 0, '售票口的站務員', ['「東鶴？板北轉車，兩天。這個季節常常誤點，你別抱太大期望。」', '「暖爐旁邊可以坐。下雪的日子班次會慢一點。」']);
    K.shelf(8, 1.5, 4, -Math.PI / 2, { cols: ['#E8E4DC', '#7AE0A8', '#2A3A6A', '#E8C878'] });
    B.inter(6.6, 1.5, 2, '車站的小賣店（牛乳、名物便當）', () => R.azuki.food('yuebei'), '#E8A03A');
    K.bench(-2, 3.8, 4, 0); K.bench(3, 3.8, 4, 0);
    B.talker(1, 2, Math.PI, '等車的礦工', ['「回家的車。礦山下來，一身雪。」', '「東鶴？那邊下雪嗎？聽說是濕的雪。」']);
    K.lamp(-7, 0); K.lamp(0, 2); K.lamp(7, 0);
  } });
})(window.R);
