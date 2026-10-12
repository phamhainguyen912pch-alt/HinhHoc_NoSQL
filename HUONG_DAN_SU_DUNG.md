# HƯỚNG DẪN CÀI ĐẶT VÀ SỬ DỤNG HỆ THỐNG QUADGEO NEO4J

**Đề tài:** Xây dựng ứng dụng hỗ trợ học toán hình học phẳng (Chuyên đề Tứ giác - Toán lớp 8)  
**Đơn vị thực hiện:** Nhóm 4  
**Giảng viên hướng dẫn:** Thầy Trần Bình  

---

## 1. Giới thiệu nhanh về ứng dụng

Khi học phần **Tứ giác (Hình học phẳng lớp 8)**, học sinh thường bị rối ở chỗ một hình có thể vừa thuộc loại này vừa thuộc loại khác (ví dụ: *Hình vuông* vừa là *Hình chữ nhật*, vừa là *Hình thoi*; cả hai lại cùng là trường hợp đặc biệt của *Hình bình hành*).

Nhóm 4 xây dựng **QuadGeo Neo4j** bằng cách kết hợp hai thành phần chính:
1. **Mặt phẳng tương tác hình học 2D (Core Geometry Engine + HTML5 Canvas 60fps):** Cho phép kéo-thả 4 đỉnh $A, B, C, D$ trực tiếp trên lưới tọa độ, tự động đo độ dài 4 cạnh, 2 đường chéo, 4 góc trong, chu vi, diện tích và vẽ các ký hiệu toán học (góc vuông, vạch cạnh bằng nhau, mũi tên song song).
2. **Đồ thị tri thức Neo4j (Knowledge Graph):** Lưu trữ toàn bộ cây phả hệ 9 loại tứ giác, 13 tính chất hình học sơ cấp và các định lý SGK Toán 8 dưới dạng các đỉnh (`Node`) và mối quan hệ (`Relationship`). Từ các tính chất mà Canvas phát hiện được, hệ thống dùng truy vấn **Cypher** để phân loại hình, chấm bài tự động và đưa ra gợi ý từng bước khi học sinh làm bài tập dựng hình.

---

## 2. Cấu trúc thư mục dự án

```text
2627k1t3-ThanhTrung-Coder/
├── docs/
│   ├── Nhóm 4_SRS.docx                 # [Hạng mục 1] Hồ sơ đặc tả yêu cầu phần mềm (bản Word)
│   ├── SRS_HO_SO_DAC_TA.md             # [Hạng mục 1] Hồ sơ đặc tả định dạng Markdown xem nhanh trên GitHub
│   └── PRODUCT_BACKLOG.md              # [Hạng mục 2] Product Backlog 15 User Stories & Kế hoạch 4 Sprint
├── neo4j/
│   └── scripts/
│       ├── 01_constraints_indexes.cypher   # Tạo ràng buộc duy nhất (Constraints) và chỉ mục (Indexes)
│       ├── 02_seed_knowledge_graph.cypher  # Khởi tạo toàn bộ Node (:Shape, :Property, :Theorem, :Exercise, :User)
│       └── 03_core_queries.cypher          # 5 kịch bản truy vấn Cypher cốt lõi để chạy kiểm thử trên Neo4j
├── src/
│   ├── engine/
│   │   ├── geometry_engine.py          # Core Geometry Engine phía Backend & phục vụ Unit Test
│   │   └── geometryEngine.js           # Module Geometry Engine cho môi trường Node.js
│   └── db/
│       ├── neo4j_service.py            # Dịch vụ kết nối Neo4j Bolt & suy diễn đồ thị (Python)
│       └── neo4jService.js             # Dịch vụ kết nối Neo4j Bolt (Node.js)
├── public/
│   ├── index.html                      # Giao diện chính của ứng dụng
│   ├── css/styles.css                  # Định dạng giao diện và bảng vẽ
│   └── js/
│       ├── geometryEngine.js           # Giải thuật vector 2D tính toán thời gian thực tại Client (< 1ms)
│       ├── canvasRenderer.js           # Bộ vẽ lưới tọa độ, ký hiệu toán học và xuất ảnh PNG
│       ├── graphVisualizer.js          # Bộ vẽ trực quan hóa Đồ thị Tri thức Neo4j
│       └── app.js                      # Điều phối sự kiện giao diện, bài tập, gợi ý 3 tầng và đăng nhập JWT
├── tests/
│   └── test_geometry_engine.py         # Bộ 13 kịch bản Unit Test kiểm thử toán học & ngoại lệ
├── app.py                              # Server Backend chạy bằng Python (Flask + Neo4j Driver)
├── server.js                           # Server Backend tương đương viết bằng Node.js (Express + Neo4j Driver)
├── requirements.txt                    # Các thư viện Python cần dùng
├── package.json                        # Cấu hình gói thư viện Node.js
├── run.bat                             # File chạy nhanh 1-click trên Windows
└── HUONG_DAN_SU_DUNG.md                # [Hạng mục 4] Tài liệu hướng dẫn cài đặt & sử dụng
```

