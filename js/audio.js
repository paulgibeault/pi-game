/**
 * audio.js — Sound for pi-game, via the launcher SDK's managed `Arcade.audio`.
 * This is the game's single audio registration site.
 *
 * A plain script, not an ES module, because the game itself is one inline
 * <script> in index.html: this runs before it and hands it a small API on
 * `window.PiGameAudio`. The <script> order in index.html is what guarantees
 * `Arcade.init()` and the pack registration have both already run by the time
 * this evaluates.
 *
 * Two registration paths live here:
 *
 *   GRAPH PATH (the SDK's /arcade-audio.js companion loaded) — the real sound
 *     design. js/soundpack.js holds the pack: a long stone corridor you are
 *     reciting into, where a correct digit is a footfall and the ROOM is the
 *     progress meter. That pack is rendered to an audition WAV and approved by
 *     ear before it ships; do not retune it from here.
 *
 *     NO SYNTHESIS LIVES IN THIS GAME. Every gesture the pack is built from is
 *     an element in the launcher's shared library. What belongs to pi-game is
 *     the design — which gestures, how loud, how far away, how often — and
 *     that is all js/soundpack.js contains.
 *
 *   FALLBACK PATH (older cached SDK/companion, or standalone without
 *     /arcade-audio.js) — the archived chiptune profile, copied verbatim from
 *     audio/chiptune-archive.mjs. It exists because a player on a stale
 *     service-worker cache should get the old sound rather than silence; that
 *     is an expected state, not an error, so it is not logged.
 *
 *     Its BODIES are frozen — that profile was tuned as a whole and should be
 *     kept in sync with the archive rather than edited here.
 *
 * Both paths register the same five cue names, so every call site in the game
 * works unchanged either way.
 *
 * ── the one real difference between the paths ─────────────────────────────
 * The chiptune profile carried a run's progress in PITCH: `correct` climbed
 * 440 → 1200 Hz on a per-play `freq` override, and the streak accent rode a
 * per-play `gain`. The graph pack carries it in SPACE instead, and holds
 * level still on purpose. So the two paths take different per-play params:
 *
 *   graph      correct { depth: 0..1 }   combo { streak: 0..1 }
 *   chiptune   correct { freq }          combo { freq, gain }
 *
 * `playCorrect(digitIndex, comboLevel)` below is the only place that knows
 * which is which — it is why the game calls one function instead of building
 * overrides at the call site the way it used to.
 *
 * Conventions (fleet Arcade.audio conventions, launcher GAME_INTEGRATION.md §5):
 *   A1 — cues are registered ONCE here at load. Audio is purely local, so no
 *        `await Arcade.ready` is needed.
 *   A2 — every play-site in the game goes through a wrapper below.
 *   A3 — the launcher owns volume + the global mute button. pi-game keeps its
 *        own on-screen sound toggle (`state.soundEnabled`), which predates the
 *        SDK and is an EXTRA gate on top, never a second volume control; it is
 *        pushed in here via setEnabled().
 *   A4 — cue names are lowercase and event-shaped, unchanged from the
 *        pre-graph profile.
 */

