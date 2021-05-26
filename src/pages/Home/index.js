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
    <div className="ml-%0.2 xs:pt-%0.2 sm:pt-%0.2 md:pt-%0.3">
      <h1 className="text-white">webstream</h1>
      <button className="btn" onClick={createMeet}>
        Create room
      </button>
    </div>
  );
}

export default Home;
