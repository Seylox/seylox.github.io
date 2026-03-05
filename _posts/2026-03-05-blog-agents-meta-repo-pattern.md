---
layout: single
title: "In Which We Give Our AI Agent a Map (And It Stops Getting Lost)"
date: 2026-03-05
excerpt: "The Agents Meta-Repository Pattern for Multi-Repo Codebases"
toc: true
toc_sticky: true
---

Initially, our expectations were fairly modest. We had started using AI coding agents — Claude Code, specifically — to help with the kind of work that makes developers question their career choices: coordinating changes across multiple repositories, keeping documentation in sync, wrangling submodules. The sort of tasks where you spend more time *navigating* than *coding*.

The agents were impressive. Within a single session, they could read code, understand patterns, make changes, run tests, and produce working commits. But then the session would end. And the next day, when we needed to continue the same work, the agent would start over. From scratch. Exploring directory structures it had explored yesterday. Re-reading conventions it had already internalized. Asking questions it had already answered.

It was like working with a brilliant colleague who suffered from amnesia every morning.

At Anyline, we build mobile SDKs for optical character recognition — scanning IDs, license plates, barcodes, that sort of thing. Our codebase spans six independent repositories across two native platforms (Android and iOS) and four cross-platform wrappers (Flutter, React Native, Cordova, .NET). Each repository has its own build system, CI pipeline, release process, and conventions. It is, as they say, a lot.

We needed a way to give our AI agents persistent context. Not just memory of what happened yesterday, but structured knowledge about *how our codebase works* — the kind of institutional knowledge that takes a human developer months to accumulate.

What we built is what we now call the **agents meta-repository**: a dedicated repo that serves as an AI agent's knowledge base, orientation guide, and working memory for navigating a multi-repo codebase.

In practice, starting a new task now looks like this: I fire up an agent in our top-level workspace, give it a ticket number and tell it which product we're working on. The agent reads the meta-repo, orients itself, and we're off to the races. No exploration phase. No "which repo is the Flutter wrapper in again?" No re-reading of commit conventions. Just work.

This post explains the pattern, shows a real case study, and gives you everything you need to adopt it yourself.

## Why Multi-Repo is Uniquely Hard for AI Agents

If you work in a monorepo, some of this won't resonate. You can skip ahead, but you'll miss some entertaining commiseration.

For those of us who have embraced (or inherited) multi-repo architectures, the challenges are familiar to humans and novel to agents:

**Convention fragmentation.** Repository A uses Gradle. Repository B uses CocoaPods. Repository C uses pub.dev. They all have different ways of running tests, different CI configurations, and slightly different commit message conventions that were supposed to be identical but drifted apart sometime in 2023. A human developer learns these differences through painful experience. An agent has to rediscover them every session — or, worse, assume they're all the same and produce commits that fail CI.

**Cross-repo dependency chains.** In our case, the scanning engine feeds into native SDKs, which feed into cross-platform wrappers. Updating a shared schema means touching six repositories in a specific order. Miss the order, and your wrapper builds against stale native SDK artifacts. An agent with no knowledge of this dependency chain will cheerfully start updating the Flutter wrapper before the iOS SDK it depends on has been updated.

**Session amnesia.** Modern AI agents do have auto-memory — small persistent notes that carry across sessions. But auto-memory is flat. It's a scratchpad, not a project tracker. You can't store a 67-kilobyte progress log with five sessions of cross-platform coordination in a scratchpad. (Well, you can try. The results are not encouraging.)

**Token waste.** Every session spent running `ls`, `find`, and `grep` to rediscover repository structure is tokens burned. At current pricing, this is real money. More importantly, it's real time — time the agent could spend actually solving your problem instead of figuring out where things are.

**The monorepo temptation.** At this point, someone always suggests: "Just move to a monorepo." And yes, monorepos do solve some of these problems. They also introduce build complexity, access control challenges, CI blast radius concerns, and the need to coordinate releases across teams that may operate at very different cadences. Many organizations — ours included — have good reasons for keeping repositories separate. The agents meta-repository gives you monorepo-like ergonomics for your AI agents without restructuring your entire codebase.

## Research, Plan, Execute — With Everything Written Down

Before diving into the structure, there's a broader pattern worth mentioning that has worked extremely well for us when working with AI agents — not just in multi-repo contexts: **research, plan, execute**, with a strong emphasis on the planning phase, and everything written down.

