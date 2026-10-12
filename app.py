"""
Application Backend API Server (Service Layer)
Dự án: Ứng dụng Hỗ trợ Học Toán Hình học phẳng (Chuyên đề Tứ giác) - Nhóm 4
Cung cấp RESTful APIs xác thực JWT, kết nối Neo4j Graph Database qua Bolt Driver,
điều phối phân loại tứ giác, gợi ý 3 tầng Graph Traversal và lưu vết học tập (:SOLVED).
"""

from __future__ import annotations
import os
import sys
import hmac
import hashlib
import base64
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from src.engine.geometry_engine import analyze_quadrilateral
from src.db.neo4j_service import (
    Neo4jKnowledgeService,
    EXERCISES_GRAPH,
    SHAPES_GRAPH,
    PROPERTIES_GRAPH,
    THEOREMS_GRAPH,
)

app = Flask(__name__, static_folder="public", static_url_path="")
JWT_SECRET = os.environ.get("JWT_SECRET", "nhom4_quadgeo_neo4j_secret_key_2026")
CORS(app, supports_credentials=True)

neo4j_service = Neo4jKnowledgeService()


# =============================================================================
# TIỆN ÍCH MÃ HÓA JWT TOKEN & MẬT KHẨU (US-13 / FR-09)
# =============================================================================

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _b64url_decode(s: str) -> bytes:
    pad = "=" * ((4 - len(s) % 4) % 4)
    return base64.urlsafe_b64decode(s + pad)


