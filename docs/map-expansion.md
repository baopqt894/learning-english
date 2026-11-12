# Bản đồ mở rộng

Ngày hoàn thiện: 12/11/2026. Dùng kỹ năng imagegen với công cụ ImageGen tích hợp để tạo hai ảnh mới, lưu trong dự án; không dùng CLI/API key.

- `public/art/campus-world-map.png`: tranh bản đồ toàn trường, được dùng ở bản đồ nhỏ, màn chọn điểm đến và bộ sưu tập.
- `public/art/campus-rooms-atlas.png`: sáu cảnh nội thất theo lưới 3×2: phòng học, tin học, ngoại ngữ, nội trú, nhà ăn, nhà đa năng; dùng làm ảnh điểm đến và trong bộ sưu tập.
- Prompt đầy đủ trong `map-art-prompts.json`. Đây là tranh ý tưởng mới cho game, không phải sơ đồ đo đạc hay ảnh thực tế của trường.

Không gian di chuyển tăng từ 25×20,6 lên 72×60 đơn vị (hơn 8 lần diện tích). Có chín điểm khám phá mới và giữ ba nhân vật/nhiệm vụ trung tâm. Nhà ở có hai dãy ngoại thất; phòng học, tin học, ngoại ngữ, nhà ăn và nhà đa năng dùng góc cắt mái, cửa mở và nội thất 3D. Chọn điểm đến trên tranh để đóng bản đồ và tự đi tới. Nút la bàn xem toàn cảnh 3D; nút tâm ngắm trở lại camera theo nhân vật. WASD/mũi tên di chuyển theo camera, Shift chạy.

Vị trí tường và bàn dùng chung giữa dựng hình và va chạm. A* 8 hướng tránh góc tường, sau đó làm mượt tuyến đi bằng kiểm tra đoạn thẳng. Các phòng có hành lang giữa thông thoáng và cửa ở phía nam. Nội thất trang trí nhỏ như ghế và đĩa không có va chạm riêng. Bản đồ minh họa có vị trí gần tương ứng cảnh 3D, không thay thế mesh điều hướng.

Các vùng mở rộng hiện phục vụ khám phá. Sáu nhiệm vụ hội thoại, tiến độ và XP vẫn giữ luồng hiện có.

## Xác minh

- `npm test`: 10/10 đạt, gồm sáu nhiệm vụ, biên bản đồ, cửa/hành lang giữa, tuyến đi giữa mọi cặp điểm đến và điểm xuất phát sát bàn ghế.
- `npm run lint`: đạt. `npm run build`: đạt, bao gồm TypeScript và tạo bản production.
- Production trên `http://127.0.0.1:3000/`; trang chính và hai PNG mới trả HTTP 200.
- Quan sát trực tiếp nhân vật đi vào phòng tin học tại (27, −23), nhà đa năng tại (−25,98; 25,09) và sân bóng tại (23,94; 3,01). Sai số dừng dưới 0,12 đơn vị. Camera theo nhân vật và đánh dấu vị trí trên bản đồ.
- Thử viewport 390×844: canvas phủ khung, bản đồ toàn trường và danh sách điểm đến có thể chọn được; đã trả lại viewport mặc định sau kiểm tra.
- Không gửi câu trả lời, thay tên hay đặt lại tiến độ học viên có sẵn. Không phát hiện lỗi console ở cảnh đã kiểm tra.
- Ảnh kiểm tra: `previews/campusquest-map-expanded.jpg`, `previews/campusquest-campus-expanded.jpg`, `previews/campusquest-map-mobile.jpg`.
