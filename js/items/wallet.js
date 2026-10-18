// 錢包和銀行（2026-10-18 作者：倉庫大改第三階段）
// - 錢放三個地方：倉庫（R.S.vault.gold，不會被偷、不能直接花）、背包（錢包 R.S.wallet：會被偷、可以花）、銀行（存在勇者證裡 R.S.bank.bal：不會被偷、可以花）。
// - R.S.gold 改成「能花的錢」＝錢包＋銀行：
//   讀：錢包＋銀行（商店看夠不夠錢都照舊寫 R.S.gold >= 價錢）；
//   扣：先扣錢包，不夠再扣銀行（作者 2026-10-18：先用背包的錢，不夠再用銀行的）；
//   加：放進錢包（背包）；背包放不下的（一格 1000 費拉）自動存進勇者證，跳一個提示。
// - 被扒、被搶、罰金只動錢包（R.S.wallet；streetevents.js、punish.js、props.js、traitlife.js、herokill.js 改成看錢包）。
// - 存檔裡存的是 wallet（gold 是算出來的，不存）；舊存檔讀進來時把 gold 搬到 wallet。
// 放在 saves.js 後面、carry.js 前面（carry.js 搬舊存檔的時候要先有 wallet）。
(function (R) {
  const bankOf = s => { s.bank = s.bank || { bal: 0, last: s.day || 0, earned: 0 }; return s.bank; };
  const ensure = s => {
    if (!s || typeof s !== 'object' || s.__wallet) return s;
    const d = Object.getOwnPropertyDescriptor(s, 'gold');
    if (!('wallet' in s)) s.wallet = d && 'value' in d ? Math.max(0, Math.floor(+d.value || 0)) : 0;
    delete s.gold;
    Object.defineProperty(s, '__wallet', { value: 1, enumerable: false });
    Object.defineProperty(s, 'gold', {
      enumerable: false, configurable: true,
      get() { return (this.wallet || 0) + Math.floor((this.bank && this.bank.bal) || 0); },
      set(v) {
        v = +v; if (!isFinite(v)) return;
        const d = v - ((this.wallet || 0) + Math.floor((this.bank && this.bank.bal) || 0)); if (!d) return;
        if (d < 0) { const take = -d, fw = Math.min(this.wallet || 0, take); this.wallet = (this.wallet || 0) - fw; if (take > fw) { const b = bankOf(this); b.bal = Math.max(0, b.bal - (take - fw)); } return; }
        // 加錢：背包放得下的放錢包，放不下的存進勇者證
        const room = R.bagMaxAdd && this === R.S ? R.bagMaxAdd('gold') : Infinity, put = Math.min(d, room);
        this.wallet = (this.wallet || 0) + put;
        if (d > put) { bankOf(this).bal += d - put; overflow(d - put); }
      }
    });
    return s;
  };
  let ovT = 0, ovN = 0;
  const overflow = n => { ovN += n; clearTimeout(ovT); ovT = setTimeout(() => { if (R.toast) R.toast('背包放不下的 ' + Math.round(ovN).toLocaleString('zh-TW') + ' 費拉存進勇者證了。', '#E8C04A'); ovN = 0; }, 60); };
  R.walletEnsure = ensure;
  R.wallet = () => (R.S ? Math.floor(R.S.wallet || 0) : 0);
  const wrap = name => { const f = R[name]; if (f) R[name] = (...a) => ensure(f(...a)); };
  wrap('loadSlot'); wrap('freshSave');
  const sv0 = R.save; if (sv0) R.save = (...a) => { ensure(R.S); return sv0(...a); };
  ensure(R.S);
  // 標題畫面的存檔摘要：錢包＋銀行
  const si0 = R.slotInfo; if (si0) R.slotInfo = i => { const r = si0(i); if (r && r.gold == null) { try { const s = JSON.parse(localStorage.getItem('ruins1433-slot' + i) || 'null'); if (s) r.gold = (s.wallet || 0) + Math.floor((s.bank && s.bank.bal) || 0); } catch (e) { } } return r; };
})(window.R = window.R || {});
