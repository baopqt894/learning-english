"use client";

import { useState } from "react";
import { CAMPUS_RESIDENTS, residentMeetingPoint } from "@/lib/campus-residents";
import { MAP_BOUNDS, EXPLORATION_ZONES, type MapPoint, type ZoneId } from "@/lib/campus-map";
import { CHARACTER_PROFILES } from "@/lib/campus-character-profiles";
import { RESIDENT_MISSIONS, type ResidentKind } from "@/lib/resident-missions";
import { nextGoal, PLACES, type Place, type Progress } from "@/lib/game";
import { CampusTerrain } from "./campus-minimap";
import { Icon } from "./icon";
import "./campus-atlas.css";

const width = MAP_BOUNDS.maxX - MAP_BOUNDS.minX;
const height = MAP_BOUNDS.maxZ - MAP_BOUNDS.minZ;
const position = (x:number,z:number) => ({left:`${(x-MAP_BOUNDS.minX)/width*100}%`,top:`${(z-MAP_BOUNDS.minZ)/height*100}%`});
const searchable = (s:string) => s.normalize("NFD").replace(/\p{M}/gu,"").replace(/đ/gi,"d").toLowerCase();
export type AtlasDestination = MapPoint & {name:string};
type Entry = MapPoint & {id:string;name:string;detail:string;status:string;walk:()=>void;keywords?:string};
const statusOrder = ["Report back","Story mission","In progress","New mission","Conversation","Completed"];

