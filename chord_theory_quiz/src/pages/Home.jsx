import { Link } from "react-router-dom";
import DeckTile from "../components/DeckTile.jsx";
import { DECKS } from "../quiz/decks/index.js";
import { dateKey, streak } from "../store/progress.js";
import { useProgress } from "../store/ProgressContext.jsx";
import { deckStats, totalDue } from "../store/stats.js";

export function Marks({ marks }) {
  return (
    <span className="marks" role="img" aria-label={`${marks.filter(Boolean).length} of ${marks.length} right`}>
      {marks.map((m, i) => (
        <i key={i} className={m ? "hit" : ""} />
      ))}
    </span>
  );
}

export default function Home() {
  const { progress } = useProgress();
  const now = Date.now();
  const today = dateKey(now);
  const due = totalDue(progress.cards, now);
  const days = streak(progress.days, today);
  const daily = progress.daily[today];
  const { answered, correct } = progress.totals;
  const accuracy = answered ? Math.round((correct / answered) * 100) : null;

  return (
    <div className="wrap page">
      <section className="hero">
        <div className="stack" style={{ "--gap": "22px" }}>
          <h1>
            Music theory, <em>one minute</em> at a time
          </h1>
          <p className="hero-copy">
            Spell chords, name intervals, walk the circle of fifths and train your ear. Rounds are
            short, feedback is instant, and anything you miss comes back until it sticks.
          </p>
          <div className="quick">
            <Link className="quick-btn is-primary" to="/play/blitz/mixed">
              <strong>Blitz</strong>
              <span>60 seconds across every deck</span>
            </Link>
            <Link className="quick-btn" to="/play/daily/today">
              <strong>Daily 10</strong>
              <span>{daily ? `Today: ${daily.score} of ${daily.total}` : "Same ten for everyone today"}</span>
            </Link>
            <Link className="quick-btn" to="/play/survival/mixed">
              <strong>Survival</strong>
              <span>Three lives, a shrinking clock</span>
            </Link>
            <Link className="quick-btn" to="/play/review/due">
              <strong>Review</strong>
              <span>{due ? `${due} ${due === 1 ? "card" : "cards"} due now` : "Nothing due, learn new cards"}</span>
            </Link>
          </div>
        </div>

        <aside className="today" aria-label="Your practice">
          <div className="today-streak">
            <span className="big num">{days}</span>
            <span>
              <b>{days === 1 ? "day" : "days"} in a row</b>
              <br />
              <span className="label">
                {progress.days[today] ? "Practised today" : days ? "Play today to keep it" : "Play a round to start"}
              </span>
            </span>
          </div>
          <div className="today-row">
            <span>
              <b>Daily 10</b>
              <br />
              <span className="label">{daily ? `${daily.score} of ${daily.total} right` : "Not played yet"}</span>
            </span>
            {daily ? <Marks marks={daily.marks} /> : <Link className="btn" to="/play/daily/today">Play</Link>}
          </div>
          <div className="today-row">
            <span>
              <b className="num">{answered.toLocaleString()}</b> answers
            </span>
            <span>
              <b className="num">{accuracy === null ? "–" : `${accuracy}%`}</b> right
            </span>
            <Link to="/progress">Progress</Link>
          </div>
        </aside>
      </section>

      <section style={{ marginTop: 56 }}>
        <div className="section-head">
          <h2>Decks</h2>
          <p>Each deck has a cheat sheet and four games. Mastery climbs as cards survive longer gaps between reviews.</p>
        </div>
        <div className="shelf">
          {DECKS.map((d) => (
            <DeckTile key={d.id} deck={d} stats={deckStats(d.id, progress.cards, now)} />
          ))}
          <Link to="/custom" className="tile is-custom">
            <span className="tile-art" aria-hidden="true">
              +
            </span>
            <span className="tile-cat">Build your own</span>
            <span>
              <span className="tile-title">Custom chords</span>
              <span className="tile-meter-text" style={{ marginTop: 10 }}>
                Pick roots and chord types
              </span>
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
