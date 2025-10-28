#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Mini-Tank-Battle – WebSocket Server (server-authoritativ)
 *
 * Start:
 *    node server/tanks-server.js
 *
 * Optionen (environment):
 *    TANKS_PORT        Port für den WS-Server (default 8081)
 *    TANKS_SCORE_LIMIT Score-Limit pro Runde (default 5)
 *    TANKS_ROUND_TIME  Rundenlänge in Sekunden (default 180)
 */

const http = require('http');
const crypto = require('crypto');
const WebSocket = require('ws');

const PORT = Number(process.env.TANKS_PORT || process.env.PORT || 8081);
const SCORE_LIMIT = Number(process.env.TANKS_SCORE_LIMIT || 5);
const ROUND_TIME = Number(process.env.TANKS_ROUND_TIME || 180);

const TICK_RATE = 60; // Physik-Ticks pro Sekunde
const SNAPSHOT_RATE = 20; // State-Broadcast pro Sekunde
const POWERUP_INTERVAL = 12000;
const HEARTBEAT_INTERVAL = 5000;
const HEARTBEAT_TIMEOUT = 15000;
const MAX_INPUT_RATE = 120; // pro Sekunde

const MAP = {
    width: 960,
    height: 540,
    obstacles: [
        { x: 180, y: 120, width: 120, height: 40 },
        { x: 660, y: 120, width: 120, height: 40 },
        { x: 180, y: 380, width: 120, height: 40 },
        { x: 660, y: 380, width: 120, height: 40 },
        { x: 360, y: 230, width: 240, height: 30 },
        { x: 360, y: 280, width: 240, height: 30 },
    ],
    spawnPositions: [
        { x: 160, y: 270, direction: 0 },
        { x: 800, y: 270, direction: Math.PI },
    ],
    boundsPadding: 24,
};

const POWERUPS = ['speed', 'shield', 'rapid', 'ricochet'];

const rooms = new Map();
const waitingQueue = [];

function randomId() {
    return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function rectsIntersect(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

function spawnPosition(index = 0) {
    const entry = MAP.spawnPositions[index] || MAP.spawnPositions[0];
    return {
        x: entry.x,
        y: entry.y,
        direction: entry.direction,
    };
}

function createProjectile(owner, room, state) {
    const projectile = room.projectilePool.pop() || {};
    projectile.id = randomId();
    projectile.owner = owner.id;
    projectile.roomId = room.id;
    projectile.x = owner.x + Math.cos(owner.direction) * 32;
    projectile.y = owner.y + Math.sin(owner.direction) * 32;
    projectile.vx = Math.cos(owner.direction) * state.speed;
    projectile.vy = Math.sin(owner.direction) * state.speed;
    projectile.life = state.life;
    projectile.bounces = state.ricochet ? 1 : 0;
    projectile.damage = state.damage;
    projectile.ricochet = state.ricochet;
    return projectile;
}

function resetPlayer(player, index) {
    const spawn = spawnPosition(index);
    player.x = spawn.x;
    player.y = spawn.y;
    player.direction = spawn.direction;
    player.hp = 100;
    player.invulnerable = 2000;
    player.powerUp = null;
    player.powerUpExpires = 0;
    player.fireCooldown = 0;
    player.speedMultiplier = 1;
    player.fireRateMultiplier = 1;
    player.hasRicochet = false;
    player.shield = false;
}

function createRoom() {
    const id = randomId();
    const room = {
        id,
        players: new Map(),
        state: 'waiting',
        createdAt: Date.now(),
        lastUpdate: Date.now(),
        tickInterval: null,
        broadcastInterval: null,
        projectilePool: [],
        projectiles: [],
        powerUps: [],
        lastPowerUp: 0,
        roundEndsAt: null,
        countdownEndsAt: null,
        heartbeatTimer: null,
        snapshots: [],
    };
    rooms.set(id, room);
    return room;
}

function broadcast(room, data) {
    const message = JSON.stringify(data);
    room.players.forEach((player) => {
        if (player.socket.readyState === WebSocket.OPEN) {
            player.socket.send(message);
        }
    });
}

function safeSend(socket, payload) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(payload));
    }
}

