"use client";

import type { Place } from "@/lib/game";

const FILES={courtyard:"minh",library:"lan",canteen:"hung"} as const;
/** Portrait frames are rendered from the same 3D rig as the NPC in the campus. */
export function NpcPortrait({place,speaking,turn=0,mood="welcoming"}:{place:Place;speaking:boolean;turn?:number;mood?:"welcoming"|"thoughtful"|"encouraging"}) {
  const alternate = Math.floor(turn / 2) % 2 === 1;
  const expression = speaking ? 3 : turn === 0 ? 0 : mood === "encouraging" ? 2 : alternate ? 1 : 0;
  return <div className="npc-stage-portrait portrait-still" data-speaking={speaking} data-expression={expression} aria-hidden="true">
    <div key={`${place}-${expression}`} className={`portrait-expression expression-${expression}`} style={{backgroundImage:`url(/art/model-${FILES[place]}-expressions.webp)`}}/>
  </div>;
}
