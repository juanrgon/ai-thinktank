#!/usr/bin/env node

import { APP_NAME, VERSION } from "../config.ts";
import { configureHttpDispatcher } from "../core/http-dispatcher.ts";
import { runThinktankInteractive } from "./interactive-runner.ts";
import { parseThinktankCliArgs, printThinktankHelp, readPipedStdin, runThinktank } from "./thinktank.ts";

process.title = `${APP_NAME}-thinktank`;
process.env.PI_CODING_AGENT = "true";
process.emitWarning = (() => {}) as typeof process.emitWarning;

configureHttpDispatcher();

async function main(args: string[]): Promise<number> {
	const parsed = parseThinktankCliArgs(args);
	if (parsed.help) {
		printThinktankHelp();
		return 0;
	}
	if (parsed.version) {
		console.log(VERSION);
		return 0;
	}

	const stdinPrompt = await readPipedStdin();
	const prompt = [...parsed.promptParts, stdinPrompt]
		.filter((part): part is string => !!part)
		.join("\n\n")
		.trim();

	if (process.stdin.isTTY) {
		return runThinktankInteractive({
			cwd: process.cwd(),
			initialMessage: prompt.length > 0 ? prompt : undefined,
		});
	}

	if (!prompt) {
		printThinktankHelp();
		return 1;
	}

	return runThinktank({
		prompt,
		cwd: process.cwd(),
	});
}

main(process.argv.slice(2)).then(
	(exitCode) => {
		process.exitCode = exitCode;
	},
	(error: unknown) => {
		console.error(error instanceof Error ? error.message : String(error));
		process.exitCode = 1;
	},
);