AI agents are fast. They can write code, run tests, create commits, and push branches at a pace that would make any developer jealous. But without a deliberate planning phase, that speed can work against you. An agent that jumps straight to implementation will produce *something* — but "something" and "the right thing" are not always the same.

The pattern we've settled on is this: when starting any task of meaningful size, the agent first **researches** — reads relevant code, checks existing patterns, understands the current state. Then it **plans** — writes down what it intends to do, which files it will change, in what order, and why. Only then does it **execute**. The plan isn't a formality. It's the point where we can catch misunderstandings before they become wrong code in six repositories.

And I want to be clear about one thing: this whole setup still requires experienced engineers at the wheel. The agent doesn't replace judgment — it gives you super powers. You still need someone who knows the codebase, understands the architecture, and can look at a plan and say "no, that merge order will break the Flutter build." The agent does the heavy lifting. The human steers, reviews, and takes final responsibility. We've found that this combination — experienced developer plus well-informed agent — is where the real velocity comes from.

The agents meta-repo supercharges this pattern. The research phase is faster because the meta-repo tells the agent where to look. The planning phase is better because the agent knows the conventions and constraints. And the execution phase is more reliable because workflows document the right order of operations.

Everything gets written down. Plans, decisions, progress, discoveries — all of it goes into the active-work tracking documents. Yes, this helps the agent remember, but the real benefit is for the humans: an auditable trail you can review, correct, and learn from. More on that shortly.

## The Pattern: Anatomy of an Agents Meta-Repo

The core idea is simple: create a dedicated repository that contains everything an AI agent needs to know to work effectively across your codebase. Not code — *context*.

Here's the generalized structure:

```
my-product-agents/
├── AGENTS.md                       # Entry point — the first thing any agent reads
├── repos.yaml                      # Machine-readable repo definitions
├── structure/
│   ├── dependency-graph.md         # Visual dependency chain
│   └── repo-purposes.md           # What each repo does
├── conventions/
│   ├── commits.md                 # Commit format, signing, ticket references
│   ├── branching.md               # Branch naming patterns
│   ├── release-notes.md           # Release notes format and location
│   └── active-work.md            # How to track multi-session work
├── workflows/
│   ├── cross-repo-changes.md     # Step-by-step for coordinated updates
│   ├── release-process.md        # Release coordination across repos
│   ├── ci-pipeline-analysis.md   # How to query CI status
│   └── workspace-setup.md        # Clone and initialize everything
├── scripts/
│   ├── ci/                       # CI query helpers
│   └── issue-tracker/            # Issue tracker integration
├── active-work/                   # Currently in-progress epics
│   ├── EPIC-001.md               # Main tracking document
│   └── EPIC-001/                 # Supporting documents
└── archive/                       # Completed epics (learning material)
    └── EPIC-000.md
```

Let's walk through the components.

### AGENTS.md — The Entry Point

This is the single file an agent reads first when entering your codebase. Think of it as the README for machines. It contains:

- A **repository map**: a table listing every repo with its path, purpose, languages, and build system
- **Quick-reference conventions**: commit format, branch naming, license key handling — the things an agent references constantly
- **Links to deeper docs**: workflows, architecture, infrastructure guides
- A **"living document" contract** built on three principles: **Verify**, **Update**, **Suggest**

That last point deserves unpacking. Every AGENTS.md in our system opens with a prominent disclaimer that documentation may have drifted from reality, and instructs the agent to follow three principles:

- **Verify** paths, commands, and conventions against actual repository state before relying on them
- **Update** the documentation when inaccuracies are discovered
- **Suggest** improvements based on session experiences

You might think this sounds like defensive boilerplate. It's actually closer to an immune system. The most dangerous documentation is documentation that *used to be correct* — and in a fast-moving codebase, that's most documentation, given enough time. By building these three principles into the entry point itself, agents learn to treat the meta-repo as a starting point for investigation rather than gospel truth. And when they find something wrong, they fix it. The documentation maintains itself — not perfectly, but far better than documentation that nobody is responsible for updating.

### repos.yaml — Machine-Readable Config

This is the "API" version of AGENTS.md — structured data rather than prose. It contains:

