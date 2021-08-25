import React, { useEffect, useState, useRef } from 'react';
import { useSelector,  useDispatch } from 'react-redux';
import { getSocket } from '../../socket';
import Tile from '../../components/Tile';
import VideOptions from '../../components/VideoOptions';
import iceServers from './iceServers';
import { addParticipant } from '../../store/participants';
import { useHistory } from 'react-router-dom';

function Meeting() {

  const history = useHistory();

  const dispatch = useDispatch();
  const isHost =  useSelector((state) => state.connection.participant.isHost);
  const participantName = useSelector((state) => state.connection.participant.name);
  const meetId = useSelector((state) => state.connection.meetingId);
  const hostName = useSelector((state) => state.connection.host.name);
  const hostId = useSelector((state) => state.connection.host.id);
  const allParticipants = useSelector((state) => state.participants);

  const [ remoteFeed, setRemoteFeed ] = useState([]);
  const [ peerConnections, setPeerConnections ] = useState([]);
  const [ audio, setAudio ] = useState(true);
  const [ video, setVideo ] = useState(true);
  const [ showMsgTab, setShowMsgTab ] = useState(false);

  const isAudioEffectFirstRun = useRef(true);
  const isVideoEffectFirstRun = useRef(true);

  useEffect(() => {
    getSocket().then((socketCn) => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      socket = socketCn;
      initiateMeetSignalling();
    });
  }, []);

  useEffect(() => {
    if (allParticipants.length > 0 ) {
      const pcIndex = allParticipants.length - 1;
      const participant = allParticipants[pcIndex];
      const { id, name } = participant;
      const newFeed = <Tile 
      isHost={id === hostId}
      name={name} 
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
        // socketCn.removeAllListeners('close-connection');
        socketCn.removeAllListeners('end-meeting');
        socketCn.on('new_ice_candidate', (event) => onNewIceCanditate(event, peerConnections, allParticipants));
        socketCn.on('sdp_response', (event) => onSdpResponse(event, peerConnections, allParticipants));
        // socketCn.on('close-connection', (event) => onCloseConnection(event, peerConnections, allParticipants));
        socketCn.on('end-meeting', () => onEndMeeting(peerConnections));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerConnections]);

  useEffect(() => {
    if (isVideoEffectFirstRun.current) {
      isVideoEffectFirstRun.current = false;
    } else {
      setVideoStream(video);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video]);

  useEffect(() => {
    if (isAudioEffectFirstRun.current) {
      isAudioEffectFirstRun.current = false;
    } else {
      setAudioStream(audio);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio]);

  let localMediaStream;

  let socket;
  const pcConfig = {
    iceServers,
  };
  const constraints = {
    audio: true,
    video: { 
      facingMode: 'user',
      width: 340,
      height: 200,  
    },
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
      peerConnection.oniceconnectionstatechange = (event) => handleICEConnectionStateChange(peerConnection, pcIndex);
      // peerConnection.onicegatheringstatechange = (event) => handleICEGatheringStateChange(pcIndex, event);
      // peerConnection.onsignalingstatechange = (event) => handleSignalingStateChange(pcIndex, event);
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

  function handleICEConnectionStateChange(peerConnection, pcIndex) {
    console.log(`:: handleICEConnectionStateChangeEvent for index::`, pcIndex);
    console.log(peerConnection);
    const { iceConnectionState } = peerConnection;
    console.log('connnection state', iceConnectionState);
    if (iceConnectionState === 'disconnected' 
      || iceConnectionState === 'failed' 
      || iceConnectionState === 'closed') {
        closeVideoCall(peerConnection, pcIndex);
      }
  }

  function closeVideoCall(peerConnection, pcIndex) {
    console.log(':: closeVideoCall ::');
    const videoEl = document.getElementById(`remote-video-${pcIndex}`);
    if (videoEl) {
      videoEl.srcObject.getTracks().forEach(track => track.stop());
      videoEl.removeAttribute('src');
      videoEl.removeAttribute('srcObject');
    }
    closePeerConnection(peerConnection);
    const tileEl = document.getElementById(`tile-remote-video-${pcIndex}`);
    if (tileEl) tileEl.remove();
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

  async function setVideoStream(value) {
    await setUpUserMedia();
    const videoTracks = localMediaStream.getVideoTracks();
    if (videoTracks.length) {
      videoTracks[0].enabled = value;
    }
  }

  async function setAudioStream(value) {
    await setUpUserMedia();
    const audioTracks = localMediaStream.getAudioTracks();
    if (audioTracks.length) {
      audioTracks[0].enabled = value;
    }
  }

  function endCall(peerConnections) {
    if (isHost) {
      endMeeting();
      peerConnections.forEach((peerConnection) => closePeerConnection(peerConnection));
    } else {
      peerConnections.forEach((peerConnection) => closePeerConnection(peerConnection));
      history.push('/home');
    }
  }

  function endMeeting() {
    getSocket().then((socketCn) => {
      console.log(':: firing end-meeting event ::');
      socketCn.emit('end-meeting', {
       to: meetId,
      });
    });
    history.push('/home');
  }

  function onEndMeeting(peerConnections) {
    alert('Meeting has been ended by the host');
    peerConnections.forEach((peerConnection) => closePeerConnection(peerConnection));
    history.push('/home');
  }

  // eslint-disable-next-line no-unused-vars
  function onCloseConnection(event, peerConnections, participants) {
    console.log(':: onCloseConnection ::');
    const pcIndex = indexOfConnection(participants, event.id);
    const videoEl = document.getElementById(`remote-video-${pcIndex}`);
    if (videoEl) {
      videoEl.srcObject.getTracks().forEach(track => track.stop());
      videoEl.removeAttribute('src');
      videoEl.removeAttribute('srcObject');
    }
    closePeerConnection(peerConnections[pcIndex]);
    const tileEl = document.getElementById(`tile-remote-video-${pcIndex}`);
    if (tileEl) tileEl.remove();
  }

  function indexOfConnection(participants, id) {
    console.log('::indexOfConnections::', participants);
    for (let index = 0; index < participants.length; index++) {
      if (participants[index].id === id) return index;
    }
    return -1;
  }

  function closePeerConnection(peerConnection) {
    peerConnection.ontrack = null;
    peerConnection.onremovetrack = null;
    peerConnection.onremovestream = null;
    peerConnection.onicecandidate = null;
    peerConnection.oniceconnectionstatechange = null;
    peerConnection.onsignalingstatechange = null;
    peerConnection.onicegatheringstatechange = null;
    peerConnection.onnegotiationneeded = null;
    peerConnection.close();
    peerConnection = null;
  }

  return (
    <div className="video-tab min-h-screen flex flex-col justify-between items-center" >
      <div className="pt-8">
      {hostName && <h3 className="text-white">{ hostName}'s meeting</h3>}
      </div>
      <div id="video-tiles" className="flex flex-col lg:flex-row">
        <Tile isHost={isHost} idAttr='user-video' name={participantName}/>
        <>{remoteFeed}</>
      </div>
      <VideOptions
        audio={audio}
        video={video}
        showMsgTab={showMsgTab}
        onToggleAudio={() => setAudio(!audio)}
        onToggleVideo={() => setVideo(!video)}
        onToggleMsgTab={() => setShowMsgTab(!showMsgTab)}
        onEndCall={() => endCall(peerConnections)}
      />
    </div>
  )
}

export default Meeting;
