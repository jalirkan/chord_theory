import { COMMON_ROOTS, SEVENTH_TYPES, TRIAD_TYPES } from "../theory/index.js";
import { parseCardId } from "./cards.js";
import { DECK_BY_ID, DECKS, deckCards } from "./decks/index.js";
import { pick, seededRng, shuffle } from "./rng.js";

// A "set" is what a session draws from: one deck, a custom chord drill,
// everything mixed together, cards due for review, or your weakest cards.

export const REVIEW_LENGTH = 20;
const REVIEW_MIN = 10;

const TEXT_DECKS = DECKS.filter((d) => !d.ear);

function mixedCards() {
  return TEXT_DECKS.flatMap((d) => deckCards(d.id));
}

/** Custom chord drills come from the URL: ?roots=A,C,F%23&types=maj,dim7 */
export function parseCustom(search) {
  const params = new URLSearchParams(search);
  const list = (k) => (params.get(k) ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const roots = list("roots");
  const types = list("types");
  return {
    roots: roots.length ? roots : ["C", "G", "F"],
    types: types.length ? types : ["maj", "min"],
  };
}

export function customSearch({ roots, types }) {
  const params = new URLSearchParams({ roots: roots.join(","), types: types.join(",") });
  return `?${params.toString()}`;
}

function customCards({ roots, types }) {
  const triadTypes = types.filter((t) => TRIAD_TYPES.includes(t));
  const seventhTypes = types.filter((t) => SEVENTH_TYPES.includes(t));
  return [
    ...(triadTypes.length ? deckCards("triads", { roots, types: triadTypes }) : []),
    ...(seventhTypes.length ? deckCards("sevenths", { roots, types: seventhTypes }) : []),
  ];
}

/** Cards due now, oldest first, topped up with unseen cards so there's always a round. */
function reviewCards(pool, states, now, rng) {
  const known = new Set(pool.map((c) => c.id));
  const due = Object.entries(states)
    .filter(([id, s]) => s.seen > 0 && s.due <= now && known.has(id))
    .sort((a, b) => a[1].due - b[1].due)
    .map(([id]) => parseCardId(id));
  const fresh = shuffle(rng, pool.filter((c) => !states[c.id]?.seen));
  const cards = due.slice(0, REVIEW_LENGTH);
  if (cards.length < REVIEW_MIN) cards.push(...fresh.slice(0, REVIEW_MIN - cards.length));
  return { cards, dueCount: due.length };
}

/** Cards answered at least twice, lowest accuracy first. */
export function weakestCards(states, limit = 12) {
  return Object.entries(states)
    .filter(([id, s]) => s.seen >= 2 && s.right < s.seen && DECK_BY_ID[parseCardId(id).deckId])
    .sort((a, b) => a[1].right / a[1].seen - b[1].right / b[1].seen || b[1].seen - a[1].seen)
    .slice(0, limit)
    .map(([id]) => id);
}

/** Ten questions everyone shares today: one per text deck, the rest at random. */
export function dailyCards(dateKey) {
  const rng = seededRng(`daily:${dateKey}`);
  const picks = TEXT_DECKS.map((d) => pick(rng, deckCards(d.id)));
  const all = mixedCards();
  while (picks.length < 10) {
    const c = pick(rng, all);
    if (!picks.some((p) => p.id === c.id)) picks.push(c);
  }
  return shuffle(rng, picks);
}

/**
 * Resolve what a session plays.
 * setId: a deck id, "mixed", "custom", "due", or "weak".
 */
export function resolveSet(setId, { search = "", states = {}, now = Date.now(), rng = Math.random, modeId } = {}) {
  let title;
  let cards;
  let options = {};

  if (DECK_BY_ID[setId]) {
    title = DECK_BY_ID[setId].title;
    cards = deckCards(setId);
  } else if (setId === "mixed") {
    title = "Everything";
    cards = mixedCards();
  } else if (setId === "custom") {
    options = parseCustom(search);
    title = "Custom chords";
    cards = customCards(options);
  } else if (setId === "due") {
    title = "All decks";
    cards = mixedCards();
  } else if (setId === "weak") {
    title = "Weak spots";
    cards = weakestCards(states).map(parseCardId);
  } else {
    throw new Error(`Unknown set "${setId}"`);
  }

  let dueCount = 0;
  if (modeId === "review" && setId !== "weak") {
    ({ cards, dueCount } = reviewCards(cards, states, now, rng));
  }

  return { setId, title, cards, options, dueCount };
}

export const CUSTOM_ROOT_GROUPS = [
  { label: "Naturals", roots: ["C", "D", "E", "F", "G", "A", "B"] },
  { label: "Sharps", roots: ["C#", "D#", "E#", "F#", "G#", "A#", "B#"] },
  { label: "Flats", roots: ["Cb", "Db", "Eb", "Fb", "Gb", "Ab", "Bb"] },
];

export { COMMON_ROOTS, TRIAD_TYPES, SEVENTH_TYPES };