```yaml
repositories:
  android-sdk:
    path: "sdks/android"
    languages: [kotlin, java]
    build_system: "gradle"
    build_commands:
      release: "./gradlew assembleRelease"
      test: "./gradlew test"
    version_files:
      - "build.gradle"
      - "antora.yml"
    ci_project: "myorg/sdks/android"
    submodules:
      - name: "shared-resources"
        path: "shared-resources/"

  flutter-wrapper:
    path: "wrappers/flutter"
    framework: "flutter"
    build_commands:
      analyze: "flutter analyze"
      test: "flutter test"
    version_files:
      - "pubspec.yaml"
      - "package.json"
```

Why bother with YAML when you have prose documentation? Because agents parse structured data naturally and it eliminates ambiguity. When an agent needs to update version files across all repositories, it doesn't have to scan documentation paragraphs hoping to find the list — it reads `version_files` from the YAML and gets to work.

### Conventions — Document Once, Apply Everywhere

The `conventions/` directory is where you document standards that apply across all repositories: commit message format, branch naming, release notes structure, and so on.

Here's the thing: without a centralized conventions directory, every repository's agent documentation repeats the same rules. And repeated rules inevitably drift. Repository A says "always sign commits." Repository B says "sign commits with GPG." Repository C forgot to mention signing entirely. The meta-repo is the single source of truth. Per-repo documentation references it rather than duplicating it.

### Workflows — Playbooks for Complex Operations

The `workflows/` directory contains step-by-step guides for operations that span multiple repositories. Cross-repo changes, release coordination, submodule updates, CI pipeline analysis.

These are the playbooks that transform an agent from "smart but lost" into "smart and effective." Without a documented workflow for cross-repo changes, an agent will make reasonable guesses about the process — and reasonable guesses, in a multi-repo environment, have a way of being expensively wrong.

### Scripts — Standardized Tooling

Thin shell script wrappers around CLI tools that standardize common operations. CI pipeline queries, issue tracker integration, workspace initialization.

The existence of these scripts means an agent doesn't have to invent its own approach to, say, querying why a CI pipeline failed. It uses the provided script, which handles authentication, API encoding, and output formatting. One less thing to hallucinate.

## Closing the Loop: Tool Integration

So far, everything we've described is passive — documentation the agent reads. But the meta-repo also teaches agents how to *act*.

We've integrated our agents with every major tool in our development workflow:

**CI pipeline integration.** Our agents query build status, inspect failed jobs, and read job logs using helper scripts wrapped around the GitLab CLI. When a pipeline fails, the agent fetches the log, identifies the failing test, and starts debugging — all without asking you to go look at the CI dashboard. The meta-repo documents exactly how to do this, including the annoying URL-encoding rules that GitLab's API requires for project paths.

**Issue tracker integration.** Our agents create and update tickets, add comments, and even convert markdown to the issue tracker's native format (which, if you've ever dealt with Atlassian Document Format, you'll appreciate is non-trivial). The meta-repo includes scripts for all of this, plus a Python utility that handles the markdown conversion so agents don't have to figure out nested JSON document structures on the fly.

**Repository management.** Agents clone, pull, push, create branches, and initialize submodules. The workspace-setup workflow means you can point an agent at the meta-repo and say "set up the workspace" — and it will autonomously clone all repositories, initialize submodules, and configure tooling. We've actually done this. It works. The first time it happened without our intervention, we may have stared at the screen for a moment.

**Merge request management.** Agents create merge requests, assign reviewers, add comments, and track approvals. The workflow documentation includes patterns for looking up reviewer usernames from partial names — because agents, like humans, sometimes only remember someone's first name.

**Chat integration.** This is the newest addition: agents can read and post to Slack channels. We've even documented a structured format for release announcements — the agent posts a lean summary to the channel, then immediately adds full release notes in a thread. It handles platform-specific emoji, distribution links, and dependency references. The first time an agent posted a perfectly formatted release announcement to our team channel, the reaction was a mix of delight and mild existential concern.

**The setup script.** The meta-repo includes a script that configures all of these integrations — CLI authentication, MCP server connections, permission grants. Run it once, and your agent has access to the entire toolchain.

