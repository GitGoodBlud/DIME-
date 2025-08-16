import type { ProviderAdapter } from "./types";
import { manualAdapter } from "./manual";

const adapters: Record<string, ProviderAdapter> = {
	MANUAL: manualAdapter,
};

export function getAdapter(broker: string): ProviderAdapter {
	return adapters[broker] ?? manualAdapter;
}