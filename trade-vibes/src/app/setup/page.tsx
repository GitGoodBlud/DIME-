"use client";
import { useEffect, useState } from "react";

type Account = { id: string; name: string; broker: string; connectionType: string; accountType: string };

export default function SetupPage() {
	const [accounts, setAccounts] = useState<Account[]>([]);
	const [name, setName] = useState("My RH Account");
	const [broker, setBroker] = useState("ROBINHOOD");
	const [connectionType, setConnectionType] = useState("API");
	const [accountType, setAccountType] = useState("MARGIN");
	const [creating, setCreating] = useState(false);

	async function load() {
		const res = await fetch("/api/accounts");
		const data = await res.json();
		setAccounts(data);
	}
	useEffect(() => { load(); }, []);

	async function create() {
		setCreating(true);
		await fetch("/api/accounts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, broker, connectionType, accountType }) });
		setCreating(false);
		load();
	}

	return (
		<div className="max-w-3xl mx-auto p-6 space-y-6">
			<h1 className="text-2xl font-semibold">Account Setup</h1>
			<div className="grid gap-3">
				<label className="text-sm">Name<input className="border rounded px-2 py-1 ml-2" value={name} onChange={(e) => setName(e.target.value)} /></label>
				<label className="text-sm">Broker
					<select className="border rounded px-2 py-1 ml-2" value={broker} onChange={(e) => setBroker(e.target.value)}>
						<option>ROBINHOOD</option>
						<option>MANUAL</option>
					</select>
				</label>
				<label className="text-sm">Connection
					<select className="border rounded px-2 py-1 ml-2" value={connectionType} onChange={(e) => setConnectionType(e.target.value)}>
						<option>API</option>
						<option>MANUAL</option>
						<option>CSV</option>
					</select>
				</label>
				<label className="text-sm">Account Type
					<select className="border rounded px-2 py-1 ml-2" value={accountType} onChange={(e) => setAccountType(e.target.value)}>
						<option>MARGIN</option>
						<option>TRADITIONAL</option>
						<option>ROTH</option>
						<option>OTHER</option>
					</select>
				</label>
				<button className="border rounded px-3 py-1 w-max" disabled={creating} onClick={create}>{creating ? "Creating…" : "Create Account"}</button>
			</div>
			<div>
				<h2 className="text-lg font-medium">Accounts</h2>
				<ul className="list-disc pl-5">
					{accounts.map(a => (
						<li key={a.id} className="text-sm">{a.name} • {a.broker} • {a.connectionType} • {a.accountType} • ID: <code className="px-1 bg-gray-100 rounded">{a.id}</code></li>
					))}
				</ul>
			</div>
		</div>
	);
}