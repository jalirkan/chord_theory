import { letterIndex, pitchClass, toNote, transpose } from "./notes.js";

// steps = letter-name distance (a 3rd is 2 steps), semis = semitone size.
export const INTERVALS = {
  P1: { steps: 0, semis: 0, name: "unison" },
  m2: { steps: 1, semis: 1, name: "minor 2nd" },
  M2: { steps: 1, semis: 2, name: "major 2nd" },
  A2: { steps: 1, semis: 3, name: "augmented 2nd" },
  m3: { steps: 2, semis: 3, name: "minor 3rd" },
  M3: { steps: 2, semis: 4, name: "major 3rd" },
  d4: { steps: 3, semis: 4, name: "diminished 4th" },
  P4: { steps: 3, semis: 5, name: "perfect 4th" },
  A4: { steps: 3, semis: 6, name: "augmented 4th" },
  d5: { steps: 4, semis: 6, name: "diminished 5th" },
  P5: { steps: 4, semis: 7, name: "perfect 5th" },
  A5: { steps: 4, semis: 8, name: "augmented 5th" },
  m6: { steps: 5, semis: 8, name: "minor 6th" },
  M6: { steps: 5, semis: 9, name: "major 6th" },
  d7: { steps: 6, semis: 9, name: "diminished 7th" },
  m7: { steps: 6, semis: 10, name: "minor 7th" },
  M7: { steps: 6, semis: 11, name: "major 7th" },
  P8: { steps: 7, semis: 12, name: "octave" },
};

/** The thirteen intervals a musician drills first, smallest to largest. */
export const CORE_INTERVALS = [
  "m2", "M2", "m3", "M3", "P4", "A4", "P5", "m6", "M6", "m7", "M7", "P8",
];

export function above(root, intervalCode) {
  const iv = INTERVALS[intervalCode];
  if (!iv) throw new Error(`Unknown interval ${intervalCode}`);
  return transpose(root, iv.steps, iv.semis);
}

export function below(top, intervalCode) {
  const iv = INTERVALS[intervalCode];
  return transpose(top, -iv.steps, -iv.semis);
}

const PERFECT_STEPS = new Set([0, 3, 4]);
const BASE_SEMIS = [0, 2, 4, 5, 7, 9, 11]; // major/perfect size per step
const ORDINALS = ["unison", "2nd", "3rd", "4th", "5th", "6th", "7th"];

/**
 * Name the ascending interval from `a` up to `b` (within an octave).
 * Returns { code, name, steps, semis }, e.g. C→A♭ is { code: "m6" }.
 */
export function intervalBetween(a, b) {
  const steps = (((letterIndex(b) - letterIndex(a)) % 7) + 7) % 7;
  const semis = (((pitchClass(b) - pitchClass(a)) % 12) + 12) % 12;
  let diff = semis - BASE_SEMIS[steps];
  if (diff > 6) diff -= 12;
  if (diff < -6) diff += 12;

  let quality;
  if (PERFECT_STEPS.has(steps)) {
    quality = { 0: "P", 1: "A", 2: "AA", [-1]: "d", [-2]: "dd" }[diff];
  } else {
    quality = { 0: "M", [-1]: "m", 1: "A", [-2]: "d", 2: "AA" }[diff];
  }
  if (!quality) throw new Error(`Unnameable interval ${toNote(a)}→${toNote(b)}`);

  const code = quality + (steps + 1);
  const known = Object.entries(INTERVALS).find(
    ([, iv]) => iv.steps === steps && iv.semis === semis
  );
  const words = { P: "perfect", M: "major", m: "minor", A: "augmented", d: "diminished", AA: "doubly augmented", dd: "doubly diminished" };
  const name =
    steps === 0 && quality === "P"
      ? "unison"
      : `${words[quality]} ${ORDINALS[steps]}`;
  return { code: known ? known[0] : code, name, steps, semis };
}

export function intervalName(code) {
  return INTERVALS[code]?.name ?? code;
}

/** Short label used on buttons: "m3", "P5", "Tritone" for A4. */
export function intervalShort(code) {
  return code === "A4" ? "TT" : code;
}
