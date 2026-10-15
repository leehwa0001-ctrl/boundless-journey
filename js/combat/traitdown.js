// 特質「不死不休」的第一次（2026-10-15 作者）：每趟遺跡一次，生命歸零時不馬上倒下——倒數 2 秒，以 35% 生命、無敵 2 秒、清掉異常狀態站起來，
// 畫面中間「死戰到底，以證勇心」1.2 秒。同一趟用過以後再倒下＝永久死亡（traitdeath.js）。
// 倒下時的優先順序（作者）：隊友救援（net2.js）＞不死不休第二次刪檔（traitdeath.js）＞復活（adv2more.js）＞不死身（talentcap.js）＞不死不休第一次（這裡）。
// 所以這個檔案要放在 adv2more.js 前面、deathcause.js 後面：別的救法都沒救到，才輪到這裡；這裡救起來的不算倒下（任務不算失敗、不算死亡次數）。
// 遺跡崩塌（9999）、暫停選單的「放棄」不拉你起來。
(function (R) {
  const W = () => R.W, has = id => !!(R.hasTrait && R.hasTrait(id));
  let forced = false;
  const hp0 = R.hurtPlayer;
  R.hurtPlayer = (raw, src, o) => { const f = forced; forced = !src && raw >= 9999; try { return hp0(raw, src, o); } finally { forced = f; } };
  const caption = () => {
    const el = document.createElement('div');
    el.textContent = '死戰到底，以證勇心';
    el.style.cssText = 'position:fixed;left:50%;top:38%;transform:translate(-50%,-50%);z-index:9600;font:900 clamp(26px,5vw,52px)/1.2 serif;letter-spacing:.18em;color:#FFE8B0;text-shadow:0 0 18px #C83A2A,0 0 4px #000;pointer-events:none;transition:opacity .35s;white-space:nowrap';
    document.body.appendChild(el); setTimeout(() => { el.style.opacity = '0'; }, 1200); setTimeout(() => el.remove(), 1600);
  };
  const pd0 = R.onPlayerDown;
  R.onPlayerDown = (...a) => {
    const w = W(), run = w.run, P = w.P;
    if (run && P && !run.done && has('busi') && !run.busiUsed && !forced && !run.gaveUp && !(R.inTraining && R.inTraining())) {
      run.busiUsed = true; P.dead = true; P.hp = 0; P.dashT = 0; if (P.h) P.h.roll = 0; R.setDown && R.setDown(P.h, true);
      R.banner && R.banner('倒下了……', '（還沒結束）'); R.sfx && R.sfx('hurt');
      setTimeout(() => {
        if (W().run !== run || run.done || W().P !== P) return;
        P.dead = false; P.hp = Math.max(1, Math.round(P.hpMax * 0.35)); P.iframe = 2;
        P.slowT = 0; P.blindT = 0; P.knockT = 0; P.stumble = 0; if (P.dbf) Object.keys(P.dbf).forEach(k => { P.dbf[k] = 0; }); if (typeof P.frail === 'number') P.frail = 0;
        R.setDown && R.setDown(P.h, false); caption(); R.sfx && R.sfx('magic'); R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 3, color: '#FFB060' });
      }, 2000);
      return;
    }
    return pd0(...a);
  };
})(window.R);
