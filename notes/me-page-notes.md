# Notes: the "Me" page

Working notes for a personal one-pager at `blog.rubbad.uk/me/`, reached via `rubbad.uk`.
Pick up from here in any session. Decisions marked **locked** are settled; don't re-litigate.

Heads-up: `notes/` is excluded from the site build (`_config.yml`), but the repository itself
is public on GitHub, so everything here is public once pushed. Nothing internal, nothing about
job searches, nothing an employer wouldn't want public.

## Goal

A page purely about me: who I am, what I do, where to read more. Not a "hire me" page.
It advertises, to people interested in me or the blog, that I know what I'm doing.
Tone: the blog's tone. Self-deprecating, smart, dry, professional.

## Locked decisions

- **Hosting: folder in this repo + Cloudflare redirect.** The page lives in `me/` and is
  served at `blog.rubbad.uk/me/`. `rubbad.uk` and `www.rubbad.uk` redirect there.
  The visible URL change is a feature: visitors land on the blog's domain and can move on
  to the blog. No Cloudflare Worker, no Cloudflare Pages, no second platform.
- **Stack: static HTML + CSS, served by the existing GitHub Pages Jekyll build.**
  No framework (Astro etc. would force an Actions-based build for the whole repo).
  Jekyll copies files without front matter verbatim; with minimal front matter
  (`layout: null`) Jekyll can inject data at build time (e.g. latest posts) and the output
  is still a static page. At most one small optional JS file for enhancement; the page must
  be complete without it.
- **Navigation: "About" becomes "About the Blog"** (keeps the agent-written,
  human-edited transparency), plus a new **"Me"** entry pointing to `/me/`.
  Final nav labels to decide once we see them on mobile.
- **Concept: "Read this first."** The page is a context file about me, in the spirit of
  an `AGENTS.md` for a person: what you should know before working with Bernd.
- **Signature element: Human view / Agent view switch.** Human view is an editorial page;
  Agent view shows the same content as a plain-text context file in monospace.
  Pure CSS toggle (radio + `:has()`), no JS needed.

## Concept details (proposed, not all locked)

Sections in Human view:
1. Hero: name, one line in the blog's voice, Graz coordinates as a detail.
2. Currently: a short "now" section.
3. Known limitations (and workarounds): the self-deprecating centerpiece. The limitation
   carries the joke, the workaround carries the competence.
4. What I'm actually good at: 3 to 4 solid points, no jokes.
5. Changelog: career as release notes, newest first. Titles read like real release notes
   ("Added:", "Changed:", "Fixed:"); "In Which..." titles are reserved for blog posts.
6. Recently written: latest blog posts (Liquid in the Jekyll version).
7. Colophon: "Agent-written, human-edited." Plus the stack.

Maintenance target: in the Jekyll version, content lives in one data file
(`_data/me.yml`), rendered into both views. Edit content in one place.

Extras: print stylesheet that turns the page into a clean one-page CV; canonical URL
`https://blog.rubbad.uk/me/`; Open Graph image; light and dark mode.

## Learnings from research

- **AI-built sites converge on the same look.** The fix is a strong, specific concept and
  voice, not more effects. Avoid: purple gradients, glassmorphism, particle clouds,
  generic "founder" copy.
- **Memorable personal sites have one idea, executed consistently** (rauno.me: one
  rhythmic manifesto; lynnandtonic.com: yearly versioned redesigns).
- **Colophons are a good fit** for AI-built sites and match the blog's transparency.
- **bubelich.com** (inspiration): Astro + Tailwind, but the effects are ~25 KB of
  hand-written vanilla JS on 2D canvas. Big typography, skill ticker, numbered sections,
  alternating dark/light. Most of it is achievable in HTML/CSS. Its "The Mind / The Heart"
  structure is explicitly **not** to be copied.
- **outpost.dayemadnan.com** (inspiration): scroll-scrubbed "camera flight" through 9 video
  clips (7 to 10 MB each, ~70 MB total), a 35 KB custom vanilla JS engine plus a 77 KB
  motion library, much of it handling mobile video edge cases. Too heavy and a poor fit for
  this concept as-is (video says nothing about a person; Agent view has nothing to show).
  Transferable principles: scrolling moves you through a space, one strong sentence per
  scene, calm deliberate transitions.

## Deferred ideas (pinned, not for the first prototype)

- **Scroll flight through the context file:** zoomed-out view of the whole file, scrolling
  dives into one section at a time; Known limitations as a pinned scene where the
  workaround lands on scroll. CSS scroll-driven animations plus an optional 5 to 10 KB JS.
- **Animated Human/Agent transition:** the editorial page visibly turning into markdown.
- **Conductor motif:** team as musicians, the agents repo as the score
  (ties to the "Writing the Score" post).

## Content guardrails

- Follow `agents/WRITING-GUIDE.md` for all reader-facing text (no em dashes, no LLM tells,
  dry humor, no AI hype).
- Public-safe only: no internal company details, team sizes, colleagues, or anything not
  already public. No home address or phone number.

## Prototype workflow

