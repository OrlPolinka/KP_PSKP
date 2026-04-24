import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../services/socketService';

const ChatContext = createContext();
export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [newMessageCallbacks, setNewMessageCallbacks] = useState([]);

  useEffect(() => {
    if (!user) {
      socketService.disconnect();
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = socketService.connect(token);

    socket.on('online_users', (users) => {
      setOnlineUsers(new Set(users));
    });

    socket.on('user_online', ({ userId, online }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        if (online) next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    socket.on('new_message', (message) => {
      // Если сообщение нам — увеличиваем счётчик непрочитанных
      if (message.receiverId === user.id) {
        setUnreadTotal(prev => prev + 1);
      }
    });

    socket.on('messages_read', () => {
      // Когда наши сообщения прочитали — можно обновить UI
    });

    // Загружаем начальный счётчик непрочитанных
    import('../services/api').then(({ default: api }) => {
      api.get('/chat/unread').then(res => {
        setUnreadTotal(res.data.count || 0);
      }).catch(() => {});
    });

    return () => {
      socket.off('online_users');
      socket.off('user_online');
      socket.off('new_message');
      socket.off('messages_read');
    };
  }, [user]);

  const isOnline = useCallback((userId) => onlineUsers.has(userId), [onlineUsers]);

  const resetUnread = useCallback((count = 0) => {
    setUnreadTotal(prev => Math.max(0, prev - count));
  }, []);

  return (
    <ChatContext.Provider value={{ isOnline, unreadTotal, resetUnread, onlineUsers }}>
      {children}
    </ChatContext.Provider>
  );
};
