import { useState } from "react";
import { Link } from "react-router-dom";
import { DECK_BY_ID, DECKS } from "../quiz/decks/index.js";
import { MODES } from "../quiz/modes.js";
import { weakestCards } from "../quiz/sets.js";
import { dateKey, streak } from "../store/progress.js";
import { useProgress } from "../store/ProgressContext.jsx";
import { cardLabel, deckStats } from "../store/stats.js";

const WEEKS = 16;

function activityLevel(n) {
  if (!n) return "heat-0";
  if (n < 10) return "heat-1";
  if (n < 30) return "heat-2";
  return "heat-3";
}

/** The last 16 weeks as columns of days, Sunday at the top. */
function Calendar({ days }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - start.getDay() - (WEEKS - 1) * 7);
  const cells = [];
  for (let i = 0; i < WEEKS * 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = dateKey(d.getTime());
    const future = d > today;
    const n = days[key] ?? 0;
    cells.push(
      <i
        key={key}
        className={future ? "future" : activityLevel(n)}
        title={future ? "" : `${d.toLocaleDateString()}: ${n} ${n === 1 ? "answer" : "answers"}`}
      />
    );
  }
  return (
    <div className="calendar-wrap">
      <div className="calendar" role="img" aria-label={`Practice over the last ${WEEKS} weeks`}>
        {cells}
      </div>
      <div className="legend" aria-hidden="true">
        None
        <i className="heat-0" />
        <i className="heat-1" />
        <i className="heat-2" />
        <i className="heat-3" />
        30+ answers a day
      </div>
    </div>
  );
}

function setTitle(setId) {
  if (DECK_BY_ID[setId]) return DECK_BY_ID[setId].title;
  return { mixed: "Everything", custom: "Custom chords" }[setId] ?? setId;
}

export default function Progress() {
  const { progress, reset } = useProgress();
  const [confirming, setConfirming] = useState(false);
  const [cleared, setCleared] = useState(false);
  const now = Date.now();
  const { answered, correct, sessions } = progress.totals;
  const weak = weakestCards(progress.cards, 10);
  const bests = Object.entries(progress.best)
    .map(([key, v]) => {
      const [modeId, setId] = key.split(":");
      return { key, mode: MODES[modeId]?.title ?? modeId, set: setTitle(setId), ...v };
    })
    .sort((a, b) => a.mode.localeCompare(b.mode) || a.set.localeCompare(b.set));

  return (
    <div className="wrap page">
      <div className="section-head">
        <h1 style={{ fontSize: "clamp(2.6rem, 7vw, 4.6rem)", fontWeight: 900, textTransform: "uppercase" }}>
          Progress
        </h1>
      </div>

      <div className="stat-row">
        <div className="stat">
          <span className="label">Days in a row</span>
          <b className="num">{streak(progress.days)}</b>
        </div>
        <div className="stat">
          <span className="label">Answers</span>
          <b className="num">{answered.toLocaleString()}</b>
        </div>
        <div className="stat">
          <span className="label">Accuracy</span>
          <b className="num">{answered ? `${Math.round((correct / answered) * 100)}%` : "–"}</b>
        </div>
        <div className="stat">
          <span className="label">Games</span>
          <b className="num">{sessions}</b>
        </div>
      </div>

      <section style={{ marginBottom: 48 }}>
        <div className="section-head">
          <h2>Practice</h2>
        </div>
        <Calendar days={progress.days} />
      </section>

      <div className="two-col" style={{ marginTop: 0 }}>
        <section>
          <div className="section-head">
            <h2>Mastery</h2>
            <p>A card counts as mastered once it survives a week-long gap.</p>
          </div>
          <ul className="mastery-list">
            {DECKS.map((d) => {
              const st = deckStats(d.id, progress.cards, now);
              const pct = Math.round(st.mastery * 100);
              return (
                <li key={d.id}>
                  <Link to={`/deck/${d.id}`}>{d.title}</Link>
                  <span className="bar" role="img" aria-label={`${pct}% mastered`}>
                    <i style={{ width: `${pct}%` }} />
                  </span>
                  <span className="mastery-num">
                    {pct}% · {st.due} due
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="stack" style={{ "--gap": "48px" }}>
          <section>
            <div className="section-head">
              <h2>Weak spots</h2>
            </div>
            {weak.length ? (
              <div className="stack">
                <ul className="weak-list">
                  {weak.map((id) => (
                    <li key={id}>
                      <span>{cardLabel(id)}</span>
                      <span className="acc num">
                        {progress.cards[id].right}/{progress.cards[id].seen}
                      </span>
                    </li>
                  ))}
                </ul>
                <p>
                  <Link className="btn btn-primary" to="/play/review/weak">
                    Drill these
                  </Link>
                </p>
              </div>
            ) : (
              <p className="empty-note">Nothing yet. Cards you miss more than once will collect here.</p>
            )}
          </section>

          <section>
            <div className="section-head">
              <h2>Best scores</h2>
            </div>
            {bests.length ? (
              <div className="table-scroll">
                <table className="cheat">
                  <tbody>
                    {bests.map((b) => (
                      <tr key={b.key}>
                        <th scope="row">{b.mode}</th>
                        <td className="note">{b.set}</td>
                        <td className="val num">{b.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-note">Finish a Blitz, Survival or Spell It game to set your first best.</p>
            )}
          </section>

          <section className="stack">
            <p className="label">Progress is saved in this browser only.</p>
            {confirming ? (
              <div className="confirm" role="alert">
                <span>Erase every score, streak and card history?</span>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    reset();
                    setConfirming(false);
                    setCleared(true);
                  }}
                >
                  Erase progress
                </button>
                <button type="button" className="btn" onClick={() => setConfirming(false)}>
                  Keep it
                </button>
              </div>
            ) : (
              <p>
                <button type="button" className="btn btn-ghost" onClick={() => setConfirming(true)}>
                  Reset progress…
                </button>
                {cleared && <span className="toast"> Progress erased.</span>}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
