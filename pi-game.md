### Pi Game

**Role & Objective**
You are an expert front-end developer and UI/UX designer. Your task is to build a single-page web game where the user recites Pi by typing on an on-screen number pad. The application must be contained entirely within standard web technologies (HTML, CSS, Vanilla JavaScript) so it can be served as static files.

**1. Architecture & Tech Stack**

* **HTML:** A single `index.html` file containing the semantic structure.
* **CSS:** Vanilla CSS utilizing CSS Variables (Custom Properties) for a robust theming engine.
* **JavaScript:** Vanilla ES6+ JavaScript. Use a lightweight MVC (Model-View-Controller) or state-driven approach to separate game logic from DOM manipulation.
* **No external frameworks** (no React, Vue, etc.), though lightweight external libraries for particle effects or audio synthesis are acceptable if imported via CDN.

**2. State Management & Persistence**
The game state must persist across page reloads using `localStorage` (acting as a local-first data store).
Define a unified state object containing:

* `gameState`: Enum (`MENU`, `PLAYING`, `GAME_OVER`)
* `currentTheme`: String (matches CSS theme classes)
* `piSequence`: The correct string of Pi to validate against.
* `userSequence`: The current string of correct digits entered.
* `startTime`: Timestamp of the first keypress in the current round.
* `leaderboard`: Array of objects `{ score (length), time (seconds), date }`, sorted by score descending.

The app must parse `localStorage` on `DOMContentLoaded` and initialize the UI to match the saved state. If a user is mid-game and refreshes, they should be able to pick up exactly where they left off.

**3. Core Gameplay Loop & Mechanics**

* **The Goal:** The user must press numbers on a 0-9 number pad to match the sequence of Pi.
* **The Display:** A persistent "3." sits at the top of the screen. As the user enters correct digits, they append to a trailing string behind the "3.".
* **Success Condition:** The pressed key matches the next digit of Pi. Update state, save to `localStorage`, trigger success "juice" (visual/audio feedback), and await the next input.
* **Failure Condition:** The pressed key does NOT match. The game immediately ends. The run's score (sequence length) and time are calculated and saved to the leaderboard. Clear the active sequence from `localStorage`, trigger failure "juice", and show the Game Over / Leaderboard screen.

**4. Theming Engine**
The user must be able to select from 4 distinct themes on the start screen. Implement this by applying a data-attribute (e.g., `data-theme="neural"`) to the `<body>` tag, which recalculates CSS Variables for colors, fonts, borders, and animations.

* **Theme 1: Neural Network (Cyberpunk):** Dark mode, neon cyan/magenta glows, monospaced terminal fonts, mechanical keyboard styling.
* **Theme 2: Precision Blueprint:** Deep blue background, grid lines, sleek sans-serif technical fonts, metallic extruded buttons.
* **Theme 3: Abstract Gallery:** Stark white or black minimalist background, elegant serif fonts, glassmorphism UI, soft shadows.
* **Theme 4: Orbital Gravity:** Deep space background, glowing spherical buttons, digits that float or orbit when typed.

**5. Game "Juice" (Audio & Visual Feedback)**
The core loop is simple, so the feedback must be highly engaging. Implement the following dynamically via JavaScript/CSS based on the active theme:

* **Visuals:** Add subtle CSS keyframe screen shakes on correct presses, and a violent screen shake on failure. Add particle bursts or CSS transition flares on the number pad when a key is pressed.
* **Audio (Web Audio API):** Generate procedural UI sounds.
* Correct press: A synthesized tone that slightly increases in pitch (`frequency`) with every consecutive correct digit.
* Wrong press: A harsh, dissonant chord or low-frequency drop.


* **Combo Modifiers:** If the time between keypresses is very short, intensify the visual glow or particles to reward speed and muscle memory.

**6. User Interface Layout**

* **Start Screen:** Title, Theme Selector (4 distinct visual buttons), and a "Start Game" button.
* **Game Screen:** Centered layout. Large "3.[trailing digits]" at the top. 3x3 + bottom row (calculator style) grid for the number pad in the lower third.
* **Game Over Screen:** Large failure notification, the final score, the time elapsed, the top 5 leaderboard rankings, and a "Try Again" button.

---

Would you like me to map out the specific CSS variable structure for the theming engine so you can hand Claude a ready-made design token system alongside this spec?