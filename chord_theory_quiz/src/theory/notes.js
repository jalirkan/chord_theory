// Spelled pitch classes. A note is { letter: 'C'..'B', acc: -2..2 } so that
// E♭ and D♯ stay distinct even though they share a piano key.

export const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const NATURAL_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

const ACC_ASCII = { "-2": "bb", "-1": "b", 0: "", 1: "#", 2: "##" };
const ACC_GLYPH = { "-2": "𝄫", "-1": "♭", 0: "", 1: "♯", 2: "𝄪" };

const mod = (n, m) => ((n % m) + m) % m;

export function note(letter, acc = 0) {
  return { letter, acc };
}

/** Parse "Eb", "E♭", "F##", "Fx", "Bbb", "C" (case-insensitive letter). */
export function parseNote(text) {
  const m = /^\s*([A-Ga-g])\s*(bb|b|##|#|x|𝄫|♭|𝄪|♯|♮)?\s*$/u.exec(text);
  if (!m) throw new Error(`Not a note name: "${text}"`);
  const acc =
    { bb: -2, "𝄫": -2, b: -1, "♭": -1, "#": 1, "♯": 1, "##": 2, x: 2, "𝄪": 2 }[
      m[2]
    ] ?? 0;
  return { letter: m[1].toUpperCase(), acc };
}

/** Coerce a note or note name to a note object. */
export function toNote(n) {
  return typeof n === "string" ? parseNote(n) : n;
}

/** ASCII key, e.g. "Eb", "F##". Stable for ids and comparisons. */
export function noteKey(n) {
  const { letter, acc } = toNote(n);
  return letter + ACC_ASCII[acc];
}

/** Display name with real accidental glyphs, e.g. "E♭", "F𝄪". */
export function noteName(n) {
  const { letter, acc } = toNote(n);
  return letter + ACC_GLYPH[acc];
}

export function pitchClass(n) {
  const { letter, acc } = toNote(n);
  return mod(NATURAL_PC[letter] + acc, 12);
}

export function letterIndex(n) {
  return LETTERS.indexOf(toNote(n).letter);
}

export function sameSpelling(a, b) {
  return noteKey(a) === noteKey(b);
}

export function enharmonic(a, b) {
  return pitchClass(a) === pitchClass(b);
}

/**
 * Move `n` up by `steps` letter names and `semis` semitones, returning the
 * correctly spelled result (e.g. up a major 3rd from E♭ gives G, not F𝄪).
 * Returns null when the spelling would need more than a double accidental.
 */
export function transpose(n, steps, semis) {
  const src = toNote(n);
  const letter = LETTERS[mod(LETTERS.indexOf(src.letter) + steps, 7)];
  let acc = mod(pitchClass(src) + semis - NATURAL_PC[letter], 12);
  if (acc > 6) acc -= 12;
  if (acc < -2 || acc > 2) return null;
  return { letter, acc };
}

/** Every spelling of the same pitch class with at most a double accidental. */
export function enharmonicSpellings(n) {
  const pc = pitchClass(n);
  const out = [];
  for (const letter of LETTERS) {
    let acc = mod(pc - NATURAL_PC[letter], 12);
    if (acc > 6) acc -= 12;
    if (acc >= -2 && acc <= 2) out.push({ letter, acc });
  }
  return out;
}

/**
 * MIDI numbers for a list of notes, stacked upward from `baseOctave` so each
 * note sits above the previous one (a C major scale ends on B4, not B3).
 */
export function toMidiAscending(notes, baseOctave = 4) {
  const result = [];
  let prev = -Infinity;
  for (const n of notes) {
    const { letter, acc } = toNote(n);
    // Octave follows the letter, so B♯4 is one semitone above B4.
    let midi = 12 * (baseOctave + 1) + NATURAL_PC[letter] + acc;
    while (midi <= prev) midi += 12;
    result.push(midi);
    prev = midi;
  }
  return result;
}

/** MIDI numbers for notes placed by pitch class inside one octave (C4–B4). */
export function toMidiInOctave(notes, octave = 4) {
  return notes.map((n) => 12 * (octave + 1) + pitchClass(n));
}

/** Common roots: the naturals plus the five usual black-key spellings each way. */
export const NATURAL_ROOTS = LETTERS.slice();
export const SHARP_ROOTS = ["C#", "D#", "F#", "G#", "A#"];
export const FLAT_ROOTS = ["Db", "Eb", "Gb", "Ab", "Bb"];
export const RARE_ROOTS = ["E#", "B#", "Fb", "Cb"];
export const COMMON_ROOTS = [...NATURAL_ROOTS, ...SHARP_ROOTS, ...FLAT_ROOTS];
