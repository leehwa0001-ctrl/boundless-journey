// 疲憊值的道具（2026-10-18 作者：疲憊值；規則見 js/stats/fatigue.js）
// - 提神藥（+300）、乾糧（+150，可以帶下遺跡）、小帳篷（遺跡裡過夜：恢復 80%，有點不舒服）。
// - 存在 R.S.potions[id]（跟回復藥一樣放背包、佔格子；stacks.js 用 R.FAT_ITEMS 找名字和一格疊幾個）。
// - 白藤堂的「藥品」分頁多一塊「旅行用品」（hakuto.js 會把 .recipes 放進藥品分頁，所以要放在 hakuto.js 前面）。
// - 用的方法：背包畫面的「隨身用品」（fatigue.js）。
(function (R) {
  const S = () => R.S, $ = id => document.getElementById(id);
  R.FAT_ITEMS = {
    wake: { name: '提神藥', glyph: '提', color: '#E8D060', per: 10, price: 40, desc: '白藤堂的苦藥，喝了精神一振：疲憊值 +300。' },
    ration: { name: '乾糧', glyph: '糧', color: '#C8A070', per: 10, price: 15, desc: '硬硬的烤餅和肉乾，遺跡裡也能吃：疲憊值 +150。' },
    tent: { name: '小帳篷', glyph: '帳', color: '#8AB070', per: 1, price: 120, desc: '摺起來的小帳篷。遺跡裡附近沒有醒著的遺跡生物時可以搭起來睡一晚：疲憊值恢復 80%（地上硬，睡不太好）。用一次就壞了。' }
  };
  const cnt = k => Math.floor((S().potions || {})[k] || 0);
  const hub0 = R.hub;
  R.hub = (t, f) => {
    const r = hub0(t, f);
    try {
      const tab = document.querySelector('[data-htab][aria-selected="true"]'), body = $('hub-body'), s = S(); if (!body || !tab || !s || (tab.dataset.htab !== 'shop' && tab.dataset.htab !== 'stash')) return r;
      // 2026-10-27：提神藥是藥，留在白藤堂；乾糧、小帳篷是旅行用品，搬到倉庫的公會補給
      const atShop = tab.dataset.htab === 'shop', keys = atShop ? ['wake'] : ['ration', 'tent'];
      const sec = atShop ? body.querySelector('section.panel-doc') : body; if (!sec || sec.querySelector('.fat-shop')) return r;
      const price = k => (R.shopPrice ? R.shopPrice(R.FAT_ITEMS[k].price, 'shop') : R.FAT_ITEMS[k].price);
      if (price('wake') == null) return r;   // 不賣東西給你（特質、通緝）
      const box = document.createElement('div'); box.className = 'recipes fat-shop';
      box.innerHTML = (atShop ? '' : '<h3 style="grid-column:1/-1">公會補給・旅行用品</h3>') + keys.map(k => { const F = R.FAT_ITEMS[k], p = price(k); return '<div class="recipe"><b style="color:' + F.color + '">' + F.name + ' ×' + cnt(k) + '</b><small>' + F.desc + '</small><button type="button" class="btn pri" data-fatbuy="' + k + '"' + (s.gold < p ? ' disabled' : '') + '>買（' + p + ' 費拉）</button></div>'; }).join('');
      // 2026-10-27：白藤堂的提神藥放進回復藥、魔力藥那一排（原本自己一塊排在下面）
      const row = atShop && [...sec.querySelectorAll(':scope > .recipes')].find(x => x.querySelector('[data-buy], .recipe') && !/符卷/.test(x.textContent));
      const btns = [...box.querySelectorAll('[data-fatbuy]')];
      if (row) { row.classList.add('fat-shop'); [...box.children].forEach(c => row.appendChild(c)); } else sec.appendChild(box);
      btns.forEach(b => { b.onclick = () => {
        const k = b.dataset.fatbuy, p = price(k); if (p == null || s.gold < p) return;
        if (R.bagCanAdd && !R.bagCanAdd('pot:' + k, 1)) { R.bagFullMsg && R.bagFullMsg(R.FAT_ITEMS[k].name); return; }
        s.gold -= p; s.potions = s.potions || {}; s.potions[k] = cnt(k) + 1; R.save && R.save(); R.sfx && R.sfx('coin'); R.hub(t, f);
      }; });
    } catch (e) { console.warn('[fatigueitems]', e); }
    return r;
  };
})(window.R = window.R || {});
