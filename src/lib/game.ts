export type Place = "courtyard" | "library" | "canteen";
export type Goal = { id: string; label: string; hint: string; place: Place };
export type Quest = { title: string; description: string; minutes: string; xp: number; badge: string; goals: Goal[] };
export type Message = { role: "student" | "npc"; text: string; place: Place };
export type Progress = { version: 1; name: string; avatar: number; mode: "guided" | "independent"; active: number; completed: number[]; goals: string[]; messages: Message[] };

export const SCHOOL = "Phân hiệu 1 – Trường Thiếu sinh quân miền Trung";
export const STORAGE_KEY = "campusquest-phan-hieu-1-v1";
export const PLACES: Record<Place, { name: string; english: string; npc: string; role: string; color: string; position: [number, number]; greeting: string }> = {
  courtyard: { name: "Sân trường", english: "School courtyard", npc: "Minh", role: "Bạn học hướng dẫn", color: "#527959", position: [-1, 3], greeting: "Hi! Welcome to Branch 1 of Central Vietnam Cadet School. I'm Minh. What's your name?" },
  library: { name: "Thư viện", english: "Library", npc: "Cô Lan", role: "Nhân viên thư viện", color: "#a76f4e", position: [-6, -2], greeting: "Hello! Welcome to the library. How can I help you?" },
  canteen: { name: "Căng tin", english: "Canteen", npc: "Chú Hùng", role: "Nhân viên căng tin", color: "#b79039", position: [6, 1], greeting: "Hello! What would you like today? You have 30,000 dong to spend." },
};

export const QUESTS: Quest[] = [
  { title: "01 · A new teammate", description: "English Discovery Day is tomorrow. Meet Minh, your teammate, and introduce yourself before joining the preparations.", minutes: "2–3 min", xp: 50, badge: "Người bạn mới", goals: [
    { id: "intro", label: "Introduce yourself", hint: "Hi! My name is An. I'm a new student.", place: "courtyard" },
    { id: "name", label: "Ask your teammate’s name", hint: "What's your name?", place: "courtyard" },
    { id: "join-team", label: "Offer to help your team", hint: "I would like to help with Discovery Day.", place: "courtyard" },
  ] },
  { title: "02 · Find the first clue", description: "Your team needs a story for the reading corner. Ask Minh for directions, repeat the route, then meet Ms. Lan.", minutes: "3–5 min", xp: 75, badge: "Người tìm đường", goals: [
    { id: "directions", label: "Ask for directions to the library", hint: "Could you tell me the way to the library?", place: "courtyard" },
    { id: "confirm-direction", label: "Confirm that you turn left", hint: "So I turn left at the courtyard, right?", place: "courtyard" },
    { id: "arrive", label: "Find the library and greet Ms. Lan", hint: "Hello! I found the library.", place: "library" },
  ] },
  { title: "03 · A story worth sharing", description: "Find an adventure story for the reading corner. Borrow it politely and agree on a return day.", minutes: "3–5 min", xp: 100, badge: "Bạn của sách", goals: [
    { id: "book", label: "Ask to borrow an adventure book", hint: "I'd like to borrow an adventure book, please.", place: "library" },
    { id: "period", label: "Ask about the borrowing period", hint: "How long can I keep it?", place: "library" },
    { id: "return", label: "Confirm the Monday return date", hint: "I'll return it next Monday. Is that right?", place: "library" },
  ] },
  { title: "04 · A change of plan", description: "Another team needs the adventure book. Keep your event on track: ask for an alternative and choose a mystery story.", minutes: "3–5 min", xp: 100, badge: "Biết hỏi lại", goals: [
    { id: "alternative", label: "Ask for an alternative", hint: "Do you have another book I could borrow?", place: "library" },
    { id: "mystery", label: "Choose the mystery story", hint: "I'll take the mystery story, please.", place: "library" },
    { id: "return-alt", label: "Confirm the return date", hint: "I'll return the mystery book next Monday.", place: "library" },
  ] },
  { title: "05 · The team picnic", description: "After setting up, get a snack with 30,000 dong. Compare prices, place your order and check the total with Mr. Hung.", minutes: "3–5 min", xp: 100, badge: "Khách hàng lịch sự", goals: [
    { id: "price", label: "Ask the price of a sandwich and water", hint: "How much are a sandwich and water?", place: "canteen" },
    { id: "order", label: "Order within your budget", hint: "I'd like a sandwich and water, please.", place: "canteen" },
    { id: "confirm-order", label: "Confirm the 25,000 dong total", hint: "A sandwich and water, 25,000 dong in total. Correct?", place: "canteen" },
  ] },
  { title: "06 · Ready for discovery day", description: "It is your turn to lead. Arrange the mystery book and picnic supplies yourself, using the English you have practised.", minutes: "6–8 min", xp: 150, badge: "Đại sứ học đường", goals: [
    { id: "event-book", label: "Borrow the event’s mystery book", hint: "Could I borrow a mystery book for our reading activity?", place: "library" },
    { id: "event-return", label: "Confirm the return day", hint: "I'll return the book next Monday, right?", place: "library" },
    { id: "event-price", label: "Ask about picnic prices", hint: "How much are a sandwich and water?", place: "canteen" },
    { id: "event-order", label: "Order a sandwich and water", hint: "I'd like a sandwich and water for our activity, please.", place: "canteen" },
    { id: "event-confirm", label: "Check the final total", hint: "That's 25,000 dong for a sandwich and water, correct?", place: "canteen" },
    { id: "event-report", label: "Return to Minh and report that the book and picnic are ready", hint: "The book is ready, and we have a sandwich and water.", place: "courtyard" },
  ] },
];

