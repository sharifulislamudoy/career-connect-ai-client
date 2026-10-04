import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { API_BASE_URL } from "../lib/api";
const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);
export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  useEffect(() => {
    if (!user) { setSocket(null); return; }
    const connection = io(API_BASE_URL, { withCredentials: true, transports: ["websocket", "polling"], auth: async callback => { try { callback({ token: await user.getIdToken() }); } catch { callback({}); } } });
    connection.on("connect", () => connection.emit("user-online", user.uid));
    setSocket(connection);
    return () => { connection.disconnect(); };
  }, [user]);
  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}
