import React from 'react';
import getSocket from '../../socket';
import { useHistory } from 'react-router-dom';

function Home() {

  const history = useHistory();

  async function createMeet() {
    console.log(':: createMeet ::');
    const { id } = await createRoom();
    history.push(`/meet/${id}`);
  }

  async function createRoom() {
    console.log(':: createRoom ::');
    const socket =  await getSocket();
    return fetch(`${process.env.REACT_APP_API_BASE_URL}api/meet`, {
      method: 'POST',
      body: JSON.stringify({ host: socket.id }),
      headers: {
        'Content-Type': 'application/json',
      }
    }).then((res) => res.json());
  }

  return (
    <div>
      <p className="text-white font-sansblack text-5xl">webstream</p>
      <p className="text-white text-5xl">webstream</p>
      <button onClick={createMeet}>
        Create room
      </button>
    </div>
  );
}

export default Home;
