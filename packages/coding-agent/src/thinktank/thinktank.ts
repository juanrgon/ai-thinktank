import { createHash, randomUUID } from "node:crypto";
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";
import type { ModelThinkingLevel } from "@earendil-works/pi-ai";
import {
	type Api,
	type AssistantMessage,
	type Context,
	clampThinkingLevel,
	completeSimple,
	type Message,
	type Model,
	streamSimple,
} from "@earendil-works/pi-ai";
import chalk from "chalk";
import { getAgentDir, VERSION } from "../config.ts";
import { AuthStorage } from "../core/auth-storage.ts";
import { ModelRegistry } from "../core/model-registry.ts";
import { defaultModelPerProvider } from "../core/model-resolver.ts";

type LabId = "openai" | "google" | "anthropic";

interface LabDefinition {
	id: LabId;
	displayName: string;
	shortName: string;
	providerCandidates: string[];
	preferredModelIds: string[];
	displayModelIds: string[];
	modelIdNeedles: string[];
}

interface LabAgent {
	definition: LabDefinition;
	model: Model<Api>;
	visibleName: string;
}

type TurnImpulseKind = "add" | "challenge" | "clarify" | "synthesize" | "final" | "none";

interface TurnImpulse {
	action: "speak" | "finish" | "pass";
	kind: TurnImpulseKind;
	urgency: number;
	reason?: string;
}

interface RankedTurnImpulse {
	agent: LabAgent;
	impulse: TurnImpulse;
}

interface TranscriptTurn {
	speaker: string;
	text: string;
}

interface ThinktankSessionPaths {
	dir: string;
	transcriptPath: string;
	briefPath: string;
}

interface RunOptions {
	prompt: string;
	cwd: string;
}

const MAX_DYNAMIC_DISCUSSION_TURNS = 8;

const LAB_DEFINITIONS: LabDefinition[] = [
	{
		id: "openai",
		displayName: "GPT-5.5",
		shortName: "OpenAI",
		providerCandidates: ["openai-codex", "openai", "azure-openai-responses"],
		preferredModelIds: [defaultModelPerProvider["openai-codex"], "gpt-5.5", defaultModelPerProvider.openai],
		displayModelIds: [defaultModelPerProvider["openai-codex"], "gpt-5.5"],
		modelIdNeedles: ["gpt-5.5", "gpt-5", "gpt"],
	},
	{
		id: "google",
		displayName: "Gemini 3.1 Pro",
		shortName: "Google",
		providerCandidates: ["google", "google-vertex"],
		preferredModelIds: [defaultModelPerProvider.google, defaultModelPerProvider["google-vertex"]],
		displayModelIds: [defaultModelPerProvider.google, defaultModelPerProvider["google-vertex"]],
		modelIdNeedles: ["gemini-3.1-pro", "gemini-3", "gemini"],
	},
	{
		id: "anthropic",
		displayName: "Opus 4.7",
		shortName: "Anthropic",
		providerCandidates: ["anthropic"],
		preferredModelIds: [defaultModelPerProvider.anthropic, "claude-opus-4-7"],
		displayModelIds: [defaultModelPerProvider.anthropic, "claude-opus-4-7"],
		modelIdNeedles: ["opus-4-7", "opus"],
	},
];

const THINKTANK_SYSTEM_PROMPT = `You are a Lab Agent in an AI Thinktank CLI.

The user is watching one serious terminal transcript where multiple lab agents work together.
Do not roleplay, do not mention hidden modes, and do not invent command syntax.

Work naturally with the other lab agents:
- answer the user's prompt directly;
- build on useful points from other agents;
- challenge weak reasoning when it matters;
- converge through discussion instead of voting;
- keep responses concise enough for a terminal transcript.

For coding or repository-grounded prompts, discuss intended edits before changing code.`;

