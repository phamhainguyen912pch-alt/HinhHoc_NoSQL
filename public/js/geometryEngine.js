/**
 * Core Geometry Engine (Client-side 2D Vector Algebra & Quadrilateral Classifier)
 * Dự án: Ứng dụng Hỗ trợ Học Toán Hình học phẳng (Chuyên đề Tứ giác) - Nhóm 4
 * Tốc độ tính toán: < 1ms / frame (đảm bảo 60 FPS mượt mà theo NFR-01 & US-04)
 */

(function (global) {
  'use strict';

  const PIXELS_PER_CM = 40.0;

  // Bảng dung sai sai số hình học chuẩn SRS (Mục 3.2 - Geometric Tolerances ε)
  const TOLERANCES = {
    LENGTH_ABS_CM: 0.05,         // |L1 - L2| <= 0.05 cm
    LENGTH_REL: 0.01,            // Sai số tương đối <= 1.0%
    ANGLE_DEG: 0.5,              // |Góc - 90°| <= 0.5°
    PARALLEL_DEG: 0.5,           // Góc lệch 2 vector chỉ phương <= 0.5°
    MIDPOINT_PX: 3.0,            // Khoảng cách trung điểm 2 đường chéo <= 3 px
    COLLINEAR_AREA_CM2: 0.01,    // Diện tích tam giác 3 đỉnh <= 0.01 cm²
    COINCIDENT_PX: 4.0,          // Khoảng cách Euclid giữa 2 đỉnh < 4 px
    SNAP_RADIUS_PX: 10.0         // Bán kính bắt điểm nút lưới = 10 px (trong ngưỡng 8-12 px)
  };

  function distancePx(p1, p2) {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
  }

  function midpoint(p1, p2) {
    return { x: (p1.x + p2.x) / 2.0, y: (p1.y + p2.y) / 2.0 };
  }

  function lengthsEqual(l1Cm, l2Cm) {
    const diff = Math.abs(l1Cm - l2Cm);
    const maxLen = Math.max(l1Cm, l2Cm, 1e-9);
    return diff <= TOLERANCES.LENGTH_ABS_CM || (diff / maxLen) <= TOLERANCES.LENGTH_REL;
  }

  function anglesEqual(a1Deg, a2Deg, tol = TOLERANCES.ANGLE_DEG) {
    return Math.abs(a1Deg - a2Deg) <= tol;
  }

  function isRightAngle(angleDeg) {
    return Math.abs(angleDeg - 90.0) <= TOLERANCES.ANGLE_DEG;
  }

  function areSegmentsParallel(p1, p2, p3, p4) {
    const vx1 = p2.x - p1.x;
    const vy1 = p2.y - p1.y;
    const vx2 = p4.x - p3.x;
    const vy2 = p4.y - p3.y;
    const len1 = Math.hypot(vx1, vy1);
    const len2 = Math.hypot(vx2, vy2);
    if (len1 < 1e-6 || len2 < 1e-6) return false;
    let cosTheta = (vx1 * vx2 + vy1 * vy2) / (len1 * len2);
    cosTheta = Math.max(-1.0, Math.min(1.0, Math.abs(cosTheta)));
    const angleDeg = (Math.acos(cosTheta) * 180.0) / Math.PI;
    return angleDeg <= TOLERANCES.PARALLEL_DEG;
  }

  function areSegmentsPerpendicular(p1, p2, p3, p4) {
    const vx1 = p2.x - p1.x;
    const vy1 = p2.y - p1.y;
    const vx2 = p4.x - p3.x;
    const vy2 = p4.y - p3.y;
    const len1 = Math.hypot(vx1, vy1);
    const len2 = Math.hypot(vx2, vy2);
    if (len1 < 1e-6 || len2 < 1e-6) return false;
    let cosTheta = (vx1 * vx2 + vy1 * vy2) / (len1 * len2);
    cosTheta = Math.max(-1.0, Math.min(1.0, cosTheta));
    const angleDeg = (Math.acos(cosTheta) * 180.0) / Math.PI;
    return Math.abs(angleDeg - 90.0) <= TOLERANCES.ANGLE_DEG;
  }

  function triangleAreaCm2(p1, p2, p3) {
    const areaPx2 = 0.5 * Math.abs(
      p1.x * (p2.y - p3.y) +
      p2.x * (p3.y - p1.y) +
      p3.x * (p1.y - p2.y)
    );
    return areaPx2 / (PIXELS_PER_CM * PIXELS_PER_CM);
  }

  function ccw(p1, p2, p3) {
    return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
  }

  function pointOnSegment(p, a, b) {
    if (Math.abs(ccw(a, b, p)) > 1e-4) return false;
    return (
      p.x >= Math.min(a.x, b.x) - 1e-4 &&
      p.x <= Math.max(a.x, b.x) + 1e-4 &&
      p.y >= Math.min(a.y, b.y) - 1e-4 &&
      p.y <= Math.max(a.y, b.y) + 1e-4
    );
  }

  function segmentsIntersect(p1, p2, p3, p4) {
    const d1 = ccw(p3, p4, p1);
    const d2 = ccw(p3, p4, p2);
    const d3 = ccw(p1, p2, p3);
    const d4 = ccw(p1, p2, p4);

    if (((d1 > 1e-4 && d2 < -1e-4) || (d1 < -1e-4 && d2 > 1e-4)) &&
        ((d3 > 1e-4 && d4 < -1e-4) || (d3 < -1e-4 && d4 > 1e-4))) {
      return true;
    }
    if (pointOnSegment(p1, p3, p4) || pointOnSegment(p2, p3, p4)) return true;
    if (pointOnSegment(p3, p1, p2) || pointOnSegment(p4, p1, p2)) return true;
    return false;
  }

  /**
   * Bắt điểm vào nút lưới tọa độ trong bán kính 10px (US-07 / FR-02)
   */
  function snapPointToGrid(pt, gridSize = PIXELS_PER_CM, snapRadius = TOLERANCES.SNAP_RADIUS_PX) {
    const nx = Math.round(pt.x / gridSize) * gridSize;
    const ny = Math.round(pt.y / gridSize) * gridSize;
    const dist = Math.hypot(pt.x - nx, pt.y - ny);
    if (dist <= snapRadius) {
      return { x: nx, y: ny, snapped: true };
    }
    return { x: pt.x, y: pt.y, snapped: false };
  }

  /**
   * Hỗ trợ bắt góc vuông 90° (Snap-to-90°) khi kéo đỉnh
   */
  function snapPointToRightAngle(movingKey, pt, vertices, snapDistPx = 8.0) {
    const order = ['A', 'B', 'C', 'D'];
    const idx = order.indexOf(movingKey);
    if (idx === -1) return pt;
    const prevPoint = vertices[order[(idx + 3) % 4]];
    const nextPoint = vertices[order[(idx + 1) % 4]];

    let result = { x: pt.x, y: pt.y };
    if (Math.abs(pt.x - prevPoint.x) <= snapDistPx) result.x = prevPoint.x;
    else if (Math.abs(pt.x - nextPoint.x) <= snapDistPx) result.x = nextPoint.x;

    if (Math.abs(pt.y - prevPoint.y) <= snapDistPx) result.y = prevPoint.y;
    else if (Math.abs(pt.y - nextPoint.y) <= snapDistPx) result.y = nextPoint.y;

    return result;
  }

  /**
   * Cây phân cấp 9 loại tứ giác chuẩn Mục 3.4 SRS (Rank 10 -> Rank 1)
   */
  const SHAPE_HIERARCHY = [
    {
      id: 'SQUARE',
      name: 'Square',
      vietnameseName: 'Hình vuông',
      rank: 10,
      required: ['PROP_ALL_ANGLES_LT_180', 'PROP_2_PAIRS_PARALLEL', 'PROP_4_EQUAL_SIDES', 'PROP_1_RIGHT_ANGLE'],
      confidence: 1.0,
      badgeColor: '#4f46e5',
      formulaPerimeter: 'P = 4 × a',
      formulaArea: 'S = a²',
      subclassOf: ['Hình thoi (Rank 8)', 'Hình chữ nhật (Rank 8)'],
      description: 'Tứ giác có 4 góc vuông và 4 cạnh bằng nhau. Hình vuông vừa là hình chữ nhật, vừa là hình thoi.'
    },
    {
      id: 'RHOMBUS',
      name: 'Rhombus',
      vietnameseName: 'Hình thoi',
      rank: 8,
      required: ['PROP_ALL_ANGLES_LT_180', 'PROP_2_PAIRS_PARALLEL', 'PROP_4_EQUAL_SIDES'],
      confidence: 0.99,
      badgeColor: '#7c3aed',
      formulaPerimeter: 'P = 4 × a',
      formulaArea: 'S = ½ × AC × BD',
      subclassOf: ['Hình bình hành (Rank 6)'],
      description: 'Tứ giác có 4 cạnh bằng nhau (AB = BC = CD = DA). Hai đường chéo vuông góc tại trung điểm mỗi đường.'
    },
    {
      id: 'RECTANGLE',
      name: 'Rectangle',
      vietnameseName: 'Hình chữ nhật',
      rank: 8,
      required: ['PROP_ALL_ANGLES_LT_180', 'PROP_2_PAIRS_PARALLEL', 'PROP_1_RIGHT_ANGLE'],
      confidence: 0.99,
      badgeColor: '#0284c7',
      formulaPerimeter: 'P = 2 × (a + b)',
      formulaArea: 'S = a × b',
      subclassOf: ['Hình bình hành (Rank 6)', 'Hình thang cân (Rank 5)', 'Hình thang vuông (Rank 5)'],
      description: 'Tứ giác có 4 góc vuông (hoặc là hình bình hành có 1 góc vuông / 2 đường chéo bằng nhau).'
    },
    {
      id: 'PARALLELOGRAM',
      name: 'Parallelogram',
      vietnameseName: 'Hình bình hành',
      rank: 6,
      required: ['PROP_ALL_ANGLES_LT_180', 'PROP_2_PAIRS_PARALLEL'],
      confidence: 0.98,
      badgeColor: '#0d9488',
      formulaPerimeter: 'P = 2 × (a + b)',
      formulaArea: 'S = a × h',
      subclassOf: ['Hình thang (Rank 4)'],
      description: 'Tứ giác có 2 cặp cạnh đối song song và bằng nhau, hai đường chéo cắt nhau tại trung điểm mỗi đường.'
    },
    {
      id: 'RIGHT_TRAPEZOID',
      name: 'Right Trapezoid',
      vietnameseName: 'Hình thang vuông',
      rank: 5,
      required: ['PROP_ALL_ANGLES_LT_180', 'PROP_1_PAIR_PARALLEL', 'PROP_1_RIGHT_ANGLE'],
      confidence: 0.97,
      badgeColor: '#d97706',
      formulaPerimeter: 'P = AB + BC + CD + DA',
      formulaArea: 'S = ½ × (a + b) × h',
      subclassOf: ['Hình thang (Rank 4)'],
      description: 'Hình thang có một cạnh bên vuông góc với hai đáy (có ít nhất 1 góc vuông 90°).'
    },
    {
      id: 'ISOSCELES_TRAPEZOID',
      name: 'Isosceles Trapezoid',
      vietnameseName: 'Hình thang cân',
      rank: 5,
      required: ['PROP_ALL_ANGLES_LT_180', 'PROP_1_PAIR_PARALLEL', 'PROP_BASE_ANGLES_EQUAL', 'PROP_DIAGONALS_EQUAL'],
      confidence: 0.97,
      badgeColor: '#ea580c',
      formulaPerimeter: 'P = a + b + 2 × c',
      formulaArea: 'S = ½ × (a + b) × h',
      subclassOf: ['Hình thang (Rank 4)'],
      description: 'Hình thang có hai góc kề một đáy bằng nhau và hai đường chéo bằng nhau (AC = BD).'
    },
    {
      id: 'TRAPEZOID',
      name: 'Trapezoid',
      vietnameseName: 'Hình thang',
      rank: 4,
      required: ['PROP_ALL_ANGLES_LT_180', 'PROP_1_PAIR_PARALLEL'],
      confidence: 0.96,
      badgeColor: '#ca8a04',
      formulaPerimeter: 'P = AB + BC + CD + DA',
      formulaArea: 'S = ½ × (a + b) × h',
      subclassOf: ['Tứ giác lồi thông thường (Rank 2)'],
      description: 'Tứ giác lồi có đúng 1 cặp cạnh đối song song với nhau (hai cạnh đáy).'
    },
    {
      id: 'CONVEX_QUADRILATERAL',
      name: 'Convex Quadrilateral',
      vietnameseName: 'Tứ giác lồi thông thường',
      rank: 2,
      required: ['PROP_ALL_ANGLES_LT_180'],
      confidence: 0.95,
      badgeColor: '#16a34a',
      formulaPerimeter: 'P = AB + BC + CD + DA',
      formulaArea: 'S = ½ × |(xA·yB - yA·xB) + ...|',
      subclassOf: [],
      description: 'Tứ giác lồi có cả 4 góc trong đều nhỏ hơn 180° và tổng 4 góc bằng 360°.'
    },
    {
      id: 'CONCAVE_QUADRILATERAL',
      name: 'Concave Quadrilateral',
      vietnameseName: 'Tứ giác lõm',
      rank: 1,
      required: ['PROP_ONE_ANGLE_GT_180'],
      confidence: 0.95,
      badgeColor: '#64748b',
      formulaPerimeter: 'P = AB + BC + CD + DA',
      formulaArea: 'S = ½ × |(xA·yB - yA·xB) + ...|',
      subclassOf: [],
      description: 'Tứ giác có đúng 1 góc trong lớn hơn 180° (một đỉnh bị lõm vào bên trong).'
    }
  ];

  const PROPERTY_LABELS = {
    PROP_ALL_ANGLES_LT_180: 'Mọi góc trong < 180° (Tứ giác lồi)',
    PROP_ONE_ANGLE_GT_180: 'Có đúng 1 góc trong > 180° (Tứ giác lõm)',
    PROP_1_PAIR_PARALLEL: 'Có đúng 1 cặp cạnh đối song song',
    PROP_AT_LEAST_1_PAIR_PARALLEL: 'Có ít nhất 1 cặp cạnh đối song song',
    PROP_2_PAIRS_PARALLEL: 'Có 2 cặp cạnh đối song song (AB // CD, BC // DA)',
    PROP_2_PAIRS_OPPOSITE_SIDES_EQUAL: 'Các cặp cạnh đối bằng nhau (AB = CD, BC = DA)',
    PROP_4_EQUAL_SIDES: '4 cạnh bằng nhau (AB = BC = CD = DA)',
    PROP_1_RIGHT_ANGLE: 'Có ít nhất 1 góc vuông (90°)',
    PROP_4_RIGHT_ANGLES: 'Cả 4 góc đều là góc vuông (90°)',
    PROP_BASE_ANGLES_EQUAL: 'Hai góc kề một đáy bằng nhau',
    PROP_DIAGONALS_EQUAL: 'Hai đường chéo bằng nhau (AC = BD)',
    PROP_DIAGONALS_PERPENDICULAR: 'Hai đường chéo vuông góc (AC ⊥ BD)',
    PROP_DIAGONALS_BISECT: 'Hai đường chéo cắt nhau tại trung điểm mỗi đường'
  };

  function classifyByProperties(detectedProps) {
    const set = new Set(detectedProps);
    for (const item of SHAPE_HIERARCHY) {
      if (item.required.every(req => set.has(req))) {
        return { ...item };
      }
    }
    return { ...SHAPE_HIERARCHY[7] };
  }

  /**
   * Phân tích toàn diện tứ giác ABCD trong < 1ms
   */
  function analyzeQuadrilateral(vertices) {
    const t0 = performance.now();
    const { A, B, C, D } = vertices;
    const ordered = [A, B, C, D];
    const names = ['A', 'B', 'C', 'D'];

    // 1. Kiểm tra 2 đỉnh trùng nhau (< 4px) -> INVALID_DEGENERATE (US-03)
    for (let i = 0; i < 4; i++) {
      for (let j = i + 1; j < 4; j++) {
        if (distancePx(ordered[i], ordered[j]) < TOLERANCES.COINCIDENT_PX) {
          return {
            status: 'INVALID_DEGENERATE',
            isValid: false,
            computeTimeMs: +(performance.now() - t0).toFixed(3),
            errorReason: `Hình suy biến không hợp lệ: Hai đỉnh ${names[i]} và ${names[j]} trùng nhau (khoảng cách < 4px).`,
            detectedPropertyIds: [],
            classification: null
          };
        }
      }
    }

    // 2. Kiểm tra 3 điểm thẳng hàng (diện tích tam giác <= 0.01 cm²) -> INVALID_DEGENERATE (US-03)
    const triplets = [
      ['ABC', A, B, C],
      ['BCD', B, C, D],
      ['CDA', C, D, A],
      ['DAB', D, A, B]
    ];
    for (const [label, p1, p2, p3] of triplets) {
      if (triangleAreaCm2(p1, p2, p3) <= TOLERANCES.COLLINEAR_AREA_CM2) {
        return {
          status: 'INVALID_DEGENERATE',
          isValid: false,
          computeTimeMs: +(performance.now() - t0).toFixed(3),
          errorReason: `Hình suy biến không hợp lệ: Ba đỉnh ${label} thẳng hàng (SΔ ≤ 0.01 cm²).`,
          detectedPropertyIds: [],
          classification: null
        };
      }
    }

    // 3. Kiểm tra tứ giác tự cắt (AB cắt CD hoặc BC cắt DA) -> INVALID_SELF_INTERSECTING (US-02)
    const abCutsCd = segmentsIntersect(A, B, C, D);
    const bcCutsDa = segmentsIntersect(B, C, D, A);
    if (abCutsCd || bcCutsDa) {
      const pairText = abCutsCd ? 'cạnh AB cắt cạnh CD' : 'cạnh BC cắt cạnh DA';
      return {
        status: 'INVALID_SELF_INTERSECTING',
        isValid: false,
        computeTimeMs: +(performance.now() - t0).toFixed(3),
        errorReason: `Tứ giác tự cắt không hợp lệ (${pairText}). Hãy kéo đỉnh để các cạnh đối không cắt nhau!`,
        detectedPropertyIds: [],
        classification: null
      };
    }

    // 4. Tính độ dài 4 cạnh & 2 đường chéo (cm)
    const abCm = distancePx(A, B) / PIXELS_PER_CM;
    const bcCm = distancePx(B, C) / PIXELS_PER_CM;
    const cdCm = distancePx(C, D) / PIXELS_PER_CM;
    const daCm = distancePx(D, A) / PIXELS_PER_CM;
    const acCm = distancePx(A, C) / PIXELS_PER_CM;
    const bdCm = distancePx(B, D) / PIXELS_PER_CM;

    const sidesCm = {
      AB: +abCm.toFixed(2),
      BC: +bcCm.toFixed(2),
      CD: +cdCm.toFixed(2),
      DA: +daCm.toFixed(2)
    };
    const diagonalsCm = {
      AC: +acCm.toFixed(2),
      BD: +bdCm.toFixed(2)
    };
    const perimeterCm = +(abCm + bcCm + cdCm + daCm).toFixed(2);

    // 5. Tính diện tích có dấu (Signed Shoelace Formula)
    const signedAreaPx2 = 0.5 * (
      (A.x * B.y - B.x * A.y) +
      (B.x * C.y - C.x * B.y) +
      (C.x * D.y - D.x * C.y) +
      (D.x * A.y - A.x * D.y)
    );
    const areaCm2 = +(Math.abs(signedAreaPx2) / (PIXELS_PER_CM * PIXELS_PER_CM)).toFixed(2);
    const orientationSign = signedAreaPx2 >= 0 ? 1.0 : -1.0;

    // 6. Tính 4 góc trong (chính xác cho cả tứ giác lồi và tứ giác lõm)
    const rawAngles = {};
    const anglesDeg = {};
    for (let i = 0; i < 4; i++) {
      const prevPt = ordered[(i + 3) % 4];
      const currPt = ordered[i];
      const nextPt = ordered[(i + 1) % 4];

      const ux = prevPt.x - currPt.x;
      const uy = prevPt.y - currPt.y;
      const vx = nextPt.x - currPt.x;
      const vy = nextPt.y - currPt.y;
      const magU = Math.hypot(ux, uy);
      const magV = Math.hypot(vx, vy);
      const cosA = Math.max(-1.0, Math.min(1.0, (ux * vx + uy * vy) / Math.max(magU * magV, 1e-9)));
      const alphaDeg = (Math.acos(cosA) * 180.0) / Math.PI;

      const ex1 = currPt.x - prevPt.x;
      const ey1 = currPt.y - prevPt.y;
      const ex2 = nextPt.x - currPt.x;
      const ey2 = nextPt.y - currPt.y;
      const cross = ex1 * ey2 - ey1 * ex2;

      const interior = (cross * orientationSign >= -1e-6) ? alphaDeg : (360.0 - alphaDeg);
      rawAngles[names[i]] = interior;
      anglesDeg[names[i]] = +interior.toFixed(1);
    }

    // 7. Trích xuất các thuộc tính hình học sơ cấp
    const abParaCd = areSegmentsParallel(A, B, C, D);
    const bcParaDa = areSegmentsParallel(B, C, D, A);
    const parallelPairsCount = (abParaCd ? 1 : 0) + (bcParaDa ? 1 : 0);

    const fourSidesEqual = (
      lengthsEqual(abCm, bcCm) &&
      lengthsEqual(bcCm, cdCm) &&
      lengthsEqual(cdCm, daCm) &&
      lengthsEqual(daCm, abCm)
    );
    const oppositeSidesEqual = lengthsEqual(abCm, cdCm) && lengthsEqual(bcCm, daCm);

    const rightAngleVertices = names.filter(k => isRightAngle(rawAngles[k]));
    const hasAtLeastOneRight = rightAngleVertices.length >= 1;
    const hasFourRight = rightAngleVertices.length === 4;

    const diagonalsEqual = lengthsEqual(acCm, bdCm);
    const diagonalsPerp = areSegmentsPerpendicular(A, C, B, D);
    const midAC = midpoint(A, C);
    const midBD = midpoint(B, D);
    const diagonalsBisect = distancePx(midAC, midBD) <= TOLERANCES.MIDPOINT_PX;

    const concaveVertices = names.filter(k => rawAngles[k] > 180.0 + TOLERANCES.ANGLE_DEG);
    const isConcave = concaveVertices.length === 1;
    const isConvex = concaveVertices.length === 0;

    let baseAnglesEqual = false;
    if (parallelPairsCount === 1) {
      if (abParaCd) {
        baseAnglesEqual = (anglesEqual(rawAngles.A, rawAngles.B) && anglesEqual(rawAngles.C, rawAngles.D)) || diagonalsEqual;
      } else if (bcParaDa) {
        baseAnglesEqual = (anglesEqual(rawAngles.B, rawAngles.C) && anglesEqual(rawAngles.D, rawAngles.A)) || diagonalsEqual;
      }
    }

    const detectedPropertyIds = [];
    if (isConvex) detectedPropertyIds.push('PROP_ALL_ANGLES_LT_180');
    if (isConcave) detectedPropertyIds.push('PROP_ONE_ANGLE_GT_180');
    if (parallelPairsCount === 1) detectedPropertyIds.push('PROP_1_PAIR_PARALLEL');
    if (parallelPairsCount >= 1) detectedPropertyIds.push('PROP_AT_LEAST_1_PAIR_PARALLEL');
    if (parallelPairsCount === 2) detectedPropertyIds.push('PROP_2_PAIRS_PARALLEL');
    if (oppositeSidesEqual) detectedPropertyIds.push('PROP_2_PAIRS_OPPOSITE_SIDES_EQUAL');
    if (fourSidesEqual) detectedPropertyIds.push('PROP_4_EQUAL_SIDES');
    if (hasAtLeastOneRight) detectedPropertyIds.push('PROP_1_RIGHT_ANGLE');
    if (hasFourRight) detectedPropertyIds.push('PROP_4_RIGHT_ANGLES');
    if (baseAnglesEqual) detectedPropertyIds.push('PROP_BASE_ANGLES_EQUAL');
    if (diagonalsEqual) detectedPropertyIds.push('PROP_DIAGONALS_EQUAL');
    if (diagonalsPerp) detectedPropertyIds.push('PROP_DIAGONALS_PERPENDICULAR');
    if (diagonalsBisect) detectedPropertyIds.push('PROP_DIAGONALS_BISECT');

    const classification = classifyByProperties(detectedPropertyIds);
    const computeTimeMs = +(performance.now() - t0).toFixed(3);

    return {
      status: 'VALID',
      isValid: true,
      computeTimeMs,
      errorReason: null,
      sidesCm,
      diagonalsCm,
      anglesDeg,
      rawAngles,
      angleSumDeg: +(rawAngles.A + rawAngles.B + rawAngles.C + rawAngles.D).toFixed(1),
      perimeterCm,
      areaCm2,
      orientationSign,
      visualMarkers: {
        rightAngleVertices,
        parallelPairs: { AB_CD: abParaCd, BC_DA: bcParaDa },
        fourSidesEqual,
        oppositeSidesEqual,
        legSidesEqual: (abParaCd && lengthsEqual(bcCm, daCm)) || (bcParaDa && lengthsEqual(abCm, cdCm)),
        diagonalsEqual,
        diagonalsPerpendicular: diagonalsPerp,
        diagonalsBisect,
        midpointAC: midAC,
        midpointBD: midBD
      },
      detectedPropertyIds,
      detectedPropertyLabels: detectedPropertyIds.map(id => ({
        id,
        label: PROPERTY_LABELS[id] || id
      })),
      classification
    };
  }

  // Các mẫu hình tứ giác chuẩn để học sinh & giảng viên kiểm thử nhanh 1-click
  const PRESET_SHAPES = {
    SQUARE: {
      label: 'Hình vuông (Rank 10)',
      vertices: { A: { x: 240, y: 120 }, B: { x: 480, y: 120 }, C: { x: 480, y: 360 }, D: { x: 240, y: 360 } }
    },
    RECTANGLE: {
      label: 'Hình chữ nhật (Rank 8)',
      vertices: { A: { x: 160, y: 120 }, B: { x: 520, y: 120 }, C: { x: 520, y: 360 }, D: { x: 160, y: 360 } }
    },
    RHOMBUS: {
      label: 'Hình thoi (Rank 8)',
      vertices: { A: { x: 360, y: 80 }, B: { x: 560, y: 240 }, C: { x: 360, y: 400 }, D: { x: 160, y: 240 } }
    },
    PARALLELOGRAM: {
      label: 'Hình bình hành (Rank 6)',
      vertices: { A: { x: 240, y: 120 }, B: { x: 560, y: 120 }, C: { x: 480, y: 360 }, D: { x: 160, y: 360 } }
    },
    RIGHT_TRAPEZOID: {
      label: 'Hình thang vuông (Rank 5)',
      vertices: { A: { x: 200, y: 120 }, B: { x: 440, y: 120 }, C: { x: 560, y: 360 }, D: { x: 200, y: 360 } }
    },
    ISOSCELES_TRAPEZOID: {
      label: 'Hình thang cân (Rank 5)',
      vertices: { A: { x: 240, y: 120 }, B: { x: 480, y: 120 }, C: { x: 560, y: 360 }, D: { x: 160, y: 360 } }
    },
    TRAPEZOID: {
      label: 'Hình thang thường (Rank 4)',
      vertices: { A: { x: 240, y: 120 }, B: { x: 440, y: 120 }, C: { x: 560, y: 360 }, D: { x: 160, y: 360 } }
    },
    CONVEX_QUADRILATERAL: {
      label: 'Tứ giác lồi (Rank 2)',
      vertices: { A: { x: 200, y: 100 }, B: { x: 480, y: 140 }, C: { x: 540, y: 380 }, D: { x: 160, y: 320 } }
    },
    CONCAVE_QUADRILATERAL: {
      label: 'Tứ giác lõm (Rank 1)',
      vertices: { A: { x: 360, y: 80 }, B: { x: 560, y: 380 }, C: { x: 360, y: 240 }, D: { x: 160, y: 380 } }
    },
    SELF_INTERSECTING: {
      label: 'Ngoại lệ: Tứ giác tự cắt',
      vertices: { A: { x: 200, y: 120 }, B: { x: 520, y: 360 }, C: { x: 520, y: 120 }, D: { x: 200, y: 360 } }
    },
    DEGENERATE: {
      label: 'Ngoại lệ: Hình suy biến',
      vertices: { A: { x: 200, y: 160 }, B: { x: 360, y: 160 }, C: { x: 520, y: 160 }, D: { x: 360, y: 360 } }
    }
  };

  global.GeometryEngine = {
    PIXELS_PER_CM,
    TOLERANCES,
    SHAPE_HIERARCHY,
    PROPERTY_LABELS,
    PRESET_SHAPES,
    distancePx,
    midpoint,
    snapPointToGrid,
    snapPointToRightAngle,
    analyzeQuadrilateral
  };
})(typeof window !== 'undefined' ? window : globalThis);
