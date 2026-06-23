# Plan: blog post on working well with AI
(working title open; favorite leans on "...Machine That Thinks I'm Brilliant")

## Decisions locked
- This is a "here are my thoughts" piece. NOT the dry-Pratchett, single-overlaying-theme format of
  the other posts. Relaxed, genuine, entertaining where it's entertaining, not performing a bit.
- NO forced overarching metaphor (entropy spine dropped). The two distinctions give enough shape.
- The TWO DISTINCTIONS are the backbone, everything else hangs off them or stands as a side thought:
    1. Just done vs done well
    2. Determinism vs non-determinism
- Tone of the sycophancy/laziness thought: analytical (per earlier call), but within the looser
  overall register.
- Anecdotes: themes first; slot real examples in later. Draft uses [BRACKETED PLACEHOLDERS].
- Still: first person, "we" = me + Claude Code (light, optional now), no em dashes ever.
- Length: flexible. Probably 1200-1600 words but not a hard target; let the thoughts breathe.

## Shape
Open by naming the realization: working well with AI is mostly judgment, and for me it comes down
to a couple of questions I keep asking. Lead with the two distinctions. Then a looser set of
thoughts that follow from them. No grand unifying close, just an honest landing.

## Outline

### 0. Front matter
"In Which..." title (TBD) / date / one-sentence excerpt / toc: true / toc_sticky: true

### 1. Open (~120w)
- The realization: the hard part isn't prompting, it's judgment. A handful of questions I keep
  asking myself. Two of them do most of the work. Name them.
- Light, personal, sets the "these are my thoughts" register. Establish me + Claude if it's natural.

### 2. Distinction one: just done vs done well (~300w) -- BACKBONE
- The core triage. Some work just needs to exist; some needs to be good.
- Same axis from another angle: "glad it just exists" vs "I want a human in this." Boilerplate and
  regex I'm happy to never think about; the design call I'll defend, the hard message to a person,
  those I want to be a human act.
- Most "AI is bad at X" is really "I wanted done-well and spent done-fast effort," or vice versa:
  agonizing over a throwaway.
- [PLACEHOLDER: a just-done task handed off happily vs a done-well one kept]

### 3. Distinction two: determinism vs non-determinism (~320w) -- BACKBONE
- Do I want a fixed outcome or am I fine with variation? This decides HOW I use the tool.
- If I want determinism, I move up an abstraction layer: don't have AI make the thing, have it
  build the tool that makes the thing, then I run the tool. AI is a poor reliable factory but a
  good factory builder.
- Repetitive tasks are the obvious case: don't prompt the same task N times, ask once for the
  automation. Then it runs identically, for free, forever.
- Rule of thumb: if run-to-run variation would annoy me, I wanted determinism, so move up a level.
- [PLACEHOLDER: a repetitive task turned into an automation instead of N prompts]

### 4. Further thought: enrich the context or start over (~220w)
- Daily craft skill. Enrich when converging (each loop closer, real accumulated understanding).
  Reset when spiraling (context polluted with dead ends, model tripping over its own mistakes).
- Converging through loops is just how humans work too; cheap loops make the "when to stop /
  when to reset" call matter more, not less.
- [PLACEHOLDER: a session that needed a hard reset]

### 5. Further thought: who lives with the consequences (~220w)
- The agent doesn't live with the consequences of what it does. It won't get paged, won't maintain
  this for two years. Unless I close the loop and force the consequence back on it (tests, CI,
  review, "now debug what you wrote").
- Monkey see, monkey do: corpus quality varies wildly and local context dominates. Clean codebase
  -> clean code; messy one -> it lovingly extends the mess. So I can't assume good defaults; I
  have to set them.
- [PLACEHOLDER: crap-codebase concrete moment, or a loop-closing setup]

### 6. Further thought: does it make me lazier, and the flattery problem (~300w) -- analytical
- Honest answer on laziness: tendency is yes. Frictionless tool, and friction is where learning was.
  Not inevitable, but it's the downhill direction.
- Subtler: sycophancy. The tool hands you the feeling of expertise fast while you took shortcuts.
  You believe you understand what you only watched happen. The "illusion of explanatory depth."
- Counter-move: deliberate extraction. Building a functional-programming course from the corpus.
  The corpus has everything, which is exactly why it's useless raw; the skill is pulling out the
  right things in the right order and actually metabolizing them. Using AI to learn vs to feel
  like you learned.
- [PLACEHOLDER: FP-course specifics]

### 7. Close (~80w)
- No grand summary. Honest landing. The irony is available and probably worth one line: written
  with the same tool, which will of course tell me it's a great post.
- End on a real thought, not a bow.

## Risks
- Without a spine, watch for it reading as a disconnected list. Connective tissue between thoughts:
  each "further thought" should clearly follow from one of the two distinctions where possible.
- Don't over-perform humor; the user wants relaxed, not a routine.
- Placeholders must read as load-bearing principle even before the anecdote lands.
- No em dashes.
