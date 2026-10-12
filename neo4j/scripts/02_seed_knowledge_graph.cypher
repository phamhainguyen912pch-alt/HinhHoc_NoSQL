// =============================================================================
// BƯỚC 2: KHỞI TẠO ĐỒ THỊ TRI THỨC HÌNH HỌC TỨ GIÁC (KNOWLEDGE GRAPH SEED)
// Dự án: Ứng dụng Hỗ trợ Học Toán Hình học phẳng (Chuyên đề Tứ giác) - Nhóm 4
// Bao gồm: 9 Node (:Shape), 12 Node (:Property), 10 Node (:Theorem),
//          12 Node (:Exercise), 4 Node (:User) và 6 loại Relationship chuẩn SRS
// =============================================================================

// 1. XÓA DỮ LIỆU CŨ ĐỂ KHỞI TẠO SẠCH
MATCH (n) DETACH DELETE n;

// 2. KHỞI TẠO CÁC THUỘC TÍNH HÌNH HỌC SƠ CẤP (:Property)
CREATE (p_convex:Property {
  id: 'PROP_ALL_ANGLES_LT_180',
  category: 'angle',
  desc: 'Tất cả 4 góc trong của tứ giác đều nhỏ hơn 180° (Tứ giác lồi) và tổng 4 góc bằng 360°.',
  actionHint: 'Hãy kéo đỉnh bị lõm hướng ra phía ngoài để cả 4 góc trong đều nhỏ hơn 180°.',
  ruleCode: 'ALL_INTERIOR_ANGLES < 180'
})
CREATE (p_concave:Property {
  id: 'PROP_ONE_ANGLE_GT_180',
  category: 'angle',
  desc: 'Có đúng 1 góc trong lớn hơn 180° (góc phản), làm cho một đỉnh lõm vào bên trong tứ giác.',
  actionHint: 'Hãy kéo 1 đỉnh lùi sâu vào phần trong của tam giác tạo bởi 3 đỉnh còn lại để tạo góc > 180°.',
  ruleCode: 'EXACTLY_ONE_ANGLE > 180'
})
CREATE (p_1_para:Property {
  id: 'PROP_1_PAIR_PARALLEL',
  category: 'side',
  desc: 'Có đúng 1 cặp cạnh đối song song với nhau (AB // CD hoặc BC // DA).',
  actionHint: 'Hãy di chuyển đỉnh C hoặc D sao cho cạnh đáy CD nằm ngang song song với cạnh AB, nhưng cạnh bên BC không song song với AD.',
  ruleCode: 'PARALLEL_PAIRS == 1'
})
CREATE (p_at_least_1_para:Property {
  id: 'PROP_AT_LEAST_1_PAIR_PARALLEL',
  category: 'side',
  desc: 'Có ít nhất 1 cặp cạnh đối song song với nhau.',
  actionHint: 'Hãy căn chỉnh 2 đỉnh của một cạnh sao cho cùng phương (cùng dòng lưới ngang hoặc dọc) với cạnh đối diện.',
  ruleCode: 'PARALLEL_PAIRS >= 1'
})
CREATE (p_2_para:Property {
  id: 'PROP_2_PAIRS_PARALLEL',
  category: 'side',
  desc: 'Có 2 cặp cạnh đối song song với nhau (AB // CD và BC // DA).',
  actionHint: 'Hãy di chuyển đỉnh C sao cho vector BC bằng vector AD (cạnh AB song song CD và cạnh BC song song AD).',
  ruleCode: 'PARALLEL_PAIRS == 2'
})
CREATE (p_opp_sides_eq:Property {
  id: 'PROP_2_PAIRS_OPPOSITE_SIDES_EQUAL',
  category: 'side',
  desc: 'Các cạnh đối bằng nhau từng đôi một (AB = CD và BC = DA).',
  actionHint: 'Hãy điều chỉnh độ dài trên lưới sao cho cạnh CD dài đúng bằng AB và cạnh BC dài đúng bằng AD.',
  ruleCode: 'AB == CD && BC == DA'
})
CREATE (p_4_sides_eq:Property {
  id: 'PROP_4_EQUAL_SIDES',
  category: 'side',
  desc: 'Cả 4 cạnh của tứ giác có độ dài bằng nhau (AB = BC = CD = DA).',
  actionHint: 'Hãy kéo các đỉnh đối xứng trên lưới sao cho độ dài 4 cạnh AB, BC, CD, DA bằng nhau tuyệt đối.',
  ruleCode: 'AB == BC == CD == DA'
})
CREATE (p_1_right:Property {
  id: 'PROP_1_RIGHT_ANGLE',
  category: 'angle',
  desc: 'Có ít nhất 1 góc trong là góc vuông (bằng 90°).',
  actionHint: 'Hãy bật Snap-to-grid và kéo đỉnh tạo góc vuông 90° giữa hai cạnh kề (thẳng hàng theo trục dọc và ngang của lưới).',
  ruleCode: 'RIGHT_ANGLES >= 1'
})
CREATE (p_4_right:Property {
  id: 'PROP_4_RIGHT_ANGLES',
  category: 'angle',
  desc: 'Cả 4 góc trong của tứ giác đều là góc vuông (A = B = C = D = 90°).',
  actionHint: 'Hãy căn chỉnh cả 4 đỉnh nằm trên các giao điểm tạo thành góc vuông 90° ở mọi đỉnh A, B, C, D.',
  ruleCode: 'RIGHT_ANGLES == 4'
})
CREATE (p_base_angles_eq:Property {
  id: 'PROP_BASE_ANGLES_EQUAL',
  category: 'angle',
  desc: 'Hai góc kề một cạnh đáy của hình thang bằng nhau.',
  actionHint: 'Hãy điều chỉnh hai cạnh bên nghiêng đều đối xứng nhau qua trục giữa để 2 góc kề đáy bằng nhau.',
  ruleCode: 'TRAPEZOID_BASE_ANGLES_EQUAL'
})
CREATE (p_diag_eq:Property {
  id: 'PROP_DIAGONALS_EQUAL',
  category: 'diag',
  desc: 'Hai đường chéo có độ dài bằng nhau (AC = BD).',
  actionHint: 'Hãy cân chỉnh hình đối xứng để hai đường chéo AC và BD có độ dài bằng nhau.',
  ruleCode: 'AC == BD'
})
CREATE (p_diag_perp:Property {
  id: 'PROP_DIAGONALS_PERPENDICULAR',
  category: 'diag',
  desc: 'Hai đường chéo vuông góc với nhau tại giao điểm (AC ⊥ BD).',
  actionHint: 'Hãy đặt 4 đỉnh đối xứng qua hai trục vuông góc (dạng viên kim cương hoặc hình vuông) để AC vuông góc với BD.',
  ruleCode: 'AC_PERP_BD'
})
CREATE (p_diag_bisect:Property {
  id: 'PROP_DIAGONALS_BISECT',
  category: 'diag',
  desc: 'Hai đường chéo cắt nhau tại trung điểm của mỗi đường.',
  actionHint: 'Hãy đảm bảo trung điểm của AC trùng khít với trung điểm của BD.',
  ruleCode: 'MIDPOINT(AC) == MIDPOINT(BD)'
});

