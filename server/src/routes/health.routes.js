import { Router } from "express";
import { env } from "../config/env.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      service: "tenderlens-api",
      env: env.NODE_ENV,
      time: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
    },
  });
});

export default router;
