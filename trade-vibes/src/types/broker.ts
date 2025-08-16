export type AccountType = "Margin" | "Traditional" | "Roth" | "Other";

export type Account = {
	id: string;
	name: string;
	type: AccountType;
};

export type TradeSide = "SELL_TO_OPEN" | "BUY_TO_CLOSE" | "ASSIGNMENT" | "EXERCISE" | "EXPIRATION" | "SELL" | "BUY";
export type Strategy = "CSP" | "CC" | "Shares" | "Other";
export type CloseMethod = "Called Away" | "Expired Worthless" | "Assigned" | "Bought Back" | "Closed Shares" | "Other";

export type Trade = {
	id: string;
	accountId: string;
	ticker: string;
	underlying?: string;
	type: "OPTION" | "EQUITY";
	strategy: Strategy;
	side: TradeSide;
	contracts: number; // positive numbers
	contractPrice?: number; // per contract price when opened or closed
	premium: number; // positive for collected, negative for paid
	yieldPct?: number;
	rocPct?: number;
	strike?: number;
	expiration?: string; // ISO date
	openedAt?: string;
	closedAt?: string;
	closeMethod?: CloseMethod;
	realizedPL?: number; // positive profit, negative loss
};

export interface BrokerAdapter {
	fetchAccounts(): Promise<Account[]>;
	fetchClosedTrades(params: { from: string; to: string }): Promise<Trade[]>;
	fetchDailySnapshots?(params: { from: string; to: string; accountId: string }): Promise<{ date: string; capitalDeployed: number; buyingPower: number }[]>;
}