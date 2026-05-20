# 0001. Hard Fork Pi Coding Agent

Date: 2026-05-20

## Status

Accepted

## Context

The first prototype should feel like a serious coding-agent CLI, similar in posture to Pi Coding Agent or Claude Code. The product vision requires multiple named Lab Agents, public agent-to-agent conversation, visible Tool-Mediated Work, a Shared Work Surface, a durable Session Transcript, Independent First Passes, dynamic Session Driver changes, and Natural-Language Control.

Pi Coding Agent appears to provide a useful starting point for a serious coding-agent CLI experience, but the Thinktank Session model is central enough that treating Pi only as a host or extension point may compromise the vision.

## Decision

The project will start from a hard fork of Pi Coding Agent.

The hard fork should preserve useful Pi foundations where they fit, while allowing the product to reshape the agent runtime, CLI experience, transcript model, and collaboration semantics around Thinktank Sessions.

The fork should treat Pi's CLI/TUI ergonomics, provider plumbing, local model and authentication setup, project workspace conventions, tool execution patterns, and serious coding-agent feel as core inheritance. The fork should treat the agent runtime, Session Transcript, Lab Agent roster, Public Action visibility, Independent First Passes, and dynamic Session Driver behavior as fair game for deep replacement or redesign.

The first stage of the project is the Pi hard fork itself. The fork should be revamped around the core concept of multiple Lab Agents from different labs working together to answer user prompts.

The first prototype should read Pi-compatible local configuration in place rather than copying credentials into a new configuration store.

The first prototype should remain recognizably a CLI agent: a system-prompt-driven agent loop with terminal/tool access, model calls, and durable local state. Thinktank-specific collaboration should build on that basic coding-agent pattern rather than becoming a separate heavyweight orchestration platform.

The first prototype should keep the serious terminal feel of Pi Coding Agent or Claude Code while presenting multiple Lab Agents in one continuous room transcript. It should not expose user-facing modes or require slash-command ceremony. Lab Agents should converse naturally, tool actions should appear inline as compact public summaries, raw outputs should remain available on demand, edits should happen only after discussion, and durable Session State should live under the user's home directory rather than inside the target repository.

The room transcript should not use fixed round-robin turn taking after initial contributions. After each visible turn, eligible Lab Agents should privately form Turn Impulses about whether they have something worth saying next. The next visible speaker should emerge from those impulses, including cases where one Lab Agent speaks more often, another skips a turn, or a different Lab Agent closes the answer. The next speaker should not be the Lab Agent who spoke most recently. If every eligible Lab Agent passes, a non-last Lab Agent should fill the silence by synthesizing or moving the conversation forward.

## Consequences

This gives the project full control over the user experience and internal architecture needed for multi-lab collaboration.

This increases maintenance burden because upstream Pi changes will not be inherited automatically.

This makes it important to identify which parts of Pi should be retained, replaced, or isolated early in the prototype.

## Alternatives Considered

Use Pi as an extension host or library. This would preserve upstream compatibility, but may constrain the Thinktank Session model if Pi's extension points do not support the desired room semantics.

Build a standalone CLI from scratch. This would maximize control, but would delay learning from an existing serious coding-agent implementation.
