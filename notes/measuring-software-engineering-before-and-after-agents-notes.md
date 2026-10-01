# Notes: measuring AI tooling's effect on one small team

Working notes for `_posts/2026-10-01-blog-measuring-software-engineering-before-and-after-agents.md`. This repo is public: no company names, people, absolute counts, internal paths or ticket keys. The claim-to-source mapping lives in a private folder at work.

## Why the post exists

Curiosity, not a request. Two articles landed on 2026-09-15 and said the theory; I had the data and a few hours to try the practice.

- Bharat Sharma, "AI Is Making Activity-Based Engineering Metrics Obsolete": LOC, commit and PR counts, story points are broken proxies; AI moves work downstream into review and validation; measure team-level, trended against a frozen pre-AI baseline, with control groups of differing adoption; proposed metrics: review queue time, 14-day rework, validation failure rate, post-deploy rework, rework per AI spend; never per engineer. <https://bharatsharma.pro/articles/activity-based-engineering-metrics-are-obsolete>
- James Shore, "Measuring AI's Impact on Delivery Speed": randomized within-subject repeated-measures trial, tasks assigned to with/without AI before estimating; rejects LOC, PRs, story points, estimate adherence; warns that process improvements coinciding with AI muddy causation; "Delivery speed isn't productivity." <https://www.jamesshore.com/v2/blog/2026/measuring-ais-impact-on-delivery-speed>

## Where we sit relative to the theory

- Shore's RCT is not available: three engineers, no way to randomize tasks retroactively, and nobody will work without the tooling for science.
- Shore's confounder warning describes us exactly: team cut and assistant arrived within weeks of each other.
- Sharma's "identify control groups" we could do in time rather than across teams: a six-month window with the assistant and without agent workflows.
- Sharma's metrics we could approximate: validation failure rate (pipeline success), review time (first commit to merge, approval rate). Not available: 14-day rework, post-deploy rework (no change-level revert tracking yet). Say so.
- Sharma's "never per engineer" vs. our per-head numbers: we normalized by headcount because headcount changed; we did not publish per-person numbers. Flag the tension.

## The timeline (genericized)

1. Team cut by more than half, early summer 2025.
2. AI coding assistant in the terminal, one month later. Tangled with the cut; stays tangled.
3. Agent workflows (meta-repo pattern) from February 2026, start counted from first push.
4. Control window: the six months between 2 and 3. Comparison: the three quarters after 3.

## The data (rounded, three people, quarterly)

Moved:
- Resolved work items per engineer: about 1.4x the control window.
- Merge requests per author: about 1.7x (total MRs about 1.5x).
- Commits into the agents repos themselves: a bit over a quarter of all commits in the comparison window. The cost side.
- Housekeeping share of resolved items: under 40% to over half. Smaller items partly explain "more items".

Did not move:
- Pipeline success rate: within one point.
- Approval rate on MRs: down a few points, within noise for the volume.
- First commit to merge: flat.
- Defect share of resolved items: flat, one outlier quarter from a deliberate bug sweep.
- Release cadence: flat, already at its historical fastest.

Computed and discarded (one sentence in the post): raw LOC swings by release content (vendored deps, generated code, a rewrite); commit counts halved when squash merges came in, two years before any AI.

## How (one afternoon, Claude Code doing the pulling)

git log --numstat per repo with filters for generated/vendored files; GitLab MR and pipeline API per project; Jira changelog transitions rather than the resolution field (it was back-filled in bulk); release notes for cadence. Page assembled from JSON into a local HTML.

## Cuts from draft 1 (author feedback)

- Invented commit-rule anecdote: out.
- Jira back-fill day: out (mentioned only as a method aside if at all).
- "the metric that lies on arrival" and similar headline phrasing: out.
- "couple of weeks": wrong, it was a few hours.
- Intern framing: out. Say "AI tooling" and "agent-assisted workflows".
- Asked-by-management framing: out. Curiosity.
- Target under 1000 words.

## Pre-publish checklist

- [ ] Employer okay on genericized ratios appearing publicly.
- [ ] Re-read for identification by shape.
- [ ] Cross-link to the meta-repo post resolves.
- [ ] Writing-guide pass: em dashes zero, LLM tells zero, "not X, it's Y" at most once.

## Author answers that shaped draft 3 (2026-10-01)

- Motivation: everyone argues about AI's effect; I have five years of first-hand history and can put data next to anecdotes. Hoped to show some metrics are meaningless and the tooling improves specific things. Not afraid of a null result; that is how I learn.
- Control window: arose from the data, the only possible comparison.
- The hour: work from home, handed the pull to Claude Code, went for a walk, came back to an interesting but wrong first draft; sharpening took longer than the walk.
- Surprise: epics flat, outcomes flat. Reading: surplus went into groundwork (CI, security, review automation, agent repos). A switch in HOW, an investment with ROI already visible in onboarding.
- Articles: read just before collecting the data; reaction: makes sense; we never collected a baseline beforehand.
- Agent day: repeating tasks handed off (Jira inbox, GitLab inbox, attendance); agents for discovery; simple code changes fully automated ticket to MR to review to tests.
- Reader: someone who wants to work faster and safer with agents.
- Style: plain words (no "confounder"), dry and direct, short sentences, "so there's that".
- Kept out on request: parental leave, the invented-policy anecdote as a story, the Jira back-fill, the asked-by-management framing.
