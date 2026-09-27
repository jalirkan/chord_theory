// Game formats. Every mode can run on any set of cards.

export const MODES = {
  blitz: {
    id: "blitz",
    title: "Blitz",
    tagline: "60 seconds. Every right answer in a row grows your multiplier.",
    clock: 60,
    scoreLabel: "points",
  },
  survival: {
    id: "survival",
    title: "Survival",
    tagline: "Three lives. The clock shrinks as your streak grows.",
    lives: 3,
    perQuestion: { start: 12, min: 4, step: 0.5 },
    scoreLabel: "in a row",
  },
  spell: {
    id: "spell",
    title: "Spell It",
    tagline: "Build the answer note by note. No multiple choice to lean on.",
    length: 10,
    input: "spell",
    scoreLabel: "correct",
  },
  review: {
    id: "review",
    title: "Review",
    tagline: "Spaced repetition. Cards you miss come back sooner.",
    length: 20,
    scoreLabel: "correct",
  },
  daily: {
    id: "daily",
    title: "Daily 10",
    tagline: "The same ten questions for everyone today. One shot counts.",
    length: 10,
    scoreLabel: "correct",
  },
};

export const MODE_ORDER = ["blitz", "survival", "spell", "review"];

/** Blitz combo: ×1, then ×2 after 3 in a row, ×3 after 6, ×4 after 10. */
export function multiplier(streak) {
  if (streak >= 10) return 4;
  if (streak >= 6) return 3;
  if (streak >= 3) return 2;
  return 1;
}

export const BLITZ_POINTS = 100;

/** Seconds allowed for the next Survival question after `streak` in a row. */
export function survivalSeconds(streak) {
  const { start, min, step } = MODES.survival.perQuestion;
  return Math.max(min, start - streak * step);
}
