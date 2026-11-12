import type { Metadata } from "next";
import "./globals.css";
import "./game.css";
import "./field-dialogue.css";

export const metadata: Metadata = {
  title: "CampusQuest AI | Phân hiệu 1 – Trường Thiếu sinh quân miền Trung",
  description: "Khám phá khuôn viên mô phỏng Phân hiệu 1, gặp bạn mới và luyện giao tiếp tiếng Anh qua sáu nhiệm vụ nhập vai học đường.",
  icons: { icon: "/images/school-logo.jpg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="vi"><body>{children}</body></html>;
}
