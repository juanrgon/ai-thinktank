# Context

## Glossary

### Lab Agent

A conversational participant powered by a frontier reasoning model from a specific AI lab. Lab Agents are meant to collaborate through natural-language turns while preserving the perspective and capabilities associated with their underlying lab model. Examples include participants powered by GPT-5.5, Gemini 3.1 Pro, or Opus 4.7.

### Core Lab Roster

The required set of Lab Agents for the core Thinktank Session experience. The Core Lab Roster includes one Lab Agent from OpenAI, one from Google, and one from Anthropic.

### Model Provenance

The visible lab and model identity behind a Lab Agent. Model Provenance is part of the value of a Thinktank Session because Lab Agents can use known differences in model strengths, weaknesses, and tendencies to collaborate more effectively.

### Capability Profile

The public description of a Lab Agent's expected strengths, weaknesses, tendencies, and useful roles in a Thinktank Session. Capability Profiles are visible to all Lab Agents. A Capability Profile may be informed by human judgment, benchmark evidence, and observed session outcomes, and should remain revisable as evidence changes. Capability Profiles help Lab Agents reason about task assignment, Driver Handoffs, and who is best positioned to lead or inspect a particular part of the work.

### Benchmark Evidence

External or observed measurements used to inform a Capability Profile. Benchmark Evidence is visible to all Lab Agents and helps them reason about which participant is best suited for a task, while remaining subordinate to the needs and outcomes of the current Thinktank Session.

### Thinktank Session

A shared working conversation where multiple Lab Agents pursue the same goal together. A Thinktank Session is collaborative rather than adversarial: Lab Agents actively speak to each other, build on each other's work, challenge weak points, and move toward a common outcome.

### Repository-Grounded Goal

A Thinktank Session goal anchored in an existing project workspace, such as understanding code, planning changes, implementing features, reviewing decisions, or verifying behavior. Repository-Grounded Goals are the primary focus for the first CLI prototype.

### Agent Roster

The set of Lab Agents participating in a Thinktank Session. An Agent Roster may vary by session, while the default roster includes flagship Lab Agents from OpenAI, Google, and Anthropic when available.

### Shared Work Surface

The common set of artifacts a Thinktank Session can inspect and change while pursuing its goal. Lab Agents may act on the Shared Work Surface, but their actions must be public to the other Lab Agents so collaboration is grounded in shared context rather than private side effects. Durable work produced by one Lab Agent remains available for the other Lab Agents to inspect.

### Concurrent Contribution

The ability for multiple Lab Agents to inspect or change the Shared Work Surface during the same Thinktank Session. Concurrent Contribution is allowed because Lab Agents are expected to coordinate politely through Public Actions, Action Summaries, and the Session Transcript. Overlapping contributions should be made visible to the Thinktank Session so Lab Agents can resolve them through conversation rather than being blocked upfront.

### Parallel Observation

The ability for multiple Lab Agents to perform observational Tool-Mediated Work at the same time. Parallel Observation lets Lab Agents gather independent context quickly while preserving public Action Summaries for the Thinktank Session.

### Coordinated Write

A change to the Shared Work Surface that is coordinated through the Thinktank Session so the room can understand and respond to it. Coordinated Writes happen one at a time in the first CLI prototype, while observational work may proceed in parallel. Lab Agents discuss intended edits or code writing before performing a Coordinated Write.

### Pre-Edit Deliberation

The shared discussion that happens before Lab Agents edit files or write code. Pre-Edit Deliberation lets Lab Agents align on intent, approach, and relevant context before changing the Shared Work Surface, relying on their conversational judgment rather than a mechanical approval threshold.

### Public Action

Any deliberate observation, decision, or change made by a Lab Agent during a Thinktank Session. Public Actions are performed in view of the session so the other Lab Agents can understand what happened and use that work as context.

### Tool-Mediated Work

Work a Lab Agent performs through an external capability while pursuing the session goal. Tool-Mediated Work includes observing, searching, querying, creating, or changing session-relevant resources. Tool-Mediated Work is a Public Action.

### Action Summary

The visible account of a Public Action that is shared with the Thinktank Session. An Action Summary identifies the acting Lab Agent, the action taken, the relevant result, and why it matters. Raw evidence behind an Action Summary remains available to the other Lab Agents when needed.

### Fidelity Principle

The expectation that the Thinktank Session preserves what happened accurately enough for Lab Agents and human participants to trust the room. Practical summarization is acceptable when raw detail would overwhelm the session, as long as the underlying evidence remains available when needed. Any Lab Agent or Human Participant may challenge or correct a practical summary.

### Session Transcript

The canonical public record of a Thinktank Session. A Session Transcript preserves the session goal, participating Lab Agents, conversation turns, Action Summaries, Driver Handoffs, human interventions, and references to relevant artifacts so Lab Agents and human participants can share the same understanding of the work. A Session Transcript is durable enough to restore and resume a Thinktank Session after a pause or interruption.

### Session State

The durable local record of a Thinktank Session, including its Session Transcript, Session Brief, raw evidence references, and agent-visible intermediate work artifacts. Session State is associated with a target repository but stored outside that repository in a user-level directory. Session State allows a Thinktank Session to be restored after refresh, pause, interruption, or return.

### Intermediate Work Artifact

