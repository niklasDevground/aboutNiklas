# Mini-Tank-Battle (2D Arena)

## Starten

```bash
# Abhängigkeiten installieren (einmalig)
npm install ws

# WebSocket-Server starten (default Port 8081)
node server/tanks-server.js
```

Die Spielseite liegt unter `/games/tanks.html`. Öffne sie im Browser (lokal z. B. via `http://localhost:8080/games/tanks.html`). Zwei Browser-Tabs verbinden sich automatisch in einem Room.

## Steuerung

- Bewegung: `WASD` oder Pfeiltasten (Fahren / Rotieren)
- Schießen: `Leertaste`
- Pause: `P`
- Mute: `M`
- Touch-Geräte: On-Screen-Buttons für Bewegung, Feuer, Pause, Mute

## Konfiguration (Environment Variablen)

| Variable             | Default | Beschreibung                             |
| -------------------- | ------- | ---------------------------------------- |
| `TANKS_PORT`         | `8081`  | Port für den WebSocket-Server            |
| `TANKS_SCORE_LIMIT`  | `5`     | Score-Limit pro Runde                    |
| `TANKS_ROUND_TIME`   | `180`   | Rundenlänge in Sekunden                  |

## Server-Features

- Server-authoritativer Physik-Tick (60 Hz) mit einfacher Kollision
- 1-gegen-1-Rooms, Matchmaking per Warteschlange
- Power-Ups (Speed, Shield, Rapid, Ricochet)
- Heartbeat/Timeout, Anti-Spam via Input-Rate-Limit
- Round-End & Rematch-Flow

## Bekannte Einschränkungen

- Map & Asset-Stil sind minimalistisch (Canvas-Vektoren)
- Kein Persistent Storage (Scores nur pro Session)
- Audio als WebAudio-Beep – kann bei Safari-Neustarts Freigabe verlangen
