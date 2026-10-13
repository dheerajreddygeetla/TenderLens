import { useCallback, useEffect, useState } from "react";
import { notificationApi } from "../services/notification.js";
import { useAuth } from "./useAuth.js";
import { useSocket } from "./useSocket.js";

export function useNotifications({ pollMs = 60000 } = {}) {
  const { status } = useAuth();
  const { subscribe } = useSocket();
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      const res = await notificationApi.unreadCount();
      setUnread(res.data?.data?.unread ?? 0);
    } catch { /* ignore */ }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") { setUnread(0); return; }
    refresh();

    // Live update on every incoming notification
    const off = subscribe(() => {
      setUnread((n) => n + 1);
    });

    // Slow safety poll in case the socket dropped
    const t = setInterval(refresh, pollMs);
    return () => {
      off();
      clearInterval(t);
    };
  }, [status, refresh, subscribe, pollMs]);

  return { unread, refresh };
}
