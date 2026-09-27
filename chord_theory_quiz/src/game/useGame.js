import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { playNotes, styleFor, unlockAudio } from "../audio/synth.js";
import { createGame } from "../quiz/game.js";
import { useProgress } from "../store/ProgressContext.jsx";

const TRACK_BEST = new Set(["blitz", "survival", "spell"]);

/**
 * Runs one game session: owns the engine, drives its clock, records every
 * answer for spaced repetition, and saves the result when the game ends.
 */
export function useGame(setup) {
  const { progress, answer: recordAnswer, finishSession, recordDaily } = useProgress();
  const [, rerender] = useReducer((x) => x + 1, 0);
  const [outcome, setOutcome] = useState(null);
  const gameRef = useRef(null);
  if (!gameRef.current) {
    gameRef.current = createGame({
      modeId: setup.modeId,
      cards: setup.cards,
      rng: setup.rng,
      states: progress.cards,
    });
  }
  const game = gameRef.current;
  const s = game.state;
  const soundOn = progress.settings.sound;

  const replayPrompt = useCallback(() => {
    const q = game.state.question;
    if (q?.audio) playNotes(q.audio.notes, q.audio.style);
  }, [game]);

  const replayAnswer = useCallback(() => {
    const q = game.state.question;
    if (!q?.reveal || q.revealAsSet) return;
    playNotes(q.reveal, q.audio?.style ?? styleFor(q.reveal));
  }, [game]);

  // Daily 10: only the first attempt of the day counts. It is decided at the
  // first answer and saved after every answer, so quitting midway still counts.
  const dailyCounts = useRef(null);
  const dailyTaken = Boolean(progress.daily[setup.date]);

  /** Called after any answer or timeout. */
  const afterResolve = useCallback(() => {
    const st = game.state;
    const q = st.question;
    const fb = st.feedback;
    recordAnswer(q.cardId, fb.correct);

    if (setup.modeId === "daily") {
      if (dailyCounts.current === null) dailyCounts.current = !dailyTaken;
      if (dailyCounts.current) {
        recordDaily(setup.date, {
          score: st.correct,
          total: game.mode.length,
          marks: st.history.map((h) => (h.correct ? 1 : 0)),
        });
      }
    }

    // Ear prompts were just heard; replay them only to teach after a miss.
    const replay = q.audio ? !fb.correct && setup.modeId !== "blitz" : true;
    if (soundOn && replay && q.reveal && !q.revealAsSet) {
      playNotes(q.reveal, setup.modeId === "blitz" ? "block" : (q.audio?.style ?? styleFor(q.reveal)));
    }
  }, [game, recordAnswer, recordDaily, dailyTaken, soundOn, setup.modeId, setup.date]);

  const start = useCallback(() => {
    unlockAudio();
    game.start(Date.now());
    rerender();
  }, [game]);

  const respond = useCallback(
    (response) => {
      if (game.answer(response, Date.now())) afterResolve();
      rerender();
    },
    [game, afterResolve]
  );

  const next = useCallback(() => {
    game.next(Date.now());
    rerender();
  }, [game]);

  // Ear-training prompts play as soon as the question appears.
  const questionKey = s.phase === "question" ? s.index : null;
  useEffect(() => {
    if (questionKey !== null && game.state.question?.audio) replayPrompt();
  }, [questionKey, game, replayPrompt]);

  // The clock: ten ticks a second while a timed question is on screen.
  const ticking = game.timed && s.phase === "question";
  useEffect(() => {
    if (!ticking) return undefined;
    const id = setInterval(() => {
      if (game.tick(Date.now()) && game.state.phase === "feedback") afterResolve();
      rerender();
    }, 100);
    return () => clearInterval(id);
  }, [ticking, s.index, game, afterResolve]);

  // Correct answers (and all Blitz answers) move on by themselves.
  const autoMs = s.phase === "feedback" ? s.feedback.autoAdvanceMs : null;
  useEffect(() => {
    if (autoMs == null) return undefined;
    const id = setTimeout(next, autoMs);
    return () => clearTimeout(id);
  }, [autoMs, s.index, next]);

  // Save the session once, when it ends.
  const saved = useRef(false);
  useEffect(() => {
    if (s.phase !== "over" || saved.current) return;
    saved.current = true;
    if (s.answered === 0) {
      setOutcome({ isBest: false, previous: null });
      return;
    }
    setOutcome(
      finishSession({
        modeId: setup.modeId,
        setId: setup.setId,
        score: s.score,
        trackBest: TRACK_BEST.has(setup.modeId),
      })
    );
  }, [s.phase, s.answered, s.score, setup, finishSession]);

  return {
    game,
    state: s,
    outcome,
    dailyCounted: dailyCounts.current,
    start,
    respond,
    next,
    replayPrompt,
    replayAnswer,
  };
}
