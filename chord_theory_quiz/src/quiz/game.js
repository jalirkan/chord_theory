import { noteKey, noteName } from "../theory/index.js";
import { parseCardId } from "./cards.js";
import { isSpellable, questionFor } from "./decks/index.js";
import { BLITZ_POINTS, MODES, multiplier, survivalSeconds } from "./modes.js";
import { createQueuePicker, createRandomPicker } from "./picker.js";

// Pauses after an answer, in ms. null means wait for the player to continue.
const FEEDBACK_DELAY = {
  blitz: { right: 350, wrong: 1100 },
  survival: { right: 500, wrong: null },
  spell: { right: 900, wrong: null },
  review: { right: 900, wrong: null },
  daily: { right: 900, wrong: null },
};

const REVIEW_CAP = 30; // requeued misses can't make a review go on forever

export function spellingMatches(expected, given) {
  if (expected.length !== given.length) return false;
  const norm = (list) => list.map(noteKey).sort().join(" ");
  return norm(expected) === norm(given);
}

/**
 * A single play session. Pure state + methods; the React hook drives the
 * clock by calling tick(now) and re-renders after each call.
 */
export function createGame({ modeId, cards, rng = Math.random, states = {} }) {
  const mode = MODES[modeId];
  if (!mode) throw new Error(`Unknown mode "${modeId}"`);
  const pool = mode.input === "spell" ? cards.filter(isSpellable) : cards;

  const picker =
    modeId === "review" || modeId === "daily"
      ? createQueuePicker(pool, { requeue: modeId === "review", maxLength: modeId === "daily" ? 10 : REVIEW_CAP })
      : pool.length
        ? createRandomPicker(pool, rng, states)
        : null;

  const state = {
    modeId,
    phase: "ready", // ready → question ⇄ feedback → over
    empty: pool.length === 0,
    question: null,
    index: 0,
    shownAt: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    correct: 0,
    answered: 0,
    lives: mode.lives ?? null,
    clockLeft: mode.clock ? mode.clock * 1000 : null,
    deadline: null,
    questionSeconds: null, // Survival's allowance for the current question
    feedback: null,
    history: [],
    endedBy: null,
  };

  function nextQuestion(now) {
    const reachedLength = mode.length && modeId === "spell" && state.answered >= mode.length;
    const card = reachedLength ? null : picker.next();
    if (!card) return finish("complete");
    state.question = questionFor(card, rng);
    state.index += 1;
    state.phase = "question";
    state.shownAt = now;
    state.feedback = null;
    state.questionSeconds = modeId === "survival" ? survivalSeconds(state.streak) : null;
    state.deadline = state.questionSeconds ? now + state.questionSeconds * 1000 : null;
  }

  function finish(reason) {
    state.phase = "over";
    state.endedBy = reason;
    state.deadline = null;
  }

  function resolve(correct, { chosenId = null, notes = null, timedOut = false }, now) {
    const q = state.question;
    const ms = now - state.shownAt;
    let points = 0;

    if (state.clockLeft !== null) state.clockLeft = Math.max(0, state.clockLeft - ms);
    state.answered += 1;
    if (correct) {
      points = modeId === "blitz" ? BLITZ_POINTS * multiplier(state.streak) : 1;
      state.score += points;
      state.correct += 1;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
    } else {
      state.streak = 0;
      if (state.lives !== null) state.lives -= 1;
      picker.missed(parseCardId(q.cardId));
    }

    const chosen = q.choices.find((c) => c.id === chosenId);
    const answer = q.choices.find((c) => c.id === q.answerId);
    state.history.push({
      cardId: q.cardId,
      prompt: q.prompt,
      subject: q.subject,
      answerLabel: answer.label,
      chosenLabel: chosen?.label ?? (notes ? notes.map(noteName).join(" ") : null),
      correct,
      timedOut,
      ms,
      explain: q.explain,
    });

    const delays = FEEDBACK_DELAY[modeId];
    const outOfLives = state.lives === 0;
    state.phase = "feedback";
    state.deadline = null;
    state.feedback = {
      correct,
      chosenId,
      notes,
      points,
      timedOut,
      autoAdvanceMs: outOfLives ? null : correct ? delays.right : delays.wrong,
    };
    return state.feedback;
  }

  return {
    state,
    mode,
    get timed() {
      return modeId === "blitz" || modeId === "survival";
    },

    start(now) {
      if (state.phase !== "ready" || state.empty) return;
      nextQuestion(now);
    },

    /** response: { choiceId } or { notes: ["Eb", "Gb", "Bb"] } */
    answer(response, now) {
      if (state.phase !== "question") return null;
      const q = state.question;
      const correct = response.notes
        ? Boolean(q.spell) && spellingMatches(q.spell.notes, response.notes)
        : response.choiceId === q.answerId;
      return resolve(correct, { chosenId: response.choiceId ?? null, notes: response.notes ?? null }, now);
    },

    next(now) {
      if (state.phase !== "feedback") return;
      if (state.lives === 0) return finish("lives");
      if (state.clockLeft === 0) return finish("clock");
      nextQuestion(now);
    },

    /** Advance the clock. Returns true when something changed. */
    tick(now) {
      if (state.phase !== "question") return false;
      if (state.clockLeft !== null && now - state.shownAt >= state.clockLeft) {
        state.clockLeft = 0;
        finish("clock");
        return true;
      }
      if (state.deadline !== null && now >= state.deadline) {
        resolve(false, { timedOut: true }, now);
        return true;
      }
      return false;
    },

    /** Seconds left on whichever clock is running (null if untimed). */
    timeLeft(now) {
      if (state.clockLeft !== null) {
        const running = state.phase === "question" ? now - state.shownAt : 0;
        return Math.max(0, state.clockLeft - running) / 1000;
      }
      if (state.deadline !== null) return Math.max(0, state.deadline - now) / 1000;
      return null;
    },

    /** Full length of the running clock in seconds, for drawing the timer bar. */
    timeTotal() {
      return mode.clock ?? state.questionSeconds;
    },

    /** Questions in this session, when it has a fixed length. */
    get total() {
      if (modeId === "spell") return mode.length;
      if (modeId === "daily" || modeId === "review") return state.index + picker.remaining;
      return null;
    },
  };
}
