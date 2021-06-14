import React, { useEffect, useState } from 'react';
import { useSelector,  useDispatch } from 'react-redux';
import getSocket from '../../socket';
import Tile from './tile';
import iceServers from './iceServers';
import { addParticipant } from '../../store/participants';

function VideoTab() {

  const dispatch = useDispatch();
  const isHost =  useSelector((state) => state.connection.participant.isHost);
  const participantName = useSelector((state) => state.connection.participant.name);
  const meetId = useSelector((state) => state.connection.meetingId);

  let peerConnections = [];
  let localMediaStream;
  const pcConfig = {
    iceServers,
  };
  const constraints = {
    audio: false,
    video: true, // Specify video resolution per requirements
  };

  const participants = [];

  const hostId = useSelector((state) => state.connection.host.id);
  const allParticipants = useSelector((state) => {
    console.log(state);
    return state.participants;
  });

  console.log(allParticipants);
  // const [ participantCount, setParticipantCount ] = useState(0);
  const [ remoteFeed, setRemoteFeed ] = useState([]);
  let socket;
  
  useEffect(() => {
    getSocket().then((socketCn) => {
      socket = socketCn;
      initiateMeetSignalling();
    });
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useEffect(() => {
  //   if (participantCount > 0) {
  //     const index = participantCount - 1;
  //     const newFeed = <Tile isHost={isHost} key={`remote-feed-${index}`} idAttr={`remote-video-${index}`}/>;
  //     setRemoteFeed([ ...remoteFeed, newFeed]);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [participantCount]);

  const initiateMeetSignalling = () => {
    console.log(':: initiateMeetSignalling ::');
    console.log({isHost, meetId});
    isHost ? socket.emit('start-meet', { id: meetId }) : socket.emit('join-meet', { id: meetId, name: participantName });
    socket.on('start-meet', setUpUserMedia);
    socket.on('join-meet', onNewParticipant);
    socket.on('sdp_request', onSdpRequest);
    socket.on('sdp_response', onSdpResponse);
    socket.on('new_ice_candidate', onNewIceCanditate)
  }

  const addNewParticipant = (id, name) => {
    console.log(':: addNewParticipant ::');
    // const allParticipants = dispatch(getParticipants());
    console.log(allParticipants);
    const pcIndex = allParticipants.length;
    console.log({
      allParticipants,
      pcIndex,
    });
    const participant = {
      id,
      name,
      isHost: id === hostId,
      pcIndex,
    };
    dispatch(addParticipant(participant));
    console.log({allParticipants, });
    const newFeed = <Tile isHost={isHost} key={id} idAttr={`remote-video-${pcIndex}`}/>;
    setRemoteFeed([ ...remoteFeed, newFeed]);
    return pcIndex;
  }

  const onNewParticipant = async ({ joinee_id, joinee_name }) => {
    const pcIndex = addNewParticipant(joinee_id, joinee_name);
    participants.push(joinee_id);
    // setParticipantCount(participants.length);
    console.log(':: onNewParticipant ::', {joinee_id, participants, pcIndex});
    await createPeerConnection(pcIndex);
    streamLocalMedia(pcIndex);
  }

  async function onSdpRequest(params) {
    console.log(':: onSdpRequest ::', { request_to: params.request_to, request_by: params.request_by});
    const pcIndex = addNewParticipant(params.request_by, params.request_by_name);
    participants.push(params.request_by);
    // setParticipantCount(participants.length);
    await createPeerConnection(pcIndex);
    peerConnections[pcIndex]
      .setRemoteDescription(new RTCSessionDescription(params.sdp))
      .then(() => setUpUserMedia())
      .then(() => streamLocalMedia(pcIndex))
      .then(() => peerConnections[pcIndex].createAnswer())
      .then((answer) => {
        peerConnections[pcIndex].setLocalDescription(answer);
        socket.emit('sdp_response', { 
          response_by: params.request_to,
          resonse_to: params.request_by,
          sdp: answer,
        });
      })
  }

  function streamLocalMedia(pcIndex)  {
    console.log(`:: streamLocalMedia ::  for ${pcIndex}`);
    localMediaStream.getTracks()
    .forEach(track => peerConnections[pcIndex].addTrack(track, localMediaStream));
  }

  function onSdpResponse(event) {
    const pcIndex = participants.indexOf(event.response_by);
    console.log(':: onSdpResponse ::', pcIndex);
    peerConnections[pcIndex].setRemoteDescription(new RTCSessionDescription(event.sdp));
  }

  function onNewIceCanditate(event) {
    const { canditate_by } = event;
    const pcIndex = participants.indexOf(canditate_by);
    console.log(':: onNewIceCanditate ::', {canditate_by, pcIndex});
    if (pcIndex > -1) {
      peerConnections[pcIndex]
      .addIceCandidate(new RTCIceCandidate(event.candidate))
      .catch((err) => {
        console.log({err});
      });
    }
  } 

  async function createPeerConnection(pcIndex) {
    console.log(`:: createPeerConnection ::  for ${pcIndex}`);
    try {
      const peerConnection = new RTCPeerConnection(pcConfig);
      console.info(`:: createPeerConnection with index ${pcIndex} ::`);
      peerConnection.onicecandidate = (event) => handleIceCanditate(pcIndex, event);
      peerConnection.ontrack = (event) => handleTrack(pcIndex, event);
      peerConnection.onnegotiationneeded = (event) => handleNegotiationNeeded(pcIndex, event);
      peerConnection.oniceconnectionstatechange = (event) => handleICEConnectionStateChange(pcIndex, event);
      peerConnection.onicegatheringstatechange = (event) => handleICEGatheringStateChange(pcIndex, event);
      peerConnection.onsignalingstatechange = (event) => handleSignalingStateChange(pcIndex, event);
      peerConnections.push(peerConnection);
      return;
    } catch (err) {
      console.error('Error in creating peer connection')
    }
  }

  function handleIceCanditate(pcIndex, event) {
    console.log(`:: handleIceCanditate ::  for ${pcIndex}`);
    if (event.candidate) socket.emit('new_ice_candidate', { 
      canditate_by: socket.id,
      canditate_to: participants[pcIndex],
      candidate: event.candidate 
    });
  }

  function handleTrack(pcIndex, event) {
    const videoElId = `remote-video-${pcIndex}`;
    console.log(`:: handleTrack for ${pcIndex} :: ${videoElId}`);
    const videoEl = document.getElementById(videoElId);
    if (videoEl) videoEl.srcObject = event.streams[0];
  }

  function handleNegotiationNeeded(pcIndex, event) {
    console.log(`:: handleNegotiationNeeded  for index ${pcIndex}::`, participants);
    peerConnections[pcIndex]
    .createOffer()
    .then((offer) => peerConnections[pcIndex].setLocalDescription(offer))
    .then(() => {
      socket.emit('sdp_request', {
        request_by: socket.id,
        request_by_name: participantName, 
        request_to: participants[pcIndex],
        sdp: peerConnections[pcIndex].localDescription,  
      });
    })
  }

  function handleICEConnectionStateChange(pcIndex, event) {
    console.log(`:: handleICEConnectionStateChangeEvent for index ${pcIndex}::`);
  }

  function handleICEGatheringStateChange(pcIndex, event) {
    console.log(`:: handleICEGatheringStateChangeEvent for index ${pcIndex}::`);
  }

  function handleSignalingStateChange(pcIndex, event) {
    console.log(`::  for index ${pcIndex}::`);
  }

  async function setUpUserMedia() {
    console.log(':: setUpUserMedia ::');
    try {
      if (!localMediaStream) localMediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      const videoEl = document.getElementById('user-video');
      if (videoEl) videoEl.srcObject = localMediaStream;
      return;
    } catch (err) {
      errorCallback(err);
    }
  }

  function errorCallback(error) {
    console.log(':: errorCallback ::', errorCallback);
    switch(error.name) {
      case 'NotFoundError':
        console.info('Unable to open your call because no camera and/or microphone were found');
        break;
      case 'SecurityError':
        console.info('Security error');
        break;
      case 'PermissionDeniedError':
        console.info('Permissions have not been granted to use your camera and microphone');
        break;
      default:
        console.info('Error opening your camera and/or microphone: ' + error.message);
        break;
    }
  }

  function toggleVideo() {
    if (localMediaStream) {
      const videoTracks = localMediaStream.getVideoTracks();
      if (videoTracks.length) {
        videoTracks[0].enabled = !videoTracks[0].enabled;
      }
    } 
  }

  function toggleAudio() {
    if (localMediaStream) {
      const audioTracks = localMediaStream.getAudioTracks();
      if (audioTracks.length) {
        audioTracks[0].enabled = !audioTracks[0].enabled;
      }
    }
  }

  return <div>
    <div className="buttons is-flex is-justify-content-center is-align-content-center is-align-items-center">
      <button className="button is-warning" onClick={toggleVideo}>Toggle video</button>
      <button className="button is-warning" onClick={toggleAudio}>Toggle audio</button>
    </div>
    <div id="video-tiles" className="flex">
      <Tile isHost={isHost} idAttr='user-video'/>
      <>{remoteFeed}</>
    </div>
  </div>
}

export default VideoTab;
