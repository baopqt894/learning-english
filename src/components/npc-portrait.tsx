import type { Place } from "@/lib/game";

const portraits = { courtyard: "minh", library: "lan", canteen: "hung" } as const;

export function NpcPortrait({ place }: { place: Place }) {
  const file = "/art/portraits/" + portraits[place];
  return <div className="npc-stage-portrait" aria-hidden="true">
    <picture>
      <source srcSet={file+"-560.webp 560w, "+file+"-1120.webp 1120w"} sizes="(max-width: 620px) 95vw, min(55vw, 690px)"/>
      <img src={file+"-1120.webp"} alt="" width={1120} height={1380} decoding="sync" fetchPriority="high"/>
    </picture>
  </div>;
}