// 3. KHỞI TẠO 9 LOẠI HÌNH TỨ GIÁC (:Shape) THEO CÂY PHÂN CẤP (RANK 1 -> 10)
CREATE (s_square:Shape {
  id: 'SQUARE',
  name: 'Square',
  vietnameseName: 'Hình vuông',
  rank: 10,
  minSides: 4,
  description: 'Tứ giác có 4 góc vuông và 4 cạnh bằng nhau. Hình vuông vừa là hình chữ nhật, vừa là hình thoi.',
  formulaPerimeter: 'P = 4 × a',
  formulaArea: 'S = a²'
})
CREATE (s_rhombus:Shape {
  id: 'RHOMBUS',
  name: 'Rhombus',
  vietnameseName: 'Hình thoi',
  rank: 8,
  minSides: 4,
  description: 'Tứ giác có 4 cạnh bằng nhau (AB = BC = CD = DA). Hai đường chéo vuông góc và cắt nhau tại trung điểm mỗi đường.',
  formulaPerimeter: 'P = 4 × a',
  formulaArea: 'S = ½ × d₁ × d₂'
})
CREATE (s_rectangle:Shape {
  id: 'RECTANGLE',
  name: 'Rectangle',
  vietnameseName: 'Hình chữ nhật',
  rank: 8,
  minSides: 4,
  description: 'Tứ giác có 4 góc vuông (hoặc là hình bình hành có 1 góc vuông / 2 đường chéo bằng nhau).',
  formulaPerimeter: 'P = 2 × (a + b)',
  formulaArea: 'S = a × b'
})
CREATE (s_parallelogram:Shape {
  id: 'PARALLELOGRAM',
  name: 'Parallelogram',
  vietnameseName: 'Hình bình hành',
  rank: 6,
  minSides: 4,
  description: 'Tứ giác có các cạnh đối song song và bằng nhau, hai đường chéo cắt nhau tại trung điểm mỗi đường.',
  formulaPerimeter: 'P = 2 × (a + b)',
  formulaArea: 'S = a × h'
})
CREATE (s_right_trap:Shape {
  id: 'RIGHT_TRAPEZOID',
  name: 'Right Trapezoid',
  vietnameseName: 'Hình thang vuông',
  rank: 5,
  minSides: 4,
  description: 'Hình thang có một cạnh bên vuông góc với hai đáy (có ít nhất 1 góc vuông).',
  formulaPerimeter: 'P = AB + BC + CD + DA',
  formulaArea: 'S = ½ × (a + b) × h'
})
CREATE (s_iso_trap:Shape {
  id: 'ISOSCELES_TRAPEZOID',
  name: 'Isosceles Trapezoid',
  vietnameseName: 'Hình thang cân',
  rank: 5,
  minSides: 4,
  description: 'Hình thang có hai góc kề một đáy bằng nhau và hai đường chéo bằng nhau (AC = BD).',
  formulaPerimeter: 'P = a + b + 2 × c',
  formulaArea: 'S = ½ × (a + b) × h'
})
CREATE (s_trapezoid:Shape {
  id: 'TRAPEZOID',
  name: 'Trapezoid',
  vietnameseName: 'Hình thang',
  rank: 4,
  minSides: 4,
  description: 'Tứ giác lồi có hai cạnh đối song song với nhau (gọi là hai cạnh đáy).',
  formulaPerimeter: 'P = AB + BC + CD + DA',
  formulaArea: 'S = ½ × (a + b) × h'
})
CREATE (s_convex:Shape {
  id: 'CONVEX_QUADRILATERAL',
  name: 'Convex Quadrilateral',
  vietnameseName: 'Tứ giác lồi thông thường',
  rank: 2,
  minSides: 4,
  description: 'Tứ giác luôn nằm trong một nửa mặt phẳng có bờ là đường thẳng chứa bất kỳ cạnh nào của tứ giác (mọi góc < 180°).',
  formulaPerimeter: 'P = AB + BC + CD + DA',
  formulaArea: 'S = ½ × |(xA·yB - yA·xB) + ...| (Công thức Shoelace)'
})
CREATE (s_concave:Shape {
  id: 'CONCAVE_QUADRILATERAL',
  name: 'Concave Quadrilateral',
  vietnameseName: 'Tứ giác lõm',
  rank: 1,
  minSides: 4,
  description: 'Tứ giác có đúng 1 góc trong lớn hơn 180° (một đỉnh bị lõm vào bên trong).',
  formulaPerimeter: 'P = AB + BC + CD + DA',
  formulaArea: 'S = ½ × |(xA·yB - yA·xB) + ...| (Công thức Shoelace)'
});

