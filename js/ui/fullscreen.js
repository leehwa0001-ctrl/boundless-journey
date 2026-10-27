// 手機全螢幕（2026-10-27 作者：手機的網頁那一列〔瀏覽器的網址列〕為什麼不能取消）
// 網頁自己沒辦法把網址列藏起來，只有兩種方法：
// - 全螢幕（Android 的 Chrome、Firefox、三星瀏覽器……）：手機上第一次點畫面就進全螢幕（瀏覽器規定要玩家先點一下才能進）；
//   暫停選單「畫面」有「全螢幕：開／關」，關掉就不會再自己進全螢幕（記在 localStorage）。
// - iPhone 的 Safari 不讓網頁全螢幕：要用「分享」→「加入主畫面」，從主畫面的圖示打開就沒有網址列
//   （manifest.webmanifest、apple-mobile-web-app-capable 在 pages.yml 包的 <head> 裡）。iPhone 第一次進城跳一次說明，選單裡也看得到。
// 已經從主畫面打開（standalone／fullscreen）的就什麼都不做。
(function (R) {
  const de = document.documentElement;
  const can = !!(de.requestFullscreen || de.webkitRequestFullscreen) && (document.fullscreenEnabled !== false || document.webkitFullscreenEnabled);
  const ios = /iP(hone|od|ad)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const phone = () => matchMedia('(pointer:coarse)').matches && Math.min(screen.width, screen.height) < 900;
  const app = () => matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true;
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } };
  const pref = () => get('tfl_fs', '1') === '1';
  const enter = () => {
    if (!can || fsEl()) return;
    try { const p = de.requestFullscreen ? de.requestFullscreen({ navigationUI: 'hide' }) : de.webkitRequestFullscreen(); if (p && p.catch) p.catch(() => { }); } catch (e) { }
  };
  const leave = () => { if (!fsEl()) return; try { const p = document.exitFullscreen ? document.exitFullscreen() : document.webkitExitFullscreen(); if (p && p.catch) p.catch(() => { }); } catch (e) { } };
  R.fsCan = () => phone() && !app() && (can || ios);
  R.fsOn = () => !!fsEl() || app();
  R.fsLabel = () => can ? '全螢幕：' + (pref() ? '開' : '關') : '隱藏網址列（加入主畫面）';
  R.fsToggle = () => {
    if (!can) { tipIos(true); return; }
    const on = !pref(); set('tfl_fs', on ? '1' : '0'); on ? enter() : leave();
  };
  // 第一次點畫面：進全螢幕（只自動一次；之後玩家自己退出就不再硬拉回去）
  let tried = false;
  const first = () => {
    if (tried) return; tried = true;
    removeEventListener('pointerup', first, true); removeEventListener('touchend', first, true);
    if (phone() && !app() && can && pref()) enter();
  };
  addEventListener('pointerup', first, true); addEventListener('touchend', first, true);
  // iPhone：說明怎麼加到主畫面
  const tipIos = force => {
    if (!force && (get('tfl_fs_ios', '') === '1' || !ios || app() || !phone())) return;
    set('tfl_fs_ios', '1');
    const msg = 'iPhone 的 Safari 不能讓網頁自己全螢幕。點下面的「分享」→「加入主畫面」，之後從主畫面的「無境之旅」圖示打開，就沒有網址列了（存檔是同一份）。';
    if (R.sheet) R.sheet('<h2>隱藏網址列</h2><p class="note" style="font-size:15px;line-height:1.7">' + msg + '</p>', '<div class="row"><button type="button" class="btn pri" id="fs-ios-ok">知道了</button></div>');
    const b = document.getElementById('fs-ios-ok'); if (b) b.onclick = () => { if (R.closeSheet) R.closeSheet(); else { const m = document.getElementById('r-modal'); if (m) m.hidden = true; } };
  };
  // 第一次進城跳一次
  const iv = setInterval(() => { const W = R.W; if (W && W.town && W.town.ck) { clearInterval(iv); setTimeout(() => { try { const m = document.getElementById('r-modal'); if (!m || m.hidden) tipIos(false); } catch (e) { } }, 2500); } }, 1000);
  setTimeout(() => clearInterval(iv), 120000);
})(window.R = window.R || {});
