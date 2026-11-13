"use client";

import Image from "next/image";
import type { Place } from "@/lib/game";

const FILES={courtyard:"minh",library:"lan",canteen:"hung"} as const;
/** Authored chibi expressions keep each character stable without facial warping. */
export function NpcPortrait({place,speaking,turn=0,mood="welcoming"}:{place:Place;speaking:boolean;turn?:number;mood?:"welcoming"|"thoughtful"|"encouraging"}) {
  const expression=turn === 0 ? 0 : mood === "encouraging" ? Math.floor(turn/2)%2 ? 2:0 : Math.floor(turn/2)%2 ? 1:3;
  return <div className="npc-stage-portrait portrait-still" data-speaking={speaking} data-expression={expression} aria-hidden="true">
    <div key={`${place}-${expression}`} className={`portrait-expression expression-${expression}`} style={{backgroundImage:`url(/art/chibi-${FILES[place]}-expressions.png)`}}><Image src={`/art/chibi-${FILES[place]}-expressions.png`} alt="" width={1} height={1} className="portrait-preload" priority /></div>
  </div>;
}
