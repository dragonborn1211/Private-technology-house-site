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
assets/img/           stars.webp (night windows), frost.webp (still background), mountain
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

- **Background.** WebGL caustics on milk (from the reference design): the light drifts by itself
  and leans towards the pointer. With reduced motion it is a still frame; without WebGL the
  `frost.webp` image shows instead.
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

## Before going live

- [ ] Real photos: the dome, the rooms, the night sky above the site.
- [ ] Location, road directions and the real altitude; prices and currency.
- [ ] Booking backend for `CONFIG.endpoint`, or a booking service.
- [ ] Mailbox `hello@useantares.com`, WhatsApp and Instagram in `CONFIG`.
- [ ] `og:image` 1200×630, privacy policy and terms.
- [ ] Self-hosted fonts (Cormorant Garamond, Manrope, JetBrains Mono).
