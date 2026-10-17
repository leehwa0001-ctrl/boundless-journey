// 人物素材完整版（2026-10-18 作者：打包並匯入遊戲內，連同種族和裝備）：打開「人物：素材版（測試）」的時候，
// 第一次才載入 charkit-full.js（兩三 MB，平常不載）；載入之後 charkit.js 畫人物的時候問 R.charkitKitFor(o)：
// - 身體：照種族的名字查族種對照表（獸人族種、半身族、鰭人族種……），沒有寫到的：名字有「精靈」「矮人」用那個身體，其他用人類。
// - 合身的圖層：同一件衣服在這個身體上的畫法（沒有另外畫的用人類的）。
// - 多畫的圖層：種族特徵（獸頭、獸耳、角、尾巴、獸身、翅膀……，照對照表）、盔甲（身上穿的胸甲、腿甲、鞋、頭盔，名字跟素材的變體一樣的才畫）、武器（手上拿的那把）。
// - 有獸頭的種族不畫頭髮、眼睛、眉毛（頭整個換掉了）。
// 放在 charkit.js 後面。
(function (R) {
  if (!R.CHARKIT) return;
  let FULL = null, loading = false;
  const SRC = 'js/art/charkit-full.js';
  const load = () => {
    if (FULL || loading) return; loading = true;
    const s = document.createElement('script'); s.src = SRC; s.async = true;
    s.onerror = () => { loading = false; console.warn('[charkitfull] 載入失敗：' + SRC); };
    document.head.appendChild(s);
  };
  R.charkitFullLoaded = () => { FULL = R.CHARKIT_FULL || null; loading = false; KITS.clear(); try { R.charkitRefresh && R.charkitRefresh(); } catch (e) { console.warn('[charkitfull]', e); } };
  R.charkitPoolKey = () => (FULL ? '|full' : '');
  // ---------- 種族 → 身體、特徵 ----------
  const raceName = id => (R.RACES && R.RACES[id] && R.RACES[id].name) || '';
  const raceOf = o => {
    const n = raceName(o.race), m = FULL.races[n];
    if (m) return m;
    const body = /精靈/.test(n) && FULL.bodies['精靈'] ? '精靈' : /矮人/.test(n) && FULL.bodies['矮人'] ? '矮人' : '人類';
    return { body, parts: {} };
  };
  // 這個身體的圖層（合身的畫法）
  const KITS = new Map();
  const kitOf = body => {
    let k = KITS.get(body); if (k) return k;
    const layers = {};
    Object.keys(FULL.layers).forEach(n => { const L = {}; Object.keys(FULL.layers[n]).forEach(v => { const V = FULL.layers[n][v]; L[v] = (V.by && V.by[body]) || V.a; }); layers[n] = L; });
    k = { body: FULL.bodies[body] || FULL.bodies['人類'], layers }; KITS.set(body, k); return k;
  };
  // ---------- 顏色 ----------
  const RACE_COL = { '角': o => o.hornCol || '#D8C8A8', '翅膀': o => o.wingCol || o.skin, '鬍子': o => o.hair, '頭飾': o => o.accCol || '#C9A13A', '氣息': o => o.auraCol || '#9AD8FF' };
  const ARMOR_COL = { heavy: '#9AA2AE', medium: '#7A5A3A', light: null };
  const WEAPON_ALT = { longbow: '#C4A068', shortbow: '#C4A068', crossbow: '#8A6A44', repeater: '#8A6A44', rifle: '#6A4A30', shotgun: '#6A4A30', sniperrifle: '#5A4A3A',
    tome: '#6A2A34', scrollb: '#B08850', talisman: '#B02A2A', parchment: '#C49A64', harp: '#B08A40', lute: '#9A6A3C', totem: '#8A5A3A' };
  const ARMOR_SLOTS = [['頭盔', 'head'], ['胸甲', 'body'], ['板腿', 'legs'], ['足甲', 'feet']];
  // ---------- 素材沒有畫的配件（圍巾、頭帶、耳環）：照這一格身體的頭、脖子位置畫上去（2026-10-18） ----------
  const G = 45;
  const decRLE = str => { const a = new Uint8Array(G * G); let i = 0, p = 0; while (p < str.length) { const v = str.charCodeAt(p++) - 97; let n = 0; while (p < str.length && str[p] >= '0' && str[p] <= '9') n = n * 10 + (str.charCodeAt(p++) - 48); n = n || 1; a.fill(v, i, i + n); i += n; } return a; };
  const encRLE = a => { let s = '', i = 0; while (i < a.length) { const v = a[i]; let n = 1; while (i + n < a.length && a[i + n] === v) n++; s += String.fromCharCode(97 + v) + (n > 1 ? n : ''); i += n; } return s; };
  const ACC_CACHE = new Map();
  const accFrame = (bodyStr, kind, d) => {
    const ck = kind + d + bodyStr; let r = ACC_CACHE.get(ck); if (r !== undefined) return r;
    const b = decRLE(bodyStr), g = new Uint8Array(G * G), rows = [];
    // 只看中間那一段（頭頂正中間往下連著的那一塊）：旁邊多出來的手、翅膀不算
    let top = -1; for (let y = 0; y < G && top < 0; y++) for (let x = 0; x < G; x++) if (b[y * G + x]) { top = y; break; }
    if (top < 0) { ACC_CACHE.set(ck, ''); return ''; }
    let cx = 0, cn = 0; for (let x = 0; x < G; x++) if (b[top * G + x]) { cx += x; cn++; } cx = Math.round(cx / cn);
    for (let y = 0; y < G; y++) { if (!b[y * G + cx]) { rows.push(null); continue; } let x0 = cx, x1 = cx; while (x0 > 0 && b[y * G + x0 - 1]) x0--; while (x1 < G - 1 && b[y * G + x1 + 1]) x1++; rows.push([x0, x1]); }
    const w = y => (rows[y] ? rows[y][1] - rows[y][0] + 1 : 0), maxW = Math.max(...rows.slice(top, top + 14).map((_, k) => w(top + k)));
    let bot = top; while (w(bot) < maxW) bot++; while (bot + 1 < G && w(bot + 1) >= maxW * 0.7) bot++;   // 頭的最下面一列（從頭最寬的那一列往下找）
    const set = (x, y, c) => { if (x >= 0 && x < G && y >= 0 && y < G) g[y * G + x] = c; };
    if (kind === 'headband') { for (const [y, c] of [[top + 6, 2], [top + 7, 3]]) { if (!rows[y]) continue; for (let x = rows[y][0]; x <= rows[y][1]; x++) if (b[y * G + x]) set(x, y, b[y * G + x] === 1 ? 1 : c); } }
    if (kind === 'scarf') {
      for (const [y, c] of [[bot + 1, 2], [bot + 2, 3]]) { if (!rows[y]) continue; for (let x = rows[y][0] - 1; x <= rows[y][1] + 1; x++) set(x, y, c); }
      if (d === 'left' || d === 'right') { const x = d === 'left' ? (rows[bot + 1] || [0, 0])[1] : (rows[bot + 1] || [0, 0])[0]; for (let y = bot + 3; y <= bot + 5; y++) set(x, y, 2); }   // 側面：垂下來的一截在背後
    }
    if (kind === 'earring' && rows[bot]) { const y = bot + 1, [x0, x1] = rows[bot]; if (d !== 'right') set(d === 'left' ? x1 - 1 : x0 + 1, y, 9); if (d !== 'left') set(d === 'right' ? x0 + 1 : x1 - 1, y, 9); }
    const out = g.slice(); for (let k = 0; k < g.length; k++) { if (!g[k] || g[k] === 1) continue; const x = k % G, y = (k - x) / G; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const q = (y + dy) * G + x + dx; if (x + dx >= 0 && x + dx < G && y + dy >= 0 && y + dy < G && !g[q] && !b[q]) out[q] = 1; }); }
    r = encRLE(out); ACC_CACHE.set(ck, r); return r;
  };
  const DRAWN_ACC = { scarf: 1, headband: 1, earring: 1 };
  // ---------- 給 charkit.js 的 ----------
  R.charkitKitFor = o => {
    if (!R.charkitOn || !R.charkitOn()) return null;
    if (!FULL) { load(); return null; }
    try {
      const rc = raceOf(o), base = kitOf(rc.body), parts = rc.parts || {}, P = R.charkitPaint;
      const skin = o.skin || '#E8C2A0', cloak = o.cloak || '#3A3440';
      const eq = o.eq || {}, armor = ARMOR_SLOTS.map(([layer, slot]) => { const it = eq[slot], A = it && R.ARMOR && R.ARMOR[it.base]; return A && FULL.layers[layer] && FULL.layers[layer][A.name] ? [layer, A.name, A.w] : null; }).filter(Boolean);
      const wp = o.weapon && FULL.weapons[o.weapon] ? o.weapon : null;
      const order = FULL.order.filter(n => parts[n]), cut = FULL.order.indexOf('褲子');
      const under = order.filter(n => cut >= 0 && FULL.order.indexOf(n) < cut), over = order.filter(n => !under.includes(n));   // 素材的圖層順序：在褲子前面的（皮紋、翅膀……）畫在衣服底下
      return {
        body: base.body, layers: base.layers, noHair: !!parts['獸頭'], noFace: !!parts['獸頭'],
        key: [rc.body, order.map(n => n + ':' + parts[n]).join('/'), armor.map(a => a[1]).join('/'), wp || '', DRAWN_ACC[o.acc] ? o.acc + (o.accCol || '') : ''].join('|'),
        under: (act, i, d, layerFrame) => {
          const out = [];
          under.forEach(n => { const f = layerFrame(base.layers[n] && base.layers[n][parts[n]], act, i); if (f && f[d]) out.push([f[d], P(RACE_COL[n] ? RACE_COL[n](Object.assign({ skin }, o)) : skin, cloak)]); });
          return out;
        },
        extra: (act, i, d, layerFrame) => {
          const out = [];
          const add = (by, pal) => { const f = layerFrame(by, act, i); if (f && f[d]) out.push([f[d], pal]); };
          over.forEach(n => add(base.layers[n] && base.layers[n][parts[n]], P(RACE_COL[n] ? RACE_COL[n](Object.assign({ skin }, o)) : skin, cloak)));
          armor.forEach(([layer, name, w]) => add(base.layers[layer][name], P(ARMOR_COL[w] || o.top || '#6A5A48', cloak)));
          if (DRAWN_ACC[o.acc]) { const bf = base.body[act] || base.body.stand, bd = bf && bf[Math.min(i, bf.length - 1)]; const f = bd && accFrame(bd[d], o.acc, d); if (f) out.push([f, P(o.acc === 'earring' ? '#E8C04A' : o.accCol || '#C8323A', cloak)]); }   // 圍巾、頭帶、耳環
          if (wp) add(FULL.weapons[wp], P('#C4CAD4', WEAPON_ALT[wp] || '#7A5636'));
          return out;
        }
      };
    } catch (e) { console.warn('[charkitfull]', e); return null; }
  };
  // 建角色、角色頁的預覽（R.heroSheetCanvas）：素材版開著的時候也給素材的圖（一格 72×90，_ck＝3 倍；呼叫的地方照 _ck 取格子）
  const hs0 = R.heroSheetCanvas;
  if (hs0) R.heroSheetCanvas = o => {
    const orig = hs0(o);
    try { if (R.charkitOn && R.charkitOn() && R.charkitSheet && o && !o.sil) { const c = R.charkitSheet(o, orig); c._ck = 3; return c; } } catch (e) { console.warn('[charkitfull]', e); }
    return orig;
  };
  R.charkitSheetKey = () => (R.charkitOn && R.charkitOn() ? '|ck' + (FULL ? 'f' : '') : '');
  // 換武器（R.setHeroWeapon 只重畫原本的圖）：素材版開著的時候也換成素材的
  const sw0 = R.setHeroWeapon;
  if (sw0) R.setHeroWeapon = (h, base) => { const r = sw0(h, base); try { if (R.charkitOn && R.charkitOn() && R.spriteLook && h && h.sp) R.spriteLook(h, {}); } catch (e) { console.warn('[charkitfull]', e); } return r; };
  // 標題畫面左上角「切換人物模型」（2026-10-18 作者）：原本的人物 ↔ 素材版（跟暫停選單那顆一樣，存在瀏覽器）
  const titleBtn = () => {
    const t = document.getElementById('title'); if (!t || document.getElementById('t-ckmodel')) return;
    const st = document.createElement('style');
    st.textContent = '#t-ckmodel{position:fixed;top:12px;left:12px;z-index:5;font:inherit;font-size:13px;padding:6px 12px;border-radius:6px;border:1px solid rgba(201,161,58,.6);background:rgba(20,16,24,.72);color:#EDE6D6;cursor:pointer}'
      + '#t-ckmodel small{display:block;font-size:11px;opacity:.75}#t-ckmodel:hover{border-color:#E8C04A}';
    document.head.appendChild(st);
    const b = document.createElement('button'); b.type = 'button'; b.id = 't-ckmodel';
    const label = () => { b.innerHTML = '切換人物模型<small>目前：' + (R.charkitOn() ? '素材版（測試）' : '原本') + '</small>'; };
    b.onclick = () => {
      try { if (R.charkitOn()) localStorage.removeItem('tfl-charkit'); else localStorage.setItem('tfl-charkit', '1'); } catch (e) { }
      if (R.charkitOn()) load();
      try { R.charkitRefresh && R.charkitRefresh(); } catch (e) { console.warn('[charkitfull]', e); }
      label(); R.toast && R.toast('人物模型：' + (R.charkitOn() ? '素材版（測試）' : '原本'));
    };
    label(); t.appendChild(b);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', titleBtn); else titleBtn();
  if (R.charkitOn && R.charkitOn()) load();
})(window.R);
