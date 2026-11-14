# LifePlanner

An open source, self-hosted planner for your private life. Your money, goals, plans and memories are kept in a single SQLite file on hardware you control. There are no third-party services and no telemetry.

**What it covers:**

- **Money:** accounts, income, expenses, transfers (including cross-currency, with fees), categories, bills and subscriptions (one-click "record payment"), goals with contributions and progress, savings plans, debts and loans, investments, and a wishlist
- **Growth:** future plans, projects, learning, career and personal brand, each with a progress log
- **Life:** notes, memories, people (birthdays and moments), responsibilities, and work (employer contacts and linked projects)
- **Time:** reminders and routines, plus a dashboard "Coming up" panel for anything due in the next 30 days
- **Everywhere:** search across all your data (press `/`), photo and file attachments, in-app notifications (with optional desktop alerts), and CSV/JSON export

## Install with Docker (recommended)

```bash
git clone https://github.com/brvhprince/lifeplanner-webapp-v2.git lifeplanner
cd lifeplanner
docker compose up -d --build
```

Open <http://localhost:3000>. On the first visit you create the owner account. Everything lives in `./data`:

| File | What it is |
| --- | --- |
| `data/lifeplanner.db` | The database (SQLite, WAL mode) |
| `data/secret.key` | Key that encrypts sensitive fields such as 2FA secrets. Generated on first start. |
| `data/uploads/` | Uploaded files |

Upgrading: `git pull && docker compose up -d --build`. Database migrations run automatically on start.

## Run without Docker

Requires Node.js 22+.

```bash
yarn install
yarn build
DATA_DIR=./data yarn start
```

For development: `yarn dev`.

## Your data and backups

From **Settings → Your data** you can download CSV files for every section, a full JSON export, or a copy of the SQLite database.

For server-side backups, copy the whole `data/` folder (database, `secret.key` and `uploads/`). To get a consistent copy of the database while the app is running:

```bash
docker exec lifeplanner node scripts/lp.mjs backup /data/backup-$(date +%F).db
# or, without Docker
npm run lp backup ./backup.db
```

Keep `secret.key` with your backups. Without it, 2FA secrets can't be decrypted (you can turn 2FA off with the CLI below).

## Admin commands

There is no email, so account recovery happens on the server:

```bash
docker exec -it lifeplanner node scripts/lp.mjs reset-password   # prints a new random password, signs out all sessions
docker exec -it lifeplanner node scripts/lp.mjs disable-2fa
```

Outside Docker use `npm run lp <command>` with `DATA_DIR` pointing at your data folder.

## Configuration

All optional:

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATA_DIR` | `./data` (`/data` in Docker) | Where the database, key and uploads live |
| `APP_SECRET` | generated into `secret.key` | Encryption key material for sensitive fields |
| `SESSION_DAYS` | `30` | Session lifetime |
| `COOKIE_SECURE` | auto (from `X-Forwarded-Proto`) | Force `Secure` cookies when served over HTTPS |
| `PORT` | `3000` | HTTP port |
| `TZ` | system (`UTC` in Docker) | Time zone for due dates and reminder times, e.g. `Africa/Accra` |

To reach it from outside your home network, put it behind a reverse proxy with HTTPS (Caddy, Traefik, nginx) or a private network such as Tailscale, rather than exposing port 3000 directly.

## Security

- Passwords are hashed with Argon2id. Optional TOTP two-factor authentication is supported.
- Sessions are random 256-bit tokens in `HttpOnly`, `SameSite=Lax` cookies. Only their SHA-256 hash is stored.
- Failed sign-ins are rate limited, and errors don't reveal whether an email exists.
- TOTP secrets are encrypted at rest with AES-256-GCM.
- Money is stored as integer minor units, never floats. Balances are derived from the ledger, so they can't drift.

## Architecture

One Next.js app (App Router, Server Components and Server Actions) talks to SQLite through Drizzle ORM. There is no separate API server.

```
src/
  app/            routes: (app)/ is the signed-in area, auth/ and setup/ are public
  server/         server-only code: db/ (schema, connection), auth/, finance/
  components/     UI (ui/ primitives, finance/, layout/, auth/)
  lib/            shared helpers (money, dates, form action state)
drizzle/          generated SQL migrations
scripts/lp.mjs    admin CLI
```

Changing the schema: edit `src/server/db/schema.ts`, then run `yarn db:generate` and commit the new file in `drizzle/`.

## License

MIT
