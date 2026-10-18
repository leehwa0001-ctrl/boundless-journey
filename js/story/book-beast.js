// 《獸的誘惑》（2026-10-18 作者：東鶴書房 x=4.7 z=-3.9 的書架；作者給的 4 張圖切成 15 頁）
// ★ 作者：這本書之後可能要整個刪掉。這本書的東西只有這幾樣，刪掉就完全沒有了（其他地方都會自己跳過）：
//   1. 這個檔案 js/story/book-beast.js
//   2. 圖的資料夾 assets/books/dhshelf/（15 張 webp）
//   3. index.html 裡載入這個檔案的那一行（搜尋 book-beast.js）
//   4. js/ui/news.js 的更新公告那一條（搜尋 獸的誘惑）
//   書店裡的書架互動、書架上那本金色的書（interiors2.js）只有在 R.BOOKS.dhshelf 存在的時候才會出現；閱讀器 bookreader.js 是通用的，不用刪。
//   repo 是公開的：刪掉之後 git 的歷史紀錄裡還看得到圖，要連歷史一起清掉要另外改寫歷史（先問作者）。
(function (R) {
  R.BOOKS = R.BOOKS || {};
  R.BOOKS.dhshelf = { title: '獸的誘惑', sub: '', where: { shop: 'books', x: 4.7, z: -3.9 }, pages: [{ img: 'assets/books/dhshelf/p01.webp' }, { img: 'assets/books/dhshelf/p02.webp' }, { img: 'assets/books/dhshelf/p03.webp' }, { img: 'assets/books/dhshelf/p04.webp' }, { img: 'assets/books/dhshelf/p05.webp' }, { img: 'assets/books/dhshelf/p06.webp' }, { img: 'assets/books/dhshelf/p07.webp' }, { img: 'assets/books/dhshelf/p08.webp' }, { img: 'assets/books/dhshelf/p09.webp' }, { img: 'assets/books/dhshelf/p10.webp' }, { img: 'assets/books/dhshelf/p11.webp' }, { img: 'assets/books/dhshelf/p12.webp' }, { img: 'assets/books/dhshelf/p13.webp' }, { img: 'assets/books/dhshelf/p14.webp' }, { img: 'assets/books/dhshelf/p15.webp' }] };
})(window.R = window.R || {});
