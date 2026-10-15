---
layout: single
title: "In Which the Agents Meta-Repo Pattern Gets Its October 2026 Update"
date: 2026-10-15
excerpt: "Context engineering for a team where everyone works with an AI coding agent: one repository with no code in it, holding what the agent needs to know about us, cloned on every machine."
toc: true
toc_sticky: true
---

This post is about context engineering for a team of software engineers who all use AI coding agents and work closely together. In March I described [the agents meta-repository](/2026/03/05/blog-agents-meta-repo-pattern.html): a git repository that contains no code, only context (a map for the code base). It describes our repositories, the internal knowledge you would otherwise get from a colleague, the rules of the organisation, and how a coding agent is expected to work with the humans here. The agent reads it before anything else. Among teams that run this kind of setup the pattern is established by now. Most teams are not there yet, so this is both an update and an introduction. In our case, the team is five engineers, each working with multiple instances of Claude Code.

## A colleague with amnesia, times five

Our codebase is a dozen or so independent repositories: two product lines, two native platforms, four cross-platform wrappers, and one change can touch six of them in a specific order. The knowledge you need to work in it lives in people's heads and takes a new engineer months to collect.

An AI coding agent collects none of it. Within a session it is excellent. The next morning it starts from zero. The fix in March was "give the agent a map," and the reason the map is a git repository rather than a file on my machine was the team from the start: five of us, each with an agent, and every improvement one of us makes to the agent's context should reach the other four. That part was planned. What I did not expect was how much of the value would come from exactly that. I find out on a Tuesday that a green test job only counts as green once the result artifacts say every test ran. By Wednesday it is in every colleague's agent, and nobody finds it out twice.

## One repo with no code in it

Nothing in it compiles. It holds four kinds of thing, best described by the questions they answer.

- **Where is everything?** A machine-readable registry per product line: repo paths, build commands, version files, where the release notes live. The agent parses it; nobody describes a repo in prose twice.
- **How do we work here?** Rules everyone follows (signed commits, one-line commit subjects, no AI attribution, which customer-data fields may never be printed), and per-product-line conventions for branching, testing and release notes.
- **What can I ask for?** Written-down workflows with the phrases that trigger them (their own section below).
- **What did we already learn?** One tracking document per piece of work that outlives a session, and an archive of the finished ones (also below).

That is what it holds. This is where it lives, with the four levels marked:

```
workspace/                           # Level 0: your checkout folder, not a repo
├── AGENTS.md                        # generated from what is checked out here (shown below)
├── my-org-agents/                   # Level 1: the meta-repo, one clone per machine
│   ├── AGENTS.md                    # router: read order, hard stops, how to pick a domain
│   ├── workspace.yml                # registry: domains, their folders and ticket prefixes, teams
│   ├── templates/
│   │   ├── org-rules.md             # always loaded: signing, commit discipline, writing style, PII
│   │   └── patterns/                # opt-in per domain: plan-before-acting, autonomy-boundaries, ...
│   ├── scripts/                     # bootstrap, workspace sync, thin wrappers for CI and tickets
│   ├── workflows/                   # org-wide things you can ask for: gitlab-inbox.md, jira-inbox.md
│   ├── domains/
│   │   ├── product-one/             # Level 2: one product line, loaded when routing says so
│   │   │   ├── AGENTS.md            # the product line's router: architecture, read order, where to look
│   │   │   ├── repos.yaml           # paths, build commands, version files, release metadata
│   │   │   ├── conventions/         # branching, commits, testing, release notes for this product line
│   │   │   ├── workflows/           # product-line things you can ask for: releases, cross-repo changes
│   │   │   ├── scripts/             # product-line tooling: docs preview, config validation
│   │   │   ├── active-work/         # trackers for work that outlives a session
│   │   │   └── archive/             # finished trackers
│   │   └── product-two/             # Level 2: same shape
│   └── teams/platform/              # opted in by name, not by what is on disk
├── product-one/                     # the product line's code repos, each with its own AGENTS.md (Level 3)
└── product-two/
```

The levels exist so that every agent loads only the context it needs, and so that each piece of knowledge has exactly one place it belongs.

