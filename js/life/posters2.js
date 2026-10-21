// 競選海報每一塊不一樣（2026-10-21 作者：政治看板可以或多或少有點變化）
// posters.js 的板子原本每一塊都一樣（四個黨並排、第三張撕掉一角）。這裡照板子的位置和日子（每三天換一次）決定這一塊的樣子：
// - 哪一張被撕掉一角、哪一張整張被撕掉只剩碎紙、哪一張被雪水泡得褪色、哪一張被人用麥克筆亂畫了幾筆；
// - 有的貼了一張演講會的小傳單（哪一黨、哪裡、幾點）、有的多一張選舉管理委員會的公告（投票日、投票所）；
// - 下雪的城，板子上面積一層雪（渦旗不下雪）。
// 黨的主張照舊只看 posters.js 的 PARTIES（照作者的《國家簡介》），這裡不寫新的政見，只寫板子的樣子。
// 看海報的時候，說明換成「這一塊」的樣子。放在 posters.js 後面。
(function (R) {
  if (!R.electionBoard || !R.electionSheet || !R.PARTIES) return;
  const W = R.W, PARTIES = R.PARTIES;
  const hash = (a, b, c) => { const s = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453; return s - Math.floor(s); };
  const NO_SNOW = /^(woqi)$/;
  const PLACES = ['站前廣場', '中央公園', '公民會館', '商店街的路口', '市場前面', '港邊的廣場'];
  // ---------- 這一塊長什麼樣子 ----------
  const variant = (x, z) => {
    const day = R.S && R.S.day ? Math.floor(R.S.day / 3) : 0, r = k => hash(Math.round(x * 10), Math.round(z * 10), day * 7 + k);
    const v = { torn: Math.floor(r(1) * 4), corner: Math.floor(r(2) * 4), ripped: r(3) < 0.18 ? Math.floor(r(4) * 4) : -1, faded: r(5) < 0.3 ? Math.floor(r(6) * 4) : -1, scrib: r(7) < 0.22 ? Math.floor(r(8) * 4) : -1, flyer: r(9) < 0.38 ? Math.floor(r(10) * 4) : -1, notice: r(11) < 0.3, place: PLACES[Math.floor(r(12) * PLACES.length)], hour: 6 + Math.floor(r(13) * 3) };
    if (v.ripped === v.torn) v.torn = (v.torn + 1) % 4;
    const tw = W.town, cid = tw && tw.city ? String(tw.city.id || '') : 'donghe'; v.warm = NO_SNOW.test(cid); v.snow = !v.warm && r(14) < 0.7;
    v.key = [v.torn, v.corner, v.ripped, v.faded, v.scrib, v.flyer, v.notice, v.snow].join('|');
    return v;
  };
  // ---------- 貼圖（跟 posters.js 同一個畫法，加上這一塊的變化） ----------
  const cache = {};
  const tex = v => cache[v.key] || (cache[v.key] = R.pixCanvasTex(128, 60, (g, W0, H0) => {
    g.fillStyle = '#E8E4DA'; g.fillRect(0, 0, W0, H0);
    g.fillStyle = '#2E3440'; g.fillRect(0, 0, W0, 11); g.fillStyle = '#F4F0E6'; g.font = 'bold 9px "Noto Sans TC", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('議會選舉　海報張貼處', W0 / 2, 6);
    const fade = (hex, k) => { const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(u => Math.round(u + (232 - u) * k)); return 'rgb(' + c.join(',') + ')'; };
    PARTIES.forEach((p, i) => {
      const x = 3 + i * 31, y = 14, w = 29, h = 43;
      if (i === v.ripped) {   // 整張撕掉：只剩邊上的碎紙和膠帶
        g.fillStyle = p.c; [[x, y, 6, 5], [x + w - 7, y, 7, 4], [x, y + h - 6, 5, 6], [x + w - 4, y + h - 9, 4, 9]].forEach(q => g.fillRect(q[0], q[1], q[2], q[3]));
        g.fillStyle = 'rgba(240,236,220,.9)'; g.fillRect(x + 2, y + 1, 5, 2); g.fillRect(x + w - 7, y + h - 3, 5, 2);
        g.fillStyle = '#1A1A1A'; g.font = 'bold 6px sans-serif'; g.fillText(String(i + 1), x + 4, y + 4); return;
      }
      const k = i === v.faded ? 0.45 : 0;
      g.fillStyle = fade(p.c, k); g.fillRect(x, y, w, h);
      g.fillStyle = fade(p.a, k * 0.6); g.fillRect(x + 1, y + 1, w - 2, 1); g.fillRect(x + 1, y + h - 2, w - 2, 1);
      g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.arc(x + w / 2, y + 13, 5, 0, Math.PI * 2); g.fill(); g.fillRect(x + w / 2 - 8, y + 19, 16, 7);
      g.fillStyle = fade(p.a, k * 0.6); g.font = 'bold 7px "Noto Sans TC", sans-serif'; g.fillText(p.n.length > 3 ? p.n.slice(0, 2) + p.n.slice(-1) : p.n, x + w / 2, y + 31);
      g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(x + 4, y + 36, w - 8, 1); g.fillRect(x + 6, y + 39, w - 12, 1);
      g.fillStyle = '#1A1A1A'; g.font = 'bold 6px sans-serif'; g.fillText(String(i + 1), x + 4, y + 4);
      if (i === v.scrib) { g.strokeStyle = 'rgba(20,20,24,.85)'; g.lineWidth = 1; g.beginPath(); for (let s = 0; s < 6; s++) { const a = x + 6 + s * 3, b = y + 10 + (s % 2) * 6; s ? g.lineTo(a, b) : g.moveTo(a, b); } g.stroke(); g.beginPath(); g.arc(x + w / 2 + 3, y + 24, 3, 0, Math.PI * 1.6); g.stroke(); }
      if (i === v.torn) {   // 撕掉一角（四個角其中一個）
        const cx = v.corner % 2 ? x + w : x, cy = v.corner > 1 ? y + h : y, sx = v.corner % 2 ? -1 : 1, sy = v.corner > 1 ? -1 : 1;
        g.fillStyle = '#E8E4DA'; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + sx * 9, cy); g.lineTo(cx, cy + sy * 8); g.fill();
      }
      if (i === v.flyer) { g.save(); g.translate(x + w / 2 + 2, y + 33); g.rotate(-0.12); g.fillStyle = '#F6F2E4'; g.fillRect(-9, -5, 18, 11); g.fillStyle = p.c; g.fillRect(-9, -5, 18, 3); g.fillStyle = '#5A5A5A'; g.fillRect(-7, 0, 14, 1); g.fillRect(-7, 3, 10, 1); g.fillStyle = 'rgba(230,226,200,.8)'; g.fillRect(-3, -7, 6, 3); g.restore(); }
    });
    if (v.notice) { g.fillStyle = '#FFFFFF'; g.fillRect(W0 - 22, H0 - 15, 19, 13); g.fillStyle = '#2E3440'; g.fillRect(W0 - 22, H0 - 15, 19, 2); g.fillStyle = '#7A7A7A'; for (let k = 0; k < 4; k++) g.fillRect(W0 - 20, H0 - 11 + k * 2.4, 15 - (k % 2) * 4, 1); }
    if (v.snow) { g.fillStyle = '#F8FAFC'; g.fillRect(0, 0, W0, 2); for (let i = 0; i < W0; i += 3) g.fillRect(i, 2, 2, 1 + Math.floor(hash(i, 1, 2) * 3)); }
  }));
  // ---------- 立板子：換成這一塊的貼圖，記下位置 ----------
  const boards = [];
  const eb0 = R.electionBoard;
  R.electionBoard = (group, x, z, rotY) => {
    const g = eb0(group, x, z, rotY); if (!g) return g;
    try {
      if (boards.length && boards[0].group !== group) boards.length = 0;
      const v = variant(x, z), t = tex(v), faces = g.children.filter(o => o.isMesh && o.geometry && o.geometry.type === 'PlaneGeometry');
      if (faces.length) { const m = faces[0].material.clone(); m.map = t; faces.forEach(f => { f.material = m; }); }
      boards.push({ x, z, v, group });
    } catch (e) { console.warn('[posters2]', e); }
    return g;
  };
  // ---------- 看海報：說明換成這一塊 ----------
  const say = v => {
    const s = [];
    if (v.ripped >= 0) s.push(PARTIES[v.ripped].n + '的海報整張被撕掉了，只剩四個角的碎紙和膠帶。');
    s.push(PARTIES[v.torn].n + '的海報被撕掉一角' + (v.ripped < 0 && hash(v.torn, v.corner, 3) < 0.5 ? '，又有人用膠帶補了回去' : '') + '。');
    if (v.faded >= 0) s.push(PARTIES[v.faded].n + '的那一張' + (v.warm ? '被雨淋、被太陽曬' : '被雪水泡過') + '，顏色淡了一半。');
    if (v.scrib >= 0) s.push('有人用麥克筆在' + PARTIES[v.scrib].n + '的海報上亂畫了幾筆，看不出畫的是什麼。');
    if (v.flyer >= 0) s.push('角落貼著一張小傳單：「' + PARTIES[v.flyer].n + '　演講會　今晚 ' + v.hour + ' 點　' + v.place + '」。');
    if (v.notice) s.push('旁邊多一張選舉管理委員會的公告：投票日、投票所的地點，還有「請攜帶身分證明」。');
    if (v.snow) s.push('板子上面積了一層雪。');
    return '議會選舉快到了。四個黨的海報按號碼並排貼著。' + s.join('');
  };
  const es0 = R.electionSheet;
  R.electionSheet = () => {
    es0();
    try {
      const P = W.P; if (!P || !boards.length) return;
      let b = null, bd = 6; boards.forEach(o => { const d = Math.hypot(o.x - P.x, o.z - P.z); if (d < bd) { bd = d; b = o; } });
      const n = b && document.querySelector('#r-sheet .note'); if (n) n.textContent = say(b.v);
    } catch (e) { console.warn('[posters2]', e); }
  };
})(window.R);
