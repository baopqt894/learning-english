# Chibi military school art

The visual direction is a warm, approachable English-learning adventure for students. Preserve the Vietnamese military school setting, olive uniforms, red collar/shoulder details, small gold stars, school backpacks and books. No weapons or combat imagery.

## Delivered assets

- `public/art/chibi-minh-expressions.png`: Minh, boy cadet with cap, backpack and green book; four expressions.
- `public/art/chibi-lan-expressions.png`: Ms. Lan, librarian with glasses, bun, olive service blouse and books; four expressions.
- `public/art/chibi-hung-expressions.png`: Mr. Hung, canteen teacher with moustache, olive service shirt, apron and food tray; four expressions.
- `public/art/chibi-linh.png`: Linh, girl cadet with ponytail, cap, backpack and notebook.
- `public/art/chibi-campus-keyart.png`: welcome illustration with chibi cadets reading together in the original campus.

Created with the built-in imagegen tool using the existing character/campus images as references. Original files remain available. New assets are copied into the repository and used by the game, HUD, avatar selection and art gallery.

## Final prompt set

Shared character direction: polished soft matte 3D storybook chibi, oversized round head around 45% of visible height, large warm brown eyes, tiny button nose, soft smile, rosy cheeks, short rounded body and small natural hands. Vietnamese school identity, olive uniforms, red collar details, warm light. No adult body proportions, blocky shapes, weapons, text or watermarks. Transparent character backgrounds.

- **Minh:** transform the existing boy cadet, preserving tousled dark hair, olive star cap, red tabs, tan backpack and green book.
- **Lan:** transform the librarian, preserving round gold glasses, dark low bun, flower clip and two books; use olive military-style blouse, red collar tabs and olive skirt.
- **Hung:** transform the canteen teacher, preserving swept dark hair, small moustache and tray with banh mi and water; use olive service shirt, red collar tabs and dark olive apron.
- **Expression layout for all three:** exact 2×2 square grid, equal cells; same character identity, framing and clothes in all cells. Top-left welcoming, top-right attentive/thoughtful, bottom-left encouraging happy smile, bottom-right explaining with open palm. No facial deformation in runtime; switch atlas cell per dialogue turn/result.
- **Linh:** single centered cap-to-hips girl cadet with dark ponytail, side bangs, olive star cap, red shoulder tabs, tan backpack and notebook. Keep hands, cap and bag inside the frame.
- **Campus:** horizontal 16:9 chibi storybook diorama retaining cream buildings, terracotta roofs, central Vietnamese flag, highland pine hills and courtyard flowers. Boy and girl cadets share an English book in front, a few chibi students in the background, warm school morning, spacious center, no text or weaponry.

## Runtime models

`src/lib/campus-character.ts` compresses the articulated body vertically to 70% and enlarges the head to approximately 150%, preserving local joint pivots for walking and gestures. Rounded limbs, bigger eyes, brighter olive fabric and softer matte materials match the portrait direction. The mouth stays a small fixed smile; speech uses subtle nods and hand gestures. Reduced-motion behavior remains supported.

Learning missions, rewards, stored progress, campus navigation and photo mode are preserved.
