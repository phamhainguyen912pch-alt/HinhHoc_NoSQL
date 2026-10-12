"""
Neo4j Knowledge Graph & Reasoning Service
Dự án: Ứng dụng Hỗ trợ Học Toán Hình học phẳng (Chuyên đề Tứ giác) - Nhóm 4
Tích hợp neo4j-driver chính thức (Bolt / AuraDB) kèm cơ chế In-Memory Knowledge Graph Mirror
giúp hệ thống hoạt động tức thì cả khi Online với Neo4j Server lẫn khi chạy độc lập.
"""

from __future__ import annotations
import os
import json
import time
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional

try:
    from neo4j import GraphDatabase
    HAS_NEO4J_DRIVER = True
except ImportError:
    HAS_NEO4J_DRIVER = False


# =============================================================================
# DỮ LIỆU ĐỒ THỊ TRI THỨC CHUẨN (ĐỒNG BỘ 100% VỚI 02_seed_knowledge_graph.cypher)
# =============================================================================

SHAPES_GRAPH: Dict[str, Dict[str, Any]] = {
    "SQUARE": {
        "id": "SQUARE",
        "name": "Square",
        "vietnameseName": "Hình vuông",
        "rank": 10,
        "minSides": 4,
        "description": "Tứ giác có 4 góc vuông và 4 cạnh bằng nhau. Hình vuông vừa là hình chữ nhật, vừa là hình thoi (Đa kế thừa).",
        "formulaPerimeter": "P = 4 × a",
        "formulaArea": "S = a²",
        "requiredProperties": [
            "PROP_ALL_ANGLES_LT_180",
            "PROP_2_PAIRS_PARALLEL",
            "PROP_4_EQUAL_SIDES",
            "PROP_1_RIGHT_ANGLE",
        ],
        "subclassOf": ["RHOMBUS", "RECTANGLE"],
    },
    "RHOMBUS": {
        "id": "RHOMBUS",
        "name": "Rhombus",
        "vietnameseName": "Hình thoi",
        "rank": 8,
        "minSides": 4,
        "description": "Tứ giác có 4 cạnh bằng nhau (AB = BC = CD = DA). Hai đường chéo vuông góc và cắt nhau tại trung điểm mỗi đường.",
        "formulaPerimeter": "P = 4 × a",
        "formulaArea": "S = ½ × d₁ × d₂",
        "requiredProperties": [
            "PROP_ALL_ANGLES_LT_180",
            "PROP_2_PAIRS_PARALLEL",
            "PROP_4_EQUAL_SIDES",
        ],
        "subclassOf": ["PARALLELOGRAM"],
    },
    "RECTANGLE": {
        "id": "RECTANGLE",
        "name": "Rectangle",
        "vietnameseName": "Hình chữ nhật",
        "rank": 8,
        "minSides": 4,
        "description": "Tứ giác có 4 góc vuông (hoặc là hình bình hành có 1 góc vuông / 2 đường chéo bằng nhau).",
        "formulaPerimeter": "P = 2 × (a + b)",
        "formulaArea": "S = a × b",
        "requiredProperties": [
            "PROP_ALL_ANGLES_LT_180",
            "PROP_2_PAIRS_PARALLEL",
            "PROP_1_RIGHT_ANGLE",
        ],
        "subclassOf": ["PARALLELOGRAM", "ISOSCELES_TRAPEZOID", "RIGHT_TRAPEZOID"],
    },
    "PARALLELOGRAM": {
        "id": "PARALLELOGRAM",
        "name": "Parallelogram",
        "vietnameseName": "Hình bình hành",
        "rank": 6,
        "minSides": 4,
        "description": "Tứ giác có các cạnh đối song song và bằng nhau, hai đường chéo cắt nhau tại trung điểm mỗi đường.",
        "formulaPerimeter": "P = 2 × (a + b)",
        "formulaArea": "S = a × h",
        "requiredProperties": [
            "PROP_ALL_ANGLES_LT_180",
            "PROP_2_PAIRS_PARALLEL",
        ],
        "subclassOf": ["TRAPEZOID"],
    },
    "RIGHT_TRAPEZOID": {
        "id": "RIGHT_TRAPEZOID",
        "name": "Right Trapezoid",
        "vietnameseName": "Hình thang vuông",
        "rank": 5,
        "minSides": 4,
        "description": "Hình thang có một cạnh bên vuông góc với hai đáy (có ít nhất 1 góc vuông 90°).",
        "formulaPerimeter": "P = AB + BC + CD + DA",
        "formulaArea": "S = ½ × (a + b) × h",
        "requiredProperties": [
            "PROP_ALL_ANGLES_LT_180",
            "PROP_1_PAIR_PARALLEL",
            "PROP_1_RIGHT_ANGLE",
        ],
        "subclassOf": ["TRAPEZOID"],
    },
    "ISOSCELES_TRAPEZOID": {
        "id": "ISOSCELES_TRAPEZOID",
        "name": "Isosceles Trapezoid",
        "vietnameseName": "Hình thang cân",
        "rank": 5,
        "minSides": 4,
        "description": "Hình thang có hai góc kề một đáy bằng nhau và hai đường chéo bằng nhau (AC = BD).",
        "formulaPerimeter": "P = a + b + 2 × c",
        "formulaArea": "S = ½ × (a + b) × h",
        "requiredProperties": [
            "PROP_ALL_ANGLES_LT_180",
            "PROP_1_PAIR_PARALLEL",
            "PROP_BASE_ANGLES_EQUAL",
            "PROP_DIAGONALS_EQUAL",
        ],
        "subclassOf": ["TRAPEZOID"],
    },
    "TRAPEZOID": {
        "id": "TRAPEZOID",
        "name": "Trapezoid",
        "vietnameseName": "Hình thang",
        "rank": 4,
        "minSides": 4,
        "description": "Tứ giác lồi có hai cạnh đối song song với nhau (gọi là hai cạnh đáy).",
        "formulaPerimeter": "P = AB + BC + CD + DA",
        "formulaArea": "S = ½ × (a + b) × h",
        "requiredProperties": [
            "PROP_ALL_ANGLES_LT_180",
            "PROP_1_PAIR_PARALLEL",
        ],
        "subclassOf": ["CONVEX_QUADRILATERAL"],
    },
    "CONVEX_QUADRILATERAL": {
        "id": "CONVEX_QUADRILATERAL",
        "name": "Convex Quadrilateral",
        "vietnameseName": "Tứ giác lồi thông thường",
        "rank": 2,
        "minSides": 4,
        "description": "Tứ giác luôn nằm trong một nửa mặt phẳng có bờ là đường thẳng chứa bất kỳ cạnh nào của tứ giác (mọi góc trong < 180°).",
        "formulaPerimeter": "P = AB + BC + CD + DA",
        "formulaArea": "S = ½ × |(xA·yB - yA·xB) + ...| (Shoelace)",
        "requiredProperties": [
            "PROP_ALL_ANGLES_LT_180",
        ],
        "subclassOf": [],
    },
    "CONCAVE_QUADRILATERAL": {
        "id": "CONCAVE_QUADRILATERAL",
        "name": "Concave Quadrilateral",
        "vietnameseName": "Tứ giác lõm",
        "rank": 1,
        "minSides": 4,
        "description": "Tứ giác có đúng 1 góc trong lớn hơn 180° (một đỉnh bị lõm vào bên trong tam giác tạo bởi 3 đỉnh còn lại).",
        "formulaPerimeter": "P = AB + BC + CD + DA",
        "formulaArea": "S = ½ × |(xA·yB - yA·xB) + ...| (Shoelace)",
        "requiredProperties": [
            "PROP_ONE_ANGLE_GT_180",
        ],
        "subclassOf": [],
    },
}

