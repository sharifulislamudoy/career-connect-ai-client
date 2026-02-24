import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useNotifications } from '../../contexts/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBell, 
  FaCheck, 
  FaTimes, 
  FaUser, 
  FaEnvelope, 
  FaUserPlus, 
  FaCheckCircle,
  FaTimesCircle,
  FaBriefcase,
  FaHeart,
  FaComment,
  FaTrash,
  FaCog,
  FaEye
} from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'connection_request':
        return <FaUserPlus className="text-blue-500" />;
      case 'connection_accepted':
        return <FaCheckCircle className="text-green-500" />;
      case 'connection_rejected':
        return <FaTimesCircle className="text-red-500" />;
      case 'new_message':
        return <FaEnvelope className="text-purple-500" />;
      case 'job_application':
      case 'job_application_status':
        return <FaBriefcase className="text-orange-500" />;
      case 'post_like':
        return <FaHeart className="text-red-500" />;
      case 'post_comment':
        return <FaComment className="text-blue-500" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'connection_request':
      case 'connection_accepted':
        navigate('/network');
        break;
      case 'new_message':
        if (notification.targetId) {
          navigate(`/messages?conversation=${notification.targetId}`);
        } else {
          navigate('/messages');
        }
        break;
      case 'job_application':
      case 'job_application_status':
        navigate('/my-applications');
        break;
      default:
        break;
    }

    setIsOpen(false);
  };

  const formatTime = (date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-2xl hover:bg-gray-100/80 transition-all duration-200 group"
      >
        <FaBell className="text-xl text-gray-600 group-hover:text-blue-600 transition-colors" />
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute -right-9 mt-2 w-75 md:w-96 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-gray-200/50 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1 rounded-xl hover:bg-blue-50"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-gray-400 text-3xl mb-3">
                    <FaBell />
                  </div>
                  <h4 className="text-gray-700 font-medium mb-2">No notifications yet</h4>
                  <p className="text-gray-500 text-sm">
                    When you get notifications, they'll appear here
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100/50">
                  {notifications.slice(0, 10).map((notification) => (
                    <motion.div
                      key={notification._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 hover:bg-gray-50/80 transition-colors duration-200 cursor-pointer ${
                        !notification.read ? 'bg-blue-50/50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                                {notification.title}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {notification.message}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                            )}
                          </div>

                          {/* Sender and Time */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-2">
                              {notification.senderPhotoURL ? (
                                <img
                                  src={notification.senderPhotoURL}
                                  alt={notification.senderName}
                                  className="w-6 h-6 rounded-full"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                  <FaUser className="text-gray-500 text-xs" />
                                </div>
                              )}
                              <span className="text-xs text-gray-500">
                                {notification.senderName}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">
                              {formatTime(notification.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col space-y-1">
                          {!notification.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification._id);
                              }}
                              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                              title="Mark as read"
                            >
                              <FaCheck className="text-gray-400 text-xs" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification._id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <FaTrash className="text-gray-400 text-xs hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;