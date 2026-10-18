// 城裡的快捷鍵欄、城裡打開背包（2026-10-18 作者：城市的介面也要有遺跡裡的快捷鍵欄位，設定裡可以開關；城裡也能打開背包）
// - 快捷鍵欄：跟遺跡裡同一排、同樣的按鈕（回復藥 1、魔力藥 2、背包 I、技能 3～6、R），右下角。城裡只有「背包」能按；
//   藥水、技能顯示現在帶著幾瓶、裝了哪些技能（按了會提示要到遺跡裡用）。設定→畫面「城裡的快捷鍵欄：開／關」（預設開，存在 tfl-townbar）。
// - 城裡的背包：一樣是遺跡裡那個背包（baglayout.js 的版面），用目前選的背包大小給一個空的格子；
//   裝備、角色素質、任務道具照常看，城裡不能在這裡穿脫、丟東西（按鈕拿掉，改成「打開倉庫」）。
// - 放在 baglayout.js 後面（包住最外層的 R.bagSheet）。run.js：城裡按 I、按背包鍵改成打開這個背包。
(function (R) {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const LS = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { } return null; };
  R.townBarOn = () => LS('tfl-townbar') !== '0';
  R.setTownBar = on => { LS('tfl-townbar', on ? '1' : '0'); tick(true); };

  // ---------- 城裡的背包 ----------
  const bs0 = R.bagSheet;
  let fake = null;
  if (bs0) R.bagSheet = (...a) => {
    const W = R.W; if (!W || W.run || !W.town) return bs0(...a);
    const S = R.S, pk = (S && S.pack) || 'sack';
    if (!fake || fake.packId !== pk) fake = { bag: [], mats: {}, packId: pk, grid: null, townBag: 1 };
    W.run = fake;
    let r; try { r = bs0(...a); } finally { W.run = null; }
    try { townize(); } catch (e) { console.warn('[townbar]', e); }
    return r;
  };
  const townize = () => {
    const sh = $('r-sheet'); if (!sh) return;
    sh.classList.add('tb-townbag');
    sh.querySelectorAll('[data-act],[data-dm],[data-mdrop],[data-loose],[data-gc]').forEach(b => b.remove());
    sh.querySelectorAll('.bl-note').forEach(p => p.remove());
    const S = R.S, po = S.potions || {}, side = sh.querySelector('.tk-side');
    const h2 = sh.querySelector('.tk-head h2'); if (h2 && !/城裡/.test(h2.textContent)) h2.textContent += '（城裡）';
    const own = '帶在身上：回復藥 ×' + (po.hp || 0) + '、魔力藥 ×' + (po.mp || 0);
    const p = document.createElement('div'); p.className = 'tb-note';
    p.innerHTML = '<p class="note">' + esc(own) + '。背包的格子要到遺跡裡才會裝東西；回到地面時，背包裡撿到的東西會放進倉庫。在城裡換裝備請到倉庫。</p><div class="row"><button type="button" class="btn" id="tb-stash">打開倉庫</button></div>';
    if (side) side.after(p); else (sh.querySelector('.bl-bag') || sh).appendChild(p);
    const b = $('tb-stash'); if (b) b.onclick = () => { R.closeSheet(); R.openHub && R.openHub('stash'); };
  };

  // ---------- 快捷鍵欄 ----------
  const bar = document.createElement('div'); bar.id = 'tb-bar'; bar.className = 'hud'; bar.hidden = true;
  const KEY = R.touch ? {} : { hp: '1', mp: '2', bag: 'I', s1: '3', s2: '4', s3: '5', s4: '6', s0: 'R／右鍵' };
  const btn = (k, cls, n) => '<button type="button" class="act ' + cls + '" data-tb="' + k + '"><span class="tb-n">' + n + '</span>' + (KEY[k] ? '<kbd>' + KEY[k] + '</kbd>' : '') + '</button>';
  bar.innerHTML = btn('hp', 'tb-pot', '回復藥') + btn('mp', 'tb-pot', '魔力藥') + btn('bag', 'tb-bag', '背包') + btn('s1', 'sk', '技能') + btn('s2', 'sk', '技能') + btn('s3', 'sk', '技能') + btn('s4', 'sk', '技能') + btn('s0', 'big', '技能');
  bar.addEventListener('click', e => {
    const b = e.target.closest('[data-tb]'); if (!b) return; const k = b.dataset.tb;
    if (k === 'bag') R.bagSheet();
    else if (k === 'hp' || k === 'mp') R.toast && R.toast('藥水留到遺跡裡再喝（城裡到赤提燈吃東西也能回復）。');
    else R.toast && R.toast('技能要到遺跡裡才能用。');
  });
  const mount = () => { const run = $('run'); if (run && bar.parentNode !== run) run.appendChild(bar); };
  let skKey = '';
  const skills = () => {
    const S = R.S, cls = S && S.cls, st = cls && S.classes && S.classes[cls]; if (!st || !R.calcPlayer || !R.slotSkill) return;
    const k = cls + JSON.stringify(st); if (k === skKey) return; skKey = k;
    let P; try { P = R.calcPlayer(cls); } catch (e) { return; }
    [0, 1, 2, 3, 4].forEach(i => {
      const el = bar.querySelector('[data-tb="s' + i + '"]'); if (!el) return;
      const id = i === 0 ? P.skill : R.slotSkill(P, i), sk = id && R.SKILLS[id];
      el.querySelector('.tb-n').textContent = sk ? sk.name : '—'; el.classList.toggle('locked', !sk);
      el.title = sk ? sk.name + '：' + sk.desc + '（遺跡裡才能用）' : '還沒有技能';
    });
  };
  const tick = force => {
    mount();
    const run = $('run'), show = !!(run && !run.hidden && run.classList.contains('town') && R.townBarOn() && R.S);
    if (bar.hidden === !show && !force && !show) return;
    bar.hidden = !show; if (!show) return;
    const po = R.S.potions || {};
    bar.querySelector('[data-tb="hp"] .tb-n').textContent = '回復藥 ×' + (po.hp || 0);
    bar.querySelector('[data-tb="mp"] .tb-n').textContent = '魔力藥 ×' + (po.mp || 0);
    skills();
  };
  setInterval(() => { try { tick(); } catch (e) { } }, 500);
  const css = document.createElement('style');
  css.textContent = '#tb-bar{position:absolute;right:12px;bottom:max(12px,env(safe-area-inset-bottom));display:flex;gap:8px;align-items:flex-end;z-index:5}'
    + '#tb-bar[hidden]{display:none!important}'
    + '#tb-bar .act.sk,#tb-bar .act.tb-pot,#tb-bar .act.big{opacity:.62}'
    + '#tb-bar .act.locked{opacity:.35}'
    + '#tb-bar .act .tb-n{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 2px}'
    + '#tb-bar .act.big{width:80px;height:80px}'
    + 'body.touch #tb-bar{right:auto;left:50%;transform:translateX(-50%);bottom:calc(max(8px,env(safe-area-inset-bottom)) + 4px);gap:5px}'
    + 'body.touch #tb-bar .act{width:46px;height:46px;font-size:10px}body.touch #tb-bar .act.big{width:54px;height:54px}'
    + '#r-sheet.tb-townbag .tb-note{border-top:1px solid var(--line,#5A4A30);padding-top:6px}';
  document.head.appendChild(css);
})(window.R = window.R || {});
