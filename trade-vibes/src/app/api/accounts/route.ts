import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { encryptJson } from "@/lib/crypto";

const accountSchema = z.object({
	name: z.string().min(1),
	broker: z.enum(["ALPACA","TRADIER","IBKR","ROBINHOOD","SCHWAB","FIDELITY","OTHER","MANUAL"]),
	connectionType: z.enum(["MANUAL","CSV","API","OAUTH"]),
	accountType: z.enum(["MARGIN","TRADITIONAL","ROTH","OTHER"]).default("OTHER"),
	credential: z.record(z.string(), z.string()).optional(),
});

export async function GET() {
	const accounts = await prisma.account.findMany({
		include: { portfolios: true, credential: false },
	});
	return NextResponse.json(accounts);
}

export async function POST(req: NextRequest) {
	const json = await req.json();
	const parsed = accountSchema.safeParse(json);
	if (!parsed.success) {
		return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
	}
	const { name, broker, connectionType, accountType, credential } = parsed.data;
	const account = await prisma.account.create({
		data: { name, broker, connectionType, accountType },
	});
	if (credential) {
		const encryptedData = await encryptJson(credential);
		await prisma.apiCredential.create({
			data: {
				accountId: account.id,
				provider: broker,
				encryptedData,
			},
		});
	}
	return NextResponse.json(account);
}