import { toMidiAscending } from "../theory/index.js";

// A small Web Audio "electric piano": a few decaying partials through a
// gentle low-pass. No samples to download, so it works offline.

let ctx = null;
let master = null;

function audio() {
  if (ctx) return ctx;
  const AC = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
  if (!AC) return null;
  try {
    ctx = new AC();
  } catch {
    return null;
  }
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 4;
  master = ctx.createGain();
  master.gain.value = 0.28;
  master.connect(comp).connect(ctx.destination);
  return ctx;
}

/** Call from a click or key handler: browsers only start audio after a gesture. */
export function unlockAudio() {
  const ac = audio();
  if (ac && ac.state === "suspended") ac.resume().catch(() => {});
}

const PARTIALS = [
  [1, 0.55, "triangle"],
  [2, 0.22, "sine"],
  [3, 0.07, "sine"],
  [4, 0.035, "sine"],
];

function tone(ac, midi, start, duration, velocity = 1) {
  const freq = 440 * 2 ** ((midi - 69) / 12);
  const env = ac.createGain();
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(Math.min(9000, freq * 8), start);
  filter.frequency.exponentialRampToValueAtTime(Math.max(600, freq * 2), start + duration);
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(0.5 * velocity, start + 0.008);
  env.gain.exponentialRampToValueAtTime(0.18 * velocity, start + 0.25);
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  env.connect(filter).connect(master);
  for (const [mult, gain, type] of PARTIALS) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq * mult;
    g.gain.value = gain;
    osc.connect(g).connect(env);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }
}

/**
 * Play spelled notes. Styles:
 *  - "chord": quick arpeggio, then the block chord
 *  - "block": all notes at once
 *  - "interval": low note, high note, then both together
 *  - "melody": one after another (scales, key signatures)
 */
export function playNotes(notes, style = "chord") {
  const ac = audio();
  if (!ac || !notes?.length) return;
  if (ac.state === "suspended") ac.resume().catch(() => {});
  const midis = toMidiAscending(notes, 4);
  const t = ac.currentTime + 0.03;
  const soft = 1 / Math.sqrt(midis.length);

  if (style === "block") {
    midis.forEach((m) => tone(ac, m, t, 1.1, soft));
  } else if (style === "interval") {
    tone(ac, midis[0], t, 0.7);
    tone(ac, midis[1], t + 0.6, 0.7);
    midis.forEach((m) => tone(ac, m, t + 1.3, 1.3, 0.8));
  } else if (style === "melody") {
    midis.forEach((m, i) => tone(ac, m, t + i * 0.2, 0.45, 0.9));
  } else {
    midis.forEach((m, i) => tone(ac, m, t + i * 0.11, 0.9, 0.8));
    const chordAt = t + midis.length * 0.11 + 0.25;
    midis.forEach((m) => tone(ac, m, chordAt, 1.5, soft));
  }
}

/** Pick a playback style that suits a list of notes. */
export function styleFor(notes) {
  if (notes.length === 2) return "interval";
  if (notes.length >= 5) return "melody";
  return "chord";
}
