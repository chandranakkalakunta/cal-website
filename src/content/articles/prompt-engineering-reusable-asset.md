---
title: "Prompt Engineering as a Reusable Asset"
date: 2026-06-09
summary: "The real prompt-engineering skill isn't writing one good prompt — it's capturing what you and the agent learn while working together, so the next session starts smart instead of relearning. How I turned that into a versioned collaboration protocol, what goes in it, and why the same discipline also cuts token costs."
tags: ["Prompt Engineering", "AI Agents", "Engineering Practice", "Cost Optimization"]
---

Everyone agrees prompting is a core skill for working with AI agents. But most advice about it stops at the wrong place — "be specific, give examples, use clear structure." That's true and it's the easy 20%. The part that actually compounds is something else entirely: what you and the agent learn *while working together*, and whether you bother to capture it.

Here's the thing I noticed. Even with a simple opening prompt, an agent picks up a great deal through the back-and-forth of a working session — your preferences, the conventions you care about, the mistakes you keep correcting. By the end of a long session it's far more useful than it was at the start. And then the session ends, and all of that evaporates. The next time, you start from zero and teach it the same things again.

That waste is the problem worth solving. The real skill isn't writing one good prompt — it's making sure the agent starts smart on day one with everything you've already learned, instead of relearning it every time.

## Learn once, not every session

Humans get better by not repeating their mistakes. The same should be true of how you work with agents — except the learning lives in two places at once, the human's and the agent's, and neither persists by default. So you have to make it persist, deliberately, by writing it down.

This sounds obvious and almost nobody does it. We treat each prompting session as disposable. But in a world where AI work has a real cost — in tokens, in time, in repeated mistakes — throwing away everything you learned at the end of each session is expensive. Prompt evolution, by which I mean the steady accumulation of what works, is one of the highest-leverage habits available, and it's almost free. You just have to capture it.

## Two kinds of prompt

The breakthrough for me was realizing that a prompt isn't one thing. There are two, and they do different jobs.

The first is the **project prompt** — the specifics of what you're building right now. The requirements, the stack, the particular constraints of this one piece of work.

The second is the **protocol** — how you and your agents work together, *regardless* of the project. The roles, the rules, the guardrails, the patterns that have burned you before. This one is not project-specific. It's the blueprint for collaboration itself, and it's the same across everything you build.

Paired together, they answer the two questions every piece of work needs: the protocol says *how we build*, the project prompt says *what we build*. And the crucial insight is that the protocol is **reusable**. Write it once, refine it forever, and bring it to every new project.

This isn't theoretical for me. One of my current projects has a requirements document that opens with a single instruction: *pair this with the engineering protocol, which defines how.* The requirements doc then describes only the product — the domain model, the workflows, the architecture decisions for that specific thing. It never restates how the agents and I work together, because that lives in the separate protocol. Two documents, two jobs, designed to be used as a pair. The protocol file even carries a version number in its name — because it genuinely is versioned, and it's on its way to a second revision as the learnings accumulate.

## The protocol I actually use

In my own work this took the shape of a three-agent collaboration framework — a Strategist agent, a Coordinator (me), and a Worker agent (Claude Code in the terminal). I've written about that three-level model in detail in [My Experiences with AI Agents in Software Development](https://chandraailabs.com/writing/ai-agents-software-development), so I won't repeat it here. What matters for this article is the *document* that sits underneath it: a written protocol that defines how, as a one-person organization, I build software with agents. It contains:

1. **Roles and responsibilities** — a clear split of what each agent does and what the human does.
2. **Information flow** — how work and context move between the agents and me.
3. **Sensitive-operation splits** — which steps must be done by a human (anything credentialed or irreversible) versus what the worker agent can do automatically.
4. **Prompt templates** — what to specify to each party in the flow, so nothing is left implicit.
5. **A prompt quality checklist** — pre-flight verifications, change-log updates, the structure of a final report, and the other small disciplines that prevent rework.
6. **Patterns that cause confusion** — phrasings and structures that look fine but trip the agent up in later steps.
7. **A phase-gating protocol** — including the manual validation gates that must pass before the next phase begins.
8. **Strategist behavioral rules** — how the lead agent should communicate and coordinate for clarity.
9. **Common failure patterns** — a running list of mistakes I've already made, so they don't happen twice.
10. **Documentation standards** — how the work itself gets recorded.

A couple of those points are worth making concrete, because they came from real failures, not theory.

The **sensitive-operation split** (point 3) draws a hard line: anything credentialed or irreversible — creating cloud projects, linking billing, browser-based logins, deleting anything — is done by the human, with commands the strategist provides. The worker agent handles everything non-credentialed: writing files, running tests, committing code. The rule when in doubt is "the human runs it." That line exists because the cost of an agent doing something irreversible with a credential is far higher than the minor friction of a human running one command.

The **common failure patterns** (point 9) is the section I value most, because it's a running list of mistakes already made. Two examples from mine: *the worker sometimes reports success when it hasn't actually succeeded* — a tool wasn't on its path, or a command returned something unexpected — so the rule is that the human always validates independently, in a fresh terminal, never trusting the agent's own "done." And: *a platform's security defaults will sometimes block an operation you expected to work* (a cloud org refusing to create a credential key, say) — and the lesson written down is to embrace the secure default and use the recommended alternative, not fight it. Each of these cost me real time once. Written into the protocol, they cost the next session nothing.

The single most important property of this document is that it's *alive*. Every new lesson — every time an agent drifts from a guardrail, every confusion that costs an hour, every "I wish I'd told it that up front" — gets folded back in. The protocol is never finished. It's the place where hard-won experience accumulates instead of evaporating.

## The unexpected payoff: it saves tokens

I started doing this for quality and consistency. What I didn't expect was that it also solved a cost problem.

At one point I noticed my usable time with a coding agent was collapsing — sessions that should have lasted three or four hours were running out of budget in twenty or thirty minutes. The cause, once I understood it, was context build-up. Agents today carry the full conversation as context, and re-send a growing pile of it with every request. As a session goes on, that context swells, and each request gets more expensive than the last. A long session quietly becomes a costly one.

Agents are getting better at managing this — compacting conversations, summarizing progress — and they'll keep improving. But the practical move available today is simple, and the protocol makes it possible: **don't drag a bloated context around. Start a fresh session with an empty context, and seed it with two things — a concise summary of the work so far, and the protocol.**

That's the quiet power of having the protocol as a separate, reusable document. A new session doesn't need the entire history to be effective; it needs to know *how we work* (the protocol) and *where we are* (the summary). Hand it those two, and the new agent is immediately as capable as the one you left behind — without the accumulated token weight of the old conversation. You get the accumulated *learning* without the accumulated *cost*.

## The takeaway

Prompt engineering, done well, isn't a one-shot act of writing a clever instruction. It's the discipline of capturing how you and your agents work best together, in a living document you carry from project to project — and of starting fresh when context grows heavy, seeded with that document and a summary rather than the whole history.

The clever prompt is the easy part. The reusable protocol is the asset.
