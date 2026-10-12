# PRODUCT BACKLOG & KẾ HOẠCH SPRINT (AGILE / SCRUM)

**Dự án:** Ứng dụng Hỗ trợ Học Toán Hình học phẳng (Chuyên đề Tứ giác) kết hợp Neo4j  
**Đơn vị thực hiện:** Nhóm 4  
**Giảng viên hướng dẫn:** Thầy Trần Bình  

---

## 1. Bảng Product Backlog cho bản phát hành MVP (15 User Stories)

Toàn bộ các User Stories được biên soạn theo tiêu chuẩn nghiệm thu **Gherkin (`Given - When - Then`)** và ước lượng độ phức tạp bằng **Story Points (SP - dãy Fibonacci)**:

| Mã US | Tên User Story | Tiêu chí nghiệm thu (Given - When - Then) | Story Points (SP) | Trạng thái |
| :--- | :--- | :--- | :---: | :---: |
| **US-01** | Kéo thả đỉnh Canvas | **Given** người dùng trên Canvas, **When** kéo thả một đỉnh, **Then** đỉnh di chuyển theo chuột và 2 cạnh kề cập nhật vị trí tức thời. | 5 | Hoàn thành |
| **US-02** | Xử lý tứ giác tự cắt | **Given** 4 đỉnh tạo thành hình tự cắt, **When** dừng di chuyển đỉnh, **Then** viền hình đổi màu đỏ và ẩn bảng kết quả tính toán. | 5 | Hoàn thành |
| **US-03** | Xử lý hình suy biến | **Given** 3 điểm thẳng hàng hoặc 2 điểm trùng nhau, **When** kiểm tra diện tích tam giác xấp xỉ 0, **Then** cảnh báo hình suy biến không hợp lệ. | 3 | Hoàn thành |
| **US-04** | Tính toán thời gian thực | **Given** tứ giác hợp lệ, **When** người dùng di chuyển đỉnh, **Then** cập nhật tức thì độ dài 4 cạnh, 4 góc, chu vi, diện tích với sai số < 16ms. | 5 | Hoàn thành |
| **US-05** | Khởi tạo Graph Neo4j | **Given** Neo4j đã cài đặt, **When** chạy Cypher seed script, **Then** khởi tạo đầy đủ các Node `Shape`, `Property`, `Theorem` và các liên kết quan hệ. | 5 | Hoàn thành |
| **US-06** | Phân loại tứ giác Cypher | **Given** tập thuộc tính hình học từ Canvas, **When** gửi đến API phân loại, **Then** Neo4j Cypher pattern matching trả về chính xác tên hình cao nhất. | 8 | Hoàn thành |
| **US-07** | Lưới tọa độ & Snap | **Given** bật chế độ Snap-to-grid, **When** kéo đỉnh vào bán kính 10px của nút lưới, **Then** đỉnh tự động hút chặt vào nút lưới. | 5 | Hoàn thành |
| **US-08** | Ký hiệu toán học trực quan | **Given** các góc/cạnh thỏa mãn tính chất, **When** vẽ trên Canvas, **Then** tự động vẽ góc vuông, vạch gạch bằng nhau, mũi tên song song. | 5 | Hoàn thành |
| **US-09** | Trắc nghiệm lý thuyết Neo4j | **Given** câu hỏi lý thuyết từ Neo4j, **When** học sinh chọn đáp án và nộp bài, **Then** trả về kết quả Đúng/Sai kèm đường dẫn định lý chứng minh. | 3 | Hoàn thành |
| **US-10** | Dựng hình chấm tự động | **Given** bài toán dựng hình kèm ràng buộc, **When** học sinh bấm Nộp bài, **Then** Neo4j Graph Validation đối chiếu cấu trúc và báo kết quả. | 8 | Hoàn thành |
| **US-11** | Gợi ý 3 tầng Graph Traversal | **Given** học sinh bấm nút Gợi ý, **When** bấm lần lượt 1, 2, 3, **Then** Neo4j duyệt đồ thị tìm thuộc tính thiếu để sinh gợi ý lý thuyết, thao tác và đáp án. | 8 | Hoàn thành |
| **US-12** | Lưu vết học tập Neo4j | **Given** học sinh hoàn thành bài nộp, **When** hệ thống ghi nhận kết quả, **Then** tạo quan hệ `(:User)-[:SOLVED]->(:Exercise)` lưu điểm và thời gian. | 5 | Hoàn thành |
| **US-13** | Đăng ký & Đăng nhập | **Given** thông tin tài khoản hợp lệ, **When** người dùng gửi yêu cầu, **Then** tạo tài khoản học sinh và cấp token JWT bảo mật. | 3 | Hoàn thành |
| **US-14** | Xuất ảnh bài làm PNG | **Given** hình vẽ hoàn chỉnh trên Canvas, **When** học sinh bấm Tải ảnh, **Then** xuất tệp tin PNG sắc nét lưu về máy tính. | 3 | Hoàn thành |
| **US-15** | Mã nguồn & Cypher Scripts | **Given** kho lưu trữ mã nguồn, **When** kiểm tra Github repo, **Then** có đầy đủ mã nguồn Frontend, Backend và thư mục scripts Cypher Neo4j. | 5 | Hoàn thành |

