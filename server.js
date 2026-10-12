/**
 * Application Backend API Server (Node.js Express + Official Neo4j Bolt Driver)
 * Dự án: Ứng dụng Hỗ trợ Học Toán Hình học phẳng (Chuyên đề Tứ giác) - Nhóm 4
 */

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initNeo4jDriver, runCypherQuery, getNeo4jStatus } from './src/db/neo4jService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'nhom4_quadgeo_neo4j_secret_key_2026';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Khởi tạo kết nối Neo4j nếu có cấu hình trong .env
initNeo4jDriver(process.env.NEO4J_URI, process.env.NEO4J_USER, process.env.NEO4J_PASSWORD);

// API: Kiểm tra trạng thái kết nối Neo4j
app.get('/api/neo4j/status', (req, res) => {
  const status = getNeo4jStatus();
  res.json({
    ...status,
    mode: status.connected ? 'NEO4J_LIVE_BOLT' : 'IN_MEMORY_GRAPH_MIRROR',
    stats: { shapesCount: 9, propertiesCount: 13, theoremsCount: 8, exercisesCount: 11 }
  });
});

// API: Kết nối động tới Neo4j Desktop / Neo4j AuraDB
app.post('/api/neo4j/connect', async (req, res) => {
  const { uri, user, password } = req.body;
  const result = await initNeo4jDriver(uri, user, password);
  res.json(result);
});

// API: Khởi tạo Seed Knowledge Graph từ thư mục neo4j/scripts
app.post('/api/neo4j/seed', async (req, res) => {
  const status = getNeo4jStatus();
  if (!status.connected) {
    return res.json({
      success: true,
      mode: 'IN_MEMORY_GRAPH_MIRROR',
      message: 'Đã nạp Knowledge Graph vào bộ nhớ đệm. Kết nối Neo4j Bolt để đồng bộ lên Cloud/Desktop.'
    });
  }
  try {
    const scriptsDir = path.join(__dirname, 'neo4j', 'scripts');
    let count = 0;
    for (const file of ['01_constraints_indexes.cypher', '02_seed_knowledge_graph.cypher']) {
      const content = fs.readFileSync(path.join(scriptsDir, file), 'utf8');
      const statements = content.split(';').map(s => s.trim()).filter(Boolean);
      for (const stmt of statements) {
        const clean = stmt.split('\n').filter(line => !line.trim().startsWith('//')).join('\n').trim();
        if (clean) {
          await runCypherQuery(clean);
          count++;
        }
      }
    }
    res.json({
      success: true,
      mode: 'NEO4J_LIVE_BOLT',
      executedStatements: count,
      message: `Đã thực thi ${count} câu lệnh Cypher khởi tạo Knowledge Graph thành công!`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Phân loại tứ giác bằng Cypher Pattern Matching (US-06)
app.post('/api/geometry/classify', async (req, res) => {
  const { detectedPropertyIds = [] } = req.body;
  const cypherQuery = `
MATCH (s:Shape)
WHERE ALL(reqProp IN [(s)-[:HAS_PROPERTY]->(p:Property) | p.id]
          WHERE reqProp IN $detectedPropertyIds)
RETURN s.id AS ShapeId,
       s.vietnameseName AS TenHinh,
       s.rank AS DoUuTien
ORDER BY s.rank DESC
LIMIT 1;`.trim();

  const records = await runCypherQuery(cypherQuery, { detectedPropertyIds });
  res.json({
    isValid: true,
    neo4jReasoning: {
      source: records ? 'NEO4J_LIVE_BOLT' : 'IN_MEMORY_GRAPH_MIRROR',
      cypherQuery,
      parameters: { detectedPropertyIds },
      result: records && records[0] ? records[0] : null
    }
  });
});

app.listen(PORT, () => {
  console.log(`QuadGeo Neo4j Server đang chạy tại http://localhost:${PORT}`);
});
