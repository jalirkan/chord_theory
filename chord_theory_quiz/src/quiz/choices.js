import {
  enharmonicSpellings,
  LETTERS,
  noteKey,
  noteName,
  toNote,
} from "../theory/index.js";
import { shuffle } from "./rng.js";

export const notesKey = (notes) => notes.map(noteKey).join(" ");
export const notesLabel = (notes) => notes.map(noteName).join(" ");

/**
 * Shuffle the correct answer in with up to `count` distinct distractors.
 * `distractors` is in priority order; earlier entries are kept first.
 */
export function finalize(rng, correct, distractors, count = 3) {
  const seen = new Set([correct.id]);
  const chosen = [];
  for (const d of distractors) {
    if (!d || seen.has(d.id)) continue;
    seen.add(d.id);
    chosen.push(d);
    if (chosen.length === count) break;
  }
  return { choices: shuffle(rng, [correct, ...chosen]), answerId: correct.id };
}

export function noteChoice(n) {
  return { id: noteKey(n), label: noteName(n) };
}

export function notesChoice(notes) {
  return { id: notesKey(notes), label: notesLabel(notes) };
}

/**
 * Wrong notes that look right: the same letter with another accidental, the
 * enharmonic respelling, and a letter-neighbour a semitone away.
 */
export function noteDistractors(rng, answer) {
  const a = toNote(answer);
  const maxAcc = Math.max(1, Math.abs(a.acc));
  const ok = (n) => n && Math.abs(n.acc) <= maxAcc && noteKey(n) !== noteKey(a);
  const sameLetter = [a.acc - 1, a.acc + 1].map((acc) => ({ letter: a.letter, acc }));
  const respelled = enharmonicSpellings(a);
  const li = LETTERS.indexOf(a.letter);
  const neighbours = [LETTERS[(li + 1) % 7], LETTERS[(li + 6) % 7]].map(
    (letter) => ({ letter, acc: a.acc })
  );
  return shuffle(rng, [...sameLetter, ...respelled, ...neighbours].filter(ok));
}

/**
 * The same pitches with one non-root note respelled (E♭ G♭ B♭ → E♭ F♯ B♭).
 * This is the classic spelling mistake, so it makes a strong distractor.
 */
export function misspellings(notes) {
  const out = [];
  notes.forEach((n, i) => {
    if (i === 0) return;
    for (const alt of enharmonicSpellings(n)) {
      if (noteKey(alt) === noteKey(n) || Math.abs(alt.acc) > 1) continue;
      const copy = notes.slice();
      copy[i] = alt;
      out.push(copy);
    }
  });
  return out;
}
