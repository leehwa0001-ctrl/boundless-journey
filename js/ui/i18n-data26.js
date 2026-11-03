// 英文、德文字典・第三階段之十四（2026-11-03）：建角色畫面還沒翻到的部分——外觀選項（髮型、眉毛、瞳孔、表情、體型、衣服、耳朵、角、翅膀、尾巴、配件）、
// 種族技能（racial.js 的 12 招）、排外說明（R.XENO_TEXT）、族種和出身地（種族資料的 from）、族種的共同說明、主要種族的名字和說明、混血。
// 種族名字（1,431 個，多半是「動物＋人族／獸人族／人魚族……」）和「翼人的鶴」這種句子要先有字根，之後再補。
(function (R) {
  if (!R.i18nAdd) return;
  R.i18nAdd([
    // ---------- 外觀選項（lookplus.js、creator.js、charkit.js） ----------
    ['名字', 'Name', 'Name'], ['原本', 'Default', 'Standard'],
    ['細', 'Thin', 'Dünn'], ['粗', 'Thick', 'Dick'], ['倒八字', 'Angry', 'Wütend'], ['八字', 'Worried', 'Besorgt'], ['看不見', 'Hidden', 'Verdeckt'],
    ['大眼', 'Big', 'Groß'], ['亮晶晶', 'Sparkly', 'Funkelnd'], ['豎瞳', 'Slit', 'Schlitz'], ['細長', 'Narrow', 'Schmal'], ['瞇眼', 'Squint', 'Zusammengekniffen'],
    ['微笑', 'Smile', 'Lächeln'], ['露齒笑', 'Grin', 'Grinsen'], ['撇嘴', 'Pout', 'Schmollmund'], ['張嘴', 'Open', 'Offen'], ['一字', 'Flat', 'Gerade'], ['不悅', 'Displeased', 'Missmutig'], ['無言', 'Speechless', 'Sprachlos'],
    // 身高的「高」另外處理（creator.js、creator2.js 查「身高：高」），字典裡的「高」是威脅度、等級用的 High
    ['身高：普通', 'Normal', 'Normal'], ['身高：矮', 'Short', 'Klein'], ['身高：高', 'Tall', 'Groß'],
    ['矮', 'Short', 'Klein'], ['纖細', 'Slim', 'Schlank'], ['壯碩', 'Broad', 'Kräftig'],
    ['短上衣', 'Short top', 'Kurzes Oberteil'], ['條紋毛衣', 'Striped sweater', 'Streifenpulli'], ['長袍', 'Robe', 'Robe'], ['背心', 'Vest', 'Weste'], ['大衣', 'Coat', 'Mantel'], ['帽T', 'Hoodie', 'Kapuzenpulli'], ['和服', 'Kimono', 'Kimono'],
    ['長褲', 'Trousers', 'Lange Hose'], ['短褲', 'Shorts', 'Kurze Hose'], ['裙子', 'Skirt', 'Rock'], ['袴', 'Hakama', 'Hakama'],
    ['長靴', 'Boots', 'Stiefel'], ['長鞋', 'Boots', 'Stiefel'], ['涼鞋', 'Sandals', 'Sandalen'],
    ['短髮', 'Short hair', 'Kurzes Haar'], ['長髮', 'Long hair', 'Langes Haar'], ['馬尾', 'Ponytail', 'Pferdeschwanz'], ['包頭', 'Bun', 'Dutt'], ['刺蝟頭', 'Spiky', 'Stachelig'], ['鮑伯頭', 'Bob', 'Bob'],
    ['辮子', 'Braid', 'Zopf'], ['平頭', 'Crew cut', 'Bürstenschnitt'], ['光頭', 'Bald', 'Glatze'], ['雙馬尾', 'Twin tails', 'Zwei Pferdeschwänze'], ['波浪長髮', 'Long waves', 'Lange Wellen'],
    ['公主切', 'Hime cut', 'Hime-Schnitt'], ['側分', 'Side part', 'Seitenscheitel'], ['三七分', 'Side part', 'Seitenscheitel'], ['莫霍克', 'Mohawk', 'Irokese'], ['亂髮', 'Messy', 'Zerzaust'], ['高馬尾', 'High ponytail', 'Hoher Pferdeschwanz'],
    ['耳朵', 'Ears', 'Ohren'], ['貓耳', 'Cat ears', 'Katzenohren'], ['狼耳', 'Wolf ears', 'Wolfsohren'], ['狐耳', 'Fox ears', 'Fuchsohren'], ['垂耳', 'Floppy ears', 'Schlappohren'],
    ['圓耳', 'Round ears', 'Runde Ohren'], ['兔耳', 'Rabbit ears', 'Hasenohren'], ['尖耳', 'Pointed ears', 'Spitze Ohren'], ['鰭耳', 'Fin ears', 'Flossenohren'], ['觸角', 'Antennae', 'Fühler'],
    ['角', 'Horns', 'Hörner'], ['小角', 'Small horns', 'Kleine Hörner'], ['羊角', 'Goat horns', 'Ziegenhörner'], ['龍角', 'Dragon horns', 'Drachenhörner'], ['魔角', 'Demon horns', 'Dämonenhörner'],
    ['翅膀', 'Wings', 'Flügel'], ['羽翼', 'Feathered wings', 'Federflügel'], ['蝠翼', 'Bat wings', 'Fledermausflügel'],
    ['尾巴', 'Tail', 'Schwanz'], ['貓尾', 'Cat tail', 'Katzenschwanz'], ['狐尾', 'Fox tail', 'Fuchsschwanz'], ['龍尾', 'Dragon tail', 'Drachenschwanz'], ['狼尾', 'Wolf tail', 'Wolfsschwanz'], ['狗尾', 'Dog tail', 'Hundeschwanz'],
    ['圍巾', 'Scarf', 'Schal'], ['眼鏡', 'Glasses', 'Brille'], ['頭帶', 'Headband', 'Stirnband'], ['眼罩', 'Eyepatch', 'Augenklappe'], ['髮飾', 'Hair flower', 'Haarblume'],

    // ---------- 種族技能（racial.js） ----------
    ['種族技能', 'Racial skill', 'Volksfertigkeit'],
    ['龍息', 'Dragon Breath', 'Drachenatem'], ['往前噴一口龍焰，燒傷前方的敵人。', 'Breathe dragon fire ahead, burning the enemies in front of you.', 'Speie Drachenfeuer nach vorn und verbrenne die Gegner vor dir.'],
    ['振翅', 'Wingbeat', 'Flügelschlag'], ['展翅飛到準心處，落地的風壓把周圍的敵人吹開。', 'Spread your wings and fly to the crosshair; the gust as you land blows nearby enemies away.', 'Breite die Flügel aus und fliege zum Fadenkreuz; der Luftstoß bei der Landung schleudert Gegner in der Nähe weg.'],
    ['血之渴望', 'Bloodthirst', 'Blutdurst'], ['渴血 8 秒：吸血系數變成兩倍（普攻的回血機率／回血量、技能和大招的回血都照兩倍算）。', 'Thirst for blood for 8 s: life steal is doubled (the heal chance and amount of basic attacks, and healing from skills and ultimates, all count double).', '8 s Blutdurst: Lebensraub verdoppelt (Heilchance und -menge von Standardangriffen sowie Heilung durch Fertigkeiten und Ultimates zählen doppelt).'],
    ['震地', 'Ground Quake', 'Erdbeben'], ['用全身的重量踏地：周圍的敵人暈眩、被震開。', 'Stamp down with your whole weight: nearby enemies are stunned and knocked back.', 'Stampfe mit deinem ganzen Gewicht auf: Gegner in der Nähe werden betäubt und zurückgeschleudert.'],
    ['精靈之光', 'Elven Light', 'Elfenlicht'], ['借森林的光：你回復 25% 生命，隊友回復 20%。', 'Borrow the forest’s light: you recover 25% HP and your allies 20%.', 'Leih dir das Licht des Waldes: Du erhältst 25 % LP zurück, deine Verbündeten 20 %.'],
    ['隱身', 'Vanish', 'Verschwinden'], ['融進影子裡：隱身 3 秒，身邊的敵人變慢。', 'Melt into the shadows: invisible for 3 s, and nearby enemies slow down.', 'Verschmilz mit den Schatten: 3 s unsichtbar, und Gegner in der Nähe werden langsamer.'],
    ['激流', 'Torrent', 'Sturzflut'], ['捲起一道激流往前沖，把敵人沖開。', 'Whip up a torrent that surges forward and washes enemies away.', 'Entfessle eine Sturzflut, die nach vorn schießt und Gegner wegspült.'],
    ['晶刺', 'Crystal Spikes', 'Kristallstacheln'], ['從身上射出七根晶刺。', 'Fire seven crystal spikes from your body.', 'Schieß sieben Kristallstacheln aus deinem Körper.'],
    ['硬化', 'Harden', 'Verhärten'], ['皮膚一瞬間變得像岩石：1.6 秒內不受傷。', 'Your skin turns to rock in an instant: no damage for 1.6 s.', 'Deine Haut wird im Nu wie Fels: 1,6 s lang kein Schaden.'],
    ['毒刺', 'Venom Sting', 'Giftstachel'], ['一刺穿過一排，被刺中的敵人中毒（受到的傷害 +30%）。', 'One thrust pierces a whole line; enemies hit are poisoned (+30% damage taken).', 'Ein Stich durchbohrt eine ganze Reihe; getroffene Gegner werden vergiftet (+30 % erlittener Schaden).'],
    ['野性咆哮', 'Wild Roar', 'Wildes Brüllen'], ['一聲咆哮：8 秒內傷害 +20%、移動 +15%。', 'One roar: +20% damage and +15% movement for 8 s.', 'Ein Brüllen: 8 s lang +20 % Schaden und +15 % Bewegung.'],
    ['魔焰', 'Demon Flame', 'Dämonenflamme'], ['在準心處點起魔界的火焰。', 'Ignite the flames of the Demon Realm at the crosshair.', 'Entzünde die Flammen des Dämonenreichs am Fadenkreuz.'],

    // ---------- 排外（R.XENO_TEXT） ----------
    ['東鶴的人把你當自己人。', 'The people of Donghe treat you as one of their own.', 'Die Leute in Donghe behandeln dich wie einen von ihnen.'],
    ['有人會多看你兩眼；有些店收「外地人價」（貴一成）。', 'Some people take a second look at you; some shops charge an “outsider price” (10% more).', 'Manche schauen zweimal hin; manche Läden verlangen einen „Fremdenpreis“ (10 % mehr).'],
    ['昭旭排外：很多店收貴兩成，有人當面說難聽的話。', 'Zhaoxu distrusts outsiders: many shops charge 20% more, and some people insult you to your face.', 'Zhaoxu misstraut Fremden: Viele Läden verlangen 20 % mehr, und manche beleidigen dich offen.'],
    ['整座城都怕你：大部分店不賣你東西，路人會躲開，私人賞金獵人會來找你。', 'The whole city fears you: most shops won’t sell to you, passers-by keep away, and private bounty hunters come looking for you.', 'Die ganze Stadt fürchtet dich: Die meisten Läden verkaufen dir nichts, Passanten weichen dir aus, und private Kopfgeldjäger suchen nach dir.'],

    // ---------- 出身地（種族資料 from 用「・」分開的每一段） ----------
    ['地表平原', 'Surface plains', 'Ebenen der Oberwelt'], ['地表高地', 'Surface highlands', 'Hochland der Oberwelt'], ['地表森林', 'Surface forests', 'Wälder der Oberwelt'],
    ['地表沙漠', 'Surface deserts', 'Wüsten der Oberwelt'], ['地表高林', 'Surface high forests', 'Hochwälder der Oberwelt'], ['地表高山', 'Surface high mountains', 'Hochgebirge der Oberwelt'],
    ['地表荒原', 'Surface wastelands', 'Ödland der Oberwelt'], ['地表山地', 'Surface mountains', 'Bergland der Oberwelt'], ['地表各地', 'All over the surface', 'Überall auf der Oberwelt'], ['地表', 'Surface', 'Oberwelt'],
    ['淺海珊瑚礁區', 'Shallow coral reefs', 'Flache Korallenriffe'], ['淺海', 'Shallow seas', 'Flachmeere'],
    ['地下岩域', 'Underground rock realm', 'Unterirdisches Felsreich'], ['地下溶漿洞', 'Underground lava caves', 'Unterirdische Lavahöhlen'], ['地下岩穴', 'Underground rock caves', 'Unterirdische Felshöhlen'],
    ['地下靈魂迴廊', 'Underground soul corridors', 'Unterirdische Seelengänge'], ['地下礦脈', 'Underground ore veins', 'Unterirdische Erzadern'], ['地下巢穴', 'Underground nests', 'Unterirdische Nester'],
    ['地下濕地', 'Underground wetlands', 'Unterirdische Feuchtgebiete'], ['地下', 'Underground', 'Untergrund'],
    ['空島平原', 'Sky-island plains', 'Ebenen der Himmelsinseln'], ['空島高空', 'High skies above the sky islands', 'Hoher Himmel über den Himmelsinseln'], ['空島', 'Sky islands', 'Himmelsinseln'],
    ['深域結晶皇宮', 'Crystal Palace of the Deep', 'Kristallpalast der Tiefe'], ['深域結晶', 'Crystals of the Deep', 'Kristalle der Tiefe'],
    ['森林深處', 'Deep forests', 'Tiefe Wälder'], ['濕地', 'Wetlands', 'Feuchtgebiete'], ['不明', 'Unknown', 'Unbekannt'], ['天外', 'Beyond the sky', 'Jenseits des Himmels'],
    ['元素界', 'Elemental Realm', 'Elementarreich'], ['各地', 'Everywhere', 'Überall'], ['魔界', 'Demon Realm', 'Dämonenreich'], ['人界', 'Human Realm', 'Menschenwelt'],
    ['魔界與人界之間', 'Between the Demon Realm and the Human Realm', 'Zwischen Dämonenreich und Menschenwelt'],
    ['克拉克特斯（公會分類：神魔族）', 'Kraktes (guild category: divine demons)', 'Kraktes (Gildeneinstufung: göttliche Dämonen)'],
    ['混血', 'Mixed blood', 'Mischblut'], ['半神種', 'Demigod kind', 'Halbgötter'], ['賦神種', 'God-gifted kind', 'Gottbegabte'], ['薩恰族', 'Sacha', 'Sacha'], ['牧德族', 'Mude', 'Mude'],
    ['神魔族', 'Divine demons', 'Göttliche Dämonen'], ['半魔族', 'Half-demon', 'Halbdämon'], ['純魔族', 'Pure demon', 'Reiner Dämon'],
    // 族種
    ['大陸族種', 'Continental lineage', 'Festland-Stamm'], ['獸人族種', 'Beastfolk lineage', 'Tiervolk-Stamm'], ['精靈族種', 'Elven lineage', 'Elfen-Stamm'],
    ['獸妖族種', 'Spirit-beast lineage', 'Geistertier-Stamm'], ['岩礦族種', 'Rock-and-ore lineage', 'Fels-und-Erz-Stamm'], ['鰭人族種', 'Finfolk lineage', 'Flossenvolk-Stamm'],
    ['植根族種', 'Rooted lineage', 'Wurzel-Stamm'], ['翼人族種', 'Winged lineage', 'Flügelvolk-Stamm'], ['巨人族種', 'Giant lineage', 'Riesen-Stamm'],
    ['氣流族種', 'Airflow lineage', 'Luftstrom-Stamm'], ['流體族種', 'Fluid lineage', 'Fluid-Stamm'], ['擬態族種', 'Mimic lineage', 'Mimikry-Stamm'],
    ['節肢人族種', 'Arthropod-folk lineage', 'Gliederfüßer-Stamm'], ['晶體族種', 'Crystal lineage', 'Kristall-Stamm'], ['吸血族種', 'Vampire lineage', 'Vampir-Stamm'],
    ['光影族種', 'Light-and-shadow lineage', 'Licht-und-Schatten-Stamm'], ['岩龍族種', 'Rock-dragon lineage', 'Felsdrachen-Stamm'], ['節鱗族種', 'Scaled lineage', 'Schuppen-Stamm'],
    ['矮人族種', 'Dwarven lineage', 'Zwergen-Stamm'], ['地精族種', 'Goblin lineage', 'Goblin-Stamm'], ['妖精族種', 'Fairy lineage', 'Feen-Stamm'],
    ['妖人族種', 'Spirit-folk lineage', 'Geistervolk-Stamm'], ['蟲型族種', 'Insectoid lineage', 'Insekten-Stamm'], ['繁肢族種', 'Many-limbed lineage', 'Vielglieder-Stamm'],
    ['兩棲族種', 'Amphibian lineage', 'Amphibien-Stamm'], ['血族種', 'Blood lineage', 'Blut-Stamm'], ['聚合族種', 'Amalgam lineage', 'Verschmelzungs-Stamm'],
    ['真菌族種', 'Fungal lineage', 'Pilz-Stamm'], ['寰星族種', 'Starfallen lineage', 'Sternen-Stamm'], ['巨像族種', 'Colossus lineage', 'Koloss-Stamm'],
    ['穴甲族種', 'Burrow-shell lineage', 'Höhlenpanzer-Stamm'], ['泳熔族種', 'Lava-swimmer lineage', 'Lavaschwimmer-Stamm'], ['植精族種', 'Plant-spirit lineage', 'Pflanzengeister-Stamm'],
    ['元素精族種', 'Elemental-spirit lineage', 'Elementargeister-Stamm'], ['聚種族種', 'Composite lineage', 'Misch-Stamm'], ['化形族種', 'Shapeshifter lineage', 'Gestaltwandler-Stamm'],
    ['雲翼族種', 'Cloudwing lineage', 'Wolkenflügel-Stamm'],

    // ---------- 族種的共同說明（「○○族種：……」冒號後面那一段） ----------
    ['長耳朵，魔力多。', 'Long ears and plenty of MP.', 'Lange Ohren und viel MP.'],
    ['結實、耐打，掘礦是本行。', 'Sturdy and tough; mining is their trade.', 'Kräftig und zäh; Bergbau ist ihr Handwerk.'],
    ['個子小、手巧、運氣好。', 'Small, nimble-fingered and lucky.', 'Klein, fingerfertig und vom Glück begünstigt.'],
    ['背上一對薄翅，魔力很多。', 'A pair of thin wings on the back, and lots of MP.', 'Ein Paar dünner Flügel auf dem Rücken und viel MP.'],
    ['對魔力質很敏感。', 'Very sensitive to mana essence.', 'Sehr empfindlich für Manaessenz.'],
    ['眼睛會發光，擅長吸取魔力。', 'Their eyes glow; good at drawing in mana.', 'Ihre Augen leuchten; gut darin, Mana aufzusaugen.'],
    ['又高又壯。', 'Tall and strong.', 'Groß und stark.'],
    ['手腳的數目跟一般人不一樣。', 'They don’t have the usual number of arms and legs.', 'Sie haben nicht die übliche Zahl an Armen und Beinen.'],
    ['石頭、礦石一樣的皮膚。', 'Skin like stone and ore.', 'Haut wie Stein und Erz.'],
    ['身上長著晶石，和魔力水晶特別有緣。', 'Crystals grow on their bodies; they have a special bond with mana crystals.', 'Auf ihrem Körper wachsen Kristalle; sie sind Manakristallen besonders verbunden.'],
    ['血液就是魔力的容器。', 'Their blood is a vessel for mana.', 'Ihr Blut ist ein Gefäß für Mana.'],
    ['慢，但很難倒下。', 'Slow, but hard to bring down.', 'Langsam, aber schwer zu Fall zu bringen.'],
    ['身體會流動，很難被打實。', 'Their bodies flow, so clean hits are hard to land.', 'Ihr Körper fließt, saubere Treffer sind schwer.'],
    ['身體像風、像雲一樣輕。', 'Bodies as light as wind and clouds.', 'Körper so leicht wie Wind und Wolken.'],
    ['魔力質本身聚成了人形。', 'Mana essence itself, gathered into human form.', 'Manaessenz selbst, zu Menschengestalt verdichtet.'],
    ['頭頂一頂蕈傘，會慢慢長回來。', 'A mushroom cap on the head that slowly grows back.', 'Ein Pilzhut auf dem Kopf, der langsam nachwächst.'],
    ['擅長擬態，佩特拉不太注意得到。', 'Good at mimicry; Petra rarely notices them.', 'Gut in Mimikry; Petra bemerkt sie kaum.'],
    ['身上飄著光或影子。', 'Light or shadow drifts around them.', 'Licht oder Schatten umgibt sie.'],
    ['從天外落下來的族種，額頭上的晶石像星星。', 'A lineage that fell from beyond the sky; the crystal on the forehead looks like a star.', 'Ein Stamm, der von jenseits des Himmels fiel; der Kristall auf der Stirn sieht aus wie ein Stern.'],
    ['名字有「吸血」的能把血長期存在儲血袋裡、消耗低；有「噬血」的存不久，但轉化得快。', 'Races called “blood-drinking” keep blood in their blood sac for a long time at little cost; “blood-devouring” ones can’t keep it long, but convert it quickly.', 'Völker mit „Blutsauger“ im Namen bewahren Blut lange und sparsam in ihrem Blutbeutel; „Blutfresser“ können es nicht lange halten, wandeln es aber schnell um.'],
    ['大得像一座雕像。', 'As big as a statue.', 'So groß wie eine Statue.'],
    ['背著礦殼的蟲人，跟礦殼是遠親。', 'Insect folk who carry an ore shell — distant relatives of the Ore-shell.', 'Insektenvolk mit einem Erzpanzer auf dem Rücken – entfernte Verwandte der Erzschale.'],
    ['在熔岩裡游泳的族種。', 'A lineage that swims in lava.', 'Ein Stamm, der in Lava schwimmt.'],
    ['植物的精靈。', 'Spirits of plants.', 'Geister der Pflanzen.'],
    ['元素的精靈。', 'Spirits of the elements.', 'Geister der Elemente.'],
    ['好幾個族種的特徵聚在一起。', 'The traits of several lineages gathered in one.', 'Die Merkmale mehrerer Stämme in einem vereint.'],
    ['可以化成氣、流體、光影或擬態的形狀。', 'Can turn into vapour, fluid, light and shadow, or a mimicked shape.', 'Kann sich in Dampf, Flüssigkeit, Licht und Schatten oder eine nachgeahmte Gestalt verwandeln.'],
    ['翅膀像雲一樣。', 'Wings like clouds.', 'Flügel wie Wolken.'],
    ['岩石和金屬的龍人。', 'Dragonfolk of rock and metal.', 'Drachenvolk aus Fels und Metall.'],

    // ---------- 主要種族（名字、說明） ----------
    ['犬人族', 'Dog folk', 'Hundevolk'], ['貓人族', 'Cat folk', 'Katzenvolk'], ['雪狐族', 'Snow fox folk', 'Schneefuchsvolk'], ['狼人族', 'Wolf folk', 'Wolfsvolk'],
    ['沙人族', 'Sand folk', 'Sandvolk'], ['鰭人族', 'Finfolk', 'Flossenvolk'], ['樹人族', 'Treefolk', 'Baumvolk'], ['黑石族', 'Blackstone folk', 'Schwarzsteinvolk'],
    ['翼人族', 'Winged folk', 'Flügelvolk'], ['巨人族', 'Giant', 'Riese'], ['焰人族', 'Flame folk', 'Flammenvolk'], ['熔岩人族', 'Lava folk', 'Lavavolk'],
    ['幻魔族', 'Phantom demon', 'Trugdämon'], ['節肢蛛人族', 'Spider folk', 'Spinnenvolk'], ['黑水晶族', 'Black crystal folk', 'Schwarzkristallvolk'], ['吸血人族', 'Vampire folk', 'Vampirvolk'],
    ['暗影族', 'Shadow folk', 'Schattenvolk'], ['金龍人族', 'Golden dragonfolk', 'Golddrachenvolk'], ['龍人族', 'Dragonfolk', 'Drachenvolk'],
    ['瑪娜人族', 'Mana human', 'Mana-Mensch'], ['馬爾濟人族', 'Malzi human', 'Malzi-Mensch'], ['米賽人族', 'Missai human', 'Missai-Mensch'],
    ['矮人族', 'Dwarf', 'Zwerg'], ['半矮人族', 'Half-dwarf', 'Halbzwerg'], ['地精族', 'Goblin', 'Goblin'], ['妖精族', 'Fairy', 'Fee'],
    ['最常見的種族。學什麼都快。', 'The most common race. Quick to learn anything.', 'Das häufigste Volk. Lernt alles schnell.'],
    ['垂耳的犬族。和同伴站在一起的時候特別可靠。', 'Floppy-eared dog folk. Especially dependable when standing with their companions.', 'Hundevolk mit Schlappohren. Besonders verlässlich an der Seite von Gefährten.'],
    ['身手輕巧，翻滾回得快。', 'Light on their feet; their roll is ready again quickly.', 'Leichtfüßig; die Rolle ist schnell wieder bereit.'],
    ['魔力多，技能轉得快。', 'Plenty of MP; skills come back quickly.', 'Viel MP; Fertigkeiten sind schnell wieder bereit.'],
    ['對魔力質很敏感。法術打得重，也比較不容易被佩特拉注意。', 'Very sensitive to mana essence. Their spells hit hard, and Petra is less likely to notice them.', 'Sehr empfindlich für Manaessenz. Ihre Zauber treffen hart, und Petra bemerkt sie seltener.'],
    ['雪白的狐耳和尾巴，天藍色的眼睛。寒氣凍不住，法術也打得重。', 'Snow-white fox ears and tail, sky-blue eyes. Cold can’t freeze them, and their spells hit hard.', 'Schneeweiße Fuchsohren und Schwanz, himmelblaue Augen. Kälte friert sie nicht ein, und ihre Zauber treffen hart.'],
    ['耐打，近身的時候最兇。', 'Tough, and fiercest up close.', 'Zäh, und im Nahkampf am wildesten.'],
    ['習慣風沙：砂幕蒙不了眼。', 'Used to sandstorms: sand veils can’t blind them.', 'An Sandstürme gewöhnt: Sandschleier blenden sie nicht.'],
    ['傷口癒合得快，寒氣也凍不住。', 'Wounds heal quickly, and cold can’t freeze them.', 'Wunden heilen schnell, und Kälte friert sie nicht ein.'],
    ['石頭一樣的皮膚。', 'Skin like stone.', 'Haut wie Stein.'],
    ['背上一對白色的翅膀，跑得快、閃得快。', 'A pair of white wings on the back; fast on their feet and quick to dodge.', 'Ein Paar weißer Flügel auf dem Rücken; schnell zu Fuß und flink beim Ausweichen.'],
    ['又高又壯，打得重。', 'Tall and strong, and they hit hard.', 'Groß und stark, und sie schlagen hart zu.'],
    ['頭髮是火。打到的東西有時會燒起來。', 'Their hair is fire. Whatever they hit sometimes catches fire.', 'Ihr Haar ist Feuer. Was sie treffen, fängt manchmal Feuer.'],
    ['皮膚底下是熔岩。貼身打你的會被燙到。', 'Lava under the skin. Whoever hits you up close gets burned.', 'Unter der Haut fließt Lava. Wer dich aus nächster Nähe schlägt, verbrennt sich.'],
    ['頭頂一對小角。擅長擬態，佩特拉不太注意得到。', 'A pair of small horns on the head. Good at mimicry, so Petra rarely notices them.', 'Ein Paar kleiner Hörner auf dem Kopf. Gut in Mimikry, daher bemerkt Petra sie kaum.'],
    ['四隻眼睛，總是看得到要害。', 'Four eyes that always find the weak spot.', 'Vier Augen, die immer die Schwachstelle finden.'],
    ['額頭上長著水晶。採集魔力水晶時有額外收穫。', 'A crystal grows on the forehead. Extra yield when gathering mana crystals.', 'Auf der Stirn wächst ein Kristall. Mehr Ausbeute beim Sammeln von Manakristallen.'],
    ['蒼白的皮膚、紅眼睛、一對小尖牙。打中會吸血；晚上出發的遺跡打得更兇。', 'Pale skin, red eyes, a pair of small fangs. Hits drain blood; they fight harder in ruins entered at night.', 'Blasse Haut, rote Augen, ein Paar kleiner Fangzähne. Treffer saugen Blut; in nachts betretenen Ruinen kämpfen sie härter.'],
    ['身上飄著影子，眼睛發著淡藍的光。閃得快，從背後下手特別重，佩特拉也不太注意得到。', 'Shadows drift around them and their eyes glow pale blue. Quick to dodge, they hit especially hard from behind, and Petra rarely notices them.', 'Schatten umgeben sie, ihre Augen leuchten blassblau. Sie weichen schnell aus, treffen von hinten besonders hart, und Petra bemerkt sie kaum.'],
    ['金色的鱗片和龍角，和龍人族是不同的族種。鱗片堅硬，掘礦時有機會多獲得一塊礦石。', 'Golden scales and dragon horns — a different lineage from the dragonfolk. Their scales are hard; when mining there’s a chance of one extra ore.', 'Goldene Schuppen und Drachenhörner – ein anderer Stamm als das Drachenvolk. Harte Schuppen; beim Bergbau gibt es manchmal ein Erz mehr.'],
    ['鱗片、角、尾巴。很少見。', 'Scales, horns and a tail. Rarely seen.', 'Schuppen, Hörner und ein Schwanz. Selten zu sehen.'],
    ['翅膀、黑色雙角。人界的人怕你：店家不賣你東西、路人躲著走、私人賞金獵人會來找你。公會把你列為「受監視對象」——但也只有公會不准任何人討伐你。', 'Wings and a pair of black horns. People of the Human Realm fear you: shops won’t sell to you, passers-by keep away, and private bounty hunters come looking for you. The guild lists you as “under watch” — but the guild is also the one that forbids anyone to hunt you.', 'Flügel und zwei schwarze Hörner. Die Menschen der Menschenwelt fürchten dich: Läden verkaufen dir nichts, Passanten weichen aus, und private Kopfgeldjäger suchen nach dir. Die Gilde führt dich als „unter Beobachtung“ – aber sie ist auch die Einzige, die verbietet, dich zu jagen.'],
    ['大陸族種的一支。學什麼都快。', 'A branch of the continental lineage. Quick to learn anything.', 'Ein Zweig des Festland-Stamms. Lernt alles schnell.'],
    ['半魔族：大陸族種的一支。學什麼都快。', 'Half-demon: a branch of the continental lineage. Quick to learn anything.', 'Halbdämon: ein Zweig des Festland-Stamms. Lernt alles schnell.'],
    ['半神種・薩恰族：身上流著神的血，頭頂一圈金色的光。', 'Demigod kind · Sacha: divine blood runs in them, and a ring of golden light floats above the head.', 'Halbgötter · Sacha: In ihnen fließt göttliches Blut, über dem Kopf schwebt ein goldener Lichtring.'],
    ['賦神種・牧德族：被神賦予了力量的族種，頭頂一圈白色的光。', 'God-gifted kind · Mude: a lineage given power by a god, with a ring of white light above the head.', 'Gottbegabte · Mude: ein Stamm, dem ein Gott Kraft verlieh, mit einem weißen Lichtring über dem Kopf.']
  ]);
  // 種族技能：「種族技能「振翅」（T，冷卻 40 秒）：……」（加成說明用「・」切開後，最後那段的句點會先被拿掉）
  R.i18nPat(/^種族技能「(.+?)」（(.+?)，冷卻 (\d+) 秒）：(.+)$/, (m, t, e) => {
    const n = t(m[1]), k = /[㐀-鿿]/.test(m[2]) ? t(m[2]) : m[2], dot = /。$/.test(m[4]), d = t(dot ? m[4] : m[4] + '。');
    if (n == null || k == null || d == null) return null;
    const dd = dot ? d : d.replace(/\.$/, '');
    return e ? 'Racial skill “' + n + '” (' + k + ', ' + m[3] + ' s cooldown): ' + dd : 'Volksfertigkeit „' + n + '“ (' + k + ', ' + m[3] + ' s Abklingzeit): ' + dd;
  });
  R.i18nPat(/^種族技能「(.+?)」還要 (\d+) 秒。$/, (m, t, e) => { const n = t(m[1]); return n == null ? null : (e ? 'Racial skill “' + n + '” is ready in ' + m[2] + ' s.' : 'Volksfertigkeit „' + n + '“ ist in ' + m[2] + ' s bereit.'); });
  // 族種：「獸妖族種：對魔力質很敏感。」
  R.i18nPat(/^([^：・]+?族種)：(.+)$/, (m, t, e) => { const a = t(m[1]), b = t(m[2]); return a == null || b == null ? null : a + ': ' + b; });
  // 半魔族的說明最後多一句
  R.i18nPat(/^(.+。)東鶴的人怕半魔族，跟怕純魔族一樣。$/, (m, t, e) => { const a = t(m[1]); return a == null ? null : a + (e ? ' The people of Donghe fear half-demons just as much as pure demons.' : ' Die Leute in Donghe fürchten Halbdämonen genauso wie reine Dämonen.'); });
  R.i18nPat(/^半魔族（(.+?)魔族種）$/, (m, t, e) => { const a = t(m[1] + '族種'); return a == null ? null : (e ? 'Half-demon (' + a + ')' : 'Halbdämon (' + a + ')'); });
  // 種族加成（racebal.js，「・」切開後的每一段；數字照種族、混血不同）
  const pc = (v, e) => e ? v + '%' : v.replace('.', ',') + ' %', nm = (v, e) => e ? v : v.replace('.', ',');
  R.i18nAdd([['不怕寒氣減速', 'Immune to cold slow', 'Immun gegen Kälte-Verlangsamung'], ['不怕砂幕', 'Immune to sand veils', 'Immun gegen Sandschleier'], ['不怕燃燒', 'Immune to burning', 'Immun gegen Verbrennen']]);
  R.i18nPat(/^隊友受到的傷害 −([\d.]+)%$/, (m, t, e) => e ? 'Damage taken by allies −' + pc(m[1], e) : 'Schaden an Verbündeten −' + pc(m[1], e));
  R.i18nPat(/^無視護甲 ([\d.]+)%$/, (m, t, e) => e ? 'Ignores ' + pc(m[1], e) + ' of armour' : 'Ignoriert ' + pc(m[1], e) + ' Rüstung');
  R.i18nPat(/^每秒回復生命 ([\d.]+)$/, (m, t, e) => e ? 'HP regen ' + m[1] + '/s' : 'LP-Regeneration ' + nm(m[1], e) + '/s');
  R.i18nPat(/^每秒回復魔力 ([\d.]+)$/, (m, t, e) => e ? 'MP regen ' + m[1] + '/s' : 'MP-Regeneration ' + nm(m[1], e) + '/s');
  R.i18nPat(/^擊退 \+([\d.]+)$/, (m, t, e) => e ? 'Knockback +' + m[1] : 'Rückstoß +' + nm(m[1], e));
  R.i18nPat(/^([\d.]+)% 機率點燃$/, (m, t, e) => e ? pc(m[1], e) + ' chance to ignite' : pc(m[1], e) + ' Chance zu entzünden');
  R.i18nPat(/^貼身反傷 ([\d.]+)%$/, (m, t, e) => e ? 'Reflects ' + pc(m[1], e) + ' damage up close' : 'Reflektiert ' + pc(m[1], e) + ' Schaden im Nahkampf');
  R.i18nPat(/^晚上出發的遺跡傷害 \+([\d.]+)%$/, (m, t, e) => e ? 'Damage in ruins entered at night +' + pc(m[1], e) : 'Schaden in nachts betretenen Ruinen +' + pc(m[1], e));
  R.i18nPat(/^從背後打傷害 \+([\d.]+)%$/, (m, t, e) => e ? 'Damage from behind +' + pc(m[1], e) : 'Schaden von hinten +' + pc(m[1], e));
  R.i18nPat(/^掘礦多一塊的機率 ([\d.]+)%$/, (m, t, e) => e ? 'Chance of an extra ore when mining ' + pc(m[1], e) : 'Chance auf ein Erz mehr beim Bergbau ' + pc(m[1], e));
  R.i18nPat(/^近戰攻擊範圍 \+([\d.]+)%$/, (m, t, e) => e ? 'Melee range +' + pc(m[1], e) : 'Nahkampfreichweite +' + pc(m[1], e));
  // 精靈之光的數字會變（heal1010.js 改過）
  R.i18nPat(/^借森林的光：你回復 ([\d.]+)% 生命，隊友回復 ([\d.]+)%。$/, (m, t, e) => e ? 'Borrow the forest’s light: you recover ' + pc(m[1], e) + ' HP and your allies ' + pc(m[2], e) + '.' : 'Leih dir das Licht des Waldes: Du erhältst ' + pc(m[1], e) + ' LP zurück, deine Verbündeten ' + pc(m[2], e) + '.');
  // 建角色：沒有頭髮的種族
  R.i18nPat(/^(.+)沒有頭髮。$/, (m, t, e) => { const n = t(m[1]); return n ? (e ? 'The ' + n + ' race has no hair.' : 'Das Volk „' + n + '“ hat keine Haare.') : (e ? 'This race has no hair.' : 'Dieses Volk hat keine Haare.'); });
  // 混血
  R.i18nPat(/^(.+)（混血）$/, (m, t, e) => { const a = t(m[1]); return a == null ? null : a + (e ? ' (mixed blood)' : ' (Mischblut)'); });
  R.i18nPat(/^雙親有一邊是(.+?)。長相淡一點，(.+?)的本事只有一半，學東西倒是比較快。$/, (m, t, e) => {
    const a = t(m[1]); if (a == null) return null;
    return e ? 'One parent is ' + a + '. Their features are fainter and they have only half of the ' + a + ' gifts, but they learn faster.' : 'Ein Elternteil: ' + a + '. Schwächer ausgeprägt und nur die Hälfte der Gaben, lernt dafür schneller.';
  });
})(window.R);
