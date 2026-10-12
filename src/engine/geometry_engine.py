"""
Core Geometry Engine (2D Vector Algebra & Quadrilateral Reasoning)
Dự án: Ứng dụng Hỗ trợ Học Toán Hình học phẳng (Chuyên đề Tứ giác) - Nhóm 4
Đáp ứng đầy đủ Quy chuẩn Toán học Mục 3.1, 3.2, 3.3, 3.4 trong Hồ sơ Đặc tả SRS.
"""

from __future__ import annotations
import math
from typing import Dict, List, Any, Tuple

# Quy chuẩn tỷ lệ: 40 pixels trên Canvas = 1.0 cm ngoài thực tế
PIXELS_PER_CM: float = 40.0

# Bảng dung sai sai số hình học chuẩn SRS (Mục 3.2 - Geometric Tolerances ε)
TOLERANCE_LENGTH_ABS_CM: float = 0.05       # |L1 - L2| <= 0.05 cm
TOLERANCE_LENGTH_REL: float = 0.01          # Sai số tương đối <= 1.0%
TOLERANCE_ANGLE_DEG: float = 0.5            # |Góc - 90°| <= 0.5°
TOLERANCE_PARALLEL_DEG: float = 0.5         # Góc lệch 2 vector chỉ phương <= 0.5°
TOLERANCE_MIDPOINT_PX: float = 3.0          # Khoảng cách trung điểm 2 đường chéo <= 3 px
TOLERANCE_COLLINEAR_AREA_CM2: float = 0.01  # Diện tích tam giác 3 đỉnh <= 0.01 cm²
TOLERANCE_COINCIDENT_PX: float = 4.0        # Khoảng cách Euclid giữa 2 đỉnh < 4 px
DEFAULT_SNAP_RADIUS_PX: float = 10.0        # Bán kính bắt điểm lưới 10 px (trong khoảng 8-12 px)


def distance_px(p1: Dict[str, float], p2: Dict[str, float]) -> float:
    """Tính khoảng cách Euclid giữa 2 điểm theo đơn vị pixel."""
    return math.hypot(p2["x"] - p1["x"], p2["y"] - p1["y"])


def midpoint(p1: Dict[str, float], p2: Dict[str, float]) -> Dict[str, float]:
    """Tính tọa độ trung điểm của đoạn thẳng nối p1 và p2."""
    return {"x": (p1["x"] + p2["x"]) / 2.0, "y": (p1["y"] + p2["y"]) / 2.0}


def lengths_equal(l1_cm: float, l2_cm: float) -> bool:
    """
    So sánh 2 độ dài đoạn thẳng theo dung sai SRS (Mục 3.2):
    Sai số tuyệt đối |L1 - L2| <= 0.05 cm HOẶC sai số tương đối <= 1.0%.
    """
    diff = abs(l1_cm - l2_cm)
    max_len = max(l1_cm, l2_cm, 1e-9)
    return diff <= TOLERANCE_LENGTH_ABS_CM or (diff / max_len) <= TOLERANCE_LENGTH_REL


def angles_equal(a1_deg: float, a2_deg: float, tol: float = TOLERANCE_ANGLE_DEG) -> bool:
    """So sánh 2 số đo góc theo ngưỡng dung sai (mặc định 0.5°)."""
    return abs(a1_deg - a2_deg) <= tol


def is_right_angle(angle_deg: float) -> bool:
    """Kiểm tra góc vuông: |Góc - 90°| <= 0.5°."""
    return abs(angle_deg - 90.0) <= TOLERANCE_ANGLE_DEG