// 4. TẠO QUAN HỆ PHẢ HỆ KẾ THỪA ĐA CHIỀU (:Shape)-[:SUBCLASS_OF]->(:Shape)
MATCH (sq:Shape {id: 'SQUARE'}),
      (rh:Shape {id: 'RHOMBUS'}),
      (rc:Shape {id: 'RECTANGLE'}),
      (pa:Shape {id: 'PARALLELOGRAM'}),
      (rt:Shape {id: 'RIGHT_TRAPEZOID'}),
      (it:Shape {id: 'ISOSCELES_TRAPEZOID'}),
      (tr:Shape {id: 'TRAPEZOID'}),
      (cv:Shape {id: 'CONVEX_QUADRILATERAL'})
CREATE (sq)-[:SUBCLASS_OF {inheritanceType: 'multiple', note: 'Hình vuông là hình thoi có 1 góc vuông'}]->(rh)
CREATE (sq)-[:SUBCLASS_OF {inheritanceType: 'multiple', note: 'Hình vuông là hình chữ nhật có 2 cạnh kề bằng nhau'}]->(rc)
CREATE (rh)-[:SUBCLASS_OF {inheritanceType: 'single', note: 'Hình thoi là hình bình hành có 4 cạnh bằng nhau'}]->(pa)
CREATE (rc)-[:SUBCLASS_OF {inheritanceType: 'multiple', note: 'Hình chữ nhật là hình bình hành có 1 góc vuông'}]->(pa)
CREATE (rc)-[:SUBCLASS_OF {inheritanceType: 'multiple', note: 'Hình chữ nhật là hình thang cân có góc vuông'}]->(it)
CREATE (rc)-[:SUBCLASS_OF {inheritanceType: 'multiple', note: 'Hình chữ nhật là hình thang vuông có 2 đáy bằng nhau'}]->(rt)
CREATE (pa)-[:SUBCLASS_OF {inheritanceType: 'single', note: 'Hình bình hành là hình thang có 2 cạnh bên song song'}]->(tr)
CREATE (rt)-[:SUBCLASS_OF {inheritanceType: 'single', note: 'Hình thang vuông kế thừa từ Hình thang'}]->(tr)
CREATE (it)-[:SUBCLASS_OF {inheritanceType: 'single', note: 'Hình thang cân kế thừa từ Hình thang'}]->(tr)
CREATE (tr)-[:SUBCLASS_OF {inheritanceType: 'single', note: 'Hình thang kế thừa từ Tứ giác lồi'}]->(cv);

