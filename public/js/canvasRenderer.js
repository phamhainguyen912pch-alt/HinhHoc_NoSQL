/**
 * Interactive 2D Geometry Canvas Renderer (60 FPS + Mathematical Notations)
 * Dự án: Ứng dụng Hỗ trợ Học Toán Hình học phẳng (Chuyên đề Tứ giác) - Nhóm 4
 * Thực thi US-01, US-02, US-03, US-07, US-08, US-14
 */

(function (global) {
  'use strict';

  const GRID_SIZE = 40; // 40px = 1.0 cm

  /**
   * Vẽ lưới tọa độ ô vuông chuẩn Toán 8
   */
  function drawCoordinateGrid(ctx, width, height, showGrid) {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    if (!showGrid) return;

    // Lưới phụ 20px (0.5 cm)
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= width; x += GRID_SIZE / 2) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += GRID_SIZE / 2) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Lưới chính 40px (1.0 cm)
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let x = 0; x <= width; x += GRID_SIZE) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += GRID_SIZE) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Chấm nút giao lưới & thước đo cm
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 10px Inter, system-ui, sans-serif';
    for (let x = GRID_SIZE; x < width; x += GRID_SIZE) {
      ctx.fillText(`${x / GRID_SIZE}`, x - 4, 14);
      for (let y = GRID_SIZE; y < height; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.arc(x, y, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    for (let y = GRID_SIZE; y < height; y += GRID_SIZE) {
      ctx.fillText(`${y / GRID_SIZE}`, 6, y + 3);
    }
  }

  /**
   * Vẽ ký hiệu góc vuông (ô vuông nhỏ) tại đỉnh có góc 90° (US-08 / FR-05)
   */
  function drawRightAngleSquare(ctx, curr, prev, next, size = 15) {
    const ux = prev.x - curr.x;
    const uy = prev.y - curr.y;
    const vx = next.x - curr.x;
    const vy = next.y - curr.y;
    const lenU = Math.hypot(ux, uy);
    const lenV = Math.hypot(vx, vy);
    if (lenU < 1e-4 || lenV < 1e-4) return;

    const uUnit = { x: (ux / lenU) * size, y: (uy / lenU) * size };
    const vUnit = { x: (vx / lenV) * size, y: (vy / lenV) * size };

    const p1 = { x: curr.x + uUnit.x, y: curr.y + uUnit.y };
    const p2 = { x: curr.x + uUnit.x + vUnit.x, y: curr.y + uUnit.y + vUnit.y };
    const p3 = { x: curr.x + vUnit.x, y: curr.y + vUnit.y };

    ctx.save();
    ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(curr.x, curr.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Chấm tròn nhỏ tâm góc vuông
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(curr.x + (uUnit.x + vUnit.x) * 0.45, curr.y + (uUnit.y + vUnit.y) * 0.45, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Vẽ cung góc và số đo độ tại các đỉnh không vuông
   */
  function drawAngleArcAndLabel(ctx, curr, prev, next, angleDeg, orientationSign) {
    const ux = prev.x - curr.x;
    const uy = prev.y - curr.y;
    const vx = next.x - curr.x;
    const vy = next.y - curr.y;
    const lenU = Math.hypot(ux, uy);
    const lenV = Math.hypot(vx, vy);
    if (lenU < 1e-4 || lenV < 1e-4) return;

    const angU = Math.atan2(uy, ux);
    const angV = Math.atan2(vy, vx);
    const isReflex = angleDeg > 180.5;

    ctx.save();
    ctx.strokeStyle = isReflex ? '#e11d48' : '#0284c7';
    ctx.fillStyle = isReflex ? 'rgba(225, 29, 72, 0.14)' : 'rgba(2, 132, 199, 0.12)';
    ctx.lineWidth = 1.6;

    const radius = 22;
    ctx.beginPath();
    ctx.moveTo(curr.x, curr.y);
    // Xác định chiều quay cung bên trong tứ giác
    const anticlockwise = orientationSign > 0;
    ctx.arc(curr.x, curr.y, radius, angV, angU, anticlockwise);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Vị trí nhãn góc
    let bisectorX = (ux / lenU) + (vx / lenV);
    let bisectorY = (uy / lenU) + (vy / lenV);
    const bLen = Math.hypot(bisectorX, bisectorY);
    if (bLen > 1e-4) {
      bisectorX /= bLen;
      bisectorY /= bLen;
    }
    if (isReflex) {
      bisectorX = -bisectorX;
      bisectorY = -bisectorY;
    }

    const labelDist = 34;
    const lx = curr.x + bisectorX * labelDist;
    const ly = curr.y + bisectorY * labelDist;

    ctx.font = '600 11px Inter, system-ui, sans-serif';
    ctx.fillStyle = isReflex ? '#be123c' : '#0369a1';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${angleDeg}°`, lx, ly);
    ctx.restore();
  }

  /**
   * Vẽ vạch gạch chéo đánh dấu các cạnh bằng nhau (US-08 / FR-05)
   */
  function drawEqualSideTicks(ctx, p1, p2, tickCount = 1, color = '#4f46e5') {
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    if (len < 30) return;

    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy;
    const ny = ux;
    const tickHalfLen = 6.5;
    const spacing = 5;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    const startOffset = -((tickCount - 1) * spacing) / 2;

    for (let i = 0; i < tickCount; i++) {
      const offset = startOffset + i * spacing;
      const cx = mx + ux * offset;
      const cy = my + uy * offset;
      ctx.beginPath();
      ctx.moveTo(cx - nx * tickHalfLen, cy - ny * tickHalfLen);
      ctx.lineTo(cx + nx * tickHalfLen, cy + ny * tickHalfLen);
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Vẽ mũi tên song song trên các cặp cạnh đối song song (US-08 / FR-05)
   */
  function drawParallelArrows(ctx, p1, p2, arrowCount = 1, color = '#0d9488') {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    if (len < 45) return;

    // Đảm bảo 2 cạnh đối có mũi tên cùng chiều trên mặt phẳng
    let ux = dx / len;
    let uy = dy / len;
    if (ux < -0.01 || (Math.abs(ux) <= 0.01 && uy < 0)) {
      ux = -ux;
      uy = -uy;
    }
    const nx = -uy;
    const ny = ux;

    // Đặt mũi tên lệch nhẹ khỏi trung điểm để không đè lên vạch cạnh bằng nhau
    const basePos = {
      x: p1.x + dx * 0.34,
      y: p1.y + dy * 0.34
    };
    const size = 6;
    const spacing = 6;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < arrowCount; i++) {
      const cx = basePos.x + ux * (i * spacing);
      const cy = basePos.y + uy * (i * spacing);
      ctx.beginPath();
      ctx.moveTo(cx - ux * size + nx * size * 0.85, cy - uy * size + ny * size * 0.85);
      ctx.lineTo(cx + ux * 2, cy + uy * 2);
      ctx.lineTo(cx - ux * size - nx * size * 0.85, cy - uy * size - ny * size * 0.85);
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Vẽ nhãn độ dài cạnh (cm)
   */
  function drawSideLengthBadge(ctx, p1, p2, labelText, centroid) {
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    if (len < 20) return;

    let nx = -dy / len;
    let ny = dx / len;
    // Đẩy nhãn ra phía ngoài tâm tứ giác
    const toOutX = mx - centroid.x;
    const toOutY = my - centroid.y;
    if (nx * toOutX + ny * toOutY < 0) {
      nx = -nx;
      ny = -ny;
    }

    const bx = mx + nx * 18;
    const by = my + ny * 18;

    ctx.save();
    ctx.font = '600 11px Inter, system-ui, sans-serif';
    const textWidth = ctx.measureText(labelText).width;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bx - textWidth / 2 - 5, by - 9, textWidth + 10, 18, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, bx, by);
    ctx.restore();
  }

  /**
   * Vẽ hình mẫu gợi ý mờ (Ghost Sample Overlay) khi học sinh bật gợi ý Tầng 3
   */
  function drawSampleGhostPolygon(ctx, sampleVertices) {
    if (!sampleVertices) return;
    const { A, B, C, D } = sampleVertices;
    const pts = [A, B, C, D];
    const names = ['A*', 'B*', 'C*', 'D*'];

    ctx.save();
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = '#10b981';
    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.lineWidth = 2.2;

    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.lineTo(C.x, C.y);
    ctx.lineTo(D.x, D.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.setLineDash([]);
    pts.forEach((pt, idx) => {
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 5.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '700 11px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#047857';
      ctx.fillText(names[idx], pt.x + 8, pt.y - 8);
    });
    ctx.restore();
  }

  /**
   * Hàm render toàn bộ mặt phẳng Canvas chính
   */
  function renderScene(canvas, state) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const {
      vertices,
      analysis,
      showGrid = true,
      showDiagonals = true,
      showMathSymbols = true,
      activeVertex = null,
      hoverVertex = null,
      snappedVertex = null,
      sampleOverlayVertices = null
    } = state;

    ctx.clearRect(0, 0, width, height);
    drawCoordinateGrid(ctx, width, height, showGrid);

    // Vẽ hình mẫu gợi ý Tầng 3 nếu có
    if (sampleOverlayVertices) {
      drawSampleGhostPolygon(ctx, sampleOverlayVertices);
    }

    const { A, B, C, D } = vertices;
    const ordered = [A, B, C, D];
    const names = ['A', 'B', 'C', 'D'];
    const centroid = {
      x: (A.x + B.x + C.x + D.x) / 4,
      y: (A.y + B.y + C.y + D.y) / 4
    };

    const isValid = analysis && analysis.isValid;

    // 1. Vẽ miền đa giác ABCD
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.lineTo(C.x, C.y);
    ctx.lineTo(D.x, D.y);
    ctx.closePath();

    if (!isValid) {
      // Trạng thái ngoại lệ Tự cắt (US-02) hoặc Suy biến (US-03) -> Đổi viền đỏ cảnh báo
      ctx.fillStyle = 'rgba(239, 68, 68, 0.14)';
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 5]);
      ctx.fill();
      ctx.stroke();
    } else {
      const badgeColor = (analysis.classification && analysis.classification.badgeColor) || '#4f46e5';
      ctx.fillStyle = badgeColor + '18'; // Alpha ~10%
      ctx.strokeStyle = badgeColor;
      ctx.lineWidth = 2.8;
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // 2. Vẽ 2 đường chéo AC, BD và giao điểm (nếu hợp lệ & bật hiển thị)
    if (isValid && showDiagonals) {
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(C.x, C.y);
      ctx.moveTo(B.x, B.y);
      ctx.lineTo(D.x, D.y);
      ctx.stroke();
      ctx.setLineDash([]);

      const vm = analysis.visualMarkers;
      if (vm && vm.diagonalsBisect) {
        const midO = vm.midpointAC;
        if (vm.diagonalsPerpendicular && showMathSymbols) {
          drawRightAngleSquare(ctx, midO, A, B, 12);
        }
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(midO.x, midO.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '700 11px Inter, system-ui, sans-serif';
        ctx.fillText('O', midO.x + 6, midO.y - 6);
      }
      ctx.restore();
    }

    // 3. Vẽ các ký hiệu toán học trực quan trên Canvas (US-08 / FR-05)
    if (isValid && showMathSymbols) {
      const vm = analysis.visualMarkers;

      // 3a. Ký hiệu góc vuông hoặc cung góc
      for (let i = 0; i < 4; i++) {
        const key = names[i];
        const curr = ordered[i];
        const prev = ordered[(i + 3) % 4];
        const next = ordered[(i + 1) % 4];
        if (vm.rightAngleVertices.includes(key)) {
          drawRightAngleSquare(ctx, curr, prev, next, 16);
        } else {
          drawAngleArcAndLabel(ctx, curr, prev, next, analysis.anglesDeg[key], analysis.orientationSign);
        }
      }

      // 3b. Ký hiệu vạch gạch chéo cạnh bằng nhau
      if (vm.fourSidesEqual) {
        drawEqualSideTicks(ctx, A, B, 1, '#4f46e5');
        drawEqualSideTicks(ctx, B, C, 1, '#4f46e5');
        drawEqualSideTicks(ctx, C, D, 1, '#4f46e5');
        drawEqualSideTicks(ctx, D, A, 1, '#4f46e5');
      } else if (vm.oppositeSidesEqual) {
        drawEqualSideTicks(ctx, A, B, 1, '#0284c7');
        drawEqualSideTicks(ctx, C, D, 1, '#0284c7');
        drawEqualSideTicks(ctx, B, C, 2, '#7c3aed');
        drawEqualSideTicks(ctx, D, A, 2, '#7c3aed');
      } else if (vm.legSidesEqual) {
        if (vm.parallelPairs.AB_CD) {
          drawEqualSideTicks(ctx, B, C, 1, '#ea580c');
          drawEqualSideTicks(ctx, D, A, 1, '#ea580c');
        } else if (vm.parallelPairs.BC_DA) {
          drawEqualSideTicks(ctx, A, B, 1, '#ea580c');
          drawEqualSideTicks(ctx, C, D, 1, '#ea580c');
        }
      }

      // 3c. Ký hiệu mũi tên cạnh song song
      if (vm.parallelPairs.AB_CD) {
        drawParallelArrows(ctx, A, B, 1, '#0d9488');
        drawParallelArrows(ctx, D, C, 1, '#0d9488');
      }
      if (vm.parallelPairs.BC_DA) {
        drawParallelArrows(ctx, B, C, 2, '#0284c7');
        drawParallelArrows(ctx, A, D, 2, '#0284c7');
      }

      // 3d. Nhãn độ dài 4 cạnh (cm)
      drawSideLengthBadge(ctx, A, B, `${analysis.sidesCm.AB} cm`, centroid);
      drawSideLengthBadge(ctx, B, C, `${analysis.sidesCm.BC} cm`, centroid);
      drawSideLengthBadge(ctx, C, D, `${analysis.sidesCm.CD} cm`, centroid);
      drawSideLengthBadge(ctx, D, A, `${analysis.sidesCm.DA} cm`, centroid);
    }

    // 4. Vẽ vòng tròn hiệu ứng bắt điểm lưới Snap-to-grid (US-07)
    if (snappedVertex && vertices[snappedVertex]) {
      const sp = vertices[snappedVertex];
      ctx.save();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 5. Vẽ 4 đỉnh điều khiển A, B, C, D (Bán kính điểm chạm >= 8px theo NFR Usability)
    const vertexColors = {
      A: '#4f46e5',
      B: '#0284c7',
      C: '#0d9488',
      D: '#7c3aed'
    };

    ordered.forEach((pt, idx) => {
      const key = names[idx];
      const isHovered = hoverVertex === key || activeVertex === key;
      const radius = isHovered ? 10 : 8;

      ctx.save();
      // Đổ bóng đỉnh
      ctx.shadowColor = 'rgba(15, 23, 42, 0.25)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = isValid ? vertexColors[key] : '#dc2626';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Nhãn tên đỉnh A, B, C, D kèm tọa độ lưới (x, y)
      const outX = pt.x - centroid.x;
      const outY = pt.y - centroid.y;
      const outLen = Math.hypot(outX, outY) || 1;
      const lx = pt.x + (outX / outLen) * 24;
      const ly = pt.y + (outY / outLen) * 24;

      const gx = +(pt.x / GRID_SIZE).toFixed(1);
      const gy = +(pt.y / GRID_SIZE).toFixed(1);

      ctx.save();
      ctx.font = '700 13px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${key}(${gx},${gy})`, lx, ly);
      ctx.restore();
    });
  }

  /**
   * Xuất hình vẽ trên Canvas kèm bảng thông số ra ảnh PNG sắc nét (US-14 / FR-10)
   */
  function exportCanvasToPNG(sourceCanvas, state, studentName = 'Học sinh Lớp 8') {
    const { analysis } = state;
    const exportCanvas = document.createElement('canvas');
    const pad = 24;
    const footerHeight = 120;
    exportCanvas.width = sourceCanvas.width + pad * 2;
    exportCanvas.height = sourceCanvas.height + pad * 2 + footerHeight;

    const ctx = exportCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Vẽ khung Canvas chính
    ctx.drawImage(sourceCanvas, pad, pad);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pad, pad, sourceCanvas.width, sourceCanvas.height);

    // Vẽ phần Footer thông tin bài làm
    const fy = sourceCanvas.height + pad + 18;
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 16px Inter, system-ui, sans-serif';

    const shapeTitle = (analysis && analysis.isValid && analysis.classification)
      ? `${analysis.classification.vietnameseName} (${analysis.classification.name} - Rank ${analysis.classification.rank})`
      : 'Cảnh báo: Tứ giác chưa hợp lệ';

    ctx.fillText(`KẾT QUẢ DỰNG HÌNH TỨ GIÁC: ${shapeTitle.toUpperCase()}`, pad, fy + 12);

    ctx.font = '500 13px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#334155';
    if (analysis && analysis.isValid) {
      const s = analysis.sidesCm;
      const a = analysis.anglesDeg;
      ctx.fillText(
        `• Độ dài 4 cạnh: AB = ${s.AB} cm | BC = ${s.BC} cm | CD = ${s.CD} cm | DA = ${s.DA} cm   |   Đường chéo: AC = ${analysis.diagonalsCm.AC} cm, BD = ${analysis.diagonalsCm.BD} cm`,
        pad,
        fy + 38
      );
      ctx.fillText(
        `• Số đo 4 góc: Â = ${a.A}° | B̂ = ${a.B}° | Ĉ = ${a.C}° | D̂ = ${a.D}° (Tổng = ${analysis.angleSumDeg}°)   |   Chu vi P = ${analysis.perimeterCm} cm   |   Diện tích S = ${analysis.areaCm2} cm²`,
        pad,
        fy + 62
      );
    }

    ctx.fillStyle = '#64748b';
    ctx.font = '500 12px Inter, system-ui, sans-serif';
    const nowStr = new Date().toLocaleString('vi-VN');
    ctx.fillText(
      `Học sinh thực hiện: ${studentName}   |   Hệ thống QuadGeo Neo4j Knowledge Graph (Nhóm 4)   |   Thời gian xuất: ${nowStr}`,
      pad,
      fy + 88
    );

    const dataUrl = exportCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    const fileSlug = (analysis && analysis.isValid && analysis.classification)
      ? analysis.classification.id.toLowerCase()
      : 'tu_giac';
    link.download = `QuadGeo_Nhom4_${fileSlug}_${Date.now()}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  global.CanvasRenderer = {
    GRID_SIZE,
    renderScene,
    exportCanvasToPNG
  };
})(typeof window !== 'undefined' ? window : globalThis);
