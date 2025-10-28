/* eslint-disable no-console */
/**
 * Mini-Tank-Battle – Client
 *
 * Dieses Modul behandelt:
 *  - Canvas-Rendering (Arena, Panzer, Projektile, Power-Ups)
 *  - Eingabeerfassung (Keyboard, Touch), Input-Reconciliation
 *  - WebSocket-Kommunikation mit dem Node-Server
 *  - HUD-/Overlay-Updates, Audio & Mute-Handling
 *  - Interpolation der serverseitigen Snapshots für flüssige Darstellung
 */

const CONFIG = {
    canvasWidth: 960,
    canvasHeight: 540,
    interpolationDelay: 120, // ms
    snapshotBuffer: 24,
    pingInterval: 4000,
    maxInputRate: 60, // inputs pro Sekunde
    wsPort: Number(window.__TANKS_WS_PORT__ || window.localStorage.getItem('tanks:port') || 8081),
    scoreLimit: 5,
    roundTime: 180, // Sekunden
    map: {
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
        powerSpawns: [
            { x: 120, y: 90 },
            { x: 840, y: 90 },
            { x: 120, y: 450 },
            { x: 840, y: 450 },
            { x: 480, y: 270 },
        ],
    },
};

function roundRectPath(context, x, y, width, height, radius) {
    if (typeof context.roundRect === 'function') {
        context.roundRect(x, y, width, height, radius);
        return;
    }
    const r = Math.min(radius, width / 2, height / 2);
    context.moveTo(x + r, y);
    context.lineTo(x + width - r, y);
    context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r);
    context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    context.lineTo(x + r, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
}

const canvas = document.getElementById('tank-canvas');
const ctx = canvas.getContext('2d', { alpha: false });

const hud = {
    timer: document.getElementById('tank-timer'),
    scoreSelf: document.getElementById('tank-score-self'),
    scoreOpponent: document.getElementById('tank-score-opponent'),
    health: document.getElementById('tank-health'),
    power: document.getElementById('tank-power'),
    pauseBtn: document.getElementById('tank-pause'),
    muteBtn: document.getElementById('tank-mute'),
};

const overlays = {
    matchmaking: document.getElementById('tank-overlay-matchmaking'),
    countdown: document.getElementById('tank-overlay-countdown'),
    round: document.getElementById('tank-overlay-round'),
    pause: document.getElementById('tank-overlay-pause'),
};

const overlayText = {
    countdown: document.getElementById('tank-countdown-text'),
    summary: document.getElementById('tank-round-summary'),
};

const overlayButtons = {
    cancel: document.getElementById('tank-cancel'),
    rematch: document.getElementById('tank-rematch'),
    exit: document.getElementById('tank-exit'),
    resume: document.getElementById('tank-resume'),
};

const touchButtons = Array.from(document.querySelectorAll('.touch-btn'));

const inputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    fire: false,
    seq: 0,
    lastSent: 0,
};

const gameState = {
    ws: null,
    connected: false,
    playerId: null,
    roomId: null,
    matchmaking: true,
    paused: false,
    mute: false,
    lastPing: 0,
    lastPong: Date.now(),
    latency: 0,
    snapshotBuffer: [],
    latestState: null,
    lastSimTime: 0,
    pingHandle: null,
    inputQueue: [],
    unackedInputs: [],
    animationId: 0,
    roundEndsAt: null,
    roundStartedAt: null,
    lastFrameTime: 0,
};

class AudioController {
    constructor() {
        this.ctx = null;
        this.master = null;
        this.sfxGain = null;
        this.muted = false;
        this.volume = Number(localStorage.getItem('tanks:volume') || 0.6);
        this._enabled = false;
    }

