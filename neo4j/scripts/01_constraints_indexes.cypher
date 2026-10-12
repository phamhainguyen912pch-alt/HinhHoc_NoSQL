// =============================================================================
// BƯỚC 1: KHỞI TẠO RÀNG BUỘC DUY NHẤT (CONSTRAINTS) VÀ CHỈ MỤC (INDEXES)
// Dự án: Ứng dụng Hỗ trợ Học Toán Hình học phẳng (Chuyên đề Tứ giác) - Nhóm 4
// Tương thích: Neo4j 5.x Community / Enterprise / Neo4j AuraDB
// =============================================================================

CREATE CONSTRAINT shape_id_unique IF NOT EXISTS
FOR (s:Shape) REQUIRE s.id IS UNIQUE;

CREATE CONSTRAINT property_id_unique IF NOT EXISTS
FOR (p:Property) REQUIRE p.id IS UNIQUE;

CREATE CONSTRAINT theorem_id_unique IF NOT EXISTS
FOR (th:Theorem) REQUIRE th.id IS UNIQUE;

CREATE CONSTRAINT exercise_id_unique IF NOT EXISTS
FOR (e:Exercise) REQUIRE e.id IS UNIQUE;

CREATE CONSTRAINT user_id_unique IF NOT EXISTS
FOR (u:User) REQUIRE u.id IS UNIQUE;

CREATE CONSTRAINT user_email_unique IF NOT EXISTS
FOR (u:User) REQUIRE u.email IS UNIQUE;

CREATE INDEX shape_rank_idx IF NOT EXISTS
FOR (s:Shape) ON (s.rank);

CREATE INDEX exercise_type_idx IF NOT EXISTS
FOR (e:Exercise) ON (e.type);
