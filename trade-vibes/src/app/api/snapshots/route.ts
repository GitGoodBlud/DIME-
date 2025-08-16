import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma";

const schema = z.object({
	portfolioId: z.string().cuid(),
	asOf: z.coerce.date(),
	cash: z.coerce.number(),
	marketValue: z.coerce.number(),
	totalEquity: z.coerce.number(),
});

export async function GET(req: NextRequest) {
	const portfolioId = req.nextUrl.searchParams.get("portfolioId");
	if (!portfolioId) return NextResponse.json({ error: "portfolioId required" }, { status: 400 });
	const from = req.nextUrl.searchParams.get("from");
	const to = req.nextUrl.searchParams.get("to");
	const where: Prisma.SnapshotWhereInput = { portfolioId };
	if (from || to) where.asOf = {};
	if (from) (where.asOf as Prisma.DateTimeFilter).gte = new Date(from);
	if (to) (where.asOf as Prisma.DateTimeFilter).lte = new Date(to);
	const rows = await prisma.snapshot.findMany({ where, orderBy: { asOf: "asc" } });
	return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
	const json = await req.json();
	const parsed = schema.safeParse(json);
	if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
	const created = await prisma.snapshot.create({ data: parsed.data });
	return NextResponse.json(created);
}