- **Level 0 is the workspace root**, the folder a person keeps their checkouts in. It is not a git repository, because no two machines have the same repositories checked out. It holds one generated file, built from what is actually on disk, so a colleague with only one product line cloned loads only that product line.
- **Level 1 is the meta-repo itself**: the routing system an agent sets itself up from after a fresh clone, the rules everyone follows, the patterns a product line can opt into, and the tools humans use together with the agents.
- **Level 2 is inside the meta-repo too**, one folder per product line or domain, loaded into context only when the routing system says that domain is in play.
- **Level 3 is outside it**: the `AGENTS.md` files in the code repositories themselves. They existed before the meta-repo, they still hold the build and test specifics, and the meta-repo points to them instead of repeating them.

A session reads them in that order. The router decides which Level 2 folder applies: a ticket key in the request is authoritative, keywords are the fallback, and otherwise the agent asks. In the router's own words: "Routing to the wrong domain wastes more time than asking."

The Level 0 file is the part nobody writes. A bootstrap script walks the workspace, checks which product-line folders are actually on disk, asks which team you are on, and writes a root file that is nothing but include directives:

```md
# Workspace (Level 0)

@workspace.local.yml
@my-org-agents/AGENTS.md
@my-org-agents/templates/org-rules.md
@my-org-agents/domains/product-one/templates/general-section.md
@my-org-agents/teams/platform/templates/general-section.md
```

The agent harness follows those includes at session start, so the right rules are in context before anyone types a word. The same script can check the file against the disk, and drift is a non-zero exit code. Setting up a machine is: clone, run the script, add a one-line redirect file.

Two rules keep it honest. If a product line's folder is not on disk, the agent stops rather than work from half a map. And nothing is copied sideways between product lines; what both need gets promoted up into a shared rule. Context is loaded by what is on the machine, and shared by being in one clone.

## Things anyone on the team can ask for

What started as playbooks for the agent turned into **things a person can ask for in plain words.** "What is waiting on me in GitLab since Friday?" "Update everything to latest main." "Work this ticket." "Fill in my week." Each one is a markdown file that names the phrases that trigger it, the steps, the tools, and the points where it must stop and ask. The first time someone needs one, they spend an afternoon with the agent working it out. From then on, anyone on the team just says the thing.

The mechanics are almost embarrassingly simple. The always-loaded files hold a line or two per workflow: what it is for, and which phrases count as asking for it. The body is a separate file the agent opens only when the phrase comes up. If I am not sure what exists, I ask: "what can you do for me around GitLab?" It lists them. That is also the first thing a new colleague asks it, and we get to that.

The one with the biggest impact for me is the plainest: **a ticket link.** I paste a Jira URL and say "work this." The router reads the ticket key and picks the product line from its prefix, which loads that line's conventions. Then the agent:

1. fetches the ticket and everything it links to;
2. summarises the problem and the acceptance criteria back to me, says which autonomy bucket the work falls into (next section), and asks its questions before touching any code;
3. proposes a plan, meaning files likely touched, tests to run, expected size of the change, and what it will not do, and waits for my yes;
4. branches in a fresh worktree and implements in small signed commits;
5. runs the documented verification;
6. opens a draft merge request and posts a worklog comment on the ticket for whoever picks it up next;
7. stops.

Every step of that is in a markdown file somebody wrote once.

A smaller one. **"What is waiting on me in GitLab?"** reads my todos and the merge state of every open merge request together and prints one digest, the same shape every day. The file carries the two API quirks that bit us the first time, so nobody hits them twice.

Could these have been Claude Code skills? Probably. We kept them as plain markdown because the repo is for every agent, not one tool, and because the workflow files are documentation for humans too. The packaging is not the point. The shared clone is the point.

## Brakes are what let you go faster

In May we wrote down what the agent may decide on its own, so that it knows what is safe to touch and how it is expected to work. Three buckets: **yes if green** for the small stuff, **ask first** for most tickets (plan, show the plan, wait), **no by default** for anything user-visible or release-related. Under all three a stop-loss: never force-push a shared branch, never merge, never weaken a CI job to get green, never commit a secret. The line I would put on a poster: "Misclassifying upward costs minutes. Misclassifying downward costs trust."

It reads like a brake and works as an accelerator. I can say "work this ticket" and walk into a meeting because I know where it will stop: a draft MR open, CI green, nothing merged. Humans hold the merge button, the credentials and every decision about what leaves the company. The agent holds the pen. We are experimenting with unattended runs, but for now they are not the main workflow.

## The archive is compost

Work that is finished gets archived, document and all, and stays there. Nobody reads the archive unless they ask to, and then it is for archaeology: why we picked one approach over another, what was tried and proven not to work, which decisions were a human's and which were reversed. Most of the conventions now in the shared folders started as a section in one of those documents, a lesson learned in one ticket and then promoted. The archive is where many of the things you can ask for came from.

