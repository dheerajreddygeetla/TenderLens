import {
  listNotifications,
  countUnread,
  markRead,
  markAllRead,
} from "../services/notification.service.js";

export const getNotifications = async (req, res, next) => {
  try {
    const unreadOnly = String(req.query.unread || "") === "true";
    const rows = await listNotifications(req.user.id, { unreadOnly });
    const unread = await countUnread(req.user.id);
    res.json({ success: true, data: rows, unread });
  } catch (err) { next(err); }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const unread = await countUnread(req.user.id);
    res.json({ success: true, data: { unread } });
  } catch (err) { next(err); }
};

export const patchRead = async (req, res, next) => {
  try {
    await markRead(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
};

export const patchReadAll = async (req, res, next) => {
  try {
    await markAllRead(req.user.id);
    res.json({ success: true });
  } catch (err) { next(err); }
};
