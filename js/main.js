// The Explainable Grover's Search: "bigger" means "more likely", never a colour.
import {
  initialState, groverStep, probabilities, optimalIterations, theoreticalProbability, sampleIndex,
} from './grover_sim.js';
import { createExplainer } from './explain.js';
import { createIntro } from './intro.js';
import { createQuantum } from './quantum.js';

const SIZES = [16, 64];
const MAX_LAYERS = 40;
const SHOTS = 1000;
const $ = (s) => document.querySelector(s);
const rand = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const S = { N: 16, target: 0, k: 0, psi: null, shown: null, measured: null, measuring: false, wins: 0, rounds: 0, raf: 0, focus: 0 };
const side = () => Math.round(Math.sqrt(S.N));
const qubits = () => Math.log2(S.N);
const ket = (i) => `|${i.toString(2).padStart(qubits(), '0')}⟩`;
const ratio = (amp) => Math.abs(amp) * Math.sqrt(S.N); // size relative to the starting size
const pctf = (p) => `${(p * 100).toFixed(p < 0.1 || (p > 0.99 && p < 1) ? 1 : 0)}%`; // never round 99.7% up to 100%
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const explainer = createExplainer({
  amps: $('#amps'), dial: $('#dial'), caption: $('#explain-caption'), kLabel: $('#explain-k'),
  phases: $('#phases'), play: $('#play'), reduced,
});
const intro = createIntro({
  story: $('#story'), text: $('#story-text'), dots: $('#story-dots'), next: $('#story-next'), skip: $('#story-skip'),
  lab: $('.lab'), console: $('.console'), board: $('#board'), onDone: () => $('#add').focus(),
});
let briefed = false; // the story plays once, after the first fill

// ---------- quantum backend: measurements run the real Qiskit circuit when the platform provides one
const quantum = createQuantum({ onStatus: showEngine });
function showEngine({ state, name, reason }) {
  const chip = $('#engine');
  chip.dataset.state = state;
  chip.textContent = state === 'online' ? `Backend: ${name}` : state === 'connecting' ? 'Backend: connecting…' : 'Exact simulation';
  chip.title = state === 'offline' ? `No quantum backend (${reason}). Measurements sample the exact simulation.` : '';
  $('#engine-note').textContent = state === 'online'
    ? `Measurements run your Grover circuit in Qiskit on ${name}. The bars and dial show the exact amplitudes that circuit should produce.`
    : 'Simulated exactly on a classical computer (Born rule probabilities, browser random sampling). It shows how the algorithm works, not a speed-up on real hardware.';
}

// ---------- theme: the two Stitch design systems
function setTheme(name) {
  document.documentElement.dataset.theme = name;
  $('#theme').setAttribute('aria-pressed', String(name === 'contrast'));
  try { localStorage.setItem('grover-theme', name); } catch { /* storage blocked */ }
  drawChart();
  explainer.redraw();
}
$('#theme').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'contrast' ? 'aether' : 'contrast'));
$('#theme').setAttribute('aria-pressed', String(document.documentElement.dataset.theme === 'contrast'));

// ---------- audio (optional): pitch and loudness follow size, not colour
let audio = null;
function tone(rel) {
  if (!$('#sound').checked) return;
  audio = audio || new AudioContext();
  const o = audio.createOscillator();
  const g = audio.createGain();
  o.frequency.value = 220 * Math.min(4, Math.max(0.3, rel));
  g.gain.value = Math.min(0.25, 0.05 * rel);
  o.connect(g).connect(audio.destination);
  o.start();
  o.stop(audio.currentTime + 0.18);
}

// ---------- setup
function buildSizes() {
  const box = $('#sizes');
  for (const n of SIZES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn small';
    b.dataset.n = n;
    b.textContent = `${n} items · ${Math.log2(n)} qubits`;
    b.addEventListener('click', () => newRound(n));
    box.append(b);
  }
}