function applyPowerUp(player, type) {
    player.powerUp = type;
    const now = Date.now();
    switch (type) {
        case 'speed':
            player.speedMultiplier = 1.6;
            player.powerUpExpires = now + 8000;
            break;
        case 'shield':
            player.shield = true;
            player.powerUpExpires = now + 10000;
            break;
        case 'rapid':
            player.fireRateMultiplier = 0.5;
            player.powerUpExpires = now + 8000;
            break;
        case 'ricochet':
            player.hasRicochet = true;
            player.powerUpExpires = now + 10000;
            break;
        default:
            player.powerUpExpires = now + 7000;
            break;
    }
}

function expirePowerUps(room, dt) {
    const now = Date.now();
    room.players.forEach((player) => {
        if (player.powerUp && now >= player.powerUpExpires) {
            player.powerUp = null;
            player.powerUpExpires = 0;
            player.speedMultiplier = 1;
            player.fireRateMultiplier = 1;
            player.hasRicochet = false;
        }
    });
}

function spawnPowerUp(room) {
    const now = Date.now();
    if (now - room.lastPowerUp < POWERUP_INTERVAL) return;
    room.lastPowerUp = now;
    const type = POWERUPS[Math.floor(Math.random() * POWERUPS.length)];
    const spawn = MAP.spawnPositions[Math.floor(Math.random() * MAP.spawnPositions.length)];
    room.powerUps.push({
        id: randomId(),
        type,
        x: spawn.x,
        y: spawn.y,
        ttl: now + 15000,
    });
}

function removePowerUp(room, id) {
    room.powerUps = room.powerUps.filter((p) => p.id !== id);
}

function handleProjectileCollision(room, projectile, dt) {
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.life -= dt * 1000;

    const radius = 5;
    const bounds = MAP.boundsPadding;

    if (projectile.x < bounds || projectile.x > MAP.width - bounds) {
        if (projectile.ricochet && projectile.bounces > 0) {
            projectile.vx *= -1;
            projectile.bounces -= 1;
        } else {
            return false;
        }
    }
    if (projectile.y < bounds || projectile.y > MAP.height - bounds) {
        if (projectile.ricochet && projectile.bounces > 0) {
            projectile.vy *= -1;
            projectile.bounces -= 1;
        } else {
            return false;
        }
    }

    const hitBox = { x: projectile.x - radius, y: projectile.y - radius, width: radius * 2, height: radius * 2 };
    for (let i = 0; i < MAP.obstacles.length; i += 1) {
        const obstacle = MAP.obstacles[i];
        if (rectsIntersect(hitBox, obstacle)) {
            if (projectile.ricochet && projectile.bounces > 0) {
                projectile.vx *= -1;
                projectile.vy *= -1;
                projectile.bounces -= 1;
            } else {
                return false;
            }
        }
    }

    room.players.forEach((player) => {
        if (player.id === projectile.owner || player.respawning) return;
        const tankBox = { x: player.x - 18, y: player.y - 24, width: 36, height: 48 };
        if (rectsIntersect(hitBox, tankBox)) {
            if (player.invulnerable > 0) return false;
            projectile.life = 0;
            if (player.shield) {
                player.shield = false;
                return false;
            }
            player.hp -= projectile.damage;
            if (player.hp <= 0) {
                handleKill(room, projectile.owner, player.id);
            }
            return false;
        }
        return true;
    });

    return projectile.life > 0;
}

