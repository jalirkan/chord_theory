import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "./App.jsx";
import { DECKS } from "./quiz/decks/index.js";
import { STORAGE_KEY } from "./store/progress.js";
import { ProgressProvider } from "./store/ProgressContext.jsx";
import { buildChord, CHORD_TYPES, noteKey, parseNote } from "./theory/index.js";

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ProgressProvider>
        <App />
      </ProgressProvider>
    </MemoryRouter>
  );
}

const saved = () => JSON.parse(localStorage.getItem(STORAGE_KEY));
const answerButtons = () => within(screen.getByRole("group", { name: "Answers" })).getAllByRole("button");

/** Keystrokes that spell notes on the NotePad: "Eb" → e then -. */
function keysFor(notes) {
  return notes
    .map((n) => {
      const { letter, acc } = parseNote(n);
      const mods = acc < 0 ? "-".repeat(-acc) : "=".repeat(acc);
      return letter.toLowerCase() + mods;
    })
    .join("");
}

describe("home", () => {
  it("shows every deck and the quick-start games", () => {
    renderAt("/");
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    for (const deck of DECKS) expect(hrefs).toContain(`/deck/${deck.id}`);
    expect(screen.getByRole("link", { name: /Blitz/ })).toHaveAttribute("href", "/play/blitz/mixed");
    expect(screen.getByRole("link", { name: /Daily 10/ })).toHaveAttribute("href", "/play/daily/today");
  });
});

describe("deck page", () => {
  it("offers Spell It only for decks with something to spell", () => {
    renderAt("/deck/triads");
    expect(screen.getByRole("link", { name: /Spell It/ })).toHaveAttribute("href", "/play/spell/triads");
    expect(screen.getByRole("table")).toHaveTextContent("Diminished");
  });

  it("hides Spell It for ear training", () => {
    renderAt("/deck/ear-chords");
    expect(screen.queryByRole("link", { name: /Spell It/ })).toBeNull();
  });
});

describe("playing", () => {
  it("answers with the number keys, shows feedback and saves progress", async () => {
    const user = userEvent.setup();
    renderAt("/play/review/triads");
    await user.click(screen.getByRole("button", { name: /Start/ }));
    expect(answerButtons()).toHaveLength(4);

    await user.keyboard("1");
    expect(await screen.findByText(/^(Correct|Not quite)$/)).toBeInTheDocument();
    expect(answerButtons().every((b) => b.disabled)).toBe(true);
    expect(saved().totals.answered).toBe(1);
    expect(Object.keys(saved().cards)[0]).toMatch(/^triads\//);
  });

  it("spells a triad from the keyboard", async () => {
    const user = userEvent.setup();
    renderAt("/play/spell/triads");
    await user.click(screen.getByRole("button", { name: /Start/ }));

    const subject = document.querySelector(".prompt-subject").textContent; // e.g. "E♭ minor"
    const [rootText, ...rest] = subject.split(" ");
    const type = Object.keys(CHORD_TYPES).find((t) => CHORD_TYPES[t].name === rest.join(" "));
    const notes = buildChord(parseNote(rootText), type).map(noteKey);

    await user.keyboard(keysFor(notes));
    await user.keyboard("{Enter}");
    expect(await screen.findByText("Correct")).toBeInTheDocument();
    expect(saved().totals.correct).toBe(1);
  });

  it("finishes the Daily 10 and records the first attempt", async () => {
    const user = userEvent.setup();
    renderAt("/play/daily/today");
    await user.click(screen.getByRole("button", { name: /Start/ }));
    for (let i = 0; i < 10; i++) {
      await user.keyboard("2");
      await user.keyboard("{Enter}");
    }
    expect(await screen.findByRole("button", { name: /Play again/ })).toBeInTheDocument();
    expect(screen.getByText(/Chord Theory Daily 10/)).toBeInTheDocument();
    const days = Object.values(saved().daily);
    expect(days).toHaveLength(1);
    expect(days[0].total).toBe(10);
    expect(days[0].marks).toHaveLength(10);
  });

  it("explains a bad link instead of crashing", () => {
    renderAt("/play/blitz/not-a-deck");
    expect(screen.getByText(/no deck called/)).toBeInTheDocument();
  });
});

describe("custom chords", () => {
  it("starts with the original checklist and builds game links from it", async () => {
    const user = userEvent.setup();
    renderAt("/custom");
    expect(screen.getByLabelText("A")).toBeChecked();
    expect(screen.getByLabelText("C♭")).toBeChecked();
    expect(screen.getByText(/24 cards from 6 roots × 2 chord types/)).toBeInTheDocument();

    await user.click(screen.getByLabelText("maj7"));
    const blitz = screen.getByRole("link", { name: "Blitz" });
    expect(blitz.getAttribute("href")).toContain("types=maj%2Cdim%2Cmaj7");
  });
});
