"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {petForStation,type PetCare} from "@/lib/pet-care";
import {createCompetitionScene} from "@/lib/competition-scene";
import {COMPETITIONS,type CompetitionId} from "@/lib/competition-catalog";
import type {CompetitionView} from "./competition-arena";


import { DistrictPrompt } from './district-prompt';
import { createCampusDistricts } from '@/lib/campus-districts';
import { DISTRICT_STATIONS, BALANCE_START, BALANCE_END, type DistrictFrame, type DistrictStationId } from '@/lib/campus-districts-layout';
import { FARM_LAYOUT } from "@/lib/campus-spaces";
import { createFieldworkScene } from "@/lib/fieldwork-scene";
import { applyWork, freshFieldwork, nextWorkTask, WORK_STATIONS, type Fieldwork, type WorkKind, type Tool, type WorkFrame } from "@/lib/fieldwork";
import { animateCharacter } from "@/lib/campus-character";
import { createCampusEnvironment } from "@/lib/campus-environment";
import { PLACES, type Place } from "@/lib/game";
import { PHOTO_LIGHTS, photoCrop, type PhotoAdjustment, type PhotoCapture, type PhotoFormat, type PhotoLight } from "@/lib/campus-photo";
import {
  MAP_BOUNDS, STUDY_POSITION,
  EXPLORATION_ZONES,
  canWalkCampus,
  campusAreaName,
  campusFloorHeight,
  findCampusPath,
  type ZoneId,
} from "@/lib/campus-map";

export type WorldHandle = {
  enterCompetition:(mode:CompetitionId)=>void;
  fieldworkAvailable: () => boolean;
  goToWork: (station: string) => void;
  goToPractice:(id:DistrictStationId)=>void;
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
  capturePhoto: (format: PhotoFormat) => Promise<PhotoCapture | null>;
};
type Props = {
  pets?:PetCare;
  feedingPass?:{station:string;expiresAt:number}|null;
  onFeedingQuiz?:(station:DistrictStationId)=>void;
  swimOpen?:boolean;
  competitionView?:CompetitionView|null;
  onCompetition?:(mode:CompetitionId)=>void;
  storyTarget?:{x:number;z:number};
  onDistrictComplete?:(id:DistrictStationId)=>void;
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
  enterCompetition:()=>{},goToPractice:()=>{}, fieldworkAvailable: () => false, goToWork: () => {}, holdWork: () => {}, viewWork: () => {},
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
  capturePhoto: async () => null,
});

