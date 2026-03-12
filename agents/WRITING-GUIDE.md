# Writing Guide

Instructions for writing blog posts on seylox.github.io. Intended for both the human author and any AI co-author.

## Voice and Perspective

- **"We" = me and Claude Code.** Establish this early and naturally. Don't belabor it — one clear sentence up front, then let it come through in the actions described ("Claude suggested the fix, I pushed it, we stared at the pipeline").
- **First person throughout.** Never flip to an outside perspective ("the human had to earn their keep") — it breaks the illusion that this is a natural collaboration.
- **Conversational, not corporate.** Write like you're telling a colleague about your morning over coffee. No "excited to announce" energy.

## Tone

- **Dry humor, not slapstick.** Think Terry Pratchett or Douglas Adams — the comedy comes from precise observation and deadpan delivery, not from trying to be funny.
- **Self-deprecating honesty.** Talk about what went wrong and what was dumb. "Figuring out *which* one line took disproportionately longer" is funnier and more useful than pretending it was smooth.
- **No AI hype.** Never "AI will change everything." Never breathless. The whole point is that this stuff is practical and grounded. Treat the AI as a tool that happens to be useful, not a revolution.
- **Excited about the technical, not the technology.** The cool part is what you built and the problems you solved, not that AI exists.

## Structure

- **Open with the hook.** Lead with the most interesting or absurd thing that happened. The reader decides in the first paragraph whether to keep going.
- **Concrete before abstract.** Show the thing, then explain why it matters. Code snippet before architecture discussion. The bug before the lesson.
- **Earn every section.** If a section doesn't make the reader smarter or more entertained, cut it.
- **Close short and punchy.** The ending should land in one or two lines. Don't summarize — leave the reader with an image or a punchline.

## Technical Content

- **Include enough to replicate, not enough to drown.** The reader should be able to follow your approach without needing your exact codebase.
- **Genericize.** No company names, project names, ticket numbers, internal paths, team member names, or runner hostnames. "A mobile project" not "the Anyline TTR React Native wrapper."
- **Show the commands.** Inline code and code blocks are good. The reader wants to see `claude -p --max-turns 1`, not a paragraph describing what non-interactive mode is.
- **Name the gotchas.** The parts where things broke are the most valuable parts of the article. Document them specifically — error codes, misleading defaults, undocumented behaviors.

## What to Avoid

- Cliches: "game-changer," "leverage," "in today's fast-paced world," "without further ado"
- Meta-commentary on the writing itself (unless it's genuinely funny and brief)
- Forced jokes or puns — if a line isn't landing after two attempts, cut it
- Hashtag spam or keyword stuffing in any context
- Sections that exist only because a blog post template says they should

## Front Matter

```yaml
---
layout: single
title: "In Which [descriptive subtitle]"
date: YYYY-MM-DD
excerpt: "One sentence that makes someone want to click."
toc: true
toc_sticky: true
---
```

- **Title pattern**: "In Which..." (Winnie the Pooh chapter title style)
- **Excerpt**: One sentence, concrete, no hype
- **Always enable TOC** for posts with 3+ sections

## Process

1. Start with the real story — what actually happened, in order
2. Find the hook (usually the most absurd or surprising moment)
3. Write a first draft that's too technical
4. Rewrite with personality — add the analogies, the deadpan observations, the honest admissions
5. Read it aloud. If a sentence sounds like documentation, rewrite it. If a joke doesn't land, cut it.
6. Target 1200-1800 words. The first post (agents meta-repo) was ~3000 and that's the upper bound.

## URL Format

Jekyll default: `https://seylox.github.io/YYYY/MM/DD/slug/` (trailing slash, no .html)
