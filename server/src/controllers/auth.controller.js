import {
  loginUser,
  refreshSession,
  logoutUser,
  requestPasswordReset,
  resetPassword,
  getMe,
} from "../services/auth.service.js";
import { env } from "../config/env.js";

const REFRESH_COOKIE = "tl_refresh";
const REFRESH_COOKIE_PATH = "/api/auth";

const baseCookieOptions = () => ({
  httpOnly: true,
  secure: env.isProd,
  sameSite: "lax",
  path: REFRESH_COOKIE_PATH,
});

const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE, token, {
    ...baseCookieOptions(),
    maxAge: env.JWT_REFRESH_EXPIRES_MS,
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE, baseCookieOptions());
};

const clientContext = (req) => ({
  ip: req.ip,
  userAgent: req.get("user-agent") || null,
});

export const postLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { ip, userAgent } = clientContext(req);

    const { user, accessToken, refreshToken } = await loginUser({
      email,
      password,
      ip,
      userAgent,
    });

    setRefreshCookie(res, refreshToken);

    res.json({
      success: true,
      data: {
        user,
        accessToken,
        expiresIn: env.JWT_ACCESS_EXPIRES,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const postRefresh = async (req, res, next) => {
  try {
    const raw = req.cookies?.[REFRESH_COOKIE];
    const { ip, userAgent } = clientContext(req);

    const { user, accessToken, refreshToken } = await refreshSession({
      refreshToken: raw,
      ip,
      userAgent,
    });

    setRefreshCookie(res, refreshToken);

    res.json({
      success: true,
      data: { user, accessToken, expiresIn: env.JWT_ACCESS_EXPIRES },
    });
  } catch (err) {
    // Clear cookie if it's dead
    clearRefreshCookie(res);
    next(err);
  }
};

export const postLogout = async (req, res, next) => {
  try {
    const raw = req.cookies?.[REFRESH_COOKIE];
    const { ip, userAgent } = clientContext(req);

    await logoutUser({
      refreshToken: raw,
      userId: req.user?.id ?? null,
      ip,
      userAgent,
    });

    clearRefreshCookie(res);
    res.json({ success: true, data: { ok: true } });
  } catch (err) {
    next(err);
  }
};

export const postForgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const { ip, userAgent } = clientContext(req);
    const result = await requestPasswordReset({ email, ip, userAgent });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const postResetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const { ip, userAgent } = clientContext(req);
    const result = await resetPassword({ token, newPassword, ip, userAgent });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getMeController = async (req, res, next) => {
  try {
    const user = await getMe(req.user.id);
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};
