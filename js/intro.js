// The briefing: once the gumball machine has filled up, the story that frames the game, one line at a time.
// The console is inert until the player finishes or skips; the chamber stays live so the balls can be explored.
export function createIntro({ story, text, dots, next, skip, lab, console: consoleEl, board, onDone }) {
  const S = { active: false, step: 0, lines: [] };

  const lines = (N) => [
    'Imagine you are colourblind. Somewhere in this machine is one red item, and you want to find it.',
    `Without any tricks you have to go one by one and ask a friend who can see red: “Is this one red?” With ${N} items that is about ${Math.floor((N + 1) / 2)} asks on average.`,
    "In quantum mechanics you have a magic wand: Grover's search. It is built from layers that repeat. Each layer holds an oracle, your friend, who recognises red for every item at once without saying which one it is.",
    'Each time you add a layer, the red item grows and every other item shrinks. You still cannot see red, but you can see big.',
    "So let's see what you've got. Add a few layers, then collapse and measure to find the red item.",
  ];

  function start(N) {
    Object.assign(S, { lines: lines(N), step: 0, active: true });
    lab.classList.add('intro');
    consoleEl.inert = true;
    dots.replaceChildren(...S.lines.map(() => document.createElement('li')));
    story.hidden = false;
    show();
    next.focus();
  }

  function show() {
    text.textContent = S.lines[S.step];
    text.style.animation = 'none'; void text.offsetWidth; text.style.animation = ''; // restart the fade
    [...dots.children].forEach((li, i) => li.classList.toggle('on', i <= S.step));
    next.textContent = S.step === S.lines.length - 1 ? 'Find the red item' : 'Next';
    if (S.step === 0) board.classList.remove('gum'); // the colours drain away: this is what colourblind looks like
  }

  function advance() {
    if (S.step < S.lines.length - 1) { S.step += 1; show(); } else finish();
  }

  function finish() {
    if (!S.active) return;
    S.active = false;
    story.hidden = true;
    lab.classList.remove('intro');
    consoleEl.inert = false;
    board.classList.remove('gum');
    onDone?.();
  }

  next.addEventListener('click', advance);
  skip.addEventListener('click', finish);
  story.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); finish(); } });

  return { start, finish, get active() { return S.active; } };
}
