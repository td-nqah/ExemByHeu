# ExamPulse - Nền tảng Khảo thí & Chấm thi Trực tuyến

Hệ thống khảo thí trực tuyến hiện đại (Next.js App Router, TypeScript, Tailwind CSS, Supabase PostgreSQL, RLS) hỗ trợ bóc tách đề thi tự động từ Word (.docx), Excel (.xlsx), PDF, phòng thi thời gian thực và phòng chấm thi tự luận.

---

## 1. Kiến trúc Hệ thống & Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4.
- **UI & Icons**: Lucide React, Shadcn UI style components, Geist Typography.
- **Cơ sở dữ liệu & Phân quyền**: Supabase (PostgreSQL, Row Level Security - RLS).
- **Bộ bóc tách tài liệu (Document Parsers)**:
  - Word (.docx): `mammoth` kết hợp Regex Parser Engine.
  - Excel (.xlsx): `xlsx` (SheetJS) tự động nhận diện cột câu hỏi, đáp án, điểm số.
  - PDF (.pdf): Parser trích xuất luồng văn bản và cấu trúc câu hỏi.
- **Mục tiêu triển khai**: Tối ưu hóa sẵn sàng cho Vercel.

---

## 2. Tài khoản Thử nghiệm Mặc định

Thông tin tài khoản để đăng nhập vào hệ thống:

| Vai trò | Tên đăng nhập | Mật khẩu | Trang chuyển hướng |
|---|---|---|---|
| Quản trị viên (Admin) | `admin` | `1` | `/admin/dashboard` |
| User | `user` | `1` | `/dashboard` |

---

## 3. Quy trình & Luồng Nghiệp vụ

### A. Quản trị viên (Admin)
1. **Bảng điều khiển (`/admin/dashboard`)**:
   - Thống kê tổng số đề thi, đề đã xuất bản, tổng lượt thi và số bài chờ chấm.
   - Bật/tắt trạng thái xuất bản đề thi (Đang mở thi / Bản nháp).
2. **Tạo đề thi & Bóc tách Tệp tin (`/admin/exams/create`)**:
   - Tải lên tệp Word (`.docx`), Excel (`.xlsx`), hoặc PDF.
   - Hỗ trợ nạp nhanh dữ liệu mẫu với 1 cú nhấp chuột (Word/Excel/PDF).
   - Trình chỉnh sửa tương tác trước khi lưu: sửa nội dung, thêm/xóa lựa chọn, đổi loại câu (Trắc nghiệm / Tự luận), chỉnh điểm tối đa.
   - Nhấn "Xác nhận & Xuất bản đề thi" để lưu vào hệ thống.
3. **Quản lý Bài nộp & Chấm thi (`/admin/submissions`)**:
   - Thống kê lượt nộp theo từng đề thi và số bài chưa chấm.
   - Lọc bài thi theo trạng thái: Tất cả / Chờ chấm / Đã hoàn thành.
4. **Phòng Chấm thi Chi tiết (`/admin/submissions/[id]`)**:
   - Điểm trắc nghiệm được khóa và hiển thị tự động.
   - Các câu tự luận hiển thị câu trả lời của user cùng ô nhập Điểm (ràng buộc không vượt quá điểm tối đa) và ô Nhận xét của giảng viên.
   - Nhấn "Hoàn tất Chấm thi & Cập nhật điểm": Tự động tính toán lại `total_score = mcq_score + essay_score`, cập nhật trạng thái `graded`.

### B. User
1. **Danh sách Đề thi (`/dashboard`)**:
   - Xem các đề thi đang mở, thời lượng, số lượng câu hỏi và tỷ lệ câu trắc nghiệm / tự luận.
   - Nhấn "Vào làm bài" để vào phòng thi.
2. **Phòng thi Thời gian thực (`/exam/[id]`)**:
   - Đồng hồ đếm ngược thông minh (chuyển màu vàng khi dưới 5 phút, nhấp nháy đỏ khi dưới 2 phút). Tự động nộp bài khi hết giờ.
   - Thanh điều hướng câu hỏi bên trái: hiển thị trạng thái Đã làm (xanh) / Chưa làm (xám), nhấp để cuộn nhanh đến câu hỏi.
   - Trắc nghiệm: Lựa chọn trực quan dạng thẻ.
   - Tự luận: Vùng soạn thảo kèm bộ đếm từ và ký tự thời gian thực.
   - Hộp thoại xác nhận trước khi nộp: cảnh báo nếu vẫn còn câu chưa trả lời.
3. **Tóm tắt Kết quả Ngay sau khi Nộp (`/exam/[id]/result`)**:
   - Hiển thị điểm trắc nghiệm tức thì (VD: 6/6 điểm).
   - Thông báo trạng thái phần thi tự luận ("Đang chờ giáo viên chấm và nhận xét").
   - Nút liên kết nhanh đến "Lịch sử làm bài".
4. **Lịch sử & Xem lại Bài thi (`/history` & `/history/[submissionId]`)**:
   - Bảng tổng hợp các bài đã nộp kèm trạng thái và điểm số.
   - Xem chi tiết từng câu: đáp án đã chọn, đáp án chuẩn, phản hồi và nhận xét của giáo viên.

---

## 4. Hướng dẫn Thiết lập Supabase

1. Tạo một dự án mới trên [Supabase](https://supabase.com).
2. Vào mục **SQL Editor** trong bảng điều khiển Supabase.
3. Mở tệp `supabase/schema.sql` trong dự án này, dán toàn bộ nội dung và bấm **Run**.
4. Vào mục **Project Settings** > **API**, sao chép URL và Anon Key.
5. Tạo tệp `.env.local` tại thư mục gốc:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

*Lưu ý: Ngay cả khi chưa điền Supabase, hệ thống vẫn có sẵn bộ nhớ lưu trữ cục bộ kèm dữ liệu khởi tạo mẫu để bạn kiểm thử toàn bộ tính năng ngay lập tức.*

---

## 5. Triển khai lên Vercel

```bash
# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Khởi chạy môi trường phát triển
npm run dev

# 3. Kiểm tra bản build sản xuất
npm run build
```

Khi triển khai trên Vercel:
- Thêm các biến môi trường `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` trong mục Settings > Environment Variables.
