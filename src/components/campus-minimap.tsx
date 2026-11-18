import { memo, useId } from "react";
import { CORE_BUILDINGS, EXPANSION_BUILDINGS, MAP_BOUNDS, type MapPoint } from "@/lib/campus-map";
import { DISTRICT_PATHS, FISH_POND, LIVESTOCK_PENS, SWIMMING_POOL, TRAINING_GROUND } from "@/lib/campus-districts-layout";
import { CAMPUS_TREES, FARM_LAYOUT, READING_PLANTERS, SPORTS_FIELD } from "@/lib/campus-spaces";
import { STADIUM, TRACK_OUTER_RADIUS } from "@/lib/sports-layout";
import { Icon } from "./icon";

type Footprint = MapPoint & { w: number; d: number };
const width = 70;
const height = 42;
const campusGround = {
  x: MAP_BOUNDS.minX, y: MAP_BOUNDS.minZ,
  width: MAP_BOUNDS.maxX - MAP_BOUNDS.minX, height: MAP_BOUNDS.maxZ - MAP_BOUNDS.minZ,
};

function footprint({ x, z, w, d }: Footprint) {
  return { x: x - w / 2, y: z - d / 2, width: w, height: d };
}

export const CampusTerrain = memo(function CampusTerrain() {
  const grid = useId();
  const farm = FARM_LAYOUT.bounds;
  return (
    <>
      <defs>
        <pattern id={grid} width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M10 0H0V10" stroke="#506b57" opacity=".13" strokeWidth=".22" fill="none"/>
        </pattern>
      </defs>
      <rect {...campusGround} fill="#c8d6b5" stroke="#819579" strokeDasharray="1 1"/>
      <rect {...campusGround} fill={`url(#${grid})`}/>
      <g fill="#f7eed5" stroke="#b4ae91" strokeWidth=".24">
        {DISTRICT_PATHS.map((road,i)=><rect key={i} {...footprint(road)}/>)}
        <rect x="-12" y="-5" width="24" height="15" rx="1.8"/>
      </g>
      <circle cx="0" cy="24" r="5.85" fill="none" stroke="#f7eed5" strokeWidth="1.3"/>
      {READING_PLANTERS.map(b=><rect key={b.x} {...footprint(b)} rx="1" fill="#8fa77a" stroke="#e6ddb7" strokeWidth=".3"/>)}
      <g fill="#b9a77e" stroke="#8b825f" strokeWidth=".32">
        <rect {...footprint(TRAINING_GROUND)} rx="1"/>
        {LIVESTOCK_PENS.map(p=><rect key={p.id} {...footprint(p)} rx=".7"/>)}
      </g>
      <rect {...footprint(FISH_POND)} rx="2" fill="#8ab6ae" stroke="#648d85" strokeWidth=".5"/>
      <rect {...footprint(SWIMMING_POOL)} rx=".8" fill="#80b5ba" stroke="#f8efda" strokeWidth="1"/>
      {[1,2,3].map(i=><path key={i} d={`M${SWIMMING_POOL.x-SWIMMING_POOL.w/2} ${SWIMMING_POOL.z-SWIMMING_POOL.d/2+i*SWIMMING_POOL.d/4}h${SWIMMING_POOL.w}`} stroke="#d8efea" strokeWidth=".32"/>)}
      {[TRACK_OUTER_RADIUS,STADIUM.innerRadius].map((r,i)=><rect key={r} x={STADIUM.x-STADIUM.straight/2-r} y={STADIUM.z-r} width={STADIUM.straight+r*2} height={r*2} rx={r} fill={i?"#9db383":"#bd806a"}/>)}
      <g fill="none" stroke="#f4f1d9" strokeWidth=".36">
        <rect {...footprint(SPORTS_FIELD)}/>
        <path d={`M${SPORTS_FIELD.x} ${SPORTS_FIELD.z-SPORTS_FIELD.d/2}v${SPORTS_FIELD.d}`}/>
        <circle cx={SPORTS_FIELD.x} cy={SPORTS_FIELD.z} r="2.7"/>
      </g>
      <rect x={farm.minX} y={farm.minZ} width={farm.maxX-farm.minX} height={farm.maxZ-farm.minZ} rx=".6" fill="#d1c09a" stroke="#859267" strokeWidth=".6"/>
      {[...FARM_LAYOUT.beds,...FARM_LAYOUT.reserve].map((bed,i)=><rect key={i} {...footprint(bed)} rx=".35" fill="#778b58"/>)}
      <g strokeWidth=".35" strokeLinejoin="round">
        {[...CORE_BUILDINGS,...EXPANSION_BUILDINGS].map(b=>{
          const shape=footprint(b);
          const cool=b.roof===0x526f50||b.roof===0x536f76||b.roof===0x667c56||b.roof===0x607f77;
          return <g key={b.x+":"+b.z}>
            <rect {...shape} y={shape.y+.6} rx=".45" fill="#829180"/>
            <rect {...shape} rx=".45" fill={cool?"#829c8a":"#c18a6f"} stroke={cool?"#607c69":"#966b55"}/>
            <path d={`M${shape.x+.6} ${shape.y+.45}l1.3 ${b.d/2-.45}h${b.w-3.8}l1.3 -${b.d/2-.45}`} fill="none" stroke="#f5e3c3" opacity=".77"/>
          </g>;
        })}
      </g>
      <g fill="#91ab82" stroke="#789774" strokeWidth=".22">
        {CAMPUS_TREES.map((t,i)=><circle key={i} cx={t.x} cy={t.z} r={t.scale*.78}/>)}
      </g>
      <g className="mini-landmarks" fill="none" stroke="#fff6dc" strokeWidth=".5" strokeLinecap="round" strokeLinejoin="round">
        <path transform="translate(-9 -5.5)" d="M0-1.1q-1.2-1-2.8-.6v3.1Q-1.4.9 0 1.9q1.4-1 2.8-.5v-3.1Q1.2-2.1 0-1.1v3"/>
        <path transform="translate(9.5 -4.2)" d="M-1.9-1.7v1.2q0 1.3 1 1.3t1-1.3v-1.2M-.9.9v1.3m2.3 0v-4q-1 .9-.8 2.4h.8"/>
      </g>
      <g className="mini-place-labels" fontSize="2.8" fontWeight="700" textAnchor="middle" fill="#294637" stroke="#e5ebd8" strokeWidth=".8" paintOrder="stroke">
        <text x="-9" y="-24">A1</text><text x="11" y="-24">A2</text>
        <text x={SWIMMING_POOL.x} y={SWIMMING_POOL.z+1}>Pool</text>
        <text x={STADIUM.x} y={STADIUM.z+1}>Stadium</text>
        <text x={FARM_LAYOUT.center.x} y={farm.maxZ+3.7}>Garden</text>
      </g>
    </>
  );
});