## It has a name now

The thing I did not expect is how many other people drew the same map.

A write-up this autumn called it the [meta-repo pattern](https://devnewsletter.com/p/meta-repo-pattern/): "a standalone repository containing no application code at all," holding only documentation, manifests, scripts and agent configuration. It cites our first post as one case study, next to someone running thirty-five repositories through a "virtual monorepo." A paper on [codified context](https://arxiv.org/abs/2602.20478) describes a "hot-memory constitution" that is always loaded and a "cold-memory knowledge base" read on demand, which is our trigger lines and workflow bodies under better names.

At [SoCraTes Austria](https://github.com/Softwerkskammer-Linz/SoCraTesAT-2026), a software craft unconference in Linz, I sat in a session by Bernhard Woditschka titled ["Agents Forget. Repos Remember."](https://github.com/Softwerkskammer-Linz/SoCraTesAT-2026/tree/main/agents-forget-repos-remember) whose abstract has a sentence I wish I had written: "What a good team knows by heart, an agent team needs in writing." The accompanying [reference repo](https://github.com/woditschka/agentic-coding-reference) opens with our diagnosis, reached independently: "Coding agents forget and drift. Better prompts do not fix that; engineering discipline does." And two other groups in my own company read the first post and built their own. One got two commits in a day and has not moved since. The other has about a hundred commits and a guide that says its structure "mirrors" ours.

So the diagnosis travels, and the map travels; it is easy to draw from a blog post. But read those sources again and notice what they are all solving: one agent, many repositories. How to get a single session oriented across repo boundaries. That is the problem the first post solved too, and it is the smaller one.

The part that made us faster is the other axis: many people, one agent memory. A list of things you can ask for, with its stop points and its API scars, that every colleague's agent reads because every colleague has the clone. Neither of the two copies down the hall joined ours. The pattern copies well. The clone is the thing you cannot copy, because its value is who else is in it.

## What it costs

The same write-up that named the pattern warns that an unmaintained meta-repo "becomes a source of confidently wrong behavior at agent speed." True. Ours holds about 64,000 lines of markdown, three quarters of it archived work, and the live quarter still rots: prose overviews drift from the repositories they describe. We have cut and moved a lot of it this year. Version numbers no longer live in overview documents, and what cannot be generated carries a verification date. Some of the cost stays, because the organisation is not static either, and every decision that changes has to change here too. That is what maintaining a knowledge base means.

The write-up also notes that the pattern "narrows the visibility gap, not the transaction gap." Right. There is no atomic cross-repo commit. The agent prepares a release across repositories and stops; a human publishes, one repository at a time, in the documented order.

## For readers of the first post

Skip this if you came in fresh. For everyone who read the March post, the predictions in one line each.

- "Active work tracking is the feature that matters most." Held. Two thirds of all commits.
- "The archive is underused but worth keeping." Underrated. It is where the conventions come from.
- "Start small." We are well past small now. The useful version of the advice is: keep the always-loaded part small, and put everything else behind a trigger.
- "Shell scripts are more reliable than MCP tools." Held, and promoted to an org-wide rule.
- "Six months from now, parts of this pattern may be unnecessary because the agents will have gotten better at discovering context on their own." Wrong so far. The map is still the first thing the agent reads every session, and the agents have not got better at doing without it. What changed is which parts of the map earn their keep: the registry, the rules and the workflows are used constantly, while the prose overviews are what an agent could increasingly find out for itself.

## Day one

The clearest return so far is onboarding. We hired a colleague this year. They cloned one repository, ran the script, started the agent and asked it to explain what they could do now. It did, and they hit the ground running. They still talk to me. But as [the previous post](/2026/10/01/blog-measuring-software-engineering-before-and-after-agents.html) put it, now the conversation can be about something more interesting than git conventions and how to fill in the time tracking.

## Treat context like code

One thing I only saw in hindsight. We treated the context like code and applied the same habits: each piece of knowledge lives in exactly one place, nothing is duplicated sideways, a session depends only on the context it uses, and a product line extends the shared rules by opting in rather than editing them. (Analogy alert: it is the discipline of good code structure, not object orientation; nothing in the repo has behaviour.) It should not have surprised me that the habits for keeping code maintainable also keep context maintainable.

Tomorrow morning the agent will remember none of this. Neither the shortcuts, nor the stop points, nor the ticket we closed last week. That's fine. It's all in the repo, and the repo is on every machine. We just open a session and ask.
