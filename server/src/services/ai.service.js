import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const BASE = env.AI_SERVICE_URL;

const json = async (url, init = {}) => {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI service ${res.status} @ ${url}: ${text.slice(0, 200)}`);
  }
  return res.json();
};

export const aiService = {
  async extractPdf(buffer, filename = "document.pdf") {
    const fd = new FormData();
    fd.append("file", new Blob([buffer], { type: "application/pdf" }), filename);
    return json(`${BASE}/documents/extract`, { method: "POST", body: fd });
  },

  async compare(source, targets) {
    return json(`${BASE}/similarity/compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, targets }),
    });
  },

  async detectAnomaly(features, peers) {
    return json(`${BASE}/anomaly/detect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features, peers }),
    });
  },

  async extractEntities(text) {
    return json(`${BASE}/entities/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  },

  async ping() {
    try {
      const r = await json(`${BASE}/`);
      return r?.status === "ok";
    } catch (err) {
      logger.warn("AI service ping failed", { message: err.message });
      return false;
    }
  },
};
