import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const DATA_DIR = path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR ?? './data');
export const DB_PATH = path.join(DATA_DIR, 'lifeplanner.db');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
export const SESSION_DAYS = Number(process.env.SESSION_DAYS) || 30;

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

let appSecret: Buffer | undefined;

/**
 * 32-byte key for encrypting sensitive fields. Taken from APP_SECRET when set,
 * otherwise generated once and persisted next to the database so a fresh
 * install needs no configuration.
 */
export function getAppSecret(): Buffer {
    if (appSecret) return appSecret;

    let raw = process.env.APP_SECRET;
    if (!raw) {
        const keyFile = path.join(DATA_DIR, 'secret.key');
        if (!fs.existsSync(keyFile)) {
            fs.writeFileSync(keyFile, crypto.randomBytes(32).toString('base64'), { mode: 0o600 });
        }
        raw = fs.readFileSync(keyFile, 'utf8').trim();
    }

    // Derive a fixed-length key regardless of how the secret was encoded.
    appSecret = crypto.createHash('sha256').update(raw).digest();
    return appSecret;
}
