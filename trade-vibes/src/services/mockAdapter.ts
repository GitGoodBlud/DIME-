import type { Account, BrokerAdapter, Trade } from "@/types/broker";

function iso(d: Date) { return d.toISOString(); }

export const mockAdapter: BrokerAdapter = {
	async fetchAccounts(): Promise<Account[]> {
		return [
			{ id: "acct-margin", name: "RH Margin", type: "Margin" },
			{ id: "acct-roth", name: "RH Roth", type: "Roth" },
			{ id: "acct-trad", name: "RH Traditional", type: "Traditional" },
		];
	},
	async fetchClosedTrades(params: { from: string; to: string }): Promise<Trade[]> {
		const from = new Date(params.from);
		const to = new Date(params.to);
		const mid = new Date((from.getTime() + to.getTime()) / 2);
		return [
			{
				id: "t1",
				accountId: "acct-margin",
				ticker: "AAPL",
				type: "OPTION",
				strategy: "CC",
				side: "BUY_TO_CLOSE",
				contracts: 1,
				contractPrice: 0.35,
				premium: 65,
				yieldPct: 0.8,
				rocPct: 0.5,
				strike: 200,
				expiration: iso(to),
				openedAt: iso(from),
				closedAt: iso(mid),
				closeMethod: "Bought Back",
				realizedPL: 40,
			},
			{
				id: "t2",
				accountId: "acct-roth",
				ticker: "TSLA",
				type: "OPTION",
				strategy: "CSP",
				side: "SELL_TO_OPEN",
				contracts: 1,
				contractPrice: 1.10,
				premium: 110,
				yieldPct: 1.2,
				rocPct: 0.9,
				strike: 180,
				expiration: iso(to),
				openedAt: iso(from),
				closedAt: iso(to),
				closeMethod: "Expired Worthless",
				realizedPL: 110,
			},
			{
				id: "t3",
				accountId: "acct-trad",
				ticker: "MSFT",
				type: "EQUITY",
				strategy: "Shares",
				side: "SELL",
				contracts: 100,
				contractPrice: 410,
				premium: 0,
				yieldPct: 0.0,
				rocPct: 0.3,
				openedAt: iso(from),
				closedAt: iso(mid),
				closeMethod: "Closed Shares",
				realizedPL: 250,
			},
		];
	},
	async fetchDailySnapshots() {
		return [
			{ date: iso(new Date()), capitalDeployed: 12000, buyingPower: 8000 },
		];
	},
};