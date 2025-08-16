import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const txSchema = z.object({
	portfolioId: z.string().cuid(),
	occurredAt: z.coerce.date(),
	symbol: z.string().min(1),
	assetType: z.enum(["EQUITY","OPTION","CASH","OTHER"]),
	side: z.enum(["BUY","SELL","SELL_TO_OPEN","BUY_TO_CLOSE","ASSIGNMENT","EXERCISE","EXPIRATION","DIVIDEND","INTEREST","TRANSFER"]),
	quantity: z.coerce.number(),
	price: z.coerce.number(),
	fees: z.coerce.number().default(0),
	underlyingSymbol: z.string().optional(),
	expirationDate: z.coerce.date().optional(),
	strike: z.coerce.number().optional(),
	optionType: z.enum(["CALL","PUT"]).optional(),
	multiplier: z.coerce.number().default(100),
	orderId: z.string().optional(),
	notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
	const portfolioId = req.nextUrl.searchParams.get("portfolioId");
	const where = portfolioId ? { portfolioId } : {};
	const data = await prisma.transaction.findMany({ where, orderBy: { occurredAt: "asc" } });
	return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
	const json = await req.json();
	const parsed = txSchema.safeParse(json);
	if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
	const created = await prisma.transaction.create({ data: parsed.data });
	return NextResponse.json(created);
}