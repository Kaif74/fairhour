import { io, Socket } from 'socket.io-client';
import { getToken } from '../api';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';
const SOCKET_PATH = import.meta.env.VITE_SOCKET_PATH || '/socket.io';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket'],
      path: SOCKET_PATH,
    });
  }
  return socket;
}

export function connectSocket(): Socket | null {
  const token = getToken();
  if (!token) {
    return null;
  }

  const activeSocket = getSocket();
  activeSocket.auth = { token };

  if (!activeSocket.connected) {
    activeSocket.connect();
  }

  return activeSocket;
}

export function disconnectSocket(): void {
  if (socket && socket.connected) {
    socket.disconnect();
  }
}
