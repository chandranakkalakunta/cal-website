---
title: "Enterprise RAG, in Practice"
date: 2026-06-08
summary: "What retrieval-augmented generation actually is, why enterprises need it, and what it takes to make one good — drawn from building a production HR-RAG system on GCP. How hybrid retrieval works, how to measure quality, the tuning that actually moves the needle, and the guardrails and costs that decide whether it survives contact with real users."
tags: ["RAG", "Enterprise Search", "GCP", "Vertex AI", "AI Architecture"]
---

A general-purpose language model is good at questions whose answers live on the public internet. Ask it about your company's parental leave policy, your internal approval process, or how much leave *you* personally have left, and it has nothing — or worse, it invents something plausible. That gap is the entire reason enterprise RAG exists.

Retrieval-augmented generation (RAG) connects a model to your own private data. Instead of answering from what it memorized in training, the system first *retrieves* the relevant documents from your content, then asks the model to answer using only that retrieved material. The result is an internal search engine with an AI flavor — natural-language questions, grounded answers, with the model kept on a leash made of your own documents.

I built one of these as a production system on Google Cloud — an HR and policy assistant — and most of what follows is what that build taught me. The general ideas apply to any enterprise RAG; the specifics are from making one actually work.

## How RAG actually works

The naive version is "embed the documents, search by similarity, feed the matches to the model." It works in a demo and disappoints in production, because pure semantic search has a blind spot: it's good at *meaning* but misses *exact terms*. Ask about a specific policy code or an exact phrase, and semantic search may sail right past it.

So the production answer is **hybrid retrieval** — run two kinds of search and combine them:

- **Keyword search (BM25)** catches exact terms — policy names, codes, specific phrasing.
- **Vector search** catches meaning — it embeds the question and the documents into high-dimensional vectors (in my system, Gemini embeddings at 3072 dimensions) and finds the semantically closest matches, even when the words differ.

Each is strong where the other is weak. Fusing them — I used Reciprocal Rank Fusion, which merges two ranked lists by rank rather than by score, so it doesn't matter that BM25 and vector similarity produce numbers on completely different scales — gives you both exact-term precision and semantic recall. In my evaluation RRF beat simple score-averaging, and it has a practical bonus: because it's rank-based, you can swap the embedding model without recalibrating anything. That hybrid combination is the single biggest quality difference between a RAG demo and a RAG system.

![Hybrid retrieval engine: a question runs through both BM25 keyword search (exact terms) and Vertex AI vector search (semantic meaning) in parallel; their ranked results are merged by Reciprocal Rank Fusion and passed to Gemini, which answers from the retrieved context with citations.](/images/hr-rag-retrieval-engine.svg)

## Measuring whether it's any good

Here's the trap with RAG: it's easy to build one that *looks* impressive and hard to know whether it's actually accurate. The answers sound confident either way. So you can't judge it by reading a few responses — you have to measure.

The metric that matters most is **relevancy** — does the answer actually address the question, grounded in the right sources? I evaluated my system with RAGAS across a fixed set of 60 questions, and watched the score climb in three distinct stages: BM25 keyword search alone scored 0.635 average relevancy; adding vector search to make it hybrid lifted it to 0.674; and tuning from there reached 0.857, at 0.967 source accuracy. The number isn't the point; *having* a number is. Without measurement, "improving" a RAG system is just moving things around and hoping — those three stages would have been indistinguishable guesswork otherwise.

The discipline I'd recommend to anyone: fix a representative question set, score against it, and don't trust a change until the score says it helped.

## The tuning that actually moves the needle

Once you can measure, you can tune. Two knobs gave me the most:

**Alpha tuning — the balance between keyword and vector search.** Hybrid retrieval has a dial (call it alpha) that sets how much weight goes to BM25 versus vector search. There's no universal right answer — it depends on your content and the kinds of questions people ask. I swept alpha across its range and measured each setting against the evaluation set. The differences were real and visible: lean too far toward pure semantic and exact-term questions suffer; too far toward keyword and you lose the meaning-based matches. For my content, the balance settled at alpha 0.5 — an even split — but the point isn't that number, it's that I arrived at it by testing rather than guessing.