const TURN_IMPULSE_SYSTEM_PROMPT = `You are a Lab Agent's private conversational impulse in an AI Thinktank CLI.

You just heard the latest visible turn. Decide whether you want to take the floor next.
Most thoughts are not worth saying. Pass unless your contribution would clearly improve the conversation now.
Speak when you have a useful addition, correction, challenge, clarification, synthesis, or final answer.
You are not allowed to speak if you were the Lab Agent who spoke most recently.

Return exactly one JSON object and no prose:
{"action":"speak","kind":"challenge","urgency":82,"reason":"short reason"}
{"action":"finish","kind":"final","urgency":70,"reason":"short reason"}
{"action":"pass","kind":"none","urgency":0,"reason":"short reason"}

Urgency is an integer from 0 to 100.`;

function printHelp(): void {
	console.log(`${chalk.bold("thinktank")} - multi-lab CLI agent room

${chalk.bold("Usage:")}
  thinktank [prompt...]
  thinktank @prompt.md "additional instructions"

${chalk.bold("Behavior:")}
  Selects configured OpenAI, Google, and Anthropic models from Pi's local provider/auth setup.
  Prints one continuous terminal transcript with natural agent-to-agent discussion.
  Stores durable session state under ~/.ai-thinktank/sessions.

${chalk.bold("Options:")}
  --help, -h     Show this help
  --version, -v  Show version number`);
}

function readPipedStdin(): Promise<string | undefined> {
	if (process.stdin.isTTY) {
		return Promise.resolve(undefined);
	}

	return new Promise((resolveRead) => {
		let data = "";
		process.stdin.setEncoding("utf8");
		process.stdin.on("data", (chunk) => {
			data += chunk;
		});
		process.stdin.on("end", () => {
			const trimmed = data.trim();
			resolveRead(trimmed.length > 0 ? trimmed : undefined);
		});
		process.stdin.resume();
	});
}

function parseCliArgs(args: string[]): { help: boolean; version: boolean; promptParts: string[] } {
	const promptParts: string[] = [];
	let help = false;
	let version = false;

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg === "--help" || arg === "-h") {
			help = true;
		} else if (arg === "--version" || arg === "-v") {
			version = true;
		} else if (arg.startsWith("@")) {
			const path = resolve(arg.slice(1));
			const content = readFileSync(path, "utf-8");
			promptParts.push(`<file path="${path}">\n${content}\n</file>`);
		} else if (arg.startsWith("-")) {
			throw new Error(`Unknown option: ${arg}`);
		} else {
			promptParts.push(arg);
		}
	}

	return { help, version, promptParts };
}

function createSessionPaths(cwd: string): ThinktankSessionPaths {
	const cwdHash = createHash("sha256").update(resolve(cwd)).digest("hex").slice(0, 10);
	const cwdName = basename(resolve(cwd)) || "workspace";
	const sessionId = `${new Date().toISOString().replace(/[:.]/g, "-")}-${cwdName}-${cwdHash}-${randomUUID().slice(0, 8)}`;
	const dir = join(homedir(), ".ai-thinktank", "sessions", sessionId);
	mkdirSync(dir, { recursive: true, mode: 0o700 });
	return {
		dir,
		transcriptPath: join(dir, "transcript.jsonl"),
		briefPath: join(dir, "brief.md"),
	};
}

function appendTranscript(paths: ThinktankSessionPaths, entry: Record<string, unknown>): void {
	appendFileSync(
		paths.transcriptPath,
		`${JSON.stringify({ timestamp: new Date().toISOString(), ...entry })}\n`,
		"utf-8",
	);
}

function writeBrief(paths: ThinktankSessionPaths, turns: TranscriptTurn[], options: RunOptions): void {
	const lastTurns = turns
		.slice(-6)
		.map((turn) => `- ${turn.speaker}: ${turn.text.replace(/\s+/g, " ").slice(0, 320)}`);
	const brief = `# Thinktank Session Brief

Goal: ${options.prompt}

Working directory: ${options.cwd}

Recent turns:

${lastTurns.join("\n")}
`;
	writeFileSync(paths.briefPath, brief, "utf-8");
}

