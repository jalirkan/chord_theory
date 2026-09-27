import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Arrow } from "../components/Icons.jsx";
import { MODE_ORDER, MODES } from "../quiz/modes.js";
import {
  CUSTOM_ROOT_GROUPS,
  customSearch,
  parseCustom,
  resolveSet,
  SEVENTH_TYPES,
  TRIAD_TYPES,
} from "../quiz/sets.js";
import { CHORD_TYPES, noteName } from "../theory/index.js";

// The original Chord Theory Quiz checklist started with these ticked.
const DEFAULT_ROOTS = ["A", "C", "A#", "C#", "Ab", "Cb"];
const DEFAULT_TYPES = ["maj", "dim"];

const TYPE_LABEL = {
  maj: "Major",
  min: "Minor",
  dim: "Diminished",
  aug: "Augmented",
  maj7: "maj7",
  dom7: "7",
  min7: "m7",
  m7b5: "m7♭5",
  dim7: "°7",
  minmaj7: "m(maj7)",
};

function Chip({ id, checked, onChange, title, children }) {
  return (
    <label className="chip" htmlFor={id} title={title}>
      <input id={id} type="checkbox" checked={checked} onChange={onChange} />
      <span>{children}</span>
    </label>
  );
}

function toggle(set, value) {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export default function Custom() {
  const { search } = useLocation();
  const initial = search ? parseCustom(search) : { roots: DEFAULT_ROOTS, types: DEFAULT_TYPES };
  const [roots, setRoots] = useState(() => new Set(initial.roots));
  const [types, setTypes] = useState(() => new Set(initial.types));

  const allRoots = CUSTOM_ROOT_GROUPS.flatMap((g) => g.roots);
  const allTypes = [...TRIAD_TYPES, ...SEVENTH_TYPES];
  const chosen = {
    roots: allRoots.filter((r) => roots.has(r)),
    types: allTypes.filter((t) => types.has(t)),
  };
  const query = customSearch(chosen);
  const ready = chosen.roots.length > 0 && chosen.types.length > 0;
  const cardCount = useMemo(
    () => (ready ? resolveSet("custom", { search: query }).cards.length : 0),
    [ready, query]
  );

  const setGroup = (setter, values, on) =>
    setter((s) => {
      const next = new Set(s);
      values.forEach((v) => (on ? next.add(v) : next.delete(v)));
      return next;
    });

  return (
    <div className="wrap page">
      <Link to="/" className="back">
        <Arrow /> All decks
      </Link>
      <div className="section-head">
        <div className="stack" style={{ "--gap": "10px" }}>
          <span className="label">Build your own</span>
          <h1 style={{ fontSize: "clamp(2.6rem, 7vw, 4.6rem)", fontWeight: 900, textTransform: "uppercase" }}>
            Custom chords
          </h1>
          <p className="hero-copy">
            Choose the roots and chord qualities you want to drill. Every chord becomes two cards:
            spell it from its name, and name it from its notes.
          </p>
        </div>
      </div>

      <fieldset className="fieldset">
        <legend>Roots</legend>
        {CUSTOM_ROOT_GROUPS.map((g) => (
          <div className="group-row" key={g.label}>
            <span className="label">{g.label}</span>
            <div className="chip-group">
              {g.roots.map((r) => (
                <Chip key={r} id={`root-${r}`} checked={roots.has(r)} onChange={() => setRoots((s) => toggle(s, r))}>
                  {noteName(r)}
                </Chip>
              ))}
              <button type="button" className="btn btn-ghost" onClick={() => setGroup(setRoots, g.roots, !g.roots.every((r) => roots.has(r)))}>
                {g.roots.every((r) => roots.has(r)) ? "None" : "All"}
              </button>
            </div>
          </div>
        ))}
      </fieldset>

      <fieldset className="fieldset">
        <legend>Chord types</legend>
        {[
          ["Triads", TRIAD_TYPES],
          ["Sevenths", SEVENTH_TYPES],
        ].map(([label, list]) => (
          <div className="group-row" key={label}>
            <span className="label">{label}</span>
            <div className="chip-group">
              {list.map((t) => (
                <Chip
                  key={t}
                  id={`type-${t}`}
                  title={CHORD_TYPES[t].name}
                  checked={types.has(t)}
                  onChange={() => setTypes((s) => toggle(s, t))}
                >
                  {TYPE_LABEL[t]}
                </Chip>
              ))}
              <button type="button" className="btn btn-ghost" onClick={() => setGroup(setTypes, list, !list.every((t) => types.has(t)))}>
                {list.every((t) => types.has(t)) ? "None" : "All"}
              </button>
            </div>
          </div>
        ))}
      </fieldset>

      <div className="summary-bar">
        <p aria-live="polite">
          {ready
            ? `${cardCount} cards from ${chosen.roots.length} ${chosen.roots.length === 1 ? "root" : "roots"} × ${chosen.types.length} ${chosen.types.length === 1 ? "chord type" : "chord types"}.`
            : "Pick at least one root and one chord type."}
        </p>
        {MODE_ORDER.map((m) =>
          ready ? (
            <Link key={m} className={`btn${m === "blitz" ? " btn-primary" : ""}`} to={`/play/${m}/custom${query}`}>
              {MODES[m].title}
            </Link>
          ) : (
            <button key={m} type="button" className="btn" disabled>
              {MODES[m].title}
            </button>
          )
        )}
      </div>
    </div>
  );
}
