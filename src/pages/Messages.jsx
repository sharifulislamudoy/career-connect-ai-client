// src/components/messages/Messages.jsx (Updated - fix double message issue)
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { io } from 'socket.io-client';
import {
  FaSearch,
  FaPaperPlane,
  FaPaperclip,
  FaImage,
  FaVideo,
  FaSmile,
  FaEllipsisV,
  FaCheck,
  FaCheckDouble,
  FaClock,
  FaUser,
  FaTimes,
  FaSpinner,
  FaPhone,
  FaInfoCircle,
  FaArrowLeft,
  FaComments,
  FaCamera
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';


const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});

  const [attachments, setAttachments] = useState([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (user) {
      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);

      // Set user as online
      newSocket.emit('user-online', user.uid);

      // Listen for incoming messages
      newSocket.on('receive-message', (message) => {
        if (selectedConversation && message.conversationId === selectedConversation.conversationId) {
          setMessages(prev => [...prev, message]);
          // Mark as read automatically if user is viewing
          markMessagesAsRead();
        }
        
        // Update conversation list with new message
        updateConversationWithNewMessage(message);
      });

      // Listen for user status changes
      newSocket.on('user-status-changed', ({ userId, status }) => {
        setOnlineUsers(prev => ({
          ...prev,
          [userId]: status
        }));
      });

      // Listen for typing indicators
      newSocket.on('user-typing', ({ userId, isTyping }) => {
        if (selectedConversation && selectedConversation.partner.uid === userId) {
          setTypingUsers(prev => ({
            ...prev,
            [userId]: isTyping
          }));
        }
      });

      // Listen for read receipts
      newSocket.on('messages-read', ({ userId }) => {
        if (selectedConversation && selectedConversation.partner.uid === userId) {
          // Update messages as read in UI
          setMessages(prev =>
            prev.map(msg =>
              msg.senderId === userId && !msg.read
                ? { ...msg, read: true, readAt: new Date() }
                : msg
            )
          );
        }
      });

      // Listen for message sent confirmation
      newSocket.on('message-sent', (message) => {
        // Update local message with server ID
        setMessages(prev =>
          prev.map(msg =>
            msg.tempId === message.tempId ? { ...msg, _id: message._id, tempId: undefined } : msg
          )
        );
        setIsSending(false);
      });

      // Listen for message errors
      newSocket.on('message-error', ({ error }) => {
        console.error('Message sending failed:', error);
        setIsSending(false);
        // Remove optimistic message if there's an error
        setMessages(prev => prev.filter(msg => !msg.tempId));
      });

      // Clean up on unmount
      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation && user) {
      loadMessages();
      joinConversation();
      markMessagesAsRead();
    }

    return () => {
      if (selectedConversation && socket) {
        socket.emit('leave-conversation', selectedConversation.conversationId);
      }
    };
  }, [selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/messages/conversations/${user.uid}`);
      const data = await response.json();
      
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (before = null) => {
    try {
      const params = new URLSearchParams({
        userId: user.uid,
        limit: 50
      });
      
      if (before) {
        params.append('before', before.toISOString());
      }

      const response = await fetch(
        `http://localhost:5000/api/messages/conversation/${selectedConversation.conversationId}?${params}`
      );
      
      const data = await response.json();
      
      if (data.success) {
        if (before) {
          // Load more messages
          setMessages(prev => [...data.messages, ...prev]);
        } else {
          // Initial load
          setMessages(data.messages);
        }
        setHasMoreMessages(data.hasMore);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const joinConversation = () => {
    if (socket && selectedConversation) {
      socket.emit('join-conversation', selectedConversation.conversationId);
    }
  };

  const markMessagesAsRead = async () => {
    if (selectedConversation && socket) {
      socket.emit('mark-read', {
        conversationId: selectedConversation.conversationId,
        userId: user.uid
      });
    }
  };

  const updateConversationWithNewMessage = (message) => {
    setConversations(prev =>
      prev.map(conv => {
        if (conv.conversationId === message.conversationId) {
          return {
            ...conv,
            lastMessage: message,
            unreadCount: message.receiverId === user.uid ? conv.unreadCount + 1 : 0,
            updatedAt: message.timestamp
          };
        }
        return conv;
      }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    );
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !socket || isSending) return;

    setIsSending(true);
    const tempId = Date.now().toString();
    const messageData = {
      conversationId: selectedConversation.conversationId,
      senderId: user.uid,
      receiverId: selectedConversation.partner.uid,
      content: newMessage.trim(),
      tempId
    };

    // Optimistically add message to UI
    const optimisticMessage = {
      ...messageData,
      _id: tempId,
      timestamp: new Date(),
      read: false,
      senderId: user.uid,
      tempId // Mark as temporary
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');

    // Send ONLY via socket - REMOVED HTTP backup
    socket.emit('send-message', messageData);

    // Stop typing indicator
    socket.emit('typing', {
      conversationId: selectedConversation.conversationId,
      userId: user.uid,
      isTyping: false
    });
  };

  const handleTyping = () => {
    if (!socket || !selectedConversation) return;

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Emit typing start
    socket.emit('typing', {
      conversationId: selectedConversation.conversationId,
      userId: user.uid,
      isTyping: true
    });

    // Set timeout to stop typing indicator after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', {
        conversationId: selectedConversation.conversationId,
        userId: user.uid,
        isTyping: false
      });
    }, 2000);
  };


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date) => {
    return format(new Date(date), 'HH:mm');
  };

  const formatDate = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return format(messageDate, 'MMM d, yyyy');
  };

  const onEmojiClick = (event, emojiObject) => {
    setNewMessage(prev => prev + emojiObject.emoji);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.partner.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage?.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="w-11/12 mx-auto h-screen lg:px-4">
        <div className="flex h-full">
          {/* Conversations List */}
          <div className={`w-full md:w-96 border-r border-gray-200 bg-white/80 ${selectedConversation ? 'hidden md:block' : 'block'}`}>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Messages</h2>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="overflow-y-auto h-[calc(100vh-120px)]">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4 flex justify-center items-center">
                    <FaComments />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No conversations yet
                  </h3>
                  <p className="text-gray-500">
                    Connect with other professionals to start messaging
                  </p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <motion.div
                    key={conversation.conversationId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition-colors duration-200 hover:bg-gray-50 ${
                      selectedConversation?.conversationId === conversation.conversationId ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={conversation.partner.photoURL || '/default-avatar.png'}
                          alt={conversation.partner.displayName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        {onlineUsers[conversation.partner.uid] === 'online' && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {conversation.partner.displayName || 'Unknown User'}
                          </h4>
                          {conversation.lastMessage && (
                            <span className="text-xs text-gray-500">
                              {formatTime(conversation.lastMessage.timestamp)}
                            </span>
                          )}
                        </div>
                        
                        {conversation.lastMessage && (
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage.senderId === user.uid ? 'You: ' : ''}
                            {conversation.lastMessage.content}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-1">
                          {conversation.partner.profession && (
                            <span className="text-xs text-gray-500">
                              {conversation.partner.profession}
                            </span>
                          )}
                          {conversation.unreadCount > 0 && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-white/80 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="md:hidden p-2 rounded-xl hover:bg-gray-100"
                    >
                      <FaArrowLeft className="text-gray-600" />
                    </button>
                    
                    <div className="relative">
                      <img
                        src={selectedConversation.partner.photoURL || '/default-avatar.png'}
                        alt={selectedConversation.partner.displayName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      {onlineUsers[selectedConversation.partner.uid] === 'online' && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedConversation.partner.displayName || 'Unknown User'}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-gray-600">
                          {onlineUsers[selectedConversation.partner.uid] === 'online' ? 'Online' : 'Offline'}
                        </p>
                        {typingUsers[selectedConversation.partner.uid] && (
                          <span className="text-xs text-blue-500 italic">typing...</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
                  {hasMoreMessages && (
                    <div className="text-center mb-4">
                      <button
                        onClick={() => loadMessages(messages[0]?.timestamp)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Load older messages
                      </button>
                    </div>
                  )}
                  
                  {messages.map((message, index) => {
                    const isCurrentUser = message.senderId === user.uid;
                    const showDate = index === 0 || 
                      formatDate(messages[index - 1].timestamp) !== formatDate(message.timestamp);
                    
                    return (
                      <React.Fragment key={message._id || message.tempId}>
                        {showDate && (
                          <div className="text-center my-4">
                            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                              {formatDate(message.timestamp)}
                            </span>
                          </div>
                        )}
                        
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs md:max-w-md lg:max-w-lg rounded-2xl p-3 ${
                            isCurrentUser 
                              ? 'bg-blue-500 text-white rounded-br-none' 
                              : 'bg-white border border-gray-200 rounded-bl-none'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            
                            <div className={`flex items-center justify-end space-x-1 mt-1 ${
                              isCurrentUser ? 'text-blue-200' : 'text-gray-500'
                            }`}>
                              <span className="text-xs">{formatTime(message.timestamp)}</span>
                              {isCurrentUser && (
                                message.read ? (
                                  <FaCheckDouble className="text-xs" />
                                ) : message._id && !message.tempId ? (
                                  <FaCheck className="text-xs" />
                                ) : (
                                  <FaClock className="text-xs animate-pulse" />
                                )
                              )}
                            </div>
                          </div>
                        </motion.div>
                      </React.Fragment>
                    );
                  })}
                  
                  {typingUsers[selectedConversation.partner.uid] && (
                    <div className="flex mb-4 justify-start">
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none p-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 bg-white/80">
                  {/* Attachments Preview */}
                  {attachments.length > 0 && (
                    <div className="flex space-x-2 mb-3 overflow-x-auto">
                      {attachments.map((file, index) => (
                        <div key={index} className="relative flex-shrink-0">
                          {file.type.startsWith('image/') ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="w-20 h-20 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                              <FaPaperclip className="text-gray-400" />
                            </div>
                          )}
                          <button
                            onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          handleTyping();
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        placeholder="Type a message..."
                        className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isSending}
                      />
                      {isSending && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <FaSpinner className="animate-spin text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className={`p-3 rounded-xl ${!newMessage.trim() || isSending
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                    >
                      <FaPaperPlane />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="text-gray-400 text-6xl mb-6">
                  <FaComments />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Select a conversation
                </h3>
                <p className="text-gray-600 text-center max-w-md">
                  Choose a conversation from the list to start messaging, or connect with new professionals.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;