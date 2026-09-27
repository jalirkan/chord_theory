import { DECKS, deckCards, questionFor } from "../quiz/decks/index.js";
import { seededRng } from "../quiz/rng.js";
import { dueCount, mastery } from "../quiz/srs.js";

const idCache = new Map();

/** Card ids for a deck's default options (memoized; decks never change at runtime). */
export function deckCardIds(deckId) {
  if (!idCache.has(deckId)) idCache.set(deckId, deckCards(deckId).map((c) => c.id));
  return idCache.get(deckId);
}

export function deckStats(deckId, states, now = Date.now()) {
  const ids = deckCardIds(deckId);
  const seen = ids.filter((id) => states[id]?.seen).length;
  return {
    total: ids.length,
    seen,
    mastery: mastery(ids, states),
    due: dueCount(ids, states, now),
  };
}

const labelCache = new Map();

/** Short human label for a card, e.g. "E♭ minor · Spell the triad". */
export function cardLabel(cardId) {
  if (!labelCache.has(cardId)) {
    let label = cardId;
    try {
      const q = questionFor(cardId, seededRng(1));
      const answer = q.choices.find((c) => c.id === q.answerId)?.label;
      label = q.subject ? `${q.subject} · ${q.prompt}` : `${answer} · ${q.prompt}`;
    } catch {
      // A card from an older version of a deck; fall back to its id.
    }
    labelCache.set(cardId, label);
  }
  return labelCache.get(cardId);
}

export function totalDue(states, now = Date.now()) {
  return DECKS.filter((d) => !d.ear).reduce((n, d) => n + dueCount(deckCardIds(d.id), states, now), 0);
}