function getTextFromAssistantMessage(message: AssistantMessage): string {
	return message.content
		.filter((content) => content.type === "text")
		.map((content) => content.text)
		.join("")
		.trim();
}

function isReasoningLevel(level: ModelThinkingLevel): level is Exclude<ModelThinkingLevel, "off"> {
	return level !== "off";
}

async function getRequestAuth(
	modelRegistry: ModelRegistry,
	model: Model<Api>,
): Promise<{
	apiKey?: string;
	headers?: Record<string, string>;
}> {
	const auth = await modelRegistry.getApiKeyAndHeaders(model);
	if (!auth.ok) {
		throw new Error(auth.error);
	}
	return { apiKey: auth.apiKey, headers: auth.headers };
}

async function streamLabResponse(options: {
	agent: LabAgent;
	modelRegistry: ModelRegistry;
	messages: Message[];
	prompt: string;
	turns: TranscriptTurn[];
	paths: ThinktankSessionPaths;
}): Promise<string> {
	const { agent, modelRegistry, messages, prompt, turns, paths } = options;
	const auth = await getRequestAuth(modelRegistry, agent.model);

	const thinkingLevel = clampThinkingLevel(agent.model, "high");
	const context: Context = {
		systemPrompt: `${THINKTANK_SYSTEM_PROMPT}

You are the ${agent.definition.shortName} Lab Agent.
Your visible name in the room is ${agent.visibleName}.
Use your model provenance as useful context, but do not over-explain it.`,
		messages: [
			...messages,
			{
				role: "user",
				content: prompt,
				timestamp: Date.now(),
			},
		],
	};

	process.stdout.write(`\n${chalk.bold(agent.visibleName)}:\n`);
	const stream = streamSimple(agent.model, context, {
		apiKey: auth.apiKey,
		headers: auth.headers,
		reasoning: isReasoningLevel(thinkingLevel) ? thinkingLevel : undefined,
	});

	let streamedText = "";
	for await (const event of stream) {
		if (event.type === "text_delta") {
			process.stdout.write(event.delta);
			streamedText += event.delta;
		}
	}

	const result = await stream.result();
	const finalText = streamedText.trim() || getTextFromAssistantMessage(result);
	if (!streamedText.endsWith("\n")) {
		process.stdout.write("\n");
	}

	if (result.stopReason === "error" || result.stopReason === "aborted") {
		throw new Error(result.errorMessage || `${agent.visibleName} request ${result.stopReason}`);
	}

	turns.push({ speaker: agent.visibleName, text: finalText });
	appendTranscript(paths, {
		type: "agent_turn",
		speaker: agent.visibleName,
		provider: agent.model.provider,
		model: agent.model.id,
		text: finalText,
		usage: result.usage,
	});
	return finalText;
}

async function completeHiddenLabResponse(options: {
	agent: LabAgent;
	modelRegistry: ModelRegistry;
	prompt: string;
}): Promise<string> {
	const { agent, modelRegistry, prompt } = options;
	const auth = await getRequestAuth(modelRegistry, agent.model);
	const thinkingLevel = clampThinkingLevel(agent.model, "low");
	const message = await completeSimple(
		agent.model,
		{
			systemPrompt: TURN_IMPULSE_SYSTEM_PROMPT,
			messages: [
				{
					role: "user",
					content: prompt,
					timestamp: Date.now(),
				},
			],
		},
		{
			apiKey: auth.apiKey,
			headers: auth.headers,
			reasoning: isReasoningLevel(thinkingLevel) ? thinkingLevel : undefined,
		},
	);

	if (message.stopReason === "error" || message.stopReason === "aborted") {
		throw new Error(message.errorMessage || `${agent.visibleName} selector request ${message.stopReason}`);
	}

	return getTextFromAssistantMessage(message);
}

function transcriptText(turns: TranscriptTurn[]): string {
	return turns.map((turn) => `${turn.speaker}:\n${turn.text}`).join("\n\n");
}