def are_segments_parallel(
    p1: Dict[str, float], p2: Dict[str, float],
    p3: Dict[str, float], p4: Dict[str, float]
) -> bool:
    """
    Kiểm tra hai đoạn thẳng (p1->p2) và (p3->p4) có song song hay không.
    Góc lệch giữa 2 vector chỉ phương <= 0.5° hoặc xấp xỉ 180° (sai số <= 0.5°).
    """
    vx1, vy1 = p2["x"] - p1["x"], p2["y"] - p1["y"]
    vx2, vy2 = p4["x"] - p3["x"], p4["y"] - p3["y"]
    len1 = math.hypot(vx1, vy1)
    len2 = math.hypot(vx2, vy2)
    if len1 < 1e-6 or len2 < 1e-6:
        return False
    cos_theta = (vx1 * vx2 + vy1 * vy2) / (len1 * len2)
    cos_theta = max(-1.0, min(1.0, cos_theta))
    angle_deg = math.degrees(math.acos(abs(cos_theta)))
    return angle_deg <= TOLERANCE_PARALLEL_DEG


def are_segments_perpendicular(
    p1: Dict[str, float], p2: Dict[str, float],
    p3: Dict[str, float], p4: Dict[str, float]
) -> bool:
    """Kiểm tra hai đoạn thẳng (p1->p2) và (p3->p4) có vuông góc hay không (90° ± 0.5°)."""
    vx1, vy1 = p2["x"] - p1["x"], p2["y"] - p1["y"]
    vx2, vy2 = p4["x"] - p3["x"], p4["y"] - p3["y"]
    len1 = math.hypot(vx1, vy1)
    len2 = math.hypot(vx2, vy2)
    if len1 < 1e-6 or len2 < 1e-6:
        return False
    cos_theta = (vx1 * vx2 + vy1 * vy2) / (len1 * len2)
    cos_theta = max(-1.0, min(1.0, cos_theta))
    angle_deg = math.degrees(math.acos(cos_theta))
    return abs(angle_deg - 90.0) <= TOLERANCE_ANGLE_DEG


def triangle_area_cm2(
    p1: Dict[str, float], p2: Dict[str, float], p3: Dict[str, float]
) -> float:
    """Tính diện tích tam giác tạo bởi 3 điểm theo đơn vị cm²."""
    area_px2 = 0.5 * abs(
        p1["x"] * (p2["y"] - p3["y"])
        + p2["x"] * (p3["y"] - p1["y"])
        + p3["x"] * (p1["y"] - p2["y"])
    )
    return area_px2 / (PIXELS_PER_CM ** 2)


def _ccw(p1: Dict[str, float], p2: Dict[str, float], p3: Dict[str, float]) -> float:
    return (p2["x"] - p1["x"]) * (p3["y"] - p1["y"]) - (p2["y"] - p1["y"]) * (p3["x"] - p1["x"])


def _point_on_segment(p: Dict[str, float], a: Dict[str, float], b: Dict[str, float]) -> bool:
    if abs(_ccw(a, b, p)) > 1e-5:
        return False
    return (
        min(a["x"], b["x"]) - 1e-5 <= p["x"] <= max(a["x"], b["x"]) + 1e-5
        and min(a["y"], b["y"]) - 1e-5 <= p["y"] <= max(a["y"], b["y"]) + 1e-5
    )


def segments_intersect(
    p1: Dict[str, float], p2: Dict[str, float],
    p3: Dict[str, float], p4: Dict[str, float]
) -> bool:
    """Kiểm tra 2 đoạn thẳng đối diện có cắt nhau hay không (phát hiện tứ giác tự cắt)."""
    d1 = _ccw(p3, p4, p1)
    d2 = _ccw(p3, p4, p2)
    d3 = _ccw(p1, p2, p3)
    d4 = _ccw(p1, p2, p4)

    if ((d1 > 1e-5 and d2 < -1e-5) or (d1 < -1e-5 and d2 > 1e-5)) and (
        (d3 > 1e-5 and d4 < -1e-5) or (d3 < -1e-5 and d4 > 1e-5)
    ):
        return True

    if _point_on_segment(p1, p3, p4) or _point_on_segment(p2, p3, p4):
        return True
    if _point_on_segment(p3, p1, p2) or _point_on_segment(p4, p1, p2):
        return True

    return False