// 5. TẠO QUAN HỆ CẤU THÀNH TÍNH CHẤT (:Shape)-[:HAS_PROPERTY]->(:Property)
// Lưu ý: Khớp chính xác với Cypher Query 1 & Query 2 trong Hồ sơ Đặc tả SRS
MATCH (sq:Shape {id: 'SQUARE'}),
      (rh:Shape {id: 'RHOMBUS'}),
      (rc:Shape {id: 'RECTANGLE'}),
      (pa:Shape {id: 'PARALLELOGRAM'}),
      (rt:Shape {id: 'RIGHT_TRAPEZOID'}),
      (it:Shape {id: 'ISOSCELES_TRAPEZOID'}),
      (tr:Shape {id: 'TRAPEZOID'}),
      (cv:Shape {id: 'CONVEX_QUADRILATERAL'}),
      (cc:Shape {id: 'CONCAVE_QUADRILATERAL'}),
      (p_convex:Property {id: 'PROP_ALL_ANGLES_LT_180'}),
      (p_concave:Property {id: 'PROP_ONE_ANGLE_GT_180'}),
      (p_1_para:Property {id: 'PROP_1_PAIR_PARALLEL'}),
      (p_2_para:Property {id: 'PROP_2_PAIRS_PARALLEL'}),
      (p_4_sides:Property {id: 'PROP_4_EQUAL_SIDES'}),
      (p_1_right:Property {id: 'PROP_1_RIGHT_ANGLE'}),
      (p_base_eq:Property {id: 'PROP_BASE_ANGLES_EQUAL'}),
      (p_diag_eq:Property {id: 'PROP_DIAGONALS_EQUAL'}),
      (p_diag_perp:Property {id: 'PROP_DIAGONALS_PERPENDICULAR'}),
      (p_diag_bisect:Property {id: 'PROP_DIAGONALS_BISECT'})

// Hình vuông (Rank 10): 2 cặp cạnh // + 4 cạnh bằng nhau + góc vuông
CREATE (sq)-[:HAS_PROPERTY]->(p_convex)
CREATE (sq)-[:HAS_PROPERTY]->(p_2_para)
CREATE (sq)-[:HAS_PROPERTY]->(p_4_sides)
CREATE (sq)-[:HAS_PROPERTY]->(p_1_right)

// Hình thoi (Rank 8): 2 cặp cạnh // + 4 cạnh bằng nhau
CREATE (rh)-[:HAS_PROPERTY]->(p_convex)
CREATE (rh)-[:HAS_PROPERTY]->(p_2_para)
CREATE (rh)-[:HAS_PROPERTY]->(p_4_sides)

// Hình chữ nhật (Rank 8): 2 cặp cạnh // + có ít nhất 1 góc vuông
CREATE (rc)-[:HAS_PROPERTY]->(p_convex)
CREATE (rc)-[:HAS_PROPERTY]->(p_2_para)
CREATE (rc)-[:HAS_PROPERTY]->(p_1_right)

// Hình bình hành (Rank 6): 2 cặp cạnh đối song song
CREATE (pa)-[:HAS_PROPERTY]->(p_convex)
CREATE (pa)-[:HAS_PROPERTY]->(p_2_para)

// Hình thang vuông (Rank 5): Đúng 1 cặp cạnh đối // + có góc vuông
CREATE (rt)-[:HAS_PROPERTY]->(p_convex)
CREATE (rt)-[:HAS_PROPERTY]->(p_1_para)
CREATE (rt)-[:HAS_PROPERTY]->(p_1_right)

// Hình thang cân (Rank 5): Đúng 1 cặp cạnh đối // + 2 góc kề đáy bằng nhau (hoặc 2 đường chéo bằng nhau)
CREATE (it)-[:HAS_PROPERTY]->(p_convex)
CREATE (it)-[:HAS_PROPERTY]->(p_1_para)
CREATE (it)-[:HAS_PROPERTY]->(p_base_eq)
CREATE (it)-[:HAS_PROPERTY]->(p_diag_eq)

// Hình thang (Rank 4): Đúng 1 cặp cạnh đối //
CREATE (tr)-[:HAS_PROPERTY]->(p_convex)
CREATE (tr)-[:HAS_PROPERTY]->(p_1_para)

// Tứ giác lồi thông thường (Rank 2)
CREATE (cv)-[:HAS_PROPERTY]->(p_convex)

// Tứ giác lõm (Rank 1)
CREATE (cc)-[:HAS_PROPERTY]->(p_concave);

