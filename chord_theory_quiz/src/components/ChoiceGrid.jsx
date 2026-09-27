/**
 * Four answer buttons, numbered for the 1–4 keyboard shortcuts. After an
 * answer, the right one turns green and a wrong pick turns red.
 */
export default function ChoiceGrid({ choices, onChoose, feedback, answerId }) {
  const long = choices.some((c) => c.label.length > 16);
  // Short answers (F♯, 4 ♭, vi) stay two-up even on a phone.
  const short = choices.every((c) => c.label.length <= 6);
  const locked = Boolean(feedback);

  return (
    <div
      className={`choices${long ? " is-long" : ""}${short ? " is-short" : ""}`}
      role="group"
      aria-label="Answers"
    >
      {choices.map((c, i) => {
        let state = "";
        let tag = null;
        if (locked) {
          if (c.id === answerId) {
            state = " is-right";
            tag = feedback.correct ? "Correct" : "Answer";
          } else if (c.id === feedback.chosenId) {
            state = " is-wrong";
            tag = "Your pick";
          } else {
            state = " is-dim";
          }
        }
        return (
          <button
            key={c.id}
            type="button"
            className={`choice${state}`}
            onClick={() => onChoose(c.id)}
            disabled={locked}
          >
            <kbd>{i + 1}</kbd>
            <span className="choice-label">{c.label}</span>
            {tag && <span className="tag">{tag}</span>}
          </button>
        );
      })}
    </div>
  );
}