function buildBoard() {
  const board = $('#board');
  board.style.gridTemplateColumns = `repeat(${side()}, 1fr)`;
  board.style.setProperty('--n', S.N);
  board.replaceChildren();
  const showNumbers = S.N <= 16;
  for (let i = 0; i < S.N; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cell';
    b.setAttribute('role', 'gridcell');
    b.dataset.i = i;
    b.tabIndex = i === S.focus ? 0 : -1;
    // drop order, row (how far it falls) and a random candy colour; hues near red are skipped on purpose
    b.style.setProperty('--i', i);
    b.style.setProperty('--r', Math.floor(i / side()));
    b.style.setProperty('--gum', `hsl(${30 + Math.floor(rand() * 300)} 85% 62%)`);
    b.innerHTML = '<svg viewBox="-50 -50 100 100" aria-hidden="true">'
      + '<circle class="ring outer" r="49"></circle><circle class="ring" r="42"></circle>'
      + '<circle class="ball" r="10"></circle><circle class="gum" r="10"></circle>'
      + (showNumbers ? `<text class="num" x="-46" y="-32">${i + 1}</text>` : '')
      + '<text class="tag" text-anchor="middle" y="5"></text></svg>';
    b.addEventListener('focus', () => { S.focus = i; tone(ratio(S.shown[i])); });
    b.addEventListener('click', () => { cell(i).setAttribute('aria-label', label(i)); tone(ratio(S.shown[i])); });
    board.append(b);
  }
}

const cell = (i) => $('#board').children[i];
const label = (i) => {
  const r = ratio(S.psi[i]);
  const row = Math.floor(i / side()) + 1;
  const col = (i % side()) + 1;
  let t = `Item ${i + 1}, row ${row} column ${col}, size ${r.toFixed(1)} times the start`;
  if (S.measured) {
    if (i === S.target) t += ', this was the target';
    if (i === S.measured.index) t += ', your measurement';
  }
  return t;
};

$('#board').addEventListener('keydown', (e) => {
  const g = side();
  const moves = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: g, ArrowUp: -g };
  if (e.key === 'Home') { e.preventDefault(); focusCell(0); return; }
  if (e.key === 'End') { e.preventDefault(); focusCell(S.N - 1); return; }
  if (!(e.key in moves)) return;
  e.preventDefault();
  const col = S.focus % g;
  if ((e.key === 'ArrowRight' && col === g - 1) || (e.key === 'ArrowLeft' && col === 0)) return;
  const next = S.focus + moves[e.key];
  if (next >= 0 && next < S.N) focusCell(next);
});
function focusCell(i) {
  cell(S.focus).tabIndex = -1;
  S.focus = i;
  cell(i).tabIndex = 0;
  cell(i).focus();
}

// ---------- rounds
function newRound(N) {
  if (S.measuring) return;
  cancelAnimationFrame(S.raf);
  S.shots = null;
  S.N = N; S.k = 0; S.measured = null; S.focus = 0;
  S.target = Math.floor(rand() * N);
  S.psi = initialState(N);
  S.shown = Float64Array.from(S.psi);
  for (const el of $('#sizes').children) el.setAttribute('aria-pressed', String(Number(el.dataset.n) === N));
  $('#register').textContent = `N = ${N} · ${qubits()} qubits`;
  buildBoard();
  sync(false);
  announce(`New round with ${N} items. All items are the same size.`);
  dropBalls().then(() => {
    if (briefed) { $('#board').classList.remove('gum'); return; }
    briefed = true;
    intro.start(N);
  });
}

// The machine fills up: every ball falls into its slot, in colour. The briefing (or the next round) drains the colour.
function dropBalls() {
  const board = $('#board');
  board.classList.add('gum');
  if (reduced) return Promise.resolve();
  board.classList.add('drop');
  return new Promise((resolve) => {
    const done = () => { board.classList.remove('drop'); resolve(); };
    board.lastElementChild.querySelector('svg').addEventListener('animationend', done, { once: true });
    setTimeout(done, 3000); // safety net if the animation never reports back
  });
}

function setLayers(k) {
  if (S.measured || S.measuring) return;
  S.k = Math.max(0, Math.min(MAX_LAYERS, k));
  S.psi = initialState(S.N);
  for (let i = 0; i < S.k; i++) groverStep(S.psi, S.target);
  sync(true);
}

function announce(text) { $('#result').textContent = text; }

