// 2026-10-13 術士：按住 X（手機長按職業條）看元素反應表；放開就關。點一下 X 照舊馬上換普攻元素。
// 敵人頭上的小方塊＝普攻留下的元素（5 秒），技能打到別種元素就引爆、方塊消失。
(function (R) {
  'use strict';
  const W = () => R.W || {}, $ = id => document.getElementById(id);
  const EL = { fire: ['火', '#FF6A2A'], frost: ['冰', '#9AD8FF'], shock: ['雷', '#FFE070'] }, ELK = ['fire', 'frost', 'shock'];
  const isM = P => !!(P && P.cls === 'mage' && !P.dead);
  const live = () => { const w = W(); return !!(w.run && !w.run.done && w.P); };
  const CT = () => (R.coreKit && R.coreKit.CT ? R.coreKit.CT() : 0);
  const css = document.createElement('style');
  css.textContent = '#er-panel{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:70;min-width:280px;max-width:min(420px,calc(100vw - 20px));background:linear-gradient(180deg,#1E1A26,#15121B);color:#E8E0D0;border:1px solid rgba(184,138,255,.45);border-top:3px solid #7A5AB8;border-radius:8px;padding:10px 14px;font-size:14px;line-height:1.6;box-shadow:0 10px 30px rgba(0,0,0,.6);pointer-events:none}'
    + '#er-panel h4{margin:0 0 4px;font-size:16px;color:#F0E6FF}#er-panel .s{color:#A89CB8;font-size:12px;margin-bottom:6px}#er-panel .r{display:flex;gap:8px;align-items:baseline;padding:4px 0;border-top:1px solid #2E2838}#er-panel .r b{min-width:96px}#er-panel em{font-style:normal;font-weight:700}'
    + '.er-mk{position:fixed;z-index:5;width:20px;height:20px;margin:-10px 0 0 -10px;box-sizing:border-box;border:1px solid var(--c);border-radius:3px;background:rgba(18,14,22,.88);color:var(--c);font:700 12px/18px system-ui,sans-serif;text-align:center;pointer-events:none;box-shadow:0 0 4px var(--c)}'
    + '.er-mk i{position:absolute;left:0;right:0;top:19px;font:700 9px/1 system-ui,sans-serif;font-style:normal;color:#fff;text-shadow:0 0 2px #000,0 0 2px #000}';
  document.head.appendChild(css);
  const c = k => '<em style="color:' + EL[k][1] + '">' + EL[k][0] + '</em>';
  const html = P => '<h4>元素反應</h4><div class="s">普攻：在敵人身上留下 ' + c(P._el || 'fire') + '（5 秒）。技能打到身上有別種元素的敵人就引爆。</div>'
    + '<div class="r"><b>' + c('fire') + '＋' + c('frost') + ' 蒸發</b><span>這一隻多吃 160% 傷害</span></div>'
    + '<div class="r"><b>' + c('frost') + '＋' + c('shock') + ' 碎冰</b><span>暈 1.5 秒，周圍 2.5 公尺吃 100% 傷害</span></div>'
    + '<div class="r"><b>' + c('shock') + '＋' + c('fire') + ' 過載</b><span>周圍 3.5 公尺爆炸 180% 傷害，彈開</span></div>'
    + '<div class="s" style="margin:6px 0 0">點一下 X：換普攻元素。放開就關掉這張表。</div>';
  let holdT = null, prev = null, tapOn = false;
  const show = () => { const P = W().P; if (!isM(P)) return; if (prev && P._el !== prev) P._el = prev;   // 按住不算換元素
    let el = $('er-panel'); if (!el) { el = document.createElement('div'); el.id = 'er-panel'; document.body.appendChild(el); } el.innerHTML = html(P); el.hidden = false; };
  const hide = () => { clearTimeout(holdT); holdT = null; const el = $('er-panel'); if (el) el.hidden = true; };
  const start = () => { const P = W().P; if (!isM(P) || !live()) return; prev = P._el || 'fire'; clearTimeout(holdT); holdT = setTimeout(() => { holdT = null; show(); }, 350); };
  const typing = e => { const t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable); };
  window.addEventListener('keydown', e => { if (typing(e) || e.repeat) return; if ((e.key || '').toLowerCase() === 'x') start(); }, true);
  window.addEventListener('keyup', e => { if ((e.key || '').toLowerCase() === 'x') hide(); }, true);
  window.addEventListener('blur', hide);
  document.addEventListener('pointerdown', e => { if (!(e.target && e.target.closest && e.target.closest('#core-g'))) return; const P = W().P; if (!isM(P) || !live()) return; tapOn = true; start(); }, true);
  const up = () => { if (!tapOn) return; tapOn = false; hide(); };
  document.addEventListener('pointerup', up, true); document.addEventListener('pointercancel', up, true);
  // 敵人頭上的元素小方塊
  const marks = new Map(); let v3 = null;
  const frame = () => {
    requestAnimationFrame(frame);
    const w = W(), P = w.P, on = live() && P && P.cls === 'mage' && w.camera && window.THREE, seen = new Set(), t = CT();
    if (on) {
      v3 = v3 || new THREE.Vector3();
      (w.enemies || []).forEach(e => {
        if (e.dead || !e._el) return; const k = ELK.find(x => (e._el[x] || 0) > t); if (!k) return;
        v3.set(e.x, (e.m && e.m.g ? e.m.g.position.y : 0) + 1.6 + (e.def && e.def.size || 1) * 0.9, e.z).project(w.camera); if (v3.z > 1) return;
        seen.add(e); let d = marks.get(e); if (!d) { d = document.createElement('div'); d.className = 'er-mk'; d.innerHTML = '<span></span><i></i>'; ($('run') || document.body).appendChild(d); marks.set(e, d); }
        d.style.setProperty('--c', EL[k][1]); d.firstChild.textContent = EL[k][0]; d.lastChild.textContent = (e._el[k] - t).toFixed(1);
        d.style.left = ((v3.x + 1) / 2 * innerWidth).toFixed(0) + 'px'; d.style.top = ((1 - v3.y) / 2 * innerHeight).toFixed(0) + 'px';
      });
    }
    marks.forEach((d, e) => { if (!seen.has(e)) { d.remove(); marks.delete(e); } });
    if (!on) hide();
  };
  requestAnimationFrame(frame);
  R.elemReact = { show, hide };
})(window.R);