    ensure() {
        if (this.muted) return null;
        if (!this.ctx) {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return null;
            this.ctx = new Ctx();
            this.master = this.ctx.createGain();
            this.master.connect(this.ctx.destination);
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.connect(this.master);
            this.master.gain.value = this.volume;
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this._enabled = true;
        return this.ctx;
    }

    setMuted(flag) {
        this.muted = flag;
        if (this.master) {
            this.master.gain.value = flag ? 0 : this.volume;
        }
        localStorage.setItem('tanks:mute', flag ? '1' : '0');
    }

    toggle() {
        this.setMuted(!this.muted);
    }

    hit(color = 'explosion') {
        if (!this.ensure() || this.muted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = color === 'shot' ? 'square' : 'sawtooth';
        osc.frequency.setValueAtTime(color === 'shot' ? 680 : 180, now);
        osc.frequency.exponentialRampToValueAtTime(color === 'shot' ? 420 : 60, now + 0.28);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.3);
    }
}

const audio = new AudioController();
audio.setMuted(localStorage.getItem('tanks:mute') === '1');

function resizeCanvas() {
    const { clientWidth, clientHeight } = canvas;
    const dpr = window.devicePixelRatio || 1;
    const width = clientWidth || CONFIG.canvasWidth;
    const height = clientHeight || CONFIG.canvasHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function formatTimer(seconds) {
    if (Number.isNaN(seconds) || seconds == null) return '--:--';
    const s = Math.max(0, Math.floor(seconds));
    const m = Math.floor(s / 60);
    const rest = s % 60;
    return `${String(m).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

function toggleOverlay(el, show) {
    if (!el) return;
    if (show) {
        el.hidden = false;
        requestAnimationFrame(() => el.classList.add('tank-overlay--active'));
    } else {
        el.classList.remove('tank-overlay--active');
        setTimeout(() => {
            el.hidden = true;
        }, 200);
    }
}

function resetGameState() {
    gameState.snapshotBuffer.length = 0;
    gameState.latestState = null;
    gameState.roundEndsAt = null;
    gameState.roundStartedAt = null;
    gameState.unackedInputs.length = 0;
    hud.timer.textContent = '--:--';
    hud.scoreSelf.textContent = '0';
    hud.scoreOpponent.textContent = '0';
    hud.health.textContent = '100';
    hud.power.textContent = '–';
}

function updateMuteButton() {
    hud.muteBtn.textContent = audio.muted ? 'Unmute (M)' : 'Mute (M)';
    hud.muteBtn.setAttribute('aria-pressed', String(!audio.muted));
}

function updatePauseButton() {
    hud.pauseBtn.textContent = gameState.paused ? 'Weiter (P)' : 'Pause (P)';
}

function buildWsUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.hostname;
    let port = CONFIG.wsPort;
    if (window.location.port && Number(window.location.port) !== 80 && Number(window.location.port) !== 443) {
        port = CONFIG.wsPort || Number(window.location.port);
    }
    return `${protocol}://${host}:${port}/tanks`;
}

function connect() {
    const url = buildWsUrl();
    const ws = new WebSocket(url);
    gameState.ws = ws;

    ws.addEventListener('open', () => {
        gameState.connected = true;
        ws.send(JSON.stringify({ type: 'join', version: 1 }));
    });

    ws.addEventListener('message', (event) => {
        try {
            const msg = JSON.parse(event.data);
            handleMessage(msg);
        } catch (error) {
            console.error('WS parse error', error);
        }
    });

    ws.addEventListener('close', () => {
        gameState.connected = false;
        gameState.playerId = null;
        gameState.roomId = null;
        clearInterval(gameState.pingHandle);
        gameState.pingHandle = null;
        toggleOverlay(overlays.round, false);
        toggleOverlay(overlays.countdown, false);
        toggleOverlay(overlays.pause, false);
        toggleOverlay(overlays.matchmaking, true);
        setTimeout(() => {
            resetGameState();
            connect();
        }, 1500);
    });
}

function send(msg) {
    if (!gameState.ws || gameState.ws.readyState !== WebSocket.OPEN) return;
    gameState.ws.send(JSON.stringify(msg));
}

function handleMessage(msg) {
    switch (msg.type) {
        case 'welcome': {
            gameState.playerId = msg.playerId;
            gameState.roomId = msg.roomId || null;
            toggleOverlay(overlays.matchmaking, msg.status === 'waiting');
            if (!gameState.pingHandle) {
                gameState.pingHandle = setInterval(() => {
                    gameState.lastPing = Date.now();
                    send({ type: 'ping', ts: gameState.lastPing });
                }, CONFIG.pingInterval);
            }
            break;
        }
        case 'matchmaking':
            toggleOverlay(overlays.matchmaking, msg.status !== 'ready');
            break;

        case 'countdown':
            overlayText.countdown.textContent = String(msg.value ?? '3');
            toggleOverlay(overlays.matchmaking, false);
            toggleOverlay(overlays.countdown, true);
            break;

        case 'start':
            toggleOverlay(overlays.countdown, false);
            toggleOverlay(overlays.round, false);
            toggleOverlay(overlays.pause, false);
            gameState.paused = false;
            updatePauseButton();
            resetGameState();
            gameState.roundStartedAt = msg.startedAt || Date.now();
            gameState.roundEndsAt = msg.endsAt || (Date.now() + CONFIG.roundTime * 1000);
            break;

        case 'state':
            receiveSnapshot(msg);
            break;

        case 'roundEnd':
            overlayText.summary.textContent = msg.summary || 'Runde beendet';
            toggleOverlay(overlays.round, true);
            break;

        case 'powerup':
            if (msg.playerId === gameState.playerId && msg.name) {
                hud.power.textContent = `${msg.name} (${Math.ceil(msg.remaining)}s)`;
            }
            break;

        case 'heartbeat':
            send({ type: 'heartbeat', ts: msg.ts });
            break;

        case 'pong':
            gameState.latency = Date.now() - msg.ts;
            gameState.lastPong = Date.now();
            break;

        case 'error':
            console.warn('Server error:', msg.message);
            break;

        default:
            break;
    }
}

function receiveSnapshot(snapshot) {
    const ts = snapshot.ts || Date.now();
    if (!snapshot.players) return;
    const buffer = gameState.snapshotBuffer;
    buffer.push({ ts, snapshot });
    while (buffer.length > CONFIG.snapshotBuffer) buffer.shift();
    gameState.latestState = snapshot;
    if (snapshot.self) {
        const selfState = snapshot.self;
        hud.health.textContent = String(Math.max(0, Math.round(selfState.hp)));
        hud.scoreSelf.textContent = String(selfState.score ?? 0);
        hud.power.textContent = selfState.powerUp || '–';
    }
    if (snapshot.opponent) {
        hud.scoreOpponent.textContent = String(snapshot.opponent.score ?? 0);
    }
    if (snapshot.timer != null) {
        hud.timer.textContent = formatTimer(snapshot.timer);
    } else if (gameState.roundEndsAt) {
        const remaining = (gameState.roundEndsAt - Date.now()) / 1000;
        hud.timer.textContent = formatTimer(remaining);
    }
    if (snapshot.ack) {
        gameState.unackedInputs = gameState.unackedInputs.filter((input) => input.seq > snapshot.ack);
    }
}

function interpolateSnapshot(targetTime) {
    const buffer = gameState.snapshotBuffer;
    if (buffer.length === 0) return null;
    if (buffer.length === 1) return buffer[0].snapshot;
    let previous = buffer[0];
    let next = buffer[buffer.length - 1];

    for (let i = 0; i < buffer.length; i += 1) {
        if (buffer[i].ts <= targetTime) {
            previous = buffer[i];
        }
        if (buffer[i].ts >= targetTime) {
            next = buffer[i];
            break;
        }
    }

    const span = next.ts - previous.ts || 1;
    const alpha = Math.min(1, Math.max(0, (targetTime - previous.ts) / span));

    const lerp = (a, b) => a + (b - a) * alpha;

    const out = {
        players: [],
        projectiles: [],
        powerUps: next.snapshot.powerUps || [],
    };

    const prevPlayers = previous.snapshot.players || [];
    const nextPlayers = next.snapshot.players || [];
    for (let i = 0; i < nextPlayers.length; i += 1) {
        const target = nextPlayers[i];
        const source = prevPlayers.find((p) => p.id === target.id) || target;
        out.players.push({
            ...target,
            x: lerp(source.x, target.x),
            y: lerp(source.y, target.y),
            direction: lerp(source.direction || 0, target.direction || 0),
        });
    }

    const prevProjectiles = previous.snapshot.projectiles || [];
    const nextProjectiles = next.snapshot.projectiles || [];
    for (let i = 0; i < nextProjectiles.length; i += 1) {
        const target = nextProjectiles[i];
        const source = prevProjectiles.find((p) => p.id === target.id) || target;
        out.projectiles.push({
            ...target,
            x: lerp(source.x, target.x),
            y: lerp(source.y, target.y),
        });
    }
    return out;
}

function drawArena() {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.28)');
    gradient.addColorStop(1, 'rgba(14, 116, 144, 0.28)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 2;
    CONFIG.map.obstacles.forEach((obs) => {
        ctx.beginPath();
        roundRectPath(ctx, obs.x, obs.y, obs.width, obs.height, 8);
        ctx.fill();
        ctx.stroke();
    });
    ctx.restore();
}

function drawPowerUps(powerUps) {
    powerUps.forEach((power) => {
        ctx.save();
        ctx.translate(power.x, power.y);
        const colors = {
            speed: '#38bdf8',
            shield: '#22c55e',
            rapid: '#f97316',
            ricochet: '#eab308',
        };
        ctx.fillStyle = colors[power.type] || '#facc15';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 12px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(power.type.slice(0, 1).toUpperCase(), 0, 1);
        ctx.restore();
    });
}

function drawProjectiles(projectiles) {
    ctx.fillStyle = '#f87171';
    projectiles.forEach((proj) => {
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawPlayers(players) {
    players.forEach((player) => {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.direction || 0);
        const isSelf = player.id === gameState.playerId;
        ctx.fillStyle = isSelf ? '#38bdf8' : '#f472b6';
        ctx.beginPath();
        roundRectPath(ctx, -18, -24, 36, 48, 8);
        ctx.fill();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(-6, -24, 12, -18);
        if (player.invulnerable) {
            ctx.strokeStyle = 'rgba(255,255,255,0.65)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 30, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();

        ctx.save();
        ctx.fillStyle = 'rgba(199, 210, 254, 0.8)';
        ctx.fillRect(player.x - 24, player.y - 38, 48, 6);
        ctx.fillStyle = '#0f172a';
        const hpWidth = Math.max(0, (player.hp / 100) * 48);
        ctx.fillRect(player.x - 24, player.y - 38, hpWidth, 6);
        ctx.restore();
    });
}

function render() {
    const now = Date.now();
    const targetTime = now - CONFIG.interpolationDelay;
    const snapshot = interpolateSnapshot(targetTime);
    drawArena();
    if (snapshot) {
        drawPowerUps(snapshot.powerUps || []);
        drawProjectiles(snapshot.projectiles || []);
        drawPlayers(snapshot.players || []);
    }
    gameState.animationId = requestAnimationFrame(render);
}

function sendInput() {
    const now = Date.now();
    if (now - inputState.lastSent < 1000 / CONFIG.maxInputRate) return;
    inputState.lastSent = now;
    inputState.seq += 1;
    const payload = {
        type: 'input',
        seq: inputState.seq,
        forward: inputState.forward,
        backward: inputState.backward,
        left: inputState.left,
        right: inputState.right,
        fire: inputState.fire,
        ts: now,
    };
    send(payload);
    gameState.unackedInputs.push(payload);
}

function handleKey(event, pressed) {
    const { code } = event;
    let handled = true;
    switch (code) {
        case 'KeyW':
        case 'ArrowUp':
            inputState.forward = pressed;
            break;
        case 'KeyS':
        case 'ArrowDown':
            inputState.backward = pressed;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            inputState.left = pressed;
            break;
        case 'KeyD':
        case 'ArrowRight':
            inputState.right = pressed;
            break;
        case 'Space':
            inputState.fire = pressed;
            if (pressed) audio.hit('shot');
            break;
        case 'KeyP':
            if (pressed) togglePause();
            break;
        case 'KeyM':
            if (pressed) {
                audio.toggle();
                updateMuteButton();
            }
            break;
        default:
            handled = false;
            break;
    }
    if (handled) {
        event.preventDefault();
        sendInput();
    }
}

function togglePause(forceState) {
    const desired = typeof forceState === 'boolean' ? forceState : !gameState.paused;
    gameState.paused = desired;
    updatePauseButton();
    toggleOverlay(overlays.pause, desired);
    send({ type: desired ? 'pause' : 'resume' });
}

function initTouchControls() {
    const activePointers = new Map();
    const setState = (action, value) => {
        switch (action) {
            case 'forward':
                inputState.forward = value;
                break;
            case 'backward':
                inputState.backward = value;
                break;
            case 'left':
                inputState.left = value;
                break;
            case 'right':
                inputState.right = value;
                break;
            case 'fire':
                inputState.fire = value;
                if (value) audio.hit('shot');
                break;
            case 'pause':
                if (value) togglePause();
                break;
            case 'mute':
                if (value) {
                    audio.toggle();
                    updateMuteButton();
                }
                break;
            default:
                break;
        }
    };

    touchButtons.forEach((btn) => {
        const action = btn.dataset.touch;
        if (!action) return;
        btn.addEventListener('pointerdown', (event) => {
            btn.setPointerCapture(event.pointerId);
            activePointers.set(event.pointerId, action);
            setState(action, true);
            sendInput();
        });
        btn.addEventListener('pointerup', (event) => {
            const act = activePointers.get(event.pointerId);
            if (act) {
                setState(act, false);
                activePointers.delete(event.pointerId);
                sendInput();
            }
        });
        btn.addEventListener('pointercancel', (event) => {
            const act = activePointers.get(event.pointerId);
            if (act) {
                setState(act, false);
                activePointers.delete(event.pointerId);
                sendInput();
            }
        });
    });
}

function attachEvents() {
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('keydown', (e) => handleKey(e, true));
    window.addEventListener('keyup', (e) => handleKey(e, false));

    hud.pauseBtn.addEventListener('click', () => togglePause());
    hud.muteBtn.addEventListener('click', () => {
        audio.toggle();
        updateMuteButton();
    });

    overlayButtons.cancel?.addEventListener('click', () => {
        send({ type: 'leave' });
    });
    overlayButtons.rematch?.addEventListener('click', () => {
        toggleOverlay(overlays.round, false);
        send({ type: 'rematch' });
        toggleOverlay(overlays.matchmaking, true);
    });
    overlayButtons.exit?.addEventListener('click', () => {
        toggleOverlay(overlays.round, false);
        send({ type: 'leave' });
        toggleOverlay(overlays.matchmaking, true);
    });
    overlayButtons.resume?.addEventListener('click', () => togglePause(false));

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            togglePause(true);
        }
    });

    initTouchControls();
}

function init() {
    resizeCanvas();
    attachEvents();
    updateMuteButton();
    updatePauseButton();
    toggleOverlay(overlays.matchmaking, true);
    connect();
    gameState.animationId = requestAnimationFrame(render);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
    init();
}
