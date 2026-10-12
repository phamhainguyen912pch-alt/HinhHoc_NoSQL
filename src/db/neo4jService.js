/**
 * Neo4j Official Bolt Driver Service (Node.js / ES Module)
 * Dự án: Ứng dụng Hỗ trợ Học Toán Hình học phẳng (Chuyên đề Tứ giác) - Nhóm 4
 */

import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

let driver = null;
let connectionConfig = {
  uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
  user: process.env.NEO4J_USER || 'neo4j',
  password: process.env.NEO4J_PASSWORD || '',
  connected: false
};

export async function initNeo4jDriver(uri, user, password) {
  if (driver) {
    await driver.close();
    driver = null;
  }
  connectionConfig = {
    uri: uri || connectionConfig.uri,
    user: user || connectionConfig.user,
    password: password ?? connectionConfig.password,
    connected: false
  };

  if (!connectionConfig.uri || !connectionConfig.password) {
    return { connected: false, mode: 'IN_MEMORY_GRAPH_MIRROR' };
  }

  try {
    driver = neo4j.driver(
      connectionConfig.uri,
      neo4j.auth.basic(connectionConfig.user, connectionConfig.password)
    );
    await driver.verifyConnectivity();
    connectionConfig.connected = true;
    return { connected: true, uri: connectionConfig.uri, mode: 'NEO4J_LIVE_BOLT' };
  } catch (err) {
    connectionConfig.connected = false;
    driver = null;
    return { connected: false, error: err.message, mode: 'IN_MEMORY_GRAPH_MIRROR' };
  }
}

export async function runCypherQuery(cypher, params = {}) {
  if (!driver || !connectionConfig.connected) return null;
  const session = driver.session();
  try {
    const result = await session.run(cypher, params);
    return result.records.map(r => r.toObject());
  } finally {
    await session.close();
  }
}

export function getNeo4jStatus() {
  return connectionConfig;
}
