// 英文、德文字典・第三階段之十五（2026-11-03）：種族名字和說明，第一批字根——獸人族種（哺乳類等）、兩棲族種的人族外貌、半身（節肢、節鱗）。
// 種族名字是「（魔）（半）字根＋人族／獸人族」，說明是「○○族種・類別：句子」；這裡給字根表，名字和句子用句型拼。
// 字根表每一項：中文｜英文（小寫名詞）｜德文名詞｜德文複合字的前半（Känguru-volk、Katzen-volk、Pferde-volk）。
(function (R) {
  if (!R.i18nAdd) return;
  const T = {};
  [
    // 獸人族種（地表）
    '鴨嘴|duckbill|Entenschnabel|Entenschnabel', '鴨嘴獸|platypus|Schnabeltier|Schnabeltier', '針鼴|echidna|Ameisenigel|Ameisenigel',
    '袋鼠|kangaroo|Känguru|Känguru', '袋熊|wombat|Wombat|Wombat', '無尾熊|koala|Koala|Koala', '袋獾|Tasmanian devil|Beutelteufel|Beutelteufel',
    '袋鼬|quoll|Beutelmarder|Beutelmarder', '袋鼯|sugar glider|Gleitbeutler|Gleitbeutler', '袋狸|bandicoot|Nasenbeutler|Nasenbeutler',
    '負鼠|opossum|Opossum|Opossum', '刺蝟|hedgehog|Igel|Igel', '鼩鼴|shrew mole|Maulwurf|Maulwurf', '土豚|aardvark|Erdferkel|Erdferkel',
    '蹄兔|hyrax|Klippschliefer|Klippschliefer', '犬狼|dog-wolf|Hundewolf|Hundewolf', '狐|fox|Fuchs|Fuchs', '貓|cat|Katze|Katzen',
    '獅|lion|Löwe|Löwen', '虎|tiger|Tiger|Tiger', '豹|leopard|Leopard|Leoparden', '山貓|lynx|Luchs|Luchs', '熊|bear|Bär|Bären',
    '熊貓|panda|Panda|Panda', '鼬貂|marten|Marder|Marder', '水獺|otter|Otter|Otter', '獾|badger|Dachs|Dachs', '臭鼬|skunk|Stinktier|Stinktier',
    '靈貓|civet|Zibetkatze|Zibetkatzen', '獴|mongoose|Mungo|Mungo', '馬|horse|Pferd|Pferde', '犀|rhino|Nashorn|Nashorn', '貘|tapir|Tapir|Tapir',
    '豬|pig|Schwein|Schweine', '河馬|hippo|Flusspferd|Flusspferd', '駱駝|camel|Kamel|Kamel', '羊駝|alpaca|Alpaka|Alpaka',
    '長頸鹿|giraffe|Giraffe|Giraffen', '牛|ox|Rind|Rinder', '羊|goat|Ziege|Ziegen', '羚羊|antelope|Antilope|Antilopen', '鹿|deer|Hirsch|Hirsch',
    '馴鹿|reindeer|Rentier|Rentier', '駝鹿|moose|Elch|Elch', '狐猴|lemur|Lemur|Lemuren', '懶猴|slow loris|Plumplori|Plumplori',
    '眼鏡猴|tarsier|Koboldmaki|Koboldmaki', '猴|monkey|Affe|Affen', '狒狒|baboon|Pavian|Pavian', '長臂猿|gibbon|Gibbon|Gibbon',
    '猿|ape|Menschenaffe|Menschenaffen', '兔|rabbit|Hase|Hasen', '鼠兔|pika|Pfeifhase|Pfeifhasen', '鼠|rat|Ratte|Ratten', '跳鼠|jerboa|Springmaus|Springmaus',
    '松鼠|squirrel|Eichhörnchen|Eichhörnchen', '河狸|beaver|Biber|Biber', '豪豬|porcupine|Stachelschwein|Stachelschwein', '豚鼠|guinea pig|Meerschweinchen|Meerschweinchen',
    '毛絲鼠|chinchilla|Chinchilla|Chinchilla', '蝠|bat|Fledermaus|Fledermaus', '犰狳|armadillo|Gürteltier|Gürteltier', '食蟻|tamandua|Tamandua|Tamandua',
    '食蟻獸|anteater|Ameisenbär|Ameisenbären', '樹懶|sloth|Faultier|Faultier', '陸龜|tortoise|Landschildkröte|Landschildkröten',
    '水龜|turtle|Wasserschildkröte|Wasserschildkröten', '鱉|softshell turtle|Weichschildkröte|Weichschildkröten', '喙頭|tuatara|Brückenechse|Brückenechsen',
    // 兩棲族種（人族外貌）
    '蜥|lizard|Echse|Echsen', '鬣蜥|iguana|Leguan|Leguan', '變色龍|chameleon|Chamäleon|Chamäleon', '壁虎|gecko|Gecko|Gecko', '巨蜥|monitor lizard|Waran|Waran',
    '角蜥|horned lizard|Krötenechse|Krötenechsen', '鱷|crocodile|Krokodil|Krokodil', '短吻鱷|alligator|Alligator|Alligator', '蛙|frog|Frosch|Frosch',
    '蟾|toad|Kröte|Kröten', '螈|newt|Molch|Molch', '蚓螈|caecilian|Blindwühle|Blindwühlen',
    // 半身（節肢人族種、節鱗族種）
    '蛛|spider|Spinne|Spinnen', '蠍|scorpion|Skorpion|Skorpion', '鞭蠍|whip scorpion|Geißelskorpion|Geißelskorpion', '蜈蚣|centipede|Hundertfüßer|Hundertfüßer',
    '馬陸|millipede|Tausendfüßer|Tausendfüßer', '蟹|crab|Krabbe|Krabben', '寄居蟹|hermit crab|Einsiedlerkrebs|Einsiedlerkrebs', '龍蝦|lobster|Hummer|Hummer',
    '螳蝦|mantis shrimp|Fangschreckenkrebs|Fangschreckenkrebs', '鱟|horseshoe crab|Pfeilschwanzkrebs|Pfeilschwanzkrebs', '螭|serpent dragon|Schlangendrache|Schlangendrachen',
    '蛇|snake|Schlange|Schlangen', '眼鏡蛇|cobra|Kobra|Kobra', '蝮蝰|viper|Viper|Vipern', '游蛇|grass snake|Natter|Nattern', '水蛇|water snake|Wassernatter|Wassernattern',
    '盲蛇|blind snake|Blindschlange|Blindschlangen'
  ].forEach(s => { const [zh, en, dn, dc] = s.split('|'); T[zh] = { en, dn, dc }; });
  R.RACE_STEMS = Object.assign(R.RACE_STEMS || {}, T);
  const S = x => R.RACE_STEMS[x], cap = s => s.charAt(0).toUpperCase() + s.slice(1), an = w => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
  R.i18nAdd([
    ['獸人', 'Beastfolk', 'Tiervolk'], ['人族外貌', 'Human-looking', 'Menschenähnlich'], ['半身', 'Half-bodied', 'Halbleib']
  ]);
  // 名字：（魔）（半）字根＋人族／獸人族（「鴨嘴獸人族」是鴨嘴＋獸人族，跟說明「鴨嘴的外貌」一致）
  R.i18nPat(/^(魔)?(半)?(.+?)(獸人族|人族)$/, (m, t, e) => {
    const s = S(m[3]); if (!s) return null;
    const beast = m[4] === '獸人族';
    if (e) { const b = m[2] ? 'half-' + s.en + ' folk' : s.en + (beast ? ' beastfolk' : ' folk'); return m[1] ? 'Demon ' + b : cap(b); }
    const b = m[2] ? 'Halb' + s.dc.toLowerCase() + 'volk' : (beast ? s.dc + '-Tiervolk' : s.dc + 'volk');
    return m[1] ? 'Dämonen-' + b : b;
  });
  // 說明的句子
  R.i18nPat(/^人族的外貌，帶著(.+?)的特徵。$/, (m, t, e) => { const s = S(m[1]); return !s ? null : (e ? 'Human in appearance, with ' + s.en + ' features.' : 'Menschliches Aussehen mit ' + s.dc + '-Merkmalen.'); });
  R.i18nPat(/^(.+?)的外貌，人族的軀體。$/, (m, t, e) => { const s = S(m[1]); return !s ? null : (e ? 'Looks like ' + an(s.en) + ', built like a human.' : 'Aussehen: ' + s.dn + ', Körper: Mensch.'); });
  R.i18nPat(/^上半身是人，下半身是(.+?)的身體。$/, (m, t, e) => { const s = S(m[1]); return !s ? null : (e ? 'Human from the waist up, ' + s.en + ' from the waist down.' : 'Oben Mensch, unten ' + s.dn + '.'); });
  R.i18nPat(/^半身的(.+?)。$/, (m, t, e) => { const s = S(m[1]); return !s ? null : (e ? 'Half human, half ' + s.en + '.' : 'Halb Mensch, halb ' + s.dn + '.'); });
  R.i18nPat(/^人族外貌的(.+?)。$/, (m, t, e) => { const s = S(m[1]); return !s ? null : (e ? cap(an(s.en)) + ' in human form.' : s.dn + ' in Menschengestalt.'); });
  // 「獸人族種・獸人：……」「半魔族：……」
  R.i18nPat(/^([^：・]+?族種)・([^：]+?)：(.+)$/, (m, t, e) => { const a = t(m[1]), b = t(m[2]), c = t(m[3]); return a == null || b == null || c == null ? null : a + ' · ' + b + ': ' + c; });
  R.i18nPat(/^半魔族：(.+)$/, (m, t, e) => { const a = t(m[1]); return a == null ? null : (e ? 'Half-demon: ' : 'Halbdämon: ') + a; });
  // 建角色的格子提示：「名字：說明」
  R.i18nPat(/^([^：]+?族(?:（混血）)?)：(.+)$/, (m, t, e) => { const a = t(m[1]), b = t(m[2]); return a == null || b == null ? null : a + ': ' + b; });
})(window.R);
