// 無境之旅：雀莊「東風」改版（2026-10-13，作者：「把東風的改成像雀魂一樣，甚至可以連線」）
// 規則在 mjcore.js（R.MJ，和線上牌桌的伺服器共用）；這個檔是牌桌畫面、單機對電腦、線上桌（server-cf/mjtable.js）。
// 包住 mahjong.js 的 R.mahjong（大樓、店裡的桌子都還是叫 R.mahjong）；舊的桌費、倍率、獎金、R.S.mj 戰績、R.mjEvent 稱號都保留。
// 畫面全部用 CSS／canvas 自己畫（綠色檯面、中央資訊盤、六張一排的牌河、立直橫放、吃碰槓和自摸的按鈕、聽牌提示、限時、和了畫面、終局順位與馬）。
(function (R) {
  const MJ = R.MJ || window.MJCore; if (!MJ) { console.warn('[mahjong2] mjcore.js 沒載入'); return; }
  const $ = id => document.getElementById(id), esc = s => (R.esc ? R.esc(s) : String(s));
  const FEE = 20, PRIZE = [80, 30, 10, 0], MULS = [1, 2, 5, 10];
  // 2026-10-24 作者：不要只有那幾個 NPC──每一局從這些常客裡抽三個
  const FOES = ['老闆娘・玉枝', '退休衛兵・權藏', '上班族・新田', '計程車司機・大門', '漁港的阿勝', '女學生・小雪', '和尚・了然', '茶屋的阿菊', '鐵匠學徒・鐵平', '報社記者・早瀨',
    '藥師・白藤', '常客・六郎', '魔導技師・柯恩', '德克斯凡商人・瑪莎', '冒險者・荒木', '老賭徒・銀次', '站員・森', '花店的小百合', '劇場演員・鳳', '護理師・千鶴',
    '旅館掌櫃・松本', '巫女・朱音', '碼頭工人・剛', '占卜師・夜見'];
  // 段位戰（2026-10-24）：新人、九級～一級、初段～九段、雀聖。一局照名次加減段位分，滿了升、段位以上扣到負的會降；
  //   段位越高對手越少失誤，桌費和獎金的倍率也越高。
  const RANKS = ['新人'].concat(['九', '八', '七', '六', '五', '四', '三', '二', '一'].map(n => n + '級'), ['初', '二', '三', '四', '五', '六', '七', '八', '九'].map(n => n + '段'), ['雀聖']);
  const rkNeed = lv => 100 + Math.floor(lv / 5) * 40;
  const rkMul = lv => (lv < 10 ? 1 : lv < 13 ? 2 : lv < 16 ? 5 : 10);
  const rkGain = (lv, place) => [60, 25, lv < 4 ? 0 : -10 - lv * 2, lv < 4 ? 0 : -25 - lv * 3][place];
  const rkErr = lv => Math.max(0, 0.35 - lv * 0.02);   // 電腦打錯牌的機會
  const rkOf = () => { const m = R.S.mj; m.rk = m.rk || { lv: 0, pt: 0, best: 0 }; return m.rk; };
  let RANKED = false;
  const SW = 1280, SH = 860;
  const PROD = 'wss://taofaling-1433.1433.workers.dev';
  const serverBase = () => { let v = ''; try { v = localStorage.getItem('tf-net-server') || ''; } catch (e) { } if (!v) v = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'ws://localhost:8787' : PROD; return v.trim().replace(/^http(s?):\/\//, 'ws$1://').replace(/\/+$/, ''); };
  const OPT_KEY = 'tf-mj-opts';
  const OPT = Object.assign({ sort: true, win: true, nocall: false, tg: false, timer: false, sound: true }, (() => { try { return JSON.parse(localStorage.getItem(OPT_KEY) || '{}'); } catch (e) { return {}; } })());
  const saveOpt = () => { try { localStorage.setItem(OPT_KEY, JSON.stringify(OPT)); } catch (e) { } };

  // ---------------- 牌面（canvas 畫一次，做成圖） ----------------
  const NUM = MJ.NUM, HON = MJ.HON;
  const faceCache = {};
  const face = (id, red) => {
    const key = id + (red ? 'r' : ''); if (faceCache[key]) return faceCache[key];
    const w = 60, h = 80, cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
    const X = u => u * w, Y = v => v * h, font = (px) => 'bold ' + px + 'px "Noto Serif TC","Songti TC","PMingLiU",serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const RD = '#C8202A', GR = '#1E7A46', BL = '#1E3E8E', BK = '#16161E';
    if (id < 9) { g.fillStyle = red ? RD : BK; g.font = font(30); g.fillText(NUM[id], X(0.5), Y(0.3)); g.fillStyle = RD; g.font = font(32); g.fillText('萬', X(0.5), Y(0.72)); }
    else if (id < 27) {
      const n = id % 9 + 1, pin = id < 18;
      const P = { 1: [[.5, .5]], 2: [[.5, .27], [.5, .73]], 3: [[.25, .2], [.5, .5], [.75, .8]], 4: [[.3, .27], [.7, .27], [.3, .73], [.7, .73]], 5: [[.28, .22], [.72, .22], [.5, .5], [.28, .78], [.72, .78]], 6: [[.3, .2], [.7, .2], [.3, .52], [.7, .52], [.3, .82], [.7, .82]], 7: [[.2, .13], [.5, .23], [.8, .33], [.3, .6], [.7, .6], [.3, .85], [.7, .85]], 8: [[.3, .14], [.7, .14], [.3, .38], [.7, .38], [.3, .62], [.7, .62], [.3, .86], [.7, .86]], 9: [[.2, .18], [.5, .18], [.8, .18], [.2, .5], [.5, .5], [.8, .5], [.2, .82], [.5, .82], [.8, .82]] }[n];
      if (pin) {
        const r = n === 1 ? w * 0.36 : n <= 4 ? w * 0.17 : n <= 6 ? w * 0.15 : w * 0.12;
        P.forEach(([u, v], i) => { const col = red ? RD : n === 1 ? RD : (n === 5 && i === 2) || (n === 7 && i < 3) || (n === 9 && i >= 3 && i < 6) || (n === 6 && i >= 2) || (n === 3 && i === 1) ? RD : n % 2 ? GR : BL; g.fillStyle = col; g.beginPath(); g.arc(X(u), Y(v), r, 0, 7); g.fill(); g.fillStyle = '#FBF6E8'; g.beginPath(); g.arc(X(u), Y(v), r * 0.55, 0, 7); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(X(u), Y(v), r * 0.25, 0, 7); g.fill(); });
      } else if (n === 1) {
        g.fillStyle = GR; g.beginPath(); g.ellipse(X(0.48), Y(0.56), w * 0.25, h * 0.2, -0.3, 0, 7); g.fill(); g.fillStyle = RD; g.beginPath(); g.arc(X(0.64), Y(0.3), w * 0.12, 0, 7); g.fill();
        g.fillStyle = BL; g.beginPath(); g.moveTo(X(0.3), Y(0.6)); g.lineTo(X(0.08), Y(0.88)); g.lineTo(X(0.44), Y(0.74)); g.fill(); g.fillStyle = '#E8A03A'; g.beginPath(); g.moveTo(X(0.74), Y(0.28)); g.lineTo(X(0.9), Y(0.31)); g.lineTo(X(0.74), Y(0.34)); g.fill();
      } else {
        const sw = w * 0.12, sh = h * (n <= 3 ? 0.34 : n <= 6 ? 0.26 : 0.2);
        P.forEach(([u, v], i) => { const rr = red || (n === 5 && i === 2) || (n === 7 && i === 0) || (n === 9 && i % 3 === 1); g.fillStyle = rr ? RD : GR; const x0 = X(u) - sw / 2, y0 = Y(v) - sh / 2; g.beginPath(); g.roundRect ? g.roundRect(x0, y0, sw, sh, sw / 2) : g.rect(x0, y0, sw, sh); g.fill(); g.fillStyle = '#FBF6E8'; g.fillRect(x0, Y(v) - 1, sw, 2); });
      }
    } else if (id === 31) { g.strokeStyle = '#2E5ACF'; g.lineWidth = 4; g.strokeRect(X(0.2), Y(0.17), w * 0.6, h * 0.66); g.strokeStyle = '#8AA8F0'; g.lineWidth = 1.5; g.strokeRect(X(0.27), Y(0.23), w * 0.46, h * 0.54); }
    else { g.fillStyle = id === 32 ? GR : id === 33 ? RD : BK; g.font = font(44); g.fillText(HON[id - 27], X(0.5), Y(0.53)); }
    if (red) { g.fillStyle = RD; g.beginPath(); g.arc(X(0.88), Y(0.08), 4, 0, 7); g.fill(); }
    return (faceCache[key] = cv.toDataURL());
  };
  // 一張牌的 HTML：sz＝h（手牌）p（牌河）m（副露）o（別人的手牌，背面）d（寶牌）
  const tile = (t, sz, ex) => {
    ex = ex || {}; const cls = ['mt', 'mt-' + sz]; if (ex.side) cls.push('mj-yoko'); if (ex.cls) cls.push(ex.cls);
    if (t == null || t < 0) { cls.push('back'); return '<i class="' + cls.join(' ') + '"' + (ex.attr || '') + '></i>'; }
    return '<i class="' + cls.join(' ') + '"' + (ex.attr || '') + '><b style="background-image:url(' + face(t >> 2, MJ.isRed(t)) + ')"></b></i>';
  };

  // ---------------- 聲音（WebAudio 合成） ----------------
  let AC = null;
  const ac = () => { if (!OPT.sound) return null; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) { return null; } return AC; };
  const tone = (f, d, type, v, at) => { const a = ac(); if (!a) return; const t0 = a.currentTime + (at || 0), o = a.createOscillator(), gn = a.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0); gn.gain.setValueAtTime(0.0001, t0); gn.gain.exponentialRampToValueAtTime(v || 0.08, t0 + 0.01); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + d); o.connect(gn).connect(a.destination); o.start(t0); o.stop(t0 + d + 0.02); };
  const click = (v, f) => { const a = ac(); if (!a) return; const t0 = a.currentTime, n = Math.floor(a.sampleRate * 0.05), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 6); const s = a.createBufferSource(), bp = a.createBiquadFilter(), gn = a.createGain(); bp.type = 'bandpass'; bp.frequency.value = f || 2600; bp.Q.value = 1.2; gn.gain.value = v || 0.5; s.buffer = b; s.connect(bp).connect(gn).connect(a.destination); s.start(t0); tone(180, 0.06, 'sine', 0.06); };
  const SND = {
    discard: () => click(0.6, 2400), draw: () => click(0.15, 3800),
    call: () => { tone(660, 0.12, 'triangle', 0.09); tone(990, 0.18, 'triangle', 0.08, 0.08); },
    riichi: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.5, 'triangle', 0.06, i * 0.06)); },
    win: () => { [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.7, 'triangle', 0.07, i * 0.07)); tone(196, 1.2, 'sine', 0.08, 0.1); },
    draw2: () => { tone(330, 0.5, 'sine', 0.06); tone(262, 0.7, 'sine', 0.06, 0.25); },
    tick: () => tone(1400, 0.05, 'square', 0.03), dora: () => tone(1760, 0.3, 'sine', 0.05)
  };

  // ---------------- 樣式 ----------------
  const CSS = `
#mjs{position:fixed;inset:0;z-index:9000;background:radial-gradient(ellipse at 50% 40%,#2a1f18,#0d0a08);display:flex;align-items:center;justify-content:center;overflow:hidden;font-family:"Noto Sans TC",sans-serif;user-select:none;-webkit-user-select:none}
#mjs .mj-stage{position:relative;width:${SW}px;height:${SH}px;flex:none;transform-origin:center center}
#mjs .mj-board{position:absolute;left:260px;top:8px;width:760px;height:760px;border-radius:26px;background:radial-gradient(circle at 50% 48%,#2f8a5e 0,#1f6b47 55%,#16523a 100%);box-shadow:0 0 0 10px #4a2e1c,0 0 0 13px #2a190f,0 18px 50px rgba(0,0,0,.6),inset 0 0 80px rgba(0,0,0,.35)}
#mjs .mj-board:before{content:"";position:absolute;inset:0;border-radius:26px;background:repeating-radial-gradient(circle at 30% 30%,rgba(255,255,255,.018) 0 2px,transparent 2px 5px);pointer-events:none}
#mjs .mj-side{position:absolute;left:0;top:0;width:760px;height:760px;transform-origin:380px 380px;pointer-events:none}
#mjs .mj-side.r1{transform:rotate(-90deg)}#mjs .mj-side.r2{transform:rotate(180deg)}#mjs .mj-side.r3{transform:rotate(90deg)}
#mjs .mj-pond{position:absolute;left:278px;top:508px;width:240px}
#mjs .mj-prow{display:flex;height:44px;align-items:flex-end}
#mjs .mj-ohand{position:absolute;left:30px;right:30px;top:700px;display:flex;justify-content:center;align-items:flex-end;gap:0}
#mjs .mj-melds{display:flex;gap:6px;margin-left:12px;align-items:flex-end}
#mjs .mj-meld{display:flex;align-items:flex-end}
#mjs .mj-stick{position:absolute;left:330px;top:494px;width:100px;height:8px;border-radius:4px;background:#f4f1ea;box-shadow:0 1px 3px rgba(0,0,0,.5)}
#mjs .mj-stick:after{content:"";position:absolute;left:46px;top:1px;width:6px;height:6px;border-radius:3px;background:#d0202a}
#mjs .mj-center{position:absolute;left:270px;top:270px;width:220px;height:220px;border-radius:14px;background:linear-gradient(#1a2a22,#0f1a15);box-shadow:inset 0 0 0 2px #c9a13a55,0 4px 14px rgba(0,0,0,.5);color:#eee}
#mjs .mj-cinfo{position:absolute;left:0;right:0;top:56px;text-align:center}
#mjs .mj-cinfo .mj-rd{font:700 22px "Noto Serif TC",serif;color:#ffe9a8;letter-spacing:2px}
#mjs .mj-cinfo .mj-sub{font-size:12px;color:#b8c8bc;margin-top:2px}
#mjs .mj-cinfo .mj-left{font-size:13px;color:#fff;margin-top:4px}
#mjs .mj-dora{display:flex;justify-content:center;gap:2px;margin-top:6px}
#mjs .mj-seatbox{position:absolute;left:290px;top:452px;width:180px;height:36px;text-align:center;color:#e8e2cc;font-size:15px;line-height:36px}
#mjs .mj-seatbox .w{display:inline-block;width:22px;height:22px;line-height:22px;border-radius:5px;background:#3a4a40;margin-right:6px;font:700 14px "Noto Serif TC",serif}
#mjs .mj-seatbox .w.oya{background:#c0392b;color:#fff}
#mjs .mj-seatbox.turn{color:#ffe070}#mjs .mj-seatbox.turn:after{content:"";position:absolute;left:10px;right:10px;bottom:-4px;height:3px;border-radius:2px;background:#ffd84a;box-shadow:0 0 10px #ffd84a;animation:mjglow 1s ease-in-out infinite alternate}
@keyframes mjglow{from{opacity:.4}to{opacity:1}}
#mjs .mj-seatbox .dlt{font-size:13px;margin-left:4px}
#mjs .mj-tag{position:absolute;left:200px;top:741px;width:360px;text-align:center;font-size:12px;line-height:16px;color:#e8f4ec;text-shadow:0 1px 2px #000}
/* 牌 */
#mjs .mt{position:relative;display:inline-block;flex:none;border-radius:5px;background:linear-gradient(#fffdf6,#efe6cf);box-shadow:0 3px 0 #d6c79e,0 5px 0 #2e8f7a,0 6px 4px rgba(0,0,0,.35)}
#mjs .mt b{position:absolute;left:8%;right:8%;top:6%;bottom:6%;background:center/contain no-repeat}
#mjs .mt.back{background:linear-gradient(135deg,#3bb39a,#22806c);box-shadow:0 3px 0 #f2e8cc,0 4px 3px rgba(0,0,0,.35)}
#mjs .mt-h{width:52px;height:72px;margin-right:2px;pointer-events:auto;cursor:pointer;transition:transform .08s}
#mjs .mt-p{width:34px;height:44px}
#mjs .mt-m{width:34px;height:44px}
#mjs .mt-o{width:24px;height:34px;margin-right:1px}
#mjs .mt-mo{width:26px;height:34px}
#mjs .mt-d{width:24px;height:32px;box-shadow:0 2px 0 #d6c79e,0 3px 0 #2e8f7a}
#mjs .mt-r{width:40px;height:54px;margin-right:2px}
#mjs .mt.mj-yoko{transform:rotate(90deg);margin:0 5px}
#mjs .mt-p.mj-yoko{margin:0 5px 0 5px;top:-3px}
#mjs .mt.taken{opacity:.35}
#mjs .mt.tg:after{content:"";position:absolute;inset:0;border-radius:5px;background:rgba(0,0,40,.12)}
#mjs .mt.new{animation:mjdrop .28s ease-out}
@keyframes mjdrop{from{transform:translateY(-40px) scale(1.25);opacity:0}to{transform:none;opacity:1}}
#mjs .mt.mj-yoko.new{animation:none}
#mjs .mt.last{outline:2px solid #ffe070;outline-offset:1px}
#mjs .mt.mj-dora b:after{content:"";position:absolute;inset:-6%;border-radius:4px;box-shadow:inset 0 0 8px rgba(255,200,40,.55)}
#mjs .mj-hand{position:absolute;left:0;right:0;top:782px;height:76px;display:flex;justify-content:center;align-items:flex-end}
#mjs .mj-hand .mt-h:hover,#mjs .mj-hand .mt-h.sel{transform:translateY(-14px)}
#mjs .mj-hand .mt-h.dim{filter:brightness(.55);cursor:not-allowed}
#mjs .mj-hand .mt-h.drawn{margin-left:16px}
#mjs .mj-hand .mt-h.tp:before{content:"";position:absolute;left:50%;top:-12px;margin-left:-5px;border:5px solid transparent;border-top-color:#59e08a}
#mjs .mj-hand .mt-h.hint:before{content:"";position:absolute;left:50%;top:-12px;margin-left:-5px;border:5px solid transparent;border-top-color:#ffd84a}
#mjs .mj-hand .mt-h.tp.hint:before{border-top-color:#ffd84a}
#mjs .mj-hand .mj-melds{margin-left:28px}
/* 左右面板 */
#mjs .mj-lpanel{position:absolute;left:12px;top:14px;width:236px;color:#e8e2cc;font-size:13px}
#mjs .mj-rpanel{position:absolute;right:12px;top:14px;width:236px;color:#e8e2cc;font-size:13px}
#mjs .mjc{display:block;background:rgba(20,16,12,.78);border:1px solid #6a5232;border-radius:10px;padding:10px 12px;margin-bottom:10px;box-shadow:0 4px 12px rgba(0,0,0,.4)}
#mjs .mjc h4{display:block;margin:0 0 6px;font:700 15px "Noto Serif TC",serif;color:#ffe9a8;letter-spacing:1px}
#mjs .mj-tg-row{display:flex;width:100%;box-sizing:border-box;gap:8px;justify-content:space-between;align-items:center;padding:4px 0;cursor:pointer}
#mjs .mj-sw{width:38px;height:20px;border-radius:10px;background:#555;position:relative;transition:.15s}
#mjs .mj-sw:after{content:"";position:absolute;left:2px;top:2px;width:16px;height:16px;border-radius:8px;background:#ddd;transition:.15s}
#mjs .mj-sw.on{background:#2f9a62}#mjs .mj-sw.on:after{left:20px;background:#fff}
#mjs .mj-waits{display:flex;flex-wrap:wrap;gap:6px;align-items:flex-end}
#mjs .mj-waits span{display:flex;flex-direction:column;align-items:center;font-size:11px;color:#bfe}
#mjs .mj-furi{color:#ff7a6a;font-weight:700}
#mjs .mj-btnbar{position:absolute;right:20px;top:676px;width:560px;display:flex;flex-wrap:wrap-reverse;justify-content:flex-end;gap:10px;pointer-events:none}
#mjs .mj-cb{pointer-events:auto;min-width:96px;height:52px;padding:0 18px;border:none;border-radius:26px;font:700 20px "Noto Serif TC",serif;letter-spacing:3px;color:#fff;cursor:pointer;box-shadow:0 4px 0 rgba(0,0,0,.35),0 8px 18px rgba(0,0,0,.45);animation:mjpop .18s ease-out}
#mjs .mj-cb:active{transform:translateY(2px)}
#mjs .mj-cb.chi{background:linear-gradient(#3a9ad8,#1f6aa8)}#mjs .mj-cb.pon{background:linear-gradient(#e0a03a,#b8741a)}#mjs .mj-cb.kan{background:linear-gradient(#8a5ad8,#5a32a8)}
#mjs .mj-cb.riichi{background:linear-gradient(#e86a3a,#c0401a)}#mjs .mj-cb.ron,#mjs .mj-cb.tsumo{background:linear-gradient(#ff4a4a,#c0141e);font-size:24px}
#mjs .mj-cb.pass{background:linear-gradient(#6a6a6a,#444)}#mjs .mj-cb.misc{background:linear-gradient(#4a8a6a,#2a6a4a);font-size:16px}
#mjs .mj-cb small{font-size:12px;letter-spacing:0;margin-left:6px}
@keyframes mjpop{from{transform:scale(.6);opacity:0}to{transform:none;opacity:1}}
#mjs .mj-chimenu{display:flex;gap:6px;pointer-events:auto;background:rgba(0,0,0,.6);padding:6px;border-radius:10px}
#mjs .mj-chimenu div{display:flex;cursor:pointer;padding:3px;border-radius:6px}#mjs .mj-chimenu div:hover{background:#ffffff22}
#mjs .mj-timer{position:absolute;right:30px;top:626px;font:700 26px "Noto Serif TC",serif;color:#fff;text-shadow:0 2px 6px #000}
#mjs .mj-timer .bk{color:#8fd4ff;font-size:20px}#mjs .mj-timer.warn{color:#ff6a5a}
#mjs .mj-ann{position:absolute;transform:translate(-50%,-50%);font:900 64px "Noto Serif TC",serif;color:#fff;-webkit-text-stroke:2px #8a1a10;text-shadow:0 0 18px #ff8a3a,0 6px 10px #000;pointer-events:none;animation:mjann 1.1s ease-out forwards;z-index:5;white-space:nowrap}
@keyframes mjann{0%{transform:translate(-50%,-50%) scale(2.2);opacity:0}15%{transform:translate(-50%,-50%) scale(1);opacity:1}75%{opacity:1}100%{transform:translate(-50%,-60%) scale(1);opacity:0}}
#mjs .mj-ovl{position:absolute;left:190px;top:60px;width:900px;min-height:560px;background:linear-gradient(#1b1410f2,#0e0a08f6);border:2px solid #c9a13a;border-radius:18px;box-shadow:0 20px 60px #000;color:#eee;padding:22px 30px;box-sizing:border-box;z-index:6;animation:mjpop .25s ease-out}
#mjs .mj-ovl h2{margin:0;font:900 40px "Noto Serif TC",serif;color:#ffe070;letter-spacing:6px;text-align:center;text-shadow:0 0 16px #ff9a3a}
#mjs .mj-ovl .mj-who{text-align:center;color:#ddd;margin:4px 0 12px;font-size:16px}
#mjs .mj-ovl .mj-wh{display:flex;justify-content:center;align-items:flex-end;margin:6px 0 12px}
#mjs .mj-ovl .mj-yl{display:grid;grid-template-columns:1fr 1fr;gap:4px 40px;margin:10px 30px;font:600 19px "Noto Serif TC",serif}
#mjs .mj-ovl .mj-yl div{display:flex;justify-content:space-between;border-bottom:1px dashed #5a4a32;padding:3px 0;opacity:0;animation:mjin .3s ease-out forwards}
@keyframes mjin{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:none}}
#mjs .mj-ovl .mj-tot{text-align:center;margin-top:14px;font:900 30px "Noto Serif TC",serif;color:#ffe070}
#mjs .mj-ovl .mj-tot .rk{display:inline-block;margin:0 10px;padding:2px 16px;border-radius:8px;background:linear-gradient(#e83a2a,#a01818);color:#fff;font-size:28px;letter-spacing:4px}
#mjs .mj-ovl .mj-dl{display:flex;justify-content:center;gap:14px;margin-top:14px;flex-wrap:wrap}
#mjs .mj-ovl .mj-dl div{background:#ffffff10;border-radius:8px;padding:6px 14px;min-width:150px;text-align:center}
#mjs .mj-ovl .mj-plus{color:#7ae08a}#mjs .mj-ovl .mj-minus{color:#ff7a6a}
#mjs .mj-ovl .doras{display:flex;gap:18px;justify-content:center;font-size:13px;color:#bbb;align-items:center}
#mjs .mj-ovl .doras>span{display:flex;gap:2px;align-items:center}
#mjs .mj-ovl .mj-bt{display:flex;justify-content:center;gap:14px;margin-top:18px}
#mjs .mj-ovl .mj-rank{display:grid;grid-template-columns:70px 1fr 120px 100px;gap:10px;align-items:center;font:700 22px "Noto Serif TC",serif;padding:10px 20px;border-bottom:1px solid #4a3a28}
#mjs .mj-ovl .mj-rank .n{font-size:34px;color:#ffe070}
#mjs .mj-ovl .mj-rank.me{background:#ffe07018;border-radius:10px}
#mjs .mj-gbtn{pointer-events:auto;padding:10px 26px;border-radius:24px;border:1px solid #c9a13a;background:linear-gradient(#5a3e22,#3a2614);color:#ffe9a8;font:700 17px "Noto Serif TC",serif;cursor:pointer}
#mjs .mj-gbtn:hover{filter:brightness(1.2)}
#mjs .mj-gbtn.sm{padding:5px 12px;font-size:13px}
#mjs .mj-msg{position:absolute;left:390px;top:350px;width:500px;text-align:center;color:#fff;font-size:15px;text-shadow:0 2px 4px #000;pointer-events:none}
#mjs .mj-lobbyc{position:absolute;left:340px;top:150px;width:600px;z-index:6}
#mjs .mj-lobbyc .mj-seat{display:flex;justify-content:space-between;padding:8px 12px;margin:6px 0;border-radius:8px;background:#ffffff0c;font-size:16px}
#mjs .mj-code{font:900 34px monospace;letter-spacing:6px;color:#ffe070;text-align:center}
`;
  const ensureCss = () => { if ($('mj2-css')) return; const st = document.createElement('style'); st.id = 'mj2-css'; st.textContent = CSS; document.head.appendChild(st); };

  // ---------------- 狀態 ----------------
  let ROOT = null, V = null, MODE = null, OFF = null, NET = null, SEL = null, CHIMENU = false, RIICHI = false, lastSeq = 0, autoT = null, offT = null, tickT = null, MUL = 1, rewardDone = false, order = [], dlAt = 0, dl = null, offTurn = null;
  const rel = s => (s - V.me + 4) % 4;
  const WIND = ['東', '南', '西', '北'];
  const roundName = v => (v.round >= 4 ? '南' : '東') + ' ' + (v.round % 4 + 1) + ' 局';

  const open = () => {
    ensureCss(); close(true);
    ROOT = document.createElement('div'); ROOT.id = 'mjs'; ROOT.innerHTML = '<div class="mj-stage" id="mjs-st"></div>'; document.body.appendChild(ROOT);
    if (R.W) R.W.paused = true;
    ac(); jaVoice();   // 一坐下就先把聲音和語音準備好（第一次出聲才建會慢一拍）
    fit(); window.addEventListener('resize', fit); document.addEventListener('keydown', onKey, true);
  };
  const fit = () => { const st = $('mjs-st'); if (!st) return; const k = Math.min(innerWidth / SW, innerHeight / SH); st.style.transform = 'scale(' + k + ')'; };
  const close = quiet => {
    clearTimeout(offT); clearTimeout(autoT); clearInterval(tickT);
    if (NET) { clearInterval(NET.dog); clearInterval(NET.ping); try { NET.ws.onclose = null; NET.ws.close(); } catch (e) { } NET = null; }
    if (ROOT) { ROOT.remove(); ROOT = null; window.removeEventListener('resize', fit); document.removeEventListener('keydown', onKey, true); if (!quiet && R.W) R.W.paused = false; }
    V = null; MODE = null; OFF = null;
  };
  const onKey = e => {
    if (!ROOT) return;
    if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); askLeave(); return; }
    e.stopPropagation();
  };
  const askLeave = () => {
    const done = V && V.phase === 'over';
    if (done || confirm(MODE === 'net' ? '離開線上牌桌？（電腦會接手你的座位）' : '離席？這一場作廢，桌費不退。')) { if (NET) try { NET.ws.send(JSON.stringify({ t: 'leave' })); } catch (e) { } close(); }
  };

  // ---------------- 畫面 ----------------
  const sortedHand = () => {
    const me = V.seats[V.me], h = (me.hand || []).slice(); if (!h.length) return [];
    let base = h.filter(t => t !== V.drawn);
    if (OPT.sort) base.sort((a, b) => a - b);
    else { order = order.filter(t => base.includes(t)); base.forEach(t => { if (!order.includes(t)) order.push(t); }); base = order.slice(); }
    if (V.drawn != null && h.includes(V.drawn)) base.push(V.drawn);
    return base;
  };
  const pondHtml = (o, isLastS, newT) => {
    let rows = [[], [], [], []], i = 0; const rv = o.river;
    rv.forEach((r, k) => { const row = Math.min(3, (k / 6) | 0); rows[row].push(tile(r.t, 'p', { side: k === o.riichiAt, cls: [r.taken ? 'taken' : '', r.tg ? 'tg' : '', isLastS && k === rv.length - 1 ? 'last' : '', newT && k === rv.length - 1 ? 'new' : ''].join(' ') })); i++; });
    return '<div class="mj-pond">' + rows.filter(r => r.length).map(r => '<div class="mj-prow">' + r.join('') + '</div>').join('') + '</div>';
  };
  // 副露：從誰那裡叫的那張橫放（上家＝左、對家＝中、下家＝右）
  const meldHtml = (m, s, sz) => {
    const from = m.from != null ? (m.from - s + 4) % 4 : 0, ts = m.tiles.slice();
    if (m.type === 'ankan') return '<div class="mj-meld">' + ts.map((t, i) => tile(i === 0 || i === 3 ? -1 : t, sz)).join('') + '</div>';
    let rest = ts.filter(t => t !== m.called && t !== m.kakan); const pos = from === 3 ? 0 : from === 2 ? 1 : rest.length;
    const out = rest.map(t => tile(t, sz)); out.splice(pos, 0, tile(m.called, sz, { side: true }) + (m.kakan != null ? '' : ''));
    if (m.kakan != null) out.splice(pos + 1, 0, tile(m.kakan, sz, { side: true }));
    return '<div class="mj-meld">' + out.join('') + '</div>';
  };
  const render = () => {
    if (!ROOT || !V) return;
    const st = $('mjs-st'), me = V.seats[V.me], op = V.opts, newEv = V.ev.filter(e => e.n > lastSeq);
    const lastNew = newEv.find(e => e.k === 'discard');
    let h = '<div class="mj-board">';
    // 中央
    const di = V.doraInd.concat([-1, -1, -1, -1, -1]).slice(0, 5);
    h += '<div class="mj-center"><div class="mj-cinfo"><div class="mj-rd">' + roundName(V) + '</div><div class="mj-sub">' + V.honba + ' 本場　供託 ' + V.kyotaku + '</div><div class="mj-left">餘 ' + V.left + ' 張</div><div class="mj-dora">' + di.map((d, i) => d >= 0 ? tile(d * 4 + 1, 'd') : tile(-1, 'd')).join('') + '</div></div></div>';
    V.seats.forEach((o, s) => {
      const r = rel(s), isTurn = V.turn === s && (V.phase === 'turn' || V.phase === 'claim' && false);
      h += '<div class="mj-side r' + r + '">';
      h += '<div class="mj-seatbox' + (V.turn === s && V.phase === 'turn' ? ' turn' : '') + '"><span class="w' + (o.wind === 0 ? ' oya' : '') + '">' + WIND[o.wind] + '</span>' + o.pts + (o.away ? ' <small>(離線)</small>' : '') + '</div>';
      if (o.riichi) h += '<div class="mj-stick"></div>';
      h += pondHtml(o, V.lastD && V.lastD.s === s && V.phase === 'claim', lastNew && lastNew.s === s);
      if (r !== 0) {
        h += '<div class="mj-tag">' + esc(o.name) + '</div>';
        const showH = o.hand && o.hand.length && (V.phase === 'over');
        h += '<div class="mj-ohand">' + (showH ? o.hand.map(t => tile(t, 'mo')).join('') : Array(o.n).fill(0).map(() => tile(-1, 'o')).join('')) + '<div class="mj-melds">' + o.melds.slice().reverse().map(m => meldHtml(m, s, 'mo')).join('') + '</div></div>';
      }
      h += '</div>'; void isTurn;
    });
    h += '</div>';
    // 自己的手牌
    const hand = sortedHand(), isTurn = op && op.kind === 'turn';
    const canDisc = isTurn ? new Set(RIICHI ? op.riichi : op.discard) : new Set();
    const tpSet = isTurn && !me.riichi ? new Set(op.riichi.length ? op.riichi : tenpaiDiscards(hand)) : new Set();
    h += '<div class="mj-hand">' + hand.map(t => {
      const cls = [t === V.drawn ? 'drawn' : '', isTurn && !canDisc.has(t) ? 'dim' : '', tpSet.has(t) ? 'tp' : '', SEL === t ? 'sel' : ''].join(' ');
      return tile(t, 'h', { cls, attr: ' data-t="' + t + '"' });
    }).join('') + '<div class="mj-melds">' + me.melds.slice().reverse().map(m => meldHtml(m, V.me, 'r')).join('') + '</div></div>';
    // 左面板
    h += '<div class="mj-lpanel"><div class="mjc"><h4>雀莊「東風」' + (MODE === 'net' ? '・線上 ' + esc(NET && NET.code || '') : '') + '</h4><div style="color:#bbb">' + esc(me.name) + '　' + WIND[me.wind] + '家' + (me.riichi ? '　<b style="color:#ff8a5a">立直中</b>' : '') + '</div></div>';
    h += '<div class="mjc"><h4>設定</h4>' + [['sort', '自動理牌'], ['win', '自動和牌'], ['nocall', '不吃碰槓'], ['tg', '自摸切（摸什麼打什麼）'], MODE === 'off' ? ['timer', '限時（5＋20 秒）'] : null, ['sound', '音效']].filter(Boolean).map(([k, n]) => '<div class="mj-tg-row" data-opt="' + k + '"><span>' + n + '</span><span class="mj-sw' + (OPT[k] ? ' on' : '') + '"></span></div>').join('') + '</div>';
    h += '<div class="mjc" id="mjs-wait">' + waitHtml(hand) + '</div>';
    h += '<div style="display:flex;gap:8px"><button class="mj-gbtn sm" id="mjs-rule">規則與役表</button><button class="mj-gbtn sm" id="mjs-x">離席</button></div></div>';
    // 右面板：分數表
    h += '<div class="mj-rpanel"><div class="mjc"><h4>點數</h4>' + [0, 1, 2, 3].map(k => { const s = (V.me + k) % 4, o = V.seats[s]; return '<div style="display:flex;justify-content:space-between;padding:3px 0' + (k === 0 ? ';color:#ffe070' : '') + '"><span>' + WIND[o.wind] + '　' + esc(o.name) + (o.away ? '（離線・電腦代打）' : '') + '</span><b>' + o.pts + '</b></div>'; }).join('') + '<div style="color:#999;margin-top:6px;font-size:12px">25000 持點・30000 返點・馬 +15/+5/−5/−15</div></div></div>';
    // 按鈕
    h += '<div class="mj-btnbar">' + buttons() + '</div>';
    h += '<div class="mj-timer" id="mjs-timer"></div>';
    if (V.phase === 'result' && V.result) h += resultHtml();
    if (V.phase === 'over' && V.final) h += finalHtml();
    st.innerHTML = h;
    bind();
    // 事件：聲音和宣告
    newEv.forEach(e => {
      if (e.k === 'discard') SND.discard();
      else if (e.k === 'draw' && e.s === V.me) SND.draw();
      else if (e.k === 'call') { SND.call(); ann(e.s, { chi: '吃', pon: '碰', kan: '槓', ankan: '槓', kakan: '槓' }[e.c]); }
      else if (e.k === 'tsumo') { SND.win(); e.s.forEach(s => ann(s, '自摸')); }
      else if (e.k === 'ron') { SND.win(); e.s.forEach(s => ann(s, '榮和')); }
      else if (e.k === 'ryuukyoku') SND.draw2();
      else if (e.k === 'dora') SND.dora();
      if (e.k === 'discard' && e.riichi) { SND.riichi(); ann(e.s, '立直'); }
    });
    if (V.ev.length) lastSeq = Math.max(lastSeq, V.ev[V.ev.length - 1].n);
    tickTimer();
  };
  const ANNPOS = [[640, 640], [900, 388], [640, 150], [380, 388]];
  const CALL = { 吃: 'チー', 碰: 'ポン', 槓: 'カン', 立直: 'リーチ', 自摸: 'ツモ', 榮和: 'ロン' };
  let JV; const jaVoice = () => { if (JV === undefined) { const vs = window.speechSynthesis ? speechSynthesis.getVoices() : []; if (vs.length) JV = vs.find(v => /^ja/i.test(v.lang)) || null; } return JV || null; };
  const shout = (s, txt) => {
    const sy = window.speechSynthesis; if (!OPT.sound || !sy || !CALL[txt]) return;
    try { const u = new SpeechSynthesisUtterance(CALL[txt]); u.voice = jaVoice(); u.lang = 'ja-JP'; u.pitch = [1, 0.7, 1.4, 0.9][rel(s)]; u.rate = 1.35; u.volume = 0.9; sy.cancel(); sy.speak(u); } catch (e) { }   // 2026-10-25 作者：音效有點延遲──不排隊（新的一句直接蓋掉還沒唸完的）
  };
  const ann = (s, txt) => { if (!txt || !ROOT) return; shout(s, txt); const p = ANNPOS[rel(s)], d = document.createElement('div'); d.className = 'mj-ann'; d.textContent = txt; d.style.left = p[0] + 'px'; d.style.top = p[1] + 'px'; $('mjs-st').appendChild(d); setTimeout(() => d.remove(), 1200); };
  const tenpaiDiscards = hand => { const me = V.seats[V.me]; if (hand.length % 3 !== 2) return []; const out = []; const seen = {}; hand.forEach(t => { const id = t >> 2; if (seen[id] == null) seen[id] = MJ.waitsIfDiscard(hand, t, me.melds.length).length > 0; if (seen[id]) out.push(t); }); return out; };
  const visibleCount = () => { const v = new Array(34).fill(0); V.seats.forEach(o => { o.river.forEach(r => { if (!r.taken) v[r.t >> 2]++; }); o.melds.forEach(m => m.tiles.forEach((t, i) => { if (!(m.type === 'ankan' && (i === 1 || i === 2) && o.i !== V.me)) v[t >> 2]++; })); }); V.doraInd.forEach(i => v[i]++); (V.seats[V.me].hand || []).forEach(t => v[t >> 2]++); return v; };
  const waitHtml = (hand, hoverTile) => {
    const me = V.seats[V.me]; let w = [], title = '聽牌';
    if (hoverTile != null && hand.length % 3 === 2) { w = MJ.waitsIfDiscard(hand, hoverTile, me.melds.length); title = '打 ' + MJ.tname(hoverTile >> 2) + ' 之後'; if (!w.length) return '<h4>' + title + '</h4><div style="color:#999">沒有聽牌</div>'; }
    else if (hand.length % 3 === 1) w = MJ.waits13(hand, me.melds.length);
    else { const td = tenpaiDiscards(hand); return '<h4>聽牌提示</h4><div style="color:#999">' + (td.length ? '綠色箭頭的牌打出去就聽牌。滑鼠移到牌上看等什麼。' : '還沒聽牌。') + '</div>'; }
    if (!w.length) return '<h4>聽牌</h4><div style="color:#999">還沒聽牌。</div>';
    const vis = visibleCount();
    return '<h4>' + title + '　等 ' + w.length + ' 種' + (hoverTile == null && V.furiten ? '　<span class="mj-furi">振聽</span>' : '') + '</h4><div class="mj-waits">' + w.map(k => '<span>' + tile(k * 4 + 1, 'd') + '剩 ' + Math.max(0, 4 - vis[k]) + '</span>').join('') + '</div>';
  };
  const buttons = () => {
    const op = V.opts; if (!op || V.phase === 'result' || V.phase === 'over') return '';
    const B = [];
    if (op.kind === 'turn') {
      if (op.tsumo) B.push('<button class="mj-cb tsumo" data-a="tsumo">自摸</button>');
      if (op.riichi.length) B.push('<button class="mj-cb riichi" data-a="riichi">' + (RIICHI ? '取消立直' : '立直') + '</button>');
      op.kans.forEach((k, i) => B.push('<button class="mj-cb kan" data-a="skan" data-i="' + i + '">' + (k.kind === 'ankan' ? '暗槓' : '加槓') + '<small>' + MJ.tname(k.id) + '</small></button>'));
      if (op.kyuushu) B.push('<button class="mj-cb misc" data-a="kyuushu">九種九牌</button>');
      if (op.tsumo && B.length) B.push('<button class="mj-cb pass" data-a="nowin">不和</button>');
    } else {
      if (CHIMENU) return '<div class="mj-chimenu">' + op.chi.map((u, i) => '<div data-a="chiu" data-i="' + i + '">' + u.concat([op.tile]).sort((a, b) => (a >> 2) - (b >> 2)).map(t => tile(t, 'd')).join('') + '</div>').join('') + '<button class="mj-cb pass" data-a="chix">返回</button></div>';
      if (op.ron) B.push('<button class="mj-cb ron" data-a="ron">' + (op.chankan ? '搶槓' : '榮和') + '</button>');
      if (op.kan) B.push('<button class="mj-cb kan" data-a="kan">槓</button>');
      if (op.pon.length) B.push('<button class="mj-cb pon" data-a="pon">碰</button>');
      if (op.chi.length) B.push('<button class="mj-cb chi" data-a="chi">吃</button>');
      B.push('<button class="mj-cb pass" data-a="pass">跳過</button>');
    }
    return B.join('');
  };
  const yakuRow = (v, i) => '<div style="animation-delay:' + (0.15 + i * 0.12) + 's"><span>' + esc(v[0]) + '</span><span>' + (typeof v[1] === 'string' ? v[1] : v[1] + ' 翻') + '</span></div>';
  const deltaHtml = d => '<div class="mj-dl">' + [0, 1, 2, 3].map(k => { const s = (V.me + k) % 4, o = V.seats[s], x = d ? d[s] : 0; return '<div><div style="color:#bbb">' + WIND[o.wind] + '　' + esc(o.name) + '</div><b style="font-size:20px">' + o.pts + '</b> ' + (x ? '<span class="' + (x > 0 ? 'mj-plus' : 'mj-minus') + '">' + (x > 0 ? '+' : '') + x + '</span>' : '') + '</div>'; }).join('') + '</div>';
  const resultHtml = () => {
    const r = V.result; let h = '<div class="mj-ovl">';
    if (r.kind === 'draw' || r.kind === 'abort') {
      h += '<h2>' + (r.kind === 'abort' ? '途中流局' : '流局') + '</h2><div class="mj-who">' + (r.why ? esc(r.why) : '牌山摸完了') + '</div>';
      if (r.ten) h += '<div class="mj-yl">' + V.seats.map((o, s) => '<div style="opacity:1;animation:none"><span>' + esc(o.name) + '</span><span class="' + (r.ten[s] ? 'mj-plus' : 'mj-minus') + '">' + (r.ten[s] ? '聽牌' : '不聽') + '</span></div>').join('') + '</div>';
      if (r.hands) r.hands.forEach((hd, s) => { if (hd && s !== V.me) h += '<div class="mj-wh">' + esc(V.seats[s].name) + '　' + hd.slice().sort((a, b) => a - b).map(t => tile(t, 'm')).join('') + '</div>'; });
      h += deltaHtml(r.delta);
    } else {
      const ws = r.wins; const w = ws[0], o = V.seats[w.s];
      h += '<h2>' + (r.kind === 'tsumo' ? '自摸' : '榮和') + (ws.length > 1 ? '・雙響' : '') + '</h2><div class="mj-who">' + ws.map(x => esc(V.seats[x.s].name)).join('、') + (r.kind === 'ron' ? '　←　' + esc(V.seats[r.from].name) + ' 放銃' : '') + '</div>';
      ws.forEach((x, wi) => {
        if (wi > 0) h += '<hr style="border-color:#4a3a28">';
        h += '<div class="mj-wh">' + x.hand.filter(t => t !== x.winT).map(t => tile(t, 'm')).join('') + '<span style="width:14px"></span>' + tile(x.winT, 'm', { cls: 'last' }) + '<div class="mj-melds">' + x.melds.map(m => meldHtml(m, x.s, 'm')).join('') + '</div></div>';
        h += '<div class="doras"><span>寶牌 ' + r.doraInd.map(d => tile(d * 4 + 1, 'd')).join('') + '</span>' + (x.riichi ? '<span>裏寶牌 ' + r.uraInd.map(d => tile(d * 4 + 1, 'd')).join('') + '</span>' : '') + '</div>';
        h += '<div class="mj-yl">' + x.y.yaku.map(yakuRow).join('') + '</div>';
        const pt = x.gain; h += '<div class="mj-tot">' + (x.y.yakuman ? '' : x.y.han + ' 翻 ' + x.y.fu + ' 符') + (x.y.rank ? '<span class="rk">' + x.y.rank + '</span>' : '') + ' ' + pt + ' 點' + (x.sticks ? '<small style="font-size:16px;color:#ccc">（＋供託 ' + x.sticks + '）</small>' : '') + '</div>';
        void o;
      });
      h += deltaHtml(r.delta);
    }
    const waitNote = MODE === 'net' ? '<div style="text-align:center;color:#999;font-size:12px;margin-top:8px">大家都按了（或 15 秒後）就開下一局</div>' : '';
    h += '<div class="mj-bt"><button class="mj-gbtn" id="mjs-next">' + (r.over ? '看終局結果' : '下一局') + '</button></div>' + waitNote + '</div>';
    return h;
  };
  const finalHtml = () => {
    const F = V.final; let h = '<div class="mj-ovl"><h2>終局</h2><div class="mj-who">' + (MODE === 'off' ? '倍率 ×' + MUL : '線上桌 ' + esc(NET ? NET.code : '')) + '</div>';
    F.rank.forEach((s, k) => { const o = V.seats[s], sc = F.score[k]; h += '<div class="mj-rank' + (s === V.me ? ' me' : '') + '"><span class="n">' + (k + 1) + '位</span><span>' + esc(o.name) + '</span><span>' + F.pts[k] + '</span><span class="' + (sc >= 0 ? 'mj-plus' : 'mj-minus') + '">' + (sc > 0 ? '+' : '') + sc.toFixed(1) + '</span></div>'; });
    const rk = F.rank.indexOf(V.me), pr = PRIZE[rk] * (MODE === 'off' ? MUL : 1);
    h += '<div style="text-align:center;margin-top:14px;font-size:18px;color:#7ae08a">' + (pr ? '獎金 ' + pr + ' 費拉' : '沒有獎金。下次再來。') + '</div><div style="text-align:center;color:#888;font-size:12px">順位點＝（點數 − 30000）÷ 1000 ＋ 馬（+15/+5/−5/−15）＋ 頭名 OKA +20</div>';
    h += '<div class="mj-bt">' + (MODE === 'off' ? '<button class="mj-gbtn" id="mjs-again">再打一場（' + FEE * MUL + ' 費拉）</button>' : (NET && NET.host === V.me ? '<button class="mj-gbtn" id="mjs-again">同一桌再來一場</button>' : '')) + '<button class="mj-gbtn" id="mjs-out">離開</button></div></div>';
    return h;
  };
  const bind = () => {
    const st = $('mjs-st');
    st.querySelectorAll('.mj-hand .mt-h').forEach(el => {
      const t = +el.dataset.t;
      el.onmouseenter = () => { const w = $('mjs-wait'); if (w && V.opts && V.opts.kind === 'turn') w.innerHTML = waitHtml(sortedHand(), t); };
      el.onmouseleave = () => { const w = $('mjs-wait'); if (w) w.innerHTML = waitHtml(sortedHand()); };
      el.onclick = () => clickTile(t);
    });
    st.querySelectorAll('[data-opt]').forEach(el => { el.onclick = () => { const k = el.dataset.opt; OPT[k] = !OPT[k]; saveOpt(); render(); autoPlay(); }; });
    st.querySelectorAll('[data-a]').forEach(el => { el.onclick = e => { e.stopPropagation(); button(el.dataset.a, +el.dataset.i); }; });
    const on = (id, f) => { const b = $(id); if (b) b.onclick = f; };
    on('mjs-x', askLeave); on('mjs-out', () => close()); on('mjs-rule', showRules);
    on('mjs-next', () => { if (MODE === 'off') { MJ.nextHand(OFF.G); offTick(); } else { netSend({ t: 'next' }); const b = $('mjs-next'); if (b) { b.disabled = true; b.textContent = '等其他人……'; } } });
    on('mjs-again', () => { if (MODE === 'off') { if (RANKED) MUL = rkMul(rkOf().lv); if (R.S.gold < FEE * MUL) { R.toast && R.toast('錢不夠（桌費 ' + FEE * MUL + ' 費拉）。'); return; } R.S.gold -= FEE * MUL; R.save && R.save(); startOffline(MUL, true); } else netSend({ t: 'again' }); });
  };
  const coarse = () => { try { return matchMedia('(pointer:coarse)').matches; } catch (e) { return false; } };
  const clickTile = t => {
    const op = V.opts; if (!op || op.kind !== 'turn') return;
    const ok = RIICHI ? op.riichi.includes(t) : op.discard.includes(t);
    if (!ok) { R.toast && R.toast(RIICHI ? '打這張就沒有聽牌了。' : V.seats[V.me].riichi ? '立直之後只能打摸到的牌。' : '剛吃碰的牌（或另一頭）不能馬上打（食替）。'); return; }
    if (coarse() && SEL !== t) { SEL = t; render(); return; }
    SEL = null; const r = RIICHI; RIICHI = false; doAct({ t: 'discard', tile: t, riichi: r });
  };
  const button = (a, i) => {
    const op = V.opts; if (!op) return;
    if (a === 'riichi') { RIICHI = !RIICHI; render(); return; }
    if (a === 'chi') { if (op.chi.length > 1) { CHIMENU = true; render(); return; } doAct({ t: 'chi', use: op.chi[0] }); return; }
    if (a === 'chix') { CHIMENU = false; render(); return; }
    if (a === 'chiu') { CHIMENU = false; doAct({ t: 'chi', use: op.chi[i] }); return; }
    if (a === 'pon') { doAct({ t: 'pon', use: op.pon[op.pon.length > 1 ? 1 : 0] }); return; }   // 有赤牌就用赤牌
    if (a === 'skan') { const k = op.kans[i]; doAct({ t: 'kan', kind: k.kind, id: k.id }); return; }
    if (a === 'nowin') { V.opts = Object.assign({}, op, { tsumo: false }); render(); return; }
    doAct({ t: a });
  };
  const doAct = a => {
    clearTimeout(autoT); CHIMENU = false;
    if (MODE === 'off') { if (MJ.act(OFF.G, OFF.me, a)) { offTurn = null; offTick(); } }
    else netSend({ t: 'act', a });
  };
  // 自動：自動和牌、不吃碰槓、自摸切、立直後摸切
  const autoPlay = () => {
    clearTimeout(autoT); const op = V && V.opts; if (!op || V.phase === 'result' || V.phase === 'over') return;
    let a = null, ms = 380; const me = V.seats[V.me];
    if (op.kind === 'turn') {
      if (op.tsumo && OPT.win) a = { t: 'tsumo' };
      else if (!op.tsumo && !op.kans.length && (me.riichi || (OPT.tg && !op.riichi.length)) && V.drawn != null) { a = { t: 'discard', tile: V.drawn }; ms = me.riichi ? 650 : 450; }
    } else {
      if (op.ron && OPT.win) a = { t: 'ron' };
      else if (!op.ron && OPT.nocall) { a = { t: 'pass' }; ms = 60; }
    }
    if (a) autoT = setTimeout(() => { if (V && V.opts) doAct(a); }, ms);
  };
  // 限時（線上一定有；單機可以開）
  const tickTimer = () => {
    clearInterval(tickT); const el = $('mjs-timer'); if (!el) return;
    const show = () => {
      const e2 = $('mjs-timer'); if (!e2 || !V || !V.opts) { if (e2) e2.innerHTML = ''; return; }
      let rem = null;
      if (MODE === 'net' && dl != null) rem = dl - (Date.now() - dlAt) / 1000;
      if (MODE === 'off' && OPT.timer && offTurn) rem = 5 + OFF.bank - (Date.now() - offTurn) / 1000;
      if (rem == null) { e2.innerHTML = ''; return; }
      rem = Math.max(0, rem); const bank = MODE === 'net' ? NET.bank : OFF.bank, base = Math.max(0, rem - bank);
      e2.className = 'mj-timer' + (rem < 4 ? ' warn' : ''); e2.innerHTML = base > 0 ? Math.ceil(base) + '<span class="bk">＋' + Math.ceil(bank) + '</span>' : '<span class="bk">' + Math.ceil(rem) + '</span>';
      if (MODE === 'off' && rem <= 0) { OFF.bank = 0; offTurn = null; const op = V.opts; doAct(op.kind === 'turn' ? { t: 'discard', tile: op.discard.includes(V.drawn) ? V.drawn : op.discard[op.discard.length - 1] } : { t: 'pass' }); }
    };
    show(); tickT = setInterval(show, 250);
  };

  // ---------------- 單機 ----------------
  const startOffline = (mul, again) => {
    MUL = mul; rewardDone = false; lastSeq = 0; order = [];
    const meName = (R.S && R.S.name) || '你', lv = RANKED ? rkOf().lv : 0, foes = FOES.slice().sort(() => Math.random() - 0.5).slice(0, 3).map(n => RANKED ? n + '（' + RANKS[Math.max(0, Math.min(RANKS.length - 1, lv + Math.floor(Math.random() * 5) - 2))] + '）' : n), me = Math.floor(Math.random() * 4), names = [], bots = [];
    for (let i = 0, k = 0; i < 4; i++) { names.push(i === me ? meName : foes[k++]); bots.push(i !== me); }
    if (!again || !ROOT) open();
    const G = MJ.newMatch({ names, bots }); MJ.startHand(G);
    OFF = { G, me, bank: 20, hands: G.hands }; MODE = 'off';
    offTick();
  };
  const offTick = () => {
    clearTimeout(offT); if (!OFF || !ROOT) return; const G = OFF.G;
    if (G.hands !== OFF.hands) { OFF.hands = G.hands; OFF.bank = 20; }
    V = MJ.view(G, OFF.me); RIICHI = RIICHI && V.opts && V.opts.kind === 'turn';
    if (V.opts && !offTurn) offTurn = Date.now(); if (!V.opts) offTurn = null;
    render(); rewards();
    if (G.phase === 'result' || G.phase === 'over') return;
    for (let s = 0; s < 4; s++) { if (s === OFF.me) continue; if (MJ.options(G, s)) { const isClaim = G.phase === 'claim'; offT = setTimeout(() => { let a = MJ.botAct(G, s); if (a && RANKED && a.t === 'discard' && !a.riichi && !G.seats[s].riichi && Math.random() < rkErr(rkOf().lv)) { const d = MJ.options(G, s).discard; a = { t: 'discard', tile: d[Math.floor(Math.random() * d.length)] }; } if (a) MJ.act(G, s, a); offTick(); }, isClaim ? 260 : 620); return; } }
    autoPlay();
  };
  // 戰績、稱號、獎金（舊的 R.S.mj 和 R.mjEvent 照用）
  const rewards = () => {
    if (!V || !R.S) return; const S = R.S; S.mj = S.mj || { games: 0, first: 0, wins: 0, best: 0, bestName: '' };
    if (V.phase === 'result' && V.result && V.result.wins && V.result.wins.some(w => w.s === V.me) && V.result.__seen !== true) {
      const key = V.hands + ':' + V.round + ':' + V.honba; if (rewards.k !== key) { rewards.k = key; const w = V.result.wins.find(x => x.s === V.me); S.mj.wins++; if (w.y.han > S.mj.best) { S.mj.best = w.y.han; S.mj.bestName = w.y.yaku.map(v => v[0]).join('・'); } R.mjEvent && R.mjEvent('win', { y: w.y, tsumo: V.result.kind === 'tsumo', mul: MODE === 'off' ? MUL : 1 }); R.save && R.save(); }
    }
    if (V.phase === 'over' && V.final && !rewardDone) {
      rewardDone = true; const rk = V.final.rank.indexOf(V.me), pr = PRIZE[rk] * (MODE === 'off' ? MUL : 1);
      S.mj.games++; if (!rk) S.mj.first++; S.gold += pr;
      if (MODE === 'off' && RANKED) {
        const r = rkOf(), g = rkGain(r.lv, rk), was = r.lv; r.pt += g;
        if (r.pt >= rkNeed(r.lv) && r.lv < RANKS.length - 1) { r.pt -= rkNeed(r.lv); r.lv++; } else if (r.pt < 0) { if (r.lv >= 10) { r.lv--; r.pt = Math.floor(rkNeed(r.lv) / 2); } else r.pt = 0; }
        r.best = Math.max(r.best || 0, r.lv);
        setTimeout(() => R.toast && R.toast('段位戰・第 ' + (rk + 1) + ' 名：段位分 ' + (g >= 0 ? '+' : '') + g + (r.lv > was ? '──升到「' + RANKS[r.lv] + '」！' : r.lv < was ? '──降到「' + RANKS[r.lv] + '」' : '（' + RANKS[r.lv] + ' ' + r.pt + '／' + rkNeed(r.lv) + '）'), r.lv > was ? '#E8C04A' : r.lv < was ? '#FF9A6A' : '#CFE8FF'), 600);
      }
      R.save && R.save(); R.mjEvent && R.mjEvent('end', { rk, pr, mul: MODE === 'off' ? MUL : 1 });
    }
  };

  // ---------------- 線上 ----------------
  const netSend = o => { if (NET && NET.ws && NET.ws.readyState === 1) NET.ws.send(JSON.stringify(o)); };
  const tokKey = code => 'tf-mj-tok-' + code;
  const startNet = code => {
    code = String(code || '').toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 12); if (!code) return;
    if (!R.S || R.S.gold < FEE) { R.toast && R.toast('錢不夠（線上桌桌費 ' + FEE + ' 費拉）。'); return; }
    open(); MODE = 'net'; rewardDone = false; lastSeq = 0; order = []; V = null;
    NET = { code, ws: null, tries: 0, lobby: null, host: -1, bank: 20, paid: false };
    lobbyScreen('連線中……');
    connect();
  };
  const connect = () => {
    if (!NET) return; let ws;
    try { ws = new WebSocket(serverBase() + '/mj/' + NET.code); } catch (e) { lobbyScreen('連不上伺服器。'); return; }
    NET.ws = ws;
    ws.onopen = () => { NET.tries = 0; let tok = ''; try { tok = localStorage.getItem(tokKey(NET.code)) || ''; } catch (e) { } ws.send(JSON.stringify({ t: 'hello', name: (R.S && R.S.name) || '勇者', token: tok })); clearInterval(NET.ping); NET.ping = setInterval(() => { try { ws.send('ping'); } catch (e) { } }, 15000); };
    // 看門狗：連線卡在「關閉中」或太久沒回應，就自己重連（不等 onclose）
    NET.lastMsg = Date.now(); clearInterval(NET.dog); NET.dog = setInterval(() => { if (!NET || NET.ws !== ws) { clearInterval(NET && NET.dog); return; } if ((ws.readyState >= 2 && Date.now() - (NET.closedAt || (NET.closedAt = Date.now())) > 1500) || Date.now() - NET.lastMsg > 45000) { clearInterval(NET.dog); const f = ws.onclose; ws.onclose = null; NET.closedAt = 0; try { ws.close(); } catch (e) { } f && f(); } }, 1000);
    ws.onmessage = e => {
      NET.lastMsg = Date.now(); NET.closedAt = 0; if (e.data === 'pong') return; let o; try { o = JSON.parse(e.data); } catch (er) { return; }
      if (o.t === 'token') { try { localStorage.setItem(tokKey(NET.code), o.token); } catch (er) { } return; }
      if (o.t === 'err') { R.toast && R.toast(o.msg); lobbyScreen(o.msg); return; }
      if (o.t === 'lobby') { NET.lobby = o; NET.host = o.host; if (o.started && !NET.paid) { NET.paid = true; R.S.gold -= FEE; R.save && R.save(); } if (!o.started) { V = null; lobbyScreen(); } return; }
      if (o.t === 'state') {
        const prevPhase = V && V.phase; V = o.v; dl = o.dl; dlAt = Date.now(); NET.bank = o.bank || 0;
        if (prevPhase === 'over' && V.phase !== 'over') { rewardDone = false; if (MODE === 'net' && R.S) { R.S.gold = Math.max(0, R.S.gold - FEE); R.save && R.save(); R.toast && R.toast('再打一局：桌費 ' + FEE + ' 費拉。'); } }   // 2026-10-16 修正：線上桌「再打一局」原本不收桌費、照樣發獎金
        RIICHI = RIICHI && V.opts && V.opts.kind === 'turn'; if (!V.opts) { CHIMENU = false; SEL = null; }
        render(); rewards(); autoPlay();
      }
    };
    ws.onclose = () => { clearInterval(NET && NET.ping); if (!NET || NET.ws !== ws) return; if (NET.tries++ < 30) { R.toast && NET.tries === 1 && R.toast('斷線了，重新連線中……（電腦先幫你打）'); setTimeout(connect, Math.min(8000, 600 * NET.tries)); } else lobbyScreen('斷線了。'); };
  };
  const lobbyScreen = msg => {
    if (!ROOT || V) return; const st = $('mjs-st'), L = NET && NET.lobby;
    let h = '<div class="mj-board"></div><div class="mj-ovl mj-lobbyc"><h2>線上牌桌</h2><div class="mj-who">把桌號告訴朋友，在雀莊選「加入線上桌」輸入；隊伍裡的人可以按「和隊伍同桌」。</div><div class="mj-code">' + esc(NET ? NET.code : '') + '</div>';
    if (L) { h += L.seats.map((x, i) => '<div class="mj-seat"><span>' + WIND[i] + ' 位</span><span>' + (x ? esc(x.name) + (i === L.you ? '（你）' : '') + (i === L.host ? '　★桌主' : '') + (x.on ? '' : '（離線）') : '<span style="color:#888">空位（開始時由電腦補上）</span>') + '</span></div>').join(''); }
    h += '<div class="mj-who" style="margin-top:12px">' + esc(msg || (L ? (L.you === L.host ? '人到齊了就按「開始」。空位會由電腦補上。' : '等桌主開始……') : '')) + '</div>';
    h += '<div class="mj-bt">' + (L && L.you === L.host ? '<button class="mj-gbtn" id="mjs-start">開始（桌費 ' + FEE + ' 費拉）</button>' : '') + '<button class="mj-gbtn" id="mjs-out">離開</button></div></div>';
    st.innerHTML = h;
    const b = $('mjs-start'); if (b) b.onclick = () => netSend({ t: 'start' });
    $('mjs-out').onclick = () => { netSend({ t: 'leave' }); close(); };
  };

  // ---------------- 規則 ----------------
  const showRules = () => {
    const d = document.createElement('div'); d.className = 'mj-ovl'; d.style.overflow = 'auto'; d.style.maxHeight = '740px';
    d.innerHTML = '<h2 style="font-size:28px">規則與役表</h2><div style="font-size:14px;line-height:1.7;color:#ddd">' + RULES + '</div><div class="mj-bt"><button class="mj-gbtn">關閉</button></div>';
    d.querySelector('button').onclick = () => d.remove(); $('mjs-st').appendChild(d);
  };
  const RULES = '<b>東風戰（四人）</b>：25000 點開始，東一局到東四局；莊家和了或流局聽牌就連莊（本場 +1，每本場和了多 300 點）。東四局結束沒人到 30000 點就進南場延長，有人到 30000 立刻結束。有人點數變負的也結束。'
    + '<br><b>和牌</b>：四組面子＋一對雀頭、七對子、國士無雙；一定要有役（寶牌不算役）。<b>立直</b>：門清聽牌時押 1000 點，之後只能摸切；一發、裏寶牌。<b>振聽</b>：等的牌自己打過、或見逃了榮和（同巡、立直後），就不能榮和，自摸可以。'
    + '<br><b>吃碰槓</b>：吃只能吃上家；碰、明槓誰的都行；暗槓、加槓在自己的回合。槓了翻一張槓寶牌、摸嶺上牌；加槓的那張可以被「搶槓」。吃碰之後不能馬上打同一張（食替）。赤五萬、赤五筒、赤五索各一張，一張算一翻寶牌。'
    + '<br><b>流局</b>：牌山摸完，聽牌的人平分沒聽牌的人付的 3000 點；第一巡九種九牌可以宣告流局；四家立直、三家和也流局。'
    + '<br><b>點數</b>：照翻數和符數算（符：底符 20、門清榮和 +10、自摸 +2、刻子槓子、役牌雀頭、坎張邊張單騎 +2；七對子 25 符；平和自摸 20 符）。5 翻滿貫、6 跳滿、8 倍滿、11 三倍滿、13 累計役滿。'
    + '<br><b>終局</b>：順位點＝（點數−30000）÷1000＋馬（+15／+5／−5／−15），第一名再加 OKA +20。單機桌的獎金照順位：第一名 ' + PRIZE[0] + '、第二名 ' + PRIZE[1] + '、第三名 ' + PRIZE[2] + ' 費拉（乘上倍率）。'
    + '<br><b>一翻</b>：立直、一發、門前清自摸和、斷么九、平和、一盃口、役牌（白發中、自風、場風）、海底摸月、河底撈魚、嶺上開花、搶槓。'
    + '<br><b>二翻</b>：兩立直、七對子、三色同順（副露 1）、一氣通貫（副露 1）、混全帶么九（副露 1）、對對和、三暗刻、三色同刻、三槓子、小三元、混老頭。'
    + '<br><b>三翻</b>：二盃口、純全帶么九（副露 2）、混一色（副露 2）。<b>六翻</b>：清一色（副露 5）。'
    + '<br><b>役滿</b>：天和、地和、國士無雙（十三面雙倍）、四暗刻（單騎雙倍）、大三元、小四喜、大四喜（雙倍）、字一色、清老頭、綠一色、九蓮寶燈（純正雙倍）、四槓子。'
    + '<br><b>操作</b>：點牌打出（手機先點一下選、再點一下打）；綠色箭頭＝打了會聽牌，滑鼠移上去看等什麼牌、還剩幾張。左邊可以開關自動理牌、自動和牌、不吃碰槓、自摸切。Esc 離席。';

  // ---------------- 入口 ----------------
  R.mahjong = () => {
    const S = R.S; S.mj = S.mj || { games: 0, first: 0, wins: 0, best: 0, bestName: '' };
    const st = S.mj.games ? '你的戰績：' + S.mj.games + ' 場、第一名 ' + S.mj.first + ' 次、和了 ' + S.mj.wins + ' 次' + (S.mj.best ? '、最大 ' + S.mj.best + ' 翻（' + esc(S.mj.bestName) + '）' : '') + '。' : '第一次來？桌上有聽牌提示，不懂可以按「規則與役表」。';
    const last = MULS.includes(S.mj.mul) ? S.mj.mul : 1, party = R.net && R.net.room ? 'P' + String(R.net.room).replace(/[^0-9A-Z]/gi, '').toUpperCase() : '';
    R.sheet('<p class="kicker">繁華街・二樓</p><h2>雀莊「東風」</h2><p class="note">日式立直麻將・四人東風戰（25000 點開始，赤寶牌三張、有食斷、有一發和裏寶牌）。' + st + '</p>'
      + (() => { const r = rkOf(), m = rkMul(r.lv); return '<h3>段位戰</h3><p class="note">現在：<b>' + RANKS[r.lv] + '</b>（段位分 ' + r.pt + '／' + rkNeed(r.lv) + '' + (r.best > r.lv ? '・最高 ' + RANKS[r.best] : '') + '）。第一名 +60、第二名 +25，三、四名扣分（七級以下不扣）；段位以上扣到負的會降段。段位越高，對手越強、桌費和獎金越高（現在 ×' + m + '）。</p><div class="row"><button type="button" class="btn pri" id="mj-rank"' + (S.gold < FEE * m ? ' disabled' : '') + '>打段位戰（' + FEE * m + ' 費拉）</button></div>'; })()
      + '<h3>和電腦打</h3><p class="note">要賭幾倍？桌費和獎金照倍數算：' + MULS.map(m => '×' + m + ' 桌費 ' + FEE * m + '、第一名 ' + PRIZE[0] * m).join('；') + '。</p>'
      + '<div class="row">' + MULS.map(m => '<button type="button" class="btn' + (m === last ? ' pri' : '') + '" data-mjmul="' + m + '"' + (S.gold < FEE * m ? ' disabled' : '') + '>×' + m + '（' + FEE * m + ' 費拉）</button>').join('') + '</div>'
      + '<h3>線上牌桌</h3><p class="note">和其他玩家同桌（1–4 人，空位由電腦補上；斷線的時候電腦代打，連回來就接手）。洗牌和發牌都在伺服器，看不到別人的牌。桌費 ' + FEE + ' 費拉，獎金照 ×1。</p>'
      + '<div class="row"><button type="button" class="btn pri" id="mj-new">開新的一桌</button>' + (party ? '<button type="button" class="btn" id="mj-party">和隊伍同桌（' + esc(party) + '）</button>' : '') + '<input id="mj-code" maxlength="8" placeholder="桌號" style="width:7em;text-transform:uppercase"><button type="button" class="btn" id="mj-join">加入線上桌</button></div>',
      '<div class="row"><button type="button" class="btn" id="mj-no">算了</button></div>');
    $('mj-no').onclick = R.closeSheet;
    document.querySelectorAll('[data-mjmul]').forEach(b => { b.onclick = () => {
      const m = +b.dataset.mjmul; if (S.gold < FEE * m) { R.toast('錢不夠（桌費 ' + FEE * m + ' 費拉）。'); return; }
      S.mj.mul = m; S.gold -= FEE * m; R.save && R.save(); R.closeSheet(); RANKED = false; startOffline(m);
    }; });
    $('mj-rank').onclick = () => { const m = rkMul(rkOf().lv); if (S.gold < FEE * m) { R.toast('錢不夠（桌費 ' + FEE * m + ' 費拉）。'); return; } S.gold -= FEE * m; R.save && R.save(); R.closeSheet(); RANKED = true; startOffline(m); };
    const go = code => { R.closeSheet(); startNet(code); };
    $('mj-new').onclick = () => { const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let c = ''; for (let i = 0; i < 5; i++) c += L[Math.floor(Math.random() * L.length)]; go(c); };
    if ($('mj-party')) $('mj-party').onclick = () => go(party);
    $('mj-join').onclick = () => { const c = ($('mj-code').value || '').trim(); if (!c) { R.toast('先輸入桌號。'); return; } go(c); };
  };
  // 測試用
  R.mj2Debug = { get V() { return V; }, get OFF() { return OFF; }, startOffline, startNet, close, OPT, act: doAct, tick: () => offTick(), get NET() { return NET; } };
})(window.R);
