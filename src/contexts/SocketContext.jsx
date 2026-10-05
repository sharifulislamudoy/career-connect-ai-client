import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { API_BASE_URL, ensureDevice, deviceCredentials } from "../lib/api";
const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);
export function SocketProvider({ children }) {
  const { user, userProfile, accountBanned } = useAuth();
  const [socket, setSocket] = useState(null);
  useEffect(() => {
    if (!user || !userProfile || accountBanned) { setSocket(null); return; }
    const connection = io(API_BASE_URL, { withCredentials: true, transports: ["websocket", "polling"], auth: async callback => { try { await ensureDevice(user); callback({ token: await user.getIdToken(), ...deviceCredentials(user.uid) }); } catch { callback({}); } } });
    connection.on("connect", () => connection.emit("user-online", user.uid));
    setSocket(connection);
    return () => { connection.disconnect(); };
  }, [user, userProfile?.uid, accountBanned]);
  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}