def snap_point_to_grid(
    point: Dict[str, float],
    grid_size: float = PIXELS_PER_CM,
    snap_radius: float = DEFAULT_SNAP_RADIUS_PX
) -> Tuple[Dict[str, float], bool]:
    """
    Bắt điểm thông minh vào nút lưới (US-07 / FR-02):
    Nếu khoảng cách từ điểm đến nút lưới gần nhất <= snap_radius (10px), tự động hút vào nút lưới.
    """
    nearest_x = round(point["x"] / grid_size) * grid_size
    nearest_y = round(point["y"] / grid_size) * grid_size
    dist = math.hypot(point["x"] - nearest_x, point["y"] - nearest_y)
    if dist <= snap_radius:
        return {"x": float(nearest_x), "y": float(nearest_y)}, True
    return {"x": float(point["x"]), "y": float(point["y"])}, False


def analyze_quadrilateral(vertices: Dict[str, Dict[str, float]]) -> Dict[str, Any]:
    """
    Phân tích toàn diện tứ giác ABCD:
    1. Kiểm tra trường hợp suy biến (INVALID_DEGENERATE - US-03)
    2. Kiểm tra tứ giác tự cắt (INVALID_SELF_INTERSECTING - US-02)
    3. Tính độ dài 4 cạnh, 2 đường chéo, 4 góc trong, chu vi, diện tích (US-04)
    4. Trích xuất tập thuộc tính hình học sơ cấp detectedPropertyIds
    5. Xác định loại hình theo cây phân cấp Rank 1 -> 10 (Mục 3.4 SRS)
    """
    A, B, C, D = vertices["A"], vertices["B"], vertices["C"], vertices["D"]
    ordered = [A, B, C, D]
    names = ["A", "B", "C", "D"]

    # 1. Kiểm tra trùng đỉnh (< 4 px)
    for i in range(4):
        for j in range(i + 1, 4):
            if distance_px(ordered[i], ordered[j]) < TOLERANCE_COINCIDENT_PX:
                return {
                    "status": "INVALID_DEGENERATE",
                    "isValid": False,
                    "errorReason": f"Hai đỉnh {names[i]} và {names[j]} trùng nhau (khoảng cách < 4px). Hình suy biến không hợp lệ.",
                    "detectedPropertyIds": [],
                    "classification": None
                }

    # 2. Kiểm tra 3 điểm thẳng hàng (diện tích tam giác <= 0.01 cm²)
    triplets = [
        ("ABC", A, B, C),
        ("BCD", B, C, D),
        ("CDA", C, D, A),
        ("DAB", D, A, B),
    ]
    for label, p1, p2, p3 in triplets:
        if triangle_area_cm2(p1, p2, p3) <= TOLERANCE_COLLINEAR_AREA_CM2:
            return {
                "status": "INVALID_DEGENERATE",
                "isValid": False,
                "errorReason": f"Ba đỉnh {label} thẳng hàng (diện tích tam giác <= 0.01 cm²). Hình suy biến không hợp lệ.",
                "detectedPropertyIds": [],
                "classification": None
            }

    # 3. Kiểm tra tứ giác tự cắt (AB cắt CD hoặc BC cắt DA)
    ab_intersects_cd = segments_intersect(A, B, C, D)
    bc_intersects_da = segments_intersect(B, C, D, A)
    if ab_intersects_cd or bc_intersects_da:
        pair_str = "AB cắt CD" if ab_intersects_cd else "BC cắt DA"
        return {
            "status": "INVALID_SELF_INTERSECTING",
            "isValid": False,
            "errorReason": f"Tứ giác tự cắt ({pair_str}). Vui lòng kéo điều chỉnh lại vị trí các đỉnh.",
            "detectedPropertyIds": [],
            "classification": None
        }

    # 4. Tính độ dài 4 cạnh và 2 đường chéo (cm)
    ab_cm = distance_px(A, B) / PIXELS_PER_CM
    bc_cm = distance_px(B, C) / PIXELS_PER_CM
    cd_cm = distance_px(C, D) / PIXELS_PER_CM
    da_cm = distance_px(D, A) / PIXELS_PER_CM
    ac_cm = distance_px(A, C) / PIXELS_PER_CM
    bd_cm = distance_px(B, D) / PIXELS_PER_CM

    sides_cm = {"AB": round(ab_cm, 2), "BC": round(bc_cm, 2), "CD": round(cd_cm, 2), "DA": round(da_cm, 2)}
    diagonals_cm = {"AC": round(ac_cm, 2), "BD": round(bd_cm, 2)}
    perimeter_cm = round(ab_cm + bc_cm + cd_cm + da_cm, 2)

    # 5. Tính diện tích có dấu (Signed Shoelace Formula) & diện tích thực (cm²)
    signed_area_px2 = 0.5 * (
        (A["x"] * B["y"] - B["x"] * A["y"])
        + (B["x"] * C["y"] - C["x"] * B["y"])
        + (C["x"] * D["y"] - D["x"] * C["y"])
        + (D["x"] * A["y"] - A["x"] * D["y"])
    )
    area_cm2 = round(abs(signed_area_px2) / (PIXELS_PER_CM ** 2), 2)
    orientation_sign = 1.0 if signed_area_px2 >= 0 else -1.0

    # 6. Tính 4 góc trong (hỗ trợ cả góc lồi < 180° và góc lõm > 180°)
    angles_deg: Dict[str, float] = {}
    raw_angles: Dict[str, float] = {}
    for i in range(4):
        prev_pt = ordered[(i - 1) % 4]
        curr_pt = ordered[i]
        next_pt = ordered[(i + 1) % 4]

        ux, uy = prev_pt["x"] - curr_pt["x"], prev_pt["y"] - curr_pt["y"]
        vx, vy = next_pt["x"] - curr_pt["x"], next_pt["y"] - curr_pt["y"]
        mag_u = math.hypot(ux, uy)
        mag_v = math.hypot(vx, vy)
        cos_a = max(-1.0, min(1.0, (ux * vx + uy * vy) / max(mag_u * mag_v, 1e-9)))
        alpha_deg = math.degrees(math.acos(cos_a))

        # Vector rẽ tại đỉnh curr_pt: (curr - prev) x (next - curr)
        ex1, ey1 = curr_pt["x"] - prev_pt["x"], curr_pt["y"] - prev_pt["y"]
        ex2, ey2 = next_pt["x"] - curr_pt["x"], next_pt["y"] - curr_pt["y"]
        cross = ex1 * ey2 - ey1 * ex2

        interior = alpha_deg if (cross * orientation_sign >= -1e-6) else (360.0 - alpha_deg)
        raw_angles[names[i]] = interior
        angles_deg[names[i]] = round(interior, 1)

    # 7. Kiểm tra các quan hệ hình học cơ sở
    ab_para_cd = are_segments_parallel(A, B, C, D)
    bc_para_da = are_segments_parallel(B, C, D, A)
    parallel_pairs_count = (1 if ab_para_cd else 0) + (1 if bc_para_da else 0)

    four_sides_equal = (
        lengths_equal(ab_cm, bc_cm)
        and lengths_equal(bc_cm, cd_cm)
        and lengths_equal(cd_cm, da_cm)
        and lengths_equal(da_cm, ab_cm)
    )
    opposite_sides_equal = lengths_equal(ab_cm, cd_cm) and lengths_equal(bc_cm, da_cm)

    right_vertices = [k for k, v in raw_angles.items() if is_right_angle(v)]
    has_at_least_one_right_angle = len(right_vertices) >= 1
    has_four_right_angles = len(right_vertices) == 4

    diagonals_equal = lengths_equal(ac_cm, bd_cm)
    diagonals_perp = are_segments_perpendicular(A, C, B, D)
    mid_ac = midpoint(A, C)
    mid_bd = midpoint(B, D)
    diagonals_bisect = distance_px(mid_ac, mid_bd) <= TOLERANCE_MIDPOINT_PX

    concave_vertices = [k for k, v in raw_angles.items() if v > 180.0 + TOLERANCE_ANGLE_DEG]
    is_concave = len(concave_vertices) == 1
    is_convex = len(concave_vertices) == 0

    # Kiểm tra góc kề đáy bằng nhau cho hình thang cân
    base_angles_equal = False
    if parallel_pairs_count == 1:
        if ab_para_cd:
            base_angles_equal = (
                angles_equal(raw_angles["A"], raw_angles["B"])
                and angles_equal(raw_angles["C"], raw_angles["D"])
            ) or diagonals_equal
        elif bc_para_da:
            base_angles_equal = (
                angles_equal(raw_angles["B"], raw_angles["C"])
                and angles_equal(raw_angles["D"], raw_angles["A"])
            ) or diagonals_equal

    # 8. Trích xuất danh sách mã thuộc tính (detectedPropertyIds) chuẩn Neo4j Schema
    detected_props: List[str] = []
    if is_convex:
        detected_props.append("PROP_ALL_ANGLES_LT_180")
    if is_concave:
        detected_props.append("PROP_ONE_ANGLE_GT_180")
    if parallel_pairs_count == 1:
        detected_props.append("PROP_1_PAIR_PARALLEL")
    if parallel_pairs_count >= 1:
        detected_props.append("PROP_AT_LEAST_1_PAIR_PARALLEL")
    if parallel_pairs_count == 2:
        detected_props.append("PROP_2_PAIRS_PARALLEL")
    if opposite_sides_equal:
        detected_props.append("PROP_2_PAIRS_OPPOSITE_SIDES_EQUAL")
    if four_sides_equal:
        detected_props.append("PROP_4_EQUAL_SIDES")
    if has_at_least_one_right_angle:
        detected_props.append("PROP_1_RIGHT_ANGLE")
    if has_four_right_angles:
        detected_props.append("PROP_4_RIGHT_ANGLES")
    if base_angles_equal:
        detected_props.append("PROP_BASE_ANGLES_EQUAL")
    if diagonals_equal:
        detected_props.append("PROP_DIAGONALS_EQUAL")
    if diagonals_perp:
        detected_props.append("PROP_DIAGONALS_PERPENDICULAR")
    if diagonals_bisect:
        detected_props.append("PROP_DIAGONALS_BISECT")

    # 9. Phân loại tứ giác theo Cây phân cấp 9 bậc (Mục 3.4 SRS)
    classification = classify_by_properties(detected_props)

    return {
        "status": "VALID",
        "isValid": True,
        "errorReason": None,
        "sidesCm": sides_cm,
        "diagonalsCm": diagonals_cm,
        "anglesDeg": angles_deg,
        "angleSumDeg": round(sum(raw_angles.values()), 1),
        "perimeterCm": perimeter_cm,
        "areaCm2": area_cm2,
        "visualMarkers": {
            "rightAngleVertices": right_vertices,
            "parallelPairs": {
                "AB_CD": ab_para_cd,
                "BC_DA": bc_para_da
            },
            "fourSidesEqual": four_sides_equal,
            "oppositeSidesEqual": opposite_sides_equal,
            "legSidesEqual": (
                (ab_para_cd and lengths_equal(bc_cm, da_cm))
                or (bc_para_da and lengths_equal(ab_cm, cd_cm))
            ),
            "diagonalsEqual": diagonals_equal,
            "diagonalsPerpendicular": diagonals_perp,
            "diagonalsBisect": diagonals_bisect,
            "midpointAC": mid_ac,
            "midpointBD": mid_bd
        },
        "detectedPropertyIds": detected_props,
        "classification": classification
    }


