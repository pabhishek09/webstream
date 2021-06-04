import React, { useEffect, useState } from 'react';
import Feed from '../../components/Feed';
import getSocket from '../../socket';
import { useParams, useHistory } from "react-router-dom";
import './style.css';

function Meet() {

  let socket;
  const { id }  = useParams();
  let meetDetails;
  const history = useHistory();
  let peerConnections = [];
  let localMediaStream;
  const pcConfig = {
    iceServers: [
      // See https://github.com/coturn/coturn
      // for a custom implementation of stun/turn servers
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: 'turn:relay.backups.cz',
        credential: 'webrtc',
        username: 'webrtc',
        credentialType: 'password',
      },
      {
        urls: 'turn:relay.backups.cz?transport=tcp',
        credential: 'webrtc',
        username: 'webrtc',
        credentialType: 'password',
      },
    ]
  };
  const constraints = {
    audio: false,
    video: true, // Specify video resolution per requirements
  };
  let isHost;

  const participants = [];
  const [ participantCount, setParticipantCount ] = useState(0);
  const [ remoteFeed, setRemoteFeed ] = useState([]);
  const [ participantName, setParticipantName ] = useState('');
  const [ hostName, setHostName ] = useState('');

  useEffect(() => {
    setUpMeet()
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (participantCount > 0) {
      const index = participantCount - 1;
      const newFeed = <Feed isHost='false' key={`remote-feed-${index}`} idAttr={`remote-video-${index}`}/>;
      setRemoteFeed([ ...remoteFeed, newFeed]);
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantCount]);

  async function setUpMeet() {
    console.log(':: setUpMeet ::');
    await validateMeet();
    socket = await getSocket();
    isHost = socket.id === meetDetails.host.id;
    setHostName(meetDetails.host.name);
    if (isHost) setParticipantName(meetDetails.host.name);
    console.log(`:: isHost ::  ${isHost}`)
    initiateMeetSignalling();
  }

  async function validateMeet()  {
    if(!id) history.push('/');
    else {
      meetDetails = await getMeet(id);
      if (!meetDetails) return history.push('/');
    }
  }

  async function getMeet(id) {
    return fetch(`${process.env.REACT_APP_API_BASE_URL}api/meet?id=${id}`)
    .then((data) => data.json());
  }

  function initiateMeetSignalling() {
    console.log(':: initiateMeetSignalling ::');
    isHost ? socket.emit('start-meet', meetDetails) : socket.emit('join-meet', meetDetails);
    socket.on('start-meet', setUpUserMedia);
    socket.on('join-meet', onNewParticipant);
    socket.on('sdp_request', onSdpRequest);
    socket.on('sdp_response', onSdpResponse);
    socket.on('new_ice_candidate', onNewIceCanditate)
  }

  async function onNewParticipant({ joinee_id }) {
    participants.push(joinee_id);
    setParticipantCount(participants.length);
    console.log(':: onNewParticipant ::', {joinee_id, participants, participantCount});
    const newParticipantIndex = participants.length-1;
    await createPeerConnection(newParticipantIndex);
    streamLocalMedia(newParticipantIndex);
  }

  async function onSdpRequest(params) {
    console.log(':: onSdpRequest ::', { request_to: params.request_to, request_by: params.request_by});
    participants.push(params.request_by);
    setParticipantCount(participants.length);
    const pcIndex = participants.length - 1;
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
    
  return (
    <div>
      <h3>{hostName}'s meeting</h3>
      <div className="buttons is-flex is-justify-content-center is-align-content-center is-align-items-center">
        <button className="button is-warning" onClick={toggleVideo}>Toggle video</button>
        <button className="button is-warning" onClick={toggleAudio}>Toggle audio</button>
      </div>
      <div id="video-tiles" className="flex">
        <Feed isHost='true' idAttr='user-video' />
        <>{remoteFeed}</>
      </div>
    </div>
  )
}

export default Meet;
