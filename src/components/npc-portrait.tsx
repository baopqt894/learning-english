"use client";

import Image from "next/image";
import { useState } from "react";
import type { Place } from "@/lib/game";

const FILES={courtyard:"minh",library:"lan",canteen:"hung"} as const;
/** Stable authored portraits: no face, eye or mouth warping. */
export function NpcPortrait({place,speaking,turn=0,mood="welcoming"}:{place:Place;speaking:boolean;turn?:number;mood?:"welcoming"|"thoughtful"|"encouraging"}) {
  const [failed,setFailed]=useState(false);
  const expression=turn === 0 ? 0 : mood === "encouraging" ? Math.floor(turn/2)%2 ? 2:0 : Math.floor(turn/2)%2 ? 1:3;
  return <div className="npc-stage-portrait portrait-still" data-speaking={speaking} data-expression={expression} aria-hidden="true">
    {failed ? <Image src={`/art/${FILES[place]}-portrait.png`} alt="" fill sizes="(max-width:600px) 95vw, 65vw" priority/> : <div key={`${place}-${expression}`} className={`portrait-expression expression-${expression}`} style={{backgroundImage:`url(/art/${FILES[place]}-expressions.png)`}}><Image src={`/art/${FILES[place]}-expressions.png`} alt="" width={1} height={1} onError={()=>setFailed(true)} className="portrait-preload" priority /></div>}
  </div>;
}
