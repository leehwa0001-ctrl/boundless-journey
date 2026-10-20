// 人物素材的測試版（2026-10-11 作者：這個能套用我們的人物嗎？缺的之後會補，先做個測試版看能不能塞）
// - 資料：charkit-data.js（tools/charkit-convert.js 從作者的人物編輯器匯出檔轉的；45×45 一格，四個方向，站立、移動、單手揮擊、雙手揮擊）。
// - 2026-10-20 作者：舊版人物拿掉——所有人一律用素材版（暫停選單、標題畫面的切換鈕拿掉；以前存在瀏覽器的 tfl-charkit 不再看）。
// - 怎麼畫：照原本人物圖的排法（6 欄 × 7 列，sprites.js），前四列（正面、背面、朝右、朝左 × 站、走 1、走 2、砍下、舉起、收招）換成素材；
//   翻滾素材還沒有，沿用原本的圖；倒下、坐著（第 7 列）2026-10-18 起用素材的站姿改出來（坐著＝大腿那幾列拿掉、倒下＝側面轉 90 度）。圖放大成 3 倍（一格 72×90），素材畫成 2 倍、腳底對齊——人物在畫面上一樣高，只是畫得比較細。
//   顏色照每個人的外觀：身體＝膚色、衣服＝上衣（條紋＝披風色）、褲子＝披風色、頭髮、眼睛；髮型照原本的 hs 對到素材的七種。
//   武器、盾、兜帽、種族特徵（耳朵、角、翅膀……）素材還沒有：兜帽的人不畫頭髮；剪影（還沒認識的人）照舊用原本的圖。
//   2026-10-18：完整版（charkitfull.js）載入之後，R.charkitKitFor(o) 給這個人的身體、合身的圖層、多畫的圖層（種族特徵、盔甲、武器）。
// 放在 sprites.js、lookplus.js、gearmore.js 後面（最外層的 R.makeHeroSprite、R.spriteLook）。
(function (R) {
  const K = R.CHARKIT; if (!K || !R.makeHeroSprite) return;
  const G = K.grid || 45, FW = 24, FH = 30, COLS = 6, ROWS = 7, S = 3, KS = 2, CW = FW * S, CH = FH * S;
  const on = () => true;
  R.charkitOn = on;
  // ---------- 解碼（a～j＝0～9，後面的數字＝連續幾格） ----------
  const DEC = new Map();
  const decFull = str => { const a = new Uint8Array(G * G); let i = 0, p = 0; while (p < str.length) { const v = str.charCodeAt(p++) - 97; let n = 0; while (p < str.length && str[p] >= '0' && str[p] <= '9') n = n * 10 + (str.charCodeAt(p++) - 48); n = n || 1; a.fill(v, i, i + n); i += n; } return a; };
  // 只留有顏色的格子：{ i: 第幾格, v: 規則 }（一張圖大約只有四分之一有東西，畫的時候只走這些）
  const dec = str => { let d = DEC.get(str); if (d) return d; const a = decFull(str), I = [], V = []; for (let k = 0; k < a.length; k++) if (a[k]) { I.push(k); V.push(a[k]); } d = { i: Int16Array.from(I), v: Uint8Array.from(V), full: a }; DEC.set(str, d); return d; };
  // ---------- 顏色 ----------
  const hex = c => { c = String(c || '#888888'); if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3]; const n = parseInt(c.slice(1, 7), 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const mix = (c, t, k) => c.map((v, i) => Math.round(v + (t[i] - v) * k));
  const css = (c, a) => { const A = Math.round(255 * (a == null ? 1 : a)); return [c[0], c[1], c[2], A, ((A << 24) | (c[2] << 16) | (c[1] << 8) | c[0]) >>> 0]; };   // 直接寫進像素陣列（最後一個是 Uint32）
  const BLACK = [20, 16, 24], WHITE = [255, 255, 255];
  // 一層的上色規則 → 顏色（base＝這一層的顏色，alt＝「隨機色」那幾格用的第二個顏色）
  const paint = (base, alt) => { const b = hex(base), a = hex(alt || base); return [null, css(BLACK), css(b), css(mix(b, BLACK, 0.45)), css(mix(b, BLACK, 0.7)), css(a), css(mix(b, BLACK, 0.78)), css(b, 0.5), css(WHITE), css(mix(b, WHITE, 0.45))]; };
  R.charkitPaint = paint;
  // ---------- 外觀 → 素材的選擇 ----------
  // 2026-10-19：捏角的每一種髮型都對到素材（原本馬尾、鮑伯頭、平頭對錯；新髮型沒有對到的是這次補畫的，在 tools/charkit-extra.json）
  const HAIR = { short: '短髮', long: '長髮', ponytail: '馬尾', bun: '包頭', spiky: '刺蝟頭', bob: '鮑伯頭', braid: '辮子', crop: '平頭', twin: '雙馬尾', wavy: '波浪長髮', hime: '公主切', sidepart: '三七分', mohawk: '莫霍克', messy: '亂髮', highpony: '高馬尾' };
  const TOP = { '': '條紋毛衣', robe: '長袍', vest: '背心', coat: '大衣', hoodie: '帽T', kimono: '和服' }, PANTS = { '': '長褲', shorts: '短褲', skirt: '裙子', hakama: '袴' }, SHOES = { '': '布鞋', boots: '長鞋', sandals: '涼鞋' };
  // 2026-10-18：捏角畫面的眉毛、瞳孔、表情、配件對到素材的變體（原本只看 eyeStyle／browStyle，捏角選的都沒有反應）
  const BROW = { thin: '細眉', thick: '粗眉', angry: '生氣眉', sad: '八字眉', none: '無眉' };
  const PUPIL = { big: '大眼', shine: '星星眼', slit: '貓眼', sharp: '鳳眼', closed: '瞇瞇眼' };
  const MOUTH = { smile: '微笑', grin: '露齒笑', frown: '不悅', open: '張嘴', flat: '無言' };
  const ACC = { glasses: ['眼鏡', '太陽眼鏡'], eyepatch: ['眼鏡', '左眼罩'], flower: ['頭飾', '花冠'], scarf: ['配件', '圍巾'], headband: ['配件', '頭帶'], earring: ['配件', '耳環'] };
  const ACC_UNDER_HAIR = { scarf: 1, earring: 1 };   // 圍巾、耳環畫在頭髮底下（長髮蓋得住）
  const hashOf = s => { let h = 7; s = String(s || ''); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
  const pick = (layer, name, seed, kk) => { const L = (kk || K).layers[layer]; if (!L) return null; if (name && L[name]) return L[name]; const ks = Object.keys(L); return L[ks[seed % ks.length]]; };
  const lookOf = (o, kk) => {
    const rc = (R.raceLook && o.race ? R.raceLook(o.race) : null) || {}, seed = hashOf((o.top || '') + (o.hair || '') + (o.hs || '') + (o.cloak || ''));
    return {
      skin: o.skin || (rc.skins ? rc.skins[0] : '#E8C2A0'), hair: rc.hairCol || o.hair || '#2A2420', top: o.top || '#6A5A48', cloak: o.cloak || '#3A3440', eye: o.eye || rc.eye || '#1A1714',
      hairV: o.hs === 'bald' || o.ckHair === '' || o.hood || (rc.hood && !o.noRaceHood) || (kk && kk.noHair) ? null : pick('髮型', o.ckHair || HAIR[o.hs], seed, kk), eyeV: kk && kk.noFace ? null : pick('眼睛', o.eyeStyle || PUPIL[o.pupil] || '大眼', seed, kk), browV: kk && kk.noFace || o.brow === 'none' ? null : pick('眉毛', o.browStyle || BROW[o.brow] || '細眉', seed, kk),
      mouthV: kk && kk.noFace || !MOUTH[o.mouth] ? null : pick('表情', MOUTH[o.mouth], seed, kk),
      glasses: o.acc === 'glasses' || o.glasses ? pick('眼鏡', '太陽眼鏡', 0, kk) : null,
      accV: ACC[o.acc] && o.acc !== 'glasses' && (kk || K).layers[ACC[o.acc][0]] && (kk || K).layers[ACC[o.acc][0]][ACC[o.acc][1]] ? (kk || K).layers[ACC[o.acc][0]][ACC[o.acc][1]] : null
    };
  };
  // ---------- 一格：身體＋圖層 ----------
  const layerFrame = (by, act, i) => { if (!by) return null; const fr = by[act] || by.stand || by[Object.keys(by)[0]]; return fr && fr.length ? fr[Math.min(i, fr.length - 1)] : null; };
  let FOOT = null;   // 素材的腳底在第幾列（站立正面的最下面一列）
  const footRow = () => { if (FOOT != null) return FOOT; const a = dec(K.body.stand[0].front).full; FOOT = 0; for (let y = G - 1; y >= 0 && !FOOT; y--) for (let x = 0; x < G; x++) if (a[y * G + x]) { FOOT = y; break; } return FOOT; };
  let TMP = null;
  const drawCell = (g, ox, oy, frames, mode) => {
    if (!TMP) { const c = document.createElement('canvas'); c.width = c.height = G; const x = c.getContext('2d'); TMP = { c, x, img: x.createImageData(G, G) }; TMP.u = new Uint32Array(TMP.img.data.buffer); }
    const U = TMP.u, B = TMP.img.data; U.fill(0);
    frames.forEach(([str, pal]) => { if (!str) return; const d = dec(str), I = d.i, V = d.v; for (let n = 0; n < I.length; n++) { const c = pal[V[n]]; if (!c) continue; const k = I[n]; if (c[3] >= 255) U[k] = c[4]; else { const al = c[3] / 255, q = k * 4; if (!B[q + 3]) { B[q] = c[0]; B[q + 1] = c[1]; B[q + 2] = c[2]; B[q + 3] = c[3]; continue; }   /* 底下是空的：留著半透明（2026-10-18：原本跟黑色混，殘影變深灰） */ B[q] = B[q] * (1 - al) + c[0] * al; B[q + 1] = B[q + 1] * (1 - al) + c[1] * al; B[q + 2] = B[q + 2] * (1 - al) + c[2] * al; B[q + 3] = Math.max(B[q + 3], c[3]); } } });
    TMP.x.putImageData(TMP.img, 0, 0);
    const dy = oy + (FH - 1) * S - (footRow() + 1) * KS, dx = ox + CW / 2 - G * KS / 2;
    g.save(); g.beginPath(); g.rect(ox, oy, CW, CH); g.clip();
    if (!mode) g.drawImage(TMP.c, dx, dy, G * KS, G * KS);
    else if (mode === 'sit') {   // 2026-10-18：坐著（膝蓋朝前）：大腿那四列拿掉，上半身往下挪四格，腳還是踩在地上
      const hip = footRow() - 7, cut = 4, y2 = hip + 1 + cut;
      g.drawImage(TMP.c, 0, 0, G, hip + 1, dx, dy + cut * KS, G * KS, (hip + 1) * KS);
      g.drawImage(TMP.c, 0, y2, G, G - y2, dx, dy + y2 * KS, G * KS, (G - y2) * KS);
    } else {   // 倒下：朝右的側面轉 90 度（頭在左、臉朝上），躺在地上
      let x0 = G, y0 = G, y1 = 0; for (let k = 0; k < G * G; k++) if (B[k * 4 + 3]) { const x = k % G, y = (k - x) / G; if (x < x0) x0 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      g.translate(ox + CW / 2, oy + (FH - 1) * S); if (mode === 'downM') g.scale(-1, 1); g.rotate(-Math.PI / 2);
      g.drawImage(TMP.c, -x0 * KS, -(y0 + y1) / 2 * KS, G * KS, G * KS);
    }
    g.restore();
  };

  // 原本的排法：欄 0 站、1 走 1、2 走 2、3 砍下、4 舉起、5 收招；列 0 正面、1 背面、2 朝右、3 朝左
  const COLMAP = [['stand', 0], ['move', 0], ['move', 2], ['swing', 1], ['swing', 0], ['swing', 2]];
  const DIRMAP = ['front', 'back', 'right', 'left'];   // 素材的 right＝臉朝右、left＝臉朝左（2026-10-11 作者：原本對反了，人物左右是反的）
  // 素材那四列照外觀快取（城裡兩百多人，很多人長得一樣）；每個人只把原本圖的翻滾、倒下、坐著貼過來
  const CACHE = new Map();
  const kitRows = o => {
    const NS = R.CK_NPC && o.sig && !o.hood && R.CK_NPC[o.sig];   // 2026-10-18：重要 NPC 換上素材版的款式＋專屬細節（charkitnpc.js）
    if (NS) o = Object.assign({}, o, NS.look);
    const KK = R.charkitKitFor ? R.charkitKitFor(o) : null, KB = KK || K;   // 完整版：這個人的身體和合身的圖層（還沒載入就用原本的人類）
    const L = lookOf(o, KK), two = /^(greatsword|axe|hammer|halberd|spear|zanbato)/.test(String(o.weapon || '')), sw = two && KB.body.swing2 ? 'swing2' : 'swing1';
    const key = JSON.stringify([L.skin, L.hair, L.top, L.cloak, L.eye, o.hs, !!L.hairV, o.eyeStyle, o.browStyle, !!L.glasses, sw, KK ? KK.key : '', o.brow, o.pupil, o.mouth, o.acc, o.accCol, o.topStyle, o.pantsStyle, o.shoeStyle, o.top2, o.pants, o.shoe, NS ? o.sig : '']);
    let c = CACHE.get(key); if (c) return c;
    c = document.createElement('canvas'); c.width = CW * COLS; c.height = CH * 7; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const KN = o.weapon && R.charkitKitFor ? R.charkitKitFor(Object.assign({}, o, { weapon: null })) : KK;   // 坐著、倒下不拿武器
    const P = { body: paint(L.skin), pants: paint(o.pants || L.cloak), shoes: paint(o.shoe || '#3A2A20'), top: paint(L.top, o.top2 || L.cloak), eye: paint(L.eye), brow: paint(L.hair), hair: paint(L.hair), glass: paint('#2A2A34'), mouth: paint('#6A2E2E'), acc: paint(o.acc === 'earring' ? '#E8C04A' : o.accCol || '#C8323A') };
    const first = (n, v) => { const Ly = KB.layers[n]; return Ly && (Ly[v] || Ly[Object.keys(Ly)[0]]); }, LY = { pants: first('褲子', PANTS[o.pantsStyle || '']), shoes: first('鞋子', SHOES[o.shoeStyle || '']), top: first('衣服', TOP[o.topStyle || '']) };
    const accP = o.acc === 'eyepatch' ? P.glass : P.acc, accLow = ACC_UNDER_HAIR[o.acc] ? L.accV : null, accHigh = accLow ? null : L.accV;
    const colOf = c => c === 'hair' ? L.hair : c === 'top' ? L.top : c === 'cloak' ? L.cloak : c;
    const NP = NS && NS.parts ? NS.parts.map(([n, v, c, a]) => [KB.layers[n] && KB.layers[n][v], paint(colOf(c), a)]).filter(x => x[0]) : [];
    const framesOf = (act, i, d, kk) => {
      const bf = KB.body[act] || KB.body.stand, b = bf[Math.min(i, bf.length - 1)];
      const pickF = by => { const f = layerFrame(by, act, i); return f ? f[d] : null; };
      return [[b[d], P.body]].concat(kk && kk.under ? kk.under(act, i, d, layerFrame) : [], [[pickF(LY.pants), P.pants]]).concat([ [pickF(LY.shoes), P.shoes], [pickF(LY.top), P.top], [pickF(L.eyeV), P.eye], [pickF(L.browV), P.brow], [pickF(L.mouthV), P.mouth], [pickF(accLow), accP], [pickF(L.hairV), P.hair], [pickF(L.glasses), P.glass], [pickF(accHigh), accP]], NP.map(([by, pal]) => [pickF(by), pal])).concat(kk && kk.extra ? kk.extra(act, i, d, layerFrame) : []);
    };
    DIRMAP.forEach((d, row) => COLMAP.forEach(([act0, i], col) => drawCell(g, col * CW, row * CH, framesOf(act0 === 'swing' ? sw : act0, i, d, KK))));
    // 第 7 列（2026-10-18 作者：赤提燈裡坐著的人還是舊的）：倒下（朝右、左右翻）、坐著（正面、背面）
    drawCell(g, 0, 6 * CH, framesOf('stand', 0, 'right', KN), 'down'); drawCell(g, CW, 6 * CH, framesOf('stand', 0, 'right', KN), 'downM');
    drawCell(g, 2 * CW, 6 * CH, framesOf('stand', 0, 'front', KN), 'sit'); drawCell(g, 3 * CW, 6 * CH, framesOf('stand', 0, 'back', KN), 'sit');
    if (CACHE.size > 300) CACHE.clear(); CACHE.set(key, c);
    return c;
  };
  const POOL = new Map();
  const sheetFor = (o, orig) => {
    const pk = o.pool && o.pool + (R.charkitPoolKey ? R.charkitPoolKey() : '');   // 完整版載入之後重新畫
    if (pk && POOL.has(pk)) return POOL.get(pk);
    const k = kitRows(o), c = document.createElement('canvas'); c.width = CW * COLS; c.height = CH * ROWS; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    if (orig) g.drawImage(orig, 0, orig.height * 4 / ROWS, orig.width, orig.height * 2 / ROWS, 0, CH * 4, c.width, CH * 2);   // 翻滾先用原本的（倒下、坐著素材版自己畫）
    g.drawImage(k, 0, 0); if (pk) POOL.set(pk, c); return c;
  };
  // ---------- 接上：做人物的時候換成素材的圖 ----------
  const apply = h => {
    try {
      if (!h || !h.sp || !h.sp.t || !h.opt || h.opt.sil) return h;
      const t = h.sp.t; if (!h.sp._ckOrig) h.sp._ckOrig = t.image;
      if (!on()) { if (t.image !== h.sp._ckOrig) { t.image = h.sp._ckOrig; t.needsUpdate = true; } return h; }
      t.image = sheetFor(h.opt, h.sp._ckOrig); t.needsUpdate = true;
    } catch (e) { console.warn('[charkit]', e); }
    return h;
  };
  const mk0 = R.makeHeroSprite;
  R.makeHeroSprite = (...a) => { const h = mk0(...a); return on() ? apply(h) : h; };
  const sl0 = R.spriteLook;
  if (sl0) R.spriteLook = (h, look) => { const r = sl0(h, look); if (h && h.sp) { h.sp._ckOrig = null; apply(h); } return r; };
  const dr0 = R.dressHero;
  if (dr0) R.dressHero = (h, ...a) => { const r = dr0(h, ...a); if (h && h.sp && on()) { h.sp._ckOrig = null; apply(h); } return r; };
  // 換開關的時候，畫面上的人一起換
  const refresh = () => { const W = R.W, all = []; if (W.P && W.P.h) all.push(W.P.h); [W.town && W.town.npcs, W.town && W.town.allies, W.inside && W.inside.npcs, W.allies].forEach(L => (L || []).forEach(n => { if (n && n.h) all.push(n.h); })); all.forEach(apply); };
  R.charkitRefresh = refresh;
  R.charkitSheet = (o, orig) => sheetFor(o, orig);   // 2026-10-18：建角色、角色頁的預覽也用素材版（charkitfull.js 包 R.heroSheetCanvas）
})(window.R);
