import neo4j from "neo4j-driver";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

let driver;

export const getDriver = () => {
  if (!driver) {
    driver = neo4j.driver(
      env.NEO4J_URI,
      neo4j.auth.basic(env.NEO4J_USER, env.NEO4J_PASSWORD),
      { maxConnectionPoolSize: 20 }
    );
  }
  return driver;
};

/** Run a read-only or write query inside a managed session. */
export const runCypher = async (cypher, params = {}, { write = false } = {}) => {
  const d = getDriver();
  const session = d.session({
    database: env.NEO4J_DATABASE,
    defaultAccessMode: write ? neo4j.session.WRITE : neo4j.session.READ,
  });
  try {
    const result = await session.run(cypher, params);
    return result.records;
  } finally {
    await session.close();
  }
};

export const healthCheckNeo4j = async () => {
  try {
    const records = await runCypher("RETURN 1 AS ok");
    return records[0]?.get("ok") === 1;
  } catch (err) {
    logger.warn("Neo4j health check failed", { message: err.message });
    return false;
  }
};

export const closeDriver = async () => {
  if (driver) {
    await driver.close();
    driver = undefined;
  }
};

export { neo4j };
