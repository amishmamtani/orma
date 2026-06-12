# Vision

*This file is intentionally stable. It captures the founding insight and should rarely change. If you find yourself wanting to rewrite it frequently, that is a signal the product hasn't found its core yet.*

---

## The problem

Tech-adjacent builders — people who understand what they're building and have enough technical context to use AI coding agents effectively — still can't read the code those agents produce. Their current workflow is: accept the agent's changes, run the server, check the output. Code review is skipped entirely because it's too cognitively heavy and requires vocabulary they don't have.

This means they lose the feedback loop between intent and implementation. They know *what* they want; they don't know *what the agent did* until runtime. Every deployment is a black box opened by running the app.

## The core insight

The vocabulary mismatch is the real barrier, not the code itself. Non-developers speak in product and UX language — user stories, interactions, business outcomes. Code is written in developer vocabulary. No tool currently treats this translation as a first-class design constraint.

## What ORMA does

ORMA reads a user's code and renders it as a visual diagram labelled in **plain product language** — not developer terms. The user clicks any node and describes what they want changed in plain English. ORMA returns a **structured prompt** they paste into their coding agent.

The user manipulates a representation in their own vocabulary. ORMA handles the translation in both directions. The output is a *prompt*, not code — ORMA is a thinking layer on top of the agents people already use, not a competitor to them.

## Why this is new

- **Forward translation** (code → diagram) exists in many dev tools, but is designed for developers.
- **Backward translation** (diagram → code) exists in legacy no-code tools, but bypasses the agent entirely.
- **The novel assembly:** non-developer vocabulary as an explicit design constraint + a bidirectional loop + *prompt as output* rather than code.

## Target user

**Tech-adjacent builders** — people who understand what they're building and speak in product/UX terms, but don't read code. The defining characteristic is not a job title but a cognitive position: they know what they want, can direct an AI agent, and can evaluate an output at the product level — but can't review the implementation.

The designer, PM, and solo founder personas from the PRD are all valid instances of this user. The unifying trait is: *they use run-and-check as a substitute for code review, because code review is inaccessible to them.*

## Success looks like

Three real users — one PM, one designer, one solo founder — can:
1. Paste a script and correctly explain what it does by reading only the diagram (never the code).
2. Describe a change and get a prompt that lands the edit in their coding agent on the first try, most of the time.
