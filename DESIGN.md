# CampusQuest AI

Trải nghiệm phiêu lưu học đường. Khuôn viên Three.js phủ kín màn hình và làm nền cho mọi thao tác trong game. Giao diện dùng xanh rêu sẫm cho các bề mặt đọc, kem cho chữ và vàng hổ phách cho mục tiêu cùng hành động chính. Lấy ảnh khuôn viên, chân dung và vật phẩm từ bộ tài nguyên của game.

- **Khám phá.** Hồ sơ và mục tiêu ở góc trái, bản đồ nhỏ cùng menu ở góc phải. Lời mời trò chuyện chỉ xuất hiện khi ở gần nhân vật. Trên điện thoại, nút bản đồ mở bản đồ toàn trường.
- **Hội thoại.** Chân dung nhân vật nổi lên trên cảnh đang chơi. Lời thoại, trợ giúp, nhập câu và lịch sử cùng nằm trong khung phía dưới.
- **Menu.** Nhật ký mở trên màn chơi và chứa mục tiêu, từ vựng, tiến độ sáu nhiệm vụ và hành trang. Đồ họa, toàn màn hình và góc giáo viên nằm trong menu tạm dừng.
- **Điều khiển.** Giữ focus nhìn thấy được, cho phép đóng lớp phủ bằng Escape và tôn trọng cài đặt giảm chuyển động.

## Tài khoản học viên

Màn vào game giữ ảnh chibi của khuôn viên và dùng nền giấy kem cho biểu mẫu. Học viên đăng ký bằng biệt danh, tên đăng nhập và mật khẩu hoặc đăng nhập vào hồ sơ đã có. Khi có tiến độ cũ trên trình duyệt, màn đăng ký cho phép chuyển sang tài khoản. Trên điện thoại, ảnh nằm phía trên biểu mẫu cuộn tự nhiên và các trường có cỡ chữ phù hợp bàn phím cảm ứng.

## Nhân vật chibi

Nhân vật dành cho học sinh: đầu lớn, mắt tròn, thân và tay chân ngắn, chất liệu mờ mềm. Giữ quân phục ô liu, cầu vai/cổ đỏ, sao vàng nhỏ trên mũ và ba lô học đường. Cô Lan có kính tròn, búi tóc và sách; chú Hùng có ria nhỏ, tạp dề và khay đồ ăn. Chân dung dùng ảnh biểu cảm cố định theo câu, không bóp méo miệng. Cùng hướng tạo hình được áp dụng cho model 3D, avatar, hội thoại và ảnh chào.

## Hoạt động thực hành

Khu tăng gia là khu đất riêng ở đông nam, tách vườn đọc sách và sân bóng. Có cổng, hàng rào, ba luống thực hành, ba luống rau dự trữ, lối phục vụ, điểm lấy nước, kho nước/ủ phân, giá dụng cụ và bàn thu hoạch. Tọa độ cảnh, va chạm, nhiệm vụ và minimap dùng chung `campus-spaces.ts`. Xem `docs/campus-layout-audit.md` về audit bố trí và bằng chứng kiểm tra.

Chi tiết khu tăng gia dùng bờ gạch có mạch, đất và rãnh mềm, lá rau cong có gân. Luống dự trữ phân biệt cải bắp, cà rốt và giàn đậu. Bàn ươm có khay chậu, lưới che; điểm cấp nước có đường ống và cuộn vòi; bàn thu hoạch có cân, sổ và sọt xếp dưới bàn. Vật thể dùng tông đất nung, gỗ, xanh ô liu; chi tiết phục vụ công việc và không chiếm lối thao tác. Xem `docs/farm-craft.md`.

Cadet activities là bảng hoạt động bên cạnh mạch hội thoại. Ba bài: tăng gia ở vườn, trực nhật nội trú và thử thách lớp học. Màn giao nhiệm vụ có từ vựng song ngữ; màn chơi dùng tiếng Anh, hướng dẫn nghe/đọc, hành động lựa chọn, giải thích và điểm số. Dùng cùng xanh ô liu, kem và vàng của HUD. Chấm lượt trả lời đầu tiên, lưu điểm tốt nhất, mở thử thách sau hai bài thực hành; phần thưởng chỉ nhận một lần. Tăng gia và trực nhật thao tác trực tiếp trên vật thể 3D qua HUD trong cảnh: đi tới vị trí, chọn dụng cụ và giữ nút để làm. Chăn gấp theo từng nếp, rác gom vào hót rác, cây phát triển theo ngày mô phỏng và rau chuyển vào giỏ. Bài học yêu cầu đến lớp và cho thấy nhân vật ngồi đọc ở bàn trong khi làm bài. Tiến độ vật thể lưu sau từng thao tác.

