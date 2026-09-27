import {
  above,
  buildChord,
  CHORD_TYPES,
  chordSymbol,
  CORE_INTERVALS,
  INTERVALS,
  noteKey,
  noteName,
} from "../../theory/index.js";
import { makeCard } from "../cards.js";
import { finalize, notesLabel } from "../choices.js";
import { pick, shuffle } from "../rng.js";

// Roots kept in a comfortable singing range once stacked from octave 4.
const EAR_ROOTS = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb"];

export const INTERVAL_SONGS = {
  m2: "Jaws",
  M2: "Happy Birthday",
  m3: "Greensleeves",
  M3: "When the Saints Go Marching In",
  P4: "Here Comes the Bride",
  A4: "The Simpsons theme",
  P5: "Star Wars main theme",
  m6: "The Entertainer",
  M6: "My Bonnie Lies Over the Ocean",
  m7: "Star Trek (original theme)",
  M7: "Take On Me (chorus)",
  P8: "Somewhere Over the Rainbow",
};

const intervalLabel = (code) => (code === "A4" ? "tritone" : INTERVALS[code].name);

/** Nearby sizes are the ones that are actually hard to tell apart by ear. */
function nearestBySize(rng, code, pool) {
  const size = INTERVALS[code].semis;
  return shuffle(rng, pool.filter((c) => c !== code))
    .sort((a, b) => Math.abs(INTERVALS[a].semis - size) - Math.abs(INTERVALS[b].semis - size));
}

export const earIntervals = {
  id: "ear-intervals",
  title: "Ear: Intervals",
  tagline: "Hear two notes, name the distance",
  category: "Ear training",
  color: "ivory",
  art: "♪♪",
  ear: true,
  spellKinds: [],
  defaultOptions: { codes: CORE_INTERVALS },
  rules: CORE_INTERVALS.map((c) => ({
    term: intervalLabel(c),
    value: `${INTERVALS[c].semis} half steps`,
    note: INTERVAL_SONGS[c],
  })),

  cards({ codes = CORE_INTERVALS } = {}) {
    return codes.map((c) => makeCard("ear-intervals", "hear", [c]));
  },

  question(card, rng, { codes = CORE_INTERVALS } = {}) {
    const code = card.params[0];
    const root = pick(rng, EAR_ROOTS);
    const top = above(root, code);
    const choice = (c) => ({ id: c, label: intervalLabel(c) });
    // Pick the three hardest distractors from the two closest sizes either side.
    const near = nearestBySize(rng, code, codes.length >= 4 ? codes : CORE_INTERVALS).slice(0, 5);
    return {
      prompt: "Name the interval you hear",
      subject: null,
      audio: { notes: [root, noteKey(top)], style: "interval" },
      reveal: [root, noteKey(top)],
      explain: `${noteName(root)} up to ${noteName(top)}: ${INTERVALS[code].semis} half steps, a ${intervalLabel(code)}. Think “${INTERVAL_SONGS[code]}”.`,
      ...finalize(rng, choice(code), shuffle(rng, near).map(choice)),
    };
  },
};

const EAR_CHORD_TYPES = ["maj", "min", "dim", "aug", "maj7", "dom7", "min7", "m7b5", "dim7"];
export const CHORD_COLOURS = {
  maj: "bright and settled",
  min: "darker, a little sad",
  dim: "tense and squeezed",
  aug: "dreamy, floating, unresolved",
  maj7: "lush and jazzy",
  dom7: "bluesy, wants to resolve",
  min7: "mellow and soft",
  m7b5: "moody, searching",
  dim7: "dramatic, movie-villain tension",
};

export const earChords = {
  id: "ear-chords",
  title: "Ear: Chord Quality",
  tagline: "Major or minor? Dominant or major 7th?",
  category: "Ear training",
  color: "ebony",
  art: "♫",
  ear: true,
  spellKinds: [],
  defaultOptions: { types: EAR_CHORD_TYPES },
  rules: EAR_CHORD_TYPES.map((t) => ({
    term: CHORD_TYPES[t].name,
    value: CHORD_TYPES[t].degrees,
    note: CHORD_COLOURS[t],
  })),

  cards({ types = EAR_CHORD_TYPES } = {}) {
    return types.map((t) => makeCard("ear-chords", "hear", [t]));
  },

  question(card, rng, { types = EAR_CHORD_TYPES } = {}) {
    const type = card.params[0];
    const root = pick(rng, EAR_ROOTS);
    const notes = buildChord(root, type);
    const isSeventh = notes.length === 4;
    const pool = types.length >= 4 ? types : EAR_CHORD_TYPES;
    const sameSize = pool.filter((t) => t !== type && (CHORD_TYPES[t].formula.length === 4) === isSeventh);
    const otherSize = pool.filter((t) => t !== type && !sameSize.includes(t));
    const choice = (t) => ({ id: t, label: CHORD_TYPES[t].name });
    return {
      prompt: "Name the chord quality you hear",
      subject: null,
      audio: { notes: notes.map(noteKey), style: "chord" },
      reveal: notes.map(noteKey),
      explain: `That was ${chordSymbol(root, type)} (${notesLabel(notes)}), a ${CHORD_TYPES[type].name} chord: ${CHORD_COLOURS[type]}.`,
      ...finalize(rng, choice(type), [...shuffle(rng, sameSize), ...shuffle(rng, otherSize)].map(choice)),
    };
  },
};
