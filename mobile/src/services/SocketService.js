import io from 'socket.io-client';
import { SOCKET_URL } from '../config/constants';

/**
 * SocketService — Global singleton for Socket.io connection
 * 
 * Connects when user logs in, emits 'join' with userId,
 * disconnects on logout. One connection for the whole app.
 */

let socket = null;

/**
 * Initialize and connect socket with the authenticated user's ID
 * @param {string} userId - The authenticated user's MongoDB _id
 */
export const connectSocket = (userId) => {
  if (socket && socket.connected) {
    console.log('[SocketService] Already connected, skipping');
    return socket;
  }

  console.log('[SocketService] Connecting to:', SOCKET_URL);

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  socket.on('connect', () => {
    console.log('[SocketService] Connected, socketId:', socket.id);

    // Emit 'join' to register this user on the server
    if (userId) {
      socket.emit('join', userId);
      console.log('[SocketService] Emitted join for userId:', userId);
    }
  });

  socket.on('disconnect', () => {
    console.log('[SocketService] Disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('[SocketService] Connection error:', error.message);
  });

  return socket;
};

/**
 * Get the current socket instance
 * @returns {Socket | null}
 */
export const getSocket = () => socket;

/**
 * Disconnect and destroy the socket
 */
export const disconnectSocket = () => {
  if (socket) {
    console.log('[SocketService] Disconnecting');
    socket.disconnect();
    socket = null;
  }
};

/**
 * Listen to a socket event
 * @param {string} event - Event name
 * @param {Function} callback - Handler
 */
export const onSocketEvent = (event, callback) => {
  if (socket) {
    socket.on(event, callback);
  }
};

/**
 * Remove a socket event listener
 * @param {string} event - Event name
 * @param {Function} callback - Handler
 */
export const offSocketEvent = (event, callback) => {
  if (socket) {
    socket.off(event, callback);
  }
};

/**
 * Emit a custom event
 * @param {string} event - Event name
 * @param {*} data - Payload
 */
export const emitSocketEvent = (event, data) => {
  if (socket && socket.connected) {
    socket.emit(event, data);
  }
};
