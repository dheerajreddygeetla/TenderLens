import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/role.middleware.js";
import { query } from "../config/database.js";

const router = Router();

router.get("/summary", authenticate, requirePermission("tender:read"), async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT
        (SELECT COUNT(*)::int FROM tenders)     AS total_tenders,
        (SELECT COUNT(*)::int FROM tenders WHERE status = 'open') AS open_tenders,
        (SELECT COUNT(*)::int FROM tenders WHERE status = 'awarded') AS awarded_tenders,
        (SELECT COUNT(*)::int FROM tenders WHERE status = 'completed') AS completed_tenders,
        (SELECT COUNT(*)::int FROM companies)   AS total_companies,
        (SELECT COUNT(*)::int FROM departments) AS total_departments,
        (SELECT COUNT(*)::int FROM locations)   AS total_locations
    `);

    const byDept = await query(`
      SELECT d.name, COUNT(t.id)::int AS count
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
  } catch (err) {
    next(err);
  }
});

export default router;
