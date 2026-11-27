import { languageMeetingPoint } from './learning-room-layout.ts';
import type { CharacterKind } from './campus-character.ts';

type Position = [x: number, z: number];
type Resident = {
  kind: CharacterKind;
  role: string;
  route: readonly [Position, Position?];
  facing: number;
  line: string;
  meaning: string;
};

export const CAMPUS_RESIDENTS = [
  { kind: 'mai', role: 'Lễ tân sân trường', route: [[3.7, 8.1]], facing: -.4,
    line: 'Keep your welcome badge where visitors can see it.', meaning: 'Hãy đeo thẻ chào mừng ở nơi khách dễ nhìn thấy.' },
  { kind: 'nam', role: 'Học viên đi học', route: [[-4.2, 7], [-5.8, 8.3]], facing: .3,
    line: 'I’m on my way to class. Do you know where Classroom A1 is?', meaning: 'Mình đang đi học. Bạn có biết phòng A1 ở đâu không?' },
  { kind: 'thu', role: 'Trợ lý thư viện', route: [[-8.4, -.4]], facing: .7,
    line: 'Please leave the returned books on the trolley.', meaning: 'Hãy để sách đã trả lên xe đẩy.' },
  { kind: 'khoa', role: 'Học viên trực nội trú', route: [[-28, 5], [-28, 2.8]], facing: 0,
    line: 'Fold the clean blankets before you put them away.', meaning: 'Gấp chăn sạch trước khi cất đi.' },
  { kind: 'phuc', role: 'Phụ trách vườn rau', route: [[16.1, 39.5], [16.1, 41.9]], facing: -.55,
    line: 'These seedlings need water, but the soil is still damp.', meaning: 'Các cây con cần nước, nhưng đất vẫn còn ẩm.' },
  { kind: 'yen', role: 'Chăm sóc vật nuôi', route: [[76.5, 20.8], [77.4, 22.5]], facing: .4,
    line: 'Check the water bowls before you feed the animals.', meaning: 'Kiểm tra bát nước trước khi cho vật nuôi ăn.' },
  { kind: 'hai', role: 'Giáo viên sân tập', route: [[2, -36.8]], facing: .15,
    line: 'Take one step at a time and keep looking ahead.', meaning: 'Đi từng bước một và luôn nhìn về phía trước.' },
  { kind: 'vy', role: 'Trực hồ bơi', route: [[86, -32.3], [87.9, -32.5]], facing: -.3,
    line: 'Wait on the dry deck until your group is called.', meaning: 'Đợi trên sàn khô đến khi nhóm của bạn được gọi.' },
  { kind: 'bao', role: 'Đội trưởng bóng đá', route: [[16, -83.2], [18, -83.2]], facing: -.65,
    line: 'Pass to a teammate who has space to move.', meaning: 'Chuyền bóng cho đồng đội đang có khoảng trống.' },
  { kind: 'tram', role: 'Trợ lý phòng ngoại ngữ', route: [[languageMeetingPoint.x,languageMeetingPoint.z]], facing: .3,
    line: 'Try saying the whole sentence before you check the transcript.', meaning: 'Thử nói cả câu trước khi xem bản chép lời.' },
  { kind: 'thao', role: 'Phụ trách nhà ăn', route: [[-29.8, 20.5]], facing: .25,
    line: 'Please tell us if you have any food allergies.', meaning: 'Vui lòng báo cho chúng tôi nếu bạn bị dị ứng thức ăn.' },
  { kind: 'quang', role: 'Ghi chép ở hồ cá', route: [[73.1, 10.4], [72, 11.8]], facing: .65,
    line: 'Write down what you can see before you draw a conclusion.', meaning: 'Ghi lại những gì bạn thấy trước khi đưa ra kết luận.' },
] as const satisfies readonly Resident[];

export type CampusResident = typeof CAMPUS_RESIDENTS[number];

export function residentMeetingPoint(resident: CampusResident) {
  const [start, end = start] = resident.route;
  return { x: (start[0] + end[0]) / 2, z: (start[1] + end[1]) / 2 };
}

/** Stop beside the patrol so the cadet and resident can face each other. */
export function residentApproaches(resident: CampusResident, player: {x:number; z:number}) {
  const center = residentMeetingPoint(resident);
  const [start, end] = resident.route;
  const angle = end ? Math.atan2(end[1] - start[1], start[0] - end[0]) : resident.facing;
  const dx = 1.25 * Math.sin(angle), dz = 1.25 * Math.cos(angle);
  return [
    {x:center.x+dx, z:center.z+dz},
    {x:center.x-dx, z:center.z-dz},
  ].sort((a,b) => Math.hypot(a.x-player.x,a.z-player.z) - Math.hypot(b.x-player.x,b.z-player.z));
}
