# Notes: the "Me" page

Working notes for a personal one-pager at `blog.rubbad.uk/me/`, reached via `rubbad.uk`.
Pick up from here in any session. Decisions marked **locked** are settled; don't re-litigate.

Heads-up: everything in `notes/` is publicly served by GitHub Pages once pushed. Nothing
internal, nothing about job searches, nothing an employer wouldn't want public.

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
5. Changelog: career as release notes, newest first, with "In Which..." titles.
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
