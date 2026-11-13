# CampusQuest AI

Game nhập vai luyện giao tiếp tiếng Anh cho **Phân hiệu 1 – Trường Thiếu sinh quân miền Trung**.
Dự án được khởi tạo bằng `create-next-app@latest` ngay trong thư mục làm việc.

## Chạy dự án

Dùng Node.js 24 trở lên và npm (máy khởi tạo đang dùng Node.js 26).

```bash
npm install
npm run dev
```

Mở http://localhost:3000. Không cần API key để chạy bản mẫu.

```bash
npm run typecheck
npm test
npm run lint
npm run build
npm start
```

## Bản mẫu hiện có

- Chọn tên/biệt danh và một trong hai nhân vật học viên mặc quân phục.
- Màn chơi phủ toàn khung trình duyệt; nút toàn màn hình dùng Fullscreen API khi trình duyệt cho phép.
- HUD nhiệm vụ và bản đồ nổi có thể ẩn; camera xoay bằng kéo chuột phải, zoom bằng con lăn hoặc nút +/−.
- Mười hai tài nguyên hình ảnh tạo riêng, gồm tranh bản đồ toàn trường, atlas sáu nội thất, hai sprite sheet 4×2 được giữ trong bộ sưu tập tham khảo, bốn chân dung, tranh khuôn viên, phông cao nguyên, atlas vật phẩm và chất liệu sân.
- Hiệu ứng cờ bay, tán cây lay bằng shader, bướm vỗ cánh, hạt sáng, nước gợn, dấu nhiệm vụ phát sáng và confetti khi nhận thưởng.
- Bộ sưu tập hình ảnh trong thanh công cụ có xem chu kỳ hoạt ảnh và tải PNG gốc.
- Hai mức Chi tiết/Nhẹ; hình học tĩnh được gộp theo vật liệu và bộ đệm bóng đổ được tái sử dụng.
- Khuôn viên Three.js rộng 72×60 đơn vị, diện tích di chuyển hơn 8 lần bản đầu. Thêm phòng học A1/A2, phòng tin học, phòng ngoại ngữ, hai dãy nhà ở, nhà ăn, sân bóng đá, nhà đa năng và vườn học tập.
- Các phòng mới có lối vào, nội thất và va chạm tường/bàn; góc nhìn cắt mái cho phép nhìn vào phòng. Nhà ở là công trình ngoại thất.
- Bản đồ nhỏ dùng sơ đồ vector, đánh dấu vị trí trực tiếp; mở bản đồ toàn trường để chọn một trong chín điểm khám phá và ba nhân vật trung tâm. Camera đi theo nhân vật, có nút xem toàn cảnh 3D.
- Di chuyển bằng WASD, phím mũi tên, giữ Shift để chạy, bấm vào sân hoặc chọn địa điểm; tự tìm đường vòng tránh công trình và bàn ghế. Nút E để trò chuyện khi đến gần.
- Minh ở sân trường, cô Lan ở thư viện và chú Hùng ở căng tin; tất cả là nhân vật hư cấu.
- Sáu nhiệm vụ mở tuần tự; mục tiêu xác nhận ngày trả và tổng tiền cần thông tin cụ thể.
- Giữ phong cách xanh rừng/viền vàng ban đầu. Mô hình 3D bo mịn, tỷ lệ tự nhiên hơn, quân phục xanh ô liu với cầu vai đỏ, khuy vàng và mũ sao. Cô Lan giữ áo khoác và sách, chú Hùng giữ áo kaki/tạp dề. Có khớp gối/khuỷu tay, chớp mắt và cử chỉ khi nói.
- Bản đồ SVG lấy tọa độ từ dữ liệu khuôn viên, đồng bộ vị trí người chơi và 12 điểm đến; dùng được cả bản đồ nhỏ lẫn bản đồ toàn trường.
- Nhận giọng nói khi trình duyệt hỗ trợ Web Speech API. Văn bản nhận dạng luôn được kiểm tra/sửa trước khi gửi.
- XP, sáu huy hiệu và vật phẩm minh họa trong hành trang; không cộng thưởng lặp lại.
- Lưu tiến độ và tối đa 80 tin nhắn bằng localStorage. Góc giáo viên xem dữ liệu của học viên trên máy này, đổi mức hỗ trợ, xuất JSON và bắt đầu lại.
- Chế độ giảm chuyển động, điều hướng bàn phím, hộp thoại giữ focus và lựa chọn địa điểm khi thiết bị không có WebGL.

## Phạm vi và phần tiếp theo

Đây là **bản mẫu cục bộ**, chưa phải sản phẩm AI hoàn chỉnh:

- Hội thoại hiện dùng quy tắc nhận câu và kịch bản cố định; chưa hiểu tự do bằng mô hình ngôn ngữ.
- Chưa có tài khoản, cơ sở dữ liệu, quản lý lớp, giao bài trực tuyến hay đồng bộ nhiều thiết bị.
- Chưa lưu bản ghi âm, chấm phát âm hoặc sinh nhận xét cá nhân bằng AI. Gợi ý sau nhiệm vụ là nội dung đã soạn.
- Bản đồ mô phỏng được xây từ hình khối; vị trí thư viện và căng tin không khẳng định là bố trí thực tế của trường.
- Các khu mở rộng dùng để khám phá tự do; sáu nhiệm vụ hội thoại hiện vẫn diễn ra với ba nhân vật trung tâm. Tranh nội thất là hình minh họa, không phải ảnh chụp cảnh 3D thời gian thực.
- Gợi ý được mở chủ động bằng nút !; chưa có bộ tình huống ngẫu nhiên.
- Nhận giọng nói phụ thuộc trình duyệt, quyền micro và có thể cần dịch vụ mạng của trình duyệt. Luôn có cách nhập bằng bàn phím.
- Tiến độ chỉ nằm trên trình duyệt này; dữ liệu có thể mất khi xóa dữ liệu trình duyệt. Xuất JSON để giữ bản tham khảo.

Bước phát triển tiếp theo: thống nhất kịch bản tiếng Anh với giáo viên, nối dịch vụ AI phía máy chủ,
thêm xác thực và cơ sở dữ liệu, rồi thử hiệu năng trên máy phòng Tin học.
Khóa dịch vụ AI phải giữ phía máy chủ, không đưa vào mã phía trình duyệt.

## Cấu trúc

- `src/app/`: App Router, metadata tiếng Việt, giao diện responsive.
- `src/components/campus-game.tsx`: luồng chơi, hội thoại, micro, màn hình giáo viên.
- `src/components/campus-world.tsx`: Three.js, di chuyển, va chạm và nhân vật.
- `src/lib/campus-environment.ts`: kiến trúc chi tiết, cây cối, vật liệu, sprite và gộp hình học.
- `src/app/game.css`: màn chơi toàn màn hình, HUD và các hoạt ảnh giao diện.
- `src/lib/campus-map.ts`: kích thước bản đồ, địa điểm, va chạm và thuật toán A*.
- `src/components/campus-map.tsx`: bản đồ minh họa tương tác và các điểm đến.
- `public/art/`: 12 PNG được tạo bằng ImageGen và sử dụng trực tiếp trong game.
- `docs/map-art-prompts.json`: prompt cho tranh bản đồ mở rộng và atlas nội thất.
- `tests/campus-map.test.mjs`: kiểm tra biên, cửa phòng và đường đi giữa mọi điểm đến.
- `docs/art-direction.md`: review đồ họa, tham khảo và quy ước hoạt ảnh.
- `docs/art-prompts.json`: toàn bộ prompt tạo hình và thông số atlas.
- `src/lib/game.ts`: kịch bản, mục tiêu nhiệm vụ, kiểm tra câu, phần thưởng và xác thực dữ liệu lưu.
- `src/lib/progress-store.ts`: lưu trữ tiến độ phía trình duyệt.
- `tests/game.test.mjs`: kiểm tra cả sáu nhiệm vụ, địa điểm, xác nhận thông tin, ngân sách và lưu dữ liệu.
- `docs/school-reference.md`: nguồn tham chiếu nhận diện trường.

Công nghệ: Next.js 16.4.6, React 19.3, TypeScript, Tailwind CSS 4 và Three.js 0.187.

Tài liệu: [Next.js](https://nextjs.org/docs) · [Three.js](https://threejs.org/docs/) · [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API).

## English Discovery Day (12/11)

The six missions now follow a shared event-preparation story. Each includes a communication goal, bilingual vocabulary, optional listening model, response feedback and a short review before collecting XP. The final mission returns to Minh to report on the team's book and picnic supplies. See `docs/learning-flow.md` for the complete flow and limitations.

NPC portraits now use four static authored expressions per character. The previous mouth/eye deformation renderer has been removed. The new atlases are `public/art/{minh,lan,hung}-expressions.png`.

## Online English competitions

Open **English competitions** → choose a game → **Create online room**. Friends open the same server address, enter the room code and press **Join room** → **I’m ready**. The host starts; empty seats automatically become bots. Press **+** in the lobby to add a bot manually. **How to play** explains the complete flow.

For devices on one LAN, run the app with an accessible hostname, for example `npm run dev -- --hostname 0.0.0.0`, and use the host computer’s LAN address on every device. `127.0.0.1` always refers to the device currently opening it. Rooms run in one Node process and clear on restart. See [the implementation and verification notes](docs/english-games-online.md).

Every campus district also has **Practise English here**. Animal feeding requires its short English quiz, then the physical feeding action in the pen.
