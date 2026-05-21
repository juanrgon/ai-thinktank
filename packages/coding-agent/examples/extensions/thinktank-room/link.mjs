#!/usr/bin/env node
import { existsSync, mkdirSync, rmSync, symlinkSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sourceDir = dirname(fileURLToPath(import.meta.url));
const targetDir = resolve(homedir(), ".pi", "agent", "extensions", "thinktank-room");

mkdirSync(dirname(targetDir), { recursive: true });

if (existsSync(targetDir)) {
	rmSync(targetDir, { force: true, recursive: true });
}

symlinkSync(sourceDir, targetDir, "dir");
console.log(`Linked ${sourceDir} -> ${targetDir}`);
console.log("Run /reload in pi, or start pi again, to load the Thinktank room extension.");
