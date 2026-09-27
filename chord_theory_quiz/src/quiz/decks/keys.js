import {
  CIRCLE,
  describeSignature,
  fifthAbove,
  fifthBelow,
  majorKeySignature,
  majorKeyWithSignature,
  MINOR_TONICS,
  minorKeySignature,
  noteKey,
  noteName,
  parseNote,
  relativeMajor,
  relativeMinor,
  signatureAccidentals,
  above,
} from "../../theory/index.js";
import { makeCard } from "../cards.js";
import { finalize, notesChoice, notesLabel } from "../choices.js";
import { shuffle } from "../rng.js";

const sigLabel = (count) =>
  count === 0 ? "none" : `${Math.abs(count)} ${count > 0 ? "♯" : "♭"}`;
const sigChoice = (count) => ({ id: String(count), label: sigLabel(count) });

/** Plausible wrong counts: off by one, and the same number of the other accidental. */
function countDistractors(rng, count) {
  const mirrored = count !== 0 ? [-count] : [];
  const near = shuffle(rng, [count - 1, count + 1, count - 2, count + 2]);
  return [...mirrored, ...near]
    .filter((c) => c !== count && c >= -7 && c <= 7)
    .map(sigChoice);
}

/** Signatures that are almost right: one too few or many, or a wrong member. */
function accidentalVariants(count) {
  const n = Math.abs(count);
  const order = signatureAccidentals(count > 0 ? 7 : -7);
  const head = order.slice(0, n - 1);
  return [
    n > 1 && order.slice(0, n - 1),
    n < 7 && order.slice(0, n + 1),
    n > 2 && order.slice(0, n - 2),
    n < 7 && [...head, order[n]],
    n < 6 && [...head, order[n + 1]],
    n > 2 && order.slice(0, n).filter((_, i) => i !== Math.floor(n / 2)),
  ].filter((v) => v && v.length);
}

const majorChoice = (n) => ({ id: noteKey(n), label: `${noteName(n)} major` });
const minorChoice = (n) => ({ id: `${noteKey(n)}m`, label: `${noteName(n)} minor` });