1. Prototype as plain HTML + CSS in `me/`, opened directly in the browser (no build).
   Blog posts hand-typed for now.
2. Iterate on design and content.
3. Convert to the Jekyll version: front matter, `_data/me.yml`, Liquid for latest posts.
4. Nav changes, review, push (pushing to `main` publishes).
5. Cloudflare: proxied DNS records for `rubbad.uk` and `www` (placeholder `AAAA 100::`),
   redirect rule to `https://blog.rubbad.uk/me/` (302 first, 301 once stable). Test in a
   private window.

## Interview decisions (locked)

- **Employer:** named. Role + Anyline, nothing beyond what is public on LinkedIn.
- **Default view:** Human view. Agent view is the discovery.
- **Palette, Human view: "Black Rock Lava."** Dark-first. Near-black basalt grey background,
  warm off-white body text, oranges as accents only, used as "heat": the more important,
  the hotter. Deep red-oranges only for surfaces and lines (contrast too low for small text).
- **Palette, Agent view: amber phosphor.** Monospace, orange-amber on near-black like an
  amber CRT terminal. Matrix green was considered and rejected: cliché, and a separate
  palette makes the switch feel like a different website. (A colophon line blaming "the
  intern" for suggesting green was dropped: it was Bernd who suggested it, and the
  writing guide forbids invented details. Used instead: "The terminal view is amber because
  every other terminal was already green.")
- **Light mode:** dark-first, plus a "cooled lava" ash variant (ash grey/pumice with dark
  orange) when the system prefers light. Print is always light.
- **Typography:** bold grotesk for headings (e.g. Space Grotesk) + monospace for details.
- **Links:** Blog, LinkedIn, Email. No GitHub.
- **Email:** target is `hello@rubbad.uk` via Cloudflare Email Routing (not set up yet).
  Until then, shown as "hello at rubbad dot uk". Routing must work before go-live,
  otherwise mail to the published address bounces.
- **Photo:** yes, one, restrained. In Agent view it becomes a text description.
- **Copy:** Claude drafts from public facts in the blog's voice, Bernd edits.
- **Changelog:** everything from TU Graz on, including side projects (Droidcon UK 2013
  hackathon win, "Where the hell are you?" app with 100,000 downloads, the wedding photo box).
- **Motion in the first prototype:** subtle, CSS only. Smooth view switch, gentle scroll
  fade-ins, careful hover states, maybe a slow glow on lava accents. Respect
  `prefers-reduced-motion`.

## Prototype plan (v0)

Files (in `me/`, not committed until reviewed):
- `index.html`: semantic HTML, both views in one document, CSS-only view switch
  (radio + `:has()`), no front matter yet so it opens directly from disk.
- `style.css`: design tokens on `:root` (lava + ash + amber), mobile-first layout,
  dark default, `prefers-color-scheme: light` ash variant, print stylesheet,
  `prefers-reduced-motion` handling.
- `fonts/`: self-hosted woff2 (Space Grotesk + a monospace, both OFL). No Google Fonts
  requests: loading Google Fonts from an EU site has a GDPR history, and self-hosting is
  faster and private.
- `photo.jpg`: added once Bernd provides one; placeholder until then.
- No JS in v0.

Content (drafted by Claude): hero line, Currently, Known limitations (and workarounds),
What I'm actually good at, Changelog, Recently written (hand-typed latest 3 posts),
Colophon, links. Agent view mirrors the same content as a context file. In v0 the content
is duplicated by hand; the Jekyll version renders both from `_data/me.yml`.

Quality bar: WCAG AA contrast, keyboard-usable switch, works at 360 px width, readable
without CSS animations, sensible print output on one page.

Head: title, description, canonical `https://blog.rubbad.uk/me/`, Open Graph tags
(image placeholder).

Out of scope for v0: Jekyll conversion, nav changes, Cloudflare redirect, email routing,
scroll flight, OG image design.

Preview: `open me/index.html`.

## Status

**v0 built (2026-10-26), not committed.** Files: `me/index.html`, `me/style.css`,
`me/photo.jpg` (Gravatar, 600 px), `me/fonts/` (Space Grotesk + JetBrains Mono variable
woff2 from `@fontsource-variable/*@5.3.0`, with OFL licenses).

Implementation notes:
- Human view is first person; Agent view (`BERND.md`) is third person, as a context file
  about Bernd. Known limitations carry an owner tag: mine / the AI's / both, which pays off
  the blog title's ambiguity.
- Changelog heat: major = hottest, minor = lava, patch/initial = muted.
- Photo: greyscale + lava duotone, full colour on hover.
- Print: light, human view only, fits one A4 page (checked with headless Chrome). In print,
  strengths show titles only, and patch/minor changelog entries show titles only.
- Checked: no em dashes, all blog links return 200, phone width 360 px, desktop 1440 px.
- Email `hello@rubbad.uk` is used as a link already; routing is not set up yet.

Next: Bernd reviews copy and design in the browser, then iterate.

## v2: "Night Drive" (2026-10-26)

A fresh presentation; content carried over from v1. Files are versioned side by side:
`me/v1/` (Black Rock Lava), `me/v2/` (Night Drive), shared `me/fonts/` and `me/photo.jpg`.
`me/index.html` is a temporary draft picker (noindex) until one version wins.
Git tags: `me-v0`, `me-v1`, `me-v1.1`, `me-v2.0`.

Interview decisions (locked):
- **Theme:** outrun / new retro wave, "Lava outrun" palette: night sky, striped sunset sun
  (orange to magenta) as the successor of v1's lava, magenta grid, a volcano on the horizon.
- **Movement: drive and park.** Scroll is the gas pedal. The camera drives between signs and
  parks at each one, so the text stands still at 1:1 scale and is readable. Proximity scroll
  snapping helps landing on a parked sign.
- **Forest of text:** words from the content as glowing roadside "trees" (decorative,
  generated by `drive.js`); the real content sits on signs and billboards.
- **Route:** Start, Currently, Known limitations (one warning sign per limitation),
  What I'm good at, Changelog (one mile marker per release, years as the markers),
  Recently written, Arrival (contact + colophon).
- **Agent view:** stays the amber terminal from v1. Agents don't need the scenery.
- **Mobile:** same drive, simplified (fewer trees, shorter distances, compact strengths).
- **HUD:** exit counter + section name (with year or limitation step), a real speedometer
  that settles at 0 km/h when parked, and an Exits menu to jump between sections.
- **Typography:** Orbitron for the name, sign plates, HUD and trees; Space Grotesk and
  JetBrains Mono for reading text.
- **No sound. Night only** (no light mode); print stays a light one-page CV.

Implementation notes:
- No video, no WebGL. Signs are real HTML positioned in CSS 3D (`translate3d` with a
  per-element z plus a shared `--cam`), so text stays selectable, accessible and crawlable.
- `drive.js` (~250 lines, no dependencies) maps scroll to camera position, fades signs and
  trees by distance, sorts depth via z-index, drives the HUD, and scrolls to a sign when a
  link inside it gets keyboard focus.
- Progressive enhancement: without JS or with `prefers-reduced-motion`, the page is a
  plain document in the same look (signs stacked on a static sunset).
- Checked with Chrome DevTools MCP against a local server
  (`python3 -m http.server 4000` from the repo root, open `/me/v2/`): desktop 1200 px,
  phone 390 px, Agent view, reduced motion, print (one A4 page). No console errors.

## v3 brief: "Racing simulator into the screen" (2026-10-26)

**Start here in a new session.** Read this whole file first; this section is the current task.

### Why v2 missed

Bernd's verdict on v2: "a straight scrollable page, doesn't use the z-axis at all".
Technically v2 did use 3D, but it put readability over the feeling of driving:
- Signs sat in the middle of the screen and filled it. You look at a sign, not at a road;
  it reads as a zooming slideshow.
- There was no road: only a grid floor. No lane, no edges, no curves, no hills, nothing
  close to the camera rushing past.
- The camera was mostly parked; between stops it only moved straight ahead.

Lesson: the sense of speed comes from the road under you and objects at the edge flying
past, not from the destination. Readability must be solved without stopping the drive in
the middle of the screen.

(Checked and ruled out: it was not the reduced-motion fallback. macOS Reduce Motion is
off and `drive.js` loaded.)

### Target

A drive **into the screen**, like a racing game or the original OutRun: a road winding
toward the horizon with curves and hills, lane markings and curbs, roadside objects
scaling up and flying past at the sides. Scroll (and arrow keys) is the gas pedal.
The content appears as **billboards beside the road**, readable as you approach.

### Technique (proposed)

**Pseudo-3D road rendering**, the classic OutRun technique (segment-based road projected
per frame onto a 2D `<canvas>`). No library, no WebGL; a few hundred lines of plain JS.
Jake Gordon's "Javascript Racer" write-ups are the well-known reference for the method.

- Road: many short segments, each with a curve and a hill value; projected each frame;
  drawn as alternating road/rumble/lane bands on canvas. Fog toward the horizon.
- Scenery: lava outrun sky, striped sun, volcano (reuse from v2's look), roadside sprites
  (poles, palms, or the word "trees" from v2) drawn on canvas.
- **Content stays real HTML.** Each billboard is a DOM element; every frame the script
  places it at the projected screen point beside its road segment and scales it. Text
  stays selectable, accessible and crawlable.
- Readability: billboards sit at the roadside and grow as they approach; the car may
  ease off the gas briefly near a billboard, but never stops in the middle of the screen.
  Long texts (changelog entries) get shorter on billboards; full detail stays in the Agent
  view, or a "pull over" panel if needed.
- Scroll maps to distance travelled (like outpost.dayemadnan.com scrubs video by scroll).

Alternative considered: real 3D with Three.js. More flexible, much heavier; not needed
for this look. Only revisit if pseudo-3D can't deliver the feel.

### Plan: spike first

1. **Spike (no content):** `me/v3/` with the road only. Curves, hills, lane markings,
   curbs, a few roadside poles, the sky/sun/volcano, scroll as gas pedal, a speedometer.
   Goal: Bernd checks whether this is the feeling he means before any content goes on it.
2. If the feel is right: add billboards for the route (Start, Currently, Known limitations,
   What I'm good at, Changelog, Recently written, Arrival), then HUD, then fallbacks.
3. Tag checkpoints (`me-v3.0-spike`, ...) as before.

Acceptance for the spike: feels like driving into the screen on desktop and phone;
smooth (aim for 60 fps on a mid-range phone; check with a DevTools performance trace);
no console errors.

### What stays (do not re-litigate)

- Content and voice from v1/v2 (copy drafted from public facts; Bernd will refine after
  his CV update). Writing guide rules apply (`agents/WRITING-GUIDE.md`, no em dashes).
- Human view / Agent view switch; Agent view stays the amber terminal (copy it from
  `me/v2/index.html`).
- Lava outrun palette, Orbitron + Space Grotesk + JetBrains Mono (self-hosted in
  `me/fonts/`), photo at `me/photo.jpg`. Night only. No sound.
- Route order: who I am first, then through time.
- Progressive enhancement: without JS or with `prefers-reduced-motion`, a plain readable
  document (v2's flat mode is a good base). Canvas is decorative; content never lives only
  in the canvas.
- Print: light one-page CV.
- Versioned folders: new work in `me/v3/`; keep `me/v1/` and `me/v2/`; add v3 to the
  picker in `me/index.html`.

### Working setup

- Branch `me-page` in this repo. Tags `me-v0` to `me-v2.0` mark earlier drafts.
- Local server from the repo root: `python3 -m http.server 4000 --bind 127.0.0.1`, then
  open `http://127.0.0.1:4000/me/v3/`. (Opening via `file://` blocks font preloads.)
- Chrome DevTools MCP is installed: use it to drive, screenshot, emulate a phone
  (`390x844x3,mobile,touch`), test reduced motion, read the console, and trace
  performance. Headless Chrome screenshots via CLI are unreliable for animated pages.
- Repo rules (`AGENTS.md`): don't commit or push unless asked; one-line conventional
  commits, no AI attribution. Pushing to `main` publishes; nothing has been pushed.
- Reminder: `notes/` is public once pushed (in the GitHub repo, not on the site). Keep it
  free of internal or job-search context.

### v3 spike status (2026-10-26)

**Spike built, not committed, not tagged.** Waiting for Bernd's verdict on the feel.
Files: `me/v3/index.html`, `me/v3/style.css`, `me/v3/road.js` (~450 lines, no dependencies).
Added to the draft picker in `me/index.html`.

What's in it:
- Pseudo-3D road on one `<canvas>`: ~2,500 segments with curves, hills, rollers, S bends and
  a big climb; it returns to sea level at the end so the loop is seamless. Three lanes,
  orange/magenta curbs, colour bands every 3 segments, exponential fog toward the horizon.
- Roadside: lamp poles every 8 segments on both sides, palm silhouettes (magenta rim) in
  random clusters (seeded, so the same every visit). Sprites are pre-rendered offscreen
  canvases and get clipped behind hill crests.
- Background: sky gradient, stars, striped sun, far ridge with the volcano and crater glow,
  near hills. Layers are two screens wide and slide sideways in curves (parallax).
- Scroll is the gas pedal: 14 scroll pixels per segment; the car eases toward the scroll
  target, so the dial shows a real speed and settles at 0. Arrow keys work via native scroll.
- HUD: speedometer (km/h, capped at 299) and trip odometer. "Scroll to drive" hint fades out.
- Portrait: road scaled by width on both axes, horizon at 52%. Canvas DPR capped at 1.5 on
  narrow screens, 2 elsewhere.
- Reduced motion: one parked frame plus a note. No-JS: a noscript note. Both are spike
  placeholders; the real fallback is still v2's flat document.

Checked (Chrome DevTools MCP, local server): desktop 1200x750, phone 390x844x3, reduced
motion. No script errors (the only console error is the local server's missing
`favicon.ico`). Frame timing on the phone viewport with 4x CPU throttling while
scrolling: 16.7 ms average, p95 17.5 ms, so 60 fps. That was measured with rAF timestamps,
not a full DevTools trace; a real mid-range phone is still untested.

Open questions for Bernd:
- Feel: speed ratio (`PX_PER_SEGMENT`), easing (`EASE`), curve and hill strength.
- First person (current) or a car in front, like OutRun?
- Palms or something less cliché (the v2 word "trees" could come back as roadside sprites).
- Volcano glow and the ridge parallax are rough.

### v3.1: billboards (2026-10-26)

Bernd's verdict on the spike: "more like what I had in mind". Decided: keep iterating on it;
first person stays for now; palms stay for now. **Not committed, not tagged.** (The spike
as it was is not separately preserved in git; tag `me-v3.0-spike` was never made.)

What changed:
- `me/v3/index.html` is now the full page: v2's content, Agent view and HUD (exit counter,
  section name, speedometer, Exits menu), with the canvas road in place of v2's scenery.
  `me/v3/style.css` is derived from v2's; road-mode rules are inside `@media screen` so
  print stays the light one-page CV.
- Every `.sign` is a **billboard beside the road**: real HTML, placed each frame at its
  segment's projected roadside point, scaled by distance (`s = READ_Z / z`, so s = 1 at
  22 segments), bottom on two short posts, alternating sides. Boards up the road are
  visible as small signs in the distance, fade in from the fog, get clipped by hill
  crests, then grow and fly past the side.
- **Reading size:** per board, `sRead` is as close to 1:1 as fits (desktop: one half of the
  screen beside the road; phone: nearly centred, above the road). While approaching, a
  board is pinned inside the screen edges, below the top bar and above the HUD, so curves
  and hills can't push it out of view; past reading size it is let go.
- **Easing off the gas:** the scroll plan gives more scroll pixels per segment around each
  board's reading point (Gaussian bump, `SLOW = 5`), so the car slows down while a board is
  readable and the dial drops. It never stops in the middle of the screen. The page opens
  with the first board at reading size.
- Track sprites keep clear of board segments. Hero and strengths boards are 620 px wide;
  strengths use a 2x2 grid on the board.
- Horizon at 56% (desktop) and 58% (phone) to leave room for boards in the sky.
- Reduced motion: the plain document over one parked road frame. Agent view: switching
  back re-measures the boards.
- Keyboard: tabbing to a link on a board drives there; the Exits menu jumps to a section.

Checked (Chrome DevTools MCP, local server): every board fully on screen at its reading
point on desktop 1280x800 (scale 0.94 to 1.0) and phone 390x844 (0.9); Exits menu; Agent
view and back; reduced motion; print is one A4 page (headless Chrome PDF). Frame timing
on the phone viewport with 4x CPU throttling while driving past boards: 16.7 ms average,
p95 17.5 ms (rAF timestamps, not a full trace; a real phone is still untested). No script
errors; the only console error is the local server's missing `favicon.ico`.

Open for the next iteration:
- Feel: reading dwell (`SLOW`), board spacing (`GAP`), reading distance (`READ_Z`).
- Boards are flat and face the camera; angled boards would look more like a highway.
- Lamp poles and palms are drawn on the canvas, so they always sit behind the boards,
  even when nearer.
- Long boards (the 2022 and 2016 changelog entries, strengths) could get shorter text, as
  the brief suggested; right now they fit by taking more of the screen.
- Scaled text is re-rasterised every frame; check sharpness and smoothness on a real phone.

### v3.2: one exit at a time, four landscapes (2026-10-26)

Feedback on v3.1: the first board was partly cut off, the drive was far too long, and
continuous scrolling felt good but made the content hard to read. The roadside was empty.
Asked for: every board 100% visible, a hop from one board to the next instead of continuous
driving, and a changing landscape (a Miami-style drive from jungle through swamp and city to
a beach).

Interview decisions (locked):
- **Stepping:** one gesture, one board. A scroll, swipe or key press drives about a second
  to the next board and parks with it fully visible. Input during the drive is ignored, so
  trackpad momentum can't overshoot.
- **Length:** fewer, merged boards. 24 boards became 10 stops: limitations in two boards
  (mine, then the AI's), the changelog in three boards by era (2018 to 2026, 2014 to 2016,
  2006 to 2013). The full text stays in the Agent view and the print CV.
- **Biomes follow the story:** jungle for the intro and "Currently", swamp for limitations
  and strengths, city for the changelog, beach for writing and arrival.
- **Night throughout:** each biome tints sky, fog and ground; no sunrise.

How it works:
- `data-biome` on the first sign of each biome sets where the landscape changes (halfway
  between two boards, blended over 30 segments). Each biome has its own road (jungle:
  winding and hilly; swamp: flat with lazy bends; city: straights and the odd overpass;
  beach: along the shore), ground colours, background layers (volcano and canopy; cypress
  treeline and mist; two rows of skyline; far islands and dunes) and roadside sprites
  (trees, banana plants, ferns, palms; cypress with moss, reeds, snags, a pair of eyes in
  the water; towers with lit windows, lamps, neon signs; palms, umbrellas, a lifeguard
  tower, and the sea on the right). In a transition the sprites are mixed at random,
  weighted by the blend.
- Each board's stop is where it shows at reading size. On short, wide screens a board that
  is too tall gets wider (up to 940 px) instead of smaller. Phones centre the board.
- Input: wheel and trackpad (one gesture = a burst of events; a 220 ms pause starts a new
  one), swipe, arrow keys, Page Up/Down, Space, Home/End, j/k, the HUD's back and next
  buttons (hidden on phones), and the Exits menu. Tabbing to a link drives to its board.
  Opening with a section hash (`#changelog`) starts there.
- Boards are re-measured once fonts and the photo have loaded. Measuring before that was
  the likely cause of the cut-off first board.
- Nothing scrolls in road mode; the scroll track is gone.

Checked (Chrome DevTools MCP, local server): every board fully on screen at its stop on
1280x800 (scale 0.88 to 1.0), 1366x650 (0.78 to 1.0) and phone 390x844 (0.74 to 1.0);
one trackpad flick and three quick wheel notches each move exactly one board; swipe works
and the page doesn't scroll; Agent view scrolls normally and switching back drives again;
reduced motion shows the flat document; print is one A4 page. Phone viewport with 4x CPU
throttling through jungle and swamp: 16.7 ms average frame, max 17.7 ms (rAF timestamps).
No script errors.

Open for the next iteration:
- Scenery density and brightness, per biome. The sprites are drawn in code and still look
  like line art up close.
- The sea is only on the right; the swamp has no reflections yet.
- Hop duration (`HOP`), spacing (`GAP`, `GAP_BIOME`).
- On phones and short laptops the longest boards (changelog 2018 to 2026, limitations) still
  shrink to about 0.75.

### v3.3: the car, free driving with parking, the ocean (2026-10-26)

Feedback on v3.2: continuous scrolling looked better than stepping, so mix the two. The
page wasn't responsive (needed a certain window size, resized badly). The drive should end
directly in front of the ocean. Switch from first person to an OutRun-style camera behind a
car: open with the car door closing, end on the car's side profile at the sea. The Exits
button moved around depending on the board.

Interview decisions (locked):
- **Free drive, magnet stops:** scroll and swipe drive continuously; when the input pauses
  (140 ms), the car rolls to the nearest board in the direction of travel and parks with it
  fully visible. A nudge of more than 12% of the gap counts as "next". Keys, the back/next
  buttons and Exits still hop one board.
- **Car:** pixel art, OutRun-like, drawn in code (64 x 32 from behind, 104 x 36 from the
  side), scaled up crisp. A generic red 80s convertible, no Ferrari shape or logos. Two
  people in it. It leans in curves.
- **Intro plays, ending is driven:** on load, the side view in the jungle, the door shuts
  (with a small shake), the camera swings round behind the car (about 2.5 s; any input
  skips it; arriving by link skips it). The swing back to the side view at the end is tied
  to the last stretch of road, so it plays (and reverses) with the drive.
- **Extras, all four:** brake lights and headlights; the address follows the drive
  (`#changelog`, back button works); a biome strip in the HUD with a dot for the car and a
  tick per board; life while parked (fireflies, flickering neon, waves), only while the tab
  is visible and never with reduced motion.

How it works:
- Third-person camera: the car is parked just above the HUD; `playerZ` (how far ahead of the
  camera the car is) is solved per viewport so the road under the car lands at its wheels.
  The camera height follows the road under the car.
- The swing between views is a 2D trick: the road scene cross-fades to a side-view scene
  (sky, sun, layers, then a road band with jungle, or sea and sand), while the rear sprite
  narrows to nothing and the side sprite grows from nothing.
- The ending: the last stretch is straight and flat; the road narrows into sand and the sea
  starts just past the car's final stop. The sun settles over the middle on the way in.
- Responsive: resizing is throttled to one per frame and keeps the car's place between
  boards. Per board, the layout that reads largest wins: wider, or with long lists in two
  columns on short, wide screens (the narrowest layout reaching 0.85 is preferred). Boards
  stay above the car unless that would put them under 0.8; then they may cover it. Big
  screens read up to 1.5x. Phones get tighter board typography; short screens get slimmer
  bars.
- HUD: three fixed grid columns, so Exits stays centred.

Checked (Chrome DevTools MCP, local server), every board fully on screen at its stop:
1280x800 (0.85 to 1.0, all above the car), 1920x1080 (1.0 to 1.32), 800x600 (0.66 to 1.0),
landscape phone 844x390 (0.57 to 0.80, covering the car), phones 390x844, 375x667 (0.66 to
1.0) and 320x568 (0.48 to 1.0). Resizing from 844x390 to 1280x800 kept the board. Trackpad
and swipe drive and park; a small nudge back stays. Phone viewport with 4x CPU throttling:
16.7 ms average frame, p95 17.5 ms while driving and while parked. Reduced motion, Agent
view and print (one A4 page) unchanged. No console errors.

Open:
- The smallest phones (320 px wide) still show the first changelog board at about half size.
- Pixel art could use a second pass (faces, more frames for steering).
- (Resolved: the "car drove on its own" moment in the first test run was the author trying it
  out at the same time.)

### v3.4: a 3D car, a real orbit and a driving turn (2026-10-26)

Checkpoint before this: commit `ebfd0c4`, tag `me-v3.3` (local only). If the transitions
don't feel better, that is the version to go back to.

Feedback on v3.3: feels good. Improve the side-to-back transition at the start and the
back-to-side one at the end ("a driving turn or a camera transition"); make the car a cool
sports car.

Interview decisions (locked):
- **Car:** a made-up synthwave concept car: a low wedge, neon trim (magenta shoulders, cyan
  sills), an underglow, a rear wing, a scissor door. Targa roof with two people in it.
- **Technique:** a low-poly 3D model (about 150 flat-shaded faces), rasterised every frame
  into a 220 x 120 pixel buffer with a depth buffer, and scaled up crisp. Pixel art that can
  turn: correct from every angle, no sorting glitches.
- **Ending:** a driving turn. Over the last stretch the car steers right and turns 90 degrees
  to park along the shore; the camera backs off and the scenery fades to the side view.
  Driven by position, so scrolling back reverses it.

How it works:
- Opening: the passenger's scissor door swings down and shuts, the car rocks, then the camera
  orbits from the right side round to the back (about 2.8 s). The side view shows the right
  side because the nose points right.
- Driving: the car yaws into curves and leans out of them; the front wheels steer. Brake
  lights and headlights as before.
- The car is anchored by its lowest tyre contact point, so perspective never pushes it into
  the HUD.

Checked: opening and ending captured frame by frame; steering in curves; 60 fps on the phone
viewport with 4x CPU throttling (16.7 ms average, max 17.7 ms); reduced motion has no errors.

Open:
- The model is simple; candidates for a second pass: a smoother nose, mirrors, visible
  steering wheel, hair that moves at speed.

### v3.5: the whole world in pixel art (2026-10-26)

Checkpoint before this: commit `2422061`, tag `me-v3.4` (local only).

Feedback on v3.4: loves the car, the pixel art and the animations; "we might end up using
this, at least for a variant of the site". Asked for the rest of the world in the same pixel
style as the car.

Interview decisions (locked):
- **Low-res frame, palette and dithering:** the road scene is drawn at one canvas pixel per art
  pixel (`PIX` CSS pixels, chosen so the car is about 64 art pixels wide) and scaled up with
  `image-rendering: pixelated`. Every frame is then reduced to a fixed palette (about 90
  colours) with 4 x 4 ordered dithering (a lookup table over 15-bit RGB).
- **Pixel sprites:** the vector scenery is kept only as a drawing source: each shape is drawn
  small, snapped to three or four colours (dark, dark highlight, a dimmed rim) and given a
  one-pixel outline in the biome's neon. Buildings, lamps and neon signs (with a 3 x 5 pixel
  font) are drawn pixel by pixel.
- **Boards:** a 9-slice pixel frame (SVG `border-image`, stepped corners), hard pixel shadows,
  and Pixelify Sans (OFL, self-hosted, `fonts/OFL-pixelify-sans.txt`) for headings, warning
  bands, year ranges and the HUD. Body text stays Space Grotesk. Print is unchanged.
- **Extras, all four:** palette cycling (waves, the volcano's lava, the chasing letters of the
  pink neon sign); faint scanlines, one per art-pixel row, under the boards; more life (an
  alligator that surfaces in the swamp, a parrot crossing the jungle sky, teal traffic in the
  city's left lane, a lighthouse with a sweeping beam at the beach); chunkier pixels on phones
  (at least 3 CSS pixels per art pixel).

Checked: every board fits at 1280x800 (0.85 to 1.0) and 844x390 (0.55 to 0.80); 60 fps with
4x CPU throttling on the phone viewport and at 1920x1080 (the palette pass is cheap at
275 x 155 art pixels); reduced motion has no errors; print is one A4 page.

Open:
- Sprites near the camera are magnified, so their pixels are bigger than the world's (as in
  the arcade original). Larger source sprites would fix that at the cost of shimmer far away.
- The portrait photo is not pixelated; that could be a fun touch, or a step too far.
- (v3.5, later) A calm ocean in the final shot. A first try with rows of crests and fast colour
  cycling looked hectic; now the sea is a smooth, still gradient (outside the cycling
  colours) with a few faint lines, and only three soft waves at a time, each a single long
  line that rolls in over about 14 s, gets lighter and breaks gently. The foam washes up the
  sand slowly; the sea's colour cycle on the approach is slowed to 1.2 steps a second.

## v4: three views, one data file (2026-10-26)

Checkpoint before this: commit `a8cb0fd`, tag `me-v3.5` (local only).

The readable page is v1 (Black Rock Lava) with its Agent view; the v3.5 pixel drive becomes
the third view, the Arcade. Built in `me/v4/` next to the drafts; `me/index.html` stays the
draft picker until v4 replaces it.

Decisions (locked):
- **Three views in the switch:** Human | Agent | Arcade. The Arcade is always in the switch
  (in Pixelify Sans), so it is easy to get in and out. Without JS the switch has two options.
- **The easter egg:** a small pixel car parked under the colophon. Hover flashes its
  headlights; a click revs it (shake, two puffs of smoke), it drives off to the right, the page
  switches off like an old TV (to a line, then a dot), and comes back on in the Arcade, where
  the door shuts and the camera swings behind the car. Reduced motion: straight in.
- **One data file:** `_data/me.yml` holds the content; Jekyll builds the Human page, the Agent
  terminal and the Arcade boards from it (`me/v4/index.html`, `layout: null`). "Recently
  written" now comes from the blog's latest posts (`recent_posts: 3`).
  Section headings (`sections`, with Arcade `exit` and terminal `agent` variants) and the
  small fixed labels (`labels`) live there too, so no text is written into the template.
- **Old drafts stay** under `/me/v1/` to `/me/v4/`, unlinked once the final page is live.
  (Superseded: the drafts were removed when v4 moved to `/me/`; they live on in git history
  and the local `me-v*` tags.)

How it fits together:
- `me/v4/style.css`: v1's styles, with its component rules (`.now`, `.limits`, `.strengths`,
  `.posts`, `.contact`, `.colophon`, `.meta`, `.portrait`) scoped to `.view--human` so they
  don't leak into the arcade boards; plus the third view, the footer car and the CRT effect.
