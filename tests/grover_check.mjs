// Prints what the browser-side Grover simulation computes, for comparison with numpy.
import {
  runGrover, probabilities, optimalIterations, theoreticalProbability, sampleIndex,
} from '../js/grover_sim.js';

let raw = '';
for await (const chunk of process.stdin) raw += chunk;
const input = JSON.parse(raw);
const out = input.cases.map(([N, target, k]) => {
  const p = probabilities(runGrover(N, target, k));
  return { p: Array.from(p), theory: theoreticalProbability(N, k), kopt: optimalIterations(N) };
});
const samples = input.samples.map(([probs, u]) => sampleIndex(probs, u));
console.log(JSON.stringify({ out, samples }));
