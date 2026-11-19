# LifePlanner

An open source, self-hosted planner for your private life: money, goals, plans, people and memories, kept in a single SQLite file on hardware you control. No third-party services required, no telemetry (push notifications, if you turn them on, go through your browser’s push service).

**Source and docs:** [github.com/brvhprince/lifeplanner](https://github.com/brvhprince/lifeplanner)

## What it does

- **Money:** accounts with ledger-based balances and overdraft limits, income and expenses, transfers (including cross-currency, with fees), categories, bills and subscriptions with one-click payments, goals, savings plans, loans with fees, finance charges and part-repayments, investments, wishlist, and your net position
- **Growth:** future plans, projects, learning, career and personal brand, each with a progress log
- **Life:** notes, memories, people (birthdays and moments), responsibilities, employers and contacts
- **Time:** reminders, routines, and a "Coming up" view of everything due in the next 30 days
- **Everywhere:** search, photo and file attachments, push notifications on your phone (installable app; needs HTTPS), CSV/JSON/SQLite export, optional two-factor sign-in

## Quick start

```bash
mkdir lifeplanner && cd lifeplanner
curl -fsSLO https://raw.githubusercontent.com/brvhprince/lifeplanner/main/docker-compose.yml
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

Everything lives in the `/data` volume: the database (`lifeplanner.db`), the encryption key (`secret.key`), push notification keys (`vapid.json`) and uploads (`uploads/`). Back up the whole folder.

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
| `latest` | The newest release |
| `0.6.0` | Exactly that release |
| `0.6` | The newest `0.6.x` release |

Release notes: [github.com/brvhprince/lifeplanner/releases](https://github.com/brvhprince/lifeplanner/releases)

## Upgrading

```bash
docker compose pull && docker compose up -d
```

Database migrations run automatically on start. Back up `/data` first.

## License

MIT
