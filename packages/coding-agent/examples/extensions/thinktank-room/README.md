# Thinktank Room Extension

This Pi extension turns ordinary interactive Pi prompts into a shared room of Lab Agents. The room uses normal Pi's public SDK, model/provider/auth configuration, extension loading, and TUI components. It persists roster choices and structured room transcripts under `~/.ai-thinktank`.

## Install

### Clone + local package install

This is the current supported install flow for another computer. It uses Pi's local package installer, so the cloned checkout must remain on disk after installation.

```sh
git clone https://github.com/juanrgon/ai-thinktank.git
pi install /absolute/path/to/ai-thinktank/packages/coding-agent/examples/extensions/thinktank-room
```

If you are already inside the cloned repository, the relative path works too:

```sh
pi install ./packages/coding-agent/examples/extensions/thinktank-room
```

Then restart Pi or run `/reload` in an active Pi session.

A true one-command install without cloning should be done later by publishing this package to npm or moving it into a thin dedicated git repository. Installing the monorepo root directly is intentionally not documented because Pi would clone the full repository and run its root install.

### Development symlink

For local development, you can still symlink the live extension directory into Pi's global extension directory:

```sh
node packages/coding-agent/examples/extensions/thinktank-room/link.mjs
```

Then restart Pi or run `/reload`.

## Usage

Use `/roster` to choose the OpenAI, Google, and Anthropic Lab Agent models and reasoning effort. Press Space on a roster slot to enable or disable that Lab Agent; disabled agents are skipped so the room can run with only one or two agents. Normal prompts are handled by the room while Thinktank is on; slash commands remain Pi control commands. The Pi status/footer shows `Thinktank: on | ...` when prompts route to the room and `Thinktank: off` when normal Pi handles prompts.

Use `/thinktank on`, `/thinktank off`, or `/thinktank status` to toggle or inspect room routing. While a room is running, a live widget above the editor shows the current speaker, streamed text, streamed thinking blocks when the provider exposes them, and tool-call preparation. Use `/thinktank-log` to show the current structured transcript path.
