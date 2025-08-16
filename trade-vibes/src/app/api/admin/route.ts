import { NextRequest, NextResponse } from "next/server";

function auth(req: NextRequest): boolean {
	const token = req.headers.get("authorization");
	if (!token) return false;
	const expected = `Bearer ${process.env.ADMIN_TOKEN}`;
	return token === expected;
}

export async function GET(req: NextRequest) {
	if (!auth(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	return NextResponse.json({ status: "ok" });
}