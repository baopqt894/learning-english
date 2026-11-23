import type { Language } from './student-support.ts';

const clues: Record<string, readonly [string, string]> = {
  "intro": ["Greet Minh, then tell him what people call you.", "Chào Minh rồi giới thiệu tên em."],
  "name": ["You know your own name. Ask about his.", "Em đã giới thiệu tên mình. Giờ hãy hỏi tên bạn ấy."],
  "join-team": ["Offer a hand with the preparations.", "Nói với Minh rằng em sẵn sàng phụ chuẩn bị."],
  "directions": ["Think of a question word for a place.", "Dùng một từ để hỏi về địa điểm."],
  "confirm-direction": ["Repeat the movement and the side Minh mentioned.", "Nhắc lại hành động và phía Minh vừa chỉ."],
  "arrive": ["Greet the person behind the desk.", "Chào người ở quầy khi em đến nơi."],
  "book": ["Make a polite request and include the genre.", "Hỏi mượn một cách lịch sự và nêu thể loại sách."],
  "period": ["Ask about the number of days.", "Đặt câu hỏi về số ngày em được giữ sách."],
  "return": ["Say the weekday and what you will do.", "Nêu thứ trong tuần và việc em sẽ làm."],
  "alternative": ["The first choice is unavailable. Ask what else is on the shelf.", "Cuốn em chọn đã hết. Hỏi xem trên kệ còn lựa chọn nào."],
  "mystery": ["Choose the new genre politely.", "Nói lịch sự rằng em chọn thể loại mới."],
  "return-alt": ["Tell the librarian when the replacement is coming back.", "Cho cô biết khi nào em mang cuốn sách thay thế đến trả."],
  "price": ["Ask what the two items cost together.", "Hỏi giá của cả món ăn và đồ uống."],
  "order": ["Request one food and one drink within the budget.", "Gọi một món ăn và một đồ uống trong số tiền em có."],
  "confirm-order": ["Repeat the two items and their combined price.", "Nhắc lại hai món và tổng tiền để kiểm tra."],
  "event-book": ["Request the genre the reading corner needs.", "Hỏi mượn thể loại sách mà góc đọc đang cần."],
  "event-return": ["Confirm the weekday from the loan card.", "Nhắc lại thứ ghi trên phiếu mượn."],
  "event-price": ["Ask the cost of both picnic items.", "Hỏi giá hai món cho buổi dã ngoại."],
  "event-order": ["Politely say which food and drink you need.", "Nói lịch sự tên đồ ăn và thức uống em muốn."],
  "event-confirm": ["Check the items and the sum before leaving.", "Kiểm tra các món và tổng tiền trước khi đi."],
  "event-report": ["Tell Minh about the reading material, food and drink.", "Báo cho Minh biết em đã chuẩn bị sách, đồ ăn và thức uống gì."],
};

export function conversationClue(goal: string, language: Language) {
  return clues[goal]?.[language === 'en' ? 0 : 1] ?? (language === 'en' ? 'Try using your own words.' : 'Em hãy thử diễn đạt theo cách của mình.');
}
