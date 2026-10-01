---
layout: single
title: "In Which We Measure Software Engineering Before and After Agents"
date: 2026-10-01
excerpt: "Two articles told me how to measure what AI tooling does to a team. I had five years of history, three engineers and an hour. So I pointed an agent at the data, went for a walk, and came back with a before and after."
toc: true
toc_sticky: true
---

I read two articles about how to measure the effect of AI tooling on an engineering team. Then I pointed an AI at five years of my team's history, told it to measure the effect of AI tooling, and went for a walk. If there is a joke in that, I am going to pretend it was intentional.

The articles were Bharat Sharma's [case](https://bharatsharma.pro/articles/activity-based-engineering-metrics-are-obsolete) that activity metrics are dead, and James Shore's [recipe](https://www.jamesshore.com/v2/blog/2026/measuring-ais-impact-on-delivery-speed) for measuring delivery speed properly, with randomized tasks and people compared against their own baseline. Both made sense. Both also assume you started collecting data before you started using the tools. We did not, so there's that.

## Why I wanted to know

Everyone has an opinion on what AI does to software teams. Most opinions come without data, and most data comes from teams the person has never sat in. I have something rarer: a team I have led for almost five years, a git history I can read line by line, and a memory of what each line was like to live through. I can put the numbers next to the anecdotes and see where they disagree. Jeff Bezos [claims](https://www.cnbc.com/2018/05/07/why-jeff-bezos-still-reads-the-emails-amazon-customers-send-him.html) that "when the anecdotes and the data disagree, the anecdotes are usually right." I was curious to find out which of mine were lying.

I was hoping for two things. That some of the metrics people still put on slides would turn out to be meaningless (lines of code who?), and that the tooling would turn out to improve something specific. I was not afraid of the opposite. If the data had said "no effect", I would have wanted to know that too. Knowing is half the battle.

## The hour

I work from home. I gave Fable 5.1, running in Claude Code, a job. We have an arrangement: it pulls, I argue. The job was to pull the git history of every repo in the team's product line, the merge requests and pipelines from GitLab, the ticket history from Jira, the release notes going back to 2022, and put it all on one local page by quarter. Then I went for a walk.

About an hour later I came back to a first draft that was interesting to read and wrong in several places. Two charts drew "team size" from git author counts, which turned twelve email addresses into twelve people when there were eight. One line of commit counts dropped by half in a single quarter, which looked dramatic until we found the reason: squash merges, switched on two years before any AI was anywhere near the code. Sharpening took longer than the walk. [It usually does](https://en.wikipedia.org/wiki/Pareto_principle).

## The gap in the data

Here is the problem with my team as a test subject. In early summer 2025 the team was reduced by more than half. One month later the people who stayed got an AI coding assistant. Those two things sit a few weeks apart in the history, and I cannot untangle them. Any line that goes up after that summer is a story about fewer people and a story about new tools at the same time.

Shore's trial (assign every task at random to "with AI" or "without AI" before anyone estimates it, then compare each person against their own baseline) is not available to me. Three engineers, a history that already happened, and nobody who will work without the tooling for the sake of my curiosity.

But the history has a gap in it. The agent workflows started in February 2026. That is the part where agents run whole tasks end to end, the meta-repo pattern from [an earlier post](/2026/03/05/blog-agents-meta-repo-pattern.html), grown up. Between the assistant arriving and the agents starting there are six months where the team was already small, already had the assistant, and did not have agents yet. The only thing that changes at the boundary is how the work gets done. Sharma asks for a control group. Mine is a gap in the calendar.

That is the only comparison the data allows, so that is the one I made: those six months against the three quarters since, normalized by head because head count is the thing that moved, with a second set of signals to show whether the gains came at a cost.

## What came back

Two windows, same three people, same product, same assistant. **Before agents**: the second half of 2025. **With agents**: the first three quarters of 2026. Every number below reads "before agents → with agents", per quarter, normalized by head count. January 2026 sits in the second window although agents only started in February, because quarters are what the data comes in. (Rounded. Error bars on three people would be an insult to the word.)

Went up:

- Resolved work items per engineer: ×1.4. For every ten items a person finished per quarter before agents, fourteen with them.
- Merge requests per author: ×1.7. For every ten merge requests before agents, seventeen with them.
- Housekeeping share of resolved items: <40% → >50%. Under forty percent before agents, over half with them.
- Commits into the agent repos: 0 → about a quarter of all commits. That is the bill, and it goes on the same slide as the gains.

Unchanged, or moved only within the noise:

- Pipeline success rate: within one point.
- Merge request approval rate: down a few points. Noise at this volume.
- Time from first commit to merge: unchanged.
- Defect share of resolved items: unchanged. One quarter stands out because we went bug hunting on purpose.
- Releases per quarter: unchanged. Still the fastest pace the team has ever had.
- Epics closed: unchanged. If anything, slightly down.

That last one surprised me, and it is the most honest number on the list. The team finished forty percent more things per person and roughly the same number of big things. **Outcomes visible outside the company did not change.**

## Where the surplus went

It went into the how. The extra items are CI components shared across all our repos, security scanning on every one of them, review automation, and the agent repos themselves. Those repos hold more than instructions for machines. They are the team's tribal knowledge written down for the first time: which repo releases how, what a commit message looks like, who owns what, the things that used to live in three heads and nowhere else. **Housekeeping at over half is not the team slacking off. It is the team rebuilding the floor while standing on it.**

Day to day it looks like this. Anything that repeats gets handed to an agent: what is waiting for me in Jira since Monday, what is waiting for me in GitLab, the attendance I used to log by hand. That last one saves maybe twenty minutes a week. Not much, but a chore I never have to think about again is a different kind of gain than the minutes suggest. Discovery goes to agents too; the page this post is based on is one. For simple code changes the whole chain runs without me touching a keyboard: ticket created and kept current, branch, change, merge request, review, tests. I read the result. If I had to describe the shift in one sentence: a year ago I typed, now I mostly read.

That is an investment, and the return is already coming in. The clearest case is onboarding. A new person gets an agent that knows every repo's conventions on day one, instead of learning them by asking me. They should still talk to me. But now the conversation can be about something more interesting than git conventions and how to fill in the time tracking.

## The charts I kept as a warning

We also computed lines of code and commit counts, because Sharma says they are obsolete and I wanted to watch them fail on my own data. Lines per quarter swung by a factor of ten depending on what a release happened to carry. One quarter a third-party library was copied into the repo wholesale. Another, a tool generated thousands of lines nobody typed. Another, a rewrite deleted an old module and added a new one. None of that is the team working ten times harder. It is like counting pages written per month and getting a spike the month someone pasted in the phone book. Commit counts had the squash-merge story from earlier. Both charts stayed in the report with those labels on them, so the next person who reaches for them finds the explanation first.

## Where it lands

Shore keeps repeating that delivery speed isn't productivity, and my data agrees with him. Per-person throughput went up, quality held, and the count of big outcomes did not budge. Call it what it is: a team that got faster at finishing things and spent the surplus on going faster and safer later.

Sharma says never report per engineer, and I agree with him. Dividing by head count is how you normalize a series when the number of people keeps changing and three of them make for noisy data. No person's number appears anywhere. Per-person numbers would have told me who closes the most tickets, which I already know, and which was never the question.

Sharma and Shore wrote the theory. I had the history lying around and an hour to spare. Bezos got his turn too: twice in that hour the data said something my memory knew was wrong, and twice the memory won. What survived agreed with what I had lived through, and that is the point where numbers start being worth something. A number you can explain, and a story you can prove. Either one alone is an opinion. The next time someone shows me a slide of commit counts going up and to the right, I am going to ask one question: what did you spend the surplus on?
