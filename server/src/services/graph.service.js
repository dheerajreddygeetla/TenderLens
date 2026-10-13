import { query } from "../config/database.js";
import { runCypher, neo4j } from "../config/neo4j.js";
import { logger } from "../utils/logger.js";

const nodeLabel = (kind) => kind; // Company, Tender, Contract, Department, Location

// -----------------------------------------------------------------------------
// Sync
// -----------------------------------------------------------------------------

const syncNodes = async (_runId) => {
  const counts = { Company: 0, Tender: 0, Contract: 0, Department: 0, Location: 0 };

  // --- Companies ---
  const { rows: companies } = await query(
    `SELECT c.id, c.name, c.registration_id AS "registrationId",
            c.industry, c.is_active AS "isActive",
            l.id AS "locationId", l.name AS "locationName", l.state AS "locationState"
     FROM companies c
     LEFT JOIN locations l ON l.id = c.location_id`
  );
  for (const c of companies) {
    await runCypher(
      `MERGE (n:Company {id: $id})
       SET n.name = $name,
           n.registrationId = $registrationId,
           n.industry = $industry,
           n.isActive = $isActive,
           n.syncedAt = datetime()`,
      {
        id: c.id,
        name: c.name,
        registrationId: c.registrationId || "",
        industry: c.industry || "",
        isActive: !!c.isActive,
      },
      { write: true }
    );
    counts.Company += 1;
  }

  // --- Tenders ---
  const { rows: tenders } = await query(
    `SELECT t.id, t.tender_code AS "tenderCode", t.title, t.status,
            t.estimated_value AS "estimatedValue", t.currency,
            t.department_id AS "departmentId", t.location_id AS "locationId"
     FROM tenders t`
  );
  for (const t of tenders) {
    await runCypher(
      `MERGE (n:Tender {id: $id})
       SET n.tenderCode = $tenderCode,
           n.title = $title,
           n.status = $status,
           n.estimatedValue = $estimatedValue,
           n.currency = $currency,
           n.syncedAt = datetime()`,
      {
        id: t.id,
        tenderCode: t.tenderCode,
        title: t.title,
        status: t.status,
        estimatedValue: Number(t.estimatedValue) || 0,
        currency: t.currency || "INR",
      },
      { write: true }
    );
    counts.Tender += 1;
  }

  // --- Contracts ---
  const { rows: contracts } = await query(
    `SELECT id, contract_code AS "contractCode", original_value AS "originalValue",
            current_value AS "currentValue", currency, status, start_date AS "startDate",
            end_date AS "endDate"
     FROM contracts`
  );
  for (const c of contracts) {
    await runCypher(
      `MERGE (n:Contract {id: $id})
       SET n.contractCode = $contractCode,
           n.originalValue = $originalValue,
           n.currentValue = $currentValue,
           n.currency = $currency,
           n.status = $status,
           n.startDate = $startDate,
           n.endDate = $endDate,
           n.syncedAt = datetime()`,
      {
        id: c.id,
        contractCode: c.contractCode,
        originalValue: Number(c.originalValue) || 0,
        currentValue: Number(c.currentValue) || 0,
        currency: c.currency || "INR",
        status: c.status,
        startDate: c.startDate ? String(c.startDate) : null,
        endDate: c.endDate ? String(c.endDate) : null,
      },
      { write: true }
    );
    counts.Contract += 1;
  }

  // --- Departments ---
  const { rows: departments } = await query(`SELECT id, code, name FROM departments`);
  for (const d of departments) {
    await runCypher(
      `MERGE (n:Department {id: $id})
       SET n.code = $code, n.name = $name, n.syncedAt = datetime()`,
      { id: d.id, code: d.code || "", name: d.name },
      { write: true }
    );
    counts.Department += 1;
  }

  // --- Locations ---
  const { rows: locations } = await query(
    `SELECT id, name, state, country, latitude AS lat, longitude AS lng FROM locations`
  );
  for (const l of locations) {
    await runCypher(
      `MERGE (n:Location {id: $id})
       SET n.name = $name, n.state = $state, n.country = $country,
           n.lat = $lat, n.lng = $lng, n.syncedAt = datetime()`,
      {
        id: l.id,
        name: l.name,
        state: l.state || "",
        country: l.country || "",
        lat: l.lat !== null ? Number(l.lat) : null,
        lng: l.lng !== null ? Number(l.lng) : null,
      },
      { write: true }
    );
    counts.Location += 1;
  }

  return counts;
};

