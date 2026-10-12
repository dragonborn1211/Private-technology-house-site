# Antares — observatory & guesthouse

Demo site for a fictional client: a private observatory with an eight-room guesthouse at 2,140 m.
The telescope is called the Antares; the domain is **useantares.com**.
It reuses the design system of the Private Technology House site (light ice, glass cards, navy
"night windows"); all content, names and the interactive pieces are new and in English.

## Run

```bash
npx http-server -p 8080 .        # or: python -m http.server 8080
```

Open http://localhost:8080 from this folder (or `/antares/` from the repo root).
Opening `index.html` directly also works.

## Structure

```
index.html            all sections
assets/css/main.css   tokens, sections, tonight panel, responsive
assets/js/main.js     content (OBJ, LAY), Moon maths, menu, booking form, background
assets/img/           stars.webp (night windows), trails.webp (background when JS is off)
../tools/build_stars.py   regenerates stars.webp and stars-960.webp
```

## Sections and where they link

| Header / footer | Section | id |
|---|---|---|
| — | Dark sky. Big glass. — tonight's conditions and programme | `#top` |
| Nights | five packages with prices | `#nights` |
| Observatory | what's on the mountain | `#observatory` |
| Grounds | telescope, imaging pier, guesthouse, tonight's chart | `#grounds` |
| Eye to star | seven layers between your eye and Antares | `#sky` |
| Your night | how a night goes, six steps | `#your-night` |
| House rules | five rules + the booking form | `#rules`, `#book` |

## What is live

- **Background: star trails.** A long exposure of the sky drawn on canvas: every star leaves the
  same arc around the south celestial pole, just above the top right corner. The exposure builds
  up on load, the sky turns slowly and turns further as you scroll through the page; now and
  then a meteor crosses. Still frame with reduced motion; `trails.webp` when JS is off.
- **The mountain** behind the house rules is drawn in SVG: three ridges and the dome on the summit.
- **Tonight** (header toggle, key `T`, the `00` object). Moon illumination, phase, next new and full
  moon and the darkest nights ahead, from low-precision Sun and Moon positions. Checked against
  the 2026 phases: new moons within ~5 minutes, full moons within ~30. The same figures fill the
  Moon card in the first screen, the chart legend, the first house rule and the footer.
- **Menu** — button in the header (also ⌘K / Ctrl+K): search across sections and contacts.
- **Booking form** — shows the request as it will arrive; sends to `CONFIG.endpoint`, falls back
  to email or WhatsApp.

The first screen's cloud, seeing and target altitudes are illustrative, not a live feed.

## Edit

- **Places** — `OBJ` in `assets/js/main.js` (name, category, text, specs, URL in the window bar,
  link label). Previews are `.pv[data-preview="N"]` in `index.html`, drawn in HTML/CSS/SVG.
- **Layers** — `LAY` in the same file (title, text, specs, the facts card).
- **Contacts** — `CONFIG` at the top of `assets/js/main.js`: `endpoint`, `email`
  (`hello@useantares.com` — create the mailbox), `whatsapp`, `instagram`.

## Rights

- Every text on the site was written for it. The star field, the star trails and the mountain
  are generated in code (`tools/build_stars.py`, the canvas, an inline SVG): no stock images.
- Fonts come from Google Fonts under the SIL Open Font License, free for commercial use.
- Astronomical facts and object names (M4, Rho Ophiuchi, α Scorpii) are public knowledge.
- The design system is the Private Technology House site in this repository.
- **The name.** "Antares" is used by several real observatories (France, Austria, Brazil,
  Argentina) and many companies. Before launching a real business under it, search trademark
  registers in classes 39, 41 and 43 (travel, events and education, lodging) for the target
  countries, and check who owns useantares.com. Shown in a portfolio, label it as a concept.

## Before going live

- [ ] Real photos: the dome, the rooms, the night sky above the site.
- [ ] Location, road directions and the real altitude; prices and currency.
- [ ] Booking backend for `CONFIG.endpoint`, or a booking service.
- [ ] Mailbox `hello@useantares.com`, WhatsApp and Instagram in `CONFIG`.
- [ ] `og:image` 1200×630, privacy policy and terms.
- [ ] Self-hosted fonts (Cormorant Garamond, Manrope, JetBrains Mono).
