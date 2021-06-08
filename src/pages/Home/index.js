import React, { useState } from 'react';
import getSocket from '../../socket';
import { useHistory } from 'react-router-dom';

function Home() {

  const history = useHistory();
  const [name, setName] = useState('');

  async function createMeet(event) {
    event.preventDefault();
    console.log(':: createMeet ::');
    const { _id } = await createRoom();
    history.push(`/meet/${_id}`);
  }

  async function createRoom() {
    console.log(':: createRoom ::');
    const socket = await getSocket();
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
    <div className='flex flex-col justify-center items-center h-screen'>
      <h1 className='text-white text-3xl m-5'>WEBSTREAM</h1>
      <form className='flex flex-col gap-4 w-full md:w-3/12' onSubmit={createMeet}>
        <input
          type='text'
          className='input-text'
          value={name}
          placeholder='Enter your name'
          onChange={(event) => {
            event.preventDefault();
            setName(event.target.value);
          }}
        />
        <button
          type='submit'
          className='btn'
          disabled={!name}
        >
          Create room
        </button>
      </form>
    </div>
  );
}

export default Home;
