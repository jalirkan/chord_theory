import { describe, expect, it } from "vitest";
import { noteKey, parseNote } from "../theory/index.js";
import { makeCard, parseCardId } from "./cards.js";
import { notesKey } from "./choices.js";
import { DECKS, deckCards, isSpellable, questionFor } from "./decks/index.js";
import { createQueuePicker, createRandomPicker } from "./picker.js";
import { seededRng } from "./rng.js";
import { customSearch, dailyCards, parseCustom, resolveSet, weakestCards } from "./sets.js";
import { BOX_INTERVALS, mastery, recordAnswer } from "./srs.js";

const SEEDS = [1, 2, 3];

describe("every card in every deck", () => {
  for (const deck of DECKS) {
    it(`${deck.id}: builds valid questions`, () => {
      const cards = deckCards(deck.id);
      expect(cards.length).toBeGreaterThan(5);
      expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length);

      for (const card of cards) {
        for (const seed of SEEDS) {
          const q = questionFor(card, seededRng(seed));
          const where = `${card.id} (seed ${seed})`;
          expect(q.prompt, where).toBeTruthy();
          expect(q.explain, where).toBeTruthy();
          expect(q.choices.length, where).toBe(4);
          const ids = q.choices.map((c) => c.id);
          expect(new Set(ids).size, where).toBe(4);
          const labels = q.choices.map((c) => c.label);
          expect(new Set(labels).size, where).toBe(4);
          expect(ids, where).toContain(q.answerId);
          expect(q.cardId).toBe(card.id);
          if (deck.ear) expect(q.audio?.notes.length, where).toBeGreaterThan(1);
          if (isSpellable(card)) {
            expect(q.spell?.notes.length, where).toBeGreaterThan(0);
            q.spell.notes.forEach((n) => expect(() => parseNote(n)).not.toThrow());
          }
        }
      }
    });
  }

  it("marks the matching choice correct for spelled answers", () => {
    const q = questionFor(makeCard("triads", "spell", ["Eb", "min"]), seededRng(7));
    expect(q.answerId).toBe("Eb Gb Bb");
    expect(q.spell.notes).toEqual(["Eb", "Gb", "Bb"]);
    const labels = q.choices.map((c) => c.label);
    expect(labels).toContain("E♭ G♭ B♭");
  });

  it("gives spell-it answers that are never a distractor set", () => {
    for (const deck of DECKS) {
      for (const card of deckCards(deck.id).filter(isSpellable)) {
        const q = questionFor(card, seededRng(11));
        const answerSet = [...q.spell.notes].sort().join(" ");
        for (const c of q.choices) {
          if (c.id === q.answerId) continue;
          // Distractor note lists must differ as sets, not just in order.
          const asSet = c.id.split(" ").sort().join(" ");
          expect(asSet, card.id).not.toBe(answerSet);
        }
      }
    }
  });

  it("supports the original project's rare roots in custom drills", () => {
    const set = resolveSet("custom", { search: customSearch({ roots: ["E#", "Cb"], types: ["maj", "dim", "dom7"] }) });
    expect(set.cards.length).toBeGreaterThan(0);
    for (const card of set.cards) {
      const q = questionFor(card, seededRng(3));
      expect(q.choices.map((c) => c.id)).toContain(q.answerId);
    }
  });
});

describe("cards", () => {
  it("round-trips ids", () => {
    const c = makeCard("triads", "spell", ["F#", "dim"]);
    expect(c.id).toBe("triads/spell/F#/dim");
    expect(parseCardId(c.id)).toEqual(c);
  });
});