function sync(animate) {
  const p = probabilities(S.psi)[S.target];
  const ko = optimalIterations(S.N);
  const done = !!S.measured;
  const busy = S.measuring;
  $('#add').disabled = done || busy || S.k >= MAX_LAYERS;
  $('#remove').disabled = done || busy || S.k === 0;
  $('#hint').disabled = done || busy;
  $('#measure').hidden = done;
  $('#measure').disabled = busy;
  $('#measure span').textContent = busy ? 'Measuring…' : 'Collapse & measure';
  $('#again').hidden = !done;
  $('#gauge-k').textContent = `L = ${S.k} / ${ko}`;
  $('#gauge-p').textContent = pctf(p);
  $('#gauge-bar').style.width = `${(p * 100).toFixed(1)}%`;
  $('#readout').textContent = `${plural(S.k, 'Grover layer')}. Chance of measuring the big one: ${pctf(p)}. The target is now ${ratio(S.psi[S.target]).toFixed(1)} times its starting size.`;
  $('#target-spec').textContent = done ? `Target: item ${S.target + 1} · ${ket(S.target)}` : 'Target: hidden';
  $('#detector').textContent = done ? `item ${S.measured.index + 1}` : '—';
  drawCircuit();
  drawChart();
  drawRace(p);
  drawOvershoot();
  drawShots();
  if (!done) explainer.update(S.N, S.target, S.k);
  if (animate && !reduced) tween(); else { S.shown = Float64Array.from(S.psi); drawBoard(); }
}

function drawCircuit() {
  const items = [[ket(0), 'Start with every qubit at 0'], [`H⊗${qubits()}`, 'Hadamard on every qubit: all items equal']];
  for (let i = 0; i < S.k; i++) items.push(['G', `Grover layer ${i + 1}`, 'g']);
  items.push(['Measure', 'Measure']);
  $('#circuit').replaceChildren(...items.map(([text, aria, cls]) => {
    const li = document.createElement('li');
    li.textContent = text;
    li.setAttribute('aria-label', aria);
    if (cls) li.className = cls;
    return li;
  }));
}

function drawBoard() {
  for (let i = 0; i < S.N; i++) {
    const c = cell(i);
    // radius follows amplitude: starts at 20% of the cell, capped so circles stay inside the cell
    const r = Math.min(46, 20 * ratio(S.shown[i]));
    c.querySelector('.ball').setAttribute('r', r.toFixed(2));
    c.querySelector('.gum').setAttribute('r', r.toFixed(2));
    c.setAttribute('aria-label', label(i));
    const isTarget = !!S.measured && i === S.target;
    const isPick = !!S.measured && i === S.measured.index;
    c.classList.toggle('truth', isTarget);
    c.classList.toggle('pick', isPick);
    const tag = c.querySelector('.tag');
    tag.textContent = isTarget ? 'TARGET' : isPick ? 'PICK' : '';
    // small balls cannot hold the label: put it underneath in the foreground colour
    const inside = r > 26;
    tag.setAttribute('y', inside ? '5' : '44');
    tag.style.fill = inside ? '' : 'var(--fg)';
  }
}

function tween() {
  cancelAnimationFrame(S.raf);
  const from = Float64Array.from(S.shown);
  const t0 = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - t0) / 450);
    const e = 1 - (1 - t) ** 3;
    for (let i = 0; i < S.N; i++) S.shown[i] = from[i] + (S.psi[i] - from[i]) * e;
    drawBoard();
    if (t < 1) S.raf = requestAnimationFrame(step);
  };
  S.raf = requestAnimationFrame(step);
}

function hint() {
  const k = optimalIterations(S.N);
  announce(`Hint: about ${plural(k, 'layer')} gives the best chance, ${pctf(theoreticalProbability(S.N, k))}. That is roughly π/4 × √${S.N}. Fewer is weaker, and far too many makes the target shrink again.`);
}

