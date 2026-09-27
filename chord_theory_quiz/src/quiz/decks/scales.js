import {
  buildScale,
  CIRCLE,
  DEGREE_NAMES,
  MINOR_TONICS,
  noteKey,
  noteName,
  parentMajor,
  parseNote,
  pitchClass,
  SCALE_TYPES,
} from "../../theory/index.js";
import { makeCard } from "../cards.js";
import { finalize, misspellings, noteChoice, noteDistractors, notesChoice, notesLabel } from "../choices.js";
import { pick, shuffle } from "../rng.js";

const ORDINAL = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"];
const SPELLED_TYPES = ["major", "naturalMinor", "harmonicMinor", "melodicMinor"];

/** "W W H W W W H" for a major scale. */
export function stepPattern(notes) {
  const pcs = [...notes, notes[0]].map(pitchClass);
  const out = [];
  for (let i = 1; i < pcs.length; i++) {
    const d = (pcs[i] - pcs[i - 1] + 12) % 12;
    out.push({ 1: "H", 2: "W", 3: "W+H" }[d] ?? `${d}`);
  }
  return out.join(" ");
}

const tonicsFor = (type) => (type === "major" ? CIRCLE : MINOR_TONICS);
const scaleTitle = (root, type) => `${noteName(root)} ${SCALE_TYPES[type].name}`;

export const scales = {
  id: "scales",
  title: "Scales",
  tagline: "Major and the three minors, note by note",
  category: "Scales",
  color: "slate",
  art: "W H",
  spellKinds: ["spell"],
  defaultOptions: { types: SPELLED_TYPES },
  rules: [
    { term: "Major", value: "W W H W W W H", note: "1 2 3 4 5 6 7" },
    { term: "Natural minor", value: "W H W W H W W", note: "♭3 ♭6 ♭7" },
    { term: "Harmonic minor", value: "W H W W H W+H H", note: "natural minor with a raised 7" },
    { term: "Melodic minor", value: "W H W W W W H", note: "major with a ♭3" },
    { term: "Spelling", value: "every letter once", note: "F♯ major uses E♯, not F" },
  ],

  cards({ types = SPELLED_TYPES } = {}) {
    const cards = [];
    for (const type of types) {
      for (const root of tonicsFor(type)) cards.push(makeCard("scales", "spell", [root, type]));
    }
    for (const root of CIRCLE) {
      for (let degree = 2; degree <= 7; degree++) {
        cards.push(makeCard("scales", "degree", [root, degree]));
      }
    }
    return cards;
  },

  question(card, rng) {
    if (card.kind === "spell") {
      const [root, type] = card.params;
      const notes = buildScale(root, type);
      const otherTypes = shuffle(rng, SPELLED_TYPES.filter((t) => t !== type))
        .map((t) => buildScale(root, t))
        .filter(Boolean)
        .map(notesChoice);
      const misspelled = shuffle(rng, misspellings(notes)).map(notesChoice);
      return {
        prompt: "Spell the scale",
        subject: scaleTitle(root, type),
        caption: stepPattern(notes),
        spell: { notes: notes.map(noteKey) },
        reveal: notes.map(noteKey),
        explain: `${scaleTitle(root, type)} follows ${stepPattern(notes)} and uses every letter once: ${notesLabel(notes)}.`,
        ...finalize(rng, notesChoice(notes), [misspelled[0], ...otherTypes]),
      };
    }

    const [root, degreeText] = card.params;
    const degree = Number(degreeText);
    const notes = buildScale(root, "major");
    const answer = notes[degree - 1];
    const neighbours = [notes[degree - 2], notes[degree % 7]].map(noteChoice);
    const lookalikes = noteDistractors(rng, answer).map(noteChoice);
    return {
      prompt: `The ${ORDINAL[degree - 1]} degree (${DEGREE_NAMES[degree - 1]}) of`,
      subject: `${noteName(root)} major`,
      spell: { notes: [noteKey(answer)] },
      reveal: [noteKey(root), noteKey(answer)],
      explain: `${noteName(root)} major is ${notesLabel(notes)}, so degree ${degree} is ${noteName(answer)}.`,
      ...finalize(rng, noteChoice(answer), [pick(rng, neighbours), ...lookalikes]),
    };
  },
};

