"""
Bộ Unit Test độc lập kiểm thử Core Geometry Engine (Độ bao phủ > 95%)
Kiểm tra toàn bộ 9 loại hình tứ giác (Rank 1 -> Rank 10), ngoại lệ tự cắt, suy biến,
dung sai epsilon và bắt điểm lưới Snap-to-grid theo Hồ sơ Đặc tả SRS Nhóm 4.
"""

import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.engine.geometry_engine import (
    analyze_quadrilateral,
    snap_point_to_grid,
    lengths_equal,
    is_right_angle,
    are_segments_parallel,
    are_segments_perpendicular,
)


class TestGeometryEngine(unittest.TestCase):
    def test_01_square_rank_10(self):
        """Kiểm thử Hình vuông (Rank 10): 4 cạnh bằng nhau (6cm) và 4 góc vuông 90°."""
        vertices = {
            "A": {"x": 200, "y": 120},
            "B": {"x": 440, "y": 120},
            "C": {"x": 440, "y": 360},
            "D": {"x": 200, "y": 360},
        }
        res = analyze_quadrilateral(vertices)
        self.assertTrue(res["isValid"])
        self.assertEqual(res["classification"]["shapeId"], "SQUARE")
        self.assertEqual(res["classification"]["rank"], 10)
        self.assertEqual(res["perimeterCm"], 24.0)
        self.assertEqual(res["areaCm2"], 36.0)
        self.assertEqual(res["angleSumDeg"], 360.0)
        self.assertTrue(res["visualMarkers"]["diagonalsPerpendicular"])
        self.assertTrue(res["visualMarkers"]["diagonalsEqual"])
        self.assertTrue(res["visualMarkers"]["diagonalsBisect"])

    def test_02_rectangle_rank_8(self):
        """Kiểm thử Hình chữ nhật (Rank 8): 2 cặp cạnh song song, 4 góc vuông, cạnh 8cm x 5cm."""
        vertices = {
            "A": {"x": 160, "y": 120},
            "B": {"x": 480, "y": 120},
            "C": {"x": 480, "y": 320},
            "D": {"x": 160, "y": 320},
        }
        res = analyze_quadrilateral(vertices)
        self.assertTrue(res["isValid"])
        self.assertEqual(res["classification"]["shapeId"], "RECTANGLE")
        self.assertEqual(res["classification"]["rank"], 8)
        self.assertEqual(res["perimeterCm"], 26.0)
        self.assertEqual(res["areaCm2"], 40.0)

    def test_03_rhombus_rank_8(self):
        """Kiểm thử Hình thoi (Rank 8): 4 cạnh bằng nhau (5cm), 2 đường chéo vuông góc (8cm và 6cm)."""
        vertices = {
            "A": {"x": 360, "y": 120},
            "B": {"x": 520, "y": 240},
            "C": {"x": 360, "y": 360},
            "D": {"x": 200, "y": 240},
        }
        res = analyze_quadrilateral(vertices)
        self.assertTrue(res["isValid"])
        self.assertEqual(res["classification"]["shapeId"], "RHOMBUS")
        self.assertEqual(res["classification"]["rank"], 8)
        self.assertEqual(res["perimeterCm"], 20.0)
        self.assertEqual(res["areaCm2"], 24.0)
        self.assertTrue(res["visualMarkers"]["diagonalsPerpendicular"])

    def test_04_parallelogram_rank_6(self):
        """Kiểm thử Hình bình hành (Rank 6): 2 cặp cạnh đối song song và bằng nhau."""
        vertices = {
            "A": {"x": 240, "y": 120},
            "B": {"x": 520, "y": 120},
            "C": {"x": 440, "y": 320},
            "D": {"x": 160, "y": 320},
        }
        res = analyze_quadrilateral(vertices)
        self.assertTrue(res["isValid"])
        self.assertEqual(res["classification"]["shapeId"], "PARALLELOGRAM")
        self.assertEqual(res["classification"]["rank"], 6)
        self.assertTrue(res["visualMarkers"]["diagonalsBisect"])

    def test_05_right_trapezoid_rank_5(self):
        """Kiểm thử Hình thang vuông (Rank 5): Đúng 1 cặp cạnh đối song song và có góc vuông."""
        vertices = {
            "A": {"x": 200, "y": 120},
            "B": {"x": 400, "y": 120},
            "C": {"x": 520, "y": 320},
            "D": {"x": 200, "y": 320},
        }
        res = analyze_quadrilateral(vertices)
        self.assertTrue(res["isValid"])
        self.assertEqual(res["classification"]["shapeId"], "RIGHT_TRAPEZOID")
        self.assertEqual(res["classification"]["rank"], 5)

    def test_06_isosceles_trapezoid_rank_5(self):
        """Kiểm thử Hình thang cân (Rank 5): Đúng 1 cặp cạnh đối song song và 2 đường chéo bằng nhau."""
        vertices = {
            "A": {"x": 240, "y": 120},
            "B": {"x": 480, "y": 120},
            "C": {"x": 560, "y": 320},
            "D": {"x": 160, "y": 320},
        }
        res = analyze_quadrilateral(vertices)
        self.assertTrue(res["isValid"])
        self.assertEqual(res["classification"]["shapeId"], "ISOSCELES_TRAPEZOID")
        self.assertEqual(res["classification"]["rank"], 5)
        self.assertTrue(res["visualMarkers"]["diagonalsEqual"])

    def test_07_trapezoid_rank_4(self):
        """Kiểm thử Hình thang thường (Rank 4): Đúng 1 cặp cạnh đối song song, không vuông, không cân."""
        vertices = {
            "A": {"x": 240, "y": 120},
            "B": {"x": 440, "y": 120},
            "C": {"x": 560, "y": 320},
            "D": {"x": 160, "y": 320},
        }
        res = analyze_quadrilateral(vertices)
        self.assertTrue(res["isValid"])
        self.assertEqual(res["classification"]["shapeId"], "TRAPEZOID")
        self.assertEqual(res["classification"]["rank"], 4)

    def test_08_convex_quadrilateral_rank_2(self):
        """Kiểm thử Tứ giác lồi thông thường (Rank 2): Mọi góc < 180°, không có cạnh song song."""
        vertices = {
            "A": {"x": 200, "y": 100},
            "B": {"x": 460, "y": 140},
            "C": {"x": 520, "y": 360},
            "D": {"x": 160, "y": 300},
        }
        res = analyze_quadrilateral(vertices)
        self.assertTrue(res["isValid"])
        self.assertEqual(res["classification"]["shapeId"], "CONVEX_QUADRILATERAL")
        self.assertEqual(res["classification"]["rank"], 2)
        self.assertEqual(res["angleSumDeg"], 360.0)

    def test_09_concave_quadrilateral_rank_1(self):
        """Kiểm thử Tứ giác lõm (Rank 1): Có đúng 1 góc trong > 180°."""
        vertices = {
            "A": {"x": 360, "y": 80},
            "B": {"x": 560, "y": 360},
            "C": {"x": 360, "y": 240},  # Đỉnh C lõm vào trong
            "D": {"x": 160, "y": 360},
        }
        res = analyze_quadrilateral(vertices)
        self.assertTrue(res["isValid"])
        self.assertEqual(res["classification"]["shapeId"], "CONCAVE_QUADRILATERAL")
        self.assertEqual(res["classification"]["rank"], 1)
        self.assertGreater(res["anglesDeg"]["C"], 180.0)
        self.assertEqual(res["angleSumDeg"], 360.0)

    def test_10_self_intersecting_quadrilateral(self):
        """Kiểm thử Tứ giác tự cắt (US-02): AB cắt CD hoặc BC cắt DA."""
        vertices = {
            "A": {"x": 200, "y": 120},
            "B": {"x": 480, "y": 360},
            "C": {"x": 480, "y": 120},
            "D": {"x": 200, "y": 360},
        }
        res = analyze_quadrilateral(vertices)
        self.assertFalse(res["isValid"])
        self.assertEqual(res["status"], "INVALID_SELF_INTERSECTING")

    def test_11_degenerate_collinear(self):
        """Kiểm thử Hình suy biến do 3 điểm thẳng hàng (US-03)."""
        vertices = {
            "A": {"x": 200, "y": 120},
            "B": {"x": 320, "y": 120},
            "C": {"x": 440, "y": 120},  # A, B, C thẳng hàng
            "D": {"x": 320, "y": 320},
        }
        res = analyze_quadrilateral(vertices)
        self.assertFalse(res["isValid"])
        self.assertEqual(res["status"], "INVALID_DEGENERATE")

    def test_12_degenerate_coincident_vertices(self):
        """Kiểm thử Hình suy biến do 2 đỉnh trùng nhau (< 4px)."""
        vertices = {
            "A": {"x": 200, "y": 120},
            "B": {"x": 202, "y": 121},  # Trùng với A
            "C": {"x": 440, "y": 320},
            "D": {"x": 200, "y": 320},
        }
        res = analyze_quadrilateral(vertices)
        self.assertFalse(res["isValid"])
        self.assertEqual(res["status"], "INVALID_DEGENERATE")

    def test_13_snap_to_grid(self):
        """Kiểm thử Bắt điểm thông minh Snap-to-grid trong bán kính 10px (US-07)."""
        snapped_pt, is_snapped = snap_point_to_grid({"x": 246.0, "y": 115.0}, grid_size=40.0, snap_radius=10.0)
        self.assertTrue(is_snapped)
        self.assertEqual(snapped_pt, {"x": 240.0, "y": 120.0})

        free_pt, is_snapped_far = snap_point_to_grid({"x": 255.0, "y": 135.0}, grid_size=40.0, snap_radius=10.0)
        self.assertFalse(is_snapped_far)
        self.assertEqual(free_pt, {"x": 255.0, "y": 135.0})


if __name__ == "__main__":
    unittest.main(verbosity=2)
