// pi-game — the short audition. THE one to listen to first.
//
//   node ../paulgibeault.github.io/tools/soundpack/render.mjs \
//     --config soundpack.config.json --audition short
//
// A listening file, not a diagnostic one: every sound once, in the order a
// player meets it, then the thing the whole design stands on (the corridor
// opening up as you go deeper), then a real run at real pace.
//
// v1 is a redesign, not a retune — there is no prior graph version to A/B
// against, and the chiptune profile it replaces is a different instrument
// rather than a worse setting of this one. So there are no OLD-vs-NEW
// sections here. The long diagnostic timeline gets written after this file
// has had its first ear pass, so that it proves whatever actually needed
// proving.
//
(function (global) {
  'use strict';
  const A = global.ArcadeAudition;

  const GAP = 1.15;   // roomy: each sound needs to arrive alone
  const TAIL = 2.0;   // this room has a real tail and it must be allowed to end

  // A correct keystroke at a given depth, with the streak's answer over it
  // when the player is on one — the two cues the game fires together.
  const key = (ctx, bus, at, r, depth, streak) => {
    A.fire(ctx, bus, 'correct', at, r, { depth });
    if (streak != null) A.fire(ctx, bus, 'combo', at, r, { streak });
  };

  const SECTIONS = [
    {
      title: 'A · The three sounds',
      note: 'Each once, in the order you meet them. A correct digit is one footfall in a stone corridor — a contact, a little body, and the room answering behind it. A hot streak adds a SECOND footfall a beat later, offstage and darker: someone keeping pace with you, not a reward. Wrong is the step landing on nothing — the floor gives, the step swells into empty air, the corridor answers all at once, and then the run is over. Listen for what the wrong ISN\'T: no alarm, no chord, nothing loud. The punishment is the silence after it.',
      items: [
        A.play('correct', { label: 'a correct digit, early in a run — one step, one close return', params: { depth: 0.0 }, dur: 1.0 }),
        A.play('correct', { label: 'a correct digit, deep in a run — the same step, more corridor', params: { depth: 1.0 }, dur: 1.8 }),
        A.play('combo', { label: 'the streak\'s answer alone — the second footfall, offstage', params: { streak: 0.8 }, dur: 1.0 }),
        A.custom('a correct digit ON a streak — the two together, as they fire', 1.8,
          (ctx, bus, t, r) => key(ctx, bus, t, r, 0.55, 0.8)),
        A.play('wrong', { label: 'WRONG — the floor gives, the step finds nothing, the corridor answers' }),
      ],
    },
    {
      title: 'B · Depth — larger, never louder',
      note: 'The same cue at five depths, evenly spaced from the first digit to the four-hundredth. This is the entire progress meter and it is the one thing that has to be right: the direct step is IDENTICAL every time — same gain, same pitch, same length — and only the returns behind it change, growing from one close reflection to four running away down the corridor. If any of these five reads as louder rather than as bigger, the design has failed, whatever else it does. Nothing here is pitched: the archived chiptune profile climbed 440 → 1200 Hz across a run and that is precisely what this replaces.',
      items: [
        A.play('correct', { label: 'digit 1 — a small room', params: { depth: 0.0 }, dur: 1.0 }),
        A.play('correct', { label: 'digit 60', params: { depth: 0.25 }, dur: 1.3 }),
        A.play('correct', { label: 'digit 150', params: { depth: 0.5 }, dur: 1.5 }),
        A.play('correct', { label: 'digit 280', params: { depth: 0.75 }, dur: 1.7 }),
        A.play('correct', { label: 'digit 400 — a long way in', params: { depth: 1.0 }, dur: 2.0 }),
        A.custom('all five back to back — the run in eight seconds', 8.0, (ctx, bus, t, r) => {
          [0.0, 0.25, 0.5, 0.75, 1.0].forEach((d, i) => A.fire(ctx, bus, 'correct', t + i * 1.5, r, { depth: d }));
        }),
      ],
    },
    {
      title: 'C · One run',
      note: 'A real recitation. It opens at thinking pace on the first few digits, settles into rhythm, picks up into a streak around digit 150 where the answering step comes in, runs fast and deep — and then a wrong digit, and it stops. Listen at game density for the two failures that only show up in a run: whether the step wanders in level (it must not), and whether the returns at depth start smearing into the next keystroke when the typing gets fast. The last scene is the same passage in practice mode, where the corridor is gone entirely.',
      items: [
        A.custom('the opening — thinking pace, digit 1 onward, no corridor yet', 5.4, (ctx, bus, t, r) => {
          [0.0, 0.85, 1.6, 2.2, 3.3, 3.9, 4.4].forEach((at, i) => key(ctx, bus, t + at, r, 0.01 + i * 0.004, null));
        }),
        A.custom('in rhythm — around digit 90, the room starting to open', 4.6, (ctx, bus, t, r) => {
          for (let i = 0; i < 13; i++) key(ctx, bus, t + i * 0.30, r, 0.20 + i * 0.004, null);
        }),
        A.custom('a streak — around digit 180, fast, the second step answering', 4.6, (ctx, bus, t, r) => {
          for (let i = 0; i < 18; i++) key(ctx, bus, t + i * 0.215, r, 0.45 + i * 0.004, Math.min(1, 0.2 + i * 0.06));
        }),
        A.custom('deep and quick — around digit 330, four a second', 3.6, (ctx, bus, t, r) => {
          for (let i = 0; i < 14; i++) key(ctx, bus, t + i * 0.185, r, 0.80 + i * 0.003, 0.9);
        }),
        A.custom('…and the floor isn\'t there', 6.0, (ctx, bus, t, r) => {
          for (let i = 0; i < 5; i++) key(ctx, bus, t + i * 0.20, r, 0.86, 0.9);
          A.fire(ctx, bus, 'wrong', t + 1.10, r);
        }),
        A.custom('practice mode — the same passage, lights on, nothing at stake', 5.2, (ctx, bus, t, r) => {
          for (let i = 0; i < 12; i++) A.fire(ctx, bus, 'practice-correct', t + i * 0.26, r);
          A.fire(ctx, bus, 'practice-wrong', t + 3.30, r);
          for (let i = 0; i < 5; i++) A.fire(ctx, bus, 'practice-correct', t + 3.90 + i * 0.26, r);
        }),
      ],
    },
  ];

  A.publish({ gap: GAP, tail: TAIL, sections: SECTIONS });
})(typeof window !== 'undefined' ? window : globalThis);
