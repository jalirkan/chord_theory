import { above, below } from "./intervals.js";
import { toNote } from "./notes.js";

export const SCALE_TYPES = {
  major: { name: "major", formula: ["P1", "M2", "M3", "P4", "P5", "M6", "M7"] },
  naturalMinor: { name: "natural minor", formula: ["P1", "M2", "m3", "P4", "P5", "m6", "m7"] },
  harmonicMinor: { name: "harmonic minor", formula: ["P1", "M2", "m3", "P4", "P5", "m6", "M7"] },
  melodicMinor: { name: "melodic minor", formula: ["P1", "M2", "m3", "P4", "P5", "M6", "M7"] },
  dorian: { name: "Dorian", formula: ["P1", "M2", "m3", "P4", "P5", "M6", "m7"], mode: 2 },
  phrygian: { name: "Phrygian", formula: ["P1", "m2", "m3", "P4", "P5", "m6", "m7"], mode: 3 },
  lydian: { name: "Lydian", formula: ["P1", "M2", "M3", "A4", "P5", "M6", "M7"], mode: 4 },
  mixolydian: { name: "Mixolydian", formula: ["P1", "M2", "M3", "P4", "P5", "M6", "m7"], mode: 5 },
  locrian: { name: "Locrian", formula: ["P1", "m2", "m3", "P4", "d5", "m6", "m7"], mode: 7 },
  majorPentatonic: { name: "major pentatonic", formula: ["P1", "M2", "M3", "P5", "M6"] },
  minorPentatonic: { name: "minor pentatonic", formula: ["P1", "m3", "P4", "P5", "m7"] },
};

export const MODE_TYPES = ["dorian", "phrygian", "lydian", "mixolydian", "locrian"];

/** Which degree of the parent major scale each mode starts on. */
const MODE_OFFSET_FROM_PARENT = {
  dorian: "M2",
  phrygian: "M3",
  lydian: "P4",
  mixolydian: "P5",
  locrian: "M7",
};

export function buildScale(root, type) {
  const def = SCALE_TYPES[type];
  if (!def) throw new Error(`Unknown scale type ${type}`);
  const notes = def.formula.map((iv) => above(toNote(root), iv));
  return notes.some((n) => n === null) ? null : notes;
}

/** D Dorian → C (the major scale with the same notes). */
export function parentMajor(root, modeType) {
  const offset = MODE_OFFSET_FROM_PARENT[modeType];
  if (!offset) throw new Error(`${modeType} is not a mode`);
  return below(toNote(root), offset);
}

export const DEGREE_NAMES = [
  "tonic",
  "supertonic",
  "mediant",
  "subdominant",
  "dominant",
  "submediant",
  "leading tone",
];
