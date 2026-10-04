import { apiFetch, API_BASE_URL } from "../lib/api";
import React, { createContext, useState, useContext, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import toast from "react-hot-toast";

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, refreshUserProfile, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  useEffect(() => {
    if (user) loadNotifications();
    else { setNotifications([]); setUnreadCount(0); setLoading(false); }
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    const onNew = notification => {
      setNotifications(prev => prev.some(n => n._id === notification._id) ? prev : [notification, ...prev]);
      if (notification.type === "role_changed") { toast(notification.message); refreshUserProfile(); }
    };
    const onCount = count => setUnreadCount(count);
    const onLogout = data => { toast.error(data.reason || "Please sign in again"); logout(); };
    socket.on("new-notification", onNew);
    socket.on("notification-count", onCount);
    socket.on("force-logout", onLogout);
    return () => { socket.off("new-notification", onNew); socket.off("notification-count", onCount); socket.off("force-logout", onLogout); };
  }, [socket, refreshUserProfile, logout]);

  const loadNotifications = async (params = {}) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        limit: params.limit || 20,
        offset: params.offset || 0,
        ...params,
      }).toString();

      const response = await apiFetch(
        `${API_BASE_URL}/api/notifications/user/${user.uid}?${queryParams}`
      );
      const data = await response.json();

      if (data.success) {
        if (params.offset) {
          setNotifications((prev) => [...prev, ...data.notifications]);
        } else {
          setNotifications(data.notifications);
        }
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await apiFetch(
        `${API_BASE_URL}/api/notifications/mark-read/${notificationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: user.uid }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === notificationId ? { ...notif, read: true } : notif
          )
        );
        setUnreadCount(data.unreadCount);

        if (socket) {
          socket.emit("mark-notification-read", {
            notificationId,
            userId: user.uid,
          });
        }
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await apiFetch(
        `${API_BASE_URL}/api/notifications/mark-all-read/${user.uid}`,
        { method: "PUT" }
      );

      const data = await response.json();

      if (data.success) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, read: true }))
        );
        setUnreadCount(0);

        if (socket) {
          socket.emit("mark-all-notifications-read", { userId: user.uid });
        }
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await apiFetch(
        `${API_BASE_URL}/api/notifications/${notificationId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: user.uid }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setNotifications((prev) =>
          prev.filter((notif) => notif._id !== notificationId)
        );
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const response = await apiFetch(
        `${API_BASE_URL}/api/notifications/clear-all/${user.uid}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (data.success) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error clearing notifications:", error);
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
    loadMore: (offset) => loadNotifications({ offset }),
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};