function selectExactModel(availableModels: Model<Api>[], provider: string, modelIds: string[]): Model<Api> | undefined {
	for (const modelId of modelIds) {
		const match = availableModels.find((model) => model.provider === provider && model.id === modelId);
		if (match) {
			return match;
		}
	}
	return undefined;
}

function selectFuzzyModel(
	availableModels: Model<Api>[],
	provider: string,
	modelIdNeedles: string[],
): Model<Api> | undefined {
	const providerModels = availableModels.filter((model) => model.provider === provider);
	for (const needle of modelIdNeedles) {
		const lowerNeedle = needle.toLowerCase();
		const match = providerModels.find(
			(model) => model.id.toLowerCase().includes(lowerNeedle) || model.name?.toLowerCase().includes(lowerNeedle),
		);
		if (match) {
			return match;
		}
	}
	return providerModels[0];
}

function getVisibleName(definition: LabDefinition, model: Model<Api>): string {
	const modelLabel = model.name ?? model.id;
	if (definition.displayModelIds.includes(model.id)) {
		return definition.displayName;
	}
	return `${definition.shortName} (${modelLabel})`;
}

function selectLabAgent(definition: LabDefinition, availableModels: Model<Api>[]): LabAgent | undefined {
	for (const provider of definition.providerCandidates) {
		const exact = selectExactModel(availableModels, provider, definition.preferredModelIds);
		if (exact) {
			return { definition, model: exact, visibleName: getVisibleName(definition, exact) };
		}
	}

	for (const provider of definition.providerCandidates) {
		const fuzzy = selectFuzzyModel(availableModels, provider, definition.modelIdNeedles);
		if (fuzzy) {
			return { definition, model: fuzzy, visibleName: getVisibleName(definition, fuzzy) };
		}
	}

	return undefined;
}

function selectRoster(modelRegistry: ModelRegistry): { agents: LabAgent[]; missingLabs: LabDefinition[] } {
	const availableModels = modelRegistry.getAvailable();
	const agents: LabAgent[] = [];
	const missingLabs: LabDefinition[] = [];

	for (const definition of LAB_DEFINITIONS) {
		const agent = selectLabAgent(definition, availableModels);
		if (agent) {
			agents.push(agent);
		} else {
			missingLabs.push(definition);
		}
	}

	return { agents, missingLabs };
}

function formatModelReference(agent: LabAgent): string {
	return `${agent.visibleName} (${agent.model.provider}/${agent.model.id})`;
}

function parseTurnImpulse(text: string): TurnImpulse | undefined {
	const trimmed = text.trim();
	const jsonText = trimmed.startsWith("{") ? trimmed : trimmed.match(/\{[\s\S]*\}/)?.[0];
	if (!jsonText) {
		return undefined;
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(jsonText);
	} catch {
		return undefined;
	}

	if (typeof parsed !== "object" || parsed === null) {
		return undefined;
	}
	const record = parsed as Record<string, unknown>;
	const action = record.action;
	const kind = record.kind;
	const urgency = record.urgency;
	if ((action !== "speak" && action !== "finish" && action !== "pass") || typeof kind !== "string") {
		return undefined;
	}

	if (!["add", "challenge", "clarify", "synthesize", "final", "none"].includes(kind)) {
		return undefined;
	}

	const parsedUrgency = typeof urgency === "number" ? urgency : Number.parseInt(String(urgency ?? "0"), 10);
	const normalizedUrgency = Number.isFinite(parsedUrgency) ? Math.max(0, Math.min(100, parsedUrgency)) : 0;

	return {
		action,
		kind: kind as TurnImpulseKind,
		urgency: normalizedUrgency,
		reason: typeof record.reason === "string" ? record.reason : undefined,
	};
}

function getLastSpeakerId(agents: LabAgent[], turns: TranscriptTurn[]): LabId | undefined {
	const lastSpeaker = turns[turns.length - 1]?.speaker;
	return agents.find((agent) => agent.visibleName === lastSpeaker)?.definition.id;
}