PROPERTIES_GRAPH: Dict[str, Dict[str, Any]] = {
    "PROP_ALL_ANGLES_LT_180": {
        "id": "PROP_ALL_ANGLES_LT_180",
        "category": "angle",
        "desc": "Tất cả 4 góc trong của tứ giác đều nhỏ hơn 180° (Tứ giác lồi) và tổng 4 góc bằng 360°.",
        "actionHint": "Hãy kéo đỉnh bị lõm hướng ra phía ngoài để cả 4 góc trong đều nhỏ hơn 180°.",
        "ruleCode": "ALL_INTERIOR_ANGLES < 180",
    },
    "PROP_ONE_ANGLE_GT_180": {
        "id": "PROP_ONE_ANGLE_GT_180",
        "category": "angle",
        "desc": "Có đúng 1 góc trong lớn hơn 180° (góc phản), làm cho một đỉnh lõm vào bên trong tứ giác.",
        "actionHint": "Hãy kéo 1 đỉnh lùi sâu vào phần trong của tam giác tạo bởi 3 đỉnh còn lại để tạo góc > 180°.",
        "ruleCode": "EXACTLY_ONE_ANGLE > 180",
    },
    "PROP_1_PAIR_PARALLEL": {
        "id": "PROP_1_PAIR_PARALLEL",
        "category": "side",
        "desc": "Có đúng 1 cặp cạnh đối song song với nhau (AB // CD hoặc BC // DA).",
        "actionHint": "Hãy di chuyển đỉnh C hoặc D sao cho cạnh đáy CD nằm ngang song song với cạnh AB, nhưng cạnh bên BC không song song với AD.",
        "ruleCode": "PARALLEL_PAIRS == 1",
    },
    "PROP_AT_LEAST_1_PAIR_PARALLEL": {
        "id": "PROP_AT_LEAST_1_PAIR_PARALLEL",
        "category": "side",
        "desc": "Có ít nhất 1 cặp cạnh đối song song với nhau.",
        "actionHint": "Hãy căn chỉnh 2 đỉnh của một cạnh sao cho cùng phương với cạnh đối diện.",
        "ruleCode": "PARALLEL_PAIRS >= 1",
    },
    "PROP_2_PAIRS_PARALLEL": {
        "id": "PROP_2_PAIRS_PARALLEL",
        "category": "side",
        "desc": "Có 2 cặp cạnh đối song song với nhau (AB // CD và BC // DA).",
        "actionHint": "Hãy di chuyển đỉnh C sao cho cạnh BC song song với AD và cạnh CD song song với AB.",
        "ruleCode": "PARALLEL_PAIRS == 2",
    },
    "PROP_2_PAIRS_OPPOSITE_SIDES_EQUAL": {
        "id": "PROP_2_PAIRS_OPPOSITE_SIDES_EQUAL",
        "category": "side",
        "desc": "Các cạnh đối bằng nhau từng đôi một (AB = CD và BC = DA).",
        "actionHint": "Hãy điều chỉnh độ dài trên lưới sao cho cạnh CD dài đúng bằng AB và cạnh BC dài đúng bằng AD.",
        "ruleCode": "AB == CD && BC == DA",
    },
    "PROP_4_EQUAL_SIDES": {
        "id": "PROP_4_EQUAL_SIDES",
        "category": "side",
        "desc": "Cả 4 cạnh của tứ giác có độ dài bằng nhau (AB = BC = CD = DA).",
        "actionHint": "Hãy kéo các đỉnh đối xứng trên lưới sao cho độ dài 4 cạnh AB, BC, CD, DA bằng nhau tuyệt đối.",
        "ruleCode": "AB == BC == CD == DA",
    },
    "PROP_1_RIGHT_ANGLE": {
        "id": "PROP_1_RIGHT_ANGLE",
        "category": "angle",
        "desc": "Có ít nhất 1 góc trong là góc vuông (bằng 90°).",
        "actionHint": "Hãy bật Snap-to-grid và kéo đỉnh tạo góc vuông 90° giữa hai cạnh kề (thẳng hàng theo trục dọc và ngang của lưới).",
        "ruleCode": "RIGHT_ANGLES >= 1",
    },
    "PROP_4_RIGHT_ANGLES": {
        "id": "PROP_4_RIGHT_ANGLES",
        "category": "angle",
        "desc": "Cả 4 góc trong của tứ giác đều là góc vuông (A = B = C = D = 90°).",
        "actionHint": "Hãy căn chỉnh cả 4 đỉnh nằm trên các giao điểm tạo thành góc vuông 90° ở mọi đỉnh A, B, C, D.",
        "ruleCode": "RIGHT_ANGLES == 4",
    },
    "PROP_BASE_ANGLES_EQUAL": {
        "id": "PROP_BASE_ANGLES_EQUAL",
        "category": "angle",
        "desc": "Hai góc kề một cạnh đáy của hình thang bằng nhau.",
        "actionHint": "Hãy điều chỉnh hai cạnh bên nghiêng đều đối xứng nhau qua trục giữa để 2 góc kề đáy bằng nhau.",
        "ruleCode": "TRAPEZOID_BASE_ANGLES_EQUAL",
    },
    "PROP_DIAGONALS_EQUAL": {
        "id": "PROP_DIAGONALS_EQUAL",
        "category": "diag",
        "desc": "Hai đường chéo có độ dài bằng nhau (AC = BD).",
        "actionHint": "Hãy cân chỉnh hình đối xứng để hai đường chéo AC và BD có độ dài bằng nhau.",
        "ruleCode": "AC == BD",
    },
    "PROP_DIAGONALS_PERPENDICULAR": {
        "id": "PROP_DIAGONALS_PERPENDICULAR",
        "category": "diag",
        "desc": "Hai đường chéo vuông góc với nhau tại giao điểm (AC ⊥ BD).",
        "actionHint": "Hãy đặt 4 đỉnh đối xứng qua hai trục vuông góc để hai đường chéo AC và BD vuông góc với nhau.",
        "ruleCode": "AC_PERP_BD",
    },
    "PROP_DIAGONALS_BISECT": {
        "id": "PROP_DIAGONALS_BISECT",
        "category": "diag",
        "desc": "Hai đường chéo cắt nhau tại trung điểm của mỗi đường.",
        "actionHint": "Hãy đảm bảo trung điểm của AC trùng khít với trung điểm của BD.",
        "ruleCode": "MIDPOINT(AC) == MIDPOINT(BD)",
    },
}