describe("sets", () => {
  it("parses custom drills with defaults", () => {
    expect(parseCustom("?roots=A,C%23&types=maj")).toEqual({ roots: ["A", "C#"], types: ["maj"] });
    expect(parseCustom("")).toEqual({ roots: ["C", "G", "F"], types: ["maj", "min"] });
  });

  it("splits custom chord types across the triad and seventh decks", () => {
    const set = resolveSet("custom", { search: "?roots=C&types=maj,dom7" });
    expect(set.cards.map((c) => c.id).sort()).toEqual([
      "sevenths/name/C/dom7",
      "sevenths/spell/C/dom7",
      "triads/name/C/maj",
      "triads/spell/C/maj",
    ]);
  });

  it("makes the same Daily 10 for the same date", () => {
    const a = dailyCards("2026-09-27").map((c) => c.id);
    const b = dailyCards("2026-09-27").map((c) => c.id);
    const c = dailyCards("2026-09-28").map((c) => c.id);
    expect(a).toEqual(b);
    expect(a).toHaveLength(10);
    expect(new Set(a).size).toBe(10);
    expect(a).not.toEqual(c);
  });

  it("serves due cards first in review and tops up with new ones", () => {
    const now = 1_000_000;
    const states = {
      "triads/spell/C/maj": { box: 1, due: now - 10, seen: 1, right: 1, last: 0 },
      "triads/spell/D/min": { box: 2, due: now + 1e9, seen: 3, right: 3, last: 0 },
    };
    const set = resolveSet("triads", { modeId: "review", states, now, rng: seededRng(1) });
    expect(set.cards[0].id).toBe("triads/spell/C/maj");
    expect(set.cards.map((c) => c.id)).not.toContain("triads/spell/D/min");
    expect(set.cards).toHaveLength(10);
    expect(set.dueCount).toBe(1);
  });

  it("ranks weakest cards by accuracy", () => {
    const states = {
      "triads/spell/C/maj": { seen: 4, right: 1, box: 0, due: 0 },
      "triads/spell/D/maj": { seen: 4, right: 3, box: 1, due: 0 },
      "triads/spell/E/maj": { seen: 1, right: 0, box: 0, due: 0 },
      "triads/spell/F/maj": { seen: 3, right: 3, box: 2, due: 0 },
    };
    expect(weakestCards(states)).toEqual(["triads/spell/C/maj", "triads/spell/D/maj"]);
  });
});

describe("pickers", () => {
  const cards = deckCards("triads").slice(0, 20);

  it("does not repeat a card within a few turns", () => {
    const picker = createRandomPicker(cards, seededRng(5));
    const seen = [];
    for (let i = 0; i < 60; i++) seen.push(picker.next().id);
    for (let i = 1; i < seen.length; i++) expect(seen[i]).not.toBe(seen[i - 1]);
  });

  it("brings a missed card back a few questions later", () => {
    const picker = createRandomPicker(cards, seededRng(5));
    const missed = picker.next();
    picker.missed(missed);
    const upcoming = Array.from({ length: 6 }, () => picker.next().id);
    expect(upcoming).toContain(missed.id);
  });

  it("requeues misses in review", () => {
    const picker = createQueuePicker(cards.slice(0, 5), { requeue: true });
    const first = picker.next();
    picker.missed(first);
    const rest = [];
    let c;
    while ((c = picker.next())) rest.push(c.id);
    expect(rest).toHaveLength(5);
    expect(rest).toContain(first.id);
  });
});

describe("spaced repetition", () => {
  it("promotes due cards and resets misses", () => {
    const now = 5_000;
    let s = recordAnswer(undefined, true, now);
    expect(s.box).toBe(1);
    expect(s.due).toBe(now + BOX_INTERVALS[1]);
    // Answering again before it is due does not promote it.
    s = recordAnswer(s, true, now + 1);
    expect(s.box).toBe(1);
    expect(s.right).toBe(2);
    s = recordAnswer(s, false, now + 2);
    expect(s.box).toBe(0);
    expect(s.due).toBe(now + 2);
  });

  it("measures mastery from box levels", () => {
    expect(mastery(["a", "b"], { a: { box: 5 }, b: { box: 0 } })).toBe(0.5);
    expect(mastery([], {})).toBe(0);
  });
});

describe("choice helpers", () => {
  it("keys note lists in ASCII", () => {
    expect(notesKey(["Eb", "G", "Bb"].map(parseNote))).toBe("Eb G Bb");
    expect(noteKey("F𝄪")).toBe("F##");
  });
});
