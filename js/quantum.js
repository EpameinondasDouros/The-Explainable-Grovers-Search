// The real circuit: the same Grover layers as grover_sim.js, written as Qiskit gates and run on the
// platform's pre-created `backend`. Where there is no Qiskit or no backend (e.g. a local static server)
// the game keeps working on the exact simulation and says so.
//
// Qiskit objects here are Python objects reached from JS (Pyodide proxies): constructors are called
// without `new`, and named arguments go through fn.callKwargs(...args, { name: value }).

/**
 * Gates for k Grover layers on n qubits, as plain data so tests can check them against real Qiskit.
 * Qubit q holds bit q of the item index (Qiskit's little-endian order), so the counts key '0101' is item 5.
 * The diffuser is built as H·X·MCZ·X·H = −(2|s⟩⟨s| − I): a global phase of −1, invisible to measurement.
 */
export function groverOps(n, target, k) {
  const all = [...Array(n).keys()];
  const zeros = all.filter((q) => !((target >> q) & 1));
  const last = n - 1;
  // phase −1 on |1…1⟩ only
  const mcz = n === 1 ? [['z', 0]] : [['h', last], ['mcx', all.slice(0, last), last], ['h', last]];
  const ops = all.map((q) => ['h', q]);
  for (let i = 0; i < k; i++) {
    ops.push(['barrier']);
    // oracle: X wherever the target has a 0 turns |target⟩ into |1…1⟩, flip it, then undo
    ops.push(...zeros.map((q) => ['x', q]), ...mcz, ...zeros.map((q) => ['x', q]));
    // diffuser: mirror about the uniform state
    ops.push(...all.map((q) => ['h', q]), ...all.map((q) => ['x', q]), ...mcz, ...all.map((q) => ['x', q]), ...all.map((q) => ['h', q]));
  }
  return ops;
}

/** Counts from Qiskit ({'0101': 3, ...}, as a Map or object) to [item index, count] pairs. */
export function parseCounts(counts) {
  const entries = counts instanceof Map ? [...counts.entries()] : Object.entries(counts);
  return entries.map(([key, c]) => {
    const bits = String(key).replace(/\s+/g, '');
    return [bits.startsWith('0x') ? parseInt(bits, 16) : parseInt(bits, 2), Number(c)];
  });
}

const call = (fn, args, kwargs) => (fn.callKwargs ? fn.callKwargs(...args, kwargs) : fn(...args, kwargs));
const toJs = (x) => (x && typeof x.toJs === 'function' ? x.toJs() : x);
function withTimeout(promise, ms, what) {
  let timer;
  const late = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${what} took longer than ${ms / 1000}s`)), ms); });
  return Promise.race([promise, late]).finally(() => clearTimeout(timer));
}

/**
 * Connects to Qiskit and the `backend` global without blocking the game.
 * `loadQiskit` is how the module is reached: the platform resolves the bare 'qiskit' specifier.
 */
export function createQuantum({ loadQiskit = () => import('qiskit'), getBackend = () => globalThis.backend, onStatus = () => {} } = {}) {
  const Q = { qiskit: null, backend: null, name: '', state: 'connecting', reason: '' };

  const setState = (state, reason = '') => {
    Object.assign(Q, { state, reason });
    onStatus({ state, name: Q.name, reason });
  };

  async function findQiskit() {
    try {
      const mod = await loadQiskit();
      const qiskit = mod?.QuantumCircuit ? mod : mod?.default;
      if (qiskit?.QuantumCircuit) return qiskit;
    } catch (err) {
      console.info('[grover] import("qiskit") failed:', err?.message || err);
    }
    // Pyodide hosts that do not register an ES module for qiskit can still hand it over directly
    try {
      const py = globalThis.pyodide;
      if (py?.pyimport) return py.pyimport('qiskit');
    } catch (err) {
      console.info('[grover] pyodide.pyimport("qiskit") failed:', err?.message || err);
    }
    return null;
  }

  function backendName(b) {
    try {
      const n = b.name;
      return String(typeof n === 'function' ? n() : n);
    } catch { return 'quantum backend'; }
  }

  // The backend may be created after this script starts, so keep looking for a little while.
  const ready = (async () => {
    Q.qiskit = await findQiskit();
    if (!Q.qiskit) { setState('offline', 'Qiskit is not available here'); return false; }
    for (let i = 0; i < 60 && !getBackend(); i++) await new Promise((r) => setTimeout(r, 500));
    const b = getBackend();
    if (!b) { setState('offline', 'no backend was provided'); return false; }
    Q.backend = b;
    Q.name = backendName(b);
    setState('online');
    console.info(`[grover] measuring on ${Q.name}`);
    return true;
  })();

  function buildCircuit(n, target, k) {
    const qc = Q.qiskit.QuantumCircuit(n);
    for (const [g, a, b] of groverOps(n, target, k)) {
      if (g === 'mcx') qc.mcx(a, b);
      else if (g === 'barrier') qc.barrier();
      else qc[g](a);
    }
    qc.measure_all();
    return qc;
  }

  /** Runs the real circuit and returns per-item counts plus what was run, or throws. */
  async function run(n, target, k, shots) {
    if (Q.state !== 'online') throw new Error(Q.reason || 'no quantum backend');
    const qc = buildCircuit(n, target, k);
    let circuit = qc;
    if (typeof Q.qiskit.transpile === 'function') {
      try { circuit = call(Q.qiskit.transpile, [qc], { backend: Q.backend, optimization_level: 1 }); } catch (err) {
        console.info('[grover] transpile failed, running the circuit as built:', err?.message || err);
      }
    }
    const stats = { qubits: n, depth: Number(circuit.depth()), gates: Number(circuit.size()) };
    const job = await call(Q.backend.run, [circuit], { shots });
    const result = await withTimeout(Promise.resolve(job.result()), 60000, 'The backend');
    const counts = parseCounts(toJs(await result.get_counts()));
    return { counts, stats, backend: Q.name };
  }

  return { ready, run, get state() { return Q.state; }, get name() { return Q.name; }, get reason() { return Q.reason; } };
}