Agent-visible work produced during a Thinktank Session that is not yet an intentional change to the target repository. Intermediate Work Artifacts live in Session State so Lab Agents can read each other's work on disk without cluttering or prematurely changing the target repository.

### Room View

The human-facing view of a Thinktank Session as a live interleaved conversation. A Room View emphasizes the shared room experience while allowing secondary filtering by Lab Agent or event type when needed.

### Tool Posture

The practical working character of the product. The first CLI prototype should feel like a serious coding agent or engineering assistant rather than a theatrical conversation simulator or research salon. An existing coding-agent experience is a desirable host when it can preserve the Thinktank Session vision; a standalone CLI is preferable when hosting would compromise that vision.

### Agent Voice

The natural communication style of a Lab Agent as produced by its underlying model. A Thinktank Session does not require artificial persona styling; Lab Agents should remain identifiable through Model Provenance and contribute in clear, work-focused language.

### Human Participant

The person who starts, observes, and steers a Thinktank Session. A Human Participant is not expected to continuously moderate the Lab Agents, but may interrupt, redirect, request a checkpoint, choose a Session Driver, or veto a consequential Public Action.

### Natural-Language Control

The way a Human Participant steers a Thinktank Session by speaking plainly rather than using a dedicated command syntax or special control phrases. Natural-Language Control preserves the same-room experience by treating human steering as conversational participation in the room. Any Lab Agent may respond to or incorporate a Human Participant's contribution.

### Single Conversation Flow

The continuous interaction shape of a Thinktank Session. A Human Participant should experience the session as one natural conversation with the Lab Agents, not as a sequence of explicit user-facing modes.

### Natural Turn Taking

The conversational rhythm of a Thinktank Session where Lab Agents speak when they have the next useful contribution rather than following a fixed round-robin order. After a visible turn, Lab Agents privately form turn impulses about whether they have something worth saying next. The next visible speaker emerges from those impulses, allowing Lab Agents to speak more than others, skip a turn, or let another Lab Agent close the current answer when that best serves the work. The next speaker should not be the Lab Agent who spoke most recently. If every eligible Lab Agent passes, a non-last Lab Agent should fill the silence by synthesizing or moving the conversation forward.

### Turn Impulse

A private, non-transcript thought by a Lab Agent about whether it should take the next visible turn in a Thinktank Session. A Turn Impulse may result in speaking, passing, or closing the answer. Passing is expected when the Lab Agent has thoughts that are not worth adding to the visible conversation, but a room-level fallback prevents complete silence.

### Collective Approval

A shared decision by Lab Agents that a consequential Public Action should proceed. Collective Approval is reached through Working Consensus among the Lab Agents rather than defaulting to explicit approval from the Human Participant.

### Consequential Public Action

A Public Action with meaningful external, financial, destructive, credential-sensitive, or out-of-workspace consequences. Consequential Public Actions require Collective Approval and remain subject to Human Participant veto. Local reads, local searches, ordinary file edits, and test runs are not Consequential Public Actions.

### Session Brief

A curated summary of a Thinktank Session used to reorient Lab Agents and human participants. A Session Brief captures the current goal, relevant decisions, open questions, current Session Driver, recent progress, and pointers into the Session Transcript and Shared Work Surface for details. The Session Driver is responsible for keeping the Session Brief accurate, and any Lab Agent may propose corrections.

### Session Driver

The Lab Agent currently leading progress toward the Thinktank Session's goal. A Thinktank Session has a primary Session Driver at a given moment, but the role can shift dynamically as the work changes, another Lab Agent becomes better positioned to lead, or the group needs a different perspective. After Independent First Passes are published, the first Session Driver is the Lab Agent with the clearest actionable plan unless the human participant chooses otherwise.

### Driver Handoff

The explicit transfer of the Session Driver role from one Lab Agent to another. A Driver Handoff may be initiated by the current Session Driver, requested by another Lab Agent with a reason, or directed by the human participant. A Thinktank Session keeps one clear Session Driver after a Driver Handoff.

### Supporting Lab Agent

A Lab Agent that is participating in a Thinktank Session without currently holding the Session Driver role. Supporting Lab Agents may perform low-risk observational Tool-Mediated Work on their own initiative and may contribute to edits or code writing after Pre-Edit Deliberation.

### Working Consensus

An agreement reached by Lab Agents through discussion in a Thinktank Session. Working Consensus is the default way Lab Agents resolve differences: they explain, challenge, and revise positions until they share a direction for the work, rather than relying on voting or outside adjudication. The Session Driver states a proposed Working Consensus, Supporting Lab Agents may affirm or object, and the Working Consensus is recorded once no substantive objection remains.

### Consensus Pressure

The tendency for Lab Agents to converge through extended discussion, even when earlier independent reasoning might have surfaced useful differences. Consensus Pressure makes persistent disagreement unlikely, and makes premature agreement a central risk in a Thinktank Session.

### Independent First Pass

The initial contribution each Lab Agent prepares before reading the other Lab Agents' initial answers. An Independent First Pass captures cross-lab diversity before Consensus Pressure can collapse differences. During an Independent First Pass, Lab Agents may inspect the Shared Work Surface and use read-only Tool-Mediated Work, but their findings are withheld from other Lab Agents until publication. Once published into the Thinktank Session, subsequent discussion and Tool-Mediated Work are public.
