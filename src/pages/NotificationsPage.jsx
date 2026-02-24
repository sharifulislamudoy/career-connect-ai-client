import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaBell,
  FaCheck,
  FaTrash,
  FaEye,
  FaUserPlus,
  FaEnvelope,
  FaBriefcase,
  FaHeart,
  FaComment,
  FaCheckCircle,
  FaTimesCircle,
  FaCog,
  FaFilter,
  FaTimes,
  FaSearch,
  FaUser
} from 'react-icons/fa';
import { format } from 'date-fns';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationsPage = () => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    refreshNotifications,
    loadMore
  } = useNotifications();

  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    refreshNotifications();
  }, [filter]);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread' && notification.read) return false;
    if (filter === 'read' && !notification.read) return false;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        notification.title.toLowerCase().includes(searchLower) ||
        notification.message.toLowerCase().includes(searchLower) ||
        notification.senderName?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'connection_request':
        return <FaUserPlus className="text-blue-500 text-lg" />;
      case 'connection_accepted':
        return <FaCheckCircle className="text-green-500 text-lg" />;
      case 'connection_rejected':
        return <FaTimesCircle className="text-red-500 text-lg" />;
      case 'new_message':
        return <FaEnvelope className="text-purple-500 text-lg" />;
      case 'job_application':
      case 'job_application_status':
        return <FaBriefcase className="text-orange-500 text-lg" />;
      case 'post_like':
        return <FaHeart className="text-red-500 text-lg" />;
      case 'post_comment':
        return <FaComment className="text-blue-500 text-lg" />;
      default:
        return <FaBell className="text-gray-500 text-lg" />;
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      'connection_request': 'Connection Request',
      'connection_accepted': 'Connection Accepted',
      'connection_rejected': 'Connection Rejected',
      'new_message': 'Message',
      'job_application': 'Job Application',
      'job_application_status': 'Application Update',
      'post_like': 'Post Like',
      'post_comment': 'Post Comment',
      'system_announcement': 'System'
    };
    return labels[type] || type;
  };

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    await loadMore(nextPage * 20);
    setPage(nextPage);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    // Navigate based on type
    switch (notification.type) {
      case 'connection_request':
      case 'connection_accepted':
        navigate('/network');
        break;
      case 'new_message':
        if (notification.targetId) {
          navigate(`/messages?conversation=${notification.targetId}`);
        }
        break;
      case 'job_application':
      case 'job_application_status':
        navigate('/my-applications');
        break;
      default:
        break;
    }
  };

  const formatDate = (date) => {
    const notificationDate = new Date(date);
    const today = new Date();
    
    if (notificationDate.toDateString() === today.toDateString()) {
      return format(notificationDate, 'HH:mm');
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (notificationDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return format(notificationDate, 'MMM d');
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <FaBell className="animate-pulse text-4xl text-blue-500 mb-4" />
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-8">
      <div className="w-11/12 mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 mt-2">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors"
                >
                  Mark all as read
                </button>
              )}
              <button
                onClick={clearAllNotifications}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>
        </motion.div>

        {/* Filters and Search */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Filter Buttons */}
            <div className="flex space-x-2 bg-gray-100 p-1 rounded-2xl">
              {['all', 'unread', 'read'].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                    filter === filterType
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {filterType}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredNotifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="text-gray-400 text-5xl mb-4">
                  <FaBell />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No notifications found
                </h3>
                <p className="text-gray-500">
                  {searchTerm || filter !== 'all' 
                    ? 'Try adjusting your search or filter'
                    : 'When you get notifications, they will appear here'}
                </p>
              </motion.div>
            ) : (
              filteredNotifications.map((notification) => (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg cursor-pointer ${
                    !notification.read ? 'border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {notification.title}
                          </h3>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                              {getTypeLabel(notification.type)}
                            </span>
                            {!notification.read && (
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                                Unread
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-4">{notification.message}</p>

                      {/* Sender Info */}
                      {notification.senderName && (
                        <div className="flex items-center space-x-3">
                          {notification.senderPhotoURL ? (
                            <img
                              src={notification.senderPhotoURL}
                              alt={notification.senderName}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <FaUser className="text-gray-500" />
                            </div>
                          )}
                          <span className="text-sm text-gray-700">
                            From: {notification.senderName}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2">
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification._id);
                          }}
                          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                          title="Mark as read"
                        >
                          <FaCheck className="text-gray-400" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification._id);
                        }}
                        className="p-2 rounded-xl hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <FaTrash className="text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>

          {/* Load More */}
          {hasMore && filteredNotifications.length > 0 && (
            <div className="text-center pt-6">
              <button
                onClick={handleLoadMore}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                Load more notifications
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;