export const MODES = [
  { id: "ionian", name: "Ionian", degree: 1, clue: "the major scale itself" },
  { id: "dorian", name: "Dorian", degree: 2, clue: "minor with a natural 6" },
  { id: "phrygian", name: "Phrygian", degree: 3, clue: "minor with a ♭2" },
  { id: "lydian", name: "Lydian", degree: 4, clue: "major with a ♯4" },
  { id: "mixolydian", name: "Mixolydian", degree: 5, clue: "major with a ♭7" },
  { id: "aeolian", name: "Aeolian", degree: 6, clue: "the natural minor scale" },
  { id: "locrian", name: "Locrian", degree: 7, clue: "minor with a ♭2 and a ♭5" },
];
const CHURCH_MODES = MODES.filter((m) => SCALE_TYPES[m.id]);
const modeById = Object.fromEntries(MODES.map((m) => [m.id, m]));

export const modes = {
  id: "modes",
  title: "Modes",
  tagline: "Dorian to Locrian: parents, flavours and spellings",
  category: "Scales",
  color: "olive",
  art: "♯4",
  spellKinds: ["spell"],
  defaultOptions: {},
  rules: MODES.map((m) => ({
    term: m.name,
    value: `from degree ${m.degree}`,
    note: m.clue,
  })),

  cards() {
    const cards = [];
    for (const m of MODES) {
      cards.push(makeCard("modes", "clue", [m.id]));
      cards.push(makeCard("modes", "degree", [m.id]));
    }
    for (const m of CHURCH_MODES) {
      for (const parent of CIRCLE) {
        const root = noteKey(buildScale(parent, "major")[m.degree - 1]);
        cards.push(makeCard("modes", "parent", [root, m.id]));
        cards.push(makeCard("modes", "spell", [root, m.id]));
      }
    }
    return cards;
  },

  question(card, rng) {
    const nameChoice = (m) => ({ id: m.id, label: m.name });
    const others = (m) => shuffle(rng, MODES.filter((o) => o.id !== m.id)).map(nameChoice);

    if (card.kind === "clue" || card.kind === "degree") {
      const m = modeById[card.params[0]];
      const isClue = card.kind === "clue";
      return {
        prompt: isClue ? "Which mode is" : "Which mode starts on",
        subject: isClue ? m.clue : `degree ${m.degree} of a major scale`,
        small: true,
        explain: `${m.name} starts on degree ${m.degree} of the major scale: ${m.clue}.`,
        ...finalize(rng, nameChoice(m), others(m)),
      };
    }

    const [root, modeId] = card.params;
    const m = modeById[modeId];
    const notes = buildScale(root, modeId);
    const parent = parentMajor(root, modeId);
    const title = `${noteName(root)} ${m.name}`;
    const explain = `${title} starts on degree ${m.degree} of ${noteName(parent)} major, so it uses the same notes: ${notesLabel(notes)}.`;

    if (card.kind === "spell") {
      const wrong = shuffle(rng, CHURCH_MODES.filter((o) => o.id !== modeId))
        .map((o) => buildScale(root, o.id))
        .filter(Boolean)
        .map(notesChoice);
      return {
        prompt: "Spell the mode",
        subject: title,
        caption: m.clue,
        spell: { notes: notes.map(noteKey) },
        reveal: notes.map(noteKey),
        explain,
        ...finalize(rng, notesChoice(notes), wrong),
      };
    }

    const keyChoice = (n) => ({ id: noteKey(n), label: `${noteName(n)} major` });
    // The mode's own root read as a major key is the most tempting wrong answer,
    // then the parents other modes would have, then the parent's circle neighbours.
    const p = CIRCLE.indexOf(noteKey(parent));
    const wrong = [
      parseNote(root),
      ...shuffle(rng, CHURCH_MODES.filter((o) => o.id !== modeId).map((o) => parentMajor(root, o.id))),
      ...[1, -1, 2, -2, 3, -3].map((d) => CIRCLE[p + d] && parseNote(CIRCLE[p + d])),
    ].filter((n) => n && CIRCLE.includes(noteKey(n)));
    return {
      prompt: "Same notes as which major scale?",
      subject: title,
      reveal: notes.map(noteKey),
      explain,
      ...finalize(rng, keyChoice(parent), wrong.map(keyChoice)),
    };
  },
};
