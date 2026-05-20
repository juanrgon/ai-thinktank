import { getModel } from "@earendil-works/pi-ai";
import { describe, expect, it } from "vitest";
import { SettingsManager } from "../src/core/settings-manager.ts";
import {
	selectThinktankRosterEntry,
	THINKTANK_LAB_DEFINITIONS,
	type ThinktankLabDefinition,
} from "../src/thinktank/roster.ts";

function lab(id: ThinktankLabDefinition["id"]): ThinktankLabDefinition {
	const definition = THINKTANK_LAB_DEFINITIONS.find((candidate) => candidate.id === id);
	if (!definition) {
		throw new Error(`Missing lab definition: ${id}`);
	}
	return definition;
}

describe("thinktank roster", () => {
	it("clamps saved effort to the selected model capabilities", () => {
		const model = getModel("github-copilot", "claude-opus-4.7");
		const entry = selectThinktankRosterEntry([model], lab("anthropic"), {
			provider: "github-copilot",
			model: "claude-opus-4.7",
			thinkingLevel: "high",
		});

		expect(entry?.model).toBe(model);
		expect(entry?.thinkingLevel).toBe("medium");
	});

	it("persists roster model and effort selections in settings", async () => {
		const settings = SettingsManager.inMemory();
		settings.setThinktankRosterSelections({
			anthropic: {
				provider: "github-copilot",
				model: "claude-opus-4.7",
				thinkingLevel: "medium",
			},
		});
		await settings.flush();

		expect(settings.getThinktankRosterSelections()).toEqual({
			anthropic: {
				provider: "github-copilot",
				model: "claude-opus-4.7",
				thinkingLevel: "medium",
			},
		});
	});
});
