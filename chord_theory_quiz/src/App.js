import './App.css';
import { useState } from 'react';
import { Switch, Route, Link, useHistory } from 'react-router-dom';
import Quizzicles from './Components/quizzicles';

function App() {
  const history = useHistory();

  const routeChange = (evt) => {
    evt.preventDefault();
    history.push("/quiz");
  };
  let [selected, setSelected] = useState('type in me here');

  function onChange(evt) {
    let { value } = evt.target;
    setSelected(value);
  }

  return (
    <div>
      <Switch>
        <Route exact path='/'>
          <div>
            <h1 style={{ marginBottom: '-1%' }}>Chord Theory Quiz</h1>
            <h2 style={{ marginBottom: '0' }}>Select chords:</h2>
          </div>
          <div class='categories'>
            <div class='roots'>
              <h3>Root notes:</h3>
              <div>
                <input
                  type='checkbox'
                  name='roots'
                  id='roots_a'
                  value='A'
                  checked
                />
                <label for='roots_a'>A</label>
              </div>

              <div>
                <input type='checkbox' name='roots' id='roots_b' value='B' />
                <label for='roots_b'>B</label>
              </div>
              <div>
                <input
                  type='checkbox'
                  name='roots'
                  id='roots_c'
                  value='C'
                  checked
                />
                <label for='roots_c'>C</label>
              </div>

              <div>
                <input type='checkbox' name='roots' id='roots_d' value='D' />
                <label for='roots_d'>D</label>
              </div>

              <div>
                <input type='checkbox' name='roots' id='roots_e' value='E' />
                <label for='roots_e'>E</label>
              </div>

              <div>
                <input type='checkbox' name='roots' id='roots_f' value='F' />
                <label for='roots_f'>F</label>
              </div>

              <div>
                <input type='checkbox' name='roots' id='roots_g' value='G' />
                <label for='roots_g'>G</label>
              </div>
            </div>

            <div class='sharps'>
              <h3>Sharps:</h3>
              <div>
                <input
                  type='checkbox'
                  name='sharps'
                  id='sharps_a'
                  value='sharpsA'
                  checked
                />
                <label for='sharps_a'>A#</label>
              </div>
              <div>
                <input
                  type='checkbox'
                  name='sharps'
                  id='sharps_b'
                  value='sharpsB'
                />
                <label for='sharps_b'>B#</label>
              </div>
              <div>
                <input
                  type='checkbox'
                  name='sharps'
                  id='sharps_c'
                  value='sharpsC'
                  checked
                />
                <label for='sharps_c'>C#</label>
              </div>
              <div>
                <input
                  type='checkbox'
                  name='sharps'
                  id='sharps_d'
                  value='sharpsD'
                />
                <label for='sharps_d'>D#</label>
              </div>
              <div>
                <input
                  type='checkbox'
                  name='sharps'
                  id='sharps_e'
                  value='sharpsE'
                />
                <label for='sharps_e'>E#</label>
              </div>
              <div>
                <input
                  type='checkbox'
                  name='sharps'
                  id='sharps_f'
                  value='sharpsF'
                />
                <label for='sharps_f'>F#</label>
              </div>
              <div>
                <input
                  type='checkbox'
                  name='sharps'
                  id='sharps_g'
                  value='sharpsG'
                />
                <label for='sharps_g'>G#</label>
              </div>
            </div>

            <div class='flats'>
              <h3>Flats:</h3>
              <div>
                <input
                  type='checkbox'
                  name='flats'
                  id='flats_a'
                  value='flatsA'
                  checked
                />
                <label for='flats_a'>Ab</label>
              </div>
              <div>
                <input
                  type='checkbox'
                  name='flats'
                  id='flats_b'
                  value='flatsB'
                />
                <label for='flats_b'>Bb</label>
              </div>
              <div>
                <input
                  type='checkbox'
                  name='flats'
                  id='flats_c'
                  value='flatsC'
                  checked
                />
                <label for='flats_c'>Cb</label>
              </div>
              <div>
                <input
                  type='checkbox'
                  name='flats'
                  id='flats_d'
                  value='flatsD'
                />
                <label for='flats_d'>Db</label>
              </div>
              <div>
                <input
                  type='checkbox'
                  name='flats'
                  id='flats_e'
                  value='flatsE'
                />
                <label for='flats_e'>Eb</label>
              </div>
              <div>
                <input
                  type='checkbox'
                  name='flats'
                  id='flats_f'
                  value='flatsF'
                />
                <label for='flats_f'>Fb</label>
              </div>
              <div>
                <input
                  type='checkbox'
                  name='flats'
                  id='flats_g'
                  value='flatsG'
                />
                <label for='flats_g'>Gb</label>
              </div>
            </div>

            <div class='triads'>
              <h3>Triads:</h3>
              <div>
                <input
                  type='checkbox'
                  name='triad-types'
                  id='major'
                  value='Major'
                  checked
                />
                <label for='major'>Major</label>
              </div>
              <div>
                <input
                  type='checkbox'
                  name='triad-types'
                  id='minor'
                  value='Minor'
                />
                <label for='minor'>Minor</label>
              </div>
              <div>
                <input
                  type='checkbox'
                  name='triad-types'
                  id='dim'
                  value='Diminished'
                  checked
                />
                <label for='dim'>Diminished</label>
              </div>
              <div>
                <input
                  type='checkbox'
                  name='triad-types'
                  id='aug'
                  value='Augmented'
                />
                <label for='aug'>Augmented</label>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '2.5%' }}>
            <button
              onClick={routeChange}
              type='submit'
              name='submit'
              value='Submit'
            >
              Submit
            </button>
          </div>
        </Route>
        <Route exact path='/quiz'>
          <Quizzicles />
        </Route>
      </Switch>
    </div>
  );
}

export default App;