---

## 3. Hướng dẫn cài đặt và khởi chạy ứng dụng

Dự án hỗ trợ chạy ngay bằng **Python** (đã tích hợp sẵn file `run.bat` trên Windows) hoặc chạy bằng **Node.js**. Ngoài ra, hệ thống có sẵn cơ chế **In-Memory Graph Mirror** đồng bộ 100% với kịch bản Cypher, nên dù máy chưa bật Neo4j Server thì toàn bộ tính năng vẫn chạy đầy đủ để giảng viên kiểm tra ngay lập tức.

### Cách 1: Chạy nhanh bằng 1 cú nhấp chuột trên Windows (Khuyên dùng)
1. Mở thư mục dự án, nhấp đúp vào file **`run.bat`**.
2. File này sẽ tự động chạy bộ **13 Unit Tests** để kiểm tra độ chính xác toán học, sau đó khởi động Web Server tại cổng `3000`.
3. Mở trình duyệt (Chrome, Edge, Firefox) và truy cập:
   ```text
   http://localhost:3000
   ```

### Cách 2: Chạy qua Terminal / PowerShell bằng Python
```bash
# Cài đặt thư viện (nếu máy chưa có)
pip install -r requirements.txt

# Chạy bộ Unit Test kiểm tra giải thuật hình học
python tests/test_geometry_engine.py

# Khởi động Server
python app.py
```
Sau đó mở trình duyệt vào địa chỉ `http://localhost:3000`.

### Cách 3: Chạy bằng Node.js (nếu dùng môi trường Node)
```bash
npm install
npm start
```

---

## 4. Hướng dẫn kết nối và khởi tạo dữ liệu trên Neo4j (Desktop / AuraDB)

Bạn có thể nạp Đồ thị Tri thức (Knowledge Graph) vào Neo4j theo 2 cách rất đơn giản:

### Cách A: Kết nối và Seed trực tiếp ngay trên giao diện Web
1. Trên góc phải thanh menu trên cùng của trang web, bấm vào nút **`Neo4j Graph: Sẵn sàng`**.
2. Nhập thông tin kết nối Neo4j của bạn:
   - **Neo4j Desktop (Local):** `bolt://localhost:7687` (Username: `neo4j`, Password: mật khẩu DBMS của bạn).
   - **Neo4j AuraDB (Cloud):** `neo4j+s://xxxxxxxx.databases.neo4j.io` (kèm Username và Password của Instance).
3. Bấm **`Kiểm tra & Lưu kết nối`**.
4. Bấm nút **`⚡ Chạy Cypher Seed Knowledge Graph (US-05)`**. Hệ thống sẽ tự động đọc 2 file trong `neo4j/scripts/` và khởi tạo toàn bộ 9 Node `:Shape`, 13 Node `:Property`, 8 Node `:Theorem`, 11 Node `:Exercise`, 3 Node `:User` cùng các cạnh quan hệ lên Neo4j.

### Cách B: Chạy thủ công trên Neo4j Browser / Aura Workspace
1. Mở **Neo4j Browser** hoặc **Neo4j Aura Query Editor**.
2. Mở file `neo4j/scripts/01_constraints_indexes.cypher`, copy nội dung và bấm **Run**.
3. Mở file `neo4j/scripts/02_seed_knowledge_graph.cypher`, copy toàn bộ nội dung và bấm **Run**.
4. Mở file `neo4j/scripts/03_core_queries.cypher` để chạy thử nghiệm 5 câu lệnh Cypher cốt lõi của dự án.