export const keys = {
  id: "keys",
  title: "Keys & the Circle",
  tagline: "Key signatures, relative minors, fifths",
  category: "Keys",
  color: "orange",
  art: "♯♭",
  spellKinds: ["accidentals"],
  defaultOptions: {},
  rules: [
    { term: "Sharps", value: "F C G D A E B", note: "Father Charles Goes Down And Ends Battle" },
    { term: "Flats", value: "B E A D G C F", note: "the order of sharps, reversed" },
    { term: "Sharp keys", value: "last sharp + half step", note: "F♯ C♯ G♯ → A major" },
    { term: "Flat keys", value: "second-to-last flat", note: "B♭ E♭ A♭ → E♭ major" },
    { term: "Relative minor", value: "down a minor 3rd", note: "C major ↔ A minor" },
    { term: "Circle", value: "clockwise = up a 5th", note: "each step adds a sharp" },
  ],

  cards() {
    const cards = [];
    for (const tonic of CIRCLE) {
      cards.push(makeCard("keys", "count", [tonic]));
      cards.push(makeCard("keys", "relative", [tonic]));
    }
    for (const tonic of MINOR_TONICS) cards.push(makeCard("keys", "minorCount", [tonic]));
    for (let c = -7; c <= 7; c++) {
      cards.push(makeCard("keys", "fromCount", [c]));
      if (c !== 0) cards.push(makeCard("keys", "accidentals", [c]));
    }
    // Neighbours on the circle; the outermost keys have only one neighbour.
    for (const tonic of CIRCLE.slice(0, -1)) cards.push(makeCard("keys", "clockwise", [tonic]));
    for (const tonic of CIRCLE.slice(1)) cards.push(makeCard("keys", "counter", [tonic]));
    return cards;
  },

  question(card, rng) {
    const [param] = card.params;

    switch (card.kind) {
      case "count": {
        const count = majorKeySignature(param);
        return {
          prompt: "Key signature of",
          subject: `${noteName(param)} major`,
          explain: `${noteName(param)} major has ${describeSignature(count)}${count ? `: ${notesLabel(signatureAccidentals(count).map(parseNote))}` : ""}.`,
          ...finalize(rng, sigChoice(count), countDistractors(rng, count)),
        };
      }
      case "minorCount": {
        const count = minorKeySignature(param);
        const rel = relativeMajor(param);
        return {
          prompt: "Key signature of",
          subject: `${noteName(param)} minor`,
          explain: `${noteName(param)} minor shares its signature with its relative major, ${noteName(rel)} major: ${describeSignature(count)}.`,
          ...finalize(rng, sigChoice(count), countDistractors(rng, count)),
        };
      }
      case "fromCount": {
        const count = Number(param);
        const tonic = majorKeyWithSignature(count);
        const wrong = [-count, count - 1, count + 1, count - 2, count + 2]
          .filter((c) => c !== count && c >= -7 && c <= 7)
          .map(majorKeyWithSignature);
        return {
          prompt: "Which major key has",
          subject: describeSignature(count),
          explain: count === 0
            ? "C major has no sharps or flats."
            : `${describeSignature(count)} (${notesLabel(signatureAccidentals(count).map(parseNote))}) is ${noteName(tonic)} major.`,
          ...finalize(rng, majorChoice(tonic), shuffle(rng, wrong).map(majorChoice)),
        };
      }
      case "accidentals": {
        const count = Number(param);
        const tonic = majorKeyWithSignature(count);
        const right = signatureAccidentals(count).map(parseNote);
        const variants = accidentalVariants(count);
        return {
          prompt: `The ${count > 0 ? "sharps" : "flats"} in`,
          subject: `${noteName(tonic)} major`,
          spell: { notes: right.map(noteKey) },
          reveal: right.map(noteKey),
          // A signature is a set of pitch classes, not a chord: show, don't play.
          revealAsSet: true,
          explain: `${noteName(tonic)} major has ${describeSignature(count)}: ${notesLabel(right)}, always written in that order.`,
          ...finalize(
            rng,
            notesChoice(right),
            shuffle(rng, variants).map((v) => notesChoice(v.map(parseNote)))
          ),
        };
      }
      case "relative": {
        const rel = relativeMinor(param);
        // The parallel minor first (the classic mix-up), then other diatonic minors.
        const parallel = parseNote(param);
        const others = ["M2", "M3", "P5"].map((iv) => above(param, iv)).filter(Boolean);
        return {
          prompt: "Relative minor of",
          subject: `${noteName(param)} major`,
          explain: `Go down a minor 3rd from ${noteName(param)} (or up to the 6th degree): ${noteName(rel)} minor. Same key signature.`,
          ...finalize(rng, minorChoice(rel), [parallel, ...shuffle(rng, others)].map(minorChoice)),
        };
      }
      case "clockwise":
      case "counter": {
        const cw = card.kind === "clockwise";
        const answer = cw ? fifthAbove(param) : fifthBelow(param);
        const i = CIRCLE.indexOf(param);
        const dir = cw ? 1 : -1;
        // The wrong direction and two steps first, then nearby notes.
        const nearby = ["M2", "m3", "M6"].map((iv) => above(param, iv)).filter(Boolean).map(noteKey);
        const wrong = [CIRCLE[i - dir], CIRCLE[i + 2 * dir], ...nearby]
          .filter((k) => k && k !== noteKey(answer))
          .map(parseNote);
        return {
          prompt: cw ? "One step clockwise from" : "One step counter-clockwise from",
          subject: `${noteName(param)} major`,
          explain: cw
            ? `Clockwise goes up a perfect 5th: ${noteName(param)} → ${noteName(answer)}, adding one sharp (or removing a flat).`
            : `Counter-clockwise goes up a perfect 4th: ${noteName(param)} → ${noteName(answer)}, adding one flat (or removing a sharp).`,
          ...finalize(rng, majorChoice(answer), wrong.map(majorChoice)),
        };
      }
      default:
        throw new Error(`Unknown keys card ${card.id}`);
    }
  },
};
