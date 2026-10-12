@echo off
chcp 65001 >nul
title QuadGeo Neo4j - Ung dung Hoc Toan Hinh Hoc Phang (Chuyen de Tu Giac) - Nhom 4
echo ===========================================================================
echo   QUADGEO NEO4J - UNG DUNG HO TRO HOC TOAN HINH HOC PHANG (TU GIAC LOP 8)
echo   Don vi thuc hien: Nhom 4  ^|  Giang vien: Thay Tran Binh
echo ===========================================================================
echo.
echo [1/2] Dang chay kiem thu Unit Test cho Core Geometry Engine...
python tests/test_geometry_engine.py
echo.
echo [2/2] Dang khoi dong Web Server tai dia chi: http://localhost:3000
echo Hay mo trinh duyet (Chrome/Edge) va truy cap: http://localhost:3000
echo.
python app.py
pause
