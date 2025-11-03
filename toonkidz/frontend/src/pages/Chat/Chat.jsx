// src/pages/Chat/Chat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Input, Avatar, Spin, message } from 'antd';
import { Search, Paperclip, Smile, Send, Phone, MoreVertical } from 'lucide-react';
import { getProfile } from '../../service/userService';
import { getConversations, getMessages } from '../../service/messageService';
import io from 'socket.io-client';
import './Chat.scss';

const socket = io("http://localhost:3000", { autoConnect: false });

const Chat = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const socketRef = useRef(socket);
  const messageEndRef = useRef(null);
  const messageAreaRef = useRef(null);

  const selectedConvoRef = useRef(null);
  useEffect(() => {
    selectedConvoRef.current = selectedConvo;
  }, [selectedConvo]);

  useEffect(() => {
    const fetchProfileAndConnect = async () => {
      try {
        const user = await getProfile();
        setCurrentUser(user);

        socketRef.current.io.opts.query = { userId: user._id };
        socketRef.current.connect();

        socketRef.current.on('getOnlineUsers', (userIds) => {
          setOnlineUsers(new Set(userIds));
        });

        socketRef.current.on('receiveMessage', (newMessage) => {
          setMessages(prev => {
            if (selectedConvoRef.current?._id === newMessage.conversationId) {
              return [...prev, newMessage];
            }
            return prev;
          });

          setConversations(prevConvos => {
            const isViewing = selectedConvoRef.current?._id === newMessage.conversationId;
            const newConvos = prevConvos.map(convo => {
              if (convo._id === newMessage.conversationId) {
                const newUnread = isViewing ? 0 : (convo.unreadCount || 0) + 1;
                return { ...convo, lastMessage: newMessage, unreadCount: newUnread };
              }
              return convo;
            });
            return newConvos.sort((a, b) => new Date(b.lastMessage?.createdAt || 0) - new Date(a.lastMessage?.createdAt || 0));
          });
        });

        socketRef.current.on('unreadCountReset', ({ conversationId }) => {
          setConversations(prevConvos =>
            prevConvos.map(convo =>
              convo._id === conversationId ? { ...convo, unreadCount: 0 } : convo
            )
          );
        });

      } catch (err) {
        message.error("Lỗi kết nối, vui lòng tải lại trang.");
      }
    };

    fetchProfileAndConnect();

    return () => {
      socketRef.current?.disconnect();
      socketRef.current?.off('getOnlineUsers');
      socketRef.current?.off('receiveMessage');
      socketRef.current?.off('unreadCountReset');
    };
  }, []);
  useEffect(() => {
    if (!currentUser) return;

    const fetchConversations = async () => {
      setLoadingConvos(true);
      try {
        const res = await getConversations();
        if (res.success) {
          setConversations(res.conversations);
          if (res.conversations.length > 0) {
            setSelectedConvo(res.conversations[0]);
          }
        }
      } catch (err) {
        message.error("Không thể tải danh sách tin nhắn.");
      } finally {
        setLoadingConvos(false);
      }
    };
    fetchConversations();
  }, [currentUser]);
  useEffect(() => {
    if (!selectedConvo) return;

    socketRef.current.emit('markAsRead', {
      conversationId: selectedConvo._id
    });

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const res = await getMessages(selectedConvo._id);
        if (res.success) {
          setMessages(res.messages);
        }
      } catch (err) {
        message.error("Lỗi khi tải tin nhắn.");
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchMessages();
    setTimeout(() => {
      messageAreaRef.current?.scrollTo({ top: messageAreaRef.current.scrollHeight, behavior: 'auto' });
    }, 50);
  }, [selectedConvo]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !socketRef.current || !currentUser || !selectedConvo) return;

    const messageData = {
      content: newMessage.trim(),
      receiverId: selectedConvo.partner._id,
      senderId: currentUser._id,
      conversationId: selectedConvo._id,
    };

    socketRef.current.emit('sendMessage', messageData);

    const optimisticMessage = {
      ...messageData,
      _id: Date.now().toString(),
      senderId: {
        _id: currentUser._id,
        name: currentUser.name,
        pfp: currentUser.pfp
      },
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");

    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const isPartnerOnline = selectedConvo && onlineUsers.has(selectedConvo.partner._id);

  return (
    <div className="chat-layout">
      <aside className="conversation-list">
        <div className="cl-header">
          <h2>Tin nhắn</h2>
          <Input className="cl-search" placeholder="Tìm kiếm..." prefix={<Search size={16} color="#888" />} />
        </div>
        <div className="cl-items">
          {loadingConvos ? <Spin style={{ padding: "20px" }} /> : conversations.map(convo => {
            const isOnline = onlineUsers.has(convo.partner._id);
            return (
              <div
                key={convo._id}
                className={`convo-item ${selectedConvo?._id === convo._id ? 'active' : ''}`}
                onClick={() => setSelectedConvo(convo)}
              >
                <div className={`convo-avatar-wrapper ${isOnline ? 'online' : ''}`}>
                  <Avatar src={convo.partner.pfp || 'https://www.svgrepo.com/show/452030/avatar-default.svg'} size={48} className="convo-avatar" />
                </div>
                <div className="convo-details">
                  <div className="convo-top">
                    <span className="convo-name">{convo.partner.name}</span>
                    <span className="convo-timestamp">{convo.lastMessage ? new Date(convo.lastMessage.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </div>
                  <div className="convo-bottom">
                    <p className={`convo-last-message ${convo.unreadCount > 0 ? 'unread' : ''}`}>
                      {convo.lastMessage?.senderId._id === currentUser?._id ? "Bạn: " : ""}
                      {convo.lastMessage?.content || "..."}
                    </p>
                    {convo.unreadCount > 0 && <span className="unread-badge">{convo.unreadCount}</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </aside>

      <main className="chat-window">
        {selectedConvo ? (
          <>
            <header className="chat-header">
              <div className="ch-user">
                <Avatar src={selectedConvo.partner.pfp || 'https://www.svgrepo.com/show/452030/avatar-default.svg'} size={40} />
                <div className="ch-user-details">
                  <h4>{selectedConvo.partner.name}</h4>
                  <span className={isPartnerOnline ? 'online' : 'offline'}>
                    {isPartnerOnline ? 'Đang hoạt động' : 'Offline'}
                  </span>
                </div>
              </div>
              <div className="ch-actions">
                <button className="icon-btn"><Phone size={20} /></button>
                <button className="icon-btn"><MoreVertical size={20} /></button>
              </div>
            </header>

            <div className="message-area" ref={messageAreaRef}>
              {loadingMessages ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}><Spin /></div>
              ) : messages.map(msg => (
                <div key={msg._id} className={`message-bubble ${msg.senderId._id === currentUser._id ? 'sent' : 'received'}`}>
                  {msg.senderId._id !== currentUser._id && <Avatar src={msg.senderId.pfp || 'https://www.svgrepo.com/show/452030/avatar-default.svg'} size={32} className="message-avatar" />}
                  <div className="message-content">
                    <p>{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messageEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSendMessage}>
              <button type="button" className="icon-btn"><Paperclip size={20} /></button>
              <button type="button" className="icon-btn"><Smile size={20} /></button>
              <input
                type="text"
                placeholder="Nhập tin nhắn..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" className="send-btn">
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <h2>Chào mừng bạn đến với Chat</h2>
            <p>Chọn một cuộc trò chuyện để bắt đầu.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Chat;