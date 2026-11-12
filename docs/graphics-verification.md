# Kiểm tra bản nâng cấp đồ họa

Đợt kiểm tra ngày 11/11/2026.

## Bằng chứng đã quan sát

- 10 PNG trong `public/art/`; các chân dung và sprite có kênh alpha thật. Hai sprite sheet là 1254×1254, bố trí 4 cột × 2 hàng, mỗi sheet đủ 8 khung.
- Canvas desktop tại (0, 0), kích thước 1280×720, bằng viewport 1280×720; tài liệu không cuộn dọc/ngang ngoài màn chơi.
- Canvas mobile tại (0, 0), kích thước khoảng 390×844, bằng viewport 390×844; chỉ sai số hiển thị subpixel dưới 1px ở chiều rộng.
- Khi chọn địa điểm, chỉ số khung nhân vật đổi từ 0 sang 6 trong lúc đi. Thư viện hình có hai phần xem hoạt ảnh dùng `cadet-walk`; vị trí khung nền đổi từ hàng trên sang hàng dưới.
- Tám ảnh tĩnh trong gallery đều tải xong với naturalWidth > 0; hai phần còn lại là preview hoạt ảnh bằng atlas.
- Nhật ký console của cảnh nâng cấp chưa có lỗi shader hay tải tài nguyên ở các lượt đã kiểm tra.
- Gộp hình học giảm mẫu số lệnh vẽ từ 1.612 xuống 284; số lệnh thực tế thay đổi theo khung cập nhật bóng. Chế độ Nhẹ có thể tắt bóng, bướm và hạt trang trí.
- 5 kiểm thử logic đã đạt, bao gồm toàn bộ sáu nhiệm vụ, phần thưởng một lần, vị trí hội thoại, xác nhận ngày trả/tổng tiền, ngân sách và dữ liệu lưu.

## Kiểm tra đóng gói cuối cùng

- `npm run build`: đạt, gồm biên dịch TypeScript và tạo trang production.
- `npm run lint`: đạt sau các thay đổi giao diện cuối.
- `npm test`: 5/5 đạt sau các thay đổi cuối.
- `npm audit`: không báo lỗ hổng; phụ thuộc không đổi trong đợt nâng cấp đồ họa.
- Trang chính và cả 10 PNG đều trả HTTP 200 tại bản chạy production.
- Trình duyệt production: canvas tại (0, 0), khoảng 946×819 bằng viewport 946×819; sai số subpixel dưới 1px.
- Đã quan sát việc thu gọn hai HUD, zoom camera, đến gặp Minh và mở/đóng hội thoại. Chân dung trên khung hẹp đã được dịch để không che nút micro hay ô nhập.
- HUD bị thu gọn và khu vực nhiệm vụ khi đang hội thoại dùng `inert` để không giữ các điểm focus vô hình.
- Fullscreen API bị khung trình duyệt trong ứng dụng từ chối ở lượt thử; game hiển thị thông báo thay thế. Chế độ canvas phủ viewport vẫn hoạt động. Có thể dùng nút toàn màn hình trong trình duyệt cho phép hoặc F11 trên máy tính.
- Không gửi câu trả lời hoặc đặt lại dữ liệu học viên trong phiên production đã tồn tại.

Các số FPS trong phiên phát triển không được dùng làm cam kết cho máy phòng Tin học; tab/nền cửa sổ có thể bị trình duyệt giảm nhịp vẽ.

## Ảnh kiểm tra

- [Bản khởi tạo](previews/campusquest-desktop.jpg).
- [Màn chơi nâng cấp](previews/campusquest-fullscreen-v2.jpg).
- [Chân dung hội thoại](previews/campusquest-conversation-v2.jpg).

## Đối chiếu mục tiêu

| Yêu cầu | Bằng chứng |
| --- | --- |
| Review và tìm tham khảo | `art-direction.md`, các nguồn CPVM/Palia/website trường đã đối chiếu |
| Thêm hình chi tiết | 10 tài nguyên được lưu và tích hợp; manifest/prompt nguyên văn trong `art-prompts.json` |
| Màn chơi toàn khung | Số đo canvas/viewport desktop, mobile và production; ảnh màn chơi mới |
| Thêm nhiều đồ họa trong cảnh | Kiến trúc, cây, hoa, vật liệu sân, quầy, giá sách, ánh sáng và ảnh chân dung đã dựng trong bản chạy |
| Có hoạt ảnh | Hai atlas 8 khung, chỉ số khung thay đổi khi đi, preview atlas lặp trong gallery, hiệu ứng môi trường và giao diện |
| Giữ luồng nhiệm vụ hoạt động | 5 kiểm thử bao phủ sáu nhiệm vụ và kiểm tra mở hội thoại ở bản chạy |
