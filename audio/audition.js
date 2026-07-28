// pi-game — audition timeline, v1 (diagnostic).
//
//   node ../paulgibeault.github.io/tools/soundpack/render.mjs \
//     --config soundpack.config.json --audition full
//
// The PROVING file — listen to audition-short.js first; come here when
// something in it needs isolating. Written after the first ear pass (v1
// approved with no retunes), so it proves the claims the design stands on
// rather than re-auditioning the material:
//
//   · the depth grammar survives WITHOUT the room — the reflections are built
//     by the cue itself, and dry is where a spurious contact click on a
//     return would be audible
//   · larger never means louder, even interleaved — a gradual run lets the
//     ear acclimatise; slamming depth 0 against depth 1 does not
//   · the streak's answer lands in the 90–125 ms after a step, and at four
//     keys a second that is halfway to the NEXT step — it must fuse or fail
//   · the wrong's wash and the corridor's wash are the same material, and at
//     full depth they overlap — the ending must still read as an ending
//
(function (global) {
  'use strict';
  const A = global.ArcadeAudition;

  const GAP = 0.9;
  const TAIL = 2.2;

  const key = (ctx, bus, at, r, depth, streak) => {
    A.fire(ctx, bus, 'correct', at, r, { depth });
    if (streak != null) A.fire(ctx, bus, 'combo', at, r, { streak });
  };

  const SECTIONS = [
    {
      title: 'A · The corridor without the room',
      note: 'The same three depths as the short audition\'s ladder, rendered DRY. The reflections are built into the cue — copies of the footfall with the contact taken away — and the room send only glues them; heard dry, the depth grammar should still work, just closer. Two things to catch here and nowhere else: whether any return carries a contact click (a reflection must not — a click on a copy turns the corridor into more footsteps), and whether the returns alone read as quieter-and-darker copies rather than as a flutter echo.',
      items: [
        A.play('correct', { label: 'depth 0 — dry: one step, one close return', params: { depth: 0.0 }, send: 0, dur: 1.0 }),
        A.play('correct', { label: 'depth ½ — dry: the returns spreading', params: { depth: 0.5 }, send: 0, dur: 1.4 }),
        A.play('correct', { label: 'depth 1 — dry: four returns running away, no glue', params: { depth: 1.0 }, send: 0, dur: 1.8 }),
        A.custom('depth 1 dry ×4 — listening for a click on any return', 4.8,
          (ctx, bus, t, r) => { const S = global.ArcadeAudioElements; for (let i = 0; i < 4; i++) A.pack().CUES['correct'](ctx, S.out(bus, 0), t + i * 1.2, { depth: 1.0 }, r); }),
      ],
    },
    {
      title: 'B · Larger, never louder — adversarial',
      note: 'The short audition proved the depth ladder in order, which is how play presents it, and the ear acclimatises across a gradual run. This is the same claim with the acclimatisation taken away: depth 0 slammed against depth 1, alternating, then each depth repeated at play pace so level wander WITHIN a depth has somewhere to show. The direct step must be identical every single time — if any step in this section pokes out, the invariance is broken in the pack, not in your ears.',
      items: [
        A.custom('depth 0 · depth 1 — alternating ×3, the harshest A/B', 9.6, (ctx, bus, t, r) => {
          for (let i = 0; i < 3; i++) {
            A.fire(ctx, bus, 'correct', t + i * 3.2, r, { depth: 0.0 });
            A.fire(ctx, bus, 'correct', t + i * 3.2 + 1.5, r, { depth: 1.0 });
          }
        }),
        A.repeat('correct', { n: 8, spacing: 0.6, label: 'depth 0 ×8 — level check, small room', params: { depth: 0.0 } }),
        A.repeat('correct', { n: 8, spacing: 0.6, label: 'depth ½ ×8 — level check, mid corridor', params: { depth: 0.5 } }),
        A.repeat('correct', { n: 8, spacing: 0.8, label: 'depth 1 ×8 — level check, full corridor', params: { depth: 1.0 } }),
      ],
    },
    {
      title: 'C · The answer under pressure',
      note: 'The streak\'s second footfall arrives 90–125 ms after yours, and its whole design brief is to fuse — company, not a reward. At four keys a second that delay is halfway to the next step, which is exactly where fusing fails: first the answer alone at three streak strengths (clarity should grow, level must not), then step-plus-answer at a walking pace where the ear can separate them, then at game speed where it must stop trying. If the fast run reads as six steps rather than three-with-company, the answer is landing as an extra keystroke and the cue has failed.',
      items: [
        A.play('combo', { label: 'the answer alone — streak just started', params: { streak: 0.1 }, dur: 0.9 }),
        A.play('combo', { label: 'the answer alone — streak half grown', params: { streak: 0.5 }, dur: 0.9 }),
        A.play('combo', { label: 'the answer alone — streak at full clarity', params: { streak: 1.0 }, dur: 0.9 }),
        A.custom('step + answer ×3 — walking pace, the pair separable', 5.4,
          (ctx, bus, t, r) => { for (let i = 0; i < 3; i++) key(ctx, bus, t + i * 1.8, r, 0.5, 0.8); }),
        A.custom('step + answer ×8 — four a second, the pair must fuse', 3.4,
          (ctx, bus, t, r) => { for (let i = 0; i < 8; i++) key(ctx, bus, t + i * 0.21, r, 0.7, 0.9); }),
      ],
    },
    {
      title: 'D · Each cue — dry, then in the room',
      note: 'First without reverb, then with. This pack\'s sends are deliberately lopsided — correct at 0.11 because its depth is built in, wrong at 0.46 because the corridor answering is the point, practice at zero because nothing is at stake there — so the dry/wet gap should sound different per cue, and practice pairs should be identical twice.',
      items: [
        A.play('correct', { label: 'correct (depth ½) — dry', params: { depth: 0.5 }, send: 0, dur: 1.4 }),
        A.play('correct', { label: 'correct (depth ½) — in the room', params: { depth: 0.5 }, dur: 1.6 }),
        A.play('combo', { label: 'combo — dry', params: { streak: 0.8 }, send: 0, dur: 0.9 }),
        A.play('combo', { label: 'combo — in the room', params: { streak: 0.8 }, dur: 1.0 }),
        A.play('wrong', { label: 'wrong — dry: the gesture with the corridor taken away', send: 0 }),
        A.play('wrong', { label: 'wrong — in the room: the corridor answering all at once' }),
        A.play('practice-correct', { label: 'practice-correct — dry (its only state)', send: 0, dur: 0.8 }),
        A.play('practice-wrong', { label: 'practice-wrong — dry (its only state)', send: 0, dur: 0.8 }),
      ],
    },
    {
      title: 'E · Repetition — level and fatigue',
      note: 'The tick\'s first duty is to stay out of the way, and the only test of that is volume of repetition: twenty steps at recitation pace, then the deep-corridor smear test — fourteen steps at four a second with the full tail behind each, where the returns must be walked over by the next step rather than piling into wash. Practice mode last, at drill pace: drier, brighter, and it has to stay comfortable for a whole session of drilling.',
      items: [
        A.custom('correct ×20 — steady recitation, mid depth', 7.4, (ctx, bus, t, r) => {
          for (let i = 0; i < 20; i++) A.fire(ctx, bus, 'correct', t + i * 0.32, r, { depth: 0.4 + i * 0.004 });
        }),
        A.custom('correct ×14 — four a second at full depth, the smear test', 4.4, (ctx, bus, t, r) => {
          for (let i = 0; i < 14; i++) A.fire(ctx, bus, 'correct', t + i * 0.185, r, { depth: 0.95 });
        }),
        A.repeat('practice-correct', { n: 10, spacing: 0.28, label: 'practice ×10 — drill pace, lights on' }),
      ],
    },
    {
      title: 'F · The endings, under the worst conditions',
      note: 'The wrong fires from the same keystroke handler as the step that caused it, so its opening creak starts life underneath a footfall and — at depth — underneath four returns as well. The creak is the only warning the player gets, and these scenes exist to prove it survives its own trigger: a run ending at full depth (two washes, one ending), the same ending mid-streak with the answer also in the air, and the practice stop walked straight over, because in practice mode a mistake must cost nothing, including attention.',
      items: [
        A.custom('the fall at depth 1 — maximum corridor, then nothing', 7.0, (ctx, bus, t, r) => {
          for (let i = 0; i < 4; i++) key(ctx, bus, t + i * 0.20, r, 0.98, null);
          A.fire(ctx, bus, 'wrong', t + 0.80, r);
        }),
        A.custom('the fall mid-streak — step, answer and ending in the same instant', 7.0, (ctx, bus, t, r) => {
          for (let i = 0; i < 4; i++) key(ctx, bus, t + i * 0.21, r, 0.7, 0.9);
          A.fire(ctx, bus, 'wrong', t + 0.84, r);
        }),
        A.custom('practice: wrong, and straight on — the stop that costs nothing', 4.6, (ctx, bus, t, r) => {
          for (let i = 0; i < 4; i++) A.fire(ctx, bus, 'practice-correct', t + i * 0.26, r);
          A.fire(ctx, bus, 'practice-wrong', t + 1.04, r);
          for (let i = 0; i < 4; i++) A.fire(ctx, bus, 'practice-correct', t + 1.42 + i * 0.26, r);
        }),
      ],
    },
  ];

  A.publish({ gap: GAP, tail: TAIL, sections: SECTIONS });
})(typeof window !== 'undefined' ? window : globalThis);
