import './App.css';
import {useState} from "react"

function App() {
  let [selected, setSelected] = useState("type in me here");

  function onChange(evt){
    let {value} = evt.target;
    
    setSelected(value);
  }

  return (
    <div>
      <label>
        Selected: 
        <input name="selected"value={selected} onChange={onChange}/>
      </label>
    </div>
  );
}

export default App;
