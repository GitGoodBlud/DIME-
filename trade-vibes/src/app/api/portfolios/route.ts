import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
	accountId: z.string().cuid(),
	name: z.string().min(1),
	type: z.string().optional(),
	baseCurrency: z.string().default("USD"),
});

export async function GET(req: NextRequest) {
	const accountId = req.nextUrl.searchParams.get("accountId");
	const where = accountId ? { accountId } : {};
	const portfolios = await prisma.portfolio.findMany({ where });
	return NextResponse.json(portfolios);
}

export async function POST(req: NextRequest) {
	const json = await req.json();
	const parsed = schema.safeParse(json);
	if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
	const created = await prisma.portfolio.create({ data: parsed.data });
	return NextResponse.json(created);
}