If you squint at this list — CI access, repository management, issue tracking, merge requests, chat — you might notice it reads a lot like the feature list of those fully autonomous "AI software engineer" products that have been making the rounds (*cough* OpenClaw *cough*). Internally, I've described our setup as "OpenClaw without the heartbeat and gaping security flaws." The agent has access to all the same tools, but it runs locally, on your machine, with your credentials, and — this is the important part — with a human reviewing every step. No autonomous loop deciding to push to main at 3 AM.

A note on what's *not* automated yet: releases. The release process still involves a lot of manual coordination — version bumps, changelog finalization, artifact publishing, app store submissions. We have workflows that document the process, and the agent can handle individual steps, but end-to-end release automation is still on the roadmap. That said, even the partial integration — having an agent that can check CI status, create merge requests, update tickets, and post to Slack — already makes a huge difference. It's also, and I don't think this gets said enough in technical blog posts, *fun*. Watching an agent navigate your entire toolchain with confidence, posting a formatted release announcement to Slack while you sip your coffee — that's the kind of thing that makes you grin at your screen like an idiot.

One lesson we learned the hard way: for production use, **shell scripts are more reliable than MCP tools**. We discovered this after an MCP server returned only pagination metadata instead of actual pipeline data. We documented the finding explicitly — "use bash commands, not MCP tools for this" — so future agents (and future us) don't repeat the experiment.

## Active Work as Extended Memory

If you adopt only one part of this pattern, adopt this one.

The `active-work/` directory implements what we think of as the agent's "extended brain" — a structured, persistent workspace for tracking multi-session epics. Here's the pattern:

```
active-work/
├── EPIC-001.md                 # Main tracking document
└── EPIC-001/                   # Supporting documents
    ├── analysis.md             # Deep-dive investigation
    ├── recommendations.md      # Proposed solutions
    ├── plan.md                 # Implementation plan
    └── ticket-summary.md       # Related ticket content
```

The **main tracking document** follows a standard structure: overview, repositories involved, progress log (dated session entries), next steps checklist, and decisions made with rationale.

The **supporting documents** contain deeper analysis, recommendations with trade-offs, implementation plans, and content for issue tracker tickets.

The lifecycle works like this:

1. **Creation**: When a piece of work will span multiple sessions or needs stakeholder input, create a tracking document.
2. **Active use**: After each session, update the progress log. Add what was accomplished, what was discovered, what decisions were made.
3. **Completion**: Mark as complete, add a final summary.
4. **Archival**: Move to `archive/`. The completed work becomes reference material for similar future tasks.

What makes this work is the bridge between the agent's built-in auto-memory and this structured tracking. The agent's auto-memory stores a pointer — "Active epic: EPIC-001, see `active-work/EPIC-001.md`" — and the next session, the agent reads the tracking document and picks up exactly where it left off. Not approximately. Exactly. With full knowledge of decisions made, feedback received, and work remaining.

We've run epics spanning five sessions over three weeks using this pattern. The fifth session had the same quality of context as the first. Auto-memory alone never got us there.

## Case Study: Coordinated Cross-Platform Configuration Fix

Let us tell you about the time an AI agent managed an eight-merge-request, six-repository fix across two platforms and four cross-platform wrappers, over five sessions and three weeks. Without losing context once.

**The problem**: We discovered that a UI configuration property behaved differently between our Android and iOS implementations. Properties that were supposed to be identical produced visually different results on each platform. The inconsistency had propagated into every cross-platform wrapper, meaning every downstream integration was affected.

**The scope**: Six repositories. Two native SDKs, four wrapper plugins. Shared schemas needed updating. Breaking changes needed migration guides. Release notes needed writing across all platforms. And the changes had to be merged in strict dependency order — shared resources first, then native SDKs, then wrappers.

Here's how the five sessions unfolded:

**Session 1: Analysis.** The agent read the agents meta-repo, understood the dependency chain, and audited all six repositories. Within a single session, it produced a detailed analysis document comparing the property behavior across platforms, identified every file that needed changing, and wrote recommendations with trade-offs. This analysis document went into `active-work/EPIC-001/analysis.md`. The tracking document recorded the findings and proposed next steps.

**Session 2: Implementation.** The agent picked up the tracking document, saw where it left off, and began implementing. Schema changes were committed to the shared resources repo. Native SDK implementations were done on both platforms. During code review, the agent discovered a subtle bug in the test framework's mocking behavior — a relaxed mock was returning a non-null object where null was expected, causing a calculation to silently produce `NaN`. The bug and its fix were documented in the tracking log. Eight code review discussions were resolved across multiple merge requests.