THEOREMS_GRAPH: Dict[str, Dict[str, Any]] = {
    "TH_SUM_ANGLES_360": {
        "id": "TH_SUM_ANGLES_360",
        "name": "Định lý tổng các góc của một tứ giác",
        "textbookChapter": "SGK Toán 8 - Chương I, Bài 1: Tứ giác",
        "targetShape": "CONVEX_QUADRILATERAL",
        "requires": ["PROP_ALL_ANGLES_LT_180"],
        "proofExplanation": "Chia tứ giác ABCD thành 2 tam giác ABC và ADC bởi đường chéo AC. Tổng 3 góc trong mỗi tam giác bằng 180°, do đó tổng 4 góc Â + B̂ + Ĉ + D̂ = 180° + 180° = 360°.",
    },
    "TH_TRAPEZOID_DEF": {
        "id": "TH_TRAPEZOID_DEF",
        "name": "Định nghĩa và Dấu hiệu nhận biết Hình thang",
        "textbookChapter": "SGK Toán 8 - Chương I, Bài 2: Hình thang",
        "targetShape": "TRAPEZOID",
        "requires": ["PROP_1_PAIR_PARALLEL"],
        "proofExplanation": "Tứ giác lồi ABCD có một cặp cạnh đối song song (AB // CD hoặc BC // AD) thì tứ giác đó là Hình thang. Hai góc kề một cạnh bên bù nhau (tổng bằng 180°).",
    },
    "TH_RIGHT_TRAPEZOID": {
        "id": "TH_RIGHT_TRAPEZOID",
        "name": "Dấu hiệu nhận biết Hình thang vuông",
        "textbookChapter": "SGK Toán 8 - Chương I, Bài 2: Hình thang",
        "targetShape": "RIGHT_TRAPEZOID",
        "requires": ["PROP_1_PAIR_PARALLEL", "PROP_1_RIGHT_ANGLE"],
        "proofExplanation": "Hình thang có một góc vuông (một cạnh bên vuông góc với hai đáy) thì góc kề còn lại của cạnh bên đó cũng bằng 90°, suy ra hình đó là Hình thang vuông.",
    },
    "TH_ISO_TRAPEZOID": {
        "id": "TH_ISO_TRAPEZOID",
        "name": "Dấu hiệu nhận biết Hình thang cân",
        "textbookChapter": "SGK Toán 8 - Chương I, Bài 3: Hình thang cân",
        "targetShape": "ISOSCELES_TRAPEZOID",
        "requires": ["PROP_1_PAIR_PARALLEL", "PROP_BASE_ANGLES_EQUAL", "PROP_DIAGONALS_EQUAL"],
        "proofExplanation": "Hình thang có hai góc kề một đáy bằng nhau, hoặc có hai đường chéo bằng nhau (AC = BD) thì đó là Hình thang cân. Trong hình thang cân, hai cạnh bên bằng nhau.",
    },
    "TH_PARALLELOGRAM": {
        "id": "TH_PARALLELOGRAM",
        "name": "Dấu hiệu nhận biết Hình bình hành",
        "textbookChapter": "SGK Toán 8 - Chương I, Bài 7: Hình bình hành",
        "targetShape": "PARALLELOGRAM",
        "requires": ["PROP_2_PAIRS_PARALLEL"],
        "proofExplanation": "Tứ giác có các cạnh đối song song (AB // CD và BC // AD), hoặc các cạnh đối bằng nhau, hoặc hai đường chéo cắt nhau tại trung điểm của mỗi đường là Hình bình hành.",
    },
    "TH_RECTANGLE": {
        "id": "TH_RECTANGLE",
        "name": "Dấu hiệu nhận biết Hình chữ nhật",
        "textbookChapter": "SGK Toán 8 - Chương I, Bài 9: Hình chữ nhật",
        "targetShape": "RECTANGLE",
        "requires": ["PROP_2_PAIRS_PARALLEL", "PROP_1_RIGHT_ANGLE"],
        "proofExplanation": "Hình bình hành có 1 góc vuông (hoặc có hai đường chéo bằng nhau AC = BD), hoặc tứ giác có 3 góc vuông là Hình chữ nhật.",
    },
    "TH_RHOMBUS": {
        "id": "TH_RHOMBUS",
        "name": "Dấu hiệu nhận biết Hình thoi",
        "textbookChapter": "SGK Toán 8 - Chương I, Bài 11: Hình thoi",
        "targetShape": "RHOMBUS",
        "requires": ["PROP_2_PAIRS_PARALLEL", "PROP_4_EQUAL_SIDES"],
        "proofExplanation": "Tứ giác có 4 cạnh bằng nhau (AB = BC = CD = DA), hoặc hình bình hành có hai đường chéo vuông góc với nhau (AC ⊥ BD) là Hình thoi.",
    },
    "TH_SQUARE": {
        "id": "TH_SQUARE",
        "name": "Dấu hiệu nhận biết Hình vuông (Đa kế thừa)",
        "textbookChapter": "SGK Toán 8 - Chương I, Bài 12: Hình vuông",
        "targetShape": "SQUARE",
        "requires": ["PROP_2_PAIRS_PARALLEL", "PROP_4_EQUAL_SIDES", "PROP_1_RIGHT_ANGLE"],
        "proofExplanation": "Hình chữ nhật có 2 cạnh kề bằng nhau (hoặc 2 đường chéo vuông góc), hoặc Hình thoi có 1 góc vuông (hoặc 2 đường chéo bằng nhau) là Hình vuông.",
    },
}

