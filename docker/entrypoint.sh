#!/bin/sh
# Starts LifePlanner as an unprivileged user.
#
# When started as root (the default), make sure the data directory belongs to
# PUID:PGID (a fresh bind mount is usually created root-owned), then drop
# privileges. When started with --user, run as that user unchanged.
set -eu

PUID="${PUID:-1000}"
PGID="${PGID:-1000}"
DATA_DIR="${DATA_DIR:-/data}"

if [ "$(id -u)" = "0" ]; then
    mkdir -p "$DATA_DIR"
    if [ "$(stat -c '%u:%g' "$DATA_DIR")" != "$PUID:$PGID" ]; then
        echo "lifeplanner: giving $DATA_DIR to $PUID:$PGID"
        chown -R "$PUID:$PGID" "$DATA_DIR" || echo "lifeplanner: warning: could not change owner of $DATA_DIR" >&2
    fi
    exec setpriv --reuid="$PUID" --regid="$PGID" --clear-groups -- "$@"
fi

exec "$@"
