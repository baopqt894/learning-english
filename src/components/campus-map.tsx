"use client";

import { CORE_BUILDINGS, EXPANSION_BUILDINGS, EXPLORATION_ZONES, MAP_BOUNDS, type ZoneId } from "@/lib/campus-map";
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
}: {
  large?: boolean;
  near: Place | null;
  objective?: Place;
  onPlace: (place: Place) => void;
  onZone: (zone: ZoneId) => void;
}) {
  return (
    <div
      className={`campus-map-art ${large ? "campus-map-large" : ""}`}
      aria-label="Bản đồ toàn trường"
    >
      <svg className="campus-cartography" viewBox="0 0 720 600" role="img" aria-label="Sơ đồ khuôn viên theo tọa độ thực: phòng học phía bắc, nội trú phía tây, sân bóng phía đông và vườn học tập phía nam">
        <defs>
          <pattern id={large ? "atlas-grid-large" : "atlas-grid-mini"} width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="#698677" strokeOpacity=".12" strokeWidth="1" /></pattern>
        </defs>
        <rect width="720" height="600" fill="#dbe3cc" />
        <rect x="12" y="12" width="696" height="576" rx="20" fill="none" stroke="#96ae90" strokeWidth="2" strokeDasharray="5 6" />
        <rect width="720" height="600" fill={`url(#${large ? "atlas-grid-large" : "atlas-grid-mini"})`} />
        <g transform="translate(360 300) scale(10)">
          <rect x="-34" y="-28" width="16" height="42" rx="2" fill="#b4c5a0" opacity=".35"/>
          <rect x="-14" y="-29" width="48" height="15" rx="2" fill="#c6ccab" opacity=".45"/>
          <path d="M-11 21Q0 15 11 21L11 28H-11Z" fill="#aec19a" opacity=".6"/>
          <g fill="#6b8567">{[-15,15].flatMap(x=>[-16,-8,4,16].map(z=><circle key={`${x}-${z}`} cx={x+2.2} cy={z} r=".24"/>))}</g>
          <g fill="none" stroke="#f8f1dc" strokeWidth="3.2" strokeLinejoin="round">
            <path d="M-30-18H30M-30 18H30M-15-27V28M15-27V28M0-23V-7M-33 4H-15M0 8V28M-20-14V4" />
          </g>
          <rect x="-12" y="-5" width="24" height="14" rx=".6" fill="#e7d9ba" stroke="#c2b28e" strokeWidth=".2" />
          <path d="M-10 2H10M0-4V8" stroke="#f4ead2" strokeWidth=".15" strokeDasharray=".5 .5" />
          <g fill="#90af8b" stroke="#f8f1dc" strokeWidth=".3"><rect x="19" y="12" width="14" height="15" rx=".6" /><path d="M26 12V27" fill="none" /><circle cx="26" cy="19.5" r="2.2" fill="none" /><path d="M19 16H22V23H19M33 16H30V23H33" fill="none" /></g>
          <g fill="#b0c4a0"><rect x="-8" y="20" width="5" height="7" rx="1" /><rect x="3" y="20" width="5" height="7" rx="1" /></g>
          {[...CORE_BUILDINGS, ...EXPANSION_BUILDINGS].map((building, index) => <g key={index}>
            <rect x={building.x - building.w / 2 + .45} y={building.z - building.d / 2 + .65} width={building.w} height={building.d} rx=".4" fill="#536b5d" opacity=".16" />
            <rect x={building.x - building.w / 2} y={building.z - building.d / 2} width={building.w} height={building.d} rx=".4" fill={index % 3 === 0 ? "#b87960" : index % 3 === 1 ? "#d09b7b" : "#6f9589"} stroke="#fff5df" strokeWidth=".25" />
            <path d={`M${building.x - building.w / 2 + .5} ${building.z}h${building.w - 1}`} stroke="#fff1db" strokeOpacity=".55" strokeWidth=".15" />
            {Array.from({length: Math.floor(building.w / 1.7)}, (_, i) => <rect key={i} x={building.x - building.w / 2 + .7 + i * 1.7} y={building.z + building.d / 2 - .6} width=".7" height=".35" fill="#f8edcc" />)}
          </g>)}
          {Array.from({length: 42}, (_, i) => {
            const x = i < 20 ? -33 + i * 3.4 : i % 2 ? -33 : 33;
            const z = i < 20 ? (i % 2 ? -16 : 29) : -28 + (i - 20) * 2.5;
            return <g key={i}><circle cx={x + .3} cy={z + .3} r="1.2" fill="#688773" opacity=".22" /><circle cx={x} cy={z} r="1.1" fill={i % 3 ? "#739d7c" : "#a1b78c"} /><circle cx={x - .2} cy={z - .2} r=".55" fill="#bfd0a3" opacity=".6" /></g>;
          })}
          <circle cx="0" cy="-2" r=".6" fill="#bd775e" /><path d="M0-2V-4" stroke="#416d60" strokeWidth=".15" />
        </g>
        {large && <g className="cartography-labels" fill="#3e6556" textAnchor="middle" fontSize="11" fontWeight="600" letterSpacing="2"><text x="360" y="140">KHU HỌC TẬP</text><text x="94" y="125" transform="rotate(-90 94 125)">KHU NỘI TRÚ</text><text x="620" y="590">SÂN THỂ THAO</text><text x="360" y="495">VƯỜN HỌC TẬP</text></g>}
      </svg>
      {EXPLORATION_ZONES.map((zone) => (
        <button
          key={zone.id}
          data-zone={zone.id}
          className={`campus-map-pin zone-pin ${zone.z > 18 ? "pin-label-above" : ""}`}
          style={mapPosition(zone.x, zone.z)}
          aria-label={`Đi đến ${zone.name}`}
          title={zone.name}
          onClick={() => onZone(zone.id)}
        >
          <Icon name={zone.icon} size={large ? 18 : 11} />
          {large && (
            <span>
              {zone.name}
              <small>{zone.english}</small>
            </span>
          )}
        </button>
      ))}
      {(Object.keys(PLACES) as Place[]).map((id) => (
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
      {large && (
        <span className="atlas-compass" aria-hidden="true">
          N<Icon name="compass" size={32} />
        </span>
      )}
    </div>
  );
}
