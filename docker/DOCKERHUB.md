# LifePlanner

An open source, self-hosted planner for your private life: money, goals, plans, people and memories, kept in a single SQLite file on hardware you control. No third-party services, no telemetry.

**Source and docs:** [github.com/brvhprince/lifeplanner-webapp-v2](https://github.com/brvhprince/lifeplanner-webapp-v2)

## What it does

- **Money:** accounts with ledger-based balances, income and expenses, transfers (including cross-currency, with fees), categories, bills and subscriptions with one-click payments, goals, savings plans, debts, investments, wishlist
- **Growth:** future plans, projects, learning, career and personal brand, each with a progress log
- **Life:** notes, memories, people (birthdays and moments), responsibilities, employers and contacts
- **Time:** reminders, routines, and a "Coming up" view of everything due in the next 30 days
- **Everywhere:** search, photo and file attachments, in-app notifications, CSV/JSON/SQLite export, optional two-factor sign-in

## Quick start

```bash
mkdir lifeplanner && cd lifeplanner
curl -fsSLO https://raw.githubusercontent.com/brvhprince/lifeplanner-webapp-v2/main/docker-compose.yml
# set TZ in docker-compose.yml to your time zone, then:
docker compose up -d
```

Open `http://localhost:3000` and create your account.

Or with `docker run`:

```bash
docker run -d --name lifeplanner --restart unless-stopped \
  -p 3000:3000 -v "$PWD/data:/data" -e TZ=Africa/Accra \
  pennycodes/lifeplanner:latest
```

The image runs on `linux/amd64` and `linux/arm64` (PCs, servers, Apple Silicon, Raspberry Pi 4/5). The same image is also published as `ghcr.io/brvhprince/lifeplanner`.

## Data

Everything lives in the `/data` volume: the database (`lifeplanner.db`), the encryption key (`secret.key`) and uploads (`uploads/`). Back up the whole folder.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `TZ` | `UTC` | Time zone for due dates and reminder times, e.g. `Africa/Accra` |
| `PUID` / `PGID` | `1000` / `1000` | User and group that own the files in `/data` |
| `COOKIE_SECURE` | auto | Set to `true` when served over HTTPS behind a reverse proxy |
| `APP_SECRET` | generated | Encryption key material; otherwise stored in `/data/secret.key` |
| `SESSION_DAYS` | `30` | Sign-in session lifetime |

## Admin commands

```bash
docker exec -it lifeplanner lp reset-password   # new random password, signs out all sessions
docker exec -it lifeplanner lp disable-2fa
docker exec lifeplanner lp backup /data/backup.db
```

## Tags

| Tag | Meaning |
| --- | --- |
| `latest` | Latest build of `main` |
| `0.2.0`, `0.2` | Released versions |
| `sha-<commit>` | A specific commit |

## Upgrading

```bash
docker compose pull && docker compose up -d
```

Database migrations run automatically on start. Back up `/data` first.

## License

MIT
