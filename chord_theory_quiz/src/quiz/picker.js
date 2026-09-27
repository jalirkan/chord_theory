// How often a card comes up in the endless modes, by its spaced-repetition box.
// Unseen and recently missed cards come up most; mastered cards still appear.
const BOX_WEIGHT = [3, 2.2, 1.6, 1.2, 1, 1];
const MISSED_WEIGHT = 4;

function weightOf(card, states) {
  const s = states[card.id];
  if (!s || !s.seen) return BOX_WEIGHT[0];
  if (s.box === 0) return MISSED_WEIGHT;
  return BOX_WEIGHT[Math.min(s.box, BOX_WEIGHT.length - 1)];
}

/**
 * Endless weighted picker for Blitz, Survival and Spell It. Cards from small
 * decks are not drowned out by big ones in a mixed set, recent cards are held
 * back, and a missed card is brought back a few questions later.
 */
export function createRandomPicker(cards, rng, states = {}) {
  if (!cards.length) throw new Error("No cards to play");
  const perDeck = {};
  for (const c of cards) perDeck[c.deckId] = (perDeck[c.deckId] ?? 0) + 1;
  const recentLimit = Math.min(6, Math.floor(cards.length / 2));
  const recent = [];
  const comebacks = []; // { card, at }
  let turn = 0;

  function weighted() {
    const pool = cards.filter((c) => !recent.includes(c.id));
    const weights = pool.map((c) => weightOf(c, states) / perDeck[c.deckId]);
    const total = weights.reduce((a, b) => a + b, 0);
    let r = rng() * total;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  }

  return {
    next() {
      turn++;
      const dueIdx = comebacks.findIndex((c) => c.at <= turn);
      const card = dueIdx >= 0 ? comebacks.splice(dueIdx, 1)[0].card : weighted();
      recent.push(card.id);
      if (recent.length > recentLimit) recent.shift();
      return card;
    },
    missed(card) {
      if (!comebacks.some((c) => c.card.id === card.id)) {
        comebacks.push({ card, at: turn + 3 + Math.floor(rng() * 2) });
      }
    },
  };
}

/**
 * Fixed-order picker for Review and the Daily 10. In Review a missed card is
 * re-inserted three places later so it gets a second look before the end.
 */
export function createQueuePicker(cards, { requeue = false, maxLength = Infinity } = {}) {
  const queue = cards.slice();
  let served = 0;
  return {
    next() {
      if (!queue.length || served >= maxLength) return null;
      served++;
      return queue.shift();
    },
    missed(card) {
      if (requeue && !queue.slice(0, 3).some((c) => c.id === card.id)) {
        queue.splice(Math.min(2, queue.length), 0, card);
      }
    },
    get remaining() {
      return Math.min(queue.length, maxLength - served);
    },
  };
}
