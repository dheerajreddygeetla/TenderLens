import { useCallback, useEffect, useState } from "react";
import { notificationApi } from "../services/notification.js";
import { useAuth } from "./useAuth.js";

export function useNotifications({ pollMs = 15000 } = {}) {
  const { status } = useAuth();
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      const res = await notificationApi.unreadCount();
      setUnread(res.data?.data?.unread ?? 0);
    } catch {
      /* ignore */
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") { setUnread(0); return; }
    refresh();
    const t = setInterval(refresh, pollMs);
    return () => clearInterval(t);
  }, [status, refresh, pollMs]);

  return { unread, refresh };
}
