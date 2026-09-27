import {
  above,
  COMMON_ROOTS,
  CORE_INTERVALS,
  INTERVALS,
  intervalBetween,
  LETTERS,
  noteKey,
  noteName,
  parseNote,
} from "../../theory/index.js";
import { makeCard } from "../cards.js";
import { finalize, noteChoice, noteDistractors } from "../choices.js";
import { shuffle } from "../rng.js";

const DRILLED = CORE_INTERVALS.filter((c) => c !== "P8");

function explain(root, top, code) {
  const iv = INTERVALS[code];
  const start = LETTERS.indexOf(root.letter);
  const letters = Array.from({ length: iv.steps + 1 }, (_, i) => LETTERS[(start + i) % 7]);
  return `${noteName(root)} up to ${noteName(top)} spans ${letters.length} letter names (${letters.join(" ")}) and ${iv.semis} half steps: a ${iv.name}.`;
}

/**
 * Wrong interval names that sound or look close: same number, same size or a
 * half step away first, then the next-nearest sizes as a fallback.
 */
function intervalDistractors(rng, code) {
  const iv = INTERVALS[code];
  const candidates = Object.entries(INTERVALS).filter(
    ([c]) => c !== code && c !== "P1" && c !== "P8"
  );
  const near = candidates
    .filter(
      ([, other]) =>
        other.steps === iv.steps ||
        other.semis === iv.semis ||
        Math.abs(other.semis - iv.semis) === 1
    )
    .map(([c]) => c);
  const bySize = candidates
    .sort((a, b) => Math.abs(a[1].semis - iv.semis) - Math.abs(b[1].semis - iv.semis))
    .map(([c]) => c);
  return [...shuffle(rng, near), ...bySize];
}

export const intervals = {
  id: "intervals",
  title: "Intervals",
  tagline: "Name the distance, or find the note above",
  category: "Foundations",
  color: "teal",
  art: "P5",
  spellKinds: ["above"],
  defaultOptions: { roots: COMMON_ROOTS },
  rules: [
    { term: "Number", value: "count letters", note: "C→E is C D E = a 3rd" },
    { term: "Quality", value: "count half steps", note: "3 = minor 3rd, 4 = major 3rd" },
    { term: "Perfect", value: "1, 4, 5, 8", note: "one half step smaller is diminished" },
    { term: "Major/minor", value: "2, 3, 6, 7", note: "minor is one half step below major" },
    { term: "Tritone", value: "6 half steps", note: "A4 (F–B) or d5 (B–F)" },
  ],

  cards({ roots = COMMON_ROOTS } = {}) {
    const cards = [];
    for (const root of roots) {
      for (const code of DRILLED) {
        if (!above(root, code)) continue;
        cards.push(makeCard("intervals", "above", [root, code]));
        cards.push(makeCard("intervals", "name", [root, code]));
      }
    }
    return cards;
  },

  question(card, rng) {
    const root = parseNote(card.params[0]);
    const code = card.params[1];
    const top = above(root, code);
    const base = {
      reveal: [noteKey(root), noteKey(top)],
      explain: explain(root, top, code),
    };
    if (card.kind === "above") {
      return {
        ...base,
        prompt: `A ${INTERVALS[code].name} above`,
        subject: noteName(root),
        spell: { notes: [noteKey(top)] },
        ...finalize(rng, noteChoice(top), noteDistractors(rng, top).map(noteChoice)),
      };
    }
    const found = intervalBetween(root, top).code;
    const choice = (c) => ({ id: c, label: INTERVALS[c].name });
    return {
      ...base,
      prompt: "Name the interval",
      subject: `${noteName(root)} → ${noteName(top)}`,
      ...finalize(rng, choice(found), intervalDistractors(rng, found).map(choice)),
    };
  },
};
