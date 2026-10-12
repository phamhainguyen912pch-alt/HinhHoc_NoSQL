/**
 * Interactive Neo4j Knowledge Graph & Ontology Visualizer
 * Dự án: Ứng dụng Hỗ trợ Học Toán Hình học phẳng (Chuyên đề Tứ giác) - Nhóm 4
 * Trực quan hóa các Node (:Shape, :Property, :Theorem) và Relationship (:SUBCLASS_OF, :HAS_PROPERTY, :REQUIRES, :CONCLUDES)
 */

(function (global) {
  'use strict';

  // Tọa độ bố cục chuẩn cho Cây Phả Hệ Tứ Giác (Taxonomy / Ontology Hierarchy)
  const TAXONOMY_POSITIONS = {
    SQUARE:                { x: 420, y: 70 },
    RHOMBUS:               { x: 230, y: 175 },
    RECTANGLE:             { x: 610, y: 175 },
    PARALLELOGRAM:         { x: 260, y: 295 },
    ISOSCELES_TRAPEZOID:   { x: 480, y: 295 },
    RIGHT_TRAPEZOID:       { x: 690, y: 295 },
    TRAPEZOID:             { x: 420, y: 405 },
    CONVEX_QUADRILATERAL:  { x: 290, y: 500 },
    CONCAVE_QUADRILATERAL: { x: 590, y: 500 }
  };

  function drawArrowEdge(ctx, fromPt, toPt, label, color, isHighlighted, dashed = false) {
    const dx = toPt.x - fromPt.x;
    const dy = toPt.y - fromPt.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 20) return;

    const ux = dx / dist;
    const uy = dy / dist;
    const startX = fromPt.x + ux * 32;
    const startY = fromPt.y + uy * 26;
    const endX = toPt.x - ux * 34;
    const endY = toPt.y - uy * 28;

    ctx.save();
    if (dashed) ctx.setLineDash([4, 4]);
    ctx.strokeStyle = isHighlighted ? '#4f46e5' : color;
    ctx.lineWidth = isHighlighted ? 2.6 : 1.6;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Đầu mũi tên
    const headLen = 8;
    const angle = Math.atan2(endY - startY, endX - startX);
    ctx.fillStyle = isHighlighted ? '#4f46e5' : color;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - headLen * Math.cos(angle - Math.PI / 6), endY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(endX - headLen * Math.cos(angle + Math.PI / 6), endY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    // Nhãn Relationship
    const mx = (startX + endX) / 2;
    const my = (startY + endY) / 2;
    ctx.font = '600 9.5px Inter, system-ui, sans-serif';
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(mx - tw / 2 - 3, my - 7, tw + 6, 14);
    ctx.fillStyle = isHighlighted ? '#4338ca' : '#64748b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, mx, my);
    ctx.restore();
  }

  function renderKnowledgeGraph(canvas, graphData, options = {}) {
    if (!canvas || !graphData) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const {
      activeShapeId = 'SQUARE',
      selectedNodeId = null,
      viewMode = 'FULL' // 'TAXONOMY' hoặc 'FULL'
    } = options;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Vẽ lưới chấm nền tối kiểu Neo4j Bloom
    ctx.fillStyle = '#1e293b';
    for (let x = 24; x < width; x += 28) {
      for (let y = 24; y < height; y += 28) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const nodePositions = {};
    const visibleNodes = [];

    // 1. Định vị các Node :Shape
    (graphData.shapes || []).forEach(sh => {
      const base = TAXONOMY_POSITIONS[sh.id] || { x: width / 2, y: height / 2 };
      const scaleX = width / 840;
      const scaleY = height / 560;
      const pos = { x: base.x * scaleX, y: base.y * scaleY };
      nodePositions[sh.id] = pos;
      visibleNodes.push({
        id: sh.id,
        label: sh.vietnameseName,
        subLabel: `Rank ${sh.rank}`,
        group: 'Shape',
        x: pos.x,
        y: pos.y,
        raw: sh
      });
    });

    // 2. Nếu ở chế độ FULL, hiển thị thêm các Node :Property và :Theorem liên kết với hình đang chọn
    const focusShapeId = selectedNodeId && TAXONOMY_POSITIONS[selectedNodeId] ? selectedNodeId : activeShapeId;
    if (viewMode === 'FULL') {
      const props = graphData.properties || [];
      props.forEach((p, idx) => {
        const angle = (idx / props.length) * Math.PI * 2;
        const px = 95 + (idx % 2) * 55;
        const py = 65 + idx * 36;
        nodePositions[p.id] = { x: px, y: Math.min(height - 30, py) };
        visibleNodes.push({
          id: p.id,
          label: p.id.replace('PROP_', ''),
          subLabel: ':Property',
          group: 'Property',
          x: nodePositions[p.id].x,
          y: nodePositions[p.id].y,
          raw: p
        });
      });

      const theorems = graphData.theorems || [];
      theorems.forEach((th, idx) => {
        const tx = width - 115 - (idx % 2) * 35;
        const ty = 75 + idx * 56;
        nodePositions[th.id] = { x: tx, y: Math.min(height - 35, ty) };
        visibleNodes.push({
          id: th.id,
          label: th.id.replace('TH_', 'ĐL: '),
          subLabel: ':Theorem',
          group: 'Theorem',
          x: nodePositions[th.id].x,
          y: nodePositions[th.id].y,
          raw: th
        });
      });
    }

    // 3. Vẽ các cạnh Relationship
    (graphData.edges || []).forEach(edge => {
      const p1 = nodePositions[edge.from];
      const p2 = nodePositions[edge.to];
      if (!p1 || !p2) return;

      if (edge.type === 'SUBCLASS_OF') {
        const isHi = edge.from === focusShapeId || edge.to === focusShapeId;
        drawArrowEdge(ctx, p1, p2, ':SUBCLASS_OF', '#38bdf8', isHi, false);
      } else if (viewMode === 'FULL') {
        if (edge.type === 'HAS_PROPERTY' && edge.from === focusShapeId) {
          drawArrowEdge(ctx, p1, p2, ':HAS_PROPERTY', '#10b981', true, true);
        } else if (edge.type === 'CONCLUDES' && edge.to === focusShapeId) {
          drawArrowEdge(ctx, p1, p2, ':CONCLUDES', '#f59e0b', true, false);
        } else if (edge.type === 'REQUIRES') {
          const thNode = (graphData.theorems || []).find(t => t.id === edge.from);
          if (thNode && thNode.targetShape === focusShapeId) {
            drawArrowEdge(ctx, p1, p2, ':REQUIRES', '#a855f7', false, true);
          }
        }
      }
    });

    // 4. Vẽ các Node
    visibleNodes.forEach(node => {
      const isFocus = node.id === focusShapeId || node.id === selectedNodeId;
      ctx.save();

      if (node.group === 'Shape') {
        const r = isFocus ? 32 : 26;
        ctx.shadowColor = isFocus ? '#6366f1' : 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = isFocus ? 18 : 8;
        ctx.fillStyle = isFocus ? '#4f46e5' : '#1e293b';
        ctx.strokeStyle = isFocus ? '#a5b4fc' : '#38bdf8';
        ctx.lineWidth = isFocus ? 3 : 2;

        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 10.5px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, node.x, node.y - 5);

        ctx.fillStyle = '#93c5fd';
        ctx.font = '600 9px Inter, system-ui, sans-serif';
        ctx.fillText(node.subLabel, node.x, node.y + 10);
      } else if (node.group === 'Property') {
        const w = 122;
        const h = 24;
        ctx.fillStyle = '#064e3b';
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(node.x - w / 2, node.y - h / 2, w, h, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ecfdf5';
        ctx.font = '600 9px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, node.x, node.y);
      } else if (node.group === 'Theorem') {
        const w = 126;
        const h = 26;
        ctx.fillStyle = '#78350f';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(node.x - w / 2, node.y - h / 2, w, h, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fef3c7';
        ctx.font = '600 9.5px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, node.x, node.y);
      }

      ctx.restore();
    });

    return visibleNodes;
  }

  global.GraphVisualizer = {
    renderKnowledgeGraph
  };
})(typeof window !== 'undefined' ? window : globalThis);
