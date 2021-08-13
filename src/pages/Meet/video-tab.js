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
  const hostId = useSelector((state) => state.connection.host.id);
  const allParticipants = useSelector((state) => state.participants);

  const [ remoteFeed, setRemoteFeed ] = useState([]);
  const [ peerConnections, setPeerConnections ] = useState([]);

  useEffect(() => {
    getSocket().then((socketCn) => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      socket = socketCn;
      initiateMeetSignalling();
    });
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (allParticipants.length > 0 ) {
      const pcIndex = allParticipants.length - 1;
      const participant = allParticipants[pcIndex];
      const { id } = participant;
      const newFeed = <Tile 
      isHost={id === hostId} 
      key={id} 
      idAttr={`remote-video-${pcIndex}`}
    />;
    setRemoteFeed([ ...remoteFeed, newFeed]);
    createPeerConnection(pcIndex, participant);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allParticipants]);

  useEffect(() => {
    if (peerConnections.length > 0) {
      getSocket().then((socketCn) => {
        socketCn.removeAllListeners('new_ice_candidate');
        socketCn.removeAllListeners('sdp_response');
        socketCn.on('new_ice_candidate', (event) => onNewIceCanditate(event, peerConnections, allParticipants));
        socketCn.on('sdp_response', (event) => onSdpResponse(event, peerConnections, allParticipants));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerConnections]);

  let localMediaStream;
  let socket;
  const pcConfig = {
    iceServers,
  };
  const constraints = {
    audio: false,
    video: true, // Specify video resolution per requirements
  };

  const initiateMeetSignalling = () => {
    console.log(':: initiateMeetSignalling ::');
    console.log({isHost, meetId});
    isHost ? socket.emit('start-meet', { id: meetId }) : socket.emit('join-meet', { id: meetId, name: participantName });
    socket.on('start-meet', setUpUserMedia);
    socket.on('join-meet', ({ joinee_id, joinee_name }) => addNewParticipant(joinee_id, joinee_name));
    socket.on('sdp_request', (params) => addNewParticipant(params.request_by, params.request_by_name, params));
  }

  function addNewParticipant (id, name, sdpRequest) {
    console.log(':: addNewParticipant ::' , { name, id });
    const participant = {
      id,
      name,
      isHost: id === hostId,
      sdpRequest,
    };
    dispatch(addParticipant(participant));
  }

  function streamLocalMedia(peerConnection)  {
    console.log(`:: streamLocalMedia ::`);
    localMediaStream.getTracks()
      .forEach(track => peerConnection.addTrack(track, localMediaStream));
  }

  function onSdpResponse(event, peerConnections, participants) {
    const pcIndex = indexOfConnection(participants, event.response_by);
    console.log(`:: onSdpResponse :: for pcindex ${pcIndex}`);
    peerConnections[pcIndex].setRemoteDescription(new RTCSessionDescription(event.sdp));
  }

  function onNewIceCanditate(event, peerConnections, participants) {
    const { canditate_by } = event;
    const pcIndex = indexOfConnection(participants, canditate_by);
    console.log(':: onNewIceCanditate ::', {canditate_by, pcIndex});
    if (pcIndex > -1) {
      peerConnections[pcIndex]
      .addIceCandidate(new RTCIceCandidate(event.candidate))
      .catch((err) => {
        console.log({err});
      });
    }
  } 

  async function createPeerConnection(pcIndex, participant) {
    console.log(`:: createPeerConnection ::  for ${pcIndex}`);
    const peerConnection = new RTCPeerConnection(pcConfig);
    try {
      peerConnection.onicecandidate = (event) => handleIceCanditate(pcIndex, event);
      peerConnection.ontrack = (event) => handleTrack(pcIndex, event);
      peerConnection.onnegotiationneeded = (event) => handleNegotiationNeeded(peerConnection, participant);
      peerConnection.oniceconnectionstatechange = (event) => handleICEConnectionStateChange(pcIndex, event);
      peerConnection.onicegatheringstatechange = (event) => handleICEGatheringStateChange(pcIndex, event);
      peerConnection.onsignalingstatechange = (event) => handleSignalingStateChange(pcIndex, event);
      setPeerConnections([...peerConnections, peerConnection]);
    } catch (err) {
      console.error('Error in creating peer connection', err);
    }
    if (participant.sdpRequest) {
      peerConnection
      .setRemoteDescription(new RTCSessionDescription(participant.sdpRequest.sdp))
      .then(() => setUpUserMedia())
      .then(() => streamLocalMedia(peerConnection))
      .then(() => peerConnection.createAnswer())
      .then((answer) => {
        peerConnection.setLocalDescription(answer);
        getSocket().then((socketCn) => {
          socketCn.emit('sdp_response', { 
            response_by: participant.sdpRequest.request_to,
            resonse_to: participant.sdpRequest.request_by,
            sdp: answer,
          });
        });
      })
    } else {
      await setUpUserMedia();
      streamLocalMedia(peerConnection);
    }
  }

  function handleIceCanditate(pcIndex, event) {
    console.log(`:: handleIceCanditate ::  for ${pcIndex}`);
    if (event.candidate) {
      getSocket().then((socketCn) => {
        socketCn.emit('new_ice_candidate', { 
          canditate_by: socketCn.id,
          canditate_to: allParticipants[pcIndex].id,
          candidate: event.candidate 
        });
      });
    }
  }

  function handleTrack(pcIndex, event) {
    const videoElId = `remote-video-${pcIndex}`;
    console.log(`:: handleTrack for ${pcIndex} :: ${videoElId}`);
    const videoEl = document.getElementById(videoElId);
    if (videoEl) videoEl.srcObject = event.streams[0];
  }

  function handleNegotiationNeeded(peerConnection, participant) {
    console.log(`:: handleNegotiationNeeded  for index ::`);
    peerConnection
    .createOffer()
    .then((offer) => peerConnection.setLocalDescription(offer))
    .then(() => {
      console.log(allParticipants);
      getSocket().then((socketCn) => {
        socketCn.emit('sdp_request', {
          request_by: socketCn.id,
          request_by_name: participantName, 
          request_to: participant.id,
          sdp: peerConnection.localDescription,  
        });
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
      console.log(localMediaStream);
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

  function indexOfConnection(participants, id) {
    console.log('::indexOfConnections::', participants);
    for (let index = 0; index < participants.length; index++) {
      if (participants[index].id === id) return index;
    }
    return -1;
  }

  return <div>
    <div className="buttons is-flex is-justify-content-center is-align-content-center is-align-items-center">
      <button className="button is-warning" onClick={toggleVideo}>Toggle Video</button>
      <button className="button is-warning" onClick={toggleAudio}>Toggle Audio</button>
    </div>
    <div id="video-tiles" className="flex">
      <Tile isHost={isHost} idAttr='user-video'/>
      <>{remoteFeed}</>
    </div>
  </div>
}

export default VideoTab;
