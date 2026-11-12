# CampusQuest AI — định hướng đồ họa và hoạt ảnh

Ngày cập nhật: 11/11/2026. Bối cảnh: Phân hiệu 1 – Trường Thiếu sinh quân miền Trung.

## Review bản khởi tạo

Bản đầu dùng mô hình sa bàn nhỏ, các khối nhà ít chi tiết, nhân vật đơn giản và giao diện ba cột chiếm phần lớn diện tích. Trải nghiệm phù hợp chứng minh chức năng nhưng chưa tạo cảm giác nhập vai. Mục tiêu nâng cấp là để cảnh chơi chiếm toàn khung nhìn, hình ảnh có chất liệu và chiều sâu, nhân vật và môi trường thực sự chuyển động.

“Đẹp hơn Chinh Phục Vũ Môn” là hướng chất lượng thẩm mỹ, không phải kết luận đo lường khách quan. Việc so sánh cần nhìn trực tiếp bản dựng và thử trên máy của nhà trường.

## Tham khảo đã tìm kiếm

- [Chinh Phục Vũ Môn — XemGame, 16/09/2014](https://www.xemgame.com/chinh-phuc-vu-mon-ghi-diem-nho-tinh-giao-duc-cao-post85995.html): nguồn mô tả phong cách 3D chibi, bối cảnh Việt Nam và kết hợp trò chơi với kiến thức. Dùng để hiểu điểm tham khảo mà người dùng nêu. Một số ảnh lưu trữ của bài hiện không tải được.
- [Chinh Phục Vũ Môn bản 2012 — VietnamNet](https://vietnamnet.vn/moi-closed-beta-game-3d-viet-da-hut-khach-manh-i362461.html): tham khảo bối cảnh game giáo dục 3D cũ; không coi bản 2012 và bản 2014 là cùng một màn chơi.
- [Palia — website và Media Gallery chính thức](https://palia.com/): tham khảo cách trình bày một thế giới khám phá thân thiện, thiên nhiên và nhân vật có cá tính. Hướng màu, ánh sáng và không khí ấm áp của CampusQuest là lựa chọn thiết kế riêng.
- [Website Phân hiệu 1](https://103.72.97.24/): tham chiếu logo, kiến trúc vàng kem và mái ngói của trường. Ảnh đã lưu ở `public/images/campus-reference.webp`.

Không lấy mô hình, texture hay nhân vật của game tham khảo để đưa vào sản phẩm. Toàn bộ ảnh mới được tạo bằng công cụ ImageGen tích hợp, các khối 3D và hiệu ứng được viết trong dự án.

## Định hướng áp dụng

- **Không gian:** cảnh 3D phủ viewport, HUD nổi xanh rừng và viền vàng; nút ẩn nhiệm vụ/bản đồ giúp ưu tiên khám phá.
- **Kiến trúc:** khung cửa và chia kính, bậc thềm, cột hiên, ban công, phù hiệu, biển tên, các hàng mái ngói, giá sách, quầy và mái che căng tin.
- **Cảnh quan:** sân đá có texture, cây nhiều tầng tán, bồn hoa, ghế, đèn, hàng rào, đồi xa và đài nước nhỏ.
- **Nhân vật:** chân dung chi tiết cùng bảng màu; An và Linh dùng sprite hoạt ảnh trong thế giới 3D. Đây là cách thể hiện 2.5D: nhân vật dạng billboard hướng về camera, không phải mô hình nhân vật 3D có đầy đủ hướng nhìn.
- **Chuyển động:** 8 khung đi bộ ở 10 khung/giây khi nhân vật di chuyển; đứng yên khi dừng. Gallery và màn chào có bản xem hoạt ảnh lặp.
- **Hiệu ứng:** cờ biến dạng theo gió, shader lay tán cây, bướm vỗ cánh, hạt sáng, gợn nước, nắng và mây nhẹ, dấu mục tiêu nhấp nhô, hiệu ứng phần thưởng.
- **Điều khiển:** WASD/mũi tên, bấm sân, chọn điểm đến; chuột phải để xoay camera; con lăn hoặc +/− để zoom; E hoặc nút Trò chuyện khi ở gần nhân vật.
- **Màn nhỏ:** canvas vẫn phủ viewport; HUD gọn, có nút thu gọn và hội thoại ở cạnh dưới.

## Tài nguyên đã tạo và gắn vào giao diện

| Tệp trong `public/art/` | Nội dung | Nơi sử dụng |
| --- | --- | --- |
| `campus-keyart.png` | Tranh ý tưởng khuôn viên | Màn chào, màn tải, ảnh nhiệm vụ, gallery |
| `highlands-horizon.png` | Bình minh cao nguyên | Phông cảnh và gallery |
| `minh-portrait.png` | Bạn Minh | Avatar, người đồng hành, hội thoại, gallery |
| `linh-portrait.png` | Học viên Linh | Chọn nhân vật, avatar, gallery |
| `lan-portrait.png` | Cô Lan | Người đồng hành, hội thoại, gallery |
| `hung-portrait.png` | Chú Hùng | Người đồng hành, hội thoại, gallery |
| `reward-atlas.png` | 6 vật phẩm | Hành trang, phần thưởng, gallery |
| `courtyard-paving.png` | Chất liệu đá sân | Vật liệu Three.js và gallery |
| `cadet-walk.png` | An: 8 khung đi bộ | Nhân vật điều khiển, màn chào, gallery |
| `linh-walk.png` | Linh: 8 khung đi bộ | Nhân vật điều khiển và gallery |

Prompt nguyên văn, nguồn ảnh tạo và thông số atlas nằm trong [art-prompts.json](art-prompts.json). Các bản sprite đã được sửa alpha bằng ImageGen để bỏ nền và đường phân ô; giữ nguyên ảnh gốc trong thư mục ảnh tạo của Codex.

## Quy ước atlas

- Sprite nhân vật: 4 cột × 2 hàng, thứ tự trái sang phải rồi xuống hàng, 8 khung trong 0,8 giây. UV của Three.js tính từ cạnh dưới; CSS tính từ cạnh trên.
- Vật phẩm: 3 cột × 2 hàng. Hàng trên: ba lô, sách, bữa ăn. Hàng dưới: cúp, la bàn, huy chương.
- PNG nhân vật có alpha thật. Không dùng ảnh chụp trang web hoặc nền xám giả làm phần trong suốt.

## Hiệu năng và phạm vi

Gộp các khối tĩnh theo vật liệu, dùng instancing cho hoa, giới hạn pixel ratio ở 1,25 cho Chi tiết và 1 cho Nhẹ. Bóng đổ được cache và cập nhật theo nhịp; mức Nhẹ tắt bóng đổ cùng một số hạt trang trí. Tùy chọn giảm chuyển động của hệ điều hành tắt hiệu ứng môi trường/giao diện, vẫn giữ phản hồi di chuyển do người chơi điều khiển.

FPS phụ thuộc thiết bị, kích thước cửa sổ và thời gian làm nóng shader; cần thử trên máy phòng Tin học trước khi chọn cấu hình mặc định cho lớp. Tranh ý tưởng có độ chi tiết cao hơn cảnh 3D thời gian thực; không coi tranh tải là hình chụp màn chơi.

Các chức năng AI, tài khoản và quản lý lớp vẫn nằm ngoài đợt nâng cấp đồ họa này; hội thoại mẫu hiện tại được giữ lại.


## Hiệu chỉnh theo phản hồi 12/11/2026

Người dùng yêu cầu giữ ý tưởng và tạo hình gốc theo bối cảnh thiếu sinh quân Việt Nam, bỏ hình thể khối vuông và hướng diorama đồ chơi. HUD trở lại xanh rừng và viền vàng. Hội thoại theo ảnh tham khảo RPG: chân dung lớn phía phải, ba thanh lựa chọn phía trái, bảng thoại phía dưới.

- `campus-character.ts`: hình thể tròn mịn, tay/chân có khớp, mũ và quân phục ô liu, cầu vai đỏ, khuy vàng; cô Lan và chú Hùng giữ đồ dân sự của chân dung gốc.
- `npc-portrait.tsx`: giữ nguyên các PNG gốc; lưới ảnh biến dạng nhẹ ở hàm/miệng, mắt, đầu và tay. Không thay bằng nhân vật khối vuông.
- Lời đọc sử dụng `SpeechSynthesisUtterance.onstart/onend/onerror`. Khi tắt âm, đổi tab, bắt đầu thu mic hoặc thoát hội thoại, lời đọc và trạng thái miệng đều dừng. Chuyển động miệng gần đúng theo nhịp âm tiết, không có dữ liệu viseme/phoneme hay phân tích âm thanh.
- Hiệu ứng biến dạng chân dung chạy tối đa khoảng 30 FPS, tạm dừng khi tab ẩn, có ảnh tĩnh dự phòng khi WebGL không hoạt động. Reduced motion giảm cử động đầu/tay và tắt chớp mắt tự động, giữ chuyển động miệng để thể hiện trạng thái lời nói.
- UI dùng `field-dialogue.css`; `redesign.css` của bản đổi phong cách trước đã ngừng sử dụng.

Impeccable đã cài ở cấp người dùng Codex. Phiên hiệu chỉnh sử dụng hướng dẫn refinement/animate của Impeccable và chế độ redesign-preserve của design-taste-frontend.


## English Discovery Day update

The previous portrait deformation rig is superseded by three static 2x2 expression atlases. Each character has four consistent expressions. No mouth, eye, head or hand warping remains in the conversation portrait. Expressions change between replies, with an aspect-preserving square crop.

See learning-flow.md for the revised six-chapter story and listen, practise, feedback, review and reward loop. Exterior figures have clearer scale, fabric material and pocket seams. The campus has smoother foliage, softer shadows, event signage and book displays. The map highlights the next objective. Navigation and collision data are preserved.