// One shot of the real circuit when there is a backend; otherwise one sample of the exact simulation.
async function measure() {
  if (S.measured || S.measuring) return;
  const probs = probabilities(S.psi);
  const round = { N: S.N, target: S.target, k: S.k };
  let index = null, source = 'the exact simulation', stats = null, note = '';
  if (quantum.state === 'connecting') announce('Waiting for the quantum backend…');
  S.measuring = true;
  sync(false);
  if (await quantum.ready) {
    announce(`Running your circuit on ${quantum.name}…`);
    try {
      const out = await quantum.run(round.N, round.target, round.k, 1);
      index = out.counts.find(([, c]) => c > 0)?.[0] ?? null;
      source = out.backend;
      stats = out.stats;
    } catch (err) {
      console.warn('[grover] backend run failed, sampling the exact simulation instead:', err);
      note = ` The backend did not answer (${err?.message || err}), so this sample came from the exact simulation.`;
    }
  }
  S.measuring = false;
  if (index === null || index < 0 || index >= round.N) index = sampleIndex(probs, rand());
  S.measured = { index, hit: index === S.target, source, stats };
  S.rounds += 1;
  if (S.measured.hit) S.wins += 1;
  cancelAnimationFrame(S.raf);
  sync(false);
  const circuit = stats ? ` The circuit had ${stats.qubits} qubits, ${stats.gates} gates and depth ${stats.depth}.` : '';
  announce(`${S.measured.hit ? 'Found it!' : 'Missed.'} You measured item ${index + 1} ${ket(index)} on ${source}; the target was item ${S.target + 1} ${ket(S.target)}. The chance was ${pctf(probs[S.target])}.${circuit}${note} Rounds won: ${S.wins} of ${S.rounds}.`);
  focusCell(S.target);
}

// After the round: run the same circuit many times and compare with the prediction.
// Locked until you measure, because a histogram would point straight at the target.
async function runShots() {
  if (!S.measured || S.shots?.running) return;
  const round = { N: S.N, target: S.target, k: S.k };
  S.shots = { running: true };
  drawShots();
  let counts, source;
  try {
    if (!(await quantum.ready)) throw new Error(quantum.reason);
    const out = await quantum.run(round.N, round.target, round.k, SHOTS);
    counts = out.counts; source = out.backend;
  } catch (err) {
    if (quantum.state === 'online') console.warn('[grover] backend run failed, sampling the exact simulation instead:', err);
    const probs = probabilities(S.psi);
    const tally = new Map();
    for (let i = 0; i < SHOTS; i++) { const j = sampleIndex(probs, rand()); tally.set(j, (tally.get(j) || 0) + 1); }
    counts = [...tally.entries()]; source = 'the exact simulation';
  }
  if (round.N !== S.N || round.target !== S.target || !S.measured) return; // a new round started meanwhile
  const hist = new Float64Array(S.N);
  for (const [i, c] of counts) if (i >= 0 && i < S.N) hist[i] += c;
  S.shots = { hist, source, total: hist.reduce((a, b) => a + b, 0) };
  drawShots();
}

