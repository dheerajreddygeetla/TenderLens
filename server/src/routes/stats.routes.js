import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/role.middleware.js";
import { query } from "../config/database.js";

const router = Router();
router.use(authenticate);

router.get("/summary", requirePermission("tender:read"), async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT
        (SELECT COUNT(*)::int FROM tenders)     AS total_tenders,
        (SELECT COUNT(*)::int FROM tenders WHERE status = 'open') AS open_tenders,
        (SELECT COUNT(*)::int FROM tenders WHERE status = 'awarded') AS awarded_tenders,
        (SELECT COUNT(*)::int FROM tenders WHERE status = 'completed') AS completed_tenders,
        (SELECT COUNT(*)::int FROM companies)   AS total_companies,
        (SELECT COUNT(*)::int FROM departments) AS total_departments,
        (SELECT COUNT(*)::int FROM locations)   AS total_locations,
        (SELECT COUNT(*)::int FROM documents)   AS total_documents,
        (SELECT COUNT(*)::int FROM bids)        AS total_bids,
        (SELECT COUNT(*)::int FROM contracts)   AS total_contracts,
        (SELECT COUNT(*)::int FROM contract_amendments) AS total_amendments
    `);

    const byDept = await query(`
      SELECT d.name, COUNT(t.id)::int AS count,
             COALESCE(SUM(t.estimated_value), 0)::numeric AS value
      FROM departments d
      LEFT JOIN tenders t ON t.department_id = d.id
      GROUP BY d.name
      ORDER BY count DESC
    `);

    const byStatus = await query(`
      SELECT status, COUNT(*)::int AS count
      FROM tenders
      GROUP BY status
    `);

    res.json({
      success: true,
      data: {
        totals: rows[0],
        byDepartment: byDept.rows,
        byStatus: byStatus.rows,
      },
    });
  } catch (err) { next(err); }
});

/** Tender volume + value per month over the last 12 months. */
router.get("/tenders-over-time", requirePermission("tender:read"), async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT
        to_char(date_trunc('month', published_at), 'YYYY-MM') AS month,
        COUNT(*)::int AS count,
        COALESCE(SUM(estimated_value), 0)::numeric AS value
      FROM tenders
      WHERE published_at IS NOT NULL
        AND published_at >= date_trunc('month', NOW()) - INTERVAL '11 months'
      GROUP BY month
      ORDER BY month ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

/** Value distribution by department (already in summary, but keep it as its own route). */
router.get("/value-by-department", requirePermission("tender:read"), async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT d.name,
             COALESCE(SUM(t.estimated_value), 0)::numeric AS value,
             COUNT(t.id)::int AS count
      FROM departments d
      LEFT JOIN tenders t ON t.department_id = d.id
      GROUP BY d.name
      ORDER BY value DESC NULLS LAST
    `);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

export default router;
