"use client";
import { useEffect, useState } from "react";

type Metrics = {
	portfolioIds: string[];
	weekly: { realizedPnL?: number; realizedPnl?: number; roc: number; start: string; end: string; perPortfolio: { portfolioId: string; weeklyPct: number | null }[] };
	totals: { totalEquity: number; cash: number; capitalDeployed: number };
};

type SeedResp = { accountId: string; portfolioId: string };

export default function Home() {
	const [metrics, setMetrics] = useState<Metrics | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			const seeded = await fetch("/api/seed", { method: "POST" });
			const seed: SeedResp = await seeded.json();
			const res = await fetch(`/api/metrics?accountId=${seed.accountId}`, { cache: "no-store" });
			if (res.ok) {
				const data = await res.json();
				setMetrics(data);
			}
			setLoading(false);
		})();
	}, []);

	const realized = metrics?.weekly.realizedPnl ?? metrics?.weekly.realizedPnL ?? 0;

	return (
		<div className="min-h-screen p-8 max-w-6xl mx-auto">
			<h1 className="text-2xl font-semibold">Trade Vibes</h1>
			{loading && <p className="mt-4">Loading…</p>}
			{!loading && metrics && (
				<>
					<div className="mt-6 grid gap-4 sm:grid-cols-3">
						<div className="rounded border p-4">
							<div className="text-sm text-gray-500">Weekly Realized PnL</div>
							<div className="text-3xl font-bold">${realized.toFixed(2)}</div>
						</div>
						<div className="rounded border p-4">
							<div className="text-sm text-gray-500">Weekly ROC</div>
							<div className="text-3xl font-bold">{(metrics.weekly.roc * 100).toFixed(2)}%</div>
						</div>
						<div className="rounded border p-4">
							<div className="text-sm text-gray-500">Total Equity</div>
							<div className="text-3xl font-bold">${metrics.totals.totalEquity.toFixed(2)}</div>
						</div>
					</div>

					<div className="mt-8">
						<h2 className="text-lg font-medium">Per-Portfolio Weekly %</h2>
						<div className="mt-3 grid gap-3 sm:grid-cols-3">
							{metrics.weekly.perPortfolio.map((p) => (
								<div key={p.portfolioId} className="rounded border p-4">
									<div className="text-sm text-gray-500">{p.portfolioId.slice(0, 8)}</div>
									<div className={`text-2xl font-bold ${p.weeklyPct && p.weeklyPct >= 0 ? "text-green-600" : "text-red-600"}`}>
										{p.weeklyPct === null ? "—" : `${(p.weeklyPct * 100).toFixed(2)}%`}
									</div>
								</div>
							))}
						</div>
					</div>
				</>
			)}
		</div>
	);
}
