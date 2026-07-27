---
layout: single
title: "In Which We Discover That Humor Is Not Math"
date: 2026-07-27
excerpt: "An 87-year-old math problem died on a Sunday night, in a social media post, during the World Cup final. A friend of mine wants to know how to get AI to stop lying to him. These are, it turns out, the same story."
toc: true
toc_sticky: true
---

At 2:19 in the morning UTC on July 20, while most of the planet was watching the World Cup final, a mathematician named Levent Alpöge posted [216 characters on X](https://x.com/__alpoge__/status/2079028340955197566). The post, in its entirety, was three short polynomial formulas and a caption that began, and I need you to appreciate that this is the actual wording: ["hello there the jacobian conjecture is false thanx"](https://theconversation.com/hello-there-the-jacobian-conjecture-is-false-thanx-why-a-tiny-social-media-post-has-mathematicians-rethinking-ai-283883). He thanked his friend Akhil for asking about it, and his other friend, Fable, for finding it.

The Jacobian conjecture had been open since 1939. Eighty-seven years of the best living specialists trying to prove it. Fields Medalists took runs at it. It died overnight, in a tweet, at the hands of a large language model, while the humans were watching football.

"Fable" is Claude Fable 5, Anthropic's model, released about six weeks earlier. And before you file this under the usual AI hype, which would be a reasonable reflex, here's the part that makes this story different from every "AI solves X" headline you've learned to scroll past: within hours, mathematicians around the world had checked it, by hand and by computer, and it held. By July 26 the result was [formally verified](https://github.com/google-deepmind/formal-conjectures/pull/4474), and I'll get to what that means, because it's the actual point of this post.

We've been reading about this for a week now (regular readers know "we" means me and Claude Code, which makes this post a slightly awkward one to co-write, like interviewing your intern about their famous cousin). What started as curiosity about one headline turned into the answer to a completely different question, one a friend of mine asked me recently over drinks: *"How do I get AI to stop lying to me?"*

Strap in. To answer him we have to go through 1939 first.

## What died, exactly

A quick vocabulary stop, because I had to look this up myself: mathematics sorts every precise claim into three buckets. Proven true (that's a theorem, and it's permanent). Proven false. Or open: nobody has managed either. A **conjecture** is an open claim that someone respected has pinned to the wall saying "I'm fairly sure this is true, someone please prove it." A wanted poster, with mounting circumstantial evidence and no conviction. And here's the brutal rule of the genre: "everyone believed it for 87 years" carries exactly zero weight. One counterexample and it's dead.

The Jacobian conjecture is about transformations of space, so picture one: a rule that takes every point of a rubber sheet and moves it somewhere else. Stretching, twisting, whatever. Look at any tiny spot through a magnifying glass while this happens. Two bad things could happen to that spot. It could get **crushed** flat, squashed to nothing, information destroyed. Or it could survive locally but the sheet could **fold**, so that two different parts of it end up stacked on the same place, and you can no longer tell which point "came from" where.

There's a number, the Jacobian determinant, that measures crushing at each point. The conjecture's setup: suppose that number is a nonzero constant everywhere. The transformation never crushes anything, anywhere. The question: can it still fold?

For floppy transformations, obviously yes. Fold a piece of paper in half: no point gets crushed, every small patch is fine, and yet the two halves overlap. Local innocence does not prevent global folding. Everyone knows this.

But the conjecture was about transformations built purely from **polynomials**, expressions like `x² + 3xy + 7`, the stuff of school algebra. And polynomials are not floppy. They're rigid, more like sheet glass than paper: what a polynomial does in one tiny region pins down what it does everywhere. The conjecture said, in effect, *glass can't fold*. If a polynomial transformation never crushes, it can't overlap either; it must be cleanly reversible. For 87 years this looked true, was proven in lots of special cases, and matched everyone's intuition. (Fair warning that I've sacrificed some correctness for that analogy: the real setting is three-dimensional *complex* space, which is six real dimensions and not picturable by anyone, and "rigidity" is my stand-in for a precise technical property. The logic of the story survives the simplification.)

What Fable found is a way to fold glass. Here it is, the entire thing:

```
a = (1+xy)³z + y²(1+xy)(4+3xy)
b = y + 3x(1+xy)²z + 3xy²(4+3xy)
c = 2x - 3x²y - x³z
```

That's a transformation of 3D space that provably never crushes (its determinant works out to the constant -2) and yet lands three different points on the same output. As David Speyer put it in [his writeup](https://sbseminar.wordpress.com/2026/07/20/the-new-counterexample-to-the-jacobian-conjecture/), the map is "generically three to one, not bijective." You can check this yourself with any computer algebra system in minutes. Thousands of people did, that same day.

Two things worth knowing before we move on. First: nothing collapses. Conjectures are known-unproven, so nobody builds bridges on them; the results that assumed it ("if the conjecture holds, then...") become moot, not wrong, like contingency plans for an event that got cancelled. Second, and this is my favorite detail of the whole affair: nobody understands *why* it works. [Terence Tao](https://terrytao.wordpress.com/2026/07/21/a-digestion-of-the-jacobian-conjecture-counterexample/), arguably the most famous living mathematician, wrote that he doesn't yet have a satisfactory explanation for the "miracle." The machine handed us a true fact and kept the insight to itself, possibly because it never had it.

## It wasn't just the one

If this were an isolated event you could call it a stunt. It's the opposite of isolated; it's the loudest event in a seven-month barrage.

In May, an OpenAI model disproved a conjecture Paul Erdős posed in 1946, about how many pairs of points in the plane can sit at exactly distance 1 from each other. Eighty years open. Timothy Gowers, another Fields Medalist, [checked it personally before the announcement](https://www.scientificamerican.com/article/ai-just-solved-an-80-year-old-erdos-problem-and-mathematicians-are-amazed/). In July alone, and I mean the *same two weeks* as the Jacobian result: a 60-year-old question of Grothendieck's, answered by a counterexample that Claude then translated into machine-checkable form in four hours; and a statistics conjecture underlying the standard method for controlling false discoveries in genomics and clinical trials, disproven by a model in about 90 minutes. (That last one sounds apocalyptic and isn't: the violation found is a false-discovery rate of 1.04% where 1% was promised. No drug approvals are collapsing. What died is the certainty, not the practice.)

My favorite of the batch, though, is the quiet one from February. Donald Knuth, now 88, the man who wrote the actual book on computer science, had an open conjecture of his own that he'd poked at for decades. A correspondent fed it to Claude, which found the general construction in about an hour. Knuth wrote it up in a five-page paper titled ["Claude's Cycles"](https://www-cs-faculty.stanford.edu/~knuth/papers/claude-cycles.pdf) that opens with "Shock! Shock!" and closes with "Hats off to Claude!" If you read one primary source from this post, make it that one; it's the most charming document the AI era has produced.

And around all of this, the Erdős problems have been falling steadily. Erdős was the 20th century's most prolific mathematician, a man with no house who lived out of a suitcase and paid cash bounties for solutions to the hundreds of problems he scattered across the field. About a thousand of them are catalogued online, which accidentally made them the perfect scoreboard, and since January roughly fifteen have gone from open to solved, most with AI in the loop. One was closed in April by a 23-year-old with no formal training, working with a chat model, with Tao reviewing the result. Tao himself [keeps the tally](https://github.com/teorth/erdosproblems/wiki/AI-contributions-to-Erd%C5%91s-problems), and is careful to note that these have been the list's lowest-hanging fruit. They were still fruit nobody had managed to pick.

Notice the pattern, because everyone in the field has: these are nearly all **disproofs**. Counterexamples. Kevin Buzzard, a mathematician we'll meet again in a moment, titled his post on the phenomenon ["Human mathematicians are being outcounterexampled"](https://xenaproject.wordpress.com/2026/07/20/human-mathematicians-are-being-outcounterexampled/). The machines are not, so far, out-thinking the humans. They're out-*searching* them: a counterexample is a needle in an absurdly large haystack, brutal to find and trivial to check once found. Deep theory-building, the invention of new frameworks and new definitions, remains a human game. For now, and I'm writing "for now" with less confidence than I would have a year ago.

## The embarrassing part, included on purpose

Before the part where I explain why this works, the part where it famously didn't, because you should trust this story more for knowing it.

In October 2025, an OpenAI researcher announced that GPT-5 had "solved" ten open Erdős problems. What the model had actually done was *find existing solutions*, in decades-old papers that the online catalogue's maintainer simply hadn't indexed. Literature search, dressed up as discovery. The head of Google DeepMind publicly called it ["embarrassing"](https://techcrunch.com/2025/10/19/openais-embarrassing-math/), the claim got walked back, and "Erdősgate" became the field's shorthand for AI math hype.

Two takeaways, and they point in opposite directions, which is why I like them. First: if professional AI researchers can mistake impressive-sounding output for genuine discovery, my friend with the hotel question never stood a chance unaided. Second, quietly: retrieval is actually *useful*. A century of mathematics is buried in obscure journals in several languages, and "this was solved in 1987 by someone you've never heard of" saves real people real years. The sin was the labeling, not the capability.

The productive part came after. The embarrassment forced a discipline on the whole field: nobody announces anything anymore without independent checks, and increasingly without formal verification. Erdősgate, the false start, built the immune system that makes the 2026 results believable. Which brings us to the actual mechanism.

## Math is source code now

Here's the load-bearing fact of this entire story, and it's a piece of software.

**Lean** is a programming language in which the programs *are* mathematical proofs. You state a theorem the way you'd write a function signature; the proof is the implementation; and if it compiles, the theorem is true. Not "probably true," not "reviewed by three tired volunteers," but checked, every logical step down to the axioms, by a verification kernel small enough that humans have scrutinized every line of it. A proof in Lean is exactly as trustworthy at a million machine-generated lines as at ten human ones, because the same incorruptible compiler checked both. (The unit-distance disproof got formalized at 1.2 million lines. It compiles.)

If you write software, you already understand everything important about this: math has acquired a build pipeline. And once you have a build pipeline, you can do the thing that makes modern AI models tick. The reasoning models of the past year are trained by generating enormous numbers of attempts at problems *whose answers can be checked automatically*, keeping what verifies and discarding what doesn't, millions of times over. Nobody teaches the model how to think; behaviors like backtracking and self-doubt emerge because attempts containing them win more often. The verifier is simultaneously the quality gate and the teacher.

Which means the story is not really "AI got smart enough for math." It's closer to the reverse: **math is the field where a perfect verifier exists, so math is where AI got smart first.** The generator can be a pathological liar; it doesn't matter, because the compiler cannot be charmed.

And yes, the grind is still there. The machine found that counterexample by searching a space no human would survive. But notice what the grind turned into: hardware, energy, and time. Three things you can buy more of, in proportion to how much you care about the answer. Human patience never scaled like that. Ours runs out; the machine's runs on electricity.

## The hotel question

So, my friend and his lying AI. He asks a chatbot for the best hotel in a city, gets a confident answer, discovers half the details are wrong, and concludes the machine lies. He wants a setting to turn that off.

There is no setting, and after everything above, you can now see exactly why. These models are trained to be *correct* wherever correctness can be checked, and to be *plausible* everywhere else, because everywhere else, plausible and correct are indistinguishable to the training process. Not to malice; to arithmetic. Where there's a compiler, lies die in training by the million. Where there isn't, sounding right is the whole reward.

"Best hotel" has no compiler. It's a moving aggregate of subjective preferences, contaminated by fake reviews, dependent on who's asking and why. The model isn't lying to my friend. It's doing precisely what it was optimized to do, in a territory where nobody, machine or human, can be checked.

So everything with these tools lives somewhere on a spectrum of verifiability. Math sits at one end: the compiler decides, instantly, for free, forever. Code sits nearby (tests and type checkers are a leaky Lean, which is why coding agents work at all). Then it degrades: theoretical physics still mostly checkable, engineering checkable by simulation, law weirdly split down the middle (whether a cited case *exists* is perfectly checkable, whether an argument will persuade a judge is not), and somewhere out past the hotels, the far end.

## The far end is a comedy club

Because here's the thing I keep turning over: the exact opposite of mathematics is not opinion. It's humor.

A joke *does* have a verifier. The room laughs or it doesn't. But look at the verifier's spec sheet. It's expensive: one live audience per data point, versus a million compiler checks an hour. It's perishable: what killed in 2019 dies in 2026. It's context-dependent on everything, the audience, the culture, who's telling it, what happened in the news this morning. And, my favorite property, it's *hostile to repetition*: a joke that verified once is now less funny, because surprise was part of the mechanism. Imagine a test suite that fails specifically because it passed before. That's comedy.

Math's verifier is eternal, free, and objective. Comedy's verifier is expensive, perishable, and reads the room. And that's the honest, non-mystical reason the same model that just killed an 87-year-old conjecture will reliably bomb at standup: models are becoming superhuman at universal truths while staying mediocre at societal conventions, and the gap between those is not intelligence. It's the cost of checking the answer.

That's also, finally, the real answer for my friend. Trust the machine in proportion to how checkable your question is. Push your questions toward the checkable end when you can: ask for sources you'll actually click, ask for reasoning you can follow, ask for the thing with a wrong answer rather than the thing with a debatable one. And when you can't, treat the output as you'd treat a well-read acquaintance holding forth at a party: entertaining, frequently right, and not something you book a hotel on.

I've [written before](/2026/06/26/blog-managing-the-intern-field-manual.html) that the question to ask before delegating anything to the intern is "can I check its work cheaply?" I thought I was writing a management heuristic for software teams. It turns out I was describing the force that just reordered an entire field of human knowledge, which is either a sign the heuristic is good or a sign that mathematics and intern management have more in common than either would like to admit.

The mathematicians got their compiler, and within months the machines were finding things no human had found in 87 years of looking. The comedians are safe. Everyone else should probably check where on the spectrum they're standing.

*Co-written, as ever, with Claude Code. It assures me this post is funny. There is, and I say this with complete precision, no way to verify that.*
