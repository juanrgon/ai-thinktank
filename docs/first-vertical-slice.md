# First Vertical Slice

## Goal

Revamp a hard fork of Pi Coding Agent around the core experience of multiple Lab Agents from different labs working together to answer user prompts.

## Prototype Shape

The first prototype should be a fork of Pi Coding Agent that remains a CLI agent. It should use the same basic pattern as existing coding agents: a strong system prompt that defines the rules of work, terminal/tool access for reading, searching, editing, and running commands, and durable local state for restoring context.

The Thinktank-specific behavior should be expressed through that agent loop: multiple Lab Agents, shared transcript, visible tool actions, Independent First Passes, natural-language discussion, and Pre-Edit Deliberation before code changes.

The CLI should not expose separate user-facing modes. The Human Participant should experience the session as a single continuous conversation with the Lab Agents.

After the initial contributions, the visible conversation should use Natural Turn Taking rather than fixed round-robin ordering. Each eligible Lab Agent privately forms a Turn Impulse after a visible turn, and the next visible speaker emerges from those impulses. The next speaker should not be the Lab Agent who spoke most recently. If every eligible Lab Agent passes, a non-last Lab Agent should fill the silence by synthesizing or moving the conversation forward.

## Scenario

A Human Participant starts a session in a repository and gives a coding or repository-grounded planning goal.

The Agent Roster includes Lab Agents from OpenAI, Google, and Anthropic when available.

The Lab Agents use real model calls through the model, provider, and authentication setup already available through Pi Coding Agent on the local machine. The slice reads Pi-compatible configuration in place rather than copying credentials into a new configuration store. Mock Lab Agents may exist for development, but the slice is not validated by mocks alone.

Each Lab Agent performs an Independent First Pass. During this pass, each Lab Agent may inspect the Shared Work Surface and use read-only Tool-Mediated Work, but does not read the other Lab Agents' first passes.

The Independent First Passes are published into the Room View.

The Lab Agents discuss the first passes, converge on a Working Consensus, and establish the initial Session Driver.

The Lab Agents perform at least one visible read or search action, represented as an Action Summary with raw evidence available on demand.

Before editing files or writing code, the Lab Agents hold Pre-Edit Deliberation.

After discussion, the session performs one small Coordinated Write.

The Session Transcript and Session Brief are durable enough to restore the session after a pause or interruption.

The durable Session State lives outside the target repository in a user-level directory under the home directory. It is associated with the target repository and stores the transcript, brief, raw evidence references, and Intermediate Work Artifacts needed to resume the room. Source edits happen in the target repository only through a Coordinated Write.

## Proves

- Lab Agents can collaborate through a shared Room View.
- Independent First Passes preserve useful cross-lab diversity before discussion.
- Tool-Mediated Work is visible to the room through Action Summaries.
- The session can move from discussion to a real code or file change.
- The session can resume from durable state.
