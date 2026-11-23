"use client";
import { useStudent } from './student-support';

import { useLayoutEffect, useRef, useState } from "react";
import { CAMPUS_RESIDENTS, residentMeetingPoint } from "@/lib/campus-residents";
import { MAP_BOUNDS, EXPLORATION_ZONES, type MapPoint, type ZoneId } from "@/lib/campus-map";
import { CHARACTER_PROFILES } from "@/lib/campus-character-profiles";
import { RESIDENT_MISSIONS, type ResidentKind } from "@/lib/resident-missions";
import { nextGoal, PLACES, QUESTS, type Place, type Progress } from "@/lib/game";
import { CampusTerrain } from "./campus-minimap";
import { layoutAtlasPins, placeSymbols } from "@/lib/atlas-pins";
import { Icon } from "./icon";
import "./campus-atlas.css";

const width = MAP_BOUNDS.maxX - MAP_BOUNDS.minX;
const height = MAP_BOUNDS.maxZ - MAP_BOUNDS.minZ;
const position = (x:number,z:number) => ({left:`${(x-MAP_BOUNDS.minX)/width*100}%`,top:`${(z-MAP_BOUNDS.minZ)/height*100}%`});
const searchable = (s:string) => s.normalize("NFD").replace(/\p{M}/gu,"").replace(/đ/gi,"d").toLowerCase();
export type AtlasDestination = MapPoint & {name:string};
type Entry = MapPoint & {id:string;person?:boolean;symbol:string;name:string;detail:string;status:string;walk:()=>void;keywords?:string};
const statusOrder = ["Report back","Story mission","In progress","New mission","Conversation","Completed"];

function PinSymbol({entry}: {entry:Entry}) {
  if (entry.person && ["New mission","Story mission","Report back","In progress"].includes(entry.status))
    return <span aria-hidden="true" className="atlas-exclamation">!</span>;
  return <Icon name={entry.symbol} size={17}/>;
}

