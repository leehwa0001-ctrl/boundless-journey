// 特質的選擇畫面（2026-10-15 作者：像 Project Zomboid 的天賦選擇）
// - R.traitPicker(el, list, onChange)：左邊可以選的（優點、缺點照點數分組），右邊已經選的、剩幾點；點一下加入或拿掉。
//   不相容的、點數不夠的灰掉並寫原因；拿掉缺點會讓點數變負的時候不准拿。
// - 建角色（creator.js 的「三、特質」那一步）和舊角色第一次進遊戲的詢問都用這個。
// - 舊角色：存檔沒有 traits（R.migrate 標 pending）→ 進城後問一次「要不要選特質」；選「不要」以後不再問。
// 放在 traits.js 後面。
(function (R) {
  const S = () => R.S, esc = s => R.esc(s), $ = id => document.getElementById(id);
  const css = document.createElement('style');
  css.textContent = '.tp{display:grid;grid-template-columns:1.4fr 1fr;gap:12px;align-items:start}.tp-col{display:grid;gap:6px;max-height:58vh;overflow:auto;padding-right:4px}'
    + '.tp h4{margin:8px 0 2px;font-size:13px;opacity:.85}.tp-t{display:grid;grid-template-columns:auto 1fr;gap:2px 8px;text-align:left;background:var(--bg2);border:1px solid var(--line);border-radius:8px;padding:6px 8px;color:inherit;cursor:pointer;font:inherit}'
    + '.tp-t b{font-size:14px}.tp-t i{font-style:normal;font-weight:700;min-width:28px;text-align:right}.tp-t small{grid-column:1/-1;opacity:.85;line-height:1.35}.tp-t.pos i{color:#7FD08A}.tp-t.neg i{color:#F08A7A}'
    + '.tp-t.on{outline:2px solid var(--gold,#C9A13A)}.tp-t:disabled{opacity:.42;cursor:not-allowed}.tp-t em{grid-column:1/-1;font-style:normal;font-size:12px;color:#F0A060}'
    + '.tp-left{font-size:18px;font-weight:700;margin:2px 0 6px}.tp-left.bad{color:#F06A6A}.tp-warn{font-size:12.5px;color:#F0C060;line-height:1.45}'
    + '@media (max-width:720px){.tp{grid-template-columns:1fr}.tp-col{max-height:none}}';
  document.head.appendChild(css);

  let OPT = {};
  const card = (t, list, on) => {
    const clsBad = !on && OPT.cls && R.traitClassOk && !R.traitClassOk(OPT.cls, [t.id]);
    const blocked = on ? [] : R.traitBlockedBy(t.id, list), can = on || (!clsBad && R.traitCanAdd(t.id, list)), c = R.traitCost(t.id, on ? list : list.concat([t.id]));
    const why = clsBad ? '跟你現在登記的職業不合' : blocked.length ? '不能和「' + blocked.map(o => R.TRAITS[o].name).join('」「') + '」一起選' : !can ? '點數不夠' : '';
    return '<button type="button" class="tp-t ' + (t.cost < 0 ? 'pos' : 'neg') + (on ? ' on' : '') + '" data-tp="' + t.id + '"' + (can ? '' : ' disabled') + '><b>' + esc(t.name) + '</b><i>' + (c > 0 ? '+' : '') + c + '</i><small>' + esc(t.desc) + '</small>' + (why ? '<em>' + esc(why) + '</em>' : '') + '</button>';
  };
  const group = (title, arr, list) => arr.length ? '<h4>' + esc(title) + '</h4>' + arr.map(t => card(t, list, false)).join('') : '';
  R.traitPicker = (el, list, onChange, opt) => {
    list = (list || []).slice(); OPT = opt || {};
    const draw = () => {
      const free = R.TRAIT_LIST.filter(t => list.indexOf(t.id) < 0), left = R.traitLeft(list);
      const by = (sign, c) => free.filter(t => (sign < 0 ? t.cost < 0 : t.cost > 0) && Math.abs(t.cost) === c);
      el.innerHTML = '<div class="tp"><div class="tp-col">'
        + [1, 2, 5, 8].map(c => group('優點（用掉 ' + c + ' 點）', by(-1, c), list)).join('')
        + [1, 2, 5, 8].map(c => group('缺點（多 ' + c + ' 點）', by(1, c), list)).join('')
        + '</div><div class="tp-col"><div class="tp-left' + (left < 0 ? ' bad' : '') + '">剩下 ' + left + ' 點（一開始 ' + R.TRAIT_POINTS + ' 點）</div>'
        + '<p class="tp-warn">特質選了就不能再改，請對自己的角色負責。可以不選，點數也可以不用完。</p>'
        + (list.length ? list.map(id => card(R.TRAITS[id], list, true)).join('') : '<p class="note">還沒選。點左邊的特質加進來，再點一次拿掉。</p>')
        + '</div></div>';
      el.querySelectorAll('[data-tp]').forEach(b => {
        b.onclick = () => {
          const id = b.dataset.tp, i = list.indexOf(id);
          if (i >= 0) { const nl = list.filter(x => x !== id); if (R.traitLeft(nl) < 0) { R.toast && R.toast('拿掉「' + R.TRAITS[id].name + '」點數會不夠，先拿掉一些優點。', '#F0A060'); return; } list = nl; }
          else if (R.traitCanAdd(id, list)) list.push(id); else return;
          draw(); onChange && onChange(list.slice());
        };
      });
    };
    draw();
    return () => list.slice();
  };

  // ---------- 舊角色：問一次 ----------
  const mg0 = R.migrate;
  R.migrate = s => { s = mg0 ? mg0(s) : s; try { if (s && !s.traits) s.traits = { list: [], asked: false, v: 1 }; } catch (e) { } return s; };
  const fs0 = R.freshSave;
  R.freshSave = (...a) => { const s = fs0(...a); s.traits = { list: [], asked: true, v: 1 }; return s; };
  R.traitSheet = (onDone) => {
    let get = null;
    R.sheet('<p class="kicker">勇者證・特質</p><h2>選特質</h2><div id="tp-box"></div>', '<div class="row"><button type="button" class="btn" id="tp-no">先不要</button><button type="button" class="btn pri" id="tp-ok">就這樣決定</button></div>');
    const sh = $('r-sheet'); if (sh) sh.classList.add('tp-wide');
    get = R.traitPicker($('tp-box'), [], null, { cls: S() && S().cls });
    $('tp-no').onclick = () => { R.closeSheet(); onDone && onDone(null); };
    $('tp-ok').onclick = () => {
      const list = get();
      if (!list.length) { R.closeSheet(); onDone && onDone([]); return; }
      R.sheet('<p class="kicker">勇者證・特質</p><h2>確定嗎？</h2><p>' + list.map(id => '<b>' + esc(R.TRAITS[id].name) + '</b>').join('、') + '</p><p class="tp-warn">選了就不能再改。</p>', '<div class="row"><button type="button" class="btn" id="tp-back">再想想</button><button type="button" class="btn pri" id="tp-yes">確定</button></div>');
      $('tp-back').onclick = () => R.traitSheet(onDone);
      $('tp-yes').onclick = () => { R.closeSheet(); onDone && onDone(list); };
    };
  };
  const css2 = document.createElement('style'); css2.textContent = '#r-sheet.tp-wide{max-width:min(980px,96vw);width:min(980px,96vw)}'; document.head.appendChild(css2);
  const cs0 = R.closeSheet; if (cs0) R.closeSheet = (...a) => { const sh = $('r-sheet'); if (sh) sh.classList.remove('tp-wide'); return cs0(...a); };
  const ask = () => {
    const s = S(); if (!s || !s.traits || s.traits.asked) return;
    if (R.sheetOpen && R.sheetOpen()) { setTimeout(ask, 1500); return; }
    R.sheet('<p class="kicker">勇者證・新的欄位</p><h2>要選特質嗎？</h2><p>公會的勇者證多了「特質」一欄：優點、缺點，一開始有 ' + R.TRAIT_POINTS + ' 點可以用。</p><p class="tp-warn">特質選了就不能改。選「不要」以後也不會再問。</p>',
      '<div class="row"><button type="button" class="btn" id="tp-q-no">不要</button><button type="button" class="btn pri" id="tp-q-yes">要</button></div>');
    $('tp-q-no').onclick = () => { s.traits.asked = true; R.save && R.save(); R.closeSheet(); };
    $('tp-q-yes').onclick = () => R.traitSheet(list => { if (list === null) { R.toast && R.toast('下次進城再問一次。'); return; } s.traits.asked = true; s.traits.list = list; if (R.traitApplyStart) R.traitApplyStart(s.cls, null, true); R.save && R.save(); if (list.length) R.toast && R.toast('特質：' + list.map(id => R.TRAITS[id].name).join('、'), '#E8C04A'); });
  };
  const en0 = R.enterTownNow;
  if (en0) R.enterTownNow = (...a) => { const r = en0(...a); try { const s = S(); if (s && s.traits && !s.traits.asked && !(R.W && R.W.run)) setTimeout(ask, 6000); } catch (e) { } return r; };
})(window.R);