export const CampusWorld = forwardRef<WorldHandle, Props>(function CampusWorld(
  {
    pets,feedingPass,onFeedingQuiz,swimOpen=false,competitionView=null,onCompetition,storyTarget,onDistrictComplete, studying = false, fieldwork, workKind = null, workTool = "hands", onWorkCommit, onWorkFrame,
    avatar,
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
  const [districtFrame,setDistrictFrame]=useState<DistrictFrame|null>(null);
  const districtHoldRef=useRef<(hold:boolean)=>void>(()=>{});
  const districtTravelRef=useRef<(id:DistrictStationId)=>void>(()=>{});
  const onDistrictHold=useRef((hold:boolean)=>districtHoldRef.current(hold)).current;
  const hostRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<WorldHandle>(emptyActions());
  const fpsRef = useRef<HTMLSpanElement>(null);
  const callbacks = useRef({
    pets,feedingPass,onFeedingQuiz,swimOpen,competitionView,onCompetition,storyTarget,onDistrictComplete, studying, fieldwork, workKind, workTool, onWorkCommit, onWorkFrame,
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
      pets,feedingPass,onFeedingQuiz,swimOpen,competitionView,onCompetition,storyTarget,onDistrictComplete, studying, fieldwork, workKind, workTool, onWorkCommit, onWorkFrame,
      onNear,
      onInteract,
      enabled,
      objective,
      conversation,
      speaking,
      onMove,
      onAreaChange,
    };
  }, [pets,feedingPass,onFeedingQuiz,swimOpen,competitionView,onCompetition,storyTarget,onDistrictComplete,onNear, onInteract, enabled, objective, conversation, speaking, onMove, onAreaChange, fieldwork, workKind, workTool, onWorkCommit, onWorkFrame, studying]);
  useImperativeHandle(
    ref,
    () => ({
      enterCompetition:mode=>actionRef.current.enterCompetition(mode),
      goToPractice:id=>actionRef.current.goToPractice(id),
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
      adjustPhoto: (adjustment) => actionRef.current.adjustPhoto(adjustment),
      capturePhoto: (format) => actionRef.current.capturePhoto(format),
    }),
    [],
  );

  useEffect(() => {
    const host = hostRef.current;
    const labels = labelsRef.current;
    if (!host || !labels) return;
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

    const environment = createCampusEnvironment(scene, avatar);
    const { floor, player, selection, destination } = environment;
    const districts=createCampusDistricts(scene);
    const competitionScene=createCompetitionScene(scene);
    let wasSwimming=false;
    const swimCamera={position:new THREE.Vector3(),target:new THREE.Vector3(),zoom:1};
    const swimProjection=new THREE.Vector3(),swimShift=new THREE.Vector3(),swimRight=new THREE.Vector3(),swimUp=new THREE.Vector3();
    const feedCup=new THREE.Mesh(new THREE.CylinderGeometry(.1,.07,.13,16),new THREE.MeshStandardMaterial({color:0xb59b6e,roughness:.9}));
    feedCup.position.set(0,-.3,.04);feedCup.visible=false;player.elbows[0].add(feedCup);
    const feedPortion=new THREE.Mesh(new THREE.CylinderGeometry(.087,.087,.015,16),new THREE.MeshStandardMaterial({color:0xd5bc78,roughness:1}));feedPortion.position.y=.065;feedCup.add(feedPortion);
    const storyMarker=new THREE.Mesh(new THREE.RingGeometry(.67,.78,48),new THREE.MeshBasicMaterial({color:0xf0c866,side:THREE.DoubleSide}));storyMarker.rotation.x=-Math.PI/2;scene.add(storyMarker);
    const workScene = createFieldworkScene(scene,player);
    let holdingWork=false, workElapsed=0, lastWorkFrame=0, workWide=false;
    let wasStudying=false, studyElapsed=0;const studyStand=new THREE.Vector3();
    let workMessage='', lastWorkKind: WorkKind|null=null, workTaskKey='';
    let localWork=callbacks.current.fieldwork||freshFieldwork();
    let lastWorkInput=callbacks.current.fieldwork;
    workScene.update(localWork,null,'hands',0,false,0,reducedMotion.matches);workScene.study(false);
    let districtNear:typeof DISTRICT_STATIONS[number]|undefined, districtActive:typeof DISTRICT_STATIONS[number]|undefined;
    let districtElapsed=0,lastDistrictFrame=0,districtComplete:DistrictStationId|null=null,lastDistrictSignature='';
    const districtStart=new THREE.Vector3();
    const releaseDistrict=(completed=false)=>{
      if(districtActive?.id==='balance'){player.group.position.copy(districtStart);if(completed)player.group.position.z=districtStart.z < (BALANCE_START.z+BALANCE_END.z)/2 ? BALANCE_START.z : BALANCE_END.z;player.body.rotation.set(0,0,0);}
      if(districtActive){player.leftArm.rotation.z=-.085;player.rightArm.rotation.z=.085;player.leftArm.rotation.x=player.rightArm.rotation.x=0;}
      districtActive=undefined;districtElapsed=0;
    };
    districtHoldRef.current=hold=>{
      if(!hold){releaseDistrict();return;}
      if(!districtNear||!callbacks.current.enabled||callbacks.current.workKind||callbacks.current.studying||callbacks.current.conversation||photoSession)return;
      if(petForStation(districtNear.id)&&!(callbacks.current.feedingPass?.station===districtNear.id&&callbacks.current.feedingPass.expiresAt>Date.now())){callbacks.current.onFeedingQuiz?.(districtNear.id);return;}
      districtActive=districtNear;districtElapsed=0;districtComplete=null;districtStart.copy(player.group.position);route=[];keys.clear();destination.visible=false;
    };
    const releaseActions=()=>{releaseWork();releaseDistrict();};
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
    let gait = 0, movementBlend = 0;
    let route: THREE.Vector3[] = [];
    let nearest: Place | null = null;
    let lastTime = 0;
    let frames = 0;
    let lastFpsTime = performance.now();
    let slowFrameWindows=0;
    let lastMapUpdate = 0;
    let lastArea = "";
    const keys = new Set<string>();
    const vector = new THREE.Vector3();
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
      route = path.map((p) => new THREE.Vector3(p.x, 0.13, p.z));
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
      enterCompetition:mode=>{const point=COMPETITIONS[mode].arrival;if(canWalkCampus(point.x,point.z)){player.group.position.set(point.x,campusFloorHeight(point),point.z);route=[];keys.clear();resetCamera(point.x,point.z);}},
      goToPractice:id=>districtTravelRef.current(id),
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
        overviewMode = true;
        followPlayer = false;
        route = [];
        destination.visible = false;
        frameCampus();
      },
      beginPhoto,
      endPhoto,
      framePhoto,
      lightPhoto,
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
      if (photoSession || typing(event.target) || !callbacks.current.enabled) return;
      const key = event.key.toLowerCase();
      if(callbacks.current.workKind && key===' '){event.preventDefault();if(!event.repeat)actionRef.current.holdWork(true);return;}
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
      if (key === "e" && !event.repeat && nearest)
        callbacks.current.onInteract();
    };
    const keyup = (event: KeyboardEvent) => {
      keys.delete(event.key.toLowerCase());if(event.key===' ')releaseWork();if(event.key.toLowerCase()==='e')releaseDistrict();
    };
    const blur = () => keys.clear();
    const click = (event: PointerEvent) => {
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
    const updateLabels = () => {
      const { width, height } = host.getBoundingClientRect();
      labels
        .querySelectorAll<HTMLElement>("[data-place],[data-zone],[data-station],[data-competition]")
        .forEach((label) => {
          const place = label.dataset.place
            ? PLACES[label.dataset.place as Place]
            : undefined;
          const zone = EXPLORATION_ZONES.find(
            (z) => z.id === label.dataset.zone,
          );
          if(zone&&['athletics','field-games','swimming'].includes(zone.id)){label.style.display='none';return;}
          const station=DISTRICT_STATIONS.find(s=>s.id===label.dataset.station);
          const contest=label.dataset.competition?COMPETITIONS[label.dataset.competition as CompetitionId].arrival:undefined;
          if (!place && !zone && !station && !contest) return;
          const destination=contest||zone||station;
          vector
            .set(
              place ? place.position[0] : destination!.x,
              place ? 2.5 : station?2.9:3.5,
              place ? place.position[1] : destination!.z,
            )
            .project(camera);
          const horizontalMargin = ((zone ? 65 : 46) * 2) / width;
          label.style.display =
            (station && Math.hypot(player.group.position.x-station.x,player.group.position.z-station.z)<1.3) ||
            (!overviewMode &&
              destination &&
              Math.hypot(
                player.group.position.x - destination.x,
                player.group.position.z - destination.z,
              ) > 17) ||
            Math.abs(vector.x) > 1 - horizontalMargin ||
            Math.abs(vector.y) > 1.05 ||
            vector.z > 1
              ? "none"
              : "flex";
          label.style.left = `${((vector.x + 1) * width) / 2}px`;
          label.style.top = `${((-vector.y + 1) * height) / 2}px`;
        });
    };
    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      const aspect = width / height;
      const halfHeight = Math.max(12.1, 14 / aspect);
      camera.left = -halfHeight * aspect;
      camera.right = halfHeight * aspect;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      if(overviewMode)frameCampus();
      renderer.setSize(width, height);
      updateLabels();
      renderer.render(scene, camera);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", blur);
    renderer.domElement.addEventListener("pointerdown", click);
    renderer.setAnimationLoop((time) => {
      if (document.hidden) {
        lastTime = time;
        return;
      }
      if (time - lastTime < (callbacks.current.enabled || callbacks.current.swimOpen || callbacks.current.conversation || callbacks.current.studying || photoSession ? 15 : 66)) return;
      const dt = Math.min((time - lastTime) / 1000, 0.08);
      lastTime = time;
      if(lastWorkInput!==callbacks.current.fieldwork){lastWorkInput=callbacks.current.fieldwork;localWork=lastWorkInput||freshFieldwork();}
      const workKind=callbacks.current.workKind||null;
      if(workKind!==lastWorkKind){releaseWork();lastWorkKind=workKind;keys.clear();if(!workKind){route=[];}if(!workKind)resetCamera(player.group.position.x,player.group.position.z);}
      if(!callbacks.current.enabled){releaseWork();releaseDistrict();}
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
          player.group.visible = false;
          returningFromConversation = false;
        } else {
          player.group.visible = true;
          returningFromConversation = true;
        }
        conversationPlace = activeConversation;
      }
      if (!callbacks.current.enabled) keys.clear();
      controls.enabled = (callbacks.current.enabled || !!photoSession) && !returningFromConversation;
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
      let dx = 0,
        dz = 0;
      let routeDistance = Infinity;
      if (callbacks.current.enabled && !photoSession) {
        const horizontal = holdingWork||districtActive ? 0 :
          Number(keys.has("d") || keys.has("arrowright")) -
          Number(keys.has("a") || keys.has("arrowleft"));
        const vertical = holdingWork||districtActive ? 0 :
          Number(keys.has("w") || keys.has("arrowup")) -
          Number(keys.has("s") || keys.has("arrowdown"));
        camera.getWorldDirection(cameraForward);
        cameraForward.y = 0;
        cameraForward.normalize();
        cameraRight.crossVectors(cameraForward, camera.up).normalize();
        dx = horizontal * cameraRight.x + vertical * cameraForward.x;
        dz = horizontal * cameraRight.z + vertical * cameraForward.z;
        if (route.length && !horizontal && !vertical) {
          vector.copy(route[0]).sub(pos);
          const length = Math.hypot(vector.x, vector.z);
          routeDistance = length;
          if (length < 0.12) route.shift();
          else {
            dx = vector.x / length;
            dz = vector.z / length;
          }
        }
      }
      const distance = Math.hypot(dx, dz);
      if (distance) {
        const step = Math.min(
          dt * (keys.has("shift") ? 9 : route.length ? 6 : 5),
          routeDistance,
        );
        const nextX = pos.x + (dx / distance) * step;
        const nextZ = pos.z + (dz / distance) * step;
        if (canWalk(nextX, nextZ)) pos.set(nextX, 0.13, nextZ);
        else if (canWalk(nextX, pos.z)) pos.x = nextX;
        else if (canWalk(pos.x, nextZ)) pos.z = nextZ;
        else {
          route = [];
          destination.visible = false;
        }
        const desiredAngle = Math.atan2(dx, dz);
        const turn = Math.atan2(Math.sin(desiredAngle - player.group.rotation.y), Math.cos(desiredAngle - player.group.rotation.y));
        player.group.rotation.y += turn * (1 - Math.exp(-dt * 14));
      }
      pos.y=campusFloorHeight(pos);
      const moving = distance > 0 && callbacks.current.enabled && !photoSession;
      movementBlend = THREE.MathUtils.lerp(movementBlend, moving ? 1 : 0, 1 - Math.exp(-dt * 12));
      const running = keys.has("shift");
      animateCharacter(player,time/1000,false,reducedMotion.matches);
      if (!reducedMotion.matches) {
        gait += dt * (running ? 15 : 10);
        const stride = Math.sin(gait) * movementBlend;
        player.leftLeg.rotation.x = stride * (running ? 0.75 : 0.48);
        player.rightLeg.rotation.x = -player.leftLeg.rotation.x;
        player.knees[0].rotation.x = Math.max(0,-stride) * (running ? .85 : .55);
        player.knees[1].rotation.x = Math.max(0,stride) * (running ? .85 : .55);
        player.leftArm.rotation.x = -stride * 0.52;
        player.rightArm.rotation.x = stride * 0.52;
        player.body.position.y = Math.abs(Math.cos(gait)) * 0.055 * movementBlend + Math.sin(time * 0.002) * 0.012 * (1 - movementBlend);
        player.body.rotation.z = stride * 0.025;
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
      workScene.update(localWork,workKind,callbacks.current.workTool||'hands',actionPercent,holdingWork,time/1000,reducedMotion.matches);
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
      if(districtActive){
        districtElapsed+=dt;const p=Math.min(1,districtElapsed/districtActive.seconds),t=reducedMotion.matches?0:time/1000;
        player.group.rotation.y=Math.atan2(districtActive.look.x-pos.x,districtActive.look.z-pos.z);
        player.body.rotation.x=.035;
        if(districtActive.id==='balance'){
          pos.set(BALANCE_START.x,.13+Math.sin(Math.min(1,p*5)*Math.PI/2)*.42,THREE.MathUtils.lerp(districtStart.z < -43 ? -47 : -38.5,districtStart.z < (BALANCE_START.z+BALANCE_END.z)/2 ? BALANCE_START.z : BALANCE_END.z,p));
          if(p>.85)pos.y=THREE.MathUtils.lerp(.55,.13,(p-.85)/.15);
          player.group.rotation.y=districtStart.z < (BALANCE_START.z+BALANCE_END.z)/2 ? 0 : Math.PI;player.leftArm.rotation.z=-1.22;player.rightArm.rotation.z=1.22;
          player.leftLeg.rotation.x=Math.sin(t*7)*.18;player.rightLeg.rotation.x=-player.leftLeg.rotation.x;player.head.rotation.x=.09;
        }else {player.leftArm.rotation.x=-.62;player.elbows[0].rotation.x=-.65;player.rightArm.rotation.x=-1.05-(reducedMotion.matches?0:Math.sin(t*4)*.17);player.elbows[1].rotation.x=-.35;player.head.rotation.x=.1;}
        if(p>=1){districtComplete=districtActive.id;callbacks.current.onDistrictComplete?.(districtActive.id);releaseDistrict(true);}
      }
      const districtProgress=districtActive?Math.min(1,districtElapsed/districtActive.seconds):districtComplete?1:0;
      feedCup.visible=!!districtActive&&districtActive.id.startsWith('feed-');
      if(districtActive){
        const station=districtActive,aim=focusTarget.set((pos.x+station.look.x)/2,.8,(pos.z+station.look.z)/2);
        camera.position.lerp(focusPosition.copy(aim).add(new THREE.Vector3(-10,13,18)),cameraEase);controls.target.lerp(aim,cameraEase);camera.zoom=THREE.MathUtils.lerp(camera.zoom,host.clientWidth<600?3:2.4,cameraEase);camera.lookAt(controls.target);camera.updateProjectionMatrix();
      }
      districts.update(time/1000,reducedMotion.matches,districtActive?.id||districtComplete,districtProgress,callbacks.current.pets);
      if(time-lastDistrictFrame>100){
        const station=districtActive||districtNear;
        const frame:DistrictFrame|null=canPractise&&station?{id:station.id,title:station.title,instruction:districtComplete===station.id?station.done:station.instruction,sentence:station.sentence,verb:station.verb,percent:Math.round(districtProgress*100),busy:!!districtActive,done:districtComplete===station.id}:null;
        const signature=JSON.stringify(frame);if(signature!==lastDistrictSignature){setDistrictFrame(frame);lastDistrictSignature=signature;}lastDistrictFrame=time;
      }
      for (const [id,npc] of Object.entries(environment.npcs)) {
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
      const swimming=!!callbacks.current.swimOpen;
      if(swimming&&!wasSwimming){
        swimCamera.position.copy(camera.position);swimCamera.target.copy(controls.target);swimCamera.zoom=camera.zoom;
        route=[];keys.clear();releaseDistrict();
      }
      if(!swimming&&wasSwimming){
        player.group.visible=true;camera.position.copy(swimCamera.position);controls.target.copy(swimCamera.target);camera.zoom=swimCamera.zoom;camera.lookAt(controls.target);camera.updateProjectionMatrix();
      }
      wasSwimming=swimming;
      if(swimming){
        player.group.visible=false;
        const view=callbacks.current.competitionView,definition=COMPETITIONS[view?.mode??'swimming'];
        const frame:{x:number;z:number;w:number;d:number}={x:definition.x,z:definition.z,w:definition.w,d:definition.d};
        const landscape=host.clientHeight<=620&&host.clientWidth>600;
        if(view?.room?.phase==='lobby'){if(definition.id==='swimming'){frame.x=65;frame.w=18;frame.d=20;}else if(definition.axis==='x'){frame.x=0;frame.z=-65.8;frame.w=18;frame.d=6;}else{frame.x=40;frame.z=6;frame.w=8;frame.d=17;}}
        competitionScene.update(view??null,Date.now()+(view?.clockOffset??0),reducedMotion.matches);
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
      }else competitionScene.update(null,Date.now(),true);
      storyMarker.visible=!!callbacks.current.storyTarget&&!photoSession&&!workKind&&!conversationPlace&&!swimming;
      if(callbacks.current.storyTarget){const target=callbacks.current.storyTarget;storyMarker.position.set(target.x,campusFloorHeight(target)+.03,target.z);storyMarker.scale.setScalar(reducedMotion.matches?1:1+Math.sin(time*.002)*.05);}
      labels.style.opacity = conversationPlace || photoSession || workKind || studying || overviewMode || swimming ? "0" : "1";
      labels.style.visibility = conversationPlace || photoSession || workKind || studying || overviewMode || swimming ? "hidden" : "visible";
      selection.visible = !conversationPlace && !photoSession && !swimming;
      destination.visible = !photoSession && route.length > 0;
      if (!photoSession) updateLabels();
      // Shadow matrices and articulated poses are rendered in the same frame.
      host.dataset.interior = environment.updateRooms(pos, overviewMode);
      renderer.render(scene, camera);
      frames++;
      if (time - lastFpsTime > 1000) {
        if (fpsRef.current)
          fpsRef.current.textContent = `${Math.round((frames * 1000) / (time - lastFpsTime))} FPS`;
        host.dataset.fps = String(
          Math.round((frames * 1000) / (time - lastFpsTime)),
        );
        const measuredFps=(frames*1000)/(time-lastFpsTime);
        if((callbacks.current.enabled||callbacks.current.swimOpen)&&!photoSession){slowFrameWindows=measuredFps<38?slowFrameWindows+1:0;if(slowFrameWindows>=3&&renderer.getPixelRatio()>1){renderer.setPixelRatio(1);environment.grassDetail.visible=false;host.dataset.performance='balanced';slowFrameWindows=0;}}
        host.dataset.triangles = String(renderer.info.render.triangles);
        host.dataset.drawCalls = String(renderer.info.render.calls);
        frames = 0;
        lastFpsTime = time;
      }
    });

    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener('pointerup',releaseActions);window.removeEventListener('pointercancel',releaseActions);window.removeEventListener('blur',releaseActions);document.removeEventListener('visibilitychange',visibilityWork);
      observer.disconnect();
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
      textures.forEach((t) => t.dispose());
      allMaterials.forEach((m) => m.dispose());
      renderer.dispose();
      renderer.domElement.remove();
      actionRef.current = emptyActions();
      districtHoldRef.current=()=>{};districtTravelRef.current=()=>{};
    };
  }, [avatar]);
  useEffect(() => {
    actionRef.current.setQuality(highQuality);
  }, [highQuality, avatar]);

  return (
    <div className="campus-world">
      <div className="world-canvas" ref={hostRef} />
      <div className="world-labels" ref={labelsRef} inert={!!conversation || photoMode}>
        {DISTRICT_STATIONS.map(s=><button key={s.id} data-station={s.id} className="map-label district-world-label" onClick={()=>districtTravelRef.current(s.id)}>{s.title}<small>Walk here to practise</small></button>)}
        {(['swimming','sprint','sack'] as CompetitionId[]).map(id=><button key={`race-${id}`} className="map-label zone-world-label competition-world-label" data-competition={id} onClick={()=>onCompetition?.(id)}>{COMPETITIONS[id].title}<small>Join an English competition</small></button>)}
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
      {enabled&&!workKind&&!photoMode&&!conversation&&districtFrame&&<DistrictPrompt frame={districtFrame} onHold={onDistrictHold}/>}
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
