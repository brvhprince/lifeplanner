import 'server-only';
import { Secret, TOTP } from 'otpauth';
import QRCode from 'qrcode';
import { decrypt, encrypt } from '@/server/crypto';

const ISSUER = 'LifePlanner';

function totpFor(email: string, base32: string) {
    return new TOTP({ issuer: ISSUER, label: email, secret: Secret.fromBase32(base32), digits: 6, period: 30 });
}

/** Creates a new secret; returns it encrypted for storage plus a QR code to scan. */
export async function generateTotp(email: string) {
    const secret = new Secret({ size: 20 });
    const uri = totpFor(email, secret.base32).toString();
    return {
        encryptedSecret: encrypt(secret.base32),
        secret: secret.base32,
        qrDataUrl: await QRCode.toDataURL(uri, { margin: 1, width: 220 }),
    };
}

export async function totpQr(email: string, encryptedSecret: string) {
    const base32 = decrypt(encryptedSecret);
    return {
        secret: base32,
        qrDataUrl: await QRCode.toDataURL(totpFor(email, base32).toString(), { margin: 1, width: 220 }),
    };
}

export function verifyTotp(email: string, encryptedSecret: string, code: string) {
    const token = code.replace(/\s+/g, '');
    if (!/^\d{6}$/.test(token)) return false;
    return totpFor(email, decrypt(encryptedSecret)).validate({ token, window: 1 }) !== null;
}
