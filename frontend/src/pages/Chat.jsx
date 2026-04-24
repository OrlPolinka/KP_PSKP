
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useParams, useNavigate } from 'react-router-dom';
import socketService from '../services/socketService';
import api from '../services/api';

// ─── Вспомогательные компоненты ──────────────────────────────────────────────

const Avatar = ({ user, size = 40, showOnline = false, isOnline = false }) => {
  const initials = user?.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';
  const localAvatar = user?.id ? localStorage.getItem(`avatar_${user.id}`) : null;
  const avatarSrc = user?.photoUrl || localAvatar;
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: avatarSrc ? 'transparent' : 'linear-gradient(135deg, #8B5CF6, #EC4899)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.35, fontWeight: '700', color: 'white',
        overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(255,255,255,0.1)',
      }}>
        {avatarSrc ? <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
      </div>
      {showOnline && (
        <div style={{
          position: 'absolute', bottom: 1, right: 1,
          width: size * 0.28, height: size * 0.28, borderRadius: '50%',
          background: isOnline ? '#10B981' : '#6B7280',
          border: '2px solid var(--dark, #0F0F1A)',
        }} />
      )}
    </div>
  );
};

const formatMsgTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) + ' ' +
    d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

const getRoleBadge = (role) => {
  if (role === 'trainer') return { label: 'Тренер', color: '#A78BFA' };
  if (role === 'admin') return { label: 'Администратор', color: '#F59E0B' };
  return { label: 'Клиент', color: '#60A5FA' };
};

