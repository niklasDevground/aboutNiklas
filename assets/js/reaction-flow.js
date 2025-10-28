(function () {
    const stage = document.getElementById('rf-stage');
    const circle = document.getElementById('rf-circle');
    const feedback = document.getElementById('rf-feedback');
    const scoreEl = document.getElementById('rf-score');
    const streakEl = document.getElementById('rf-streak');
    const levelEl = document.getElementById('rf-level');
    const startBtn = document.getElementById('rf-start');
    const resetBtn = document.getElementById('rf-reset');

    let running = false;
    let rafId = 0;
    let cycleStart = 0;
    let period = 1100; // ms
    const minPeriod = 450; // ms
    const basePeriod = period;
    let score = 0;
    let streak = 0;
    let level = 1;

    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    function wave(p) {
        // Smooth 0->1->0 using cosine
        // p in [0..1]
        return (1 - Math.cos(2 * Math.PI * p)) / 2;
    }

    function hueForPeriod(ms) {
        // Map speed to hue: slow -> teal(190), fast -> magenta(320)
        const t = clamp((basePeriod - ms) / (basePeriod - minPeriod), 0, 1);
        return 190 + t * 130;
    }

    function updateVisual(now) {
        const elapsed = now - cycleStart;
        const p = (elapsed % period) / period; // 0..1
        const w = wave(p); // 0..1
        const scale = 0.75 + 0.5 * w; // 0.75..1.25
        const hue = hueForPeriod(period);

        circle.style.transform = `scale(${scale.toFixed(4)})`;
        circle.style.background = `radial-gradient(42% 42% at 30% 30%, rgba(255,255,255,0.85), rgba(255,255,255,0.18) 40%, rgba(255,255,255,0.06) 70%), hsl(${hue} 90% 56%)`;
        circle.style.boxShadow = `0 0 0 8px hsl(${hue} 90% 56% / 0.08), 0 0 ${20 + w * 40}px 8px hsl(${hue} 90% 56% / ${0.15 + w * 0.25}), inset 0 0 40px rgba(0,0,0,0.25)`;

        if (running) {
            rafId = requestAnimationFrame(updateVisual);
        }
    }

    function setFeedback(text, kind) {
        feedback.textContent = text;
        if (kind === 'perfect') {
            feedback.style.color = 'hsl(150 85% 65%)';
        } else if (kind === 'good') {
            feedback.style.color = 'hsl(210 85% 70%)';
        } else if (kind === 'miss') {
            feedback.style.color = 'hsl(355 88% 68%)';
        } else {
            feedback.style.color = '';
        }
        if (text) {
            clearTimeout(setFeedback._t);
            setFeedback._t = setTimeout(() => { feedback.textContent = ''; }, 600);
        }
    }

    function refreshHUD() {
        scoreEl.textContent = String(score);
        streakEl.textContent = String(streak);
        levelEl.textContent = String(level);
    }

    function adjustDifficulty(hitQuality) {
        if (hitQuality === 'perfect') {
            period = Math.max(minPeriod, period * 0.94);
            streak += 1;
            score += 100 + Math.floor(streak * 5);
        } else if (hitQuality === 'good') {
            period = Math.max(minPeriod, period * 0.97);
            streak += 1;
            score += 60 + Math.floor(streak * 3);
        }
        // Update level based on inverse period
        const speedProgress = (basePeriod - period) / (basePeriod - minPeriod);
        level = 1 + Math.floor(speedProgress * 9); // 1..10
    }

    function miss() {
        setFeedback('Miss', 'miss');
        if (navigator.vibrate) { try { navigator.vibrate(35); } catch (e) {} }
        streak = 0;
        // Gentle slowdown after miss
        period = clamp(period * 1.06, minPeriod, basePeriod);
        refreshHUD();
    }

    function judgeClick() {
        // Determine position within cycle relative to peak at p=0.5
        const now = performance.now();
        const p = ((now - cycleStart) % period) / period; // 0..1
        const dist = Math.abs(p - 0.5);
        // consider wrap-around (e.g., near 0 or 1)
        const wrapDist = Math.min(dist, Math.abs((p + 1) - 0.5), Math.abs((p - 1) - 0.5));

        // Window sizes shrink slightly as speed increases
        const speedT = clamp((basePeriod - period) / (basePeriod - minPeriod), 0, 1);
        const goodWindow = Math.max(0.075, 0.105 - speedT * 0.02);    // ~115ms -> ~75ms
        const perfectWindow = Math.max(0.035, 0.06 - speedT * 0.015); // ~66ms -> ~35ms

        if (wrapDist <= perfectWindow) {
            setFeedback('Perfect', 'perfect');
            adjustDifficulty('perfect');
        } else if (wrapDist <= goodWindow) {
            setFeedback('Good', 'good');
            adjustDifficulty('good');
        } else {
            miss();
            refreshHUD();
            return;
        }

        refreshHUD();
        // restart cycle on hit so the user re-centers
        cycleStart = now;
    }

    function start() {
        if (running) return;
        running = true;
        startBtn.disabled = true;
        resetBtn.disabled = false;
        cycleStart = performance.now();
        rafId = requestAnimationFrame(updateVisual);
    }

    function resetGame(full = true) {
        cancelAnimationFrame(rafId);
        running = false;
        startBtn.disabled = false;
        if (full) {
            period = basePeriod;
            score = 0;
            streak = 0;
            level = 1;
            feedback.textContent = '';
            refreshHUD();
        }
        // snap visuals back
        const hue = hueForPeriod(period);
        circle.style.transform = 'scale(0.9)';
        circle.style.background = `radial-gradient(42% 42% at 30% 30%, rgba(255,255,255,0.85), rgba(255,255,255,0.18) 40%, rgba(255,255,255,0.06) 70%), hsl(${hue} 90% 56%)`;
        circle.style.boxShadow = `0 0 0 8px hsl(${hue} 90% 56% / 0.08), 0 0 28px 8px hsl(${hue} 90% 56% / 0.25), inset 0 0 40px rgba(0,0,0,0.25)`;
    }

    // Interactions
    stage.addEventListener('click', () => {
        if (!running) return;
        judgeClick();
    });
    // Space/Enter accessibility
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'Enter') {
            if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
            e.preventDefault();
            if (running) {
                judgeClick();
            }
        }
    });

    startBtn.addEventListener('click', start);
    resetBtn.addEventListener('click', () => resetGame(true));

    // init
    refreshHUD();
    resetGame(false);
})();
