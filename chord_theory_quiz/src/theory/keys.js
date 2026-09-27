import { above, below } from "./intervals.js";
import { noteKey, parseNote } from "./notes.js";
import { buildScale } from "./scales.js";

export const SHARP_ORDER = ["F#", "C#", "G#", "D#", "A#", "E#", "B#"];
export const FLAT_ORDER = ["Bb", "Eb", "Ab", "Db", "Gb", "Cb", "Fb"];

/** The 15 major keys around the circle, -7 (seven flats) to +7 (seven sharps). */
export const CIRCLE = [
  "Cb", "Gb", "Db", "Ab", "Eb", "Bb", "F",
  "C",
  "G", "D", "A", "E", "B", "F#", "C#",
];

/** Signed accidental count: +3 means three sharps, -4 means four flats. */
export function majorKeySignature(tonic) {
  const i = CIRCLE.indexOf(noteKey(tonic));
  if (i === -1) throw new Error(`${noteKey(tonic)} major is not a standard key`);
  return i - 7;
}

export function minorKeySignature(tonic) {
  return majorKeySignature(relativeMajor(tonic));
}

export function majorKeyWithSignature(count) {
  return parseNote(CIRCLE[count + 7]);
}

/** The accidentals in a signature, in the order they are written. */
export function signatureAccidentals(count) {
  return count >= 0 ? SHARP_ORDER.slice(0, count) : FLAT_ORDER.slice(0, -count);
}

export function relativeMinor(majorTonic) {
  return above(majorTonic, "M6");
}

export function relativeMajor(minorTonic) {
  return above(minorTonic, "m3");
}

/** Major keys whose relative minor is a standard minor key (A♯ through A♭). */
export const MINOR_TONICS = CIRCLE.map((k) => noteKey(relativeMinor(k)));

export function fifthAbove(tonic) {
  return above(tonic, "P5");
}

export function fifthBelow(tonic) {
  return below(tonic, "P5");
}

export function describeSignature(count) {
  if (count === 0) return "no sharps or flats";
  const n = Math.abs(count);
  const kind = count > 0 ? (n === 1 ? "sharp" : "sharps") : n === 1 ? "flat" : "flats";
  return `${n} ${kind}`;
}

// Diatonic triads in a major key: I ii iii IV V vi vii°.
export const MAJOR_DIATONIC = [
  { numeral: "I", type: "maj" },
  { numeral: "ii", type: "min" },
  { numeral: "iii", type: "min" },
  { numeral: "IV", type: "maj" },
  { numeral: "V", type: "maj" },
  { numeral: "vi", type: "min" },
  { numeral: "vii°", type: "dim" },
];

export const MAJOR_DIATONIC_SEVENTHS = [
  { numeral: "Imaj7", type: "maj7" },
  { numeral: "ii7", type: "min7" },
  { numeral: "iii7", type: "min7" },
  { numeral: "IVmaj7", type: "maj7" },
  { numeral: "V7", type: "dom7" },
  { numeral: "vi7", type: "min7" },
  { numeral: "viiø7", type: "m7b5" },
];

/** The chord built on scale degree `degree` (1-7) of a major key. */
export function diatonicChord(tonic, degree, sevenths = false) {
  const scale = buildScale(tonic, "major");
  const table = sevenths ? MAJOR_DIATONIC_SEVENTHS : MAJOR_DIATONIC;
  return { root: scale[degree - 1], ...table[degree - 1] };
}
