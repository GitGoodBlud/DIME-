import type { Account, Trade } from "@/types/broker";

export type WeeklyAggregate = {
	weekLabel: string;
	totals: {
		premiumCollected: number;
		realizedPL: number;
		winRatePct: number;
		avgYieldPct: number;
		rocPct: number;
		wowChangePct: number;
		contractsExpiring: number;
		tradesClosed: number;
	};
	accounts: AccountWeekly[];
	topTickers: { ticker: string; realizedPL: number; rocPct: number; collectionRatePct: number }[];
	strategyBreakdown: { strategy: string; realizedPL: number; premium: number; rocPct: number }[];
	closeMethodBreakdown: { method: string; count: number }[];
};

export type AccountWeekly = {
	account: Account;
	premiumCollected: number;
	realizedPL: number;
	capitalUtilization: number; // 0..1
	trades: Trade[];
};

export function groupBy<T, K extends string | number>(rows: T[], key: (r: T) => K): Record<K, T[]> {
	return rows.reduce((acc, r) => {
		const k = key(r);
		(acc[k] ||= []).push(r);
		return acc;
	}, {} as Record<K, T[]>);
}

export function computeWeekly(
	params: {
		accounts: Account[];
		trades: Trade[];
		capitalByAccount?: Record<string, { capitalDeployed: number; buyingPower: number }>;
		prevWeek?: { trades: Trade[] };
		weekLabel: string;
	}
): WeeklyAggregate {
	const { accounts, trades, capitalByAccount = {}, prevWeek, weekLabel } = params;
	const byAccount = groupBy(trades, (t) => t.accountId);

	const accountsOut: AccountWeekly[] = accounts.map((a) => {
		const rows = byAccount[a.id] || [];
		const premiumCollected = rows.reduce((s, r) => s + (r.premium || 0), 0);
		const realizedPL = rows.reduce((s, r) => s + (r.realizedPL || 0), 0);
		const cap = capitalByAccount[a.id] || { capitalDeployed: 1, buyingPower: 0 };
		const capitalUtilization = cap.capitalDeployed / Math.max(cap.capitalDeployed + cap.buyingPower, 1);
		return { account: a, premiumCollected, realizedPL, capitalUtilization, trades: rows };
	});

	const totalPremium = accountsOut.reduce((s, a) => s + a.premiumCollected, 0);
	const totalPL = accountsOut.reduce((s, a) => s + a.realizedPL, 0);

	const wins = trades.filter((t) => (t.realizedPL || 0) > 0).length;
	const winRatePct = trades.length ? (wins / trades.length) * 100 : 0;
	const avgYieldPct = trades.length ? (trades.reduce((s, t) => s + (t.yieldPct || 0), 0) / trades.length) : 0;
	const rocPct = trades.length ? (trades.reduce((s, t) => s + (t.rocPct || 0), 0) / trades.length) : 0;

	let wowChangePct = 0;
	if (prevWeek) {
		const prevPL = prevWeek.trades.reduce((s, t) => s + (t.realizedPL || 0), 0);
		if (Math.abs(prevPL) > 0.0001) {
			wowChangePct = ((totalPL - prevPL) / Math.abs(prevPL)) * 100;
		} else if (totalPL !== 0) {
			wowChangePct = 100;
		}
	}

	const expiring = trades.filter((t) => t.type === "OPTION").length; // placeholder; would check expiration in range
	const tradesClosed = trades.length;

	const byTicker = groupBy(trades, (t) => t.ticker);
	const topTickers = Object.entries(byTicker)
		.map(([ticker, rows]) => {
			const realizedPL = rows.reduce((s, r) => s + (r.realizedPL || 0), 0);
			const rocPct = rows.length ? rows.reduce((s, r) => s + (r.rocPct || 0), 0) / rows.length : 0;
			const premium = rows.reduce((s, r) => s + (r.premium || 0), 0);
			const collectionRatePct = rows.length ? premium / rows.length : 0;
			return { ticker, realizedPL, rocPct, collectionRatePct };
		})
		.sort((a, b) => Math.abs(b.realizedPL) - Math.abs(a.realizedPL))
		.slice(0, 5);

	const byStrategy = groupBy(trades, (t) => t.strategy);
	const strategyBreakdown = Object.entries(byStrategy).map(([strategy, rows]) => ({
		strategy,
		realizedPL: rows.reduce((s, r) => s + (r.realizedPL || 0), 0),
		premium: rows.reduce((s, r) => s + (r.premium || 0), 0),
		rocPct: rows.length ? rows.reduce((s, r) => s + (r.rocPct || 0), 0) / rows.length : 0,
	}));

	const byClose = groupBy(trades, (t) => t.closeMethod || "Other");
	const closeMethodBreakdown = Object.entries(byClose).map(([method, rows]) => ({ method, count: rows.length }));

	return {
		weekLabel,
		totals: {
			premiumCollected: totalPremium,
			realizedPL: totalPL,
			winRatePct,
			avgYieldPct,
			rocPct,
			wowChangePct,
			contractsExpiring: expiring,
			tradesClosed,
		},
		accounts: accountsOut,
		topTickers,
		strategyBreakdown,
		closeMethodBreakdown,
	};
}