# First Vertical Slice

## Goal

Revamp a hard fork of Pi Coding Agent around the core experience of multiple Lab Agents from different labs working together to answer user prompts.

## Prototype Shape

The first prototype should be a fork of Pi Coding Agent that remains a CLI agent. It should use the same basic pattern as existing coding agents: a strong system prompt that defines the rules of work, terminal/tool access for reading, searching, editing, and running commands, and durable local state for restoring context.

The Thinktank-specific behavior should be expressed through that agent loop: multiple Lab Agents, shared transcript, visible tool actions, Independent First Passes, natural-language discussion, and Pre-Edit Deliberation before code changes.

The CLI should not expose separate user-facing modes. The Human Participant should experience the session as a single continuous conversation with the Lab Agents.

Pi-compatible slash commands may exist for control-plane operations such as choosing Lab Agent models, changing local settings, or toggling views. The canonical command for viewing and changing Lab Agent model selection is `/roster`. Bare `/roster` should open a Pi-style Roster Selector rather than introduce a new argument-heavy command language. Pi Control Commands should not replace natural-language steering for the substantive work of the Thinktank Session.

Roster choices should be session-scoped first. The initial Roster Selector should focus on the Core Lab Roster slots: OpenAI, Google, and Anthropic. Each slot should offer configured Pi models from its lab's provider family by default so Model Provenance remains clear. Cross-family providers such as GitHub Copilot may appear in multiple slots when the concrete model identity clearly belongs to that lab family, for example `github-copilot/gpt-*`, `github-copilot/gemini-*`, or `github-copilot/claude-*`. When a Human Participant resumes a Thinktank Session, the selected Lab Agent models should restore with that session. A later Pi-style settings action may save the current roster as the default for new sessions.

The Roster Command may show the current roster while the room is working, but the first implementation should only commit roster changes while the Room Runtime is idle between turns.

Committed roster changes should appear in the Session Transcript as Public Configuration Events, not as Lab Agent conversational turns.

The Room View should use Pi's existing terminal skin: the TUI shell, editor, markdown treatment, theme, and footer/status posture should feel like Pi Coding Agent, with the single-agent transcript replaced by a visible multi-agent room.

The footer should include a Compact Roster Indicator when space allows, while `/roster` provides full provider and model details.

The Room View should be implemented from Pi's actual interactive runtime path. The first implementation step should be a thin copied fork of the relevant Pi `InteractiveMode` and `AgentSessionRuntime` path into Thinktank-specific files. Keep the copied path recognizable and working first; then reshape it around the Room Runtime, Lab Agent Runtimes, and Room View instead of maintaining a separate Thinktank-specific mini-TUI.

The standalone Thinktank TUI prototype should not receive product features such as `/roster`. Before implementing roster selection, the active entrypoint should move toward the forked Pi interactive runtime path.

The first vertical slice should use a Room Runtime coordinating one Pi-derived Lab Agent Runtime per participating Lab Agent. This keeps each Lab Agent close to Pi's normal agent loop while allowing the room to own the shared transcript and collaboration semantics.

Tool-Mediated Work should preserve Pi's existing tool path where possible. Lab Agent Runtimes initiate ordinary reads, searches, and bash work through their Pi-derived tool streams; the Room Runtime observes those actions, renders them publicly, and records them. Edits and writes require Room Runtime mediation through Pre-Edit Deliberation and Coordinated Write rules.

Lab Agent Runtimes should share context through Room Runtime injection, not by sharing one private message array. Before a Lab Agent takes a turn, the Room Runtime provides the current Session Brief, relevant public transcript excerpts, Agent Roster and Model Provenance, and Action Summaries.

Human input should route through the Room Runtime first. The Room Runtime records human turns, handles Pi Control Commands such as `/roster`, and injects substantive room messages into Lab Agent Runtimes.

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
