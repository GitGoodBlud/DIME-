import { base64url } from "jose";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

function getKeyBuffer(): Buffer {
	const key = process.env.ENCRYPTION_KEY;
	if (!key) throw new Error("ENCRYPTION_KEY not set");
	const decoded = base64url.decode(key.replace(/\n/g, ""));
	if (decoded.length !== 32) {
		throw new Error("ENCRYPTION_KEY must be 32 bytes base64url encoded");
	}
	return Buffer.from(decoded);
}

export async function encryptJson<T>(data: T): Promise<string> {
	const key = getKeyBuffer();
	const iv = randomBytes(12);
	const cipher = createCipheriv("aes-256-gcm", key, iv);
	const plaintext = Buffer.from(JSON.stringify(data), "utf8");
	const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
	const tag = cipher.getAuthTag();
	// layout: iv | tag | ciphertext
	return base64url.encode(Buffer.concat([iv, tag, encrypted]));
}

export async function decryptJson<T>(token: string): Promise<T> {
	const raw = Buffer.from(base64url.decode(token));
	const iv = raw.subarray(0, 12);
	const tag = raw.subarray(12, 28);
	const ciphertext = raw.subarray(28);
	const key = getKeyBuffer();
	const decipher = createDecipheriv("aes-256-gcm", key, iv);
	decipher.setAuthTag(tag);
	const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
	return JSON.parse(plain.toString("utf8"));
}