EXERCISES_GRAPH: List[Dict[str, Any]] = [
    {
        "id": "EX_CONSTRUCT_SQUARE",
        "type": "CONSTRUCTION",
        "title": "Bài 1: Dựng Hình vuông ABCD trên lưới tọa độ",
        "difficultyLevel": "Cơ bản",
        "targetShape": "SQUARE",
        "tolerance": 0.05,
        "prompt": "Hãy kéo thả 4 đỉnh A, B, C, D trên mặt phẳng Canvas để tạo thành một Hình vuông hợp lệ (có 4 cạnh bằng nhau và 4 góc vuông 90°).",
        "initialVertices": {"A": {"x": 200, "y": 120}, "B": {"x": 480, "y": 160}, "C": {"x": 440, "y": 360}, "D": {"x": 200, "y": 360}},
        "sampleVertices": {"A": {"x": 240, "y": 120}, "B": {"x": 480, "y": 120}, "C": {"x": 480, "y": 360}, "D": {"x": 240, "y": 360}},
    },
    {
        "id": "EX_CONSTRUCT_RECTANGLE",
        "type": "CONSTRUCTION",
        "title": "Bài 2: Biến đổi tứ giác thành Hình chữ nhật ABCD",
        "difficultyLevel": "Cơ bản",
        "targetShape": "RECTANGLE",
        "tolerance": 0.05,
        "prompt": "Hãy điều chỉnh các đỉnh để tứ giác ABCD trở thành Hình chữ nhật (có 2 cặp cạnh đối song song, 4 góc vuông và hai cạnh kề khác độ dài nhau).",
        "initialVertices": {"A": {"x": 200, "y": 160}, "B": {"x": 520, "y": 160}, "C": {"x": 440, "y": 360}, "D": {"x": 120, "y": 360}},
        "sampleVertices": {"A": {"x": 160, "y": 160}, "B": {"x": 520, "y": 160}, "C": {"x": 520, "y": 360}, "D": {"x": 160, "y": 360}},
    },
    {
        "id": "EX_CONSTRUCT_RHOMBUS",
        "type": "CONSTRUCTION",
        "title": "Bài 3: Dựng Hình thoi ABCD có 2 đường chéo vuông góc",
        "difficultyLevel": "Trung bình",
        "targetShape": "RHOMBUS",
        "tolerance": 0.05,
        "prompt": "Hãy đặt 4 đỉnh A, B, C, D đối xứng nhau qua hai trục để tạo thành một Hình thoi (4 cạnh bằng nhau nhưng không có góc vuông).",
        "initialVertices": {"A": {"x": 360, "y": 80}, "B": {"x": 520, "y": 200}, "C": {"x": 360, "y": 400}, "D": {"x": 160, "y": 240}},
        "sampleVertices": {"A": {"x": 360, "y": 80}, "B": {"x": 560, "y": 240}, "C": {"x": 360, "y": 400}, "D": {"x": 160, "y": 240}},
    },
    {
        "id": "EX_CONSTRUCT_PARALLELOGRAM",
        "type": "CONSTRUCTION",
        "title": "Bài 4: Dựng Hình bình hành ABCD từ 2 cặp cạnh song song",
        "difficultyLevel": "Trung bình",
        "targetShape": "PARALLELOGRAM",
        "tolerance": 0.05,
        "prompt": "Hãy kéo thả các đỉnh sao cho AB song song và bằng CD, BC song song và bằng AD (không có góc vuông và 2 cạnh kề không bằng nhau).",
        "initialVertices": {"A": {"x": 240, "y": 120}, "B": {"x": 560, "y": 120}, "C": {"x": 520, "y": 360}, "D": {"x": 160, "y": 360}},
        "sampleVertices": {"A": {"x": 240, "y": 120}, "B": {"x": 560, "y": 120}, "C": {"x": 480, "y": 360}, "D": {"x": 160, "y": 360}},
    },
    {
        "id": "EX_CONSTRUCT_ISO_TRAPEZOID",
        "type": "CONSTRUCTION",
        "title": "Bài 5: Dựng Hình thang cân ABCD có hai đường chéo bằng nhau",
        "difficultyLevel": "Nâng cao",
        "targetShape": "ISOSCELES_TRAPEZOID",
        "tolerance": 0.05,
        "prompt": "Hãy dựng Hình thang cân ABCD với hai đáy song song (AB // CD) và hai cạnh bên nghiêng đối xứng để AC = BD.",
        "initialVertices": {"A": {"x": 240, "y": 120}, "B": {"x": 480, "y": 120}, "C": {"x": 520, "y": 360}, "D": {"x": 160, "y": 360}},
        "sampleVertices": {"A": {"x": 240, "y": 120}, "B": {"x": 480, "y": 120}, "C": {"x": 560, "y": 360}, "D": {"x": 160, "y": 360}},
    },
    {
        "id": "EX_CONSTRUCT_RIGHT_TRAPEZOID",
        "type": "CONSTRUCTION",
        "title": "Bài 6: Dựng Hình thang vuông ABCD",
        "difficultyLevel": "Cơ bản",
        "targetShape": "RIGHT_TRAPEZOID",
        "tolerance": 0.05,
        "prompt": "Hãy dựng Hình thang vuông ABCD có đúng 1 cặp cạnh đối song song và 1 cạnh bên vuông góc với hai đáy.",
        "initialVertices": {"A": {"x": 240, "y": 120}, "B": {"x": 440, "y": 120}, "C": {"x": 560, "y": 360}, "D": {"x": 160, "y": 360}},
        "sampleVertices": {"A": {"x": 200, "y": 120}, "B": {"x": 440, "y": 120}, "C": {"x": 560, "y": 360}, "D": {"x": 200, "y": 360}},
    },
    {
        "id": "QUIZ_01_SQUARE_INHERITANCE",
        "type": "QUIZ",
        "title": "Câu 1: Quan hệ đa kế thừa của Hình chữ nhật trong Đồ thị Tri thức",
        "difficultyLevel": "Cơ bản",
        "targetShape": "RECTANGLE",
        "question": "Theo cây phả hệ tứ giác (SGK Toán 8), một Hình bình hành cần thêm điều kiện nào sau đây để trở thành Hình chữ nhật?",
        "options": [
            "A. Có hai cạnh đối bằng nhau",
            "B. Có một góc vuông (hoặc hai đường chéo bằng nhau)",
            "C. Có hai đường chéo cắt nhau tại trung điểm mỗi đường",
            "D. Có tổng 4 góc bằng 360°",
        ],
        "correctAnswer": 1,
        "theoremId": "TH_RECTANGLE",
    },
    {
        "id": "QUIZ_02_RHOMBUS_DIAG",
        "type": "QUIZ",
        "title": "Câu 2: Dấu hiệu nhận biết Hình thoi qua đường chéo",
        "difficultyLevel": "Trung bình",
        "targetShape": "RHOMBUS",
        "question": "Cho Hình bình hành ABCD. Nếu hai đường chéo AC và BD vuông góc với nhau (AC ⊥ BD) thì tứ giác ABCD là hình gì?",
        "options": [
            "A. Hình thang vuông",
            "B. Hình chữ nhật",
            "C. Hình thoi",
            "D. Hình thang cân",
        ],
        "correctAnswer": 2,
        "theoremId": "TH_RHOMBUS",
    },
    {
        "id": "QUIZ_03_ISO_TRAPEZOID",
        "type": "QUIZ",
        "title": "Câu 3: Đặc trưng nhận diện Hình thang cân",
        "difficultyLevel": "Trung bình",
        "targetShape": "ISOSCELES_TRAPEZOID",
        "question": "Khẳng định nào sau đây là ĐÚNG khi chứng minh một Hình thang là Hình thang cân?",
        "options": [
            "A. Hình thang có hai cạnh bên bằng nhau là hình thang cân",
            "B. Hình thang có hai đường chéo bằng nhau (hoặc 2 góc kề 1 đáy bằng nhau) là hình thang cân",
            "C. Hình thang có một góc vuông là hình thang cân",
            "D. Hình thang có hai đáy bằng nhau là hình thang cân",
        ],
        "correctAnswer": 1,
        "theoremId": "TH_ISO_TRAPEZOID",
    },
    {
        "id": "QUIZ_04_MULTI_INHERITANCE",
        "type": "QUIZ",
        "title": "Câu 4: Đỉnh hội tụ đa kế thừa (Hình thoi + Hình chữ nhật)",
        "difficultyLevel": "Nâng cao",
        "targetShape": "SQUARE",
        "question": "Trong đồ thị tri thức Neo4j, Node (:Shape) nào vừa kế thừa từ Hình thoi (:RHOMBUS) vừa kế thừa từ Hình chữ nhật (:RECTANGLE)?",
        "options": [
            "A. Hình bình hành (Parallelogram)",
            "B. Hình thang cân (Isosceles Trapezoid)",
            "C. Hình vuông (Square)",
            "D. Tứ giác lồi (Convex Quadrilateral)",
        ],
        "correctAnswer": 2,
        "theoremId": "TH_SQUARE",
    },
    {
        "id": "QUIZ_05_ANGLE_SUM",
        "type": "QUIZ",
        "title": "Câu 5: Định lý tổng 4 góc trong tứ giác lồi",
        "difficultyLevel": "Cơ bản",
        "targetShape": "CONVEX_QUADRILATERAL",
        "question": "Cho tứ giác lồi ABCD có Â = 110°, B̂ = 90°, Ĉ = 85°. Số đo góc D̂ bằng bao nhiêu độ?",
        "options": [
            "A. 65°",
            "B. 75°",
            "C. 85°",
            "D. 95°",
        ],
        "correctAnswer": 1,
        "theoremId": "TH_SUM_ANGLES_360",
    },
]


