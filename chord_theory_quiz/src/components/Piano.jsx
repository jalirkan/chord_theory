import { noteName, toMidiAscending, toMidiInOctave } from "../theory/index.js";

const BLACK = new Set([1, 3, 6, 8, 10]);
const W = 24; // white key width
const H = 100;
const BW = 14;
const BH = 62;

/**
 * Two octaves (or more if needed) with the given spelled notes lit up and
 * labelled. The first note is treated as the root.
 */
export default function Piano({ notes = [], asSet = false }) {
  const midis = notes.length ? (asSet ? toMidiInOctave(notes) : toMidiAscending(notes, 4)) : [];
  const lo = Math.min(60, ...midis);
  const hi = Math.max(83, ...midis);
  const start = lo - (lo % 12);
  const end = hi + (11 - (hi % 12));

  const labels = new Map(midis.map((m, i) => [m, noteName(notes[i])]));
  const root = asSet ? null : midis[0];

  const whites = [];
  const blacks = [];
  let x = 0;
  for (let m = start; m <= end; m++) {
    if (BLACK.has(m % 12)) {
      blacks.push({ m, x: x - BW / 2 });
    } else {
      whites.push({ m, x });
      x += W;
    }
  }
  const width = x;
  const cls = (m, base) => `${base}${labels.has(m) ? (m === root ? " root" : " hit") : ""}`;

  return (
    <svg
      className="piano"
      viewBox={`-1 -1 ${width + 2} ${H + 2}`}
      role="img"
      aria-label={notes.length ? `Keyboard showing ${notes.map(noteName).join(" ")}` : "Keyboard"}
    >
      {whites.map(({ m, x: wx }) => (
        <g key={m}>
          <rect className={cls(m, "white")} x={wx} y={0} width={W} height={H} rx={2} />
          {labels.has(m) && (
            <text x={wx + W / 2} y={H - 9}>
              {labels.get(m)}
            </text>
          )}
        </g>
      ))}
      {blacks.map(({ m, x: bx }) => (
        <g key={m}>
          <rect className={cls(m, "black")} x={bx} y={0} width={BW} height={BH} rx={1.5} />
          {labels.has(m) && (
            <text x={bx + BW / 2} y={BH - 8} style={{ fontSize: 8 }}>
              {labels.get(m)}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
