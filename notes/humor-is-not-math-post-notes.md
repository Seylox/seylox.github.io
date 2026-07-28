# Notes: "In Which We Discover That Humor Is Not Math"

Working notes for the post at `_posts/2026-07-27-blog-humor-is-not-math.md`. Distilled from the research + editing conversation on 2026-07-27.

## The story (facts only, with sources)

### The headline event

- **July 20, 2026, 2:19 AM UTC**, during the World Cup final: Levent Alpöge posts ~216 characters on X announcing the **Jacobian conjecture is false**. Wording began "hello there the jacobian conjecture is false thanx", crediting Akhil Mathew (asked the question) and Claude Fable 5 (found the counterexample). Primary source: <https://x.com/__alpoge__/status/2079028340955197566>. Coverage: <https://theconversation.com/hello-there-the-jacobian-conjecture-is-false-thanx-why-a-tiny-social-media-post-has-mathematicians-rethinking-ai-283883>
- Conjecture open since **1939** (Ott-Heinrich Keller), 87 years. DISPROVED, not proven. Counterexample kills dimensions ≥ 3; **the 2D case remains open**.
- The counterexample (degree 7, Jacobian determinant identically −2, generically three-to-one):
  ```
  a = (1+xy)³z + y²(1+xy)(4+3xy)
  b = y + 3x(1+xy)²z + 3xy²(4+3xy)
  c = 2x - 3x²y - x³z
  ```
- Verified worldwide within hours (finite exact algebra, checkable in any CAS). Speyer's writeup: <https://sbseminar.wordpress.com/2026/07/20/the-new-counterexample-to-the-jacobian-conjecture/>. Tao's analysis July 21 (says he lacks a "completely satisfactory geometric explanation for this miracle"): <https://terrytao.wordpress.com/2026/07/21/a-digestion-of-the-jacobian-conjecture-counterexample/>. Lean formalization merged July 26: <https://github.com/google-deepmind/formal-conjectures/pull/4474>
- Caveats to keep: no Anthropic paper/transcripts exist; discovery narrative rests on Alpöge's word; human-directed search, not autonomous mathematician. Nothing proven collapses (only conditional "if JC then X" results become moot; Bass–Connell–Wright reduction means Dixmier conjecture dies too).

### The wave (Jan–Jul 2026)

- **May 2026**: Erdős **unit-distance conjecture (1946) disproved** by an OpenAI internal model; checked pre-announcement by Gowers, Litt, Tsimerman et al.; later fully Lean-formalized (~1.2M lines). <https://www.scientificamerican.com/article/ai-just-solved-an-80-year-old-erdos-problem-and-mathematicians-are-amazed/>
- **Jul 11, 2026**: Grothendieck group-scheme question (~60 years) killed by counterexample (OpenAI model, Akhil Mathew); Claude autoformalized the proof into a 1,076-line Lean file in ~4 hours.
- **Jul 14, 2026**: **Benjamini–Hochberg FDR conjecture disproved** (GPT-5.6, ~90 minutes). Real-world texture: BH is the standard false-discovery control in genomics/clinical trials. Fine print: violation is tiny (FDR 1.04% at nominal 1%); certainty died, practice survives.
- **Feb/Mar 2026**: **Knuth's Hamiltonian-cycle conjecture** solved by Claude Opus 4.6 in ~1 hour (via correspondent Filip Stappers). Knuth (88) wrote a 5-page paper, "Claude's Cycles", opening "Shock! Shock!", closing "Hats off to Claude!" <https://www-cs-faculty.stanford.edu/~knuth/papers/claude-cycles.pdf>
- **Erdős problems**: ~15 moved open→solved since January, 11 crediting AI; one closed in April by a 23-year-old amateur with ChatGPT, Tao reviewing. Tao's tally (with his "lowest-hanging fruit" caveat): <https://github.com/teorth/erdosproblems/wiki/AI-contributions-to-Erd%C5%91s-problems>
- **Erdős lifestyle color** (keep): most prolific mathematician of the 20th century, no house, lived out of a suitcase, showed up at doors saying "my brain is open", paid cash bounties for his problems.
- **The pattern**: nearly all disproofs/counterexamples. Buzzard, "Human mathematicians are being outcounterexampled": <https://xenaproject.wordpress.com/2026/07/20/human-mathematicians-are-being-outcounterexampled/>. Machines out-search rather than out-think; theory-building still human.