function handleKill(room, killerId, victimId) {
    const killer = room.players.get(killerId);
    const victim = room.players.get(victimId);
    if (!killer || !victim) return;
    killer.score += 1;
    victim.respawning = 2000;
    victim.hp = 0;
    if (killer.score >= SCORE_LIMIT) {
        endRound(room, `${killer.name} erreicht ${killer.score} Punkte`);
    }
}

function handleRespawns(room, dt) {
    room.players.forEach((player, idx) => {
        if (player.invulnerable > 0) player.invulnerable -= dt * 1000;
        if (player.respawning) {
            player.respawning -= dt * 1000;
            if (player.respawning <= 0) {
                player.respawning = 0;
                resetPlayer(player, idx);
            }
        }
    });
}

function processInput(player, input, room) {
    const now = Date.now();
    const elapsed = now - player.lastInputTs;
    if (elapsed < 1000 / MAX_INPUT_RATE) return;
    player.lastInputTs = now;

    const { forward, backward, left, right, fire } = input;
    player.turning = 0;
    if (left && !right) player.turning = -1;
    if (right && !left) player.turning = 1;
    player.accelerating = 0;
    if (forward && !backward) player.accelerating = 1;
    if (backward && !forward) player.accelerating = -1;
    if (fire) attemptShoot(player, room);
    player.lastAck = input.seq;
}

function attemptShoot(player, room) {
    if (player.respawning) return;
    const now = Date.now();
    const cooldown = 400 * player.fireRateMultiplier;
    if (now - player.lastShot < cooldown) return;
    player.lastShot = now;
    const projectileState = {
        speed: 480,
        life: 1400,
        damage: 35,
        ricochet: player.hasRicochet,
    };
    const projectile = createProjectile(player, room, projectileState);
    room.projectiles.push(projectile);
}

function updatePlayers(room, dt) {
    room.players.forEach((player, index) => {
        if (player.respawning) return;
        const rotationSpeed = 2.6; // rad/sec
        const accel = 180 * player.speedMultiplier;
        const friction = 0.86;

        player.direction += player.turning * rotationSpeed * dt;
        const thrust = player.accelerating * accel * dt;
        player.vx += Math.cos(player.direction) * thrust;
        player.vy += Math.sin(player.direction) * thrust;
        player.vx *= friction;
        player.vy *= friction;
        player.x += player.vx * dt;
        player.y += player.vy * dt;

        const padding = MAP.boundsPadding;
        player.x = clamp(player.x, padding, MAP.width - padding);
        player.y = clamp(player.y, padding, MAP.height - padding);

        const tankBox = { x: player.x - 18, y: player.y - 24, width: 36, height: 48 };
        for (let i = 0; i < MAP.obstacles.length; i += 1) {
            const obstacle = MAP.obstacles[i];
            if (rectsIntersect(tankBox, obstacle)) {
                player.x -= player.vx * dt * 1.2;
                player.y -= player.vy * dt * 1.2;
                player.vx = 0;
                player.vy = 0;
            }
        }

        room.powerUps.forEach((power) => {
            const powerBox = { x: power.x - 18, y: power.y - 18, width: 36, height: 36 };
            if (rectsIntersect(tankBox, powerBox)) {
                applyPowerUp(player, power.type);
                removePowerUp(room, power.id);
                safeSend(player.socket, { type: 'powerup', name: power.type, remaining: 8, playerId: player.id });
            }
        });

        room.powerUps = room.powerUps.filter((power) => power.ttl > Date.now());
        player.invulnerable = Math.max(0, player.invulnerable - dt * 1000);
    });
}

function updateProjectiles(room, dt) {
    room.projectiles = room.projectiles.filter((projectile) => {
        const alive = handleProjectileCollision(room, projectile, dt);
        if (!alive) {
            room.projectilePool.push(projectile);
        }
        return alive;
    });
}

