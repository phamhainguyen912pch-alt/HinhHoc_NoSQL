// =============================================================================
// BƯỚC 3: CÁC KỊCH BẢN TRUY VẤN CYPHER CỐT LÕI (CORE CYPHER QUERIES)
// Dự án: Ứng dụng Hỗ trợ Học Toán Hình học phẳng (Chuyên đề Tứ giác) - Nhóm 4
// Dùng để kiểm thử trực tiếp trên Neo4j Browser / Neo4j Aura Workspace
// =============================================================================

// -----------------------------------------------------------------------------
// KỊCH BẢN 1 (US-06 / FR-04): Nhận diện và Phân loại Tứ giác tự động
// Input từ Core Geometry Engine: Danh sách các thuộc tính phát hiện được
// Ví dụ thử nghiệm: ['PROP_ALL_ANGLES_LT_180', 'PROP_2_PAIRS_PARALLEL', 'PROP_4_EQUAL_SIDES', 'PROP_1_RIGHT_ANGLE']
// -----------------------------------------------------------------------------
:param detectedPropertyIds => ['PROP_ALL_ANGLES_LT_180', 'PROP_2_PAIRS_PARALLEL', 'PROP_4_EQUAL_SIDES', 'PROP_1_RIGHT_ANGLE'];

MATCH (s:Shape)
WHERE ALL(reqProp IN [(s)-[:HAS_PROPERTY]->(p:Property) | p.id]
          WHERE reqProp IN $detectedPropertyIds)
RETURN s.id AS ShapeId,
       s.vietnameseName AS TenHinh,
       s.rank AS DoUuTien,
       s.formulaPerimeter AS CongThucChuVi,
       s.formulaArea AS CongThucDienTich
ORDER BY s.rank DESC
LIMIT 1;


// -----------------------------------------------------------------------------
// KỊCH BẢN 2 (US-11 / FR-08): Thuật toán Gợi ý 3 tầng (Graph Traversal tìm tính chất còn thiếu)
// Input: Hình mục tiêu của bài tập ($targetShapeId) và Thuộc tính hiện có ($currentPropertyIds)
// Ví dụ: Học sinh đang dựng Hình vuông ('SQUARE') nhưng mới chỉ tạo được Hình bình hành
// -----------------------------------------------------------------------------
:param targetShapeId => 'SQUARE';
:param currentPropertyIds => ['PROP_ALL_ANGLES_LT_180', 'PROP_2_PAIRS_PARALLEL'];

MATCH (target:Shape {id: $targetShapeId})-[:HAS_PROPERTY]->(p:Property)
WHERE NOT p.id IN $currentPropertyIds
OPTIONAL MATCH (th:Theorem)-[:REQUIRES]->(p)
WHERE th.targetShape = target.id
RETURN p.id AS MissingPropId,
       p.desc AS LyThuyetGoiY_Tang1,
       p.actionHint AS ThaoTacGoiY_Tang2,
       th.name AS DinhLyLienQuan,
       th.proofExplanation AS ChungMinhDinhLy
LIMIT 1;


// -----------------------------------------------------------------------------
// KỊCH BẢN 3 (Mục 2.4.3 SRS): Truy vấn Cây phả hệ phân cấp Tứ giác (Taxonomy / Ontology)
// Khám phá toàn bộ đường dẫn đa kế thừa từ Hình vuông lên Tứ giác lồi
// -----------------------------------------------------------------------------
MATCH path = (child:Shape)-[:SUBCLASS_OF*1..4]->(parent:Shape {id: 'CONVEX_QUADRILATERAL'})
RETURN path;


// -----------------------------------------------------------------------------
// KỊCH BẢN 4 (US-10 / FR-07): Chấm điểm tự động bài tập dựng hình bằng Graph Validation
// Đối chiếu tập thuộc tính học sinh dựng được với toàn bộ thuộc tính bắt buộc của bài tập
// -----------------------------------------------------------------------------
:param exerciseId => 'EX_CONSTRUCT_RECTANGLE';
:param studentProps => ['PROP_ALL_ANGLES_LT_180', 'PROP_2_PAIRS_PARALLEL', 'PROP_1_RIGHT_ANGLE'];

MATCH (e:Exercise {id: $exerciseId})-[:TARGETS]->(target:Shape)-[:HAS_PROPERTY]->(p:Property)
WITH e, target,
     collect(p.id) AS requiredProps,
     [prop IN collect(p) WHERE NOT prop.id IN $studentProps | prop.desc] AS missingDescriptions
RETURN e.title AS BaiTap,
       target.vietnameseName AS HinhMucTieu,
       size(missingDescriptions) = 0 AS KetQuaDung,
       requiredProps AS ThuocTinhBatBuoc,
       missingDescriptions AS ThuocTinhConThieu;


// -----------------------------------------------------------------------------
// KỊCH BẢN 5 (US-12 / FR-09): Thống kê Lưu vết Tiến độ Học tập (Graph Mastery)
// -----------------------------------------------------------------------------
MATCH (u:User)-[r:SOLVED]->(e:Exercise)-[:TARGETS]->(s:Shape)
RETURN u.username AS HocSinh,
       u.className AS Lop,
       e.title AS TenBaiTap,
       s.vietnameseName AS ChuyenDeHinh,
       r.score AS DiemSo,
       r.attemptCount AS SoLanThu,
       r.completionTime AS ThoiGianGiay,
       r.solvedAt AS ThoiDiemHoanThanh
ORDER BY r.solvedAt DESC;