const syncRelationships = async () => {
  const counts = {};

  const rel = async (name, cypher) => {
    const records = await runCypher(cypher, {}, { write: true });
    counts[name] = records[0]?.get("n")?.toNumber?.() ?? records[0]?.get("n") ?? 0;
  };

  // Company -[:PARTICIPATED_IN]-> Tender (from bids)
  await rel(
    "PARTICIPATED_IN",
    `MATCH (c:Company), (t:Tender), (b:Contract) WHERE false RETURN 0 AS n`
  );
  // Reset the placeholder above; use direct MATCHes below.

  // Participated
  {
    const { rows } = await query(`SELECT company_id, tender_id FROM bids`);
    let n = 0;
    for (const r of rows) {
      await runCypher(
        `MATCH (c:Company {id: $companyId}), (t:Tender {id: $tenderId})
         MERGE (c)-[r:PARTICIPATED_IN]->(t)
         SET r.syncedAt = datetime()`,
        { companyId: r.company_id, tenderId: r.tender_id },
        { write: true }
      );
      n += 1;
    }
    counts.PARTICIPATED_IN = n;
  }

  // Won
  {
    const { rows } = await query(`SELECT company_id, tender_id FROM bids WHERE status = 'awarded'`);
    let n = 0;
    for (const r of rows) {
      await runCypher(
        `MATCH (c:Company {id: $companyId}), (t:Tender {id: $tenderId})
         MERGE (c)-[r:WON]->(t)
         SET r.syncedAt = datetime()`,
        { companyId: r.company_id, tenderId: r.tender_id },
        { write: true }
      );
      n += 1;
    }
    counts.WON = n;
  }

  // Issued by
  {
    const { rows } = await query(`SELECT id, department_id FROM tenders WHERE department_id IS NOT NULL`);
    let n = 0;
    for (const r of rows) {
      await runCypher(
        `MATCH (t:Tender {id: $tenderId}), (d:Department {id: $deptId})
         MERGE (t)-[r:ISSUED_BY]->(d)
         SET r.syncedAt = datetime()`,
        { tenderId: r.id, deptId: r.department_id },
        { write: true }
      );
      n += 1;
    }
    counts.ISSUED_BY = n;
  }

  // Located in (tender -> location)
  {
    const { rows } = await query(`SELECT id, location_id FROM tenders WHERE location_id IS NOT NULL`);
    let n = 0;
    for (const r of rows) {
      await runCypher(
        `MATCH (t:Tender {id: $tenderId}), (l:Location {id: $locId})
         MERGE (t)-[r:LOCATED_IN]->(l)
         SET r.syncedAt = datetime()`,
        { tenderId: r.id, locId: r.location_id },
        { write: true }
      );
      n += 1;
    }
    counts.LOCATED_IN_TENDER = n;
  }

  // Company located in
  {
    const { rows } = await query(`SELECT id, location_id FROM companies WHERE location_id IS NOT NULL`);
    let n = 0;
    for (const r of rows) {
      await runCypher(
        `MATCH (c:Company {id: $companyId}), (l:Location {id: $locId})
         MERGE (c)-[r:LOCATED_IN]->(l)
         SET r.syncedAt = datetime()`,
        { companyId: r.id, locId: r.location_id },
        { write: true }
      );
      n += 1;
    }
    counts.LOCATED_IN_COMPANY = n;
  }

  // Tender resulted in contract
  {
    const { rows } = await query(`SELECT id, tender_id FROM contracts WHERE tender_id IS NOT NULL`);
    let n = 0;
    for (const r of rows) {
      await runCypher(
        `MATCH (t:Tender {id: $tenderId}), (c:Contract {id: $contractId})
         MERGE (t)-[r:RESULTED_IN]->(c)
         SET r.syncedAt = datetime()`,
        { tenderId: r.tender_id, contractId: r.id },
        { write: true }
      );
      n += 1;
    }
    counts.RESULTED_IN = n;
  }

  // Contract awarded to
  {
    const { rows } = await query(`SELECT id, company_id FROM contracts WHERE company_id IS NOT NULL`);
    let n = 0;
    for (const r of rows) {
      await runCypher(
        `MATCH (c:Contract {id: $contractId}), (co:Company {id: $companyId})
         MERGE (c)-[r:AWARDED_TO]->(co)
         SET r.syncedAt = datetime()`,
        { contractId: r.id, companyId: r.company_id },
        { write: true }
      );
      n += 1;
    }
    counts.AWARDED_TO = n;
  }

  return counts;
};