function buildSnapshot(room, forPlayer) {
    const now = Date.now();
    const players = [];
    let selfState = null;
    let enemyState = null;

    room.players.forEach((player) => {
        const data = {
            id: player.id,
            x: player.x,
            y: player.y,
            direction: player.direction,
            hp: player.hp,
            score: player.score,
            invulnerable: player.invulnerable > 0,
        };
        if (player.id === forPlayer.id) {
            selfState = {
                id: player.id,
                hp: player.hp,
                score: player.score,
                powerUp: player.powerUp ? `${player.powerUp} (${Math.ceil((player.powerUpExpires - now) / 1000)}s)` : '–',
            };
        } else {
            enemyState = { id: player.id, score: player.score, hp: player.hp };
        }
        players.push(data);
    });

    return {
        type: 'state',
        ts: now,
        players,
        projectiles: room.projectiles.map((p) => ({
            id: p.id,
            x: p.x,
            y: p.y,
            owner: p.owner,
        })),
        powerUps: room.powerUps.map((p) => ({
            id: p.id,
            x: p.x,
            y: p.y,
            type: p.type,
        })),
        timer: room.roundEndsAt ? (room.roundEndsAt - now) / 1000 : null,
        self: selfState,
        opponent: enemyState,
        ack: forPlayer.lastAck || 0,
    };
}

function endRound(room, reason = 'Runde beendet') {
    if (room.state !== 'active') return;
    room.state = 'ended';
    const scores = [];
    room.players.forEach((player) => {
        scores.push(`${player.name} ${player.score}`);
    });
    broadcast(room, { type: 'roundEnd', reason, summary: scores.join(' – ') });
    clearInterval(room.tickInterval);
    clearInterval(room.broadcastInterval);
    room.tickInterval = null;
    room.broadcastInterval = null;
}

function tickRoom(room) {
    const now = Date.now();
    const dt = (now - room.lastUpdate) / 1000;
    room.lastUpdate = now;

    spawnPowerUp(room);
    expirePowerUps(room, dt);
    updatePlayers(room, dt);
    updateProjectiles(room, dt);
    handleRespawns(room, dt);

    if (room.roundEndsAt && now >= room.roundEndsAt) {
        const scores = Array.from(room.players.values());
        scores.sort((a, b) => b.score - a.score);
        const top = scores[0];
        const msg = top ? `${top.name} gewinnt mit ${top.score} Punkten` : 'Runde beendet';
        endRound(room, msg);
    }
}

function startRoom(room) {
    room.state = 'countdown';
    room.countdownEndsAt = Date.now() + 3000;
    broadcast(room, { type: 'countdown', value: 3 });
    const countdownTimer = setInterval(() => {
        const remaining = Math.ceil((room.countdownEndsAt - Date.now()) / 1000);
        if (remaining <= 0) {
            clearInterval(countdownTimer);
            room.state = 'active';
            room.roundEndsAt = Date.now() + ROUND_TIME * 1000;
            room.lastUpdate = Date.now();
            broadcast(room, { type: 'start', endsAt: room.roundEndsAt, startedAt: Date.now() });
            room.tickInterval = setInterval(() => tickRoom(room), 1000 / TICK_RATE);
            room.broadcastInterval = setInterval(() => {
                room.players.forEach((player) => {
                    safeSend(player.socket, buildSnapshot(room, player));
                });
            }, 1000 / SNAPSHOT_RATE);
        } else {
            broadcast(room, { type: 'countdown', value: remaining });
        }
    }, 1000);
}

function assignToRoom(player) {
    let room = rooms.get(player.roomId);
    if (!room) {
        room = waitingQueue.shift();
    }
    if (!room) {
        room = createRoom();
    }
    if (room.players.size >= 2) {
        waitingQueue.push(room);
        return assignToRoom(player);
    }
    player.roomId = room.id;
    player.name = player.name || `Spieler ${room.players.size + 1}`;
    room.players.set(player.id, player);
    resetPlayer(player, room.players.size - 1);
    safeSend(player.socket, { type: 'welcome', playerId: player.id, roomId: room.id, status: room.state });
    if (room.players.size === 1) {
        waitingQueue.push(room);
        safeSend(player.socket, { type: 'matchmaking', status: 'waiting' });
    } else if (room.players.size === 2) {
        waitingQueue.splice(waitingQueue.indexOf(room), 1);
        room.players.forEach((p) => {
            safeSend(p.socket, { type: 'matchmaking', status: 'ready' });
        });
        startRoom(room);
    }
}

