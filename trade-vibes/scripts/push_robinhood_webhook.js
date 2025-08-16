#!/usr/bin/env node
const fs = require("fs");
const crypto = require("crypto");
const https = require("https");
const http = require("http");

function sign(body, secret) {
	return crypto.createHmac("sha256", Buffer.from(secret, "utf8")).update(body).digest("hex");
}

function post(url, body, signature) {
	return new Promise((resolve, reject) => {
		const u = new URL(url);
		const lib = u.protocol === "https:" ? https : http;
		const req = lib.request({ hostname: u.hostname, port: u.port || (u.protocol === "https:" ? 443 : 80), path: u.pathname + u.search, method: "POST", headers: { "content-type": "application/json", "x-signature": signature } }, (res) => {
			let data = "";
			res.on("data", (c) => (data += c));
			res.on("end", () => resolve({ status: res.statusCode, body: data }));
		});
		req.on("error", reject);
		req.write(body);
		req.end();
	});
}

async function main() {
	const file = process.argv[2];
	const endpoint = process.argv[3] || "http://localhost:3000/api/webhooks/robinhood";
	const secret = process.env.ROBINHOOD_WEBHOOK_SECRET;
	if (!file || !secret) {
		console.error("Usage: ROBINHOOD_WEBHOOK_SECRET=... push_robinhood_webhook.js <payload.json> [endpoint] ");
		process.exit(1);
	}
	const raw = fs.readFileSync(file, "utf8");
	JSON.parse(raw); // validate
	const sig = sign(raw, secret);
	const res = await post(endpoint, raw, sig);
	console.log("Response:", res.status, res.body);
}

main().catch((e) => { console.error(e); process.exit(1); });