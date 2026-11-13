"use client";

import {ATHLETICS_TRACK} from "@/lib/competition-catalog";
import { DISTRICT_PATHS,LIVESTOCK_PENS,FISH_POND,SWIMMING_POOL,TRAINING_GROUND,DISTRICT_STRUCTURES,TRAINING_EQUIPMENT } from '@/lib/campus-districts-layout';
import { CORE_BUILDINGS, EXPANSION_BUILDINGS, EXPLORATION_ZONES, MAP_BOUNDS, type ZoneId } from "@/lib/campus-map";
import { FARM_LAYOUT, SPORTS_FIELD, READING_PLANTERS, PERGOLA, CAMPUS_TREES } from "@/lib/campus-spaces";
import { PLACES, type Place } from "@/lib/game";
import { Icon } from "./icon";

export function mapPosition(x: number, z: number) {
  return {
    left: `${((x - MAP_BOUNDS.minX) / (MAP_BOUNDS.maxX - MAP_BOUNDS.minX)) * 100}%`,
    top: `${((z - MAP_BOUNDS.minZ) / (MAP_BOUNDS.maxZ - MAP_BOUNDS.minZ)) * 100}%`,
  };
}
export function CampusMap({
  large = false,
  near,
  objective,
  onPlace,
  onZone,
  onOpen,
  storyTarget,
}: {
  large?: boolean;
  near: Place | null;
  objective?: Place;
  onPlace: (place: Place) => void;
  onZone: (zone: ZoneId) => void;
  onOpen?: () => void;
  storyTarget?:{x:number;z:number};
}) {
  return (
    <div
      className={`campus-map-art ${large ? "campus-map-large" : ""}`}
      aria-label="Bản đồ toàn trường"
    >
      <svg className="campus-cartography" viewBox="0 0 1560 1460" role="img" aria-label="Campus atlas: classrooms, dormitories, garden, animal care, training ground, swimming pool and fish pond">
        <defs>
          <pattern id={large ? "atlas-grid-large" : "atlas-grid-mini"} width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="#698677" strokeOpacity=".12" strokeWidth="1" /></pattern>
        </defs>
        <rect width="1560" height="1460" fill="#dbe3cc" />
        <rect x="12" y="12" width="1536" height="1436" rx="20" fill="none" stroke="#96ae90" strokeWidth="2" strokeDasharray="5 6" />
        <rect width="1560" height="1460" fill={`url(#${large ? "atlas-grid-large" : "atlas-grid-mini"})`} />
        <g transform="translate(460 780) scale(10)">
          {DISTRICT_PATHS.map((p,i)=><rect key={`new-path-${i}`} x={p.x-p.w/2} y={p.z-p.d/2} width={p.w} height={p.d} fill="#f6efd8"/>)}
          <g aria-label="English running track"><rect x={ATHLETICS_TRACK.x-22} y={ATHLETICS_TRACK.z-4.5} width="44" height="9" fill="#b78b68"/>{[0,1,2,3,4].map(i=><path key={i} d={`M-21 ${-75+i*2}H21`} stroke="#f8edcc" strokeWidth=".08"/>)}<path d="M-20-75V-67M20-75V-67" stroke="#fff3cc" strokeWidth=".15"/></g>
          <rect x={TRAINING_GROUND.x-TRAINING_GROUND.w/2} y={TRAINING_GROUND.z-TRAINING_GROUND.d/2} width={TRAINING_GROUND.w} height={TRAINING_GROUND.d} rx=".5" fill="#c8b38b"/>
          {TRAINING_EQUIPMENT.map(e=><rect key={e.id} x={e.x-e.w/2} y={e.z-e.d/2} width={e.w} height={e.d} fill="#72805a"/>)}
          {LIVESTOCK_PENS.map(p=><g key={p.id}><rect x={p.x-p.w/2} y={p.z-p.d/2} width={p.w} height={p.d} fill="#c9b68e" stroke="#6c815d" strokeWidth=".18"/><rect x={p.x-p.w/2+.5} y={p.z-p.d/2+.5} width={p.w-1} height="2" fill="#6c896a"/></g>)}
          <rect x={FISH_POND.x-FISH_POND.w/2} y={FISH_POND.z-FISH_POND.d/2} width={FISH_POND.w} height={FISH_POND.d} rx=".5" fill="#7daca0" stroke="#c7b88d" strokeWidth=".6"/>
          <rect x={FISH_POND.x-4.5} y={FISH_POND.z+FISH_POND.d/2} width="7.5" height="5.4" fill="#b89a6a"/>
          <rect x={SWIMMING_POOL.x-SWIMMING_POOL.deckW/2} y={SWIMMING_POOL.z-SWIMMING_POOL.deckD/2} width={SWIMMING_POOL.deckW} height={SWIMMING_POOL.deckD} fill="#d7d1b7"/>
          <rect x={SWIMMING_POOL.x-SWIMMING_POOL.w/2} y={SWIMMING_POOL.z-SWIMMING_POOL.d/2} width={SWIMMING_POOL.w} height={SWIMMING_POOL.d} fill="#7eb7bc"/>
          {[1,2,3,4,5].map(i=><path key={i} d={`M${SWIMMING_POOL.x-SWIMMING_POOL.w/2} ${SWIMMING_POOL.z-SWIMMING_POOL.d/2+i*SWIMMING_POOL.d/6}h${SWIMMING_POOL.w}`} stroke="#eef1d5" strokeWidth=".15" strokeDasharray=".5 .3"/>)}
          {DISTRICT_STRUCTURES.map(b=><rect key={b.id} x={b.x-b.w/2} y={b.z-b.d/2} width={b.w} height={b.d} fill="#718b71" stroke="#f6efd8" strokeWidth=".2"/>)}
          <rect x="-34" y="-28" width="16" height="42" rx="2" fill="#b4c5a0" opacity=".35"/>
          <rect x="-14" y="-29" width="48" height="15" rx="2" fill="#c6ccab" opacity=".45"/>
          <path d="M-11 21Q0 15 11 21L11 28H-11Z" fill="#aec19a" opacity=".6"/>
          <g fill="#6b8567">{[-15,15].flatMap(x=>[-16,-8,4,16].map(z=><circle key={`${x}-${z}`} cx={x+2.2} cy={z} r=".24"/>))}</g>
          <rect x="-12" y="-5" width="24" height="14" rx=".6" fill="#e7d9ba" stroke="#c2b28e" strokeWidth=".2" />
          <path d="M-10 2H10M0-4V8" stroke="#f4ead2" strokeWidth=".15" strokeDasharray=".5 .5" />
          <g fill="#90af8b" stroke="#f8f1dc" strokeWidth=".3"><rect x={SPORTS_FIELD.x-SPORTS_FIELD.w/2} y={SPORTS_FIELD.z-SPORTS_FIELD.d/2} width={SPORTS_FIELD.w} height={SPORTS_FIELD.d}/><path d="M16 2H32"/><circle cx={SPORTS_FIELD.x} cy={SPORTS_FIELD.z} r="2.2" fill="none"/></g>
          {READING_PLANTERS.map(b=><rect key={b.x} x={b.x-b.w/2} y={b.z-b.d/2} width={b.w} height={b.d} rx=".5" fill="#b0c4a0"/>)}
          <rect x="-4.4" y={PERGOLA.centerZ-PERGOLA.depth/2} width="8.8" height={PERGOLA.depth} fill="#bda879" opacity=".65"/>
          <g aria-label="Khu tăng gia"><rect x={FARM_LAYOUT.bounds.minX} y={FARM_LAYOUT.bounds.minZ} width={FARM_LAYOUT.bounds.maxX-FARM_LAYOUT.bounds.minX} height={FARM_LAYOUT.bounds.maxZ-FARM_LAYOUT.bounds.minZ} fill="#b7ab7c" stroke="#57724c" strokeWidth=".2"/>
          <path d={`M${FARM_LAYOUT.gate.approach.x} ${FARM_LAYOUT.aisle.z}H${FARM_LAYOUT.tap.x}M${FARM_LAYOUT.sideAisle.x} ${FARM_LAYOUT.aisle.z}V${FARM_LAYOUT.harvest.z}`} stroke="#eee1c1" strokeWidth="1.5"/>
          {[...FARM_LAYOUT.beds,...FARM_LAYOUT.reserve].map((b,i)=><rect key={i} x={b.x-b.w/2} y={b.z-b.d/2} width={b.w} height={b.d} rx=".15" fill={i<3?"#7d6843":"#73964e"}/>)}
          <rect x={FARM_LAYOUT.shed.x-FARM_LAYOUT.shed.w/2} y={FARM_LAYOUT.shed.z-FARM_LAYOUT.shed.d/2} width={FARM_LAYOUT.shed.w} height={FARM_LAYOUT.shed.d} fill="#6a896e"/><rect x={FARM_LAYOUT.harvest.x-FARM_LAYOUT.harvest.w/2} y={FARM_LAYOUT.harvest.z-FARM_LAYOUT.harvest.d/2} width={FARM_LAYOUT.harvest.w} height={FARM_LAYOUT.harvest.d} fill="#a98a58"/><circle cx={FARM_LAYOUT.waterStore.x} cy={FARM_LAYOUT.waterStore.z} r=".7" fill="#82a69d"/>{FARM_LAYOUT.climbers.map(b=><rect key={b.x} x={b.x-b.w/2} y={b.z-b.d/2} width={b.w} height={b.d} fill="#6f8c50"/>)}<circle cx={FARM_LAYOUT.tap.x} cy={FARM_LAYOUT.tap.z} r=".45" fill="#7dabb5"/>
          <rect x={FARM_LAYOUT.nursery.x-FARM_LAYOUT.nursery.w/2} y={FARM_LAYOUT.nursery.z-FARM_LAYOUT.nursery.d/2} width={FARM_LAYOUT.nursery.w} height={FARM_LAYOUT.nursery.d} rx=".15" fill="#587a60"/>
          </g>
          {[...CORE_BUILDINGS, ...EXPANSION_BUILDINGS].map((building, index) => <g key={index}>
            <rect x={building.x - building.w / 2 + .45} y={building.z - building.d / 2 + .65} width={building.w} height={building.d} rx=".4" fill="#536b5d" opacity=".16" />
            <rect x={building.x - building.w / 2} y={building.z - building.d / 2} width={building.w} height={building.d} rx=".4" fill={index % 3 === 0 ? "#b87960" : index % 3 === 1 ? "#d09b7b" : "#6f9589"} stroke="#fff5df" strokeWidth=".25" />
            <path d={`M${building.x - building.w / 2 + .5} ${building.z}h${building.w - 1}`} stroke="#fff1db" strokeOpacity=".55" strokeWidth=".15" />
            {Array.from({length: Math.floor(building.w / 1.7)}, (_, i) => <rect key={i} x={building.x - building.w / 2 + .7 + i * 1.7} y={building.z + building.d / 2 - .6} width=".7" height=".35" fill="#f8edcc" />)}
          </g>)}
          {CAMPUS_TREES.map((t,i)=><g key={i}><circle cx={t.x+.3} cy={t.z+.3} r={t.scale} fill="#688773" opacity=".22"/><circle cx={t.x} cy={t.z} r={t.scale*.85} fill="#739d7c"/></g>)}
          {!large && EXPLORATION_ZONES.map(z=><circle key={z.id} cx={z.x} cy={z.z} r="1.2" fill="#476e50"/>)}
          {!large && Object.values(PLACES).map(p=><circle key={p.npc} cx={p.position[0]} cy={p.position[1]} r="1.3" fill="#d9b964"/>)}
          <circle cx="2.7" cy="-1.9" r=".6" fill="#bd775e" /><path d="M2.7-1.9V-3.9" stroke="#416d60" strokeWidth=".15" />
        </g>
        {large && <g transform="translate(460 780) scale(10)" className="cartography-labels" fill="#365f4b" textAnchor="middle" fontSize="1.6" fontWeight="600"><text x="0" y="-34">LEARNING QUARTER</text><text x="-39" y="7">DORMITORY</text><text x="0" y="-63">TRAINING GROUND</text><text x={SWIMMING_POOL.x} y={SWIMMING_POOL.z+SWIMMING_POOL.deckD/2+3}>SWIMMING POOL</text><text x={FISH_POND.x} y={FISH_POND.z-FISH_POND.d/2-2}>FISH POND</text><text x="75" y="55">ANIMAL CARE</text><text x={FARM_LAYOUT.center.x} y={FARM_LAYOUT.bounds.maxZ+3}>VEGETABLE GARDEN</text><text x="0" y="34">READING GARDEN</text></g>}
      </svg>
      {large && EXPLORATION_ZONES.map((zone) => (
        <button
          key={zone.id}
          data-zone={zone.id}
          className={`campus-map-pin zone-pin ${zone.z > 18 ? "pin-label-above" : ""}`}
          style={mapPosition(zone.x, zone.z)}
          aria-label={`Walk to ${zone.english}`}
          title={zone.english}
          onClick={() => onZone(zone.id)}
        >
          <Icon name={zone.icon} size={large ? 18 : 11} />
          {large && (
            <span>
              {zone.english}
              <small>{zone.name}</small>
            </span>
          )}
        </button>
      ))}
      {large && (Object.keys(PLACES) as Place[]).map((id) => (
        <button
          key={id}
          data-place={id}
          className={`campus-map-pin npc-pin ${objective === id ? "pin-objective" : ""} ${near === id ? "pin-near" : ""}`}
          style={mapPosition(...PLACES[id].position)}
          aria-label={`Đi đến ${PLACES[id].name}`}
          title={PLACES[id].name}
          onClick={() => onPlace(id)}
        >
          <Icon
            name={
              id === "library" ? "book" : id === "canteen" ? "food" : "user"
            }
            size={large ? 16 : 10}
          />
          {large && (
            <span>
              {PLACES[id].name}
              <small>{PLACES[id].npc}</small>
            </span>
          )}
        </button>
      ))}
      <span
        className="campus-map-player"
        style={mapPosition(0, 6)}
        title="Vị trí của em"
        aria-label="Vị trí của em"
      />
      {!large && onOpen && <button type="button" className="minimap-open" onClick={onOpen} aria-label="Open campus atlas" title="Open campus atlas"/>}
      {storyTarget&&<span className="campus-map-story-target" style={mapPosition(storyTarget.x,storyTarget.z)} title="Current English mission" aria-label="Current English mission"/>}
      {large && (
        <span className="atlas-compass" aria-hidden="true">
          N<Icon name="compass" size={32} />
        </span>
      )}
    </div>
  );
}
