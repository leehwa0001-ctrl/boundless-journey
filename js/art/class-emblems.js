// 靜態職業紋章；圖集依照 ids 排成四欄，名稱保留在圖示外。
(function (R) {
  const ids = ['gunner', 'archer', 'warrior', 'mage', 'priest', 'blade', 'knight', 'monk', 'summoner', 'bard', 'arraymage', 'enchanter', 'scroll'];
  R.classEmblemHTML = function (id) {
    const i = ids.indexOf(id);
    if (i < 0) return '';
    const name = String(R.CLASSES[id].name).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    return '<span class="class-emblem" role="img" aria-label="' + name + '職業徽章" style="background-position:' + (([170, 475, 785, 1085][i % 4] - 156.75) / 940.5 * 100) + '% ' + (([165, 455, 750, 1045][Math.floor(i / 4)] - 156.75) / 940.5 * 100) + '%"></span>';
  };
  const css = document.createElement('style');
  css.textContent = '.class-emblem{display:inline-block;box-sizing:border-box;width:64px;height:64px;flex:0 0 64px;vertical-align:middle;margin:0 9px 3px 0;background:transparent url("assets/art/class-heraldry-v7-ui.webp") no-repeat;background-size:400% 400%;border-radius:4px}.cls-row>.class-emblem{float:left}.reg-group h4>.class-emblem{width:56px;height:56px}';
  document.head.appendChild(css);
  const partyCss = document.createElement('style');
  partyCss.textContent = '.net-roster li{display:flex;align-items:center;gap:8px}.net-roster .class-emblem{width:40px;height:40px;flex:0 0 40px;margin:0}.net-roster li>span:last-child{min-width:0;overflow-wrap:anywhere}#r-party .pm{position:relative;box-sizing:border-box;max-width:100%;overflow:hidden}#r-party .pm-t{min-width:0;overflow:hidden}#r-party .pm .meter{position:relative;overflow:hidden;min-width:0}#r-party .pm>canvas{align-self:start}#r-party .pm-t span,#r-party .pm-t small{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#r-party .np-class{position:absolute;left:25px;top:19px;pointer-events:none;border-radius:4px;background:rgba(10,14,18,.75)}#r-party .np-class .class-emblem{display:block;width:16px;height:16px;margin:0}body.touch #r-party .np-class{left:19px;top:14px}body.touch #r-party .np-class .class-emblem{width:14px;height:14px}#r-party .pm.np-noface .np-class{left:3px;top:3px;width:36px;height:30px;display:flex;align-items:center;justify-content:center;background:linear-gradient(#2E3A44,#14181E)}#r-party .pm.np-noface .np-class .class-emblem{width:26px;height:26px}body.touch #r-party .pm.np-noface .np-class{width:28px;height:23px}body.touch #r-party .pm.np-noface .np-class .class-emblem{width:20px;height:20px}';
  document.head.appendChild(partyCss);
})(window.R);