export const freshProgress = (): Progress => ({ version: 1, name: "", avatar: 0, mode: "guided", active: 0, completed: [], goals: [], messages: [] });
export function restoreProgress(raw: string | null): Progress {
  try {
    const value = JSON.parse(raw || "null");
    if (!value || value.version !== 1 || typeof value.name !== "string" || !Number.isInteger(value.active) || value.active < 0 || value.active >= QUESTS.length) return freshProgress();
    // Only retain a contiguous completed prefix: edited/corrupt saves cannot unlock arbitrary quests.
    const completed: number[] = [];
    for (let i = 0; i < QUESTS.length; i++) {
      if (!Array.isArray(value.completed) || !value.completed.includes(i)) break;
      completed.push(i);
    }
    const active = Math.min(completed.length, QUESTS.length - 1);
    const validGoals = QUESTS[active].goals.map(g => g.id);
    return {
      version: 1, name: value.name.slice(0, 30), avatar: value.avatar === 1 ? 1 : 0,
      mode: value.mode === "independent" ? "independent" : "guided", active, completed,
      goals: Array.isArray(value.goals) ? [...new Set<string>(value.goals.filter((id: unknown) => typeof id === "string" && validGoals.includes(id)))] : [],
      messages: Array.isArray(value.messages) ? value.messages.filter((m: Message) => m && (m.role === "student" || m.role === "npc") && typeof m.text === "string" && m.text.length <= 600 && Object.hasOwn(PLACES, m.place)).slice(-80) : [],
    };
  } catch { return freshProgress(); }
}

export function earnedXP(progress: Progress) { return progress.completed.reduce((sum, index) => sum + QUESTS[index].xp, 0); }
export function nextGoal(progress: Progress) { return QUESTS[progress.active].goals.find(g => !progress.goals.includes(g.id)); }

