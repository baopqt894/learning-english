import type { CampusResident } from './campus-residents.ts';
import type { ZoneId } from './campus-map.ts';
import type { DistrictStationId } from './campus-districts-layout.ts';
import type { WorkKind } from './fieldwork.ts';
import type { EnglishQuestion } from './level-questions.ts';

export type ResidentKind = CampusResident['kind'];
type Turn = Readonly<{ prompt: string; meaning: string; correct: string; other: string }>;
type Task =
  | { type: 'work'; work: WorkKind }
  | { type: 'station'; station: DistrictStationId }
  | { type: 'visit'; zone: ZoneId }
  | { type: 'quiz'; questions: readonly EnglishQuestion[] };

type ResidentMission = {
  title: string;
  summary: string;
  action: string;
  xp: number;
  dialogue: readonly [Turn, Turn];
  task: Task;
  report: Turn;
};

function turn(prompt: string, meaning: string, correct: string, other: string): Turn {
  return { prompt, meaning, correct, other };
}
function question(prompt: string, answer: string, wrong: string, explanation: string): EnglishQuestion {
  return { prompt, answer, options: [answer, wrong], explanation };
}

export const RESIDENT_MISSIONS: Record<ResidentKind, ResidentMission> = {
  mai: {
    title: 'Welcome desk helper', summary: 'Chuẩn bị thẻ và hướng dẫn khách mới.', action: 'Chuẩn bị bàn đón khách', xp: 35,
    dialogue: [
      turn('Can you help me welcome the visitors?', 'Bạn có thể giúp mình đón khách không?', 'Of course. What should I do?', 'I already borrowed that book.'),
      turn('They need a badge before they join the tour.', 'Khách cần thẻ trước khi tham gia chuyến tham quan.', 'I’ll give them a badge first.', 'I’ll collect their badges after the tour.'),
    ],
    task: { type: 'quiz', questions: [
      question("A visitor has lost their badge. What do you offer?", "Let me help you get a replacement.", "Let me cancel the exhibition.", "A replacement takes the place of something lost."),
      question("Your group meets at a quarter past two. Which time is correct?", "2:15", "2:45", "A quarter past means fifteen minutes after the hour."),
      question("Someone asks where to sign in. What do they need?", "The registration desk.", "The finish line.", "Visitors sign in at a registration desk."),
      question('Your visitor wants to join a tour. Which question helps you find their group?', 'Which group are you with?', 'Where did you buy your lunch?', 'Ask which group the visitor belongs to.'),
      question('The welcome desk is beside the gate. Give a clear direction.', 'Go to the desk next to the gate.', 'Go upstairs to the library.', 'Beside and next to mean in the same area, close by.'),
    ] },
    report: turn('Is the welcome desk ready?', 'Bàn đón khách đã sẵn sàng chưa?', 'Yes. The badges and directions are ready.', 'No. The visitors have gone home.'),
  },
  nam: {
    title: 'Find Classroom A1', summary: 'Đi tới phòng A1 để xác nhận đường đi cho Nam.', action: 'Đi tới phòng học A1', xp: 40,
    dialogue: [
      turn('I’m new here. How can I find Classroom A1?', 'Mình mới đến. Làm sao tìm được phòng A1?', 'I can check the route for you.', 'It costs twenty thousand dong.'),
      turn('Can you check the classroom number before you come back?', 'Bạn kiểm tra số phòng trước khi quay lại được không?', 'Yes. I’ll look for the A1 sign.', 'Yes. I’ll look for the swimming lanes.'),
    ],
    task: { type: 'visit', zone: 'classrooms' },
    report: turn('Did you find the right classroom?', 'Bạn tìm được đúng phòng học chưa?', 'Yes, I found Classroom A1.', 'I found the pool registration desk.'),
  },
  thu: {
    title: 'Library return check', summary: 'Phân loại sách trả và ghi đúng hạn trả sách.', action: 'Kiểm tra phiếu trả sách', xp: 35,
    dialogue: [
      turn('Could you help me sort these returned books?', 'Em có thể giúp cô phân loại sách đã trả không?', 'Yes. Where should I put them?', 'Yes. How deep is the pool?'),
      turn('Put borrowed books on the trolley. Reference books stay in the reading room.', 'Đặt sách mượn lên xe đẩy. Sách tham khảo để lại phòng đọc.', 'The reference books stay here.', 'I can take the reference books home.'),
    ],
    task: { type: 'quiz', questions: [
      question("What should you do to renew a library book?", "Ask to keep it for longer.", "Give it to another visitor.", "Renewing a loan extends the return date."),
      question("Which instruction protects a borrowed book?", "Keep the pages dry.", "Fold every page corner.", "Moisture damages paper."),
      question("A reader asks for the author. What information do they want?", "The name of the writer.", "The number of shelves.", "An author writes a book."),
      question('The return date is Friday. What does “due on Friday” mean?', 'The book must be returned by Friday.', 'The book is available after Friday.', 'A due date is the deadline to return something.'),
      question('One book has a reference label. Where does it go?', 'It stays in the reading room.', 'It goes in a visitor’s bag.', 'Reference books stay in the library.'),
    ] },
    report: turn('Where are the borrowed books now?', 'Sách mượn đang ở đâu?', 'They’re on the return trolley.', 'They’re in the kitchen.'),
  },
  khoa: {
    title: 'Barracks handover', summary: 'Quét phòng, gấp chăn và xếp sách rồi hoàn tất báo cáo nội trú.', action: 'Bắt đầu trực nội trú', xp: 55,
    dialogue: [
      turn('The next group will arrive soon. Will you help tidy the room?', 'Nhóm tiếp theo sắp tới. Bạn giúp dọn phòng nhé?', 'Yes. Which job comes first?', 'No. This is a swimming race.'),
      turn('Sweep first, then fold the blankets and put the books on the shelf.', 'Quét trước, sau đó gấp chăn và xếp sách lên kệ.', 'I’ll sweep, fold and put away the books.', 'I’ll leave the blankets on the floor.'),
    ],
    task: { type: 'work', work: 'duty' },
    report: turn('How did the room check go?', 'Việc kiểm tra phòng thế nào?', 'The floor is clean, the blankets are folded and the books are on the shelf.', 'The floor still needs sweeping.'),
  },
  phuc: {
    title: 'Harvest for the kitchen', summary: 'Xới đất, gieo, tưới và thu hoạch ba luống. Nộp báo cáo tại bàn thu hoạch.', action: 'Ra luống rau', xp: 60,
    dialogue: [
      turn('Can you help grow vegetables for the school kitchen?', 'Cháu có thể giúp trồng rau cho bếp của trường không?', 'Yes. What should I do first?', 'Yes. I’ll put the books on the shelf.'),
      turn('Loosen the soil before sowing. Water gently, then harvest when the vegetables are ready.', 'Xới đất trước khi gieo. Tưới nhẹ, rồi thu hoạch khi rau đã lớn.', 'I’ll loosen the soil, sow and water before harvesting.', 'I’ll harvest before I sow the seeds.'),
    ],
    task: { type: 'work', work: 'garden' },
    report: turn('What have you brought for the kitchen?', 'Cháu mang gì cho bếp?', 'We harvested three baskets of vegetables.', 'We left the beds without planting anything.'),
  },
  yen: {
    title: 'First feed for the chickens', summary: 'Làm quiz khẩu phần rồi cho gà ăn ở chuồng.', action: 'Đi tới chuồng gà', xp: 45,
    dialogue: [
      turn('Can you help me feed the chickens this morning?', 'Bạn giúp mình cho gà ăn sáng nay được không?', 'Yes. What do they eat?', 'Yes. Which book should I return?'),
      turn('Give them a small portion of grain after you check their water.', 'Cho gà một ít hạt sau khi kiểm tra nước.', 'I’ll check the water and give them grain.', 'I’ll fill the trough with books.'),
    ],
    task: { type: 'station', station: 'feed-chickens' },
    report: turn('Did the chickens get their meal?', 'Gà đã được ăn chưa?', 'Yes, I gave the chickens a portion of grain.', 'No, I only carried the bucket.'),
  },
  hai: {
    title: 'One step at a time', summary: 'Vượt qua cầu thăng bằng ở sân tập bằng cách trả lời đúng các câu tiếng Anh.', action: 'Đi tới cầu thăng bằng', xp: 50,
    dialogue: [
      turn('Are you ready to try the balance beam?', 'Em sẵn sàng thử cầu thăng bằng chưa?', 'Yes. What should I focus on?', 'Yes. What time is lunch served?'),
      turn('Look ahead and take one step at a time. Answer each question before you move on.', 'Nhìn phía trước và đi từng bước. Trả lời từng câu trước khi đi tiếp.', 'I’ll look ahead and answer before moving on.', 'I’ll rush across without answering.'),
    ],
    task: { type: 'station', station: 'balance' },
    report: turn('How did you make it across?', 'Em đã qua cầu bằng cách nào?', 'I kept my balance and answered each question.', 'I jumped off without finishing.'),
  },
  vy: {
    title: 'Pool deck safety check', summary: 'Vượt quiz an toàn rồi thực hành ném phao từ bờ hồ.', action: 'Đi tới điểm ném phao', xp: 50,
    dialogue: [
      turn('Before the next class, can you practise a rescue throw?', 'Trước buổi học tiếp theo, bạn thực hành ném phao nhé?', 'Yes. Where should I stand?', 'Yes. I’ll run along the wet deck.'),
      turn('Stay on the dry deck and throw the practice ring from the marked spot.', 'Đứng trên bờ khô và ném phao tập từ vị trí có đánh dấu.', 'I’ll stay on the dry deck.', 'I’ll jump into the pool with the ring.'),
    ],
    task: { type: 'station', station: 'rescue-ring' },
    report: turn('Where were you when you threw the ring?', 'Bạn đứng đâu khi ném phao?', 'I stayed on the dry deck.', 'I was already in the water.'),
  },
  bao: {
    title: 'Team selection huddle', summary: 'Đọc tình huống bóng đá và chọn lời chỉ dẫn cho đồng đội.', action: 'Chuẩn bị lời dặn đội', xp: 35,
    dialogue: [
      turn('Who should we pass to when the pitch is crowded?', 'Khi sân đông, mình nên chuyền cho ai?', 'A teammate who has room to move.', 'A player on the other team.'),
      turn('Can you help me give the team clear instructions before the game?', 'Bạn giúp mình dặn đội thật rõ trước trận nhé?', 'Yes. I’ll tell them where to wait and when to start.', 'Yes. I’ll tell everyone to leave the field.'),
    ],
    task: { type: 'quiz', questions: [
      question("A teammate calls “Behind you!” Where are they?", "At your back.", "Directly ahead of you.", "Behind is the opposite of in front of."),
      question("Which message asks for a substitution?", "Could another player take my place?", "Could we change the colour of the ball?", "A substitute takes the place of another player."),
      question("The game ends three goals each. What is the result?", "A draw.", "A one-goal win.", "A draw means the teams have equal scores."),
      question('A teammate is open near the touchline. Which instruction fits?', 'Pass to the teammate on the side.', 'Pass backwards to the goalkeeper.', 'The touchline is the boundary at the side of the pitch.'),
      question('Players should warm up before the whistle. What should they do first?', 'Warm up.', 'Start the match.', 'Before tells you which action happens first.'),
    ] },
    report: turn('What will you say to our team first?', 'Bạn sẽ dặn đội điều gì đầu tiên?', 'Warm up and wait for the whistle.', 'Start playing before the other team arrives.'),
  },
  tram: {
    title: 'Language lab message check', summary: 'Đọc thông báo và hoàn chỉnh lời nhắn cho phòng ngoại ngữ.', action: 'Sửa lời nhắn tiếng Anh', xp: 35,
    dialogue: [
      turn('The speaker is hard to hear. What could you ask politely?', 'Người nói khó nghe quá. Bạn có thể hỏi lịch sự thế nào?', 'Could you repeat that, please?', 'Stop speaking English.'),
      turn('Can you check these notices before I read them to the class?', 'Bạn kiểm tra các thông báo trước khi mình đọc cho lớp nhé?', 'Sure. I’ll check the room and time.', 'Sure. I’ll change every room number.'),
    ],
    task: { type: 'quiz', questions: [
      question("The teacher says to stress the first syllable. What do you change?", "Make the first syllable more prominent.", "Remove the first syllable.", "Stress is the emphasis given to part of a word."),
      question("You missed the last word. Which request is clearest?", "Could you repeat the final word?", "Could you finish my homework?", "Final means last."),
      question("Which item lets you hear the recording privately?", "Headphones.", "A classroom notice.", "Headphones send sound directly to your ears."),
      question('The lesson moved from 9:15 to 9:45. Confirm the new time.', 'The lesson starts at 9:45 now.', 'The lesson still starts at 9:15.', 'Moved from one time to another means the latter time is new.'),
      question('The recording is too loud. Complete the request: Please turn ___ the volume.', 'down', 'up', 'Turn down means reduce the volume.'),
    ] },
    report: turn('Are the notices ready to read aloud?', 'Các thông báo đã sẵn sàng để đọc to chưa?', 'Yes. I checked the room and start time.', 'No. I didn’t read the changes.'),
  },
  thao: {
    title: 'Lunch service handover', summary: 'Xác nhận món ăn, giờ đến và lời nhắc dị ứng cho khách.', action: 'Kiểm tra phiếu nhà ăn', xp: 35,
    dialogue: [
      turn('Could you help check the lunch orders?', 'Em giúp cô kiểm tra các món đã gọi nhé?', 'Yes. Should I check for allergies too?', 'Yes. Should I feed the chickens instead?'),
      turn('One group arrives at noon. Please confirm the time with them.', 'Một nhóm đến vào buổi trưa. Em xác nhận lại giờ với họ nhé.', 'I’ll confirm that lunch is at twelve.', 'I’ll tell the group to come tomorrow morning.'),
    ],
    task: { type: 'quiz', questions: [
      question("Which meal request asks for a smaller serving?", "Just half a portion, please.", "Could I have seconds?", "Half a portion asks for less food."),
      question("A visitor asks whether the soup contains milk. What should you check?", "The list of ingredients.", "The price of the bowls.", "Ingredients are the foods used to make a dish."),
      question("Which sentence offers a refill?", "Would you like some more water?", "Have you lost your plate?", "A refill adds more drink to a container."),
      question('The vegetable rice is dairy-free, but the soup contains milk. Which dish should you suggest to someone who avoids milk?', 'The vegetable rice.', 'The soup.', 'Dairy-free means that the dish does not contain dairy.'),
      question('A visitor asks, “When is lunch served?” Reply politely.', 'Lunch is served at noon.', 'Ask how deep the pool is.', 'At noon means at twelve in the middle of the day.'),
    ] },
    report: turn('What will you ask before serving a meal?', 'Em sẽ hỏi gì trước khi phục vụ bữa ăn?', 'Do you have any food allergies?', 'Did you bring your running shoes?'),
  },
  quang: {
    title: 'Fish pond feeding log', summary: 'Làm bài về khẩu phần, cho cá ăn đứng trên bờ rồi báo lại.', action: 'Đi tới điểm cho cá ăn', xp: 45,
    dialogue: [
      turn('Can you help me check what happens when we feed the fish?', 'Bạn giúp mình quan sát lúc cho cá ăn nhé?', 'Yes. What should I give them?', 'Yes. Which door is locked?'),
      turn('Add a small portion of fish pellets. Watch from the dock.', 'Cho một ít viên thức ăn cho cá. Quan sát từ bờ.', 'I’ll add a small portion and stay on the dock.', 'I’ll empty the whole bag into the pond.'),
    ],
    task: { type: 'station', station: 'feed-fish' },
    report: turn('What did you do at the pond?', 'Bạn đã làm gì ở ao cá?', 'I gave the fish a small portion of pellets.', 'I gave the fish a stack of blankets.'),
  },
};