// ---------- telemetry
function drawChart() {
  if (!S.psi) return;
  const cv = $('#chart');
  const dpr = window.devicePixelRatio || 1;
  const W = cv.clientWidth, H = cv.clientHeight;
  if (!W || !H) return;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const pad = { l: 50, r: 14, t: 16, b: 30 };
  const ko = optimalIterations(S.N);
  const kmax = Math.min(MAX_LAYERS, Math.max(8, ko * 2 + 2, S.k));
  const X = (k) => pad.l + (k / kmax) * (W - pad.l - pad.r);
  const Y = (p) => H - pad.b - p * (H - pad.t - pad.b);
  const ink = css('--c-ink'), grid = css('--c-grid'), curve = css('--c-curve'), guess = css('--c-guess');
  const font = `600 13px ${css('--font-mono')}`;
  ctx.clearRect(0, 0, W, H);
  ctx.font = font; ctx.fillStyle = ink; ctx.strokeStyle = grid; ctx.lineWidth = 1;
  for (const v of [0, 0.5, 1]) {
    ctx.beginPath(); ctx.moveTo(pad.l, Y(v)); ctx.lineTo(W - pad.r, Y(v)); ctx.stroke();
    ctx.textAlign = 'right'; ctx.fillText(`${v * 100}%`, pad.l - 8, Y(v) + 4);
  }
  ctx.textAlign = 'center';
  for (let k = 0; k <= kmax; k += Math.ceil(kmax / 8)) ctx.fillText(String(k), X(k), H - 10);
  // Grover curve (sampled finely between integer layer counts for a smooth line)
  ctx.strokeStyle = curve; ctx.lineWidth = 3; ctx.beginPath();
  for (let s = 0; s <= kmax * 8; s++) {
    const k = s / 8;
    const y = Y(theoreticalProbability(S.N, k));
    if (s === 0) ctx.moveTo(X(k), y); else ctx.lineTo(X(k), y);
  }
  ctx.stroke();
  // random guessing
  ctx.strokeStyle = guess; ctx.setLineDash([8, 6]); ctx.lineWidth = 2; ctx.beginPath();
  ctx.moveTo(pad.l, Y(1 / S.N)); ctx.lineTo(W - pad.r, Y(1 / S.N)); ctx.stroke(); ctx.setLineDash([]);
  // best (square) and you (dot)
  ctx.strokeStyle = ink; ctx.lineWidth = 3;
  ctx.strokeRect(X(ko) - 8, Y(theoreticalProbability(S.N, ko)) - 8, 16, 16);
  const cur = probabilities(S.psi)[S.target];
  ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(X(S.k), Y(cur), 7, 0, 2 * Math.PI); ctx.fill();
  cv.setAttribute('aria-label', `Chance of measuring the big one against number of layers. Best is ${plural(ko, 'layer')} at ${pctf(theoreticalProbability(S.N, ko))}. You are at ${plural(S.k, 'layer')}, ${pctf(cur)}. Random guessing is ${pctf(1 / S.N)}.`);
}

function drawRace(p) {
  const ko = optimalIterations(S.N);
  const po = theoreticalProbability(S.N, ko);
  $('#race').innerHTML = `<table><caption>Expected checks to find the target</caption><tbody>
    <tr><th scope="row">Random guessing</th><td>${(S.N + 1) / 2}</td></tr>
    <tr><th scope="row">Your circuit (${plural(S.k, 'layer')})</th><td>${p > 0 ? ((S.k + 1) / p).toFixed(1) : 'never'}</td></tr>
    <tr><th scope="row">Best circuit (${plural(ko, 'layer')})</th><td>${((ko + 1) / po).toFixed(1)}</td></tr></tbody></table>`;
}

function drawShots() {
  const btn = $('#shots-run');
  const out = $('#shots-out');
  const svg = $('#shots-svg');
  btn.disabled = !S.measured || !!S.shots?.running;
  btn.textContent = S.shots?.running ? 'Running…' : `Run ${SHOTS.toLocaleString('en')} shots`;
  if (!S.shots?.hist) {
    svg.toggleAttribute('hidden', true); // SVG elements have no .hidden property
    out.textContent = S.measured ? `Run your ${plural(S.k, 'layer')} circuit ${SHOTS.toLocaleString('en')} times and compare with the prediction.` : 'Unlocks after you measure: a histogram would give the target away.';
    return;
  }
  const { hist, total, source } = S.shots;
  const pred = theoreticalProbability(S.N, S.k);
  const got = hist[S.target] / total;
  out.textContent = `On ${source}: the target came up ${hist[S.target]} of ${total} times (${pctf(got)}). Predicted: ${pctf(pred)}.`;
  // one bar per item; the target is drawn solid with a tick at its predicted height, the rest outlined
  const W = 400, H = 120, pad = 6, max = Math.max(pred, ...Array.from(hist, (c) => c / total), 0.05);
  const slot = (W - 2 * pad) / S.N, bw = Math.max(1, slot * 0.7);
  const Y = (p) => H - pad - (p / max) * (H - 2 * pad);
  const ns = 'http://www.w3.org/2000/svg';
  const kids = [];
  for (let i = 0; i < S.N; i++) {
    const r = document.createElementNS(ns, 'rect');
    const p = hist[i] / total;
    r.setAttribute('x', (pad + i * slot + (slot - bw) / 2).toFixed(1));
    r.setAttribute('y', Y(p).toFixed(1));
    r.setAttribute('width', bw.toFixed(1));
    r.setAttribute('height', Math.max(1, H - pad - Y(p)).toFixed(1));
    r.setAttribute('class', i === S.target ? 'hit' : 'rest');
    kids.push(r);
  }
  const tick = document.createElementNS(ns, 'line');
  const tx = pad + S.target * slot;
  Object.entries({ x1: tx - 2, x2: tx + slot + 2, y1: Y(pred), y2: Y(pred), class: 'pred' }).forEach(([k, v]) => tick.setAttribute(k, String(v)));
  kids.push(tick);
  svg.replaceChildren(...kids);
  svg.toggleAttribute('hidden', false);
  svg.setAttribute('aria-label', `Histogram of ${total} shots over ${S.N} items. The target, item ${S.target + 1}, came up ${hist[S.target]} times; the prediction line is at ${pctf(pred)}.`);
}