// 6. KHỞI TẠO NGÂN HÀNG ĐỊNH LÝ & DẤU HIỆU NHẬN BIẾT SGK TOÁN 8 (:Theorem)
CREATE (th1:Theorem {
  id: 'TH_SUM_ANGLES_360',
  name: 'Định lý tổng các góc của một tứ giác',
  textbookChapter: 'SGK Toán 8 - Chương I, Bài 1: Tứ giác',
  targetShape: 'CONVEX_QUADRILATERAL',
  proofExplanation: 'Chia tứ giác ABCD thành 2 tam giác ABC và ADC bởi đường chéo AC. Tổng 3 góc trong mỗi tam giác bằng 180°, do đó tổng 4 góc Â + B̂ + Ĉ + D̂ = 180° + 180° = 360°.'
})
CREATE (th2:Theorem {
  id: 'TH_TRAPEZOID_DEF',
  name: 'Định nghĩa và Dấu hiệu nhận biết Hình thang',
  textbookChapter: 'SGK Toán 8 - Chương I, Bài 2: Hình thang',
  targetShape: 'TRAPEZOID',
  proofExplanation: 'Tứ giác lồi ABCD có một cặp cạnh đối song song (AB // CD hoặc BC // AD) thì tứ giác đó là Hình thang. Hai góc kề một cạnh bên bù nhau (tổng bằng 180°).'
})
CREATE (th3:Theorem {
  id: 'TH_RIGHT_TRAPEZOID',
  name: 'Dấu hiệu nhận biết Hình thang vuông',
  textbookChapter: 'SGK Toán 8 - Chương I, Bài 2: Hình thang',
  targetShape: 'RIGHT_TRAPEZOID',
  proofExplanation: 'Hình thang có một góc vuông (một cạnh bên vuông góc với hai đáy) thì góc kề còn lại của cạnh bên đó cũng bằng 90°, suy ra hình đó là Hình thang vuông.'
})
CREATE (th4:Theorem {
  id: 'TH_ISO_TRAPEZOID',
  name: 'Dấu hiệu nhận biết Hình thang cân',
  textbookChapter: 'SGK Toán 8 - Chương I, Bài 3: Hình thang cân',
  targetShape: 'ISOSCELES_TRAPEZOID',
  proofExplanation: 'Hình thang có hai góc kề một đáy bằng nhau, hoặc có hai đường chéo bằng nhau (AC = BD) thì đó là Hình thang cân. Trong hình thang cân, hai cạnh bên bằng nhau.'
})
CREATE (th5:Theorem {
  id: 'TH_PARALLELOGRAM',
  name: 'Dấu hiệu nhận biết Hình bình hành',
  textbookChapter: 'SGK Toán 8 - Chương I, Bài 7: Hình bình hành',
  targetShape: 'PARALLELOGRAM',
  proofExplanation: 'Tứ giác có các cạnh đối song song (AB // CD và BC // AD), hoặc các cạnh đối bằng nhau, hoặc hai đường chéo cắt nhau tại trung điểm của mỗi đường là Hình bình hành.'
})
CREATE (th6:Theorem {
  id: 'TH_RECTANGLE',
  name: 'Dấu hiệu nhận biết Hình chữ nhật',
  textbookChapter: 'SGK Toán 8 - Chương I, Bài 9: Hình chữ nhật',
  targetShape: 'RECTANGLE',
  proofExplanation: 'Hình bình hành có 1 góc vuông (hoặc có hai đường chéo bằng nhau AC = BD), hoặc tứ giác có 3 góc vuông là Hình chữ nhật.'
})
CREATE (th7:Theorem {
  id: 'TH_RHOMBUS',
  name: 'Dấu hiệu nhận biết Hình thoi',
  textbookChapter: 'SGK Toán 8 - Chương I, Bài 11: Hình thoi',
  targetShape: 'RHOMBUS',
  proofExplanation: 'Tứ giác có 4 cạnh bằng nhau (AB = BC = CD = DA), hoặc hình bình hành có hai đường chéo vuông góc với nhau (AC ⊥ BD) là Hình thoi.'
})
CREATE (th8:Theorem {
  id: 'TH_SQUARE',
  name: 'Dấu hiệu nhận biết Hình vuông (Đa kế thừa)',
  textbookChapter: 'SGK Toán 8 - Chương I, Bài 12: Hình vuông',
  targetShape: 'SQUARE',
  proofExplanation: 'Hình chữ nhật có 2 cạnh kề bằng nhau (hoặc 2 đường chéo vuông góc), hoặc Hình thoi có 1 góc vuông (hoặc 2 đường chéo bằng nhau) là Hình vuông.'
});

// Liên kết (:Theorem)-[:REQUIRES]->(:Property) và (:Theorem)-[:CONCLUDES]->(:Shape)
MATCH (th1:Theorem {id: 'TH_SUM_ANGLES_360'}), (s_cv:Shape {id: 'CONVEX_QUADRILATERAL'}), (p_cv:Property {id: 'PROP_ALL_ANGLES_LT_180'})
CREATE (th1)-[:REQUIRES]->(p_cv), (th1)-[:CONCLUDES]->(s_cv);

MATCH (th2:Theorem {id: 'TH_TRAPEZOID_DEF'}), (s_tr:Shape {id: 'TRAPEZOID'}), (p_1p:Property {id: 'PROP_1_PAIR_PARALLEL'})
CREATE (th2)-[:REQUIRES]->(p_1p), (th2)-[:CONCLUDES]->(s_tr);

