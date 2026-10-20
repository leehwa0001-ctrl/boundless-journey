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
  R.charkitFullLoaded = () => { FULL = R.CHARKIT_FULL || null; loading = false; KITS.clear(); RACE_FEAT.clear(); try { R.charkitRefresh && R.charkitRefresh(); } catch (e) { console.warn('[charkitfull]', e); } };
  R.charkitPoolKey = () => (FULL ? '|full' : '');
  // ---------- 種族 → 身體、特徵 ----------
  const raceName = id => (R.RACES && R.RACES[id] && R.RACES[id].name) || '';
  // 2026-10-18：對照表沒寫到的種族（犬人、狼人、精靈、幻魔……），照遊戲裡的種族外觀（耳朵、角、尾巴、翅膀）配素材的特徵
  const FEAT = { ears: ['獸耳', { cat: '貓耳', wolf: '狼耳', fox: '狐耳', dog: '垂耳', round: '圓耳', rabbit: '兔耳', fin: '鰭耳', antenna: '細觸角' }],
    horns: ['角', { small: '小角', goat: '羊角', antler: '鹿角', dragon: '龍角', demon: '羊角' }], tail: ['尾巴', { cat: '貓尾', fox: '狐尾', dragon: '龍尾', wolf: '狼尾', dog: '短尾' }], wings: ['翅膀', { feather: '羽翼', demon: '蝠翼' }] };
  const RACE_FEAT = new Map();
  const raceOf = o => {
    const n = raceName(o.race), m = FULL.races[n];
    if (m) return m;
    let r = RACE_FEAT.get(o.race); if (r) return r;
    const body = /精靈/.test(n) && FULL.bodies['精靈'] ? '精靈' : /矮人/.test(n) && FULL.bodies['矮人'] ? '矮人' : '人類', parts = {}, rl = (R.raceLook && R.raceLook(o.race)) || {};
    Object.keys(FEAT).forEach(k => { const [layer, map] = FEAT[k], v = map[rl[k]]; if (v && FULL.layers[layer] && FULL.layers[layer][v]) parts[layer] = v; });
    if (rl.ears === 'elf' && FULL.layers['種族特徵'] && FULL.layers['種族特徵']['尖耳']) parts['種族特徵'] = '尖耳';
    r = { body, parts }; RACE_FEAT.set(o.race, r); return r;
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
  // ---------- 給 charkit.js 的 ----------
  R.charkitKitFor = o => {
    if (!R.charkitOn || !R.charkitOn()) return null;
    if (!FULL) { load(); return null; }
    try {
      const rc = raceOf(o), base = kitOf(rc.body), parts = o.ckNoRace ? {} : rc.parts || {}, P = R.charkitPaint;
      const skin = o.skin || '#E8C2A0', cloak = o.cloak || '#3A3440';
      const eq = o.eq || {}, armor = ARMOR_SLOTS.map(([layer, slot]) => { const it = eq[slot], A = it && R.ARMOR && R.ARMOR[it.base]; return A && FULL.layers[layer] && FULL.layers[layer][A.name] ? [layer, A.name, A.w] : null; }).filter(Boolean);
      const wp = o.weapon && FULL.weapons[o.weapon] ? o.weapon : null;
      const order = FULL.order.filter(n => parts[n]), cut = FULL.order.indexOf('褲子');
      const under = order.filter(n => cut >= 0 && FULL.order.indexOf(n) < cut), over = order.filter(n => !under.includes(n));   // 素材的圖層順序：在褲子前面的（皮紋、翅膀……）畫在衣服底下
      return {
        body: base.body, layers: base.layers, noHair: !!parts['獸頭'], noFace: !!parts['獸頭'],
        key: [rc.body, order.map(n => n + ':' + parts[n]).join('/'), armor.map(a => a[1]).join('/'), wp || ''].join('|'),
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
  // 標題畫面左上角的「切換人物模型」拿掉了（2026-10-20 作者：舊版人物拿掉，一律素材版）
  if (R.charkitOn && R.charkitOn()) load();
})(window.R);