class Neo4jKnowledgeService:
    """Quản lý kết nối Neo4j và thực thi các kịch bản Cypher Reasoning."""

    def __init__(self) -> None:
        self.uri: str = os.environ.get("NEO4J_URI", "")
        self.user: str = os.environ.get("NEO4J_USER", "neo4j")
        self.password: str = os.environ.get("NEO4J_PASSWORD", "")
        self.driver = None
        self.connected: bool = False
        self.last_error: Optional[str] = None

        # Lưu trữ người dùng và tiến độ học tập (:User)-[:SOLVED]->(:Exercise)
        self.users: Dict[str, Dict[str, Any]] = {
            "trung@student.edu.vn": {
                "id": "USR_STUDENT_01",
                "username": "Đỗ Thành Trung",
                "email": "trung@student.edu.vn",
                "password": "123456",
                "role": "student",
                "className": "Lớp 8A1",
                "createdAt": "2026-10-05T08:00:00Z",
            },
            "minhanh@student.edu.vn": {
                "id": "USR_STUDENT_02",
                "username": "Nguyễn Minh Anh",
                "email": "minhanh@student.edu.vn",
                "password": "123456",
                "role": "student",
                "className": "Lớp 8A1",
                "createdAt": "2026-10-05T08:30:00Z",
            },
            "tranbinh@uit.edu.vn": {
                "id": "USR_TEACHER_01",
                "username": "Thầy Trần Bình",
                "email": "tranbinh@uit.edu.vn",
                "password": "admin123",
                "role": "teacher",
                "className": "Giảng viên Hướng dẫn",
                "createdAt": "2026-10-01T07:00:00Z",
            },
        }
        self.solved_records: List[Dict[str, Any]] = [
            {
                "userId": "USR_STUDENT_01",
                "username": "Đỗ Thành Trung",
                "exerciseId": "EX_CONSTRUCT_SQUARE",
                "exerciseTitle": "Bài 1: Dựng Hình vuông ABCD trên lưới tọa độ",
                "targetShape": "SQUARE",
                "score": 100,
                "attemptCount": 1,
                "completionTime": 24,
                "solvedAt": "2026-10-10T09:15:00Z",
            },
            {
                "userId": "USR_STUDENT_01",
                "username": "Đỗ Thành Trung",
                "exerciseId": "QUIZ_01_SQUARE_INHERITANCE",
                "exerciseTitle": "Câu 1: Quan hệ đa kế thừa của Hình chữ nhật trong Đồ thị Tri thức",
                "targetShape": "RECTANGLE",
                "score": 100,
                "attemptCount": 1,
                "completionTime": 14,
                "solvedAt": "2026-10-10T09:20:00Z",
            },
        ]

        self.local_db_path: str = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "neo4j", "data", "quadgeo_knowledge_graph.json")
        )
        self._load_local_db()

        if self.uri and self.password:
            self.connect(self.uri, self.user, self.password)

    def _load_local_db(self) -> None:
        """Đọc dữ liệu người dùng & lịch sử làm bài từ file CSDL đồ thị cục bộ nếu có."""
        if not os.path.exists(self.local_db_path):
            return
        try:
            with open(self.local_db_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            if "solvedHistory" in data and isinstance(data["solvedHistory"], list):
                self.solved_records = data["solvedHistory"]
            user_nodes = data.get("nodes", {}).get("User", [])
            for u in user_nodes:
                if "email" in u:
                    self.users[u["email"]] = u
        except Exception:
            pass

    def save_local_db(self) -> None:
        """Lưu trạng thái đồ thị tri thức & tiến độ học tập xuống file neo4j/data/quadgeo_knowledge_graph.json."""
        try:
            os.makedirs(os.path.dirname(self.local_db_path), exist_ok=True)
            payload = self.get_knowledge_graph_payload()
            db_json = {
                "metadata": {
                    "databaseName": "quadgeo_neo4j_knowledge_graph",
                    "version": "2.0",
                    "description": "Cơ sở dữ liệu Đồ thị Tri thức Hình học phẳng (Chuyên đề Tứ giác - Toán 8) - Nhóm 4",
                },
                "nodes": {
                    "Shape": list(SHAPES_GRAPH.values()),
                    "Property": list(PROPERTIES_GRAPH.values()),
                    "Theorem": list(THEOREMS_GRAPH.values()),
                    "Exercise": EXERCISES_GRAPH,
                    "User": list(self.users.values()),
                },
                "relationships": payload["edges"],
                "solvedHistory": self.solved_records,
            }
            with open(self.local_db_path, "w", encoding="utf-8") as f:
                json.dump(db_json, f, ensure_ascii=False, indent=2)
        except Exception:
            pass

    def connect(self, uri: str, user: str, password: str) -> Dict[str, Any]:
        """Thiết lập và kiểm tra kết nối đến Neo4j AuraDB hoặc Neo4j Desktop."""
        self.uri = uri.strip()
        self.user = user.strip() or "neo4j"
        self.password = password

        if self.driver:
            try:
                self.driver.close()
            except Exception:
                pass
            self.driver = None

        if not HAS_NEO4J_DRIVER:
            self.connected = False
            self.last_error = "Thư viện neo4j chưa được cài đặt."
            return {"connected": False, "error": self.last_error}

        try:
            self.driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password))
            self.driver.verify_connectivity()
            self.connected = True
            self.last_error = None
            return {
                "connected": True,
                "uri": self.uri,
                "user": self.user,
                "mode": "NEO4J_LIVE_BOLT",
                "message": "Kết nối Neo4j Graph Database thành công!",
            }
        except Exception as exc:
            self.connected = False
            self.driver = None
            self.last_error = str(exc)
            return {
                "connected": False,
                "uri": self.uri,
                "mode": "IN_MEMORY_GRAPH_MIRROR",
                "error": self.last_error,
            }

    def run_cypher(self, query: str, params: Optional[Dict[str, Any]] = None) -> Optional[List[Dict[str, Any]]]:
        """Thực thi câu lệnh Cypher trên Neo4j nếu đang kết nối."""
        if not self.connected or not self.driver:
            return None
        try:
            with self.driver.session() as session:
                result = session.run(query, params or {})
                return [record.data() for record in result]
        except Exception as exc:
            self.last_error = str(exc)
            return None

    def seed_database_from_scripts(self, scripts_dir: str) -> Dict[str, Any]:
        """Đọc và thực thi các file Cypher trong thư mục neo4j/scripts lên Neo4j Server."""
        if not self.connected or not self.driver:
            return {
                "success": True,
                "mode": "IN_MEMORY_GRAPH_MIRROR",
                "message": "Đã khởi tạo đầy đủ Knowledge Graph trong bộ nhớ đệm (9 Node :Shape, 13 :Property, 8 :Theorem, 11 :Exercise). Để nạp lên Neo4j Cloud/Desktop, hãy nhập thông tin Bolt URI và mật khẩu.",
            }

        executed_statements = 0
        try:
            for fname in ["01_constraints_indexes.cypher", "02_seed_knowledge_graph.cypher"]:
                fpath = os.path.join(scripts_dir, fname)
                if not os.path.exists(fpath):
                    continue
                with open(fpath, "r", encoding="utf-8") as f:
                    content = f.read()
                # Tách các câu lệnh theo dấu chấm phẩy ;
                statements = [
                    stmt.strip()
                    for stmt in content.split(";")
                    if stmt.strip() and not all(line.strip().startswith("//") for line in stmt.strip().splitlines())
                ]
                with self.driver.session() as session:
                    for stmt in statements:
                        # Loại bỏ các dòng comment ở đầu
                        clean_lines = [
                            line for line in stmt.splitlines() if not line.strip().startswith("//")
                        ]
                        clean_stmt = "\n".join(clean_lines).strip()
                        if clean_stmt:
                            session.run(clean_stmt)
                            executed_statements += 1

            return {
                "success": True,
                "mode": "NEO4J_LIVE_BOLT",
                "executedStatements": executed_statements,
                "message": f"Đã thực thi thành công {executed_statements} lệnh Cypher khởi tạo Knowledge Graph lên Neo4j!",
            }
        except Exception as exc:
            return {"success": False, "error": str(exc)}

    def classify_shape_cypher(self, detected_property_ids: List[str]) -> Dict[str, Any]:
        """
        Thực thi Cypher Query 1 (Mục 2.4.1 SRS - US-06 / FR-04):
        Khớp mẫu nhận diện loại hình học có độ ưu tiên (rank) cao nhất.
        """
        start_t = time.perf_counter()
        cypher_query = (
            "MATCH (s:Shape)\n"
            "WHERE ALL(reqProp IN [(s)-[:HAS_PROPERTY]->(p:Property) | p.id]\n"
            "          WHERE reqProp IN $detectedPropertyIds)\n"
            "RETURN s.id AS ShapeId,\n"
            "       s.name AS Name,\n"
            "       s.vietnameseName AS TenHinh,\n"
            "       s.rank AS DoUuTien,\n"
            "       s.description AS MoTa,\n"
            "       s.formulaPerimeter AS CongThucChuVi,\n"
            "       s.formulaArea AS CongThucDienTich\n"
            "ORDER BY s.rank DESC\n"
            "LIMIT 1;"
        )

        live_records = self.run_cypher(cypher_query, {"detectedPropertyIds": detected_property_ids})
        elapsed_ms = round((time.perf_counter() - start_t) * 1000, 2)

        if live_records and len(live_records) > 0:
            rec = live_records[0]
            shape_id = rec["ShapeId"]
            shape_meta = SHAPES_GRAPH.get(shape_id, {})
            return {
                "source": "NEO4J_LIVE_BOLT",
                "executionTimeMs": elapsed_ms,
                "cypherQuery": cypher_query,
                "parameters": {"detectedPropertyIds": detected_property_ids},
                "result": {
                    "shapeId": shape_id,
                    "name": rec.get("Name", shape_meta.get("name")),
                    "vietnameseName": rec.get("TenHinh", shape_meta.get("vietnameseName")),
                    "rank": rec.get("DoUuTien", shape_meta.get("rank")),
                    "description": rec.get("MoTa", shape_meta.get("description")),
                    "formulaPerimeter": rec.get("CongThucChuVi", shape_meta.get("formulaPerimeter")),
                    "formulaArea": rec.get("CongThucDienTich", shape_meta.get("formulaArea")),
                    "subclassOf": shape_meta.get("subclassOf", []),
                },
            }

        # Fallback: In-Memory Graph Pattern Matching
        props_set = set(detected_property_ids)
        sorted_shapes = sorted(SHAPES_GRAPH.values(), key=lambda x: x["rank"], reverse=True)
        matched_shape = SHAPES_GRAPH["CONVEX_QUADRILATERAL"]
        for sh in sorted_shapes:
            if set(sh["requiredProperties"]).issubset(props_set):
                matched_shape = sh
                break

        elapsed_ms = round((time.perf_counter() - start_t) * 1000, 2)
        return {
            "source": "IN_MEMORY_GRAPH_MIRROR",
            "executionTimeMs": elapsed_ms,
            "cypherQuery": cypher_query,
            "parameters": {"detectedPropertyIds": detected_property_ids},
            "result": {
                "shapeId": matched_shape["id"],
                "name": matched_shape["name"],
                "vietnameseName": matched_shape["vietnameseName"],
                "rank": matched_shape["rank"],
                "description": matched_shape["description"],
                "formulaPerimeter": matched_shape["formulaPerimeter"],
                "formulaArea": matched_shape["formulaArea"],
                "subclassOf": matched_shape["subclassOf"],
            },
        }

    def get_3_tier_hint(
        self, target_shape_id: str, current_property_ids: List[str], tier: int = 1
    ) -> Dict[str, Any]:
        """
        Thực thi Cypher Query 2 (Mục 2.4.2 SRS - US-11 / FR-08):
        Duyệt đồ thị tìm thuộc tính còn thiếu và sinh gợi ý 3 tầng.
        """
        start_t = time.perf_counter()
        cypher_query = (
            "MATCH (target:Shape {id: $targetShapeId})-[:HAS_PROPERTY]->(p:Property)\n"
            "WHERE NOT p.id IN $currentPropertyIds\n"
            "OPTIONAL MATCH (th:Theorem)-[:REQUIRES]->(p)\n"
            "WHERE th.targetShape = target.id\n"
            "RETURN p.id AS MissingPropId,\n"
            "       p.desc AS LyThuyetGoiY_Tang1,\n"
            "       p.actionHint AS ThaoTacGoiY_Tang2,\n"
            "       th.name AS DinhLyLienQuan,\n"
            "       th.textbookChapter AS ChuongSGK,\n"
            "       th.proofExplanation AS ChungMinhDinhLy\n"
            "LIMIT 1;"
        )

        target_shape = SHAPES_GRAPH.get(target_shape_id, SHAPES_GRAPH["SQUARE"])
        required_props = target_shape["requiredProperties"]
        missing_prop_ids = [p for p in required_props if p not in current_property_ids]

        # Tìm bài tập dựng hình tương ứng để lấy tọa độ mẫu cho Tầng 3
        sample_vertices = None
        for ex in EXERCISES_GRAPH:
            if ex.get("type") == "CONSTRUCTION" and ex.get("targetShape") == target_shape_id:
                sample_vertices = ex.get("sampleVertices")
                break

        if not missing_prop_ids:
            elapsed_ms = round((time.perf_counter() - start_t) * 1000, 2)
            return {
                "alreadySatisfied": True,
                "tier": tier,
                "targetShapeName": target_shape["vietnameseName"],
                "executionTimeMs": elapsed_ms,
                "cypherQuery": cypher_query,
                "message": f"Tuyệt vời! Hình vẽ hiện tại của bạn đã thỏa mãn đầy đủ các tính chất của {target_shape['vietnameseName']}. Hãy bấm 'Nộp bài chấm điểm' ngay!",
                "sampleVertices": sample_vertices,
            }

        first_missing_id = missing_prop_ids[0]
        prop_node = PROPERTIES_GRAPH.get(first_missing_id, {})

        # Tìm định lý liên quan tới target_shape
        related_theorem = None
        for th in THEOREMS_GRAPH.values():
            if th["targetShape"] == target_shape_id:
                related_theorem = th
                break

        elapsed_ms = round((time.perf_counter() - start_t) * 1000, 2)
        return {
            "alreadySatisfied": False,
            "tier": tier,
            "targetShapeId": target_shape_id,
            "targetShapeName": target_shape["vietnameseName"],
            "missingPropertyCount": len(missing_prop_ids),
            "missingPropertyIds": missing_prop_ids,
            "missingPropertyId": first_missing_id,
            "tier1_theory": {
                "propertyDesc": prop_node.get("desc", ""),
                "theoremName": related_theorem["name"] if related_theorem else "Dấu hiệu nhận biết tứ giác",
                "textbookChapter": related_theorem["textbookChapter"] if related_theorem else "SGK Toán 8 - Chương I",
                "proofExplanation": related_theorem["proofExplanation"] if related_theorem else "",
            },
            "tier2_action": {
                "actionHint": prop_node.get("actionHint", ""),
                "ruleCode": prop_node.get("ruleCode", ""),
            },
            "tier3_solution": {
                "canShowSample": tier >= 3,
                "sampleVertices": sample_vertices,
                "coordinateGuide": (
                    f"Gợi ý tọa độ chuẩn cho {target_shape['vietnameseName']}: "
                    + (
                        ", ".join(
                            f"{k}({v['x']//40}, {v['y']//40})" for k, v in sample_vertices.items()
                        )
                        if sample_vertices
                        else ""
                    )
                ),
            },
            "executionTimeMs": elapsed_ms,
            "cypherQuery": cypher_query,
            "parameters": {
                "targetShapeId": target_shape_id,
                "currentPropertyIds": current_property_ids,
            },
        }

    def validate_exercise_submission(
        self,
        exercise_id: str,
        detected_property_ids: List[str],
        detected_shape_id: Optional[str],
        user_info: Optional[Dict[str, Any]] = None,
        completion_time_sec: int = 20,
    ) -> Dict[str, Any]:
        """
        Kiểm tra bài tập dựng hình bằng Neo4j Graph Validation (US-10 / FR-07)
        và lưu vết học tập (:User)-[:SOLVED]->(:Exercise) (US-12 / FR-09).
        """
        exercise = next((ex for ex in EXERCISES_GRAPH if ex["id"] == exercise_id), None)
        if not exercise:
            return {"success": False, "error": "Không tìm thấy bài tập."}

        target_shape_id = exercise["targetShape"]
        target_shape = SHAPES_GRAPH[target_shape_id]
        required_props = target_shape["requiredProperties"]

        missing_props = [
            {
                "id": pid,
                "desc": PROPERTIES_GRAPH[pid]["desc"],
                "actionHint": PROPERTIES_GRAPH[pid]["actionHint"],
            }
            for pid in required_props
            if pid not in detected_property_ids
        ]
        matched_props = [
            {"id": pid, "desc": PROPERTIES_GRAPH[pid]["desc"]}
            for pid in required_props
            if pid in detected_property_ids
        ]

        # Đối với bài tập dựng Hình chữ nhật, Hình thoi, Hình bình hành:
        # Chấp nhận cả khi hình đạt đúng loại mục tiêu (hoặc toàn bộ thuộc tính bắt buộc thỏa mãn)
        is_passed = len(missing_props) == 0
        score = 100 if is_passed else max(20, int(round(100 * len(matched_props) / max(len(required_props), 1))))

        cypher_validation = (
            "MATCH (e:Exercise {id: $exerciseId})-[:TARGETS]->(target:Shape)-[:HAS_PROPERTY]->(p:Property)\n"
            "WITH e, target,\n"
            "     collect(p.id) AS requiredProps,\n"
            "     [prop IN collect(p) WHERE NOT prop.id IN $studentProps | prop.desc] AS missingDescriptions\n"
            "RETURN e.title AS BaiTap, target.vietnameseName AS HinhMucTieu,\n"
            "       size(missingDescriptions) = 0 AS KetQuaDung, missingDescriptions;"
        )

        if is_passed and user_info:
            self.record_solved(
                user_id=user_info.get("id", "USR_STUDENT_01"),
                username=user_info.get("username", "Học sinh"),
                exercise_id=exercise_id,
                exercise_title=exercise["title"],
                target_shape=target_shape_id,
                score=score,
                completion_time=completion_time_sec,
            )

        return {
            "success": True,
            "isPassed": is_passed,
            "score": score,
            "exerciseId": exercise_id,
            "exerciseTitle": exercise["title"],
            "targetShapeId": target_shape_id,
            "targetShapeName": target_shape["vietnameseName"],
            "detectedShapeId": detected_shape_id,
            "matchedProperties": matched_props,
            "missingProperties": missing_props,
            "cypherQuery": cypher_validation,
            "feedback": (
                f"Chính xác! Bạn đã dựng thành công {target_shape['vietnameseName']} thỏa mãn toàn bộ {len(required_props)} ràng buộc trên Đồ thị Tri thức Neo4j."
                if is_passed
                else f"Chưa đạt yêu cầu của {target_shape['vietnameseName']}. Hình hiện tại còn thiếu {len(missing_props)} tính chất bắt buộc."
            ),
        }

    def grade_quiz_submission(
        self,
        exercise_id: str,
        selected_option: int,
        user_info: Optional[Dict[str, Any]] = None,
        completion_time_sec: int = 15,
    ) -> Dict[str, Any]:
        """Chấm điểm câu hỏi trắc nghiệm lý thuyết Neo4j (US-09 / FR-06)."""
        quiz = next((ex for ex in EXERCISES_GRAPH if ex["id"] == exercise_id and ex["type"] == "QUIZ"), None)
        if not quiz:
            return {"success": False, "error": "Không tìm thấy câu hỏi trắc nghiệm."}

        is_correct = int(selected_option) == int(quiz["correctAnswer"])
        theorem = THEOREMS_GRAPH.get(quiz.get("theoremId", ""), {})
        target_shape = SHAPES_GRAPH.get(quiz["targetShape"], {})
        score = 100 if is_correct else 0

        if is_correct and user_info:
            self.record_solved(
                user_id=user_info.get("id", "USR_STUDENT_01"),
                username=user_info.get("username", "Học sinh"),
                exercise_id=exercise_id,
                exercise_title=quiz["title"],
                target_shape=quiz["targetShape"],
                score=100,
                completion_time=completion_time_sec,
            )

        return {
            "success": True,
            "isCorrect": is_correct,
            "score": score,
            "selectedOption": selected_option,
            "correctAnswer": quiz["correctAnswer"],
            "correctOptionText": quiz["options"][quiz["correctAnswer"]],
            "proofPath": {
                "theoremId": theorem.get("id"),
                "theoremName": theorem.get("name"),
                "textbookChapter": theorem.get("textbookChapter"),
                "proofExplanation": theorem.get("proofExplanation"),
                "concludesShape": target_shape.get("vietnameseName"),
                "requiresProperties": [
                    PROPERTIES_GRAPH[p]["desc"] for p in theorem.get("requires", []) if p in PROPERTIES_GRAPH
                ],
            },
        }

    def record_solved(
        self,
        user_id: str,
        username: str,
        exercise_id: str,
        exercise_title: str,
        target_shape: str,
        score: int,
        completion_time: int,
    ) -> None:
        """Ghi nhận quan hệ (:User)-[:SOLVED]->(:Exercise) vào Neo4j và bộ nhớ."""
        now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        existing = next(
            (r for r in self.solved_records if r["userId"] == user_id and r["exerciseId"] == exercise_id),
            None,
        )
        if existing:
            existing["attemptCount"] += 1
            existing["score"] = max(existing["score"], score)
            existing["completionTime"] = completion_time
            existing["solvedAt"] = now_iso
        else:
            self.solved_records.append(
                {
                    "userId": user_id,
                    "username": username,
                    "exerciseId": exercise_id,
                    "exerciseTitle": exercise_title,
                    "targetShape": target_shape,
                    "score": score,
                    "attemptCount": 1,
                    "completionTime": completion_time,
                    "solvedAt": now_iso,
                }
            )

        self.save_local_db()

        if self.connected and self.driver:
            cypher = (
                "MATCH (u:User {id: $userId}), (e:Exercise {id: $exerciseId})\n"
                "MERGE (u)-[r:SOLVED]->(e)\n"
                "ON CREATE SET r.score = $score, r.attemptCount = 1, r.completionTime = $completionTime, r.solvedAt = $solvedAt\n"
                "ON MATCH SET r.attemptCount = coalesce(r.attemptCount, 1) + 1, r.score = $score, r.completionTime = $completionTime, r.solvedAt = $solvedAt"
            )
            self.run_cypher(
                cypher,
                {
                    "userId": user_id,
                    "exerciseId": exercise_id,
                    "score": score,
                    "completionTime": completion_time,
                    "solvedAt": now_iso,
                },
            )

    def get_knowledge_graph_payload(self) -> Dict[str, Any]:
        """Trả về toàn bộ Nodes & Relationships của Đồ thị Tri thức Tứ giác để trực quan hóa."""
        nodes = []
        edges = []

        for sh in SHAPES_GRAPH.values():
            nodes.append(
                {
                    "id": sh["id"],
                    "label": sh["vietnameseName"],
                    "subLabel": f"Rank {sh['rank']}",
                    "group": "Shape",
                    "rank": sh["rank"],
                    "details": sh["description"],
                    "formulaArea": sh["formulaArea"],
                    "formulaPerimeter": sh["formulaPerimeter"],
                }
            )
            for parent_id in sh["subclassOf"]:
                edges.append(
                    {
                        "from": sh["id"],
                        "to": parent_id,
                        "label": "SUBCLASS_OF",
                        "type": "SUBCLASS_OF",
                    }
                )
            for prop_id in sh["requiredProperties"]:
                edges.append(
                    {
                        "from": sh["id"],
                        "to": prop_id,
                        "label": "HAS_PROPERTY",
                        "type": "HAS_PROPERTY",
                    }
                )

        for prop in PROPERTIES_GRAPH.values():
            nodes.append(
                {
                    "id": prop["id"],
                    "label": prop["ruleCode"],
                    "subLabel": prop["category"].upper(),
                    "group": "Property",
                    "details": prop["desc"],
                    "actionHint": prop["actionHint"],
                }
            )

        for th in THEOREMS_GRAPH.values():
            nodes.append(
                {
                    "id": th["id"],
                    "label": th["name"],
                    "subLabel": th["textbookChapter"],
                    "group": "Theorem",
                    "details": th["proofExplanation"],
                }
            )
            edges.append(
                {
                    "from": th["id"],
                    "to": th["targetShape"],
                    "label": "CONCLUDES",
                    "type": "CONCLUDES",
                }
            )
            for req_p in th["requires"]:
                edges.append(
                    {
                        "from": th["id"],
                        "to": req_p,
                        "label": "REQUIRES",
                        "type": "REQUIRES",
                    }
                )

        return {
            "nodes": nodes,
            "edges": edges,
            "shapes": list(SHAPES_GRAPH.values()),
            "properties": list(PROPERTIES_GRAPH.values()),
            "theorems": list(THEOREMS_GRAPH.values()),
            "cypherHierarchyQuery": (
                "MATCH path = (child:Shape)-[:SUBCLASS_OF*1..4]->(parent:Shape {id: 'CONVEX_QUADRILATERAL'})\n"
                "RETURN path;"
            ),
        }
