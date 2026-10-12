/**
 * Main Application Controller (Frontend Layer)
 * Dự án: Ứng dụng Hỗ trợ Học Toán Hình học phẳng (Chuyên đề Tứ giác) - Nhóm 4
 * Điều phối tương tác Canvas 60FPS, Neo4j Cypher Reasoning, Bài tập dựng hình,
 * Gợi ý 3 tầng Graph Traversal, Trắc nghiệm định lý và Lưu vết học tập (:SOLVED).
 */

(function () {
  'use strict';

  const AppState = {
    currentTab: 'lab', // 'lab' | 'exercises' | 'quiz' | 'graph' | 'progress'
    vertices: {
      A: { x: 240, y: 120 },
      B: { x: 480, y: 120 },
      C: { x: 480, y: 360 },
      D: { x: 240, y: 360 }
    },
    analysis: null,
    neo4jReasoning: null,
    showGrid: true,
    snapToGrid: true,
    snapTo90: false,
    showDiagonals: true,
    showMathSymbols: true,
    activeVertex: null,
    hoverVertex: null,
    snappedVertex: null,
    activePresetKey: 'SQUARE',

    // Bài tập dựng hình & Gợi ý 3 tầng
    exercises: [],
    activeExercise: null,
    exerciseStartTime: Date.now(),
    currentHintTier: 0,
    lastHintData: null,
    showSampleOverlay: false,

    // Bài tập trắc nghiệm lý thuyết
    quizAnswers: {},
    quizResults: {},

    // Đồ thị tri thức Neo4j
    knowledgeGraph: null,
    graphViewMode: 'FULL',
    selectedGraphNodeId: 'SQUARE',
    renderedGraphNodes: [],

    // Trạng thái Neo4j & Người dùng JWT
    neo4jStatus: { connected: false, mode: 'IN_MEMORY_GRAPH_MIRROR', uri: 'bolt://localhost:7687' },
    currentUser: {
      id: 'USR_STUDENT_01',
      username: 'Đỗ Thành Trung',
      email: 'trung@student.edu.vn',
      role: 'student',
      className: 'Lớp 8A1'
    },
    jwtToken: localStorage.getItem('quadgeo_jwt') || '',
    solvedRecords: []
  };

  let classifyDebounceTimer = null;

  // ===========================================================================
  // KHỞI ĐỘNG ỨNG DỤNG
  // ===========================================================================

  document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('quadgeo_user');
    if (savedUser) {
      try {
        AppState.currentUser = JSON.parse(savedUser);
      } catch (_) {}
    }

    initCanvasInteraction();
    initGraphCanvasInteraction();
    bindUIEvents();
    updateUserHeaderUI();

    // Tính toán và vẽ khung hình đầu tiên tức thì (< 1ms)
    recomputeAndRender(true);

    // Tải dữ liệu từ Backend API
    fetchNeo4jStatus();
    fetchExercises();
    fetchKnowledgeGraph();
    fetchUserProgress();
  });

  // ===========================================================================
  // TƯƠNG TÁC CANVAS 2D THỜI GIAN THỰC (60 FPS - US-01, US-04, US-07)
  // ===========================================================================

  function initCanvasInteraction() {
    const canvas = document.getElementById('geometryCanvas');
    if (!canvas) return;

    function getCanvasMousePos(evt) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
      const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    }

    function findVertexAt(pos) {
      const keys = ['A', 'B', 'C', 'D'];
      const hitRadius = 16; // Bán kính bắt chuột/cảm ứng thoải mái (>= 8px theo NFR)
      for (const k of keys) {
        if (GeometryEngine.distancePx(pos, AppState.vertices[k]) <= hitRadius) {
          return k;
        }
      }
      return null;
    }

    function onPointerDown(evt) {
      const pos = getCanvasMousePos(evt);
      const hit = findVertexAt(pos);
      if (hit) {
        evt.preventDefault();
        AppState.activeVertex = hit;
        canvas.style.cursor = 'grabbing';
        recomputeAndRender(false);
      }
    }

    function onPointerMove(evt) {
      const pos = getCanvasMousePos(evt);

      if (!AppState.activeVertex) {
        const hit = findVertexAt(pos);
        if (hit !== AppState.hoverVertex) {
          AppState.hoverVertex = hit;
          canvas.style.cursor = hit ? 'grab' : 'default';
          requestAnimationFrame(() => renderMainCanvas());
        }
        return;
      }

      evt.preventDefault();
      // Giới hạn tọa độ đỉnh luôn nằm trong khung nhìn Canvas (FR-01)
      const margin = 20;
      let targetPt = {
        x: Math.max(margin, Math.min(canvas.width - margin, pos.x)),
        y: Math.max(margin, Math.min(canvas.height - margin, pos.y))
      };

      // Chế độ Snap-to-90° (FR-02)
      if (AppState.snapTo90) {
        targetPt = GeometryEngine.snapPointToRightAngle(
          AppState.activeVertex,
          targetPt,
          AppState.vertices,
          8.0
        );
      }

      // Chế độ Snap-to-grid bán kính 10px (US-07 / FR-02)
      AppState.snappedVertex = null;
      if (AppState.snapToGrid) {
        const snapped = GeometryEngine.snapPointToGrid(targetPt, 40.0, 10.0);
        targetPt = { x: snapped.x, y: snapped.y };
        if (snapped.snapped) {
          AppState.snappedVertex = AppState.activeVertex;
        }
      }

      AppState.vertices[AppState.activeVertex] = {
        x: Math.round(targetPt.x),
        y: Math.round(targetPt.y)
      };
      AppState.activePresetKey = null;
      updatePresetHighlight();

      recomputeAndRender(false);
    }

    function onPointerUp() {
      if (AppState.activeVertex) {
        AppState.activeVertex = null;
        AppState.snappedVertex = null;
        canvas.style.cursor = AppState.hoverVertex ? 'grab' : 'default';
        recomputeAndRender(true);
      }
    }

    canvas.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    canvas.addEventListener('touchstart', onPointerDown, { passive: false });
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);
  }

  function renderMainCanvas() {
    const canvas = document.getElementById('geometryCanvas');
    if (!canvas) return;
    CanvasRenderer.renderScene(canvas, {
      vertices: AppState.vertices,
      analysis: AppState.analysis,
      showGrid: AppState.showGrid,
      showDiagonals: AppState.showDiagonals,
      showMathSymbols: AppState.showMathSymbols,
      activeVertex: AppState.activeVertex,
      hoverVertex: AppState.hoverVertex,
      snappedVertex: AppState.snappedVertex,
      sampleOverlayVertices: (AppState.showSampleOverlay && AppState.activeExercise)
        ? AppState.activeExercise.sampleVertices
        : null
    });
  }

  function recomputeAndRender(syncBackend = true) {
    AppState.analysis = GeometryEngine.analyzeQuadrilateral(AppState.vertices);
    renderMainCanvas();
    updateMetricsPanelUI();
    updateCoordinateInputsUI();

    if (syncBackend) {
      clearTimeout(classifyDebounceTimer);
      classifyDebounceTimer = setTimeout(() => {
        syncNeo4jClassification();
      }, 60);
    }
  }

  // ===========================================================================
  // CẬP NHẬT BẢNG THÔNG SỐ THỜI GIAN THỰC & NHÃN PHÂN LOẠI (US-02, US-03, US-04, US-06)
  // ===========================================================================

  function updateMetricsPanelUI() {
    const res = AppState.analysis;
    if (!res) return;

    const warningBanner = document.getElementById('edgeCaseWarningBanner');
    const warningTitle = document.getElementById('edgeCaseWarningTitle');
    const warningDesc = document.getElementById('edgeCaseWarningDesc');
    const metricsContainer = document.getElementById('validMetricsContainer');
    const shapeBadge = document.getElementById('classifiedShapeBadge');
    const shapeRankBadge = document.getElementById('classifiedShapeRank');
    const shapeDescEl = document.getElementById('classifiedShapeDesc');
    const computeTimeEl = document.getElementById('engineComputeTime');

    if (computeTimeEl) {
      computeTimeEl.textContent = `${res.computeTimeMs} ms`;
    }

    // Xử lý ngoại lệ Tứ giác tự cắt (US-02) hoặc Hình suy biến (US-03)
    if (!res.isValid) {
      if (warningBanner) {
        warningBanner.classList.remove('hidden');
        warningTitle.textContent = res.status === 'INVALID_SELF_INTERSECTING'
          ? 'Cảnh báo: Tứ giác tự cắt (INVALID_SELF_INTERSECTING)'
          : 'Cảnh báo: Hình suy biến không hợp lệ (INVALID_DEGENERATE)';
        warningDesc.textContent = res.errorReason;
      }
      if (metricsContainer) {
        metricsContainer.classList.add('opacity-40', 'pointer-events-none');
      }
      if (shapeBadge) {
        shapeBadge.textContent = res.status === 'INVALID_SELF_INTERSECTING' ? 'Tứ giác tự cắt' : 'Hình suy biến';
        shapeBadge.style.backgroundColor = '#dc2626';
      }
      if (shapeRankBadge) {
        shapeRankBadge.textContent = 'Không hợp lệ';
      }
      if (shapeDescEl) {
        shapeDescEl.textContent = res.errorReason;
      }
      return;
    }

    // Hình hợp lệ
    if (warningBanner) warningBanner.classList.add('hidden');
    if (metricsContainer) metricsContainer.classList.remove('opacity-40', 'pointer-events-none');

    const cls = res.classification;
    if (shapeBadge) {
      shapeBadge.textContent = cls.vietnameseName;
      shapeBadge.style.backgroundColor = cls.badgeColor;
    }
    if (shapeRankBadge) {
      shapeRankBadge.textContent = `Rank ${cls.rank} • Tin cậy ${(cls.confidence * 100).toFixed(0)}%`;
    }
    if (shapeDescEl) {
      shapeDescEl.textContent = cls.description;
    }

    // Công thức Chu vi & Diện tích
    setText('formulaPerimeterText', cls.formulaPerimeter);
    setText('formulaAreaText', cls.formulaArea);

    // 4 cạnh, 2 đường chéo, Chu vi, Diện tích
    setText('valSideAB', `${res.sidesCm.AB} cm`);
    setText('valSideBC', `${res.sidesCm.BC} cm`);
    setText('valSideCD', `${res.sidesCm.CD} cm`);
    setText('valSideDA', `${res.sidesCm.DA} cm`);
    setText('valDiagAC', `${res.diagonalsCm.AC} cm`);
    setText('valDiagBD', `${res.diagonalsCm.BD} cm`);
    setText('valPerimeter', `${res.perimeterCm} cm`);
    setText('valArea', `${res.areaCm2} cm²`);

    // 4 góc trong & tổng 360°
    setText('valAngleA', `${res.anglesDeg.A}°`);
    setText('valAngleB', `${res.anglesDeg.B}°`);
    setText('valAngleC', `${res.anglesDeg.C}°`);
    setText('valAngleD', `${res.anglesDeg.D}°`);
    setText('valAngleSum', `${res.angleSumDeg}°`);

    // Danh sách thuộc tính hình học phát hiện được
    const propListEl = document.getElementById('detectedPropsList');
    if (propListEl) {
      propListEl.innerHTML = res.detectedPropertyLabels
        .map(
          p => `
          <div class="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <span class="font-medium text-slate-700">${p.label}</span>
            <code class="text-[10px] font-mono-code text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">${p.id}</code>
          </div>`
        )
        .join('');
    }

    // Quan hệ kế thừa (:SUBCLASS_OF)
    const subclassEl = document.getElementById('subclassListContainer');
    if (subclassEl) {
      if (cls.subclassOf && cls.subclassOf.length > 0) {
        subclassEl.innerHTML = cls.subclassOf
          .map(
            parentName => `
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
              :SUBCLASS_OF → ${parentName}
            </span>`
          )
          .join('');
      } else {
        subclassEl.innerHTML = `<span class="text-xs text-slate-500 italic">Hình gốc cơ sở trong phân cấp Tứ giác</span>`;
      }
    }

    // Cập nhật Cypher Query Inspector tức thì
    updateCypherInspectorUI(res.detectedPropertyIds, cls);
  }

  function updateCypherInspectorUI(detectedProps, cls, execMs = null) {
    const codeEl = document.getElementById('liveCypherQueryCode');
    const timeEl = document.getElementById('cypherExecTimeBadge');
    if (!codeEl) return;

    const propsJson = JSON.stringify(detectedProps);
    const cypherText = `// Kịch bản 1 (US-06): Phân loại Tứ giác bằng Cypher Pattern Matching
// Tham số đầu vào từ Canvas: $detectedPropertyIds = ${propsJson}
MATCH (s:Shape)
WHERE ALL(reqProp IN [(s)-[:HAS_PROPERTY]->(p:Property) | p.id]
          WHERE reqProp IN $detectedPropertyIds)
RETURN s.id AS ShapeId,
       s.vietnameseName AS TenHinh,
       s.rank AS DoUuTien
ORDER BY s.rank DESC
LIMIT 1;

// => Kết quả trả về: { ShapeId: "${cls.id}", TenHinh: "${cls.vietnameseName}", DoUuTien: ${cls.rank} }`;

    codeEl.textContent = cypherText;
    if (timeEl && execMs !== null) {
      timeEl.textContent = `Neo4j Query: ${execMs} ms`;
    }
  }

  function updateCoordinateInputsUI() {
    ['A', 'B', 'C', 'D'].forEach(k => {
      const xInput = document.getElementById(`coord${k}X`);
      const yInput = document.getElementById(`coord${k}Y`);
      if (xInput && document.activeElement !== xInput) {
        xInput.value = +(AppState.vertices[k].x / 40).toFixed(1);
      }
      if (yInput && document.activeElement !== yInput) {
        yInput.value = +(AppState.vertices[k].y / 40).toFixed(1);
      }
    });
  }

  async function syncNeo4jClassification() {
    if (!AppState.analysis || !AppState.analysis.isValid) return;
    try {
      const resp = await fetch('/api/geometry/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          detectedPropertyIds: AppState.analysis.detectedPropertyIds
        })
      });
      if (!resp.ok) return;
      const data = await resp.json();
      if (data.neo4jReasoning) {
        AppState.neo4jReasoning = data.neo4jReasoning;
        updateCypherInspectorUI(
          AppState.analysis.detectedPropertyIds,
          AppState.analysis.classification,
          data.neo4jReasoning.executionTimeMs
        );
      }
    } catch (_) {}
  }

  // ===========================================================================
  // HỆ THỐNG BÀI TẬP DỰNG HÌNH & GỢI Ý 3 TẦNG (US-10, US-11, FR-07, FR-08)
  // ===========================================================================

  async function fetchExercises() {
    try {
      const resp = await fetch('/api/exercises');
      const data = await resp.json();
      AppState.exercises = data.exercises || [];
      renderExerciseListUI();
      renderQuizListUI();
    } catch (_) {}
  }

  function renderExerciseListUI() {
    const container = document.getElementById('constructionExercisesList');
    if (!container) return;
    const constructions = AppState.exercises.filter(e => e.type === 'CONSTRUCTION');

    container.innerHTML = constructions
      .map(ex => {
        const isSolved = AppState.solvedRecords.some(r => r.exerciseId === ex.id && r.score === 100);
        const isActive = AppState.activeExercise && AppState.activeExercise.id === ex.id;
        return `
        <div class="p-3.5 rounded-xl border transition-all cursor-pointer ${
          isActive
            ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
            : 'border-slate-200 bg-white hover:border-indigo-300'
        }" onclick="window.QuadGeoApp.selectConstructionExercise('${ex.id}')">
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">${ex.difficultyLevel}</span>
            ${
              isSolved
                ? '<span class="text-xs font-semibold text-emerald-600 flex items-center gap-1">✓ Đã hoàn thành (100đ)</span>'
                : '<span class="text-xs text-slate-400">Chưa hoàn thành</span>'
            }
          </div>
          <h4 class="text-sm font-bold text-slate-800">${ex.title}</h4>
          <p class="text-xs text-slate-600 mt-1 line-clamp-2">${ex.prompt}</p>
        </div>`;
      })
      .join('');
  }

  function selectConstructionExercise(exerciseId) {
    const ex = AppState.exercises.find(e => e.id === exerciseId);
    if (!ex) return;

    AppState.activeExercise = ex;
    AppState.exerciseStartTime = Date.now();
    AppState.currentHintTier = 0;
    AppState.lastHintData = null;
    AppState.showSampleOverlay = false;

    // Đặt vị trí đỉnh ban đầu của bài tập để học sinh thực hành biến đổi
    if (ex.initialVertices) {
      AppState.vertices = JSON.parse(JSON.stringify(ex.initialVertices));
    }

    // Hiển thị thanh nhiệm vụ bài tập ngay trên Phòng Thí Nghiệm Canvas
    const banner = document.getElementById('activeExerciseWorkspaceBanner');
    if (banner) {
      banner.classList.remove('hidden');
      setText('activeExerciseTitle', ex.title);
      setText('activeExercisePrompt', ex.prompt);
      setText('hintTierBtnLabel', 'Gợi ý Tầng 1 (Lý thuyết)');
      const hintBox = document.getElementById('exerciseHintOutputBox');
      if (hintBox) hintBox.classList.add('hidden');
      const resultBox = document.getElementById('exerciseGradeOutputBox');
      if (resultBox) resultBox.classList.add('hidden');
      const showSampleBtn = document.getElementById('btnToggleSampleOverlay');
      if (showSampleBtn) showSampleBtn.classList.add('hidden');
    }

    renderExerciseListUI();
    recomputeAndRender(true);
  }

  function clearActiveExercise() {
    AppState.activeExercise = null;
    AppState.currentHintTier = 0;
    AppState.showSampleOverlay = false;
    const banner = document.getElementById('activeExerciseWorkspaceBanner');
    if (banner) banner.classList.add('hidden');
    renderExerciseListUI();
    renderMainCanvas();
  }

  async function requestNextHintTier() {
    if (!AppState.activeExercise) return;
    AppState.currentHintTier = Math.min(3, AppState.currentHintTier + 1);
    const tier = AppState.currentHintTier;

    const currentProps = (AppState.analysis && AppState.analysis.isValid)
      ? AppState.analysis.detectedPropertyIds
      : [];

    try {
      const resp = await fetch('/api/exercises/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetShapeId: AppState.activeExercise.targetShape,
          currentPropertyIds: currentProps,
          tier
        })
      });
      const data = await resp.json();
      AppState.lastHintData = data;
      renderHintBoxUI(data, tier);

      // Cập nhật nhãn nút Gợi ý tiếp theo
      const btnLabel = document.getElementById('hintTierBtnLabel');
      if (btnLabel) {
        if (tier === 1) btnLabel.textContent = 'Gợi ý Tầng 2 (Thao tác đỉnh)';
        else if (tier === 2) btnLabel.textContent = 'Gợi ý Tầng 3 (Tọa độ chuẩn)';
        else btnLabel.textContent = 'Đã mở cả 3 tầng gợi ý';
      }

      // Cập nhật Cypher Query 2 vào Cypher Inspector
      const codeEl = document.getElementById('liveCypherQueryCode');
      if (codeEl && data.cypherQuery) {
        codeEl.textContent = `// Kịch bản 2 (US-11): Gợi ý 3 tầng bằng Neo4j Graph Traversal (Tầng ${tier}/3)\n` + data.cypherQuery;
      }
    } catch (_) {}
  }

  function renderHintBoxUI(data, tier) {
    const hintBox = document.getElementById('exerciseHintOutputBox');
    const showSampleBtn = document.getElementById('btnToggleSampleOverlay');
    if (!hintBox) return;
    hintBox.classList.remove('hidden');

    if (data.alreadySatisfied) {
      hintBox.innerHTML = `
        <div class="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
          <strong>🎉 Hoàn hảo!</strong> ${data.message}
        </div>`;
      return;
    }

    let html = `
      <div class="space-y-2 text-xs">
        <div class="flex items-center justify-between text-indigo-900 font-bold">
          <span>💡 Hệ thống Gợi ý Đồ thị Neo4j (Đang mở ${tier}/3 tầng)</span>
          <span class="text-[11px] font-mono-code bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Thiếu: ${data.missingPropertyId}</span>
        </div>
        <div class="p-2.5 rounded-lg bg-white border border-indigo-100">
          <div class="font-semibold text-indigo-700 mb-0.5">📘 Tầng 1 - Khái niệm & Định lý (${data.tier1_theory.textbookChapter}):</div>
          <p class="text-slate-700">${data.tier1_theory.propertyDesc}</p>
          <p class="text-slate-500 mt-1 italic">Định lý: ${data.tier1_theory.theoremName} — ${data.tier1_theory.proofExplanation}</p>
        </div>`;

    if (tier >= 2) {
      html += `
        <div class="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
          <div class="font-semibold text-amber-800 mb-0.5">🎯 Tầng 2 - Hướng dẫn thao tác kéo đỉnh:</div>
          <p class="text-amber-900">${data.tier2_action.actionHint}</p>
        </div>`;
    }

    if (tier >= 3) {
      html += `
        <div class="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
          <div class="font-semibold text-emerald-800 mb-0.5">📐 Tầng 3 - Tọa độ chuẩn gợi ý & Hình mẫu:</div>
          <p class="text-emerald-900 font-mono-code">${data.tier3_solution.coordinateGuide}</p>
        </div>`;
      if (showSampleBtn) showSampleBtn.classList.remove('hidden');
    }

    html += `</div>`;
    hintBox.innerHTML = html;
  }

  function toggleSampleOverlay() {
    AppState.showSampleOverlay = !AppState.showSampleOverlay;
    const btn = document.getElementById('btnToggleSampleOverlay');
    if (btn) {
      btn.textContent = AppState.showSampleOverlay ? 'Ẩn hình mẫu' : 'Xem hình mẫu trên Canvas';
    }
    renderMainCanvas();
  }

  function applySampleVerticesDirectly() {
    if (!AppState.activeExercise || !AppState.activeExercise.sampleVertices) return;
    AppState.vertices = JSON.parse(JSON.stringify(AppState.activeExercise.sampleVertices));
    recomputeAndRender(true);
  }

  async function submitConstructionExercise() {
    if (!AppState.activeExercise) return;
    const resultBox = document.getElementById('exerciseGradeOutputBox');
    if (!AppState.analysis || !AppState.analysis.isValid) {
      if (resultBox) {
        resultBox.classList.remove('hidden');
        resultBox.innerHTML = `
          <div class="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            ❌ Không thể nộp bài: Hình vẽ hiện tại đang bị tự cắt hoặc suy biến. Vui lòng chỉnh lại các đỉnh trước khi nộp!
          </div>`;
      }
      return;
    }

    const elapsedSec = Math.max(1, Math.round((Date.now() - AppState.exerciseStartTime) / 1000));
    try {
      const resp = await fetch('/api/exercises/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(AppState.jwtToken ? { Authorization: `Bearer ${AppState.jwtToken}` } : {})
        },
        body: JSON.stringify({
          exerciseId: AppState.activeExercise.id,
          detectedPropertyIds: AppState.analysis.detectedPropertyIds,
          detectedShapeId: AppState.analysis.classification.id,
          completionTime: elapsedSec,
          user: AppState.currentUser
        })
      });
      const data = await resp.json();
      if (resultBox) {
        resultBox.classList.remove('hidden');
        if (data.isPassed) {
          resultBox.innerHTML = `
            <div class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="font-bold text-sm text-emerald-800">✅ CHÍNH XÁC! Điểm số: ${data.score}/100</span>
                <span class="text-[11px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-semibold">Thời gian: ${elapsedSec}s</span>
              </div>
              <p>${data.feedback}</p>
              <div class="text-[11px] text-emerald-700 font-mono-code">Đã ghi nhận quan hệ (:User {id: "${AppState.currentUser.id}"})-[:SOLVED {score: 100}]->(:Exercise {id: "${data.exerciseId}"})</div>
            </div>`;
          fetchUserProgress();
          renderExerciseListUI();
        } else {
          const missingHtml = (data.missingProperties || [])
            .map(m => `<li>• <strong>${m.desc}</strong> <em>(${m.actionHint})</em></li>`)
            .join('');
          resultBox.innerHTML = `
            <div class="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1.5">
              <div class="font-bold text-sm text-amber-800">⚠️ CHƯA ĐẠT YÊU CẦU (Điểm thành phần: ${data.score}/100)</div>
              <p>${data.feedback}</p>
              <ul class="space-y-1 mt-1 text-amber-800">${missingHtml}</ul>
            </div>`;
        }
      }
    } catch (_) {}
  }

  // ===========================================================================
  // TRẮC NGHIỆM LÝ THUYẾT LIÊN KẾT ĐỒ THỊ (US-09, FR-06)
  // ===========================================================================

  function renderQuizListUI() {
    const container = document.getElementById('quizQuestionsContainer');
    if (!container) return;
    const quizzes = AppState.exercises.filter(e => e.type === 'QUIZ');

    container.innerHTML = quizzes
      .map((q, idx) => {
        const selected = AppState.quizAnswers[q.id];
        const result = AppState.quizResults[q.id];

        const optionsHtml = (q.options || [])
          .map((optText, optIdx) => {
            const isSelected = selected === optIdx;
            let btnClass = 'border-slate-200 bg-white hover:border-indigo-300 text-slate-700';
            if (result) {
              if (optIdx === result.correctAnswer) {
                btnClass = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold';
              } else if (isSelected && !result.isCorrect) {
                btnClass = 'border-red-400 bg-red-50 text-red-800';
              }
            } else if (isSelected) {
              btnClass = 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold';
            }

            return `
            <button type="button"
              onclick="window.QuadGeoApp.selectQuizOption('${q.id}', ${optIdx})"
              class="w-full text-left px-3.5 py-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${btnClass}">
              <span>${optText}</span>
              ${isSelected ? '<span class="text-indigo-600 font-bold">●</span>' : ''}
            </button>`;
          })
          .join('');

        let explanationHtml = '';
        if (result) {
          const pf = result.proofPath || {};
          explanationHtml = `
          <div class="mt-3 p-3.5 rounded-xl border text-xs ${
            result.isCorrect
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/80 border-amber-200 text-amber-900'
          }">
            <div class="font-bold mb-1">
              ${result.isCorrect ? '✅ Chính xác! (+100 điểm)' : `❌ Chưa chính xác. Đáp án đúng là: ${result.correctOptionText}`}
            </div>
            <div class="text-[11px] font-semibold text-indigo-700 mt-1">
              🔗 Đường dẫn suy luận Neo4j: (:Property) ←[:REQUIRES]— (:Theorem {id: "${pf.theoremId}"}) —[:CONCLUDES]→ (:Shape {name: "${pf.concludesShape}"})
            </div>
            <p class="mt-1 text-slate-700"><strong>${pf.theoremName} (${pf.textbookChapter}):</strong> ${pf.proofExplanation}</p>
          </div>`;
        }

        return `
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div class="flex items-center justify-between gap-2 mb-2">
            <span class="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">Câu hỏi ${idx + 1} • ${q.difficultyLevel}</span>
            <span class="text-xs font-mono-code text-slate-400">(:Exercise {id: "${q.id}"})</span>
          </div>
          <h3 class="text-sm font-bold text-slate-900 mb-1">${q.title}</h3>
          <p class="text-xs text-slate-700 mb-3">${q.question}</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            ${optionsHtml}
          </div>
          <div class="mt-3 flex justify-end">
            <button type="button"
              onclick="window.QuadGeoApp.submitQuizAnswer('${q.id}')"
              class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-sm">
              Nộp câu trả lời & Xem chứng minh đồ thị
            </button>
          </div>
          ${explanationHtml}
        </div>`;
      })
      .join('');
  }

  function selectQuizOption(quizId, optionIdx) {
    AppState.quizAnswers[quizId] = optionIdx;
    renderQuizListUI();
  }

  async function submitQuizAnswer(quizId) {
    const selected = AppState.quizAnswers[quizId];
    if (selected === undefined) {
      alert('Vui lòng chọn một phương án trả lời trước khi nộp!');
      return;
    }
    try {
      const resp = await fetch('/api/exercises/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(AppState.jwtToken ? { Authorization: `Bearer ${AppState.jwtToken}` } : {})
        },
        body: JSON.stringify({
          exerciseId: quizId,
          selectedOption: selected,
          completionTime: 12,
          user: AppState.currentUser
        })
      });
      const data = await resp.json();
      AppState.quizResults[quizId] = data;
      renderQuizListUI();
      fetchUserProgress();
    } catch (_) {}
  }

  // ===========================================================================
  // ĐỒ THỊ TRI THỨC NEO4J & TRÌNH KHÁM PHÁ CYPHER (US-05)
  // ===========================================================================

  async function fetchKnowledgeGraph() {
    try {
      const resp = await fetch('/api/graph/knowledge');
      AppState.knowledgeGraph = await resp.json();
      renderGraphExplorerCanvas();
      updateSelectedGraphNodeUI('SQUARE');
    } catch (_) {}
  }

  function initGraphCanvasInteraction() {
    const canvas = document.getElementById('knowledgeGraphCanvas');
    if (!canvas) return;

    canvas.addEventListener('click', evt => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (evt.clientX - rect.left) * scaleX;
      const y = (evt.clientY - rect.top) * scaleY;

      for (const node of AppState.renderedGraphNodes) {
        if (Math.hypot(x - node.x, y - node.y) <= 32) {
          AppState.selectedGraphNodeId = node.id;
          renderGraphExplorerCanvas();
          updateSelectedGraphNodeUI(node.id);
          break;
        }
      }
    });
  }

  function renderGraphExplorerCanvas() {
    const canvas = document.getElementById('knowledgeGraphCanvas');
    if (!canvas || !AppState.knowledgeGraph) return;
    const activeShapeId = (AppState.analysis && AppState.analysis.isValid && AppState.analysis.classification)
      ? AppState.analysis.classification.id
      : 'SQUARE';

    AppState.renderedGraphNodes = GraphVisualizer.renderKnowledgeGraph(canvas, AppState.knowledgeGraph, {
      activeShapeId,
      selectedNodeId: AppState.selectedGraphNodeId,
      viewMode: AppState.graphViewMode
    });
  }

  function updateSelectedGraphNodeUI(nodeId) {
    if (!AppState.knowledgeGraph) return;
    const node = (AppState.knowledgeGraph.nodes || []).find(n => n.id === nodeId);
    if (!node) return;

    setText('graphNodeInspectorTitle', `${node.label} (:${node.group})`);
    setText('graphNodeInspectorId', `id: "${node.id}" • ${node.subLabel}`);
    setText('graphNodeInspectorDesc', node.details || '');

    const rels = (AppState.knowledgeGraph.edges || []).filter(
      e => e.from === nodeId || e.to === nodeId
    );
    const relsEl = document.getElementById('graphNodeInspectorRels');
    if (relsEl) {
      relsEl.innerHTML = rels
        .map(
          r => `
          <div class="px-2.5 py-1.5 rounded bg-slate-800 text-slate-200 font-mono-code text-[11px]">
            (${r.from}) -[:${r.label}]-> (${r.to})
          </div>`
        )
        .join('');
    }
  }

  // ===========================================================================
  // LƯU VẾT HỌC TẬP (:User)-[:SOLVED]->(:Exercise) & AUTH JWT (US-12, US-13)
  // ===========================================================================

  async function fetchUserProgress() {
    try {
      const resp = await fetch(`/api/users/progress?userId=${encodeURIComponent(AppState.currentUser.id)}`);
      const data = await resp.json();
      AppState.solvedRecords = data.records || [];
      renderProgressDashboardUI(data);
      renderExerciseListUI();
    } catch (_) {}
  }

  function renderProgressDashboardUI(data) {
    const records = data.records || [];
    const total = data.totalExercises || 11;
    const solvedCount = records.length;
    const avgScore = solvedCount > 0
      ? Math.round(records.reduce((s, r) => s + r.score, 0) / solvedCount)
      : 0;

    setText('statSolvedCount', `${solvedCount} / ${total}`);
    setText('statAvgScore', `${avgScore} điểm`);
    setText('statProgressPercent', `${Math.round((solvedCount / total) * 100)}%`);

    const tbody = document.getElementById('solvedHistoryTableBody');
    if (tbody) {
      if (records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-slate-400 text-xs">Chưa có bài tập nào được hoàn thành. Hãy làm bài ở tab Bài Tập Dựng Hình hoặc Trắc Nghiệm!</td></tr>`;
      } else {
        tbody.innerHTML = records
          .map(
            r => `
            <tr class="border-b border-slate-100 text-xs">
              <td class="py-2.5 px-3 font-semibold text-slate-800">${r.exerciseTitle}</td>
              <td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono-code text-[11px]">${r.targetShape}</span></td>
              <td class="py-2.5 px-3 font-bold text-emerald-600">${r.score}/100</td>
              <td class="py-2.5 px-3 text-slate-600">${r.attemptCount} lần</td>
              <td class="py-2.5 px-3 text-slate-600">${r.completionTime} giây</td>
              <td class="py-2.5 px-3 text-slate-400 font-mono-code text-[11px]">(:User)-[:SOLVED]->(:Exercise)</td>
            </tr>`
          )
          .join('');
      }
    }
  }

  function updateUserHeaderUI() {
    const u = AppState.currentUser;
    setText('headerUsername', u.username);
    setText('headerUserRole', `${u.className} • ${u.role === 'teacher' ? 'Giảng viên' : 'Học sinh'}`);
  }

  async function fetchNeo4jStatus() {
    try {
      const resp = await fetch('/api/neo4j/status');
      const data = await resp.json();
      AppState.neo4jStatus = data;
      updateNeo4jBadgeUI();
    } catch (_) {}
  }

  function updateNeo4jBadgeUI() {
    const dot = document.getElementById('neo4jStatusDot');
    const text = document.getElementById('neo4jStatusText');
    if (!dot || !text) return;

    if (AppState.neo4jStatus.connected) {
      dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse';
      text.textContent = 'Neo4j Bolt: Đã kết nối';
    } else {
      dot.className = 'w-2.5 h-2.5 rounded-full bg-indigo-500';
      text.textContent = 'Neo4j Graph Engine: Sẵn sàng';
    }
  }

  // ===========================================================================
  // SỰ KIỆN GIAO DIỆN NGƯỜI DÙNG
  // ===========================================================================

  function bindUIEvents() {
    // Khởi tạo các nút chọn mẫu hình nhanh (Presets)
    const presetContainer = document.getElementById('presetShapesContainer');
    if (presetContainer) {
      presetContainer.innerHTML = Object.entries(GeometryEngine.PRESET_SHAPES)
        .map(([key, item]) => {
          const isEdgeCase = key === 'SELF_INTERSECTING' || key === 'DEGENERATE';
          return `
            <button type="button"
              data-preset="${key}"
              onclick="window.QuadGeoApp.applyPreset('${key}')"
              class="preset-chip px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                isEdgeCase
                  ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'
              } ${key === AppState.activePresetKey ? 'active' : ''}">
              ${item.label}
            </button>`;
        })
        .join('');
    }

    // Toggles trên thanh công cụ Canvas
    bindCheckbox('toggleGrid', val => {
      AppState.showGrid = val;
      renderMainCanvas();
    });
    bindCheckbox('toggleSnapGrid', val => {
      AppState.snapToGrid = val;
    });
    bindCheckbox('toggleSnap90', val => {
      AppState.snapTo90 = val;
    });
    bindCheckbox('toggleDiagonals', val => {
      AppState.showDiagonals = val;
      renderMainCanvas();
    });
    bindCheckbox('toggleMathSymbols', val => {
      AppState.showMathSymbols = val;
      renderMainCanvas();
    });

    // Ô nhập tọa độ trực tiếp A, B, C, D
    ['A', 'B', 'C', 'D'].forEach(k => {
      const xIn = document.getElementById(`coord${k}X`);
      const yIn = document.getElementById(`coord${k}Y`);
      const onCoordChange = () => {
        const gx = parseFloat(xIn.value);
        const gy = parseFloat(yIn.value);
        if (!isNaN(gx) && !isNaN(gy)) {
          AppState.vertices[k] = {
            x: Math.max(20, Math.min(700, Math.round(gx * 40))),
            y: Math.max(20, Math.min(500, Math.round(gy * 40)))
          };
          recomputeAndRender(true);
        }
      };
      if (xIn) xIn.addEventListener('change', onCoordChange);
      if (yIn) yIn.addEventListener('change', onCoordChange);
    });
  }

  function applyPreset(presetKey) {
    const preset = GeometryEngine.PRESET_SHAPES[presetKey];
    if (!preset) return;
    AppState.vertices = JSON.parse(JSON.stringify(preset.vertices));
    AppState.activePresetKey = presetKey;
    updatePresetHighlight();
    recomputeAndRender(true);
  }

  function updatePresetHighlight() {
    document.querySelectorAll('[data-preset]').forEach(btn => {
      if (btn.getAttribute('data-preset') === AppState.activePresetKey) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function switchTab(tabName) {
    AppState.currentTab = tabName;
    ['lab', 'exercises', 'quiz', 'graph', 'progress'].forEach(t => {
      const sec = document.getElementById(`tabSection_${t}`);
      const btn = document.getElementById(`tabBtn_${t}`);
      if (sec) sec.classList.toggle('hidden', t !== tabName);
      if (btn) btn.classList.toggle('active', t === tabName);
    });
    if (tabName === 'graph') {
      renderGraphExplorerCanvas();
    } else if (tabName === 'progress') {
      fetchUserProgress();
    }
  }

  function setGraphViewMode(mode) {
    AppState.graphViewMode = mode;
    renderGraphExplorerCanvas();
  }

  function exportCurrentCanvasPNG() {
    const canvas = document.getElementById('geometryCanvas');
    if (!canvas) return;
    CanvasRenderer.exportCanvasToPNG(
      canvas,
      { vertices: AppState.vertices, analysis: AppState.analysis },
      `${AppState.currentUser.username} (${AppState.currentUser.className})`
    );
  }

  // Modal Kết nối Neo4j & Seed Knowledge Graph
  async function connectNeo4jFromModal() {
    const uri = document.getElementById('inputNeo4jUri').value.trim();
    const user = document.getElementById('inputNeo4jUser').value.trim();
    const password = document.getElementById('inputNeo4jPassword').value;
    const msgEl = document.getElementById('neo4jModalMessage');

    if (msgEl) {
      msgEl.className = 'text-xs p-2.5 rounded-lg bg-slate-100 text-slate-700';
      msgEl.textContent = 'Đang kiểm tra kết nối tới Neo4j Server...';
      msgEl.classList.remove('hidden');
    }

    try {
      const resp = await fetch('/api/neo4j/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri, user, password })
      });
      const data = await resp.json();
      await fetchNeo4jStatus();
      if (msgEl) {
        if (data.connected) {
          msgEl.className = 'text-xs p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium';
          msgEl.textContent = '✅ ' + data.message;
        } else {
          msgEl.className = 'text-xs p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800';
          msgEl.textContent = `⚠️ Không thể kết nối Bolt trực tiếp (${data.error}). Hệ thống đang tự động sử dụng In-Memory Knowledge Graph Mirror.`;
        }
      }
    } catch (err) {
      if (msgEl) msgEl.textContent = 'Lỗi kết nối: ' + err.message;
    }
  }

  async function seedNeo4jFromModal() {
    const msgEl = document.getElementById('neo4jModalMessage');
    if (msgEl) {
      msgEl.className = 'text-xs p-2.5 rounded-lg bg-indigo-50 text-indigo-700';
      msgEl.textContent = 'Đang thực thi kịch bản Cypher khởi tạo Knowledge Graph...';
      msgEl.classList.remove('hidden');
    }
    try {
      const resp = await fetch('/api/neo4j/seed', { method: 'POST' });
      const data = await resp.json();
      if (msgEl) {
        msgEl.className = 'text-xs p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium';
        msgEl.textContent = '✅ ' + (data.message || 'Khởi tạo thành công!');
      }
    } catch (err) {
      if (msgEl) msgEl.textContent = 'Lỗi seed: ' + err.message;
    }
  }

  // Modal Đăng nhập / Chuyển đổi tài khoản học sinh nhanh
  async function loginWithDemoAccount(email, password) {
    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await resp.json();
      if (data.success) {
        AppState.currentUser = data.user;
        AppState.jwtToken = data.token;
        localStorage.setItem('quadgeo_user', JSON.stringify(data.user));
        localStorage.setItem('quadgeo_jwt', data.token);
        updateUserHeaderUI();
        fetchUserProgress();
        closeModal('authModal');
      } else {
        alert(data.error || 'Đăng nhập thất bại');
      }
    } catch (_) {}
  }

  async function submitCustomAuth(mode) {
    const email = document.getElementById('authEmailInput').value.trim();
    const password = document.getElementById('authPasswordInput').value;
    const username = document.getElementById('authNameInput').value.trim();
    const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';

    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username, className: 'Lớp 8A1' })
      });
      const data = await resp.json();
      if (data.success) {
        AppState.currentUser = data.user;
        AppState.jwtToken = data.token;
        localStorage.setItem('quadgeo_user', JSON.stringify(data.user));
        localStorage.setItem('quadgeo_jwt', data.token);
        updateUserHeaderUI();
        fetchUserProgress();
        closeModal('authModal');
      } else {
        alert(data.error || 'Thao tác thất bại');
      }
    } catch (_) {}
  }

  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function bindCheckbox(id, cb) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', e => cb(e.target.checked));
    }
  }

  window.QuadGeoApp = {
    switchTab,
    applyPreset,
    selectConstructionExercise,
    clearActiveExercise,
    requestNextHintTier,
    toggleSampleOverlay,
    applySampleVerticesDirectly,
    submitConstructionExercise,
    selectQuizOption,
    submitQuizAnswer,
    setGraphViewMode,
    exportCurrentCanvasPNG,
    openModal,
    closeModal,
    connectNeo4jFromModal,
    seedNeo4jFromModal,
    loginWithDemoAccount,
    submitCustomAuth
  };
})();
