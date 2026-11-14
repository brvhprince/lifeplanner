import { hash, verify } from '@node-rs/argon2';

// Argon2id with the OWASP-recommended baseline (19 MiB, 2 iterations).
const OPTIONS = { memoryCost: 19_456, timeCost: 2, parallelism: 1 };

export const hashPassword = (password: string) => hash(password, OPTIONS);

// A real hash of a random string, verified when no user matches so that
// "unknown email" and "wrong password" take the same time.
let dummyHash: Promise<string> | undefined;

export async function verifyPassword(passwordHash: string | null | undefined, password: string) {
    if (!passwordHash) {
        dummyHash ??= hashPassword(crypto.randomUUID());
        await verify(await dummyHash, password).catch(() => false);
        return false;
    }
    return verify(passwordHash, password).catch(() => false);
}

export const PASSWORD_RULES = 'At least 10 characters.';

export function passwordProblem(password: string): string | null {
    if (password.length < 10) return 'Password must be at least 10 characters';
    if (password.length > 256) return 'Password is too long';
    return null;
}