export function CampusMap({player, progress, storyLocation, onPlace, onZone, onResident, onClose, onOverview, onSelect}:{
  player:MapPoint & {heading:number;route:MapPoint[]}; progress:Progress;storyLocation?:string;
  onPlace:(id:Place)=>void;onZone:(id:ZoneId)=>void;onResident:(id:ResidentKind)=>void;onClose:()=>void;onOverview:()=>void;onSelect:(destination:AtlasDestination)=>void;
}) {
  const { t } = useStudent();
  const [tab,setTab] = useState<"places"|"people">("places");
  const [zoomed,setZoomed] = useState(false);
  const [query,setQuery] = useState("");
  const [showCompleted,setShowCompleted] = useState(false);
  const [questPins,setQuestPins] = useState(true);
  const sheet = useRef<HTMLDivElement>(null);
  const [size,setSize] = useState({width:370,height:450,diameter:24});
  useLayoutEffect(() => {
    const el=sheet.current;
    if (!el) return;
    const measure=()=> {
      const {width,height}=el.getBoundingClientRect();
      const diameter=parseFloat(getComputedStyle(el).getPropertyValue("--pin-size"));
      if (width && height) setSize(old=>old.width===width && old.height===height && old.diameter===diameter ? old : {width,height,diameter});
    };
    measure();
    const observer=new ResizeObserver(measure);
    observer.observe(el);
    return ()=>observer.disconnect();
  },[]);
  const places:Entry[] = [
    ...EXPLORATION_ZONES.map(z=>({...z,symbol:placeSymbols[z.id],name:z.english,detail:z.name,status:z.id===storyLocation?"Story mission":"",walk:()=>onZone(z.id)})),
    ...(Object.keys(PLACES) as Place[]).map(id=>{
      const p=PLACES[id];
      return {id,symbol:placeSymbols[id],x:p.position[0],z:p.position[1],name:p.english,detail:p.name+" · "+p.npc,status:id===storyLocation?"Story mission":"",walk:()=>onPlace(id)};
    }),
  ].sort((a,b)=>Number(!!b.status)-Number(!!a.status)||a.name.localeCompare(b.name));
  const quest=QUESTS[progress.active];
  const goal=progress.completed.includes(progress.active) ? undefined : nextGoal(progress);
  const reportPlace=!goal && !progress.completed.includes(progress.active) ? quest.goals.at(-1)?.place : undefined;
  const people:Entry[] = [...CAMPUS_RESIDENTS.map(r=>{
    const state=progress.residentMissions?.[r.kind];
    const done=progress.challenges?.includes("resident/"+r.kind);
    return {id:r.kind,person:true,symbol:done?"check":state==="active"?"clock":"user",name:CHARACTER_PROFILES[r.kind].name,detail:RESIDENT_MISSIONS[r.kind].title,keywords:r.role,...residentMeetingPoint(r),
      status:done?"Completed":state==="ready"?"Report back":state==="active"?"In progress":"New mission",
      walk:()=>onResident(r.kind)};
  }), ...(Object.keys(PLACES) as Place[]).map(id=>{
    const p=PLACES[id], current=goal?.place===id;
    return {id,person:true,symbol:"chat",name:p.npc,detail:current?goal.label:id===reportPlace?quest.title:p.english,keywords:p.role,x:p.position[0],z:p.position[1],status:id===reportPlace?"Report back":current?"Story mission":"Conversation",walk:()=>onPlace(id)};
  })].sort((a,b)=>statusOrder.indexOf(a.status)-statusOrder.indexOf(b.status)||a.name.localeCompare(b.name));
  const visible=(tab==="places"?places:people).filter(e=>(showCompleted||e.status!=="Completed")&&searchable([e.name,e.detail,e.status,e.keywords,t(e.name),t(e.status)].join(" ")).includes(searchable(query.trim())));
  const overlay=tab==="places" && questPins && !query.trim()
    ? people.filter(e=>["Report back","Story mission","New mission","In progress"].includes(e.status)) : [];
  const pins=layoutAtlasPins([...visible,...overlay],size.width,size.height,size.diameter);
  function travel(entry:Entry) {
    onSelect({name:entry.name, x:entry.x, z:entry.z});
    entry.walk();
  }
  return <div className="modal-backdrop field-atlas-backdrop">
    <section role="dialog" aria-modal="true" aria-labelledby="atlas-title" className="field-atlas">
      <header><div><h2 id="atlas-title">{t("Campus atlas")}</h2><p>{t("Tap a pin or a name to walk there.")}</p></div>
        <button aria-label={t("Close campus atlas")} onClick={onClose}><Icon name="close"/></button></header>
      <div className="field-atlas-body">
        <div className="field-atlas-sheet" data-zoomed={zoomed}>
          <div className="atlas-map-scroll">
          <div ref={sheet} className="campus-map-large field-atlas-map" style={{aspectRatio:`${width}/${height}`}}>
            <svg viewBox={`${MAP_BOUNDS.minX} ${MAP_BOUNDS.minZ} ${width} ${height}`} aria-label="Campus terrain">
              <CampusTerrain/>
              {player.route.length>0&&<polyline points={[player,...player.route].map(p=>p.x+","+p.z).join(" ")} fill="none" stroke="#346f6a" strokeWidth="1" strokeDasharray="1.2 1.5"/>}
            </svg>
            <svg className="atlas-leaders" viewBox={`0 0 ${size.width} ${size.height}`} aria-hidden="true">
              {pins.filter(p=>Math.hypot(p.x-p.anchorX,p.y-p.anchorY)>size.diameter/2).map(p=>
                <g key={(p.entry.person?"npc-":"zone-")+p.entry.id}><line x1={p.anchorX} y1={p.anchorY} x2={p.x} y2={p.y}/><circle cx={p.anchorX} cy={p.anchorY} r="1.7"/></g>)}
            </svg>
            {pins.map(({entry:e,x,y})=><button key={(e.person?"npc-":"zone-")+e.id} className="field-atlas-pin" data-status={e.status}
              data-zone={e.person?undefined:e.id} data-npc={e.person?e.id:undefined}
              style={{left:x/size.width*100+"%",top:y/size.height*100+"%"}} onClick={()=>travel(e)} aria-label={`Walk to ${e.name}${e.status?" · "+e.status:""}`}
              title={[e.name,e.status||e.detail].join(" · ")}><PinSymbol entry={e}/></button>)}
            <span className="field-atlas-player campus-map-player" style={position(player.x,player.z)} title={t("You")}>
              <svg viewBox="0 0 20 20" style={{transform:`rotate(${180-player.heading*180/Math.PI}deg)`}}><path d="m10 2 7 15-7-3-7 3z" fill="#17698a" stroke="#fffaf0" strokeWidth="2"/></svg>
            </span>
          </div>
          </div>
          <div className="field-atlas-mapkey"><span>{t("▲ You")}</span>{tab==="places" ? <label><input type="checkbox" checked={questPins} onChange={e=>setQuestPins(e.target.checked)}/> {t("! Quest NPCs")}</label>
            : <span><b className="atlas-legend-new">!</b> {t("New")} <b className="atlas-legend-active">!</b> {t("Active")} <i/> {t("Turn in")}</span>}<b>↑ N</b>
            <button type="button" aria-label={zoomed?t("Zoom out"):t("Zoom in")} aria-pressed={zoomed} onClick={()=>setZoomed(!zoomed)}>{zoomed?"−":"+"}</button></div>
        </div>
        <div className="field-atlas-directory">
          <div className="field-atlas-tabs">{(["places","people"] as const).map(id=><button key={id} aria-pressed={tab===id} onClick={()=>{setTab(id);setQuery("");}}>{id==="places"?t("Places"):t("Quest NPCs")}</button>)}</div>
          <input aria-label={t("Search destinations")} type="search" placeholder={tab==="places"?t("Find a place…"):t("Find a person or mission…")} value={query} onChange={e=>setQuery(e.target.value)}/>
          {tab==="people"&&<label className="atlas-show-done"><input type="checkbox" checked={showCompleted} onChange={e=>setShowCompleted(e.target.checked)}/> {t("Show completed missions")}</label>}
          <nav aria-label={t("Destinations")}>{visible.map(e=><button key={e.id} onClick={()=>travel(e)}>
            <span className="field-atlas-symbol" data-status={e.status}><PinSymbol entry={e}/></span><span><strong>{t(e.name)}</strong>{(e.person || e.detail.includes(" · ")) && <small>{t(e.detail)}</small>}{e.status&&<em>{t(e.status)}</em>}</span><Icon name="arrow" size={15}/></button>)}
            {!visible.length&&<p role="status">{query?t("No matching destinations."):t("No unfinished missions.")}</p>}
          </nav>
        </div>
      </div>
      <footer><button onClick={onOverview}><Icon name="compass" size={16}/> {t("3D overview")}</button></footer>
    </section>
  </div>;
}
