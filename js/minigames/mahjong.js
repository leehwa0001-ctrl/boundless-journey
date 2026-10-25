// 無境之旅：雀莊「東風」的大樓和店裡（作者：新增日式麻將館）
// 繁華街（旅館和柏青哥中間）的三層小樓，二樓是雀莊；裡面四張桌子，找一張坐下就開打（R.mahjong：牌桌在 mahjong2.js、規則在 mjcore.js）。
// 2026-10-26：舊的牌桌（第一版的規則、電腦、畫面）已經被 mahjong2.js／mjcore.js 取代，刪掉了。
// 街上的大樓包住 R.buildCivic（用 civic.js 的 api.civ、api.bigSign）。
(function (R) {
  // ---------- 街上的大樓 ----------
  const civ0 = R.buildCivic;
  R.buildCivic = api => {
    civ0(api);
    const F = R.CITY.FAC.mahjong; if (!F || !api.civ) return;
    try {
      const { HB, G3, B_, inter, WX, WZ } = api, b = api.civ(F[0], F[1], 10, 7.6, 3, { col: '#7A6A58', win: 1.4, fh: 3.0, doorW: 1.6 });
      api.bigSign(b.x, 4.6, b.front + 0.08, 0, '雀莊 東風', '#1E3A2A', '#F2E8C8', 5.2, 1.0);
      // 直式的燈箱招牌「麻雀」：貼在正面的右邊
      HB.add(G3.box, B_('#E8E0C8', { em: '#FFF0C8', ei: 0.8 }), b.x + b.w / 2 - 0.7, 5.6, b.front + 0.12, 1.1, 3.4, 0.2);
      { const TH = THREE, t = R.pixCanvasTex(32, 104, (g, W0, H0) => { g.fillStyle = '#B8282A'; g.fillRect(0, 0, W0, H0); g.fillStyle = '#FFFFFF'; g.font = 'bold ' + Math.round(W0 * 0.78) + 'px "Noto Serif TC", serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; ['麻', '雀'].forEach((ch, i) => g.fillText(ch, W0 / 2, (i + 0.5) * H0 / 2 + 1)); });
        const m = new TH.Mesh(new TH.PlaneGeometry(0.92, 3.0), R.seeThrough(new TH.MeshBasicMaterial({ map: t }))); m.position.set(b.x + b.w / 2 - 0.7, 5.6, b.front + 0.24); api.group.add(m); }
      // 一樓：通往二樓的樓梯口
      HB.add(G3.box, B_('#2A2420', { tex: 0 }), b.x - 3.2, 1.2, b.front + 0.06, 1.4, 2.4, 0.06);
      inter(b.door[0], b.door[1], 2.2, '走進雀莊「東風」（麻將）', () => R.enterInterior ? R.enterInterior('mahjong') : R.mahjong());
    } catch (e) { console.warn('[mahjong] building', e); }
  };

  // ---------- 裡面：四張桌子，三張有人在打 ----------
  const PL = R.INTERIOR_PLACES, FN = R.INTERIOR_FURNISH = R.INTERIOR_FURNISH || {};
  if (PL) {
    PL.mahjong = { name: '雀莊「東風」', sub: '二樓', hint: '洗牌的聲音嘩啦嘩啦', w: 14, d: 11, h: 3.4, wall: '#6A5A48', cap: '#3A2E24', floor: ['#4A5246', 'floor'], zoom: 0.82, out: '下樓（回到街上）' };
    FN.mahjong = c => {
      const { bx, block, inter, npc, lamp, sign, HW, HD, NW } = c, K = R.INTERIOR_KIT;
      const LOOKS = [['#3A4A5A', '#8A8A88'], ['#5A3A3A', '#2A2420'], ['#2E2E38', '#1A1410'], ['#6A5A3A', '#4A3424'], ['#3A5A4A', '#C8C0B0']];
      const table = (tx, tz, busy, mine) => {
        bx(1.7, 0.1, 1.7, '#2E6A4A', tx, 0.78, tz); bx(1.9, 0.08, 1.9, '#4A3424', tx, 0.72, tz); bx(0.3, 0.7, 0.3, '#3A2A1C', tx, 0.36, tz);
        for (let i = 0; i < 4; i++) for (let k = 0; k < 6; k++) { const a = i * Math.PI / 2, ox = Math.sin(a) * 0.62, oz = Math.cos(a) * 0.62, px = -Math.cos(a) * (k - 2.5) * 0.17, pz = Math.sin(a) * (k - 2.5) * 0.17; bx(0.14, 0.1, 0.1, '#F2ECD8', tx + ox + px, 0.88, tz + oz + pz); }
        block(tx - 0.95, tx + 0.95, tz - 0.95, tz + 0.95, 'table');
        [[0, 1.3, Math.PI], [1.3, 0, -Math.PI / 2], [0, -1.3, 0], [-1.3, 0, Math.PI / 2]].forEach(([ox, oz, rot], i) => {
          bx(0.5, 0.08, 0.5, '#5A3E28', tx + ox, 0.46, tz + oz); bx(0.08, 0.46, 0.08, '#3A2A1C', tx + ox, 0.23, tz + oz);
          if (busy && !(mine && i === 0)) { const lk = LOOKS[(((i + Math.round(tx * 3 + tz)) % LOOKS.length) + LOOKS.length) % LOOKS.length], n = npc(tx + ox, tz + oz, rot, { name: '打麻將的客人', look: { top: lk[0], hair: lk[1], cloak: lk[0] } }); if (n && n.h) n.h.sit = true; }
        });
        if (busy && !mine) inter(tx, tz + 1.9, 1.7, '和這桌的客人打麻將', () => R.mahjong());   // 每一桌都能坐下打（作者：麻將館不能打麻將？——原本只有一張空桌能坐，找不到）
        if (mine) inter(tx, tz + 1.9, 1.7, '找空的那張桌子坐下（打麻將）', () => R.mahjong());
      };
      table(-3.6, -2.2, 1); table(3.6, -2.2, 1); table(-3.6, 2.4, 1); table(3.6, 2.4, 0, 1);
      // 櫃台和老闆娘
      bx(3.4, 1.0, 0.8, '#5A4030', 0, 0.5, -HD + 1.0); bx(3.6, 0.1, 1.0, '#7A5A40', 0, 1.05, -HD + 1.0); block(-1.8, 1.8, -HD + 0.5, -HD + 1.5, 'counter');
      npc(0, -HD + 0.4, 0, { name: '雀莊的老闆', look: { top: '#4A3A30', hair: '#8A8A88', acc: 'glasses' } });
      inter(0, -HD + 2.2, 1.8, '和老闆說話（開一桌麻將）', () => { if (R.mahjong) { R.mahjong(); return; } const m = (R.S && R.S.mj) || {}; K.talk('雀莊的老闆', [m.games ? '「又來啦。打了 ' + m.games + ' 場，拿了 ' + (m.first || 0) + ' 次第一。」' : '「新面孔？空桌在右前方。不懂規則的話，桌上有提示。」', pick(['「吃碰之前先想想有沒有役。白發中碰了就有。」', '「上個月有個勇者在這裡和了四暗刻，到現在還在講。」', '「茶免費，菸到外面抽。」'])]); });
      sign(0, 2.6, -HD + 0.36, 0, '本月排名', '#1E3A2A', NW.g);
      if (K && K.plantAt) { K.plantAt(c, -HW + 0.7, HD - 0.8); K.plantAt(c, HW - 0.7, -HD + 0.8); }
      lamp(-3.6, 2.8, -2.2, '#FFF0D0', 0.55, 7); lamp(3.6, 2.8, -2.2, '#FFF0D0', 0.55, 7); lamp(-3.6, 2.8, 2.4, '#FFF0D0', 0.55, 7); lamp(3.6, 2.8, 2.4, '#FFF0D0', 0.55, 7);
    };
  }
})(window.R);
