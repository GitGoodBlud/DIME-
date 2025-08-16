import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHmac, timingSafeEqual } from "crypto";
import type { AssetType, TransactionSide, OptionType } from "@/generated/prisma";

type WebhookTransaction = {
	occurredAt: string;
	symbol: string;
	assetType: AssetType;
	side: TransactionSide;
	quantity: number;
	price: number;
	fees?: number;
	underlyingSymbol?: string;
	expirationDate?: string;
	strike?: number;
	optionType?: OptionType;
	multiplier?: number;
	orderId?: string;
	notes?: string;
};

type WebhookSnapshot = {
	asOf: string;
	cash: number;
	marketValue: number;
	totalEquity: number;
};

type WebhookBody = {
	accountId: string;
	transactions?: WebhookTransaction[];
	snapshot?: WebhookSnapshot;
};

function verifySignature(rawBody: string, signature: string): boolean {
	const secret = process.env.ROBINHOOD_WEBHOOK_SECRET || "";
	if (!secret || !signature) return false;
	const mac = createHmac("sha256", Buffer.from(secret, "utf8")).update(rawBody).digest();
	let sigBuf: Buffer;
	try {
		sigBuf = Buffer.from(signature, "hex");
	} catch {
		return false;
	}
	if (sigBuf.length !== mac.length) return false;
	return timingSafeEqual(sigBuf, mac);
}

export async function POST(req: NextRequest) {
	const raw = await req.text();
	const signature = req.headers.get("x-signature") || "";
	if (!verifySignature(raw, signature)) {
		return NextResponse.json({ error: "invalid signature" }, { status: 401 });
	}
	let parsed: WebhookBody;
	try {
		parsed = JSON.parse(raw) as WebhookBody;
	} catch {
		return NextResponse.json({ error: "invalid json" }, { status: 400 });
	}
	const { accountId } = parsed;
	if (!accountId) return NextResponse.json({ error: "accountId required" }, { status: 400 });
	const account = await prisma.account.findUnique({ where: { id: accountId }, include: { portfolios: true } });
	if (!account) return NextResponse.json({ error: "account not found" }, { status: 404 });
	const portfolio = account.portfolios[0] ?? (await prisma.portfolio.create({ data: { accountId: account.id, name: "Default", baseCurrency: "USD" } }));

	const txs: WebhookTransaction[] = Array.isArray(parsed.transactions) ? parsed.transactions : [];
	if (txs.length) {
		await prisma.$transaction(
			txs.map((t) =>
				prisma.transaction.create({
					data: {
						portfolioId: portfolio.id,
						occurredAt: new Date(t.occurredAt),
						symbol: t.symbol,
						assetType: t.assetType,
						side: t.side,
						quantity: t.quantity,
						price: t.price,
						fees: t.fees ?? 0,
						underlyingSymbol: t.underlyingSymbol,
						expirationDate: t.expirationDate ? new Date(t.expirationDate) : undefined,
						strike: t.strike,
						optionType: t.optionType,
						multiplier: t.multiplier ?? 100,
						orderId: t.orderId,
						notes: t.notes,
					},
				})
			)
		);
	}

	if (parsed.snapshot) {
		const s = parsed.snapshot;
		await prisma.snapshot.upsert({
			where: { portfolioId_asOf: { portfolioId: portfolio.id, asOf: new Date(s.asOf) } },
			create: {
				portfolioId: portfolio.id,
				asOf: new Date(s.asOf),
				cash: s.cash,
				marketValue: s.marketValue,
				totalEquity: s.totalEquity,
			},
			update: {
				cash: s.cash,
				marketValue: s.marketValue,
				totalEquity: s.totalEquity,
			},
		});
	}

	return NextResponse.json({ inserted: txs.length, snapshot: !!parsed.snapshot });
}