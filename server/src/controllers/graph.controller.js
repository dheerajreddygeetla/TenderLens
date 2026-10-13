import {
  runFullSync,
  latestSyncRun,
  searchEntities,
  getNeighborhood,
  presetTendersForCompany,
  presetSharedTenders,
  presetDepartmentsForCompany,
} from "../services/graph.service.js";

export const postSync = async (req, res, next) => {
  try {
    const result = await runFullSync();
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const getSyncStatus = async (req, res, next) => {
  try {
    const latest = await latestSyncRun();
    res.json({ success: true, data: latest });
  } catch (err) { next(err); }
};

export const getSearch = async (req, res, next) => {
  try {
    const q = String(req.query.q || "");
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const rows = await searchEntities(q, limit);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

export const getEntityNeighborhood = async (req, res, next) => {
  try {
    const { id, kind } = req.params;
    const depth = Number(req.query.depth) || 1;
    const relTypes = String(req.query.types || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const result = await getNeighborhood({ id, kind, depth, relTypes });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const postPreset = async (req, res, next) => {
  try {
    const { preset } = req.params;
    const companyId = req.body?.companyId || req.query?.companyId;

    if (!companyId) {
      return res.status(400).json({ success: false, error: { message: "companyId is required" } });
    }

    let data;
    if (preset === "tenders-for-company") data = await presetTendersForCompany(companyId);
    else if (preset === "shared-tenders") data = await presetSharedTenders(companyId);
    else if (preset === "departments-for-company") data = await presetDepartmentsForCompany(companyId);
    else return res.status(404).json({ success: false, error: { message: `Unknown preset: ${preset}` } });

    res.json({ success: true, data });
  } catch (err) { next(err); }
};
