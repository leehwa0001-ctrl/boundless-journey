// 共用消耗品插畫：獨立小圖，快捷列與倉庫共用瀏覽器快取。
(function (R) {
  const names = { 'pot:hp': 'hp', 'pot:mp': 'mp', 'bomb:low': 'bomb-low', 'bomb:high': 'bomb-high', 'bomb:core': 'bomb-core', 'bomb:bombs': 'bomb-low', 'bomb:bombsHi': 'bomb-high', 'bomb:bombsCore': 'bomb-core' };
  R.consumableIconURL = key => names[key] ? 'assets/art/consumables-v1/' + names[key] + '.webp' : '';
  R.consumableIconTag = key => { const url = R.consumableIconURL(key); return url ? '<img src="' + url + '" alt="" style="width:40px;height:40px;max-width:100%;max-height:100%;image-rendering:auto;object-fit:contain">' : ''; };
})(window.R = window.R || {});

