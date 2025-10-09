(function () {
    const gridEl = document.getElementById('sdk-grid');
    const statusEl = document.getElementById('sdk-status');
    const diffEl = document.getElementById('sdk-difficulty');
    const btnNew = document.getElementById('sdk-new');
    const btnCheck = document.getElementById('sdk-check');
    const btnSolve = document.getElementById('sdk-solve');
    const btnClear = document.getElementById('sdk-clear');

    if (!gridEl) return;

    const N = 9;
    let puzzle = new Array(81).fill(0);
    let solution = new Array(81).fill(0);
    let selectedNumber = null; // 1-9 or null
    let errorFlags = new Array(81).fill(false);
    let errorCount = 0;

    function rc(r, c) { return r * N + c; }
    function getRow(i) { return Math.floor(i / N); }
    function getCol(i) { return i % N; }

    function isValid(board, r, c, val) {
        for (let i = 0; i < N; i++) {
            if (board[rc(r, i)] === val) return false;
            if (board[rc(i, c)] === val) return false;
        }
        const br = Math.floor(r / 3) * 3;
        const bc = Math.floor(c / 3) * 3;
        for (let rr = 0; rr < 3; rr++) {
            for (let cc = 0; cc < 3; cc++) {
                if (board[rc(br + rr, bc + cc)] === val) return false;
            }
        }
        return true;
    }

    function shuffled(nums) {
        const a = nums.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function solve(board, countSolutions = false, limit = 2) {
        const arr = board.slice();
        function inner() {
            let idx = arr.indexOf(0);
            if (idx === -1) return 1;
            const r = getRow(idx), c = getCol(idx);
            for (const val of shuffled([1,2,3,4,5,6,7,8,9])) {
                if (isValid(arr, r, c, val)) {
                    arr[idx] = val;
                    const res = inner();
                    if (!countSolutions && res === 1) return 1;
                    if (countSolutions) {
                        if (res === 1) solutionsFound++;
                        if (solutionsFound >= limit) return 0;
                    }
                    arr[idx] = 0;
                }
            }
            return countSolutions ? 0 : 0;
        }
        let solutionsFound = 0;
        const ok = inner();
        return { ok: ok === 1 || solutionsFound === 1, board: ok === 1 ? arr : null, solutionsFound };
    }

    function generateFullGrid() {
        const board = new Array(81).fill(0);
        function fillCell(i = 0) {
            if (i >= 81) return true;
            const r = getRow(i), c = getCol(i);
            for (const val of shuffled([1,2,3,4,5,6,7,8,9])) {
                if (isValid(board, r, c, val)) {
                    board[i] = val;
                    if (fillCell(i + 1)) return true;
                    board[i] = 0;
                }
            }
            return false;
        }
        fillCell(0);
        return board;
    }

    function generatePuzzle(difficulty = 'medium') {
        const full = generateFullGrid();
        // target clues per difficulty (approximate)
        const target = difficulty === 'easy' ? 46 : difficulty === 'hard' ? 28 : 34;
        const order = shuffled([...Array(81).keys()]);
        const puzzle = full.slice();
        for (const idx of order) {
            const saved = puzzle[idx];
            puzzle[idx] = 0;
            // enforce unique solution by counting up to 2
            const { solutionsFound } = solve(puzzle, true, 2);
            if (solutionsFound !== 1) {
                puzzle[idx] = saved; // revert removal
            }
            if (puzzle.filter(x => x !== 0).length <= target) break;
        }
        return { puzzle, solution: full };
    }

    function countDigits() {
        const counts = Array(10).fill(0);
        for (let i = 0; i < 81; i++) {
            const v = puzzle[i];
            if (v >= 1 && v <= 9) counts[v]++;
        }
        return counts;
    }

    function updateStatus() {
        if (errorCount > 0) setStatus(`Fehler: ${errorCount}/4`);
        else setStatus('');
    }

    function validateCell(i) {
        const v = puzzle[i];
        const inp = gridEl.children[i]?.querySelector('input');
        if (!inp || v === 0) {
            if (inp) inp.classList.remove('invalid');
            errorFlags[i] = false;
            updateStatus();
            return true;
        }
        const r = getRow(i), c = getCol(i);
        const tmp = puzzle[i];
        puzzle[i] = 0;
        const valid = isValid(puzzle, r, c, v);
        puzzle[i] = tmp;
        if (!valid) {
            inp.classList.add('invalid');
            if (!errorFlags[i]) {
                errorFlags[i] = true;
                errorCount++;
                if (errorCount >= 4) {
                    setStatus('4 Fehler – neues Sudoku wird gestartet …');
                    startNew();
                    return false;
                }
            }
        } else {
            inp.classList.remove('invalid');
            errorFlags[i] = false;
        }
        updateStatus();
        return valid;
    }

    function validateAll() {
        for (let i = 0; i < 81; i++) validateCell(i);
    }

    function setSelectedNumber(n) {
        selectedNumber = n;
        const palette = document.getElementById('sdk-palette');
        if (!palette) return;
        palette.querySelectorAll('.sdk-digit').forEach(btn => btn.classList.remove('active'));
        if (n) {
            const b = palette.querySelector(`[data-digit="${n}"]`);
            if (b) b.classList.add('active');
        }
    }

    function updatePaletteCompletion() {
        const counts = countDigits();
        const palette = document.getElementById('sdk-palette');
        if (!palette) return;
        palette.querySelectorAll('.sdk-digit').forEach(btn => {
            const d = Number(btn.dataset.digit);
            const done = counts[d] >= 9;
            btn.classList.toggle('done', done);
            if (done) btn.title = 'Komplett gesetzt'; else btn.removeAttribute('title');
        });
    }

    function placeNumberAt(i, n) {
        const inp = gridEl.children[i]?.querySelector('input');
        if (!inp || inp.disabled) return;
        const ch = n ? String(n) : '';
        inp.value = ch;
        puzzle[i] = n || 0;
        // reset counted flag for this cell on change
        errorFlags[i] = false;
        validateCell(i);
        updatePaletteCompletion();
    }

    function renderGrid() {
        gridEl.innerHTML = '';
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                const i = rc(r, c);
                const cell = document.createElement('div');
                cell.className = 'sdk-cell';
                // Thin borders are defined in CSS (1px all around).
                // For 3x3 separators, add thick top/left and remove the adjacent bottom/right
                // to avoid "double" lines (1px + 2px next to each other).
                if (r === 3 || r === 6) {
                    cell.style.borderTop = '2px solid var(--accent)';
                }
                if (c === 3 || c === 6) {
                    cell.style.borderLeft = '2px solid var(--accent)';
                }
                if (r === 2 || r === 5) {
                    cell.style.borderBottomWidth = '0';
                }
                if (c === 2 || c === 5) {
                    cell.style.borderRightWidth = '0';
                }
                const input = document.createElement('input');
                input.inputMode = 'numeric';
                input.autocomplete = 'off';
                input.maxLength = 1;
                const val = puzzle[i];
                if (val) {
                    input.value = String(val);
                    input.disabled = true;
                    input.classList.add('prefilled');
                }
                input.addEventListener('input', (e) => {
                    const ch = e.target.value.replace(/[^1-9]/g, '');
                    e.target.value = ch;
                    puzzle[i] = ch ? Number(ch) : 0;
                    // new value -> reset counted flag
                    errorFlags[i] = false;
                    validateCell(i);
                    updatePaletteCompletion();
                });
                // Mouse placement with palette
                cell.addEventListener('click', () => {
                    if (selectedNumber) {
                        placeNumberAt(i, selectedNumber);
                    }
                });
                input.addEventListener('focus', () => highlightPeers(r,c,true));
                input.addEventListener('blur', () => highlightPeers(r,c,false));
                cell.appendChild(input);
                gridEl.appendChild(cell);
            }
        }
        ensurePalette();
        updatePaletteCompletion();
    }

    function highlightPeers(r, c, on) {
        // could be extended to visually highlight, kept minimal for now
    }

    function setStatus(msg) { statusEl.textContent = msg; }

    function checkGrid() {
        let ok = true;
        // clear invalid
        gridEl.querySelectorAll('input').forEach(inp => inp.classList.remove('invalid'));
        for (let i = 0; i < 81; i++) {
            const v = puzzle[i];
            if (v === 0) { ok = false; continue; }
            const r = getRow(i), c = getCol(i);
            // temporarily clear cell and revalidate
            const tmp = puzzle[i];
            puzzle[i] = 0;
            const valid = isValid(puzzle, r, c, v);
            puzzle[i] = tmp;
            if (!valid) {
                ok = false;
                const input = gridEl.children[i].querySelector('input');
                input && input.classList.add('invalid');
            }
        }
        if (ok) {
            setStatus('Sieht gut aus ✔️');
        } else {
            setStatus('Es gibt noch Fehler oder Lücken.');
        }
    }

    function solveCurrent() {
        const { ok, board } = solve(puzzle);
        if (!ok || !board) {
            setStatus('Keine eindeutige Lösung gefunden.');
            return;
        }
        puzzle = board.slice();
        // render values into inputs
        for (let i = 0; i < 81; i++) {
            const inp = gridEl.children[i].querySelector('input');
            if (inp && !inp.disabled) inp.value = String(puzzle[i] || '');
        }
        setStatus('Gelöst ✅');
    }

    function clearNonPrefilled() {
        for (let i = 0; i < 81; i++) {
            const inp = gridEl.children[i].querySelector('input');
            if (inp && !inp.disabled) { inp.value = ''; puzzle[i] = 0; }
        }
        setStatus('');
    }

    function startNew() {
        setStatus('Erzeuge neues Sudoku …');
        const d = diffEl ? diffEl.value : 'medium';
        const gen = generatePuzzle(d);
        puzzle = gen.puzzle.slice();
        solution = gen.solution.slice();
        errorFlags = new Array(81).fill(false);
        errorCount = 0;
        setSelectedNumber(null);
        renderGrid();
        setStatus('Viel Spaß!');
    }

    function ensurePalette() {
        if (document.getElementById('sdk-palette')) return;
        const palette = document.createElement('div');
        palette.id = 'sdk-palette';
        palette.className = 'sdk-palette';
        for (let d = 1; d <= 9; d++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'sdk-digit';
            btn.dataset.digit = String(d);
            btn.textContent = String(d);
            btn.addEventListener('click', () => {
                setSelectedNumber(d === selectedNumber ? null : d);
            });
            palette.appendChild(btn);
        }
        gridEl.insertAdjacentElement('afterend', palette);
        updateStatus();
    }

    // initial render
    startNew();

    btnNew && btnNew.addEventListener('click', startNew);
    btnClear && btnClear.addEventListener('click', clearNonPrefilled);
    btnCheck && btnCheck.addEventListener('click', checkGrid);
    btnSolve && btnSolve.addEventListener('click', solveCurrent);
})();