### The cautionary tale

- **"Erdősgate", Oct 2025**: OpenAI researcher claimed GPT-5 "solved" 10 open Erdős problems; it had retrieved existing solutions from unindexed literature. Hassabis: "so embarrassing". <https://techcrunch.com/2025/10/19/openais-embarrassing-math/>
- Two takeaways: (1) even experts mistake plausible output for discovery; (2) retrieval is genuinely useful, the sin was labeling. The embarrassment produced the verification discipline that made 2026 claims stick.

### Why it works (the mechanism)

- **Lean** (<https://lean-lang.org/>, library: <https://leanprover-community.github.io/>): proofs as programs; compiles = proven; tiny trusted kernel; a 1.2M-line machine proof is as trustworthy as a 10-line human one. POST DECISION: link, don't explain at software-engineer depth. General-public audience.
- **Training loop**: reasoning models are trained by generating huge numbers of attempts at auto-checkable problems and keeping what verifies (RL on verifiable rewards). Thinking = scratchpad tokens; backtracking/self-doubt emerge because they win. The verifier is both quality gate and teacher.
- Framing: math is where a perfect verifier exists, so math is where AI got superhuman first. The generator can lie; the checker can't be charmed.
- Bernd's point to keep: the grind didn't vanish, it was delegated and became **hardware + energy + time**, which scale with how much you care about the answer; human patience doesn't.

### The spectrum (the post's spine)

- Verifiability spectrum: math (perfect verifier) → code (tests/compilers, leaky) → theoretical physics → simulation-based engineering → law (split: cited case exists = checkable; persuading a judge = not) → "what's the best hotel" (aggregated subjective preference) → **humor** (far end).
- Humor's verifier: exists (the room laughs) but expensive (one audience per data point), perishable (2019 jokes die in 2026), context-dependent (audience, culture, news of the morning), and hostile to repetition: **a joke verified once is now less funny**. "A test suite that fails because it passed before."
- THE HOOK (Bernd's): humor ≠ math; **models are very good at universal truths and very bad at societal conventions**.
- The "stop lying" answer: models are trained to be correct where checkable and plausible everywhere else, because there plausible and correct are indistinguishable to training. No setting turns it off. Practical advice: trust in proportion to checkability; push questions toward the checkable end (sources you'll click, checkable sub-parts); otherwise treat output as a well-read acquaintance's opinion.
- Ties to Managing the Intern post: "can I check its work cheaply?" (/2026/06/26/blog-managing-the-intern-field-manual.html)

## Personal frame (facts, do not embellish)

- The question "how do I get AI to stop lying to me?" came from an acquaintance, **she/her**, interested in AI but not deep in it. The conversation happened **while Bernd was herding the kids**. NOT over drinks. Do not invent scene details beyond this.

## Style contract for the rewrite

- **Gonzo ride** (Back to the Future / Fear and Loathing energy): propulsive, reader in the passenger seat, natural, not try-hard. Blend with WRITING-GUIDE (dry humor, personality, no corporate voice, no AI hype).
- **Never condescending.** Entertaining and provoking, yes; talking down, no. Cut anything with a "you probably didn't know" smell.
- Audience: general public with higher education, no math background. Assume intelligence; supply analogies and hooks for self-research, not lectures.
- Big words only when they earn their seat.
- **Banned LLM tics**: em dashes (guide), "load-bearing", "this was X, not Y" / "it's not X, it's Y" constructions, "game-changer", "leverage", forced puns.
- Keep and mark: AI co-authorship (honestly, without being slop), explicit flags where an analogy sacrifices correctness.
- Keep if nothing better: closing disclaimer "It assures me this post is funny. There is no way to verify that." (Bernd chuckled.)
- Keep the color: Knuth details, Erdős lifestyle.
- Analogies that worked in conversation: conjecture = wanted poster; crushing vs folding a sheet; polynomials = glass, "Fable found a way to fold glass"; math has a compiler now; comedy club at the far end of the spectrum.
- Length: guide targets 1200–1800 words (hard ceiling ~3000); Bernd's cap: under 15 min read.
