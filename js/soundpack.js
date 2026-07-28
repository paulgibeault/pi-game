// pi-game sound pack — the game's own sound design.
//
// Loaded as a plain script after /sdk/v3/arcade-audio.js. The launcher's
// tools/soundpack renderer loads this same file to produce audition WAVs, so
// what gets approved by ear is what plays.
//
// ── v1 — the memory palace ────────────────────────────────────────────────
// You are walking a long corridor in the dark, reciting from memory. Every
// digit is a footstep. One wrong step and the floor isn't there.
//
// The chiptune profile this replaces (audio/chiptune-archive.mjs) got one
// thing exactly right and it survives unchanged: THE TICK'S FIRST DUTY IS TO
// STAY OUT OF THE WAY. The game asks for hundreds of keystrokes in a row, so
// interesting is a defect. What changes is what carries the run's shape.
//
//   DEPTH IS THE ONLY THING THAT MOVES, AND IT MOVES IN SPACE. Digit 5 is a
//   dry footfall in a small room. Digit 200 is the SAME footfall with the
//   corridor answering it. The archived profile climbed 440 → 1200 Hz across
//   a run; a tone rising for four hundred keystrokes is the chiptune tell,
//   and it is what makes long runs tiring. Pitch now holds still and the
//   room opens up instead — which is a thing you feel without listening to
//   it, and that is the point.
//
//   A REFLECTION HAS NO CONTACT CLICK. That one rule is what makes the
//   copies read as the corridor answering rather than as more footsteps: a
//   room eats the transient first, then the top end, then everything. Every
//   echo in this pack is built by taking the gesture away rather than by
//   adding a delay to it.
//
// Five cues, the same five the game already plays:
//
//   correct           a footfall, plus however much corridor you have earned
//   combo             a second footfall answering, offstage — someone keeping pace
//   wrong             the step lands on nothing
//   practice-correct  the same corridor with the lights on
//   practice-wrong    just a stop
//
// Register plan, so simultaneous cues occupy different bands:
//   footfall body 150–720 · its weight 54–98 · contact 1900+
//   the answer 150–390 · the fall 33–240 · its wash 190–1100
//
// LEVEL NEVER VARIES PER PLAY, at any depth or any streak. This is the one
// rule the fleet has paid for twice (see sow-duku's pack header), and depth
// is exactly the kind of parameter that would break it if it were allowed to
// touch gain. It isn't: at every depth the DIRECT step has identical gain and
// identical pitch spread, and the reflections only ever add tail behind it.
// The run gets larger, never louder. Section D of the short audition exists
// to prove that by ear.
//
// The archived chiptune profile is kept verbatim in audio/chiptune-archive.mjs
// and is what a player on a stale service-worker cache still hears.

