// Grover's search, simulated exactly on a classical computer.
// Pure functions, no DOM: the game UI (main.js) and the node cross-check test both import this.
//
// Grover never leaves the real subspace spanned by "the red item" and "everything else", so a
// real-valued statevector of N amplitudes is enough. One Grover layer = oracle then diffuser.
// quantum.js writes the same layer as Qiskit gates for the real backend.

/** Uniform superposition: what the Hadamard layer produces from |0...0>. */
export function initialState(N) {
  return new Float64Array(N).fill(1 / Math.sqrt(N));
}

/** The oracle: flips the sign of the marked item's amplitude. It never reveals which one it is. */
export function oracle(psi, target) {
  psi[target] = -psi[target];
}

/** The diffuser: reflect every amplitude about the average (2|s><s| - I). */
export function diffuse(psi) {
  let mean = 0;
  for (let i = 0; i < psi.length; i++) mean += psi[i];
  mean /= psi.length;
  for (let i = 0; i < psi.length; i++) psi[i] = 2 * mean - psi[i];
}

/** One Grover layer, in place. */
export function groverStep(psi, target) {
  oracle(psi, target);
  diffuse(psi);
  return psi;
}

/** Fresh state after k layers. */
export function runGrover(N, target, k) {
  const psi = initialState(N);
  for (let i = 0; i < k; i++) groverStep(psi, target);
  return psi;
}

/** Born rule: probability of each outcome. */
export function probabilities(psi) {
  const p = new Float64Array(psi.length);
  for (let i = 0; i < psi.length; i++) p[i] = psi[i] * psi[i];
  return p;
}

const theta = (N) => Math.asin(1 / Math.sqrt(N));

/** Closed form: P(red) = sin^2((2k+1) theta), theta = asin(1/sqrt(N)). */
export function theoreticalProbability(N, k) {
  return Math.sin((2 * k + 1) * theta(N)) ** 2;
}

/** The layer count that maximises P(red): round(pi/(4 theta) - 1/2), about (pi/4) sqrt(N). */
export function optimalIterations(N) {
  return Math.max(0, Math.round(Math.PI / (4 * theta(N)) - 0.5));
}

/** Pick an outcome from probabilities using a uniform u in [0, 1). */
export function sampleIndex(probs, u) {
  let acc = 0;
  for (let i = 0; i < probs.length; i++) {
    acc += probs[i];
    if (u < acc) return i;
  }
  return probs.length - 1;
}
