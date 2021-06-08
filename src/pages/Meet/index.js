import React, { useEffect, useState } from 'react';
import VideoTab from './video-tab';
import Launch from './launch';
import getSocket from '../../socket';
import { useParams, useHistory } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import  { setConnectionState } from '../../store/connection';
import './style.css';

function Meet() {

  let socket;
  const { id }  = useParams();
  const history = useHistory();

  const [ participantName, setParticipantName ] = useState('');
  const [ isHost, setIsHost ] = useState(null);
  const [ meetDetails, setMeetDetails ] = useState(null);

  const dispatch = useDispatch();
  const host = useSelector(state => state.connection.host);

  useEffect(() => {
    setUpMeet()
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isHost) setParticipantName(meetDetails.host.name);
  }, [isHost]);

  async function setUpMeet() {
    console.log(':: setUpMeet ::');
    if(!id) history.push('/');
    else {
      dispatch(setConnectionState({ attr: 'meetingId', value: id}));
      const meetResponse = await getMeet(id);
      if (!meetResponse) return history.push('/');
      socket = await getSocket();
      const hostDetails = meetResponse.host;
      console.log({hostDetails});
      dispatch(setConnectionState({ attr: 'host', value: { id: hostDetails.id, name: hostDetails.name }}));
      if (socket.id === hostDetails.id) dispatch(setConnectionState({ attr: 'participant', value: { id: hostDetails.id, name: hostDetails.name, isHost: true }}));
      setMeetDetails(meetResponse);
      setIsHost(socket.id === meetResponse.host.id);
    }
  }

  function setParticipantDetails(name) {
    setParticipantName(name);
    dispatch(setConnectionState({ attr: 'participant', value: { id: socket.id, name, isHost: false }}));
  }

  async function getMeet(id) {
    return fetch(`${process.env.REACT_APP_API_BASE_URL}api/meet?id=${id}`)
    .then((data) => data.json());
  }

  return (
    <div>
      {participantName}
      {meetDetails && <h3 className="text-white">{ meetDetails?.host?.name}'s meeting</h3>}
      {isHost !== null && !participantName && <Launch onLaunch={(name) => setParticipantDetails(name)}/>} 
      {isHost !== null && participantName && <VideoTab isHost={isHost} meetId={meetDetails?._id}/>} 
    </div>
  )
}

export default Meet;