(function (global) {
  'use strict';
  const S = global.ArcadeAudioElements;

  // Every cue here is built from the element library's gestures, so with the
  // library absent — a stale service-worker cache, or running standalone off
  // the launcher origin — there is nothing registrable and the game's audio
  // module takes its fallback path. Bail before dereferencing S: this file is
  // a plain script, and a throw here would surface as a page error even though
  // the fallback itself works. Also covers an OLDER library that predates
  // registerPack, which is the same stale-cache scenario one version on.
  if (!S || typeof S.registerPack !== 'function') return;

  // Stone, and a lot of it in one direction. Longer and darker than anything
  // else in the fleet: this room is not atmosphere, it is the progress meter,
  // so it has to have somewhere to grow into. The high shelf is well down —
  // a corridor absorbs the top end long before it absorbs the bottom, and
  // without that this reads as a plate reverb rather than as masonry.
  const ROOM = {
    dur: 2.4,
    decay: 0.85,
    preDelay: 0.022,
    wet: 0.85,
    shelfHz: 3000,
    shelfDb: -8,
    seed: 3141,
  };

  // How much corridor each cue sits in. `correct` is deliberately modest —
  // its depth comes from the reflections it builds itself, and doubling that
  // up with a big send would wash out the very transient the ear is using to
  // count steps. Practice is DRY: nothing is at stake there, so there is no
  // room at all.
  const SENDS = {
    'correct': 0.11,
    'combo': 0.30,
    'wrong': 0.46,
    'practice-correct': 0.0,
    'practice-wrong': 0.0,
  };

  // Levels, by layer. The footfall is the quietest thing that can still be
  // counted — it fires on literally every keystroke of every run, and it is
  // under the player's concentration rather than in front of it. The fall is
  // the only loud thing in the game and it happens exactly once.
  const STEP = 0.095;      // one footfall, at any depth
  const ANSWER = 0.052;    // the streak's answering step, always below yours
  const DROP = 0.30;       // the floor going away

  const clamp01 = (v) => (typeof v === 'number' && isFinite(v) ? Math.max(0, Math.min(1, v)) : 0);

  // One footfall. `click` is the contact; a real step has one and a REFLECTION
  // does not. `bright` scales everything above the fundamental together, so a
  // copy further down the corridor is darker as well as quieter — the two
  // always move together, because in a real room they do.
  function footfall(ctx, o, t, r, p) {
    const g = p.gain;
    const bright = p.bright;
    if (p.click) {
      S.strike(ctx, o, t, {
        dur: S.between(r, 0.0035, 0.0055), hp: 1900 * S.cents(r, 90),
        gain: g * 0.55, seed: (r() * 1e6) | 0,
      });
    }
    const f0 = (p.f0 || 176) * S.cents(r, p.spread == null ? 55 : p.spread);
    S.body(ctx, o, t, {
      f0: f0, gain: g,
      partials: [
        { ratio: 1.00, gain: 1.00, decay: S.between(r, 0.075, 0.095), detune: 5, attack: 0.003 },
        { ratio: 2.41, gain: 0.34 * bright, decay: S.between(r, 0.040, 0.055), detune: 9, attack: 0.002 },
        { ratio: 4.07, gain: 0.16 * bright, decay: S.between(r, 0.022, 0.030), detune: 13, attack: 0.002 },
      ],
    });
    // the weight under the heel — small, and it goes away with distance too
    S.thump(ctx, o, t + 0.002, {
      f0: S.between(r, 88, 98), f1: S.between(r, 54, 62),
      dur: S.between(r, 0.055, 0.070), attack: 0.006,
      gain: g * 0.34 * bright, seed: (r() * 1e6) | 0,
    });
  }

  const CUES = {
    // A CORRECT DIGIT — one footfall, and however much corridor you have
    // earned. `params.depth` is 0..1 across a run (the game maps digit index
    // onto it); at 0 there is one close reflection and at 1 there are four,
    // spreading further apart as they go.
    //
    // Everything that makes this bigger is BEHIND the direct sound: same
    // gain, same pitch, same 90 ms of core at digit 5 and digit 500. Fast
    // typing therefore never smears — the thing that lengthens is quiet
    // enough to be walked over by the next step, which is exactly what
    // happens when you walk faster in a real corridor.
    'correct': function (ctx, o, t, params, r) {
      const depth = clamp01(params && params.depth);
      footfall(ctx, o, t, r, { gain: STEP, bright: 1.0, click: true });

      const n = 1 + Math.round(depth * 3);
      const spread = 0.042 + depth * 0.115;
      const LEVEL = [0.30, 0.19, 0.125, 0.08];
      let at = 0;
      for (let i = 0; i < n; i++) {
        // each return is further out than the last — a corridor's reflections
        // are not evenly spaced, they run away from you
        at += spread * S.between(r, 0.82, 1.24) * (1 + i * 0.45);
        footfall(ctx, o, t + at, r, {
          gain: STEP * LEVEL[i],
          bright: 0.55 - i * 0.11,
          click: false,
          f0: 176 * (1 - i * 0.012),
          spread: 25,
        });
      }
      return 0.35 + depth * 0.9;
    },

    // A HOT STREAK — a second footfall answering, a little way off. Not a
    // ping above the tick (the archived profile's choice, and the reason a
    // streak used to read as a reward rather than as company): the same
    // material as your own step, later, lower and darker, so it fuses with
    // the step instead of sitting on top of it.
    //
    // `params.streak` is 0..1. It buys CLARITY — the answer rings longer and
    // holds its second partial — and never level. A streak you can hear
    // getting louder is a streak that punishes you for having one.
    'combo': function (ctx, o, t, params, r) {
      const streak = clamp01(params && params.streak);
      const f0 = S.between(r, 150, 162);
      S.body(ctx, o, t + S.between(r, 0.085, 0.125), {
        f0: f0, gain: ANSWER,
        partials: [
          { ratio: 1.00, gain: 1.00, decay: 0.085 + streak * 0.075, detune: 6, attack: 0.004 },
          { ratio: 2.41, gain: 0.18 + streak * 0.22, decay: 0.038 + streak * 0.030, detune: 10, attack: 0.003 },
        ],
      });
      return 0.5;
    },

    // A WRONG DIGIT — the step lands on nothing, and the run is over. Three
    // things in order, and none of them is an alarm:
    //
    //   1. the floor gives — stick-slip, which is what a thing about to break
    //      actually does, and the only warning you get
    //   2. the step, arriving as a SWELL rather than a punch. The attack is
    //      well off the floor on purpose: a fast onset here is heard as an
    //      impact, and an impact is a thing hitting something, which is the
    //      one reading this must not have
    //   3. the corridor answering all at once — a wash of air falling away,
    //      sent hard into the room, and then nothing
    //
    // The archived profile ended the run with a detuned sawtooth cluster
    // sagging under a noise transient. It was unmistakable and it was also
    // the loudest thing in the game by a distance, which made losing feel
    // like being told off. The punishment here is the silence afterwards.
    'wrong': function (ctx, o, t, params, r) {
      S.creak(ctx, o, t, {
        f0: S.between(r, 320, 380), f1: S.between(r, 120, 145), Q: 6,
        lp: 900, dur: S.between(r, 0.16, 0.20), rate: 1.6, rate1: 0.5,
        gain: DROP * 0.30, attack: 0.02, seed: (r() * 1e6) | 0,
      });
      S.thump(ctx, o, t + S.between(r, 0.15, 0.19), {
        f0: S.between(r, 74, 84), f1: S.between(r, 33, 39),
        dur: S.between(r, 0.55, 0.65), attack: 0.045,
        gain: DROP, seed: (r() * 1e6) | 0,
      });
      S.rustle(ctx, o, t + S.between(r, 0.16, 0.21), {
        f0: S.between(r, 900, 1100), f1: S.between(r, 190, 240), Q: 0.8,
        lp: 1600, dur: S.between(r, 0.70, 0.85),
        gain: DROP * 0.20, attack: 0.05, seed: (r() * 1e6) | 0,
      });
      return 2.4;
    },

    // PRACTICE, CORRECT — the same corridor with the lights on. Identical
    // footfall, and no reflections at any depth (practice ignores `depth`
    // entirely) on top of a send of zero. Nothing is at stake, so there is
    // no room: the sound tells you where you are without you having to think
    // about it, which is the whole difference between the two modes.
    'practice-correct': function (ctx, o, t, params, r) {
      footfall(ctx, o, t, r, { gain: STEP, bright: 0.85, click: true });
      return 0.25;
    },

    // PRACTICE, WRONG — just a stop. The step that lands on nothing, with
    // the floor's warning and the corridor's answer both taken away, because
    // nothing ends here. Short enough to be walked straight over by the next
    // attempt.
    'practice-wrong': function (ctx, o, t, params, r) {
      S.thump(ctx, o, t, {
        f0: S.between(r, 78, 88), f1: S.between(r, 40, 46),
        dur: S.between(r, 0.16, 0.20), attack: 0.020,
        gain: DROP * 0.42, seed: (r() * 1e6) | 0,
      });
      return 0.4;
    },
  };

  // Published under the framework's well-known handle (arcade-audio.js
  // registerPack) so the game's audio module and the launcher's soundpack
  // toolchain both reach it without either side knowing this game's name.
  S.registerPack({ name: 'pi-game', ROOM, SENDS, CUES });
})(typeof window !== 'undefined' ? window : globalThis);
