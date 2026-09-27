// Leitner-style spaced repetition. Each card sits in a box 0-5; a correct
// answer on a card that is due moves it up a box and pushes the next review
// further out. A miss sends it back to box 0, due immediately.

const DAY = 24 * 60 * 60 * 1000;
export const BOX_INTERVALS = [0, 1 * DAY, 3 * DAY, 7 * DAY, 16 * DAY, 35 * DAY];
export const MAX_BOX = BOX_INTERVALS.length - 1;
export const MASTERED_BOX = 3;

export function newCardState() {
  return { box: 0, due: 0, seen: 0, right: 0, last: 0 };
}

export function isDue(state, now = Date.now()) {
  return !state || state.due <= now;
}

/**
 * Record one answer. Correct answers on cards that aren't due yet (say, the
 * same card twice in one Blitz round) count toward accuracy but don't promote
 * the card, so cramming can't fake long-term mastery.
 */
export function recordAnswer(state = newCardState(), correct, now = Date.now()) {
  const next = { ...state, seen: state.seen + 1, last: now };
  if (correct) {
    next.right = state.right + 1;
    if (isDue(state, now)) {
      next.box = Math.min(MAX_BOX, state.box + 1);
      next.due = now + BOX_INTERVALS[next.box];
    }
  } else {
    next.box = 0;
    next.due = now;
  }
  return next;
}

/** 0-1: how far through the boxes a set of cards has climbed. */
export function mastery(cardIds, states) {
  if (!cardIds.length) return 0;
  let total = 0;
  for (const id of cardIds) total += Math.min(states[id]?.box ?? 0, MAX_BOX);
  return total / (cardIds.length * MAX_BOX);
}

export function dueCount(cardIds, states, now = Date.now()) {
  return cardIds.filter((id) => states[id] && states[id].seen > 0 && states[id].due <= now).length;
}