export function evaluateTurn(progress: Progress, place: Place, input: string): { progress: Progress; reply: string; achieved: boolean; finished: boolean } {
  const text = input.toLowerCase().replace(/[’‘]/g, "'").trim();
  const goal = nextGoal(progress);
  const snack = /sandwich/.test(text) && /water/.test(text);
  const askingPrice = /how much|price|cost/.test(text);
  const choosing = /would like|i'd like|i want|can i (?:have|borrow)|could i (?:have|borrow)|i'll (?:take|have)|i will (?:take|have)|may i|give me|like to borrow/.test(text);
  const confirmation = /confirm|correct|right|total|that's|that is/.test(text);
  let matched = false;
  let reply = "Let's try a full English sentence. You can ask for a hint and try again.";
  if (!goal) reply = "Great work! This mission is complete. Collect your reward to continue.";
  else if (goal.place !== place) reply = place === "courtyard" ? "Let's visit the library on the left, or the canteen on the right. Check your mission for the next stop." : "Your next objective is at " + PLACES[goal.place].english.toLowerCase() + ". Come back when you're ready!";
  else if (/\b(repeat|say that again|pardon|slower)\b/.test(text)) reply = conversationPrompt(progress,place);
  else if (/^help[.!?]*$|can you help|help me|need help|don.t understand|what should|explain/.test(text)) reply = `${LESSONS[progress.active].tip} Try: ${goal.hint}`;
  else {
    switch (goal.id) {
      case "intro":
        matched = /my name is\s+\w+|i am\s+(?!a\b|an\b|new\b|student\b|fine\b|good\b|happy\b)\w+|i'm\s+(?!a\b|an\b|new\b|student\b|fine\b|good\b|happy\b)\w+/.test(text);
        reply = matched ? "Nice to meet you! I'm happy to help you settle in. Is there anything you'd like to ask me?" : "Hi! You can introduce yourself by saying: My name is ..."; break;
      case "join-team":
        matched = /help|join/.test(text) && /would like|i.d like|can i|could i|i can|let.s|want to/.test(text) && !/don.t|do not|not want/.test(text);
        reply = matched ? "Welcome to the team! Our first job is to find a story for the reading corner." : "Tell me that you would like to help our team."; break;
      case "event-report":
        matched = /book|story/.test(text) && /sandwich|snack|picnic/.test(text) && /water|drink/.test(text) && /ready|have|got|prepared/.test(text) && !/not ready|don.t have|do not have/.test(text);
        reply = matched ? "You did it! The story and picnic are ready. You introduced yourself, solved a problem and organised our supplies in English. Welcome to Discovery Day, teammate!" : "Tell me which book and picnic supplies are ready. Use a sentence such as: We have the book, a sandwich and water."; break;
      case "name":
        matched = /your name|what (?:are you called|should i call you)|who are you|may i know your name/.test(text);
        reply = matched ? "My name is Minh. Welcome to our school! Let's explore together." : "What would you like to know about me? Try asking my name."; break;
      case "directions":
        matched = /library/.test(text) && /where|way|how.*(?:get|go|find)|direction|show|take me/.test(text);
        reply = matched ? "Turn left at the courtyard. The library is the building on the left. Could you repeat the direction?" : "Ask me how to get to the library. I'll help you find it."; break;
      case "confirm-direction":
        matched = /left/.test(text) && /turn|go|walk|head/.test(text);
        reply = matched ? "That's right! Turn left. Now walk to the library and say hello to the librarian." : "Remember: turn left at the courtyard. Can you confirm that?"; break;
      case "arrive":
        matched = /hello|hi\b|good (?:morning|afternoon)|found|arrived/.test(text);
        reply = matched ? "Hello! You found the library. Well done!" : "Welcome! Say hello when you arrive."; break;
      case "book":
        matched = /adventure/.test(text) && choosing;
        reply = matched ? "Of course! Here is The Lost Island, an adventure story. What would you like to know about borrowing it?" : "We have an adventure story called The Lost Island. Would you like to borrow it?"; break;
      case "period":
        matched = /how long|how many days|when.*(?:return|due)|(?:return|due).*(?:when|date)|loan period/.test(text);
        reply = matched ? "You can keep it for seven days. Please return it next Monday. Can you confirm the return day?" : "You can ask how long you can keep the book."; break;
      case "return": case "return-alt": case "event-return":
        matched = /monday/.test(text) && /return|bring|give|back|due|confirm/.test(text);
        reply = matched ? "Exactly! Please return it next Monday. Enjoy your reading!" : "The return day is next Monday. Please confirm that you'll bring the book back then."; break;
      case "alternative":
        matched = /another|alternative|different|other book|anything else|instead|what.*available/.test(text);
        reply = matched ? "The adventure book is unavailable, but The Secret Garden Gate, a mystery story, is available. Would you like that instead?" : "The adventure book has been borrowed. Can you ask about another book?"; break;
      case "mystery": case "event-book":
        matched = /mystery/.test(text) && choosing;
        reply = matched ? "Certainly! The mystery book is yours for seven days. Please return it next Monday." : "The mystery story is available. Tell me if you'd like to borrow it."; break;
      case "price": case "event-price":
        matched = snack && askingPrice;
        reply = matched ? "A sandwich is 20,000 dong and water is 5,000 dong. Together, that's 25,000 dong. You have 30,000 dong." : "What would you like to know the price of? We have sandwiches, water and juice."; break;
      case "order": case "event-order":
        matched = snack && choosing && !/juice|two sandwiches|2 sandwiches/.test(text);
        reply = matched ? "One sandwich and one water. That's 25,000 dong, within your 30,000 dong budget. Please confirm your order." : /juice|two sandwiches|2 sandwiches/.test(text) ? "That choice goes over your 30,000 dong budget with a sandwich. Try one sandwich and one water." : "Please tell me which food and drink you'd like."; break;
      case "confirm-order": case "event-confirm":
        matched = snack && /25[,. ]?000|twenty[ -]five thousand/.test(text) && confirmation;
        reply = matched ? "Confirmed! Here are your sandwich and water. Your change is 5,000 dong. Enjoy!" : "Please confirm one sandwich, one water and a total of 25,000 dong."; break;
    }
  }
  if(matched && goal) {
    const remaining=QUESTS[progress.active].goals.find(g=>g.id!==goal.id && !progress.goals.includes(g.id));
    if(remaining && remaining.place===place) reply += " " + (PROMPTS[remaining.id] || "");
  }
  const goals = matched && goal ? [...progress.goals, goal.id] : progress.goals;
  const finished = QUESTS[progress.active].goals.every(g => goals.includes(g.id));
  const messages: Message[] = [...progress.messages, { role: "student", text: input.slice(0, 600), place }, { role: "npc", text: reply, place }];
  return { progress: { ...progress, goals, messages: messages.slice(-80) }, reply, achieved: matched, finished };
}

