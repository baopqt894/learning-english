"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { animateCharacter } from "@/lib/campus-character";
import { createCampusEnvironment } from "@/lib/campus-environment";
import { PLACES, type Place } from "@/lib/game";
import {
  MAP_BOUNDS,
  EXPLORATION_ZONES,
  canWalkCampus,
  campusAreaName,
  findCampusPath,
  type ZoneId,
} from "@/lib/campus-map";

export type WorldHandle = {
  goTo: (place: Place) => void;
  recenter: () => void;
  zoom: (delta: number) => void;
  setQuality: (high: boolean) => void;
  goToZone: (zone: ZoneId) => void;
  overview: () => void;
};
type Props = {
  avatar: number;
  enabled: boolean;
  objective?: Place;
  conversation?: Place | null;
  speaking?: Place | null;
  highQuality?: boolean;
  onNear: (place: Place | null) => void;
  onInteract: () => void;
  onMove?: (x: number, z: number) => void;
  onAreaChange?: (name: string) => void;
};
const emptyActions = (): WorldHandle => ({
  goTo: () => {},
  recenter: () => {},
  zoom: () => {},
  setQuality: () => {},
  goToZone: () => {},
  overview: () => {},
});

export const CampusWorld = forwardRef<WorldHandle, Props>(function CampusWorld(
  {
    avatar,
    enabled,
    objective,
    conversation = null,
    speaking = null,
    highQuality = true,
    onNear,
    onInteract,
    onMove,
    onAreaChange,
  },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<WorldHandle>(emptyActions());
  const fpsRef = useRef<HTMLSpanElement>(null);
  const callbacks = useRef({
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
      onNear,
      onInteract,
      enabled,
      objective,
      conversation,
      speaking,
      onMove,
      onAreaChange,
    };
  }, [onNear, onInteract, enabled, objective, conversation, speaking, onMove, onAreaChange]);
  useImperativeHandle(
    ref,
    () => ({
      goTo: (place) => actionRef.current.goTo(place),
      recenter: () => actionRef.current.recenter(),
      zoom: (delta) => actionRef.current.zoom(delta),
      setQuality: (high) => actionRef.current.setQuality(high),
      goToZone: (zone) => actionRef.current.goToZone(zone),
      overview: () => actionRef.current.overview(),
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
        "Thiết bị chưa hỗ trợ WebGL. Em vẫn có thể dùng các nút địa điểm bên dưới để khám phá và luyện hội thoại ở chế độ 2D.";
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    renderer.setClearColor(0xe7eee1, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.tabIndex = -1;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xd5dfca);
    scene.fog = new THREE.FogExp2(0xc1d3b8, 0.007);
    const camera = new THREE.OrthographicCamera(-15, 15, 12, -12, 0.1, 220);
    const controls = new OrbitControls(camera, renderer.domElement);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    controls.enableDamping = !reducedMotion.matches;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minZoom = 0.28;
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
      camera.position.set(x + 16, 21, z + 26);
      camera.zoom = 1.2;
      controls.target.set(x, 0, z);
      camera.lookAt(controls.target);
      camera.updateProjectionMatrix();
      controls.update();
    };
    resetCamera();
    scene.add(new THREE.HemisphereLight(0xfff8e7, 0x728d68, 1.8));
    const sun = new THREE.DirectionalLight(0xfff3d5, 2.5);
    sun.position.set(-12, 22, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.radius = 2;
    Object.assign(sun.shadow.camera, {
      left: -18,
      right: 18,
      top: 18,
      bottom: -18,
      far: 60,
    });
    sun.shadow.normalBias = 0.06;
    scene.add(sun);
    scene.add(sun.target);

    const environment = createCampusEnvironment(scene, avatar);
    const { floor, player, selection, destination } = environment;

    let conversationPlace: Place | null = null;
    let returningFromConversation = false;
    const savedCamera = { position: camera.position.clone(), target: controls.target.clone(), zoom: camera.zoom };
    const focusPosition = new THREE.Vector3();
    const focusTarget = new THREE.Vector3();
    let gait = 0, movementBlend = 0;
    let route: THREE.Vector3[] = [];
    let nearest: Place | null = null;
    let lastTime = 0;
    let lastShadowTime = 0;
    let frames = 0;
    let lastFpsTime = performance.now();
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
      destination.position.set(x, 0.15, z);
      destination.visible = true;
    };
    actionRef.current = {
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
        resetCamera(0, 0);
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
          Math.min(1.65 / (maxX - minX), 1.65 / (maxY - minY)),
          0.28,
          0.7,
        );
        camera.updateProjectionMatrix();
      },
      recenter: () => {
        overviewMode = false;
        followPlayer = true;
        resetCamera(player.group.position.x, player.group.position.z);
      },
      zoom: (delta) => {
        camera.zoom = THREE.MathUtils.clamp(camera.zoom + delta, 0.28, 2.4);
        camera.updateProjectionMatrix();
      },
      setQuality: (high) => {
        renderer.setPixelRatio(
          Math.min(window.devicePixelRatio, high ? 1.25 : 1),
        );
        renderer.shadowMap.enabled = high;
        renderer.shadowMap.needsUpdate = true;
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
      if (typing(event.target) || !callbacks.current.enabled) return;
      const key = event.key.toLowerCase();
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
    const keyup = (event: KeyboardEvent) =>
      keys.delete(event.key.toLowerCase());
    const blur = () => keys.clear();
    const click = (event: PointerEvent) => {
      if (!callbacks.current.enabled || event.button !== 0) return;
      renderer.domElement.focus({ preventScroll: true });
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(floor)[0];
      if (hit) walkTo(hit.point.x, hit.point.z);
    };
    const updateLabels = () => {
      const { width, height } = host.getBoundingClientRect();
      labels
        .querySelectorAll<HTMLElement>("[data-place],[data-zone]")
        .forEach((label) => {
          const place = label.dataset.place
            ? PLACES[label.dataset.place as Place]
            : undefined;
          const zone = EXPLORATION_ZONES.find(
            (z) => z.id === label.dataset.zone,
          );
          if (!place && !zone) return;
          vector
            .set(
              place ? place.position[0] : zone!.x,
              place ? 2.5 : 3.5,
              place ? place.position[1] : zone!.z,
            )
            .project(camera);
          label.style.display =
            (!overviewMode &&
              zone &&
              Math.hypot(
                player.group.position.x - zone.x,
                player.group.position.z - zone.z,
              ) > 17) ||
            Math.abs(vector.x) > 1.05 ||
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
      if (time - lastTime < (callbacks.current.enabled || callbacks.current.conversation ? 15 : 66)) return;
      const dt = Math.min((time - lastTime) / 1000, 0.08);
      lastTime = time;
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
          focusPosition.set(npcPosition.x + 7, 8, npcPosition.z + 13);
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
      controls.enabled = callbacks.current.enabled && !returningFromConversation;
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
      if (callbacks.current.enabled) {
        const horizontal =
          Number(keys.has("d") || keys.has("arrowright")) -
          Number(keys.has("a") || keys.has("arrowleft"));
        const vertical =
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
          const length = vector.length();
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
      const moving = distance > 0 && callbacks.current.enabled;
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
      for (const [id,npc] of Object.entries(environment.npcs)) {
        animateCharacter(npc,time/1000,callbacks.current.speaking===id,reducedMotion.matches);
      }
      if (!route.length) destination.visible = false;
      selection.position.set(pos.x, 0.15, pos.z);
      if (
        !conversationPlace && !returningFromConversation && !overviewMode &&
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
        overviewMode ? 0 : pos.x,
        0,
        overviewMode ? 0 : pos.z,
      );
      sun.position.set(
        sun.target.position.x - 12,
        22,
        sun.target.position.z + 8,
      );
      if (time - lastMapUpdate > 180) {
        callbacks.current.onMove?.(pos.x, pos.z);
        host.dataset.playerX = pos.x.toFixed(2);
        host.dataset.playerZ = pos.z.toFixed(2);
        host.dataset.mapView = conversationPlace ? "conversation" : overviewMode ? "overview" : "follow";
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
      labels.style.opacity = conversationPlace ? "0" : "1";
      selection.visible = !conversationPlace;
      updateLabels();
      if (time - lastShadowTime > 250) {
        renderer.shadowMap.needsUpdate = true;
        lastShadowTime = time;
      }
      renderer.render(scene, camera);
      frames++;
      if (time - lastFpsTime > 1000) {
        if (fpsRef.current)
          fpsRef.current.textContent = `${Math.round((frames * 1000) / (time - lastFpsTime))} FPS`;
        host.dataset.fps = String(
          Math.round((frames * 1000) / (time - lastFpsTime)),
        );
        host.dataset.drawCalls = String(renderer.info.render.calls);
        frames = 0;
        lastFpsTime = time;
      }
    });

    return () => {
      renderer.setAnimationLoop(null);
      observer.disconnect();
      controls.dispose();
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
    };
  }, [avatar]);
  useEffect(() => {
    actionRef.current.setQuality(highQuality);
  }, [highQuality, avatar]);

  return (
    <div className="campus-world">
      <div className="world-canvas" ref={hostRef} />
      <div className="world-labels" ref={labelsRef} inert={!!conversation}>
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
            <span className="quest-dot">{objective === id ? "!" : "·"}</span>
            {PLACES[id].name}
            <small>{PLACES[id].npc}</small>
          </button>
        ))}
      </div>
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
