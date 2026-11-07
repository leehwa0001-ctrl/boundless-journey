// 英文、德文字典・第三階段之九（2026-10-27）：東鶴的室內（公會、鐵匠鋪、白藤堂、倉庫、驛站、赤提燈）和各城的設施（貨運、外貿、船屋、鋼鐵廠、軍艦博物館、大學、機場、地方委託）。
(function (R) {
  if (!R.i18nAdd) return;
  R.i18nAdd([
    // ---------- 室內的樓層、出口 ----------
    ['一樓・大廳與酒場', 'Ground floor · Hall and tavern', 'Erdgeschoss · Halle und Schenke'], ['出去（回到西市口）', 'Exit (back to the west market gate)', 'Hinaus (zurück zum Westmarkt)'],
    ['二樓・資料室', 'First floor · Archive', 'Erster Stock · Archiv'], ['店面・工房・後院', 'Shop · Workshop · Back yard', 'Laden · Werkstatt · Hinterhof'],
    ['出去（回到街上）', 'Exit (back to the street)', 'Hinaus (zurück auf die Straße)'], ['藥鋪', 'Apothecary', 'Apotheke'], ['出去（回到西市街）', 'Exit (back to West Market Street)', 'Hinaus (zurück zur Westmarktstraße)'],
    ['土藏', 'Storehouse', 'Speicher'], ['驛站', 'Post station', 'Poststation'], ['候車室・售票口', 'Waiting room · Ticket window', 'Wartesaal · Fahrkartenschalter'], ['出去（回到大路口）', 'Exit (back to the main crossing)', 'Hinaus (zurück zur Hauptkreuzung)'],
    ['居酒屋・樓上是宿屋', 'Izakaya · Inn upstairs', 'Izakaya · Gasthaus oben'],
    ['登記處在最裡面，委託貼在北邊的牆上；東邊是酒場', 'Registration is at the back, requests are posted on the north wall; the tavern is to the east', 'Die Anmeldung ist ganz hinten, Aufträge hängen an der Nordwand; östlich ist die Schenke'],
    ['「進來把門帶上，風一直灌進來。」', '“Come in and shut the door, the wind keeps blowing in.”', '„Komm rein und mach die Tür zu, es zieht.“'],
    ['藥草和驅寒茶的味道', 'The smell of herbs and warming tea', 'Der Duft von Kräutern und wärmendem Tee'],
    ['「寄放的東西，報名字就好。」', '“For stored items, just give your name.”', '„Für eingelagerte Sachen reicht dein Name.“'],
    ['售票口在最裡面，時刻表在左邊的牆上', 'The ticket window is at the back, the timetable on the left wall', 'Der Schalter ist ganz hinten, der Fahrplan an der linken Wand'],
    ['「歡迎光臨！」老闆娘的聲音從櫃台後面傳來', '“Welcome!” the proprietress calls from behind the counter', '„Willkommen!“, ruft die Wirtin hinter dem Tresen'],
    ['公會東鶴分館・二樓', 'Guild Donghe Branch · First floor', 'Gilde Donghe · Erster Stock'], ['資料室：遺跡生物圖鑑、全國遺跡分布圖', 'Archive: ruin bestiary, national ruin map', 'Archiv: Ruinen-Bestiarium, Landeskarte der Ruinen'],

    // ---------- 公會大廳 ----------
    ['酒場', 'Tavern', 'Schenke'], ['登記處', 'Registration', 'Anmeldung'], ['白川', 'Shirakawa', 'Shirakawa'],
    ['登記處：職業登記・轉職・隊伍名冊', 'Registration: class registration · class change · party roster', 'Anmeldung: Klassenregistrierung · Klassenwechsel · Gruppenliste'],
    ['委託告示板：遺跡委託', 'Request board: ruin requests', 'Auftragsbrett: Ruinenaufträge'],
    ['上二樓（資料室：遺跡生物圖鑑、全國地圖）', 'Go upstairs (archive: ruin bestiary, national map)', 'Nach oben (Archiv: Ruinen-Bestiarium, Landeskarte)'],
    ['收購窗口的館員', 'Buyback window clerk', 'Beamter am Ankaufsschalter'], ['收購窗口：賣掉遺跡帶回來的素材', 'Buyback window: sell materials from the ruins', 'Ankaufsschalter: Ruinenmaterial verkaufen'],
    ['酒場的老闆', 'Tavern keeper', 'Schankwirt'], ['和酒場的老闆聊聊（遺跡的傳聞）', 'Chat with the tavern keeper (ruin rumours)', 'Mit dem Schankwirt plaudern (Ruinengerüchte)'],
    ['「熱湯一碗，暖了身子再下去。」', '“A bowl of hot soup. Warm up before you go down.”', '„Eine Schale heiße Suppe. Wärm dich auf, bevor du runtergehst.“'],
    ['「調查點的人剛來喝過湯，說城西的魔力濃度又升了。你要去的話，先去問問他們。」', '“The survey post folks just came by for soup. They say mana in the west ruin rose again. If you’re going, ask them first.”', '„Die Leute vom Vermessungsposten waren gerade zur Suppe hier. Das Mana in der Westruine ist wieder gestiegen. Wenn du hingehst, frag sie vorher.“'],
    ['在酒場的勇者', 'Adventurer in the tavern', 'Abenteurer in der Schenke'], ['和在酒場的勇者聊聊', 'Chat with the adventurer in the tavern', 'Mit dem Abenteurer in der Schenke plaudern'],
    ['「我今天有約了。你要找同行的，到大廳問問，剛才那邊還有人。」', '“I’ve got plans today. If you want company, ask in the hall; there were people there just now.”', '„Ich bin heute verabredet. Wenn du Begleitung suchst, frag in der Halle; eben war da noch wer.“'],
    ['館員辦公室', 'Clerks’ office', 'Beamtenbüro'], ['資料室', 'Archive', 'Archiv'], ['下樓（回到大廳）', 'Go downstairs (back to the hall)', 'Nach unten (zurück in die Halle)'],
    ['昭旭全國的遺跡分布圖（地圖大桌）', 'Map of Zhaoxu’s ruins (big map table)', 'Karte der Ruinen von Zhaoxu (großer Kartentisch)'],
    ['遺跡生物圖鑑（翻開公會的圖鑑）', 'Ruin bestiary (open the guild’s bestiary)', 'Ruinen-Bestiarium (das Bestiarium der Gilde aufschlagen)'],
    ['資料室的館員', 'Archive clerk', 'Archivbeamter'], ['和資料室的館員說話', 'Talk to the archive clerk', 'Mit dem Archivbeamten reden'],
    ['「這裡的資料都是勇者們帶回來的。看完記得放回原位。」', '“Everything here was brought back by adventurers. Put things back where you found them.”', '„Alles hier haben Abenteurer mitgebracht. Leg es zurück, wo es war.“'],
    ['「圖鑑上的遺跡生物，有的只在特定的分級或環境裡出現。去之前先翻一翻。」', '“Some creatures in the bestiary only appear in certain grades or environments. Have a look before you go.”', '„Manche Wesen im Bestiarium tauchen nur in bestimmten Stufen oder Umgebungen auf. Schau vorher rein.“'],
    ['和在辦公的館員說話', 'Talk to the clerk at work', 'Mit dem arbeitenden Beamten reden'],
    ['「委託書先放這裡，我看一下章有沒有漏。」', '“Leave the request form here; let me check none of the stamps are missing.”', '„Leg das Auftragsblatt hierhin, ich schau, ob kein Stempel fehlt.“'],
    ['「今天送回來的調查報告……又是城西遺跡。」', '“Today’s survey report… the west ruin again.”', '„Der heutige Vermessungsbericht… wieder die Westruine.“'],
    ['「這櫃不能自己翻。你要查自己的資料嗎？勇者證給我。」', '“You can’t go through this cabinet yourself. Want to check your own records? Give me your adventurer card.”', '„In diesem Schrank darfst du nicht selbst suchen. Willst du deine Akte sehen? Gib mir deinen Ausweis.“'],
    ['「出發前記得看一下委託告示板，有新的就會貼上去。」', '“Check the request board before you set out; new ones get posted there.”', '„Schau vor dem Aufbruch aufs Auftragsbrett, neue Aufträge hängen dort.“'],
    ['分館長室', 'Branch head’s office', 'Büro des Zweigstellenleiters'], ['分館長室的門', 'Door to the branch head’s office', 'Tür zum Büro des Zweigstellenleiters'],
    ['門關著。門牌上寫著「分館長」。', 'The door is shut. The plate reads “Branch Head”.', 'Die Tür ist zu. Auf dem Schild steht „Zweigstellenleiter“.'],
    ['裡面傳出翻文件的聲音。', 'You hear papers being shuffled inside.', 'Drinnen raschelt Papier.'],

    // ---------- 酒場的傳聞 ----------
    ['摩爾斯級的尾隨犬會一直跟著你，跌倒、翻滾的那一刻整群撲上來。', 'Mors-grade Stalker Hounds keep following you, and the whole pack pounces the moment you stumble or roll.', 'Pirschhunde der Mors-Stufe folgen dir ständig und stürzen sich als Rudel auf dich, sobald du stolperst oder rollst.'],
    ['守墓骨兵正面幾乎打不動。等牠揮完刀、盾放下來的時候再打，或繞到背後。', 'Tomb Guard Skeletons barely take damage from the front. Hit them after they swing and lower the shield, or get behind them.', 'Grabwächter-Skelette sind von vorn kaum zu verletzen. Schlag zu, wenn sie nach dem Hieb den Schild senken, oder geh hinter sie.'],
    ['盤頂蛙頭上的盤子，用重一點的攻擊把它打翻，牠就會呆住，那時候打牠特別痛。', 'Knock over the dish on a Dish-head Frog with a heavy attack and it freezes up; hits land extra hard then.', 'Wirf die Schale auf dem Kopf des Schalenkopf-Froschs mit einem schweren Angriff um, dann erstarrt er, und Treffer tun besonders weh.'],
    ['腳下冒出紅圈就快跑──十之八九是鑽口蛇要鑽出來了。鑽在地底的時候根本打不到。', 'If a red circle appears under your feet, run: nine times out of ten a Borer Serpent is about to burst out. You can’t hit it while it’s underground.', 'Erscheint unter dir ein roter Kreis, lauf – fast immer bricht gleich eine Bohrschlange hervor. Unter der Erde kannst du sie nicht treffen.'],
    ['喚群燈一叫，整區的生物都會過來。看到了就先打掉它。', 'When a pack-calling lantern cries out, every creature in the area comes. Take it out first when you see one.', 'Ruft eine Rudelruf-Laterne, kommt alles aus der Gegend. Schalt sie zuerst aus, wenn du eine siehst.'],
    ['克森特級的入口會自己關起來。進去之前，藥一定要帶夠。', 'Kesent-grade entrances close on their own. Bring plenty of potions before you go in.', 'Eingänge der Kesent-Stufe schließen sich von selbst. Nimm genug Tränke mit, bevor du reingehst.'],
    ['群瞳看著你的時候，佩特拉的注意會一直往上升。別跟它對看太久。', 'While the many-pupilled eye watches you, Petra’s attention keeps rising. Don’t lock eyes with it too long.', 'Solange das Vielpupillen-Auge dich ansieht, steigt Petras Aufmerksamkeit. Starr nicht zu lange zurück.'],
    ['蛛身牛低頭刨地就是要衝了。閃到旁邊讓牠撞牆，撞暈了才是機會。', 'When a Spider-Bull lowers its head and paws the ground, it’s about to charge. Dodge aside so it hits the wall; your chance comes when it’s stunned.', 'Senkt ein Spinnenstier den Kopf und scharrt, stürmt er gleich los. Weich aus, damit er gegen die Wand rennt; betäubt ist er verwundbar.'],
    ['纏身布衝過來之前，地上會先出現一條紅線。被纏住就動不了。', 'Before a Binding Cloth lunges, a red line appears on the ground. Once it wraps you, you can’t move.', 'Bevor ein Fesseltuch zustößt, erscheint eine rote Linie am Boden. Hat es dich umwickelt, kannst du dich nicht bewegen.'],
    ['影撲貓壓低身子的時候看地上的圈，撲完會隱身一下，別追丟了。', 'When a Shadow-Pounce Cat crouches, watch the circle on the ground. It vanishes briefly after pouncing, so don’t lose track.', 'Duckt sich eine Schattensprungkatze, achte auf den Kreis am Boden. Nach dem Sprung verschwindet sie kurz – verlier sie nicht.'],
    ['根童挨打就跑，你一鬆懈又圍回來吐種子。打不太痛，可是很煩。', 'Root Sprites run when hit and circle back to spit seeds the moment you relax. Not painful, just annoying.', 'Wurzelkinder fliehen bei Treffern und kommen zurück, um Samen zu spucken, sobald du nachlässt. Tut nicht weh, nervt aber.'],
    ['房間裡的生物平常只是在晃。你一踏進去，或從外面打到牠們，整間都會醒過來。', 'Creatures in a room usually just wander. Step inside, or hit them from outside, and the whole room wakes up.', 'Wesen in einem Raum streifen meist nur umher. Betrittst du ihn oder triffst sie von draußen, wird der ganze Raum wach.'],

    // ---------- 鐵匠鋪 ----------
    ['工房', 'Workshop', 'Werkstatt'], ['老岩', 'Old Iwa', 'Der alte Iwa'], ['櫃台', 'Counter', 'Tresen'],
    ['店面的櫃台：買老岩打好的東西（製作）', 'Shop counter: buy Old Iwa’s finished work (crafting)', 'Ladentresen: Fertiges vom alten Iwa kaufen (Herstellen)'],
    ['爐子：打造新的裝備（製作）', 'Forge: make new equipment (crafting)', 'Esse: neue Ausrüstung schmieden (Herstellen)'],
    ['跟老岩說話（鑑定・製作・強化・分解）', 'Talk to Old Iwa (identify · craft · enhance · salvage)', 'Mit dem alten Iwa reden (Identifizieren · Herstellen · Verstärken · Zerlegen)'],
    ['鑑定台：鑑定遺跡帶出來的東西', 'Appraisal table: identify finds from the ruins', 'Prüftisch: Funde aus den Ruinen identifizieren'],
    ['廢料箱：分解不要的裝備', 'Scrap bin: salvage unwanted equipment', 'Schrottkiste: unerwünschte Ausrüstung zerlegen'],
    ['炭窯', 'Charcoal kiln', 'Kohlenmeiler'], ['鐵匠鋪用的炭都是自己燒的。', 'The smithy burns all its own charcoal.', 'Die Schmiede brennt ihre Kohle selbst.'],
    ['學徒說：「師父說買來的炭火不夠旺，遺跡帶出來的礦石燒不透。」', 'The apprentice says: “The master says bought charcoal doesn’t burn hot enough to work ore from the ruins.”', 'Der Lehrling sagt: „Der Meister meint, gekaufte Kohle brennt nicht heiß genug für Erz aus den Ruinen.“'],
    ['礦車', 'Ore cart', 'Erzlore'], ['北山礦坑運來的礦石，上面還沾著遺跡的粉。', 'Ore from the North Mountain mine, still dusted with ruin powder.', 'Erz aus der Nordberg-Mine, noch mit Ruinenstaub bedeckt.'],
    ['有幾塊在暗處會微微發光。', 'A few pieces glow faintly in the dark.', 'Ein paar Brocken glimmen im Dunkeln.'],
    ['水井', 'Well', 'Brunnen'], ['井水冰得刺骨。', 'The well water is bone-chillingly cold.', 'Das Brunnenwasser ist eiskalt.'], ['淬火的水都是從這裡打的。', 'All the quenching water is drawn from here.', 'Das Wasser zum Abschrecken kommt von hier.'],

    // ---------- 白藤堂 ----------
    ['白藤堂的掌櫃', 'Hakutō’s shopkeeper', 'Ladenbesitzer von Hakutō'],
    ['櫃台：回復藥、魔力藥、藥草換藥', 'Counter: healing potions, mana potions, herb exchange', 'Tresen: Heiltränke, Manatränke, Kräutertausch'],
    ['從藥架上摸走一瓶藥', 'Pocket a potion from the shelf', 'Einen Trank aus dem Regal stibitzen'],
    ['白藤堂的學徒', 'Hakutō’s apprentice', 'Lehrling von Hakutō'], ['和搗藥的學徒說話', 'Talk to the apprentice grinding medicine', 'Mit dem Lehrling am Mörser reden'],
    ['「驅寒藥一箱要送到湯山村，天黑前、兩個人一起……」', '“A box of warming medicine has to go to Yushan Village, before dark, two people together…”', '„Eine Kiste Wärmemittel muss nach Yushan, vor Einbruch der Dunkelheit, zu zweit…“'],
    ['「以前這種送貨都是新人勇者接的。」', '“Rookie adventurers used to take deliveries like this.”', '„Solche Lieferungen haben früher neue Abenteurer übernommen.“'],
    ['驅寒茶（熱茶葉 8 費拉）', 'Warming tea (tea leaves, 8 Fera)', 'Wärmetee (Teeblätter, 8 Fera)'],
    ['「……請回吧。」', '“…Please leave.”', '„…Bitte geh.“'], ['驅寒茶葉', 'Warming tea leaves', 'Wärmende Teeblätter'], ['買了一包驅寒茶葉。', 'Bought a pack of warming tea leaves.', 'Eine Packung wärmender Teeblätter gekauft.'],

    // ---------- 倉庫 ----------
    ['倉庫番', 'Storekeeper', 'Lagerverwalter'], ['倉庫番：換裝備、賣東西', 'Storekeeper: change equipment, sell items', 'Lagerverwalter: Ausrüstung wechseln, Sachen verkaufen'],
    ['撬開別人寄放的箱子', 'Pry open someone else’s stored box', 'Eine fremde eingelagerte Kiste aufbrechen'], ['大鏡子（重新捏角）', 'Large mirror (re-create your character)', 'Großer Spiegel (Figur neu gestalten)'],

    // ---------- 驛站 ----------
    ['售票口', 'Ticket window', 'Fahrkartenschalter'], ['驛站的站務員', 'Station attendant', 'Stationsbeamter'],
    ['售票口：搭車到昭旭全國的遺跡', 'Ticket window: ride to ruins all over Zhaoxu', 'Schalter: zu Ruinen in ganz Zhaoxu fahren'],
    ['看時刻表（今天的路況）', 'Check the timetable (today’s roads)', 'Fahrplan ansehen (heutige Straßenlage)'], ['驛站的時刻表', 'Post station timetable', 'Fahrplan der Poststation'],
    ['暴風雪：矮丘山口、北山山口封閉。往湯山村、北山礦坑的車停駛。', 'Blizzard: Low Hill Pass and North Mountain Pass closed. No service to Yushan Village or the North Mountain mine.', 'Schneesturm: Niederhügel-Pass und Nordberg-Pass gesperrt. Keine Fahrten nach Yushan und zur Nordberg-Mine.'],
    ['往皇嶺：每天兩班。往西岸：每天一班。', 'To Huangling: two a day. To the west coast: one a day.', 'Nach Huangling: zweimal täglich. Zur Westküste: einmal täglich.'],
    ['退位大典：今日全城戒嚴，車班照常，但出入要查證件。', 'Abdication ceremony: martial law in town today. Services run as normal, but papers are checked on entry and exit.', 'Abdankungszeremonie: heute Ausnahmezustand. Fahrten wie gewohnt, aber Ausweiskontrolle beim Ein- und Ausreisen.'],
    ['德克斯凡的貨車：每天早上從選礦廠出發。', 'Dexvan freight trucks: leave the ore-dressing plant every morning.', 'Dexvan-Lastwagen: fahren jeden Morgen von der Erzaufbereitung ab.'],
    ['往北州：要到港口換船。', 'To Beizhou: change to a ship at the port.', 'Nach Beizhou: im Hafen aufs Schiff umsteigen.'],
    ['候車的旅客', 'Waiting traveller', 'Wartender Reisender'], ['和候車的旅客聊聊', 'Chat with a waiting traveller', 'Mit einem wartenden Reisenden plaudern'],
    ['「往皇嶺的車又誤點了。德克斯凡的貨車倒是很準時。」', '“The Huangling coach is late again. Dexvan’s trucks are always on time, though.”', '„Die Kutsche nach Huangling hat wieder Verspätung. Die Dexvan-Laster sind dagegen pünktlich.“'],
    ['「聽說北州那邊的遺跡，裡面整片都是雪原。」', '“I hear the ruins up in Beizhou are nothing but snowfields inside.”', '„Die Ruinen in Beizhou sollen innen nur aus Schneefeldern bestehen.“'],
    ['「東鶴的人對外地人不太客氣……你也是外地來的？」', '“Donghe folk aren’t very kind to outsiders… you from elsewhere too?”', '„Die Leute in Donghe sind zu Fremden nicht sehr freundlich… bist du auch von auswärts?“'],
    ['「卡露那邊的教堂遺跡出事了，報上說有勇者失聯。」', '“Something happened at the church ruin in Karu. The paper says adventurers have gone missing.”', '„In der Kirchenruine von Karu ist was passiert. Die Zeitung sagt, Abenteurer werden vermisst.“'],
    ['翻別人的行李', 'Rummage through someone’s luggage', 'Fremdes Gepäck durchwühlen'],

    // ---------- 赤提燈 ----------
    ['赤提燈的老闆娘', 'Red Lantern’s proprietress', 'Wirtin der Roten Laterne'], ['和老闆娘點菜（熱湯、酒、宿屋的房間）', 'Order from the proprietress (hot soup, drinks, a room)', 'Bei der Wirtin bestellen (heiße Suppe, Getränke, ein Zimmer)'],
    ['摸走櫃台上錢盒裡的錢', 'Swipe money from the till on the counter', 'Geld aus der Kasse auf dem Tresen stibitzen'],
    ['喝酒的客人', 'Drinking customer', 'Trinkender Gast'], ['和喝酒的客人聊聊', 'Chat with the drinking customer', 'Mit dem trinkenden Gast plaudern'],
    ['「湯還有嗎？再給我一碗。喝完我就上樓睡了。」', '“Any soup left? One more bowl. Then I’m off upstairs to sleep.”', '„Noch Suppe da? Noch eine Schale. Dann geh ich rauf schlafen.“'],
    ['上樓：客房（住一晚）', 'Upstairs: guest rooms (stay the night)', 'Nach oben: Gästezimmer (übernachten)'],
    ['「……今天客滿了。」', '“…We’re full tonight.”', '„…Heute sind wir voll.“'], ['（她沒有看你的眼睛。）', '(She doesn’t meet your eyes.)', '(Sie sieht dir nicht in die Augen.)'],
    ['熱湯', 'Hot soup', 'Heiße Suppe'], ['下一趟遺跡：生命 +8%', 'Next ruin run: HP +8%', 'Nächster Ruinengang: LP +8 %'],
    ['烤霜背鮒定食', 'Grilled frostback crucian set meal', 'Menü mit gegrillter Frostrücken-Karausche'], ['下一趟遺跡：慢慢回復生命', 'Next ruin run: slowly regenerate HP', 'Nächster Ruinengang: langsame LP-Regeneration'],
    ['熱酒', 'Hot sake', 'Heißer Sake'], ['下一趟遺跡：傷害 +6%，但比較容易被佩特拉注意', 'Next ruin run: damage +6%, but Petra notices you more easily', 'Nächster Ruinengang: Schaden +6 %, aber Petra bemerkt dich leichter'],
    ['樓上的客房', 'Upstairs rooms', 'Zimmer oben'], ['今天的菜', 'Today’s menu', 'Heutige Speisen'], ['「這裡的客人什麼都聊。」', '“The customers here talk about everything.”', '„Die Gäste hier reden über alles.“'],
    ['「今天冷，吃點熱的再下去。」', '“It’s cold today. Eat something hot before you go down.”', '„Heute ist es kalt. Iss was Warmes, bevor du runtergehst.“'],
    ['聽聽傳聞', 'Listen to rumours', 'Gerüchte hören'], ['睡了一晚。', 'You slept the night.', 'Du hast übernachtet.'],
    ['今天全城戒嚴。', 'Martial law in town today.', 'Heute herrscht Ausnahmezustand.'], ['外面是暴風雪。', 'There’s a blizzard outside.', 'Draußen tobt ein Schneesturm.'],
    ['今天是市集日。', 'Today is market day.', 'Heute ist Markttag.'], ['今天是休息日。', 'Today is a rest day.', 'Heute ist Ruhetag.'],

    // ---------- 同行的勇者 ----------
    ['公會大廳・同行的勇者', 'Guild hall · Fellow adventurers', 'Gildenhalle · Mitreisende Abenteurer'],
    ['隊伍已滿。要換人，請到登記處的隊伍名冊讓一位隊友離隊。', 'Party full. To swap someone, have a member leave via the party roster at registration.', 'Gruppe voll. Zum Tauschen lass ein Mitglied über die Gruppenliste an der Anmeldung austreten.'],
    ['費拉不夠。', 'Not enough Fera.', 'Nicht genug Fera.'], ['委託報酬每個隊友分走一成五。', 'Each party member takes 15% of the request reward.', 'Jedes Gruppenmitglied erhält 15 % der Auftragsbelohnung.'],
    ['加入了隊伍', 'Joined the party', 'Der Gruppe beigetreten'],

    // ---------- 各城的貨物、船 ----------
    ['征遠鋼材', 'Zhengyuan steel', 'Zhengyuan-Stahl'], ['古森木材', 'Gusen timber', 'Gusen-Holz'], ['古森茶', 'Gusen tea', 'Gusen-Tee'], ['銀旗魚乾', 'Dried silverfin', 'Getrockneter Silberflosser'],
    ['英尼爾斯藥品', 'Iniers pharmaceuticals', 'Iniers-Arzneimittel'], ['沉船古物', 'Shipwreck relics', 'Wrackfunde'], ['日下森電器', 'Rixiasen electronics', 'Rixiasen-Elektrogeräte'],
    ['德克斯凡香料', 'Dexvan spices', 'Dexvan-Gewürze'], ['軍用口糧', 'Military rations', 'Militärrationen'],
    ['沒有船', 'No boat', 'Kein Boot'], ['小漁船「海鷗號」', 'Fishing skiff “Seagull”', 'Fischerboot „Möwe“'], ['貨船「征遠丸」', 'Freighter “Zhengyuan Maru”', 'Frachter „Zhengyuan Maru“'], ['快速汽船「武聖二號」', 'Fast steamer “Wusheng II”', 'Schnelldampfer „Wusheng II“'],
    ['這裡出產', 'Produced here', 'Wird hier hergestellt'], ['這裡需要', 'Wanted here', 'Wird hier gebraucht'],
    ['貨運窗口', 'Freight window', 'Frachtschalter'], ['貨物', 'Goods', 'Ware'], ['你有', 'You have', 'Du hast'], ['外貿訂單：可以交貨', 'Trade orders: ready to deliver', 'Handelsaufträge: lieferbereit'], ['交貨', 'Deliver', 'Liefern'],
    ['每種貨在出產的城便宜、在需要它的城收得貴；每天的價錢會變。', 'Each good is cheap in the city that makes it and sells high where it’s wanted; prices change daily.', 'Jede Ware ist dort billig, wo sie hergestellt wird, und bringt viel, wo sie gebraucht wird; die Preise ändern sich täglich.'],
    ['這座城沒有出產能運的貨。', 'This city produces no shippable goods.', 'Diese Stadt stellt keine Frachtware her.'],
    ['全部的行情', 'All market prices', 'Alle Marktpreise'], ['各城的貨物行情', 'Market prices by city', 'Marktpreise nach Stadt'], ['回貨運窗口', 'Back to the freight window', 'Zurück zum Frachtschalter'],
    ['今天的價錢。買只能在出產的城，賣哪裡都可以──在需要它的城最好。', 'Today’s prices. You can only buy where a good is made; you can sell anywhere, best where it’s wanted.', 'Heutige Preise. Kaufen nur, wo die Ware hergestellt wird; verkaufen überall, am besten, wo sie gebraucht wird.'],
    ['出產（買）', 'Made in (buy)', 'Herkunft (kaufen)'], ['收得最貴的城（賣）', 'Best city to sell', 'Beste Stadt zum Verkaufen'],
    ['南瀧・外貿公司', 'Nanlong · Trading company', 'Nanlong · Handelsgesellschaft'], ['外貿訂單', 'Trade orders', 'Handelsaufträge'],
    ['「外國船下週要來。誰能把貨湊齊送到，我們照單付錢──比自己拿去賣好賺。」', '“A foreign ship arrives next week. Whoever gathers and delivers the goods gets paid per order, which beats selling it yourself.”', '„Nächste Woche kommt ein ausländisches Schiff. Wer die Ware zusammenbringt und liefert, wird pro Auftrag bezahlt – besser als selbst verkaufen.“'],
    ['送到', 'to', 'nach'], ['已接', 'Taken', 'Angenommen'], ['接', 'Take', 'Annehmen'],
    ['征遠・船屋區', 'Zhengyuan · Boathouse district', 'Zhengyuan · Bootshausviertel'], ['船屋「老錨」', 'Boathouse “Old Anchor”', 'Bootshaus „Alter Anker“'],
    ['「武聖號以前就是在對面那個船塢下水的。要買船？征遠的船是全國最好的。」', '“The Wusheng was launched from that dock across the way. Want a boat? Zhengyuan’s boats are the best in the country.”', '„Die Wusheng lief drüben in dem Dock vom Stapel. Willst du ein Boot? Zhengyuans Boote sind die besten im Land.“'],
    ['你的船：', 'Your boat: ', 'Dein Boot: '], ['貨箱變多：貨物一次運得多。', 'More cargo space: carry more goods per trip.', 'Mehr Laderaum: mehr Ware pro Fahrt.'],
    ['渦旗出海：船越大，越能出到深海釣大魚。', 'Sailing from Woqi: the bigger the boat, the further out you can fish for big catches.', 'Ausfahrt ab Woqi: je größer das Boot, desto weiter draußen kannst du große Fische angeln.'],
    ['西見潛水：船越大，越能潛到深處的沉船。', 'Diving at Xijian: the bigger the boat, the deeper the wrecks you can reach.', 'Tauchen in Xijian: je größer das Boot, desto tiefere Wracks erreichst du.'],
    ['下一艘：', 'Next boat: ', 'Nächstes Boot: '], ['已經是最好的船了。', 'You already have the best boat.', 'Du hast schon das beste Boot.'], ['（舊船折價收回）', '(old boat traded in)', '(altes Boot in Zahlung)'],
    ['征遠・鋼鐵廠', 'Zhengyuan · Steelworks', 'Zhengyuan · Stahlwerk'], ['鋼鐵廠', 'Steelworks', 'Stahlwerk'],
    ['「遺跡裡挖的鐵礦也收。三份煉一箱，加工費 10。」爐子的熱氣隔著玻璃都感覺得到。', '“We take iron ore from the ruins too. Three portions make a crate; processing fee 10.” You can feel the furnace heat through the glass.', '„Wir nehmen auch Eisenerz aus den Ruinen. Drei Portionen ergeben eine Kiste, Bearbeitungsgebühr 10.“ Die Hitze des Ofens spürt man durchs Glas.'],
    ['煉一箱', 'Smelt one crate', 'Eine Kiste schmelzen'],
    ['舊艦遺址・監看站', 'Old warship site · Watch post', 'Altes Kriegsschiff · Wachposten'],
    ['「銘牌找到了？送去軍艦博物館吧，館長找了好多年。」', '“Found the nameplate? Take it to the warship museum; the curator has been looking for years.”', '„Das Namensschild gefunden? Bring es ins Kriegsschiffmuseum, der Kurator sucht seit Jahren.“'],
    ['退潮的時間過了。明天再來找。', 'Low tide is over. Come back tomorrow.', 'Die Ebbe ist vorbei. Komm morgen wieder.'],
    ['武聖號的姊妹艦「武德號」，會戰的最後一年擱淺在這裡。艦體已經被遺跡的魔力侵蝕了一半。', 'The Wude, sister ship of the Wusheng, ran aground here in the final year of the war. Half its hull has been eaten away by ruin mana.', 'Die Wude, Schwesterschiff der Wusheng, lief im letzten Kriegsjahr hier auf Grund. Der halbe Rumpf ist vom Ruinenmana zerfressen.'],
    ['公會的監看員讓你趁退潮在外圍找找看。', 'The guild watcher lets you search the outer edge at low tide.', 'Der Gildenwächter lässt dich bei Ebbe am Rand suchen.'],
    ['在砲塔的殘骸底下，摸到一塊刻著「武德」的銅銘牌！（拿去軍艦博物館）', 'Under the wreckage of a gun turret, you find a bronze nameplate engraved “Wude”! (Take it to the warship museum)', 'Unter den Trümmern eines Geschützturms findest du ein Bronzeschild mit der Gravur „Wude“! (Ins Kriegsschiffmuseum bringen)'],
    ['只找到生鏽的鉚釘。（一天能找一次）', 'Only rusty rivets. (One search per day)', 'Nur rostige Nieten. (Eine Suche pro Tag)'],
    ['征遠・軍艦博物館', 'Zhengyuan · Warship museum', 'Zhengyuan · Kriegsschiffmuseum'], ['軍艦博物館', 'Warship museum', 'Kriegsschiffmuseum'], ['軍艦博物館・館長', 'Warship museum · Curator', 'Kriegsschiffmuseum · Kurator'],
    ['大廳正中間是武聖號的模型，比人還高。說明牌：「昭旭最大的戰列艦。第二次大陸會戰之後，征遠只造商船與民用船──但仍是全國最大的造船廠。」', 'In the middle of the hall stands a model of the Wusheng, taller than a person. The placard: “Zhaoxu’s largest battleship. After the Second Continental War, Zhengyuan built only merchant and civilian ships, yet remains the nation’s largest shipyard.”', 'Mitten in der Halle steht ein Modell der Wusheng, größer als ein Mensch. Die Tafel: „Das größte Schlachtschiff Zhaoxus. Nach dem Zweiten Kontinentalkrieg baute Zhengyuan nur noch Handels- und Zivilschiffe – und ist doch die größte Werft des Landes.“'],
    ['大廳角落多了一塊銅銘牌：「武德號（由勇者捐贈）」。', 'A new bronze plate hangs in a corner of the hall: “Wude (donated by an adventurer)”.', 'In einer Ecke der Halle hängt nun ein Bronzeschild: „Wude (Spende eines Abenteurers)“.'],
    ['館長說：「武聖號的姊妹艦武德號還擱在岸邊。要是有人能把它的銘牌帶回來……」', 'The curator says: “The Wusheng’s sister ship, the Wude, still lies on the shore. If only someone could bring back its nameplate…”', 'Der Kurator sagt: „Die Wude, das Schwesterschiff der Wusheng, liegt noch am Ufer. Wenn nur jemand ihr Namensschild zurückbrächte…“'],
    ['把武德號的銘牌交給館長', 'Give the Wude’s nameplate to the curator', 'Dem Kurator das Namensschild der Wude geben'],
    ['館長的問題', 'The curator’s question', 'Die Frage des Kurators'], ['館長的問題（一天一次）', 'The curator’s question (once a day)', 'Die Frage des Kurators (einmal täglich)'],
    ['館長的手在抖。「……真的是武德號的。我父親是這艘船上的機關兵。」', 'The curator’s hands tremble. “…It really is the Wude’s. My father was an engine-room sailor on her.”', 'Die Hände des Kurators zittern. „…Es ist wirklich das der Wude. Mein Vater war Maschinist auf ihr.“'],
    ['「這塊銘牌會掛在大廳。謝謝你。」（+500 費拉，征遠的聲望 +5）', '“This plate will hang in the hall. Thank you.” (+500 Fera, Zhengyuan reputation +5)', '„Das Schild wird in der Halle hängen. Danke.“ (+500 Fera, Ansehen in Zhengyuan +5)'],
    ['「對。你有認真看說明牌。」（+50 費拉）', '“Correct. You read the placards properly.” (+50 Fera)', '„Richtig. Du hast die Tafeln aufmerksam gelesen.“ (+50 Fera)'],
    ['武聖號以前是什麼船？', 'What kind of ship was the Wusheng?', 'Was für ein Schiff war die Wusheng?'], ['昭旭最大的戰列艦', 'Zhaoxu’s largest battleship', 'Zhaoxus größtes Schlachtschiff'],
    ['殖民地航線的貨船', 'A colonial-route freighter', 'Ein Frachter der Kolonialroute'], ['漁業公司的捕鯨船', 'A fishing company’s whaler', 'Ein Walfänger einer Fischereigesellschaft'],
    ['會戰以後，征遠的造船廠主要造什麼？', 'After the war, what did Zhengyuan’s shipyards mainly build?', 'Was bauten Zhengyuans Werften nach dem Krieg hauptsächlich?'],
    ['新的戰列艦', 'New battleships', 'Neue Schlachtschiffe'], ['商業、民用的船', 'Merchant and civilian ships', 'Handels- und Zivilschiffe'], ['只修不造', 'Only repairs, no new builds', 'Nur Reparaturen, keine Neubauten'],
    ['擱淺在征遠岸邊的舊艦叫什麼？', 'What is the old warship aground on Zhengyuan’s shore called?', 'Wie heißt das alte Kriegsschiff, das vor Zhengyuan auf Grund liegt?'],
    ['武德號', 'Wude', 'Wude'], ['武聖二號', 'Wusheng II', 'Wusheng II'], ['海鷗號', 'Seagull', 'Möwe'],
    ['征遠在昭旭的哪個方位？', 'Where in Zhaoxu is Zhengyuan?', 'Wo in Zhaoxu liegt Zhengyuan?'], ['東南', 'Southeast', 'Südosten'], ['西北', 'Northwest', 'Nordwesten'], ['正南', 'Due south', 'Genau im Süden'],
    ['征遠・海軍訓練所', 'Zhengyuan · Naval training school', 'Zhengyuan · Marineschule'], ['操艇訓練', 'Rowing drill', 'Ruderübung'],
    ['教官喊口令。指針走到綠色的地方按「划」（空白鍵），一共十槳；越準船越快。報名 12 費拉。', 'The instructor calls the stroke. Press “Row” (Space) when the needle is in the green; ten strokes in all, and the more accurate, the faster the boat. Entry 12 Fera.', 'Der Ausbilder gibt den Takt an. Drück „Rudern“ (Leertaste), wenn der Zeiger im Grünen ist; zehn Schläge, je genauer, desto schneller das Boot. Teilnahme 12 Fera.'],
    ['按「開始」。', 'Press “Start”.', 'Drück „Start“.'], ['開始（12 費拉）', 'Start (12 Fera)', 'Start (12 Fera)'], ['划（空白鍵）', 'Row (Space)', 'Rudern (Leertaste)'], ['一、二！', 'One, two!', 'Eins, zwei!'], ['空白', 'Space', 'Leertaste'],
    ['卸貨第一雕像', 'The First Unloader statue', 'Statue des Ersten Entladers'],
    ['雕像的腳被摸得發亮。你今天已經摸過了。', 'The statue’s feet are rubbed shiny. You already touched them today.', 'Die Füße der Statue sind blank gerieben. Du hast sie heute schon berührt.'],
    ['扛著貨箱的搬運工銅像。腳尖被幾十年來的人摸得發亮。', 'A bronze porter shouldering a crate. Decades of hands have rubbed the toes shiny.', 'Ein Bronzeträger mit einer Kiste auf der Schulter. Jahrzehnte von Händen haben die Zehen blank gerieben.'],
    ['傳說摸了他的腳，今天做生意就順。', 'Legend says touching his feet brings a good day for business.', 'Wer seine Füße berührt, soll heute gute Geschäfte machen.'],
    ['（今天在各城的貨運窗口買賣，價錢好 5%。）', '(Today, prices at every city’s freight window are 5% better.)', '(Heute sind die Preise an allen Frachtschaltern 5 % besser.)'],
    ['南瀧・湍遊國際大學', 'Nanlong · Tuanyou International University', 'Nanlong · Internationale Universität Tuanyou'], ['湍遊國際大學', 'Tuanyou International University', 'Internationale Universität Tuanyou'],
    ['附設魔力學院分院和聖教學院。外國留學生比本地學生多。', 'Home to a branch of the Mana Academy and a Holy Church college. There are more foreign students than local ones.', 'Mit einer Zweigstelle der Mana-Akademie und einem Kolleg der Heiligen Kirche. Es gibt mehr ausländische als einheimische Studenten.'],
    ['聖教學院的晚禱（理智回復）', 'Holy Church college vespers (restores sanity)', 'Abendgebet am Kirchenkolleg (stellt Verstand wieder her)'],
    ['魔力學院・公開課', 'Mana Academy · Public lecture', 'Mana-Akademie · Öffentliche Vorlesung'],
    ['教授在黑板上畫魔力迴路。「遺跡裡的魔力，是從地底往上滲的──」', 'The professor draws mana circuits on the blackboard. “Mana in the ruins seeps up from deep underground—”', 'Der Professor zeichnet Manakreise an die Tafel. „Das Mana in den Ruinen sickert aus der Tiefe nach oben—“'],
    ['你抄了滿滿三頁。（經驗書 +1）', 'You fill three pages with notes. (EXP tome +1)', 'Du füllst drei Seiten mit Notizen. (EP-Buch +1)'],
    ['聖教學院・晚禱', 'Holy Church college · Vespers', 'Kirchenkolleg · Abendgebet'], ['燭光、管風琴、聽不懂的外國話。', 'Candlelight, an organ, words in a foreign tongue.', 'Kerzenlicht, eine Orgel, Worte in einer fremden Sprache.'],
    ['心裡安靜了一點。（理智回復）', 'Your mind grows a little quieter. (Sanity restored)', 'Dein Inneres wird etwas ruhiger. (Verstand wiederhergestellt)'],
    ['南瀧・商業區拱廊', 'Nanlong · Shopping arcade', 'Nanlong · Einkaufspassage'], ['舶來品店「海風」', 'Import shop “Sea Breeze”', 'Importladen „Meeresbrise“'],
    ['「德克斯凡的船昨天剛到。今天就這三件，明天又換。」', '“The Dexvan ship came in yesterday. Just these three today; they change tomorrow.”', '„Das Dexvan-Schiff kam gestern an. Heute nur diese drei, morgen wechselt es.“'],
    ['【史詩】', '[Epic] ', '[Episch] '], ['【稀有】', '[Rare] ', '[Selten] '], ['賣掉了', 'Sold', 'Verkauft'], ['今天沒有貨。', 'Nothing in stock today.', 'Heute keine Ware.'],
    ['魔導飛機', 'Magitech airplane', 'Magie-Flugzeug'], ['不搭了', 'Not flying', 'Nicht fliegen'],
    ['今日地方委託', 'Today’s local requests', 'Heutige örtliche Aufträge'], ['已完成', 'Completed', 'Erledigt'], ['交差', 'Hand in', 'Abgeben'],

    // ---------- 地方委託 ----------
    ['湍遊大學的茶會', 'Tuanyou University tea party', 'Teegesellschaft der Universität Tuanyou'], ['留學生辦茶會，要 4 箱古森茶。', 'Foreign students are hosting a tea party and need 4 crates of Gusen tea.', 'Ausländische Studenten geben eine Teegesellschaft und brauchen 4 Kisten Gusen-Tee.'],
    ['商業區拱廊翻修', 'Arcade renovation', 'Renovierung der Passage'], ['拱廊的木樑要換，要 5 箱古森木材。', 'The arcade’s wooden beams need replacing: 5 crates of Gusen timber.', 'Die Holzbalken der Passage müssen ersetzt werden: 5 Kisten Gusen-Holz.'],
    ['領事館的收藏', 'The consulate’s collection', 'Die Sammlung des Konsulats'], ['德克斯凡領事想要兩件沉船古物擺在大廳。', 'The Dexvan consul wants two shipwreck relics for the lobby.', 'Der Dexvan-Konsul möchte zwei Wrackfunde für die Eingangshalle.'],
    ['外貿訂單跑一趟', 'Run one trade order', 'Einen Handelsauftrag erledigen'], ['完成一張外貿公司的訂單（在目的地交貨）。', 'Complete one trading company order (deliver at the destination).', 'Erfülle einen Auftrag der Handelsgesellschaft (am Zielort liefern).'],
    ['船塢的龍骨', 'Keel for the dock', 'Kiel für das Dock'], ['造船廠新的商船要古森木做龍骨，6 箱。', 'The shipyard’s new merchant ship needs a Gusen-wood keel: 6 crates.', 'Das neue Handelsschiff der Werft braucht einen Kiel aus Gusen-Holz: 6 Kisten.'],
    ['軍艦博物館的燈', 'Lights for the warship museum', 'Licht fürs Kriegsschiffmuseum'], ['博物館的展示燈壞了一半，要 3 箱日下森電器。', 'Half the museum’s display lights are broken: 3 crates of Rixiasen electronics.', 'Die Hälfte der Vitrinenbeleuchtung ist kaputt: 3 Kisten Rixiasen-Elektrogeräte.'],
    ['海軍訓練所的補給', 'Supplies for the naval school', 'Nachschub für die Marineschule'], ['新兵出海訓練，要 4 箱軍用口糧。', 'Recruits are heading out to sea for training and need 4 crates of military rations.', 'Rekruten fahren zur Übung aufs Meer und brauchen 4 Kisten Militärrationen.'],
    ['鋼鐵廠的爐子', 'The steelworks furnace', 'Der Ofen des Stahlwerks'], ['鋼鐵廠缺鐵礦，交 6 份。', 'The steelworks is short on iron ore. Deliver 6 portions.', 'Dem Stahlwerk fehlt Eisenerz. Liefere 6 Portionen.'],
    ['訓練所的助教', 'Training school assistant', 'Hilfsausbilder der Marineschule'], ['今天在海軍訓練所的操艇拿到 A 以上，給新兵示範。', 'Score A or better in the naval school rowing drill today to demonstrate for the recruits.', 'Erreiche heute bei der Ruderübung der Marineschule mindestens A, um es den Rekruten vorzumachen.'],
    ['試航', 'Sea trial', 'Probefahrt'], ['有一艘自己的船（船屋買的），開出港跑一圈給造船廠的師傅看。', 'Own a boat (bought at the boathouse) and take it out of the harbour for a lap to show the shipyard master.', 'Besitze ein eigenes Boot (aus dem Bootshaus) und fahr eine Runde aus dem Hafen, um es dem Werftmeister zu zeigen.']
  ]);

  // ---------- 拼接的句子 ----------
  R.i18nPat(/^和(.+)說話（(.+) Lv (\d+)）$/, (m, t, e) => { const n = t(m[1]), c = t(m[2]); return n == null || c == null ? null : (e ? 'Talk to ' + n + ' (' + c + ' Lv ' + m[3] + ')' : 'Mit ' + n + ' reden (' + c + ' Lv ' + m[3] + ')'); });
  R.i18nPat(/^邀請同行要 (\d+) 費拉（你有 (\d+)）。隊伍最多 (\d+) 人，現在 (\d+) 人。(.*)$/, (m, t, e) => { const r = m[5] ? t(m[5]) : ''; return r == null ? null : (e ? 'Hiring costs ' + m[1] + ' Fera (you have ' + m[2] + '). Party max ' + m[3] + ', currently ' + m[4] + '.' : 'Anheuern kostet ' + m[1] + ' Fera (du hast ' + m[2] + '). Gruppe max. ' + m[3] + ', derzeit ' + m[4] + '.') + (r ? ' ' + r : ''); });
  R.i18nPat(/^邀請同行（(\d+) 費拉）$/, (m, t, e) => (e ? 'Hire (' : 'Anheuern (') + m[1] + ' Fera)');
  R.i18nPat(/^「一晚 (\d+) 費拉，熱水和棉被都有。」$/, (m, t, e) => e ? '“' + m[1] + ' Fera a night, hot water and a quilt included.”' : '„' + m[1] + ' Fera die Nacht, heißes Wasser und Decke inklusive.“');
  R.i18nPat(/^住一晚（(\d+) 費拉，睡到隔天）$/, (m, t, e) => e ? 'Stay the night (' + m[1] + ' Fera, sleep till tomorrow)' : 'Übernachten (' + m[1] + ' Fera, bis morgen schlafen)');
  R.i18nPat(/^點（(\d+) 費拉）$/, (m, t, e) => (e ? 'Order (' : 'Bestellen (') + m[1] + ' Fera)');
  R.i18nPat(/^(.+)：暖和多了。（今天下遺跡有效）$/, (m, t, e) => { const n = t(m[1]); return n == null ? null : n + (e ? ': that warms you up. (Applies to today’s ruin run)' : ': Das wärmt. (Gilt für den heutigen Ruinengang)'); });
  R.i18nPat(/^睡了一晚。(.+)$/, (m, t, e) => { const r = t(m[1]); return r == null ? null : (e ? 'You slept the night. ' : 'Du hast übernachtet. ') + r; });
  R.i18nPat(/^(.+)・(車站|機場)$/, (m, t, e) => { const n = t(m[1]); return n == null ? null : n + ' · ' + (m[2] === '車站' ? (e ? 'Station' : 'Bahnhof') : (e ? 'Airport' : 'Flughafen')); });
  R.i18nPat(/^貨箱 (\d+)／(\d+)（征遠的船屋可以買船加貨箱）・費拉 (\d+)・這座城的聲望 (\d+) 級（買賣價錢好 (\d+)%）$/, (m, t, e) => e
    ? 'Cargo ' + m[1] + '/' + m[2] + ' (buy a boat at Zhengyuan’s boathouse for more) · Fera ' + m[3] + ' · Reputation here Lv ' + m[4] + ' (prices ' + m[5] + '% better)'
    : 'Fracht ' + m[1] + '/' + m[2] + ' (mehr mit einem Boot aus Zhengyuans Bootshaus) · Fera ' + m[3] + ' · Ansehen hier Stufe ' + m[4] + ' (Preise ' + m[5] + ' % besser)');
  R.i18nPat(/^買 (\d+)$/, (m, t, e) => (e ? 'Buy ' : 'Kaufe ') + m[1]);
  R.i18nPat(/^賣 (\d+)$/, (m, t, e) => (e ? 'Sell ' : 'Verkaufe ') + m[1]);
  R.i18nPat(/^全賣$/, (m, t, e) => e ? 'Sell all' : 'Alles verkaufen');
  R.i18nPat(/^(\d+) 箱(.+?)( → 報酬 (\d+) 費拉)?$/, (m, t, e) => { const g = t(m[2]); return g == null ? null : m[1] + (e ? ' crates of ' : ' Kisten ') + g + (m[3] ? (e ? ' → reward ' : ' → Belohnung ') + m[4] + ' Fera' : ''); });
  R.i18nPat(/^賣了 (\d+) 箱(.+)，\+(\d+) 費拉。$/, (m, t, e) => { const g = t(m[2]); return g == null ? null : (e ? 'Sold ' + m[1] + ' crates of ' + g + ', +' + m[3] + ' Fera.' : m[1] + ' Kisten ' + g + ' verkauft, +' + m[3] + ' Fera.'); });
  R.i18nPat(/^（(.+)出產）・期限還有 (\d+) 天・報酬$/, (m, t, e) => { const c = t(m[1]); return c == null ? null : (e ? '(made in ' + c + ') · ' + m[2] + ' days left · reward' : '(aus ' + c + ') · noch ' + m[2] + ' Tage · Belohnung'); });
  R.i18nPat(/^接了以後，把貨運到目的地，在那座城車站的貨運窗口交貨。你的貨箱 (\d+)／(\d+)。$/, (m, t, e) => e
    ? 'Once taken, ship the goods to the destination and deliver at that city’s station freight window. Your cargo: ' + m[1] + '/' + m[2] + '.'
    : 'Nach Annahme die Ware zum Ziel bringen und am Frachtschalter des dortigen Bahnhofs liefern. Deine Fracht: ' + m[1] + '/' + m[2] + '.');
  R.i18nPat(/^外貿訂單交貨：\+(\d+) 費拉（南瀧的聲望 \+2）$/, (m, t, e) => e ? 'Trade order delivered: +' + m[1] + ' Fera (Nanlong reputation +2)' : 'Handelsauftrag geliefert: +' + m[1] + ' Fera (Ansehen in Nanlong +2)');
  R.i18nPat(/^接下訂單：(\d+) 箱(.+) → (.+)$/, (m, t, e) => { const g = t(m[2]), c = t(m[3]); return g == null || c == null ? null : (e ? 'Order taken: ' + m[1] + ' crates of ' + g + ' → ' + c : 'Auftrag angenommen: ' + m[1] + ' Kisten ' + g + ' → ' + c); });
  R.i18nPat(/^（貨箱 (\d+)）$/, (m, t, e) => (e ? '(cargo ' : '(Fracht ') + m[1] + ')');
  R.i18nPat(/^(\d+) 費拉（貨箱 \+(\d+)）$/, (m, t, e) => m[1] + ' Fera (' + (e ? 'cargo +' : 'Fracht +') + m[2] + ')');
  R.i18nPat(/^買下（(\d+) 費拉）$/, (m, t, e) => (e ? 'Buy (' : 'Kaufen (') + m[1] + ' Fera)');
  R.i18nPat(/^買下了(.+)$/, (m, t, e) => { const b = t(m[1]); return b == null ? null : (e ? 'Bought ' : 'Gekauft: ') + b; });
  R.i18nPat(/^你有鐵礦 (\d+)・貨箱 (\d+)／(\d+)$/, (m, t, e) => e ? 'Iron ore: ' + m[1] + ' · Cargo ' + m[2] + '/' + m[3] : 'Eisenerz: ' + m[1] + ' · Fracht ' + m[2] + '/' + m[3]);
  R.i18nPat(/^能煉的全煉（(\d+) 箱）$/, (m, t, e) => e ? 'Smelt all possible (' + m[1] + ' crates)' : 'Alles schmelzen (' + m[1] + ' Kisten)');
  R.i18nPat(/^煉出 (\d+) 箱征遠鋼材。$/, (m, t, e) => e ? 'Smelted ' + m[1] + ' crates of Zhengyuan steel.' : m[1] + ' Kisten Zhengyuan-Stahl geschmolzen.');
  R.i18nPat(/^撿了一些還能用的艦體鐵片。（鐵礦 \+(\d+)，鋼鐵廠收）$/, (m, t, e) => e ? 'You gather some usable hull plating. (Iron ore +' + m[1] + ', the steelworks buys it)' : 'Du sammelst brauchbare Rumpfplatten. (Eisenerz +' + m[1] + ', das Stahlwerk kauft es)');
  R.i18nPat(/^「(.+)」$/, (m, t, e) => { const q = t(m[1]); return q == null || /^[“„]/.test(q) ? null : (e ? '“' + q + '”' : '„' + q + '“'); });
  R.i18nPat(/^「不對。答案是「(.+)」。明天再來。」$/, (m, t, e) => { const a = t(m[1]); return a == null ? null : (e ? '“Wrong. The answer is “' + a + '”. Come back tomorrow.”' : '„Falsch. Die Antwort lautet „' + a + '“. Komm morgen wieder.“'); });
  R.i18nPat(/^划完了：準 (\d+)／10，評價 ([SABC])(。教官點頭。（今天下遺跡：生命、技能冷卻稍好）|。教官：「再來。」)$/, (m, t, e) => {
    const good = m[3].indexOf('點頭') >= 0;
    return e ? 'Done: ' + m[1] + '/10 on target, grade ' + m[2] + (good ? '. The instructor nods. (Today’s ruin run: slightly better HP and skill cooldown)' : '. Instructor: “Again.”')
      : 'Fertig: ' + m[1] + '/10 getroffen, Note ' + m[2] + (good ? '. Der Ausbilder nickt. (Heutiger Ruinengang: etwas mehr LP und kürzere Abklingzeit)' : '. Ausbilder: „Noch mal.“');
  });
  R.i18nPat(/^魔力學院的公開課（60 費拉・經驗書 ×1(?:・第 (\d+) 天再開)?）$/, (m, t, e) => e ? 'Mana Academy public lecture (60 Fera · EXP tome ×1' + (m[1] ? ' · reopens on day ' + m[1] : '') + ')' : 'Öffentliche Vorlesung der Mana-Akademie (60 Fera · EP-Buch ×1' + (m[1] ? ' · wieder ab Tag ' + m[1] : '') + ')');
  R.i18nPat(/^【(史詩|稀有)】(.+)$/, (m, t, e) => { const n = t(m[2]); return n == null ? null : (m[1] === '史詩' ? (e ? '[Epic] ' : '[Episch] ') : (e ? '[Rare] ' : '[Selten] ')) + n; });
  R.i18nPat(/^「國內線，當天就到。」比電車貴，但不用等上好幾天。費拉 (\d+)$/, (m, t, e) => e ? '“Domestic flights, same-day arrival.” Pricier than the train, but no waiting for days. Fera ' + m[1] : '„Inlandsflüge, Ankunft am selben Tag.“ Teurer als die Bahn, aber kein tagelanges Warten. Fera ' + m[1]);
  R.i18nPat(/^(\d+) 費拉・當天（電車要 (\d+) 天）$/, (m, t, e) => e ? m[1] + ' Fera · same day (train: ' + m[2] + ' days)' : m[1] + ' Fera · am selben Tag (Bahn: ' + m[2] + ' Tage)');
  R.i18nPat(/^這座城自己的委託：東西備齊了才能交。聲望 (\d+) 級（報酬 \+(\d+)%）・(\d+) 點$/, (m, t, e) => e
    ? 'This city’s own requests: hand in once you have everything. Reputation Lv ' + m[1] + ' (reward +' + m[2] + '%) · ' + m[3] + ' pts'
    : 'Eigene Aufträge dieser Stadt: abgeben, sobald alles beisammen ist. Ansehen Stufe ' + m[1] + ' (Belohnung +' + m[2] + ' %) · ' + m[3] + ' Pkt.');
  R.i18nPat(/^(.+)分館$/, (m, t, e) => { const c = t(m[1]); return c == null ? null : (e ? c + ' Branch' : 'Filiale ' + c); });
  R.i18nPat(/^進度 (\d+)／(\d+)$/, (m, t, e) => (e ? 'Progress ' : 'Fortschritt ') + m[1] + '/' + m[2]);
  R.i18nPat(/^(.+)・委託完成：\+(\d+) 費拉（聲望 \+1）$/, (m, t, e) => { const c = t(m[1]); return c == null ? null : c + (e ? ' · Request complete: +' + m[2] + ' Fera (reputation +1)' : ' · Auftrag erledigt: +' + m[2] + ' Fera (Ansehen +1)'); });
  R.i18nPat(/^(.+)：完成地方委託「(.+)」。$/, (m, t, e) => { const c = t(m[1]), q = t(m[2]); return c == null || q == null ? null : c + (e ? ': completed local request “' + q + '”.' : ': örtlichen Auftrag „' + q + '“ erledigt.'); });
})(window.R);
