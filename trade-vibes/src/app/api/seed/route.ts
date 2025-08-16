import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
	let account = await prisma.account.findFirst({ where: { name: "Demo Account" } });
	if (!account) {
		account = await prisma.account.create({
			data: { name: "Demo Account", broker: "MANUAL", connectionType: "MANUAL" },
		});
	}
	let portfolio = await prisma.portfolio.findFirst({ where: { accountId: account.id } });
	if (!portfolio) {
		portfolio = await prisma.portfolio.create({ data: { accountId: account.id, name: "Main", baseCurrency: "USD" } });
	}
	const now = new Date();
	const count = await prisma.transaction.count({ where: { portfolioId: portfolio.id } });
	if (count === 0) {
		await prisma.transaction.createMany({
			data: [
				{ portfolioId: portfolio.id, occurredAt: new Date(now.getTime() - 6*24*3600*1000), symbol: "AAPL", assetType: "EQUITY", side: "BUY", quantity: 10, price: 190, fees: 1 },
				{ portfolioId: portfolio.id, occurredAt: new Date(now.getTime() - 3*24*3600*1000), symbol: "AAPL", assetType: "EQUITY", side: "SELL", quantity: 10, price: 195, fees: 1 },
				{ portfolioId: portfolio.id, occurredAt: new Date(now.getTime() - 2*24*3600*1000), symbol: "SPY 2025-09-20 500C", assetType: "OPTION", side: "SELL_TO_OPEN", quantity: 1, price: 2.5, fees: 0.65, underlyingSymbol: "SPY", optionType: "CALL", strike: 500, expirationDate: new Date(now.getTime() + 30*24*3600*1000), multiplier: 100 },
				{ portfolioId: portfolio.id, occurredAt: new Date(now.getTime() - 1*24*3600*1000), symbol: "SPY 2025-09-20 500C", assetType: "OPTION", side: "BUY_TO_CLOSE", quantity: 1, price: 1.1, fees: 0.65, underlyingSymbol: "SPY", optionType: "CALL", strike: 500, expirationDate: new Date(now.getTime() + 30*24*3600*1000), multiplier: 100 },
			],
		});
	}
	const snap = await prisma.snapshot.findFirst({ where: { portfolioId: portfolio.id } });
	if (!snap) {
		await prisma.snapshot.create({ data: { portfolioId: portfolio.id, asOf: now, cash: 5000, marketValue: 25000, totalEquity: 30000 } });
	}
	return NextResponse.json({ accountId: account.id, portfolioId: portfolio.id });
}