---

## 5. Hướng dẫn thao tác và kiểm thử các tính năng chính (Theo 15 User Stories)

### 5.1. Tương tác mặt phẳng Canvas & Nhận diện tứ giác thời gian thực (`US-01` → `US-08`)
Tại tab **`📐 Phòng Thí Nghiệm & Bài Tập Dựng Hình`**:
- **Kéo-thả 4 đỉnh $A, B, C, D$:** Nhấp giữ chuột vào bất kỳ đỉnh nào trên mặt phẳng và di chuyển. Độ dài 4 cạnh, 2 đường chéo, 4 góc trong, chu vi và diện tích ở cột bên phải sẽ cập nhật tức thì với tốc độ `< 1ms` (60 khung hình/giây).
- **Nhập tọa độ chính xác:** Dưới khung Canvas có 4 ô tọa độ `Đỉnh A(x,y)`, `B(x,y)`, `C(x,y)`, `D(x,y)` tính theo đơn vị ô lưới (1 ô = 1 cm) để bạn có thể gõ số đo chính xác khi cần.
- **Các công cụ hỗ trợ dựng hình (Thanh công cụ phía trên Canvas):**
  - `Lưới tọa độ (1 ô = 1cm)`: Bật/tắt lưới ô vuông.
  - `Bắt điểm lưới (Snap 10px)`: Khi kéo đỉnh lại gần giao điểm lưới trong phạm vi 10px, đỉnh sẽ tự hút vào nút lưới và hiện vòng tròn xanh lá báo hiệu.
  - `Hỗ trợ góc vuông (Snap 90°)`: Giúp căn chỉnh cạnh ngang/dọc vuông góc dễ dàng khi kéo bằng chuột.
  - `Đường chéo AC, BD` & `Ký hiệu toán học`: Tự động vẽ ô vuông góc $90^\circ$, vạch đánh dấu các cạnh bằng nhau, mũi tên chỉ cặp cạnh song song và giao điểm trung điểm $O$.
- **Thanh chọn nhanh Mẫu tứ giác chuẩn:** Phía trên cùng có các nút chọn nhanh đủ **9 loại tứ giác** (*Hình vuông, Hình chữ nhật, Hình thoi, Hình bình hành, Hình thang vuông, Hình thang cân, Hình thang thường, Tứ giác lồi, Tứ giác lõm*) và **2 trường hợp ngoại lệ**:
  - Bấm thử **`Ngoại lệ: Tứ giác tự cắt`** (`US-02`): Hai cạnh đối cắt nhau, viền đa giác lập tức chuyển sang màu đỏ nét đứt, hiện cảnh báo `INVALID_SELF_INTERSECTING` và khóa bảng tính diện tích.
  - Bấm thử **`Ngoại lệ: Hình suy biến`** (`US-03`): Ba đỉnh $A, B, C$ thẳng hàng ($S_{\triangle} \le 0.01\text{ cm}^2$), hệ thống báo lỗi `INVALID_DEGENERATE`.
- **Khung Neo4j Cypher Reasoning Inspector (Góc dưới bên phải):** Hiển thị trực tiếp câu lệnh Cypher `MATCH (s:Shape) WHERE ALL(...)` cùng danh sách `$detectedPropertyIds` thực tế đang được gửi xuống Neo4j để suy luận ra tên hình.

### 5.2. Làm bài tập thực hành dựng hình & Gợi ý 3 tầng (`US-10`, `US-11`)
Ngay bên dưới khung Canvas là danh sách **6 bài tập thực hành dựng hình**:
1. Nhấp chọn một bài tập (ví dụ: *Bài 1: Dựng Hình vuông ABCD* hoặc *Bài 3: Dựng Hình thoi ABCD*). Một thanh nhiệm vụ màu xanh đậm sẽ xuất hiện ngay phía trên Canvas và đưa 4 đỉnh về vị trí xuất phát của đề bài.
2. Nếu chưa biết cần chỉnh đỉnh nào, hãy bấm nút màu vàng **`💡 Gợi ý Tầng 1 (Lý thuyết)`**:
   - **Bấm lần 1 (Tầng 1 - Lý thuyết):** Hệ thống chạy Cypher duyệt đồ thị để tìm thuộc tính mà hình của bạn đang thiếu so với hình mục tiêu, đồng thời trích dẫn định lý SGK Toán 8 tương ứng.
   - **Bấm lần 2 (Tầng 2 - Thao tác đỉnh):** Hướng dẫn cụ thể cần kéo đỉnh nào, theo phương nào để đạt được tính chất còn thiếu.
   - **Bấm lần 3 (Tầng 3 - Tọa độ chuẩn & Hình mẫu):** Đưa ra bộ tọa độ chuẩn gợi ý và mở khóa nút **`Xem hình mẫu trên Canvas`** (vẽ khung nét đứt màu xanh lá trực tiếp lên Canvas để học sinh dễ đối chiếu).
