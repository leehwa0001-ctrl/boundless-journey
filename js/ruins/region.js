// 無境之旅：地區生態（作者 2026-10-04：其他地區的遺跡的長相和怪物分佈應該也要不一樣，可能像是奉主的佩特拉核心就會長的不一樣；
//   奉主前身是軍事城市，可以多一點武士或軍事方面的特色怪物；我不希望所有怪都在東鶴裏出現；
//   同一個遺跡內部更常出現同種類型魔物應該會比較好）
// - 地區（R.REGIONS）：東鶴、皇嶺、吉山、天宮東嶺、北州、納瓦、外海、奉主。每個地區有自己的一批遺跡生物（species），
//   遺跡的生物池＝分級的生物池 ∩ 地區那一批；同一座遺跡另外有三、四種「主要的」（R.SITE_MAIN），出現的機會是別的三倍。
//   哪一種生物在某個分級裡沒有被任何地區收進去，就自動放進那個分級所有地區的池子（圖鑑才收集得齊）。
// - 奉主多兩座遺跡：舊兵營（摩爾斯級）、奉主兵工廠（克森特級），和八種軍事、武士類的遺跡生物（只在奉主出現），
//   兵工廠的領主體「無主大鎧」。
// - 佩特拉核心照地區換顏色：皇嶺金紋、吉山青玉、天宮苔綠、北州霜白、納瓦黑曜、外海深淵、奉主鋼鐵（鐵板接縫、熔鐵的紋路）。
// - 觀光遺跡（動物園）、狩獵場、卡索級不分地區。
// 做法：每次 R.loadFloor 之前，把 run.grade 換成一份複本（pool 換成這座遺跡的池子；兵工廠的 lords 換成無主大鎧），原本的分級資料不動。
// 放在所有遺跡生物、lords.js、lordfloor.js、windelder.js 後面（index.html 後段）。
(function (R) {
  const W = () => R.W, rnd = Math.random, wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  const later = (f, ms) => { const run = W().run; setTimeout(() => { if (W().run === run && run && !run.done) f(); }, ms); };
  const targets = () => { const w = W(); return [w.P].concat((w.allies || []).filter(a => !a.downed), R.netTargets ? R.netTargets() : []).filter(t => t && !t.dead); };   // 多人連線：房主這邊也算別人（net2.js）
  const hitT = (t, dmg, e, o) => (t.ally ? R.hurtAlly(t, dmg, e) : R.hurtPlayer(dmg, e, o));

  // ---------- 奉主的遺跡生物 ----------
  const NEW = {
    ashigaru: { name: '遺甲足輕', hp: 85, dmg: 14, speed: 3.0, xp: 14, size: 0.95, ai: 'pounce', armor: 0.2, color: '#4A4038', eye: '#FF7A3A', desc: '奉主舊兵營的步兵甲冑，裡面是空的。斗笠下面只有兩點火光，長槍照樣刺過來。常常三五個一隊。' },
    teppo: { name: '火繩影', hp: 55, dmg: 16, speed: 2.6, xp: 13, size: 0.8, ai: 'kite', shoot: 0.45, shot: 'bullet', color: '#2A2430', eye: '#FFB04A', desc: '抱著火繩槍的影子。火繩一亮就是要開槍了，邊退邊打。舊兵營的射擊場裡最多。' },
    hatarei: { name: '破軍旗靈', hp: 70, dmg: 8, speed: 2.4, xp: 15, size: 0.9, ai: 'aegis', fly: 1, color: '#8A2A2A', eye: '#FFE04A', desc: '一面破掉的軍旗，旗面上長了眼睛。旗子一揮，旁邊的同伴就罩上一層光（傷害減半）。先砍旗。' },
    gunba: { name: '軍馬骸', hp: 130, dmg: 18, speed: 5.0, xp: 17, size: 1.2, ai: 'charge', color: '#D8D0BC', eye: '#FF3A3A', desc: '還披著破鞍布的戰馬骨架。低頭就是要衝了，衝過去要一段路才停得下來。' },
    danto: { name: '斷刀浪人', hp: 95, dmg: 22, speed: 3.4, xp: 18, size: 1.0, ai: 'pounce', color: '#3A3A4A', eye: '#BFE8FF', desc: '戴著斗笠、披著一身斷刀的浪人影子。蹲低、手按刀柄的時候，下一刀很痛。' },
    housha: { name: '砲背蟹', hp: 140, dmg: 18, speed: 1.8, xp: 18, size: 1.1, ai: 'kite', shoot: 0.35, shot: 'fire', armor: 0.35, color: '#6A5A4A', eye: '#FFB04A', desc: '背上長著一門砲的大螃蟹，奉主港和兵工廠的地下都有。殼很硬，砲口對著你的時候快躲開。' },
    dankara: { name: '彈殼蟲', hp: 30, dmg: 20, speed: 4.2, xp: 8, size: 0.5, ai: 'mine', color: '#C8A040', eye: '#FF3A3A', desc: '黃銅彈殼一樣的小甲蟲，屁股上的引信一直冒火花。爬過的地方留下會炸的殼。' },
    rotsuki: { name: '鍛爐魔像', hp: 320, dmg: 24, speed: 1.6, xp: 34, size: 1.6, ai: 'slam', armor: 0.35, elite: 1, coreChance: 0.25, color: '#5A4A40', eye: '#FFE04A', desc: '兵工廠的熔爐自己站了起來。肚子裡的火燒得越旺，砸下來的拳頭越重。克森特級才看得到。' }
  };
  Object.keys(NEW).forEach(id => { if (!R.ENEMIES[id]) R.ENEMIES[id] = Object.assign({ ref: '' }, NEW[id]); });
  R.ENEMIES.muhyo = { name: '領主體・無主大鎧', ref: '', boss: 1, hp: 2100, dmg: 34, speed: 2.6, size: 2.6, xp: 150, ai: 'l_muhyo', armor: 0.4, mres: 0.25, color: '#2A2A34', eye: '#FF5A3A', lordPlus: 1,
    desc: '奉主兵工廠的領主體。一套比人高一倍的大鎧，裡面什麼都沒有。拔刀、突進、號令遺甲足輕；鎧甲打掉一半以後外殼崩落，變得更快、更兇。' };
  if (R.LORD_GEAR) R.LORD_GEAR.muhyo = ['無主胴丸', 'body_heavy', { def: 8, hp: 0.1 }, '物防 +8、生命 +10%'];


  // ---------- 無主大鎧的打法 ----------
  const AI = R.AI_X = R.AI_X || {};
  AI.l_muhyo = (e, P, d, a, sp, dt, walk, H) => {
    e.yaw = a; const f = e.hp / e.hpMax;
    // 號令：生命剩 75%、50%、25% 各叫兩個遺甲足輕
    e.calls = e.calls || 0; const want = f < 0.25 ? 3 : f < 0.5 ? 2 : f < 0.75 ? 1 : 0;
    if (want > e.calls) { e.calls++; R.banner && R.banner('無主大鎧舉起了軍配', '「出陣」——遺甲足輕從地底爬了出來'); for (let i = 0; i < 2; i++) { const ang = rnd() * Math.PI * 2, [x, z] = R.nearestFloor ? R.nearestFloor(e.x + Math.sin(ang) * 3.5, e.z + Math.cos(ang) * 3.5) : [e.x, e.z]; R.fx('spawn', x, 0, z, {}); later(() => { const n = R.spawnEnemy('ashigaru', x, z, e.room, { aggro: true, noAffix: true }); if (n) n.summoned = true; }, 500); } }
    // 外殼崩落：一半以下，護甲變薄、變快
    if (!e.bare && f < 0.5) { e.bare = true; e.def = Object.assign({}, e.def, { armor: 0.15 }); e.speed = (e.def.speed || 2.6) * 1.4 * (e.pactSpd || 1); R.banner && R.banner('無主大鎧的外殼崩落了', '護甲變薄——但是更快、更兇'); R.fx('boom', e.x, 1, e.z, { r: 3.5, color: '#4A4A5A' }); R.shake && R.shake(0.4); }
    const fk = e.bare ? 1.25 : 1;
    if (e.dash) { const s = e.dash; s.t += dt; const k = Math.min(1, s.t / 0.45); const x = s.x0 + (s.x1 - s.x0) * k, z = s.z0 + (s.z1 - s.z0) * k; e.x = x; e.z = z; if (R.collide) R.collide(e, e.def.size * 0.5); targets().forEach(t => { if (!s.hit.includes(t) && Math.hypot(t.x - e.x, t.z - e.z) < 1.8) { s.hit.push(t); hitT(t, e.dmg * 1.3 * fk, e, { knock: 0.8 }); } }); if (k >= 1) e.dash = null; return true; }
    if (e.busy > 0) { e.busy -= dt; return false; }
    let mv = false; if (walk && sp > 0 && d > 3) { H.move(e, a, sp, dt); mv = true; }
    e.cut = (e.cut || 0) - dt; if (d < 3.2 && e.cut <= 0) { e.cut = 1.3 / fk; hitT(P, e.dmg * fk, e, { knock: 0.4 }); R.fx('swing', e.x, 0, e.z, { a, arc: 1.8, range: 3.2, color: '#D8DEE6' }); }
    e.pat = (e.pat == null ? 2.5 : e.pat) - dt;
    if (e.pat <= 0) {
      e.pat = (3.4 - (1 - f) * 1.2) / fk + rnd() * 0.6; const k = Math.floor(rnd() * 4);
      if (k === 0) { e.busy = 1.1; const aa = a; R.fx('sector', e.x, 0, e.z, { a: aa, arc: 2.2, range: 5.5, t: 0.75 }); later(() => { if (e.dead) return; R.fx('swing', e.x, 0, e.z, { a: aa, arc: 2.2, range: 5.5, color: '#FFFFFF' }); R.shake && R.shake(0.25); targets().forEach(t => { const dd = Math.hypot(t.x - e.x, t.z - e.z), a2 = Math.atan2(t.x - e.x, t.z - e.z); if (dd < 5.7 && Math.abs(wrap(a2 - aa)) < 1.15) hitT(t, e.dmg * 1.6 * fk, e, { knock: 0.6 }); }); }, 750); }   // 居合
      else if (k === 1) { e.busy = 0.8; const aa = a, len = Math.min(10, d + 3); R.fx('aim', e.x, 0.3, e.z, { a: aa, len, t: 0.75 }); later(() => { if (e.dead) return; const [x1, z1] = R.nearestFloor ? R.nearestFloor(e.x + Math.sin(aa) * len, e.z + Math.cos(aa) * len) : [e.x, e.z]; e.dash = { t: 0, x0: e.x, z0: e.z, x1, z1, hit: [] }; }, 750); }   // 突進
      else if (k === 2) { e.busy = 0.9; R.fx('mark', e.x, 0, e.z, { r: 4.5, t: 0.65 }); later(() => { if (e.dead) return; R.fx('ring', e.x, 0.1, e.z, { r: 4.5, color: '#D8DEE6' }); targets().forEach(t => { if (Math.hypot(t.x - e.x, t.z - e.z) < 4.5) hitT(t, e.dmg * 1.2 * fk, e, { knock: 1 }); }); }, 650); }   // 旋斬
      else { e.busy = 0.7; later(() => { if (e.dead) return; const Pl = W().P, aa = Math.atan2(Pl.x - e.x, Pl.z - e.z); for (let i = -4; i <= 4; i++) R.fire({ kind: 'arrow', owner: 'e', x: e.x, z: e.z, a: aa + i * 0.12, speed: 12, dmg: e.dmg * 0.6 * fk, life: 1.5, src: e }); }, 500); }   // 號令矢
    }
    return mv;
  };

  // ---------- 奉主的兩座遺跡 ----------
  const SITES = [
    { id: 'hs-barracks', map: 'nation', x: 35.27, z: -21.66, kind: 'ruin', grade: 'mors', type: 'maze', name: '奉主・舊兵營遺跡', src: '遊戲', desc: '奉主還是軍事城市的時候的兵營，地底下整片被遺跡吃掉。營房、射擊場、馬廄一層一層往下長，空的甲冑還在操練。', status: 'lock', lx: -70, ly: 6 },
    { id: 'hs-arsenal', map: 'nation', x: 35.55, z: -21.38, kind: 'ruin', grade: 'kesent', type: 'city', env: 'forge', name: '奉主・兵工廠遺跡', src: '遊戲', desc: '臨海工業區底下的舊兵工廠。入口會自己閉合，只能用傳送水晶投送；熔爐到現在還燒著，造兵器的機關也還在動——地刺、絞肉機、輸送帶。最深處有一套沒有主人的大鎧在等。', status: 'lock', lx: 26, ly: 6 }
  ];
  SITES.forEach(s => { if (!R.SITES.find(x => x.id === s.id)) R.SITES.push(s); });
  if (R.syncStatus) try { R.syncStatus(); } catch (e) { }
  // 圖鑑：新的生物放進分級的池子（才分得到「摩爾斯」「克森特」那一段）；其他地區的遺跡會被地區的名單擋掉
  const G = id => R.GRADES.find(g => g.id === id), addPool = (gid, ids) => { const g = G(gid); if (g && g.pool) ids.forEach(i => { if (!g.pool.includes(i)) g.pool.push(i); }); };
  addPool('mors', ['ashigaru', 'teppo', 'hatarei', 'gunba', 'danto']);
  addPool('kesent', ['ashigaru', 'teppo', 'hatarei', 'gunba', 'danto', 'housha', 'dankara', 'rotsuki']);
  { const kes = G('kesent'); if (kes && kes.lords && !kes.lords.includes('muhyo')) kes.lords.push('muhyo'); }

  // ---------- 地區 ----------
  const L = s => s.split(' ');
  const REGIONS = {
    donghe: { n: '東鶴', c: '#C98A2E', sites: ['dh-sokkutsu', 'dh-josai', 'dh-kouzan'], core: null, d: '北國的港町。礦坑、霜溪、城西的舊城牆底下，多半是小型的、成群的遺跡生物。',
      species: L('kousaku onibi kasa kodama tesso tanuki mossball lampmoth stonesnail tofuko tsuchikoro glowslug ruinrat pebblemite nurikabe chochin hyakume crysthog muddoll echobat acidbubble makura azuki splitgel sporepuff lanternwisp nopperabo shadelizard') },
    jishan: { n: '吉山', c: '#3E9A8A', sites: ['seigan'], core: 'jade', d: '面對海峽的陪都。西岸的城區遺跡裡，水邊的、會飛的、纏人的生物多。',
      species: L('kousaku onibi kasa tesso tanuki lampmoth mossball glowslug ruinrat pebblemite tofuko kappa nozuchi ittan hitotsume enenra jinmenju baku kyorinrin bonebird bellcricket rustknight akane inugami ubume mineba aobo jellylamp') },
    huangling: { n: '皇嶺', c: '#C8A040', sites: ['hokuroku'], core: 'gold', d: '首都。北麓的陵墓遺跡越往下越寬，守墓的骨兵、宮裡的影子、鏡子裡的東西。',
      species: L('honemusha karasu rokuro mikoshi okubi kyokotsu oshiroi tenjo tenome futakuchi bonefiddler mirrorwraith mirrorgolem echoshade mistwisp bonehound ashcrow nopperabo hitotsume enenra onibi kousaku nurikabe ittan makura aobo voidmoth prismeye ubume lanternwisp akaoni hyakume chochin kyorinrin bonebird azuki akane') },
    tenkyu: { n: '天宮東嶺', c: '#5A8A4A', sites: ['tougrei'], core: 'moss', d: '天宮島東邊的山嶺。迷宮遺跡裡是成群狩獵的野獸、會飛的、帶電的。',
      species: L('kamaitachi okuriinu bakeneko kitsune tengu nue raiju hihi ushioni riftscorp thunderspider starspider crystmantis ringbird twinhound blackmaw tarbeast ogama kappa nozuchi tanuki tesso jinmenju kodama mineba inugami baku crysthog shadelizard sporepuff kasa bellcricket echobat jellylamp') },
    hokushu: { n: '北州', c: '#7AB8E0', sites: ['toudo'], core: 'frost', d: '北州的雪原。凍原遺跡裡是耐寒的獸、結晶、霜衣。',
      species: L('kamaitachi okuriinu bakeneko kitsune tengu nue raiju karasu ushioni twinhound crystmantis starspider ringbird prismeye voidmoth mirrorgolem mistwisp judgeeye corebeast thornqueen onibi kousaku nurikabe hyakume ittan okubi kyorinrin rokuro tanuki') },
    nawa: { n: '納瓦', c: '#D85A2A', sites: ['kazan'], core: 'lava', d: '整座納瓦火山被遺跡吃掉了。鍛冶、灰燼、熔岩裡的東西。',
      species: L('datara ashcrow blackmaw tarbeast riftscorp thunderspider bladewheel hornbones akaoni hihi yamata hannya bonecentipede onibi enenra kousaku nozuchi raiju corebeast gearsentry shieldbeetle setosho tenome futakuchi') },
    gaikai: { n: '外海', c: '#2A7A9A', sites: ['ukishima'], core: 'abyss', d: '海上的浮島遺跡。水裡的、井底的、霧裡的東西。',
      species: L('kanibo ogama tsurube kyokotsu oshiroi tenjo nopperabo hitotsume jinmenju baku mikoshi echoshade bonefiddler mirrorwraith voidwalker twinshade oboro hannya yamata voidmoth starspider honemusha chochin ittan acidbubble') },
    hosu: { n: '奉主', c: '#8A8A96', sites: ['hs-barracks', 'hs-arsenal'], core: 'steel', d: '從前的軍事城市。舊兵營和兵工廠的遺跡裡，是甲冑、兵器、機關，還有只在奉主出現的武士類生物。',
      species: L('ashigaru teppo hatarei gunba danto housha dankara rotsuki rustknight hornbones setosho datara gearsentry bladewheel shieldbeetle kanibo tsurube honemusha karasu kamaitachi okuriinu bonehound akaoni mirrorgolem kousaku onibi chochin muddoll ashcrow clockknight judgeeye corebeast bonecentipede ringbird crystmantis acidbubble splitgel'), lords: { 'hs-arsenal': ['muhyo'] } }
  };
  const SITE_MAIN = {
    'dh-sokkutsu': L('mossball glowslug kodama pebblemite'), 'dh-josai': L('nurikabe chochin nopperabo makura'), 'dh-kouzan': L('kousaku crysthog tesso echobat'),
    seigan: L('kappa jellylamp nozuchi ubume'), hokuroku: L('honemusha kyokotsu bonefiddler mirrorwraith'), tougrei: L('okuriinu kitsune tengu kamaitachi'),
    toudo: L('crystmantis prismeye mistwisp karasu'), kazan: L('datara ashcrow tarbeast riftscorp'), ukishima: L('kanibo tsurube echoshade twinshade'),
    'hs-barracks': L('ashigaru teppo gunba hatarei'), 'hs-arsenal': L('housha dankara gearsentry danto')
  };
  R.REGIONS = REGIONS; R.SITE_MAIN = SITE_MAIN;
  const regionOf = site => { if (!site) return null; const k = Object.keys(REGIONS).find(k => REGIONS[k].sites.includes(site.id)); return k ? Object.assign({ id: k }, REGIONS[k]) : null; };
  R.siteRegion = s => regionOf(typeof s === 'string' ? R.SITES.find(x => x.id === s) : s);
  // 哪一種在那個分級裡沒有地區收：放進那個分級所有地區的池子
  const orphans = {};
  const orphanOf = gid => {
    if (orphans[gid]) return orphans[gid]; const g = G(gid); if (!g || !g.pool) return [];
    const sites = R.SITES.filter(s => s.kind === 'ruin' && s.grade === gid && regionOf(s)), cover = new Set();
    sites.forEach(s => regionOf(s).species.forEach(id => cover.add(id)));
    return (orphans[gid] = g.pool.filter(id => !cover.has(id)));
  };
  // 這座遺跡的生物池（不重複；圖鑑、地圖看的）
  R.sitePool = site => {
    const g = site && G(site.grade); if (!g || !g.pool) return [];
    const rg = regionOf(site); if (!rg || site.id === 'kanko') return g.pool.slice();
    const set = new Set(rg.species), list = g.pool.filter(id => set.has(id)).concat(orphanOf(site.grade));
    return list.filter(id => R.ENEMIES[id]).length >= 5 ? Array.from(new Set(list)) : g.pool.slice();
  };
  R.siteLords = site => { const rg = regionOf(site), g = site && G(site.grade); if (rg && rg.lords && rg.lords[site.id]) return rg.lords[site.id].slice(); return g && g.lords ? g.lords.slice() : null; };
  // 委託板：這種生物在哪幾座遺跡出現（同一個分級以上）
  R.monSites = (id, gid) => { const lv = (G(gid) || {}).lv || 0, list = R.SITES.filter(s => s.kind === 'ruin' && s.id !== 'kanko' && G(s.grade) && (G(s.grade).lv || 0) >= lv && R.sitePool(s).includes(id)); if (!list.length) return ''; const main = list.filter(s => R.siteMain(s).includes(id)).sort((a, b) => G(a.grade).lv - G(b.grade).lv); if (main.length) return '・常見於' + main.slice(0, 2).map(s => '「' + s.name + '」').join('、'); list.sort((a, b) => G(a.grade).lv - G(b.grade).lv); return '・可能出現於' + list.slice(0, 2).map(s => '「' + s.name + '」').join('、'); };
  R.siteMain = site => (site && SITE_MAIN[site.id] || []).filter(id => R.ENEMIES[id]);

  // ---------- 下遺跡的時候：run.grade 換成這座遺跡的複本 ----------
  const localize = run => {
    if (!run || !run.site || !run.grade || run.grade._loc) return;
    const rg = regionOf(run.site); if (!rg || run.site.id === 'kanko' || run.grade.id === 'hunt' || run.grade.id === 'kaso') return;
    const pool = R.sitePool(run.site), main = R.siteMain(run.site).filter(id => pool.includes(id));
    run.grade = Object.assign({}, run.grade, { pool: pool.concat(main, main), _loc: rg.id });   // 主要的再放兩份＝三倍
    run.region = rg.id;
  };
  // 熔爐（兵工廠的環境）：原本是火山換顏色，2026-10-04 改成自己的環境（forge.js 的 R.ENVS.forge：鋼板的廠房、地刺、絞肉機、輸送帶）。
  const lf0 = R.loadFloor;
  R.loadFloor = (f, o) => { try { localize(W().run); } catch (e) { console.warn('[region]', e); } return lf0(f, o); };
  // lords.js 每一層會重排領主名單：排完以後換成這座遺跡自己的
  const gf0 = R.genFloor;
  R.genFloor = (run, f) => { const F = gf0(run, f); try { const rg = regionOf(run.site); if (rg && rg.lords && rg.lords[run.site.id] && run.grade.lords) run.grade.lords = rg.lords[run.site.id].slice(); } catch (e) { } return F; };

  // ---------- 佩特拉核心照地區換顏色 ----------
  // 原本的核心：象牙白的殼（亮、灰）、紅色的血管、深紅的瞳、黑色的瞳孔、白色的反光
  const CORE = {
    gold: { shell: [242, 230, 200], vein: [200, 160, 64], iris: [90, 40, 120] },
    jade: { shell: [200, 232, 220], vein: [40, 120, 100], iris: [20, 90, 110] },
    moss: { shell: [196, 210, 176], vein: [110, 80, 40], iris: [70, 110, 40] },
    frost: { shell: [226, 240, 250], vein: [90, 200, 240], iris: [30, 70, 160] },
    lava: { shell: [60, 52, 56], vein: [255, 120, 40], iris: [255, 90, 20] },
    abyss: { shell: [40, 90, 100], vein: [120, 255, 230], iris: [20, 160, 170] },
    steel: { shell: [150, 156, 166], vein: [255, 140, 50], iris: [230, 160, 40], seam: 1 }
  };
  const recolored = {};
  const recolor = (img, style) => {
    const key = style + ':' + img.width + 'x' + img.height; if (recolored[key]) return recolored[key];
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height), p = d.data, S = CORE[style];
    for (let i = 0; i < p.length; i += 4) {
      if (p[i + 3] < 10) continue; const r = p[i], g = p[i + 1], b = p[i + 2], lum = 0.3 * r + 0.59 * g + 0.11 * b;
      let o = null;
      if (r > 240 && g > 240 && b > 240) continue;   // 反光
      if (r > g + 45 && r > b + 30) o = lum > 60 ? S.vein.map(v => v * Math.min(1.1, lum / 80)) : S.iris.map(v => v * Math.max(0.25, lum / 70));   // 血管、瞳
      else if (lum > 110 && Math.abs(r - b) < 70) { const k = lum / 228; o = S.shell.map(v => v * k); if (S.seam) { const px = (i / 4) % c.width, py = Math.floor(i / 4 / c.width); if (py % 9 === 0 || (px % 17 === 0 && py % 9 < 5)) o = o.map(v => v * 0.62); } }   // 殼
      if (o) { p[i] = Math.min(255, o[0]); p[i + 1] = Math.min(255, o[1]); p[i + 2] = Math.min(255, o[2]); }
    }
    x.putImageData(d, 0, 0);
    return (recolored[key] = c);
  };
  const mb0 = R.makeBeastSprite;
  if (mb0) R.makeBeastSprite = (id, role) => {
    const m = mb0(id, role);
    try {
      if (id === 'petra') { const run = W().run, rg = run && regionOf(run.site), st = rg && rg.core; if (st && CORE[st] && m.sp && m.sp.t && m.sp.t.image) { m.sp.t.image = recolor(m.sp.t.image, st); m.sp.t.needsUpdate = true; } }
    } catch (e) { console.warn('[region] core', e); }
    return m;
  };
  R.coreStyleOf = site => { const rg = regionOf(site); return rg && rg.core; };
  R.recolorCore = recolor;
  // ---------- 城市的領主體（2026-10-18 作者：每一座城市都有對應的領主體；阿彌勒級不出、摩爾斯級以上出） ----------
  // 城邊遺跡（摩爾斯級以上）照那座城的領主體為主：摩爾斯級本來沒有領主體——每 3～5 層一隻（lordfloor.js 的規則），只出這一隻；
  // 克森特級：四成機率是這一隻，其他照原本的名單。照遺跡本身的樣子挑（霜冠鹿不放礦山）。
  const SITE_LORD = R.SITE_LORD = {
    hokuroku: 'gashadokuro',   // 皇嶺：北麓陵墓——骨兵、陵墓
    'ft-camp': 'spikewolf',    // 府廳：舊兵營——軍犬
    'zy-wreck': 'kraken',      // 征遠：擱淺的舊戰列艦（深海）
    'nl-fog': 'tsuchigumo',    // 南瀧：霧港倉庫街——貨櫃間牽滿了絲
    'bb-bridge': 'windelder',  // 板北：海峽大橋橋墩——海峽的風
    'bn-army': 'bonewyvern',   // 板南：舊陸軍營地、碉堡
    'yb-mine': 'omukade',      // 岳北：礦山陵墓——礦坑巨蟲
    'hs-barracks': 'muhyo', 'hs-arsenal': 'muhyo',   // 奉主：舊兵營、兵工廠
    toudo: 'frostdeer',        // 北州：凍原
    kazan: 'lavajaw',          // 納瓦：火山
    tougrei: 'thunderape'      // 天宮東嶺：迷宮裡帶電的野獸
  };
  const gfL = R.genFloor;
  R.genFloor = (run, f) => {
    const L = run && run.site && SITE_LORD[run.site.id], g0 = run && run.grade;
    if (!L || !g0 || !R.ENEMIES[L] || (g0.lv || 0) < 3) return gfL(run, f);
    if (R.GRADES.includes(g0)) run.grade = Object.assign({}, g0);   // 不要改到共用的分級資料
    const g = run.grade; if (!g.lords) g.lords = [L];
    const F = gfL(run, f);
    g.lords = g.id === 'mors' ? [L] : [L, L, L].concat((g.lords || []).filter(x => x !== L).slice(0, 5));   // run.js 進領主房時才從這份名單挑
    return F;
  };
})(window.R);
