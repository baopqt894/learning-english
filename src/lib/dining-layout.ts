type Room = {x:number; z:number; w:number; d:number};

export function diningLayout(b: Room) {
  const rear = b.z-b.d/2+1;
  const tables = [-.7,2.65].flatMap(dz=>[-1,1].map(side=>({
    x:b.x+side*3.75,z:b.z+dz,w:3.45,d:2.06,
  })));
  const stations = {
    wash: {x:b.x-6.55,z:rear,w:1.9,d:1.2},
    trays: {x:b.x-4.55,z:rear,w:1.8,d:1.2},
    counter: {x:b.x+.35,z:rear,w:7.7,d:1.2},
    fridge: {x:b.x+6.3,z:rear,w:1.6,d:1.25},
    returns: {x:b.x+6.3,z:b.z+b.d/2-.68,w:2.25,d:.76},
  };
  return {tables,stations};
}
