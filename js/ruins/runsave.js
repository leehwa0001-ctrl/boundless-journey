// 遺跡裡存檔、下次再來探索（2026-10-21 作者：讓遺跡內也可以離開存檔，下次再來探索；每層自動存檔一次）
// - 每進一層（R.loadFloor 之後）自動存一次：這一趟的進度（R.S.runSave＝遺跡、第幾層、這一趟的資料、生命、魔力）。
//   這一趟的資料（W.run）照存：背包、素材、擊倒數、委託、加注條款、佩特拉的注意、環境……；畫面上的東西（模型、這一層的地圖）不存。
// - 遺跡裡的 Esc 選單「存檔，回到標題」：存好（從這一層的入口開始）就回到標題畫面。
// - 標題畫面按「繼續冒險」：有存著的那一趟，就問要「繼續探索」（從那一層的入口重新進去，這一層重新生成）還是「放棄這一趟」（背包裡撿到的東西留在遺跡裡）。
// - 回到地面（R.extract）、倒下（R.onPlayerDown）就把存著的那一趟清掉：拿過的東西不會再拿一次。
// - 不存：訓練場、狩獵場（戶外）、觀光、多人連線中。
// - 左上角的地名記在 R.S.lastPlace（標題畫面照它換背景：遺跡＝佩特拉核心，東鶴＝雪景，皇嶺＝皇城……，title2.js）。
// 放在 run.js（R.startRunBase）、guildtask.js、pact.js、turnin.js 和所有包 R.loadFloor、R.extract 的檔案後面（index.html 後段）。
(function (R) {
  const W = R.W, $ = id => document.getElementById(id), esc = s => (R.esc ? R.esc(s) : String(s));
  const SKIP = { site: 1, grade: 1, floor: 1, party: 1, lastF: 1, done: 1 };
  const ok = run => !!(run && !run.done && run.site && run.site.kind === 'ruin' && !run.site.outdoor && run.grade && run.grade.id !== 'train' && !(R.net && R.net.room));
  // 這一趟的資料：只留 JSON 存得下的（模型、函式、互相指來指去的都丟掉）
  const pack = run => {
    const seen = new WeakSet();
    return JSON.parse(JSON.stringify(run, function (k, v) {
      if (this === run && SKIP[k]) return undefined;
      if (typeof v === 'function') return undefined;
      if (v && typeof v === 'object') { if (v.isObject3D || v.isMaterial || v.isTexture || v.isBufferGeometry || (typeof Node !== 'undefined' && v instanceof Node)) return undefined; if (seen.has(v)) return undefined; seen.add(v); }
      return v;
    }));
  };
  const placeName = sv => { const site = R.SITES.find(s => s.id === sv.siteId); return (site ? site.name : '遺跡') + '・第 ' + (sv.floor + 1) + ' 層'; };
  // ---------- 每一層自動存 ----------
  const checkpoint = () => {
    const run = W.run, P = W.P, S = R.S; if (!S || !ok(run)) return;
    try { S.runSave = { siteId: run.site.id, floor: run.floor, run: pack(run), P: P ? { hp: P.hp, mp: P.mp, ult: P.ult || 0 } : null, day: S.day, at: Date.now() }; R.save(); }
    catch (e) { console.warn('[runsave]', e); }
  };
  const lf0 = R.loadFloor;
  R.loadFloor = (...a) => { const r = lf0(...a); if (!resuming) setTimeout(checkpoint, 0); return r; };   // 下一格再存：這一層的東西（隊友、委託的提示）都擺好了
  // ---------- 回到地面、倒下：清掉 ----------
  const clear = () => { const S = R.S; if (S && S.runSave) { delete S.runSave; R.save(); } };
  const ex0 = R.extract; R.extract = (...a) => { const r = ex0(...a); clear(); return r; };
  const pd0 = R.onPlayerDown; R.onPlayerDown = (...a) => { const r = pd0(...a); if (W.run && (W.run.done || (W.P && W.P.dead))) clear(); return r; };
  // ---------- 存檔，回到標題 ----------
  R.runSaveQuit = () => {
    const run = W.run; if (!ok(run)) return;
    // 存的是「這一層的入口」：生命、魔力照現在的（不會因為重進一次就補滿）
    checkpoint();
    R.closeSheet && R.closeSheet();
    W.paused = true; W.allies = [];
    try { if (W.scene && W.P && W.P.h) W.scene.remove(W.P.h.g); if (W.scene && R.disposeScene) R.disposeScene(W.scene); } catch (e) { }
    W.run = null; W.enemies = []; W.shots = []; W.drops = []; W.zones = []; W.fxs = []; W.dyn = []; W.F = null;
    R.save();
    if (R.goTitle) R.goTitle();
    setTimeout(() => R.toast && R.toast('存好了。下次按「繼續冒險」從這一層的入口接著探索。', '#E8C04A'), 300);
  };
  const ps0 = R.pauseSheet;
  if (ps0) R.pauseSheet = (...a) => {
    const r = ps0(...a);
    try { if (ok(W.run) && !$('rs-quit')) { const row = document.querySelector('#r-sheet .row') || document.querySelector('#r-sheet'); const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.id = 'rs-quit'; b.textContent = '存檔，回到標題'; b.title = '下次從這一層的入口接著探索（這一層會重新生成）'; b.onclick = R.runSaveQuit; row.appendChild(b); } } catch (e) { console.warn('[runsave]', e); }
    return r;
  };
  // ---------- 繼續探索 ----------
  let resuming = false;
  const resume = async () => {
    const S = R.S, sv = S && S.runSave; if (!sv || !R.startRunBase) return;
    if (!window.THREE && R.three) { try { await R.three; } catch (e) { return; } }
    resuming = true;
    try {
      const runs = (S.stats && S.stats.runs) || 0;
      R.startRunBase(sv.siteId);
      if (S.stats) S.stats.runs = runs;   // 重新進去不算新的一趟
      const run = W.run; Object.keys(sv.run || {}).forEach(k => { if (!SKIP[k]) run[k] = sv.run[k]; });
      R.loadFloor(sv.floor);
      if (sv.run && sv.run.aware != null) run.aware = sv.run.aware;   // 進一層會把注意降到四成：存的時候已經降過了，不要再降一次
      const P = W.P; if (P && sv.P) { P.hp = Math.min(P.hpMax, Math.max(1, sv.P.hp)); P.mp = Math.min(P.mpMax, sv.P.mp); P.ult = sv.P.ult || 0; }
    } catch (e) { console.warn('[runsave] resume', e); } finally { resuming = false; }
    setTimeout(() => { if (R.sheetOpen && R.sheetOpen()) R.closeSheet(); checkpoint(); if (R.banner) R.banner(placeName(sv), '從這一層的入口接著探索'); }, 400);
  };
  const giveUp = () => {
    const S = R.S; if (!S || !S.runSave) return; const sv = S.runSave; delete S.runSave; R.save();
    R.closeSheet && R.closeSheet(); if (R.enterTown) R.enterTown();
    setTimeout(() => R.toast && R.toast('放棄了「' + placeName(sv) + '」這一趟：在遺跡裡撿到的東西都留在那裡了。', '#FF9A6A'), 600);
  };
  R.runSaveResume = resume;
  // 標題畫面的「繼續冒險」：有存著的那一趟就先問
  const askOnGo = e => {
    const S = R.S, sv = S && S.runSave; if (!sv) return;
    e.stopImmediatePropagation(); e.preventDefault();
    const hp = sv.P ? Math.round(sv.P.hp) : '?';
    R.sheet('<p class="kicker">探索中的遺跡</p><h2>' + esc(placeName(sv)) + '</h2><p>上次在這一層存檔離開。要接著探索嗎？</p><p class="note">從這一層的入口重新進去（這一層會重新生成，遺跡生物也會重新出現）；生命 ' + hp + '、背包、委託的進度、佩特拉的注意都照上次的。</p>',
      '<div class="row"><button type="button" class="btn pri" id="rs-go">繼續探索</button><button type="button" class="btn" id="rs-give">放棄這一趟，回東鶴</button><button type="button" class="btn" id="rs-x">先不要</button></div>');
    $('rs-go').onclick = () => { R.closeSheet(); resume(); };
    $('rs-give').onclick = giveUp; $('rs-x').onclick = () => R.closeSheet();
  };
  // 標題上「繼續冒險」的小字：探索中就寫在哪一層（main.js 每次畫標題都會重寫小字，看著它補上）
  const tagGo = () => { const S = R.S, go = $('t-go'), sm = go && go.querySelector('small'); if (S && S.runSave && sm && sm.textContent && sm.textContent.indexOf('探索中') < 0) sm.textContent += '・探索中：' + placeName(S.runSave); };
  const hook = () => { const go = $('t-go'); if (!go) return setTimeout(hook, 300); go.addEventListener('click', askOnGo, true); tagGo(); new MutationObserver(tagGo).observe(go, { childList: true, subtree: true, characterData: true }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook); else hook();
  // 標題上「繼續冒險」的小字：探索中就寫在哪一層
  const gt0 = R.goTitle; if (gt0) R.goTitle = (...a) => { const r = gt0(...a); try { tagGo(); } catch (e) { } return r; };
  // ---------- 最後在哪裡（標題的背景用） ----------
  const sv0 = R.save;
  R.save = (...a) => {
    try {
      const S = R.S; if (S) {
        let id = null;
        if (W.run && ok(W.run)) id = 'ruin';
        else if (W.town) { const tw = W.town, c = tw.room && tw.outer ? tw.outer.town.city : tw.city; id = tw.ck && c ? c.id : 'donghe'; }
        if (id) S.lastPlace = { id, hour: R.S.hour != null ? Math.floor(R.S.hour) : 12 };
      }
    } catch (e) { }
    return sv0(...a);
  };
})(window.R);
