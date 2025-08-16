export function ProgressBar({ value }: { value: number }) {
	const pct = Math.max(0, Math.min(1, value));
	return (
		<div className="w-full h-2 bg-gray-200 rounded">
			<div className={`${pct >= 0.8 ? "bg-red-500" : pct >= 0.5 ? "bg-yellow-500" : "bg-green-500"} h-2 rounded`} style={{ width: `${pct * 100}%` }} />
		</div>
	);
}