- `me/v4/arcade.css`: generated from `me/v3/style.css`, every rule scoped to `.view--arcade`
  (or to `html.road` while the drive runs); print, base and terminal rules dropped.
- `me/v4/arcade.js`: v3.5's `road.js`, now switched on and off with the view (it stops its
  frame loop, gives back scrolling and resets input when the Arcade is left).
- `me/v4/view.js`: loads `arcade.css` and then `arcade.js` on first use; `#arcade` (or
  `#arcade-<board>`) opens the Arcade, the back button and Esc leave it.
- Arcade board ids are prefixed (`arcade-changelog`), so the address bar can follow the drive
  without clashing with the Human view.
- Fixed on the way: v1's ember glow made the page wider than a phone (now clipped with
  `overflow-x: clip` on the Human view); the "view" label hides below 440 px so three options fit.

Local preview (Jekyll is needed now, the Python server only serves v1 to v3):
- Ruby 3.4 no longer bundles some libraries Jekyll 3 needs, and Bundler resolved an old
  `github-pages` that breaks on Ruby 3.4. A git-ignored `Gemfile.local` pins `github-pages 232`
  and adds `csv`, `base64`, `bigdecimal`, `logger`, `webrick`. The tracked `Gemfile` is
  unchanged (GitHub Pages builds with its own versions).
