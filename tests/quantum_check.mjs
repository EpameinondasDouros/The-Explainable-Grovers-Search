// Prints the Qiskit gate lists from quantum.js, and drives createQuantum against a mock Pyodide-style
// qiskit + backend, for test_quantum.py to check.
import { groverOps, parseCounts, createQuantum } from '../js/quantum.js';

let raw = '';
for await (const chunk of process.stdin) raw += chunk;
const input = JSON.parse(raw);

const ops = input.cases.map(([n, target, k]) => groverOps(n, target, k));

// A mock that behaves like Pyodide proxies: constructors without `new`, kwargs through callKwargs.
const calls = [];
const kw = (fn) => Object.assign(fn, { callKwargs: (...a) => fn(...a) });
const mockQiskit = {
  QuantumCircuit: (n) => {
    const qc = { n, ops: [], depth: () => 7, size: () => 42, measure_all: () => qc.ops.push(['measure_all']), barrier: () => qc.ops.push(['barrier']) };
    for (const g of ['h', 'x', 'z']) qc[g] = (q) => qc.ops.push([g, q]);
    qc.mcx = (c, t) => qc.ops.push(['mcx', [...c], t]);
    return qc;
  },
  transpile: kw((qc, opts) => { calls.push(['transpile', opts.optimization_level]); return qc; }),
};
const mockBackend = {
  name: 'mock_sim',
  run: kw((qc, opts) => {
    calls.push(['run', opts.shots, qc.ops.length]);
    return { result: () => ({ get_counts: () => ({ toJs: () => new Map([['0101', opts.shots]]) }) }) };
  }),
};

const statuses = [];
const online = createQuantum({ loadQiskit: async () => mockQiskit, getBackend: () => mockBackend, onStatus: (s) => statuses.push(s.state) });
const onlineReady = await online.ready;
const run = await online.run(4, 5, 2, 25);

const offline = createQuantum({ loadQiskit: async () => { throw new Error('no qiskit'); } });
const offlineReady = await offline.ready;
let offlineError = '';
try { await offline.run(4, 5, 2, 1); } catch (err) { offlineError = err.message; }

console.log(JSON.stringify({
  ops,
  parsed: [parseCounts({ '0101': 3, '1 1 1 1': 2 }), parseCounts(new Map([['0x3', 4]]))],
  online: { ready: onlineReady, name: online.name, statuses, run, calls },
  offline: { ready: offlineReady, state: offline.state, error: offlineError },
}));
