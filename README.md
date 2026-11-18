# LifePlanner

An open source, self-hosted planner for your private life. Your money, goals, plans and memories are kept in a single SQLite file on hardware you control. No third-party services are required and there is no telemetry. (Push notifications, if you turn them on, are delivered through your browser’s push service.)

**What it covers:**

- **Money:** accounts (with overdraft limits, e.g. MoMo Boost), income, expenses, transfers (including cross-currency, with fees), categories, bills and subscriptions (one-click "record payment"), goals with contributions and progress, savings plans, loans and debts that move real money (upfront fees, finance charges, part-repayments), investments, and a wishlist. The dashboard shows what you owe and your net position.
- **Growth:** future plans, projects, learning, career and personal brand, each with a progress log
- **Life:** notes, memories, people (birthdays, moments, and money given and received with each person), responsibilities, and work (employer contacts and linked projects)
- **Time:** reminders and routines, plus a dashboard "Coming up" panel for anything due in the next 30 days
- **Everywhere:** search across all your data (press `/`), photo and file attachments, notifications on your phone and desktop (with a heads-up days ahead), installable as an app, and CSV/JSON export

## Install with Docker (recommended)

LifePlanner runs as a single container. You need **Docker** and **Docker Compose**; Compose comes with Docker on every platform below.

### 1. Install Docker

**Linux (Ubuntu, Debian, Fedora, Raspberry Pi OS…)**

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # run docker without sudo; log out and back in afterwards
docker compose version          # confirms Compose is installed
```

The script installs Docker Engine and the Compose plugin from Docker’s official repositories. Prefer doing it by hand? Follow [the Docker Engine install guide](https://docs.docker.com/engine/install/) for your distribution.

**macOS**

Install [Docker Desktop](https://docs.docker.com/desktop/setup/install/mac-install/), which includes Compose. A lighter, free alternative is [Colima](https://github.com/abiosoft/colima):

```bash
brew install colima docker docker-compose
colima start
```

**Windows**

Install [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/) with the WSL 2 backend, then run the commands below from a WSL terminal or PowerShell.

Check it works:

```bash
docker run --rm hello-world
docker compose version
```

### 2. Run LifePlanner

```bash
mkdir lifeplanner && cd lifeplanner
curl -fsSLO https://raw.githubusercontent.com/brvhprince/lifeplanner/main/docker-compose.yml
# edit TZ in docker-compose.yml to your time zone, then:
docker compose up -d
```

Open <http://localhost:3000> (or `http://<server-ip>:3000` from another device). On the first visit you create the owner account.

Images are published for `amd64` and `arm64`, so the same command works on a PC, a Mac, a cloud server or a Raspberry Pi 4/5.

The image is available from two registries; use whichever you prefer:

