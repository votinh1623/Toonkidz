// src/pages/Chat/Chat.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Input, Avatar } from 'antd';
import { Search, Paperclip, Smile, Send, Phone, MoreVertical } from 'lucide-react';
import './Chat.scss';

const mockConversations = [
  {
    id: 1,
    name: "Lê Trung Nguyên",
    avatar: "https://www.svgrepo.com/show/452030/avatar-default.svg",
    lastMessage: "Tuyệt vời! Cảm ơn bạn nhiều nhé, hẹn gặp lại sau.",
    timestamp: "10:30 AM",
    unread: 2,
  },
  {
    id: 2,
    name: "Cô Ngọc",
    avatar: "https://cdn-icons-png.flaticon.com/512/147/147144.png",
    lastMessage: "Bạn: Vâng, em đã nhận được file rồi ạ.",
    timestamp: "Hôm qua",
  },
  {
    id: 3,
    name: "Bo Hoa",
    avatar: "https://www.svgrepo.com/show/452030/avatar-default.svg",
    lastMessage: "Bạn nhớ xem truyện mới của mình nhé!",
    timestamp: "Thứ Hai",
  }
];

const mockMessages = {
  1: [
    { id: 'a', sender: 'other', text: "Chào bạn, mình có vài góp ý cho truyện 'Công chúa và ngọn đèn thần'..." },
    { id: 'b', sender: 'me', text: "Ồ, tuyệt quá! Bạn cứ nói đi, mình đang nghe." },
    { id: 'c', sender: 'other', text: "Mình thấy phần hình ảnh rất đẹp, nhưng có lẽ nội dung trang 2 hơi ngắn?" },
    { id: 'd', sender: 'me', text: "Tuyệt vời! Cảm ơn bạn nhiều nhé, hẹn gặp lại sau." },
  ],
  2: [
    { id: 'e', sender: 'other', text: "Chào em, cô đã xem qua bài tập của em rồi nhé." },
    { id: 'f', sender: 'me', text: "Vâng, em đã nhận được file rồi ạ." },
  ],
  3: [
    { id: 'g', sender: 'other', text: "Bạn nhớ xem truyện mới của mình nhé!" },
  ]
};


const Chat = () => {
  const [conversations, setConversations] = useState(mockConversations);
  const [selectedConvo, setSelectedConvo] = useState(mockConversations[0]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const messageEndRef = useRef(null);
  const messageAreaRef = useRef(null);
  useEffect(() => {
    setMessages(mockMessages[selectedConvo.id] || []);
    setTimeout(() => {
      if (messageAreaRef.current) {
        messageAreaRef.current.scrollTo({
          top: messageAreaRef.current.scrollHeight,
          behavior: 'auto'
        });
      }
    }, 0);
  }, [selectedConvo]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;

    const newMsg = {
      id: Date.now().toString(),
      sender: 'me',
      text: newMessage.trim(),
    };

    setMessages([...messages, newMsg]);
    setNewMessage("");

    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  return (
    <div className="chat-layout">

      <aside className="conversation-list">
        <div className="cl-header">
          <h2>Tin nhắn</h2>
          <Input
            className="cl-search"
            placeholder="Tìm kiếm..."
            prefix={<Search size={16} color="#888" />}
          />
        </div>

        <div className="cl-items">
          {conversations.map(convo => (
            <div
              key={convo.id}
              className={`convo-item ${selectedConvo.id === convo.id ? 'active' : ''}`}
              onClick={() => setSelectedConvo(convo)}
            >
              <Avatar src={convo.avatar} size={48} className="convo-avatar" />
              <div className="convo-details">
                <div className="convo-top">
                  <span className="convo-name">{convo.name}</span>
                  <span className="convo-timestamp">{convo.timestamp}</span>
                </div>
                <div className="convo-bottom">
                  <p className="convo-last-message">{convo.lastMessage}</p>
                  {convo.unread > 0 && <span className="unread-badge">{convo.unread}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className="chat-window">
        {selectedConvo ? (
          <>
            {/* Header của cửa sổ chat */}
            <header className="chat-header">
              <div className="ch-user">
                <Avatar src={selectedConvo.avatar} size={40} />
                <div className="ch-user-details">
                  <h4>{selectedConvo.name}</h4>
                  <span>Đang hoạt động</span>
                </div>
              </div>
              <div className="ch-actions">
                <button className="icon-btn"><Phone size={20} /></button>
                <button className="icon-btn"><MoreVertical size={20} /></button>
              </div>
            </header>

            <div className="message-area" ref={messageAreaRef}>
              {messages.map(msg => (
                <div key={msg.id} className={`message-bubble ${msg.sender === 'me' ? 'sent' : 'received'}`}>
                  {msg.sender === 'other' && <Avatar src={selectedConvo.avatar} size={32} className="message-avatar" />}
                  <div className="message-content">
                    <p>{msg.text}</p>
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