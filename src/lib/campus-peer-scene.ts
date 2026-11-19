import * as THREE from 'three';
import { createCampusCharacter, animateCharacter, sampleCampusWalk, updateCharacterDetail, type CampusCharacter } from './campus-character';
import { campusFloorHeight, EXPANSION_BUILDINGS, type CampusPosition } from './campus-map';
import { roomContainsPlayer } from './campus-room-shell';
import { PRESENCE_TTL, type CampusPeer } from './campus-presence';

type Visitor = { rig: CampusCharacter; label: HTMLSpanElement; target: CampusPeer; room?: string; overlapAngle: number };

export function createCampusPeerScene(scene: THREE.Scene, host: HTMLElement, location: () => CampusPosition | null) {
  const visitors = new Map<string, Visitor>();
  const anchor = new THREE.Vector3();
  let disposed = false, lastSuccess = 0, timer = 0, away = false;
  let pending: AbortController | undefined;
  let previous: CampusPosition | null = null;

  function remove(id: string, visitor: Visitor) {
    visitor.label.remove();
    const group = visitor.rig.group;
    group.removeFromParent();
    const materials = new Set<THREE.Material>();
    group.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      if (object instanceof THREE.SkinnedMesh) object.skeleton.dispose();
      for (const mat of Array.isArray(object.material) ? object.material : [object.material]) materials.add(mat);
    });
    materials.forEach(mat => mat.dispose());
    visitors.delete(id);
  }

  function sync(peers: CampusPeer[]) {
    const ids = new Set(peers.map(peer => peer.id));
    for (const [id, visitor] of visitors) if (!ids.has(id)) remove(id, visitor);
    for (const peer of peers) {
      let visitor = visitors.get(peer.id);
      if (!visitor) {
        const rig = createCampusCharacter(peer.avatar === 1 ? 'linh' : 'cadet', true);
        rig.group.scale.setScalar(1.16);
        rig.group.position.set(peer.x, campusFloorHeight(peer), peer.z);
        rig.group.rotation.y = peer.heading;
        scene.add(rig.group);
        const label = document.createElement('span');
        label.className = 'campus-peer-name';
        label.textContent = peer.name;
        label.hidden = true;
        host.append(label);
        visitor = { rig, label, target: peer, overlapAngle: parseInt(peer.id.slice(0,4),16) / 65536 * Math.PI * 2 };
        visitors.set(peer.id, visitor);
      }
      visitor.target = peer;
      visitor.room = EXPANSION_BUILDINGS.find(b => roomContainsPlayer(b, peer))?.name;
    }
  }

  async function poll() {
    if (disposed || pending) return;
    window.clearTimeout(timer);
    let delay = 1400;
    try {
      if (document.hidden) return;
      const point = location();
      if (!point && away) return;
      const moving = !!(point && previous && Math.hypot(point.x - previous.x, point.z - previous.z) > .05);
      pending = new AbortController();
      const response = await fetch('/api/account', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'presence', position: point }),
        signal: AbortSignal.any([pending.signal, AbortSignal.timeout(7000)]),
      });
      if (!response.ok) throw new Error('Presence unavailable');
      const { peers } = await response.json() as { peers: CampusPeer[] };
      if (disposed) return;
      sync(peers);
      lastSuccess = performance.now();
      away = !point;
      previous = point;
      delay = moving ? 550 : 1550;
    } catch {
      delay = 3000;
    } finally {
      pending = undefined;
      if (!disposed) timer = window.setTimeout(poll, delay);
    }
  }
  timer = window.setTimeout(poll, 0);
  document.addEventListener('visibilitychange', poll);
  return {
    hide() {
      for (const {rig,label} of visitors.values()) { rig.group.visible = false; label.hidden = true; }
    },
    draw(camera: THREE.Camera, player: THREE.Vector3, interior: string, time: number, dt: number, reduced: boolean, labels: boolean) {
      if (!visitors.size) return;
      if (performance.now() - lastSuccess > PRESENCE_TTL) { sync([]); return; }
      const width = host.clientWidth, height = host.clientHeight;
      camera.updateMatrixWorld();
      for (const { rig, label, target, room, overlapAngle } of visitors.values()) {
        const pos = rig.group.position;
        // Players landing on the same spawn or task marker can still recognise one another.
        const spread = Math.max(0, 1 - Math.hypot(target.x-player.x, target.z-player.z));
        const x = target.x + Math.cos(overlapAngle)*spread;
        const z = target.z + Math.sin(overlapAngle)*spread;
        const distance = Math.hypot(x-pos.x,z-pos.z);
        const blend = distance > 12 ? 1 : 1 - Math.exp(-dt*4);
        pos.x += (x-pos.x)*blend;
        pos.z += (z-pos.z)*blend;
        pos.y = campusFloorHeight(pos);
        rig.group.rotation.y += Math.atan2(Math.sin(target.heading-rig.group.rotation.y),Math.cos(target.heading-rig.group.rotation.y))*blend;
        rig.group.visible = (room ?? 'outside') === interior;
        anchor.copy(pos); anchor.y += 2.85; anchor.project(camera);
        const onScreen = Math.abs(anchor.x)<1.08 && Math.abs(anchor.y)<1.1 && Math.abs(anchor.z)<=1 && rig.group.visible;
        label.hidden = !onScreen || !labels;
        if (!onScreen) continue;
        updateCharacterDetail(rig,pos.distanceToSquared(player));
        animateCharacter(rig,time/1000,false,reduced);
        if (!reduced && distance > .035) {
          const gait = Math.min(1,distance*2);
          const stride = Math.sin(time*.009)*.47*gait;
          rig.leftLeg.rotation.x = stride; rig.rightLeg.rotation.x = -stride;
          sampleCampusWalk(rig,time/1000,gait);
        } else { rig.leftLeg.rotation.x = 0; rig.rightLeg.rotation.x = 0; }
        if (!label.hidden) label.style.transform = `translate(${Math.round((anchor.x+1)*width/2)}px,${Math.round((1-anchor.y)*height/2)}px) translate(-50%,-100%)`;
      }
    },
    dispose() {
      disposed = true;
      pending?.abort();
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', poll);
      sync([]);
    },
  };
}