**Session 3: Stakeholder feedback.** Two team members flagged that the migration guidance in the release notes was misleading. The agent read their feedback, updated release notes across all six repositories, added prominent warning blocks, and adjusted code examples. It then posted a response to the issue tracker addressing both reviewers' concerns with commit references. All of this was recorded in the tracking document.

**Session 4: Wrapper updates.** While waiting for merge request approvals on the native SDKs, the agent applied release notes and configuration changes to all four wrapper plugins. With time still available in the session, we pointed it at two related documentation tickets that had been sitting in the backlog — tasks we'd been putting off because they touched files across all six repos. The agent, already holding full context of the codebase from the main epic, knocked them out in minutes.

**Session 5: Merge day.** All eight merge requests were merged in dependency order: shared resources first, then both native SDKs in parallel, then all four wrappers in parallel. All issue tracker tickets were closed. The epic tracking document was marked complete and moved to the archive.

**What the agents meta-repo provided**: Session 1 took minutes instead of hours because the agent already knew which repos existed, their dependency order, where config files lived, how to query CI, and what the commit conventions were. Sessions 2 through 5 each started with full context of everything that had happened before. The cross-repo workflow documentation meant the agent followed a tested pattern for coordinated changes. And the archive now serves as a reference for the next time we need to do something similar.

**Without the meta-repo**: The agent would have spent a good chunk of each session re-exploring the codebase. It likely would have missed the dependency ordering requirement. Stakeholder feedback from session 3 would have been lost by session 4. And we'd have no record of the subtle mocking bug that cost us time — a bug that, now documented, will cost us zero time next time.

## Proving the Pattern Scales: A Second Product Line

If a pattern only works once, it's a coincidence. We wanted to know if it was actually a pattern.

Our second product line uses a fundamentally different architecture: Kotlin Multiplatform instead of C++, server-side processing instead of on-device, and a much smaller set of repositories (three core repos versus six). Different team, different technology stack, different maturity levels.

We applied the same meta-repository structure. The result was encouraging: the structure was reusable but not copy-paste. The second product line needed sections the first didn't — backend API documentation, for instance, since the first product processes everything on-device. It also introduced a concept the first product line hadn't needed: **maturity assessments**. Since the second product's repos ranged from stable to early-stage, we added explicit maturity tags (STABLE, MATURING, EARLY) so agents would know to expect different levels of documentation, CI coverage, and convention adherence in each repo.

The rollout was phased: core structure and conventions first, then workflows and scripts, with active-work tracking coming later. This phased approach proved important — trying to build the full structure upfront would have been premature for a product line that was still discovering its own patterns.

At the root of our workspace, an AGENTS.md file acts as a router: it points agents to the correct product-line meta-repo based on the task at hand. Two product lines, two meta-repos, one entry point.

## How to Set Up Your Own

If you've made it this far and you're thinking "I should do this," here's the practical version.

**Step 1: Create the repo and AGENTS.md.** Create a new repository. Add an `AGENTS.md` file with a repository map — a table listing every repo in your product line with its path, purpose, and primary language. This alone will save agents a surprising amount of exploration time.

**Step 2: Add repos.yaml.** Create a YAML file with machine-readable definitions. Start with paths, build commands, and version file locations. You'll be surprised how often agents need to know "which files contain the version number" and how much time a definitive list saves.

**Step 3: Document your commit conventions.** This is the convention agents reference most frequently. Document the format, any signing requirements, ticket reference patterns, and branch naming. If you use conventional commits, say so explicitly — agents know the standard but need to know if you follow it.

**Step 4: Write your first workflow.** Pick the operation you perform most often across multiple repos. For us, it was "make a coordinated change across all wrappers." Document it step by step, including the order of operations and a verification checklist. This single document will prevent an entire category of agent mistakes.

**Step 5: Add the active-work directory.** Create `active-work/` and `archive/` directories. Write a short convention document explaining the tracking document format. Then start using it the next time you have a multi-session task.

**Step 6: Wire it into your repos.** Add an AGENTS.md (or CLAUDE.md, .cursorrules, or whatever your agent framework uses) to each repository that references the meta-repo for conventions and workflows. At the root of your workspace, add a pointer to the meta-repo so agents can find it from anywhere.

