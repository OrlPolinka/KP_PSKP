import { io } from 'socket.io-client';

// В Docker REACT_APP_API_URL=/api (относительный), поэтому берём window.location.origin
// В локальной разработке используем localhost:5000
const SOCKET_URL = process.env.REACT_APP_API_URL
  ? (process.env.REACT_APP_API_URL.startsWith('http')
      ? process.env.REACT_APP_API_URL.replace('/api', '')
      : window.location.origin)
  : 'http://localhost:5000';

let socket = null;

export const socketService = {
  connect(token) {
    if (socket?.connected) return socket;

    socket = io(SOCKET_URL, {
      auth: { token },
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => console.log('[Socket] Connected:', socket.id));
    socket.on('disconnect', (reason) => console.log('[Socket] Disconnected:', reason));
    socket.on('connect_error', (err) => console.error('[Socket] Error:', err.message));

    return socket;
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  getSocket() {
    return socket;
  },

  isConnected() {
    return socket?.connected || false;
  },

  sendMessage(receiverId, content) {
    socket?.emit('send_message', { receiverId, content });
  },

  markRead(senderId) {
    socket?.emit('mark_read', { senderId });
  },

  sendTyping(receiverId, isTyping) {
    socket?.emit('typing', { receiverId, isTyping });
  },

  editMessage(messageId, content) {
    socket?.emit('edit_message', { messageId, content });
  },

  deleteMessage(messageId) {
    socket?.emit('delete_message', { messageId });
  },

  on(event, callback) {
    socket?.on(event, callback);
  },

  off(event, callback) {
    socket?.off(event, callback);
  },
};

export default socketService;
