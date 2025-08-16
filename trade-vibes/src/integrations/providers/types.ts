export type SyncResult = {
	transactions: Array<{
		occurredAt: Date;
		symbol: string;
		assetType: "EQUITY" | "OPTION" | "CASH" | "OTHER";
		side: "BUY" | "SELL" | "SELL_TO_OPEN" | "BUY_TO_CLOSE" | "ASSIGNMENT" | "EXERCISE" | "EXPIRATION" | "DIVIDEND" | "INTEREST" | "TRANSFER";
		quantity: number;
		price: number;
		fees?: number;
		underlyingSymbol?: string;
		expirationDate?: Date;
		strike?: number;
		optionType?: "CALL" | "PUT";
		multiplier?: number;
		orderId?: string;
		notes?: string;
	}>;
	snapshot?: {
		asOf: Date;
		cash: number;
		marketValue: number;
		totalEquity: number;
	};
};

export type ProviderAdapter = {
	provider: string;
	syncAccount(input: { accountId: string; credential?: Record<string, string> }): Promise<SyncResult>;
};