(function (global) {
  "use strict";

  var audio = function () {
    return (global.Arcade && global.Arcade.audio) ? global.Arcade.audio : null;
  };
  var pack = function () {
    return global.ArcadeSoundPack || null;
  };

  // pi-game's own on-screen toggle (A3). Defaults true, matching the game's
  // initial state; index.html pushes the persisted value in at boot.
  var enabled = true;

  // ─── the play wrapper (A2) ────────────────────────────────────────────────
  // Silent no-op when Arcade.audio is absent or the game's toggle is off (the
  // SDK short-circuits before touching the AudioContext when the LAUNCHER has
  // muted, so that case costs nothing either). Must never throw: this is
  // called from the keypress path.
  function sfx(name, opts) {
    if (!enabled) return;
    var a = audio();
    if (a) a.play(name, opts);
  }

  // ─── registration ─────────────────────────────────────────────────────────

  function registerPack(a, p) {
    // One room for the whole game: the corridor the pack is set in.
    a.room(p.ROOM);
    Object.keys(p.CUES).forEach(function (name) {
      a.graph(name, p.CUES[name], { send: p.SENDS[name] });
    });
  }

  // ─── fallback: the archived chiptune profile ──────────────────────────────
  // Copied verbatim from audio/chiptune-archive.mjs, which froze the game's
  // pre-graph sound. Keep the cue BODIES in sync with that archive rather than
  // editing them here — it is what a player on a stale service-worker cache
  // hears, and it was tuned as a whole. The comments describe the chiptune
  // voices, not the corridor the graph path now plays.

  function registerSpecCues(a) {
    // Correct digit — the metronome tick. Triangle (a touch more edge than a
    // sine, so it reads as a click rather than a beep), near-instant attack
    // and a 70 ms fall to silence. Stays a SINGLE-object spec because
    // playCorrect() overrides `freq` per play for the rising digit-index
    // ladder and the SDK only merges overrides onto single-object cues.
    a.cue("correct", { type: "triangle", freq: 440, dur: 0.07, gain: 0.14, attack: 0.001, release: 0.065 });
    // Hot-streak accent layered over 'correct': a clean sine ping a fifth
    // above the tick. Also single-object — it takes both `freq` and `gain`
    // per play, so it scales with the streak.
    a.cue("combo", { type: "sine", freq: 660, dur: 0.09, gain: 0.05, attack: 0.001, release: 0.085 });
    // Wrong digit / game over — the alarm strike. A noise transient and a
    // pitch-dropping triangle land together as the hit; 20 ms later the
    // detuned sawtooth cluster sags in and holds, all three voices bending
    // downward so the run audibly dies instead of resolving into a chord.
    a.cue("wrong", [
      { type: "noise", dur: 0.045, gain: 0.10, attack: 0.001, release: 0.044, delay: 0 },
      { type: "triangle", freq: 200, toFreq: 55, dur: 0.18, gain: 0.16, attack: 0.001, release: 0.16, delay: 0 },
      { type: "sawtooth", freq: 150, toFreq: 138, dur: 0.5, gain: 0.08, attack: 0.006, release: 0.34, delay: 0.02 },
      { type: "sawtooth", freq: 157, toFreq: 144, dur: 0.5, gain: 0.08, attack: 0.006, release: 0.34, delay: 0 },
      { type: "sawtooth", freq: 185, toFreq: 170, dur: 0.5, gain: 0.07, attack: 0.006, release: 0.34, delay: 0 },
    ]);
    // Practice mode — the same two sounds with the stakes taken out.
    a.cue("practice-correct", { type: "triangle", freq: 600, dur: 0.055, gain: 0.075, attack: 0.001, release: 0.05 });
    a.cue("practice-wrong", [
      { type: "noise", dur: 0.03, gain: 0.06, attack: 0.001, release: 0.029, delay: 0 },
      { type: "triangle", freq: 180, toFreq: 90, dur: 0.14, gain: 0.10, attack: 0.001, release: 0.12, delay: 0 },
    ]);
  }

  // ─── A1 — the single registration site ────────────────────────────────────
  // The gestures and APIs the pack is built out of. A cached older SDK or
  // element library has `graph()` and `el()` but not necessarily these, and a
  // missing element would throw inside a cue at play time — a cue that
  // half-plays is worse than the fallback profile, so the whole graph path is
  // gated on the pack's actual dependencies rather than on a version number.
  var NEEDED_ELEMENTS = [
    "strike", "body", "thump", "creak", "rustle", "cents", "between",
  ];

  var graphMode = false;

  (function registerCues() {
    var a = audio();
    if (!a) return;

    var p = pack();
    var el = (typeof a.el === "function") ? a.el() : null;
    var graphable =
      !!p &&
      typeof a.graph === "function" &&
      typeof a.room === "function" &&
      el !== null &&
      NEEDED_ELEMENTS.every(function (name) { return typeof el[name] === "function"; });

    if (graphable) {
      registerPack(a, p);
      graphMode = true;
    } else {
      // Stale cached SDK, or standalone without /arcade-audio.js. Expected,
      // not a bug — no console noise.
      registerSpecCues(a);
    }
  })();

  // ─── how far into the run the sound is ────────────────────────────────────
  // The pack's corridor opens up across `depth` 0..1. Four hundred digits is
  // the top of the scale: past it the room simply stops growing, which is the
  // right behaviour — a run that long is already as large as the sound gets,
  // and the alternative is a room that never stops expanding.
  var DEPTH_DIGITS = 400;

  // The streak's answering footfall fires above the same threshold the
  // chiptune accent used (comboLevel > 3) and saturates at the same cap (10),
  // so the two paths turn on and off at identical moments.
  var COMBO_THRESHOLD = 3;
  var COMBO_CAP = 10;

  // Chiptune-path overrides, preserved exactly (see the archive): the tick
  // climbs +8 Hz per digit off 440, capped at 1200; the accent sits a fifth
  // above it at 0.012 per streak level.
  function chiptuneFreq(digitIndex) { return Math.min(440 + digitIndex * 8, 1200); }

  global.PiGameAudio = {
    // True when the graph pack registered — for diagnostics and tests; the
    // game itself never needs to branch on it.
    isGraphMode: function () { return graphMode; },

    // pi-game's own sound toggle (A3). index.html calls this at boot with the
    // persisted value and again whenever the button is pressed.
    setEnabled: function (on) { enabled = !!on; },

    // A correct digit: the footfall, plus the streak's answer over it when the
    // player is on one. The two paths want different per-play params, and this
    // is the only place that knows the difference.
    playCorrect: function (digitIndex, comboLevel) {
      var streaking = comboLevel > COMBO_THRESHOLD;
      if (graphMode) {
        sfx("correct", { depth: Math.min(1, digitIndex / DEPTH_DIGITS) });
        if (streaking) {
          sfx("combo", { streak: Math.min(1, (comboLevel - COMBO_THRESHOLD) / (COMBO_CAP - COMBO_THRESHOLD)) });
        }
      } else {
        var freq = chiptuneFreq(digitIndex);
        sfx("correct", { freq: freq });
        if (streaking) {
          sfx("combo", { freq: freq * 1.5, gain: 0.012 * Math.min(comboLevel, COMBO_CAP) });
        }
      }
    },

    playWrong: function () { sfx("wrong"); },
    playPracticeCorrect: function () { sfx("practice-correct"); },
    playPracticeWrong: function () { sfx("practice-wrong"); },
  };
})(typeof window !== "undefined" ? window : globalThis);
