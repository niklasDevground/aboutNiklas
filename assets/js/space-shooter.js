
/**
 * Space Shooter – Retro Arcade Mini Game
 *
 * Steuerung:
 * - Pfeiltasten oder A/D: Bewegung
 * - Leertaste / Touch-Schießen: Feuer
 * - P: Pause, M: Stumm
 *
 * Struktur:
 * - HTML: games/space-shooter.html
 * - Styles: assets/css/space-shooter.css (setzt auf vorhandenen Variablen auf)
 * - Script: assets/js/space-shooter.js (dieses File)
 *
 * Neue Wellen lassen sich durch Anpassung der spawnWave-Funktion erweitern.
 * Gegnerformation, Geschwindigkeit und Schussverhalten sind dort zentral konfiguriert.
 */
(function () {
    const canvas = document.getElementById('ss-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // DOM references for HUD und Overlays
    const scoreEl = document.getElementById('ss-score');
    const highScoreEl = document.getElementById('ss-highscore');
    const waveEl = document.getElementById('ss-wave');
    const livesEl = document.getElementById('ss-lives');
    const pauseBtn = document.getElementById('ss-pause');
    const muteBtn = document.getElementById('ss-mute');
    const volumeSlider = document.getElementById('ss-volume');
    const startOverlay = document.getElementById('ss-overlay-start');
    const gameOverOverlay = document.getElementById('ss-overlay-gameover');
    const pauseOverlay = document.getElementById('ss-overlay-paused');
    const startBtn = document.getElementById('ss-start');
    const restartBtn = document.getElementById('ss-restart');
    const resumeBtn = document.getElementById('ss-resume');
    const gameOverText = document.getElementById('ss-gameover-text');
    const touchButtons = Array.from(document.querySelectorAll('.touch-btn'));

    const STORAGE_KEY = 'space-shooter-highscore';

    const palette = {
        bg: '#0b1120',
        card: '#1f2933',
        text: '#ffffff',
        accent: '#2563eb',
        accentSoft: 'rgba(37,99,235,0.18)',
    };

    const config = {
        playerSpeed: 360,
        bulletSpeed: 560,
        enemyBulletBaseSpeed: 190,
        rapidFireInterval: 0.12,
        baseFireInterval: 0.28,
        spreadAngle: 0.28,
        powerDuration: 12,
        shieldDuration: 12,
        starCount: 80,
    };

    const state = {
        started: false,
        running: false,
        paused: false,
        gameOver: false,
        width: 0,
        height: 0,
        time: 0,
        score: 0,
        highScore: loadHighScore(),
        wave: 1,
        lives: 3,
        player: null,
        playerBullets: [],
        enemyBullets: [],
        enemies: [],
        powerUps: [],
        particles: [],
        enemyDirection: 1,
        enemySpeed: 60,
        enemyStepDown: 24,
        timers: { rapid: 0, spread: 0, shield: 0 },
        shieldActive: false,
        messages: [],
    };

    const input = {
        left: false,
        right: false,
        shoot: false,
    };

    const stars = [];
    let lastTime = 0;
    let rafId = null;

    const audio = createAudioController();

    function loadHighScore() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? Number(raw) || 0 : 0;
        } catch {
            return 0;
        }
    }

    function saveHighScore(value) {
        try {
            localStorage.setItem(STORAGE_KEY, String(value));
        } catch {
            /* ignore */
        }
    }

    function refreshPalette() {
        const root = getComputedStyle(document.documentElement);
        palette.bg = (root.getPropertyValue('--bg') || palette.bg).trim() || palette.bg;
        palette.card = (root.getPropertyValue('--card-bg') || palette.card).trim() || palette.card;
        palette.text = (root.getPropertyValue('--text') || palette.text).trim() || palette.text;
        palette.accent = (root.getPropertyValue('--accent') || palette.accent).trim() || palette.accent;
        palette.accentSoft = (root.getPropertyValue('--accent-soft') || palette.accentSoft).trim() || palette.accentSoft;
    }

    function createAudioController() {
        let ctx = null;
        let masterGain = null;
        let musicGain = null;
        let sfxGain = null;
        let muted = false;
        let volume = 0.6;
        let musicTimer = null;
        const motif = [220, 247, 262, 294, 330, 294, 262, 247];
        let motifIndex = 0;

        function ensureCtx() {
            if (!window.AudioContext && !window.webkitAudioContext) return null;
            if (!ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                ctx = new AudioCtx();
                masterGain = ctx.createGain();
                musicGain = ctx.createGain();
                sfxGain = ctx.createGain();
                masterGain.connect(ctx.destination);
                musicGain.connect(masterGain);
                sfxGain.connect(masterGain);
                masterGain.gain.value = muted ? 0 : volume;
                musicGain.gain.value = 0.28;
                sfxGain.gain.value = 0.9;
            }
            if (ctx.state === 'suspended') ctx.resume();
            return ctx;
        }

        function setVolume(value) {
            volume = value;
            if (masterGain) masterGain.gain.value = muted ? 0 : volume;
        }

        function setMuted(flag) {
            muted = flag;
            if (masterGain) masterGain.gain.value = muted ? 0 : volume;
        }

        function stopMusic() {
            if (musicTimer) {
                clearInterval(musicTimer);
                musicTimer = null;
            }
        }

        function startMusic() {
            const audioCtx = ensureCtx();
            if (!audioCtx) return;
            stopMusic();
            const interval = 520;
            musicTimer = setInterval(() => {
                const now = audioCtx.currentTime;
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.value = motif[motifIndex % motif.length];
                motifIndex += 1;
                gain.gain.setValueAtTime(0.0001, now);
                gain.gain.exponentialRampToValueAtTime(0.18, now + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
                osc.connect(gain);
                gain.connect(musicGain);
                osc.start(now);
                osc.stop(now + 0.5);
            }, interval);
        }

        function playSfx(type) {
            const audioCtx = ensureCtx();
            if (!audioCtx) return;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            const now = audioCtx.currentTime;
            let startFreq = 440;
            let endFreq = 220;
            let duration = 0.18;

            switch (type) {
                case 'shoot':
                    startFreq = 960;
                    endFreq = 520;
                    duration = 0.12;
                    osc.type = 'square';
                    break;
                case 'explosion':
                    startFreq = 120;
                    endFreq = 60;
                    duration = 0.35;
                    osc.type = 'sawtooth';
                    break;
                case 'power':
                    startFreq = 660;
                    endFreq = 880;
                    duration = 0.25;
                    osc.type = 'triangle';
                    break;
                case 'hit':
                    startFreq = 180;
                    endFreq = 80;
                    duration = 0.3;
                    osc.type = 'square';
                    break;
                default:
                    osc.type = 'triangle';
            }

            osc.frequency.setValueAtTime(startFreq, now);
            osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 40), now + duration);
            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(0.45, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
            osc.connect(gain);
            gain.connect(sfxGain);
            osc.start(now);
            osc.stop(now + duration + 0.02);
        }

        return {
            ensureCtx,
            startMusic,
            stopMusic,
            playSfx,
            setVolume,
            setMuted,
            get muted() { return muted; },
            get volume() { return volume; },
        };
    }

    function createPlayer() {
        return {
            x: state.width * 0.5,
            y: state.height - 70,
            width: 46,
            height: 52,
            speed: config.playerSpeed,
            baseSpeed: config.playerSpeed,
            baseFireInterval: config.baseFireInterval,
            fireInterval: config.baseFireInterval,
            lastShot: 0,
        };
    }

    function createStars() {
        stars.length = 0;
        for (let i = 0; i < config.starCount; i += 1) {
            stars.push({
                x: Math.random(),
                y: Math.random(),
                size: Math.random() * 2 + 0.6,
                speed: Math.random() * 0.4 + 0.2,
            });
        }
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function randRange(min, max) {
        return min + Math.random() * (max - min);
    }

    function drawRoundedRect(context, x, y, width, height, radius) {
        if (context.roundRect) {
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

    function intersects(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    function addMessage(text) {
        state.messages.push({ text, time: 2.8 });
    }

    function spawnParticles(x, y, count, color) {
        for (let i = 0; i < count; i += 1) {
            state.particles.push({
                x,
                y,
                vx: randRange(-60, 60),
                vy: randRange(-120, -40),
                life: randRange(0.4, 0.9),
                color,
                size: randRange(2, 4),
            });
        }
    }

    function spawnWave(wave) {
        state.enemies.length = 0;
        const cols = Math.min(10, 6 + Math.floor(wave / 2));
        const rows = Math.min(6, 2 + Math.floor((wave - 1) / 2));
        const enemyWidth = 40;
        const enemyHeight = 30;
        const gapX = 20;
        const gapY = 22;
        const totalWidth = cols * enemyWidth + (cols - 1) * gapX;
        const startX = Math.max(20, (state.width - totalWidth) / 2);
        const startY = 80;
        const difficultyFactor = 1 + (wave - 1) * 0.12;

        state.enemySpeed = 50 + wave * 14;
        state.enemyStepDown = 22 + wave * 2;
        state.enemyDirection = 1;

        for (let row = 0; row < rows; row += 1) {
            for (let col = 0; col < cols; col += 1) {
                const x = startX + col * (enemyWidth + gapX);
                const y = startY + row * (enemyHeight + gapY);
                const hp = 1 + Math.floor((wave + row) / 4);
                state.enemies.push({
                    x,
                    y,
                    width: enemyWidth,
                    height: enemyHeight,
                    hp,
                    baseHp: hp,
                    shootTimer: randRange(1.8, 3.4) / difficultyFactor,
                });
            }
        }
    }

    function spawnPowerUp(x, y) {
        const types = ['rapid', 'shield', 'spread'];
        const type = types[Math.floor(Math.random() * types.length)];
        state.powerUps.push({
            type,
            x,
            y,
            width: 26,
            height: 26,
            vy: 70,
        });
    }

    function resetGameState() {
        state.score = 0;
        state.wave = 1;
        state.lives = 3;
        state.time = 0;
        state.player = createPlayer();
        state.playerBullets.length = 0;
        state.enemyBullets.length = 0;
        state.powerUps.length = 0;
        state.particles.length = 0;
        state.timers.rapid = 0;
        state.timers.spread = 0;
        state.timers.shield = 0;
        state.shieldActive = false;
        state.messages.length = 0;
        spawnWave(state.wave);
        updateHud();
    }

    function updateHud() {
        if (scoreEl) scoreEl.textContent = state.score.toString();
        if (highScoreEl) highScoreEl.textContent = state.highScore.toString();
        if (waveEl) waveEl.textContent = state.wave.toString();
        if (livesEl) livesEl.textContent = state.lives.toString();
        if (muteBtn) muteBtn.textContent = audio.muted ? 'Unmute (M)' : 'Mute (M)';
        if (pauseBtn) pauseBtn.textContent = state.paused ? 'Weiter (P)' : 'Pause (P)';
    }

    function toggleOverlay(overlay, show) {
        if (!overlay) return;
        if (show) {
            overlay.hidden = false;
            requestAnimationFrame(() => overlay.classList.add('overlay--active'));
        } else {
            overlay.classList.remove('overlay--active');
            setTimeout(() => {
                overlay.hidden = true;
            }, 200);
        }
    }

    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const width = rect.width;
        const height = rect.height;

        state.width = width;
        state.height = height;

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (state.player) {
            state.player.x = clamp(state.player.x, state.player.width / 2 + 10, state.width - state.player.width / 2 - 10);
            state.player.y = state.height - 70;
        }
        createStars();
    }

    function handleFire() {
        const elapsed = state.time;
        if (!input.shoot) return;
        if (elapsed - state.player.lastShot < state.player.fireInterval) return;

        state.player.lastShot = elapsed;
        const bulletBase = {
            x: state.player.x - 3,
            y: state.player.y - state.player.height / 2,
            width: 6,
            height: 16,
            vx: 0,
            vy: -config.bulletSpeed,
        };

        const hasSpread = state.timers.spread > 0;
        if (hasSpread) {
            const angles = [-config.spreadAngle, 0, config.spreadAngle];
            angles.forEach((angle) => {
                const speed = config.bulletSpeed;
                state.playerBullets.push({
                    x: bulletBase.x + state.player.width / 2 - 3,
                    y: bulletBase.y,
                    width: bulletBase.width,
                    height: bulletBase.height,
                    vx: Math.sin(angle) * speed,
                    vy: -Math.cos(angle) * speed,
                });
            });
        } else {
            state.playerBullets.push({
                ...bulletBase,
                x: state.player.x - bulletBase.width / 2,
            });
        }

        audio.playSfx('shoot');
    }

    function activatePowerUp(type) {
        switch (type) {
            case 'rapid':
                state.timers.rapid = config.powerDuration;
                state.player.fireInterval = config.rapidFireInterval;
                addMessage('Rapid Fire!');
                break;
            case 'shield':
                state.timers.shield = config.shieldDuration;
                state.shieldActive = true;
                addMessage('Shield aktiviert');
                break;
            case 'spread':
                state.timers.spread = config.powerDuration;
                addMessage('Spread Shot!');
                break;
        }
        audio.playSfx('power');
    }

    function updatePowerTimers(dt) {
        if (state.timers.rapid > 0) {
            state.timers.rapid -= dt;
            if (state.timers.rapid <= 0) {
                state.timers.rapid = 0;
                state.player.fireInterval = state.player.baseFireInterval;
            }
        }
        if (state.timers.spread > 0) {
            state.timers.spread -= dt;
            if (state.timers.spread <= 0) {
                state.timers.spread = 0;
            }
        }
        if (state.timers.shield > 0) {
            state.timers.shield -= dt;
            if (state.timers.shield <= 0) {
                state.timers.shield = 0;
                state.shieldActive = false;
            }
        }
    }

    function loseLife() {
        if (state.shieldActive) {
            state.shieldActive = false;
            state.timers.shield = 0;
            addMessage('Schild verbraucht');
            audio.playSfx('hit');
            return;
        }
        state.lives -= 1;
        audio.playSfx('hit');
        spawnParticles(state.player.x, state.player.y, 18, palette.accentSoft);
        if (state.lives <= 0) {
            state.lives = 0;
            handleGameOver('Alle Leben verloren.');
        } else {
            state.player.x = state.width * 0.5;
        }
        updateHud();
    }

    function handleGameOver(reason) {
        state.gameOver = true;
        state.running = false;
        state.started = false;
        audio.stopMusic();
        toggleOverlay(gameOverOverlay, true);
        if (gameOverText) {
            gameOverText.textContent = `${reason} Score: ${state.score}`;
        }
        updateHud();
    }

    function maybeDropPowerUp(enemy) {
        const chance = Math.min(0.18 + state.wave * 0.015, 0.45);
        if (Math.random() < chance) {
            spawnPowerUp(enemy.x + enemy.width / 2 - 13, enemy.y + enemy.height / 2 - 13);
        }
    }

    function nextWave() {
        state.wave += 1;
        state.player.fireInterval = state.timers.rapid > 0 ? config.rapidFireInterval : state.player.baseFireInterval;
        spawnWave(state.wave);
        addMessage(`Welle ${state.wave}`);
        updateHud();
    }

    function update(dt) {
        state.time += dt;
        updatePowerTimers(dt);

        const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
        state.player.x += dir * state.player.speed * dt;
        state.player.x = clamp(
            state.player.x,
            state.player.width / 2 + 12,
            state.width - state.player.width / 2 - 12,
        );

        handleFire();

        state.playerBullets = state.playerBullets.filter((bullet) => {
            bullet.x += bullet.vx * dt;
            bullet.y += bullet.vy * dt;
            return bullet.y + bullet.height >= 0 && bullet.y <= state.height;
        });

        state.enemyBullets = state.enemyBullets.filter((bullet) => {
            bullet.x += bullet.vx * dt;
            bullet.y += bullet.vy * dt;
            if (bullet.y > state.height + 40) return false;
            if (intersects(bullet, playerAabb())) {
                loseLife();
                return false;
            }
            return true;
        });

        state.powerUps = state.powerUps.filter((power) => {
            power.y += power.vy * dt;
            if (power.y > state.height + 30) return false;
            if (intersects(power, playerAabb())) {
                activatePowerUp(power.type);
                return false;
            }
            return true;
        });

        state.particles = state.particles.filter((p) => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 90 * dt;
            p.life -= dt;
            return p.life > 0;
        });

        let reverse = false;
        const direction = state.enemyDirection;
        const speed = state.enemySpeed;
        const bulletSpeed = config.enemyBulletBaseSpeed + state.wave * 22;

        state.enemies.forEach((enemy) => {
            enemy.x += direction * speed * dt;
            if (enemy.x <= 10 || enemy.x + enemy.width >= state.width - 10) {
                reverse = true;
            }
            enemy.shootTimer -= dt;
            if (enemy.shootTimer <= 0) {
                enemy.shootTimer = randRange(1.5, 3.2) / (1 + state.wave * 0.08);
                state.enemyBullets.push({
                    x: enemy.x + enemy.width / 2 - 3,
                    y: enemy.y + enemy.height,
                    width: 6,
                    height: 16,
                    vx: randRange(-20, 20),
                    vy: bulletSpeed,
                });
            }
        });

        if (reverse) {
            state.enemyDirection *= -1;
            state.enemies.forEach((enemy) => {
                enemy.y += state.enemyStepDown;
                if (enemy.y + enemy.height >= state.player.y) {
                    handleGameOver('Gegner haben die Basis erreicht.');
                }
            });
        }

        state.playerBullets = state.playerBullets.filter((bullet) => {
            let hit = false;
            for (let i = 0; i < state.enemies.length; i += 1) {
                const enemy = state.enemies[i];
                if (intersects(bullet, enemy)) {
                    hit = true;
                    enemy.hp -= 1;
                    if (enemy.hp <= 0) {
                        state.enemies.splice(i, 1);
                        const reward = 120 + state.wave * 20;
                        state.score += reward;
                        if (state.score > state.highScore) {
                            state.highScore = state.score;
                            saveHighScore(state.highScore);
                        }
                        audio.playSfx('explosion');
                        spawnParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 22, palette.accent);
                        maybeDropPowerUp(enemy);
                        updateHud();
                    } else {
                        audio.playSfx('hit');
                    }
                    break;
                }
            }
            return !hit;
        });

        state.enemies.forEach((enemy) => {
            if (intersects(enemy, playerAabb())) {
                loseLife();
                enemy.hp = 0;
            }
        });
        state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);

        if (!state.gameOver && state.enemies.length === 0) {
            nextWave();
        }

        state.messages = state.messages.filter((message) => {
            message.time -= dt;
            return message.time > 0;
        });
    }

    function playerAabb() {
        return {
            x: state.player.x - state.player.width / 2,
            y: state.player.y - state.player.height / 2,
            width: state.player.width,
            height: state.player.height,
        };
    }

    function updateStars(dt) {
        stars.forEach((star) => {
            star.y += star.speed * dt * 20;
            if (star.y > 1) {
                star.y -= 1;
                star.x = Math.random();
                star.speed = Math.random() * 0.4 + 0.2;
            }
        });
    }

    function render() {
        ctx.fillStyle = palette.bg || '#0b1120';
        ctx.fillRect(0, 0, state.width, state.height);

        ctx.fillStyle = palette.accentSoft;
        stars.forEach((star) => {
            ctx.beginPath();
            ctx.arc(star.x * state.width, star.y * state.height, star.size, 0, Math.PI * 2);
            ctx.fill();
        });

        if (state.timers.rapid > 0 || state.timers.shield > 0 || state.timers.spread > 0) {
            const icons = [];
            if (state.timers.rapid > 0) icons.push({ label: 'R' });
            if (state.timers.shield > 0 || state.shieldActive) icons.push({ label: 'S' });
            if (state.timers.spread > 0) icons.push({ label: 'X' });
            const baseY = state.height - 40;
            icons.forEach((icon, idx) => {
                const x = 20 + idx * 36;
                ctx.fillStyle = palette.accentSoft;
                ctx.beginPath();
                drawRoundedRect(ctx, x, baseY, 28, 28, 8);
                ctx.fill();
                ctx.fillStyle = palette.text;
                ctx.font = 'bold 14px Inter, system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(icon.label, x + 14, baseY + 14);
            });
        }

        if (state.player) {
            const { x, y, width, height } = state.player;
            ctx.save();
            ctx.translate(x, y);
            ctx.fillStyle = palette.accent;
            ctx.beginPath();
            ctx.moveTo(0, -height / 2);
            ctx.lineTo(-width / 2, height / 2);
            ctx.lineTo(width / 2, height / 2);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = palette.card;
            ctx.fillRect(-width / 4, height / 6, width / 2, height / 4);

            if (state.shieldActive) {
                ctx.strokeStyle = palette.accent;
                ctx.lineWidth = 3;
                ctx.globalAlpha = 0.6 + Math.sin(state.time * 8) * 0.2;
                ctx.beginPath();
                ctx.arc(0, 0, width * 0.7, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
            ctx.restore();
        }

        ctx.fillStyle = palette.card;
        state.enemies.forEach((enemy) => {
            ctx.save();
            ctx.translate(enemy.x, enemy.y);
            ctx.fillStyle = palette.accentSoft;
            ctx.beginPath();
            drawRoundedRect(ctx, 0, 0, enemy.width, enemy.height, 8);
            ctx.fill();
            ctx.fillStyle = palette.accent;
            ctx.fillRect(enemy.width * 0.2, enemy.height * 0.35, enemy.width * 0.6, enemy.height * 0.28);
            ctx.restore();
        });

        ctx.fillStyle = palette.text;
        state.playerBullets.forEach((bullet) => {
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });

        ctx.fillStyle = palette.accent;
        state.enemyBullets.forEach((bullet) => {
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });

        state.powerUps.forEach((power) => {
            ctx.save();
            ctx.translate(power.x + power.width / 2, power.y + power.height / 2);
            ctx.fillStyle = palette.accent;
            ctx.beginPath();
            ctx.arc(0, 0, power.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = palette.card;
            ctx.font = 'bold 14px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const letter = power.type.startsWith('r') ? 'R' : power.type.startsWith('s') ? 'S' : 'X';
            ctx.fillText(letter, 0, 1);
            ctx.restore();
        });

        state.particles.forEach((p) => {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });

        if (state.messages.length > 0) {
            ctx.fillStyle = palette.text;
            ctx.font = 'bold 20px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            const message = state.messages[0];
            ctx.globalAlpha = Math.min(1, message.time / 1.2);
            ctx.fillText(message.text, state.width / 2, 22);
            ctx.globalAlpha = 1;
        }
    }

    function loop(timestamp) {
        rafId = requestAnimationFrame(loop);
        const dtMs = timestamp - lastTime;
        lastTime = timestamp;
        const dt = Math.min(dtMs / 1000, 0.12);

        refreshPalette();
        updateStars(dt);

        if (state.running && !state.paused && !state.gameOver) {
            update(dt);
        }
        render();
    }

    function startLoop() {
        if (!rafId) {
            lastTime = performance.now();
            rafId = requestAnimationFrame(loop);
        }
    }

    function stopLoop() {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    function startGame() {
        audio.ensureCtx();
        toggleOverlay(startOverlay, false);
        toggleOverlay(gameOverOverlay, false);
        toggleOverlay(pauseOverlay, false);
        resetGameState();
        state.started = true;
        state.running = true;
        state.paused = false;
        state.gameOver = false;
        audio.startMusic();
        updateHud();
    }

    function restartGame() {
        toggleOverlay(gameOverOverlay, false);
        startGame();
    }

    function togglePause(forceState) {
        if (!state.started || state.gameOver) return;
        const desired = typeof forceState === 'boolean' ? forceState : !state.paused;
        state.paused = desired;
        if (desired) {
            toggleOverlay(pauseOverlay, true);
        } else {
            toggleOverlay(pauseOverlay, false);
        }
        updateHud();
    }

    function setMute(flag) {
        audio.setMuted(flag);
        updateHud();
    }

    function bindKeyboard() {
        window.addEventListener('keydown', (event) => {
            if (event.repeat) return;
            switch (event.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    input.left = true;
                    event.preventDefault();
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    input.right = true;
                    event.preventDefault();
                    break;
                case 'Space':
                case 'KeyK':
                    input.shoot = true;
                    event.preventDefault();
                    break;
                case 'KeyP':
                case 'Escape':
                    togglePause();
                    event.preventDefault();
                    break;
                case 'KeyM':
                    setMute(!audio.muted);
                    event.preventDefault();
                    break;
            }
        });

        window.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    input.left = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    input.right = false;
                    break;
                case 'Space':
                case 'KeyK':
                    input.shoot = false;
                    break;
            }
        });
    }

    function bindTouch() {
        touchButtons.forEach((button) => {
            const action = button.dataset.touch;
            if (!action) return;
            button.addEventListener('pointerdown', (event) => {
                event.preventDefault();
                button.setPointerCapture(event.pointerId);
                if (action === 'left') input.left = true;
                if (action === 'right') input.right = true;
                if (action === 'fire') input.shoot = true;
                if (action === 'pause') togglePause();
                if (action === 'mute') setMute(!audio.muted);
            });
            button.addEventListener('pointerup', () => {
                if (action === 'left') input.left = false;
                if (action === 'right') input.right = false;
                if (action === 'fire') input.shoot = false;
            });
            button.addEventListener('pointercancel', () => {
                if (action === 'left') input.left = false;
                if (action === 'right') input.right = false;
                if (action === 'fire') input.shoot = false;
            });
        });
    }

    function bindUi() {
        if (startBtn) startBtn.addEventListener('click', startGame);
        if (restartBtn) restartBtn.addEventListener('click', restartGame);
        if (resumeBtn) resumeBtn.addEventListener('click', () => togglePause(false));
        if (pauseBtn) pauseBtn.addEventListener('click', () => togglePause());
        if (muteBtn) muteBtn.addEventListener('click', () => setMute(!audio.muted));
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (event) => {
                const value = Number(event.target.value);
                audio.setVolume(value);
            });
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden && state.started && !state.paused) {
                togglePause(true);
            }
        });
    }

    function init() {
        refreshPalette();
        resizeCanvas();
        createStars();
        bindKeyboard();
        bindTouch();
        bindUi();
        if (volumeSlider) {
            audio.setVolume(Number(volumeSlider.value));
        }
        updateHud();
        startLoop();
    }

    window.addEventListener('resize', () => {
        resizeCanvas();
    });

    init();
})();
