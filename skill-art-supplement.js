// 補齊召喚、毒附魔與法術編排的簡潔色塊圖示。
(function (R) {
  const map = R.SKILL_ART_MAP;
  const ids = ['bl_alpha', 'bl_pack', 'en_burst', 'element:wood', 'element:wind',
    'element:metal', 'element:fire', 'element:frost', 'element:shock', 'shape:bolt',
    'shape:fan', 'shape:pillar', 'shape:orb', 'shape:wall'];
  map.sheets['supplement-v1'] = { file: 'skills-supplement-v1.webp', cols: 5, rows: 3 };
  ids.forEach((id, tile) => { map.icons[id] = { ...map.icons[id], sheet: 'supplement-v1', tile, family: id }; });
  const corrections = ['ss_shiki', 'ss_fox', 'md_haunt', 'ss_paper', 'en_masterwork', 'bl_pack',
    'tk_kaeshi', 'tk_nagare', 'tk_noto', 'tk_soudan', 'shape:shield'];
  map.sheets['corrections-v1'] = { file: 'skills-corrections-v1.webp', cols: 4, rows: 3 };
  corrections.forEach((id, tile) => {
    map.icons[id] = { ...map.icons[id], sheet: 'corrections-v1', tile, family: id,
      name: R.SKILLS[id]?.name || (id === 'shape:shield' ? '罩' : id) };
  });
  R.spellArtTag = (kind, key) => {
    const id = kind + ':' + key;
    return map.icons[id] && R.skillIconURL ? '<img class="sp-art" width="32" height="32" alt="" src="' + R.skillIconURL(id) + '">' : '';
  };
  const style = document.createElement('style');
  style.textContent = '.sp-art{vertical-align:middle;object-fit:contain;border-radius:4px;margin-right:5px;pointer-events:none}#sp-book .chips button{display:inline-flex;align-items:center}#sp-book .sp-list .sp-art{float:left}';
  document.head.appendChild(style);
})(window.R);
