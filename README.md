# BREVARD-COM-DEMO-001

**MOBILE INTERACTIVE BUSINESS DESTINATION POC**

This build proves the commercial runtime architecture with exactly three scenes and four interaction types.

## Scope

Scenes:
1. `street-001` — SCENE-001 / Street — POC placeholder
2. `lagoon-exterior` — SCENE-002 / Lagoon Cuts Exterior — existing sample panorama reference
3. `lagoon-interior` — SCENE-003 / Lagoon Cuts Interior — POC placeholder

Interaction types:
- `MOVE`
- `ABOUT`
- `SERVICES`
- `BOOK`

The Street and Interior panoramas are intentionally marked as placeholders. They exist to test the runtime and must not be treated as canonical world imagery.

## Structural rule

`world.json` is the POC world record. Panorama files are representations referenced by scenes; they do not define the business entity, scene identity, relationships, or commercial actions.

## Deployed POC scene assets

For the GitHub Pages runtime proof, the three scene images are web-optimized 256×128 JPEG copies. They preserve exact 2:1 equirectangular geometry for runtime testing, but they are not production-quality masters and do not add source detail.

## Local test

A web server is required; do not open `index.html` directly from the filesystem.

```bash
cd BREVARD-COM-DEMO-001
python -m http.server 8000
```

Then open `http://localhost:8000` on the same machine.

Phone-motion testing requires a secure HTTPS context on the phone, so use the deployed GitHub Pages site for the actual iPhone acceptance test.

## GitHub Pages deployment

1. In GitHub: **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select `main` and `/ (root)`.
4. Open the generated HTTPS Pages URL on the iPhone.

## Acceptance gates

- [ ] GATE-01 — Street panorama renders as a sphere.
- [ ] GATE-02 — Finger drag rotates view.
- [ ] GATE-03 — iPhone motion permission can be requested.
- [ ] GATE-04 — Physical phone rotation changes view.
- [ ] GATE-05 — Street → Exterior navigation works.
- [ ] GATE-06 — Exterior → Interior navigation works.
- [ ] GATE-07 — Interior → Exterior return works.
- [ ] GATE-08 — SERVICES opens interactive information.
- [ ] GATE-09 — BOOK executes a real hyperlink/action.
- [ ] GATE-10 — Entire sequence works from one HTTPS URL.

Only after GATE-10 passes should the seven-scene production version be authored.

## External dependency

The HTML loads Pannellum 2.5.7 from jsDelivr. The runtime itself is otherwise static HTML/CSS/JS/JSON plus local scene assets.
