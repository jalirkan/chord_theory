import { describe, expect, it } from "vitest";
import {
  above,
  buildChord,
  buildScale,
  CIRCLE,
  COMMON_ROOTS,
  CORE_INTERVALS,
  diatonicChord,
  enharmonicSpellings,
  intervalBetween,
  majorKeySignature,
  majorKeyWithSignature,
  minorKeySignature,
  noteKey,
  noteName,
  parentMajor,
  parseNote,
  pitchClass,
  relativeMinor,
  signatureAccidentals,
  toMidiAscending,
  TRIAD_TYPES,
  SEVENTH_TYPES,
} from "./index.js";

const keys = (notes) => notes.map(noteKey).join(" ");

describe("notes", () => {
  it("parses ASCII and glyph accidentals", () => {
    expect(parseNote("Eb")).toEqual({ letter: "E", acc: -1 });
    expect(parseNote("E♭")).toEqual({ letter: "E", acc: -1 });
    expect(parseNote("fx")).toEqual({ letter: "F", acc: 2 });
    expect(parseNote("B𝄫")).toEqual({ letter: "B", acc: -2 });
    expect(() => parseNote("H")).toThrow();
  });

  it("formats with glyphs", () => {
    expect(noteName("F##")).toBe("F𝄪");
    expect(noteName("Ebb")).toBe("E𝄫");
    expect(noteName("C#")).toBe("C♯");
  });

  it("computes pitch classes across the B/C boundary", () => {
    expect(pitchClass("B#")).toBe(0);
    expect(pitchClass("Cb")).toBe(11);
  });

  it("lists enharmonic spellings", () => {
    expect(enharmonicSpellings("Eb").map(noteKey).sort()).toEqual(["D#", "Eb", "Fbb"]);
  });

  it("stacks MIDI numbers upward", () => {
    expect(toMidiAscending(["C", "E", "G"])).toEqual([60, 64, 67]);
    expect(toMidiAscending(["A", "C#", "E"])).toEqual([69, 73, 76]);
    expect(toMidiAscending(["Cb"])).toEqual([59]);
  });
});

// Hand-written by the project's original authors (chordDict.js at the repo root).
const ORIGINAL_CHORD_DICT = {
  Ab: { maj: "Ab C Eb", min: "Ab Cb Eb", dim: "Ab Cb Ebb", aug: "Ab C E" },
  A: { maj: "A C# E", min: "A C E", dim: "A C Eb", aug: "A C# E#" },
  "A#": { maj: "A# C## E#", min: "A# C# E#", dim: "A# C# E", aug: "A# C## E##" },
  B: { maj: "B D# F#", min: "B D F#", dim: "B D F", aug: "B D# F##" },
  C: { maj: "C E G", min: "C Eb G", dim: "C Eb Gb", aug: "C E G#" },
  D: { maj: "D F# A", min: "D F A", dim: "D F Ab", aug: "D F# A#" },
  E: { maj: "E G# B", min: "E G B", dim: "E G Bb", aug: "E G# B#" },
  F: { maj: "F A C", min: "F Ab C", dim: "F Ab Cb", aug: "F A C#" },
  G: { maj: "G B D", min: "G Bb D", dim: "G Bb Db", aug: "G B D#" },
};

describe("chords", () => {
  for (const [root, types] of Object.entries(ORIGINAL_CHORD_DICT)) {
    for (const [type, expected] of Object.entries(types)) {
      it(`${root} ${type} = ${expected}`, () => {
        expect(keys(buildChord(root, type))).toBe(expected);
      });
    }
  }

  it("spells seventh chords", () => {
    expect(keys(buildChord("Eb", "maj7"))).toBe("Eb G Bb D");
    expect(keys(buildChord("G", "dom7"))).toBe("G B D F");
    expect(keys(buildChord("B", "m7b5"))).toBe("B D F A");
    expect(keys(buildChord("C#", "dim7"))).toBe("C# E G Bb");
    expect(keys(buildChord("A", "minmaj7"))).toBe("A C E G#");
  });

  it("builds every common-root triad and seventh", () => {
    for (const root of COMMON_ROOTS) {
      for (const type of [...TRIAD_TYPES, ...SEVENTH_TYPES]) {
        const chord = buildChord(root, type);
        expect(chord, `${root} ${type}`).not.toBeNull();
        // Chord tones always skip a letter: root, 3rd, 5th, 7th.
        const letters = chord.map((n) => "CDEFGAB".indexOf(n.letter));
        letters.forEach((l, i) => {
          expect((l - letters[0] + 7) % 7).toBe(2 * i);
        });
      }
    }
  });

  it("returns null rather than inventing triple accidentals", () => {
    expect(buildChord("B#", "aug")).toBeNull(); // would need F###
  });
});

