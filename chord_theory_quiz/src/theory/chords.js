import { above } from "./intervals.js";
import { noteKey, noteName, toNote } from "./notes.js";

export const TRIAD_TYPES = ["maj", "min", "dim", "aug"];
export const SEVENTH_TYPES = ["maj7", "dom7", "min7", "m7b5", "dim7", "minmaj7"];

export const CHORD_TYPES = {
  maj: { name: "major", symbol: "", formula: ["P1", "M3", "P5"], degrees: "1 3 5" },
  min: { name: "minor", symbol: "m", formula: ["P1", "m3", "P5"], degrees: "1 ♭3 5" },
  dim: { name: "diminished", symbol: "°", formula: ["P1", "m3", "d5"], degrees: "1 ♭3 ♭5" },
  aug: { name: "augmented", symbol: "+", formula: ["P1", "M3", "A5"], degrees: "1 3 ♯5" },
  sus2: { name: "suspended 2nd", symbol: "sus2", formula: ["P1", "M2", "P5"], degrees: "1 2 5" },
  sus4: { name: "suspended 4th", symbol: "sus4", formula: ["P1", "P4", "P5"], degrees: "1 4 5" },
  maj7: { name: "major 7th", symbol: "maj7", formula: ["P1", "M3", "P5", "M7"], degrees: "1 3 5 7" },
  dom7: { name: "dominant 7th", symbol: "7", formula: ["P1", "M3", "P5", "m7"], degrees: "1 3 5 ♭7" },
  min7: { name: "minor 7th", symbol: "m7", formula: ["P1", "m3", "P5", "m7"], degrees: "1 ♭3 5 ♭7" },
  m7b5: { name: "half-diminished 7th", symbol: "m7♭5", formula: ["P1", "m3", "d5", "m7"], degrees: "1 ♭3 ♭5 ♭7" },
  dim7: { name: "diminished 7th", symbol: "°7", formula: ["P1", "m3", "d5", "d7"], degrees: "1 ♭3 ♭5 𝄫7" },
  minmaj7: { name: "minor-major 7th", symbol: "m(maj7)", formula: ["P1", "m3", "P5", "M7"], degrees: "1 ♭3 5 7" },
};

/** Spelled chord tones, or null if a tone would need a triple accidental. */
export function buildChord(root, type) {
  const def = CHORD_TYPES[type];
  if (!def) throw new Error(`Unknown chord type ${type}`);
  const notes = def.formula.map((iv) => above(toNote(root), iv));
  return notes.some((n) => n === null) ? null : notes;
}

/** "E♭ minor" */
export function chordLongName(root, type) {
  return `${noteName(root)} ${CHORD_TYPES[type].name}`;
}

/** "E♭m7" */
export function chordSymbol(root, type) {
  return noteName(root) + CHORD_TYPES[type].symbol;
}

export function chordId(root, type) {
  return `${noteKey(root)}:${type}`;
}
