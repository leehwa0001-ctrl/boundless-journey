// 低眩光的深色主題（2026-10-13 作者：「那個便利貼不好看，而且底部太白導致我眼睛有點閃閃的」）
// 公會（guildhall.js）、鐵匠鋪與倉庫（smithstash.js）、白藤堂（hakuto.js）、人物誌（kuzebook.js）原本的和紙卡片、米白底改成：
// 深色漆木／深藍布的牌子、細金／朱色邊、米白字；不傾斜、沒有圖釘；印章淡一點。只改樣式。
// 要放在這些檔案後面；人物誌的樣式是打開書才插進來的，所以這裡的選擇器都多加 html body 提高優先度。
(function () {
  const T = '#E8E0D0', DIM = '#B5AA96', GOLD = 'rgba(201,161,58,.45)', P = 'html body ';
  const H = s => ['gh-on', 'hs-on', 'hk-on'].map(c => P + '#hub.' + c + ' ' + s).join(',');
  const css = document.createElement('style'); css.id = 'dark-theme';
  css.textContent = [
    P + '#hub.gh-on,' + P + '#hub.hs-on,' + P + '#hub.hk-on{--gh-washi:#221D29;--gh-sumi:' + T + ';--gh-shu:#A8442F}',
    // 委託單／白藤堂的卡片：深色牌子
    H('.quest') + ',' + H('.recipe') + '{background:linear-gradient(180deg,#26202E,#1C1822)!important;color:' + T + '!important;border:1px solid ' + GOLD + '!important;border-top:3px solid var(--c,#8A6A3A)!important;border-radius:4px!important;transform:none!important;box-shadow:0 2px 6px rgba(0,0,0,.4)!important}',
    // 任務單 hover／焦點：外圈白框（outline 畫在邊框外），不要改 border-color，免得跟遺跡難度色搞混
    H('.quest:hover') + ',' + H('.quest:focus-visible') + '{transform:none!important;outline:2px solid #fff!important;outline-offset:3px!important;border-color:' + GOLD + '!important;border-top-color:var(--c,#8A6A3A)!important}',
    H('.quest.gh-held') + '{outline:3px solid #fff!important;outline-offset:3px!important;box-shadow:0 2px 6px rgba(0,0,0,.4)!important}',
    H('.quest.gh-held:hover') + ',' + H('.quest.gh-held:focus-visible') + '{outline:3px solid #fff!important;outline-offset:3px!important;border-color:' + GOLD + '!important;border-top-color:var(--c,#8A6A3A)!important}',
    H('.ft-row:hover') + ',' + H('.ft-row:focus-visible') + ',' + H('.qb-row:hover') + ',' + H('.er-row:hover') + '{outline:2px solid #fff!important;outline-offset:2px!important}',
    H('.quest::before') + '{display:none!important}',
    H('.quest b') + ',' + H('.recipe b') + '{color:#F0E6D2!important}',
    H('.quest small') + ',' + H('.quest .note') + ',' + H('.recipe small') + '{color:' + DIM + '!important}',
    H('.recipe') + '{border-top-color:#6E5A8E!important}',
    H('.quest.gh-blocked') + '{background:linear-gradient(180deg,#2A1E22,#1E181C)!important}',
    H('.gh-meta span') + '{background:rgba(255,255,255,.05)!important;border-color:rgba(255,255,255,.14)!important;color:#D6CCB8!important}',
    H('.gh-why') + ',' + H('.hs-why') + '{color:#E0806A!important}',
    H('.gh-hanko') + '{width:38px!important;height:38px!important;font-size:12px!important;border-width:2px!important;opacity:.5!important;color:#C8604A!important;border-color:#C8604A!important;box-shadow:none!important}',
    // 告示板：深漆木（不要強烈的木紋）
    P + '#hub.gh-on .gh-pane[data-ghp="quest"] .gh-card:first-child{background:linear-gradient(180deg,#1E1712,#16110D)!important;border:1px solid #3A2A1C!important;border-top:3px solid #5A3E26!important;box-shadow:inset 0 0 24px rgba(0,0,0,.5)!important}',
    P + '.gh-board{background:linear-gradient(180deg,#2E2016,#22180F)!important;border:1px solid #5A4028!important;box-shadow:0 2px 6px rgba(0,0,0,.5)!important}',
    P + '.gh-board h2{color:' + T + '!important}',
    P + '.gh-kamon{background:#7A3426!important;color:#EAD9C0!important;box-shadow:none!important}',
    // 篩選、輸入框
    H('.gh-chip.on') + ',' + P + '.gh-chip.on{background:rgba(201,161,58,.18)!important;color:#F0D88A!important;border-color:rgba(201,161,58,.7)!important}',
    H('input[type=search]') + ',' + H('select') + ',' + H('.gh-tr input') + ',' + H('#rd-code') + '{background:#17141C!important;color:' + T + '!important;border:1px solid #4E4232!important}',
    // 米白色的一般按鈕 → 深色
    H('.btn:not(.pri):not(.red):not(.gold)') + ',' + H('.cf-card') + '{background:#2C2734!important;color:' + T + '!important;border-color:#5E5040!important}',
    H('.btn:not(.pri):not(.red):not(.gold):hover') + '{background:#383144!important}',
    H('.btn.gold') + '{background:#3A2E14!important;color:#F0D88A!important;border-color:#8A6A2A!important}',
    H('.mini') + '{color:' + T + '}',
    H('.btn:disabled') + ',' + H('.mini:disabled') + '{opacity:.45}',
    // 分頁暖簾：朱色調暗
    P + '.gh-tab.on,' + P + '#hub.hs-smith .subtabs .tab.on{background:linear-gradient(180deg,#8A3826,#6A2A1C)!important;color:#F2E6D4!important}',
    // 分頁暖簾下緣中間的切口（-webkit-mask 挖空）在深色底上看起來像一個黑色小方塊：拿掉
    P + '.gh-tab,' + P + '#hub .subtabs .tab{-webkit-mask:none!important;mask:none!important}',
    P + '#hub.hk-on .gh-tab.on{background:linear-gradient(180deg,#5E4482,#43305E)!important}',
    P + '.gh-card{background:linear-gradient(180deg,rgba(30,36,60,.35),rgba(22,19,28,.75))!important}',
    // 確認視窗
    P + '.gh-cf-card{background:#1E1A24!important;color:' + T + '!important;border:1px solid ' + GOLD + '!important;border-top:4px solid #A8442F!important}',
    P + '.gh-cf-card .btn:not(.red){background:#2C2734!important;color:' + T + '!important;border-color:#5E5040!important}',
    P + '.gh-cf-card .btn.red,' + P + '.hs-sell .btn.red{background:#8A3826!important;border-color:#5A2014!important;color:#F2E6D4!important}',
    // 人物誌：暗色舊紙
    P + '#kz-book .kz-p{background:#2A241D repeating-linear-gradient(0deg,transparent 0 27px,rgba(255,220,160,.035) 27px 28px)!important;color:#E2D6BE!important;border-color:#1A130C!important;outline-color:#4A3420!important}',
    P + '#kz-book .kz-tx,' + P + '#kz-book .kz-tx p,' + P + '#kz-book td{color:#E2D6BE!important}',
    P + '#kz-book td:first-child{color:#C8AE88!important}',
    P + '#kz-book td{border-bottom-color:rgba(200,170,120,.25)!important}',
    P + '#kz-book .kz-tx h3,' + P + '#kz-book .kz-hd i{color:#D88A70!important}',
    P + '#kz-book .kz-hd{border-bottom-color:#7A3426!important}',
    P + '#kz-book .kz-tabs button{background:#3A3127!important;color:#E2D6BE!important;border-color:#1A130C!important}',
    P + '#kz-book .kz-tabs button[aria-selected=true]{background:#7A3426!important;color:#F2E6D4!important}',
    P + '#kz-book button{background:#2E2A34!important;color:#E2D6BE!important}',
    P + '#kz-book .kz-c img{background:#1E1912!important;border-color:#4A3420!important}',
    // ── 2026-10-13 全遊戲統一（作者：「頁面更新後有些介面格格不入」）──
    // 共用的「紙」色票改成深色漆木：地圖說明欄、遺跡資料卡、怪物標籤等所有用 --paper 的地方一起變暗。
    'html:root{--paper:#211C27;--paper-ink:' + T + ';--paper-dim:' + DIM + ';--paper-line:rgba(201,161,58,.22);--hand-ink:#9EB6E8}',
    // 一般按鈕（城鎮選單、快速移動、設定、背包…）：米白 → 深色＋細金邊；.pri/.red/.gold/.on 等修飾仍照原樣
    'html body .btn{background:linear-gradient(180deg,#2E2836,#25202C);color:' + T + ';border-color:#5E5040}',
    'html body .btn:hover:not(:disabled){background:linear-gradient(180deg,#3A3244,#2E2836);border-color:rgba(201,161,58,.7)}',
    'html body .btn.pri{background:linear-gradient(180deg,#8A3826,#6A2A1C);border-color:#A8442F;color:#F2E6D4}',
    'html body .btn:focus-visible{outline:2px solid rgba(201,161,58,.8);outline-offset:1px}',
    // 地圖頁：左上國名牌、圖例、右側說明紙
    P + '.cartouche,' + P + '.legend{background:rgba(28,24,34,.94);color:' + T + ';border:1px solid ' + GOLD + ';box-shadow:0 6px 20px rgba(0,0,0,.5)}',
    P + '.cartouche small{color:' + DIM + '}',
    P + '.cartouche svg,' + P + '.cartouche .flag{border-color:' + GOLD + '}',
    P + '.doc{background:linear-gradient(180deg,#26202E,#1C1822);border:1px solid ' + GOLD + ';border-top:3px solid #8A6A3A;border-radius:4px;background-image:none}',
    P + '.doc h2,' + P + '.doc h3{color:#F0E6D2}',
    P + '.mon{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.14);color:#D6CCB8}',
    P + '.flag-big img{border-color:' + GOLD + '}',
    // 城鎮／遺跡內的彈窗：統一深色牌子＋金邊
    P + '#r-sheet,' + P + '#hub-sheet{border:1px solid ' + GOLD + ';border-top:3px solid #8A6A3A;box-shadow:0 10px 30px rgba(0,0,0,.6)}',
    P + '#kz-book .kz-ft{border-top-color:rgba(200,170,120,.25)!important}'
  ].join('\n');
  document.head.appendChild(css);
})();
