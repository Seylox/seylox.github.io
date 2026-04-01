---
layout: single
title: "In Which We Write a Presentation Together (And the AI Has Opinions About Em Dashes)"
date: 2026-04-01
excerpt: "Building a 5-minute company presentation about agentic engineering, using agentic engineering, in one session. The recursion was not planned."
toc: true
toc_sticky: true
---

The presentation is tomorrow. Five minutes, company-wide Show & Tell, and I have a title ("Agentic Engineering: Creating A Map For Our Codebase") and a rough idea that it should probably be entertaining. The slide count is zero. The script is nonexistent. It's 10 AM.

By 7 PM, we had 15 slides in reveal.js with custom AI-generated illustrations, a two-act narrative structure built around an orchestra metaphor, speaker notes for every slide, and a self-contained HTML file ready to upload to Confluence. We also changed the title twice, rewrote the core story three times, and had a genuinely productive argument about punctuation.

"We," as usual, is me and Claude Code.

## The Brainstorm That Became an Orchestra

It started the way most things start: I dumped context. Here's the JIRA ticket. Here's what we've been doing for the past four months with agents meta-repos. Here are two blog posts I wrote about it. Here's the talk outline from the "Roast My AI Setup" sessions. Here's roughly what I want to say. Help me brainstorm.

Claude produced a solid first draft of the structure: Why, What, How, Impact. Clean sections. Good material. But it read like a document, not a presentation. I wanted a story.

So we brainstormed metaphors. Claude suggested four: a city map, an orchestra, a kitchen, and an expedition base camp. I took the orchestra idea and ran with it, because something clicked: our team is a small group of musicians who've never played live. We always recorded one instrument at a time. The music was in our heads. Then the band shrank. Then AI agents showed up.

The metaphor wasn't planned. It emerged from going back and forth, each of us building on the other's last suggestion. Claude would propose structure; I'd push for more story. I'd suggest a narrative beat; Claude would flag where the analogy broke down. At some point it became an orchestra that had never played live because the symphony was written for more musicians than we had, and nobody had ever collected the music into one complete score.

That took about two hours. The metaphor went through four major revisions before we stopped arguing with it.

## In Which My Co-Author Reads My Own Writing Guide

I have a writing guide. It's in the blog repository. It specifies things like tone (dry, not slapstick), perspective ("we" = me and Claude), and a list of things to avoid.

At some point I asked Claude to rewrite the narrative in the style of that guide. It produced a version that was noticeably drier, more honest, more deadpan. "Nobody died." "About as elegant as it sounds." Good stuff. I liked it.

Then I noticed it was full of em dashes.

"Interesting," I said, "because you still used em dashes in the alternative version, is this not mentioned in the writing guide?"

It checked the writing guide. No em dashes rule there. But the *repository's* AGENTS.md says, under Writing Style: "Avoid em dashes." Claude had read the writing guide but not the AGENTS.md. A reasonable mistake; the rule was in a different file.

What followed was a find-and-replace operation across the entire document. Some em dashes became periods. Some became semicolons. Some became parentheses. One became a colon. The bulk replacement turned "Not for yourself — you know the music" into "Not for yourself, you know the music," which doesn't mean the same thing. We caught it. Machines are thorough; humans notice when a comma changes the meaning of a sentence.

The whole exchange was a live demonstration of the presentation's thesis: the agent is technically flawless but needs context. In this case, the context was "our no-em-dashes rule is not where you'd expect it to be." We fixed the document and moved on. The rule, presumably, will be found next time.

## From Document to Slides to "Wait, What's Quarto?"

With the narrative settled, we moved to building slides. The plan was reveal.js. Simple, web-based, matches what other presenters are using.

I asked Claude to check out the company's show-and-tell repo for a sample. It cloned the repo, explored the existing presentation, and came back with news: "The sample presentation uses Quarto, not raw reveal.js."

Neither of us had used Quarto before. (Well, I hadn't. Claude had read the documentation, which is arguably the same thing and arguably not.) Quarto turned out to be a remarkably clean setup: write slides in markdown, get reveal.js output. No webpack. No npm. Just `.qmd` files and `quarto preview`.

Installing Quarto required `sudo`. Claude cannot type passwords. This was the low point of the session.

Once past the authentication barrier, the slides came together fast. The narrative mapped to 15 slides: 8 for the orchestra story (Act 1), a bridge slide mapping the metaphor to reality, 5 for the concrete stuff (Act 2), and a closer. Each slide got speaker notes with the full narration text. Each story slide got a background image placeholder.

Claude wrote image generation prompts for me. Seven of them, each specifying "1920x1080 landscape, painterly illustration style, dark purple and warm amber tones, no text." I fed them to ChatGPT, dropped the results into an `images/` folder, and Claude wired them up. The visual consistency across slides was surprisingly good for something assembled in under an hour.

## The Details That Take the Time

The broad strokes took 30% of the session. The remaining 70% was refinement. Should the story slides have full sentences or anchor phrases? (Anchor phrases. Your voice carries the detail.) Should the capability list reveal one item at a time or all at once? (All at once. Seven clicks while narrating is distracting.) Should the title be "Agentic Engineering: Creating A Map For Our Codebase" or "Writing the Score"? (The latter. The metaphor evolved past maps.)

Some of the refinements were mine. "The problem was also that the pieces the orchestra was playing always required more musicians than we actually had available in the first place." Claude worked that into the narrative. "From my own experience, onboarding someone to the entire codebase was a huge undertaking. I think it took me something like two years." That became "two years to learn the full repertoire."

Some were Claude's. It flagged that the slide outline didn't cover the emotional climax of the story ("the problem was never talent"), which was buried in the middle of a paragraph with no slide of its own. That got its own slide. It also caught that the closer was over-explaining itself: "That's the compounding at work" was unnecessary after "the stretches are getting longer." The audience can connect that dot.

And some were negotiated. The last line on the conductor slide went through four versions before we landed on "Not live yet. But getting closer." Short, honest, forward-looking. The three previous attempts were all technically fine and all slightly wrong in a way that only became obvious when you imagined saying them out loud to a room of colleagues.

## The Recursion

Here's the part that's hard to write about without it sounding like a sales pitch, so I'll just state the facts.

We used an AI agent to build a presentation about using AI agents. The presentation's central thesis is that agents are only as good as the context you give them. During the session, the agent demonstrated this thesis by missing an em dash rule because the rule was in a different file than expected. We gave it the context. It didn't miss it again.

The presentation argues that our role is shifting from playing instruments to conducting. During the session, that's what happened: I directed, reviewed, course-corrected, and added detail from lived experience. Claude drafted, structured, refined, and caught things I missed.

The presentation took one session. From "I have a title and no slides" to "here's a self-contained HTML file you can upload to Confluence." The blog post about the presentation, the one you're reading now, was written in the same session.

The score gets more complete every day. That part's not a metaphor.
