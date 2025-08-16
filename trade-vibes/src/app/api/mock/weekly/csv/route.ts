import { NextRequest, NextResponse } from "next/server";
import { mockAdapter } from "@/services/mockAdapter";

export async function GET(req: NextRequest) {
	const from = req.nextUrl.searchParams.get("from");
	const to = req.nextUrl.searchParams.get("to");
	if (!from || !to) {
		return NextResponse.json({ error: "from and to are required" }, { status: 400 });
	}
	const accounts = await mockAdapter.fetchAccounts();
	const trades = await mockAdapter.fetchClosedTrades({ from, to });
	const accountName: Record<string, string> = Object.fromEntries(accounts.map(a => [a.id, a.name]));
	const header = ["Account","Ticker","Type","Strike","Contracts","Price","Premium","Yield","P/L","ROC","Close Method","Expiration"];
	const rows = trades.map(t => [
		accountName[t.accountId] || t.accountId,
		t.ticker,
		t.type,
		t.strike ?? "",
		t.contracts,
		t.contractPrice ?? "",
		(t.premium||0).toFixed(2),
		(t.yieldPct||0).toFixed(2)+"%",
		(t.realizedPL||0).toFixed(2),
		(t.rocPct||0).toFixed(2)+"%",
		t.closeMethod || "",
		t.expiration || "",
	]);
	const csv = [header, ...rows].map(r => r.map(x => typeof x === "string" && x.includes(",") ? `"${x}"` : x).join(",")).join("\n");
	return new NextResponse(csv, { headers: { "content-type": "text/csv" } });
}