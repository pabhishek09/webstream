import React, { useEffect, useState } from 'react';
import Meeting from './meeting';
import Launch from './launch';
import { getSocket } from '../../socket';
import { useParams, useHistory } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import  { setConnectionState } from '../../store/connection';

function Meet() {

  const { id }  = useParams();
  const history = useHistory();

  const [ socketId, setSocketId ] = useState(null);

  const dispatch = useDispatch();
  const participantName = useSelector((state) => state.connection.participant.name);

  useEffect(() => {
    setUpMeet()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setUpMeet() {
    console.log(':: setUpMeet ::');
    if(!id) history.push('/');
    else {
      dispatch(setConnectionState({ attr: 'meetingId', value: id}));
      const meetResponse = await getMeet(id);
      console.log({meetResponse});
      if (!meetResponse) return history.push('/');
      const socket = await getSocket();
      setSocketId(socket.id);
      const hostDetails = meetResponse.host;
      dispatch(setConnectionState({ attr: 'host', value: { id: hostDetails.id, name: hostDetails.name }}));
      if (socket.id === hostDetails.id) {
        dispatch(setConnectionState({ attr: 'participant', value: { id: hostDetails.id, name: hostDetails.name, isHost: true }}));
      }
    }
  }

  function setParticipantDetails(name) {
    dispatch(setConnectionState({ attr: 'participant', value: { id: socketId, name, isHost: false }}));
  }

  async function getMeet(id) {
    return fetch(`${process.env.REACT_APP_API_BASE_URL}api/meet?id=${id}`)
    .then((data) => data.json());
  }

  return (
    <div>
      {!participantName && <Launch onLaunch={(name) => setParticipantDetails(name)}/>} 
      {participantName && <Meeting/>} 
    </div>
  )
}

export default Meet;
