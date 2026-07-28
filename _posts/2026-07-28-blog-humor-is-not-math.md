---
layout: single
title: "In Which Math Turns Out to Be the Opposite of a Joke"
date: 2026-07-28
excerpt: "An 87-year-old math problem died in a tweet during the World Cup final, and the same week a friend asked me how to get AI to stop lying to her. It took me a while to notice these have the same answer."
toc: true
toc_sticky: true
---

At 2:19 in the morning UTC on July 20, while about a billion people watched the World Cup final, a mathematician named Levent Alpöge posted the following, [in its entirety, on X](https://x.com/__alpoge__/status/2079028340955197566):

> hello there the jacobian conjecture is false thanx to my close friend akhil for asking about it and my other close friend fable for working during the world cup final

Mathematicians are famous for understatement, and this is the genre's new record. The Jacobian conjecture had been open since 1939. Eighty-seven years of professional attention, generations of specialists bouncing off it, a well-earned reputation for swallowing published proofs whole. It died overnight, in a tweet, with a typo-adjacent "thanx," while humanity watched football.

"Fable" is Claude Fable 5, an AI model. It was six weeks old. The conjecture was 87. And before the eye-roll completes, because mine did too: this one held. Checked around the world within hours, formally verified within the week.

Now, the same week this happened, I was herding my kids through the usual chaos while talking with an acquaintance about AI. She's smart, curious about the field without living in it, and has never heard of the Jacobian conjecture, which makes her exactly the right person to ask the question she asked me between two child crises:

**"How do I get AI to stop lying to me?"**

The question came with evidence. She'd asked one of these things for a hotel recommendation and gotten the full treatment: instant, confident, beautifully organized, and stuffed with details that didn't survive contact with the booking site. You know the genre; it's the one where the rooftop pool is invented and the breakfast reviews belong to a hotel in a different city. Keep her hotel in mind. It has a part to play later.

I gave her maybe a third of an answer at the time. This post is the rest of it, because it turns out her question and that tweet are the same story told from opposite ends. Strap in. We have to go through 1939 first.

(Regular readers know "we" on this blog means me and Claude Code, which today runs on Fable 5. Yes, that Fable.)

## A wanted poster from 1939

I had to look up what a conjecture is, so you don't have to. Math sorts its claims into three buckets: proven true (a theorem, permanent), proven false, and open, where nobody has managed either. A conjecture is an open claim with a fan club: somebody respected pins it to the wall saying *surely this is true, someone please prove it*. A wanted poster. One iron rule applies: decades of belief count for nothing. One counterexample and the poster comes down.

This particular poster concerns transformations of space. Picture a rule that moves every point of a rubber sheet somewhere else. Two bad things can happen to the sheet: a spot can get **crushed** flat to nothing, or the sheet can **fold**, so that two faraway regions land stacked on the same place. There's a quantity, the Jacobian determinant, that measures crushing. The conjecture asked: take a transformation built purely out of polynomials, the `x² + 3xy + 7` algebra from school, and suppose it provably never crushes anything, anywhere. Can it still fold?

Paper folds without crushing; you've done it yourself. (Simplification alert: a mathematician would object that a true fold has a crease, and a crease is exactly a crushed line. The loophole-free image is something that wraps around instead, like a spiral parking garage, where every stretch of ramp is perfectly normal road and yet one loop later you're directly above where you started. We're keeping "fold" anyway, because "Fable wrapped the glass" is a worse sentence.) But polynomials are rigid, less like paper and more like sheet glass: what one does in a tiny corner dictates what it does everywhere. So the conjecture claimed, in effect, that *glass can't fold*. For 87 years, every checked case agreed, and so did everyone's intuition.

Fable folded the glass. For reference only, no need to spend time grasping it, here's the entire counterexample; the point is how little of it there is:

```
a = (1+xy)³z + y²(1+xy)(4+3xy)
b = y + 3x(1+xy)²z + 3xy²(4+3xy)
c = 2x - 3x²y - x³z
```

A transformation that never crushes anything, with three different points provably landing on the same spot. Anyone with algebra software can [check it in minutes](https://sbseminar.wordpress.com/2026/07/20/the-new-counterexample-to-the-jacobian-conjecture/), and that first day, thousands of people did. (Honesty note, since we promised to flag these: the real thing lives in three-dimensional *complex* space, which amounts to six dimensions and cannot be pictured by anyone, including the professionals. The rubber sheet is a loaner. And where folded paper layers merely rest on top of each other, these three points land on *exactly* the same spot, not approximately.)

Two footnotes before we accelerate. Nothing collapses when a conjecture dies: conjectures are known-unproven, so nobody had built anything permanent on this one, and the results of the form "if it's true, then..." just became contingency plans for a cancelled event. Also, the two-dimensional version of the poster is still on the wall, in case you're looking for a project.

My favorite detail: nobody can explain it. [Terence Tao](https://terrytao.wordpress.com/2026/07/21/a-digestion-of-the-jacobian-conjecture-counterexample/), about as decorated as living mathematicians get, wrote that he has no satisfying explanation for the "miracle." The machine handed humanity a true fact and kept the insight, assuming it ever had any. The closest thing to an explanation so far: a map like this lays the sheet over itself in three layers, and the seam where those layers ought to meet sits at no finite point at all. It has been pushed out beyond infinity, where the rules of the game stop applying.

## It kept happening

One of these would be a stunt. It's been a drumbeat.

In May, a conjecture posed in 1946 by Paul Erdős, a man we'll get to, about points in the plane sitting at distance 1 from each other, went down after 80 years, [checked by Fields Medalist Timothy Gowers before the announcement](https://www.scientificamerican.com/article/ai-just-solved-an-80-year-old-erdos-problem-and-mathematicians-are-amazed/). The same two July weeks as the Jacobian result took a sixty-year-old question of Grothendieck's, plus a statistics conjecture that a good chunk of medical research leans on.

And in February, my favorite of the lot: Donald Knuth, 88 years old, the man computer scientists mean when they say "the literature," had an open conjecture of his own that he'd poked at for decades. A correspondent handed it to Claude, which cracked it in about an hour. Knuth wrote a five-page paper called ["Claude's Cycles"](https://www-cs-faculty.stanford.edu/~knuth/papers/claude-cycles.pdf) that opens with "Shock! Shock!" and closes with "Hats off to Claude!" If you click one link in this post, click that one.

Meanwhile the Erdős problems keep falling in the background like fruit in a light but persistent breeze. Paul Erdős, who died in 1996, was the twentieth century's most prolific mathematician and quite possibly its strangest houseguest: no home, no fixed address, one suitcase, a habit of appearing at colleagues' doors announcing "my brain is open," and cash bounties on the hundreds of problems he scattered behind him. About a thousand are catalogued online, which accidentally created a public scoreboard, and since January roughly fifteen have flipped from open to solved, most with AI in the mix. One fell to a 23-year-old amateur with a chat subscription. Terence Tao [keeps the tally](https://github.com/teorth/erdosproblems/wiki/AI-contributions-to-Erd%C5%91s-problems) and attaches a deflating footnote: these were the list's lowest-hanging fruit. Fruit, one feels obliged to add, that hung there for sixty years in full view of everyone.

Look at the shape of the pile, though. Nearly every one of these is a *disproof*. A counterexample. Kevin Buzzard titled his post on the phenomenon ["Human mathematicians are being outcounterexampled,"](https://xenaproject.wordpress.com/2026/07/20/human-mathematicians-are-being-outcounterexampled/) which is the politest available way of saying the machines found a lane. A counterexample is monstrous to find and trivial to check. Hold on to that asymmetry. It's the entire plot.

## The referee nobody tweeted about

Before I explain why this works, the obligatory blooper reel. In October 2025, an OpenAI researcher announced that GPT-5 had "solved" ten open Erdős problems. Champagne, headlines. Then the catalogue's maintainer checked: the model had *found existing solutions* in decades-old papers nobody had indexed. Retrieval (finding answers that already existed in print), wearing discovery's clothes. The head of Google DeepMind called it ["embarrassing"](https://techcrunch.com/2025/10/19/openais-embarrassing-math/) in public, and the affair is now known, inevitably, as Erdősgate. File it away: professional AI researchers, briefly fooled by a confident answer. My acquaintance's question, with a PhD.

Now, the thing I got wrong before doing the reading. I assumed the models had simply gotten smarter, because that's what the headlines sell. Half true. The other half was built alongside the models, by people, over twenty years, and it's the half that matters.

Mathematicians have a tool called [Lean](https://lean-lang.org/), and a [community](https://leanprover-community.github.io/) that has spent two decades translating mathematics into it. In Lean, a proof is a program that either compiles or doesn't. No "looks right to me," no tired reviewer waving things through, and, best of all, no trust required in whoever wrote it: you only have to trust the small checking program, which humans have crawled over line by line. One of this year's results was machine-verified at 1.2 million generated lines. It compiles, so it's true, and that sentence works the same whether the author was a professor or a language model that would cheerfully invent a hotel.

Once checking is automatic, training transforms. The current models practiced on millions of problems that a machine can grade instantly, keeping whatever passes, discarding the rest, at a scale no tutor could survive. Nobody taught them to double back and reconsider; habits like that emerged because attempts containing them passed more often. The referee did the teaching.

So the story reads differently than advertised. Math didn't fall because AI developed a taste for it. Math is the one arena on Earth with a perfect, free, incorruptible referee, and this kind of machine improves fastest exactly where a referee exists. The grind of trial and error is still in there, but it now runs on hardware, electricity, and time, three things you can buy in proportion to how badly you want an answer. My patience doesn't scale. Electricity does.

## Coming back to her hotel

So: the machine that lies about hotels just killed an 87-year-old conjecture. How?

There's no lying switch to flip, and now the reason has a shape. These models are trained to be *correct* wherever a referee exists, and to be *convincing* everywhere else, because everywhere else, convincing is the only thing anyone can measure. And here her hotel finally gets its part: a question like "what's the best hotel in Lisbon" has no referee. It's a moving average of strangers' tastes, seasoned with fake reviews, bent by who's asking and why. When the machine answers it confidently and gets the details wrong, it's performing the exact skill it was graded on in referee-free territory: sounding right.

And buried in her question is the philosophical bit, the part I keep chewing on. What would the *true* answer to the hotel question even be? There isn't one. There never was. And whatever passes for one today expires quietly: the chef leaves, the rooftop pool closes for renovation, the neighborhood moves on. We come to these machines wanting something definitive, about questions that have no definitive answers to give, and the machine, eager to please, hands us the costume of definitiveness: confidence, detail, a tidy list. Calling that a lie almost gives it too much credit. A proper lie requires knowing the truth and hiding it. The machine performs certainty because certainty is what we keep ordering, in places where nobody, silicon or otherwise, has any in stock.

Every question you hand an AI lives somewhere on a spectrum of checkability, and its reliability slides along that spectrum with it. Math sits at the blessed end: instant, free, eternal referee. Code lives nearby, since tests and compilers make a leaky but serviceable one; that's roughly why coding assistants earn their keep. Law splits hilariously down the middle: whether a cited court case exists is perfectly checkable, whether an argument will move a judge is anyone's guess. Then, much further out, hotels. And past the hotels, at the far end of the spectrum, there's a comedy club.

## Math is the opposite of a joke

Because here's where all of this has been heading: the true opposite of a mathematical theorem isn't an opinion. It's a joke.

A joke does have a referee. The room laughs or it doesn't. But read the referee's spec sheet. Expensive: one live audience per data point, against a million compiler checks an hour. Perishable: material that killed in 2019 gets silence in 2026. (Today's Six Seven is already becoming yesteryear's Hawk Tuah, which is itself deep in Taking the Hobbits to Isengard territory; you can measure the decay yourself by noticing which of those references just made you wince.) Dependent on everything at once: the audience, the culture, who's telling it, this morning's news. And, the property I adore most, hostile to repetition: a joke that verified once is now *less* funny, because surprise was doing half the work. Imagine a test that fails specifically because it passed last time. Comedians run their entire careers on that testing regime, which is worth remembering next time someone calls comedy the easy job.

A theorem's referee is eternal, free, and objective. A joke's referee is expensive, perishable, and reads the room. That's the whole distance between "superhuman at 87-year-old conjectures" and "reliably bombs at standup," and notice what the distance is made of. Nothing to do with intelligence. The machines are becoming superhuman at universal truths while staying mediocre at societal conventions, and the gap between those two is simply the price of checking the answer.

Which hands me, at last, the two-thirds of an answer I still owed her. You can't make the machine stop lying. You can know where it lies. Trust it in proportion to how checkable your question is. Drag your questions toward the checkable end when you can: ask for sources you'll actually click, for reasoning you can follow, for claims with wrong answers rather than debatable ones. And at the unverifiable end, enjoy it the way you'd enjoy a well-read acquaintance holding forth at a party: often right, always entertaining, and no basis for a hotel booking.

I've [written before](/2026/06/26/blog-managing-the-intern-field-manual.html) that the question to ask before delegating anything to an AI is "can I check its work cheaply?" I thought I was writing a management tip. Then an entire branch of human knowledge reorganized itself around that question in seven months, so apparently the tip had ambitions.

The mathematicians got their referee, and within months the machines found what 87 years of humans had missed. The comedians are untouchable. The rest of us should probably check where on the spectrum we're standing.

*Co-written, as ever, with Claude Code. It assures me this post is funny. There is, and I say this with complete precision, no way to verify that.*
