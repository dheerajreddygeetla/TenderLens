import {
  listCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
} from "../services/company.service.js";

const meta = (req) => ({ ip: req.ip, userAgent: req.get("user-agent") || null });

export const getCompanies = async (req, res, next) => {
  try {
    const result = await listCompanies(req.validatedQuery || req.query);
    res.json({ success: true, data: result.items, pagination: result.pagination });
  } catch (err) {
    next(err);
  }
};

export const getCompany = async (req, res, next) => {
  try {
    const company = await getCompanyById(req.params.id);
    res.json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
};

export const postCompany = async (req, res, next) => {
  try {
    const company = await createCompany(req.body, req.user, meta(req));
    res.status(201).json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
};

export const putCompany = async (req, res, next) => {
  try {
    const company = await updateCompany(req.params.id, req.body, req.user, meta(req));
    res.json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
};