export function CampusMap({player, progress, storyLocation, onPlace, onZone, onResident, onClose, onOverview, onSelect}:{
  player:MapPoint & {heading:number;route:MapPoint[]}; progress:Progress;storyLocation?:string;
  onPlace:(id:Place)=>void;onZone:(id:ZoneId)=>void;onResident:(id:ResidentKind)=>void;onClose:()=>void;onOverview:()=>void;onSelect:(destination:AtlasDestination)=>void;
}) {
  const [tab,setTab] = useState<"places"|"people">("places");
  const [zoomed,setZoomed] = useState(false);
  const [query,setQuery] = useState("");
  const [showCompleted,setShowCompleted] = useState(false);
  const places:Entry[] = [
    ...EXPLORATION_ZONES.map(z=>({...z,name:z.english,detail:z.name,status:z.id===storyLocation?"Story mission":"",walk:()=>onZone(z.id)})),
    ...(Object.keys(PLACES) as Place[]).map(id=>{
      const p=PLACES[id];
      return {id,x:p.position[0],z:p.position[1],name:p.english,detail:p.name+" · "+p.npc,status:id===storyLocation?"Story mission":"",walk:()=>onPlace(id)};
    }),
  ].sort((a,b)=>Number(!!b.status)-Number(!!a.status)||a.name.localeCompare(b.name));
  const goal=nextGoal(progress);
  const people:Entry[] = [...CAMPUS_RESIDENTS.map(r=>{
    const state=progress.residentMissions?.[r.kind];
    const done=progress.challenges?.includes("resident/"+r.kind);
    return {id:r.kind,name:CHARACTER_PROFILES[r.kind].name,detail:RESIDENT_MISSIONS[r.kind].title,keywords:r.role,...residentMeetingPoint(r),
      status:done?"Completed":state==="ready"?"Report back":state==="active"?"In progress":"New mission",
      walk:()=>onResident(r.kind)};
  }), ...(Object.keys(PLACES) as Place[]).map(id=>{
    const p=PLACES[id], current=goal?.place===id;
    return {id,name:p.npc,detail:current?goal.label:p.english,keywords:p.role,x:p.position[0],z:p.position[1],status:current?"Story mission":"Conversation",walk:()=>onPlace(id)};
  })].sort((a,b)=>statusOrder.indexOf(a.status)-statusOrder.indexOf(b.status)||a.name.localeCompare(b.name));
  const visible=(tab==="places"?places:people).map((e,i)=>({...e,number:i+1})).filter(e=>(showCompleted||e.status!=="Completed")&&searchable([e.name,e.detail,e.status,e.keywords].join(" ")).includes(searchable(query.trim())));
  function travel(entry:Entry) {
    onSelect({name:entry.name, x:entry.x, z:entry.z});
    entry.walk();
  }
  return <div className="modal-backdrop field-atlas-backdrop">
    <section role="dialog" lang="en" aria-modal="true" aria-labelledby="atlas-title" className="field-atlas">
      <header><div><h2 id="atlas-title">Campus atlas</h2><p>Tap a pin or a name to walk there.</p></div>
        <button aria-label="Close campus atlas" onClick={onClose}><Icon name="close"/></button></header>
      <div className="field-atlas-body">
        <div className="field-atlas-sheet" data-zoomed={zoomed}>
          <div className="atlas-map-scroll">
          <div className="campus-map-large field-atlas-map" style={{aspectRatio:`${width}/${height}`}}>
            <svg viewBox={`${MAP_BOUNDS.minX} ${MAP_BOUNDS.minZ} ${width} ${height}`} aria-label="Campus terrain">
              <CampusTerrain/>
              {player.route.length>0&&<polyline points={[player,...player.route].map(p=>p.x+","+p.z).join(" ")} fill="none" stroke="#346f6a" strokeWidth="1" strokeDasharray="1.2 1.5"/>}
            </svg>
            {visible.map(e=><button key={e.id} className="field-atlas-pin" data-status={e.status} data-zone={tab==="places"?e.id:undefined} data-npc={tab==="people"?e.id:undefined}
              style={position(e.x,e.z)} onClick={()=>travel(e)} aria-label={`Walk to ${e.name}`} title={e.name+" · "+(e.status||e.detail)}>{e.number}</button>)}
            <span className="field-atlas-player campus-map-player" style={position(player.x,player.z)} title="You">
              <svg viewBox="0 0 20 20" style={{transform:`rotate(${180-player.heading*180/Math.PI}deg)`}}><path d="m10 2 7 15-7-3-7 3z" fill="#17698a" stroke="#fffaf0" strokeWidth="2"/></svg>
            </span>
          </div>
          </div>
          <div className="field-atlas-mapkey"><span>▲ You</span><span><i/> Mission</span><b>↑ N</b>
            <button type="button" aria-label={zoomed?"Zoom out":"Zoom in"} aria-pressed={zoomed} onClick={()=>setZoomed(!zoomed)}>{zoomed?"−":"+"}</button></div>
        </div>
        <div className="field-atlas-directory">
          <div className="field-atlas-tabs">{(["places","people"] as const).map(id=><button key={id} aria-pressed={tab===id} onClick={()=>{setTab(id);setQuery("");}}>{id==="places"?"Places":"Quest NPCs"}</button>)}</div>
          <input aria-label="Search destinations" type="search" placeholder={tab==="places"?"Find a place…":"Find a person or mission…"} value={query} onChange={e=>setQuery(e.target.value)}/>
          {tab==="people"&&<label className="atlas-show-done"><input type="checkbox" checked={showCompleted} onChange={e=>setShowCompleted(e.target.checked)}/> Show completed missions</label>}
          <nav aria-label="Destinations">{visible.map(e=><button key={e.id} onClick={()=>travel(e)}>
            <span className="field-atlas-number" data-status={e.status}>{e.number}</span><span><strong>{e.name}</strong><small>{e.detail}</small>{e.status&&<em>{e.status}</em>}</span><Icon name="arrow" size={15}/></button>)}
            {!visible.length&&<p role="status">{query?"No matching destinations.":"No unfinished missions."}</p>}
          </nav>
        </div>
      </div>
      <footer><button onClick={onOverview}><Icon name="compass" size={16}/> 3D overview</button></footer>
    </section>
  </div>;
}
