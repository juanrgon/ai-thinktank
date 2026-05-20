#!/usr/bin/env node

import { APP_NAME } from "../config.ts";
import { configureHttpDispatcher } from "../core/http-dispatcher.ts";
import { runThinktankCli } from "./thinktank.ts";

process.title = `${APP_NAME}-thinktank`;
process.env.PI_CODING_AGENT = "true";
process.emitWarning = (() => {}) as typeof process.emitWarning;

configureHttpDispatcher();

runThinktankCli(process.argv.slice(2)).then(
	(exitCode) => {
		process.exitCode = exitCode;
	},
	(error: unknown) => {
		console.error(error instanceof Error ? error.message : String(error));
		process.exitCode = 1;
	},
);