function drawOvershoot() {
  const ko = optimalIterations(S.N);
  $('#overshoot').textContent = `With ${S.N} items the peak is ${plural(ko, 'layer')} at ${pctf(theoreticalProbability(S.N, ko))}. `
    + `Each layer turns the state by a fixed angle, so going on to ${2 * ko} layers swings it past the target and the chance falls to ${pctf(theoreticalProbability(S.N, 2 * ko))}.`;
}

// ---------- windows: telemetry and explain float over the stage; open from the top bar, drag by the title, close with ✕ or Escape
let zTop = 20;
const toggleFor = (dlg) => $(`[aria-controls="${dlg.id}"]`);
function openWindow(dlg) {
  if (!dlg.open) dlg.show();
  dlg.style.zIndex = String(++zTop);
  toggleFor(dlg).setAttribute('aria-expanded', 'true');
  if (dlg.id === 'telemetry') drawChart(); // the canvas had no size while hidden
}
function closeWindow(dlg) {
  dlg.close();
  const t = toggleFor(dlg);
  t.setAttribute('aria-expanded', 'false');
  t.focus();
}
function dragBy(dlg, handle) {
  let dx = 0, dy = 0;
  handle.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    const r = dlg.getBoundingClientRect();
    dx = e.clientX - r.left; dy = e.clientY - r.top;
    handle.setPointerCapture(e.pointerId);
  });
  handle.addEventListener('pointermove', (e) => {
    if (!handle.hasPointerCapture(e.pointerId)) return;
    const r = dlg.getBoundingClientRect();
    const x = Math.max(0, Math.min(window.innerWidth - r.width, e.clientX - dx));
    const y = Math.max(0, Math.min(window.innerHeight - r.height, e.clientY - dy));
    dlg.style.left = `${x}px`; dlg.style.top = `${y}px`; dlg.style.right = 'auto';
  });
}
for (const dlg of document.querySelectorAll('dialog.window')) {
  toggleFor(dlg).addEventListener('click', () => (dlg.open ? closeWindow(dlg) : openWindow(dlg)));
  dlg.querySelector('.window-close').addEventListener('click', () => closeWindow(dlg));
  dlg.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); closeWindow(dlg); } });
  dlg.addEventListener('pointerdown', () => { dlg.style.zIndex = String(++zTop); });
  dragBy(dlg, dlg.querySelector('.window-head'));
}

// ---------- controls and hotkeys
buildSizes();
$('#add').addEventListener('click', () => setLayers(S.k + 1));
$('#remove').addEventListener('click', () => setLayers(S.k - 1));
$('#hint').addEventListener('click', hint);
$('#measure').addEventListener('click', measure);
$('#again').addEventListener('click', () => newRound(S.N));
$('#shots-run').addEventListener('click', runShots);
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.target.matches('input, textarea, select') || intro.active || S.measuring) return;
  const key = e.key.toLowerCase();
  if (key === '+' || key === '=') setLayers(S.k + 1);
  else if (key === '-' || key === '_' || key === '−') setLayers(S.k - 1);
  else if (key === 'm') measure();
  else if (key === 'h' && !S.measured) hint();
  else if (key === 'n') newRound(S.N);
  else return;
  e.preventDefault();
});
window.addEventListener('resize', drawChart);
newRound(16);