- Gems install into `vendor/bundle` (git-ignored, as are `_site/` and the caches; the repo had
  no `.gitignore` before).
- Run: `BUNDLE_GEMFILE=Gemfile.local bundle exec jekyll serve --host 127.0.0.1 --port 4001`
  and open `/me/` (it was `/me/v4/` before the promotion).

Checked (Chrome DevTools MCP against the Jekyll server): the Agent terminal and the Human
page text are identical to v1 except two intended changes (the photo path in the terminal,
`./` to `../`, and the colophon now mentions the script for the third view); print is one A4
page with the same text as v1; without JS only Human and Agent show; the footer car drive-off,
CRT and Arcade opening; switching back gives scrolling back and v1's styles are untouched;
`#arcade-changelog` deep link, back button and Esc; reduced motion (straight in, still frame,
boards as a list); light mode (the Arcade stays dark); phone 390 px (no sideways overflow);
all ten arcade boards fit at 1280x800 as in v3.5.
- (v4, later) The Human view uses the look of `me-v1` (commit `2b02a5d`), not v1.1: the author
  preferred it from a screenshot. v1.1's changes are reverted in `me/v4/style.css`: rock
  grain back to a faint overlay (7%), the name's steady gradient instead of the drifting
  "molten" one, the slow ember (18 s), the breathing 1 px fissure dividers instead of the
  flowing hot spot, no heat shimmer on the strengths cards. Also fixed: two one-line
  `@media` rules (Currently labels, Recently written dates) had missed the `.view--human`
  scoping and lost their two-column layout.

