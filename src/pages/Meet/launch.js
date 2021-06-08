import React, { useState } from 'react';

function Launch(props) {

  const [name, setName] = useState('');

  return (
    <div className='flex flex-col flex-grow items-center justify-center h-full'>
      <h3 className="text-white my-5">Your meeting is being set up ...</h3>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          props.onLaunch(name);
        }}
        className='flex flex-col gap-4 w-full md:w-3/12'
      >
        <input
          type='text'
          placeholder="Enter your name"
          className='input-text'
          value={name}
          onChange={(event) => {
            event.preventDefault();
            setName(event.target.value);
          }}
        />
        <button
          type='submit'
          disabled={!name}
          className='btn'
        >
          Launch
        </button>
      </form>
    </div>
    // <div className="ml-%0.2 xs:pt-%0.2 sm:pt-%0.2 md:pt-%0.3">
    //   <h3 className="text-white">Your meeting is being set up ...</h3>
    //   <div>
    //     <input type="text" className="input-text mr-2" placeholder="Enter your name" value={name} onChange={(event) => setName(event.target.value)}/>
    //     <button className="btn" onClick={() => props.onLaunch(name)} disabled={!name}>
    //       Launch
    //     </button>
    //   </div>
    // </div>
  )
}

export default Launch;
