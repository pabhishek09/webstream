const iceServers = [
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
];

export default iceServers;