function fallbackNextSpeaker(agents: LabAgent[], turns: TranscriptTurn[]): LabAgent {
	const speakerCounts = new Map<string, number>();
	for (const agent of agents) {
		speakerCounts.set(agent.visibleName, 0);
	}
	for (const turn of turns) {
		speakerCounts.set(turn.speaker, (speakerCounts.get(turn.speaker) ?? 0) + 1);
	}
	const lastSpeaker = turns[turns.length - 1]?.speaker;
	const candidates = agents.length > 1 ? agents.filter((agent) => agent.visibleName !== lastSpeaker) : agents;
	const sortedCandidates = candidates.sort(
		(a, b) => (speakerCounts.get(a.visibleName) ?? 0) - (speakerCounts.get(b.visibleName) ?? 0),
	);
	return sortedCandidates[0] ?? agents[0];
}

async function getTurnImpulse(options: {
	agent: LabAgent;
	modelRegistry: ModelRegistry;
	userPrompt: string;
	turns: TranscriptTurn[];
	lastSpeakerId: LabId | undefined;
}): Promise<TurnImpulse> {
	const { agent, modelRegistry, userPrompt, turns, lastSpeakerId } = options;
	const rawImpulse = await completeHiddenLabResponse({
		agent,
		modelRegistry,
		prompt: `Human prompt:

${userPrompt}

Your identity:
${agent.definition.id}: ${agent.visibleName}

Most recent speaker:
${lastSpeakerId ?? "none"}

Transcript so far:

${transcriptText(turns)}

Decide whether you want to take the next visible turn. Pass unless you have something worth adding right now.`,
	});
	return parseTurnImpulse(rawImpulse) ?? { action: "pass", kind: "none", urgency: 0 };
}

async function collectTurnImpulses(options: {
	agents: LabAgent[];
	modelRegistry: ModelRegistry;
	userPrompt: string;
	turns: TranscriptTurn[];
}): Promise<RankedTurnImpulse[]> {
	const { agents, modelRegistry, userPrompt, turns } = options;
	const lastSpeakerId = getLastSpeakerId(agents, turns);
	const eligibleAgents = agents.length > 1 ? agents.filter((agent) => agent.definition.id !== lastSpeakerId) : agents;
	const impulsePromises = eligibleAgents.map(async (agent): Promise<RankedTurnImpulse> => {
		try {
			return {
				agent,
				impulse: await getTurnImpulse({
					agent,
					modelRegistry,
					userPrompt,
					turns,
					lastSpeakerId,
				}),
			};
		} catch (error) {
			return {
				agent,
				impulse: {
					action: "pass",
					kind: "none",
					urgency: 0,
					reason: error instanceof Error ? error.message : String(error),
				},
			};
		}
	});
	return Promise.all(impulsePromises);
}

async function chooseNextTurn(options: {
	agents: LabAgent[];
	modelRegistry: ModelRegistry;
	userPrompt: string;
	turns: TranscriptTurn[];
}): Promise<{ action: "speak"; agent: LabAgent; kind: TurnImpulseKind } | { action: "finish"; agent: LabAgent }> {
	const { agents, modelRegistry, userPrompt, turns } = options;
	const impulses = await collectTurnImpulses({ agents, modelRegistry, userPrompt, turns });
	const speakingImpulses = impulses
		.filter((entry) => entry.impulse.action === "speak" || entry.impulse.action === "finish")
		.sort((a, b) => b.impulse.urgency - a.impulse.urgency);

	const strongest = speakingImpulses[0];
	if (!strongest) {
		return { action: "speak", agent: fallbackNextSpeaker(agents, turns), kind: "synthesize" };
	}

	if (strongest.impulse.action === "finish") {
		return { action: "finish", agent: strongest.agent };
	}

	return { action: "speak", agent: strongest.agent, kind: strongest.impulse.kind };
}

function buildInitialPrompt(userPrompt: string): string {
	return `The human participant asked:

${userPrompt}

Give your first contribution to the room. Answer directly, surface the most important considerations, and leave openings for the other Lab Agents to build on or challenge.`;
}

