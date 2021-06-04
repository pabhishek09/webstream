import React, { useState } from 'react';
import getSocket from '../../socket';
import { useHistory } from 'react-router-dom';

function Home() {

  const history = useHistory();
  const [ name, setName ] = useState('');

  async function createMeet() {
    console.log(':: createMeet ::');
    const { _id } = await createRoom();
    history.push(`/meet/${_id}`);
  }

  async function createRoom() {
    console.log(':: createRoom ::');
    const socket =  await getSocket();
    return fetch(`${process.env.REACT_APP_API_BASE_URL}api/meet`, {
      method: 'POST',
      body: JSON.stringify({ 
      host: {
        name,
        id: socket.id
      }
    }),
    headers: {
      'Content-Type': 'application/json',
    }
    }).then((res) => res.json());
  }

  return (
    <div className="ml-%0.2 xs:pt-%0.2 sm:pt-%0.2 md:pt-%0.3">
      <h1 className="text-white">webstream</h1>
      <div>
        <input type="text" className="input-text mr-2" placeholder="Enter your name" value={name} onChange={(event) => setName(event.target.value)}/>
        <button className="btn" onClick={createMeet} disabled={!name}>
          Create room
        </button>
      </div>
    </div>
  );
}

export default Home;
