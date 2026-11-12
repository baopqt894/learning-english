"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  collectReward,
  LESSONS,
  conversationPrompt,
  earnedXP,
  evaluateTurn,
  freshProgress,
  nextGoal,
  PLACES,
  QUESTS,
  SCHOOL,
  type Place,
} from "@/lib/game";
import { useProgress } from "@/lib/progress-store";
import type { WorldHandle } from "./campus-world";
import { Icon } from "./icon";
import { NpcPortrait } from "./npc-portrait";
import { CampusMap, mapPosition } from "./campus-map";
import { EXPLORATION_ZONES, ZONE_ART, type ZoneId } from "@/lib/campus-map";

const World = dynamic(
  () => import("./campus-world").then((module) => module.CampusWorld),
  {
    ssr: false,
    loading: () => (
      <div className="world-loading">
        <span className="loading-ring" />
        Đang mở cổng trường…
      </div>
    ),
  },
);
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult:
    | ((event: {
        results: ArrayLike<ArrayLike<{ transcript: string }>>;
      }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};
type Tab = "explore" | "journey" | "teacher";

function Cadet({
  variant = 0,
  small = false,
}: {
  variant?: number;
  small?: boolean;
}) {
  return (
    <span
      className={`cadet-avatar avatar-${variant}${small ? " avatar-small" : ""}`}
      aria-hidden="true"
    >
      <span className="cadet-body" />
      <span className="cadet-head">
        <span className="cadet-eyes">••</span>
      </span>
      <span className="cadet-cap">★</span>
    </span>
  );
}

export function CampusGame() {
  const { progress, saveProgress, saveAvailable } = useProgress();
  const [tab, setTab] = useState<Tab>("explore");
  const [near, setNear] = useState<Place | null>(null);
  const [talking, setTalking] = useState<Place | null>(null);
  const [draft, setDraft] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(0);
  const [retryCount,setRetryCount] = useState(0);
  const [reviewOpen,setReviewOpen] = useState(false);
  const [reviewChoice,setReviewChoice] = useState<number | null>(null);
  const [turnFeedback,setTurnFeedback] = useState<"success" | "retry" | null>(null);
  const [conversationStart,setConversationStart] = useState(0);
  const [practiceFirst,setPracticeFirst] = useState(false);
  const [hint, setHint] = useState(false);
  const [responseMode, setResponseMode] = useState<"text" | "voice" | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [help, setHelp] = useState(false);
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState("");
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState<Place | null>(null);
  const [reward, setReward] = useState<number | null>(null);
  const [retryReset, setRetryReset] = useState(false);
  const [ready, setReady] = useState(false);
  const [questVisible, setQuestVisible] = useState(true);
  const [mapVisible, setMapVisible] = useState(true);
  const [artGallery, setArtGallery] = useState(false);
  const [highQuality, setHighQuality] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [atlasOpen, setAtlasOpen] = useState(false);
  const [areaName, setAreaName] = useState("Khu trung tâm");
  const worldRef = useRef<WorldHandle>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const speechToken = useRef(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const autoSpokenPlace = useRef<Place | null>(null);
  const stopSpeech = useCallback(() => {
    speechToken.current++;
    setSpeaking(null);
    window.speechSynthesis?.cancel();
    utteranceRef.current = null;
  }, []);
  const messagesRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef<HTMLInputElement>(null);
  const quest = QUESTS[progress.active];
  const lesson = LESSONS[progress.active];
  const goal = nextGoal(progress);
  const xp = earnedXP(progress);
  const finished = quest.goals.every((g) => progress.goals.includes(g.id));
  const allDone = progress.completed.length === QUESTS.length;
  const currentPlace = talking || near || goal?.place || "courtyard";
  const person = PLACES[currentPlace];
  const dialogueName = currentPlace === "courtyard" ? "Minh" : currentPlace === "library" ? "Ms. Lan" : "Mr. Hung";
  const dialogueRole = currentPlace === "courtyard" ? "Student guide" : currentPlace === "library" ? "School librarian" : "Canteen staff";
  const encounterGoal = goal?.place === talking ? goal : undefined;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => {
      cancelAnimationFrame(frame);
      recognitionRef.current?.abort();
      stopSpeech();
    };
  }, [stopSpeech]);
  useEffect(() => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [progress.messages.length, talking]);
  useEffect(() => {
    const sync = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const modalOpen =
    (ready && !progress.name) ||
    help ||
    reward !== null ||
    retryReset ||
    artGallery ||
    atlasOpen || reviewOpen;
  useEffect(() => {
    if (!modalOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const getFocusable = () => {
      const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"]');
      const dialog = dialogs[dialogs.length - 1];
      return dialog
        ? Array.from(
            dialog.querySelectorAll<HTMLElement>(
              'button:not(:disabled),a[href],input:not(:disabled),[tabindex="0"]',
            ),
          )
        : [];
    };
    const frame = requestAnimationFrame(() => {
      const focusable = getFocusable();
      if (!focusable.some((item) => item === document.activeElement))
        focusable[0]?.focus();
    });
    const trap = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (reviewOpen) setReviewOpen(false);
        else if (atlasOpen) setAtlasOpen(false);
        else if (artGallery) setArtGallery(false);
        else if (help) setHelp(false);
        else if (retryReset) setRetryReset(false);
        else if (reward !== null) setReward(null);
      }
      if (event.key !== "Tab") return;
      const items = getFocusable();
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", trap);
      previousFocus?.focus();
    };
  }, [modalOpen, help, retryReset, reward, artGallery, atlasOpen, reviewOpen]);

  const updateMapPlayer = useCallback((x: number, z: number) => {
    const position = mapPosition(x, z);
    document
      .querySelectorAll<HTMLElement>(".campus-map-player")
      .forEach((marker) => {
        marker.style.left = position.left;
        marker.style.top = position.top;
      });
  }, []);
  const goToZone = (zoneId: ZoneId) => {
    const zone = EXPLORATION_ZONES.find((z) => z.id === zoneId)!;
    setAtlasOpen(false);
    setTalking(null);
    setHint(false);
    recognitionRef.current?.abort();
    stopSpeech();
    worldRef.current?.goToZone(zoneId);
    setNotice(
      `Đang đến ${zone.name.toLowerCase()} · ${zone.english}. Khám phá tự do; nhiệm vụ hội thoại vẫn ở ba nhân vật trung tâm.`,
    );
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setNotice(
        "Màn chơi đang phủ toàn khung trình duyệt. Có thể dùng F11 để ẩn thanh trình duyệt trên máy tính.",
      );
    }
  };

  const speak = useCallback((text: string, place: Place) => {
    if (muted) return;
    if (!("speechSynthesis" in window)) {
      setNotice("Voice playback is unavailable. You can still read the dialogue.");
      return;
    }
    const token=++speechToken.current;
    window.speechSynthesis.cancel();
    setSpeaking(null);
    const utterance=new SpeechSynthesisUtterance(text);
    utteranceRef.current=utterance;
    utterance.lang="en-US";
    utterance.rate=place === "library" ? .8:.9;
    const voice=window.speechSynthesis.getVoices().find(v=>v.lang === "en-US" && v.localService);
    if(voice) utterance.voice=voice;
    utterance.onstart=()=>{if(speechToken.current===token)setSpeaking(place);};
    utterance.onend=()=>{if(speechToken.current===token){setSpeaking(null);utteranceRef.current=null;}};
    utterance.onerror=(event)=>{
      if(speechToken.current!==token)return;
      setSpeaking(null);utteranceRef.current=null;
      if(event.error!=="interrupted"&&event.error!=="canceled")setNotice("Voice playback failed. You can still read the dialogue.");
    };
    window.speechSynthesis.speak(utterance);
  }, [muted]);

  const openConversation = useCallback(() => {
    if (!near) return;
    setTalking(near);
    setConversationStart(progress.messages.length);
    setTurnFeedback(null);
    setRetryCount(0);
    setPracticeFirst(false);
    setResponseMode(null);
    setShowHistory(false);
    setHint(false);
    setDraft("");
    setNotice("");

  }, [near, progress.messages.length]);

  const navigate = (next: Tab) => {
    setTab(next);
    setTalking(null);
    setHint(false);
    setDraft("");
    recognitionRef.current?.abort();
    stopSpeech();
  };

  const goTo = (place: Place) => {
    setAtlasOpen(false);
    setTalking(null);
    setHint(false);
    recognitionRef.current?.abort();
    stopSpeech();
    worldRef.current?.goTo(place);
    setNotice(
      `Đang đến ${PLACES[place].name.toLowerCase()}. Khi đến gần, chọn “Trò chuyện”.`,
    );
  };

  const start = (event: FormEvent) => {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    saveProgress({ ...progress, name: cleanName.slice(0, 30), avatar });
    setNotice(
      "Chào mừng em! Chọn Sân trường để đến gặp Minh và bắt đầu nhiệm vụ.",
    );
  };

  const send = (event: FormEvent) => {
    event.preventDefault();
    if (!talking || !draft.trim() || near !== talking || listening) return;
    const result = evaluateTurn(progress, talking, draft.trim());
    setTurnFeedback(result.achieved ? "success":"retry");
    setPracticeFirst(false);
    saveProgress(result.progress);
    setDraft("");
    setHint(!result.achieved && retryCount >= 1 && progress.mode === "guided");
    setRetryCount(result.achieved ? 0 : retryCount+1);
    setNotice(
      result.achieved
        ? "Conversation goal complete!"
        : "Try saying it another way, or ask for a hint.",
    );
    speak(result.reply, talking);
  };

  const microphone = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const SpeechRecognition =
      (window as SpeechWindow).SpeechRecognition ||
      (window as SpeechWindow).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setNotice(
        "Speech recognition is unavailable. Type your reply or try Chrome/Edge.",
      );
      setResponseMode("text");
      requestAnimationFrame(() => draftRef.current?.focus());
      return;
    }
    stopSpeech();
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      setResponseMode("voice");
      setDraft(event.results[0][0].transcript.slice(0, 600));
      setNotice("Speech captured. Review your words, then send your reply.");
    };
    recognition.onerror = (event) => {
      setListening(false);
      setNotice(
        event.error === "not-allowed"
          ? "Microphone access was denied. You can type your reply instead."
          : "We could not hear you clearly. Try again or type your reply.",
      );
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
      setNotice("Listening… Select Stop mic when you are done.");
    } catch {
      setListening(false);
      setNotice("Could not start the microphone. You can type your reply instead.");
    }
  };

  const claim = () => {setReviewChoice(null);setReviewOpen(true);};
  const completeMission = () => {
    setReviewOpen(false);
    const index = progress.active;
    const updated = collectReward(progress);
    if (updated === progress) return;
    saveProgress(updated);
    setReward(index);
    stopSpeech();
    setTalking(null);
    setHint(false);
    setNotice("");
  };

  const exportProgress = () => {
    const content = {
      school: SCHOOL,
      exportedAt: new Date().toISOString(),
      ...progress,
      xp,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(content, null, 2)], {
        type: "application/json",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "campusquest-tien-do.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    recognitionRef.current?.abort();
    stopSpeech();
    saveProgress(freshProgress());
    setRetryReset(false);
    setTalking(null);
    setName("");
    setTab("explore");
    setNotice("");
    setQuestVisible(true);
    setMapVisible(true);
  };

  const conversationMessages = progress.messages.slice(conversationStart).filter((m) => m.place === talking);
  useEffect(() => {
    if (!talking) { autoSpokenPlace.current=null; return; }
    if (autoSpokenPlace.current === talking) return;
    autoSpokenPlace.current=talking;
    speak(conversationPrompt(progress,talking),talking);
  }, [talking, progress, speak]);
  function closeConversation() {
    setTalking(null);
    setHint(false);
    setResponseMode(null);
    recognitionRef.current?.abort();
    setListening(false);
    stopSpeech();
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(".interact-button")?.focus());
  }
  useEffect(() => {
    if (!talking) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !modalOpen) {
        setTalking(null);
        recognitionRef.current?.abort();
        setListening(false);
        stopSpeech();
        requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(".interact-button")?.focus());
      }
    };
    document.addEventListener("keydown", escape);
    const frame = requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(".encounter-options button:not(:disabled)")?.focus());
    return () => { document.removeEventListener("keydown", escape); cancelAnimationFrame(frame); };
  }, [talking, modalOpen, stopSpeech]);

  return (
    <div
      className={`game-app ${tab === "explore" ? "game-mode" : ""} ${questVisible ? "" : "quests-collapsed"} ${mapVisible ? "" : "map-collapsed"} ${talking ? "conversation-open" : ""}`}
    >
      <header className="app-header">
        <Link
          href="/"
          className="brand"
          aria-label="CampusQuest AI – Trang chủ"
        >
          <span className="brand-icon">
            <Icon name="compass" size={29} />
          </span>
          <span>
            <strong>
              CampusQuest<span>AI</span>
            </strong>
            <small>PHÂN HIỆU 1 · THIẾU SINH QUÂN MIỀN TRUNG</small>
          </span>
        </Link>
        <nav className="main-nav" aria-label="Điều hướng chính">
          {(
            [
              { id: "explore", name: "Khám phá", icon: "compass" },
              { id: "journey", name: "Hành trình", icon: "map" },
              { id: "teacher", name: "Góc giáo viên", icon: "school" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              aria-current={tab === item.id ? "page" : undefined}
              className={tab === item.id ? "nav-active" : ""}
            >
              <Icon name={item.icon} size={18} />
              {item.name}
            </button>
          ))}
        </nav>
        <div className="header-profile">
          <span className="xp-pill">
            <Icon name="star" size={16} />
            {xp} XP
          </span>
          <Cadet variant={progress.avatar} small />
          <span className="profile-name">
            {progress.name || "Học viên mới"}
            <small>Cấp độ {Math.floor(xp / 150) + 1}</small>
          </span>
        </div>
      </header>

      {tab === "explore" && (
        <div className="game-tools" aria-label="Điều khiển màn chơi">
          <button
            onClick={() => setQuestVisible(!questVisible)}
            aria-pressed={questVisible}
            aria-label="Hiện/ẩn nhiệm vụ"
            title="Hiện/ẩn nhiệm vụ"
          >
            <Icon name="book" size={18} />
            <span>Nhiệm vụ</span>
          </button>
          <button
            onClick={() => setMapVisible(!mapVisible)}
            aria-pressed={mapVisible}
            aria-label="Hiện/ẩn bản đồ"
            title="Hiện/ẩn bản đồ"
          >
            <Icon name="map" size={18} />
            <span>Bản đồ</span>
          </button>
          <span className="tool-divider" />
          <button
            onClick={() => worldRef.current?.overview()}
            aria-label="Xem toàn cảnh 3D"
            title="Xem toàn cảnh 3D"
          >
            <Icon name="compass" size={18} />
          </button>
          <button
            onClick={() => worldRef.current?.zoom(0.15)}
            aria-label="Phóng to cảnh"
          >
            <Icon name="plus" size={18} />
          </button>
          <button
            onClick={() => worldRef.current?.zoom(-0.15)}
            aria-label="Thu nhỏ cảnh"
          >
            <Icon name="minus" size={18} />
          </button>
          <button
            onClick={() => worldRef.current?.recenter()}
            aria-label="Đặt lại camera"
          >
            <Icon name="target" size={18} />
          </button>
          <button
            onClick={() => {
              worldRef.current?.setQuality(!highQuality);
              setHighQuality(!highQuality);
            }}
            aria-label={
              highQuality
                ? "Đồ họa chi tiết – chuyển sang nhẹ"
                : "Đồ họa nhẹ – chuyển sang chi tiết"
            }
            title={highQuality ? "Đồ họa: Chi tiết" : "Đồ họa: Nhẹ"}
          >
            <Icon name="leaf" size={18} />
            <span>{highQuality ? "Chi tiết" : "Nhẹ"}</span>
          </button>
          <button
            onClick={() => setArtGallery(true)}
            aria-label="Mở bộ sưu tập hình ảnh"
            title="Bộ sưu tập hình ảnh"
          >
            <Icon name="image" size={18} />
          </button>
          <button
            onClick={toggleFullscreen}
            aria-label={
              fullscreen ? "Thoát toàn màn hình" : "Bật toàn màn hình"
            }
            title="Toàn màn hình"
          >
            <Icon name="fullscreen" size={18} />
          </button>
          <button onClick={() => setHelp(true)} aria-label="Hướng dẫn chơi">
            <Icon name="info" size={18} />
          </button>
        </div>
      )}

      <main className="app-main">
        <div className="school-strip">
          <Image
            src="/images/school-logo.jpg"
            alt="Logo Phân hiệu 1 Trường Thiếu sinh quân miền Trung"
            width={34}
            height={34}
          />
          <span>
            Phân hiệu 1 <i /> Trường Thiếu sinh quân miền Trung
          </span>
          <a
            href="https://103.72.97.24/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Website nhà trường ↗
          </a>
        </div>
        {tab === "explore" && (
          <>
            <div className="page-heading">
              <div>
                <p className="eyebrow">
                  <span className="tiny-sun">☀</span> MỖI NGÀY MỘT BƯỚC TIẾN
                </p>
                <h1>
                  Chào {progress.name || "học viên mới"},{" "}
                  <span>cùng khám phá nhé!</span>
                </h1>
                <p>
                  Rèn tiếng Anh qua những câu chuyện ngay trong mái trường của
                  em.
                </p>
              </div>
              <button
                className="outline-button help-button"
                onClick={() => setHelp(true)}
              >
                <Icon name="info" size={17} />
                Cách chơi
              </button>
            </div>
            <div className="play-layout">
              <aside
                className="mission-sidebar"
                inert={!questVisible || !!talking}
              >
                <section className="panel mission-panel">
                  <div className="section-top">
                    <span className="eyebrow">NHIỆM VỤ HIỆN TẠI</span>
                    <span className="mission-count">
                      {String(progress.active + 1).padStart(2, "0")}
                      <small> / 06</small>
                    </span>
                  </div>
                  <div className="mission-illustration">
                    <span className="mission-icon">
                      <Icon
                        name={
                          progress.active < 2
                            ? "compass"
                            : progress.active < 4
                              ? "book"
                              : "food"
                        }
                        size={38}
                      />
                    </span>
                    <span className="orbit orbit-one" />
                    <span className="orbit orbit-two" />
                    <span className="illustration-star">✦</span>
                  </div>
                  <div className="mission-meta">
                    <span>ENGLISH DISCOVERY DAY · TEAM PREPARATIONS</span>
                  </div>
                  <h2>{quest.title}</h2>
                  <p className="mission-description">{quest.description}</p>
                  <div className="lesson-brief"><strong>{lesson.skill}</strong><p>{lesson.pattern}</p><details><summary>Useful words · Từ vựng</summary>{lesson.words.map(word=><p key={word}>{word}</p>)}</details></div>
                  <div className="mission-stats">
                    <span>
                      <Icon name="clock" size={15} />
                      {quest.minutes}
                    </span>
                    <span className="gold-text">
                      <Icon name="star" size={15} />+{quest.xp} XP
                    </span>
                  </div>
                  <div className="objectives-title">
                    <strong>Mục tiêu của em</strong>
                    <span>
                      {progress.goals.length}/{quest.goals.length}
                    </span>
                  </div>
                  <div className="progress-track">
                    <span
                      style={{
                        width: `${(progress.goals.length / quest.goals.length) * 100}%`,
                      }}
                    />
                  </div>
                  <ul className="objectives">
                    {quest.goals.map((g) => (
                      <li
                        key={g.id}
                        className={
                          progress.goals.includes(g.id)
                            ? "objective-done"
                            : g.id === goal?.id
                              ? "objective-current"
                              : ""
                        }
                      >
                        <span className="objective-check">
                          {progress.goals.includes(g.id) ? (
                            <Icon name="check" size={12} />
                          ) : null}
                        </span>
                        <span>{g.label}</span>
                      </li>
                    ))}
                  </ul>
                  {finished && !allDone ? (
                    <button
                      className="primary-button full-width"
                      onClick={claim}
                    >
                      <Icon name="trophy" size={17} />
                      Nhận thưởng
                    </button>
                  ) : (
                    <button
                      className="primary-button full-width"
                      onClick={() => goal && goTo(goal.place)}
                      disabled={allDone}
                    >
                      <Icon name={allDone ? "trophy" : "map"} size={17} />
                      {allDone ? "Đại sứ học đường" : "Đến nơi làm nhiệm vụ"}
                      <Icon name="arrow" size={17} />
                    </button>
                  )}
                </section>
                <div className="encouragement">
                  <span>
                    <Icon name="leaf" size={22} />
                  </span>
                  <p>
                    Mỗi câu nói là một bước tự tin.
                    <strong>Cứ thử, em sẽ làm được!</strong>
                  </p>
                </div>
                <button
                  className="journey-link"
                  onClick={() => setTab("journey")}
                >
                  Xem cả hành trình <Icon name="arrow" size={16} />
                </button>
              </aside>

              <section
                className="exploration-column"
                aria-label="Khám phá khuôn viên"
              >
                <button
                  className="mobile-mission-summary"
                  onClick={() =>
                    goal
                      ? goTo(goal.place)
                      : finished && !allDone
                        ? claim()
                        : navigate("journey")
                  }
                >
                  <span>{String(progress.active + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{quest.title}</strong>
                    <small>
                      {goal?.label || "Em đã hoàn thành các mục tiêu!"}
                    </small>
                  </div>
                  <Icon name="arrow" size={18} />
                </button>
                <div className="world-panel">
                  <div className="world-topbar">
                    <div>
                      <span className="live-dot" />
                      <strong>{areaName}</strong>
                      <span className="world-subtitle">Bản đồ mô phỏng</span>
                    </div>
                    <button
                      onClick={() => worldRef.current?.recenter()}
                      className="icon-button"
                      aria-label="Đặt lại góc nhìn"
                    >
                      <Icon name="target" size={18} />
                    </button>
                  </div>
                  <div className="world-stage">
                    <div className="scene-atmosphere" aria-hidden="true">
                      <span className="sun-rays" />
                      <span className="scene-vignette" />
                      <span className="cloud-shade" />
                    </div>
                    <div className="chapter-pill">
                      <span>01</span>
                      <div>
                        English Discovery Day
                        <small>Hành trình của em bắt đầu từ đây</small>
                      </div>
                    </div>
                    <div className="world-north" aria-hidden="true">
                      N<Icon name="compass" size={26} />
                    </div>
                    <World
                      ref={worldRef}
                      avatar={progress.avatar}
                      objective={goal?.place}
                      conversation={talking}
                      speaking={speaking}
                      highQuality={highQuality}
                      enabled={
                        !!progress.name &&
                        tab === "explore" &&
                        !talking &&
                        reward === null &&
                        !help &&
                        !artGallery &&
                        !atlasOpen
                      }
                      onNear={setNear}
                      onInteract={openConversation}
                      onMove={updateMapPlayer}
                      onAreaChange={setAreaName}
                    />
                    <div className="world-bottom-hud">
                      <span>
                        <span className="player-dot" />
                        {near ? PLACES[near].name : "Đang khám phá"}
                      </span>
                      {near && !talking && (
                        <button
                          className="interact-button"
                          onClick={openConversation}
                        >
                          Trò chuyện với {PLACES[near].npc}
                          <kbd>E</kbd>
                        </button>
                      )}
                      <span className="weather">
                        ☀ <span>Buổi sáng</span>
                      </span>
                    </div>
                  </div>
                  <div className="world-controls">
                    <span>
                      <kbd>W</kbd>
                      <kbd>A</kbd>
                      <kbd>S</kbd>
                      <kbd>D</kbd> hoặc bấm vào sân để di chuyển
                    </span>
                    <span>
                      <kbd>E</kbd> Trò chuyện
                    </span>
                  </div>
                </div>
                <div className="location-shortcuts" aria-label="Đến địa điểm">
                  {(Object.keys(PLACES) as Place[]).map((id) => (
                    <button
                      key={id}
                      onClick={() => goTo(id)}
                      className={near === id ? "location-active" : ""}
                    >
                      <Icon
                        name={
                          id === "library"
                            ? "book"
                            : id === "canteen"
                              ? "food"
                              : "school"
                        }
                        size={18}
                      />
                      {PLACES[id].name}
                      <Icon name="arrow" size={15} />
                    </button>
                  ))}
                </div>

                {talking && (
                  <section className="encounter" lang="en" aria-label={`Talk to ${dialogueName}`} data-speaking={speaking === talking}>
                    <NpcPortrait key={talking} place={talking} speaking={speaking === talking} turn={conversationMessages.length} mood={turnFeedback === "success" ? "encouraging" : turnFeedback === "retry" ? "thoughtful":"welcoming"} />
                    <div className="encounter-topline">
                      <span><span className="live-dot" /> In conversation · {person.english}</span>
                      <button className="encounter-exit" onClick={closeConversation} aria-label="Close conversation">
                        Back to campus <Icon name="close" size={18} />
                      </button>
                    </div>
                    <div className="encounter-caption">
                      <div className="learning-objective"><span>{lesson.level}</span><strong>{encounterGoal?.label || (goal ? `Next: ${goal.label}` : "Mission complete")}</strong><span>{progress.goals.length}/{quest.goals.length}</span></div>
                      <div className="encounter-speaker">
                        <span className="speaker-monogram">{person.npc === "Minh" ? "M" : talking === "library" ? "L" : "H"}</span>
                        <div><strong>{dialogueName}</strong><span>{dialogueRole}</span></div><span className="encounter-turn">{speaking === talking ? "Speaking" : "Listening"}</span>
                        <button onClick={() => { setMuted(!muted); stopSpeech(); }} className="icon-button" aria-label={muted ? "Unmute voice" : "Mute voice"} aria-pressed={muted}><Icon name="sound" size={20} /></button>
                      </div>
                      <div className="encounter-line" aria-live="polite" aria-atomic="true">
                        <p>{conversationMessages.findLast((m) => m.role === "npc")?.text || conversationPrompt(progress,talking)}</p>
                        <button className="replay-button" onClick={() => speak(conversationMessages.findLast((m) => m.role === "npc")?.text || conversationPrompt(progress,talking), talking)} aria-label="Replay reply"><Icon name="sound" size={20} /></button>
                      </div>
                      {conversationMessages.at(-2)?.role === "student" && <p className="encounter-your-line">You: {conversationMessages.at(-2)?.text}</p>}
                      {turnFeedback && <div className={`learning-feedback learning-${turnFeedback}`} role="status"><strong>{turnFeedback === "success" ? "Message understood" : "Keep practising"}</strong><span>{turnFeedback === "success" ? "You completed a real communication goal. Listen for your next step." : lesson.tip}</span></div>}
                      {encounterGoal && <div className="learning-support"><button aria-expanded={practiceFirst} onClick={()=>{setPracticeFirst(!practiceFirst);setHint(false);}}>Listen to a model</button><span>Listen → try your own words → check the response</span></div>}
                      {practiceFirst && encounterGoal && <div className="model-practice"><p>{encounterGoal.hint}</p><button onClick={()=>speak(encounterGoal.hint,talking)}>Play model</button><small>Try saying it yourself. Then choose Speak or Type to answer.</small></div>}
                      {near !== talking && <p className="inline-notice">Move closer to continue this conversation.</p>}
                      {hint && encounterGoal && <div className="encounter-hint" id="encounter-hint"><span>!</span><div><small>Try saying</small><p>{encounterGoal.hint}</p></div><button onClick={() => { setResponseMode("text"); setDraft(encounterGoal.hint); requestAnimationFrame(() => draftRef.current?.focus()); }} title="Fill in the suggested reply">Use this <Icon name="arrow" size={16} /></button></div>}
                      {responseMode && encounterGoal && !finished && <form className="encounter-form" onSubmit={send}>
                        {listening && <span className="voice-wave" aria-hidden="true"><i /><i /><i /><i /><i /></span>}
                        <input ref={draftRef} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={listening ? "Listening…" : responseMode === "voice" ? "Review your words, then send…" : "Type your reply…"} aria-label="Your English reply" maxLength={600} disabled={near !== talking || listening} />
                        <button type="submit" disabled={!draft.trim() || near !== talking || listening} aria-label="Send reply"><Icon name="send" size={20} /><span>Send</span></button>
                      </form>}
                      {finished && !allDone ? <button className="encounter-claim" onClick={claim}><Icon name="trophy" size={22} /> Mission complete · Quick review <Icon name="arrow" size={20} /></button> : !allDone && encounterGoal && <div className="encounter-options" aria-label="Reply options">
                        <button onClick={() => setHint(!hint)} aria-expanded={hint} aria-controls="encounter-hint" className={hint ? "option-active" : ""} disabled={!encounterGoal} title={!encounterGoal ? "Hints are available at your current quest character" : "Show hint"}><span className="hint-glyph">!</span><span>Hint<small>A little help</small></span></button>
                        <button onClick={() => { setResponseMode("voice"); microphone(); }} aria-pressed={listening} className={listening ? "option-listening" : responseMode === "voice" ? "option-active" : ""} disabled={near !== talking}><Icon name="mic" size={23} /><span>{listening ? "Stop mic" : "Speak"}<small>{listening ? "Listening…" : "Use your microphone"}</small></span></button>
                        <button onClick={() => { recognitionRef.current?.abort(); setListening(false); setResponseMode("text"); requestAnimationFrame(() => draftRef.current?.focus()); }} className={responseMode === "text" ? "option-active" : ""} disabled={near !== talking}><Icon name="chat" size={23} /><span>Type<small>Write your reply</small></span></button>
                      </div>}
                      {goal && goal.place !== talking && <button className="learning-next-stop" onClick={()=>goTo(goal.place)}>Next: {PLACES[goal.place].english} <Icon name="arrow" size={18}/></button>}
                      <div className="encounter-footer"><span role="status">{notice || (allDone ? "Journey complete. Keep exploring the campus." : "Choose how to reply")}</span><button onClick={() => setShowHistory(!showHistory)} aria-expanded={showHistory}>{showHistory ? "Hide history" : "History"}<Icon name="clock" size={14} /></button></div>
                      {showHistory && <div className="encounter-history" role="log" aria-label="Conversation history" ref={messagesRef}><p><strong>{dialogueName}</strong>{person.greeting}</p>{conversationMessages.map((m, i) => <p key={i}><strong>{m.role === "npc" ? dialogueName : "You"}</strong>{m.text}</p>)}</div>}
                    </div>
                  </section>
                )}
                <div className="game-notice" role="status">
                  {notice ||
                    "Bản mẫu học tập · Hội thoại theo kịch bản, chưa kết nối AI tạo sinh."}
                </div>
              </section>

              <aside className="companion-sidebar" inert={!mapVisible}>
                <section className="panel mini-map-panel">
                  <div className="section-top">
                    <h2>Bản đồ nhỏ</h2>
                    <button
                      className="atlas-expand"
                      onClick={() => setAtlasOpen(true)}
                      aria-label="Mở bản đồ toàn trường"
                      title="Mở bản đồ toàn trường"
                    >
                      <Icon name="fullscreen" size={16} />
                    </button>
                  </div>
                  <CampusMap objective={goal?.place} near={near} onPlace={goTo} onZone={goToZone} />
                  <div className="mini-map-legend">
                    <span className="player-dot" />
                    Chọn địa điểm để di chuyển
                  </div>
                  <button
                    className="atlas-open-button"
                    onClick={() => setAtlasOpen(true)}
                  >
                    Khám phá toàn trường <Icon name="arrow" size={13} />
                  </button>
                </section>
                <section className="panel companions-panel">
                  <div className="section-top">
                    <h2>Người đồng hành</h2>
                    <span className="subtle-count">03</span>
                  </div>
                  {(Object.keys(PLACES) as Place[]).map((id) => (
                    <button
                      key={id}
                      className={`companion-card ${near === id ? "companion-near" : ""}`}
                      onClick={() => goTo(id)}
                    >
                      <span className={`npc-avatar npc-${id}`}>
                        {id === "courtyard" ? (
                          <Cadet small />
                        ) : (
                          <Icon
                            name={id === "library" ? "book" : "food"}
                            size={22}
                          />
                        )}
                      </span>
                      <span>
                        <strong>{PLACES[id].npc}</strong>
                        <small>{PLACES[id].name}</small>
                      </span>
                      <Icon name="chevron" size={15} />
                    </button>
                  ))}
                </section>
                <section className="panel inventory-panel">
                  <div className="section-top">
                    <h2>Hành trang</h2>
                    <Icon name="bag" size={17} />
                  </div>
                  <div className="inventory-items">
                    <span className="inventory-slot" title="Ba lô học viên">
                      <Icon name="bag" size={25} />
                    </span>
                    <span
                      className={`inventory-slot ${progress.completed.includes(2) ? "item-earned" : "item-locked"}`}
                      title="Hoàn thành nhiệm vụ 3 để nhận sách"
                    >
                      <Icon name="book" size={25} />
                    </span>
                    <span
                      className={`inventory-slot ${progress.completed.includes(4) ? "item-earned" : "item-locked"}`}
                      title="Hoàn thành nhiệm vụ 5 để nhận bữa ăn"
                    >
                      <Icon name="food" size={25} />
                    </span>
                  </div>
                  <p>
                    {progress.completed.length
                      ? `${progress.completed.length} huy hiệu đã nhận`
                      : "Những phần thưởng đang chờ em!"}
                  </p>
                </section>
                <div className="ambassador-card">
                  <div className="ambassador-badge">
                    <Icon name="trophy" size={30} />
                  </div>
                  <span>MỤC TIÊU HÀNH TRÌNH</span>
                  <h3>Đại sứ học đường</h3>
                  <p>
                    Tự tin giao tiếp.
                    <br />
                    Sẵn sàng kết nối.
                  </p>
                  <div className="progress-track">
                    <span
                      style={{
                        width: `${(progress.completed.length / 6) * 100}%`,
                      }}
                    />
                  </div>
                  <small>
                    {progress.completed.length}/6 nhiệm vụ hoàn thành
                  </small>
                </div>
              </aside>
            </div>
          </>
        )}

        {tab === "journey" && (
          <section className="journey-page">
            <div className="page-heading">
              <div>
                <p className="eyebrow">HÀNH TRÌNH CỦA EM</p>
                <h1>
                  Sáu thử thách. <span>Một bước trưởng thành.</span>
                </h1>
                <p>Hoàn thành từng nhiệm vụ để trở thành Đại sứ học đường.</p>
              </div>
              <span className="large-xp">
                <Icon name="star" />
                {xp} XP
              </span>
            </div>
            <div className="journey-grid">
              {QUESTS.map((q, index) => {
                const done = progress.completed.includes(index);
                const unlocked = index <= progress.completed.length;
                return (
                  <article
                    key={q.title}
                    className={`journey-card ${done ? "quest-complete" : ""} ${!unlocked ? "quest-locked" : ""}`}
                  >
                    <div className="journey-card-top">
                      <span className="journey-number">0{index + 1}</span>
                      <Icon
                        name={done ? "check" : unlocked ? "compass" : "lock"}
                        size={24}
                      />
                    </div>
                    <h2>{q.title}</h2>
                    <p>{q.description}</p>
                    <div className="journey-details">
                      <span>
                        <Icon name="clock" size={15} />
                        {q.minutes}
                      </span>
                      <span>+{q.xp} XP</span>
                    </div>
                    <span className="badge-label">
                      <Icon name="trophy" size={15} />
                      {q.badge}
                    </span>
                    <button
                      className={
                        unlocked && !done ? "primary-button" : "outline-button"
                      }
                      disabled={!unlocked || done}
                      onClick={() => setTab("explore")}
                    >
                      {done
                        ? "Đã nhận huy hiệu"
                        : unlocked
                          ? "Tiếp tục nhiệm vụ"
                          : "Hoàn thành nhiệm vụ trước"}
                      {unlocked && !done && <Icon name="arrow" size={16} />}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {tab === "teacher" && (
          <section className="teacher-page">
            <div className="page-heading">
              <div>
                <p className="eyebrow">GÓC GIÁO VIÊN · BẢN MẪU CỤC BỘ</p>
                <h1>
                  Cùng học viên <span>tiến bộ mỗi ngày.</span>
                </h1>
                <p>
                  Dữ liệu của một học viên trên trình duyệt này; chưa có quản lý
                  lớp hay tài khoản trực tuyến.
                </p>
              </div>
              <button className="outline-button" onClick={exportProgress}>
                <Icon name="download" size={17} />
                Xuất tiến độ JSON
              </button>
            </div>
            <div className="teacher-stats">
              <article className="panel">
                <span>Học viên trên thiết bị</span>
                <strong>{progress.name || "Chưa bắt đầu"}</strong>
              </article>
              <article className="panel">
                <span>Nhiệm vụ đã hoàn thành</span>
                <strong>
                  {progress.completed.length}
                  <small> / 6</small>
                </strong>
              </article>
              <article className="panel">
                <span>Lượt luyện tiếng Anh đã lưu</span>
                <strong>
                  {progress.messages.filter((m) => m.role === "student").length}
                </strong>
              </article>
              <article className="panel">
                <span>Điểm kinh nghiệm</span>
                <strong>
                  {xp}
                  <small> XP</small>
                </strong>
              </article>
            </div>
            <div className="teacher-grid">
              <section className="panel teacher-settings">
                <h2>Thiết lập buổi luyện</h2>
                <p>Chọn mức hỗ trợ phù hợp với học viên.</p>
                <label
                  className={`mode-option ${progress.mode === "guided" ? "mode-selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="mode"
                    checked={progress.mode === "guided"}
                    onChange={() =>
                      saveProgress({ ...progress, mode: "guided" })
                    }
                  />
                  <span>
                    <strong>Làm quen</strong>
                    <small>Bấm ! để xem và điền câu gợi ý khi trò chuyện.</small>
                  </span>
                </label>
                <label
                  className={`mode-option ${progress.mode === "independent" ? "mode-selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="mode"
                    checked={progress.mode === "independent"}
                    onChange={() =>
                      saveProgress({ ...progress, mode: "independent" })
                    }
                  />
                  <span>
                    <strong>Tự chủ</strong>
                    <small>Học viên chủ động nói, bấm xin gợi ý khi cần.</small>
                  </span>
                </label>
                <div className="teacher-note">
                  <Icon name="info" size={20} />
                  <p>
                    Nhân vật dùng kịch bản và quy tắc nhận câu mẫu. Kết quả này
                    phản ánh tiến độ bản mẫu, chưa phải đánh giá năng lực nói
                    hay phát âm.
                  </p>
                </div>
                <button
                  className="text-danger"
                  onClick={() => setRetryReset(true)}
                >
                  <Icon name="reset" size={16} />
                  Bắt đầu hành trình mới
                </button>
              </section>
              <section className="panel transcript-panel">
                <div className="section-top">
                  <h2>Nhật ký hội thoại</h2>
                  <span className="subtle-count">Tối đa 80 tin nhắn</span>
                </div>
                {progress.messages.length ? (
                  <div className="teacher-transcript">
                    {progress.messages.map((m, index) => (
                      <div key={index}>
                        <span
                          className={
                            m.role === "student" ? "student-label" : "npc-label"
                          }
                        >
                          {m.role === "student"
                            ? progress.name
                            : PLACES[m.place].npc}
                          <small>{PLACES[m.place].name}</small>
                        </span>
                        <p>{m.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-transcript">
                    <Icon name="book" size={40} />
                    <h3>Hành trình sắp bắt đầu</h3>
                    <p>
                      Các câu đã gửi sẽ xuất hiện tại đây. Bản mẫu chưa thu âm
                      hoặc lưu tệp âm thanh.
                    </p>
                    <button
                      className="primary-button"
                      onClick={() => setTab("explore")}
                    >
                      Vào khuôn viên
                      <Icon name="arrow" size={17} />
                    </button>
                  </div>
                )}
              </section>
            </div>
          </section>
        )}

        <footer className="app-footer">
          <span>
            <span
              className={`save-dot ${!saveAvailable ? "save-error" : ""}`}
            />
            {saveAvailable
              ? "Tiến độ lưu trên trình duyệt này"
              : "Không lưu được · Tiến độ chỉ giữ trong phiên này"}
          </span>
          <span>
            CampusQuest AI <i /> Tri thức · Kỷ luật · Bản lĩnh
          </span>
          <button onClick={() => setHelp(true)}>
            Về bản mẫu
            <Icon name="info" size={14} />
          </button>
        </footer>
      </main>

      {ready && !progress.name && (
        <div className="modal-backdrop">
          <section
            className="welcome-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-title"
          >
            <div className="welcome-photo">
              <Image
                src="/art/campus-keyart.png"
                alt="Tranh ý tưởng CampusQuest lấy cảm hứng từ Phân hiệu 1"
                fill
                sizes="(max-width: 600px) 90vw, 580px"
                priority
              />
              <span
                className="welcome-walker sprite-preview"
                aria-hidden="true"
              />
              <div className="welcome-art-title">
                <small>CHÀO MỪNG ĐẾN PHÂN HIỆU 1</small>
                <strong>
                  Học điều mới.
                  <br />
                  Khám phá điều hay.
                </strong>
                <p>Một hành trình tiếng Anh dưới mái trường Thiếu sinh quân.</p>
              </div>
              <div className="photo-caption">
                <Image
                  src="/images/school-logo.jpg"
                  alt=""
                  width={50}
                  height={50}
                />
                <span>
                  PHÂN HIỆU 1<small>Trường Thiếu sinh quân miền Trung</small>
                </span>
              </div>
            </div>
            <form onSubmit={start} className="welcome-content">
              <p className="eyebrow">CHÀO MỪNG HỌC VIÊN MỚI</p>
              <h2 id="welcome-title">
                Một mái trường.
                <br />
                <span>Vạn điều để khám phá.</span>
              </h2>
              <p>
                Gặp bạn mới, khám phá trường và rèn tiếng Anh qua từng nhiệm vụ
                nhỏ.
              </p>
              <label htmlFor="player-name">Em muốn được gọi là gì?</label>
              <input
                id="player-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                placeholder="Nhập tên hoặc biệt danh của em"
                required
                autoComplete="off"
              />
              <fieldset className="avatar-options">
                <legend>Chọn nhân vật đồng hành cùng em</legend>
                {[0, 1].map((v) => (
                  <label
                    key={v}
                    className={avatar === v ? "avatar-selected" : ""}
                  >
                    <input
                      type="radio"
                      name="avatar"
                      checked={avatar === v}
                      onChange={() => setAvatar(v)}
                    />
                    <Cadet variant={v} />
                    <span>{v === 0 ? "Học viên An" : "Học viên Linh"}</span>
                    {avatar === v && (
                      <span className="avatar-check">
                        <Icon name="check" size={12} />
                      </span>
                    )}
                  </label>
                ))}
              </fieldset>
              <button
                type="submit"
                className="primary-button full-width"
                disabled={!name.trim()}
              >
                Bắt đầu hành trình
                <Icon name="arrow" size={18} />
              </button>
              <small className="welcome-disclaimer">
                Bản đồ mô phỏng · Nhân vật hư cấu · Hội thoại mẫu
              </small>
            </form>
          </section>
        </div>
      )}

      {reward !== null && (
        <div className="modal-backdrop">
          <section
            className="reward-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reward-title"
          >
            <div className="reward-sparkles" aria-hidden="true">
              ✦<span>✧</span>✦
            </div>
            <div className="reward-confetti" aria-hidden="true">
              {Array.from({ length: 28 }, (_, i) => (
                <span
                  key={i}
                  style={{
                    left: `${i * 3.7}%`,
                    animationDelay: `${(i % 7) * 0.12}s`,
                    background: i % 2 ? "#f2d17e" : "#77935f",
                  }}
                />
              ))}
            </div>
            <div className="reward-trophy">
              <span className="item-art item-trophy" />
            </div>
            <p className="eyebrow">THÊM MỘT BƯỚC TIẾN BỘ</p>
            <h2 id="reward-title">
              {reward === 5 ? "Chào Đại sứ học đường!" : "Em làm tốt lắm!"}
            </h2>
            <p>Đã hoàn thành “{QUESTS[reward].title}”.</p>
            <div className="earned-badge">
              <Icon name="star" size={20} />
              <strong>+{QUESTS[reward].xp} XP</strong>
              <span>{QUESTS[reward].badge}</span>
            </div>
            <div className="learning-feedback">
              <h3>Ghi nhớ cho lần luyện tiếp theo</h3>
              <p>
                Thêm “please” khi đề nghị và nhắc lại thông tin để xác nhận.
              </p>
              <p>
                Thử tự nói lại câu mục tiêu khi không nhìn gợi ý. Giáo viên sẽ
                giúp em nhận xét phát âm.
              </p>
            </div>
            <button
              className="primary-button full-width"
              autoFocus
              onClick={() => {
                setReward(null);
                if (reward === 5) setTab("journey");
              }}
            >
              Tiếp tục hành trình
              <Icon name="arrow" size={18} />
            </button>
          </section>
        </div>
      )}

      {help && (
        <div className="modal-backdrop">
          <section
            className="help-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
          >
            <button
              className="modal-close icon-button"
              autoFocus
              onClick={() => setHelp(false)}
              aria-label="Đóng hướng dẫn"
            >
              <Icon name="close" />
            </button>
            <span className="help-emblem">
              <Icon name="compass" size={35} />
            </span>
            <h2 id="help-title">Cùng khám phá CampusQuest</h2>
            <ol>
              <li>
                <strong>Nhận nhiệm vụ</strong>
                <span>
                  Xem mục tiêu ở cột trái. Làm theo thứ tự để mở nhiệm vụ mới.
                </span>
              </li>
              <li>
                <strong>Khám phá khuôn viên</strong>
                <span>
                  Dùng WASD, phím mũi tên, giữ Shift để chạy, bấm sân hoặc chọn
                  một địa điểm trên bản đồ toàn trường để di chuyển.
                </span>
              </li>
              <li>
                <strong>Trò chuyện bằng tiếng Anh</strong>
                <span>
                  Đến gần nhân vật, bấm Trò chuyện hoặc E. Nhập câu hoặc dùng
                  micro, kiểm tra văn bản rồi gửi.
                </span>
              </li>
              <li>
                <strong>Nhận thưởng và tiếp tục</strong>
                <span>Hoàn thành mọi mục tiêu, nhận XP và huy hiệu.</span>
              </li>
            </ol>
            <div className="teacher-note">
              <Icon name="info" size={22} />
              <p>
                Đây là bản mẫu theo kịch bản, chưa kết nối AI tạo sinh. Micro và
                giọng đọc tùy trình duyệt; nhận giọng nói có thể sử dụng dịch vụ
                của trình duyệt. Tiến độ lưu trên máy này. Chưa có chấm phát âm,
                thu âm hay báo cáo cả lớp.
              </p>
            </div>
            <a
              className="school-source"
              href="https://103.72.97.24/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Logo và ảnh tham chiếu: Website Phân hiệu 1 ↗
            </a>
            <button
              className="primary-button full-width"
              onClick={() => setHelp(false)}
            >
              Sẵn sàng khám phá
              <Icon name="arrow" size={17} />
            </button>
          </section>
        </div>
      )}

      {reviewOpen && <div className="modal-backdrop"><section className="learning-review" role="dialog" aria-modal="true" aria-labelledby="review-title" lang="en"><button className="modal-close icon-button" aria-label="Close review" onClick={()=>setReviewOpen(false)}><Icon name="close" /></button><span className="review-book"><Icon name="book" size={28}/></span><h2 id="review-title">Before your next adventure</h2><p>{lesson.question}</p><div className="review-choices">{lesson.choices.map((choice,i)=><button key={choice} aria-pressed={reviewChoice===i} onClick={()=>setReviewChoice(i)} className={reviewChoice===i ? i===lesson.answer ? "review-correct":"review-retry":""}>{choice}</button>)}</div>{reviewChoice!==null && <p className="review-explanation" role="status">{reviewChoice===lesson.answer ? `That’s right. ${lesson.tip}` : "Not quite. Think about the details you heard in the conversation, then try again."}</p>}<div className="review-takeaway"><strong>Keep this phrase</strong><p>{lesson.pattern}</p></div><button className="primary-button full-width" disabled={reviewChoice!==lesson.answer} onClick={completeMission}>Collect {quest.xp} XP & continue <Icon name="arrow" size={18}/></button></section></div>}

      {atlasOpen && (
        <div className="modal-backdrop atlas-backdrop">
          <section
            className="campus-atlas"
            role="dialog"
            aria-modal="true"
            aria-labelledby="atlas-title"
          >
            <button
              className="modal-close icon-button"
              autoFocus
              onClick={() => setAtlasOpen(false)}
              aria-label="Đóng bản đồ toàn trường"
            >
              <Icon name="close" />
            </button>
            <div className="atlas-heading">
              <p className="eyebrow">CAMPUSQUEST · WORLD MAP</p>
              <h2 id="atlas-title">Một ngôi trường. Muôn hành trình.</h2>
              <p>Chọn điểm đến để bắt đầu khám phá.</p>
            </div>
            <div className="atlas-content">
              <CampusMap large objective={goal?.place} near={near} onPlace={goTo} onZone={goToZone} />
              <nav
                className="atlas-destinations"
                aria-label="Các khu vực trong trường"
              >
                <p>KHÁM PHÁ KHUÔN VIÊN</p>
                {EXPLORATION_ZONES.map((zone) => (
                  <button key={zone.id} onClick={() => goToZone(zone.id)}>
                    {ZONE_ART[zone.id] !== undefined ? (
                      <i
                        className="destination-art"
                        aria-hidden="true"
                        style={{
                          backgroundPosition: `${(ZONE_ART[zone.id]! % 3) * 50}% ${Math.floor(ZONE_ART[zone.id]! / 3) * 100}%`,
                        }}
                      />
                    ) : (
                      <Icon name={zone.icon} size={19} />
                    )}
                    <span>
                      {zone.name}
                      <small>{zone.english}</small>
                    </span>
                    <Icon name="arrow" size={15} />
                  </button>
                ))}
                <small className="atlas-caption">
                  Bản đồ mô phỏng sáng tạo, không phải sơ đồ thực địa của
                  trường.
                </small>
              </nav>
            </div>
            <div className="atlas-footer">
              <span>
                <i /> Vị trí của em
              </span>
              <span>
                WASD · Di chuyển &nbsp; Shift · Chạy &nbsp; E · Trò chuyện
              </span>
              <button
                onClick={() => {
                  setAtlasOpen(false);
                  worldRef.current?.overview();
                }}
              >
                Xem toàn cảnh 3D <Icon name="compass" size={16} />
              </button>
            </div>
          </section>
        </div>
      )}

      {artGallery && (
        <div className="modal-backdrop gallery-backdrop">
          <section
            className="art-gallery"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gallery-title"
          >
            <button
              className="modal-close icon-button"
              autoFocus
              onClick={() => setArtGallery(false)}
              aria-label="Đóng bộ sưu tập"
            >
              <Icon name="close" />
            </button>
            <p className="eyebrow">THE ART OF CAMPUSQUEST</p>
            <h2 id="gallery-title">Một thế giới, nhiều câu chuyện.</h2>
            <p>
              Hình ảnh được tạo riêng cho hành trình tại Phân hiệu 1. Chọn một
              hình để tải bản chi tiết.
            </p>
            <div className="art-gallery-grid">
              {[
                {
                  key: "campus-world-map",
                  title: "Toàn cảnh ngôi trường",
                  type: "Tranh bản đồ khám phá",
                },
                {
                  key: "campus-rooms-atlas",
                  title: "Những góc trường thân quen",
                  type: "Sáu tranh ý tưởng nội thất",
                },
                {
                  key: "campus-keyart",
                  title: "Một ngày mới ở Phân hiệu 1",
                  type: "Tranh ý tưởng khuôn viên",
                },
                {
                  key: "highlands-horizon",
                  title: "Bình minh miền cao nguyên",
                  type: "Phông cảnh",
                },
                {
                  key: "minh-portrait",
                  title: "Minh · Bạn học hướng dẫn",
                  type: "Chân dung nhân vật",
                },
                {
                  key: "linh-portrait",
                  title: "Linh · Học viên mới",
                  type: "Chân dung nhân vật",
                },
                {
                  key: "lan-portrait",
                  title: "Cô Lan · Thư viện",
                  type: "Chân dung nhân vật",
                },
                {
                  key: "hung-portrait",
                  title: "Chú Hùng · Căng tin",
                  type: "Chân dung nhân vật",
                },
                {
                  key: "cadet-walk",
                  title: "An · Chu kỳ đi bộ 8 khung",
                  type: "Hoạt ảnh nhân vật",
                },
                {
                  key: "linh-walk",
                  title: "Linh · Chu kỳ đi bộ 8 khung",
                  type: "Hoạt ảnh nhân vật",
                },
                {
                  key: "reward-atlas",
                  title: "Hành trang khám phá",
                  type: "Sáu vật phẩm và phần thưởng",
                },
                {
                  key: "courtyard-paving",
                  title: "Những bước chân đầu tiên",
                  type: "Chất liệu sân trường",
                },
              ].map((art) => (
                <a
                  key={art.key}
                  href={`/art/${art.key}.png`}
                  download
                  className={`gallery-card gallery-${art.key}`}
                >
                  <div>
                    {art.key.endsWith("walk") ? (
                      <span
                        role="img"
                        aria-label={art.title}
                        className={`sprite-preview ${art.key === "linh-walk" ? "sprite-linh" : ""}`}
                      />
                    ) : (
                      <Image
                        src={`/art/${art.key}.png`}
                        alt={art.title}
                        width={560}
                        height={350}
                      />
                    )}
                  </div>
                  <span>{art.type}</span>
                  <strong>
                    {art.title}
                    <Icon name="download" size={16} />
                  </strong>
                </a>
              ))}
            </div>
            <small>
              Nhân vật và bố trí khuôn viên trong game là mô phỏng sáng tạo.
            </small>
          </section>
        </div>
      )}

      {retryReset && (
        <div className="modal-backdrop">
          <section
            className="reset-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-title"
          >
            <h2 id="reset-title">Bắt đầu hành trình mới?</h2>
            <p>
              Tên, huy hiệu và nhật ký hội thoại đang lưu trên trình duyệt này
              sẽ được đặt lại. Em có thể xuất tiến độ trước khi bắt đầu lại.
            </p>
            <div className="reset-actions">
              <button
                className="outline-button"
                autoFocus
                onClick={() => setRetryReset(false)}
              >
                Giữ hành trình
              </button>
              <button className="primary-button" onClick={reset}>
                Bắt đầu lại
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
