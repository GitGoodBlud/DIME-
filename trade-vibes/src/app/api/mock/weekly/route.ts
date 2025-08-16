import { NextRequest, NextResponse } from "next/server";
import { mockAdapter } from "@/services/mockAdapter";
import { computeWeekly } from "@/services/calculators";

export async function GET(req: NextRequest) {
	const from = req.nextUrl.searchParams.get("from");
	const to = req.nextUrl.searchParams.get("to");
	if (!from || !to) {
		return NextResponse.json({ error: "from and to are required (ISO dates)" }, { status: 400 });
	}
	const accounts = await mockAdapter.fetchAccounts();
	const trades = await mockAdapter.fetchClosedTrades({ from, to });
	const snaps = await Promise.all(accounts.map((a) => mockAdapter.fetchDailySnapshots?.({ from, to, accountId: a.id })));
	const capitalByAccount: Record<string, { capitalDeployed: number; buyingPower: number }> = {};
	snaps.forEach((arr, idx) => {
		const a = accounts[idx];
		if (!a || !arr || !arr.length) return;
		const latest = arr[arr.length - 1]!;
		capitalByAccount[a.id] = { capitalDeployed: latest.capitalDeployed, buyingPower: latest.buyingPower };
	});
	const prevFrom = new Date(new Date(from).getTime() - 7 * 24 * 3600 * 1000).toISOString();
	const prevTo = new Date(new Date(to).getTime() - 7 * 24 * 3600 * 1000).toISOString();
	const prevTrades = await mockAdapter.fetchClosedTrades({ from: prevFrom, to: prevTo });
	const weekLabel = `${new Date(from).toLocaleDateString()} – ${new Date(to).toLocaleDateString()}`;
	const weekly = computeWeekly({ accounts, trades, capitalByAccount, prevWeek: { trades: prevTrades }, weekLabel });
	return NextResponse.json(weekly);
}