### Release-note titles and headings in the data file (2026-10-26)

- Changelog titles rewritten from "In Which..." (that style belongs to blog posts) to
  release-note style: "Added: a blog, to remember what broke", "Changed: employer to
  Anyline, scope to mobile SDKs", "Fixed: zero hackathon wins (Droidcon UK 2013)", and so on.
  One `title` field per release; Human view and Arcade both use it, the terminal keeps its
  own `agent` lines.
- Section headings, Arcade exit names, the terminal headings and the small labels moved from
  `me/v4/index.html` into `_data/me.yml`. The generated page is byte-identical apart from the
  new titles.

### Promoted to /me/, and the content follows the CV (2026-10-26)

- v4 is now the page: `me/index.html`, `me/style.css`, `me/arcade.css`, `me/arcade.js`,
  `me/view.js`. The draft picker and `me/v1/` to `me/v4/` are gone (history and tags keep
  them). The page is in the sitemap now; paths to `fonts/` and `photo.jpg` are relative to
  `me/`. Older sections of these notes still name the `me/v4/` paths.
- Navigation: "About" is now "About the Blog", plus a "Me" entry for `/me/`. The About page
  ends with a link to `/me/`.
- The CV (`cv/cv.tex`) is the reference for facts. Changes to match it: "Engineering leader";
  the Anyline entry and "Currently" name the wider scope (shared core, Tire Tread SDK, cloud)
  and the agentic engineering workflow; a new minor release v2023 for the *Leadership To Go*
  program; the exchange term at Kennesaw State moved from the BSc to the MSc entry.
  Team sizes and internal details from the CV stay off this page.
- The Arcade's changelog boards are now 4 / 4 / 4 releases: 2020–2026, 2014–2018, 2006–2013.
- Next, outside the repo: Cloudflare redirect for `rubbad.uk` and `www` (see "Prototype
  workflow", step 5). After the push: test on a real phone.
