import { equipmentNames, type EquipmentName } from './campus-detail-layout.ts';
import { drawQuestions, shuffled } from './question-rotation.ts';
import type { ExamItem } from './computer-exam.ts';

type Order = [instruction:string, control:string, settings:[string,string,string], report:string, word:string];
// The first setting carries out the order. Learners then complete the handover note.
export const orders:Record<EquipmentName,Order[]>={
  'Bread oven':[
    ['Preheat the oven to one hundred and eighty degrees.','Set the oven temperature.',['180 °C','80 °C','108 °C'],'Wait until the oven is ___ before putting the rolls inside. (h…)','hot'],
    ['Put the bread on the middle shelf.','Choose a shelf for the tray.',['Middle','Top','Bottom'],'Take the bread out when the crust turns ___. (g…)','golden'],
    ['Bake the small rolls for a quarter of an hour.','Set the timer.',['15 minutes','25 minutes','45 minutes'],'Use oven ___ to lift the hot tray. (g…)','gloves']],
  'Soup station':[
    ['Keep the soup gently bubbling.','Select the heat setting.',['Simmer','Rapid boil','Off'],'Stir the soup with a wooden ___. (s…)','spoon'],
    ['The guests want a smooth soup without pieces.','Choose a utensil.',['Blender','Fork','Ladle'],'Cut the carrots into small ___ before cooking. (p…)','pieces'],
    ['Serve half a bowl to each guest.','Choose the portion.',['Half full','Almost empty','Completely full'],'Use a ___ to serve the soup. (l…)','ladle']],
  'Optical bench':[
    ['Move the paper screen closer to the lamp.','Which part should you slide?',['Screen','Lamp','Lens'],'A shadow appears when an object blocks the ___. (l…)','light'],
    ['The image is blurry. Adjust the lens until the edges are sharp.','Select the adjustment.',['Focus','Colour','Power'],'An image you can see clearly is in ___. (f…)','focus'],
    ['Test whether light passes through clear glass.','Pick the sample.',['Transparent glass','Cardboard','Wood'],'Write what you see on the recording ___. (s…)','sheet']],
  'Prism table':[
    ['Shine white light through the triangular prism.','Select the lamp.',['White','Red','Green'],'A prism can split light into different ___. (c…, British spelling)','colours'],
    ['Mark the spot where the blue band reaches the paper.','Pick a pencil.',['Blue','Yellow','Red'],'The narrow strip of colour is called a ___. (b…)','band'],
    ['Turn the prism slowly while your partner watches the wall.','What should you rotate?',['Prism','Screen','Lamp'],'Ask your ___ to describe the colours. (p…)','partner']],
  'Seed nursery':[
    ['Use the tray labelled beans for this experiment.','Choose a tray.',['Beans','Rice','Peas'],'Cover each seed with a little ___. (s…)','soil'],
    ['Mist the seedlings gently.','Pick a tool.',['Spray bottle','Heavy bucket','Spade'],'A young plant grown from a seed is a ___. (s…)','seedling'],
    ['Label the pots with the date you planted the seeds.','Choose the label information.',['Planting date','Pot price','Leaf colour'],'Write the date on each ___. (l…)','label']],
  'Growth bench':[
    ['Measure the stem from the soil to its tip.','Choose a tool.',['Ruler','Thermometer','Clock'],'Record the height in ___. (c…, British spelling)','centimetres'],
    ['Compare the two plants that received the same amount of water.','Select the matching pair.',['50 ml and 50 ml','10 ml and 50 ml','50 ml and 90 ml'],'A fair test changes one thing at a ___. (t…)','time'],
    ['Place the shade-loving plant away from direct sunlight.','Choose a spot.',['Shaded corner','Sunny window','Under a bright lamp'],'Look for a new ___ at the tip of the stem. (l…)','leaf']],
  'Weather shelter':[
    ['Read the air temperature in the shade.','Select an instrument.',['Thermometer','Rain gauge','Compass'],'Report the temperature in ___ Celsius. (d…)','degrees'],
    ['The rain gauge holds twelve millimetres of water.','Enter the rainfall.',['12 mm','20 mm','2 mm'],'Empty the gauge after each ___. (r…)','reading'],
    ['Record conditions at noon every day.','Choose an observation time.',['12 pm','12 am','6 am'],'Take daily readings at the ___ time. (s…)','same']],
  'Wind meter':[
    ['The wind is coming from the east.','Set the direction marker.',['E','W','S'],'The vane shows the ___ the wind comes from. (d…)','direction'],
    ['Count the rotations for half a minute.','Set the stopwatch.',['30 seconds','15 seconds','60 seconds'],'The cups spin faster in a ___ wind. (s…)','strong'],
    ['The afternoon wind is slower than the morning wind.','Choose the afternoon reading if morning was 12 km/h.',['8 km/h','12 km/h','18 km/h'],'Compare wind ___ in kilometres per hour. (s…)','speed']],
  'Print drying rack':[
    ['Put the wet print on the highest empty shelf.','Select the shelf if all three are empty.',['Top','Middle','Bottom'],'Let the ink ___ before stacking the prints. (d…)','dry'],
    ['Lay the print with the painted side facing up.','Choose its position.',['Face up','Face down','Folded'],'Lift the paper by its ___. (e…)','edges'],
    ['Hang only the blue prints on this line.','Select the print.',['Blue seascape','Red apple','Yellow flower'],'Attach the print with a wooden ___. (p…)','peg']],
  'Pottery wheel':[
    ['Centre the clay before you start turning the wheel.','Where will you put the clay?',['In the middle','On the rim','Beside the pedal'],'Add a little ___ to keep your hands damp. (w…)','water'],
    ['Use the slowest setting to finish the rim.','Set the wheel speed.',['Slow','Medium','Fast'],'Use a damp ___ to smooth the rim. (s…)','sponge'],
    ['Make a shallow bowl for fruit, not a tall vase.','Choose the shape.',['Low and wide','Tall and narrow','Flat and square'],'Let the bowl dry before firing it in the ___. (k…)','kiln']],
  'String instruments':[
    ['Pluck the string once with your finger.','Choose the playing technique.',['Pluck','Bow','Tap'],'A guitar makes sound when its strings ___. (v…)','vibrate'],
    ['Play softly while your partner sings.','Choose a volume.',['Quiet','Loud','Silent'],'Follow the ___ so you stay together. (b…)','beat'],
    ['Play the lowest note first, then the highest.','Choose the starting note.',['Low C','Middle C','High C'],'Two players performing together form a ___. (d…)','duet']],
  Xylophone:[
    ['Strike the bar marked D twice.','Choose the pattern.',['D D','D E','E D'],'A xylophone player strikes the bars with a ___. (m…)','mallet'],
    ['Play three notes in rising order: C, D, then E.','Pick the phrase.',['C D E','E D C','D C E'],'A tune made of notes is a ___. (m…)','melody'],
    ['Leave one silent beat between two C notes.','Choose the rhythm.',['C rest C','C C rest','rest C C'],'A silent beat in music is called a ___. (r…)','rest']],
};
export type WorkItem=ExamItem & {instruction:string};
export function equipmentRound(name:EquipmentName, previous:readonly string[]):WorkItem[]{
  return drawQuestions(orders[name],2,order=>order[0],previous).flatMap(([instruction,prompt,settings,report,word])=>[
    {instruction,prompt,answer:settings[0],options:shuffled(settings),explanation:instruction},
    {instruction,prompt:report,answer:word,explanation:report.split(' (')[0].replace('___',word)},
  ]);
}
export type EquipmentScores=Partial<Record<EquipmentName,{last:number;best:number}>>;
export function restoreEquipmentScores(value:unknown):EquipmentScores|undefined{
  if(!value || typeof value!=='object') return;
  const scores:EquipmentScores={};
  for(const name of Object.values(equipmentNames).flat()){
    const row=(value as EquipmentScores)[name];
    if(row && Number.isInteger(row.last) && Number.isInteger(row.best) && row.last>=0 && row.best>=row.last && row.best<=4)
      scores[name]={last:row.last,best:row.best};
  }
  return Object.keys(scores).length?scores:undefined;
}