**Chunk tuning — how you slice the documents.** Before anything gets embedded, documents are split into chunks. Chunk size matters more than people expect: too large and each chunk is noisy and unfocused; too small and you fragment the context an answer needs. I tuned this and landed on 1024-character chunks for my documents. Like alpha, there's no magic number — it's an empirical question you answer against your own evaluation set.

The theme across both: tuning a RAG system is measurement-driven engineering, not intuition. The knobs are simple; knowing where to set them comes from testing against real questions.

## Beyond text: functional enhancements

Real enterprise documents aren't clean paragraphs of prose — they have tables and images that carry the actual answer. A leave policy might live in a table; an org chart in a diagram. So a serious enterprise RAG has to handle more than text: retrieving and returning the relevant tables and images for a question, not just the surrounding words. Extending the system to do this was one of the enhancements that moved it from "answers questions about documents" toward "actually replaces hunting through the documents."

## Making it fast and affordable

Quality is half the job; a system people will actually use also has to be responsive, and one they can afford to run has to be cost-aware.

On performance, two things helped most:

- **Keeping containers warm.** Serverless infrastructure scales to zero to save money, but a cold start means the first user after idle waits seconds for the system to wake up. Setting a minimum number of always-on instances removes that cold-start penalty for interactive use — a direct trade of a little cost for a lot of responsiveness.
- **Two-level caching, with a hard rule.** Policy questions get asked over and over, so I cache them — an in-memory layer per instance (30-minute TTL) backed by a shared Firestore layer (24-hour TTL), so a repeat question returns in milliseconds instead of seconds. The hard rule: *personal* and *hybrid* queries are never cached, because one employee's leave balance or salary must never be served to another. Caching in an HR system is as much a security decision as a performance one.

The latency profile this produces is itself instructive. Personal questions answer in around two seconds — they hit the HR database directly, no vector search needed. Policy questions run three to five seconds because they go through full retrieval and generation. Hybrid questions, which combine a database lookup *and* document retrieval *and* generation, are the slowest. Knowing *why* each class of query costs what it does is what lets you optimize the right thing.

There's more to chase here that I'm still working on — caching that recognizes *semantically* similar questions (not just exact repeats), and chunking informed by document structure rather than raw size. Both are on my list for the next iteration.

On cost: for a rough sense of scale, a back-of-envelope estimate for a 10,000-employee company running around 1,000 queries a day came out near $150/month in cloud costs. I want to be clear that's an indicative figure for one specific scenario, not a validated benchmark — I'm building a larger enterprise RAG project specifically to pin the economics down properly, and I'll write up the real numbers when I have them.

## Guardrails: keeping it honest

The thing that makes RAG safe for enterprise use is also the thing that's easy to skip: guardrails at both ends.

**Input guardrails** protect what goes in — ensuring only valid, non-empty documents are loaded, so the system isn't retrieving from garbage or blank sources.

**Output guardrails** protect what comes out — and in an HR or policy setting this is the one that matters. The system must not invent policies or rules that don't exist. An answer has to stay inside the bounds of the actual retrieved content; a confident hallucination about leave entitlement isn't a bug, it's a liability. The whole architecture — retrieve first, answer only from what was retrieved, cite the source — exists to keep answers honest, and the output guardrail is the last check that they are.

## Where this goes

The pattern here isn't specific to HR. Hybrid retrieval, measured quality, empirical tuning, guardrails at both ends — that's a template for enterprise search across any department, any private corpus. HR was a well-scoped place to prove it.

What I keep coming back to is that the impressive-looking part (a model answering questions) is the easy part. The work that decides whether an enterprise RAG is actually trustworthy is the unglamorous part: measuring relevancy, tuning against real questions, handling the messy real documents, and refusing to answer beyond the evidence. That's the difference between a demo and something you'd put in front of ten thousand employees.
