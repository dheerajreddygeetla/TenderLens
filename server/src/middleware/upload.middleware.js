import multer from "multer";
import { httpError } from "../utils/httpError.js";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "image/jpeg",
  "image/png",
]);

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(httpError(400, `Unsupported file type: ${file.mimetype}`));
    }
    cb(null, true);
  },
});

const rawSingle = upload.single("file");

/** Wraps multer so its errors land in the normal error handler. */
export const uploadSingleFile = (req, res, next) => {
  rawSingle(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(httpError(400, `File too large. Max ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`));
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return next(httpError(400, "Unexpected file field. Use field name 'file'."));
    }
    return next(err);
  });
};
