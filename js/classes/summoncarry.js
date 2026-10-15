// 召喚師的身份（2026-10-13 作者：「身體脆弱、召喚物強大（轉職補強身體）。技能：每次進遺跡帶五隻召喚獸」）
// - 召喚師本身：生命 ×0.9、防禦 ×0.8（2026-10-14 作者「增強召喚師的基礎體值」：原本 ×0.75、×0.6）；召喚物：傷害 ×1.4、血量 ×1.3。
// - 轉職補身體：萬獸師＝在場每隻召喚獸受到的傷害 −2%（最多 −20%）；死靈法師＝亡者、鴉群、蟲群打出去的傷害 10% 回成你的生命；式神使＝照舊 30% 由式神分擔。
// - 召喚獸攜帶：遺跡入口的休息區（第 0 層）會問你這一趟要帶哪幾招進去（最多五格，照等級開的格子數）；
//   進了遺跡就鎖住（技能書本來就是遺跡裡不能換）。休息區左下角有「換攜帶的召喚獸」可以再改。
// 放在 summonsub.js 後面。
(function (R) {
  const W = () => R.W, $ = id => document.getElementById(id);
  const adv = P => (P && P.adv) || '', isS = P => !!(P && P.cls === 'summoner');
  const pets = () => (R.PETS || []).filter(p => !p.gone && p.left > 0);
  const L = R.SKILL_LIB || {};
  const BODY_HP = 0.9, BODY_DEF = 0.8, PET_DMG = 1.4, PET_HP = 1.3;
  R.SUMMONER_BODY = { hp: BODY_HP, def: BODY_DEF, petDmg: PET_DMG, petHp: PET_HP };
  // ---------- 身體脆弱 ----------
  const cp0 = R.calcPlayer;
  R.calcPlayer = cls => { const P = cp0(cls); try { if (cls === 'summoner') { P.hpMax = Math.round(P.hpMax * BODY_HP); P.hp = Math.min(P.hp == null ? P.hpMax : P.hp, P.hpMax); P.def = Math.round((P.def || 0) * BODY_DEF * 10) / 10; } } catch (e) { } return P; };
  // ---------- 召喚物強大 ----------
  const pi0 = R.petInit;
  R.petInit = (pet, P, s, w) => { if (pi0) pi0(pet, P, s, w); if (!isS(P)) return; pet.pK = (pet.pK || 1) * PET_DMG; if (pet.hpMax) { pet.hpMax = Math.round(pet.hpMax * PET_HP); pet.hp = pet.hpMax; } };
  // ---------- 轉職補身體 ----------
  const hp0 = R.hurtPlayer;
  R.hurtPlayer = (raw, src, o) => { try { const P = W().P; if (raw > 0 && isS(P) && adv(P) === 'beastlord' && R.dmgRedAdd) R.dmgRedAdd(Math.min(0.2, 0.02 * pets().length)); } catch (e) { } return hp0(raw, src, o); };
  const he0 = R.hurtEnemy;
  R.hurtEnemy = (e, raw, o) => {
    const pet = R.petHitter, h = e && e.hp, r = he0(e, raw, o);
    try { const P = W().P; if (((pet && pet.raised) || (o && o.vSk === 'summon')) && isS(P) && adv(P) === 'medium' && e && R.healP)   /* 2026-10-14：鴉群、蟲群吐出的攻擊（vSk summon）也算 */ { const d = Math.max(0, (h || 0) - Math.max(0, e.hp || 0)); if (d > 0) R.healP(d * 0.1, true); } } catch (err) { }
    return r;
  };
  // ---------- 召喚獸攜帶 ----------
  const SUMMON_T = new Set(['pet', 'turret', 'orbit', 'nc_raise']);
  const nm = id => (R.SKILLS && R.SKILLS[id] && R.SKILLS[id].name) || (L[id] && L[id].name) || id;
  const isSummon = id => { const l = L[id]; if (!l) return false; if (SUMMON_T.has(l.type) || /召喚|式神/.test(nm(id))) return true; return !!(l.p && l.p.parts && l.p.parts.some(x => x[0] === 'pet')); };
  R.isSummonSkill = isSummon;
  const st = () => R.S && R.S.classes && R.S.classes.summoner;
  const nSlots = () => { const s = st(); return (R.SKILL_UNLOCK || [1]).filter(lv => s && s.lv >= lv).length; };
  const learned = () => { const s = st(); return Object.keys(L).filter(id => { const l = L[id]; if (!l || l.cls !== 'summoner') return false; const need = R.skillNeedLv ? R.skillNeedLv(l, s) : l.lv; return s.lv >= need && (!l.adv || l.adv === s.adv); }); };
  let pick = null;
  const apply = () => {
    const S = R.S, n = nSlots(), cur = pick.slice(0, n); while (cur.length < 5) cur.push(null);
    S.loadout = S.loadout || {}; S.loadout.summoner = cur; R.save && R.save();
    const P = W().P; try { if (P && isS(P)) { const lo = R.loadoutOf('summoner'); P.skill = lo[0]; } } catch (e) { }
  };
  const draw = () => {
    const n = nSlots(), all = learned(), sum = all.filter(isSummon), oth = all.filter(id => !isSummon(id)), cnt = pick.filter(isSummon).length;
    const tile = id => { const on = pick.includes(id), up = isSummon(id) && L[id] && L[id].p && L[id].p.k ? '・每秒 ' + (R.summonUpkeep ? R.summonUpkeep(L[id].p.k) : '') + ' 魔力' : '';
      return '<button type="button" class="sc-t' + (on ? ' on' : '') + '" data-id="' + id + '"><b>' + nm(id) + '</b><small>' + (isSummon(id) ? '召喚獸' + up : '輔助') + (on ? '・第 ' + (pick.indexOf(id) + 1) + ' 格' : '') + '</small></button>'; };
    R.sheet('<div id="sc-box"><h3>這一趟帶哪些召喚獸？</h3><p class="sc-n">技能格 ' + n + ' 格（已選 ' + pick.length + '／' + n + '，召喚獸 ' + cnt + ' 隻）。進了遺跡就不能換，在休息區可以再改。</p>'
      + '<div class="sc-h">召喚獸</div><div class="sc-g">' + sum.map(tile).join('') + '</div>'
      + (oth.length ? '<div class="sc-h">其他技能（也佔格子）</div><div class="sc-g">' + oth.map(tile).join('') + '</div>' : '')
      + '<div class="sc-row"><button type="button" class="btn" data-clr>全部拿掉</button><button type="button" class="btn sc-go" data-go>就帶這些出發</button></div></div>');
    const box = $('sc-box'); if (!box) return;
    box.querySelectorAll('[data-id]').forEach(b => { b.onclick = () => { const id = b.dataset.id, i = pick.indexOf(id); if (i >= 0) pick.splice(i, 1); else if (pick.length < n) pick.push(id); else { R.toast && R.toast('格子滿了：先點一個拿掉'); return; } draw(); }; });
    box.querySelector('[data-clr]').onclick = () => { pick = []; draw(); };
    box.querySelector('[data-go]').onclick = () => { apply(); R.closeSheet(); R.toast && R.toast('帶了 ' + pick.filter(isSummon).length + ' 隻召喚獸進遺跡', '#B8E07A'); };
  };
  const open = () => { if (!R.S || R.S.cls !== 'summoner') return; pick = R.loadoutOf('summoner').filter(Boolean).slice(0, nSlots()); draw(); };
  R.summonCarry = open;
  const atEntrance = () => { const w = W(), r = w && w.run; return !!(r && (r.floor === 0 || r.floor == null && r.f === 0) && !r.train && !(R.inTraining && R.inTraining())); };
  // 休息區：第一次進來自動問一次；左下角的按鈕可以再改
  let btn = null, lastRun = null, waitT = 0;
  const tick = () => {
    try {
      const w = W(), on = !!(R.S && R.S.cls === 'summoner' && w && w.run && !w.run.done && atEntrance());
      if (!on) waitT = 0;
      else if (w.run !== lastRun && !(R.sheetOpen && R.sheetOpen()) && !document.querySelector('.tk-card:not([hidden]), #tk-box:not([hidden])') && ![...document.querySelectorAll('.news-ov')].some(e => e.offsetParent)) { waitT += 0.3; if (waitT >= 1.2) { lastRun = w.run; waitT = 0; open(); } }
      if (!btn) { btn = document.createElement('button'); btn.type = 'button'; btn.id = 'sc-btn'; btn.textContent = '換攜帶的召喚獸'; btn.onclick = open; document.body.appendChild(btn); }
      btn.style.display = on && !(R.sheetOpen && R.sheetOpen()) ? 'block' : 'none';
    } catch (e) { }
  };
  setInterval(tick, 300);
  // 技能書：遺跡外換技能也一樣是「帶進去的」
  const css = document.createElement('style');
  css.textContent = '#sc-box h3{margin:0 0 4px;color:#E8E0D0}#sc-box .sc-n{color:#A8A090;font-size:12px;margin:0 0 8px}#sc-box .sc-h{color:#B8E07A;font-size:12px;margin:8px 0 4px}'
    + '#sc-box .sc-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:6px}'
    + '#sc-box .sc-t{background:#1A1820;border:1px solid #3A3644;color:#D8D0C0;border-radius:6px;padding:8px 6px;min-height:48px;text-align:left;cursor:pointer}'
    + '#sc-box .sc-t b{display:block;font-size:13px}#sc-box .sc-t small{color:#8A8478;font-size:11px}'
    + '#sc-box .sc-t.on{border-color:#B8E07A;background:#232A1C}#sc-box .sc-t.on small{color:#B8E07A}'
    + '#sc-box .sc-row{display:flex;gap:8px;justify-content:flex-end;margin-top:10px}'
    + '#sc-btn{position:fixed;left:10px;bottom:150px;z-index:30;display:none;background:#1A1820;color:#D8D0C0;border:1px solid #B8E07A;border-radius:6px;padding:8px 10px;font-size:13px}';
  document.head.appendChild(css);
})(window.R);