## Khu tăng gia theo concept đã duyệt

Ảnh chuẩn được lưu tại `docs/previews/farm-concept-reference.png`. Khu tăng gia dùng cổng gỗ mái ngói và biển nâu chữ kem, hàng rào tre sơn xanh trên chân gạch, nhà dụng cụ mở có mái tôn xanh, sáu luống chữ nhật, giàn đậu/cà chua phía sau, bồn nước kê bệ và bàn thu hoạch gần góc trước. Camera thao tác nhìn từ phía nam để thấy mặt nhân vật; nút View garden chuyển sang toàn cảnh. Ba luống tương tác có 12 cây/luống; cây, đất, nước và giỏ thay đổi theo thao tác thật. Hai học viên phụ chăm khu dự trữ, không thay đổi tiến độ của người chơi.

## Dàn nhân vật chibi

Concept đã duyệt ở `public/concepts/campus-chibi-lineup.webp` dùng đầu lớn, chân tay ngắn, nét mặt rõ và phụ kiện dễ nhận ra khi nhìn từ xa. An mang ba lô; Linh có tóc buộc và túi chéo; Minh có bản đồ và băng tay vàng. Cô Lan giữ kính tròn và sách; chú Hùng giữ ria, tạp dề và khay đồ ăn. Chân dung và avatar được render từ model 3D. Có thể xoay, xem gần và thử chuyển động tại `/character-study`.

NPC mới mặc trang phục theo vai trò và có câu tiếng Anh tại từng khu. Khi đến gần, người chơi có thể trò chuyện, nghe và xem nghĩa. NPC đi lại theo các đoạn lối đi ngắn đã kiểm tra.

## Connected English learning campaign

English Discovery Day is the primary mission flow: ten connected chapters, five typed word clues each, a real place/practical assignment and an English report. The compact HUD shows the current chapter and a gold destination marker. The mission journal is a warm-paper reading panel over the 3D world, with evidence, one input at a time, clear explanations and an explicit retry path. Keep Conversation practice and Free activities available as supporting practice. Expanded rooms use extra normal-sized furniture and clear aisles; characters retain the approved proportions. See `docs/discovery-day-campaign.md`.

## Coherent campus circulation and occupied-room interiors

Supersedes the always-open cutaway view: enterable buildings show complete tiled roofs and facades outdoors. Reveal only the room the player enters; restore it on exit. Streets form a connected hierarchy and terminate at door approaches instead of cutting through rooms or sports grounds. The production garden uses long soil beds and service aisles, with crop density matching the bed dimensions. Shadows update with each movement frame. See `docs/campus-replan-v2.md`.

## Swim & solve

The campus pool hosts a 25 m English race. Keep the real 3D pool visible above a compact dark-olive question panel. Gold marks the player; three distinct cap colours identify computer-controlled teammates. Answer choices have touch-sized buttons and number-key shortcuts. Correct fast answers cause continuous visible acceleration, while feedback explains grammar. Pause freezes both learning and movement; results support review. See `docs/swim-and-solve.md`.

## Shared competition lobbies and contextual practice

English Games replaces the single-player swim-only entry with five venue-based competitions, real four-seat online lobbies, room codes, readiness, host + bot controls and correct-answer combo boosts. Waiting participants stand in the 3D venue; course space stays separate from training obstacles. The HUD routes cadets to a physical registration desk. The desk opens a compact race form over the outdoor venue, with solo practice, shared rooms, three difficulty levels and a campus record board. Pool deck blues and terracotta track surfaces distinguish the venues. The daily mission sheet uses the warm paper and olive ink of the campaign journal. Place practice is a compact cream panel with word-choice and sentence-building tasks. Animal feeding is unlocked by English practice and consumes one portion through the real 3D action. Health, hunger and recoverable growth appear in the animal-care panel. See `docs/english-games-online.md`.
