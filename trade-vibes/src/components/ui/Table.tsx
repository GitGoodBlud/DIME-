import { ReactNode } from "react";

export function Table({ columns, rows }: { columns: string[]; rows: ReactNode[][] }) {
	return (
		<div className="overflow-x-auto">
			<table className="min-w-full text-sm">
				<thead>
					<tr>
						{columns.map((c) => (
							<th key={c} className="text-left px-2 py-2 text-gray-600 border-b">{c}</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((r, i) => (
						<tr key={i} className="border-b">
							{r.map((cell, j) => (
								<td key={j} className="px-2 py-2">{cell}</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}