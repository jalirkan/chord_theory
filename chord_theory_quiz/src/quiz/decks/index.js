import { parseCardId } from "../cards.js";
import { sevenths, triads } from "./chords.js";
import { earChords, earIntervals } from "./ear.js";
import { harmony } from "./harmony.js";
import { intervals } from "./intervals.js";
import { keys } from "./keys.js";
import { modes, scales } from "./scales.js";

export const DECKS = [
  triads,
  sevenths,
  intervals,
  scales,
  modes,
  keys,
  harmony,
  earIntervals,
  earChords,
];

export const DECK_BY_ID = Object.fromEntries(DECKS.map((d) => [d.id, d]));

export function getDeck(id) {
  const deck = DECK_BY_ID[id];
  if (!deck) throw new Error(`Unknown deck "${id}"`);
  return deck;
}

export function deckCards(deckId, options) {
  const deck = getDeck(deckId);
  return deck.cards({ ...deck.defaultOptions, ...options });
}

export function isSpellable(card) {
  return getDeck(card.deckId).spellKinds.includes(card.kind);
}

/**
 * Build the question for a card. `options` narrows the answer pool for decks
 * that support it (e.g. an ear deck limited to four chord types).
 */
export function questionFor(card, rng, options = {}) {
  const c = typeof card === "string" ? parseCardId(card) : card;
  const deck = getDeck(c.deckId);
  const q = deck.question(c, rng, { ...deck.defaultOptions, ...options });
  return { ...q, cardId: c.id, deckId: c.deckId };
}