- `ghcr.io/brvhprince/lifeplanner` (GitHub Container Registry, the default in `docker-compose.yml`)
- `pennycodes/lifeplanner` ([Docker Hub](https://hub.docker.com/r/pennycodes/lifeplanner))

Without Compose:

```bash
docker run -d --name lifeplanner --restart unless-stopped \
  -p 3000:3000 -v "$PWD/data:/data" -e TZ=Africa/Accra \
  ghcr.io/brvhprince/lifeplanner:latest
```

### Where your data lives

Everything is stored in `./data`:

| File | What it is |
| --- | --- |
| `data/lifeplanner.db` | The database (SQLite, WAL mode) |
| `data/secret.key` | Key that encrypts sensitive fields such as 2FA secrets. Generated on first start. |
| `data/uploads/` | Uploaded files |
| `data/vapid.json` | Keys that sign push notifications (unless set with `VAPID_*` variables). Generated on first use. If lost, open **Settings → Notifications** on each device and tap **Turn on notifications** again (if a device still shows “On”, tap **Turn off here** first). |

### Upgrading

```bash
docker compose pull && docker compose up -d
```

Database migrations run automatically on start. Back up `data/` first.

### Image tags

| Tag | Meaning |
| --- | --- |
| `latest` | The newest release |
| `0.3.0` | Exactly that release |
| `0.3` | The newest `0.3.x` release (bug fixes only) |
| `1` | The newest `1.x` release (from 1.0 onwards) |

Images are only published for releases, so `latest` never contains unreleased work. Pin a version (e.g. `:0.3`) if you want to upgrade only when you choose. See [Releases](https://github.com/brvhprince/lifeplanner/releases) for what changed in each version.

### Build from source

```bash
git clone https://github.com/brvhprince/lifeplanner.git
cd lifeplanner
docker build -t lifeplanner .
```

Or, in `docker-compose.yml`, replace `image:` with `build: .` and run `docker compose up -d --build`.

## Run without Docker

Requires Node.js 22+.

```bash
yarn install
yarn build
DATA_DIR=./data yarn start
```

For development: `yarn dev`.

## Notifications on your phone

LifePlanner can send push notifications for bills, loans, savings, deadlines and birthdays: a heads-up a few days ahead (set in **Settings → Notifications**), on the day, and when something is overdue. Reminders arrive at the time you set on them.

1. Serve LifePlanner over **HTTPS** (browsers only allow push on secure sites), for example behind Caddy, Traefik or a Cloudflare Tunnel.
2. **iPhone/iPad (iOS 16.4+):** open it in Safari, tap Share → **Add to Home Screen**, then open it from the Home Screen. **Android and desktop:** use Chrome, Edge or Firefox (you can also install it from the browser menu).
3. Go to **Settings → Notifications → Turn on notifications on this device**, allow notifications, and tap **Send a test**.

Push messages travel through your browser's push service (Apple, Google, Mozilla or Microsoft). Each message is end-to-end encrypted and contains the notification title and text, a link to the page in LifePlanner, and a tag (the notification’s id, or `test` for test messages). The push service also receives a contact address for this server: the owner's email by default, or `VAPID_SUBJECT` if set. Only those push services are ever contacted; `PUSH_ALLOWED_HOSTS` can add others for unusual browsers.

## Your data and backups

From **Settings → Your data** you can download CSV files for every section, a full JSON export, or a copy of the SQLite database.

For server-side backups, copy the whole `data/` folder (database, `secret.key`, `vapid.json` and `uploads/`). To get a consistent copy of the database while the app is running:

```bash
docker exec lifeplanner lp backup /data/backup-$(date +%F).db
# or, without Docker
npm run lp backup ./backup.db
```

Keep `secret.key` with your backups. Without it, 2FA secrets can't be decrypted (you can turn 2FA off with the CLI below).

## Releasing (maintainers)

Merging to `main` runs the checks but publishes nothing. To release:

```bash
git checkout main && git pull
git tag v0.3.0 && git push origin v0.3.0
```

The Docker workflow then builds the amd64 and arm64 images, publishes `0.3.0`, `0.3` and `latest` to GHCR and Docker Hub, updates the Docker Hub overview, and creates a GitHub Release with notes generated from the merged pull requests. Tags like `v0.4.0-rc.1` publish only that exact tag and are marked as pre-releases.

To rebuild a release (for example after a registry problem), open **Actions → Docker image → Run workflow**, choose the release tag under "Use workflow from", and enter the same version.

### Restoring a backup

**From the app:** **Settings → Backups** lists every backup in `data/backups/` (made with **Back up now**, automatically before **Start over** and before each restore, or put there with `lp backup /data/backups/<name>.db`). Choose **Restore…**, enter your password, and the backup replaces your data. Your current data is backed up first, and you're signed out; sign in with the password from the time of the backup. You can also upload a backup file (up to 25 MB) there.

**From the command line** (e.g. if you can't sign in):

```bash
docker compose stop
cp data/backups/before-start-over-<date>.db data/lifeplanner.db
rm -f data/lifeplanner.db-wal data/lifeplanner.db-shm
docker compose start
```

## Admin commands

There is no email, so account recovery happens on the server:

```bash
docker exec -it lifeplanner lp reset-password   # prints a new random password, signs out all sessions
docker exec -it lifeplanner lp disable-2fa
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
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | generated into `vapid.json` | Push notification signing keys (generate with `npx web-push generate-vapid-keys`) |
| `VAPID_SUBJECT` | `mailto:<owner email>` | Contact sent to push services (e.g. `https://me.example.com`) |
| `PUSH_ALLOWED_HOSTS` | none | Extra push service hosts to allow, comma-separated |
| `PUID` / `PGID` | `1000` / `1000` | Docker only: the user and group that own the files in `data/`. Set them to your host user's `id -u` / `id -g` (or your NAS user) if needed. |

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
