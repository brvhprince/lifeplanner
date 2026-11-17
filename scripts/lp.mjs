#!/usr/bin/env node
/**
 * LifePlanner admin CLI. Runs against the database in DATA_DIR.
 *
 *   npm run lp reset-password [email]   set a new random password, sign out everywhere
 *   npm run lp disable-2fa [email]      turn off two-factor authentication
 *   npm run lp backup <file>            write a consistent copy of the database
 *
 * In Docker: docker exec -it lifeplanner node scripts/lp.mjs <command>
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { hash } from '@node-rs/argon2';

const dataDir = path.resolve(process.env.DATA_DIR ?? './data');
const dbPath = path.join(dataDir, 'lifeplanner.db');
const [command, arg] = process.argv.slice(2);

function fail(message) {
    console.error(message);
    process.exit(1);
}

function openDb() {
    if (!fs.existsSync(dbPath)) fail(`No database found at ${dbPath}. Set DATA_DIR to the data folder.`);
    const db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    return db;
}

function findUser(db, email) {
    const user = email
        ? db.prepare('select id, email from users where email = ?').get(email.trim().toLowerCase())
        : db.prepare('select id, email from users order by created_at limit 1').get();
    if (!user) fail(email ? `No user with email ${email}` : 'No user exists yet. Open the app to run setup.');
    return user;
}

function logActivity(db, userId, action, description) {
    db.prepare('insert into activities (id, user_id, action, description, created_at) values (?, ?, ?, ?, ?)').run(
        crypto.randomUUID(),
        userId,
        action,
        description,
        Date.now()
    );
}

const commands = {
    async 'reset-password'(email) {
        const db = openDb();
        const user = findUser(db, email);
        const password = crypto.randomBytes(12).toString('base64url');
        // Same Argon2id parameters as the app (src/server/auth/password.ts).
        const passwordHash = await hash(password, { memoryCost: 19_456, timeCost: 2, parallelism: 1 });
        db.transaction(() => {
            db.prepare('update users set password_hash = ?, updated_at = ? where id = ?').run(passwordHash, Date.now(), user.id);
            db.prepare('delete from sessions where user_id = ?').run(user.id);
            logActivity(db, user.id, 'auth.password_reset_cli', 'Password reset from the command line');
        })();
        console.log(`New password for ${user.email}:\n\n    ${password}\n\nSign in and change it under Settings.`);
    },

    'disable-2fa'(email) {
        const db = openDb();
        const user = findUser(db, email);
        db.prepare('update users set totp_enabled = 0, totp_secret = null, updated_at = ? where id = ?').run(Date.now(), user.id);
        logActivity(db, user.id, 'auth.2fa_disabled_cli', 'Two-factor authentication disabled from the command line');
        console.log(`Two-factor authentication disabled for ${user.email}.`);
    },

    async backup(file) {
        if (!file) fail('Usage: lp backup <file>');
        const target = path.resolve(file);
        await openDb().backup(target);
        console.log(`Database copied to ${target}.`);
        const secret = process.env.APP_SECRET ? 'your APP_SECRET value' : path.join(dataDir, 'secret.key');
        const vapid = process.env.VAPID_PRIVATE_KEY ? 'your VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY values' : path.join(dataDir, 'vapid.json');
        console.log(`Also keep ${secret}, ${vapid} and ${path.join(dataDir, 'uploads')}.`);
    },
};

if (!commands[command]) {
    fail('Usage: lp <reset-password [email] | disable-2fa [email] | backup <file>>');
}
await commands[command](arg);
