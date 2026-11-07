// 公會、鐵匠鋪、倉庫、白藤堂的外觀（2026-10-27 作者：公會的介面要美化，倉庫、鐵匠鋪、白藤堂也是）
// 只改樣子，不動按鈕、資料、邏輯。四家店原本共用同一套深色面板，分不出在哪一家；
// 公會的和風配色（藍、朱、木頭、和紙）只在公會頁有定義，其他三家拿不到，所以特別平。這裡每家店給一組自己的顏色和底紋：
// - 公會：藍染＋朱印，公告板的木紋
// - 老岩的鐵匠鋪：鐵灰＋爐火的橘光
// - 白藤堂（藥鋪）：白藤的淡紫＋藥櫃的木頭、和紙
// - 倉庫：木箱的琥珀色、木板紋
// 卡片、按鈕、分頁、說明文字統一：圓角、陰影、上緣一條店的主色；說明文字放大、亮一點。
// 放在 guildhall.js、smithstash.js、hakuto.js 後面（蓋過它們的樣式）；darktheme.js 在後面，用 html body #hub#hub 的權重蓋過它。
(function () {
  const css = document.createElement('style');
  css.id = 'hubtheme';
  css.textContent = [
    // ---------- 每家店的顏色 ----------
    'html body #hub#hub.gh-on{--hb-acc:#C2412D;--hb-acc-d:#8E2C1E;--hb-ink:#F4EAD4;--hb-panel:rgba(30,36,52,.78);--hb-panel2:rgba(24,28,40,.9);--hb-edge:rgba(242,232,210,.16);--gh-ai:#2E4A6E;--gh-shu:#C2412D;--gh-wood:#4A2F1C;--gh-wood2:#6B4527}',
    'html body #hub#hub.hs-smith{--hb-acc:#E0782E;--hb-acc-d:#9A4A16;--hb-ink:#F2E6D6;--hb-panel:rgba(40,37,36,.82);--hb-panel2:rgba(28,26,25,.92);--hb-edge:rgba(255,170,90,.18);--gh-ai:#4A4F58;--gh-shu:#E0782E;--gh-wood:#2E2A28;--gh-wood2:#45403B}',
    'html body #hub#hub.hk-on{--hb-acc:#9C7FD0;--hb-acc-d:#5E4A8E;--hb-ink:#F4EEE6;--hb-panel:rgba(46,38,52,.78);--hb-panel2:rgba(32,27,36,.92);--hb-edge:rgba(214,196,240,.22);--gh-ai:#6E5A9E;--gh-shu:#B26AA8;--gh-wood:#7A5A3A;--gh-wood2:#946E48}',
    'html body #hub#hub.hs-stash{--hb-acc:#D8A040;--hb-acc-d:#8E6420;--hb-ink:#F4EAD8;--hb-panel:rgba(50,38,26,.8);--hb-panel2:rgba(34,26,18,.92);--hb-edge:rgba(232,190,120,.2);--gh-ai:#6B4527;--gh-shu:#D8A040;--gh-wood:#5A3A22;--gh-wood2:#7A5232}',
    // ---------- 底紋 ----------
    '#hub.gh-on #hub-body{background:radial-gradient(120% 60% at 50% -10%,rgba(46,74,110,.45),transparent 60%),repeating-linear-gradient(90deg,rgba(255,255,255,.012) 0 2px,transparent 2px 9px),linear-gradient(180deg,#171B24,#0F1117)}',
    '#hub.hs-smith #hub-body{background:radial-gradient(90% 45% at 50% -8%,rgba(224,120,46,.32),transparent 62%),radial-gradient(60% 30% at 85% 110%,rgba(224,120,46,.12),transparent 70%),repeating-linear-gradient(135deg,rgba(255,255,255,.015) 0 3px,transparent 3px 10px),linear-gradient(180deg,#1C1A19,#0E0D0D)}',
    '#hub.hk-on #hub-body{background:radial-gradient(100% 55% at 30% -10%,rgba(156,127,208,.3),transparent 60%),radial-gradient(70% 40% at 90% 0,rgba(242,236,226,.06),transparent 70%),repeating-linear-gradient(0deg,rgba(255,255,255,.012) 0 1px,transparent 1px 6px),linear-gradient(180deg,#211B25,#141116)}',
    '#hub.hs-stash #hub-body{background:radial-gradient(100% 50% at 50% -10%,rgba(216,160,64,.22),transparent 60%),repeating-linear-gradient(0deg,rgba(0,0,0,.18) 0 2px,transparent 2px 46px),repeating-linear-gradient(90deg,rgba(255,220,160,.025) 0 1px,transparent 1px 7px),linear-gradient(180deg,#221A13,#130E0A)}',
    // ---------- 上面的店名列：選中的那家用自己的顏色 ----------
    '#hub.gh-on .bar .tab[aria-selected="true"],#hub.hs-smith .bar .tab[aria-selected="true"],#hub.hk-on .bar .tab[aria-selected="true"],#hub.hs-stash .bar .tab[aria-selected="true"]{background:var(--hb-acc);border-color:var(--hb-acc);color:#140E0A;box-shadow:0 0 0 2px rgba(0,0,0,.25),0 0 14px color-mix(in srgb,var(--hb-acc) 45%,transparent)}',
    // ---------- 招牌 ----------
    '#hub .gh-board{box-shadow:0 4px 0 rgba(0,0,0,.35),0 10px 24px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.08)}',
    '#hub .gh-board h2{letter-spacing:.12em;text-shadow:0 2px 0 rgba(0,0,0,.45)}',
    '#hub .gh-kamon{background:var(--gh-shu);box-shadow:inset 0 0 0 3px rgba(255,255,255,.25),0 0 12px color-mix(in srgb,var(--gh-shu) 50%,transparent)}',
    // ---------- 狀態列 ----------
    '#hub .gh-sum{background:var(--hb-panel2);border:1px solid var(--hb-edge);box-shadow:0 6px 18px rgba(0,0,0,.35);backdrop-filter:blur(4px)}',
    '#hub .gh-s{border-left-color:var(--hb-acc)}',
    '#hub .gh-s small{color:color-mix(in srgb,var(--hb-ink) 70%,transparent);font-size:12px;letter-spacing:.05em}',
    '#hub .gh-s b{color:var(--hb-ink);font-size:16px}',
    // ---------- 暖簾分頁、子分頁 ----------
    '#hub .gh-noren{border-bottom-color:var(--hb-acc)}',
    '#hub .gh-tab{background:linear-gradient(180deg,color-mix(in srgb,var(--gh-ai) 92%,#fff 8%),var(--gh-ai));border-radius:8px 8px 0 0;transition:transform .12s,filter .12s}',
    '#hub .gh-tab:hover{filter:brightness(1.12);transform:translateY(-1px)}',
    '#hub .gh-tab.on{background:linear-gradient(180deg,color-mix(in srgb,var(--hb-acc) 85%,#fff 15%),var(--hb-acc));color:#140E0A}',
    '#hub .subtabs{gap:6px;border-bottom:3px solid var(--hb-acc);padding-bottom:0}',
    '#hub .subtabs .tab{border-radius:8px 8px 0 0;background:var(--hb-panel2);border:1px solid var(--hb-edge);border-bottom:none}',
    '#hub .subtabs .tab.on{background:var(--hb-acc);color:#140E0A;border-color:var(--hb-acc)}',
    // ---------- 卡片 ----------
    '#hub .gh-card,#hub .recipe,#hub .pk-card,#hub .cf-card,#hub .item-card,#hub .cs-box,#hub .bomb-shop .recipe,#hub .fat-shop .recipe{background:linear-gradient(180deg,var(--hb-panel),var(--hb-panel2));border:1px solid var(--hb-edge);border-radius:10px;box-shadow:0 2px 0 rgba(0,0,0,.3),0 8px 18px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.05)}',
    '#hub .gh-card{border-top:3px solid var(--hb-acc)}',
    // darktheme.js（後面載入）用 !important 把 .recipe 全部塗成同一種紫灰色：這裡用更高的權重蓋回每家店自己的顏色（委託單 .quest 照舊，上緣是遺跡難度色）
    "html body #hub#hub .recipe{background:linear-gradient(180deg,var(--hb-panel),var(--hb-panel2))!important;border:1px solid var(--hb-edge)!important;border-top:3px solid var(--hb-acc)!important;border-radius:10px!important;box-shadow:0 2px 0 rgba(0,0,0,.3),0 8px 18px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.05)!important}",
    // 家紋、選中的分頁：darktheme.js 統一用暗朱色；改成每家店主色的暗色版（還是暗的，不刺眼）
    'html body #hub#hub .gh-kamon{background:var(--hb-acc-d)!important;box-shadow:inset 0 0 0 2px rgba(255,255,255,.18)!important}',
    'html body #hub#hub .gh-tab.on,html body #hub#hub .subtabs .tab.on{background:linear-gradient(180deg,color-mix(in srgb,var(--hb-acc) 80%,#000 20%),var(--hb-acc-d))!important;color:#FFF6EA!important;border-color:var(--hb-acc-d)!important}',
    'html body #hub#hub .recipe:hover{transform:translateY(-2px)!important;box-shadow:0 2px 0 rgba(0,0,0,.3),0 12px 24px rgba(0,0,0,.35),0 0 0 1px color-mix(in srgb,var(--hb-acc) 40%,transparent)!important}',
    '#hub .recipe,#hub .pk-card{transition:transform .12s,box-shadow .12s}',
    '#hub .recipe:hover,#hub .pk-card:hover{transform:translateY(-2px);box-shadow:0 2px 0 rgba(0,0,0,.3),0 12px 24px rgba(0,0,0,.35),0 0 0 1px color-mix(in srgb,var(--hb-acc) 40%,transparent)}',
    '#hub .pk-card.on{box-shadow:0 0 0 2px var(--hb-acc),0 8px 18px rgba(0,0,0,.3)}',
    '#hub .recipe b,#hub .pk-card b{font-size:16px}',
    '#hub h3{color:var(--hb-acc);letter-spacing:.06em}',
    // ---------- 文字 ----------
    '#hub .note,#hub .recipe small,#hub .pk-card small{color:#DCD2C2;font-size:14px;line-height:1.6}',
    '#hub .hs-why,#hub .gh-why{color:#FF9A7A}',
    // ---------- 按鈕 ----------
    '#hub .btn.pri{background:linear-gradient(180deg,color-mix(in srgb,var(--hb-acc) 88%,#fff 12%),var(--hb-acc-d));border-color:var(--hb-acc);color:#FFF8EC;text-shadow:0 1px 0 rgba(0,0,0,.4);box-shadow:0 2px 0 rgba(0,0,0,.35)}',
    '#hub .btn.pri:hover:not(:disabled){filter:brightness(1.1)}',
    '#hub .btn.pri:disabled{filter:grayscale(.7) brightness(.7)}',
    '#hub .btn:not(.pri){border-color:var(--hb-edge)}',
    // 手機：卡片間距小一點
    '@media (max-width:640px){#hub .recipe b,#hub .pk-card b{font-size:15px}#hub .note{font-size:13.5px}}'
  ].join('\n');
  document.head.appendChild(css);
})();
