// 會疊的東西（2026-10-18 作者：所有的道具、素材、裝備、武器、費拉都會作為物品出現在倉庫格中）
// - 費拉、素材、藥水、炸彈、卷軸、經驗書、抽選券、禮物（魚、娃娃）、遊樂場的代幣、還沒擺的家具、任務道具：
//   照數量切成一疊一疊，一疊佔 1×1 格，一格疊幾個看種類（PER）。
// - 放在兩個地方（第二階段，carry.js）：
//   背包＝原本存檔裡的數字（R.S.gold、R.S.mats、R.S.potions……；商店、合成、任務照舊直接加減，等於用背包裡的）；
//   倉庫＝R.S.vault{ 種類: 數量 }（不能直接花，要先拿進背包）。家具、任務道具只放倉庫。
// - R.stackList(where)：where＝'stash'（預設）或 'bag'，每一疊 [{ id, key, n, per, total, name, desc, color, cat, icon() }]；
//   id：倉庫 'sk:種類:第幾疊'、背包 'bk:種類:第幾疊'。R.stackCount(key, where)、R.stackAdd(key, where, 數量)。
// 放在 tarkovstash.js 前面。
(function (R) {
  const S = () => R.S;
  const esc = s => (R.esc ? R.esc(s) : String(s));
  // 一格疊幾個（作者 2026-10-18：費拉一格 1000；其他照我們定的）
  const PER = { gold: 1000, potion: 10, bomb: 5, bombCore: 1, scroll: 20, book: 20, ticket: 20, gift: 10, medal: 100, ball: 500, coin: 50, furn: 1, quest: 1 };
  const matPer = k => (R.stackOf ? R.stackOf(k) : 20);
  const glyph = (ch, col) => '<span class="sk-gl" style="--g:' + col + '">' + esc(ch) + '</span>';
  // ---------- 背包那邊的數字在存檔的哪裡 ----------
  // key → [取, 存]（存的時候寫回原本的欄位）
  const bagRef = key => {
    const s = S(), [a, b] = String(key).split(':');
    const obj = (name, k) => [() => (s[name] && s[name][k]) || 0, v => { s[name] = s[name] || {}; s[name][k] = v; }];
    const top = name => [() => s[name] || 0, v => { s[name] = v; }];
    if (key === 'gold') return top('wallet');   // 錢包（wallet.js：R.S.gold＝錢包＋銀行）
    if (a === 'mat') return obj('mats', b);
    if (a === 'pot') return obj('potions', b);
    if (a === 'bomb') return top(b);
    if (a === 'sbag') return obj('scrollBag', b);
    if (a === 'rsel') return obj('raceSelect', b);
    if (a === 'gift') return obj('gifts', b);
    if (['scrolls', 'xpBooks', 'raceTickets', 'medals', 'pachiBalls', 'clawCoins'].includes(key)) return top(key);
    return null;   // 家具、任務道具：只在倉庫
  };
  const vault = () => { const s = S(); if (!s.vault || typeof s.vault !== 'object') s.vault = {}; return s.vault; };
  R.stackCount = (key, where) => { if (where === 'bag') { const r = bagRef(key); return r ? Math.floor(r[0]() || 0) : 0; } return Math.floor(vault()[key] || 0); };
  R.stackAdd = (key, where, d) => {
    if (where === 'bag') { const r = bagRef(key); if (!r) return false; r[1](Math.max(0, (r[0]() || 0) + d)); return true; }
    const v = vault(); v[key] = Math.max(0, (v[key] || 0) + d); if (!v[key]) delete v[key]; return true;
  };
  R.stackBagOk = key => !!bagRef(key);   // 這種東西能不能放背包
  // ---------- 種類的名字、說明、圖示 ----------
  const meta = key => {
    const [a, b] = String(key).split(':');
    if (key === 'gold') return { name: '費拉', cat: 'gold', per: PER.gold, color: '#E8C04A', desc: '錢。一格最多 ' + PER.gold + ' 費拉。', icon: () => (R.goldIconURL ? '<img src="' + R.goldIconURL(3) + '" alt="">' : glyph('費', '#E8C04A')) };
    if (a === 'mat') { const M = R.MATS && R.MATS[b]; if (!M) return null; return { name: M.name, cat: 'mat', per: matPer(b), color: M.color || '#C8B88A', desc: (M.desc || '素材') + '。一格疊 ' + matPer(b) + ' 個。', icon: () => (R.matIconURL ? '<img src="' + R.matIconURL(b, 3) + '" alt="">' : glyph(M.name[0], M.color || '#C8B88A')) }; }
    if (key === 'pot:hp') return { name: '回復藥', cat: 'item', per: PER.potion, color: '#E0505A', desc: '喝了回復生命。一格疊 ' + PER.potion + ' 瓶。', icon: () => R.consumableIconTag ? R.consumableIconTag('pot:hp') : glyph('藥', '#E0505A') };
    if (key === 'pot:mp') return { name: '魔力藥', cat: 'item', per: PER.potion, color: '#4A8AE0', desc: '喝了回復魔力。一格疊 ' + PER.potion + ' 瓶。', icon: () => R.consumableIconTag ? R.consumableIconTag('pot:mp') : glyph('魔', '#4A8AE0') };
    if (a === 'pot' && R.FAT_ITEMS && R.FAT_ITEMS[b]) { const F = R.FAT_ITEMS[b]; return { name: F.name, cat: 'item', per: F.per, color: F.color, desc: F.desc + '一格疊 ' + F.per + ' 個。', icon: () => glyph(F.glyph, F.color) }; }   // 疲憊值的道具（fatigue.js）
    if (a === 'bomb') { const T = Object.values(R.BOMB_TYPES || {}).find(t => t.key === b); if (!T) return null; const per = T.core ? PER.bombCore : PER.bomb; return { name: T.name, cat: 'item', per, color: T.color || '#FF7A3A', desc: (T.desc || '') + '一格疊 ' + per + ' 顆。', icon: () => R.consumableIconTag ? R.consumableIconTag(key) : glyph('炸', T.color || '#FF7A3A') }; }
    if (key === 'scrolls') return { name: '卷軸', cat: 'item', per: PER.scroll, color: '#D8C098', desc: '一般的卷軸。一格疊 ' + PER.scroll + ' 張。', icon: () => glyph('卷', '#D8C098') };
    if (a === 'sbag') return { name: '咒卷', cat: 'item', per: PER.scroll, color: '#C8A0E0', desc: '寫好法術的卷軸（' + b + '）。一格疊 ' + PER.scroll + ' 張。', icon: () => glyph('咒', '#C8A0E0') };
    if (key === 'xpBooks') return { name: '經驗書', cat: 'item', per: PER.book, color: '#8AC860', desc: '讀了得到經驗。一格疊 ' + PER.book + ' 本。', icon: () => glyph('書', '#8AC860') };
    if (key === 'raceTickets') return { name: '種族抽選券', cat: 'item', per: PER.ticket, color: '#E8A0C8', desc: '一格疊 ' + PER.ticket + ' 張。', icon: () => glyph('券', '#E8A0C8') };
    if (a === 'rsel') return { name: b + ' 種族選擇券', cat: 'item', per: PER.ticket, color: '#E8A0C8', desc: '一格疊 ' + PER.ticket + ' 張。', icon: () => glyph(b, '#E8A0C8') };
    if (a === 'gift') { const G = R.GIFTS && R.GIFTS[b]; const n = G ? G.name : b; return { name: n, cat: 'gift', per: PER.gift, color: '#E8B070', desc: ((G && G.desc) || '') + '一格疊 ' + PER.gift + ' 個。', icon: () => glyph(n[0], '#E8B070') }; }
    if (key === 'medals') return { name: '拉霸代幣', cat: 'token', per: PER.medal, color: '#C8C8D8', desc: '遊樂場的代幣。一格疊 ' + PER.medal + ' 枚。', icon: () => glyph('幣', '#C8C8D8') };
    if (key === 'pachiBalls') return { name: '柏青哥鋼珠', cat: 'token', per: PER.ball, color: '#B8C0C8', desc: '一格裝 ' + PER.ball + ' 顆。', icon: () => glyph('珠', '#B8C0C8') };
    if (key === 'clawCoins') return { name: '夾娃娃代幣', cat: 'token', per: PER.coin, color: '#E8A0A0', desc: '一格疊 ' + PER.coin + ' 枚。', icon: () => glyph('夾', '#E8A0A0') };
    if (a === 'furn') { const F = R.FURNITURE && R.FURNITURE[b]; return { name: F ? F.name : b, cat: 'furn', per: PER.furn, color: '#B08A5A', desc: ((F && F.desc) || '') + '還沒擺出來的家具（只放倉庫）。', icon: () => glyph('家', '#B08A5A') }; }
    if (a === 'quest') { const d = R.QITEMS && R.QITEMS[b]; if (!d) return null; return { name: d.name, cat: 'quest', per: PER.quest, color: '#7AB8FF', desc: (d.desc || '') + '（任務道具：只放倉庫，不能賣、不能丟）', icon: () => glyph('任', '#7AB8FF') }; }
    return null;
  };
  R.stackMeta = meta;
  // 背包那邊有哪些種類（看存檔裡的欄位）
  const bagKeys = () => {
    const s = S(), L = ['gold'];
    Object.keys(s.mats || {}).forEach(k => L.push('mat:' + k));
    L.push('pot:hp', 'pot:mp'); Object.keys(R.FAT_ITEMS || {}).forEach(k => L.push('pot:' + k));
    Object.values(R.BOMB_TYPES || {}).forEach(t => L.push('bomb:' + t.key));
    L.push('scrolls'); Object.keys(s.scrollBag || {}).forEach(k => L.push('sbag:' + k));
    L.push('xpBooks', 'raceTickets'); Object.keys(s.raceSelect || {}).forEach(k => L.push('rsel:' + k));
    Object.keys(s.gifts || {}).forEach(k => L.push('gift:' + k));
    L.push('medals', 'pachiBalls', 'clawCoins');
    return L;
  };
  const stashOnly = () => {
    const s = S(), L = [];
    const fd = R.furnitureDebug && R.furnitureDebug.data ? R.furnitureDebug.data() : null;
    if (fd && fd.own) Object.keys(fd.own).forEach(k => { let placed = 0; ['home', 'garden'].forEach(w => Object.values((fd.at && fd.at[w]) || {}).forEach(v => { if (v === k) placed++; })); L.push(['furn:' + k, (fd.own[k] || 0) - placed]); });
    (s.qitems || []).forEach(q => L.push(['quest:' + q.id, q.n || 1]));
    return L;
  };
  const kinds = where => {
    const s = S(); if (!s) return [];
    const L = [], add = (key, n) => { n = Math.floor(n || 0); const m = n > 0 && meta(key); if (m) L.push(Object.assign({ key, n }, m)); };
    if (where === 'bag') bagKeys().forEach(k => add(k, R.stackCount(k, 'bag')));
    else { Object.keys(vault()).forEach(k => add(k, vault()[k])); stashOnly().forEach(([k, n]) => add(k, n)); }
    return L;
  };
  // 切成一疊一疊：第 i 疊的 id 固定（數量變少時，最後面那疊先不見；格子上的位置不會亂掉）
  R.stackList = where => {
    const out = [], pre = where === 'bag' ? 'bk:' : 'sk:';
    kinds(where).forEach(k => { const m = Math.ceil(k.n / k.per); for (let i = 0; i < m; i++) out.push(Object.assign({}, k, { id: pre + k.key + ':' + i, n: Math.min(k.per, k.n - i * k.per), idx: i, total: k.n, stack: true, where: where === 'bag' ? 'bag' : 'stash' })); });
    return out;
  };
  R.isStackId = id => /^(sk|bk):/.test(String(id));
  R.STACK_PER = PER;
  const css = document.createElement('style');
  css.textContent = '.sk-gl{display:flex;align-items:center;justify-content:center;width:80%;height:80%;border-radius:4px;background:color-mix(in srgb,var(--g) 30%,#1a1612);border:1px solid var(--g);color:var(--g);font-weight:700;font-size:13px}';
  document.head.appendChild(css);
})(window.R = window.R || {});