export function collectReward(progress: Progress): Progress {
  if (progress.completed.includes(progress.active) || !QUESTS[progress.active].goals.every(g => progress.goals.includes(g.id))) return progress;
  const completed = [...progress.completed, progress.active];
  return { ...progress, completed, active: Math.min(progress.active + 1, QUESTS.length - 1), goals: progress.active === QUESTS.length - 1 ? progress.goals : [] };
}


export const LESSONS = [
  {skill:"Make a connection",level:"A1 · Meet",story:"You have joined the cadets preparing English Discovery Day. Minh is looking for a teammate.",pattern:"My name is … / What’s your name?",words:["teammate · đồng đội","introduce · giới thiệu","welcome · chào mừng"],tip:"Introduce yourself first. Then ask the other person’s name.",question:"You meet a new teammate. Which question helps you get to know them?",choices:["What’s your name?","How much is it?","When is it due?"],answer:0},
  {skill:"Listen and check directions",level:"A1 · Explore",story:"Ms. Lan has the first item for your event. Find the library without losing your way.",pattern:"Could you tell me the way to …? / So I turn left, right?",words:["turn left · rẽ trái","courtyard · sân trường","library · thư viện"],tip:"Repeat the important direction to check that you understood.",question:"Minh says: ‘Turn left at the courtyard.’ What should you do?",choices:["Turn right","Turn left","Go to the canteen"],answer:1},
  {skill:"Ask politely",level:"A1 · Request",story:"The reading corner needs an adventure story. You are responsible for borrowing and returning it.",pattern:"I’d like to borrow … / How long can I keep it?",words:["borrow · mượn","return · trả lại","due · đến hạn"],tip:"‘I’d like to…’ makes a request polite. Ask for details before you agree.",question:"The book is due next Monday. Which reply confirms the date?",choices:["I like books.","I’ll return it next Monday.","How much is water?"],answer:1},
  {skill:"Solve a small problem",level:"A1–A2 · Adapt",story:"The adventure book has gone to another team. Find a new story so your reading corner can still open.",pattern:"Do you have another …? / I’ll take … instead.",words:["available · có sẵn","instead · thay vào đó","mystery · truyện bí ẩn"],tip:"If your first choice is unavailable, ask about another option instead of stopping.",question:"Your first choice is unavailable. What can you ask?",choices:["Do you have another book?","My name is An.","Turn left, right?"],answer:0},
  {skill:"Order and check a total",level:"A1–A2 · Decide",story:"Your team has earned a picnic break. Buy one sandwich and water without spending more than 30,000 dong.",pattern:"How much are …? / That’s … in total, correct?",words:["total · tổng cộng","change · tiền thừa","budget · ngân sách"],tip:"Ask the price, order, then repeat the items and total to avoid a mistake.",question:"A sandwich costs 20,000 and water costs 5,000. How much change from 30,000?",choices:["5,000 dong","10,000 dong","25,000 dong"],answer:0},
  {skill:"Use it independently",level:"A2 · Lead",story:"Discovery Day is here. Lead the preparations: borrow the story and organise the picnic without a teammate speaking for you.",pattern:"Request → ask for details → confirm",words:["organise · tổ chức","confirm · xác nhận","independently · tự chủ"],tip:"Use your own words. A clear message matters more than copying the model sentence exactly.",question:"What should you do before finishing a request or order?",choices:["Leave immediately","Check the key details","Only say yes"],answer:1},
] as const;

