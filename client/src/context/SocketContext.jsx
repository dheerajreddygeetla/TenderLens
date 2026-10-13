import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getAccessToken } from "../lib/api.js";
import { useAuth } from "../hooks/useAuth.js";

export const SocketContext = createContext(null);

const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

export function SocketProvider({ children }) {
  const { status } = useAuth();
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState(null);
  const listenersRef = useRef(new Set());

  useEffect(() => {
    if (status !== "authenticated") {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    const s = io(baseUrl, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      auth: { token },
      withCredentials: true,
    });
    socketRef.current = s;
    setSocket(s);

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    s.on("connect_error", (err) => {
      console.warn("Socket connect_error:", err.message);
      setConnected(false);
    });

    const onNotification = (n) => {
      setLastNotification(n);
      for (const cb of listenersRef.current) cb(n);
    };
    s.on("notification:new", onNotification);

    return () => {
      s.off("notification:new", onNotification);
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    };
  }, [status]);

  const subscribe = useCallback((cb) => {
    listenersRef.current.add(cb);
    return () => listenersRef.current.delete(cb);
  }, []);

  const value = useMemo(
    () => ({ connected, lastNotification, subscribe, socket }),
    [connected, lastNotification, subscribe, socket]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
