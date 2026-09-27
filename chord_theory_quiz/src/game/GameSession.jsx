import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ChoiceGrid from "../components/ChoiceGrid.jsx";
import { Close, Play } from "../components/Icons.jsx";
import NotePad from "../components/NotePad.jsx";
import Piano from "../components/Piano.jsx";
import SoundToggle from "../components/SoundToggle.jsx";
import { multiplier } from "../quiz/modes.js";
import { BOX_INTERVALS } from "../quiz/srs.js";
import { bestKey } from "../store/progress.js";
import { useProgress } from "../store/ProgressContext.jsx";
import { useGame } from "./useGame.js";

const DAY = 24 * 60 * 60 * 1000;

function rulesFor(modeId, setup) {
  switch (modeId) {
    case "blitz":
      return [
        "60 seconds on the clock. It only runs while a question is on screen.",
        "Answers in a row raise your multiplier: ×2 after 3, ×3 after 6, ×4 after 10.",
        "Press 1–4 to answer, or tap.",
      ];
    case "survival":
      return [
        "Three lives. A wrong answer or running out of time costs one.",
        "12 seconds per question, half a second less for every answer in a row (down to 4).",
        "After a miss the game waits so you can read why.",
      ];
    case "spell":
      return [
        "10 questions. Build each answer from letters and accidentals.",
        "Spelling counts: E♭ minor is E♭ G♭ B♭, never E♭ F♯ B♭.",
        "Keys: A–G add a note, - for flat, = for sharp, Enter to check.",
      ];
    case "review": {
      const intervals = BOX_INTERVALS.slice(1).map((ms) => ms / DAY).join(", ");
      const due = setup.dueCount ?? 0;
      return [
        setup.setId === "weak" || setup.setId === "misses"
          ? `${setup.cards.length} cards you have been getting wrong.`
          : due
            ? `${Math.min(due, setup.cards.length)} cards due, oldest first.`
            : "Nothing is due yet, so this round teaches new cards.",
        `Cards you get right come back in ${intervals} days.`,
        "A miss comes back later in this round, and again tomorrow.",
      ];
    }
    case "daily":
      return [
        "Ten questions drawn from every deck, the same for everyone today.",
        "Only your first attempt counts toward your record.",
        "Copy your result to share it when you finish.",
      ];
    default:
      return [];
  }
}

const UNIT = { blitz: "pts", survival: "correct", spell: "correct", review: "correct", daily: "correct" };

