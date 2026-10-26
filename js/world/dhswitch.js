// 東鶴一律用精緻版（2026-10-26 作者：東鶴整個重新設計，並用精緻版；像素版的切換、跑不動自動換回像素版都拿掉）
// - 所有進東鶴的路（R.enterTownNow：開遊戲、從遺跡回來、睡一晚、搭車回來、受罰……；精緻版自己的換日 CK.enter('donghe')）都走精緻版：
//   先在背景照原本的流程把東鶴的互動、站著的人、劇情人物收下來（city_donghe.js 的 CK.dongheHarvest，不畫出來），再蓋精緻版。
//   地名的橫幅只留收東西那一次（「從遺跡回來了」這些）。精緻版蓋失敗才退回原本的畫法（不會讓人卡在黑畫面）。
// - 斜路要用的函式庫（Clipper）還沒載好的時候，先等它載好再進城。
// 放在所有包 R.enterTownNow、CK.enter 的檔案後面（最外層）。
(function (R) {
  const CK = R.CK, W = R.W; if (!CK || !CK.cities || !CK.cities.donghe || !CK.dongheHarvest) return;
  const ready = () => !!(window.THREE && window.ClipperLib);
  const en0 = R.enterTownNow, ce0 = CK.enter;
  CK._enterPixel = en0;   // 收東西的時候用原本的流程（city_donghe.js）
  let busy = false;
  const enterCK = (from, at, o) => {
    const rb = R.banner; let H = null, ban = null;
    R.banner = (...a) => { if (!ban) ban = a; };
    try {
      busy = true;
      try { H = CK.dongheHarvest(from, at); } finally { busy = false; }
      const P = W.P, pos = P ? [P.x, P.z, P.yaw || 0] : (o && o.at) || null;
      CK._dongheH = H;
      try { ce0('donghe', Object.assign({}, o || {}, pos ? { at: pos } : {})); } finally { CK._dongheH = null; }
      const tw = W.town, P2 = W.P;
      if (tw) { tw.from = from || null; unbury(tw); }
      if (P2) { R.collide(P2, 0.42); P2.yv = CK.heightAt(P2.x, P2.z); P2.h.g.position.set(P2.x, P2.yv, P2.z); R.placeCam(null); }   // 收東西時的位置在精緻版可能壓在東西裡
    } finally { R.banner = rb; }
    if (ban) R.banner(...ban);
  };
  // 收下來的互動點如果落在精緻版的牆、水裡面（走不到），推到那個擋住的東西外面最近的地方
  const unbury = tw => {
    const L = (R.col && R.col.list) || [], solid = b => b && b.tag !== 'npc' && b.tag !== 'deco';
    (tw.inter || []).forEach(it => {
      const b = L.find(q => solid(q) && it.x > q.x0 + 0.3 && it.x < q.x1 - 0.3 && it.z > q.z0 + 0.3 && it.z < q.z1 - 0.3); if (!b) return;
      const d = [[it.x - b.x0, b.x0 - 0.9, it.z], [b.x1 - it.x, b.x1 + 0.9, it.z], [it.z - b.z0, it.x, b.z0 - 0.9], [b.z1 - it.z, it.x, b.z1 + 0.9]].sort((p, q) => p[0] - q[0])[0];
      it.x = d[1]; it.z = d[2];
    });
  };
  const go = (from, at, o) => {
    if (!ready()) { R.three.then(() => CK.clipperReady).then(() => go(from, at, o)); return; }
    try { return enterCK(from, at, o); } catch (e) { console.error('[donghe] 精緻版蓋失敗，改用原本的畫法', e); busy = false; CK._dongheH = null; return en0(from, at); }
  };
  R.enterTownNow = (from, at) => (busy ? en0(from, at) : go(from, at));
  CK.enter = (id, o) => {
    if (id !== 'donghe' || busy || CK._dongheH) return ce0(id, o);
    return go(W.town ? W.town.from : null, o && o.at ? o.at.slice(0, 2) : null, o);
  };
  try { localStorage.removeItem('tfl-donghe'); localStorage.removeItem('tfl-donghe-auto'); } catch (e) { }   // 以前存的「像素版」選擇
})(window.R);
