import crypto from "node:crypto";

export const generateOpaqueToken = (bytes = 48) => crypto.randomBytes(bytes).toString("hex");

export const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
