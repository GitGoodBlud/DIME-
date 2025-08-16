import type { ProviderAdapter, SyncResult } from "./types";

export const manualAdapter: ProviderAdapter = {
	provider: "MANUAL",
	async syncAccount(): Promise<SyncResult> {
		return { transactions: [], snapshot: undefined };
	},
};