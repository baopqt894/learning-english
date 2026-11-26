import { Matrix4, Vector3, type Camera } from 'three';
import { EXPLORATION_ZONES, type MapPoint } from './campus-map';
import { DISTRICT_STATIONS } from './campus-districts-layout';
import { PLACES, type Place } from './game';
import { nearbySportsVenue, SPORTS_VENUES, type SportsVenueId } from './sports-layout';

export function createCampusWorldLabels(layer: HTMLElement) {
  const view = new Matrix4();
  const previousView = new Matrix4();
  const projected = new Vector3();
  let viewportWidth = 0, viewportHeight = 0;
  let lastX = NaN, lastZ = NaN, dirty = true;
  const labels = new Map<Element, {
    element: HTMLElement;
    anchor: Vector3;
    destination?: MapPoint;
    station: boolean;
    venue?: SportsVenueId;
    width: number;
    height: number;
    visible: boolean;
    left: number;
    top: number;
  }>();

  const sizes = new ResizeObserver(entries => {
    for (const { target, borderBoxSize, contentRect } of entries) {
      const label = labels.get(target);
      const width = borderBoxSize?.[0]?.inlineSize ?? contentRect.width;
      const height = borderBoxSize?.[0]?.blockSize ?? contentRect.height;
      if (!label || !width || !height) continue;
      label.width = width;
      label.height = height;
      dirty = true;
    }
  });
  for (const element of layer.querySelectorAll<HTMLElement>('.map-label')) {
    const id = element.dataset.place as Place | undefined;
    const place = id ? PLACES[id] : undefined;
    const zone = EXPLORATION_ZONES.find(z => z.id === element.dataset.zone);
    if (zone && ['athletics', 'field-games', 'swimming'].includes(zone.id)) continue;
    const station = DISTRICT_STATIONS.find(s => s.id === element.dataset.station);
    const venue = element.dataset.competition as SportsVenueId | undefined;
    const destination = (venue ? SPORTS_VENUES[venue].desk : undefined) ?? zone ?? station;
    if (!place && !destination) continue;
    const { x, z } = place ? { x: place.position[0], z: place.position[1] } : destination!;
    labels.set(element, {
      element, destination, station: !!station, venue,
      anchor: new Vector3(x, place ? 2.5 : station ? 2.9 : 3.5, z),
      width: 0, height: 0, visible: false, left: NaN, top: NaN,
    });
    element.style.visibility = 'hidden';
    element.style.display = 'flex';
    sizes.observe(element, { box: 'border-box' });
  }

  function show(visible: boolean) {
    if (layer.hidden === !visible) return;
    layer.hidden = !visible;
    dirty = true;
  }

  return {
    show,
    resize(width: number, height: number) {
      viewportWidth = width;
      viewportHeight = height;
      dirty = true;
    },
    paint(camera: Camera, player: MapPoint) {
      if (layer.hidden || !viewportWidth || !viewportHeight) return;
      // Use the exact camera pose that the renderer will use for this frame.
      camera.updateMatrixWorld();
      view.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      if (!dirty && lastX === player.x && lastZ === player.z && previousView.equals(view)) return;
      lastX = player.x;
      lastZ = player.z;
      previousView.copy(view);
      dirty = false;

      const nearbyVenue = nearbySportsVenue(player.x, player.z);
      // The two feeding stations across an aisle project to almost the same pixels.
      let nearestFeed: HTMLElement | undefined;
      let nearestDistance=Infinity;
      for(const label of labels.values()){
        if(!label.element.dataset.station?.startsWith('feed-'))continue;
        const distance=(label.anchor.x-player.x)**2+(label.anchor.z-player.z)**2;
        if(distance<nearestDistance){nearestFeed=label.element;nearestDistance=distance;}
      }
      for (const label of labels.values()) {
        const { element, destination, anchor, width, height } = label;
        let visible = width > 0 && height > 0 && (!element.dataset.station?.startsWith('feed-') || element===nearestFeed);
        if (destination) {
          const distance = Math.hypot(player.x - destination.x, player.z - destination.z);
          visible &&= distance <= (label.visible ? 18 : 17) &&
            !(label.station && distance < 1.3) &&
            !(label.venue && label.venue === nearbyVenue);
        }
        if (visible) {
          projected.copy(anchor).applyMatrix4(view);
          const left = Math.round((projected.x + 1) * viewportWidth / 2 - width / 2);
          const top = Math.round((1 - projected.y) * viewportHeight / 2 - height);
          const padding = label.visible ? 0 : 4;
          visible = projected.z >= -1 && projected.z <= 1 &&
            left >= padding && left + width <= viewportWidth - padding &&
            top >= padding && top + height <= viewportHeight - padding;
          if (visible) {
            if (left !== label.left) element.style.left = `${left}px`;
            if (top !== label.top) element.style.top = `${top}px`;
            label.left = left;
            label.top = top;
          }
        }
        if (visible !== label.visible) {
          label.visible = visible;
          element.style.visibility = visible ? 'visible' : 'hidden';
        }
      }
    },
    dispose() { sizes.disconnect(); },
  };
}
