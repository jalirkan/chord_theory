import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import GameSession from "../game/GameSession.jsx";
import { parseCardId } from "../quiz/cards.js";
import { DECK_BY_ID } from "../quiz/decks/index.js";
import { MODES } from "../quiz/modes.js";
import { seededRng } from "../quiz/rng.js";
import { dailyCards, resolveSet } from "../quiz/sets.js";
import { dateKey } from "../store/progress.js";
import { useProgress } from "../store/ProgressContext.jsx";

export function formatDay(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Work out what a session plays. Returns { error } for bad links. */
function buildSetup({ modeId, setId, search, routeState, states }) {
  if (!MODES[modeId]) return { error: `There's no game called “${modeId}”.` };

  if (modeId === "daily") {
    const date = dateKey();
    return {
      modeId,
      setId: "daily",
      title: formatDay(date),
      cards: dailyCards(date),
      rng: seededRng(`daily-questions:${date}`),
      date,
    };
  }

  let set;
  if (setId === "misses") {
    const cards = (routeState?.cardIds ?? []).map(parseCardId).filter((c) => DECK_BY_ID[c.deckId]);
    set = { title: "Your misses", cards };
  } else {
    try {
      set = resolveSet(setId, { search, states, modeId });
    } catch {
      return { error: `There's no deck called “${setId}”.` };
    }
  }

  return {
    modeId,
    setId,
    title: set.title,
    cards: set.cards,
    dueCount: set.dueCount,
    rng: Math.random,
    ear: set.cards.length > 0 && set.cards.every((c) => DECK_BY_ID[c.deckId]?.ear),
  };
}

function backLink(setId, search) {
  if (DECK_BY_ID[setId]) return `/deck/${setId}`;
  if (setId === "custom") return `/custom${search}`;
  if (setId === "weak") return "/progress";
  return "/";
}

export default function Play() {
  const { modeId, setId } = useParams();
  const location = useLocation();
  const { progress } = useProgress();
  const [run, setRun] = useState(0);

  // Built once per run from a snapshot of progress, so answering doesn't
  // reshuffle the review queue mid-game. "Play again" makes a fresh run.
  const setup = useMemo(
    () =>
      buildSetup({
        modeId,
        setId,
        search: location.search,
        routeState: location.state,
        states: progress.cards,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modeId, setId, location.search, location.state, run]
  );

  if (setup.error) {
    return (
      <div className="wrap page stack">
        <h1 style={{ fontSize: "3rem", textTransform: "uppercase" }}>Can't find that game</h1>
        <p>{setup.error}</p>
        <p>
          <Link className="btn btn-primary" to="/">
            Back to all decks
          </Link>
        </p>
      </div>
    );
  }

  return (
    <GameSession
      key={`${location.key}/${run}`}
      setup={setup}
      backTo={backLink(setId, location.search)}
      onRestart={() => setRun((r) => r + 1)}
    />
  );
}