export const runFullSync = async () => {
  const { rows: runRows } = await query(
    `INSERT INTO graph_sync_runs (status) VALUES ('running') RETURNING id`
  );
  const runId = runRows[0].id;

  try {
    // Wipe existing graph (safe in dev). Keeps Node labels consistent.
    await runCypher(`MATCH (n) DETACH DELETE n`, {}, { write: true });

    const nodeCounts = await syncNodes(runId);
    const relCounts = await syncRelationships();

    await query(
      `UPDATE graph_sync_runs
         SET status = 'completed', node_counts = $1, rel_counts = $2, finished_at = NOW()
       WHERE id = $3`,
      [JSON.stringify(nodeCounts), JSON.stringify(relCounts), runId]
    );

    return { runId, nodeCounts, relCounts };
  } catch (err) {
    logger.error("Graph sync failed", { message: err.message });
    await query(
      `UPDATE graph_sync_runs SET status='failed', error=$1, finished_at=NOW() WHERE id=$2`,
      [String(err.message).slice(0, 500), runId]
    );
    throw err;
  }
};

export const latestSyncRun = async () => {
  const { rows } = await query(
    `SELECT id, status, node_counts AS "nodeCounts", rel_counts AS "relCounts",
            error, started_at AS "startedAt", finished_at AS "finishedAt"
     FROM graph_sync_runs
     ORDER BY started_at DESC
     LIMIT 1`
  );
  return rows[0] || null;
};

// -----------------------------------------------------------------------------
// Queries
// -----------------------------------------------------------------------------

export const searchEntities = async (q, limit = 10) => {
  if (!q || q.trim().length < 2) return [];
  const needle = q.trim();
  const records = await runCypher(
    `MATCH (n)
     WHERE (n:Company OR n:Tender OR n:Contract OR n:Department OR n:Location)
       AND (
         toLower(coalesce(n.name,''))         CONTAINS toLower($q) OR
         toLower(coalesce(n.title,''))        CONTAINS toLower($q) OR
         toLower(coalesce(n.tenderCode,''))   CONTAINS toLower($q) OR
         toLower(coalesce(n.contractCode,'')) CONTAINS toLower($q)
       )
     RETURN labels(n) AS labels,
            n.id AS id,
            coalesce(n.name, n.title, n.tenderCode, n.contractCode) AS label,
            properties(n) AS props
     LIMIT $limit`,
    { q: needle, limit: neoLimit(limit) }
  );
  return records.map((r) => ({
    kind: r.get("labels")[0],
    id: r.get("id"),
    label: r.get("label"),
    props: normalizeProps(r.get("props")),
  }));
};

const neoLimit = (n) => neo4j.int(Number(n) || 0);

// Normalise Neo4j properties into plain JS (integers/points/arrays)
const normalizeProps = (p) => {
  const out = {};
  for (const [k, v] of Object.entries(p || {})) {
    if (v === null || v === undefined) { out[k] = null; continue; }
    if (typeof v === "object" && typeof v.toNumber === "function") out[k] = v.toNumber();
    else if (Array.isArray(v)) out[k] = v.map((x) => (x && typeof x.toNumber === "function" ? x.toNumber() : x));
    else if (v && typeof v.toString === "function" && v.constructor && v.constructor.name === "DateTime") out[k] = v.toString();
    else out[k] = v;
  }
  return out;
};

