# The Explainable Grover's Search

**Find the Big One** is a browser game that teaches Grover's quantum search algorithm. It also shows *why* each step works.

One of 16 (or 64) items is secretly the target. You cannot see which one. Each **Grover layer** you add makes the target a little bigger and every other item a little smaller. Choose how many layers to use, then measure. Too few layers and the target is still small. Too many and it shrinks again. The game is about finding the sweet spot, about π/4·√N layers.

![The lab, three layers in, stepping through the oracle flip](docs/img/lab.png)

## Why "explainable"

Most Grover demos show the result. This one takes apart the layer you just added and draws it twice:

| View | What you see |
| --- | --- |
| **Amplitude bars** | Every item's amplitude, with the average as a dashed line. **1 · Flip:** the oracle turns the target's bar upside down. **2 · Mirror:** every bar is reflected about the average. The flipped bar was furthest below it, so it lands furthest above it. |
| **Rotation dial** | The same state as one arrow between "everything else" and "the target". The flip is a mirror in one line and the diffuser is a mirror in another. Two mirrors make a rotation of 2θ, which explains the fixed step per layer, the √N speed-up and the overshoot. |

Step through **Before → Flip → Mirror** by hand, or press **Play layer**. Every caption uses the real numbers for the current round.

## Accessible by design

- **Size, never colour.** Before you measure, all items look alike except for their size. Colour never hints at the target.
- **Two themes from Google Stitch** (see below). The default is a glass "lab" look. One click switches to a monochrome high-contrast mode with large text, thick borders and big touch targets. The page picks high contrast automatically if the OS asks for more contrast.
- **Keyboard first.** Arrow keys move around the board. `+` / `−` add or remove layers, `M` measures, `H` gives a hint, `N` starts a new round.
- **Screen reader and sound.** Every item announces its size relative to the start. Live regions report each change. An optional tone gets higher and louder for bigger items.
- **Respects reduced motion.**

![High-contrast theme after a measurement](docs/img/high-contrast.png)

## Designed with Google Stitch

The interface comes from the Stitch project **"Find the Big One – Grover game"**. It has three design systems, two of which are used here:

| Stitch design system | Used as |
| --- | --- |
| **Aether Quantum Lab** | Default theme: violet / cyan / amber glass panels, Sora + Geist type, the three-zone "operator console / chamber / telemetry" layout, and the glass-globe chamber with its detector pedestal |
| **Quantum High-Contrast Lab** | High-contrast theme: pure monochrome, square corners, Atkinson Hyperlegible Next + JetBrains Mono, 20px text floor, inverted focus and pressed states, hard offset shadows |

The exported specs live in [`docs/stitch/`](docs/stitch/), with the generated reference screen. Both themes are CSS custom properties in [`style.css`](style.css), switched by `data-theme` on `<html>`.

Where the generated mock-up and the physics disagreed, the physics won:
- The target stays hidden (no colour and no label) until you measure.
- The peak for N = 16 is at 3 layers (96.1%), not 2.
- The page claims no accessibility certifications it has not been tested for.

![The Stitch reference screen](docs/stitch/stitch-amplification-lab.png)

## Run it

No build step and no dependencies. It is static HTML with ES modules:

```bash
python3 serve.py          # http://localhost:8800
```

## The maths, briefly

- Start in the uniform state: every amplitude is 1/√N.
- One layer = **oracle** (flip the target's sign) then **diffuser** (reflect every amplitude about the mean, i.e. 2|s⟩⟨s| − I).
- With θ = asin(1/√N), after k layers P(target) = sin²((2k+1)θ). This peaks at k ≈ π/(4θ) − ½ ≈ (π/4)√N.
- Random guessing needs (N+1)/2 checks on average. Grover needs about √N.

The simulation in [`js/grover_sim.js`](js/grover_sim.js) is a pure module with no DOM. Probabilities are exact (Born rule), and measurement samples them with `crypto.getRandomValues`.

## Tests

The browser simulation is checked against an independent NumPy implementation and the closed form. The test runs the real JS module under Node:

```bash
uv run --no-project --with pytest --with numpy python -m pytest -q tests
```

Requires Node on your `PATH`. The tests skip cleanly without it.

## Project layout

```
index.html            page structure (console · chamber · telemetry · explain)
style.css             both Stitch themes as CSS tokens
js/grover_sim.js      pure Grover simulation (shared with the tests)
js/main.js            game, board, chart, hotkeys, theme switch
js/explain.js         amplitude bars + rotation dial, step by step
tests/                NumPy cross-check of the JS simulation
docs/stitch/          Stitch design-system specs and reference screen
serve.py              tiny static server
```

## Honest note

This runs on a classical computer. It shows exactly how Grover's algorithm behaves, but it is not a quantum speed-up. On real hardware the advantage comes from the oracle being a quantum circuit, not from this simulation.

Built at the Qollab hackathon.