**Step 7: Iterate.** Treat everything as a living document — Verify, Update, Suggest. When an agent discovers that a documented path no longer exists, update the documentation. When a workflow turns out to be incomplete, fill in the gaps. The meta-repo should evolve with your codebase, not calcify.

Once it's set up, the daily workflow is almost disappointingly simple: open a terminal in your workspace root, start your agent, tell it the ticket number and product area, and let the meta-repo do the rest. The agent reads the entry point, navigates to the right repositories, picks up any active-work tracking documents, and starts the research-plan-execute cycle with full context. The entire orientation phase — which used to eat up a good part of every session — just vanishes.

**What to start with**: AGENTS.md, repos.yaml, commit conventions, one workflow. This is enough to see immediate value.

**What to add later**: Scripts, active-work tracking, CI integration, issue tracker integration, maturity assessments, chat integration.

**What to add last**: Archive conventions, templates, automated setup scripts. You need enough completed work to justify an archive before you need conventions for how to archive.

## Lessons Learned (And a Few Things We Got Wrong)

**Documentation drift is real.** Remember those Verify/Update/Suggest principles? They're not just for show. We discovered stale paths and outdated commands regularly. The meta-repo must be maintained, not just created. The self-healing mechanism helps — agents do catch and fix drift — but it requires discipline to review and apply their suggestions rather than dismissing them as noise.

**Start small.** Our first iteration had too much documentation. The agent would dutifully read everything, spending thousands of tokens on infrastructure details it didn't need for the current task. We learned to keep AGENTS.md focused on quick reference and link to deeper docs only when the agent needs them.

**Active work tracking is the feature that matters most.** The conventions and workflows are useful but relatively static. The active-work tracking is what makes multi-session epics feasible. It's the difference between "a helpful tool" and "a team member who remembers."

**Machine-readable config pays off.** `repos.yaml` seemed like overkill when we first created it. It wasn't. Agents parse it naturally, and it eliminates an entire category of "which file do I need to update?" questions.

**Per-repo documentation still matters.** The meta-repo doesn't replace per-repo AGENTS.md files — it complements them. Each repository still needs its own documentation for build commands, testing instructions, and repo-specific quirks. The meta-repo handles the *cross-repo* context; individual repos handle *local* context.

**The archive is underused but worth keeping.** We rarely point agents at archived epics. But when we do — "handle this release the same way we did the last one" — the detail is worth its weight in tokens. A completed epic with full decision history, merge request coordination notes, and stakeholder feedback turns out to be the best reference for similar future work.

**Good context creates compound returns.** During our cross-platform epic, the agent had already built up deep context of every repository involved. So when we pointed it at two unrelated documentation tickets during a lull, it completed them in minutes — work that would have taken a fresh agent (or a context-switching human) much longer. The meta-repo didn't just help with the primary task; it made everything *adjacent* to that task faster too.

## What's Next

Let me be honest: none of this is a silver bullet. It's a way of working that happens to fit well in early 2026, when AI coding agents are powerful enough to do real cross-repo work but still need structured context to do it well. The tooling is evolving fast. The models are evolving faster. Six months from now, parts of this pattern may be unnecessary because the agents will have gotten better at discovering context on their own. Other parts — the active-work tracking, the human-in-the-loop planning — will probably matter more, not less.

We're exploring automated drift detection (a CI job that verifies documented paths and commands still exist), richer machine-readable configurations (test commands, deployment targets, distribution channels), and cross-product-line conventions for the things that really are universal.

But the broader point — and the reason for writing this rather long blog post — is this: as AI coding agents become more capable, the bottleneck shifts. It's no longer "can the agent write the code?" The answer to that is increasingly, unreservedly, yes. The bottleneck is: "does the agent know enough to write the *right* code, in the *right* place, following the *right* conventions, in the *right* order?"

Persistent, structured context is the unlock. A meta-repo that gives your agent the institutional knowledge it needs — not just what your code does, but how your team works — turns a fast tool into a fast tool that's actually pointed in the right direction.

If any of this resonated, start small. Create a repository. Write an AGENTS.md. Add a repos.yaml. Document your most common cross-repo workflow. Then give your agent a task and watch what happens when it doesn't have to start from scratch.

You might be pleasantly surprised. We were.
