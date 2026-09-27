import { describe, expect, it } from "vitest";
import { deckCards } from "./decks/index.js";
import { createGame, spellingMatches } from "./game.js";
import { seededRng } from "./rng.js";

const triads = deckCards("triads");
const wrongChoice = (q) => q.choices.find((c) => c.id !== q.answerId).id;

function play(game, correct, now) {
  const q = game.state.question;
  return game.answer({ choiceId: correct ? q.answerId : wrongChoice(q) }, now);
}

describe("blitz", () => {
  it("scores with a growing multiplier and ends when the clock runs out", () => {
    const game = createGame({ modeId: "blitz", cards: triads, rng: seededRng(1) });
    let t = 0;
    game.start(t);
    const points = [];
    for (let i = 0; i < 5; i++) {
      t += 1000;
      points.push(play(game, true, t).points);
      game.next(t);
    }
    expect(points).toEqual([100, 100, 100, 200, 200]);
    t += 1000;
    expect(play(game, false, t).points).toBe(0);
    expect(game.state.streak).toBe(0);
    game.next(t);

    // Time spent in feedback is free; only question time drains the clock.
    expect(game.timeLeft(t)).toBe(54);
    expect(game.tick(t + 53_000)).toBe(false);
    expect(game.tick(t + 54_000)).toBe(true);
    expect(game.state.phase).toBe("over");
    expect(game.state.endedBy).toBe("clock");
    expect(game.state.score).toBe(700);
  });
});

describe("survival", () => {
  it("loses a life on a miss or a timeout and ends at zero", () => {
    const game = createGame({ modeId: "survival", cards: triads, rng: seededRng(2) });
    game.start(0);
    expect(game.timeTotal()).toBe(12);
    play(game, false, 1000);
    expect(game.state.lives).toBe(2);
    expect(game.state.feedback.autoAdvanceMs).toBeNull();
    game.next(2000);

    // Let the clock expire.
    expect(game.tick(2000 + 12_000)).toBe(true);
    expect(game.state.feedback.timedOut).toBe(true);
    expect(game.state.lives).toBe(1);
    game.next(20_000);

    play(game, true, 21_000);
    game.next(21_500);
    expect(game.timeTotal()).toBe(11.5); // the clock shrinks with the streak

    play(game, false, 22_000);
    expect(game.state.lives).toBe(0);
    game.next(23_000);
    expect(game.state.phase).toBe("over");
    expect(game.state.endedBy).toBe("lives");
    expect(game.state.score).toBe(1);
  });
});

describe("spell it", () => {
  it("only asks spellable questions and checks spelling as a set", () => {
    const game = createGame({ modeId: "spell", cards: triads, rng: seededRng(3) });
    game.start(0);
    for (let i = 0; i < 10; i++) {
      const q = game.state.question;
      expect(q.spell).toBeTruthy();
      const notes = i % 2 ? [...q.spell.notes].reverse() : ["C", "C", "C"];
      const fb = game.answer({ notes }, i);
      expect(fb.correct).toBe(i % 2 === 1);
      game.next(i);
    }
    expect(game.state.phase).toBe("over");
    expect(game.state.correct).toBe(5);
  });

  it("rejects enharmonic respellings", () => {
    expect(spellingMatches(["Eb", "Gb", "Bb"], ["Bb", "Eb", "Gb"])).toBe(true);
    expect(spellingMatches(["Eb", "Gb", "Bb"], ["Eb", "F#", "Bb"])).toBe(false);
    expect(spellingMatches(["Eb", "Gb", "Bb"], ["Eb", "Gb"])).toBe(false);
  });

  it("reports an empty pool when a deck has nothing to spell", () => {
    const game = createGame({ modeId: "spell", cards: deckCards("ear-chords") });
    expect(game.state.empty).toBe(true);
  });
});

describe("review", () => {
  it("brings misses back before the end", () => {
    const cards = triads.slice(0, 4);
    const game = createGame({ modeId: "review", cards, rng: seededRng(4) });
    game.start(0);
    const first = game.state.question.cardId;
    play(game, false, 1);
    game.next(2);
    const seen = [];
    while (game.state.phase !== "over") {
      seen.push(game.state.question.cardId);
      play(game, true, 3);
      game.next(4);
    }
    expect(seen).toContain(first);
    expect(game.state.answered).toBe(5);
  });
});
