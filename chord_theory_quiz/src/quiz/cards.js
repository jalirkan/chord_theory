// A card is one fact to memorize, e.g. "spell E♭ minor". Its id is readable
// and self-describing ("triads/spell/Eb/min") so progress can be stored by id
// and the card rebuilt later without keeping the whole deck around.

export function makeCard(deckId, kind, params = []) {
  const values = params.map(String);
  if (values.some((v) => v.includes("/"))) {
    throw new Error(`Card params cannot contain "/": ${values.join(",")}`);
  }
  return { id: [deckId, kind, ...values].join("/"), deckId, kind, params: values };
}

export function parseCardId(id) {
  const [deckId, kind, ...params] = id.split("/");
  return { id, deckId, kind, params };
}