// ─── Модал нового чата ────────────────────────────────────────────────────────
const NewChatModal = ({ onClose, onSelect, currentUserId, userRole }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  const search = (q) => {
    setQuery(q);
    clearTimeout(timerRef.current);
    if (q.trim().length < 2) { setResults([]); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/chat/search?q=${encodeURIComponent(q.trim())}`);
        setResults(res.data.users || []);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Новый чат</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div style={{ padding: '0 0 16px' }}>
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }}>🔍</span>
            <input
              autoFocus
              type="text"
              placeholder="Введите имя..."
              value={query}
              onChange={e => search(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px 10px 36px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', color: 'white', fontSize: '14px', outline: 'none',
                fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {loading && <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.3)' }}>Поиск...</div>}
            {!loading && query.length >= 2 && results.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.3)' }}>Никого не найдено</div>
            )}
            {!loading && query.length < 2 && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
                {userRole === 'client' ? 'Введите имя тренера' : 'Введите имя пользователя'}
              </div>
            )}
            {results.map(u => {
              const badge = getRoleBadge(u.role);
              return (
                <div key={u.id} onClick={() => onSelect(u)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 4px', cursor: 'pointer', borderRadius: '8px',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Avatar user={u} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>{u.fullName}</div>
                    <div style={{ fontSize: '12px', color: badge.color }}>{badge.label}</div>
                  </div>
                  <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.2)' }}>›</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Основной компонент ───────────────────────────────────────────────────────
const Chat = () => {
  const { user } = useAuth();
  const { isOnline, resetUnread } = useChat();
  const { userId: urlUserId } = useParams();
  const navigate = useNavigate();

  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [searchContacts, setSearchContacts] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  // Редактирование сообщения
  const [editingMsg, setEditingMsg] = useState(null); // { id, content }
  const [editInput, setEditInput] = useState('');
  // Контекстное меню сообщения
  const [msgMenu, setMsgMenu] = useState(null); // { msgId, x, y }

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const editInputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isMobile = window.innerWidth < 768;
  const [showContacts, setShowContacts] = useState(true);

  // Загрузка контактов
  const fetchContacts = useCallback(async () => {
    try {
      const res = await api.get('/chat/contacts');
      setContacts(res.data.contacts || []);
    } catch (err) {
      console.error('fetchContacts error:', err);
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  // Открыть чат по URL
  useEffect(() => {
    if (!urlUserId || loadingContacts) return;
    const existing = contacts.find(c => c.id === urlUserId);
    if (existing) { selectContact(existing); return; }
    api.get(`/users/${urlUserId}`).then(res => {
      const u = res.data?.user;
      if (u) {
        const nc = { id: u.id, fullName: u.fullName, photoUrl: u.photoUrl, role: u.role, isActive: u.isActive, unreadCount: 0, lastMessage: null };
        setContacts(prev => prev.some(c => c.id === u.id) ? prev : [nc, ...prev]);
        selectContact(nc);
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlUserId, loadingContacts]);

  // Socket события
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleNewMessage = (message) => {
      const otherId = message.senderId === user.id ? message.receiverId : message.senderId;
      setMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev;
        // Добавляем только если открыт нужный чат
        const contactId = selectedContact?.id;
        if (contactId === otherId || message.senderId === user.id) return [...prev, message];
        return prev;
      });
      if (message.senderId !== user.id && selectedContact?.id === message.senderId) {
        socketService.markRead(message.senderId);
        resetUnread(1);
      }
      setContacts(prev => prev.map(c => {
        if (c.id === otherId) {
          const unreadDelta = (message.senderId !== user.id && selectedContact?.id !== message.senderId) ? 1 : 0;
          return { ...c, lastMessage: message, unreadCount: (c.unreadCount || 0) + unreadDelta };
        }
        return c;
      }));
    };

    const handleTyping = ({ userId: uid, isTyping }) => {
      setTypingUsers(prev => { const n = new Set(prev); isTyping ? n.add(uid) : n.delete(uid); return n; });
    };

    const handleMessagesRead = ({ by }) => {
      setMessages(prev => prev.map(m => m.senderId === user.id && m.receiverId === by ? { ...m, isRead: true } : m));
    };

    const handleMessageEdited = ({ messageId, content }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content, edited: true } : m));
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    };

    socketService.on('new_message', handleNewMessage);
    socketService.on('user_typing', handleTyping);
    socketService.on('messages_read', handleMessagesRead);
    socketService.on('message_edited', handleMessageEdited);
    socketService.on('message_deleted', handleMessageDeleted);

    return () => {
      socketService.off('new_message', handleNewMessage);
      socketService.off('user_typing', handleTyping);
      socketService.off('messages_read', handleMessagesRead);
      socketService.off('message_edited', handleMessageEdited);
      socketService.off('message_deleted', handleMessageDeleted);
    };
  }, [user.id, selectedContact, resetUnread]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Закрыть меню при клике вне
  useEffect(() => {
    const close = () => setMsgMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const selectContact = async (contact) => {
    setSelectedContact(contact);
    setLoadingMessages(true);
    setMessages([]);
    setEditingMsg(null);
    if (isMobile) setShowContacts(false);
    navigate(`/chat/${contact.id}`, { replace: true });
    try {
      const res = await api.get(`/chat/history/${contact.id}`);
      setMessages(res.data.messages || []);
      socketService.markRead(contact.id);
      resetUnread(contact.unreadCount || 0);
      setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, unreadCount: 0 } : c));
    } catch (err) {
      console.error('getChatHistory error:', err);
    } finally {
      setLoadingMessages(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const sendMessage = () => {
    if (!input.trim() || !selectedContact) return;
    socketService.sendMessage(selectedContact.id, input.trim());
    setInput('');
    socketService.sendTyping(selectedContact.id, false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    if (e.key === 'Escape') { setEditingMsg(null); inputRef.current?.focus(); }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!selectedContact) return;
    socketService.sendTyping(selectedContact.id, true);
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => socketService.sendTyping(selectedContact.id, false), 1500);
  };

  // Начать редактирование
  const startEdit = (msg) => {
    setEditingMsg(msg);
    setEditInput(msg.content);
    setMsgMenu(null);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  // Сохранить редактирование
  const saveEdit = () => {
    if (!editInput.trim() || !editingMsg) return;
    socketService.editMessage(editingMsg.id, editInput.trim());
    setEditingMsg(null);
    setEditInput('');
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(); }
    if (e.key === 'Escape') { setEditingMsg(null); inputRef.current?.focus(); }
  };

  // Удалить сообщение
  const deleteMsg = (msgId) => {
    if (!window.confirm('Удалить сообщение?')) return;
    socketService.deleteMessage(msgId);
    setMsgMenu(null);
  };

  // Удалить диалог
  const deleteDialog = async () => {
    if (!selectedContact) return;
    if (!window.confirm(`Удалить всю переписку с ${selectedContact.fullName}? Это действие необратимо.`)) return;
    try {
      await api.delete(`/chat/dialog/${selectedContact.id}`);
      // Убираем контакт из списка и сбрасываем выбранный чат
      setContacts(prev => prev.filter(c => c.id !== selectedContact.id));
      setSelectedContact(null);
      setMessages([]);
      navigate('/chat', { replace: true });
    } catch (err) {
      console.error('deleteDialog error:', err);
    }
  };

  // Начать новый чат
  const startNewChat = (u) => {
    setShowNewChat(false);
    const nc = { id: u.id, fullName: u.fullName, photoUrl: u.photoUrl, role: u.role, isActive: true, unreadCount: 0, lastMessage: null };
    setContacts(prev => prev.some(c => c.id === u.id) ? prev : [nc, ...prev]);
    selectContact(nc);
  };

  const filteredContacts = contacts.filter(c => !searchContacts || c.fullName?.toLowerCase().includes(searchContacts.toLowerCase()));
  const isContactTyping = selectedContact && typingUsers.has(selectedContact.id);

  const groupedMessages = messages.reduce((groups, msg) => {
    const date = new Date(msg.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', background: 'var(--dark, #0F0F1A)', overflow: 'hidden' }}>

      {/* ─── Список контактов ─────────────────────────────────────────── */}
      <div style={{
        width: isMobile ? '100%' : '320px', flexShrink: 0,
        borderRight: '1px solid rgba(255,255,255,0.08)',
        display: isMobile && !showContacts ? 'none' : 'flex',
        flexDirection: 'column', background: 'rgba(255,255,255,0.02)',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{
              fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: '700',
              background: 'linear-gradient(135deg, #A78BFA, #EC4899)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>💬 Сообщения</h2>
            <button
              onClick={() => setShowNewChat(true)}
              title="Новый чат"
              style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                border: 'none', cursor: 'pointer', fontSize: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', flexShrink: 0,
              }}
            >✏️</button>
          </div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>🔍</span>
            <input type="text" placeholder="Поиск..." value={searchContacts}
              onChange={e => setSearchContacts(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px 8px 36px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '20px', color: 'white', fontSize: '13px', outline: 'none',
                fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Contacts list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingContacts ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />Загрузка...
            </div>
          ) : filteredContacts.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>💬</div>
              <div style={{ fontSize: '13px', marginBottom: '12px' }}>
                {searchContacts ? 'Ничего не найдено' : 'Нет диалогов'}
              </div>
              <button onClick={() => setShowNewChat(true)} style={{
                padding: '8px 16px', borderRadius: '20px', fontSize: '13px',
                background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                border: 'none', color: 'white', cursor: 'pointer',
              }}>+ Начать чат</button>
            </div>
          ) : filteredContacts.map(contact => {
            const online = isOnline(contact.id);
            const isSelected = selectedContact?.id === contact.id;
            const badge = getRoleBadge(contact.role);
            return (
              <div key={contact.id} onClick={() => selectContact(contact)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 16px', cursor: 'pointer',
                  background: isSelected ? 'rgba(139,92,246,0.12)' : 'transparent',
                  borderLeft: isSelected ? '3px solid #8B5CF6' : '3px solid transparent',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
              >
                <Avatar user={contact} size={44} showOnline isOnline={online} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {contact.fullName}
                    </span>
                    {contact.lastMessage && (
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', flexShrink: 0, marginLeft: '4px' }}>
                        {formatMsgTime(contact.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {contact.lastMessage
                        ? (contact.lastMessage.senderId === user.id ? '✓ ' : '') + contact.lastMessage.content
                        : <span style={{ color: badge.color, fontSize: '11px' }}>{badge.label}</span>
                      }
                    </span>
                    {contact.unreadCount > 0 && (
                      <div style={{
                        background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                        color: 'white', fontSize: '11px', fontWeight: '700',
                        borderRadius: '10px', padding: '2px 7px', flexShrink: 0, marginLeft: '6px',
                      }}>
                        {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Область чата ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: isMobile && showContacts ? 'none' : 'flex', flexDirection: 'column', minWidth: 0 }}>
        {!selectedContact ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.5 }}>💬</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>Выберите диалог</div>
            <div style={{ fontSize: '14px', marginBottom: '20px' }}>Выберите контакт слева или начните новый чат</div>
            <button onClick={() => setShowNewChat(true)} style={{
              padding: '10px 24px', borderRadius: '20px', fontSize: '14px',
              background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
              border: 'none', color: 'white', cursor: 'pointer',
            }}>✏️ Новый чат</button>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={{
              padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)',
            }}>
              {isMobile && (
                <button onClick={() => setShowContacts(true)} style={{ background: 'none', border: 'none', color: '#A78BFA', fontSize: '20px', cursor: 'pointer', padding: '4px' }}>←</button>
              )}
              <Avatar user={selectedContact} size={40} showOnline isOnline={isOnline(selectedContact.id)} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: '600', color: 'white' }}>{selectedContact.fullName}</div>
                <div style={{ fontSize: '12px', color: isOnline(selectedContact.id) ? '#10B981' : 'rgba(255,255,255,0.3)' }}>
                  {isContactTyping ? <span style={{ color: '#A78BFA' }}>печатает...</span> : isOnline(selectedContact.id) ? 'онлайн' : 'не в сети'}
                </div>
              </div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: getRoleBadge(selectedContact.role).color, background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '12px' }}>
                {getRoleBadge(selectedContact.role).label}
              </div>
              {/* Удалить диалог */}
              <button
                onClick={deleteDialog}
                title="Удалить переписку"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: '18px', padding: '4px', borderRadius: '6px', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
              >🗑️</button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {loadingMessages ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>👋</div>
                  <div>Начните переписку!</div>
                </div>
              ) : (
                Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0 12px' }}>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '3px 10px', borderRadius: '10px' }}>{date}</span>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                    </div>
                    {msgs.map((msg, idx) => {
                      const isMine = msg.senderId === user.id;
                      const prevMsg = idx > 0 ? msgs[idx - 1] : null;
                      const showAvatar = !isMine && (!prevMsg || prevMsg.senderId !== msg.senderId);
                      const isGrouped = prevMsg && prevMsg.senderId === msg.senderId && (new Date(msg.createdAt) - new Date(prevMsg.createdAt)) < 60000;
                      const isEditing = editingMsg?.id === msg.id;

                      return (
                        <div key={msg.id}
                          style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '8px', marginTop: isGrouped ? '2px' : '8px' }}
                        >
                          {!isMine && <div style={{ width: 28, flexShrink: 0 }}>{showAvatar && <Avatar user={selectedContact} size={28} />}</div>}

                          <div style={{ maxWidth: '65%', display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', width: '100%' }}>
                                <textarea
                                  ref={editInputRef}
                                  value={editInput}
                                  onChange={e => setEditInput(e.target.value)}
                                  onKeyDown={handleEditKeyDown}
                                  rows={1}
                                  style={{
                                    flex: 1, padding: '10px 14px',
                                    background: 'rgba(139,92,246,0.15)', border: '2px solid #8B5CF6',
                                    borderRadius: '18px', color: 'white', fontSize: '14px',
                                    outline: 'none', resize: 'none', fontFamily: 'Inter, sans-serif',
                                    lineHeight: '1.5', maxHeight: '120px',
                                  }}
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <button onClick={saveEdit} style={{ padding: '6px 10px', borderRadius: '8px', background: '#8B5CF6', border: 'none', color: 'white', cursor: 'pointer', fontSize: '12px' }}>✓</button>
                                  <button onClick={() => setEditingMsg(null)} style={{ padding: '6px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                                </div>
                              </div>
                            ) : (
                              <div
                                style={{
                                  padding: '10px 14px',
                                  borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                  background: isMine ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)' : 'rgba(255,255,255,0.07)',
                                  color: 'white', fontSize: '14px', lineHeight: '1.5', wordBreak: 'break-word',
                                  boxShadow: isMine ? '0 2px 12px rgba(139,92,246,0.3)' : 'none',
                                  cursor: isMine ? 'context-menu' : 'default',
                                  position: 'relative',
                                }}
                                onContextMenu={isMine ? (e) => { e.preventDefault(); setMsgMenu({ msgId: msg.id, msgContent: msg.content, x: e.clientX, y: e.clientY }); } : undefined}
                              >
                                {msg.content}
                                {msg.edited && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginLeft: '6px' }}>изм.</span>}
                              </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                              <span>{formatMsgTime(msg.createdAt)}</span>
                              {isMine && <span style={{ color: msg.isRead ? '#10B981' : 'rgba(255,255,255,0.3)' }}>{msg.isRead ? '✓✓' : '✓'}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              {isContactTyping && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <Avatar user={selectedContact} size={28} />
                  <div style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.07)', borderRadius: '18px 18px 18px 4px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {[0, 1, 2].map(i => <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#A78BFA', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Написать сообщение... (Enter — отправить)"
                rows={1}
                style={{
                  flex: 1, padding: '12px 16px',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '20px', color: 'white', fontSize: '14px',
                  outline: 'none', resize: 'none', fontFamily: 'Inter, sans-serif',
                  lineHeight: '1.5', maxHeight: '120px', overflowY: 'auto', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              <button onClick={sendMessage} disabled={!input.trim()} style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: input.trim() ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)' : 'rgba(255,255,255,0.08)',
                border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', transition: 'all 0.2s ease', flexShrink: 0,
                boxShadow: input.trim() ? '0 4px 12px rgba(139,92,246,0.4)' : 'none',
              }}>➤</button>
            </div>
          </>
        )}
      </div>

      {/* ─── Контекстное меню сообщения ───────────────────────────────── */}
      {msgMenu && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed', left: msgMenu.x, top: msgMenu.y, zIndex: 9999,
            background: '#1E1E30', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '10px', padding: '6px', minWidth: '160px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <button
            onClick={() => { const m = messages.find(m => m.id === msgMenu.msgId); if (m) startEdit(m); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', textAlign: 'left' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >✏️ Редактировать</button>
          <button
            onClick={() => deleteMsg(msgMenu.msgId)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', textAlign: 'left' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >🗑️ Удалить</button>
        </div>
      )}

      {/* ─── Модал нового чата ────────────────────────────────────────── */}
      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onSelect={startNewChat}
          currentUserId={user.id}
          userRole={user.role}
        />
      )}

      <style>{`
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 2px; }
      `}</style>
    </div>
  );
};

export default Chat;
