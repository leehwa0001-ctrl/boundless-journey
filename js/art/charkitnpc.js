// 重要 NPC 的素材版樣子（2026-10-18 作者：以新版的人物模型繪製重要 NPC）
// - 原本的點陣圖照 look.sig 加各自的細節（storylooks.js 的 R.HERO_SIG）；素材版用這裡：照 sig 換上合適的款式（look），再疊專屬的細節（parts）。
// - look：只在素材版用的外觀（上衣、褲子、鞋子的款式和顏色、髮型），不改原本點陣圖的樣子。ckHair＝素材的髮型名（'' 不畫頭髮，例如戴著兜帽）；ckNoRace＝不畫種族特徵（耳朵、角收在兜帽裡）。
// - parts：[圖層, 變體, 顏色, 第二色]；顏色寫 'hair'／'top'／'cloak' 就用這個人的那個顏色。細節的圖在 charkit-full.js 的「人物」圖層（tools/charkit-extra.json）。
// - charkit.js 畫人物的時候問 R.CK_NPC[o.sig]；完整版還沒載入（沒有「人物」圖層）的時候只換款式。
(function (R) {
  R.CK_NPC = {
    // 望月瀧：白色長髮高馬尾（長到膝蓋）、紅髮帶、X 髮夾、黑羽織＋白衣領＋黑高領、紅腰帶和流蘇、黑袴（內側紅）、黑靴
    taki: { look: { ckHair: '瀧・長馬尾', topStyle: 'kimono', top2: '#B8262E', pantsStyle: 'hakama', shoeStyle: 'boots', shoe: '#16161A' }, parts: [['人物', '瀧・紅', '#B8262E']] },
    // 雷諾：亂髮（呆毛）、吊帶、橘色背帶的書包、抱著書、綁帶靴
    reno: { look: { hs: 'messy', shoeStyle: 'boots', shoe: '#5A3A22' }, parts: [['人物', '雷諾・呆毛', 'hair'], ['人物', '雷諾・吊帶', '#6A4228'], ['人物', '雷諾・書包', '#D8782E'], ['人物', '雷諾・書', '#3A5AA0']] },
    // 楚璐：鮑伯頭（髮尾淺）、耳骨夾、項鍊、斜拉鍊、褲鍊、黑靴
    churu: { look: { hs: 'bob', shoeStyle: 'boots', shoe: '#16161A' }, parts: [['人物', '楚璐・髮尾', '#C49A62'], ['人物', '楚璐・銀飾', '#C8C8D2']] },
    // 阿杏：道場的練習服（和服＋袴）
    achan: { look: { topStyle: 'kimono', top2: '#E8D8B0', pantsStyle: 'hakama', shoeStyle: 'sandals' } },
    // 伊歐：背心、長靴、背著箭筒
    io: { look: { topStyle: 'vest', top2: '#D8CFA8', shoeStyle: 'boots', shoe: '#4A3424' }, parts: [['人物', '伊歐・箭筒', '#7A5636']] },
    // 颯：大衣、斜背的彈帶
    sou: { look: { topStyle: 'coat', top2: '#3A3A30', shoeStyle: 'boots', shoe: '#2A231D' }, parts: [['人物', '颯・彈帶', '#3A3020', '#B8322A']] },
    // 望月巖：和服＋袴
    iwa: { look: { topStyle: 'kimono', top2: '#2A2A30', pantsStyle: 'hakama', shoeStyle: 'sandals' } },
    // 老周（公會考官）：背心、長靴
    laozhou: { look: { topStyle: 'vest', top2: '#D8D2C4', shoeStyle: 'boots' } },
    // 旅行商人：大衣、背著大背包
    merchant: { look: { topStyle: 'coat', shoeStyle: 'boots' }, parts: [['人物', '商人・背包', '#8A6A3A', '#C8A060']] },
    // 後巷的斗篷商：長袍、兜帽（頭髮收在兜帽裡）
    hooder: { look: { topStyle: 'robe', ckHair: '', ckNoRace: 1 }, parts: [['人物', '兜帽', '#3A3048']] },
    // 琵琶法師：長袍、背著琵琶
    biwa: { look: { topStyle: 'robe', shoeStyle: 'sandals' }, parts: [['人物', '琵琶', '#8A5A30']] },
    // 算命的老婆婆：長袍、有流蘇的披肩
    fortune: { look: { topStyle: 'robe', shoeStyle: 'sandals' }, parts: [['人物', '披肩', '#8A4A8A', '#C9A13A']] },
    // 老岩（鐵匠）：平頭、鬍子、皮圍裙
    oiwa: { look: { hs: 'crop', shoeStyle: 'boots' }, parts: [['鬍子', '短鬍', 'hair'], ['人物', '鐵匠圍裙', '#6A4A2E']] },
    // 白川（公會登記處）：背心（裡面白襯衫）
    shirakawa: { look: { topStyle: 'vest', top2: '#E8E4DA' } },
    // 菅婆婆（糰子攤）：和服
    suga: { look: { topStyle: 'kimono', top2: '#8A6A9A', shoeStyle: 'sandals' } }
  };
})(window.R = window.R || {});
