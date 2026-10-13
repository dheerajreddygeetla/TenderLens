import {
  getProfile,
  updateProfile,
  changePassword,
  listSessions,
  revokeSession,
  revokeOtherSessions,
} from "../services/settings.service.js";
import { setupMfa, verifyAndEnableMfa, disableMfa } from "../services/auth.service.js";

const REFRESH_COOKIE = "tl_refresh";
const meta = (req) => ({ ip: req.ip, userAgent: req.get("user-agent") || null });

export const getMe = async (req, res, next) => {
  try {
    const profile = await getProfile(req.user.id);
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
};

export const patchProfile = async (req, res, next) => {
  try {
    const profile = await updateProfile(req.user.id, req.body, meta(req));
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
};

export const postChangePassword = async (req, res, next) => {
  try {
    const result = await changePassword(req.user.id, req.body, meta(req));
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const getSessions = async (req, res, next) => {
  try {
    const rows = await listSessions(req.user.id);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

export const deleteSession = async (req, res, next) => {
  try {
    const result = await revokeSession(req.user.id, req.params.id, meta(req));
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const postRevokeOthers = async (req, res, next) => {
  try {
    const current = req.cookies?.[REFRESH_COOKIE];
    const result = await revokeOtherSessions(req.user.id, current, meta(req));
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

// ---------- MFA ----------
export const postMfaSetup = async (req, res, next) => {
  try {
    const result = await setupMfa(req.user.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const postMfaVerify = async (req, res, next) => {
  try {
    const result = await verifyAndEnableMfa(req.user.id, req.body.code);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const postMfaDisable = async (req, res, next) => {
  try {
    const result = await disableMfa(req.user.id, req.body.password);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};
