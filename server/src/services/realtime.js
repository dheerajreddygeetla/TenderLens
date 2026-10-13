import { Server } from "socket.io";
import { verifyAccessToken } from "../utils/jwt.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

let io = null;

export const initRealtime = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    },
    path: "/socket.io",
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("auth: missing token"));
      const payload = verifyAccessToken(token);
      socket.data.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
      next();
    } catch (err) {
      next(new Error(`auth: ${err.message}`));
    }
  });

  io.on("connection", (socket) => {
    const { id, role } = socket.data.user;
    socket.join(`user:${id}`);
    socket.join(`role:${role}`);
    logger.info(`socket connected`, { userId: id, role, sid: socket.id });

    socket.on("disconnect", (reason) => {
      logger.info(`socket disconnected`, { userId: id, reason });
    });
  });

  logger.info("Realtime (socket.io) initialized");
  return io;
};

export const getIo = () => io;

export const emitToUser = (userId, event, payload) => {
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit(event, payload);
};

export const emitToRole = (role, event, payload) => {
  if (!io || !role) return;
  io.to(`role:${role}`).emit(event, payload);
};

export const broadcast = (event, payload) => {
  if (!io) return;
  io.emit(event, payload);
};
