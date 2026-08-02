---
layout: single
title: "In Which My Own Post Gets Counterexampled"
date: 2026-08-02
excerpt: "Four days after I published a post about machines winning at math by finding counterexamples, OpenAI published ten results that counterexampled the post. Here's what broke, what held, and what we're still squinting at."
toc: true
toc_sticky: true
---

Last week I published [a post](/2026/07/28/blog-humor-is-not-math.html) about AI and mathematics. Its middle section made a claim I was rather pleased with: that the machines' wins in math were nearly all *disproofs*, needles found in haystacks, and that the deeper kind of mathematics was still ours. I even hedged it, because I'd done my homework:

> Building new theories, inventing the concepts the next century argues about, remains a human one. I'd have written "and will remain" a year ago. I'm typing more carefully now.

That careful typing survived four days.

On August 1, OpenAI published [ten results in mathematics and theoretical computer science](https://openai.com/index/ten-advances-in-mathematics/), on problems that had been open for at least a decade, in most cases much longer. I write a blog post about machines finding counterexamples, and reality responds by finding a counterexample to the blog post. There's a genre joke in there somewhere, and I refuse to be the only one laughing at my expense, so let's take it apart properly. This is the follow-up in which I eat the precise amount of crow required, and not a feather more.

## The tally

The release, in brief: ten results across eight fields, produced by an internal version of Astra, their next major model. The tokens to find the solutions would cost about $2,000 at current API rates. Humans then prepared the arguments into manuscripts, and every single result ships with a proof formalized in Lean. Hold that last part; it's the load the whole release stands on.

Now the count, because my previous post's claim was a countable one. Of the ten:

- **Six are positive theorems.** The kind of thing I filed under still-human. Among them: the first improvement to the general sphere-packing exponent since **1978**, upper bounds for error-correcting codes that had stood since **1977**, and a conjecture of Ehrhart's about lattice points in convex bodies, proved outright, sharp, in every dimension.
- **Three are counterexamples**, my post's home turf: a disproof of Connes's rigidity conjecture, two disproved conjectures in extremal graph theory, and a construction answering "is every group sofic?" with a no that group theorists have sought for decades.
- **One refuses my categories entirely**: a construction that *proves* a theorem about Ramsey numbers, a found object in service of a positive result.

Honesty note, as house rules require: that classification has judgment in it. The non-sofic group answers a question negatively using heavyweight positive machinery; the Ramsey result settles a theorem by searching. And that blur is itself the finding.

## The waterline

So the model of the world in my last post needs a correction, and here it is without cushioning: I described a boundary, and it was never a boundary. It was a waterline.

The boundary story said: machines search, humans build theories, and the two activities are different in kind. Comforting, tidy, and wrong. The waterline story says: everything in a verifiable field is submersible, and the water finds the cheapest things first. Counterexamples fell in the first half of 2026 because they're the cheapest verifiable objects there are, monstrous to find but instantly checkable. Theorems cost more: longer arguments, more structure, more to verify. The water needed a few more months and, apparently, about $2,000 in tokens.

The difference between the two stories matters beyond my bruised bookkeeping. A boundary invites you to relax on your side of it. A waterline asks you a much better question: what, in your own field, is currently sitting at ankle height?

## The referee sends its regards

Here's the part I get to feel good about: everything in the original post built on the *referee* held, and held with interest.

Every one of the ten results ships with a Lean certificate, a proof the compiler checked down to the axioms. And notice what changed in the verification story. The Jacobian counterexample could be checked by anyone with algebra software in an afternoon; that was the charm of the counterexample era. These new proofs are long. No afternoon suffices. The only reason strangers can trust them at speed is the compiler, which means the referee didn't just train these machines, it's now carrying the trust for their output too. The first post called math "the one arena with a perfect, free, incorruptible referee." That sentence is doing more work this week than when I wrote it.

The economics paragraph aged well too, in an unsettling way. I wrote that the grind now runs on hardware, electricity, and time, three things you can buy in proportion to how badly you want an answer. We now have a price: ten decade-old problems, roughly $2,000. The folding iPhone that Apple is rumored to ship next month is [tipped to cost more](https://www.tomsguide.com/phones/iphones/iphone-fold-just-tipped-to-cost-an-obscene-usd2-399-but-it-could-have-this-apple-exclusive).

And for the friend whose hotel question started all this: nothing changed for you. The spectrum didn't move an inch. Math got more submerged because math was always at the checkable end; "what's the best hotel" remains exactly as unanswerable as it was in July, and the machine remains exactly as confident about it. The water rises where the referee lives, and nowhere else.

## The squint list

My last post promised to flag hype wherever it stands, and a correction post earns extra suspicion duty, so here is what we're squinting at:

- **Humans picked all ten questions.** The problems came from an internal evaluation set that someone curated, framed, and judged important, by decades of human mathematics. The machines answered magnificently; they still didn't ask. Kevin Buzzard's moat, that machines are terrible at posing questions worth answering, stands untouched, and you can now see it in the fine print of the very release that flooded his "outcounterexampled" lane.
- **Ten successes out of how many attempts?** Unpublished. "Evaluated during development" implies a standing problem set and therefore a denominator; we just don't get to see it. Ten-for-ten and ten-for-a-thousand are very different worlds, and the release is compatible with both.
- **The "how we did it" narrations are written by the model, about the model.** Plausible, polished, and not evidence. Same caveat as the Jacobian discovery story: the math is checkable, the narrative is marketing-adjacent.
- **No independent verdict yet.** Early reactions split between world-changing and overblown, though one carries weight: Thomas Bloom, who maintains the Erdős catalogue and whose fact-check detonated Erdősgate, [reportedly calls these results "big news"](https://www.techtimes.com/articles/322710/20260802/openais-astra-solves-ten-decade-old-math-problems-machine-checkable-lean-proofs.htm) and rates them above May's unit-distance disproof. Still: the Lean certificates settle correctness only if the formalized statements match the headline claims, and checking *that*, especially for asymptotic results, is careful human work that takes the community weeks, not days. Verify the checkable, discount the story, wait for the referees who don't work there.

## What happens next

The certificates are public. Lean is free. In principle, anyone with a laptop can compile the proofs, and the fact that this sentence is true of research mathematics is quietly the most remarkable thing in the whole story. In practice, checking that the formalized statements say what the press release claims they say is work for people who read operator algebras before breakfast, and we know our depth. So we're doing what the spectrum tells you to do at the edge of your own verifiability: watching the people with the referee credentials, and updating when they rule.

I'd close with a prediction about what the machines won't do next, but we've all seen what happens to those after four days.

*Co-written, as ever, with Claude Code, which reviewed this correction and rates our original post "directionally accurate." I've decided to find that comforting.*
