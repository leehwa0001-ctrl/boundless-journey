// 討伐令 1433：雀莊「東風」的線上牌桌（一桌一個 Durable Object，名字＝桌號）。2026-10-13
// 伺服器權威：牌山、洗牌、四家的手牌都只在這裡；每個人只收到 MJ.view(G, 自己的座位)（看不到別人的手牌和牌山）。
// 1–4 個真人，空位和斷線的人由電腦代打；限時：每次 5 秒＋每局 20 秒的長考時間，超時自動摸切／跳過。
// 斷線：座位保留（token 記在玩家的瀏覽器），連回來就接回；不在的時候電腦代打。
// 訊息（JSON）：
//   用戶端 → { t:'hello', name, token }、{ t:'start' }（桌主）、{ t:'act', a }、{ t:'next' }、{ t:'again' }（桌主）、{ t:'leave' }、'ping'
//   伺服器 → { t:'lobby', code, you, host, seats:[{ name, human, on }], started }、{ t:'state', v, dl（你的剩餘秒數）, bank }、{ t:'err', msg }、'pong'
import MJmod from '../mjcore.js';
const MJ = MJmod && MJmod.evalWin ? MJmod : globalThis.MJCore;
const BASE_S = 5, BANK_S = 20, NEXT_S = 15, BOT_MS = 650;
const BOTN = ['電腦・玉枝', '電腦・權藏', '電腦・新田', '電腦・小雀'];
const clean = (v, n) => String(v == null ? '' : v).replace(/[<>]/g, '').slice(0, n);

