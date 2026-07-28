# AGENTS.md

## What this is

The Jekyll source for [seylox.github.io](https://seylox.github.io), Bernd's blog: "Working around the limitations of my intelligence." Posts are about AI agents, software engineering, and working around limitations. Built with the minimal-mistakes theme, published via GitHub Pages from `main`.

## Where things live

- `_posts/` — published posts, named `YYYY-MM-DD-blog-slug.md`
- `notes/` — research notes and drafts that back the posts (not published as posts)
- `agents/WRITING-GUIDE.md` — **read this before writing or editing any post.** Voice, tone, structure, front matter, and the em-dash ban all live there.
- `_pages/`, `_data/`, `assets/` — theme and site plumbing, rarely touched for a post

## Rules

- Follow `agents/WRITING-GUIDE.md` for anything reader-facing. No exceptions for "just this once."
- Cross-link between posts with `.html` paths, e.g. `/2026/06/26/blog-managing-the-intern-field-manual.html` (matches how existing posts do it).
- Don't commit or push unless asked. Pushing to `main` publishes the post.
- Commit messages are one-liners in conventional-commit style (`feat(blog): ...`). No bodies unless truly needed, and no LLM attribution (no `Co-Authored-By: Claude` lines).
