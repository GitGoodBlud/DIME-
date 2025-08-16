import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import type { AccountType } from "@/generated/prisma";

type MinimalTrade = { id: string };

type AccountWeekly = {
	account: { id: string; name: string; type: AccountType };
	premiumCollected: number;
	realizedPL: number;
	capitalUtilization: number;
	trades: MinimalTrade[];
};

export async function GET(req: NextRequest) {
	const from = req.nextUrl.searchParams.get("from");
	const to = req.nextUrl.searchParams.get("to");
	if (!from || !to) return NextResponse.json({ error: "from and to required" }, { status: 400 });
	const fromDate = startOfDay(new Date(from));
	const toDate = endOfDay(new Date(to));

	const portfolios = await prisma.portfolio.findMany({ include: { account: true } });

	const transactions = await prisma.transaction.findMany({ where: { occurredAt: { gte: fromDate, lte: toDate } } });

	// Build latest snapshot per portfolio id
	const portfolioIdToSnapshot: Record<string, { cash: number; totalEquity: number }> = {};
	for (const p of portfolios) {
		const s = await prisma.snapshot.findFirst({ where: { portfolioId: p.id }, orderBy: { asOf: "desc" } });
		if (s) {
			portfolioIdToSnapshot[p.id] = { cash: Number(s.cash), totalEquity: Number(s.totalEquity) };
		}
	}

	function isOption(side: string) { return side === "SELL_TO_OPEN" || side === "BUY_TO_CLOSE"; }
	const byAccountType: Record<string, { premium: number; pl: number; trades: number; wins: number; yields: number[]; rocs: number[]; utilization: number[] }> = {};
	const accountWeekly: AccountWeekly[] = [];

	const byPortfolio: Record<string, typeof transactions> = {};
	for (const t of transactions) {
		(byPortfolio[t.portfolioId] ||= []).push(t);
	}

	for (const p of portfolios) {
		const txs = byPortfolio[p.id] || [];
		let premium = 0;
		let pl = 0;
		let trades = 0;
		let wins = 0;
		const yields: number[] = [];
		const rocs: number[] = [];
		for (const t of txs) {
			const qty = Number(t.quantity);
			const notion = qty * Number(t.price) * (t.assetType === "OPTION" ? Number(t.multiplier || 100) : 1);
			if (t.side === "SELL_TO_OPEN") premium += notion - Number(t.fees || 0);
			if (t.side === "BUY_TO_CLOSE") premium -= notion + Number(t.fees || 0);
			if (t.side === "SELL") pl += notion - Number(t.fees || 0);
			if (t.side === "BUY") pl -= notion + Number(t.fees || 0);
			if (t.side === "BUY_TO_CLOSE" || t.side === "SELL") {
				trades += 1;
				if (notion > 0) wins += 1;
				yields.push(0);
				rocs.push(0);
			}
		}
		const snap = portfolioIdToSnapshot[p.id];
		const capDeploy = snap ? snap.totalEquity - snap.cash : 1;
		const utilization = snap ? capDeploy / Math.max(snap.totalEquity, 1) : 0;

		accountWeekly.push({
			account: { id: p.account.id, name: p.account.name, type: p.account.accountType },
			premiumCollected: premium,
			realizedPL: pl,
			capitalUtilization: utilization,
			trades: [],
		});

		const key = p.account.accountType;
		(byAccountType[key] ||= { premium: 0, pl: 0, trades: 0, wins: 0, yields: [], rocs: [], utilization: [] });
		byAccountType[key].premium += premium;
		byAccountType[key].pl += pl;
		byAccountType[key].trades += trades;
		byAccountType[key].wins += wins;
		byAccountType[key].yields.push(...yields);
		byAccountType[key].rocs.push(...rocs);
		byAccountType[key].utilization.push(utilization);
	}

	const totalPremium = Object.values(byAccountType).reduce((s, r) => s + r.premium, 0);
	const totalPL = Object.values(byAccountType).reduce((s, r) => s + r.pl, 0);
	const totalTrades = Object.values(byAccountType).reduce((s, r) => s + r.trades, 0);
	const totalWins = Object.values(byAccountType).reduce((s, r) => s + r.wins, 0);
	const winRatePct = totalTrades ? (totalWins / totalTrades) * 100 : 0;
	const avgYieldPct = 0;
	const rocPct = 0;
	const wowChangePct = 0;
	const contractsExpiring = transactions.filter(t => isOption(t.side)).length;
	const tradesClosed = totalTrades;

	return NextResponse.json({
		weekLabel: `${from} – ${to}`,
		totals: { premiumCollected: totalPremium, realizedPL: totalPL, winRatePct, avgYieldPct, rocPct, wowChangePct, contractsExpiring, tradesClosed },
		accounts: accountWeekly,
		topTickers: [],
		strategyBreakdown: [],
		closeMethodBreakdown: [],
	});
}