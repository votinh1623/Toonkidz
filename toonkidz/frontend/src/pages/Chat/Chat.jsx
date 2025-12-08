import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';

import { Input, Spin, message, Dropdown, Menu, Button } from 'antd';
import Swal from 'sweetalert2';
import EmojiPicker from 'emoji-picker-react';
import { toast } from 'sonner';

import {
  Search, Paperclip, Smile, Send, Phone, MoreVertical,
  Edit, Trash2, X, Flag, MessageSquareDashed
} from 'lucide-react';
import { BsThreeDotsVertical } from 'react-icons/bs';

import { getMessages } from '../../service/messageService';
import ReportModal from '../../components/ReportModal/ReportModal';
import './Chat.scss';

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

const SharedPostSnippet = ({ postData, navigate }) => {
  if (!postData || !postData.userId) {
    return <div className="shared-post-snippet error">Bài viết không tồn tại.</div>;
  }

  const isShared = postData.originalPostId;
  const originalPost = isShared ? postData.originalPostId : postData;
  const author = originalPost.userId;
  const story = originalPost.storyId;
  const postId = originalPost._id;

  const handleNavigation = (e) => {
    e.stopPropagation();
    const url = `/home/profile/${author._id}#${postId}`;
    navigate(url);
  };

  return (
    <div className="shared-post-snippet" onClick={handleNavigation}>
      <span className="shared-label">Bài viết được chia sẻ</span>
      <div className="shared-content">
        <img
          className="shared-cover"
          src={story?.coverImage || 'https://www.svgrepo.com/show/452030/avatar-default.svg'}
          alt="Cover"
        />
        <div className="shared-info">
          <strong className="shared-title">{story?.title || 'Truyện đã xóa'}</strong>
          <p className="shared-caption">
            {originalPost.caption || postData.sharedCaption || '—'}
          </p>
        </div>
      </div>
    </div>
  );
};


