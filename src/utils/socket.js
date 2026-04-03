import { io } from 'socket.io-client';

// Single shared socket instance for the whole app
const socket = io(process.env.REACT_APP_API_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: Infinity,
});

export default socket;