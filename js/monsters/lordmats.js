// 素材（2026-10-22 作者：像魔物獵人一樣細分素材；普通怪也掉素材；同套裝備穿幾件有加成；有些裝備有被動；圖鑑寫掉落機率）
// - 領主體：每一隻五種素材──一般（皮、鱗、甲）、部位（爪、牙、角）、骨殼、稀有部位、源晶（很難掉）。
//   打倒一隻抽 5 次（異變 7 次）；每次照 TIER 的機率抽一種。源晶另外單獨再抽一次（3%，異變 9%）。
// - 普通的遺跡生物：每一種一個素材，打倒時 18%（荒、獰、淵 25%）。
// - 鐵匠鋪：
//   領主套裝（四件：頭、身、腿、腳）：用那隻領主體的素材打造，每次做出還沒有的那一件；原本的專屬裝備是其中一件（保留牠的專屬效果）。
//     同套穿 2 件、4 件有加成（R.SETS，sets.js 照樣算），4 件另外有那一套的被動。
//   套裝防具（霜狼、熔岩、守墓人、影行者、祈禱者、遺跡探索者）：用相關的遺跡生物素材打造一件帶套裝紋的防具。
//   紅武（異變）：異變核心 ×3、任一種領主源晶 ×1、高純度魔力水晶 ×2、150,000 費拉。
// - 專屬裝備可以偏某些職業，但不要太刻板。
// - 素材很多種：背包每一種長寬再各 +1。
// 放在 lordplus.js、lordvariant.js、crafting.js、raid.js、sets.js 後面，maticons.js 前面。
(function (R) {
  const W = () => R.W, S = () => R.S, rnd = Math.random, esc = s => R.esc(s);
  const LM = R.LORD_MATS = {"gashadokuro":{"c":"#E8E0CC","p":[["gsk_bone","巨骸骨片"],["gsk_finger","骸王指骨"],["gsk_spine","骸王脊椎"],["gsk_crown","骸王頭骨冠"],["gsk_gem","萬骸源晶"]]},"spikewolf":{"c":"#2A2A32","p":[["spw_pelt","棘狼毛皮"],["spw_claw","棘狼利爪"],["spw_thorn","黑棘刺"],["spw_crown","狼王的棘冠"],["spw_gem","千棘源晶"]]},"kraken":{"c":"#5A2A4A","p":[["krk_arm","深淵觸腕"],["krk_sucker","王蛸吸盤"],["krk_ink","深淵墨囊"],["krk_eye","王蛸之眼"],["krk_gem","深淵源晶"]]},"tsuchigumo":{"c":"#B08AFF","p":[["tsg_silk","巢織蛛絲"],["tsg_fang","織母毒牙"],["tsg_shell","織母甲殼"],["tsg_sac","織母卵囊"],["tsg_gem","巢織源晶"]]},"windelder":{"c":"#C83A3A","p":[["wnd_feather","風神羽"],["wnd_talon","風神鉤爪"],["wnd_mask","緋色面皮"],["wnd_wingbone","天狂之翼骨"],["wnd_gem","天狂源晶"]]},"bonewyvern":{"c":"#D8D0BC","p":[["bwv_wingbone","朽翼骨"],["bwv_fang","亡骸龍牙"],["bwv_scale","朽龍鱗"],["bwv_horn","亡骸龍角"],["bwv_gem","亡骸源晶"]]},"omukade":{"c":"#8A3A2A","p":[["omk_plate","千足甲節"],["omk_jaw","噬骨顎"],["omk_gland","千足毒腺"],["omk_head","千足頭甲"],["omk_gem","噬骨源晶"]]},"muhyo":{"c":"#2A2A34","p":[["mhy_iron","大鎧鐵片"],["mhy_blade","大鎧刀片"],["mhy_lacquer","黑漆胴甲"],["mhy_mask","無主的鬼面"],["mhy_gem","魔王源晶"]]},"frostdeer":{"c":"#9AD8FF","p":[["frd_pelt","霜鹿毛皮"],["frd_shard","冰角碎片"],["frd_hoof","霜鹿蹄"],["frd_crown","永凍冰冠"],["frd_gem","永凍源晶"]]},"lavajaw":{"c":"#FF5A1A","p":[["lvj_scale","熔顎鱗"],["lvj_fang","熔顎牙"],["lvj_plate","熔岩甲片"],["lvj_jaw","熔獄之顎骨"],["lvj_gem","熔獄源晶"]]},"thunderape":{"c":"#FFE84A","p":[["thp_fur","雷猿毛皮"],["thp_knuckle","雷猿拳骨"],["thp_mane","帶電的鬃毛"],["thp_heart","萬雷之心"],["thp_gem","萬雷源晶"]]},"sandwhale":{"c":"#C8A868","p":[["sdw_hide","沙鯨皮"],["sdw_baleen","沙鯨鬚"],["sdw_bone","沙鯨骨"],["sdw_tooth","吞天鯨牙"],["sdw_gem","沙海源晶"]]},"faceforest":{"c":"#4A3424","p":[["ffr_bark","千面樹皮"],["ffr_fruit","人面果"],["ffr_root","古樹根"],["ffr_core","萬面之核"],["ffr_gem","千面源晶"]]},"carrionvulture":{"c":"#9A221C","p":[["cvl_feather","屍鷲羽"],["cvl_beak","緋喙"],["cvl_talon","屍鷲爪"],["cvl_plume","緋冠羽"],["cvl_gem","緋喙源晶"]]}};
  const MM = R.MON_MATS = {"abyssarm":["淵纏吸盤","離體後仍會緊附潮濕的岩面。"],"acidbubble":["蝕酸凝膜","包裹酸液的薄膜，破裂時會蝕傷金屬。"],"akane":["穢舌長筋","自長舌抽出的筋束，沾滿難除的污垢。"],"akaoni":["赤巨斷角","厚重的赤角斷面留有鐵棒磨痕。"],"ashcrow":["燼尾翎","羽端餘火未熄，抖動便散出火星。"],"azuki":["淘聲喉骨","浸水後輕搖，會傳出細碎的淘洗聲。"],"bakeneko":["匿影貓皮","毛皮在側光下會短暫隱去輪廓。"],"baku":["吞夢鼻囊","長鼻內的囊膜仍會吸附微量魔力。"],"bellcricket":["鳴鈴翅","翅脈相擦時會發出清脆鈴音。"],"blackmaw":["黑泥顎齒","埋在泥中的彎齒，受壓便向內扣合。"],"bladewheel":["環眼刃片","刃根留有眼膜，旋轉時微微收縮。"],"bonebird":["削骨飛羽","中空骨羽極輕，尖端如錐般銳利。"],"bonecentipede":["百節脊骨","互扣的骨節能承受猛烈的正面衝擊。"],"bonehound":["蝕骨犬牙","牙根帶有蝕痕，咬合面仍異常堅硬。"],"chochin":["喚群燈喉","燈腹中的喉膜會將微聲放大成尖鳴。"],"corebeast":["引雷粉晶","背部晶柱殘留電荷，雨前會發亮。"],"crysthog":["迸射晶刺","刺根帶有彈性囊，可將晶刺猛然推出。"],"datara":["鍛足硬踵","獨足底部的厚踵，密布長年落地的裂紋。"],"echobat":["回音耳膜","薄膜對細微回聲仍有明顯震動。"],"enenra":["纏煙凝絮","煙霧凝成的灰絮，揉散後又緩緩聚攏。"],"fukudo":["紅衣影縷","紅衣留下的細縷，夾著微亮的晶屑。"],"funa":["寒潮杓片","長杓殘片滲出冷水，拭乾後仍會再生。"],"gaki":["飢噬肉鬚","肉鬚離體後仍會朝養分緩緩伸展。"],"hitotsume":["獨目晶膜","大眼的透明外膜，會映出附近晶石。"],"honemusha":["墓衛腕骨","持盾腕骨異常緻密，表面沾有墓土。"],"hornbones":["催戰號骨","吹孔邊緣磨得光滑，敲擊會引起骨鳴。"],"hyakume":["群瞳眼皮","密布眼孔的韌皮，孔緣仍會交替閉合。"],"icewarden":["冰棺厚板","正面剝下的冰板，層紋緊密難以鑿穿。"],"inugami":["霧犬獠牙","牙根不斷逸出白霧，落地時霧氣驟聚。"],"isonade":["鯊尾倒鉤","鉤尖向內彎曲，深埋後極難拔出。"],"ittan":["縛身布縷","拉直的布縷會自行捲住接觸之物。"],"jinmenju":["面果根鬚","根鬚仍會纏繞，切口帶有果實甜味。"],"judgeeye":["金環眼筋","連著金環碎屑的眼筋，可傳導微光。"],"kamaitachi":["連獵鐮肢","前肢刃口纖薄，適合切開緊繃皮革。"],"kappa":["蓄水頂盤","盤內細孔能留住水分，乾燥後容易碎裂。"],"karasu":["三羽鴉翎","翎軸帶有三道凹槽，飛行時甚為穩定。"],"kasa":["旋雨傘骨","彎曲的舊傘骨，旋動時會凝出水珠。"],"kasha":["焚車焦鬃","焦黑鬃毛含著餘熱，摩擦便可引燃。"],"kitsune":["紫焰尾絨","尾絨燃著微弱紫火，映影常多出一重。"],"kodama":["轉首木節","頸部木節轉動時會發出清脆喀聲。"],"kousaku":["礦殼甲片","甲片夾著礦晶，敲開可見細密礦脈。"],"kudan":["諭路犢角","幼角上的天然紋路宛如交錯通道。"],"lampmoth":["燈腹光囊","腹囊離體後仍會散出柔黃光芒。"],"lavaturtle":["踏焰趾甲","厚趾甲中蓄有熱氣，受擊會吐出熱浪。"],"makura":["換位枕絮","枕絮投影的位置偶爾會與本體錯開。"],"mikoshi":["仰影長筋","凝視時筋束漸長，移開目光便會收縮。"],"mineba":["疾奔腿筋","枯瘦腿筋極具韌性，拉伸後迅速回彈。"],"mirrorgolem":["撞鏡胸片","鏡面嵌在石片中，邊緣留有撞擊裂痕。"],"mistwisp":["背燈霧露","白霧凝成的露珠，在背光處格外明亮。"],"mossball":["滾苔厚氈","層層青苔壓成厚氈，可緩和落地衝擊。"],"muddoll":["裂生泥塊","泥塊受壓後會裂成兩團相近的小塊。"],"nopperabo":["無紋面皮","面皮平滑無孔，逆光時幾乎看不見。"],"nozuchi":["鑽口環牙","環狀排列的硬牙，外緣磨滿地下砂痕。"],"nue":["夜雷尾鱗","蛇尾鱗片積著靜電，輕碰便發出低鳴。"],"nureo":["濕纏蛇鱗","濕潤鱗片彼此咬合，捲曲時不易滑脫。"],"nurikabe":["行壁磚髓","牆體深處的密實殘塊，裂縫會緩慢閉合。"],"okubi":["墜首額骨","巨額骨厚重如砧，內側遍布緩衝空腔。"],"okuriinu":["逐隙犬爪","爪尖向下急彎，適合扣住倒地獵物。"],"onibi":["游焰殘火","微小殘火懸而不落，遇水便迅速熄滅。"],"raiju":["紫電鼬毫","紫色硬毫儲有電荷，拖過地面便留電痕。"],"riftscorp":["緩毒尾針","紅色尾針含有使肌肉遲滯的毒液。"],"rokuro":["伸頸韌帶","頸內韌帶可伸長數倍，鬆手即回縮。"],"rustknight":["空鎧鏽鱗","空甲剝落的鏽片，仍保有盾面的弧度。"],"sandsinker":["潛砂腹甲","腹甲細紋可排開砂粒，觸感異常滑順。"],"setosho":["盤盾陶片","厚盤殘片層層相疊，釉面布滿刀痕。"],"shadelizard":["伏影蜥皮","扁平鱗皮吸收微光，在暗處難辨邊緣。"],"stonesnail":["石蝸螺殼","石質螺殼層層增厚，重量遠勝尋常岩塊。"],"sunakake":["藏砂布穗","粗布穗中夾著細砂，抖動便揚起砂幕。"],"tanuki":["震腹鼓皮","腹皮繃緊後輕敲，便可傳出低沉震波。"],"tengu":["捲嵐翼羽","黑羽羽脈呈螺旋狀，揮動時容易聚風。"],"tesso":["鐵齒門牙","門牙泛著鐵色，可在石面留下深痕。"],"thunderspider":["雷蛛背晶","背晶中閃著細電，接地後會持續放電。"],"tofuko":["凝腐盤渣","盤底留下的白色凝塊，黏性極強。"],"tsurube":["懸墜頭筋","連著頭骨的筋束，能承受驟然下墜。"],"twinshade":["雙映影屑","一片影屑能投出前後相連的兩道暗影。"],"ubume":["啼嬰喉羽","喉側細羽受風吹拂，聲響宛如嬰啼。"],"umiso":["黑潮頭皮","厚皮飽含黑水，擠壓時會湧出冷潮。"],"ushioni":["牛蛛衝角","粗角根部連著硬甲，適合承受正面衝撞。"],"voidwalker":["空胸殘膜","胸洞邊緣的薄膜，透出的景物略有錯位。"],"wanyudo":["焰輪焦輻","燒黑的輪輻仍有火線沿著木紋游走。"],"yamata":["八岔蛇骨","分岔脊骨承接多條頸椎，結構異常牢固。"],"yukiko":["雪童帽霜","草帽內凝結的霜粒，握緊後會結成硬團。"],"yukionna":["吐霜喉膜","喉膜接觸暖氣便會吐出一層白霜。"],"kyorinrin":["飛卷目紙","帶有眼紋的卷紙，撕下後仍會懸浮。"],"tsuchikoro":["滾土硬痂","外層泥土反覆滾壓，形成緊密的硬痂。"],"kanibo":["袈裟蟹甲","甲縫纏有舊布纖維，表面幾乎不留刃痕。"],"ogama":["巨蟾舌腱","粗大舌腱彈力驚人，末端覆著黏液。"],"kyokotsu":["井泥指骨","細長指骨沾著井泥，指尖磨成鉤狀。"],"aobo":["青目眼膜","青色眼膜在暗處泛光，映像時隱時現。"],"oshiroi":["覆面粉痂","面部白粉結成薄痂，碎裂便散作細塵。"],"hannya":["怨焰面角","面具斷角帶有焦紋，裂隙滲出幽火。"],"tenjo":["舐梁舌皮","長舌表皮布滿細鉤，附著陳年梁塵。"],"tenome":["掌瞳透膜","掌中眼膜透光極強，可將微光聚成細束。"],"futakuchi":["後口臼齒","後顎臼齒朝外生長，齒根纏著黑髮。"],"hihi":["狂猿臂筋","粗厚臂筋緊實如索，承重後仍不易變形。"],"oboro":["霧車簾縷","簾縷沾著不散的霧，展開時隱約浮出臉影。"],"glowslug":["熒黏腺","腺體滲出的黏液，乾燥後仍有淡光。"],"pebblemite":["礫黏甲殼","小甲殼覆著黏層，能牢牢固定碎石。"],"ruinrat":["赤目晶牙","啃食晶屑形成的硬牙，齒縫透出紅光。"],"sporepuff":["爆孢菌囊","成熟菌囊受擾便裂開，散出麻痺性粉末。"],"jellylamp":["藍燈觸鬚","透明觸鬚透著藍光，垂下時末端會蜷曲。"],"splitgel":["紫裂膠膜","紫色膠膜切開後，兩半各自收攏成團。"],"crystmantis":["晶螳刃臂","魔力結晶形成的前肢，刃緣薄而堅硬。"],"lanternwisp":["養魂燈燼","燈中殘燼散出暖光，能促進傷口癒合。"],"shieldbeetle":["護光盾殼","盾形甲殼受擊時會浮起一層微光。"],"ringbird":["銀環刃翎","銀翎外緣鋒利，彎曲羽軸便於迴旋。"],"prismeye":["聚束瞳晶","包著眼膜的晶片，可將散光收成直線。"],"gearsentry":["射釘棘輪","輪齒帶有卡槽，用於逐枚推送鐵釘。"],"tarbeast":["瀝黏獸皮","皮毛浸滿黑瀝青，受熱後黏性更強。"],"echoshade":["足音凝屑","暗色凝屑落地時，會多響一記腳步聲。"],"bonefiddler":["魂鳴琴弦","骨琴殘弦輕撥即鳴，弦端浮著淡火。"],"voidmoth":["星幕鱗粉","深色鱗粉帶有星點，揚起後會遮蔽視線。"],"starspider":["星黏蛛絲","蛛絲上閃著星點，纏住後極難掙斷。"],"mirrorwraith":["易位鏡屑","碎鏡中的影像，偶爾與旁物交換位置。"],"clockknight":["鳴時發條","胸鐘發條張力極強，鬆開時伴有鐘鳴。"],"twinhound":["雙首頸骨","分叉頸骨支撐雙頭，兩側磨痕各異。"],"thornqueen":["荊冠根刺","粗根長出的尖刺，斷口仍會萌出細棘。"],"abyssray":["淵電尾棘","尾棘浸入鹽水後，會持續釋出電流。"],"magmaturtle":["熔背殼板","厚殼夾著凝固岩漿，裂縫深處仍泛紅。"],"dunewyrm":["砂蠕環顎","環形巨顎內布滿倒齒，可扣住鬆散砂層。"],"frostgolem":["霜岩肩塊","冰層將碎岩緊密黏合，表面常覆新霜。"],"ashigaru":["遺甲槍鐏","舊槍尾端的金屬套，沾有空甲中的灰燼。"],"teppo":["影槍殘繩","焦黑火繩仍有紅點，靠近影子便微亮。"],"hatarei":["護軍旗縷","帶眼紋的破旗纖維，繃緊後泛出護光。"],"gunba":["戰馬蹄骨","蹄骨磨成斜面，殘留長途衝鋒的裂痕。"],"danto":["斷刃披片","披衣上剝落的斷刀片，刃口仍保有寒光。"],"housha":["砲蟹背管","背甲長成的砲管，內壁覆著耐熱硬層。"],"dankara":["引爆銅翅","黃銅色翅殼帶有引信殘根，摩擦易生火花。"],"rotsuki":["爐腹耐火磚","腹爐內壁的厚磚，受熱後會泛出深紅。"],"k_rift":["裂隙鉤爪","爪尖周圍有細小裂光，切口邊緣略微錯開。"],"k_echo":["疊響凝片","紫色凝片裂開時，會響起兩道相同餘音。"],"k_maw":["噬界顎膜","巨口內膜向內捲曲，會吸住附近輕物。"],"k_shade":["遲影殘縷","殘縷移動之後，投影總要晚一拍才跟上。"],"k_prism":["十字稜片","稜片可將入射魔光分成四道直束。"],"k_hollow":["虛甲紫襯","空甲內側的紫色殘膜，受壓時透出冷光。"],"tb_shell":["鐵棘甲鉤","鐵礦與甲質交融成鉤，倒刺極難折斷。"],"tb_snake":["鏡鱗晶襯","鏡鱗下的薄晶層，能將入射魔光折返。"]};
  const TIER = [['一般', 45, 30], ['部位', 30, 45], ['骨殼', 18, 60], ['稀有', 6, 150], ['源晶', 1, 600]];   // [名稱, 每次抽到的機率（%）, 價值]
  const GEM = 3, GEM_MUT = 9, ROLLS = 5, ROLLS_MUT = 7, MON = 18, MON_V = 25;
  const lordName = id => ((R.ENEMIES[id] || {}).name || '').replace(/^領主體・/, '');
  Object.keys(LM).forEach(id => { const L = LM[id]; L.p.forEach(([k, n], i) => { R.MATS[k] = { name: n, color: L.c, value: TIER[i][2], lord: id, tier: i, desc: lordName(id) + '身上的' + TIER[i][0] + '素材。' + (i === 4 ? '很難掉，紅武要用。' : '') }; }); });
  Object.keys(MM).forEach(id => { const d = R.ENEMIES[id]; R.MATS['mm_' + id] = { name: MM[id][0], color: (d && d.color) || '#8A8A8A', value: 8 + Math.round(((d && d.xp) || 8) * 0.8), mon: id, desc: MM[id][1] }; });
  R.MATS.anygem = { name: '任一種領主源晶', color: '#FF5A8A', value: 600, desc: '哪一隻領主體的源晶都可以。' };
  const gems = () => Object.keys(LM).map(id => LM[id].p[4][0]);
  const mh0 = R.matHave, ms0 = R.matSpend;
  R.matHave = k => (k === 'anygem' ? gems().reduce((a, g) => a + mh0(g), 0) : mh0(k));
  R.matSpend = (k, n) => { if (k !== 'anygem') return ms0(k, n); let left = n; gems().map(g => [g, mh0(g)]).sort((a, b) => b[1] - a[1]).forEach(([g, h]) => { const t = Math.min(h, left); if (t > 0) { ms0(g, t); left -= t; } }); };
  R.canCraft = rc => R.S.gold >= rc.gold && Object.keys(rc.mats).every(k => R.matHave(k) >= rc.mats[k]);
  // ---------- 掉落 ----------
  const isLord = e => e && e.def && /^領主體/.test(e.def.name || '');
  const roll = () => { let r = rnd() * 100; for (let i = 0; i < 4; i++) { if (r < TIER[i][1]) return i; r -= TIER[i][1]; } return 4; };
  const base = id => String(id).replace(/_v[123]$/, '');
  const ke0 = R.killEnemy;
  R.killEnemy = (e, by) => {
    const was = e && !e.dead, r = ke0(e, by);
    try {
      if (!(was && e.dead && W().run) || e.mirror || e.fake) return r;
      const L = LM[e.id];
      if (L && isLord(e)) {
        const mut = !!e.variant, got = {};
        for (let i = 0; i < (mut ? ROLLS_MUT : ROLLS); i++) { const k = L.p[roll()][0]; got[k] = (got[k] || 0) + 1; }
        if (rnd() * 100 < (mut ? GEM_MUT : GEM)) { const k = L.p[4][0]; got[k] = (got[k] || 0) + 1; }
        Object.keys(got).forEach((k, i) => setTimeout(() => R.dropMat(k, got[k], e.x + Math.sin(i * 1.3) * 1.2, e.z + Math.cos(i * 1.3) * 1.2), 300 + i * 120));
        if (got[L.p[4][0]]) setTimeout(() => R.banner && R.banner('掉了源晶！', R.MATS[L.p[4][0]].name), 1500);
      } else if (MM[base(e.id)] && !isLord(e) && rnd() * 100 < (e.id !== base(e.id) ? MON_V : MON)) R.dropMat('mm_' + base(e.id), 1, e.x, e.z);
    } catch (err) { console.warn('[lordmats]', err); }
    return r;
  };
  // ---------- 領主套裝 ----------
  const G = R.LORD_GEAR || {};
  if (!G.muhyo) G.muhyo = ['無主鬼面', 'head_horn', { def: 4, hp: 0.08 }, '物防 +4、生命 +8%'];
  // [重量, 套裝名, 2 件, 4 件, 2 件說明, 4 件說明]
  const LS = {
    gashadokuro: ['heavy', '萬骸', { hp: 0.1 }, { guard: 0.08, boneShield: 1 }, '生命 +10%', '受到的傷害 −8%；每 12 秒擋下一次攻擊（骸骨護身）'],
    spikewolf: ['medium', '千棘', { crit: 0.05 }, { crit: 0.05, thornsAura: 0.2 }, '暴擊率 +5%', '暴擊率再 +5%；近身打你的敵人吃回 20% 的傷害'],
    kraken: ['light', '深淵', { mpRegen: 1 }, { leech: 0.04, slow: 0.15 }, '每秒回復魔力 +1', '吸血 4%；打中時 15% 機率讓敵人減速'],
    tsuchigumo: ['light', '巢織', { slow: 0.12 }, { rootHit: 0.1, dmg: 0.06 }, '打中時 12% 機率讓敵人減速', '傷害 +6%；打中時 10% 機率用蛛絲纏住敵人 1 秒'],
    windelder: ['light', '天狂', { speed: 0.08 }, { dodge: 0.2, dodgeHit: 0.5 }, '移動 +8%', '翻滾冷卻 −20%；翻滾後 1.5 秒內的下一擊 +50%'],
    bonewyvern: ['medium', '亡骸', { critMult: 0.2 }, { low: 0.25, critMult: 0.1 }, '暴擊傷害 +20%', '對血量低的敵人傷害 +25%、暴擊傷害再 +10%'],
    omukade: ['medium', '噬骨', { dmg: 0.06 }, { leech: 0.05, stun: 0.08 }, '傷害 +6%', '吸血 5%；打中時 8% 機率暈眩'],
    muhyo: ['heavy', '魔王', { def: 6 }, { rage: 0.2, guard: 0.06 }, '物防 +6', '血量越低傷害越高（最多 +20%）；受到的傷害 −6%'],
    frostdeer: ['medium', '永凍', { slow: 0.15 }, { skillCd: 0.12, frostNova: 1 }, '打中時 15% 機率讓敵人減速', '技能冷卻 −12%；被打到時 20% 機率凍住身邊的敵人'],
    lavajaw: ['heavy', '熔獄', { dmg: 0.08 }, { dmg: 0.08, burn: 0.2 }, '傷害 +8%', '傷害再 +8%（共 16%）；打中時 20% 機率燃燒'],
    thunderape: ['medium', '萬雷', { stun: 0.08 }, { crit: 0.06, chainZap: 0.15 }, '打中時 8% 機率暈眩', '暴擊率 +6%；打中時 15% 機率落雷打旁邊的敵人'],
    sandwhale: ['heavy', '沙海', { calm: 0.1 }, { regen: 1.5, speed: 0.06 }, '佩特拉的注意上升 −10%', '每秒回復生命 +1.5、移動 +6%'],
    faceforest: ['medium', '千面', { regen: 1 }, { hp: 0.12, skillCd: 0.08 }, '每秒回復生命 +1', '生命 +12%、技能冷卻 −8%'],
    carrionvulture: ['light', '緋喙', { leech: 0.03 }, { low: 0.2, killHeal: 0.05 }, '吸血 3%', '對血量低的敵人傷害 +20%；打倒敵人回復 5% 生命']
  };
  const SLOTS = [['head', '盔'], ['body', '鎧'], ['legs', '腿甲'], ['feet', '靴']];
  if (R.SETS) Object.keys(LS).forEach(id => { const s = LS[id]; R.SETS['L_' + id] = { name: s[1], color: (LM[id] || {}).c || '#C83A3A', b2: s[2], b4: s[3], t2: s[4], t4: s[5], lord: id }; });
  const lv = () => { const s = S(); return Math.max(12, s && s.classes && s.classes[s.cls] ? s.classes[s.cls].lv : 12); };
  const slotOf = b => (/^head/.test(b) ? 'head' : /^body/.test(b) ? 'body' : /^legs/.test(b) ? 'legs' : 'feet');
  const own = id => { const s = S(), have = new Set(); (s.stash || []).forEach(it => { if (it && it.set === 'L_' + id) have.add(slotOf(it.base)); }); return have; };
  if (R.RECIPES) {
    for (let i = R.RECIPES.length - 1; i >= 0; i--) if (R.RECIPES[i].lordGear) R.RECIPES.splice(i, 1);
    Object.keys(LS).forEach(id => { const p = (LM[id] || {}).p; if (!p) return; const g = G[id];
      R.RECIPES.push({ tier: 3, name: '領主套裝：' + LS[id][1], get ilvl() { return lv(); }, mats: { [p[0][0]]: 4, [p[1][0]]: 2, [p[2][0]]: 2, [p[3][0]]: 1 }, gold: 15000, weights: [0, 0, 0, 0, 1, 0], lordSet: id,
        note: '每次做出還沒有的那一件（頭、身、腿、腳）。2 件：' + LS[id][4] + '；4 件：' + LS[id][5] + (g ? '。其中「' + g[0] + '」是專屬裝備：' + g[3] : '') }); });
  }
  // 套裝防具（一般套裝）：用相關的遺跡生物素材
  const GEN = { frostwolf: ['yukionna', 'icewarden', 'okuriinu'], lava: ['kasha', 'lavaturtle', 'ashcrow'], warden: ['honemusha', 'hornbones', 'bonehound'], shade: ['bakeneko', 'shadelizard', 'twinshade'], prayer: ['lanternwisp', 'mistwisp', 'judgeeye'], seeker: ['kousaku', 'mossball', 'tesso'] };
  if (R.RECIPES && R.SETS) Object.keys(GEN).forEach(sid => { const st = R.SETS[sid]; if (!st) return; const m = GEN[sid].filter(x => MM[x]); if (m.length < 3) return;
    R.RECIPES.push({ tier: 2, name: '套裝防具：' + st.name, get ilvl() { return lv(); }, mats: { ['mm_' + m[0]]: 4, ['mm_' + m[1]]: 3, ['mm_' + m[2]]: 2 }, gold: 6000, weights: [0, 0, 0, 7, 3, 0], genSet: sid, note: '做出一件帶「' + st.name + '」套裝紋的防具（部位隨機）。2 件：' + st.t2 + '；4 件：' + st.t4 }); });
  const cr0 = R.craft;
  R.craft = (rc, kind, base0) => {
    if (!rc || !(rc.lordSet || rc.genSet)) return cr0(rc, kind, base0);
    if (!R.canCraft(rc)) return null;
    R.S.gold -= rc.gold; Object.keys(rc.mats).forEach(k => R.matSpend(k, rc.mats[k]));
    let it;
    if (rc.lordSet) {
      const id = rc.lordSet, have = own(id), g = G[id], w = LS[id][0], gs = g ? slotOf(g[1]) : null;
      const left = SLOTS.filter(([s]) => !have.has(s)), pickS = left.length ? left[0] : SLOTS[Math.floor(rnd() * 4)], slot = pickS[0], nm = pickS[1];
      const b = slot === gs ? g[1] : slot + '_' + w;
      it = R.makeItem({ kind: 'armor', base: b, ilvl: rc.ilvl, rarity: 4, identified: true }); it.set = 'L_' + id; if (slot === gs) it.lord = id; else it.nameX = LS[id][1] + '之' + nm;
    } else {
      const slot = SLOTS[Math.floor(rnd() * 4)][0], w = ['light', 'medium', 'heavy'][Math.floor(rnd() * 3)];
      it = R.makeItem({ kind: 'armor', base: slot + '_' + w, ilvl: rc.ilvl, rarity: R.wpick(rc.weights), identified: true }); it.set = rc.genSet;
    }
    R.S.stash.push(it); R.save && R.save(); return it;
  };
  const nm0 = R.itemName; R.itemName = it => (it && it.nameX ? nm0(it).replace(/[^】]*$/, it.nameX) : nm0(it));
  // ---------- 套裝的被動（4 件） ----------
  const P = () => W().P, has = k => { const p = P(); return p && p.pv && p.pv[k]; };
  const hp0 = R.hurtPlayer;
  R.hurtPlayer = (raw, src, o) => {
    const p = P();
    try {
      if (p && has('boneShield') && raw > 0 && W().run && (p._bsT || 0) <= (W().run.t || 0)) { p._bsT = (W().run.t || 0) + 12; R.num && R.num(p.x, 2.2, p.z, '骸骨護身', 'heal'); R.fx && R.fx('ring', p.x, 0.1, p.z, { r: 1.5, color: '#E8E0CC' }); return; }
      if (p && src && src.def && !src.dead && has('thornsAura') && Math.hypot(src.x - p.x, src.z - p.z) < 3 && raw > 0) R.hurtEnemy(src, raw * p.pv.thornsAura, R.markNoVamp ? R.markNoVamp({ thorns: true }) : { thorns: true, noVamp: true });
      if (p && has('frostNova') && raw > 0 && rnd() < 0.2) (W().enemies || []).forEach(e => { if (!e.dead && e.st && Math.hypot(e.x - p.x, e.z - p.z) < 4) e.st.root = Math.max(e.st.root || 0, 1.5); });
    } catch (err) { }
    return hp0(raw, src, o);
  };
  const he0 = R.hurtEnemy;
  R.hurtEnemy = (e, raw, o) => {
    const r = he0(e, raw, o), p = P();
    try {
      if (p && e && o && o.primary && !o.thorns) {
        if (!e.dead && has('rootHit') && rnd() < p.pv.rootHit && e.st) e.st.root = Math.max(e.st.root || 0, 1);
        if (has('chainZap') && rnd() < p.pv.chainZap) { const n = (W().enemies || []).find(x => x !== e && !x.dead && Math.hypot(x.x - e.x, x.z - e.z) < 6); if (n) { R.fx && R.fx('ring', n.x, 0.1, n.z, { r: 1, color: '#FFE84A' }); he0(n, raw * 0.5, { elem: 'shock' }); } }
        if (e.dead && has('killHeal') && R.healP) R.healP(p.hpMax * p.pv.killHeal, true);
      }
    } catch (err) { }
    return r;
  };
  // 紅武：異變核心 ×3、任一種領主源晶 ×1
  (R.RECIPES || []).forEach(rc => { if (rc.name === '異變（紅武）') rc.mats = { mutacore: 3, anygem: 1, purecry: 2 }; });
  // ---------- 背包：每一種長寬再 +1 ----------
  if (R.PACKS && !R.PACKS._lm) { Object.values(R.PACKS).forEach(p => { if (p && p.w) { p.w++; p.h++; } }); Object.defineProperty(R.PACKS, '_lm', { value: 1 }); }
  // ---------- 圖鑑：掉落機率 ----------
  const pct = v => (v >= 0.995 ? '幾乎一定' : (v * 100 < 10 ? (v * 100).toFixed(1) : Math.round(v * 100)) + '%');
  const tag = k => (R.matIconTag ? R.matIconTag(k, 'chip') : '');
  R.dexDrops = id => {
    const L = LM[id];
    if (!L) { const m = MM[base(id)]; if (m) return '<h4 class="dx-h">掉落素材</h4><p>' + tag('mm_' + base(id)) + esc(m[0]) + '：' + MON + '%（荒、獰、淵 ' + MON_V + '%）</p><p class="note">' + esc(m[1]) + '</p>'; return R.dexWildDrops ? R.dexWildDrops(id) : ''; }
    const one = (i, n) => 1 - Math.pow(1 - TIER[i][1] / 100, n);
    const rows = L.p.map(([k, n], i) => { const p = i < 4 ? one(i, ROLLS) : 1 - (1 - one(4, ROLLS)) * (1 - GEM / 100), pm = i < 4 ? one(i, ROLLS_MUT) : 1 - (1 - one(4, ROLLS_MUT)) * (1 - GEM_MUT / 100);
      return '<tr><td>' + tag(k) + esc(n) + '</td><td>' + TIER[i][0] + '</td><td>' + pct(p) + '</td><td>' + pct(pm) + '</td></tr>'; }).join('');
    const s = LS[id];
    return '<h4 class="dx-h">掉落素材（打倒一隻至少掉一個的機率）</h4><table class="dx-drop"><tr><th>素材</th><th>種類</th><th>本體</th><th>異變</th></tr>' + rows + '</table>'
      + '<p class="note">一隻抽 ' + ROLLS + ' 次（異變 ' + ROLLS_MUT + ' 次），每次：一般 ' + TIER[0][1] + '%、部位 ' + TIER[1][1] + '%、骨殼 ' + TIER[2][1] + '%、稀有 ' + TIER[3][1] + '%、源晶 ' + TIER[4][1] + '%；源晶另外再抽一次（' + GEM + '%，異變 ' + GEM_MUT + '%）。</p>'
      + (s ? '<h4 class="dx-h">領主套裝「' + s[1] + '」</h4><p class="note">2 件：' + esc(s[4]) + '<br>4 件：' + esc(s[5]) + '</p>' : '');
  };
  const css = document.createElement('style'); css.textContent = '.dx-drop{width:100%;border-collapse:collapse;font-size:13px;margin:4px 0}.dx-drop td,.dx-drop th{padding:3px 6px;border-bottom:1px solid rgba(255,255,255,.08);text-align:left}.dx-drop th{opacity:.7;font-weight:normal}';
  document.head.appendChild(css);
})(window.R);
