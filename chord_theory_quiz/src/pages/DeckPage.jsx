import { Link, useParams } from "react-router-dom";
import DeckTile from "../components/DeckTile.jsx";
import { Arrow } from "../components/Icons.jsx";
import { DECK_BY_ID } from "../quiz/decks/index.js";
import { MODE_ORDER, MODES } from "../quiz/modes.js";
import { weakestCards } from "../quiz/sets.js";
import { bestKey } from "../store/progress.js";
import { useProgress } from "../store/ProgressContext.jsx";
import { cardLabel, deckStats } from "../store/stats.js";

export default function DeckPage() {
  const { deckId } = useParams();
  const { progress } = useProgress();
  const deck = DECK_BY_ID[deckId];

  if (!deck) {
    return (
      <div className="wrap page stack">
        <h1 style={{ fontSize: "3rem", textTransform: "uppercase" }}>No such deck</h1>
        <p>
          <Link to="/">See all decks</Link>
        </p>
      </div>
    );
  }

  const stats = deckStats(deck.id, progress.cards);
  const modes = MODE_ORDER.filter((m) => m !== "spell" || deck.spellKinds.length > 0);
  const deckStates = Object.fromEntries(
    Object.entries(progress.cards).filter(([id]) => id.startsWith(`${deck.id}/`))
  );
  const weak = weakestCards(deckStates, 6);

  return (
    <div className="wrap page">
      <Link to="/" className="back">
        <Arrow /> All decks
      </Link>

      <header className="deck-head">
        <DeckTile deck={deck} linked={false} />
        <div className="stack" style={{ "--gap": "12px", minWidth: 0, flex: "1 1 18rem" }}>
          <span className="label">{deck.category}</span>
          <h1>{deck.title}</h1>
          <p className="hero-copy">{deck.tagline}</p>
          <p className="deck-meta num">
            <span>
              <b>{Math.round(stats.mastery * 100)}%</b> mastered
            </span>
            <span>
              <b>{stats.seen}</b> of {stats.total} cards seen
            </span>
            <span>
              <b>{stats.due}</b> due for review
            </span>
          </p>
        </div>
      </header>

      <section aria-labelledby="play-head">
        <div className="section-head">
          <h2 id="play-head">Play</h2>
        </div>
        <div className="modes">
          {modes.map((m) => {
            const mode = MODES[m];
            const best = progress.best[bestKey(m, deck.id)]?.score;
            return (
              <Link key={m} to={`/play/${m}/${deck.id}`} className={`mode-card${m === "blitz" ? " is-lead" : ""}`}>
                <h3>{mode.title}</h3>
                <p>{mode.tagline}</p>
                <span className="best">
                  {m === "review" ? (
                    <>
                      <span>Due now</span>
                      <b className="num">{stats.due}</b>
                    </>
                  ) : (
                    <>
                      <span>Your best</span>
                      <b className="num">{best ?? "–"}</b>
                    </>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="two-col">
        <section aria-labelledby="cheat-head">
          <div className="section-head">
            <h2 id="cheat-head">Cheat sheet</h2>
          </div>
          <div className="table-scroll">
            <table className="cheat">
              <tbody>
                {deck.rules.map((r) => (
                  <tr key={r.term}>
                    <th scope="row">{r.term}</th>
                    <td className="val">{r.value}</td>
                    <td className="note">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="weak-head">
          <div className="section-head">
            <h2 id="weak-head">Weak spots</h2>
          </div>
          {weak.length ? (
            <div className="stack">
              <ul className="weak-list">
                {weak.map((id) => {
                  const s = progress.cards[id];
                  return (
                    <li key={id}>
                      <span>{cardLabel(id)}</span>
                      <span className="acc num">
                        {s.right}/{s.seen}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p>
                <Link className="btn" to={`/play/review/${deck.id}`}>
                  Review this deck
                </Link>
              </p>
            </div>
          ) : (
            <p className="empty-note">
              Cards you miss more than once show up here, so you know what to drill next.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
