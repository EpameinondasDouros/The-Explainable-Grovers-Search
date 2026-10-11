// The "explainable" panel: the most recent Grover layer, split into its two mirrors and drawn twice.
//   Amplitude bars: every item's amplitude, with the average the diffuser mirrors about.
//   Rotation dial:  the same state as one arrow in the plane (everything else, target).
// Phase 0 = before the layer, 1 = after the oracle flip, 2 = after the mirror (the current state).
import { runGrover } from './grover_sim.js';

const NS = 'http://www.w3.org/2000/svg';
const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const el = (tag, attrs = {}, text) => {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text !== undefined) node.textContent = text;
  return node;
};
const mean = (v) => v.reduce((s, x) => s + x, 0) / v.length;
const f3 = (x) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(3);
const deg = (r) => `${(r * 180 / Math.PI).toFixed(1)}°`;
const pct = (p) => `${(p * 100).toFixed(p < 0.1 || (p > 0.99 && p < 1) ? 1 : 0)}%`;

export function createExplainer({ amps, dial, caption, kLabel, phases, play, reduced }) {
  const S = { N: 16, target: 0, k: 0, phase: 2, states: [], means: [], shown: null, shownMean: 0, raf: 0, timer: 0 };

  function update(N, target, k) {
    stop();
    Object.assign(S, { N, target, k, phase: 2 });
    const before = Array.from(runGrover(N, target, Math.max(0, k - 1)));
    const flipped = before.slice();
    flipped[target] = -flipped[target];
    const after = Array.from(runGrover(N, target, k));
    S.states = k === 0 ? [after, after, after] : [before, flipped, after];
    // The mirror line is the average of the flipped state; show it on the flip and the mirror steps.
    S.means = [mean(S.states[0]), mean(S.states[1]), mean(S.states[1])];
    S.yMax = 1.08 * Math.max(...S.states.flat().map(Math.abs));
    S.shown = S.states[2].slice();
    S.shownMean = k === 0 ? S.means[0] : S.means[2];
    kLabel.textContent = k === 0 ? '0 (none yet)' : String(k);
    for (const b of phases.querySelectorAll('button')) b.disabled = k === 0;
    play.disabled = k === 0;
    setPressed();
    draw();
  }

  function setPressed() {
    for (const b of phases.querySelectorAll('button')) b.setAttribute('aria-pressed', String(Number(b.dataset.phase) === S.phase && S.k > 0));
  }

  function goTo(phase, animate = true) {
    S.phase = phase;
    setPressed();
    const to = S.states[phase];
    const toMean = S.means[phase];
    cancelAnimationFrame(S.raf);
    if (!animate || reduced) { S.shown = to.slice(); S.shownMean = toMean; draw(); return; }
    const from = S.shown.slice();
    const fromMean = S.shownMean;
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / 650);
      const e = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
      S.shown = from.map((v, i) => v + (to[i] - v) * e);
      S.shownMean = fromMean + (toMean - fromMean) * e;
      draw();
      if (t < 1) S.raf = requestAnimationFrame(step);
    };
    S.raf = requestAnimationFrame(step);
  }

  function stop() {
    clearTimeout(S.timer);
    cancelAnimationFrame(S.raf);
    play.textContent = '▶ Play layer';
  }

  function playLayer() {
    if (S.k === 0) return;
    stop();
    play.textContent = 'Playing…';
    goTo(0, false);
    S.timer = setTimeout(() => {
      goTo(1);
      S.timer = setTimeout(() => {
        goTo(2);
        S.timer = setTimeout(stop, 700);
      }, 1700);
    }, 900);
  }

  // ---------- drawing
  function draw() {
    drawBars();
    drawDial();
    writeCaption();
  }

  function drawBars() {
    const W = 640, H = 280, pad = { l: 64, r: 12, t: 18, b: 18 };
    const y0 = pad.t + (H - pad.t - pad.b) / 2;
    const half = (H - pad.t - pad.b) / 2;
    const Y = (v) => y0 - (v / S.yMax) * half;
    const n = S.N;
    const slot = (W - pad.l - pad.r) / n;
    const bw = Math.max(1.5, slot * (n > 32 ? 0.7 : 0.62));
    const grid = css('--c-grid'), bar = css('--c-bar'), meanC = css('--c-mean');
    amps.replaceChildren();
    amps.append(el('line', { x1: pad.l, x2: W - pad.r, y1: y0, y2: y0, stroke: grid, 'stroke-width': 2 }));
    amps.append(el('text', { x: pad.l - 10, y: y0 + 5, 'text-anchor': 'end', 'font-size': 15 }, '0'));
    amps.append(el('text', { x: pad.l - 10, y: Y(S.yMax / 1.08) + 5, 'text-anchor': 'end', 'font-size': 15 }, `+${(S.yMax / 1.08).toFixed(2)}`));
    amps.append(el('text', { x: pad.l - 10, y: Y(-S.yMax / 1.08) + 5, 'text-anchor': 'end', 'font-size': 15 }, `−${(S.yMax / 1.08).toFixed(2)}`));
    for (let i = 0; i < n; i++) {
      const v = S.shown[i];
      const x = pad.l + i * slot + (slot - bw) / 2;
      const top = Math.min(Y(v), y0);
      const h = Math.max(1, Math.abs(Y(v) - y0));
      amps.append(el('rect', { x, y: top, width: bw, height: h, fill: bar, rx: Math.min(3, bw / 3) }));
    }
    const ym = Y(S.shownMean);
    amps.append(el('line', { x1: pad.l, x2: W - pad.r, y1: ym, y2: ym, stroke: meanC, 'stroke-width': 3, 'stroke-dasharray': '10 7' }));
    amps.append(el('text', { x: W - pad.r, y: ym - 8, 'text-anchor': 'end', 'font-size': 15, fill: meanC, 'paint-order': 'stroke', stroke: css('--bg'), 'stroke-width': 5 },
      S.k > 0 && S.phase > 0 ? 'average = mirror line' : 'average'));
    const a = S.shown[S.target];
    const other = S.shown[(S.target + 1) % n];
    amps.setAttribute('aria-label', `Amplitude bars for ${n} items. One bar is ${f3(a)}, the other ${n - 1} are ${f3(other)} each. The average, drawn as a dashed line, is ${f3(S.shownMean)}.`);
  }

  function drawDial() {
    const R = 112;
    const th = Math.asin(1 / Math.sqrt(S.N));
    const ink = css('--c-ink'), grid = css('--c-grid'), arrow = css('--c-arrow'), ghost = css('--c-ghost'), meanC = css('--c-mean');
    // the plotted point: (rest, target) where rest is the summed weight of the other items
    const a = S.shown[S.target];
    const b = S.shown[(S.target + 1) % S.N] * Math.sqrt(S.N - 1);
    const P = (x, y) => [R * x, -R * y];
    dial.replaceChildren();
    dial.append(el('circle', { r: R, fill: 'none', stroke: grid, 'stroke-width': 2 }));
    dial.append(el('line', { x1: -R - 14, x2: R + 14, y1: 0, y2: 0, stroke: grid, 'stroke-width': S.phase === 1 && S.k ? 4 : 2 }));
    dial.append(el('line', { x1: 0, x2: 0, y1: R + 14, y2: -R - 14, stroke: grid, 'stroke-width': 2 }));
    dial.append(el('text', { x: 0, y: -R - 22, 'text-anchor': 'middle', 'font-size': 13 }, 'target'));
    dial.append(el('text', { x: R + 14, y: R + 30, 'text-anchor': 'end', 'font-size': 13 }, 'everything else →'));
    // start line |s> at angle theta: the diffuser's mirror
    const [sx, sy] = P(Math.cos(th), Math.sin(th));
    dial.append(el('line', { x1: -sx * 1.12, y1: -sy * 1.12, x2: sx * 1.12, y2: sy * 1.12, stroke: meanC, 'stroke-width': S.phase === 2 && S.k ? 3 : 1.5, 'stroke-dasharray': '6 6' }));
    dial.append(el('text', { x: -sx * 1.12, y: -sy * 1.12 + 18, 'text-anchor': 'start', 'font-size': 13, fill: meanC }, 'start line'));
    // where earlier layers left the arrow
    for (let j = 0; j < S.k; j++) {
      const ang = (2 * j + 1) * th;
      const [x, y] = P(Math.cos(ang), Math.sin(ang));
      dial.append(el('line', { x1: 0, y1: 0, x2: x, y2: y, stroke: ghost, 'stroke-width': 2 }));
    }
    // projection onto the target axis = target amplitude
    const [tx, ty] = P(b, a);
    dial.append(el('line', { x1: tx, y1: ty, x2: 0, y2: ty, stroke: ink, 'stroke-width': 1.5, 'stroke-dasharray': '3 5' }));
    dial.append(el('line', { x1: 0, y1: 0, x2: 0, y2: ty, stroke: arrow, 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0.55 }));
    // the arrow
    const len = Math.hypot(tx, ty) || 1;
    const ux = tx / len, uy = ty / len;
    dial.append(el('line', { x1: 0, y1: 0, x2: tx - ux * 10, y2: ty - uy * 10, stroke: arrow, 'stroke-width': 4, 'stroke-linecap': 'round' }));
    dial.append(el('polygon', {
      points: `${tx},${ty} ${tx - ux * 16 - uy * 8},${ty - uy * 16 + ux * 8} ${tx - ux * 16 + uy * 8},${ty - uy * 16 - ux * 8}`,
      fill: arrow,
    }));
    dial.append(el('circle', { r: 4, fill: ink }));
    const ang = Math.atan2(a, b);
    dial.setAttribute('aria-label', `State arrow at ${deg(ang)} from "everything else" towards "target". Its height on the target axis is ${f3(a)}, so the chance is ${pct(a * a)}.`);
  }

  function writeCaption() {
    const N = S.N, k = S.k;
    const th = Math.asin(1 / Math.sqrt(N));
    if (k === 0) {
      caption.textContent = `No layers yet. All ${N} amplitudes equal 1/√${N} = ${f3(1 / Math.sqrt(N))}, so every item has a ${pct(1 / N)} chance. The arrow starts θ = ${deg(th)} above "everything else". Add a layer, then step through it here.`;
      return;
    }
    const [s0, s1, s2] = S.states;
    const other = (S.target + 1) % N;
    const text = [
      `Before layer ${k}: one item has amplitude ${f3(s0[S.target])} and each of the other ${N - 1} has ${f3(s0[other])}. The arrow is ${deg((2 * k - 1) * th)} up, so the chance is ${pct(s0[S.target] ** 2)}.`,
      `1 · Flip. The oracle recognises the target and multiplies its amplitude by −1, giving ${f3(s1[S.target])}. Nothing else changes and nobody learns which item it was. The average drops to ${f3(S.means[1])}. On the dial this is a mirror in the horizontal axis.`,
      `2 · Mirror. Every amplitude is reflected about the average: new = 2 × average − old. The flipped bar sat furthest below the average, so it lands furthest above it at ${f3(s2[S.target])} (a ${pct(s2[S.target] ** 2)} chance). On the dial this is a mirror in the start line, and the two mirrors together turn the arrow by 2θ = ${deg(2 * th)}.`
        + ((2 * k + 1) * th > Math.PI / 2 ? ' The arrow has just passed the target axis, so one more layer would make things worse.' : ''),
    ];
    caption.textContent = text[S.phase];
  }

  for (const b of phases.querySelectorAll('button')) b.addEventListener('click', () => { stop(); goTo(Number(b.dataset.phase)); });
  play.addEventListener('click', playLayer);

  return { update, redraw: draw };
}