function formatMs(ms) {
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function GameSession({ setup, backTo, onRestart }) {
  const navigate = useNavigate();
  const { progress } = useProgress();
  const { game, state: s, outcome, start, respond, next, replayPrompt, replayAnswer } = useGame(setup);
  const { mode } = game;
  const q = s.question;
  const fb = s.feedback;
  const spellMode = mode.input === "spell";
  const isEar = setup.ear;

  const quit = useCallback(() => navigate(backTo), [navigate, backTo]);
  const choose = useCallback((choiceId) => respond({ choiceId }), [respond]);
  const spell = useCallback((notes) => respond({ notes }), [respond]);

  // Global keys: Enter to start / continue, 1–4 to answer, R to replay, Esc to quit.
  useEffect(() => {
    function onKey(e) {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const onControl = e.target instanceof Element && e.target.closest("button, a, input, textarea, select");
      const phase = game.state.phase;
      const go = e.key === "Enter" || e.key === " ";
      if (e.key === "Escape") return quit();
      if (phase === "ready" && go && !onControl) {
        e.preventDefault();
        start();
      } else if (phase === "question" && !spellMode && /^[1-4]$/.test(e.key)) {
        const choice = game.state.question.choices[Number(e.key) - 1];
        if (choice) choose(choice.id);
      } else if (phase === "feedback" && (go || e.key === "ArrowRight") && !onControl) {
        e.preventDefault();
        next();
      } else if (phase === "over" && e.key === "Enter" && !onControl) {
        onRestart();
      } else if (e.key === "r" || e.key === "R") {
        if (phase === "question") replayPrompt();
        else if (phase === "feedback") (q?.audio ? replayPrompt : replayAnswer)();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game, spellMode, start, choose, next, quit, onRestart, replayPrompt, replayAnswer, q]);

  const best = progress.best[bestKey(setup.modeId, setup.setId)]?.score ?? null;

  return (
    <div className="game">
      <div className="game-inner">
        <div className="hud">
          <button type="button" className="icon-btn" onClick={quit} aria-label="Quit">
            <Close />
          </button>
          <span className="hud-title">
            {mode.title} · {setup.title}
          </span>
          {s.phase !== "ready" && s.phase !== "over" && <HudStats game={game} s={s} />}
          <SoundToggle />
        </div>

        {s.phase === "ready" && (
          <Ready
            mode={mode}
            setup={setup}
            best={best}
            isEar={isEar}
            empty={s.empty}
            onStart={start}
            backTo={backTo}
          />
        )}

        {(s.phase === "question" || s.phase === "feedback") && q && (
          <>
            <Meter game={game} s={s} />
            <div className="prompt">
              <p className="prompt-q">{q.prompt}</p>
              {q.subject ? (
                <p className={`prompt-subject${q.small || q.subject.length > 16 ? " is-small" : ""}`}>{q.subject}</p>
              ) : (
                <button type="button" className="listen" onClick={replayPrompt}>
                  <Play /> Play again
                </button>
              )}
              {q.caption && <p className="prompt-caption">{q.caption}</p>}
            </div>

            {spellMode ? (
              <NotePad
                key={s.index}
                count={q.spell.notes.length}
                onSubmit={spell}
                locked={Boolean(fb)}
                expected={q.spell.notes}
              />
            ) : (
              <ChoiceGrid choices={q.choices} onChoose={choose} feedback={fb} answerId={q.answerId} />
            )}

            {fb && setup.modeId !== "blitz" && (
              <Feedback
                q={q}
                fb={fb}
                spellMode={spellMode}
                lastOne={s.lives === 0}
                onNext={next}
                onHear={q.audio ? replayPrompt : replayAnswer}
              />
            )}

            {!fb && !spellMode && (
              <p className="hint">
                <span>
                  <kbd>1</kbd>–<kbd>4</kbd> answer
                </span>
                {q.audio && (
                  <span>
                    <kbd>R</kbd> replay
                  </span>
                )}
                <span>
                  <kbd>Esc</kbd> quit
                </span>
              </p>
            )}
          </>
        )}

        {s.phase === "over" && (
          <Results
            mode={mode}
            setup={setup}
            s={s}
            outcome={outcome}
            backTo={backTo}
            onRestart={onRestart}
            progress={progress}
          />
        )}
      </div>
    </div>
  );
}

function HudStats({ game, s }) {
  const left = game.timeLeft(Date.now());
  const mult = multiplier(s.streak);
  return (
    <div className="hud-stats">
      {game.mode.clock && <span className="hud-clock num">{Math.ceil(left)}s</span>}
      {s.modeId === "blitz" && (
        <span className={`combo${mult > 1 ? " is-hot" : ""}`} aria-label={`Multiplier ${mult}`}>
          ×{mult}
        </span>
      )}
      {s.lives !== null && (
        <span className="lives" role="img" aria-label={`${s.lives} of 3 lives left`}>
          {[0, 1, 2].map((i) => (
            <i key={i} className={i < s.lives ? "" : "lost"} />
          ))}
        </span>
      )}
      <span className="hud-score num" aria-label={`Score ${s.score}`}>
        {s.score}
        <small>{UNIT[s.modeId]}</small>
      </span>
    </div>
  );
}

/** Timer bar for timed modes; a row of result dots for fixed-length ones. */
function Meter({ game, s }) {
  const total = game.timeTotal();
  if (total) {
    const left = game.timeLeft(Date.now());
    const frac = s.phase === "feedback" && s.modeId === "survival" ? 0 : left / total;
    return (
      <div
        className={`timer${left < Math.min(10, total / 3) ? " is-low" : ""}`}
        role="progressbar"
        aria-label="Time left"
        aria-valuemin={0}
        aria-valuemax={Math.round(total)}
        aria-valuenow={Math.round(left)}
      >
        <i style={{ transform: `scaleX(${Math.max(0, Math.min(1, frac))})` }} />
      </div>
    );
  }
  const count = game.total ?? s.history.length + 1;
  return (
    <div className="progress-dots" aria-label={`Question ${s.index} of ${count}`}>
      {Array.from({ length: count }, (_, i) => {
        const h = s.history[i];
        const cls = h ? (h.correct ? "dot-hit" : "dot-miss") : i === s.index - 1 ? "dot-now" : "";
        return <i key={i} className={cls} />;
      })}
    </div>
  );
}

function Ready({ mode, setup, best, isEar, empty, onStart, backTo }) {
  const rules = rulesFor(mode.id, setup);
  if (isEar) rules.push("Ear training plays sound, so turn your volume up.");
  return (
    <section className="ready">
      <div className="stack" style={{ "--gap": "12px" }}>
        <span className="label">{setup.title}</span>
        <h1>{mode.title}</h1>
        <p className="set-name">{mode.tagline}</p>
      </div>
      {empty ? (
        <p className="empty-note">
          {mode.input === "spell"
            ? "This deck has nothing to spell. Try Blitz or Survival instead."
            : "There are no cards to play here yet."}
        </p>
      ) : (
        <ul className="rules">
          {rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
      {best !== null && (
        <p className="set-name">
          Your best: <b className="num">{best}</b> {UNIT[mode.id]}
        </p>
      )}
      <div className="actions">
        {!empty && (
          <button type="button" className="btn btn-primary btn-big" onClick={onStart} autoFocus>
            Start <kbd>Enter</kbd>
          </button>
        )}
        <Link to={backTo} className="btn btn-big btn-ghost">
          Back
        </Link>
      </div>
    </section>
  );
}

function Feedback({ q, fb, spellMode, lastOne, onNext, onHear }) {
  const waiting = fb.autoAdvanceMs == null;
  const answer = q.choices.find((c) => c.id === q.answerId)?.label;
  const verdict = fb.correct ? "Correct" : fb.timedOut ? "Time's up" : "Not quite";
  return (
    <section className="feedback" aria-live="polite">
      <div className={`verdict ${fb.correct ? "is-right" : "is-wrong"}`}>
        <strong>{verdict}</strong>
        {!fb.correct && (spellMode || fb.timedOut) && (
          <span>
            Answer: <b>{answer}</b>
          </span>
        )}
      </div>
      <p className="explain">{q.explain}</p>
      {q.reveal && <Piano notes={q.reveal} asSet={q.revealAsSet} />}
      <div className="feedback-actions">
        <button type="button" className="btn btn-primary" onClick={onNext} autoFocus={waiting}>
          {lastOne ? "See results" : "Next"} <kbd>Enter</kbd>
        </button>
        {q.reveal && !q.revealAsSet && (
          <button type="button" className="btn" onClick={onHear}>
            Hear it <kbd>R</kbd>
          </button>
        )}
      </div>
    </section>
  );
}

function Results({ mode, setup, s, outcome, backTo, onRestart, progress }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(null);
  const misses = s.history.filter((h) => !h.correct);
  const missIds = useMemo(() => [...new Set(misses.map((m) => m.cardId))], [misses]);
  const accuracy = s.answered ? Math.round((s.correct / s.answered) * 100) : 0;
  const avg = s.answered ? s.history.reduce((t, h) => t + h.ms, 0) / s.answered : 0;

  const headline =
    s.endedBy === "clock" ? "Time!" : s.endedBy === "lives" ? "Game over" : accuracy === 100 ? "Perfect" : "Done";
  const fixedLength = mode.id === "spell" || mode.id === "review" || mode.id === "daily";

  const dailyRecord = setup.modeId === "daily" ? progress.daily[setup.date] : null;
  const shareText =
    setup.modeId === "daily"
      ? `Chord Theory Daily 10 · ${setup.date}\n${s.correct}/${s.answered} ${s.history.map((h) => (h.correct ? "🟨" : "⬛")).join("")}`
      : null;

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied("Copied. Paste it anywhere.");
    } catch {
      setCopied("Couldn't copy automatically. Select the text above to copy it.");
    }
  }

  return (
    <section className="results">
      <div className="stack" style={{ "--gap": "12px" }}>
        <span className="label">
          {mode.title} · {setup.title}
        </span>
        <h1>{headline}</h1>
      </div>

      <div className="score-line">
        <span className="score-big num">{s.score}</span>
        <span className="score-unit">
          {mode.id === "blitz" ? "points" : fixedLength ? `of ${s.answered} correct` : "correct"}
        </span>
        {outcome?.isBest && <span className="badge">New best</span>}
      </div>
      {outcome && !outcome.isBest && outcome.previous !== null && (
        <p className="set-name">
          Your best is <b className="num">{outcome.previous}</b>.
        </p>
      )}

      <div className="stats">
        <div className="stat">
          <span className="label">Accuracy</span>
          <b className="num">{accuracy}%</b>
        </div>
        <div className="stat">
          <span className="label">Answered</span>
          <b className="num">{s.answered}</b>
        </div>
        <div className="stat">
          <span className="label">Best run</span>
          <b className="num">{s.bestStreak}</b>
        </div>
        <div className="stat">
          <span className="label">Avg time</span>
          <b className="num">{formatMs(avg)}</b>
        </div>
      </div>

      {shareText && (
        <div className="stack" style={{ "--gap": "10px" }}>
          <pre className="miss" style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
            {shareText}
          </pre>
          {dailyRecord && dailyRecord.marks.join("") !== s.history.map((h) => (h.correct ? 1 : 0)).join("") && (
            <p className="set-name">Today's recorded score is your first attempt: {dailyRecord.score}/{dailyRecord.total}.</p>
          )}
          <div className="actions">
            <button type="button" className="btn" onClick={copyShare}>
              Copy result
            </button>
            {copied && <span className="toast">{copied}</span>}
          </div>
        </div>
      )}

      <div className="actions">
        <button type="button" className="btn btn-primary btn-big" onClick={onRestart} autoFocus>
          Play again <kbd>Enter</kbd>
        </button>
        {missIds.length > 0 && (
          <button
            type="button"
            className="btn btn-big"
            onClick={() => navigate("/play/review/misses", { state: { cardIds: missIds } })}
          >
            Review {missIds.length} {missIds.length === 1 ? "miss" : "misses"}
          </button>
        )}
        <Link to={backTo} className="btn btn-big btn-ghost">
          Done
        </Link>
      </div>

      {misses.length > 0 && (
        <div className="stack" style={{ "--gap": "12px" }}>
          <h2 style={{ fontSize: "2rem", textTransform: "uppercase" }}>What you missed</h2>
          <ul className="misses">
            {misses.map((m, i) => (
              <li key={`${m.cardId}-${i}`} className="miss">
                <span className="miss-q">
                  {m.prompt}
                  {m.subject ? `: ${m.subject}` : ""}
                </span>
                <span className="miss-a">
                  {m.chosenLabel && <span className="yours">{m.chosenLabel}</span>}
                  {m.timedOut && <span className="yours">ran out of time</span>}
                  <span className="right">{m.answerLabel}</span>
                </span>
                <span className="explain">{m.explain}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
