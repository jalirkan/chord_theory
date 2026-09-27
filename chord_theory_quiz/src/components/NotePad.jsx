import { useCallback, useEffect, useState } from "react";
import { LETTERS, noteKey, noteName } from "../theory/index.js";

const SHARP_KEYS = new Set(["=", "+", "#", "s"]);
const FLAT_KEYS = new Set(["-", "_"]);

/**
 * Spell an answer note by note: tap a letter, then ♭/♯ to alter the last
 * note. Keyboard: A–G add a note, - flat, = or # sharp, N natural,
 * Backspace undo, Enter check.
 */
export default function NotePad({ count, onSubmit, locked, expected }) {
  const [notes, setNotes] = useState([]);
  const full = notes.length === count;

  const add = useCallback(
    (letter) => setNotes((ns) => (ns.length < count ? [...ns, { letter, acc: 0 }] : ns)),
    [count]
  );

  const alter = useCallback((kind) => {
    setNotes((ns) => {
      if (!ns.length) return ns;
      const last = ns[ns.length - 1];
      let acc = 0;
      if (kind === "flat") acc = last.acc === -1 ? -2 : -1;
      if (kind === "sharp") acc = last.acc === 1 ? 2 : 1;
      if (kind === "dflat") acc = -2;
      if (kind === "dsharp") acc = 2;
      return [...ns.slice(0, -1), { ...last, acc }];
    });
  }, []);

  const back = useCallback(() => setNotes((ns) => ns.slice(0, -1)), []);

  const submit = useCallback(() => {
    if (notes.length === count) onSubmit(notes.map(noteKey));
  }, [notes, count, onSubmit]);

  useEffect(() => {
    if (locked) return undefined;
    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (/^[a-g]$/.test(k)) add(k.toUpperCase());
      else if (FLAT_KEYS.has(k)) alter("flat");
      else if (SHARP_KEYS.has(k)) alter("sharp");
      else if (k === "n") alter("natural");
      else if (k === "Backspace") back();
      else if (k === "Enter") submit();
      else return;
      e.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locked, add, alter, back, submit]);

  // Mark each typed note right at most as often as it appears in the answer,
  // so "F F F" for F major shows one green slot, not three.
  const unmatched = [...(expected ?? [])];
  const slotOk = notes.map((n) => {
    const i = unmatched.indexOf(noteKey(n));
    if (i === -1) return false;
    unmatched.splice(i, 1);
    return true;
  });

  return (
    <div className="notepad">
      <div className="slots" aria-live="polite">
        {Array.from({ length: count }, (_, i) => {
          const n = notes[i];
          let cls = "slot";
          if (n) cls += " is-filled";
          else if (i === notes.length && !locked) cls += " is-next";
          if (locked && n) cls += slotOk[i] ? " is-ok" : " is-bad";
          return (
            <span key={i} className={cls} aria-label={n ? noteName(n) : `empty slot ${i + 1}`}>
              {n ? noteName(n) : ""}
            </span>
          );
        })}
      </div>

      {!locked && (
        <>
          <div className="pad-letters">
            {LETTERS.map((l) => (
              <button key={l} type="button" className="pad-key" onClick={() => add(l)} disabled={full}>
                {l}
              </button>
            ))}
          </div>
          <div className="pad-accs">
            {[
              ["dflat", "𝄫", "Double flat"],
              ["flat", "♭", "Flat"],
              ["natural", "♮", "Natural"],
              ["sharp", "♯", "Sharp"],
              ["dsharp", "𝄪", "Double sharp"],
            ].map(([kind, glyph, label]) => (
              <button
                key={kind}
                type="button"
                className="pad-key acc"
                onClick={() => alter(kind)}
                disabled={!notes.length}
                aria-label={`${label} on last note`}
              >
                {glyph}
              </button>
            ))}
            <button type="button" className="pad-key acc" onClick={back} disabled={!notes.length} aria-label="Delete last note">
              ⌫
            </button>
          </div>
          <div className="pad-actions">
            <button type="button" className="btn btn-primary btn-big" onClick={submit} disabled={!full}>
              Check <kbd>Enter</kbd>
            </button>
          </div>
          <p className="hint" style={{ justifyContent: "center" }}>
            <span><kbd>A</kbd>–<kbd>G</kbd> add a note</span>
            <span><kbd>-</kbd> flat</span>
            <span><kbd>=</kbd> sharp</span>
            <span><kbd>⌫</kbd> undo</span>
          </p>
        </>
      )}
    </div>
  );
}
