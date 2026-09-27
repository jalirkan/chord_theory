import {
  buildChord,
  CHORD_TYPES,
  chordLongName,
  chordSymbol,
  COMMON_ROOTS,
  intervalBetween,
  noteKey,
  noteName,
  SEVENTH_TYPES,
  TRIAD_TYPES,
} from "../../theory/index.js";
import { makeCard } from "../cards.js";
import { finalize, misspellings, notesChoice, notesLabel } from "../choices.js";
import { shuffle } from "../rng.js";

function stackedThirds(notes) {
  const steps = [];
  for (let i = 1; i < notes.length; i++) {
    steps.push(
      `${intervalBetween(notes[i - 1], notes[i]).name} (${noteName(notes[i - 1])}–${noteName(notes[i])})`
    );
  }
  return steps.join(" + ");
}

function explain(root, type, notes) {
  const def = CHORD_TYPES[type];
  const degrees = def.degrees.split(" ").join(", ");
  return `${chordLongName(root, type)} is ${degrees} → ${notesLabel(notes)}. Stack ${stackedThirds(notes)}.`;
}

/** Shared logic for the triad and seventh-chord decks. */
function chordDeck({ id, family, ...meta }) {
  return {
    id,
    ...meta,
    spellKinds: ["spell"],
    defaultOptions: { roots: COMMON_ROOTS, types: family },

    cards({ roots = COMMON_ROOTS, types = family } = {}) {
      const cards = [];
      for (const root of roots) {
        for (const type of types) {
          if (!buildChord(root, type)) continue;
          cards.push(makeCard(id, "spell", [root, type]));
          cards.push(makeCard(id, "name", [root, type]));
        }
      }
      return cards;
    },

    question(card, rng) {
      const [root, type] = card.params;
      const notes = buildChord(root, type);
      const others = shuffle(rng, family.filter((t) => t !== type));
      const base = {
        reveal: notes.map(noteKey),
        explain: explain(root, type, notes),
      };

      if (card.kind === "spell") {
        const wrongTypes = others
          .map((t) => buildChord(root, t))
          .filter(Boolean)
          .map(notesChoice);
        const misspelled = shuffle(rng, misspellings(notes)).map(notesChoice);
        // One spelling trap plus other qualities on the same root.
        const distractors = misspelled.length
          ? [wrongTypes[0], misspelled[0], ...wrongTypes.slice(1)]
          : wrongTypes;
        return {
          ...base,
          prompt: family === TRIAD_TYPES ? "Spell the triad" : "Spell the seventh chord",
          subject: chordLongName(root, type),
          caption: CHORD_TYPES[type].symbol ? chordSymbol(root, type) : undefined,
          spell: { notes: notes.map(noteKey) },
          ...finalize(rng, notesChoice(notes), distractors),
        };
      }

      const nameChoice = (t) => ({ id: `${root}:${t}`, label: chordLongName(root, t) });
      return {
        ...base,
        prompt: family === TRIAD_TYPES ? "Name the triad" : "Name the seventh chord",
        subject: notesLabel(notes),
        ...finalize(rng, nameChoice(type), others.map(nameChoice)),
      };
    },
  };
}

export const triads = chordDeck({
  id: "triads",
  family: TRIAD_TYPES,
  title: "Triads",
  tagline: "Major, minor, diminished and augmented on every root",
  category: "Chords",
  color: "brass",
  art: "m",
  rules: [
    { term: "Major", value: "1 3 5", note: "major 3rd + minor 3rd" },
    { term: "Minor", value: "1 ♭3 5", note: "minor 3rd + major 3rd" },
    { term: "Diminished", value: "1 ♭3 ♭5", note: "minor 3rd + minor 3rd" },
    { term: "Augmented", value: "1 3 ♯5", note: "major 3rd + major 3rd" },
    { term: "Spelling", value: "skip a letter", note: "C–E–G, never C–F♭–G" },
  ],
});

export const sevenths = chordDeck({
  id: "sevenths",
  family: SEVENTH_TYPES,
  title: "Seventh Chords",
  tagline: "maj7, 7, m7, m7♭5, °7 and m(maj7)",
  category: "Chords",
  color: "felt",
  art: "7",
  rules: [
    { term: "maj7", value: "1 3 5 7", note: "major triad + major 7th" },
    { term: "7", value: "1 3 5 ♭7", note: "major triad + minor 7th" },
    { term: "m7", value: "1 ♭3 5 ♭7", note: "minor triad + minor 7th" },
    { term: "m7♭5", value: "1 ♭3 ♭5 ♭7", note: "diminished triad + minor 7th" },
    { term: "°7", value: "1 ♭3 ♭5 𝄫7", note: "stacked minor 3rds" },
    { term: "m(maj7)", value: "1 ♭3 5 7", note: "minor triad + major 7th" },
  ],
});

export { CHORD_TYPES, TRIAD_TYPES, SEVENTH_TYPES };
