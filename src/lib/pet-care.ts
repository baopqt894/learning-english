export const PETS={chickens:{name:'Chickens',station:'feed-chickens',food:'grain'},pigs:{name:'Pigs',station:'feed-pigs',food:'balanced feed'},goats:{name:'Goats',station:'feed-goats',food:'grass'},ducks:{name:'Ducks',station:'feed-ducks',food:'duck feed'},fish:{name:'Fish',station:'feed-fish',food:'fish pellets'}} as const;
export type PetId=keyof typeof PETS;export type PetCare=Partial<Record<PetId,{lastFedAt:number;meals:number;adoptedAt:number}>>;
export const PET_MEAL_COOLDOWN=60_000;
export function petForStation(station:string){return (Object.keys(PETS) as PetId[]).find(id=>PETS[id].station===station);}
export function normalizePetCare(raw:unknown):PetCare{const result:PetCare={};if(!raw||typeof raw!=='object')return result;for(const id of Object.keys(PETS) as PetId[]){const value=(raw as PetCare)[id];if(value&&Number.isFinite(value.lastFedAt)&&value.lastFedAt>0&&Number.isFinite(value.adoptedAt)&&value.adoptedAt>0&&Number.isInteger(value.meals)&&value.meals>=0)result[id]={lastFedAt:Math.min(Date.now(),value.lastFedAt),adoptedAt:Math.min(Date.now(),value.adoptedAt),meals:Math.min(1000,value.meals)};}return result;}
export function petStatus(care:PetCare,id:PetId,now=Date.now()){
 const pet=care[id],hours=pet?Math.max(0,now-pet.lastFedAt)/3600000:0,health=Math.max(0,Math.round(100-Math.max(0,hours-4)*5));
 return {health,meals:pet?.meals??0,stage:!pet||pet.meals<3?'Young':pet.meals<6?'Growing':'Adult',state:health===0?'Needs recovery':hours>=12?'Weak':hours>=6?'Hungry':'Well fed',nextMealIn:pet?Math.max(0,PET_MEAL_COOLDOWN-(now-pet.lastFedAt)):0,scale:.65+Math.min(6,pet?.meals??0)*.35/6};
}
export function feedPet(care:PetCare,id:PetId,now=Date.now()):PetCare{if(petStatus(care,id,now).nextMealIn>0)return care;return {...care,[id]:{lastFedAt:now,adoptedAt:care[id]?.adoptedAt??now,meals:(care[id]?.meals??0)+1}};}