describe("intervals", () => {
  it("spells the note above", () => {
    expect(noteKey(above("Eb", "M3"))).toBe("G");
    expect(noteKey(above("F", "A4"))).toBe("B");
    expect(noteKey(above("B", "d5"))).toBe("F");
    expect(noteKey(above("E", "m6"))).toBe("C");
  });

  it("names intervals between spelled notes", () => {
    expect(intervalBetween("C", "Ab").code).toBe("m6");
    expect(intervalBetween("C", "G#").code).toBe("A5");
    expect(intervalBetween("F", "B").code).toBe("A4");
    expect(intervalBetween("B", "F").code).toBe("d5");
    expect(intervalBetween("A", "G#").name).toBe("major 7th");
    expect(intervalBetween("G", "C").name).toBe("perfect 4th");
  });

  it("round-trips every core interval from every common root", () => {
    for (const root of COMMON_ROOTS) {
      for (const code of CORE_INTERVALS.filter((c) => c !== "P8")) {
        const top = above(root, code);
        if (!top) continue;
        expect(intervalBetween(root, top).code).toBe(code);
      }
    }
  });
});

describe("scales and modes", () => {
  it("spells major and minor scales", () => {
    expect(keys(buildScale("F#", "major"))).toBe("F# G# A# B C# D# E#");
    expect(keys(buildScale("Bb", "naturalMinor"))).toBe("Bb C Db Eb F Gb Ab");
    expect(keys(buildScale("A", "harmonicMinor"))).toBe("A B C D E F G#");
    expect(keys(buildScale("C", "melodicMinor"))).toBe("C D Eb F G A B");
  });

  it("finds the parent major of a mode", () => {
    expect(noteKey(parentMajor("D", "dorian"))).toBe("C");
    expect(noteKey(parentMajor("E", "phrygian"))).toBe("C");
    expect(noteKey(parentMajor("Bb", "lydian"))).toBe("F");
    expect(noteKey(parentMajor("A", "mixolydian"))).toBe("D");
    expect(noteKey(parentMajor("F#", "locrian"))).toBe("G");
  });

  it("gives each mode the same notes as its parent", () => {
    const sorted = (ns) => ns.map(noteKey).sort().join(" ");
    for (const [root, mode] of [["G", "dorian"], ["Eb", "lydian"], ["C#", "phrygian"]]) {
      expect(sorted(buildScale(root, mode))).toBe(
        sorted(buildScale(parentMajor(root, mode), "major"))
      );
    }
  });
});

describe("keys", () => {
  it("knows every key signature on the circle", () => {
    expect(majorKeySignature("C")).toBe(0);
    expect(majorKeySignature("A")).toBe(3);
    expect(majorKeySignature("Ab")).toBe(-4);
    expect(majorKeySignature("C#")).toBe(7);
    expect(minorKeySignature("C")).toBe(-3);
    expect(noteKey(majorKeyWithSignature(-2))).toBe("Bb");
  });

  it("matches signature accidentals to the scale itself", () => {
    for (const tonic of CIRCLE) {
      const count = majorKeySignature(tonic);
      const altered = buildScale(tonic, "major").filter((n) => n.acc !== 0);
      expect(altered.map(noteKey).sort()).toEqual(signatureAccidentals(count).sort());
    }
  });

  it("finds relative minors", () => {
    expect(noteKey(relativeMinor("Eb"))).toBe("C");
    expect(noteKey(relativeMinor("E"))).toBe("C#");
  });

  it("builds diatonic chords", () => {
    const v = diatonicChord("Eb", 5);
    expect(noteKey(v.root)).toBe("Bb");
    expect(v.numeral).toBe("V");
    const vii = diatonicChord("G", 7, true);
    expect(noteKey(vii.root)).toBe("F#");
    expect(vii.type).toBe("m7b5");
  });
});
