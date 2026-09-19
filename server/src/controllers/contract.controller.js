import {
  listContracts,
  getContractById,
  listContractsForTender,
  addAmendment,
} from "../services/contract.service.js";

const meta = (req) => ({ ip: req.ip, userAgent: req.get("user-agent") || null });

export const getContracts = async (req, res, next) => {
  try {
    const result = await listContracts(req.validatedQuery || req.query);
    res.json({ success: true, data: result.items, pagination: result.pagination });
  } catch (err) { next(err); }
};

export const getContract = async (req, res, next) => {
  try {
    const contract = await getContractById(req.params.id);
    res.json({ success: true, data: contract });
  } catch (err) { next(err); }
};

export const getContractsForTender = async (req, res, next) => {
  try {
    const rows = await listContractsForTender(req.params.tenderId);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

export const postAmendment = async (req, res, next) => {
  try {
    const amendmentNo = await addAmendment(req.params.id, req.body, req.user, meta(req));
    res.status(201).json({ success: true, data: { amendmentNo } });
  } catch (err) { next(err); }
};
