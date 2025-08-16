import { ReactNode } from "react";

export function Card({ title, children }: { title?: string; children: ReactNode }) {
	return (
		<div className="rounded border p-4 bg-white">
			{title && <div className="text-sm text-gray-500 mb-2">{title}</div>}
			{children}
		</div>
	);
}