MATCH (th3:Theorem {id: 'TH_RIGHT_TRAPEZOID'}), (s_rt:Shape {id: 'RIGHT_TRAPEZOID'}), (p_1p:Property {id: 'PROP_1_PAIR_PARALLEL'}), (p_1r:Property {id: 'PROP_1_RIGHT_ANGLE'})
CREATE (th3)-[:REQUIRES]->(p_1p), (th3)-[:REQUIRES]->(p_1r), (th3)-[:CONCLUDES]->(s_rt);

MATCH (th4:Theorem {id: 'TH_ISO_TRAPEZOID'}), (s_it:Shape {id: 'ISOSCELES_TRAPEZOID'}), (p_1p:Property {id: 'PROP_1_PAIR_PARALLEL'}), (p_base:Property {id: 'PROP_BASE_ANGLES_EQUAL'}), (p_deq:Property {id: 'PROP_DIAGONALS_EQUAL'})
CREATE (th4)-[:REQUIRES]->(p_1p), (th4)-[:REQUIRES]->(p_base), (th4)-[:REQUIRES]->(p_deq), (th4)-[:CONCLUDES]->(s_it);

MATCH (th5:Theorem {id: 'TH_PARALLELOGRAM'}), (s_pa:Shape {id: 'PARALLELOGRAM'}), (p_2p:Property {id: 'PROP_2_PAIRS_PARALLEL'})
CREATE (th5)-[:REQUIRES]->(p_2p), (th5)-[:CONCLUDES]->(s_pa);

MATCH (th6:Theorem {id: 'TH_RECTANGLE'}), (s_rc:Shape {id: 'RECTANGLE'}), (p_2p:Property {id: 'PROP_2_PAIRS_PARALLEL'}), (p_1r:Property {id: 'PROP_1_RIGHT_ANGLE'})
CREATE (th6)-[:REQUIRES]->(p_2p), (th6)-[:REQUIRES]->(p_1r), (th6)-[:CONCLUDES]->(s_rc);

MATCH (th7:Theorem {id: 'TH_RHOMBUS'}), (s_rh:Shape {id: 'RHOMBUS'}), (p_2p:Property {id: 'PROP_2_PAIRS_PARALLEL'}), (p_4s:Property {id: 'PROP_4_EQUAL_SIDES'})
CREATE (th7)-[:REQUIRES]->(p_2p), (th7)-[:REQUIRES]->(p_4s), (th7)-[:CONCLUDES]->(s_rh);

MATCH (th8:Theorem {id: 'TH_SQUARE'}), (s_sq:Shape {id: 'SQUARE'}), (p_2p:Property {id: 'PROP_2_PAIRS_PARALLEL'}), (p_4s:Property {id: 'PROP_4_EQUAL_SIDES'}), (p_1r:Property {id: 'PROP_1_RIGHT_ANGLE'})
CREATE (th8)-[:REQUIRES]->(p_2p), (th8)-[:REQUIRES]->(p_4s), (th8)-[:REQUIRES]->(p_1r), (th8)-[:CONCLUDES]->(s_sq);

