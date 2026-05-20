import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { getAgentDir } from "../config.ts";
import {
	type CreateAgentSessionRuntimeFactory,
	createAgentSessionFromServices,
	createAgentSessionRuntime,
	createAgentSessionServices,
} from "../core/agent-session-runtime.ts";
import { AuthStorage } from "../core/auth-storage.ts";
import { configureHttpDispatcher } from "../core/http-dispatcher.ts";
import { SessionManager } from "../core/session-manager.ts";
import { ThinktankInteractiveMode } from "./interactive-mode.ts";

export interface RunThinktankInteractiveOptions {
	cwd: string;
	initialMessage?: string;
}

function getThinktankSessionDir(cwd: string): string {
	const safePath = `--${resolve(cwd)
		.replace(/^[/\\]/, "")
		.replace(/[/\\:]/g, "-")}--`;
	const sessionDir = join(homedir(), ".ai-thinktank", "pi-sessions", safePath);
	mkdirSync(sessionDir, { recursive: true });
	return sessionDir;
}

export async function runThinktankInteractive(options: RunThinktankInteractiveOptions): Promise<number> {
	const cwd = resolve(options.cwd);
	const agentDir = getAgentDir();
	const authStorage = AuthStorage.create(join(agentDir, "auth.json"));
	const sessionManager = SessionManager.create(cwd, getThinktankSessionDir(cwd));

	const createRuntime: CreateAgentSessionRuntimeFactory = async ({
		cwd,
		agentDir,
		sessionManager,
		sessionStartEvent,
	}) => {
		const services = await createAgentSessionServices({
			cwd,
			agentDir,
			authStorage,
		});
		const created = await createAgentSessionFromServices({
			services,
			sessionManager,
			sessionStartEvent,
		});
		return {
			...created,
			services,
			diagnostics: services.diagnostics,
		};
	};

	const runtime = await createAgentSessionRuntime(createRuntime, {
		cwd,
		agentDir,
		sessionManager,
	});
	configureHttpDispatcher(runtime.services.settingsManager.getHttpIdleTimeoutMs());

	const interactiveMode = new ThinktankInteractiveMode(runtime, {
		initialMessage: options.initialMessage,
		modelFallbackMessage: runtime.modelFallbackMessage,
	});
	await interactiveMode.run();
	return 0;
}
