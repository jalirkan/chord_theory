import { unlockAudio } from "../audio/synth.js";
import { useProgress } from "../store/ProgressContext.jsx";
import { SoundOff, SoundOn } from "./Icons.jsx";

export default function SoundToggle() {
  const { progress, setSetting } = useProgress();
  const on = progress.settings.sound;
  return (
    <button
      type="button"
      className="icon-btn"
      aria-pressed={on}
      aria-label={on ? "Answers play aloud. Turn sound off" : "Sound is off. Turn it on"}
      title={on ? "Sound on" : "Sound off"}
      onClick={() => {
        if (!on) unlockAudio();
        setSetting("sound", !on);
      }}
    >
      {on ? <SoundOn /> : <SoundOff />}
    </button>
  );
}