**Tổng khối lượng công việc (Total Effort):** `76 Story Points`

---

## 2. Kế hoạch triển khai theo từng Sprint (Sprint Plan)

### Sprint 1 (Tuần 1 - 2): Core Geometry Engine & Thiết kế Neo4j Schema (23 SP)
- **Mục tiêu Sprint:** Xây dựng nền tảng toán học 2D vững chắc và chuẩn hóa mô hình dữ liệu đồ thị Neo4j.
- **Hạng mục bàn giao:**
  - Xây dựng Canvas tương tác 2D, giải thuật đại số vector, xử lý tứ giác tự cắt (`INVALID_SELF_INTERSECTING`), suy biến (`INVALID_DEGENERATE`) và tính toán thông số thời gian thực `< 16ms` (`US-01`, `US-02`, `US-03`, `US-04`).
  - Thiết kế Schema đồ thị Neo4j và viết kịch bản Cypher khởi tạo dữ liệu gốc (`US-05`).

### Sprint 2 (Tuần 3 - 4): Tích hợp Cypher Reasoning & Hoàn thiện Canvas (18 SP)
- **Mục tiêu Sprint:** Kết nối Frontend Canvas với bộ suy diễn Neo4j và hoàn thiện trải nghiệm trực quan.
- **Hạng mục bàn giao:**
  - Tích hợp Neo4j Driver vào Backend API, hiện thực hóa Cypher Query phân loại tứ giác tự động theo `rank` ưu tiên (`US-06`).
  - Hoàn thiện hệ thống lưới tọa độ `Snap-to-grid` (bán kính 10px), `Snap-to-90°` và tự động vẽ các ký hiệu toán học góc vuông, cạnh bằng nhau, mũi tên song song (`US-07`, `US-08`).

### Sprint 3 (Tuần 5 - 6): Module Bài tập & Thuật toán Gợi ý 3 tầng Neo4j (19 SP)
- **Mục tiêu Sprint:** Đưa đồ thị tri thức vào hỗ trợ việc học và tự động hóa chấm điểm.
- **Hạng mục bàn giao:**
  - Hiện thực Module bài tập trắc nghiệm lý thuyết kèm giải thích đường dẫn định lý (`US-09`).
  - Xây dựng bài tập thực hành dựng hình tự chấm bằng Neo4j Graph Validation (`US-10`).
  - Hiện thực giải thuật gợi ý thông minh 3 tầng qua Graph Traversal (`US-11`).

### Sprint 4 (Tuần 7 - 8): Quản lý người dùng, Đóng gói mã nguồn & Nghiệm thu (16 SP)
- **Mục tiêu Sprint:** Hoàn thiện quản lý tiến độ học sinh, kiểm thử toàn diện và đóng gói bàn giao.
- **Hạng mục bàn giao:**
  - Xây dựng hệ thống xác thực JWT và lưu vết tiến độ học tập `(:User)-[:SOLVED]->(:Exercise)` trên Neo4j (`US-12`, `US-13`).
  - Tính năng xuất phiếu bài làm ra ảnh PNG chất lượng cao (`US-14`).
  - Kiểm thử Unit Test (`> 90% coverage`), đóng gói source code lên GitHub và biên soạn tài liệu hướng dẫn sử dụng (`US-15`).
