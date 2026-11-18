"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {petForStation,type PetCare} from "@/lib/pet-care";
import {createCompetitionScene} from "@/lib/competition-scene";
import {COMPETITIONS} from "@/lib/competition-catalog";
import { SPORTS_VENUES, SPORTS_VENUE_IDS, nearbySportsVenue, type SportsVenueId } from "@/lib/sports-layout";
import type {CompetitionView} from "./competition-arena";


import { englishTier, TIER_LEVEL, type EnglishTier } from '@/lib/cadet-tiers';
import type { QuizHistory } from '@/lib/browser-quiz-history';
import { DistrictPrompt } from './district-prompt';
import { createCampusDistricts } from '@/lib/campus-districts';
import { advanceBalance, answerBalance, balancePosition, startBalance, type BalanceRun } from '@/lib/balance-challenge';
import { DISTRICT_STATIONS, BALANCE_START, BALANCE_END, BALANCE_BEAM, DISTRICT_TRANSFORMS, type DistrictFrame, type DistrictStationId } from '@/lib/campus-districts-layout';
import { FARM_LAYOUT } from "@/lib/campus-spaces";
import { createFieldworkScene } from "@/lib/fieldwork-scene";
import { applyWork, freshFieldwork, nextWorkTask, WORK_STATIONS, type Fieldwork, type WorkKind, type Tool, type WorkFrame } from "@/lib/fieldwork";
import { ResidentPrompt } from "./resident-prompt";
import type { CampusResident } from "@/lib/campus-residents";
import type { ResidentKind, ResidentMissionProgress } from '@/lib/resident-missions';
import { animateCharacter, setRunningGrip, updateCharacterDetail } from "@/lib/campus-character";
import {fieldworkMotion, loadAnMotion, playAnMotion} from '@/lib/an-game-motion';
import { preloadCampusCharacters } from "@/lib/campus-character-assets";
import { CHARACTER_PROFILES } from "@/lib/campus-character-profiles";
import { createCampusEnvironment } from "@/lib/campus-environment";
import { createCampusOverview } from "@/lib/campus-overview";
import { createCampusWorldLabels } from "@/lib/campus-world-labels";
import { PLACES, type Place } from "@/lib/game";
import { PHOTO_LIGHTS, photoCrop, type PhotoAdjustment, type PhotoCapture, type PhotoFormat, type PhotoLight } from "@/lib/campus-photo";
import {
  MAP_BOUNDS, STUDY_POSITION,
  EXPLORATION_ZONES,
  canWalkCampus,
  campusAreaName,
  campusFloorHeight,
  findCampusPath,
  advanceCampusRoute,
  type MapPoint,
  type ZoneId,
} from "@/lib/campus-map";

export type WorldHandle = {
  goToRegistration:(venue:SportsVenueId)=>void;
  openRegistration:()=>boolean;
  fieldworkAvailable: () => boolean;
  goToWork: (station: string) => void;
  goToPractice:(id:DistrictStationId)=>void;
  goToResident: (id: ResidentKind) => void;
  holdWork: (holding: boolean) => void;
  viewWork: (wide: boolean) => void;
  goTo: (place: Place) => void;
  recenter: () => void;
  zoom: (delta: number) => void;
  setQuality: (high: boolean) => void;
  goToZone: (zone: ZoneId) => void;
  overview: () => void;
  beginPhoto: () => boolean;
  endPhoto: () => void;
  framePhoto: (wholeCampus: boolean) => void;
  lightPhoto: (light: PhotoLight) => void;
  adjustPhoto: (adjustment: PhotoAdjustment) => void;
  posePhoto: (name:string)=>void;
  capturePhoto: (format: PhotoFormat) => Promise<PhotoCapture | null>;
};
type Props = {
  pets?:PetCare;
  residentMissions?: ResidentMissionProgress;
  completedChallenges?: readonly string[];
  onResidentAccept: (id: ResidentKind) => void;
  onResidentStart: (id: ResidentKind) => void;
  onResidentClaim: (id: ResidentKind) => void;
  stationPass?:{station:string;expiresAt:number}|null;
  onStationQuiz?:(station:DistrictStationId)=>void;
  cadetRank: number;
  quizHistory: QuizHistory;
  swimOpen?:boolean;
  competitionView?:CompetitionView|null;
  onCompetition?:(venue:SportsVenueId)=>void;
  storyTarget?:{x:number;z:number};
  onDistrictComplete?:(id:DistrictStationId,tier?:EnglishTier)=>void;
  studying?: boolean;
  fieldwork?: Fieldwork;
  workKind?: WorkKind | null;
  workTool?: Tool;
  onWorkCommit?: (value: Fieldwork) => void;
  onWorkFrame?: (frame: WorkFrame) => void;
  avatar: number;
  enabled: boolean;
  objective?: Place;
  conversation?: Place | null;
  speaking?: Place | null;
  highQuality?: boolean;
  photoMode?: boolean;
  onNear: (place: Place | null) => void;
  onInteract: () => void;
  onMove?: (x: number, z: number) => void;
  onAreaChange?: (name: string) => void;
};
const emptyActions = (): WorldHandle => ({
  goToRegistration:()=>{},openRegistration:()=>false,goToPractice:()=>{},goToResident:()=>{}, fieldworkAvailable: () => false, goToWork: () => {}, holdWork: () => {}, viewWork: () => {},
  goTo: () => {},
  recenter: () => {},
  zoom: () => {},
  setQuality: () => {},
  goToZone: () => {},
  overview: () => {},
  beginPhoto: () => false,
  endPhoto: () => {},
  framePhoto: () => {},
  lightPhoto: () => {},
  adjustPhoto: () => {},
  posePhoto: () => {},
  capturePhoto: async () => null,
});

