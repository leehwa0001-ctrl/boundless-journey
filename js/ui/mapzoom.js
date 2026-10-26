// 2026-10-14 作者：「Tab 出來的地圖為什麼不能放大？」──遺跡的大地圖（hud.js）、城市地圖（citykit2.js、hosu.js）原本就只畫一張固定大小的圖，沒有縮放功能。
// （遺跡的 Tab 地圖其實是 ruinmap.js，本來就能拖曳、滾輪縮放，只是沒有按鈕、看不出來；那邊補了 ＋／−、雙擊回自己、記住縮放。）
// 這裡幫城市的大地圖加上：滾輪縮放（以游標為中心）、拖曳平移、雙擊回到原大小、右上角 ＋／−／◎（回到自己身上）；手機兩指縮放、一指拖曳。
// 做法：把畫好的 canvas 包進一個會裁切的框，用 CSS transform 放大、平移（遺跡圖是像素格子，放大用 pixelated 保持清楚）。
// 縮放程度記在這一趟（W.run）或這座城（W.town）上，重新打開 Tab 會照上次的樣子。東鶴近郊的地圖（gtamap.js）本來就能縮放，不動。
// 放在 hud.js、citykit2.js、hosu.js 後面。
(function (R) {
  // big-map：遺跡地圖的舊版（ruinmap.js 自己會縮放，這個只剩沒有 ruinmap 時才用到）
  const MAPS = { 'big-map': 'run', 'ck-big': 'ck', 'hs-big': 'hs' }, ZMIN = 1, ZMAX = 8;
  const store = new WeakMap();
  const owner = () => { const W = R.W; return (W && (W.run || W.town)) || R; };
  const viewOf = key => { const o = owner(); let m = store.get(o); if (!m) { m = {}; store.set(o, m); } return m[key] || (m[key] = { z: 1, tx: 0, ty: 0 }); };
  const attach = cv => {
    if (cv.dataset.mz) return; const key = MAPS[cv.id]; if (!key) return; cv.dataset.mz = 1;
    const wrap = document.createElement('div'); wrap.className = 'mz-wrap'; cv.parentNode.insertBefore(wrap, cv); wrap.appendChild(cv);
    const ui = document.createElement('div'); ui.className = 'mz-ui';
    ui.innerHTML = '<button type="button" data-z="in" title="放大">＋</button><button type="button" data-z="out" title="縮小">−</button><button type="button" data-z="me" title="回到自己身上">◎</button><button type="button" data-z="reset" title="整張地圖">⤢</button>';
    wrap.appendChild(ui);
    const v = viewOf(key), size = () => [wrap.clientWidth || 1, wrap.clientHeight || 1];
    const clamp = () => { const [w, h] = size(); v.z = Math.max(ZMIN, Math.min(ZMAX, v.z)); v.tx = Math.min(0, Math.max(w - w * v.z, v.tx)); v.ty = Math.min(0, Math.max(h - h * v.z, v.ty)); };
    const apply = () => { clamp(); cv.style.transformOrigin = '0 0'; cv.style.transform = 'translate(' + v.tx + 'px,' + v.ty + 'px) scale(' + v.z + ')'; wrap.classList.toggle('mz-on', v.z > 1.001); };
    const zoomAt = (u, w0, f) => { const z1 = Math.max(ZMIN, Math.min(ZMAX, v.z * f)), k = z1 / v.z; v.tx = u - (u - v.tx) * k; v.ty = w0 - (w0 - v.ty) * k; v.z = z1; apply(); };
    const center = () => { const [w, h] = size(); return [w / 2, h / 2]; };
    const me = () => { const px = +cv.dataset.px, py = +cv.dataset.py; if (!(px >= 0 && py >= 0)) return; const [w, h] = size(); v.z = Math.max(v.z, 2.5); v.tx = w / 2 - px * w * v.z; v.ty = h / 2 - py * h * v.z; apply(); };
    ui.addEventListener('pointerdown', e => e.stopPropagation());
    ui.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; e.stopPropagation(); const c = center(); ({ in: () => zoomAt(c[0], c[1], 1.5), out: () => zoomAt(c[0], c[1], 1 / 1.5), me, reset: () => { v.z = 1; v.tx = v.ty = 0; apply(); } })[b.dataset.z](); });
    const loc = e => { const r = wrap.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    wrap.addEventListener('wheel', e => { e.preventDefault(); const [u, w0] = loc(e); zoomAt(u, w0, e.deltaY > 0 ? 1 / 1.2 : 1.2); }, { passive: false });
    wrap.addEventListener('dblclick', e => { if (e.target.closest('.mz-ui')) return; e.preventDefault(); v.z = 1; v.tx = v.ty = 0; apply(); });
    const pts = new Map(); let moved = 0, last = null;
    wrap.addEventListener('pointerdown', e => { if (e.target.closest('.mz-ui')) return; try { wrap.setPointerCapture(e.pointerId); } catch (er) { } pts.set(e.pointerId, loc(e)); if (pts.size === 1) moved = 0; last = null; });
    wrap.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return; const p0 = pts.get(e.pointerId), p1 = loc(e);
      if (pts.size === 1) { const dx = p1[0] - p0[0], dy = p1[1] - p0[1]; moved += Math.abs(dx) + Math.abs(dy); v.tx += dx; v.ty += dy; pts.set(e.pointerId, p1); apply(); return; }
      pts.set(e.pointerId, p1); const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; moved += 10;
      if (last) { v.tx += mx - last.mx; v.ty += my - last.my; if (last.d > 0) zoomAt(mx, my, d / last.d); else apply(); } last = { d, mx, my };
    });
    const up = e => { pts.delete(e.pointerId); last = null; };
    wrap.addEventListener('pointerup', up); wrap.addEventListener('pointercancel', up);
    wrap.addEventListener('click', e => { if (moved > 6) { e.stopPropagation(); e.preventDefault(); moved = 0; } }, true);   // 拖過就不算點地圖（城市地圖點一下會設目的地）
    requestAnimationFrame(apply); apply();
  };
  const scan = () => Object.keys(MAPS).forEach(id => { const cv = document.getElementById(id); if (cv) attach(cv); });
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  const css = document.createElement('style');
  css.textContent = '.mz-wrap{position:relative;overflow:hidden;touch-action:none;border-radius:8px;background:#0A080E;cursor:grab;margin:6px auto;width:fit-content;max-width:100%}.mz-wrap:active{cursor:grabbing}.mz-wrap>canvas{margin:0!important;display:block}'
    + '.mz-wrap.mz-on>canvas{image-rendering:pixelated}'
    + '.mz-ui{position:absolute;top:6px;right:6px;display:flex;flex-direction:column;gap:4px;z-index:2}.mz-ui button{width:34px;height:34px;border-radius:6px;border:1px solid #5A5070;background:rgba(30,26,38,.88);color:#E8E0D0;font-size:18px;line-height:1;cursor:pointer;padding:0}.mz-ui button:hover{border-color:#C9A13A;color:#FFE08A}'
    + '@media (pointer:coarse){.mz-ui button{width:42px;height:42px;font-size:20px}}';
  document.head.appendChild(css);
  R.mapZoom = { viewOf, attach };
})(window.R);