function buildDiscussionPrompt(userPrompt: string, turns: TranscriptTurn[]): string {
	return `The human participant asked:

${userPrompt}

The room transcript so far:

${transcriptText(turns)}

Continue the discussion naturally. Build on the strongest points, challenge anything weak or missing, and move the room toward a useful shared answer.`;
}

function buildClosingPrompt(userPrompt: string, turns: TranscriptTurn[]): string {
	return `The human participant asked:

${userPrompt}

The room transcript so far:

${transcriptText(turns)}

State the room's current answer in a concise final contribution. Preserve important uncertainty and scenarios where useful.`;
}

async function runThinktank(options: RunOptions): Promise<number> {
	const authStorage = AuthStorage.create(join(getAgentDir(), "auth.json"));
	const modelRegistry = ModelRegistry.create(authStorage, join(getAgentDir(), "models.json"));
	const { agents, missingLabs } = selectRoster(modelRegistry);

	if (agents.length === 0) {
		console.error(chalk.red("No configured OpenAI, Google, or Anthropic models found in Pi's local auth setup."));
		console.error(chalk.dim(`Pi agent directory: ${getAgentDir()}`));
		console.error(chalk.dim("Use pi login/configuration first, then run thinktank again."));
		return 1;
	}

	const paths = createSessionPaths(options.cwd);
	const turns: TranscriptTurn[] = [];
	const messages: Message[] = [];

	console.log(chalk.bold(`ai-thinktank  ${options.cwd}`));
	console.log(`agents: ${agents.map(formatModelReference).join(" · ")}`);
	if (missingLabs.length > 0) {
		console.log(chalk.dim(`missing: ${missingLabs.map((lab) => lab.shortName).join(", ")} not configured`));
	}
	console.log(chalk.dim(`session: ${paths.dir}`));
	console.log(`\n${chalk.bold("You:")}\n${options.prompt}`);

	appendTranscript(paths, {
		type: "session_start",
		cwd: options.cwd,
		prompt: options.prompt,
		agents: agents.map((agent) => ({
			name: agent.definition.displayName,
			visibleName: agent.visibleName,
			lab: agent.definition.shortName,
			provider: agent.model.provider,
			model: agent.model.id,
		})),
	});

	for (const agent of agents) {
		await streamLabResponse({
			agent,
			modelRegistry,
			messages,
			prompt: buildInitialPrompt(options.prompt),
			turns,
			paths,
		});
		writeBrief(paths, turns, options);
	}

	let finalAgent = agents[0];
	for (let dynamicTurnsCompleted = 0; dynamicTurnsCompleted < MAX_DYNAMIC_DISCUSSION_TURNS; dynamicTurnsCompleted++) {
		const next = await chooseNextTurn({
			agents,
			modelRegistry,
			userPrompt: options.prompt,
			turns,
		});

		if (next.action === "finish") {
			finalAgent = next.agent;
			break;
		}

		await streamLabResponse({
			agent: next.agent,
			modelRegistry,
			messages,
			prompt:
				next.kind === "final"
					? buildClosingPrompt(options.prompt, turns)
					: buildDiscussionPrompt(options.prompt, turns),
			turns,
			paths,
		});
		writeBrief(paths, turns, options);
		finalAgent = next.agent;
		if (next.kind === "final") {
			return 0;
		}
	}

	await streamLabResponse({
		agent: finalAgent,
		modelRegistry,
		messages,
		prompt: buildClosingPrompt(options.prompt, turns),
		turns,
		paths,
	});
	writeBrief(paths, turns, options);

	return 0;
}

export async function runThinktankCli(args: string[]): Promise<number> {
	const parsed = parseCliArgs(args);
	if (parsed.help) {
		printHelp();
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
	if (!prompt) {
		printHelp();
		return 1;
	}

	return runThinktank({
		prompt,
		cwd: process.cwd(),
	});
}
