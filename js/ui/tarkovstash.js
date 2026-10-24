// 無境之旅：格子倉庫（2026-10-12 作者：倉庫改成像塔科夫的倉庫、搬進公寓、花錢買箱子擴充）
// - 倉庫是 14 格寬的格子，每件東西照種類佔 W×H 格（武器長條、防具大塊、飾品護符 1×1），不能重疊。
// - 拖曳放置（滑鼠、觸控都可以），拖曳中按 R 旋轉；點一下打開那件的卡片（穿上／賣掉／上鎖／旋轉）。
// - 「自動整理」重排全部；放不下的放到「暫放區」，東西不會不見（R.S.stash 照舊是全部物品，格子只記位置 R.S.tg）。
// - 倉庫在公寓 302 室的收納櫃；有家之後，別的地方打開倉庫只能看身上的裝備。還沒租房子的人照舊在公會寄放。
// - 擴充：加大倉庫（每次 +2 排）、買箱子（箱子本身佔格子，裡面有更大的格子，有的只收某一類）。
// - 2026-10-18 作者：所有東西都放進倉庫格——費拉、素材、藥水、炸彈、卷軸、禮物、代幣、家具、任務道具照數量切成一疊一疊（stacks.js 的 R.stackList，一疊 1×1），跟裝備一樣拖、排、記位置。
// - 2026-10-18 第二階段：背包也是一個格子（g:'bag'，大小＝目前的背包 R.PACKS[R.S.pack]，裝備照遺跡背包的大小 R.itemSize）；
//   倉庫頁面上倉庫格、背包格可以互相拖：裝備進出背包（R.S.bagIds），一疊的東西搬數量（倉庫 R.S.vault ⇄ 背包的數字，carry.js、stacks.js）。
//   R.renderBagGrid(容器)：把背包格畫進去（倉庫頁面、城裡的背包視窗用）。
// 放在所有包 R.hub 的檔案後面（stashux.js 後面）。
(function (R) {
  const COLS = 14, BASE_ROWS = 10, UP_ROWS = 2, UP_MAX = 20;   // 2026-10-13 作者：增加一些收納上限（10×8→14×10，加大次數 12→20；舊存檔多 2 排，見 tg()）
  const BOX = {
    small: { name: '小物件箱', w: 2, h: 2, iw: 4, ih: 4, price: 800, only: ['charm', 'acc'], note: '只放護符、飾品' },
    weapon: { name: '武器箱', w: 4, h: 2, iw: 6, ih: 5, price: 1800, only: ['weapon'], note: '只放武器' },
    armor: { name: '防具箱', w: 3, h: 3, iw: 6, ih: 6, price: 1800, only: ['head', 'body', 'legs', 'feet'], note: '只放帽子、上衣、褲子、鞋子' },
    big: { name: '大型收納箱', w: 4, h: 3, iw: 8, ih: 8, price: 4500, only: null, note: '什麼都能放' }
  };
  R.STASH_BOX = BOX;
  const esc = s => (R.esc ? R.esc(s) : String(s));
  const kindOf = it => { if (it && it.stack) return 'stack'; try { return (R.slotOf ? R.slotOf(it) : it.kind) || it.kind || 'other'; } catch (e) { return it.kind || 'other'; } };
  const LONG = /槍|矛|弓|杖|鐮|戟|大劍|太刀|長/;
  const sizeOf = it => {
    if (it && it.stack) return [1, 1];   // 一疊（費拉、素材、藥水……）
    const k = kindOf(it);
    if (k === 'weapon') return LONG.test((R.WEAPONS && R.WEAPONS[it.base] && R.WEAPONS[it.base].name) || it.name || '') ? [4, 1] : [3, 1];
    if (k === 'body') return [2, 3];
    if (k === 'head' || k === 'legs' || k === 'feet') return [2, 2];
    return [1, 1];   // 護符、飾品、其他
  };
  R.stashItemSize = sizeOf;
  const sizeIn = (it, key) => (it && !it.stack && key === 'bag' && R.itemSize ? R.itemSize(it) : sizeOf(it));   // 背包裡的裝備照遺跡背包的大小
  const dims = (w, h, r) => (r ? [h, w] : [w, h]);
  const upPrice = n => Math.round(300 * Math.pow(1.5, n) / 50) * 50;
  const boxPrice = t => { const g = tg(); return Math.round(BOX[t].price * Math.pow(1.5, (g.bought[t] || 0)) / 50) * 50; };

  const S = () => R.S;
  const tg = () => { const s = S(); if (!s.tg || typeof s.tg !== 'object') s.tg = { v: 1, v2: 1, rows: BASE_ROWS, up: 0, boxes: [], pos: {}, bought: {} }; const g = s.tg; if (!g.v2) { g.rows = Math.max((g.rows || 8) + 2, BASE_ROWS); g.v2 = 1; } g.boxes = g.boxes || []; g.pos = g.pos || {}; g.bought = g.bought || {}; g.rows = g.rows || BASE_ROWS; return g; };
  // 倉庫格裡的東西＝沒穿在身上的裝備＋一疊一疊的東西（一下子會問很多次，記 50 毫秒；整理的時候（hold）一直用同一份——東西多的時候算一次就超過 50 毫秒，每找一個空位都重算會卡死）
  let LC = null, LT = 0, BC = null, BM = null, hold = 0;
  const loose = () => { const now = performance.now(); if (LC && (hold || now - LT < 50)) return LC; BM = null; const eq = R.equippedIds(); LC = (S().stash || []).filter(it => !eq.has(it.id) && !(R.inBag && R.inBag(it.id))).concat(R.stackList ? R.stackList('stash') : []); BC = (R.bagGear ? R.bagGear() : []).concat(R.stackList ? R.stackList('bag') : []); LT = now; return LC; };
  const bagList = () => { loose(); return BC || []; };
  const allList = () => loose().concat(bagList());
  const isBagThing = it => !!it && (it.stack ? it.where === 'bag' : !!(R.inBag && R.inBag(it.id)));
  const fresh = () => { LC = null; BC = null; BM = null; };
  const itemOf = id => allList().find(it => String(it.id) === String(id)) || (R.isStackId && R.isStackId(id) ? null : R.itemById(id));
  const packDim = () => { const P = R.PACKS && (R.PACKS[S().pack] || R.PACKS.sack); return P ? [P.w, P.h] : [6, 5]; };
  const gridDim = key => { const g = tg(); if (key === 'main') return [COLS, g.rows]; if (key === 'bag') return packDim(); const b = g.boxes.find(x => x.id === key); return b ? [BOX[b.t].iw, BOX[b.t].ih] : [0, 0]; };
  const allows = (key, it) => { if (key === 'bag') return !it.stack || (R.stackBagOk && R.stackBagOk(it.key)); if (key === 'main') return true; const b = tg().boxes.find(x => x.id === key); if (!b) return false; const o = BOX[b.t].only; return !o || o.includes(kindOf(it)); };
  // 某一格子裡被佔掉的格（ignore：拖曳中的那一件／那個箱子）
  const occ = (key, ignore) => {
    const [w, h] = gridDim(key), m = new Uint8Array(w * h), g = tg(), mark = (x, y, a, b) => { for (let j = y; j < y + b; j++) for (let i = x; i < x + a; i++) if (i >= 0 && j >= 0 && i < w && j < h) m[j * w + i] = 1; };
    loose(); const byId = BM || (BM = new Map(allList().map(it => [String(it.id), it])));
    Object.keys(g.pos).forEach(id => { const p = g.pos[id]; if (p.g !== key || id === ignore) return; const it = byId.get(id); if (!it) return; const [a, b] = dims(...sizeIn(it, key), p.r); mark(p.x, p.y, a, b); });
    if (key === 'main') g.boxes.forEach(b => { if (b.id === ignore) return; const [a, c] = dims(BOX[b.t].w, BOX[b.t].h, b.r); mark(b.x, b.y, a, c); });
    return { m, w, h };
  };
  const fits = (o, x, y, a, b) => { if (x < 0 || y < 0 || x + a > o.w || y + b > o.h) return false; for (let j = y; j < y + b; j++) for (let i = x; i < x + a; i++) if (o.m[j * o.w + i]) return false; return true; };
  const findSpot = (key, a, b, ignore) => { const o = occ(key, ignore); for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) if (fits(o, x, y, a, b)) return [x, y, 0]; if (a !== b) for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) if (fits(o, x, y, b, a)) return [x, y, 1]; return null; };
  const autoPlace = it => {
    if (isBagThing(it)) { const [w, h] = sizeIn(it, 'bag'), sp = findSpot('bag', w, h); if (!sp) return false; tg().pos[it.id] = { g: 'bag', x: sp[0], y: sp[1], r: sp[2] ? (w === h ? 0 : 1) : 0 }; return true; }
    const g = tg(), [w, h] = sizeOf(it), k = kindOf(it);
    const keys = g.boxes.filter(b => BOX[b.t].only && BOX[b.t].only.includes(k)).map(b => b.id).concat(['main'], g.boxes.filter(b => !BOX[b.t].only).map(b => b.id));
    for (const key of keys) { const s = findSpot(key, w, h); if (s) { g.pos[it.id] = { g: key, x: s[0], y: s[1], r: s[2] ? (w === h ? 0 : 1) : 0 }; if (s[2]) { /* findSpot 的 r=1 表示轉過 */ } return true; } }
    return false;
  };
  // 給鐵匠鋪「立刻裝備」用：換下來的那件放得進格子嗎（放不下會留在暫放區，不會不見）
  R.stashTryPlace = it => { const p = tg().pos[it.id]; return (p && !p.over) || autoPlace(it); };
  // 整理資料：拿掉已經不在倉庫（穿上、賣掉）的位置、補上新東西的位置；第一次（舊存檔）放不下就把倉庫加長
  const reconcile = () => { fresh(); hold++; try { return reconcile1(); } finally { hold--; } };
  const reconcile1 = () => { const g = tg(), items = loose(), ids = new Set(items.map(it => String(it.id))), bag = bagList(), bids = new Set(bag.map(it => String(it.id)));
    Object.keys(g.pos).forEach(id => { const p = g.pos[id]; if (bids.has(id)) { if (p.g !== 'bag') delete g.pos[id]; return; } if (!ids.has(id) || (p.g !== 'main' && !g.boxes.some(b => b.id === p.g)) || p.over) delete g.pos[id]; });
    let full1 = false;   // 1×1 的放不下＝背包沒有空格，後面的不用再找（管理員的素材一疊一疊有上萬疊）
    BOVER = bag.filter(it => !g.pos[it.id]).sort((a, b) => sizeIn(b, 'bag')[0] * sizeIn(b, 'bag')[1] - sizeIn(a, 'bag')[0] * sizeIn(a, 'bag')[1]).filter(it => { const one = sizeIn(it, 'bag')[0] * sizeIn(it, 'bag')[1] === 1; if (one && full1) return true; const ok = autoPlace(it); if (!ok && one) full1 = true; return !ok; });   // 背包放不下的
    g.pin = g.pin || {}; Object.keys(g.pin).forEach(id => { if (!ids.has(id) || g.pos[id]) delete g.pin[id]; });
    const fresh0 = !g.mig; let over = items.filter(it => !g.pos[it.id] && !g.pin[it.id]).sort((a, b) => sizeOf(b)[0] * sizeOf(b)[1] - sizeOf(a)[0] * sizeOf(a)[1]).filter(it => !autoPlace(it));
    if (fresh0) { while (over.length && g.rows < 200) { g.rows += 1; over = over.filter(it => !autoPlace(it)); } g.mig = 1; }
    if (!g.mig2) { while (over.length && g.rows < 200) { g.rows += 1; over = over.filter(it => !autoPlace(it)); } g.mig2 = 1; }   // 2026-10-18：一疊一疊的東西第一次放進來，放不下就把倉庫加長（不用花錢）
    return over.concat(items.filter(it => g.pin[it.id] && !g.pos[it.id]));   // 暫放區
  };
  let BOVER = [];
  const sortAll = () => {
    const g = tg(), keepBag = {}; Object.keys(g.pos).forEach(id => { if (g.pos[id].g === 'bag') keepBag[id] = g.pos[id]; }); g.pos = keepBag; g.pin = {};   // 自動整理只排倉庫，背包不動
    const bs = g.boxes.slice().sort((a, b) => BOX[b.t].w * BOX[b.t].h - BOX[a.t].w * BOX[a.t].h); bs.forEach(b => { b.x = -99; b.y = -99; });
    bs.forEach(b => { const s = findSpot('main', BOX[b.t].w, BOX[b.t].h, b.id); if (s) { b.x = s[0]; b.y = s[1]; b.r = s[2]; } else { g.rows += BOX[b.t].h; const t = findSpot('main', BOX[b.t].w, BOX[b.t].h, b.id); b.x = t[0]; b.y = t[1]; b.r = t[2]; } });
    fresh(); loose().slice().sort((a, b) => (a.stack ? 1 : 0) - (b.stack ? 1 : 0) || sizeOf(b)[0] * sizeOf(b)[1] - sizeOf(a)[0] * sizeOf(a)[1] || (b.rarity || 0) - (a.rarity || 0) || String(a.cat || '').localeCompare(String(b.cat || '')) || String(a.key || '').localeCompare(String(b.key || ''))).forEach(autoPlace);
  };

  // ---------- 畫面 ----------
  let openBox = null, drag = null, popId = null;
  const cs = () => (window.innerWidth < 600 ? 30 : 42);
  const where = () => { const W = R.W || {}; const inApt = !!(W.inside && W.inside.kind === 'home'); return { inApt, hasHome: !!(S() && S().home), full: inApt || !(S() && S().home) }; };
  R.stashLocked = () => false;   // 2026-10-18 作者：不在家也能從倉庫頁面直接換上裝備（原本：有家的人不在家時不能換）   // 2026-10-16：有家的人不在家時，不能從倉庫換裝（gearcmp.js、loadout.js 也照這個擋）

  const inner = it => it.stack ? '<span class="gicon">' + it.icon() + '</span><i>' + esc(it.name) + '</i><em class="sk-n">' + (it.key === 'gold' ? it.n.toLocaleString('zh-TW') : it.n) + '</em>'
    : (R.itemIconTag ? R.itemIconTag(it, 'tk-ic') : '') + '<i>' + esc(R.itemName(it)) + '</i>' + (it.locked ? '<em>🔒</em>' : '') + (it.identified ? '' : '<em class="q">？</em>');
  const colOf = it => (it.stack ? it.color : R.rarityColor(it));
  const tileHtml = (it, p, c) => { const [a, b] = dims(...sizeIn(it, p.g), p.r); return '<div class="tk-it' + (p.r ? ' rot' : '') + (it.stack ? ' sk' : '') + '" data-tk="' + it.id + '" style="left:' + p.x * c + 'px;top:' + p.y * c + 'px;width:' + a * c + 'px;height:' + b * c + 'px;--c:' + colOf(it) + '"' + (it.stack ? ' title="' + esc(it.name + ' ×' + it.n + '（全部 ' + it.total + '）') + '"' : '') + '>' + inner(it) + '</div>'; };
  const gridHtml = (key, c) => {
    const g = tg(), [w, h] = gridDim(key), byId = new Map(allList().map(it => [String(it.id), it]));
    let h1 = '<div class="tk-grid" data-tkg="' + key + '" style="width:' + w * c + 'px;height:' + h * c + 'px;--cs:' + c + 'px">';
    if (key === 'main') g.boxes.forEach(b => { const d = BOX[b.t], [a, e] = dims(d.w, d.h, b.r), n = Object.values(g.pos).filter(p => p.g === b.id).length; h1 += '<div class="tk-it tk-box' + (openBox === b.id ? ' open' : '') + '" data-tkb="' + b.id + '" title="' + esc(d.name + '（' + d.iw + '×' + d.ih + '，' + d.note + '）點一下打開') + '" style="left:' + b.x * c + 'px;top:' + b.y * c + 'px;width:' + a * c + 'px;height:' + e * c + 'px"><b>📦</b><i>' + esc(d.name) + '<br>' + n + ' 件</i></div>'; });
    Object.keys(g.pos).forEach(id => { const p = g.pos[id], it = byId.get(id); if (p.g === key && it) h1 += tileHtml(it, p, c); });
    return h1 + '</div>';
  };
  const render = (wrap, over) => {
    const g = tg(), c = cs(), s = S(), b = openBox && g.boxes.find(x => x.id === openBox);
    if (!b) openBox = null;
    const n = g.up < UP_MAX ? upPrice(g.up) : 0;
    wrap.innerHTML = '<h3>倉庫（' + COLS + '×' + g.rows + '）</h3><p class="note">拖曳搬動，拖曳中按 R（或兩指點一下「旋轉」）轉向；點一下看那件東西。按住 Shift 點一下，直接搬進背包／放回倉庫。武器 3×1（長柄 4×1）、上衣 2×3、帽子／褲子／鞋子 2×2、護符／飾品 1×1；費拉、素材、藥水這些一疊 1×1（費拉一格 1000、藥水 10 瓶、炸彈 5 顆、素材 10～40 個）。</p>'
      + '<div class="tk-bar"><button type="button" class="mini gold" data-tksort="1">自動整理</button><button type="button" class="mini" data-tkrot="1">旋轉（R）</button>'
      + (g.up < UP_MAX ? '<button type="button" class="mini" data-tkup="1"' + (s.gold < n ? ' disabled' : '') + '>加大倉庫 +' + UP_ROWS + ' 排（' + n + ' 費拉）</button>' : '<span class="note">倉庫已經最大了</span>')
      + '</div><div class="tk-shop">' + Object.keys(BOX).map(t => { const d = BOX[t], p = boxPrice(t); return '<button type="button" class="mini" data-tkbuy="' + t + '"' + (s.gold < p ? ' disabled' : '') + ' title="' + esc(d.note + '，外面佔 ' + d.w + '×' + d.h + '，裡面 ' + d.iw + '×' + d.ih) + '">買' + esc(d.name) + '（' + d.w + '×' + d.h + '→' + d.iw + '×' + d.ih + '・' + p + ' 費拉）</button>'; }).join('') + '</div>'
      + '<div class="tk-wrap">' + gridHtml('main', c) + (b ? '<div class="tk-side"><h4>' + esc(BOX[b.t].name) + '（' + esc(BOX[b.t].note) + '）<button type="button" class="mini" data-tkclose="1">關上</button></h4>' + gridHtml(b.id, c) + '</div>' : '') + '</div>'
      + (over.length ? '<h4>暫放區（倉庫放不下的 ' + over.length + ' 件，拖進格子裡或加大倉庫）</h4><div class="tk-over" data-tkg="over">' + over.map(it => { const [a, e] = sizeOf(it); return '<div class="tk-it' + (it.stack ? ' sk' : '') + '" data-tk="' + it.id + '" style="position:relative;width:' + a * c + 'px;height:' + e * c + 'px;--c:' + colOf(it) + '">' + inner(it) + '</div>'; }).join('') + '</div>' : '')
      + '<div class="tk-pop" hidden></div>';
    bindGrid(wrap);
  };

  let cur = null;   // { wrap, sec, cards }
  let BAG = null;   // 背包格畫在哪裡（倉庫頁面、城裡的背包視窗）
  const refresh = () => {
    const a = cur && cur.wrap.isConnected, b = BAG && BAG.isConnected; if (!a && !b) return;
    const over = reconcile(); if (a) { render(cur.wrap, over); dim(); } if (b) renderBag(BAG); R.save && R.save();
  };
  // 背包格（g:'bag'）：大小＝目前背的背包；放不下的列在下面
  const renderBag = el => {
    const c = cs(), [w, h] = packDim(), P = R.PACKS && (R.PACKS[S().pack] || R.PACKS.sack);
    el.innerHTML = '<div class="tk-bagbar"><b>' + esc(P ? P.name : '背包') + '（' + w + '×' + h + '）</b><span>錢包 ' + Math.floor(S().gold || 0).toLocaleString('zh-TW') + ' 費拉</span><small>' + (cur && cur.wrap.isConnected ? '跟倉庫互相拖曳就是拿進、放回；按住 Shift 點一下直接搬過去。' : '要拿東西進出，到倉庫（家裡的收納櫃）。') + '</small></div>'
      + '<div class="tk-wrap">' + gridHtml('bag', c) + '</div>'
      + (BOVER.length ? '<h4 class="tk-bagover-h">背包放不下的（' + BOVER.length + ' 樣，先整理或放回倉庫）</h4><div class="tk-over tk-bagover">' + BOVER.map(it => { const [a, e] = sizeIn(it, 'bag'); return '<div class="tk-it' + (it.stack ? ' sk' : '') + '" data-tk="' + it.id + '" style="position:relative;width:' + a * c + 'px;height:' + e * c + 'px;--c:' + colOf(it) + '">' + inner(it) + '</div>'; }).join('') + '</div>' : '')
      + '<div class="tk-pop" hidden></div>';
    bindGrid(el);
  };
  R.renderBagGrid = el => { BAG = el; reconcile(); renderBag(el); };
  // ---------- 背包放不放得下（2026-10-18 第三階段：買到的、獎勵、合成的東西放背包，放不下就不能拿） ----------
  const bagFree = () => { reconcile(); const o = occ('bag'); let f = 0; for (let i = 0; i < o.m.length; i++) if (!o.m[i]) f++; BOVER.forEach(it => { const [a, b] = sizeIn(it, 'bag'); f -= a * b; }); return Math.max(0, f); };
  R.bagFreeCells = bagFree;
  R.bagOverflow = () => { reconcile(); return BOVER.length; };
  // 這一種最多還能放幾個（裝滿最後那疊＋空格子）
  R.bagMaxAdd = key => { const m = R.stackMeta && R.stackMeta(key); if (!m || !R.stackBagOk || !R.stackBagOk(key)) return 0; const cur = R.stackCount(key, 'bag'), part = cur % m.per ? m.per - cur % m.per : 0; return part + bagFree() * m.per; };
  R.bagCanAdd = (key, n) => (n || 0) <= R.bagMaxAdd(key);
  R.bagCanFitItem = it => { reconcile(); const [w, h] = sizeIn(it, 'bag'), free = bagFree(); if (w * h > free) return false; return !!findSpot('bag', w, h); };
  // 放進背包：放得下才放（回傳 true／false）；裝備放進 R.S.stash＋背包，一疊加數量
  R.giveItem = it => { if (!it || !R.bagCanFitItem(it)) return false; S().stash.push(it); R.toBag(it.id); fresh(); const [w, h] = sizeIn(it, 'bag'), sp = findSpot('bag', w, h); if (sp) tg().pos[it.id] = { g: 'bag', x: sp[0], y: sp[1], r: sp[2] ? (w === h ? 0 : 1) : 0 }; fresh(); return true; };
  R.giveStack = (key, n) => { if (!(n > 0)) return true; if (!R.bagCanAdd(key, n)) return false; R.stackAdd(key, 'bag', n); fresh(); return true; };
  R.bagFullMsg = what => { if (R.toast) R.toast('背包放不下' + (what ? '「' + what + '」' : '') + '：先整理背包、把東西放回倉庫或賣掉。', '#FF9A6A'); };
  // 一疊東西搬到另一邊（倉庫 ⇄ 背包）：整疊的數量搬過去；原本那邊拖走的那格空出來，搬過去那邊新的一疊放在放下的位置
  const moveStack = (it, to, t) => {
    const g = tg(), from = it.where, pre = w => (w === 'bag' ? 'bk:' : 'sk:'), cnt = w => R.stackCount(it.key, w), per = it.per;
    const m0 = Math.ceil(cnt(from) / per), d0 = Math.ceil(cnt(to) / per), old = []; for (let i = 0; i < m0; i++) old.push(g.pos[pre(from) + it.key + ':' + i]);
    R.stackAdd(it.key, from, -it.n); R.stackAdd(it.key, to, it.n);
    const rest = old.filter((_, i) => i !== it.idx); for (let i = 0; i < m0; i++) { const id = pre(from) + it.key + ':' + i; if (i < rest.length && rest[i]) g.pos[id] = rest[i]; else delete g.pos[id]; }
    const d1 = Math.ceil(cnt(to) / per); if (d1 > d0 && t && t.g !== 'over') g.pos[pre(to) + it.key + ':' + d0] = { g: t.g, x: t.x, y: t.y, r: 0 };
    fresh();
  };
  const dim = () => { if (!cur) return; const q = ((document.getElementById('st-q') || {}).value || '').trim(); cur.wrap.querySelectorAll('.tk-it[data-tk]').forEach(el => { if (el.classList.contains('sk')) { el.classList.toggle('dim', !!q && !(el.textContent || '').includes(q)); return; } const cd = cur.cards.get(el.dataset.tk); el.classList.toggle('dim', !cd || cd.hidden); }); };

  const showPop = (id, wrap) => {
    const pop = wrap.querySelector('.tk-pop'), card = cur && cur.wrap.isConnected ? cur.cards.get(id) : null; if (!pop) return;
    popId = id; pop.innerHTML = ''; pop.hidden = false;
    if (card) { card.hidden = false; card.dataset.tkShown = '1'; pop.appendChild(card); }
    const sk = R.isStackId && R.isStackId(id) ? itemOf(id) : null;
    if (!card && !sk) { const it = itemOf(id); if (it && R.itemInfo) { const d = document.createElement('div'); d.className = 'sk-card'; d.innerHTML = '<b style="color:' + R.rarityColor(it) + '">' + esc(R.itemName(it)) + '</b>' + R.itemInfo(it, ''); pop.appendChild(d); } }
    if (sk) { const d = document.createElement('div'); d.className = 'sk-card'; d.innerHTML = '<b style="color:' + sk.color + '">' + esc(sk.name) + ' ×' + sk.n.toLocaleString('zh-TW') + '</b><small>這一疊 ' + sk.n + '／' + sk.per + '・全部 ' + sk.total.toLocaleString('zh-TW') + '</small><p class="note">' + esc(sk.desc || '') + '</p>'; pop.appendChild(d); }
    const row = document.createElement('div'); row.className = 'row';
    row.innerHTML = '<button type="button" class="mini" data-tkrotin="1">旋轉</button><button type="button" class="mini" data-tkpx="1">關閉</button>';
    pop.appendChild(row);
    row.querySelector('[data-tkpx]').onclick = () => { if (card && cur) { cur.items.appendChild(card); } pop.hidden = true; popId = null; dim(); };
    row.querySelector('[data-tkrotin]').onclick = () => { rotateInPlace(id); };
  };
  const rotateInPlace = id => {
    const g = tg(), p = g.pos[id], it = itemOf(id); if (!p || !it) return;
    const [a, b] = dims(...sizeIn(it, p.g), !p.r), o = occ(p.g, id);
    if (fits(o, p.x, p.y, a, b)) { p.r = p.r ? 0 : 1; refresh(); } else R.toast && R.toast('轉不過來：旁邊沒有空位。');
  };

  const bindGrid = wrap => {
    const on = (sel, f) => wrap.querySelectorAll(sel).forEach(b => { b.onclick = () => f(b); });
    on('[data-tksort]', () => { sortAll(); refresh(); });
    on('[data-tkrot]', () => { if (drag) { drag.r = drag.r ? 0 : 1; ghostSize(); } else if (popId) rotateInPlace(popId); else R.toast && R.toast('拖曳中按 R，或點一件東西再按「旋轉」。'); });
    on('[data-tkup]', () => { const g = tg(), p = upPrice(g.up); if (g.up >= UP_MAX || S().gold < p) return; S().gold -= p; g.up++; g.rows += UP_ROWS; R.sfx && R.sfx('coin'); R.hub('stash'); R.toast && R.toast('倉庫加大了（' + COLS + '×' + g.rows + '）'); });
    on('[data-tkbuy]', b => {
      const t = b.dataset.tkbuy, d = BOX[t], p = boxPrice(t), g = tg(); if (S().gold < p) return;
      const s = findSpot('main', d.w, d.h); if (!s) { R.toast && R.toast('倉庫裡沒有 ' + d.w + '×' + d.h + ' 的空位放箱子，先整理或加大倉庫。'); return; }
      S().gold -= p; g.bought[t] = (g.bought[t] || 0) + 1; const bx = { id: 'bx' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36), t, x: s[0], y: s[1], r: s[2] };
      g.boxes.push(bx); openBox = bx.id; R.sfx && R.sfx('coin'); R.hub('stash'); R.toast && R.toast('買了' + d.name + '，放進倉庫了。');
    });
    on('[data-tkclose]', () => { openBox = null; refresh(); });
    wrap.querySelectorAll('.tk-it').forEach(el => { el.onpointerdown = e => startDrag(e, el, wrap); const cd = el.dataset.tk && cur && cur.cards.get(el.dataset.tk); if (cd && !el.title) el.title = (cd.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 300); });
  };

  // 拖曳（pointer events：滑鼠、觸控、筆都一樣）
  let ghost = null;
  const ghostSize = () => { if (!drag || !ghost) return; const c = cs(), [a, b] = dims(drag.w, drag.h, drag.r); ghost.style.width = a * c + 'px'; ghost.style.height = b * c + 'px'; drag.ox = Math.min(drag.ox, a - 1); drag.oy = Math.min(drag.oy, b - 1); };
  // 按住 Shift 點一下：倉庫 ⇄ 背包直接搬過去（2026-10-18 作者；倉庫頁面上兩邊都在的時候）
  const stashSpot = it => {
    const g = tg(), [w, h] = sizeOf(it), k = kindOf(it);
    const keys = g.boxes.filter(b => BOX[b.t].only && BOX[b.t].only.includes(k)).map(b => b.id).concat(['main'], g.boxes.filter(b => !BOX[b.t].only).map(b => b.id));
    for (const key of keys) { const sp = findSpot(key, w, h); if (sp) return { g: key, x: sp[0], y: sp[1], r: sp[2] ? (w === h ? 0 : 1) : 0 }; }
    return null;
  };
  const quickMove = it => {
    const g = tg(), id = String(it.id), name = it.stack ? it.name : R.itemName(it);
    if (!isBagThing(it)) {
      if (!allows('bag', it)) { R.toast && R.toast('「' + name + '」只能放在倉庫。'); return; }
      const [w, h] = sizeIn(it, 'bag'), sp = findSpot('bag', w, h); if (!sp) { R.bagFullMsg && R.bagFullMsg(name); return; }
      const t = { g: 'bag', x: sp[0], y: sp[1], r: sp[2] ? (w === h ? 0 : 1) : 0 };
      if (it.stack) moveStack(it, 'bag', t); else { R.toBag(it.id); fresh(); g.pos[id] = t; }
    } else {
      const t = stashSpot(it); if (!t) { R.toast && R.toast('倉庫沒有空位放「' + name + '」：先整理、加大倉庫或買箱子。', '#FF9A6A'); return; }
      if (it.stack) moveStack(it, 'stash', t); else { R.fromBag(it.id); fresh(); g.pos[id] = t; }
    }
    R.sfx && R.sfx('click');
    refresh();
  };
  const startDrag = (e, el, wrap) => {
    if (e.button > 0) return;
    const g = tg(), c = cs(), isBox = !!el.dataset.tkb, id = el.dataset.tkb || el.dataset.tk;
    let w, h, r, it = null;
    if (isBox) { const b = g.boxes.find(x => x.id === id); if (!b) return; w = BOX[b.t].w; h = BOX[b.t].h; r = b.r || 0; }
    else { it = itemOf(id); if (!it) return; [w, h] = sizeIn(it, (g.pos[id] || {}).g); r = (g.pos[id] && g.pos[id].r) || 0; }
    if (!isBox && e.shiftKey && cur && cur.wrap.isConnected && BAG && BAG.isConnected) { e.preventDefault(); quickMove(it); return; }
    const rc = el.getBoundingClientRect();
    const st = { id, isBox, it, w, h, r, ox: Math.floor((e.clientX - rc.left) / c), oy: Math.floor((e.clientY - rc.top) / c), sx: e.clientX, sy: e.clientY, moved: false, el };
    e.preventDefault();
    const move = ev => {
      if (!st.moved && Math.hypot(ev.clientX - st.sx, ev.clientY - st.sy) < 6) return;
      if (!st.moved) { st.moved = true; drag = st; ghost = el.cloneNode(true); ghost.className += ' tk-ghost'; ghost.removeAttribute('title'); document.body.appendChild(ghost); el.classList.add('dragging'); ghostSize(); }
      ghost.style.left = (ev.clientX - st.ox * c - c / 2) + 'px'; ghost.style.top = (ev.clientY - st.oy * c - c / 2) + 'px';
      wrap.querySelectorAll('.tk-grid').forEach(gr => gr.classList.remove('ok', 'bad'));
      document.querySelectorAll('.tk-grid.ok,.tk-grid.bad').forEach(gr => gr.classList.remove('ok', 'bad'));
      const t = target(ev, st); if (t && t.g) { const gr = document.querySelector('[data-tkg="' + t.g + '"]'); if (gr) gr.classList.add(t.ok ? 'ok' : 'bad'); }
    };
    const up = ev => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      if (ghost) { ghost.remove(); ghost = null; }
      const was = drag; drag = null; el.classList.remove('dragging');
      if (!st.moved) { if (isBox) { openBox = openBox === id ? null : id; refresh(); } else showPop(id, wrap); return; }
      const t = ev.type === 'pointerup' ? target(ev, was) : null;
      if (t && t.ok) {
        const it = was.it, wasBag = !isBox && isBagThing(it), toBag = t.g === 'bag';
        if (isBox) { const b = g.boxes.find(x => x.id === id); b.x = t.x; b.y = t.y; b.r = was.r; }
        else if (it.stack && wasBag !== toBag) moveStack(it, toBag ? 'bag' : 'stash', t);   // 一疊：搬數量
        else {
          if (wasBag !== toBag) { if (toBag) R.toBag(id); else R.fromBag(id); fresh(); }   // 裝備：拿進背包／放回倉庫
          if (t.g === 'over') { delete g.pos[id]; g.pin = g.pin || {}; g.pin[id] = 1; }
          else g.pos[id] = { g: t.g, x: t.x, y: t.y, r: was.r };
        }
      } else if (t && t.why) R.toast && R.toast(t.why);
      refresh();
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  };
  const target = (ev, st) => {
    const c = cs(), el = document.elementsFromPoint(ev.clientX, ev.clientY).find(x => x.dataset && x.dataset.tkg && !x.classList.contains('tk-ghost'));
    if (!el) return null; const key = el.dataset.tkg;
    if (key === 'over') return st.isBox ? { why: '箱子不能放暫放區。' } : { g: 'over', ok: true };
    if (st.isBox && key !== 'main') return { g: key, ok: false, why: '箱子不能放進箱子裡。' };
    if (st.isBox && key === 'bag') return { g: key, ok: false, why: '箱子不能放進背包。' };
    if (!st.isBox && !allows(key, st.it)) return { g: key, ok: false, why: key === 'bag' ? '這個只能放倉庫。' : '這個箱子' + BOX[tg().boxes.find(b => b.id === key).t].note + '。' };
    if (st.isBox && key === 'main') { /* 有東西的箱子照樣能搬 */ }
    const rc = el.getBoundingClientRect(), [a, b] = st.isBox ? dims(st.w, st.h, st.r) : dims(...sizeIn(st.it, key), st.r);
    const x = Math.floor((ev.clientX - rc.left) / c) - st.ox, y = Math.floor((ev.clientY - rc.top) / c) - st.oy;
    const ok = fits(occ(key, st.id), x, y, a, b);
    return { g: key, x, y, ok, why: ok ? '' : '放不下：位置被佔了或超出格子。' };
  };
  window.addEventListener('keydown', e => { if (drag && (e.key === 'r' || e.key === 'R')) { drag.r = drag.r ? 0 : 1; ghostSize(); e.preventDefault(); e.stopPropagation(); } }, true);

  // ---------- 接到倉庫頁面 ----------
  const hub0 = R.hub;
  R.hub = (t, f) => {
    const r = hub0(t, f);
    try {
      const tab = document.querySelector('[data-htab][aria-selected="true"]'); if (!tab || tab.dataset.htab !== 'stash') return r;
      const body = document.getElementById('hub-body'), h3 = [...body.querySelectorAll('h3')].find(x => /^倉庫裡的東西/.test(x.textContent || '')); if (!h3) return r;
      const sec = h3.parentElement, items = [...sec.querySelectorAll('.items')].find(x => h3.compareDocumentPosition(x) & Node.DOCUMENT_POSITION_FOLLOWING); if (!items) return r;
      const bar = sec.querySelector('.st-cats');
      const wh = where();
      if (!wh.full) {
        if (bar) bar.hidden = true;
        sec.querySelectorAll('.sx-empty,.sx-bar').forEach(x => { x.hidden = true; });
        const n = document.createElement('p'); n.className = 'hand tk-away'; n.textContent = '倉庫搬到家裡了：回公團住宅 1 號棟 302 室，打開收納櫃才能整理倉庫（賣掉、上鎖、搬位置）。換上倉庫裡的裝備在這裡就可以，也能脫下身上的東西。';
        h3.before(n);
        // 不在家：列出倉庫裡的裝備，可以直接換上（2026-10-18 作者）；賣掉、上鎖等整理的按鈕拿掉
        const byId = new Map((S().stash || []).map(it => [String(it.id), it])); let nw = 0;
        items.querySelectorAll('.item-card').forEach(cd => {
          const b = cd.querySelector('[data-lock],[data-equip],[data-sell]'), it = b && byId.get(String(b.dataset.lock || b.dataset.equip || b.dataset.sell));
          if (!it || !cd.querySelector('[data-equip]')) { cd.hidden = true; return; }
          nw++; cd.querySelectorAll('button').forEach(x => { if (!x.matches('[data-equip],[data-cmp],[data-gc]')) x.remove(); });
        });
        h3.textContent = '倉庫裡的裝備（' + nw + ' 件・點「換上」直接換）'; h3.hidden = false; items.hidden = !nw;
        if (!nw) { const e = document.createElement('p'); e.className = 'note'; e.textContent = '倉庫裡沒有能換上的裝備。'; h3.after(e); }
        return r;
      }
      h3.hidden = true; items.hidden = true;
      const cards = new Map(); items.querySelectorAll('.item-card').forEach(cd => { const b = cd.querySelector('[data-lock],[data-equip],[data-sell]'); if (b) cards.set(b.dataset.lock || b.dataset.equip || b.dataset.sell, cd); });
      const wrap = document.createElement('div'); wrap.className = 'tk-stash'; (bar || h3).after(wrap);
      if (!wh.inApt) { const n = document.createElement('p'); n.className = 'note'; n.textContent = '還沒有家，東西先寄放在公會。租了公團住宅 1 號棟的房子之後，倉庫會搬到家裡的收納櫃。'; wrap.before(n); }
      cur = { wrap, sec, cards, items };
      const q = document.getElementById('st-q'); if (q) q.addEventListener('input', () => setTimeout(dim, 0));
      refresh();
    } catch (e) { console.warn('[tarkovstash]', e); }
    return r;
  };

  const css = document.createElement('style');
  css.textContent = '.tk-stash{margin-top:8px}.tk-bar,.tk-shop{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0}.tk-wrap{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start}'
    + '.tk-grid{position:relative;background-color:rgba(0,0,0,.35);background-image:linear-gradient(rgba(255,255,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.08) 1px,transparent 1px);background-size:var(--cs) var(--cs);border:1px solid rgba(255,255,255,.25);touch-action:none;box-sizing:content-box}'
    + '.tk-grid.ok{outline:2px solid #6c6}.tk-grid.bad{outline:2px solid #d55}.tk-side h4{margin:0 0 4px;display:flex;gap:6px;align-items:center}'
    + '.tk-it{position:absolute;box-sizing:border-box;border:1px solid var(--c,#888);background:linear-gradient(135deg,rgba(255,255,255,.08),rgba(0,0,0,.3));overflow:hidden;cursor:grab;touch-action:none;user-select:none;display:flex;align-items:center;justify-content:center}'
    + '.tk-it .gicon{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:none;border:0}.tk-it .gicon img{max-width:90%;max-height:90%;image-rendering:pixelated}.tk-it.rot .gicon img{transform:rotate(90deg)}'
    + '.tk-it i{position:absolute;left:1px;right:1px;bottom:0;font-size:9px;line-height:1.1;font-style:normal;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 0 2px #000;pointer-events:none}.tk-it em{position:absolute;top:0;right:1px;font-size:9px;font-style:normal}.tk-it em.q{left:2px;right:auto;color:#fc6}'
    + '.tk-it.sk .gicon img{max-width:80%;max-height:80%}.tk-it.sk i{font-size:8px}.tk-it em.sk-n{top:0;right:2px;font-size:10px;font-weight:700;color:#fff;text-shadow:0 0 2px #000,0 0 2px #000}.sk-card{display:flex;flex-direction:column;gap:2px;margin-bottom:6px}'
    + '.tk-bagbar{display:flex;flex-wrap:wrap;gap:8px;align-items:baseline;margin:0 0 4px}.tk-bagbar small{opacity:.75}.tk-bagover-h{margin:6px 0 2px;font-size:12px;color:#FF9A6A}'
    + '.tk-it.dim{opacity:.25}.tk-it.dragging{opacity:.3}.tk-ghost{position:fixed!important;z-index:9999;pointer-events:none;opacity:.85}'
    + '.tk-box{background:repeating-linear-gradient(45deg,#4a3a26,#4a3a26 6px,#55432c 6px,#55432c 12px);border-color:#c8a85a}.tk-box b{font-size:18px}.tk-box i{font-size:10px;text-align:center;white-space:normal}.tk-box.open{outline:2px solid #e8c04a}'
    + '.tk-over{display:flex;flex-wrap:wrap;gap:4px;padding:6px;min-height:40px;border:1px dashed rgba(255,255,255,.3)}'
    + '.tk-pop{position:fixed;z-index:9000;left:50%;top:50%;transform:translate(-50%,-50%);max-width:min(92vw,420px);max-height:80vh;overflow:auto;background:#1c1a18;border:1px solid #c8a85a;padding:8px;border-radius:6px;box-shadow:0 6px 30px #000}';
  document.head.appendChild(css);
})(window.R);