const PROMPTS: Record<string,string> = {
  intro:"Hi! I’m Minh. We’re preparing English Discovery Day. What’s your name?",
  "join-team":"Our team needs a hand preparing Discovery Day. Would you like to help?",
  "event-report":"Welcome back! Tell me what you have prepared for our reading corner and picnic.",
  name:"Nice to meet you! We’ll be teammates. What would you like to ask me?",
  directions:"Our reading corner needs a book from the library. What would you like to know before you go?",
  "confirm-direction":"Turn left at the courtyard. The library is on the left. Can you repeat the direction?",
  arrive:"Hello! You found the library. I’m Ms. Lan. Please say hello before we start.",
  book:"Welcome to our reading corner project. The Lost Island is an adventure story. What would you like to borrow?",
  period:"Good choice! Before you take the book, what would you like to know about returning it?",
  return:"Please return the adventure book next Monday. Can you confirm the day?",
  alternative:"A small change: another team has borrowed the adventure book. What could you ask for instead?",
  mystery:"The Secret Garden Gate, a mystery story, is available. Would you like it?",
  "return-alt":"You can borrow the mystery story. Please return it next Monday. Can you confirm?",
  price:"Welcome to the team picnic! You have 30,000 dong. What would you like to ask about our sandwich and water?",
  order:"A sandwich is 20,000 dong and water is 5,000 dong. What would you like?",
  "confirm-order":"One sandwich and one water: 25,000 dong. Please check the items and total before I prepare them.",
  "event-book":"Discovery Day is starting. Which story would you like to borrow for your reading corner?",
  "event-return":"The mystery book is ready. Please return it next Monday. Can you confirm the date?",
  "event-price":"Time to organise the picnic. Ask me what you need to know about our sandwich and water.",
  "event-order":"The sandwich and water cost 25,000 dong together. You have 30,000. What would you like to order?",
  "event-confirm":"Your supplies are ready. Please confirm the items and total for the team.",
};
export function conversationPrompt(progress:Progress,place:Place) {
  const goal=nextGoal(progress);
  if(!goal)return "Your team is ready for Discovery Day! Collect your reward, then review what you learned.";
  if(goal.place!==place)return `Your next task is at the ${PLACES[goal.place].english.toLowerCase()}. Check your mission and meet your teammate there.`;
  return PROMPTS[goal.id] || PLACES[place].greeting;
}
