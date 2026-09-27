import {
  buildChord,
  CHORD_TYPES,
  CIRCLE,
  chordSymbol,
  DEGREE_NAMES,
  diatonicChord,
  MAJOR_DIATONIC,
  MAJOR_DIATONIC_SEVENTHS,
  noteKey,
  noteName,
  SEVENTH_TYPES,
  TRIAD_TYPES,
} from "../../theory/index.js";
import { makeCard } from "../cards.js";
import { finalize, notesLabel } from "../choices.js";
import { shuffle } from "../rng.js";

// Every standard major key except the two seven-accidental extremes.
export const HARMONY_KEYS = CIRCLE.filter((k) => k !== "Cb" && k !== "C#");

const symbolChoice = (root, type) => ({ id: `${noteKey(root)}:${type}`, label: chordSymbol(root, type) });
const wrap = (d) => ((d - 1 + 7) % 7) + 1;

export const harmony = {
  id: "harmony",
  title: "Diatonic Harmony",
  tagline: "Roman numerals: the chords that live in each key",
  category: "Harmony",
  color: "ink",
  art: "IV",
  spellKinds: ["chord"],
  defaultOptions: {},
  rules: [
    { term: "Pattern", value: "I ii iii IV V vi vii°", note: "major, minor, minor, major, major, minor, diminished" },
    { term: "Sevenths", value: "Imaj7 ii7 iii7 IVmaj7 V7 vi7 viiø7", note: "only V gets a dominant 7th" },
    { term: "Uppercase", value: "major", note: "lowercase = minor, ° = diminished" },
    { term: "Primary", value: "I IV V", note: "the three major chords in a major key" },
  ],

  cards() {
    const cards = [];
    for (let degree = 1; degree <= 7; degree++) {
      cards.push(makeCard("harmony", "quality", [degree]));
      for (const key of HARMONY_KEYS) {
        cards.push(makeCard("harmony", "chord", [key, degree]));
        cards.push(makeCard("harmony", "numeral", [key, degree]));
        cards.push(makeCard("harmony", "seventh", [key, degree]));
      }
    }
    return cards;
  },

  question(card, rng) {
    if (card.kind === "quality") {
      const degree = Number(card.params[0]);
      const { numeral, type } = MAJOR_DIATONIC[degree - 1];
      const choice = (t) => ({ id: t, label: CHORD_TYPES[t].name });
      return {
        prompt: "In any major key, the triad built on",
        subject: `degree ${degree}`,
        caption: `the ${DEGREE_NAMES[degree - 1]}`,
        explain: `Major keys run I ii iii IV V vi vii°, so ${numeral} is always ${CHORD_TYPES[type].name}.`,
        ...finalize(rng, choice(type), shuffle(rng, TRIAD_TYPES.filter((t) => t !== type)).map(choice)),
      };
    }

    const [key, degreeText] = card.params;
    const degree = Number(degreeText);
    const sevenths = card.kind === "seventh";
    const chord = diatonicChord(key, degree, sevenths);
    const notes = buildChord(chord.root, chord.type);
    const keyName = `${noteName(key)} major`;
    const base = {
      reveal: notes.map(noteKey),
      explain: `In ${keyName}, ${chord.numeral} is built on ${noteName(chord.root)}: ${chordSymbol(chord.root, chord.type)} (${notesLabel(notes)}).`,
    };

    if (card.kind === "numeral") {
      const table = MAJOR_DIATONIC;
      const choice = (d) => ({ id: String(d), label: table[d - 1].numeral });
      const near = [wrap(degree + 1), wrap(degree - 1), wrap(degree + 2), wrap(degree + 4)];
      return {
        ...base,
        prompt: `In ${keyName}, this chord is`,
        subject: chordSymbol(chord.root, chord.type),
        ...finalize(rng, choice(degree), shuffle(rng, near).map(choice)),
      };
    }

    // "chord" and "seventh": name the chord that sits on a numeral.
    const family = sevenths ? SEVENTH_TYPES : TRIAD_TYPES;
    const wrongQuality = shuffle(rng, family.filter((t) => t !== chord.type && buildChord(chord.root, t)))
      .slice(0, 1)
      .map((t) => symbolChoice(chord.root, t));
    const neighbours = shuffle(rng, [degree + 1, degree - 1, degree + 3].map(wrap))
      .map((d) => diatonicChord(key, d, sevenths))
      .map((c) => symbolChoice(c.root, c.type));
    const numeral = (sevenths ? MAJOR_DIATONIC_SEVENTHS : MAJOR_DIATONIC)[degree - 1].numeral;
    return {
      ...base,
      prompt: `In ${keyName}, the chord on`,
      subject: numeral,
      spell: card.kind === "chord" ? { notes: notes.map(noteKey) } : undefined,
      ...finalize(rng, symbolChoice(chord.root, chord.type), [...wrongQuality, ...neighbours]),
    };
  },
};
