// src/pages/Chat/Chat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Input, Avatar, Spin, message, Typography, Space, Menu, Dropdown, Button } from 'antd';
import { Search, Paperclip, Smile, Send, Phone, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { getMessages } from '../../service/messageService';
import { useOutletContext } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import './Chat.scss';
import { BsThreeDotsVertical } from 'react-icons/bs';
import Swal from 'sweetalert2';

const { Title, Text } = Typography;

const formatTimestamp = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const getInitials = (name) => {
  if (!name) return "?";
  const words = name.split(' ');
  if (words.length > 1) {
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const SharedPostSnippet = ({ postData, navigate, currentUserId }) => {
  if (!postData || !postData.userId) {
    return <div style={{ color: 'red' }}>Bài viết không tồn tại.</div>;
  }

  const isShared = postData.originalPostId;
  const originalPost = isShared ? postData.originalPostId : postData;

  const author = originalPost.userId;
  const story = originalPost.storyId;
  const postId = originalPost._id;


  const handleNavigation = () => {
    const url = `/home/profile/${author._id}#${postId}`;
    navigate(url);
  };

  return (
    <div
      className="shared-post-snippet"
      onClick={handleNavigation}
      style={{
        cursor: 'pointer',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '10px',
        maxWidth: '300px',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}
    >
      <Text strong style={{ color: '#6c63ff', fontSize: '0.9rem' }}>
        Bài viết được chia sẻ
      </Text>

      <Space size={10} align="start" style={{ width: '100%' }}>
        <Avatar
          size={40}
          src={story?.coverImage || 'https://www.svgrepo.com/show/452030/avatar-default.svg'}
          style={{ flexShrink: 0 }}
        />
        <div style={{ minWidth: 0 }}>
          <Text ellipsis strong>{story?.title || 'Truyện đã xóa'}</Text><br />
          <Text type="secondary" style={{ fontSize: '0.8rem' }}>
            {originalPost.caption || postData.sharedCaption || '—'}
          </Text>
        </div>
      </Space>
    </div>
  );
}

const Chat = () => {
  const {
    currentUser,
    conversations,
    setConversations,
    onlineUsers,
    socket,
    loadingConvos,
    setMessagesExternally
  } = useOutletContext();

  const [selectedConvo, setSelectedConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const socketRef = useRef(socket);
  const messageEndRef = useRef(null);
  const messageAreaRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    setMessagesExternally({
      setter: setMessages,
      convoId: selectedConvo?._id
    });
  }, [selectedConvo, setMessagesExternally]);

  useEffect(() => {
    if (socket) {
      socket.on('messageEdited', (updatedMsg) => {
        setMessages(prev => prev.map(msg =>
          msg._id === updatedMsg._id ? updatedMsg : msg
        ));
      });

      socket.on('messageDeleted', ({ messageId }) => {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
      });
    }

    return () => {
      if (socket) {
        socket.off('messageEdited');
        socket.off('messageDeleted');
      }
    }
  }, [socket]);

  useEffect(() => {
    if (conversations.length > 0 && (!selectedConvo || !conversations.find(c => c._id === selectedConvo._id))) {
      setSelectedConvo(conversations[0]);
    }
  }, [conversations, selectedConvo]);

  useEffect(() => {
    if (!selectedConvo) return;

    socketRef.current.emit('markAsRead', {
      conversationId: selectedConvo._id
    });

    setConversations(prevConvos => prevConvos.map(convo =>
      convo._id === selectedConvo._id ? { ...convo, unreadCount: 0 } : convo
    ));


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
  }, [selectedConvo, setConversations]);

  useEffect(() => {
    if (messageAreaRef.current) {
      setTimeout(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }, [messages]);

  const handleNavigateToProfile = (partnerId) => {
    navigate(`/home/profile/${partnerId}`);
  };

  const handleStartEdit = (msg) => {
    setNewMessage(msg.content);
    setEditingMessageId(msg._id);
    document.getElementById('chat-input-textarea').focus();
  };

  const handleDeleteMessage = (messageId) => {
    Swal.fire({
      title: 'Xóa tin nhắn?',
      text: "Bạn không thể hoàn tác hành động này!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        socketRef.current.emit('deleteMessage', { messageId });
      }
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !socketRef.current || !currentUser || !selectedConvo) return;

    if (editingMessageId) {
      socketRef.current.emit('editMessage', {
        messageId: editingMessageId,
        newContent: newMessage.trim()
      });
      setEditingMessageId(null);
      setNewMessage('');
      return;
    }

    const newTimestamp = new Date().toISOString();

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
      createdAt: newTimestamp
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");

    setConversations(prevConvos => {
      const newConvos = prevConvos.map(convo => {
        if (convo._id === selectedConvo._id) {
          return {
            ...convo,
            lastMessage: {
              ...optimisticMessage,
              content: optimisticMessage.content
            },
            unreadCount: 0
          };
        }
        return convo;
      });
      return newConvos.sort((a, b) => new Date(b.lastMessage?.createdAt || 0) - new Date(a.lastMessage?.createdAt || 0));
    });
  };

  const renderMessageMenu = (msg) => (
    <Menu>
      <Menu.Item key="edit" icon={<Edit size={16} />} onClick={() => handleStartEdit(msg)}>
        Chỉnh sửa
      </Menu.Item>
      <Menu.Item key="delete" icon={<Trash2 size={16} />} danger onClick={() => handleDeleteMessage(msg._id)}>
        Xóa
      </Menu.Item>
    </Menu>
  );

  const isPartnerOnline = selectedConvo && onlineUsers.has(selectedConvo.partner._id);

  const filteredConversations = conversations.filter(convo => {
    if (!convo.partner) {
      console.warn("Lỗi dữ liệu: Cuộc hội thoại thiếu thông tin đối tác.", convo);
      return false;
    }
    const partnerName = convo.partner.name || '';

    return (
      partnerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="chat-layout">
      <aside className="conversation-list">
        <div className="cl-header">
          <h2>Tin nhắn</h2>
          <Input
            className="cl-search"
            placeholder="Tìm kiếm..."
            prefix={<Search size={16} color="#888" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="cl-items">
          {loadingConvos ? <Spin style={{ padding: "20px" }} /> : filteredConversations.map(convo => {
            const isOnline = convo.partner && onlineUsers.has(convo.partner._id);
            if (!convo.partner) return null; // An toàn

            const displayBadge = convo.unreadCount > 0 || (convo.unreadCount === 0 && convo.lastMessage);
            const badgeValue = convo.unreadCount > 0 ? convo.unreadCount : 0;

            return (
              <div
                key={convo._id}
                className={`convo-item ${selectedConvo?._id === convo._id ? 'active' : ''}`}
                onClick={() => setSelectedConvo(convo)}
              >
                <div className={`convo-avatar-wrapper ${isOnline ? 'online' : ''}`}>
                  {convo.partner && convo.partner.pfp ? (
                    <img className="avatar" src={convo.partner.pfp} alt={convo.partner.name} />
                  ) : (
                    <div className="avatar-initials">
                      {getInitials(convo.partner?.name)}
                    </div>
                  )}
                </div>
                <div className="convo-details">
                  <div className="convo-top">
                    <span className="convo-name">{convo.partner.name}</span>
                    <span className="convo-timestamp">{formatTimestamp(convo.lastMessage?.createdAt)}</span>
                  </div>
                  <div className="convo-bottom">
                    <p className={`convo-last-message ${convo.unreadCount > 0 ? 'unread' : ''}`}>
                      {convo.lastMessage?.senderId._id === currentUser?._id ? "Bạn: " : ""}
                      {convo.lastMessage?.content || "..."}
                    </p>

                    {/* {displayBadge && (
                      <span className={`unread-badge ${badgeValue === 0 ? 'zero' : ''}`}>
                        {badgeValue}
                      </span>
                    )} */}
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
              <div className="ch-user" onClick={() => handleNavigateToProfile(selectedConvo.partner._id)} style={{ cursor: 'pointer' }}>
                {selectedConvo.partner && selectedConvo.partner.pfp ? (
                  <img className="avatar" src={selectedConvo.partner.pfp} alt={selectedConvo.partner.name} />
                ) : (
                  <div className="avatar-initials">
                    {getInitials(selectedConvo.partner?.name)}
                  </div>
                )}
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
                <div key={msg._id} className={`message-bubble ${msg.senderId._id === currentUser?._id ? 'sent' : 'received'}`}>
                  {msg.senderId._id !== currentUser?._id && (msg.senderId && msg.senderId.pfp ? (
                    <img className="msg-avatar" src={msg.senderId.pfp} alt={msg.senderId.name} />
                  ) : (
                    <div className="msg-avatar-initials">
                      {getInitials(msg.senderId?.name)}
                    </div>
                  ))}
                  <div className="message-content">
                    {msg.messageType === 'shared_post' && msg.sharedPostId ? (
                      <SharedPostSnippet
                        postData={msg.sharedPostId}
                        navigate={navigate}
                        currentUserId={currentUser._id}
                      />
                    ) : (
                      <p>
                        {msg.content}
                        {msg.isEdited && <span style={{ fontSize: '0.7rem', color: '#ccc', marginLeft: '5px' }}>(Đã sửa)</span>}
                      </p>
                    )}
                  </div>

                  {msg.senderId._id === currentUser?._id && msg.messageType === 'text' && (
                    <Dropdown overlay={renderMessageMenu(msg)} trigger={['click']} placement="topRight">
                      <Button type="text" className="message-action-btn"><BsThreeDotsVertical /></Button>
                    </Dropdown>
                  )}
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