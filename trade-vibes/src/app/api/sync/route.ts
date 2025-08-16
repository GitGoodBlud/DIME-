import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptJson } from "@/lib/crypto";
import { getAdapter } from "@/integrations/providers";
import type { AssetType, TransactionSide, OptionType } from "@/generated/prisma";

export async function POST(req: NextRequest) {
	const { accountId } = await req.json();
	if (!accountId) return NextResponse.json({ error: "accountId required" }, { status: 400 });
	const account = await prisma.account.findUnique({ where: { id: accountId }, include: { credential: true, portfolios: true } });
	if (!account) return NextResponse.json({ error: "account not found" }, { status: 404 });

	let credential: Record<string, string> | undefined;
	if (account.credential) {
		try {
			credential = await decryptJson<Record<string, string>>(account.credential.encryptedData);
		} catch {
			return NextResponse.json({ error: "failed to decrypt credential" }, { status: 500 });
		}
	}

	const adapter = getAdapter(account.broker);
	const result = await adapter.syncAccount({ accountId: account.id, credential });

	const portfolio = account.portfolios[0] ?? (await prisma.portfolio.create({ data: { accountId: account.id, name: "Default", baseCurrency: "USD" } }));

	if (result.transactions.length) {
		await prisma.$transaction(
			result.transactions.map((t) =>
				prisma.transaction.create({
					data: {
						portfolioId: portfolio.id,
						occurredAt: new Date(t.occurredAt),
						symbol: t.symbol,
						assetType: t.assetType as AssetType,
						side: t.side as TransactionSide,
						quantity: t.quantity,
						price: t.price,
						fees: t.fees ?? 0,
						underlyingSymbol: t.underlyingSymbol,
						expirationDate: t.expirationDate ? new Date(t.expirationDate) : undefined,
						strike: t.strike,
						optionType: t.optionType as OptionType | undefined,
						multiplier: t.multiplier ?? 100,
						orderId: t.orderId,
						notes: t.notes,
					},
				})
			)
		);
	}

	if (result.snapshot) {
		await prisma.snapshot.upsert({
			where: { portfolioId_asOf: { portfolioId: portfolio.id, asOf: new Date(result.snapshot.asOf) } },
			create: {
				portfolioId: portfolio.id,
				asOf: new Date(result.snapshot.asOf),
				cash: result.snapshot.cash,
				marketValue: result.snapshot.marketValue,
				totalEquity: result.snapshot.totalEquity,
			},
			update: {
				cash: result.snapshot.cash,
				marketValue: result.snapshot.marketValue,
				totalEquity: result.snapshot.totalEquity,
			},
		});
	}

	return NextResponse.json({ inserted: result.transactions.length, snapshot: !!result.snapshot });
}