// 7. KHỞI TẠO HỆ THỐNG BÀI TẬP DỰNG HÌNH & TRẮC NGHIỆM (:Exercise)
CREATE (ex1:Exercise {
  id: 'EX_CONSTRUCT_SQUARE',
  type: 'CONSTRUCTION',
  title: 'Bài 1: Dựng Hình vuông ABCD trên lưới tọa độ',
  difficultyLevel: 'Cơ bản',
  targetShape: 'SQUARE',
  tolerance: 0.05,
  prompt: 'Hãy kéo thả 4 đỉnh A, B, C, D trên mặt phẳng Canvas để tạo thành một Hình vuông hợp lệ (có 4 cạnh bằng nhau và 4 góc vuông 90°).',
  sampleVertices: '{"A":{"x":240,"y":120},"B":{"x":480,"y":120},"C":{"x":480,"y":360},"D":{"x":240,"y":360}}'
})
CREATE (ex2:Exercise {
  id: 'EX_CONSTRUCT_RECTANGLE',
  type: 'CONSTRUCTION',
  title: 'Bài 2: Biến đổi tứ giác thành Hình chữ nhật ABCD',
  difficultyLevel: 'Cơ bản',
  targetShape: 'RECTANGLE',
  tolerance: 0.05,
  prompt: 'Hãy điều chỉnh các đỉnh để tứ giác ABCD trở thành Hình chữ nhật (có 2 cặp cạnh đối song song, 4 góc vuông và hai cạnh kề khác độ dài nhau).',
  sampleVertices: '{"A":{"x":160,"y":160},"B":{"x":520,"y":160},"C":{"x":520,"y":360},"D":{"x":160,"y":360}}'
})
CREATE (ex3:Exercise {
  id: 'EX_CONSTRUCT_RHOMBUS',
  type: 'CONSTRUCTION',
  title: 'Bài 3: Dựng Hình thoi ABCD có 2 đường chéo vuông góc',
  difficultyLevel: 'Trung bình',
  targetShape: 'RHOMBUS',
  tolerance: 0.05,
  prompt: 'Hãy đặt 4 đỉnh A, B, C, D đối xứng nhau qua hai trục để tạo thành một Hình thoi (4 cạnh bằng nhau nhưng không có góc vuông).',
  sampleVertices: '{"A":{"x":360,"y":80},"B":{"x":560,"y":240},"C":{"x":360,"y":400},"D":{"x":160,"y":240}}'
})
CREATE (ex4:Exercise {
  id: 'EX_CONSTRUCT_PARALLELOGRAM',
  type: 'CONSTRUCTION',
  title: 'Bài 4: Dựng Hình bình hành ABCD từ 2 cặp cạnh song song',
  difficultyLevel: 'Trung bình',
  targetShape: 'PARALLELOGRAM',
  tolerance: 0.05,
  prompt: 'Hãy kéo thả các đỉnh sao cho AB song song và bằng CD, BC song song và bằng AD (không có góc vuông và 2 cạnh kề không bằng nhau).',
  sampleVertices: '{"A":{"x":240,"y":120},"B":{"x":560,"y":120},"C":{"x":480,"y":360},"D":{"x":160,"y":360}}'
})
CREATE (ex5:Exercise {
  id: 'EX_CONSTRUCT_ISO_TRAPEZOID',
  type: 'CONSTRUCTION',
  title: 'Bài 5: Dựng Hình thang cân ABCD có hai đường chéo bằng nhau',
  difficultyLevel: 'Nâng cao',
  targetShape: 'ISOSCELES_TRAPEZOID',
  tolerance: 0.05,
  prompt: 'Hãy dựng Hình thang cân ABCD với hai đáy song song (AB // CD) và hai cạnh bên nghiêng đối xứng để AC = BD.',
  sampleVertices: '{"A":{"x":240,"y":120},"B":{"x":480,"y":120},"C":{"x":560,"y":360},"D":{"x":160,"y":360}}'
})
CREATE (ex6:Exercise {
  id: 'EX_CONSTRUCT_RIGHT_TRAPEZOID',
  type: 'CONSTRUCTION',
  title: 'Bài 6: Dựng Hình thang vuông ABCD',
  difficultyLevel: 'Cơ bản',
  targetShape: 'RIGHT_TRAPEZOID',
  tolerance: 0.05,
  prompt: 'Hãy dựng Hình thang vuông ABCD có đúng 1 cặp cạnh đối song song và 1 cạnh bên vuông góc với hai đáy.',
  sampleVertices: '{"A":{"x":200,"y":120},"B":{"x":440,"y":120},"C":{"x":560,"y":360},"D":{"x":200,"y":360}}'
})

