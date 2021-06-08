import React, { useEffect, useState } from 'react';
import VideoTab from './video-tab';
import Launch from './launch';
import getSocket from '../../socket';
import { useParams, useHistory } from "react-router-dom";
import './style.css';

function Meet() {

  let socket;
  const { id } = useParams();
  const history = useHistory();

  const [participantName, setParticipantName] = useState('');
  const [isHost, setIsHost] = useState(null);
  const [meetDetails, setMeetDetails] = useState(null);

  useEffect(() => {
    setUpMeet()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isHost) setParticipantName(meetDetails.host.name);
  }, [isHost]);

  async function setUpMeet() {
    console.log(':: setUpMeet ::');
    if (!id) history.push('/');
    else {
      const meetResponse = await getMeet(id);
      if (!meetResponse) return history.push('/');
      socket = await getSocket();
      setMeetDetails(meetResponse);
      setIsHost(socket.id === meetResponse.host.id);
    }
  }

  async function getMeet(id) {
    return fetch(`${process.env.REACT_APP_API_BASE_URL}api/meet?id=${id}`)
      .then((data) => data.json());
  }

  return (
    <div className='flex flex-col h-screen py-5'>
      <div className='text-center'>
        {meetDetails && <h3 className="text-white mb-5">{meetDetails?.host?.name}'s meeting</h3>}
      </div>
      <div className='flex flex-grow'>
        {isHost !== null && !participantName && <Launch onLaunch={(name) => setParticipantName(name)} />}
        {isHost !== null && participantName && <VideoTab isHost={isHost} meetId={meetDetails?._id} />}
      </div>
    </div>
  )
}

export default Meet;
