import { recordAnswer } from "../quiz/srs.js";

export const STORAGE_KEY = "chord-theory:progress:v1";

export function emptyProgress() {
  return {
    version: 1,
    cards: {}, // cardId → spaced-repetition state
    best: {}, // "mode:set" → { score, at }
    days: {}, // "YYYY-MM-DD" → answers that day
    daily: {}, // "YYYY-MM-DD" → { score, total, marks }
    totals: { answered: 0, correct: 0, sessions: 0 },
    settings: { sound: true },
  };
}

/** Fill in anything missing from older or hand-edited saves. */
export function normalize(saved) {
  const base = emptyProgress();
  if (!saved || typeof saved !== "object") return base;
  return {
    ...base,
    ...saved,
    totals: { ...base.totals, ...saved.totals },
    settings: { ...base.settings, ...saved.settings },
  };
}

/** Local calendar date, so a streak follows the player's own midnight. */
export function dateKey(ts = Date.now()) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function shiftDay(key, delta) {
  const [y, m, d] = key.split("-").map(Number);
  return dateKey(new Date(y, m - 1, d + delta).getTime());
}

/** Consecutive days with practice, counting today or (if not yet) yesterday. */
export function streak(days, today = dateKey()) {
  let day = days[today] ? today : shiftDay(today, -1);
  let count = 0;
  while (days[day]) {
    count++;
    day = shiftDay(day, -1);
  }
  return count;
}

export function applyAnswer(p, cardId, correct, now = Date.now()) {
  const day = dateKey(now);
  return {
    ...p,
    cards: { ...p.cards, [cardId]: recordAnswer(p.cards[cardId], correct, now) },
    days: { ...p.days, [day]: (p.days[day] ?? 0) + 1 },
    totals: {
      ...p.totals,
      answered: p.totals.answered + 1,
      correct: p.totals.correct + (correct ? 1 : 0),
    },
  };
}

export const bestKey = (modeId, setId) => `${modeId}:${setId}`;

/**
 * Record a finished session. Returns the new progress and whether the score
 * beat the previous best for that mode and set.
 */
export function applySession(p, { modeId, setId, score, trackBest = true }, now = Date.now()) {
  const key = bestKey(modeId, setId);
  const previous = trackBest ? (p.best[key]?.score ?? null) : null;
  const isBest = trackBest && score > 0 && (previous === null || score > previous);
  const next = {
    ...p,
    totals: { ...p.totals, sessions: p.totals.sessions + 1 },
    best: isBest ? { ...p.best, [key]: { score, at: now } } : p.best,
  };
  return { progress: next, isBest, previous };
}

/** Save (or update) the Daily 10 result for a date. */
export function applyDaily(p, date, result) {
  return { ...p, daily: { ...p.daily, [date]: result } };
}