function removePlayer(player) {
    if (!player || !player.roomId) return;
    const room = rooms.get(player.roomId);
    if (!room) return;
    room.players.delete(player.id);
    if (room.players.size === 0) {
        rooms.delete(room.id);
        clearInterval(room.tickInterval);
        clearInterval(room.broadcastInterval);
    } else {
        broadcast(room, { type: 'matchmaking', status: 'waiting' });
        room.state = 'waiting';
        room.projectiles.length = 0;
        room.powerUps.length = 0;
        waitingQueue.push(room);
    }
}

function handleMessage(player, room, data) {
    switch (data.type) {
        case 'input':
            if (room && room.state === 'active') processInput(player, data, room);
            break;
        case 'ping':
            safeSend(player.socket, { type: 'pong', ts: data.ts });
            break;
        case 'heartbeat':
            player.lastHeartbeat = Date.now();
            break;
        case 'leave':
            removePlayer(player);
            break;
        case 'pause':
            player.paused = true;
            break;
        case 'resume':
            player.paused = false;
            break;
        case 'rematch':
            player.score = 0;
            player.hp = 100;
            player.invulnerable = 0;
            player.respawning = 0;
            waitingQueue.push(room);
            room.projectiles.length = 0;
            room.powerUps.length = 0;
            room.state = 'waiting';
            broadcast(room, { type: 'matchmaking', status: 'waiting' });
            if (room.players.size === 2) {
                startRoom(room);
            }
            break;
        default:
            break;
    }
}

const server = http.createServer();
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (socket) => {
    const player = {
        id: randomId(),
        socket,
        name: '',
        roomId: null,
        x: 0,
        y: 0,
        direction: 0,
        vx: 0,
        vy: 0,
        hp: 100,
        score: 0,
        powerUp: null,
        powerUpExpires: 0,
        fireRateMultiplier: 1,
        speedMultiplier: 1,
        hasRicochet: false,
        shield: false,
        invulnerable: 0,
        respawning: 0,
        lastShot: 0,
        lastInputTs: 0,
        turning: 0,
        accelerating: 0,
        lastAck: 0,
        lastHeartbeat: Date.now(),
    };

    socket.on('message', (msg) => {
        if (!msg) return;
        let data;
        try {
            data = JSON.parse(msg);
        } catch (error) {
            return;
        }
        if (data.type === 'join') {
            player.name = data.name || '';
            assignToRoom(player);
            return;
        }
        const room = rooms.get(player.roomId);
        handleMessage(player, room, data);
    });

    socket.on('close', () => {
        removePlayer(player);
    });

    assignToRoom(player);
});

server.on('upgrade', (req, socket, head) => {
    if (!req.url.startsWith('/tanks')) {
        socket.destroy();
        return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
    });
});

server.listen(PORT, () => {
    console.log(`Mini-Tank-Battle Server läuft auf ws://localhost:${PORT}/tanks`);
});

setInterval(() => {
    const now = Date.now();
    rooms.forEach((room) => {
        room.players.forEach((player) => {
            if (player.socket.readyState === WebSocket.OPEN) {
                safeSend(player.socket, { type: 'heartbeat', ts: now });
            }
            if (now - player.lastHeartbeat > HEARTBEAT_TIMEOUT) {
                console.log(`Disconnecting player ${player.id} wegen Timeout`);
                player.socket.terminate();
                removePlayer(player);
            }
        });
    });
}, HEARTBEAT_INTERVAL);
