#!/usr/bin/env bash
# Serve DARts locally.
# Usage: ./serve.sh [--lan] [port]   (default port 8080)
#   --lan  also listen on the local network, to open it on a phone
# If the port is taken, the next free one is used.
set -e
cd "$(dirname "$0")"
BIND=127.0.0.1
if [ "$1" = "--lan" ]; then BIND=0.0.0.0; shift; fi
PORT="${1:-8080}"
while python3 -c "import socket,sys; s=socket.socket(); sys.exit(s.connect_ex(('127.0.0.1',$PORT))!=0)"; do
  PORT=$((PORT + 1))
done

echo "DARts running:"
echo "  this computer:       http://localhost:$PORT"
if [ "$BIND" = "0.0.0.0" ]; then
  IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
  [ -n "$IP" ] && echo "  phone (same Wi-Fi):  http://$IP:$PORT"
fi
echo "Stop with Ctrl+C"
exec python3 -m http.server "$PORT" --bind "$BIND"
