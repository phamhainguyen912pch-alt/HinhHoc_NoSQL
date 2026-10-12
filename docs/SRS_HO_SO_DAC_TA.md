# HỒ SƠ ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)

**Tên dự án:** Ứng dụng Hỗ trợ Học Toán Hình học phẳng (Chuyên đề Tứ giác) kết hợp Cơ sở dữ liệu Đồ thị Tri thức Neo4j  
**Đơn vị thực hiện:** Nhóm 4  
**Giảng viên hướng dẫn:** Thầy Trần Bình  
**Phiên bản:** 2.0 (Bổ sung Kiến trúc Knowledge Graph & Suy diễn Neo4j)  

> Bản gốc định dạng Microsoft Word được lưu trữ tại: [`docs/Nhóm 4_SRS.docx`](./Nhóm%204_SRS.docx).

---

## PHẦN 1: TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)

### 1.1 Mục đích tài liệu
Tài liệu này xác định chi tiết các yêu cầu chức năng (FR), yêu cầu phi chức năng (NFR), quy chuẩn toán học hình học phẳng và kiến trúc tích hợp cơ sở dữ liệu đồ thị Neo4j cho dự án **"Ứng dụng hỗ trợ học toán hình học phẳng (Chuyên đề Tứ giác)"**.

### 1.2 Lý do lựa chọn Cơ sở dữ liệu Đồ thị Neo4j
Trong chương trình Toán lớp 8 (Chuyên đề Tứ giác), các hình tứ giác có quan hệ phả hệ **đa kế thừa (Multiple Inheritance)** và ràng buộc logic chặt chẽ:
- **Hình vuông** vừa là **Hình thoi** (có 4 cạnh bằng nhau), vừa là **Hình chữ nhật** (có 4 góc vuông).
- Cả **Hình chữ nhật** và **Hình thoi** đều kế thừa từ **Hình bình hành**.
- **Hình bình hành**, **Hình thang vuông** và **Hình thang cân** đều kế thừa từ **Hình thang**.

Với cơ sở dữ liệu quan hệ (SQL), việc truy vấn cây phả hệ đa kế thừa hoặc tìm đường đi suy luận chứng minh định lý đòi hỏi nhiều phép JOIN đệ quy phức tạp. **Neo4j** giải quyết bài toán này tự nhiên và trực tiếp thông qua **Graph Pattern Matching** và **Graph Traversal** bằng ngôn ngữ truy vấn **Cypher**.

---

## PHẦN 2: KIẾN TRÚC KỸ THUẬT & MÔ HÌNH ĐỒ THỊ NEO4J

### 2.1 Kiến trúc phân tầng (4-Tier Architecture)
1. **Presentation Layer (Frontend Canvas):** Tương tác trực tiếp trên HTML5 Canvas 60fps, hiển thị nhãn phân loại hình học và tự động vẽ các ký hiệu toán học.
2. **Core Geometry Engine (Client & Backend):** Giải thuật đại số vector 2D tính tọa độ, độ dài 4 cạnh, 2 đường chéo, 4 góc trong, chu vi, diện tích; kiểm tra dung sai $\varepsilon$ để trích xuất danh sách đặc trưng hình học sơ cấp (`$detectedPropertyIds`).
3. **Application Backend API (Service Layer):** RESTful APIs, xác thực JWT, điều phối truy vấn tới Neo4j qua giao thức Bolt.
4. **Graph Knowledge & Reasoning Engine (Neo4j Database):** Lưu trữ cây phả hệ tứ giác, định lý SGK Toán 8, ngân hàng bài tập và lịch sử làm bài của học sinh.

### 2.2 Mô hình dữ liệu Đồ thị (Graph Schema)

#### Danh mục Node Labels
| Node Label | Thuộc tính chính (Properties) | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- |
| `:Shape` | `id`, `name`, `vietnameseName`, `rank`, `minSides`, `formulaPerimeter`, `formulaArea` | Đại diện cho 9 loại hình tứ giác (từ Tứ giác lõm Rank 1 đến Hình vuông Rank 10) |
| `:Property` | `id`, `category`, `desc`, `actionHint`, `ruleCode` | Đặc trưng hình học sơ cấp (4 cạnh bằng nhau, 2 cặp cạnh đối song song, có góc vuông...) |
| `:Theorem` | `id`, `name`, `textbookChapter`, `proofExplanation`, `targetShape` | Định lý và dấu hiệu nhận biết trong SGK Toán 8 |
| `:Exercise` | `id`, `type`, `title`, `difficultyLevel`, `targetShape`, `tolerance` | Bài tập thực hành dựng hình (`CONSTRUCTION`) và câu hỏi trắc nghiệm (`QUIZ`) |
| `:User` | `id`, `username`, `email`, `role`, `className`, `createdAt` | Tài khoản học sinh và giảng viên |

