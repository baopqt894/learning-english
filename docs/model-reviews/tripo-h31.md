# Actual Tripo H3.1 cast integration — 2026-11-17

The user's downloaded `diverse_character_3d_model.glb` is preserved unchanged at
`assets/sources/tripo-cast-h31.glb`. SHA-256:
`4b091d17c155aed68e390f73cd210baed3d65c3620d8f4067d1ea179e3013e8a`.
It matches the completed H3.1 cast export (1,923,248 faces; 1,006,787 vertices).
No paid Tripo plan or new generation was used.

## Processing

Run `npm run models:build` with Node 24, or pass another original GLB path to
`scripts/build-tripo-character-models.mjs`. The script:

- Splits the original 6 + 6 + 5 layout into 17 distinct identities without
  discarding triangles at character boundaries. Original face totals are recorded.
- Retains original faces, clothing, accessories and UV artwork. Per the user's
  correction, all repainting is removed, including Minh. Defects are audit notes
  only. No vertex tint or replacement character art is applied.
- Normalizes orientation and ground contact, adds a blended ten-bone skin and
  separate LOD meshes. Held tools, books and bags have rigid weighting so walking
  does not stretch them into the legs. The cheerful textured mouth remains still.
- Preserves UVs during simplification: 22,000 near faces, ~3,500 distant faces,
  one visible skinned draw call per character. Lossless meshopt + gzip transport.
- Preserves the original 4096 px colour, ORM and normal maps byte-for-byte and
  the complete original PBR material. The three maps are shared by all characters.
  Geometry download is ~5.43 MB; unchanged textures total ~8.89 MB. This deliberately
  prioritizes the requested original surface over the superseded 2K recolour pass.

This is a game-ready automatic skin, not a claim of hand-authored cinematic
retopology or independent finger animation. The export's clothing/prop design is
preserved; the source remains available for later artistic edits.

## Runtime contracts

`campus-character-assets.ts` loads the actual Tripo namespace. SkeletonUtils
creates independent skeletons for every player, NPC and competition clone.
Existing pivot names, character IDs, routes, role conversations, missions and
save keys remain compatible. Download failure can use the existing procedural
fallback; that fallback is not described as a Tripo model.

The earlier `cast-v2` files and review are superseded, not deployment inputs.
The sports-layout changes already in this checkout remain intact, including
moving the football pitch inside the athletics track.

## Validation

- 83 automated tests pass, including all 17 loaded GLBs, independent skins,
  ground contact, LOD hysteresis, gzip integrity, source provenance and NPC missions.
- TypeScript, targeted ESLint and production build pass.
- Browser: all 17 identities checked in the runtime viewer; original front/back
  inspected; Minh close-up and side inspected; all-cast walking reviewed.
- Responsive viewer checked at 390 × 844. Physical low-end phone performance has
  not been measured; desktop browser emulation is not that measurement.
- QA game at 390 × 844: walked to the garden, spoke to Chú Phúc, answered both
  English lines, accepted the garden mission and verified its persisted active
  state through account re-login in the isolated QA database.
- Additional regression test compares all three texture files byte-for-byte to
  the original GLB and checks exact PBR equality and absence of added vertex tints.
- Current correction is local; no recoloured build was pushed or deployed.

## Review-only findings

- Minh: small skin-coloured patches on the side of the hair, visible in the user's
  initial screenshot. Left untouched after the instruction to restore the original.
- Chú Phúc: the watering can has two spray-like ends; its shape is unusual and is
  an original generation detail, not silently replaced.
- No broad recolouring is warranted from the reviewed front/back cast views.
  Fine topology, fingers and occluded prop surfaces are not certified flawless.

## Display correction

The first restored-material preview was visibly darker than the user's Tripo
screenshot despite matching texture bytes. Byte equality does not establish a
visual match. The review stage now uses neutral white lights and ACES exposure
1.7 instead of the untonemapped dark preview. The front view was compared to the
user's 13:36:45 screenshot. This is a closer visual approximation, not a claim to
reproduce Tripo's proprietary studio environment pixel-for-pixel. No texture,
vertex tint, skin colour or clothing colour was changed during this calibration.