export class MjTable {
  constructor(state) { this.state = state; this.code = ''; this.seats = [null, null, null, null]; this.G = null; this.host = -1; this.socks = new Set(); this.timers = {}; this.bank = [BANK_S, BANK_S, BANK_S, BANK_S]; this.turnStart = {}; this.ready = new Set(); this.botT = null; this.nextT = null; this.handN = -1; }
  async fetch(req) {
    const u = new URL(req.url); this.code = this.code || clean(u.pathname.split('/')[2], 12).toUpperCase();
    if ((req.headers.get('Upgrade') || '').toLowerCase() !== 'websocket') return new Response('mj ok\n');
    const [client, server] = Object.values(new WebSocketPair());
    server.accept(); const c = { ws: server, seat: -1, rt: { t: Date.now(), n: 30 } }; this.socks.add(c);
    server.addEventListener('message', e => { try { this.onMsg(c, e.data); } catch (err) { console.log('[mj] err', err && err.stack); } });
    const bye = () => { try { server.close(1000, 'bye'); } catch (e) { } if (!this.socks.has(c)) return; this.socks.delete(c); this.drop(c); };
    server.addEventListener('close', bye); server.addEventListener('error', bye);
    return new Response(null, { status: 101, webSocket: client });
  }
  send(c, o) { try { c.ws.send(typeof o === 'string' ? o : JSON.stringify(o)); } catch (e) { } }
  rate(c) { const now = Date.now(); c.rt.n = Math.min(30, c.rt.n + (now - c.rt.t) / 1000 * 15); c.rt.t = now; if (c.rt.n < 1) return false; c.rt.n--; return true; }
  onMsg(c, raw) {
    if (raw === 'ping') return this.send(c, 'pong');
    if (typeof raw !== 'string' || raw.length > 4000 || !this.rate(c)) return;
    let o; try { o = JSON.parse(raw); } catch (e) { return; } if (!o || typeof o.t !== 'string') return;
    if (o.t === 'hello') return this.hello(c, o);
    const s = c.seat; if (s < 0) return;
    if (o.t === 'start' && s === this.host && !this.G) return this.start();
    if (o.t === 'again' && s === this.host && this.G && this.G.phase === 'over') { this.G = null; return this.start(); }
    if (o.t === 'leave') { this.seats[s].left = true; this.seats[s].ws = null; c.seat = -1; if (!this.G) this.seats[s] = null; this.fixHost(); this.lobby(); this.sync(); return; }
    if (!this.G) return;
    if (o.t === 'act' && o.a && typeof o.a === 'object') {
      const a = { t: clean(o.a.t, 10), tile: +o.a.tile, riichi: !!o.a.riichi, kind: clean(o.a.kind, 6), id: +o.a.id, use: Array.isArray(o.a.use) ? o.a.use.slice(0, 2).map(Number) : undefined };
      this.useBank(s);
      if (MJ.act(this.G, s, a)) this.after(); else this.sendState(this.seats[s]);
      return;
    }
    if (o.t === 'next' && this.G.phase === 'result') { this.ready.add(s); if (this.humansOn().every(i => this.ready.has(i))) this.advance(); }
  }
  hello(c, o) {
    const name = clean(o.name, 16) || '無名的勇者', token = clean(o.token, 40);
    let s = this.seats.findIndex(x => x && x.token && token && x.token === token);
    if (s < 0) {
      if (this.G) return this.send(c, { t: 'err', msg: '這桌已經開打了（等這一場結束，或開新的一桌）。' });
      s = this.seats.findIndex(x => !x); if (s < 0) return this.send(c, { t: 'err', msg: '這桌滿了（4 個人）。' });
      this.seats[s] = { name, token: token || Math.random().toString(36).slice(2, 12), human: true, ws: null };
    }
    const seat = this.seats[s];
    if (seat.ws && seat.ws !== c) { const old = [...this.socks].find(x => x === seat.ws); if (old) { old.seat = -1; try { old.ws.close(1000, 'replaced'); } catch (e) { } } }
    seat.ws = c; seat.left = false; seat.name = seat.name || name; c.seat = s;
    if (this.G) this.G.seats[s].away = false;
    this.fixHost(); this.lobby(); this.send(c, { t: 'token', token: seat.token, seat: s });
    if (this.G) { this.sync(); }
  }
  drop(c) {
    const s = c.seat; if (s < 0 || !this.seats[s] || this.seats[s].ws !== c) return;
    this.seats[s].ws = null;
    if (!this.G) this.seats[s] = null; else { this.G.seats[s].away = true; }
    this.fixHost(); this.lobby();
    if (this.G) this.after();
  }
  humansOn() { return this.seats.map((x, i) => x && x.ws ? i : -1).filter(i => i >= 0); }
  fixHost() { if (this.host >= 0 && this.seats[this.host] && this.seats[this.host].ws) return; const on = this.humansOn(); this.host = on.length ? on[0] : -1; }
  lobby() {
    const seats = this.seats.map((x, i) => x ? { name: x.name, human: true, on: !!x.ws } : (this.G ? { name: this.G.seats[i].name, human: false, on: true } : null));
    this.socks.forEach(c => { if (c.seat >= 0) this.send(c, { t: 'lobby', code: this.code, you: c.seat, host: this.host, seats, started: !!this.G }); });
  }
  start() {
    // 真人坐的位置隨機換一下（起家隨機）
    const names = [], bots = []; let k = 0;
    for (let i = 0; i < 4; i++) { const x = this.seats[i]; names.push(x ? x.name : BOTN[k++]); bots.push(!x); }
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    this.G = MJ.newMatch({ names, bots, seed });
    for (let i = 0; i < 4; i++) if (this.seats[i] && !this.seats[i].ws) this.G.seats[i].away = true;
    MJ.startHand(this.G); this.bank = [BANK_S, BANK_S, BANK_S, BANK_S]; this.handN = this.G.hands; this.ready.clear();
    this.lobby(); this.after();
  }
  ai(s) { return !this.seats[s] || !this.seats[s].ws || this.seats[s].left; }
  // 每次狀態變了：送畫面、排電腦、排限時
  after() {
    const G = this.G; if (!G) return;
    if (G.hands !== this.handN) { this.handN = G.hands; this.bank = [BANK_S, BANK_S, BANK_S, BANK_S]; }
    clearTimeout(this.botT); this.botT = null;
    Object.keys(this.timers).forEach(k => { clearTimeout(this.timers[k]); }); this.timers = {};
    if (G.phase === 'result') {
      clearTimeout(this.nextT); this.ready.clear();
      this.nextT = setTimeout(() => this.advance(), NEXT_S * 1000);
      if (!this.humansOn().length) { clearTimeout(this.nextT); this.nextT = setTimeout(() => this.advance(), 3000); }
    }
    const now = Date.now();
    for (let s = 0; s < 4; s++) {
      const op = MJ.options(G, s); if (!op) { delete this.turnStart[s]; continue; }
      if (this.ai(s)) { if (!this.botT) this.botT = setTimeout(() => { this.botT = null; this.botStep(); }, this.humansOn().length ? BOT_MS : 30); continue; }
      if (this.turnStart[s] == null || this.turnStart[s].key !== G.seq) this.turnStart[s] = { t: now, key: G.seq };
      const ms = (BASE_S + this.bank[s]) * 1000 - (now - this.turnStart[s].t);
      this.timers[s] = setTimeout(() => this.timeout(s), Math.max(0, ms) + 300);
    }
    this.sync();
  }
  useBank(s) { const ts = this.turnStart[s]; if (!ts) return; const used = (Date.now() - ts.t) / 1000 - BASE_S; if (used > 0) this.bank[s] = Math.max(0, this.bank[s] - used); delete this.turnStart[s]; }
  timeout(s) {
    const G = this.G; if (!G) return; const op = MJ.options(G, s); if (!op) return;
    this.bank[s] = 0; delete this.turnStart[s];
    const a = op.kind === 'turn' ? { t: 'discard', tile: G.drawn != null && op.discard.includes(G.drawn) ? G.drawn : op.discard[op.discard.length - 1] } : { t: 'pass' };
    if (MJ.act(G, s, a)) this.after();
  }
  botStep() {
    const G = this.G; if (!G || G.phase === 'result' || G.phase === 'over') return;
    for (let s = 0; s < 4; s++) { if (!this.ai(s)) continue; const a = MJ.botAct(G, s); if (a && MJ.act(G, s, a)) { this.after(); return; } }
  }
  advance() {
    clearTimeout(this.nextT); this.nextT = null;
    if (!this.G || this.G.phase !== 'result') return;
    MJ.nextHand(this.G); this.after();
  }
  sendState(seat) {
    if (!seat || !seat.ws) return; const s = seat.ws.seat, G = this.G; if (!G || s < 0) return;
    const v = MJ.view(G, s), ts = this.turnStart[s];
    const dl = ts ? Math.max(0, BASE_S + this.bank[s] - (Date.now() - ts.t) / 1000) : null;
    this.send(seat.ws, { t: 'state', v, dl, base: BASE_S, bank: Math.round(this.bank[s] * 10) / 10, ready: [...this.ready] });
  }
  sync() { this.seats.forEach(x => this.sendState(x)); }
}