#### Danh mục Relationship Types
| Relationship Type | Nút nguồn → Nút đích | Ý nghĩa ngữ nghĩa đồ thị |
| :--- | :--- | :--- |
| `:SUBCLASS_OF` | `(:Shape) -> (:Shape)` | Quan hệ kế thừa phả hệ đa chiều |
| `:HAS_PROPERTY` | `(:Shape) -> (:Property)` | Tính chất cấu thành bắt buộc của một loại tứ giác |
| `:REQUIRES` | `(:Theorem) -> (:Property)` | Giả thiết điều kiện cần của định lý |
| `:CONCLUDES` | `(:Theorem) -> (:Shape)` | Kết luận định lý khẳng định loại hình học |
| `:TARGETS` | `(:Exercise) -> (:Shape)` | Loại hình mục tiêu mà bài tập yêu cầu |
| `:SOLVED` | `(:User) -> (:Exercise)` | Lưu vết kết quả nộp bài (`score`, `attemptCount`, `completionTime`, `solvedAt`) |

---

## PHẦN 3: QUY CHUẨN TOÁN HỌC & DUNG SAI HÌNH HỌC ($\varepsilon$)

- **Tỷ lệ quy đổi chuẩn:** $1\text{ ô lưới} = 40\text{ pixel} = 1.0\text{ cm}$.
- **So sánh độ dài đoạn thẳng:** $|L_1 - L_2| \le 0.05\text{ cm}$ hoặc sai số tương đối $\le 1.0\%$.
- **Kiểm tra góc vuông:** $|\text{Góc} - 90^\circ| \le 0.5^\circ$.
- **Kiểm tra tính song song:** Góc lệch giữa 2 vector chỉ phương $\le 0.5^\circ$.
- **Kiểm tra cắt nhau tại trung điểm:** Khoảng cách giữa trung điểm 2 đường chéo $AC$ và $BD \le 3\text{ pixel}$.
- **Kiểm tra thẳng hàng (Hình suy biến):** Diện tích tam giác tạo bởi 3 đỉnh bất kỳ $S_{\triangle} \le 0.01\text{ cm}^2$.
- **Kiểm tra trùng đỉnh (Hình suy biến):** Khoảng cách Euclid giữa 2 đỉnh $< 4\text{ pixel}$.
- **Bán kính bắt điểm lưới (`Snap-to-grid`):** $10\text{ pixel}$ tính từ tâm nút lưới.

### Thứ tự ưu tiên phân loại 9 bậc (`rank` giảm dần từ 10 về 1)
1. **Hình vuông (`SQUARE` - Rank 10):** 2 cặp cạnh song song + 4 cạnh bằng nhau + có ít nhất 1 góc vuông.
2. **Hình thoi (`RHOMBUS` - Rank 8):** 2 cặp cạnh song song + 4 cạnh bằng nhau.
3. **Hình chữ nhật (`RECTANGLE` - Rank 8):** 2 cặp cạnh song song + có ít nhất 1 góc vuông.
4. **Hình bình hành (`PARALLELOGRAM` - Rank 6):** Có 2 cặp cạnh đối song song.
5. **Hình thang vuông (`RIGHT_TRAPEZOID` - Rank 5):** Có đúng 1 cặp cạnh đối song song + có góc vuông.
6. **Hình thang cân (`ISOSCELES_TRAPEZOID` - Rank 5):** Có đúng 1 cặp cạnh đối song song + 2 góc kề đáy bằng nhau (hoặc 2 đường chéo bằng nhau).
7. **Hình thang (`TRAPEZOID` - Rank 4):** Có đúng 1 cặp cạnh đối song song.
8. **Tứ giác lồi thông thường (`CONVEX_QUADRILATERAL` - Rank 2):** Cả 4 góc trong $< 180^\circ$.
9. **Tứ giác lõm (`CONCAVE_QUADRILATERAL` - Rank 1):** Có đúng 1 góc trong $> 180^\circ$.

---

## PHẦN 4: TÓM TẮT YÊU CẦU CHỨC NĂNG (FR-01 → FR-10)

- **FR-01:** Kéo thả 4 đỉnh $A, B, C, D$ độc lập trong biên khung nhìn Canvas.
- **FR-02:** Bật/Tắt lưới tọa độ, bắt điểm nút lưới (`Snap-to-grid` 10px) và hỗ trợ góc vuông (`Snap-to-90°`).
- **FR-03:** Tính toán thời gian thực độ dài 4 cạnh, 2 đường chéo, 4 góc trong, chu vi, diện tích với độ trễ $< 16\text{ ms}$ (60 FPS).
- **FR-04:** Phân loại và dán nhãn tứ giác tự động qua truy vấn Cypher trên Neo4j.
- **FR-05:** Tự động vẽ ký hiệu góc vuông (ô vuông nhỏ), vạch gạch chéo cạnh bằng nhau và mũi tên cạnh song song.
- **FR-06:** Bài tập trắc nghiệm lý thuyết truy xuất từ ngân hàng định lý Neo4j kèm đường dẫn chứng minh.
- **FR-07:** Bài tập thực hành dựng hình chấm tự động bằng Neo4j Graph Validation.
- **FR-08:** Cơ chế gợi ý thông minh 3 tầng bằng Neo4j Graph Traversal (Tầng 1: Định lý → Tầng 2: Thao tác đỉnh → Tầng 3: Tọa độ chuẩn & Xem hình mẫu).
- **FR-09:** Đăng ký/đăng nhập JWT và lưu vết tiến độ học tập `(:User)-[:SOLVED]->(:Exercise)`.
- **FR-10:** Xuất phiếu kết quả bài làm kèm hình vẽ và thông số ra tệp ảnh PNG sắc nét.