def classify_by_properties(detected_props: List[str]) -> Dict[str, Any]:
    """
    Khớp mẫu phân loại tứ giác theo thứ tự ưu tiên giảm dần (Rank 10 -> Rank 1)
    Đồng bộ 100% với Cypher Query 1 trong Neo4j Knowledge Graph.
    """
    props_set = set(detected_props)

    hierarchy = [
        {
            "id": "SQUARE",
            "name": "Square",
            "vietnameseName": "Hình vuông",
            "rank": 10,
            "required": {"PROP_ALL_ANGLES_LT_180", "PROP_2_PAIRS_PARALLEL", "PROP_4_EQUAL_SIDES", "PROP_1_RIGHT_ANGLE"},
            "confidence": 1.0,
            "badgeColor": "#4f46e5"
        },
        {
            "id": "RHOMBUS",
            "name": "Rhombus",
            "vietnameseName": "Hình thoi",
            "rank": 8,
            "required": {"PROP_ALL_ANGLES_LT_180", "PROP_2_PAIRS_PARALLEL", "PROP_4_EQUAL_SIDES"},
            "confidence": 0.99,
            "badgeColor": "#7c3aed"
        },
        {
            "id": "RECTANGLE",
            "name": "Rectangle",
            "vietnameseName": "Hình chữ nhật",
            "rank": 8,
            "required": {"PROP_ALL_ANGLES_LT_180", "PROP_2_PAIRS_PARALLEL", "PROP_1_RIGHT_ANGLE"},
            "confidence": 0.99,
            "badgeColor": "#0284c7"
        },
        {
            "id": "PARALLELOGRAM",
            "name": "Parallelogram",
            "vietnameseName": "Hình bình hành",
            "rank": 6,
            "required": {"PROP_ALL_ANGLES_LT_180", "PROP_2_PAIRS_PARALLEL"},
            "confidence": 0.98,
            "badgeColor": "#0d9488"
        },
        {
            "id": "RIGHT_TRAPEZOID",
            "name": "Right Trapezoid",
            "vietnameseName": "Hình thang vuông",
            "rank": 5,
            "required": {"PROP_ALL_ANGLES_LT_180", "PROP_1_PAIR_PARALLEL", "PROP_1_RIGHT_ANGLE"},
            "confidence": 0.97,
            "badgeColor": "#d97706"
        },
        {
            "id": "ISOSCELES_TRAPEZOID",
            "name": "Isosceles Trapezoid",
            "vietnameseName": "Hình thang cân",
            "rank": 5,
            "required": {"PROP_ALL_ANGLES_LT_180", "PROP_1_PAIR_PARALLEL", "PROP_BASE_ANGLES_EQUAL", "PROP_DIAGONALS_EQUAL"},
            "confidence": 0.97,
            "badgeColor": "#ea580c"
        },
        {
            "id": "TRAPEZOID",
            "name": "Trapezoid",
            "vietnameseName": "Hình thang",
            "rank": 4,
            "required": {"PROP_ALL_ANGLES_LT_180", "PROP_1_PAIR_PARALLEL"},
            "confidence": 0.96,
            "badgeColor": "#ca8a04"
        },
        {
            "id": "CONVEX_QUADRILATERAL",
            "name": "Convex Quadrilateral",
            "vietnameseName": "Tứ giác lồi thông thường",
            "rank": 2,
            "required": {"PROP_ALL_ANGLES_LT_180"},
            "confidence": 0.95,
            "badgeColor": "#16a34a"
        },
        {
            "id": "CONCAVE_QUADRILATERAL",
            "name": "Concave Quadrilateral",
            "vietnameseName": "Tứ giác lõm",
            "rank": 1,
            "required": {"PROP_ONE_ANGLE_GT_180"},
            "confidence": 0.95,
            "badgeColor": "#64748b"
        },
    ]

    for item in hierarchy:
        if item["required"].issubset(props_set):
            return {
                "shapeId": item["id"],
                "name": item["name"],
                "vietnameseName": item["vietnameseName"],
                "rank": item["rank"],
                "confidence": item["confidence"],
                "badgeColor": item["badgeColor"],
                "matchedProperties": sorted(list(item["required"]))
            }

    return {
        "shapeId": "CONVEX_QUADRILATERAL",
        "name": "Convex Quadrilateral",
        "vietnameseName": "Tứ giác lồi thông thường",
        "rank": 2,
        "confidence": 0.90,
        "badgeColor": "#16a34a",
        "matchedProperties": []
    }
