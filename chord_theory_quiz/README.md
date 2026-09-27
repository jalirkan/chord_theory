# Chord Theory

Quick games for memorizing music theory. Rounds take about a minute,
every answer gets instant feedback (with the notes lit up on a keyboard and
played aloud), and spaced repetition brings back whatever you miss until it
sticks.

## Games

| Game | How it plays |
| --- | --- |
| **Blitz** | 60 seconds. Answers in a row raise a multiplier (×2 after 3, ×3 after 6, ×4 after 10). The clock only runs while a question is on screen. |
| **Survival** | Three lives. 12 seconds per question, half a second less for every answer in a row (down to 4). |
| **Spell It** | 10 questions with no multiple choice: build the answer from letters and accidentals. Spelling counts, so E♭ minor is E♭ G♭ B♭ and never E♭ F♯ B♭. |
| **Review** | Spaced repetition. Cards come back after 1, 3, 7, 16 and 35 days; a miss resets the card and it comes back later in the same round. |
| **Daily 10** | Ten questions from every deck, the same for everyone that day. Only the first attempt counts, and the result can be copied to share. |

## Decks

Triads · Seventh Chords · Intervals · Scales · Modes · Keys & the Circle ·
Diatonic Harmony · Ear: Intervals · Ear: Chord Quality, plus **Custom chords**
(pick any roots, including E♯, B♯, F♭ and C♭, and any triad or seventh types).

Every deck has a cheat sheet, per-deck mastery, and a list of your weak spots.

## Keyboard

`1`–`4` answer · `Enter` next / start · `R` replay the sound · `Esc` quit.
In Spell It: `A`–`G` add a note, `-` flat, `=` sharp, `Backspace` undo, `Enter` check.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # theory engine, question generators, game engine and UI tests
npm run build    # static site in dist/, works from any folder (hash routing)
```

Progress is stored in the browser's `localStorage`; nothing is sent anywhere.

## How it fits together

```
src/
  theory/     Spelled-note engine: intervals, chords, scales, modes, keys.
              Everything is computed, never hand-typed, so every root is correct.
  quiz/
    decks/    One file per topic. A deck lists its cards (one fact each, with a
              readable id like "triads/spell/Eb/min") and turns a card into a
              question with four choices and an explanation.
    game.js   The game engine (scoring, lives, clocks, when a game ends). Plain
              JavaScript, no React, so it is unit-tested directly.
    picker.js Which card comes next: weak cards more often, no quick repeats,
              misses come back a few questions later.
    srs.js    Leitner-style spaced repetition.
    sets.js   What a session plays: a deck, everything mixed, a custom chord
              drill, cards due for review, weak spots, or the Daily 10.
  game/       React hook + screens for a play session.
  pages/      Home, deck page, custom builder, progress.
  audio/      A small Web Audio synth, so there are no samples to download.
```

### Adding a deck

Create `src/quiz/decks/<name>.js` exporting an object with `id`, `title`,
`tagline`, `category`, `color`, `art`, `rules` (the cheat sheet),
`spellKinds`, `defaultOptions`, `cards(options)` and `question(card, rng)`,
then add it to `DECKS` in `src/quiz/decks/index.js`. The test in
`src/quiz/quiz.test.js` automatically checks that every card in every deck
produces four distinct choices, including the right answer.
