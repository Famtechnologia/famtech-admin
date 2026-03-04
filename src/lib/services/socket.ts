import { io, Socket } from 'socket.io-client';
import { API_URL } from '../api/apiClient';

const SOCKET_OPTIONS = {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  autoConnect: false,
};

// Get the socket server URL from environment or default
export const socket = io(API_URL + "/admin", SOCKET_OPTIONS) as Socket;
