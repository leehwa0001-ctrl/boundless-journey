// 測試者模式（2026-10-21 作者：更新先放測試版，作者測好說「合併」才上正式版）
// - 正式版：https://leehwa0001-ctrl.github.io/taofaling-1433/      測試版：同一個網址後面加 test/（test 分支，.github/workflows/pages.yml 一起發布）
// - 在主畫面（標題畫面）用方向鍵輸入 ↑↑↓↓←←→→：正式版 → 切到測試版；測試版 → 回正式版。開著的時候打開正式版會自動跳到測試版。
// - 測試版的存檔跟正式版分開（localStorage 的名字前面加 tfl-test:）；每次從正式版切進來，先把正式版的存檔複製一份過去，在測試版怎麼玩都不會動到正式的存檔。
// - 這個檔案要放在 index.html 第一個 <script>：其他程式讀存檔之前就要換好。
// - 不寫進更新公告（玩家不需要知道）。
(function () {
  const FLAG = 'tfl-tester', NS = 'tfl-test:', CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowLeft', 'ArrowRight', 'ArrowRight'];
  const path = location.pathname, isTest = /\/test\/(index\.html)?$/.test(path);
  const testUrl = () => path.replace(/(index\.html)?$/, 'test/'), mainUrl = () => path.replace(/test\/(index\.html)?$/, '');
  const SP = Storage.prototype, get0 = SP.getItem, set0 = SP.setItem, rm0 = SP.removeItem, key0 = SP.key;
  let ls = null; try { ls = window.localStorage; } catch (e) { }
  const raw = { get: k => { try { return ls ? get0.call(ls, k) : null; } catch (e) { return null; } }, set: (k, v) => { try { ls && set0.call(ls, k, v); return true; } catch (e) { return false; } }, rm: k => { try { ls && rm0.call(ls, k); } catch (e) { } } };
  // 把正式版的存檔複製一份給測試版（先清掉測試版舊的）
  const copySaves = () => {
    if (!ls) return true;
    const keys = []; for (let i = 0; i < ls.length; i++) keys.push(key0.call(ls, i));
    keys.filter(k => k && k.startsWith(NS)).forEach(raw.rm);
    let ok = true; keys.filter(k => k && !k.startsWith(NS) && k !== FLAG).forEach(k => { if (!raw.set(NS + k, raw.get(k))) ok = false; });
    raw.set(NS + '__copied', String(Date.now()));
    return ok;
  };
  const say = (t, ms) => {
    const show = () => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:50%;top:40%;transform:translate(-50%,-50%);z-index:100000;background:rgba(20,14,10,.92);color:#F4E9CD;border:2px solid #C9A13A;padding:14px 26px;font:700 18px/1.6 "Noto Serif TC",serif;letter-spacing:.1em;text-align:center;pointer-events:none'; d.innerHTML = t; document.body.appendChild(d); setTimeout(() => d.remove(), ms || 1500); };
    document.body ? show() : addEventListener('DOMContentLoaded', show);
  };
  if (/[?&]tester=off\b/.test(location.search)) raw.rm(FLAG);   // 萬一卡住：網址後面加 ?tester=off 就關掉
  if (!isTest && raw.get(FLAG) === '1') {   // 測試者模式開著：正式版跳測試版（先確認測試版真的在，不在就留在正式版）
    fetch(testUrl(), { method: 'HEAD', cache: 'no-store' }).then(r => { if (r.ok) location.replace(testUrl()); else raw.rm(FLAG); }).catch(() => { });
  }
  if (isTest) {
    raw.set(FLAG, '1');
    if (raw.get(NS + '__copied') == null && !copySaves()) say('測試版：正式版的存檔太大，沒有完整複製過來', 3000);
    // 測試版的存檔換一個名字存
    SP.getItem = function (k) { return this === ls ? get0.call(this, NS + k) : get0.call(this, k); };
    SP.setItem = function (k, v) { return this === ls ? set0.call(this, NS + k, v) : set0.call(this, k, v); };
    SP.removeItem = function (k) { return this === ls ? rm0.call(this, NS + k) : rm0.call(this, k); };
    const badge = () => { const b = document.createElement('div'); b.id = 'tester-badge'; b.textContent = '測試版'; b.title = '測試者模式：這是還沒正式上線的版本，存檔跟正式版分開。主畫面輸入 ↑↑↓↓←←→→ 回正式版。'; b.style.cssText = 'position:fixed;top:6px;left:50%;transform:translateX(-50%);z-index:99999;background:#B8322A;color:#fff;font:700 12px/1 system-ui,sans-serif;letter-spacing:.2em;padding:5px 10px 5px 12px;border-radius:3px;opacity:.85;pointer-events:none'; document.body.appendChild(b); };
    document.body ? badge() : addEventListener('DOMContentLoaded', badge);
  }
  // 主畫面輸入 ↑↑↓↓←←→→ 切換
  const onTitle = () => { const T = document.getElementById('title'); return T && !T.hidden && !document.querySelector('.news-ov') && !(window.R && R.sheetOpen && R.sheetOpen()); };
  let seq = [];
  addEventListener('keydown', e => {
    if (!e.key.startsWith('Arrow')) { seq = []; return; }
    if (!onTitle()) { seq = []; return; }
    seq.push(e.key); if (seq.length > CODE.length) seq.shift();
    if (seq.length < CODE.length || seq.some((k, i) => k !== CODE[i])) return;
    seq = [];
    if (isTest) { raw.rm(FLAG); say('測試者模式：關閉<br><small>回到正式版</small>', 900); setTimeout(() => location.assign(mainUrl()), 700); }
    else fetch(testUrl(), { method: 'HEAD', cache: 'no-store' }).then(r => {
      if (!r.ok) { say('測試者模式：測試版還沒發布', 1500); return; }
      raw.set(FLAG, '1'); const ok = copySaves(); say('測試者模式：開啟<br><small>切到測試版' + (ok ? '（存檔複製了一份過去）' : '（存檔太大，沒有完整複製）') + '</small>', 1200); setTimeout(() => location.assign(testUrl()), 900);
    }).catch(() => say('測試者模式：連不到測試版', 1500));
  }, true);
})();
