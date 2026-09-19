import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { logger } from "../utils/logger.js";

/**
 * Local filesystem storage adapter.
 * S3/R2 can be swapped in later by implementing the same interface:
 *   - save({ buffer, originalName }) -> { storageKey, fileHash, sizeBytes }
 *   - remove(storageKey)
 *   - absolutePath (local only)
 */
const LOCAL_ROOT = path.resolve(process.cwd(), "uploads");

const ensureDir = async (dir) => {
  await fs.mkdir(dir, { recursive: true });
};

const sha256 = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");

export const storage = {
  async save({ buffer, originalName }) {
    const fileHash = sha256(buffer);
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const ext = path.extname(originalName || "").toLowerCase();
    const storageKey = `documents/${yyyy}/${mm}/${fileHash.slice(0, 20)}${ext}`;
    const destPath = path.join(LOCAL_ROOT, storageKey);

    await ensureDir(path.dirname(destPath));
    await fs.writeFile(destPath, buffer);

    logger.info("Stored file", { storageKey, bytes: buffer.length });

    return { storageKey, fileHash, sizeBytes: buffer.length };
  },

  async remove(storageKey) {
    const destPath = path.join(LOCAL_ROOT, storageKey);
    try {
      await fs.unlink(destPath);
    } catch (err) {
      logger.warn("Failed to delete file", { storageKey, message: err.message });
    }
  },

  get absolutePath() {
    return LOCAL_ROOT;
  },
};

export const ensureStorageRoot = async () => {
  await ensureDir(LOCAL_ROOT);
};
