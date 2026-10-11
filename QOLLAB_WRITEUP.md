**The Explainable Grover's Search: "Find the Big One"** · Qollab × IonQ Global Quantum Hackathon 2026 · MIT licence ·
Code: https://github.com/EpameinondasDouros/The-Explainable-Grovers-Search

*This effort is supported by Qollab & IonQ.*

## The problem

Most Grover's-search demos show the result but not *why* it works. Learners see a probability spike and miss
the mechanism: why each layer helps by a fixed amount, where the √N speed-up comes from, and why adding too
many layers makes things worse.

## What it does

A browser game that teaches Grover's quantum search. One of 16 (or 64) items is secretly the target. Each
**Grover layer** you add makes the target a little bigger and every other item a little smaller. Choose how many
layers to use, then measure: too few and the target is still small, too many and it shrinks again. The sweet spot
is about π/4·√N layers.

The game then takes apart the layer you just added and draws it two ways:
- **Amplitude bars:** the oracle flips the target's bar (1 · Flip), then every bar is reflected about the
  average (2 · Mirror). The flipped bar ends furthest above the average.
- **Rotation dial:** the same state as one arrow between "everything else" and "the target". Two mirrors make a
  rotation of 2θ, which explains the fixed step per layer, the √N speed-up and the overshoot.

Step through **Before → Flip → Mirror** by hand, or press **Play layer**. Every caption uses the real numbers
for the current round.

## How to run

Press **Run** and pick a backend (the built-in simulator or a free IonQ simulator).
- **Collapse & measure** builds your circuit in Qiskit on the pre-created `backend`: H on every qubit, then
  *k* × [oracle, diffuser], then measure. It transpiles for the backend and runs **1 shot**.
- **Telemetry → Check it on the real circuit** unlocks after you measure. It runs the same circuit for
  **1,000 shots** and compares how often the target appeared against the predicted sin²((2k+1)θ).
- The top-bar chip shows **Backend: *name*** when connected, or **Exact simulation** otherwise. The bars and
  dial come from the exact JS simulation, because a backend returns counts, not amplitudes.
- Keyboard: arrow keys move around the board, `+`/`−` change the number of layers, `M` measures, `H` gives a
  hint, `N` starts a new round.

## Accessible by design

- **Size, never colour:** colour never hints at the target before you measure.
- **Two themes:** a glass "lab" theme and a monochrome high-contrast theme with large text and big touch
  targets. High contrast is chosen automatically if the OS requests more contrast.
- **Screen reader and sound:** screen-reader announcements and live regions, plus an optional tone that grows
  with item size.
- **Reduced motion:** respected.

## The maths

- Start uniform: every amplitude is 1/√N.
- One layer is an oracle (flip the target's sign) followed by the diffuser (2|s⟩⟨s| − I).
- With θ = asin(1/√N), after k layers P(target) = sin²((2k+1)θ). This peaks near k ≈ (π/4)√N.
- In Qiskit, the oracle is X on the target's 0-bits, then multi-controlled Z, then X. The diffuser is H·X·MCZ·X·H.

## Reproduce and extend

- Build the upload bundle with `python3 build.py` (writes `dist/`).
- Run it locally with `python3 serve.py`.
- Tests cross-check the JS simulation against NumPy and the closed form, and the Qiskit gate list against
  Qiskit's `Statevector`:
  `uv run --no-project --with pytest --with numpy --with qiskit python -m pytest -q tests`

## Attribution

This effort is supported by Qollab & IonQ. Built during the hackathon window. The interface was designed with
Google Stitch (design-system specs in `docs/stitch/`). It runs on Qiskit.
