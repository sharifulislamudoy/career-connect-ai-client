import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  // Load initial notifications
  useEffect(() => {
    if (user) {
      loadNotifications();
      setupSocket();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user]);

  const setupSocket = () => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Listen for new notifications
    newSocket.on('new-notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // Listen for notification count updates
    newSocket.on('notification-count', (count) => {
      setUnreadCount(count);
    });

    return () => newSocket.disconnect();
  };

  const loadNotifications = async (params = {}) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        limit: params.limit || 20,
        offset: params.offset || 0,
        ...params
      }).toString();

      const response = await fetch(
        `http://localhost:5000/api/notifications/user/${user.uid}?${queryParams}`
      );
      const data = await response.json();
      
      if (data.success) {
        if (params.offset) {
          // Load more
          setNotifications(prev => [...prev, ...data.notifications]);
        } else {
          // Initial load
          setNotifications(data.notifications);
        }
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/notifications/mark-read/${notificationId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.uid })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setNotifications(prev =>
          prev.map(notif =>
            notif._id === notificationId ? { ...notif, read: true } : notif
          )
        );
        setUnreadCount(data.unreadCount);
        
        // Emit socket event
        if (socket) {
          socket.emit('mark-notification-read', {
            notificationId,
            userId: user.uid
          });
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/notifications/mark-all-read/${user.uid}`,
        { method: 'PUT' }
      );

      const data = await response.json();
      
      if (data.success) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
        
        // Emit socket event
        if (socket) {
          socket.emit('mark-all-notifications-read', { userId: user.uid });
        }
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/notifications/${notificationId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.uid })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/notifications/clear-all/${user.uid}`,
        { method: 'DELETE' }
      );

      const data = await response.json();
      
      if (data.success) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const refreshNotifications = () => {
    loadNotifications();
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    refreshNotifications,
    loadMore: (offset) => loadNotifications({ offset })
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};