export function CampusMinimap({player, target, missionName, area, onOpen, waypoint}: {
  player: MapPoint & {heading:number;route: readonly MapPoint[]};
  target?: MapPoint;
  waypoint?: (MapPoint & {name:string}) | null;
  missionName?: string;
  area: string;
  onOpen: () => void;
}) {
  const dx = target ? target.x-player.x : 0;
  const dz = target ? target.z-player.z : 0;
  const distance = Math.hypot(dx,dz);
  // Intersect the actual bearing with the inset edge of the local map.
  const fit = Math.max(1,Math.abs(dx)/(width/2-5),Math.abs(dz)/(height/2-4));
  const nearTarget = distance < 3.5;
  const namedWaypoint = waypoint && target && Math.hypot(waypoint.x-target.x, waypoint.z-target.z)<3;
  const destinationName = player.route.length ? (namedWaypoint ? waypoint.name : "Waypoint") : missionName || "Mission";
  const angle = Math.atan2(dx,-dz)*180/Math.PI;
  return (
    <button type="button" className="hud-minimap" onClick={onOpen} aria-label={`Open campus atlas · ${area}${target ? ` · ${destinationName}, ${Math.round(distance)} m` : ""}`}>
      <span className="mini-window" aria-hidden="true">
        <svg viewBox={`${-width/2} ${-height/2} ${width} ${height}`} className="mini-terrain">
          <g className="mini-pan" style={{transform:`translate(${-player.x}px, ${-player.z}px)`}}><CampusTerrain/>
            {player.route.length > 0 && <polyline points={[player,...player.route].map(p=>p.x+","+p.z).join(" ")} fill="none" stroke="#346f6a" strokeWidth=".76" strokeDasharray="1 1.4" strokeLinecap="round"/>}
          </g>
        </svg>
        {target && <span className={`mini-destination${nearTarget?" at-player":""}`} style={{left:nearTarget?"50%":`${50+dx/fit/width*100}%`,top:nearTarget?"50%":`${50+dz/fit/height*100}%`}}>
          {!nearTarget && <svg viewBox="0 0 22 22">
            {fit>1 ? <path d="M11 2 19 17 11 14 3 17Z" transform={`rotate(${angle} 11 11)`}/> : <path d="M11 1.5 20.5 11 11 20.5 1.5 11Z"/>}
          </svg>}
        </span>}
        <span className="mini-player">
          <svg viewBox="0 0 24 24" style={{transform:`rotate(${180-player.heading*180/Math.PI}deg)`}}>
            <path d="M12 3 20 20 12 16.8 4 20Z" fill="#17698a" stroke="#fffaf0" strokeWidth="2.2" strokeLinejoin="round"/>
          </svg>
        </span>
      </span>
      <span className="mini-caption"><strong>{area}</strong><span className="mini-north" aria-hidden="true">▴ N</span><Icon name="fullscreen" size={13}/></span>
      <span className="mini-key" aria-hidden="true"><span className="mini-you">You</span>{target && <span className="mini-goal"><span>{destinationName}</span><b>{Math.round(distance)} m</b></span>}</span>
    </button>
  );
}