3. Sau khi kéo các đỉnh đúng yêu cầu, bấm **`✓ Nộp bài chấm điểm (Graph Validation)`**. Hệ thống sẽ đối chiếu toàn bộ thuộc tính với đồ thị Neo4j, chấm điểm trên thang 100 và lưu kết quả vào lịch sử học tập.

### 5.3. Làm bài tập trắc nghiệm lý thuyết liên kết đồ thị (`US-09`)
Chuyển sang tab **`📝 Trắc Nghiệm Định Lý Neo4j`**:
- Chọn đáp án cho các câu hỏi lý thuyết (như dấu hiệu nhận biết Hình chữ nhật, Hình thoi, Hình thang cân, tính chất đa kế thừa của Hình vuông, định lý tổng 4 góc tứ giác).
- Bấm **`Nộp câu trả lời & Xem chứng minh đồ thị`**. Hệ thống chấm Đúng/Sai ngay lập tức và hiển thị chuỗi suy luận đồ thị:
  `(:Property) <--[:REQUIRES]-- (:Theorem) --[:CONCLUDES]--> (:Shape)` kèm lời giải chi tiết theo SGK Toán 8.

### 5.4. Khám phá Đồ thị Tri thức Neo4j (`US-05`)
Chuyển sang tab **`🕸️ Đồ Thị Tri Thức & Cypher Lab`**:
- Quan sát trực quan sơ đồ mạng lưới các Node `:Shape` (màu tím/xanh), `:Property` (màu xanh lục) và `:Theorem` (màu vàng cam).
- Nhấp chuột vào bất kỳ hình nào trên sơ đồ (ví dụ: `Hình vuông`, `Hình chữ nhật`, `Hình thoi`) để xem chi tiết thuộc tính của Node đó và danh sách các cạnh quan hệ `:SUBCLASS_OF`, `:HAS_PROPERTY`, `:CONCLUDES` ở bảng bên phải.
- Có thể chuyển đổi giữa chế độ xem **Đồ thị đầy đủ** và **Chỉ xem Cây phả hệ (`:SUBCLASS_OF`)**.

### 5.5. Quản lý tài khoản JWT, Xem tiến độ học tập & Xuất ảnh PNG (`US-12`, `US-13`, `US-14`)
- **Đổi tài khoản / Đăng ký / Đăng nhập (`US-13`):** Bấm vào ô tên người dùng ở góc trên bên phải để chuyển nhanh giữa các tài khoản mẫu (*Đỗ Thành Trung*, *Nguyễn Minh Anh*, *Thầy Trần Bình*) hoặc đăng ký tài khoản học sinh mới với xác thực JWT Token.
- **Xem lịch sử làm bài (`US-12`):** Chuyển sang tab **`🏆 Tiến Độ Học Tập (:SOLVED)`** để xem bảng thống kê các bài tập đã giải, điểm số, số lần thử và thời gian hoàn thành được lưu qua quan hệ `(:User)-[:SOLVED]->(:Exercise)`.
- **Xuất phiếu bài làm ra ảnh PNG (`US-14`):** Tại phòng thí nghiệm Canvas, bấm nút **`📸 Xuất ảnh bài làm PNG`**. Trình duyệt sẽ tải về một tệp ảnh `.png` sắc nét bao gồm cả hình vẽ trên lưới tọa độ lẫn khung tổng hợp thông số (tên hình, độ dài 4 cạnh, 2 đường chéo, 4 góc, chu vi, diện tích, tên học sinh và thời gian xuất bài).