export type ResidentMissionStatus = 'active' | 'ready';
export type ResidentMissionProgress = Partial<Record<ResidentKind, ResidentMissionStatus>>;
export type ResidentProof = Exclude<Task, { type: 'quiz' }> | { type: 'quiz'; resident: ResidentKind };

export function restoreResidentMissions(raw: unknown): ResidentMissionProgress | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const restored: ResidentMissionProgress = {};
  for (const key of Object.keys(RESIDENT_MISSIONS) as ResidentKind[]) {
    if (!Object.hasOwn(raw, key)) continue;
    const value = (raw as Record<string, unknown>)[key];
    if (value === 'active' || value === 'ready') restored[key] = value;
  }
  return restored;
}

export function startResidentMission(current: ResidentMissionProgress | undefined, id: ResidentKind, alreadyReported = false) {
  return current?.[id] ? current : { ...current, [id]: alreadyReported ? 'ready' : 'active' } satisfies ResidentMissionProgress;
}

export function matchResidentProof(current: ResidentMissionProgress | undefined, proof: ResidentProof): ResidentKind | undefined {
  return (Object.keys(current ?? {}) as ResidentKind[]).find(id => {
    if (current?.[id] !== 'active') return false;
    const task = RESIDENT_MISSIONS[id]?.task;
    switch (proof.type) {
      case 'work': return task?.type === 'work' && task.work === proof.work;
      case 'station': return task?.type === 'station' && task.station === proof.station;
      case 'visit': return task?.type === 'visit' && task.zone === proof.zone;
      case 'quiz': return task?.type === 'quiz' && id === proof.resident;
    }
  });
}
