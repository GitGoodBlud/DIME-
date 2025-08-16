"use client";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Table } from "@/components/ui/Table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type Weekly = import("@/services/calculators").WeeklyAggregate;

function isoDate(date: Date) { return date.toISOString().slice(0, 10); }

export default function Home() {
	const [from, setFrom] = useState<string>(() => {
		const now = new Date();
		const start = new Date(now);
		start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // Monday
		return isoDate(start);
	});
	const [to, setTo] = useState<string>(() => {
		const start = new Date(from);
		const end = new Date(start);
		end.setDate(end.getDate() + 6);
		return isoDate(end);
	});
	const [weekly, setWeekly] = useState<Weekly | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		(async () => {
			setLoading(true);
			const res = await fetch(`/api/mock/weekly?from=${from}&to=${to}`);
			const data = await res.json();
			setWeekly(data);
			setLoading(false);
		})();
	}, [from, to]);

	const topTickerData = useMemo(() => weekly?.topTickers?.map(t => ({ name: t.ticker, pl: t.realizedPL })) || [], [weekly]);
	const premiumByAccount = useMemo(() => weekly?.accounts?.map(a => ({ name: a.account.name, value: a.premiumCollected })) || [], [weekly]);
	const plByAccount = useMemo(() => weekly?.accounts?.map(a => ({ name: a.account.name, value: a.realizedPL })) || [], [weekly]);

	const closedRows = useMemo(() => {
		if (!weekly) return [] as React.ReactNode[][];
		return weekly.accounts.flatMap(a => a.trades).map(t => ([
			<span key={`${t.id}-ticker`} className={`${(t.realizedPL||0)>=0?"text-green-700":"text-red-700"}`}>{t.ticker}</span>,
			<span key={`${t.id}-type`}>{t.type}</span>,
			<span key={`${t.id}-strike`}>{t.strike ?? "-"}</span>,
			<span key={`${t.id}-contracts`}>{t.contracts}</span>,
			<span key={`${t.id}-price`}>{t.contractPrice ?? "-"}</span>,
			<span key={`${t.id}-premium`}>${(t.premium||0).toFixed(2)}</span>,
			<span key={`${t.id}-yield`}>{(t.yieldPct||0).toFixed(2)}%</span>,
			<span key={`${t.id}-pl`}>${(t.realizedPL||0).toFixed(2)}</span>,
			<span key={`${t.id}-roc`}>{(t.rocPct||0).toFixed(2)}%</span>,
			<span key={`${t.id}-close`}>{t.closeMethod || "-"}</span>,
			<span key={`${t.id}-exp`}>{t.expiration ? new Date(t.expiration).toLocaleDateString() : "-"}</span>,
		]));
	}, [weekly]);

	return (
		<div className="min-h-screen p-6 max-w-7xl mx-auto space-y-6">
			<h1 className="text-2xl font-semibold">Trade Vibes</h1>

			<div className="flex flex-wrap gap-2 items-center">
				<label className="text-sm">From</label>
				<input type="date" className="border rounded px-2 py-1" value={from} onChange={(e) => setFrom(e.target.value)} />
				<label className="text-sm">To</label>
				<input type="date" className="border rounded px-2 py-1" value={to} onChange={(e) => setTo(e.target.value)} />
				<button className="border rounded px-3 py-1" onClick={() => setTo(isoDate(new Date(new Date(from).getTime() + 6*24*3600*1000)))}>This Week</button>
				<a className="border rounded px-3 py-1" href={`/api/mock/weekly/csv?from=${from}&to=${to}`}>Download CSV</a>
			</div>

			{loading && <p>Loading…</p>}
			{!loading && weekly && (
				<>
					<div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
						<Card title="Contracts Expiring"><div className="text-2xl font-bold">{weekly.totals.contractsExpiring}</div></Card>
						<Card title="Trades Closed"><div className="text-2xl font-bold">{weekly.totals.tradesClosed}</div></Card>
						<Card title="Win Rate"><div className="text-2xl font-bold">{weekly.totals.winRatePct.toFixed(1)}%</div></Card>
						<Card title="Avg Yield"><div className="text-2xl font-bold">{weekly.totals.avgYieldPct.toFixed(2)}%</div></Card>
						<Card title="ROC"><div className="text-2xl font-bold">{weekly.totals.rocPct.toFixed(2)}%</div></Card>
						<Card title="WoW Change"><div className={`text-2xl font-bold ${weekly.totals.wowChangePct>=0?"text-green-600":"text-red-600"}`}>{weekly.totals.wowChangePct.toFixed(1)}%</div></Card>
					</div>

					<div className="grid lg:grid-cols-2 gap-4">
						<Card title="Weekly Premium by Account">
							<div className="h-56">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={premiumByAccount}>
										<XAxis dataKey="name" /><YAxis /><Tooltip />
										<Bar dataKey="value" fill="#8884d8" />
									</BarChart>
								</ResponsiveContainer>
							</div>
						</Card>
						<Card title="Weekly Realized P/L by Account">
							<div className="h-56">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={plByAccount}>
										<XAxis dataKey="name" /><YAxis /><Tooltip />
										<Bar dataKey="value" fill="#82ca9d" />
									</BarChart>
								</ResponsiveContainer>
							</div>
						</Card>
					</div>

					<div className="grid md:grid-cols-3 gap-3">
						{weekly.accounts.map((a) => (
							<Card key={a.account.id} title={`${a.account.name} • Utilization`}>
								<div className="mb-2 text-sm">{(a.capitalUtilization*100).toFixed(0)}%</div>
								<ProgressBar value={a.capitalUtilization} />
							</Card>
						))}
					</div>

					<div className="grid md:grid-cols-2 gap-4">
						<Card title="Top Tickers (P/L)">
							<div className="h-60">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={topTickerData}>
										<XAxis dataKey="name" /><YAxis /><Tooltip />
										<Bar dataKey="pl" fill="#10b981" />
									</BarChart>
								</ResponsiveContainer>
							</div>
						</Card>
						<Card title="Close Methods">
							<div className="h-60">
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie dataKey="count" nameKey="method" data={weekly.closeMethodBreakdown} label>
											{weekly.closeMethodBreakdown.map((_, i) => (
												<Cell key={i} fill={["#10b981", "#ef4444", "#f59e0b", "#3b82f6", "#6366f1"][i%5]} />
											))}
										</Pie>
									</PieChart>
								</ResponsiveContainer>
							</div>
						</Card>
					</div>

					<div className="grid md:grid-cols-2 gap-4">
						{weekly.strategyBreakdown.map((s) => (
							<Card key={s.strategy} title={`Strategy • ${s.strategy}`}>
								<div className="text-sm text-gray-600">Premium: ${s.premium.toFixed(2)}</div>
								<div className={`text-2xl font-bold ${s.realizedPL>=0?"text-green-600":"text-red-600"}`}>P/L: ${s.realizedPL.toFixed(2)} • ROC: {s.rocPct.toFixed(2)}%</div>
							</Card>
						))}
					</div>

					<Card title="Weekly Closed Positions">
						<Table
							columns={["Ticker","Type","Strike","Contracts","Price","Premium","Yield","P/L","ROC","Close Method","Expiration"]}
							rows={closedRows}
						/>
					</Card>
				</>
			)}
		</div>
	);
}
