import React, { useState } from 'react';

function Launch(props) {

  const [ name, setName ] = useState('');

  return (
    <div className="ml-%0.2 ml-%0.2 pt-%0.3">
      <h3 className="text-white">Your meeting is being set up ...</h3>
      <div>
        <input type="text" className="input-text mr-2" placeholder="Enter your name" value={name} onChange={(event) => setName(event.target.value)}/>
        <button className="btn" onClick={() => props.onLaunch(name)} disabled={!name}>
          Launch
        </button>
      </div>
    </div>
  )
}

export default Launch;