// Bài tập Trắc nghiệm Lý thuyết liên kết Đồ thị (:Exercise {type: 'QUIZ'})
CREATE (q1:Exercise {
  id: 'QUIZ_01_SQUARE_INHERITANCE',
  type: 'QUIZ',
  title: 'Câu 1: Quan hệ đa kế thừa của Hình vuông trong Đồ thị Tri thức',
  difficultyLevel: 'Cơ bản',
  targetShape: 'SQUARE',
  tolerance: 0,
  question: 'Theo cây phả hệ tứ giác (SGK Toán 8), một Hình bình hành cần thêm điều kiện nào sau đây để trở thành Hình chữ nhật?',
  options: '["A. Có hai cạnh đối bằng nhau","B. Có một góc vuông (hoặc hai đường chéo bằng nhau)","C. Có hai đường chéo cắt nhau tại trung điểm mỗi đường","D. Có tổng 4 góc bằng 360°"]',
  correctAnswer: 1,
  theoremId: 'TH_RECTANGLE'
})
CREATE (q2:Exercise {
  id: 'QUIZ_02_RHOMBUS_DIAG',
  type: 'QUIZ',
  title: 'Câu 2: Dấu hiệu nhận biết Hình thoi qua đường chéo',
  difficultyLevel: 'Trung bình',
  targetShape: 'RHOMBUS',
  tolerance: 0,
  question: 'Cho Hình bình hành ABCD. Nếu hai đường chéo AC và BD vuông góc với nhau (AC ⊥ BD) thì tứ giác ABCD là hình gì?',
  options: '["A. Hình thang vuông","B. Hình chữ nhật","C. Hình thoi","D. Hình thang cân"]',
  correctAnswer: 2,
  theoremId: 'TH_RHOMBUS'
})
CREATE (q3:Exercise {
  id: 'QUIZ_03_ISO_TRAPEZOID',
  type: 'QUIZ',
  title: 'Câu 3: Đặc trưng nhận diện Hình thang cân',
  difficultyLevel: 'Trung bình',
  targetShape: 'ISOSCELES_TRAPEZOID',
  tolerance: 0,
  question: 'Khẳng định nào sau đây là ĐÚNG khi chứng minh một Hình thang là Hình thang cân?',
  options: '["A. Hình thang có hai cạnh bên bằng nhau là hình thang cân","B. Hình thang có hai đường chéo bằng nhau (hoặc 2 góc kề 1 đáy bằng nhau) là hình thang cân","C. Hình thang có một góc vuông là hình thang cân","D. Hình thang có hai đáy bằng nhau là hình thang cân"]',
  correctAnswer: 1,
  theoremId: 'TH_ISO_TRAPEZOID'
})
CREATE (q4:Exercise {
  id: 'QUIZ_04_MULTI_INHERITANCE',
  type: 'QUIZ',
  title: 'Câu 4: Đỉnh hội tụ đa kế thừa (Hình thoi + Hình chữ nhật)',
  difficultyLevel: 'Nâng cao',
  targetShape: 'SQUARE',
  tolerance: 0,
  question: 'Trong đồ thị tri thức Neo4j, Node (:Shape) nào vừa kế thừa từ Hình thoi (:RHOMBUS) vừa kế thừa từ Hình chữ nhật (:RECTANGLE)?',
  options: '["A. Hình bình hành (Parallelogram)","B. Hình thang cân (Isosceles Trapezoid)","C. Hình vuông (Square)","D. Tứ giác lồi (Convex Quadrilateral)"]',
  correctAnswer: 2,
  theoremId: 'TH_SQUARE'
})
CREATE (q5:Exercise {
  id: 'QUIZ_05_ANGLE_SUM',
  type: 'QUIZ',
  title: 'Câu 5: Định lý tổng 4 góc trong tứ giác lồi',
  difficultyLevel: 'Cơ bản',
  targetShape: 'CONVEX_QUADRILATERAL',
  tolerance: 0,
  question: 'Cho tứ giác lồi ABCD có Â = 110°, B̂ = 90°, Ĉ = 85°. Số đo góc D̂ bằng bao nhiêu độ?',
  options: '["A. 65°","B. 75°","C. 85°","D. 95°"]',
  correctAnswer: 1,
  theoremId: 'TH_SUM_ANGLES_360'
});

// Liên kết (:Exercise)-[:TARGETS]->(:Shape)
MATCH (e:Exercise), (s:Shape)
WHERE e.targetShape = s.id
CREATE (e)-[:TARGETS]->(s);

// 8. KHỞI TẠO TÀI KHOẢN NGƯỜI DÙNG MẪU (:User) & LỊCH SỬ HỌC TẬP (:SOLVED)
CREATE (u1:User {
  id: 'USR_STUDENT_01',
  username: 'Đỗ Thành Trung',
  email: 'trung@student.edu.vn',
  passwordHash: '123456',
  role: 'student',
  className: 'Lớp 8A1',
  createdAt: '2026-10-05T08:00:00Z'
})
CREATE (u2:User {
  id: 'USR_STUDENT_02',
  username: 'Nguyễn Minh Anh',
  email: 'minhanh@student.edu.vn',
  passwordHash: '123456',
  role: 'student',
  className: 'Lớp 8A1',
  createdAt: '2026-10-05T08:30:00Z'
})
CREATE (u3:User {
  id: 'USR_TEACHER_01',
  username: 'Thầy Trần Bình',
  email: 'tranbinh@uit.edu.vn',
  passwordHash: 'admin123',
  role: 'teacher',
  className: 'Giảng viên Hướng dẫn',
  createdAt: '2026-10-01T07:00:00Z'
});

// Tạo dữ liệu mẫu lưu vết học tập (:User)-[:SOLVED]->(:Exercise)
MATCH (u1:User {id: 'USR_STUDENT_01'}),
      (ex1:Exercise {id: 'EX_CONSTRUCT_SQUARE'}),
      (ex2:Exercise {id: 'EX_CONSTRUCT_RECTANGLE'}),
      (q1:Exercise {id: 'QUIZ_01_SQUARE_INHERITANCE'}),
      (q4:Exercise {id: 'QUIZ_04_MULTI_INHERITANCE'})
CREATE (u1)-[:SOLVED {score: 100, attemptCount: 1, completionTime: 24, solvedAt: '2026-10-10T09:15:00Z'}]->(ex1)
CREATE (u1)-[:SOLVED {score: 100, attemptCount: 2, completionTime: 35, solvedAt: '2026-10-10T09:22:00Z'}]->(ex2)
CREATE (u1)-[:SOLVED {score: 100, attemptCount: 1, completionTime: 12, solvedAt: '2026-10-10T09:30:00Z'}]->(q1)
CREATE (u1)-[:SOLVED {score: 100, attemptCount: 1, completionTime: 15, solvedAt: '2026-10-10T09:35:00Z'}]->(q4);
