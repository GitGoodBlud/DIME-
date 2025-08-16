import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfWeek, endOfWeek } from "date-fns";
import type { Transaction, Snapshot } from "@/generated/prisma";

type Tx = Pick<Transaction, "occurredAt" | "assetType" | "side" | "quantity" | "price" | "fees" | "multiplier">;

function computeRealizedPnlForPeriod(transactions: Tx[], start: Date, end: Date) {
	let realized = 0;
	for (const t of transactions) {
		if (t.occurredAt < start || t.occurredAt > end) continue;
		const qty = Number(t.quantity);
		const price = Number(t.price);
		const fees = Number(t.fees);
		const multiplier = t.assetType === "OPTION" ? Number(t.multiplier ?? 100) : 1;
		const notion = qty * price * multiplier;
		switch (t.side) {
			case "SELL":
				realized += notion - fees;
				break;
			case "BUY":
				realized -= notion + fees;
				break;
			case "SELL_TO_OPEN":
				realized += notion - fees;
				break;
			case "BUY_TO_CLOSE":
				realized -= notion + fees;
				break;
			case "DIVIDEND":
				realized += price;
				break;
			case "INTEREST":
				realized += price;
				break;
			case "ASSIGNMENT":
			case "EXERCISE":
			case "EXPIRATION":
				break;
			default:
				break;
		}
	}
	return realized;
}

export async function GET(req: NextRequest) {
	const portfolioId = req.nextUrl.searchParams.get("portfolioId");
	const accountId = req.nextUrl.searchParams.get("accountId");
	if (!portfolioId && !accountId) {
		return NextResponse.json({ error: "portfolioId or accountId is required" }, { status: 400 });
	}

	let portfolioIds: string[] = [];
	if (portfolioId) {
		portfolioIds = [portfolioId];
	} else if (accountId) {
		const portfolios = await prisma.portfolio.findMany({ where: { accountId }, select: { id: true } });
		portfolioIds = portfolios.map((p) => p.id);
	}

	const [transactions, latestSnapshots] = await Promise.all([
		prisma.transaction.findMany({ where: { portfolioId: { in: portfolioIds } } }) as Promise<Tx[]>,
		Promise.all(
			portfolioIds.map(async (pid) => {
				const snap = (await prisma.snapshot.findFirst({ where: { portfolioId: pid }, orderBy: { asOf: "desc" } })) as Snapshot | null;
				return { portfolioId: pid, snapshot: snap } as { portfolioId: string; snapshot: Snapshot | null };
			})
		),
	]);

	const now = new Date();
	const weekStart = startOfWeek(now, { weekStartsOn: 1 });
	const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
	const weeklyRealized = computeRealizedPnlForPeriod(transactions, weekStart, weekEnd);

	let totalEquity = 0;
	let cash = 0;
	for (const { snapshot } of latestSnapshots) {
		if (!snapshot) continue;
		totalEquity += Number(snapshot.totalEquity);
		cash += Number(snapshot.cash);
	}

	const capitalDeployed = Math.max(totalEquity - cash, 1);
	const weeklyRoc = weeklyRealized / capitalDeployed;

	const perPortfolio = await Promise.all(
		portfolioIds.map(async (pid) => {
			const startSnap = (await prisma.snapshot.findFirst({
				where: { portfolioId: pid, asOf: { lte: weekStart } },
				orderBy: { asOf: "desc" },
			})) as Snapshot | null;
			const endSnap = (await prisma.snapshot.findFirst({
				where: { portfolioId: pid, asOf: { lte: weekEnd } },
				orderBy: { asOf: "desc" },
			})) as Snapshot | null;
			let pct: number | null = null;
			if (startSnap && endSnap && Number(startSnap.totalEquity) > 0) {
				pct = (Number(endSnap.totalEquity) - Number(startSnap.totalEquity)) / Number(startSnap.totalEquity);
			}
			return { portfolioId: pid, weeklyPct: pct };
		})
	);

	return NextResponse.json({
		portfolioIds,
		weekly: {
			realizedPnl: weeklyRealized,
			roc: weeklyRoc,
			start: weekStart,
			end: weekEnd,
			perPortfolio,
		},
		totals: {
			totalEquity,
			cash,
			capitalDeployed,
		},
	});
}