def create_jwt_token(payload: Dict[str, Any]) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    h_b64 = _b64url_encode(json.dumps(header).encode("utf-8"))
    p_b64 = _b64url_encode(json.dumps(payload).encode("utf-8"))
    signing_input = f"{h_b64}.{p_b64}".encode("utf-8")
    sig = hmac.new(JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
    return f"{h_b64}.{p_b64}.{_b64url_encode(sig)}"


def verify_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        signing_input = f"{parts[0]}.{parts[1]}".encode("utf-8")
        expected_sig = _b64url_encode(
            hmac.new(JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
        )
        if not hmac.compare_digest(parts[2], expected_sig):
            return None
        return json.loads(_b64url_decode(parts[1]).decode("utf-8"))
    except Exception:
        return None


def get_current_user() -> Optional[Dict[str, Any]]:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
        return verify_jwt_token(token)
    return None


# =============================================================================
# FRONTEND STATIC ROUTES
# =============================================================================

@app.route("/")
def serve_index():
    return send_from_directory(app.static_folder, "index.html")


# =============================================================================
# 1. API TRẠNG THÁI & CẤU HÌNH KẾT NỐI NEO4J (US-05)
# =============================================================================

@app.route("/api/neo4j/status", methods=["GET"])
def api_neo4j_status():
    return jsonify(
        {
            "connected": neo4j_service.connected,
            "uri": neo4j_service.uri or "bolt://localhost:7687",
            "user": neo4j_service.user,
            "mode": "NEO4J_LIVE_BOLT" if neo4j_service.connected else "IN_MEMORY_GRAPH_MIRROR",
            "lastError": neo4j_service.last_error,
            "stats": {
                "shapesCount": len(SHAPES_GRAPH),
                "propertiesCount": len(PROPERTIES_GRAPH),
                "theoremsCount": len(THEOREMS_GRAPH),
                "exercisesCount": len(EXERCISES_GRAPH),
            },
        }
    )


@app.route("/api/neo4j/connect", methods=["POST"])
def api_neo4j_connect():
    data = request.get_json(force=True) or {}
    uri = data.get("uri", "")
    user = data.get("user", "neo4j")
    password = data.get("password", "")
    result = neo4j_service.connect(uri, user, password)
    return jsonify(result)


@app.route("/api/neo4j/seed", methods=["POST"])
def api_neo4j_seed():
    scripts_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "neo4j", "scripts")
    result = neo4j_service.seed_database_from_scripts(scripts_dir)
    return jsonify(result)


# =============================================================================
# 2. API PHÂN TÍCH & PHÂN LOẠI TỨ GIÁC QUA CYPHER REASONING (US-04, US-06)
# =============================================================================

@app.route("/api/geometry/classify", methods=["POST"])
def api_geometry_classify():
    data = request.get_json(force=True) or {}
    vertices = data.get("vertices")
    detected_props = data.get("detectedPropertyIds")

    if vertices:
        analysis = analyze_quadrilateral(vertices)
        if not analysis["isValid"]:
            return jsonify(
                {
                    "isValid": False,
                    "status": analysis["status"],
                    "errorReason": analysis["errorReason"],
                    "analysis": analysis,
                    "neo4jReasoning": None,
                }
            )
        detected_props = analysis["detectedPropertyIds"]
        neo4j_res = neo4j_service.classify_shape_cypher(detected_props)
        return jsonify(
            {
                "isValid": True,
                "status": "VALID",
                "analysis": analysis,
                "neo4jReasoning": neo4j_res,
            }
        )

    if detected_props is not None:
        neo4j_res = neo4j_service.classify_shape_cypher(detected_props)
        return jsonify({"isValid": True, "neo4jReasoning": neo4j_res})

    return jsonify({"error": "Thiếu tọa độ đỉnh hoặc danh sách thuộc tính."}), 400


# =============================================================================
# 3. API ĐỒ THỊ TRI THỨC & CÂY PHẢ HỆ HÌNH HỌC (US-05, MỤC 2.4.3 SRS)
# =============================================================================

@app.route("/api/graph/knowledge", methods=["GET"])
def api_graph_knowledge():
    return jsonify(neo4j_service.get_knowledge_graph_payload())


# =============================================================================
# 4. API BÀI TẬP, CHẤM ĐIỂM TỰ ĐỘNG & GỢI Ý 3 TẦNG NEO4J (US-09, US-10, US-11)
# =============================================================================

@app.route("/api/exercises", methods=["GET"])
def api_get_exercises():
    ex_type = request.args.get("type")
    items = EXERCISES_GRAPH
    if ex_type:
        items = [ex for ex in items if ex["type"] == ex_type.upper()]
    return jsonify({"exercises": items})


@app.route("/api/exercises/hint", methods=["POST"])
def api_exercise_hint():
    data = request.get_json(force=True) or {}
    target_shape_id = data.get("targetShapeId", "SQUARE")
    current_props = data.get("currentPropertyIds", [])
    tier = int(data.get("tier", 1))
    result = neo4j_service.get_3_tier_hint(target_shape_id, current_props, tier)
    return jsonify(result)


@app.route("/api/exercises/validate", methods=["POST"])
def api_exercise_validate():
    data = request.get_json(force=True) or {}
    exercise_id = data.get("exerciseId", "EX_CONSTRUCT_SQUARE")
    detected_props = data.get("detectedPropertyIds", [])
    detected_shape_id = data.get("detectedShapeId")
    completion_time = int(data.get("completionTime", 20))
    user_info = get_current_user() or data.get("user")

    result = neo4j_service.validate_exercise_submission(
        exercise_id=exercise_id,
        detected_property_ids=detected_props,
        detected_shape_id=detected_shape_id,
        user_info=user_info,
        completion_time_sec=completion_time,
    )
    return jsonify(result)


@app.route("/api/exercises/quiz/submit", methods=["POST"])
def api_quiz_submit():
    data = request.get_json(force=True) or {}
    exercise_id = data.get("exerciseId")
    selected_option = int(data.get("selectedOption", 0))
    completion_time = int(data.get("completionTime", 15))
    user_info = get_current_user() or data.get("user")

    result = neo4j_service.grade_quiz_submission(
        exercise_id=exercise_id,
        selected_option=selected_option,
        user_info=user_info,
        completion_time_sec=completion_time,
    )
    return jsonify(result)


# =============================================================================
# 5. API ĐĂNG KÝ, ĐĂNG NHẬP JWT & LƯU VẾT HỌC TẬP (:SOLVED) (US-12, US-13)
# =============================================================================

@app.route("/api/auth/login", methods=["POST"])
def api_auth_login():
    data = request.get_json(force=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = neo4j_service.users.get(email)
    if not user or user["password"] != password:
        return jsonify({"success": False, "error": "Email hoặc mật khẩu không chính xác."}), 401

    token_payload = {
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "role": user["role"],
        "className": user.get("className", "Lớp 8A1"),
    }
    token = create_jwt_token(token_payload)
    return jsonify({"success": True, "token": token, "user": token_payload})


@app.route("/api/auth/register", methods=["POST"])
def api_auth_register():
    data = request.get_json(force=True) or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    class_name = (data.get("className") or "Lớp 8A1").strip()

    if not username or not email or len(password) < 4:
        return jsonify({"success": False, "error": "Vui lòng nhập đầy đủ họ tên, email và mật khẩu (>= 4 ký tự)."}), 400

    if email in neo4j_service.users:
        return jsonify({"success": False, "error": "Email này đã được đăng ký trong hệ thống."}), 409

    user_id = f"USR_STUDENT_{len(neo4j_service.users) + 1:02d}"
    new_user = {
        "id": user_id,
        "username": username,
        "email": email,
        "password": password,
        "role": "student",
        "className": class_name,
        "createdAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    neo4j_service.users[email] = new_user

    if neo4j_service.connected:
        neo4j_service.run_cypher(
            "CREATE (u:User {id: $id, username: $username, email: $email, role: $role, className: $className, createdAt: $createdAt})",
            new_user,
        )

    token_payload = {
        "id": new_user["id"],
        "username": new_user["username"],
        "email": new_user["email"],
        "role": new_user["role"],
        "className": new_user["className"],
    }
    token = create_jwt_token(token_payload)
    return jsonify({"success": True, "token": token, "user": token_payload})


@app.route("/api/users/progress", methods=["GET"])
def api_users_progress():
    user_id = request.args.get("userId")
    records = neo4j_service.solved_records
    if user_id:
        records = [r for r in records if r["userId"] == user_id]
    return jsonify(
        {
            "records": records,
            "totalExercises": len(EXERCISES_GRAPH),
            "solvedCount": len(records),
            "cypherQuery": (
                "MATCH (u:User {id: $userId})-[r:SOLVED]->(e:Exercise)-[:TARGETS]->(s:Shape)\n"
                "RETURN u.username AS HocSinh, e.title AS BaiTap, s.vietnameseName AS ChuyenDe,\n"
                "       r.score AS DiemSo, r.attemptCount AS SoLanThu, r.completionTime AS ThoiGian;"
            ),
        }
    )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    print("=" * 68)
    print("  QUADGEO NEO4J - HỆ THỐNG HỌC TOÁN HÌNH HỌC PHẲNG (CHUYÊN ĐỀ TỨ GIÁC)")
    print(f"  Server đang chạy tại: http://localhost:{port}")
    print("=" * 68)
    app.run(host="0.0.0.0", port=port, debug=False)
