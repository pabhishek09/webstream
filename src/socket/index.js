import io from 'socket.io-client';

let socket;

function createSocket() {
  return new Promise((resolve, reject) => {
    socket = io(process.env.REACT_APP_API_BASE_URL, { path: '/signal' });
    socket.on('connect', () => {
      console.log(`:: Socket client connected :: ${socket.id}`);
      resolve(socket);
    })
  });
}

async function getSocket() {
  if (!socket) await createSocket();
  return socket;
}

async function disconnect() {
  socket.disconnect();
}

export {
  getSocket,
  disconnect
};
