// 英文、德文字典・第三階段之十三（2026-11-03）：新版新手教學（tutorial2.js，電腦版的按鍵句子逐段翻）、東鶴指南（guide.js）、建角色畫面（creator2.js）。
(function (R) {
  if (!R.i18nAdd) return;
  R.i18nAdd([
    // ---------- 新手教學：「文字＋按鍵＋文字」切開後的每一段 ----------
    ['空白鍵', 'Space', 'Leertaste'], ['～', '–', '–'],
    ['出現提示時按', 'When a prompt appears, press', 'Erscheint ein Hinweis, drück'], ['互動。', 'to interact.', 'zum Interagieren.'],
    ['叫馬車，直接到目的地。', 'calls a carriage straight to your destination.', 'ruft eine Kutsche direkt zum Ziel.'],
    ['左上角寫著下一步。先去', 'The top left shows your next step. First head to the', 'Oben links steht der nächste Schritt. Geh zuerst zur'],
    ['接委託！', 'to take a request!', 'und nimm einen Auftrag an!'],
    ['回血，', 'heals HP,', 'heilt LP,'], ['回魔。', 'restores mana.', 'stellt Mana her.'],
    ['翻滾，不會受傷。', 'to roll — you can’t be hurt while rolling.', 'zum Rollen – dabei bist du unverwundbar.'],
    ['看地圖。', 'opens the map.', 'öffnet die Karte.'],
    ['點暖簾或', 'Click a curtain or press', 'Klick einen Vorhang an oder drück'], ['換分頁。', 'to switch tabs.', 'zum Wechseln der Reiter.'],
    ['拖著時按', 'While dragging, press', 'Beim Ziehen drück'], ['旋轉。', 'to rotate.', 'zum Drehen.'],
    ['帶回來的裝備先', 'First step for gear you bring back:', 'Erster Schritt für mitgebrachte Ausrüstung:'],
    ['蓄力，放開射出。', 'to draw, release to shoot.', 'zum Spannen, loslassen zum Schießen.'],
    ['打開陣紋，拖過節點畫線。', 'opens glyphs; drag across nodes to draw lines.', 'öffnet die Glyphen; zieh über Knoten, um Linien zu zeichnen.'],
    ['按技能看範圍，', 'Press a skill to preview its area, then', 'Drück eine Fertigkeit für die Bereichsvorschau, dann'],
    ['換普攻元素。', 'switches your basic attack element.', 'wechselt das Element des Grundangriffs.'],
    ['打中，敵人頭上出現元素。', 'hits mark enemies with an element above their heads.', '– Treffer markieren Gegner mit einem Element über dem Kopf.'],
    ['看反應表。', 'to view the reaction chart.', 'für die Reaktionstabelle.'],
    ['打中，召喚物一起撲上去。', 'hits make your summons pounce too.', '– bei Treffern springen deine Beschwörungen mit.'],
    ['收回全部。', 'to recall all.', 'zum Zurückrufen aller.'],
    ['錄樂譜：出手會變音符。', 'to record a score: your actions become notes.', 'zum Aufnehmen einer Partitur: deine Aktionen werden zu Noten.'],
    ['收刀，集滿刀意。', 'sheathes your blade to fill Blade Intent.', 'steckt die Klinge weg und füllt die Klingenabsicht.'],
    ['怒氣 50 以上按', 'With 50+ rage, press', 'Ab 50 Wut drück'],
    ['換彈時指針到金格按', 'While reloading, when the needle reaches the gold cell, press', 'Beim Nachladen, wenn der Zeiger das goldene Feld erreicht, drück'],
    ['彈匣滿時按', 'With a full magazine, press', 'Bei vollem Magazin drück'], ['換子彈。', 'to switch ammo.', 'zum Munitionswechsel.'],
    ['換武器刻印。', 'changes your weapon engraving.', 'wechselt die Waffengravur.'],
    ['打中攢力量，滿了自動放。', 'hits build power, released automatically when full.', '– Treffer bauen Kraft auf, die sich bei voller Ladung entlädt.'],
    ['換拳、掌、步、腿四法。', 'switches among the four styles: fist, palm, footwork and kick.', 'wechselt zwischen den vier Stilen Faust, Handfläche, Schritt und Tritt.'],
    ['做到了會自己跳下一步', 'Moves on by itself once you’ve done it', 'Geht von selbst weiter, sobald erledigt'],
    ['關掉教學', 'Turn off tutorial', 'Tutorial ausschalten'], ['跳過這段', 'Skip this part', 'Diesen Teil überspringen'],
    ['新版新手教學', 'New tutorial', 'Neues Tutorial'], ['只問這一次', 'Asked only once', 'Wird nur einmal gefragt'],
    ['要開著一步一步的小提示嗎？', 'Keep the step-by-step tips on?', 'Schritt-für-Schritt-Tipps anlassen?'], ['好，開著', 'Yes, keep them on', 'Ja, anlassen'],
    ['點「看」重看一段；在那個地方才會出現的段落，到了會自己開始。', 'Tap “View” to replay a part; parts tied to a place start by themselves when you get there.', 'Tippe „Ansehen“, um einen Teil erneut zu sehen; ortsgebundene Teile starten von selbst, wenn du dort bist.'],
    ['全部重來', 'Restart all', 'Alles neu starten'],

    // ---------- 東鶴指南 ----------
    ['白藤堂（藥鋪）', 'Hakutō (apothecary)', 'Hakutō (Apotheke)'], ['赤提燈（居酒屋・宿屋）', 'Red Lantern (izakaya · inn)', 'Rote Laterne (Izakaya · Gasthaus)'],
    ['世界中央銀行', 'World Central Bank', 'Weltzentralbank'], ['自己的家（公團住宅）', 'Your home (public housing)', 'Dein Zuhause (Sozialwohnung)'],
    ['先下車。', 'Get off first.', 'Steig zuerst aus.'], ['東鶴有什麼', 'What’s in Donghe', 'Was es in Donghe gibt'], ['新手的第一步', 'First steps', 'Erste Schritte'],
    ['新手指引已經完成了。', 'You’ve finished the beginner guide.', 'Du hast die Anfängerhilfe abgeschlossen.'],
    ['全部做完，公會送 300 費拉。', 'Finish them all and the guild sends you 300 Fera.', 'Erledige alles, und die Gilde schickt dir 300 Fera.'],
    ['每個地方能做什麼', 'What you can do where', 'Was du wo tun kannst'],
    ['按鍵：空白鍵 互動・Shift 跑步・T 快速移動・Tab 或 M 地圖・Esc 選單・I 背包（遺跡裡）・', 'Keys: Space interact · Shift run · T fast travel · Tab or M map · Esc menu · I pack (in ruins) · ', 'Tasten: Leertaste interagieren · Umschalt laufen · T Schnellreise · Tab oder M Karte · Esc Menü · I Rucksack (in Ruinen) · '],
    ['手上的委託。觀光章、奉主、柏青哥、麻將……都是可以慢慢玩的。', 'current requests. Tourist stamps, Fengzhu, pachinko, mahjong… there’s plenty to enjoy at your own pace.', 'aktuelle Aufträge. Touristenstempel, Fengzhu, Pachinko, Mahjong … vieles lässt sich in Ruhe genießen.'],
    ['在左上角顯示下一步', 'Show the next step at the top left', 'Nächsten Schritt oben links anzeigen'],

    // ---------- 建角色 ----------
    ['勇者登記・一、種族與外觀', 'Adventurer registration · 1. Race and appearance', 'Abenteurerregistrierung · 1. Volk und Aussehen'],
    ['勇者登記・二、特質與武器', 'Adventurer registration · 2. Traits and weapon', 'Abenteurerregistrierung · 2. Merkmale und Waffe'],
    ['選擇的種族', 'Chosen race', 'Gewähltes Volk'], ['還沒選。抽完以後點下面的格子。', 'None yet. After drawing, click a card below.', 'Noch keins. Nach dem Ziehen klick unten eine Karte an.'],
    ['先在左邊抽種族、選一個，', 'Draw races on the left and pick one,', 'Zieh links Völker und wähl eins aus,'], ['這裡就會出現外觀的選項。', 'and appearance options will appear here.', 'dann erscheinen hier die Optionen fürs Aussehen.'],
    ['全部隨機', 'Randomize all', 'Alles zufällig'], ['髮型', 'Hairstyle', 'Frisur'], ['沒有頭髮。', 'No hair.', 'Keine Haare.'], ['髮色', 'Hair colour', 'Haarfarbe'],
    ['膚色', 'Skin tone', 'Hautton'], ['眼睛', 'Eyes', 'Augen'], ['眉毛', 'Eyebrows', 'Augenbrauen'], ['瞳孔', 'Pupils', 'Pupillen'], ['表情', 'Expression', 'Ausdruck'],
    ['身高', 'Height', 'Größe'], ['體格', 'Build', 'Statur'], ['腰帶', 'Belt', 'Gürtel'], ['裡面的襯衫', 'Undershirt', 'Unterhemd'],
    ['五十連抽一次', 'Draw fifty at once', 'Fünfzig auf einmal ziehen'], ['勇者證上要寫種族。', 'Your adventurer card must state your race.', 'Auf deinem Abenteurerausweis steht dein Volk.'],
    ['按下「抽」五十連抽一次，', 'Press “Draw” to draw fifty at once,', 'Drück „Ziehen“, um fünfzig auf einmal zu ziehen,'],
    ['從抽到的裡面選一個（最稀有的排前面）。', 'then pick one of them (the rarest come first).', 'dann wähl eins davon (die seltensten zuerst).'],
    ['抽', 'Draw', 'Ziehen'], ['已經抽過了', 'Already drawn', 'Schon gezogen'], ['換一個', 'Change', 'Wechseln'], ['外觀', 'Appearance', 'Aussehen'],
    ['點數不夠', 'Not enough points', 'Nicht genug Punkte'], ['登記武器', 'Register weapon', 'Waffe registrieren'], ['武器的類別就是職業', 'The weapon type is your class', 'Die Waffenart ist deine Klasse'],
    ['優點特質', 'Positive traits', 'Positive Merkmale'], ['用掉點數', 'Cost points', 'Kosten Punkte'], ['缺點特質', 'Negative traits', 'Negative Merkmale'], ['多給點數', 'Give extra points', 'Geben Extrapunkte'],
    ['已選擇的特質', 'Chosen traits', 'Gewählte Merkmale'],
    ['特質選了就不能再改，請對自己的角色負責。可以不選，點數也可以不用完。', 'Traits can’t be changed once chosen, so choose with care. You may pick none, and you don’t have to spend all your points.', 'Merkmale lassen sich nach der Wahl nicht mehr ändern, also wähle mit Bedacht. Du kannst auch keine wählen und musst nicht alle Punkte ausgeben.'],
    ['還沒選。', 'None yet.', 'Noch keine.'], ['點中間的特質加進來，', 'Click a trait in the middle to add it,', 'Klick ein Merkmal in der Mitte an, um es hinzuzufügen,'], ['點這裡的拿掉。', 'click one here to remove it.', 'klick eins hier an, um es zu entfernen.'],
    ['登記完成，走出公會', 'Finish registration and leave the guild', 'Registrierung abschließen und die Gilde verlassen'],
    ['公會東鶴分館登記了一名純魔族勇者，列為受監視對象。', 'The Guild Donghe Branch registered a pure-blooded demon adventurer and placed them under watch.', 'Die Gilde Donghe hat einen reinblütigen Dämonen-Abenteurer registriert und unter Beobachtung gestellt.']
  ]);

  R.i18nPat(/^(.+)的頭髮是天生的顏色。$/, (m, t, e) => { const n = t(m[1]); return n ? (e ? n + '’s hair is its natural colour.' : 'Die Haare der ' + n + ' haben ihre natürliche Farbe.') : (e ? 'This race’s hair keeps its natural colour.' : 'Die Haare dieses Volkes behalten ihre natürliche Farbe.'); });
  R.i18nPat(/^抽到 (\d+) 個，點一個登記$/, (m, t, e) => e ? 'Drew ' + m[1] + ' — click one to register' : m[1] + ' gezogen – klick eins zum Registrieren an');
  R.i18nPat(/^不能和「(.+)」一起選$/, (m, t, e) => { const L = m[1].split('」「').map(x => t(x)); if (L.some(x => x == null)) return null; return e ? 'Can’t be combined with “' + L.join('”, “') + '”' : 'Nicht kombinierbar mit „' + L.join('“, „') + '“'; });
  R.i18nPat(/^用掉 (\d+) 點$/, (m, t, e) => e ? 'Costs ' + m[1] + (m[1] === '1' ? ' point' : ' points') : 'Kostet ' + m[1] + (m[1] === '1' ? ' Punkt' : ' Punkte'));
  R.i18nPat(/^多 (\d+) 點$/, (m, t, e) => e ? '+' + m[1] + (m[1] === '1' ? ' point' : ' points') : '+' + m[1] + (m[1] === '1' ? ' Punkt' : ' Punkte'));
  R.i18nPat(/^剩下 (-?\d+) 點$/, (m, t, e) => e ? m[1] + ' points left' : 'Noch ' + m[1] + ' Punkte');
  R.i18nPat(/^（一開始 (\d+) 點）$/, (m, t, e) => e ? '(' + m[1] + ' at the start)' : '(' + m[1] + ' zu Beginn)');
  R.i18nPat(/^拿掉「(.+)」點數會不夠，先拿掉一些優點。$/, (m, t, e) => { const n = t(m[1]); return n == null ? null : (e ? 'Removing “' + n + '” would leave too few points; remove some positive traits first.' : 'Ohne „' + n + '“ reichen die Punkte nicht; entferne zuerst einige positive Merkmale.'); });
})(window.R);