export const getNeighborhood = async ({ id, kind, depth = 1, relTypes = [], limit = 200 }) => {
  const label = nodeLabel(kind);
  const safeDepth = Math.min(Math.max(Number(depth) || 1, 1), 3);

  const records = await runCypher(
    `MATCH (center:${label} {id: $id})
     CALL apoc.path.subgraphAll(center, { maxLevel: $depth, relationshipFilter: '${relTypes.length ? relTypes.join("|") : ""}' })
     YIELD nodes, relationships
     RETURN nodes, relationships
     LIMIT 1`,
    { id, depth: neoLimit(safeDepth) }
  );

  if (!records.length) return { nodes: [], links: [] };

  const nodesRaw = records[0].get("nodes");
  const relsRaw = records[0].get("relationships");

  const nodes = nodesRaw.slice(0, limit).map((n) => {
    const labels = n.labels;
    const props = normalizeProps(n.properties);
    return {
      id: props.id,
      kind: labels[0],
      label: props.name || props.title || props.tenderCode || props.contractCode || props.id,
      props,
    };
  });

  const nodeIds = new Set(nodes.map((n) => `${n.kind}:${n.id}`));

  const links = relsRaw
    .map((r) => {
      const start = r.startNodeElementId;
      const end = r.endNodeElementId;
      return {
        sourceElementId: start,
        targetElementId: end,
        type: r.type,
        props: normalizeProps(r.properties),
      };
    });

  // We need to resolve element IDs → our node ids for react-force-graph
  const elementToNode = new Map();
  for (const n of nodesRaw) {
    const props = normalizeProps(n.properties);
    elementToNode.set(n.elementId, { id: props.id, kind: n.labels[0] });
  }

  const resolvedLinks = links
    .map((l) => {
      const s = elementToNode.get(l.sourceElementId);
      const t = elementToNode.get(l.targetElementId);
      if (!s || !t) return null;
      if (!nodeIds.has(`${s.kind}:${s.id}`) || !nodeIds.has(`${t.kind}:${t.id}`)) return null;
      return {
        source: s.id,
        target: t.id,
        sourceKind: s.kind,
        targetKind: t.kind,
        type: l.type,
      };
    })
    .filter(Boolean);

  return { nodes, links: resolvedLinks };
};

// -----------------------------------------------------------------------------
// Query presets
// -----------------------------------------------------------------------------

export const presetTendersForCompany = async (companyId) => {
  const records = await runCypher(
    `MATCH (c:Company {id: $companyId})-[r]->(t:Tender)
     RETURN type(r) AS rel, t.id AS id, t.tenderCode AS code, t.title AS title,
            t.status AS status, t.estimatedValue AS value
     ORDER BY t.tenderCode`,
    { companyId }
  );
  return records.map((r) => ({
    relation: r.get("rel"),
    id: r.get("id"),
    tenderCode: r.get("code"),
    title: r.get("title"),
    status: r.get("status"),
    estimatedValue: Number(r.get("value")) || 0,
  }));
};

export const presetSharedTenders = async (companyId) => {
  const records = await runCypher(
    `MATCH (c:Company {id: $companyId})-[:PARTICIPATED_IN]->(t:Tender)<-[:PARTICIPATED_IN]-(other:Company)
     WHERE other.id <> $companyId
     RETURN other.id AS id, other.name AS name, count(t) AS sharedTenders
     ORDER BY sharedTenders DESC
     LIMIT 25`,
    { companyId }
  );
  return records.map((r) => ({
    companyId: r.get("id"),
    companyName: r.get("name"),
    sharedTenders: r.get("sharedTenders").toNumber ? r.get("sharedTenders").toNumber() : r.get("sharedTenders"),
  }));
};

export const presetDepartmentsForCompany = async (companyId) => {
  const records = await runCypher(
    `MATCH (c:Company {id: $companyId})-[:PARTICIPATED_IN]->(:Tender)-[:ISSUED_BY]->(d:Department)
     RETURN d.id AS id, d.name AS name, count(*) AS participations
     ORDER BY participations DESC`,
    { companyId }
  );
  return records.map((r) => ({
    departmentId: r.get("id"),
    departmentName: r.get("name"),
    participations: r.get("participations").toNumber ? r.get("participations").toNumber() : r.get("participations"),
  }));
};
