import "../Styles/quiz.css";

function Quiz() {
  return (
    <div>
      <header>
        <button className="btn retry">Retry</button>
        <h1>Guess This Chord!</h1>
        <p className="root_note">A</p>
      </header>
      <div>
        <section className="left">
          <input type="string" class="guess" />
          <button className="btn check">Check!</button>
        </section>
        <section className="right">
          <p className="message">Start guessing...</p>
          <p className="label-health">
            Lives: <span class="health">3</span>
          </p>
          <p className="label-highscore">
            Highscore: <span className="highscore">0</span>
          </p>
        </section>
      </div>
    </div>
  );
}
export default Quiz;
