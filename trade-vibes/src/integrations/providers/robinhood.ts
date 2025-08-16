import type { ProviderAdapter, SyncResult } from "./types";

export const robinhoodAdapter: ProviderAdapter = {
	provider: "ROBINHOOD",
	async syncAccount(): Promise<SyncResult> {
		// Robinhood equity API is not officially available; use external webhook sync.
		return { transactions: [], snapshot: undefined };
	},
};