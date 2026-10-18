// 會疊的東西（2026-10-18 作者：所有的道具、素材、裝備、武器、費拉都會作為物品出現在倉庫格中）
// - 費拉、素材、藥水、炸彈、卷軸、經驗書、抽選券、禮物（魚、娃娃）、遊樂場的代幣、還沒擺的家具、任務道具：
//   照原本存檔裡的數字（R.S.gold、R.S.mats……）切成一疊一疊，一疊佔 1×1 格，一格疊幾個看種類（PER）。
// - 數字照舊是真的（商店、合成、任務還是直接加減 R.S.gold 這些）；格子只是把它們畫出來、記位置（tarkovstash.js 的 R.S.tg.pos，id＝'sk:種類:第幾疊'）。
// - R.stackList()：現在有的每一疊 [{ id, key, n, per, name, desc, color, cat, icon(c) }]；R.stackById(id)。
// 放在 maticons.js、bomb.js、props.js、claw.js、furniture.js、questbag.js 後面、tarkovstash.js 前面。
(function (R) {
  const S = () => R.S;
  const esc = s => (R.esc ? R.esc(s) : String(s));
  // 一格疊幾個（作者 2026-10-18：費拉一格 1000；其他照我們定的）
  const PER = { gold: 1000, potion: 10, bomb: 5, bombCore: 1, scroll: 20, book: 20, ticket: 20, gift: 10, medal: 100, ball: 500, coin: 50, furn: 1, quest: 1 };
  const matPer = k => (R.stackOf ? R.stackOf(k) : 20);
  // 圖示：有的用原本的（費拉、素材），沒有的畫一個有字的小方塊
  const glyph = (ch, col) => '<span class="sk-gl" style="--g:' + col + '">' + esc(ch) + '</span>';
  const kinds = () => {
    const s = S(); if (!s) return [];
    const L = [], add = (key, n, per, o) => { n = Math.floor(n || 0); if (n > 0) L.push(Object.assign({ key, n, per: Math.max(1, per) }, o)); };
    add('gold', s.gold, PER.gold, { name: '費拉', cat: 'gold', color: '#E8C04A', desc: '錢。一格最多 ' + PER.gold + ' 費拉。', icon: () => (R.goldIconURL ? '<img src="' + R.goldIconURL(3) + '" alt="">' : glyph('費', '#E8C04A')) });
    Object.keys(s.mats || {}).forEach(k => { const M = R.MATS && R.MATS[k]; if (!M) return; add('mat:' + k, s.mats[k], matPer(k), { name: M.name, cat: 'mat', color: M.color || '#C8B88A', desc: (M.desc || '素材') + '。一格疊 ' + matPer(k) + ' 個。', icon: () => (R.matIconURL ? '<img src="' + R.matIconURL(k, 3) + '" alt="">' : glyph(M.name[0], M.color || '#C8B88A')) }); });
    const po = s.potions || {};
    add('pot:hp', po.hp, PER.potion, { name: '回復藥', cat: 'item', color: '#E0505A', desc: '喝了回復生命。一格疊 ' + PER.potion + ' 瓶。', icon: () => glyph('藥', '#E0505A') });
    add('pot:mp', po.mp, PER.potion, { name: '魔力藥', cat: 'item', color: '#4A8AE0', desc: '喝了回復魔力。一格疊 ' + PER.potion + ' 瓶。', icon: () => glyph('魔', '#4A8AE0') });
    Object.keys(R.BOMB_TYPES || {}).forEach(t => { const T = R.BOMB_TYPES[t], per = T.core ? PER.bombCore : PER.bomb; add('bomb:' + T.key, s[T.key], per, { name: T.name, cat: 'item', color: T.color || '#FF7A3A', desc: (T.desc || '') + '一格疊 ' + per + ' 顆。', icon: () => glyph('炸', T.color || '#FF7A3A') }); });
    add('scrolls', s.scrolls, PER.scroll, { name: '卷軸', cat: 'item', color: '#D8C098', desc: '一般的卷軸。一格疊 ' + PER.scroll + ' 張。', icon: () => glyph('卷', '#D8C098') });
    Object.keys(s.scrollBag || {}).forEach(k => add('sbag:' + k, s.scrollBag[k], PER.scroll, { name: '咒卷', cat: 'item', color: '#C8A0E0', desc: '寫好法術的卷軸（' + k + '）。一格疊 ' + PER.scroll + ' 張。', icon: () => glyph('咒', '#C8A0E0') }));
    add('xpBooks', s.xpBooks, PER.book, { name: '經驗書', cat: 'item', color: '#8AC860', desc: '讀了得到經驗。一格疊 ' + PER.book + ' 本。', icon: () => glyph('書', '#8AC860') });
    add('raceTickets', s.raceTickets, PER.ticket, { name: '種族抽選券', cat: 'item', color: '#E8A0C8', desc: '一格疊 ' + PER.ticket + ' 張。', icon: () => glyph('券', '#E8A0C8') });
    Object.keys(s.raceSelect || {}).forEach(k => add('rsel:' + k, s.raceSelect[k], PER.ticket, { name: k + ' 種族選擇券', cat: 'item', color: '#E8A0C8', desc: '一格疊 ' + PER.ticket + ' 張。', icon: () => glyph(k, '#E8A0C8') }));
    Object.keys(s.gifts || {}).forEach(k => { const G = R.GIFTS && R.GIFTS[k]; add('gift:' + k, s.gifts[k], PER.gift, { name: G ? G.name : k, cat: 'gift', color: '#E8B070', desc: ((G && G.desc) || '') + '一格疊 ' + PER.gift + ' 個。', icon: () => glyph((G ? G.name : k)[0], '#E8B070') }); });
    add('medals', s.medals, PER.medal, { name: '拉霸代幣', cat: 'token', color: '#C8C8D8', desc: '遊樂場的代幣。一格疊 ' + PER.medal + ' 枚。', icon: () => glyph('幣', '#C8C8D8') });
    add('pachiBalls', s.pachiBalls, PER.ball, { name: '柏青哥鋼珠', cat: 'token', color: '#B8C0C8', desc: '一格裝 ' + PER.ball + ' 顆。', icon: () => glyph('珠', '#B8C0C8') });
    add('clawCoins', s.clawCoins, PER.coin, { name: '夾娃娃代幣', cat: 'token', color: '#E8A0A0', desc: '一格疊 ' + PER.coin + ' 枚。', icon: () => glyph('夾', '#E8A0A0') });
    const fd = R.furnitureDebug && R.furnitureDebug.data ? R.furnitureDebug.data() : null;
    if (fd && fd.own) Object.keys(fd.own).forEach(k => { const F = R.FURNITURE && R.FURNITURE[k]; let placed = 0; ['home', 'garden'].forEach(w => Object.values((fd.at && fd.at[w]) || {}).forEach(v => { if (v === k) placed++; })); add('furn:' + k, (fd.own[k] || 0) - placed, PER.furn, { name: F ? F.name : k, cat: 'furn', color: '#B08A5A', desc: ((F && F.desc) || '') + '還沒擺出來的家具。', icon: () => glyph('家', '#B08A5A') }); });
    (s.qitems || []).forEach(q => { const d = R.QITEMS && R.QITEMS[q.id]; if (!d) return; add('quest:' + q.id, q.n || 1, PER.quest, { name: d.name, cat: 'quest', color: '#7AB8FF', desc: (d.desc || '') + '（任務道具：不能賣、不能丟）', icon: () => glyph('任', '#7AB8FF') }); });
    return L;
  };
  // 切成一疊一疊：第 i 疊的 id 固定（數量變少時，最後面那疊先不見；格子上的位置不會亂掉）
  R.stackList = () => {
    const out = [];
    kinds().forEach(k => { const m = Math.ceil(k.n / k.per); for (let i = 0; i < m; i++) out.push(Object.assign({}, k, { id: 'sk:' + k.key + ':' + i, n: Math.min(k.per, k.n - i * k.per), total: k.n, stack: true })); });
    return out;
  };
  R.stackById = id => R.stackList().find(x => x.id === id) || null;
  R.isStackId = id => /^sk:/.test(String(id));
  R.STACK_PER = PER;
  const css = document.createElement('style');
  css.textContent = '.sk-gl{display:flex;align-items:center;justify-content:center;width:80%;height:80%;border-radius:4px;background:color-mix(in srgb,var(--g) 30%,#1a1612);border:1px solid var(--g);color:var(--g);font-weight:700;font-size:13px}';
  document.head.appendChild(css);
})(window.R = window.R || {});
