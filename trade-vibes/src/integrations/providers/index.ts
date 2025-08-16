import type { ProviderAdapter } from "./types";
import { manualAdapter } from "./manual";

import { robinhoodAdapter } from "./robinhood";

const adapters: Record<string, ProviderAdapter> = {
	MANUAL: manualAdapter,
	ROBINHOOD: robinhoodAdapter,
};

export function getAdapter(broker: string): ProviderAdapter {
	return adapters[broker] ?? manualAdapter;
}