export const CampusWorld = forwardRef<WorldHandle, Props>(function CampusWorld(
  {
    pets,stationPass,onStationQuiz,swimOpen=false,competitionView=null,onCompetition,storyTarget,onDistrictComplete, studying = false, fieldwork, workKind = null, workTool = "hands", onWorkCommit, onWorkFrame,
    avatar,
    cadetRank, quizHistory, residentMissions, completedChallenges, onResidentAccept, onResidentStart, onResidentClaim,
    enabled,
    objective,
    conversation = null,
    speaking = null,
    highQuality = true,
    photoMode = false,
    onNear,
    onInteract,
    onMove,
    onAreaChange,
  },
  ref,
) {
  const [nearResident, setNearResident] = useState<CampusResident | null>(null);
  const [talkingResident, setTalkingResident] = useState<CampusResident | null>(null);
  const residentAction = useRef<{ open: () => void; close: () => void; voice: (speaking: boolean) => void }>({
    open: () => {}, close: () => {}, voice: () => {},
  });
  const onResidentVoice = useRef((speaking: boolean) => residentAction.current.voice(speaking)).current;
  const [districtFrame,setDistrictFrame]=useState<DistrictFrame|null>(null);
  const [preferredBalanceTier, setPreferredBalanceTier] = useState<EnglishTier | null>(null);
  const balanceTier = preferredBalanceTier && cadetRank >= TIER_LEVEL[preferredBalanceTier]
    ? preferredBalanceTier : englishTier(cadetRank);
  const districtHoldRef=useRef<(hold:boolean)=>void>(()=>{});
  const balanceAnswerRef=useRef<(answer:string)=>void>(()=>{});
  const balanceCancelRef=useRef<()=>void>(()=>{});
  const districtTravelRef=useRef<(id:DistrictStationId)=>void>(()=>{});
  const onDistrictHold=useRef((hold:boolean)=>districtHoldRef.current(hold)).current;
  const [charactersReady, setCharactersReady] = useState(false);
  useEffect(() => {
    let active = true;
    preloadCampusCharacters().then(() => { if (active) setCharactersReady(true); });
    return () => { active = false; };
  }, []);
  const hostRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<WorldHandle>(emptyActions());
  const fpsRef = useRef<HTMLSpanElement>(null);
  const callbacks = useRef({
    pets,stationPass,onStationQuiz,swimOpen,competitionView,onCompetition,storyTarget,onDistrictComplete,balanceTier,quizHistory, studying, fieldwork, workKind, workTool, onWorkCommit, onWorkFrame,
    onNear,
    onInteract,
    enabled,
    objective,
    conversation,
    speaking,
    onMove,
    onAreaChange,
  });
  useEffect(() => {
    callbacks.current = {
      pets,stationPass,onStationQuiz,swimOpen,competitionView,onCompetition,storyTarget,onDistrictComplete,balanceTier,quizHistory, studying, fieldwork, workKind, workTool, onWorkCommit, onWorkFrame,
      onNear,
      onInteract,
      enabled,
      objective,
      conversation,
      speaking,
      onMove,
      onAreaChange,
    };
  }, [pets,stationPass,onStationQuiz,swimOpen,competitionView,onCompetition,storyTarget,onDistrictComplete,balanceTier,quizHistory,onNear, onInteract, enabled, objective, conversation, speaking, onMove, onAreaChange, fieldwork, workKind, workTool, onWorkCommit, onWorkFrame, studying]);
  useImperativeHandle(
    ref,
    () => ({
      goToRegistration:venue=>actionRef.current.goToRegistration(venue),
      openRegistration:()=>actionRef.current.openRegistration(),
      goToPractice:id=>actionRef.current.goToPractice(id),
      goToResident:id=>actionRef.current.goToResident(id),
      fieldworkAvailable: () => actionRef.current.fieldworkAvailable(),
      goToWork: (station) => actionRef.current.goToWork(station),
      holdWork: (holding) => actionRef.current.holdWork(holding),
      viewWork: (wide) => actionRef.current.viewWork(wide),
      goTo: (place) => actionRef.current.goTo(place),
      recenter: () => actionRef.current.recenter(),
      zoom: (delta) => actionRef.current.zoom(delta),
      setQuality: (high) => actionRef.current.setQuality(high),
      goToZone: (zone) => actionRef.current.goToZone(zone),
      overview: () => actionRef.current.overview(),
      beginPhoto: () => actionRef.current.beginPhoto(),
      endPhoto: () => actionRef.current.endPhoto(),
      framePhoto: (wholeCampus) => actionRef.current.framePhoto(wholeCampus),
      lightPhoto: (light) => actionRef.current.lightPhoto(light),
      posePhoto:name=>actionRef.current.posePhoto(name),
      adjustPhoto: (adjustment) => actionRef.current.adjustPhoto(adjustment),
      capturePhoto: (format) => actionRef.current.capturePhoto(format),
    }),
    [],
  );

  useEffect(() => {
    const host = hostRef.current;
    const labels = labelsRef.current;
    if (!host || !labels || !charactersReady) return;
    callbacks.current.onNear(null);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      const fallback = document.createElement("div");
      fallback.className = "world-fallback";
      fallback.textContent =
        "Thiết bị chưa hỗ trợ WebGL. Em vẫn có thể dùng nút Bản đồ toàn trường để khám phá và luyện hội thoại ở chế độ 2D.";
      host.appendChild(fallback);
      actionRef.current.goTo = (place) => callbacks.current.onNear(place);
      actionRef.current.goToZone = (zone) =>
        callbacks.current.onAreaChange?.(
          EXPLORATION_ZONES.find((z) => z.id === zone)!.name,
        );
      return () => {
        fallback.remove();
        actionRef.current = emptyActions();
      };
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = true;
    renderer.shadowMap.needsUpdate = true;
    renderer.setClearColor(0xe7eee1, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = PHOTO_LIGHTS.daylight.exposure;
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.tabIndex = -1;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const background = new THREE.Color(PHOTO_LIGHTS.daylight.sky);
    const fog = new THREE.Fog(background, 56, 155);
    scene.background = background;
    scene.fog = fog;
    const camera = new THREE.OrthographicCamera(-15, 15, 12, -12, 0.1, 1200);
    const controls = new OrbitControls(camera, renderer.domElement);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    controls.enableDamping = !reducedMotion.matches;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minZoom = 0.08;
    controls.maxZoom = 2.4;
    controls.minPolarAngle = Math.PI / 7;
    controls.maxPolarAngle = Math.PI / 2.7;
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE,
    };
    controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
    let followPlayer = false,
      overviewMode = false;
    let campusOverview: ReturnType<typeof createCampusOverview> | undefined;
    const prepareOverview = () => campusOverview ??= createCampusOverview(PHOTO_LIGHTS.daylight.sky);
    const resetCamera = (x = 0, z = -1) => {
      // Keep the same orthographic framing with enough clearance for portrait screens.
      camera.position.set(x + 21, 26.6, z + 39.2);
      camera.zoom = 1.2;
      controls.target.set(x, 0, z);
      camera.lookAt(controls.target);
      camera.updateProjectionMatrix();
      controls.update();
    };
    resetCamera();
    const daylight = PHOTO_LIGHTS.daylight;
    const hemisphere = new THREE.HemisphereLight(daylight.ambient, daylight.bounce, daylight.fill);
    scene.add(hemisphere);
    const sun = new THREE.DirectionalLight(daylight.sun, daylight.power);
    const sunOffset = new THREE.Vector3(...daylight.direction);
    sun.position.copy(sunOffset);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.radius = 2.1;
    Object.assign(sun.shadow.camera, {
      left: -18,
      right: 18,
      top: 18,
      bottom: -18,
      far: 60,
    });
    sun.shadow.normalBias = 0.037;
    sun.shadow.bias = -0.00022;
    scene.add(sun);
    scene.add(sun.target);

    const worldLabels = createCampusWorldLabels(labels);
    const environment = createCampusEnvironment(scene, avatar);
    const { floor, player, selection, destination } = environment;
    const districts=createCampusDistricts(scene);
    const competitionScene=createCompetitionScene(scene);
    let wasSwimming=false, lastRaceFrame="";
    const swimCamera={position:new THREE.Vector3(),target:new THREE.Vector3(),zoom:1};
    const swimProjection=new THREE.Vector3(),swimShift=new THREE.Vector3(),swimRight=new THREE.Vector3(),swimUp=new THREE.Vector3();
    const feedCup=new THREE.Mesh(new THREE.CylinderGeometry(.1,.07,.13,16),new THREE.MeshStandardMaterial({color:0xb59b6e,roughness:.9}));
    feedCup.position.set(0,-.3,.04);feedCup.visible=false;player.elbows[0].add(feedCup);
    const feedPortion=new THREE.Mesh(new THREE.CylinderGeometry(.087,.087,.015,16),new THREE.MeshStandardMaterial({color:0xd5bc78,roughness:1}));feedPortion.position.y=.065;feedCup.add(feedPortion);
    const storyMarker=new THREE.Mesh(new THREE.RingGeometry(.67,.78,48),new THREE.MeshBasicMaterial({color:0xf0c866,side:THREE.DoubleSide}));storyMarker.rotation.x=-Math.PI/2;scene.add(storyMarker);
    const workScene = createFieldworkScene(scene,player);
    let holdingWork=false, workElapsed=0, lastWorkFrame=0, workWide=false;
    let wasStudying=false, studyElapsed=0;const studyStand=new THREE.Vector3();
    let lastPreloadedTask='';
    let workMessage='', lastWorkKind: WorkKind|null=null, workTaskKey='';
    let localWork=callbacks.current.fieldwork||freshFieldwork();
    let lastWorkInput=callbacks.current.fieldwork;
    workScene.update(localWork,null,'hands',0,false,0,reducedMotion.matches);workScene.study(false);
    let residentNear: CampusResident | null = null, residentSession: CampusResident | null = null;
    let residentSpeaking = false;
    let greetRemaining=0,photoPose='Idle';
    residentAction.current = {
      open() {
        if (!residentNear || !callbacks.current.enabled) return;
        residentSession = residentNear;greetRemaining=1;
        keys.clear();
        route = [];
        destination.visible = false;
        setTalkingResident(residentSession);
      },
      close() {
        if (!residentSession) return;
        residentSession = null;greetRemaining=0;
        residentSpeaking = false;
        setTalkingResident(null);
        renderer.domElement.focus({ preventScroll: true });
      },
      voice(speaking) { residentSpeaking = speaking && !!residentSession; },
    };
    let districtNear:typeof DISTRICT_STATIONS[number]|undefined, districtActive:typeof DISTRICT_STATIONS[number]|undefined;
    let districtElapsed=0,lastDistrictFrame=0,districtComplete:DistrictStationId|null=null,lastDistrictSignature='';
    const districtStart=new THREE.Vector3();
    let balanceRun: BalanceRun | null = null;
    let balanceResult: BalanceRun | null = null;
    let balanceReverse = false;
    const releaseDistrict=(completed=false)=>{
      if (districtActive?.id === 'balance') {
        player.group.position.copy(districtStart);
        if (completed) {
          const finish = balanceReverse ? BALANCE_START : BALANCE_END;
          player.group.position.set(finish.x, campusFloorHeight(finish), finish.z);
        }
        player.group.rotation.z = 0;
        player.body.rotation.set(0,0,0);
        balanceRun = null;
      }
      if(districtActive){player.leftArm.rotation.z=-.085;player.rightArm.rotation.z=.085;player.leftArm.rotation.x=player.rightArm.rotation.x=0;}
      districtActive=undefined;districtElapsed=0;
    };
    districtHoldRef.current=hold=>{
      if(!hold){if(districtActive?.id!=='balance')releaseDistrict();return;}
      if(districtActive)return;
      if(!districtNear||!callbacks.current.enabled||callbacks.current.workKind||callbacks.current.studying||callbacks.current.conversation||photoSession)return;
      if((petForStation(districtNear.id)||districtNear.id==='rescue-ring')&&!(callbacks.current.stationPass?.station===districtNear.id&&callbacks.current.stationPass.expiresAt>Date.now())){callbacks.current.onStationQuiz?.(districtNear.id);return;}
      districtActive=districtNear;districtElapsed=0;districtComplete=null;districtStart.copy(player.group.position);route=[];keys.clear();destination.visible=false;
      balanceResult = null;
      if (districtActive.id === 'balance') {
        balanceReverse = Math.abs(districtStart.z - BALANCE_END.z) < Math.abs(districtStart.z - BALANCE_START.z);
        const { balanceTier, quizHistory } = callbacks.current;
        const key = `balance/${balanceTier}`;
        balanceRun = startBalance(performance.now(), Math.random, balanceTier, quizHistory.previous(key));
        quizHistory.record(key, balanceRun.questions.map(question => question.prompt));
      }
    };
    balanceAnswerRef.current = answer => {
      if (balanceRun) balanceRun = answerBalance(balanceRun, answer, performance.now());
    };
    balanceCancelRef.current = () => {
      if (districtActive?.id === 'balance') releaseDistrict();
      balanceResult = null;
    };
    const releaseActions=()=>{releaseWork();if(districtActive?.id!=='balance')releaseDistrict();};
    const releaseWork=()=>{holdingWork=false;workElapsed=0;};
    const visibilityWork=()=>{if(document.hidden)releaseActions();};
    window.addEventListener('pointerup',releaseActions);
    window.addEventListener('pointercancel',releaseActions);
    window.addEventListener('blur',releaseActions);
    document.addEventListener('visibilitychange',visibilityWork);


    let conversationPlace: Place | null = null;
    let returningFromConversation = false;
    const savedCamera = { position: camera.position.clone(), target: controls.target.clone(), zoom: camera.zoom };
    const focusPosition = new THREE.Vector3();
    const focusTarget = new THREE.Vector3();
    let gait = 0, movementBlend = 0, runBlend = 0;
    let route: MapPoint[] = [];
    let nearest: Place | null = null;
    let lastTime = 0;
    let frames = 0;
    let lastFpsTime = performance.now();
    let slowFrameWindows=0;
    let lastMapUpdate = 0;
    let lastArea = "";
    const keys = new Set<string>();
    const cameraForward = new THREE.Vector3();
    const cameraRight = new THREE.Vector3();
    const pointer = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    const canWalk = canWalkCampus;
    const resumeFollowing = () => {
      followPlayer = true;
      if (overviewMode) {
        overviewMode = false;
        resetCamera(player.group.position.x, player.group.position.z);
      }
    };
    const walkTo = (x: number, z: number) => {
      const path = findCampusPath(player.group.position, { x, z });
      if (!path.length) return;
      resumeFollowing();
      route = path;
      destination.position.set(x, campusFloorHeight({x,z})+.02, z);
      destination.visible = true;
    };
    districtTravelRef.current=id=>{const s=DISTRICT_STATIONS.find(s=>s.id===id);if(s){renderer.domElement.focus({preventScroll:true});walkTo(s.x,s.z);}};
    const frameCampus = () => {
      resetCamera((MAP_BOUNDS.minX+MAP_BOUNDS.maxX)/2, (MAP_BOUNDS.minZ+MAP_BOUNDS.maxZ)/2);
      camera.updateMatrixWorld(true);
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
      for (const x of [MAP_BOUNDS.minX, MAP_BOUNDS.maxX])
        for (const z of [MAP_BOUNDS.minZ, MAP_BOUNDS.maxZ]) {
          const p = new THREE.Vector3(x, 0, z).project(camera);
          minX = Math.min(minX, p.x);
          maxX = Math.max(maxX, p.x);
          minY = Math.min(minY, p.y);
          maxY = Math.max(maxY, p.y);
        }
      camera.zoom = THREE.MathUtils.clamp(
        camera.zoom * Math.min(1.65 / (maxX - minX), 1.65 / (maxY - minY)),
        0.08,
        0.7,
      );
      camera.updateProjectionMatrix();
      // Orthographic composition stays fixed when the camera retreats along its axis.
      const clearance = camera.top / camera.zoom + 2;
      if (camera.position.y < clearance) camera.position.sub(controls.target).multiplyScalar(clearance / camera.position.y).add(controls.target);
      controls.update();
    };
    const snapshotCamera = () => ({
      position: camera.position.clone(),
      target: controls.target.clone(),
      zoom: camera.zoom,
    });
    type CameraPose = ReturnType<typeof snapshotCamera>;
    let photoSession: CameraPose | null = null;
    const moveCameraTo = (pose: CameraPose) => {
      controls.enableDamping = false;
      controls.update();
      camera.position.copy(pose.position);
      controls.target.copy(pose.target);
      camera.zoom = pose.zoom;
      camera.updateProjectionMatrix();
      controls.update();
    };
    const lightPhoto = (light: PhotoLight) => {
      const look = PHOTO_LIGHTS[light];
      background.setHex(look.sky);
      fog.color.copy(background);
      hemisphere.color.setHex(look.ambient);
      hemisphere.groundColor.setHex(look.bounce);
      hemisphere.intensity = look.fill;
      sun.color.setHex(look.sun);
      sun.intensity = look.power;
      const [x, y, z] = look.direction;
      sunOffset.set(x, y, z);
      sun.position.copy(sun.target.position).add(sunOffset);
      renderer.toneMappingExposure = look.exposure;
      renderer.shadowMap.needsUpdate = true;
    };
    const beginPhoto = () => {
      if (photoSession || conversationPlace || renderer.getContext().isContextLost()) return false;
      // Finish a dialogue camera return before saving the player's view.
      if (returningFromConversation) {
        moveCameraTo(savedCamera);
        returningFromConversation = false;
      }
      photoSession = snapshotCamera();
      keys.clear();
      controls.enablePan = true;
      controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
      controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
      controls.maxTargetRadius = 100;
      selection.visible = destination.visible = false;
      for (const marker of Object.values(environment.npcMarkers)) marker.visible = false;
      return true;
    };
    const endPhoto = () => {
      photoPose='Idle';
      if (!photoSession) return;
      controls.enablePan = false;
      controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
      controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
      controls.maxTargetRadius = Infinity;
      moveCameraTo(photoSession);
      photoSession = null;
      lightPhoto("daylight");
      for (const marker of Object.values(environment.npcMarkers)) marker.visible = true;
    };
    const framePhoto = (wholeCampus: boolean) => {
      if (!photoSession) return;
      moveCameraTo(photoSession);
      if (wholeCampus) frameCampus();
    };
    const adjustPhoto = (adjustment: PhotoAdjustment) => {
      if (!photoSession) return;
      if (adjustment === "in" || adjustment === "out") {
        camera.zoom = THREE.MathUtils.clamp(camera.zoom + (adjustment === "in" ? 0.15 : -0.15), 0.08, 2.4);
        camera.updateProjectionMatrix();
      } else if (adjustment === "left" || adjustment === "right") {
        controls.rotateLeft(adjustment === "left" ? 0.15 : -0.15);
      } else {
        controls.rotateUp(adjustment === "up" ? 0.12 : -0.12);
      }
    };
    const capturePhoto = async (format: PhotoFormat): Promise<PhotoCapture | null> => {
      if (!photoSession || renderer.getContext().isContextLost()) return null;
      const size = renderer.getSize(new THREE.Vector2());
      if (!size.x || !size.y) return null;
      const crop = photoCrop(size.x, size.y, format);
      const longEdge = Math.min(2048, renderer.capabilities.maxTextureSize);
      const scale = longEdge / Math.max(crop.width, crop.height);
      const width = Math.max(1, Math.round(crop.width * scale));
      const height = Math.max(1, Math.round(crop.height * scale));
      const pixels = document.createElement("canvas");
      pixels.width = width;
      pixels.height = height;
      const ctx = pixels.getContext("2d", { alpha: false });
      if (!ctx) return null;
      const ratio = renderer.getPixelRatio();
      try {
        camera.setViewOffset(size.x, size.y, crop.x, crop.y, crop.width, crop.height);
        renderer.setPixelRatio(1);
        renderer.setSize(width, height, false);
        renderer.render(scene, camera);
        // Copy this frame before WebGL clears its default drawing buffer.
        ctx.drawImage(renderer.domElement, 0, 0);
      } finally {
        camera.clearViewOffset();
        renderer.setPixelRatio(ratio);
        renderer.setSize(size.x, size.y, false);
        renderer.render(scene, camera);
      }
      return new Promise((resolve) => {
        pixels.toBlob((blob) => resolve(blob ? { blob, width, height } : null), "image/png");
      });
    };
    actionRef.current = {
      goToRegistration:venue=>{
        const { x, z } = SPORTS_VENUES[venue].approach;
        renderer.domElement.focus({preventScroll:true});
        walkTo(x,z);
      },
      openRegistration:()=>{
        const {x,z}=player.group.position;
        const venue=nearbySportsVenue(x,z);
        if(!venue||!callbacks.current.enabled||callbacks.current.workKind||callbacks.current.studying||photoSession||districtActive||overviewMode)return false;
        route=[];keys.clear();destination.visible=false;
        callbacks.current.onCompetition?.(venue);
        return true;
      },
      goToPractice:id=>districtTravelRef.current(id),
      goToResident(id) {
        const person = environment.residents.find(({ resident }) => resident.kind === id);
        if (!person) return;
        const [start, end = start] = person.resident.route;
        renderer.domElement.focus({ preventScroll: true });
        walkTo((start[0] + end[0]) / 2, (start[1] + end[1]) / 2);
      },
      fieldworkAvailable: () => !renderer.getContext().isContextLost(),
      viewWork: (wide) => { workWide=wide; },
      goToWork: (id) => { const station=WORK_STATIONS.find(s=>s.id===id); if(station){renderer.domElement.focus({preventScroll:true});releaseWork();workMessage='';walkTo(station.approach.x,station.approach.z);} },
      holdWork: (holding) => {
        if(!holding){releaseWork();return;}
        if(!callbacks.current.workKind||!callbacks.current.enabled)return;
        route=[];keys.clear();destination.visible=false;holdingWork=true;
      },
      goTo: (place) => {
        renderer.domElement.focus({ preventScroll: true });
        const [x, z] = PLACES[place].position;
        walkTo(x, z + 1);
      },
      goToZone: (id) => {
        const zone = EXPLORATION_ZONES.find((z) => z.id === id);
        if (!zone) return;
        renderer.domElement.focus({ preventScroll: true });
        walkTo(zone.x, zone.z);
      },
      overview: () => {
        prepareOverview();
        overviewMode = true;
        followPlayer = false;
        route = [];
        destination.visible = false;
        districtNear = undefined;
        setDistrictFrame(null);
        worldLabels.show(false);
        frameCampus();
      },
      beginPhoto,
      endPhoto,
      framePhoto,
      lightPhoto,
      posePhoto:name=>{photoPose=name;},
      adjustPhoto,
      capturePhoto,
      recenter: () => {
        overviewMode = false;
        followPlayer = true;
        resetCamera(player.group.position.x, player.group.position.z);
      },
      zoom: (delta) => {
        camera.zoom = THREE.MathUtils.clamp(camera.zoom + delta, 0.08, 2.4);
        camera.updateProjectionMatrix();
      },
      setQuality: (high) => {
        renderer.setPixelRatio(
          Math.min(window.devicePixelRatio, high ? 1.25 : 1),
        );
        delete host.dataset.performance;
        slowFrameWindows = 0;
        renderer.shadowMap.enabled = high;
        renderer.shadowMap.needsUpdate = true;
        environment.leafDetail.visible = true;
        environment.grassDetail.visible = high;
        environment.litter.visible = high;
        environment.motes.visible = high;
        environment.butterflies.forEach((b) => (b.visible = high));
        renderer.setSize(host.clientWidth, host.clientHeight);
      },
    };
    const typing = (target: EventTarget | null) =>
      target instanceof HTMLElement &&
      (target.matches("input,textarea,select,button,a") ||
        target.isContentEditable);
    const keydown = (event: KeyboardEvent) => {
      if (photoSession || !callbacks.current.enabled) return;
      const key = event.key.toLowerCase();
      if (residentSession) {
        if (key === 'escape') { event.preventDefault(); residentAction.current.close(); }
        return;
      }
      if (districtActive?.id === 'balance') {
        if (key === 'escape') balanceCancelRef.current();
        const stage = balanceRun?.stage;
        if (!event.repeat && /^[1-3]$/.test(key) && balanceRun && stage?.kind === 'quiz') {
          event.preventDefault();
          balanceAnswerRef.current(balanceRun.questions[balanceRun.index].choices[Number(key)-1]);
        }
        return;
      }
      if (typing(event.target)) return;
      if(callbacks.current.workKind && key===' '){event.preventDefault();if(!event.repeat)actionRef.current.holdWork(true);return;}
      if(key==='e'&&!event.repeat&&actionRef.current.openRegistration()){event.preventDefault();return;}
      if(key==='e'&&districtNear&&!callbacks.current.workKind){event.preventDefault();if(!event.repeat)districtHoldRef.current(true);return;}
      if(holdingWork||districtActive)return;
      if (key === "shift") {
        keys.add(key);
        return;
      }
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
        ].includes(key)
      ) {
        event.preventDefault();
        keys.add(key);
        resumeFollowing();
        route = [];
      }
      if (key === 'e' && !event.repeat) {
        if (nearest) callbacks.current.onInteract();
        else if (residentNear) { event.preventDefault(); residentAction.current.open(); }
      }
    };
    const keyup = (event: KeyboardEvent) => {
      keys.delete(event.key.toLowerCase());if(event.key===' ')releaseWork();if(event.key.toLowerCase()==='e'&&districtActive?.id!=='balance')releaseDistrict();
    };
    const blur = () => keys.clear();
    const click = (event: PointerEvent) => {
      if (residentSession) return;
      if (photoSession || !callbacks.current.enabled || event.button !== 0) return;
      renderer.domElement.focus({ preventScroll: true });
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      if(holdingWork||districtActive)return;
      raycaster.setFromCamera(pointer, camera);
      if(callbacks.current.workKind){
        const picked=raycaster.intersectObjects(workScene.picks,false)[0];
        if(picked){actionRef.current.goToWork(picked.object.userData.station);return;}
      }
      if(!callbacks.current.workKind){const picked=raycaster.intersectObjects(districts.picks,false)[0];if(picked){districtTravelRef.current(picked.object.userData.district);return;}}
      const hit = raycaster.intersectObject(floor)[0];
      if (hit) walkTo(hit.point.x, hit.point.z);
    };
    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      lastRaceFrame = "";
      const aspect = width / height;
      const halfHeight = Math.max(12.1, 14 / aspect);
      camera.left = -halfHeight * aspect;
      camera.right = halfHeight * aspect;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      if(overviewMode)frameCampus();
      renderer.setSize(width, height);
      worldLabels.resize(width, height);
      worldLabels.paint(camera, player.group.position);
      renderer.render(overviewMode && !photoSession && campusOverview ? campusOverview.scene : scene, camera);
    };
    const anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    scene.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if ('map' in material && material.map instanceof THREE.CanvasTexture) material.map.anisotropy = anisotropy;
      }
    });
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    const warmOverview = window.setTimeout(() => {
      void renderer.compileAsync(prepareOverview().scene, camera).catch(() => {});
    }, 1000);
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", blur);
    renderer.domElement.addEventListener("pointerdown", click);
    const renderFrame=(time:number, activeScene = scene)=>{
      renderer.render(activeScene, camera);
      frames++;
      if (time - lastFpsTime > 1000) {
        if (fpsRef.current)
          fpsRef.current.textContent = `${Math.round((frames * 1000) / (time - lastFpsTime))} FPS`;
        host.dataset.fps = String(
          Math.round((frames * 1000) / (time - lastFpsTime)),
        );
        const measuredFps=(frames*1000)/(time-lastFpsTime);
        if((callbacks.current.enabled||callbacks.current.swimOpen)&&!photoSession){
          slowFrameWindows=measuredFps<38?slowFrameWindows+1:0;
          const resolution=renderer.getPixelRatio();
          if(slowFrameWindows>=2&&host.dataset.performance!=='balanced'){
            if (resolution > 1) renderer.setPixelRatio(1);
            environment.grassDetail.visible=false;
            environment.litter.visible=false;
            host.dataset.performance='balanced';
            slowFrameWindows=0;
          }
        }
        host.dataset.triangles = String(renderer.info.render.triangles);
        host.dataset.drawCalls = String(renderer.info.render.calls);
        frames = 0;
        lastFpsTime = time;
      }
    };
    renderer.setAnimationLoop((time) => {
      if (document.hidden) {
        lastTime = time;
        return;
      }
      if (time - lastTime < (callbacks.current.enabled || callbacks.current.swimOpen || callbacks.current.conversation || callbacks.current.studying || photoSession ? 15 : 66)) return;
      const dt = Math.min((time - lastTime) / 1000, 0.08);
      lastTime = time;
      const swimming=!!callbacks.current.swimOpen;
      if(swimming&&!wasSwimming){
        swimCamera.position.copy(camera.position);swimCamera.target.copy(controls.target);swimCamera.zoom=camera.zoom;
        route=[];keys.clear();releaseDistrict();
        renderer.shadowMap.autoUpdate=false;
        renderer.shadowMap.needsUpdate=true;
        controls.enabled=false;
        worldLabels.show(false);
        storyMarker.visible=false;
        selection.visible=false;
        destination.visible=false;
      }
      if(!swimming&&wasSwimming){
        player.group.visible=true;camera.position.copy(swimCamera.position);controls.target.copy(swimCamera.target);camera.zoom=swimCamera.zoom;renderer.shadowMap.autoUpdate=true;lastRaceFrame="";competitionScene.update(null,Date.now(),true,dt);camera.lookAt(controls.target);camera.updateProjectionMatrix();
      }
      wasSwimming=swimming;
      if(swimming){
        player.group.visible=false;
        const view=callbacks.current.competitionView,definition=COMPETITIONS[view?.mode??'swimming'];
        competitionScene.update(view??null,Date.now()+(view?.clockOffset??0),reducedMotion.matches,dt);
        districts.updateWater(reducedMotion.matches ? 0 : time/1000);
        const raceFrame=`${definition.id}/${view?.room?.phase==='lobby'}`;
        if(raceFrame!==lastRaceFrame){
          lastRaceFrame=raceFrame;
          renderer.shadowMap.needsUpdate=true;
          const frame:{x:number;z:number;w:number;d:number}={x:definition.x,z:definition.z,w:definition.w,d:definition.d};
          const landscape=host.clientHeight<=620&&host.clientWidth>600;
          if(view?.room?.phase==='lobby'){if(definition.id==='swimming'){frame.x=65;frame.w=18;frame.d=20;}else{frame.x=definition.lobby.x;frame.z=definition.lobby.z;frame.w=16;frame.d=5.5;}}
          // Fit actual pool bounds into the space above/beside the question panel.
          focusTarget.set(frame.x,0,frame.z);
          camera.position.copy(focusTarget).add(focusPosition.set(4,27,32));controls.target.copy(focusTarget);camera.zoom=1;camera.lookAt(controls.target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
          let left=Infinity,right=-Infinity,top=-Infinity,bottom=Infinity;
          for(const sx of [-1,1])for(const sz of [-1,1]){
            swimProjection.set(frame.x+sx*(frame.w/2+1),.3,frame.z+sz*(frame.d/2+1.8)).project(camera);
            left=Math.min(left,swimProjection.x);right=Math.max(right,swimProjection.x);bottom=Math.min(bottom,swimProjection.y);top=Math.max(top,swimProjection.y);
          }
          const w=host.clientWidth,h=host.clientHeight,l=12/w*2-1,r=(landscape?w*.5-15:w-12)/w*2-1,viewTop=1-158/h*2,viewBottom=1-(landscape?h-55:h*.55)/h*2;
          camera.zoom=Math.max(.1,Math.min((r-l)/(right-left),(viewTop-viewBottom)/(top-bottom))*.96);
          camera.updateProjectionMatrix();swimProjection.set(frame.x,.3,frame.z).project(camera);
          swimRight.setFromMatrixColumn(camera.matrixWorld,0);swimUp.setFromMatrixColumn(camera.matrixWorld,1);
          swimShift.copy(swimRight).multiplyScalar(-( (l+r)/2-swimProjection.x)*(camera.right-camera.left)/(2*camera.zoom)).addScaledVector(swimUp,-((viewTop+viewBottom)/2-swimProjection.y)*(camera.top-camera.bottom)/(2*camera.zoom));
          camera.position.add(swimShift);controls.target.add(swimShift);camera.lookAt(controls.target);
          sun.target.position.set(frame.x,0,frame.z);sun.position.copy(sun.target.position).add(sunOffset);
          host.dataset.competition=view?.mode??'none';
        }
        renderFrame(time);
        return;
      }
      if (overviewMode && campusOverview && !photoSession) {
        if (callbacks.current.conversation || callbacks.current.workKind || callbacks.current.studying) {
          resumeFollowing();
        } else {
          residentAction.current.close();
          if (residentNear) { residentNear = null; setNearResident(null); }
          controls.update();
          campusOverview.mark(player.group.position.x, player.group.position.z);
          host.dataset.mapView = 'overview';
          host.dataset.interior = 'outside';
          renderFrame(time, campusOverview.scene);
          return;
        }
      }
      if(lastWorkInput!==callbacks.current.fieldwork){lastWorkInput=callbacks.current.fieldwork;localWork=lastWorkInput||freshFieldwork();}
      const workKind=callbacks.current.workKind||null;
      if(workKind!==lastWorkKind){releaseWork();lastWorkKind=workKind;keys.clear();if(!workKind){route=[];}if(!workKind)resetCamera(player.group.position.x,player.group.position.z);}
      if(!callbacks.current.enabled){releaseWork();releaseDistrict();residentAction.current.close();}
      const activeConversation = callbacks.current.conversation ?? null;
      if (activeConversation !== conversationPlace) {
        if (activeConversation) {
          if (!conversationPlace) {
            savedCamera.position.copy(camera.position);
            savedCamera.target.copy(controls.target);
            savedCamera.zoom = camera.zoom;
          }
          route = [];
          keys.clear();
          destination.visible = false;
          const npcPosition = environment.npcs[activeConversation].group.position;
          // Aim above the subtitle area, with a slightly offset, face-to-face view.
          focusTarget.set(npcPosition.x - 2, 0.8, npcPosition.z);
          focusPosition.set(npcPosition.x + 21.4, 19.52, npcPosition.z + 33.8);
          environment.npcs[activeConversation].group.rotation.y = 0.11;
          greetRemaining=1;
          player.group.rotation.y=Math.atan2(npcPosition.x-player.group.position.x,npcPosition.z-player.group.position.z);
          player.group.visible = player.kind==='cadet';
          returningFromConversation = false;
        } else {
          player.group.visible = true;
          greetRemaining=0;returningFromConversation = true;
        }
        conversationPlace = activeConversation;
      }
      if (!callbacks.current.enabled) keys.clear();
      controls.enabled = (callbacks.current.enabled || !!photoSession) && !returningFromConversation && !residentSession;
      controls.enableDamping = !reducedMotion.matches;
      const cameraEase = reducedMotion.matches ? 1 : 1 - Math.exp(-dt * 5);
      if (conversationPlace || returningFromConversation) {
        const targetPosition = conversationPlace ? focusPosition : savedCamera.position;
        const targetLook = conversationPlace ? focusTarget : savedCamera.target;
        const targetZoom = conversationPlace ? 1.55 : savedCamera.zoom;
        camera.position.lerp(targetPosition, cameraEase);
        controls.target.lerp(targetLook, cameraEase);
        camera.zoom = THREE.MathUtils.lerp(camera.zoom, targetZoom, cameraEase);
        camera.lookAt(controls.target);
        camera.updateProjectionMatrix();
        if (returningFromConversation && camera.position.distanceTo(targetPosition) < 0.025) {
          camera.position.copy(targetPosition);
          controls.target.copy(targetLook);
          camera.zoom = targetZoom;
          camera.updateProjectionMatrix();
          returningFromConversation = false;
        }
      } else controls.update();
      const pos = player.group.position;
      const lastX = pos.x, lastZ = pos.z;
      if (callbacks.current.enabled && !photoSession && !holdingWork && !districtActive && !residentSession) {
        const horizontal = Number(keys.has("d") || keys.has("arrowright")) -
          Number(keys.has("a") || keys.has("arrowleft"));
        const vertical = Number(keys.has("w") || keys.has("arrowup")) -
          Number(keys.has("s") || keys.has("arrowdown"));
        if (horizontal || vertical) {
          camera.getWorldDirection(cameraForward);
          cameraForward.y = 0;
          cameraForward.normalize();
          cameraRight.crossVectors(cameraForward, camera.up).normalize();
          const dx = horizontal * cameraRight.x + vertical * cameraForward.x;
          const dz = horizontal * cameraRight.z + vertical * cameraForward.z;
          const step = dt * (keys.has("shift") ? 9 : 5) / Math.hypot(dx, dz);
          const nextX = pos.x + dx * step, nextZ = pos.z + dz * step;
          if (canWalk(nextX, nextZ)) { pos.x = nextX; pos.z = nextZ; }
          else if (canWalk(nextX, pos.z)) pos.x = nextX;
          else if (canWalk(pos.x, nextZ)) pos.z = nextZ;
        } else if (route.length) advanceCampusRoute(pos, route, dt * (keys.has("shift") ? 9 : 6));
      }
      const moving = pos.x !== lastX || pos.z !== lastZ;
      if (moving) {
        const desiredAngle = Math.atan2(pos.x - lastX, pos.z - lastZ);
        const angle = desiredAngle - player.group.rotation.y;
        const turn = Math.atan2(Math.sin(angle), Math.cos(angle));
        player.group.rotation.y += turn * (1 - Math.exp(-dt * 14));
      }
      pos.y = campusFloorHeight(pos);
      movementBlend = THREE.MathUtils.lerp(movementBlend, moving ? 1 : 0, 1 - Math.exp(-dt * 12));
      const running = keys.has("shift");
      animateCharacter(player,time/1000,false,reducedMotion.matches);
      runBlend = reducedMotion.matches ? 0 : THREE.MathUtils.damp(runBlend, running ? movementBlend : 0, 12, dt);
      if (!workKind) setRunningGrip(player, runBlend);
      if (!reducedMotion.matches) {
        // Preserve phase across pauses and walls. Route and keyboard movement
        // share the same cadence at the same actual travel speed.

        gait += dt * (running ? 15 : 10);
        const stride = Math.sin(gait) * movementBlend;
        player.leftLeg.rotation.x = stride * (running ? 0.75 : 0.48);
        player.rightLeg.rotation.x = -player.leftLeg.rotation.x;
        player.knees[0].rotation.x = Math.max(0,-stride) * (running ? .85 : .55);
        player.knees[1].rotation.x = Math.max(0,stride) * (running ? .85 : .55);
        player.leftArm.rotation.x = -stride * 0.52;
        player.rightArm.rotation.x = stride * 0.52;
        if (player.group.userData.assetVersion === 4 && player.kind === 'cadet') {
          player.elbows[0].rotation.x -= movementBlend * (.12 + runBlend * .77) - stride * .1;
          player.elbows[1].rotation.x -= movementBlend * (.12 + runBlend * .77) + stride * .1;
        }
        player.body.position.y = Math.abs(Math.cos(gait)) * 0.036 * movementBlend + Math.sin(time * 0.002) * 0.012 * (1 - movementBlend);
        player.body.rotation.z = stride * 0.026;
        player.head.rotation.z -= stride * .019;
        player.body.rotation.x = movementBlend * (running ? 0.12 : 0.04);

      }
      const studying=callbacks.current.studying;
      if(studying&&!wasStudying){studyStand.copy(pos);studyElapsed=0;route=[];keys.clear();}
      if(!studying&&wasStudying){pos.copy(studyStand);player.body.position.y=0;player.leftLeg.rotation.x=player.rightLeg.rotation.x=0;player.knees.forEach(k=>k.rotation.x=0);resetCamera(pos.x,pos.z);}
      wasStudying=studying;
      if(studying){
        studyElapsed+=dt;const walk=reducedMotion.matches?1:THREE.MathUtils.smoothstep(studyElapsed,0,1.3),sit=reducedMotion.matches?1:THREE.MathUtils.smoothstep(studyElapsed,1.3,2);
        pos.set(THREE.MathUtils.lerp(studyStand.x,STUDY_POSITION.x,walk),.31,THREE.MathUtils.lerp(studyStand.z,STUDY_POSITION.z,walk));player.group.rotation.y=Math.PI;
        player.leftLeg.rotation.x=-1.15*sit;player.rightLeg.rotation.x=-1.15*sit;player.knees.forEach(k=>k.rotation.x=1.6*sit);
        if(walk<1&&!reducedMotion.matches){player.leftLeg.rotation.x=Math.sin(studyElapsed*10)*.35;player.rightLeg.rotation.x=-player.leftLeg.rotation.x;}
        player.body.position.y=-.25*sit;player.body.rotation.x=.08*sit;player.head.rotation.x=.2*sit;
        player.leftArm.rotation.x=player.rightArm.rotation.x=-1.05*sit;player.elbows.forEach(k=>k.rotation.x=-.3*sit);
        const mobileStudy=host.clientWidth<600;focusTarget.set(pos.x+(mobileStudy?0:2.3),mobileStudy?-1.8:.8,pos.z+(mobileStudy?0:1.58));camera.position.lerp(focusPosition.copy(focusTarget).add(new THREE.Vector3(-11,14,16)),cameraEase);controls.target.lerp(focusTarget,cameraEase);camera.zoom=THREE.MathUtils.lerp(camera.zoom,mobileStudy?4.4:3,cameraEase);camera.lookAt(controls.target);camera.updateProjectionMatrix();
      }
      workScene.study(studying);
      const task=workKind?nextWorkTask(localWork,workKind):null;
      const station=workKind?WORK_STATIONS.find(s=>s.id===(task?.station||(workKind==='garden'?'garden-board':'duty-board'))):undefined;
      const taskKey=task?`${task.station}/${task.action}/${localWork.duty.folds}`:'';
      if(taskKey!==workTaskKey){releaseWork();workTaskKey=taskKey;}
      const nearWork=!!station&&Math.hypot(pos.x-station.approach.x,pos.z-station.approach.z)<.85;
      const correctTool=!!task&&callbacks.current.workTool===task.tool;
      let actionPercent=task?Math.min(1,workElapsed/task.seconds):0;
      if(holdingWork&&task&&station){
        if(!nearWork||!correctTool){workMessage=!nearWork?'Walk to the highlighted work position first.':`Select the ${task.tool==='hands'?'empty hands':task.tool} before working.`;releaseWork();}
        else {
          workMessage='';workElapsed+=dt;actionPercent=Math.min(1,workElapsed/task.seconds);
          if(workElapsed>=task.seconds){
            const next=applyWork(localWork,workKind!,task.station,task.tool,pos,workElapsed);
            if(next!==localWork){localWork=next;callbacks.current.onWorkCommit?.(next);}
            releaseWork();
          }
        }
      }
      const workClip=fieldworkMotion(task);
      if(player.kind==='cadet'&&workKind&&workClip&&taskKey!==lastPreloadedTask){
        lastPreloadedTask=taskKey;void loadAnMotion(workClip);
      }
      let motion:string|null=moving?(running?'Running':'Standard Walk'):'Idle';
      let phase:number|undefined;
      if(holdingWork){motion=workClip;phase=actionPercent;}
      else if(workKind==='duty'&&localWork.duty.books===1)motion=moving?'holding walk':'holding idle';
      else if(studying)motion=studyElapsed<1.3?'Standard Walk':'Sitting Idle';
      else if(districtActive)motion=null; // keep balance, feeding and rescue poses fitted to the station
      else if(photoSession)motion=photoPose;
      else if(residentSession||conversationPlace){
        motion=greetRemaining>0?'Waving':(residentSpeaking||callbacks.current.speaking?'Thoughtful Head Nod':'Talking');
        if(greetRemaining>0)phase=1-greetRemaining;
        greetRemaining=Math.max(0,greetRemaining-dt);
        if(residentSession){const npc=environment.residents.find(p=>p.resident===residentSession);
         if(npc)player.group.rotation.y=Math.atan2(npc.rig.group.position.x-pos.x,npc.rig.group.position.z-pos.z);}
      }
      workScene.update(localWork,workKind,callbacks.current.workTool||'hands',actionPercent,holdingWork,time/1000,reducedMotion.matches,dt,()=>{
        playAnMotion(player,motion,dt,reducedMotion.matches,phase);
        const playing=player.group.userData.activeMotion??'';
        if(host.dataset.cadetMotion!==playing)host.dataset.cadetMotion=playing;
      });
      if(time-lastWorkFrame>90){callbacks.current.onWorkFrame?.({near:nearWork,busy:holdingWork,percent:Math.round(actionPercent*100),message:workMessage});lastWorkFrame=time;}
      if(workKind&&!conversationPlace&&!photoSession){
        const aim=focusTarget.set(pos.x,.4,pos.z);
        if(holdingWork&&task?.action==='grow')aim.set(FARM_LAYOUT.center.x,.4,FARM_LAYOUT.center.z);
        if(localWork[workKind].reported||(workKind==='garden'&&workWide))aim.set(workKind==='garden'?FARM_LAYOUT.center.x:-27,.5,workKind==='garden'?FARM_LAYOUT.center.z:-2.5);
        const cameraOffset=workKind==='garden'?new THREE.Vector3(-11,18,19):new THREE.Vector3(-10,16,17);
        camera.position.lerp(focusPosition.copy(aim).add(cameraOffset),cameraEase);controls.target.lerp(aim,cameraEase);
        const gardenOverview=workKind==='garden'&&(workWide||localWork.garden.reported||(holdingWork&&task?.action==='grow'));
        const zoom=gardenOverview?(host.clientWidth<900?.78:1.05):localWork[workKind].reported?2.8:host.clientWidth<600?4.8:3.2;
        controls.maxZoom=5;camera.zoom=THREE.MathUtils.lerp(camera.zoom,zoom,cameraEase);camera.lookAt(controls.target);camera.updateProjectionMatrix();
      }else controls.maxZoom=studying?5:2.4;
      const canPractise=callbacks.current.enabled&&!workKind&&!studying&&!conversationPlace&&!photoSession&&!overviewMode;
      if(!canPractise)releaseDistrict();
      if(!districtActive){districtNear=canPractise?DISTRICT_STATIONS.find(s=>Math.hypot(pos.x-s.x,pos.z-s.z)<1.15||(s.id==='balance'&&Math.hypot(pos.x-BALANCE_END.x,pos.z-BALANCE_END.z)<1.15)):undefined;}
      if(districtComplete&&districtNear?.id!==districtComplete)districtComplete=null;
      if(!districtActive&&districtNear?.id!=='balance')balanceResult=null;
      let districtProgress=districtComplete?1:0;
      if (districtActive?.id === 'balance' && balanceRun) {
        balanceRun = advanceBalance(balanceRun, time);
        const run = balanceRun;
        const stage = run.stage;
        const p = balancePosition(run, time);
        districtProgress = p;
        if (stage.kind === 'done' || stage.kind === 'failed') {
          balanceResult = run;
          const completed = stage.kind === 'done';
          if (completed) {
            districtComplete = 'balance';
            callbacks.current.onDistrictComplete?.('balance', run.tier);
          }
          releaseDistrict(completed);
          districtProgress = completed ? 1 : 0;
        } else {
          const finish = balanceReverse ? BALANCE_START : BALANCE_END;
          const height = BALANCE_BEAM.top * DISTRICT_TRANSFORMS.training.scale;
          const onBeam = Math.min(1, p / .21, (1 - p) / .18);
          pos.set(THREE.MathUtils.lerp(districtStart.x, BALANCE_START.x, Math.min(p / .15, 1)),
            THREE.MathUtils.lerp(.13, height, onBeam),
            THREE.MathUtils.lerp(districtStart.z, finish.z, p));
          player.group.rotation.y = balanceReverse ? 0 : Math.PI;
          player.leftArm.rotation.z = -1.22;
          player.rightArm.rotation.z = 1.22;
          player.head.rotation.x = .09;
          if (stage.kind === 'walk' && !reducedMotion.matches) {
            const stride = Math.sin((time - stage.since) * .014) * .34;
            player.leftLeg.rotation.x = stride;
            player.rightLeg.rotation.x = -stride;
            player.body.position.y = Math.abs(stride) * .16;
          } else if (stage.kind === 'fall') {
            const drop = THREE.MathUtils.smoothstep(time - stage.since, 0, 650);
            pos.x += (balanceReverse ? -1 : 1) * (reducedMotion.matches ? 0 : 1.15 * drop);
            pos.y = THREE.MathUtils.lerp(pos.y, .22, drop);
            player.group.rotation.z = reducedMotion.matches ? 0 : -1.36 * drop;
            player.leftArm.rotation.z = -1.22 + drop * .6;
            player.rightArm.rotation.z = 1.22 - drop * .6;
          } else if (!reducedMotion.matches) {
            player.body.rotation.z = Math.sin(time * .006) * .055;
          }
        }
      } else if (districtActive) {
        districtElapsed+=dt;
        const p=Math.min(1,districtElapsed/districtActive.seconds), t=reducedMotion.matches?0:time/1000;
        districtProgress=p;
        player.group.rotation.y=Math.atan2(districtActive.look.x-pos.x,districtActive.look.z-pos.z);
        player.body.rotation.x=.035;
        player.leftArm.rotation.x=-.62;player.elbows[0].rotation.x=-.65;player.rightArm.rotation.x=-1.05-(reducedMotion.matches?0:Math.sin(t*4)*.17);player.elbows[1].rotation.x=-.35;player.head.rotation.x=.1;
        if(p>=1){districtComplete=districtActive.id;callbacks.current.onDistrictComplete?.(districtActive.id);releaseDistrict();}
      }
      feedCup.visible=!!districtActive&&districtActive.id.startsWith('feed-');
      if(districtActive){
        const station=districtActive,aim=focusTarget.set((pos.x+station.look.x)/2,.8,(pos.z+station.look.z)/2);
        camera.position.lerp(focusPosition.copy(aim).add(new THREE.Vector3(-10,13,18)),cameraEase);controls.target.lerp(aim,cameraEase);camera.zoom=THREE.MathUtils.lerp(camera.zoom,host.clientWidth<600?3:2.4,cameraEase);camera.lookAt(controls.target);camera.updateProjectionMatrix();
      }
      districts.update(time/1000,reducedMotion.matches,districtActive?.id||districtComplete,districtProgress,callbacks.current.pets);
      if(time-lastDistrictFrame>100){
        const station=districtActive||districtNear;
        const run = station?.id === 'balance' ? balanceRun ?? balanceResult : null;
        const remaining = run?.stage.kind === 'quiz' ? Math.max(0, Math.ceil((run.stage.deadline-time)/1000)) : 0;
        const frame:DistrictFrame|null=canPractise&&station?{id:station.id,title:station.title,instruction:districtComplete===station.id?station.done:station.instruction,sentence:station.sentence,verb:station.verb,percent:Math.round(districtProgress*100),busy:!!districtActive,done:districtComplete===station.id,balance:run?{run,remaining}:undefined}:null;
        const signature=JSON.stringify(frame);if(signature!==lastDistrictSignature){setDistrictFrame(frame);lastDistrictSignature=signature;}lastDistrictFrame=time;
      }
      for (const [id,npc] of Object.entries(environment.npcs)) {
        if (!conversationPlace && !photoSession && !overviewMode && npc.group.position.distanceToSquared(controls.target)>42**2) continue;
        updateCharacterDetail(npc, npc.group.position.distanceToSquared(controls.target), !!conversationPlace || !!photoSession);
        animateCharacter(npc,time/1000,callbacks.current.speaking===id,reducedMotion.matches);
      }
      if (!route.length) destination.visible = false;
      selection.position.set(pos.x, pos.y+.02, pos.z);
      if (
        !districtActive && !studying && !workKind && !photoSession && !conversationPlace && !returningFromConversation && !overviewMode &&
        (followPlayer || Math.abs(pos.x) > 10 || Math.abs(pos.z) > 9)
      ) {
        followPlayer = true;
        const target = new THREE.Vector3(pos.x, 0, pos.z);
        const delta = target
          .sub(controls.target)
          .multiplyScalar(1 - Math.exp(-dt * 5));
        controls.target.add(delta);
        camera.position.add(delta);
      }
      sun.target.position.set(
        photoSession ? controls.target.x : overviewMode ? 0 : pos.x,
        0,
        photoSession ? controls.target.z : overviewMode ? 0 : pos.z,
      );
      sun.position.copy(sun.target.position).add(sunOffset);
      const fogShift = Math.max(0, camera.position.distanceTo(controls.target) - 55);
      fog.near = overviewMode ? camera.position.distanceTo(controls.target)+100 : 56 + fogShift;
      fog.far = overviewMode ? camera.position.distanceTo(controls.target)+300 : 155 + fogShift;
      if (time - lastMapUpdate > 180) {
        callbacks.current.onMove?.(pos.x, pos.z);
        host.dataset.playerX = pos.x.toFixed(2);
        host.dataset.playerZ = pos.z.toFixed(2);
        host.dataset.mapView = photoSession ? "photo" : conversationPlace ? "conversation" : overviewMode ? "overview" : "follow";
        const name = campusAreaName(pos);
        if (name !== lastArea) {
          lastArea = name;
          callbacks.current.onAreaChange?.(name);
        }
        lastMapUpdate = time;
      }
      let current: Place | null = null;
      for (const [id, place] of Object.entries(PLACES))
        if (
          Math.hypot(pos.x - place.position[0], pos.z - place.position[1]) <
          2.15
        )
          current = id as Place;
      if (current !== nearest) {
        nearest = current;
        callbacks.current.onNear(current);
      }
      let closestResident: CampusResident | null = null;
      let closestDistance = 2.35 ** 2;
      const canMeet = canPractise && !districtNear && !districtActive && !current && !nearbySportsVenue(pos.x, pos.z);
      for (const person of environment.residents) {
        const { rig, resident } = person;
        const from = resident.route[0], to = resident.route[1];
        const conversation = residentSession === resident;
        let walking = false;
        if (to && !reducedMotion.matches && !conversation) {
          const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
          const leg = length / .72, loop = (person.time += dt) % (2 * leg + 4.2);
          const reverse = loop >= leg + 2.1;
          const step = reverse ? loop - leg - 2.1 : loop;
          const fraction = Math.min(1, step / leg);
          const progress = reverse ? 1 - fraction : fraction;
          rig.group.position.x = THREE.MathUtils.lerp(from[0], to[0], progress);
          rig.group.position.z = THREE.MathUtils.lerp(from[1], to[1], progress);
          walking = step < leg;
          if (walking) rig.group.rotation.y = Math.atan2(to[0] - from[0], to[1] - from[1]) + (reverse ? Math.PI : 0);
        }
        const dx = pos.x - rig.group.position.x, dz = pos.z - rig.group.position.z;
        const distance = dx * dx + dz * dz;
        rig.group.visible = conversation || distance < 32 ** 2
          || (!!photoSession && rig.group.position.distanceToSquared(controls.target) < 36 ** 2);
        if (canMeet && distance < closestDistance) {
          closestDistance = distance;
          closestResident = resident;
        }
        if (!rig.group.visible) continue;
        rig.group.position.y = campusFloorHeight(rig.group.position);
        if (conversation || (!walking && distance < 4 ** 2)) rig.group.rotation.y = Math.atan2(dx, dz);
        updateCharacterDetail(rig, photoSession ? rig.group.position.distanceToSquared(controls.target) : distance, conversation || !!photoSession);
        animateCharacter(rig, time / 1000 + person.time * .19, conversation && residentSpeaking, reducedMotion.matches);
        const stride = walking ? Math.sin(person.time * 8) * .39 : 0;
        rig.leftLeg.rotation.x = stride;
        rig.rightLeg.rotation.x = -stride;
        rig.knees[0].rotation.x = Math.max(0, -stride);
        rig.knees[1].rotation.x = Math.max(0, stride);
        if (walking) {
          rig.body.position.y += Math.abs(stride) * .047;
          rig.body.rotation.z = stride * .039;
          rig.head.rotation.z -= stride * .026;
          rig.rightArm.rotation.x += stride * .48;
          if (!('prop' in CHARACTER_PROFILES[resident.kind])) rig.leftArm.rotation.x -= stride * .48;
        } else rig.body.rotation.z = 0;
      }
      if (residentNear !== closestResident) {
        residentNear = closestResident;
        setNearResident(closestResident);
      }
      const elapsed = time / 1000;
      if (!reducedMotion.matches) {
        environment.windUniform.value = elapsed;
        const cloth = environment.flag.geometry.attributes.position;
        for (let i = 0; i < cloth.count; i++) {
          const x = cloth.getX(i),
            y = cloth.getY(i),
            weight = (x + 0.825) / 1.65;
          cloth.setZ(i, Math.sin(x * 3.6 + elapsed * 2.4 + y) * 0.15 * weight);
        }
        cloth.needsUpdate = true;
        environment.flag.geometry.computeVertexNormals();
        environment.ripples.forEach((r, i) => {
          const phase = (elapsed * 0.45 + i / 3) % 1;
          r.scale.setScalar(1 + phase * 2.5);
          (r.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - phase);
        });
        environment.motes.position.y = Math.sin(elapsed * 0.4) * 0.2;
        environment.butterflies.forEach((b, i) => {
          b.position.y = 1.1 + i * 0.1 + Math.sin(elapsed * 1.4 + i) * 0.25;
          b.rotation.y = elapsed * 0.3 + i;
          b.children.forEach((wing, j) => {
            wing.rotation.y =
              (j ? 1 : -1) * (0.3 + Math.sin(elapsed * 12 + i) * 0.7);
          });
        });
      }
      for (const [id, marker] of Object.entries(environment.npcMarkers)) {
        (marker.material as THREE.MeshBasicMaterial).opacity =
          id === callbacks.current.objective ? 0.9 : 0.35;
        marker.scale.setScalar(
          id === callbacks.current.objective && !reducedMotion.matches
            ? 1 + Math.sin(elapsed * 2) * 0.07
            : 1,
        );
      }
      storyMarker.visible=!!callbacks.current.storyTarget&&!photoSession&&!workKind&&!conversationPlace;
      if(callbacks.current.storyTarget){const target=callbacks.current.storyTarget;storyMarker.position.set(target.x,campusFloorHeight(target)+.03,target.z);storyMarker.scale.setScalar(reducedMotion.matches?1:1+Math.sin(time*.002)*.05);}
      worldLabels.show(!conversationPlace && !photoSession && !workKind && !studying && !overviewMode && !districtActive && !residentSession);
      selection.visible = !conversationPlace && !photoSession;
      destination.visible = !photoSession && route.length > 0;
      worldLabels.paint(camera, pos);
      // Shadow matrices and articulated poses are rendered in the same frame.
      host.dataset.interior = environment.updateRooms(pos, overviewMode);
      renderFrame(time);
    });

    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener('pointerup',releaseActions);window.removeEventListener('pointercancel',releaseActions);window.removeEventListener('blur',releaseActions);document.removeEventListener('visibilitychange',visibilityWork);
      observer.disconnect();
      worldLabels.dispose();
      controls.dispose();
      workScene.dispose();
      competitionScene.dispose();
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", blur);
      renderer.domElement.removeEventListener("pointerdown", click);
      const geometries = new Set<THREE.BufferGeometry>();
      const allMaterials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          geometries.add(object.geometry);
          const mats = Array.isArray(object.material)
            ? object.material
            : [object.material];
          mats.forEach((m) => allMaterials.add(m));
        } else if (object instanceof THREE.Sprite)
          allMaterials.add(object.material);
      });
      const textures = new Set<THREE.Texture>();
      allMaterials.forEach((m) =>
        Object.values(m).forEach((value) => {
          if (value instanceof THREE.Texture) textures.add(value);
        }),
      );
      geometries.forEach((g) => g.dispose());
      textures.forEach((t) => { if (!t.userData.sharedCharacterAtlas) t.dispose(); });
      allMaterials.forEach((m) => m.dispose());
      window.clearTimeout(warmOverview);
      campusOverview?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      actionRef.current = emptyActions();
      districtHoldRef.current=()=>{};districtTravelRef.current=()=>{};balanceAnswerRef.current=()=>{};balanceCancelRef.current=()=>{};
    };
  }, [avatar, charactersReady]);
  useEffect(() => {
    actionRef.current.setQuality(highQuality);
  }, [highQuality, avatar, charactersReady]);

  const presentResident = talkingResident ?? nearResident;
  const residentStatus = presentResident ? completedChallenges?.includes(`resident/${presentResident.kind}`)
    ? 'complete' : residentMissions?.[presentResident.kind] : undefined;
  return (
    <div className="campus-world">
      <div className="world-canvas" ref={hostRef} aria-busy={!charactersReady} />
      {!charactersReady && <div className="world-fallback" role="status">Preparing your campus…</div>}
      <div className="world-labels" ref={labelsRef} inert={!!conversation || photoMode}>
        {DISTRICT_STATIONS.map(s=><button key={s.id} data-station={s.id} className="map-label district-world-label" onClick={()=>districtTravelRef.current(s.id)}>{s.title}<small>Walk here to practise</small></button>)}
        {SPORTS_VENUE_IDS.map(id=><button key={id} className="map-label zone-world-label competition-world-label" data-competition={id} onClick={()=>actionRef.current.goToRegistration(id)}>{SPORTS_VENUES[id].name}<small>Walk to registration</small></button>)}
        {EXPLORATION_ZONES.map((zone) => (
          <button
            key={zone.id}
            data-zone={zone.id}
            className="map-label zone-world-label"
            onClick={() => actionRef.current.goToZone(zone.id)}
          >
            {zone.name}
            <small>Khám phá khuôn viên</small>
          </button>
        ))}
        {(Object.keys(PLACES) as Place[]).map((id) => (
          <button
            key={id}
            data-place={id}
            onClick={() => actionRef.current.goTo(id)}
            className={`map-label label-${id} ${objective === id ? "label-objective" : ""}`}
          >
            {objective === id && <span className="quest-dot" aria-hidden="true" />}
            {PLACES[id].name}
            <small>{PLACES[id].npc}</small>
          </button>
        ))}
      </div>
      {enabled&&!workKind&&!photoMode&&!conversation&&districtFrame&&<DistrictPrompt key={districtFrame.id} frame={districtFrame} level={cadetRank} balanceTier={balanceTier} onBalanceTier={setPreferredBalanceTier} onHold={onDistrictHold} onAnswer={answer=>balanceAnswerRef.current(answer)} onCancel={()=>balanceCancelRef.current()}/>}
      {enabled && !workKind && !photoMode && !conversation && presentResident &&
        <ResidentPrompt key={`${presentResident.kind}-${!!talkingResident}`} resident={presentResident}
          open={!!talkingResident} status={residentStatus}
          onOpen={() => residentAction.current.open()} onClose={() => residentAction.current.close()} onVoice={onResidentVoice}
          onAccept={() => onResidentAccept(presentResident.kind)}
          onStart={() => { residentAction.current.close(); onResidentStart(presentResident.kind); }}
          onClaim={() => onResidentClaim(presentResident.kind)}/>}
      <div className="campus-nameplate">
        <span>PHÂN HIỆU 1</span>
        <small>Trường Thiếu sinh quân miền Trung</small>
      </div>
      <span
        className="world-fps"
        ref={fpsRef}
        aria-hidden="true"
        hidden={!enabled}
      />
    </div>
  );
});
