"use client";

import Image from "next/image";
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
import { CampusPhotoMode } from "./campus-photo-mode";
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
type Tab = "explore" | "journey" | "teacher" | "menu";

function Cadet({
  variant = 0,
  small = false,
}: {
  variant?: number;
  small?: boolean;
}) {
  return (
    <span
      className={`cadet-portrait avatar-${variant}${small ? " avatar-small" : ""}`}
      aria-hidden="true"
    />
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
  const [autoVoiceMuted, setAutoVoiceMuted] = useState(false);
  const [speaking, setSpeaking] = useState<Place | null>(null);
  const [reward, setReward] = useState<number | null>(null);
  const [retryReset, setRetryReset] = useState(false);
  const [ready, setReady] = useState(false);
  const [mapVisible, setMapVisible] = useState(true);
  const [artGallery, setArtGallery] = useState(false);
  const [highQuality, setHighQuality] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [atlasOpen, setAtlasOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [areaName, setAreaName] = useState("Khu trung tâm");
  const worldRef = useRef<WorldHandle>(null);
  const photoTrigger = useRef<HTMLButtonElement>(null);
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
      behavior: "instant",
    });
  }, [progress.messages.length, talking, showHistory]);
  useEffect(() => {
    const sync = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const closePhoto = useCallback(() => {
    worldRef.current?.endPhoto();
    setPhotoOpen(false);
    requestAnimationFrame(() => photoTrigger.current?.focus());
  }, []);
  const openPhoto = () => {
    if (worldRef.current?.beginPhoto()) {
      setNotice("");
      setPhotoOpen(true);
    } else {
      setNotice("Máy ảnh cần cảnh 3D. Chờ cảnh tải xong rồi thử lại.");
    }
  };
  const modalOpen =
    tab !== "explore" ||
    (ready && !progress.name) ||
    help ||
    reward !== null ||
    retryReset ||
    artGallery ||
    atlasOpen || reviewOpen || photoOpen;
  useEffect(() => {
    if (!notice || talking || modalOpen) return;
    const timer = window.setTimeout(() => setNotice(""), 4200);
    return () => window.clearTimeout(timer);
  }, [notice, talking, modalOpen]);

  useEffect(() => {
    if (!modalOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const getDialog = () => {
      const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"]');
      return dialogs[dialogs.length - 1];
    };
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const getFocusable = () => {
      const dialog = getDialog();
      return dialog
        ? Array.from(
            dialog.querySelectorAll<HTMLElement>(
              'button:not(:disabled),a[href],input:not(:disabled),summary,[tabindex="0"]',
            ),
          ).filter((item) => !item.closest("[inert]") && item.getClientRects().length > 0)
        : [];
    };
    const frame = requestAnimationFrame(() => {
      const focusable = getFocusable();
      if (!focusable.some((item) => item === document.activeElement))
        focusable[0]?.focus();
    });
    const trap = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (photoOpen) closePhoto();
        else if (reviewOpen) setReviewOpen(false);
        else if (atlasOpen) setAtlasOpen(false);
        else if (artGallery) setArtGallery(false);
        else if (help) setHelp(false);
        else if (retryReset) setRetryReset(false);
        else if (reward !== null) setReward(null);
        else if (tab !== "explore") setTab("explore");
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
  }, [modalOpen, tab, help, retryReset, reward, artGallery, atlasOpen, reviewOpen, photoOpen, closePhoto]);

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

  const speak = useCallback((text: string, place: Place, automatic = false) => {
    if (automatic && autoVoiceMuted) return;
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
  }, [autoVoiceMuted]);

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
    setTab("explore");
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
      "Đến gặp Minh để bắt đầu nhiệm vụ đầu tiên.",
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
    speak(result.reply, talking, true);
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
    setMapVisible(true);
  };

  const conversationMessages = progress.messages.slice(conversationStart).filter((m) => m.place === talking);
  useEffect(() => {
    if (!talking) { autoSpokenPlace.current=null; return; }
    if (autoSpokenPlace.current === talking) return;
    autoSpokenPlace.current=talking;
    speak(conversationPrompt(progress, talking), talking, true);
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
    if (!talking || modalOpen) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setTalking(null);
        recognitionRef.current?.abort();
        setListening(false);
        stopSpeech();
        requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(".interact-button")?.focus());
      }
    };
    document.addEventListener("keydown", escape);
    const frame = requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(".encounter-exit")?.focus());
    return () => { document.removeEventListener("keydown", escape); cancelAnimationFrame(frame); };
  }, [talking, modalOpen, stopSpeech]);

  const questTitle = quest.title.split(" · ")[1] || quest.title;

  return (
    <div className={`campus-shell${talking ? " conversation-open" : ""}`}>
      <main className="campus-stage" aria-label="Khám phá khuôn viên">
        <div className="scene-layer" inert={(modalOpen && !photoOpen) || !!talking}>
          <World
            ref={worldRef}
            avatar={progress.avatar}
            objective={goal?.place}
            conversation={talking}
            speaking={speaking}
            highQuality={highQuality}
            photoMode={photoOpen}
            enabled={!!progress.name && !modalOpen && !talking}
            onNear={setNear}
            onInteract={openConversation}
            onMove={updateMapPlayer}
            onAreaChange={setAreaName}
          />
        </div>
        {progress.name && !talking && !photoOpen && (
          <div className={`campus-hud${mapVisible ? " hud-has-map" : ""}`} inert={modalOpen}>
            <div className="hud-left">
              <button className="player-badge" onClick={() => navigate("journey")} aria-label="Mở nhật ký và xem tiến độ">
                <Cadet variant={progress.avatar} small />
                <span className="player-identity">
                  <strong>{progress.name}</strong>
                  <small>Cấp {Math.floor(xp / 150) + 1} <span>·</span> {xp} XP</small>
                </span>
                <span className="player-journal" aria-hidden="true"><Icon name="book" size={16} /></span>
              </button>
              <section className="quest-tracker" aria-label="Nhiệm vụ hiện tại">
                <button className="quest-heading" onClick={() => navigate("journey")}>
                  <Icon name={allDone ? "trophy" : "book"} size={18} />
                  <strong lang={allDone ? "vi" : "en"}>{allDone ? "Đại sứ học đường" : questTitle}</strong>
                  <span aria-label={`Nhiệm vụ ${allDone ? QUESTS.length : progress.active + 1} trên ${QUESTS.length}`}>
                    {allDone ? QUESTS.length : progress.active + 1}/{QUESTS.length}
                  </span>
                </button>
                {!allDone && (
                  <div className="quest-progress" aria-label={`${progress.goals.length} trên ${quest.goals.length} mục tiêu hoàn thành`}>
                    <span className="quest-progress-track" aria-hidden="true">
                      {quest.goals.map((step) => (
                        <i key={step.id} data-complete={progress.goals.includes(step.id)} data-current={goal?.id === step.id} />
                      ))}
                    </span>
                    <small aria-hidden="true">{progress.goals.length}/{quest.goals.length} mục tiêu</small>
                  </div>
                )}
                {goal ? (
                  <button className="quest-waypoint" onClick={() => goTo(goal.place)}>
                    <span className="quest-pin" aria-hidden="true" />
                    <span className="waypoint-copy">
                      <strong lang="en">{goal.label}</strong>
                      <small>{PLACES[goal.place].npc} · {PLACES[goal.place].name}</small>
                    </span>
                    <Icon name="arrow" size={17} />
                  </button>
                ) : !allDone && (
                  <button className="quest-waypoint" onClick={claim}>
                    <span>Ôn nhanh và nhận XP</span><Icon name="arrow" size={18} />
                  </button>
                )}
              </section>
            </div>

            <div className="hud-right">
              <div className="hud-actions" aria-label="Công cụ khuôn viên">
                <button className="hud-button photo-launch" ref={photoTrigger} onClick={openPhoto} aria-label="Mở máy ảnh" title="Máy ảnh"><Icon name="camera" size={20} /></button>
                <button className="hud-button" onClick={() => setAtlasOpen(true)} aria-label="Mở bản đồ toàn trường" title="Bản đồ toàn trường"><Icon name="map" size={20} /></button>
                <button className="hud-button" onClick={() => navigate("menu")} aria-label="Mở menu" title="Menu"><Icon name="menu" size={20} /></button>
              </div>
              {mapVisible && (
                <div className="hud-minimap">
                  <CampusMap objective={goal?.place} near={near} onPlace={goTo} onZone={goToZone} />
                  <span className="minimap-north" aria-hidden="true">N</span>
                  <p className="minimap-area"><Icon name="target" size={14} />{areaName}</p>
                </div>
              )}
            </div>

            <div className="hud-area">
              <Icon name="target" size={16} />
              <span className="hud-area-name">{areaName}</span>
              <small className="desktop-controls"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Di chuyển</small>
            </div>
            {near && (
              <button className="interact-button" onClick={openConversation}>
                <kbd>E</kbd><Icon name="chat" size={19} /> Trò chuyện với {PLACES[near].npc}
              </button>
            )}
            <div className="camera-tools" aria-label="Camera">
              <button className="hud-button" onClick={() => worldRef.current?.zoom(0.15)} aria-label="Phóng to cảnh" title="Phóng to"><Icon name="plus" size={18} /></button>
              <button className="hud-button" onClick={() => worldRef.current?.zoom(-0.15)} aria-label="Thu nhỏ cảnh" title="Thu nhỏ"><Icon name="minus" size={18} /></button>
              <button className="hud-button" onClick={() => worldRef.current?.recenter()} aria-label="Đặt lại camera" title="Đặt lại camera"><Icon name="target" size={18} /></button>
            </div>
            <p className="travel-notice" role="status">{notice}</p>
          </div>
        )}
                {talking && (
                  <section className="encounter" lang="en" aria-label={`Talk to ${dialogueName}`} data-speaking={speaking === talking} inert={modalOpen}>
                    <NpcPortrait key={talking} place={talking} speaking={speaking === talking} turn={conversationMessages.length} mood={turnFeedback === "success" ? "encouraging" : turnFeedback === "retry" ? "thoughtful":"welcoming"} />
                    <div className="encounter-topline">
                      <span><Icon name="target" size={16} /> {person.english}</span>
                      <button className="encounter-exit" onClick={closeConversation}>
                        Back to campus <Icon name="close" size={18} />
                      </button>
                    </div>
                    <div className="encounter-caption">
                      <div className="learning-objective"><span>{lesson.level}</span><strong>{encounterGoal?.label || (goal ? `Next: ${goal.label}` : "Mission complete")}</strong><span>{progress.goals.length}/{quest.goals.length}</span></div>
                      <div className="encounter-speaker">
                        <div><strong>{dialogueName}</strong><span>{dialogueRole}</span></div>{speaking === talking && <span className="encounter-turn">Speaking</span>}
                        <button
                          onClick={() => {
                            setAutoVoiceMuted((muted) => !muted);
                            stopSpeech();
                          }}
                          className="icon-button auto-voice"
                          aria-label="Auto voice"
                          aria-pressed={!autoVoiceMuted}
                          title={autoVoiceMuted ? "Automatic voice off" : "Automatic voice on"}
                        >
                          <Icon name={autoVoiceMuted ? "mute" : "sound"} size={18} />
                          <span>Auto voice {autoVoiceMuted ? "off" : "on"}</span>
                        </button>
                      </div>
                      <div className="encounter-line" aria-live="polite" aria-atomic="true">
                        <p>{conversationMessages.findLast((m) => m.role === "npc")?.text || conversationPrompt(progress,talking)}</p>
                        <button className="replay-button" onClick={() => speak(conversationMessages.findLast((m) => m.role === "npc")?.text || conversationPrompt(progress,talking), talking)} aria-label="Replay reply"><Icon name="sound" size={20} /></button>
                      </div>
                      {conversationMessages.at(-2)?.role === "student" && <p className="encounter-your-line">You: {conversationMessages.at(-2)?.text}</p>}
                      {turnFeedback && <div className={`learning-feedback learning-${turnFeedback}`} role="status"><strong>{turnFeedback === "success" ? "Message understood" : "Keep practising"}</strong><span>{turnFeedback === "success" ? "You completed a real communication goal. Listen for your next step." : lesson.tip}</span></div>}
                      {encounterGoal && <div className="learning-support"><button aria-expanded={practiceFirst} onClick={()=>{setPracticeFirst(!practiceFirst);setHint(false);}}>Listen to a model</button></div>}
                      {practiceFirst && encounterGoal && <div className="model-practice"><p>{encounterGoal.hint}</p><button onClick={()=>speak(encounterGoal.hint,talking)}>Play model</button><small>Try saying it yourself. Then choose Speak or Type to answer.</small></div>}
                      {near !== talking && <p className="inline-notice">Move closer to continue this conversation.</p>}
                      {hint && encounterGoal && <div className="encounter-hint" id="encounter-hint"><Icon name="bulb" size={20} /><div><small>Try saying</small><p>{encounterGoal.hint}</p></div><button onClick={() => { setResponseMode("text"); setDraft(encounterGoal.hint); requestAnimationFrame(() => draftRef.current?.focus()); }} title="Fill in the suggested reply">Use this <Icon name="arrow" size={16} /></button></div>}
                      {responseMode && encounterGoal && !finished && <form className="encounter-form" onSubmit={send}>
                        {listening && <span className="voice-wave" aria-hidden="true"><i /><i /><i /><i /><i /></span>}
                        <input ref={draftRef} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={listening ? "Listening…" : responseMode === "voice" ? "Review your words, then send…" : "Type your reply…"} aria-label="Your English reply" maxLength={600} disabled={near !== talking || listening} />
                        <button type="submit" disabled={!draft.trim() || near !== talking || listening} aria-label="Send reply"><Icon name="send" size={20} /><span>Send</span></button>
                      </form>}
                      {finished && !allDone ? <button className="encounter-claim" onClick={claim}><Icon name="trophy" size={22} /> Mission complete · Quick review <Icon name="arrow" size={20} /></button> : !allDone && encounterGoal && <div className="encounter-options" aria-label="Reply options">
                        <button onClick={() => setHint(!hint)} aria-expanded={hint} aria-controls="encounter-hint" className={hint ? "option-active" : ""} disabled={!encounterGoal} title={!encounterGoal ? "Hints are available at your current quest character" : "Show hint"}><Icon name="bulb" size={19} /><span>Hint</span></button>
                        <button onClick={() => { setResponseMode("voice"); microphone(); }} aria-pressed={listening} className={listening ? "option-listening" : responseMode === "voice" ? "option-active" : ""} disabled={near !== talking}><Icon name="mic" size={23} /><span>{listening ? "Stop mic" : "Speak"}</span></button>
                        <button onClick={() => { recognitionRef.current?.abort(); setListening(false); setResponseMode("text"); requestAnimationFrame(() => draftRef.current?.focus()); }} className={responseMode === "text" ? "option-active" : ""} disabled={near !== talking}><Icon name="chat" size={23} /><span>Type</span></button>
                      </div>}
                      {goal && goal.place !== talking && <button className="learning-next-stop" onClick={()=>goTo(goal.place)}>Next: {PLACES[goal.place].english} <Icon name="arrow" size={18}/></button>}
                      <div className="encounter-footer"><span role="status">{notice || (allDone ? "Journey complete. Keep exploring the campus." : "")}</span><button onClick={() => setShowHistory(!showHistory)} aria-expanded={showHistory}>{showHistory ? "Hide history" : "History"}<Icon name="clock" size={14} /></button></div>
                      {showHistory && <div className="encounter-history" role="log" aria-label="Conversation history" ref={messagesRef}><p><strong>{dialogueName}</strong>{person.greeting}</p>{conversationMessages.map((m, i) => <p key={i}><strong>{m.role === "npc" ? dialogueName : "You"}</strong>{m.text}</p>)}</div>}
                    </div>
                  </section>
                )}
      </main>

      {photoOpen && (
        <CampusPhotoMode
          area={areaName}
          onClose={closePhoto}
          onLight={(light) => worldRef.current?.lightPhoto(light)}
          onFrame={(wholeCampus) => worldRef.current?.framePhoto(wholeCampus)}
          onAdjust={(adjustment) => worldRef.current?.adjustPhoto(adjustment)}
          onCapture={(format) => worldRef.current?.capturePhoto(format) ?? Promise.resolve(null)}
        />
      )}

      {tab === "menu" && (
        <div className="modal-backdrop">
          <section className="pause-menu" role="dialog" aria-modal="true" aria-labelledby="menu-title">
            <button className="modal-close icon-button" onClick={() => navigate("explore")} aria-label="Đóng menu"><Icon name="close" /></button>
            <h2 id="menu-title">Tạm dừng</h2>
            <button className="primary-button full-width" onClick={() => navigate("explore")}>Tiếp tục chơi <Icon name="arrow" size={18} /></button>
            <div className="pause-list">
              <button onClick={() => navigate("journey")}><Icon name="book" /> Nhật ký nhiệm vụ</button>
              <button onClick={() => navigate("teacher")}><Icon name="school" /> Góc giáo viên</button>
              <button onClick={() => { setTab("explore"); setHelp(true); }}><Icon name="info" /> Hướng dẫn chơi</button>
              <button onClick={() => { setTab("explore"); setArtGallery(true); }}><Icon name="image" /> Bộ sưu tập hình ảnh</button>
              <button onClick={() => { navigate("explore"); worldRef.current?.overview(); }}><Icon name="compass" /> Xem toàn cảnh 3D</button>
              <button className="minimap-setting" onClick={() => setMapVisible(!mapVisible)} aria-pressed={mapVisible}><Icon name="map" /> Bản đồ nhỏ <span>{mapVisible ? "Bật" : "Tắt"}</span></button>
              <button onClick={() => setHighQuality((quality) => !quality)}><Icon name="leaf" /> Đồ họa <span>{highQuality ? "Chi tiết" : "Nhẹ"}</span></button>
              <button onClick={toggleFullscreen}><Icon name="fullscreen" /> {fullscreen ? "Thoát toàn màn hình" : "Bật toàn màn hình"}</button>
            </div>
            <p className="save-status" role="status">{notice || (saveAvailable ? "Tiến độ được lưu trên trình duyệt này." : "Không lưu được tiến độ sau khi đóng trang.")}</p>
          </section>
        </div>
      )}

      {tab === "journey" && (
        <div className="modal-backdrop">
          <section className="quest-journal" role="dialog" aria-modal="true" aria-labelledby="journal-title">
            <button className="modal-close icon-button" onClick={() => navigate("explore")} aria-label="Đóng nhật ký"><Icon name="close" /></button>
            <header className="journal-heading">
              <h2 id="journal-title">Nhật ký nhiệm vụ</h2>
              <span>{progress.completed.length}/{QUESTS.length} hoàn thành <b><Icon name="star" size={14} />{xp} XP</b></span>
            </header>
            <div className="journal-layout">
              <div className="journal-brief">
                <h3 lang="en">{allDone ? "English Discovery Day" : questTitle}</h3>
                <p lang="en">{allDone ? "All missions complete." : quest.description}</p>
                {!allDone && <>
                  <ol className="journal-goals" lang="en">
                    {quest.goals.map((objective) => {
                      const done = progress.goals.includes(objective.id);
                      return <li key={objective.id} className={done ? "is-complete" : ""} aria-current={goal?.id === objective.id ? "step" : undefined}>
                        <Icon name={done ? "check" : "target"} size={17} /> {objective.label}
                      </li>;
                    })}
                  </ol>
                  <details className="journal-words">
                    <summary>Câu mẫu và từ vựng</summary>
                    <strong lang="en">{lesson.skill}</strong>
                    <p lang="en">{lesson.pattern}</p>
                    <ul>{lesson.words.map((word) => <li key={word}>{word}</li>)}</ul>
                  </details>
                  <button className="primary-button full-width" onClick={() => {
                    if (goal) goTo(goal.place);
                    else { setTab("explore"); claim(); }
                  }}>
                    {goal ? `Đến ${PLACES[goal.place].name.toLowerCase()}` : "Ôn nhanh và nhận XP"}
                    <Icon name="arrow" size={18} />
                  </button>
                </>}
              </div>
              <div className="journal-record">
                <ol className="journal-missions">
                  {QUESTS.map((mission, index) => {
                    const done = progress.completed.includes(index);
                    return <li key={mission.title} aria-current={!allDone && index === progress.active ? "step" : undefined}>
                      <Icon name={done ? "check" : index === progress.active ? "compass" : "lock"} size={18} />
                      <span>
                        <strong lang="en">{mission.title.replace(/^\d+ · /, "")}</strong>
                        <small>{done ? mission.badge : index === progress.active ? "Đang thực hiện" : mission.minutes}</small>
                      </span>
                      <span>+{mission.xp} XP</span>
                    </li>;
                  })}
                </ol>
                <section className="journal-inventory" aria-label="Hành trang">
                  <h3>Hành trang</h3>
                  <ul>
                    <li><span className="inventory-art" /> Ba lô</li>
                    <li className={progress.completed.includes(2) ? "" : "item-locked"}><span className="inventory-art" aria-hidden="true">{!progress.completed.includes(2) && <Icon name="lock" size={21} />}</span> Sách{!progress.completed.includes(2) && <small>Chưa mở</small>}</li>
                    <li className={progress.completed.includes(4) ? "" : "item-locked"}><span className="inventory-art" aria-hidden="true">{!progress.completed.includes(4) && <Icon name="lock" size={21} />}</span> Đồ ăn{!progress.completed.includes(4) && <small>Chưa mở</small>}</li>
                  </ul>
                </section>
              </div>
            </div>
          </section>
        </div>
      )}

        {tab === "teacher" && (
          <div className="modal-backdrop">
          <section className="teacher-page" role="dialog" aria-modal="true" aria-labelledby="teacher-title" inert={retryReset}>
            <button className="modal-close icon-button" onClick={() => navigate("explore")} aria-label="Đóng góc giáo viên"><Icon name="close" /></button>
            <div className="page-heading">
              <div>
                <h2 id="teacher-title">Góc giáo viên</h2>
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
                    <small>Chọn Hint để xem và điền câu gợi ý khi trò chuyện.</small>
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
          </div>
        )}

      {ready && !progress.name && (
        <div className="modal-backdrop">
          <section
            className="welcome-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-title"
          >
            <div className="welcome-photo" aria-hidden="true">
              <Image src="/art/campus-keyart.png" alt="" fill sizes="(max-width: 620px) 1200px, 100vw" priority />
            </div>
            <div className="welcome-brand">
              <Icon name="compass" size={40} />
              <h1>CampusQuest<span> AI</span></h1>
              <p>Phiêu lưu học đường bằng tiếng Anh</p>
            </div>
            <form onSubmit={start} className="welcome-content">
              <h2 id="welcome-title">Tạo học viên</h2>
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
                <legend>Chọn nhân vật</legend>
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
                  Mở nhật ký để xem mục tiêu, câu mẫu và từ vựng. Chọn mục tiêu trên màn chơi để đến gặp nhân vật.
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
              <h2 id="atlas-title">Bản đồ khuôn viên</h2>
              <p>Chọn điểm đến để bắt đầu khám phá.</p>
            </div>
            <div className="atlas-content">
              <CampusMap large objective={goal?.place} near={near} onPlace={goTo} onZone={goToZone} />
              <nav
                className="atlas-destinations"
                aria-label="Các khu vực trong trường"
              >
                {(Object.keys(PLACES) as Place[]).map((place) => (
                  <button key={place} onClick={() => goTo(place)}>
                    <Icon name={place === "library" ? "book" : place === "canteen" ? "food" : "school"} size={19} />
                    <span>{PLACES[place].name}<small>{PLACES[place].npc}</small></span>
                    <Icon name="arrow" size={15} />
                  </button>
                ))}
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
            <h2 id="gallery-title">Bộ sưu tập hình ảnh</h2>
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
