export function sum(numbers) {
	return numbers.reduce((a, b) => a + b, 0);
}

export function avg(numbers) {
	if (!numbers.length) return 0;
	return sum(numbers) / numbers.length;
}

export function percent(numerator, denominator) {
	if (!denominator) return 0;
	return (numerator / denominator) * 100;
}

export function roc(realizedPL, capitalDeployed) {
	if (!capitalDeployed) return 0;
	return (realizedPL / capitalDeployed) * 100;
}

export function winRate(trades) {
	if (!trades.length) return 0;
	const wins = trades.filter((t) => (t.realizedPL || 0) > 0).length;
	return percent(wins, trades.length);
}

export function yieldPct(premiumCollected, collateral) {
	if (!collateral) return 0;
	return (premiumCollected / collateral) * 100;
}

export function formatCurrency(n) {
	return `$${n.toFixed(2)}`;
}