const Chat = () => {
  const {
    currentUser,
    conversations,
    onlineUsers,
    socket,
    loadingConvos,
    setMessagesExternally,
    setConversations
  } = useOutletContext();

  const navigate = useNavigate();
  const location = useLocation();

  const [selectedConvo, setSelectedConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const emojiRef = useRef(null);
  const socketRef = useRef(socket);
  const messageEndRef = useRef(null);
  const messageAreaRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (location.state?.targetConversation) {
      const { targetConversation } = location.state;
      setSelectedConvo(targetConversation);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMessagesExternally({
      setter: setMessages,
      convoId: selectedConvo?._id
    });

    return () => {
      setMessagesExternally(null);
    };
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
    };
  }, [socket]);

  useEffect(() => {
    if (!selectedConvo) return;

    socketRef.current.emit('markAsRead', { conversationId: selectedConvo._id });

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
  }, [selectedConvo]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNavigateToProfile = (partnerId) => {
    navigate(`/home/profile/${partnerId}`);
  };

  const handleStartEdit = (msg) => {
    setNewMessage(msg.content);
    setEditingMessageId(msg._id);
    inputRef.current?.focus();
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setNewMessage("");
  };

  const onEmojiClick = (emojiObject) => {
    setNewMessage((prev) => prev + emojiObject.emoji);
    inputRef.current?.focus();
  };

  const handleDeleteMessage = (messageId) => {
    Swal.fire({
      title: 'Xóa tin nhắn?',
      text: "Bạn không thể hoàn tác!",
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
    setShowEmojiPicker(false);
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

    const tempId = Date.now().toString();
    const messageData = {
      content: newMessage.trim(),
      receiverId: selectedConvo.partner._id,
      senderId: currentUser._id,
      conversationId: selectedConvo._id,
      tempId: tempId
    };

    socketRef.current.emit('sendMessage', messageData);

    const optimisticMessage = {
      ...messageData,
      _id: tempId,
      senderId: { _id: currentUser._id, name: currentUser.name, pfp: currentUser.pfp },
      createdAt: new Date().toISOString(),
      messageType: 'text'
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");
  };


  const renderMessageMenu = (msg) => (
    <Menu>
      {msg.messageType === 'text' && (
        <Menu.Item key="edit" icon={<Edit size={16} />} onClick={() => handleStartEdit(msg)}>
          Chỉnh sửa
        </Menu.Item>
      )}
      <Menu.Item key="delete" icon={<Trash2 size={16} />} danger onClick={() => handleDeleteMessage(msg._id)}>
        Xóa
      </Menu.Item>
    </Menu>
  );

  const headerMenu = (
    <Menu>
      <Menu.Item key="report" icon={<Flag size={16} />} danger onClick={() => setIsReportModalOpen(true)}>
        Báo cáo người dùng
      </Menu.Item>
    </Menu>
  );

  const isPartnerOnline = selectedConvo && onlineUsers.has(selectedConvo.partner._id);

  const filteredConversations = conversations.filter(convo => {
    if (!convo.partner) return false;
    const partnerName = convo.partner.name || '';
    return partnerName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="chat-layout">
      {/* SIDEBAR */}
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
          {loadingConvos ? (
            <Spin style={{ padding: "20px", display: 'block', margin: '0 auto' }} />
          ) : (
            filteredConversations.map(convo => {
              const isOnline = convo.partner && onlineUsers.has(convo.partner._id);
              if (!convo.partner) return null;

              const isSelected = selectedConvo?._id === convo._id;

              return (
                <div
                  key={convo._id}
                  className={`convo-item ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedConvo(convo)}
                >
                  <div className={`convo-avatar-wrapper ${isOnline ? 'online' : ''}`}>
                    {convo.partner.pfp ? (
                      <img className="avatar" src={convo.partner.pfp} alt={convo.partner.name} />
                    ) : (
                      <div className="avatar-initials">{getInitials(convo.partner?.name)}</div>
                    )}
                  </div>
                  <div className="convo-details">
                    <div className="convo-top">
                      <span className="convo-name">{convo.partner.name}</span>
                      <span className="convo-timestamp">{formatTimestamp(convo.lastMessage?.createdAt)}</span>
                    </div>
                    <div className="convo-bottom">
                      <p className={`convo-last-message ${convo.unreadCount > 0 ? 'unread' : ''}`}>
                        {convo.lastMessage?.senderId === currentUser?._id ? "Bạn: " : ""}
                        {convo.lastMessage?.messageType === 'shared_post'
                          ? 'Đã chia sẻ một bài viết'
                          : (convo.lastMessage?.content || "...")}
                      </p>
                      {convo.unreadCount > 0 && <span className="unread-badge">{convo.unreadCount}</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      <main className="chat-window">
        {selectedConvo ? (
          <>
            <header className="chat-header">
              <div className="ch-user" onClick={() => handleNavigateToProfile(selectedConvo.partner._id)}>
                {selectedConvo.partner.pfp ? (
                  <img className="avatar" src={selectedConvo.partner.pfp} alt="Avatar" />
                ) : (
                  <div className="avatar-initials">{getInitials(selectedConvo.partner?.name)}</div>
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
                <Dropdown overlay={headerMenu} trigger={['click']} placement="bottomRight">
                  <button className="icon-btn"><MoreVertical size={20} /></button>
                </Dropdown>
              </div>
            </header>

            <div className="message-area" ref={messageAreaRef}>
              {loadingMessages ? (
                <div className="loading-area"><Spin /></div>
              ) : (
                messages.map(msg => {
                  const isMyMsg = msg.senderId._id === currentUser?._id;
                  return (
                    <div key={msg._id} className={`message-bubble ${isMyMsg ? 'sent' : 'received'}`}>
                      {!isMyMsg && (
                        <div className="msg-avatar-container">
                          {msg.senderId.pfp ? (
                            <img className="msg-avatar-img" src={msg.senderId.pfp} alt="Avatar" />
                          ) : (
                            <div className="msg-avatar-initials">{getInitials(msg.senderId?.name)}</div>
                          )}
                        </div>
                      )}

                      <div className="message-content">
                        {msg.messageType === 'shared_post' && msg.sharedPostId ? (
                          <SharedPostSnippet postData={msg.sharedPostId} navigate={navigate} />
                        ) : (
                          <div className="text-content">
                            {msg.content}
                            {msg.isEdited && <span className="edited-tag">(Đã sửa)</span>}
                          </div>
                        )}
                        <div className="message-meta">
                          <span className="message-timestamp">{formatTimestamp(msg.createdAt)}</span>
                        </div>
                      </div>

                      {isMyMsg && (
                        <Dropdown overlay={renderMessageMenu(msg)} trigger={['click']} placement="topRight">
                          <Button type="text" className="message-action-btn"><BsThreeDotsVertical /></Button>
                        </Dropdown>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messageEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSendMessage}>
              {editingMessageId && (
                <div className="editing-indicator">
                  <span>Đang sửa tin nhắn...</span>
                  <button type="button" className="cancel-edit-btn" onClick={handleCancelEdit}>
                    <X size={16} />
                  </button>
                </div>
              )}

              <button type="button" className="icon-btn" disabled={!!editingMessageId}>
                <Paperclip size={20} />
              </button>

              <div className="emoji-container" ref={emojiRef}>
                <button
                  type="button"
                  className={`icon-btn ${showEmojiPicker ? 'active' : ''}`}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  disabled={!!editingMessageId}
                >
                  <Smile size={20} />
                </button>
                {showEmojiPicker && (
                  <div className="emoji-picker-popup">
                    <EmojiPicker
                      onEmojiClick={onEmojiClick}
                      width={300}
                      height={400}
                      searchDisabled={false}
                      skinTonesDisabled
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                )}
              </div>

              <input
                ref={inputRef}
                type="text"
                placeholder={editingMessageId ? "Nhập nội dung mới..." : "Nhập tin nhắn..."}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" className="send-btn"><Send size={20} /></button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="welcome-icon">
              <MessageSquareDashed size={64} color="#ccc" />
            </div>
            <h2>Chào mừng bạn đến với tính năng Chat</h2>
            <p>Hãy kết nối với bạn bè của bạn để bắt đầu trò chuyện ngay bây giờ!</p>
          </div>
        )}
      </main>

      {selectedConvo && (
        <ReportModal
          open={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          targetId={selectedConvo.partner._id}
          targetType="User"
          targetName={selectedConvo.partner.name}
          onReported={() => { toast.success("Báo cáo người dùng thành công"); }}
        />
      )}
    </div>
  );
};

export default Chat;