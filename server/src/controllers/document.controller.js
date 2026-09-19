import {
  listDocuments,
  getDocumentById,
  listDocumentsForTender,
  uploadDocument,
  deleteDocument,
} from "../services/document.service.js";

const meta = (req) => ({ ip: req.ip, userAgent: req.get("user-agent") || null });

export const getDocuments = async (req, res, next) => {
  try {
    const result = await listDocuments(req.validatedQuery || req.query);
    res.json({ success: true, data: result.items, pagination: result.pagination });
  } catch (err) { next(err); }
};

export const getDocument = async (req, res, next) => {
  try {
    const doc = await getDocumentById(req.params.id);
    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
};

export const getDocumentsForTender = async (req, res, next) => {
  try {
    const docs = await listDocumentsForTender(req.params.tenderId);
    res.json({ success: true, data: docs });
  } catch (err) { next(err); }
};

export const postDocument = async (req, res, next) => {
  try {
    const tenderId = req.body?.tenderId || req.query?.tenderId || null;
    const doc = await uploadDocument({
      file: req.file,
      tenderId,
      user: req.user,
      meta: meta(req),
    });
    res.status(201).json({ success: true, data: doc });
  } catch (err) { next(err); }
};

export const removeDocument = async (req, res, next) => {
  try {
    const result = await deleteDocument(req.params.id, req.user, meta(req));
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};
