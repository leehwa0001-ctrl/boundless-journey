// 每座遺跡屬於哪座城（2026-10-21 作者：在新版地圖上用紅色虛線把遺跡連到城市）
// - 城市畫面的「附近遺跡」照這張表列，不再照距離算（遺跡搬到外海、離城比較遠也照樣列在那座城）。
// - 表裡沒有的遺跡（例如東鶴近郊的）照舊用距離。
(function (R) {
  R.RUIN_CITY = {
    toudo: 'yuebei', 'yb-mine': 'yuebei',
    'gs-root': 'gusen', tougrei: 'gusen', kaso: 'gusen',
    'bb-bridge': 'banbei',
    'zy-wreck': 'zhengyuan',
    'bn-army': 'bannan',
    hokuroku: 'huangling',
    'ft-camp': 'futing',
    'js-factory': 'jishan', seigan: 'jishan',
    ukishima: 'donghe', 'sp-mugen': 'donghe',
    'hs-barracks': 'fengzhu', 'hs-arsenal': 'fengzhu',
    'xj-under': 'xijian',
    'nl-fog': 'nanlong', kanko: 'nanlong',
    'wq-eddy': 'woqi', kazan: 'woqi'
  };
})(window.R = window.R || {});
