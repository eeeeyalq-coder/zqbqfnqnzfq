// ============================================
// NOVAPLAY — game.js v3
// Optimisé : debounce, stats, résultats, IntersectionObserver
// ============================================

const GAMES_PER_PAGE = 40;
let currentPage = 1;
let allGames = [];
let filteredGames = [];
let currentFilter = 'all';
let searchDebounce = null;

// ── Génère les cartes ──────────────────────────────────────────
function generateGameElements(games) {
    const grid = document.getElementById('gamesGrid');
    if (!grid) return;

    grid.innerHTML = '';

    const start = (currentPage - 1) * GAMES_PER_PAGE;
    const slice = games.slice(start, start + GAMES_PER_PAGE);

    if (slice.length === 0) {
        grid.innerHTML = '<p class="coming-soon-message">Aucun jeu trouvé pour cette recherche.</p>';
        return;
    }

    const frag = document.createDocumentFragment();

    slice.forEach((game, idx) => {
        const a = document.createElement('a');
        a.className = 'jeu-thumb-link animating';
        a.href = game.link;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.setAttribute('data-title', game.title);
        a.setAttribute('data-mode', game.mode);
        a.setAttribute('role', 'listitem');
        a.setAttribute('aria-label', game.title + ' — ' + (game.mode === 'solo' ? 'Solo' : 'Multijoueur'));
        a.style.animationDelay = (0.04 + idx * 0.02) + 's';
        a.addEventListener('animationend', () => {
            a.classList.remove('animating');
            a.style.animationDelay = '';
        }, { once: true });

        // Image (lazy)
        const img = document.createElement('img');
        img.className = 'jeu-thumb-img';
        img.src = game.image;
        img.alt = game.title;
        img.width = 616;
        img.height = 353;
        img.loading = 'lazy';
        img.decoding = 'async';

        // Badge mode
        const bw = document.createElement('div');
        bw.className = 'badge-mode-wrapper';
        const b = document.createElement('span');
        b.className = 'badge-mode-tag ' + (game.mode === 'solo' ? 'solo' : 'multiplayer');
        b.textContent = game.mode === 'solo' ? 'Solo' : 'Multi';
        bw.appendChild(b);

        // Hover overlay
        const hover = document.createElement('div');
        hover.className = 'jeu-title-hover';

        const titleTxt = document.createElement('span');
        titleTxt.className = 'jeu-title-text';
        titleTxt.textContent = game.title;

        const sub = document.createElement('div');
        sub.className = 'jeu-title-sub';

        const hint = document.createElement('span');
        hint.className = 'jeu-download-hint';
        hint.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Télécharger`;

        sub.appendChild(hint);
        hover.appendChild(titleTxt);
        hover.appendChild(sub);

        a.appendChild(img);
        a.appendChild(bw);
        a.appendChild(hover);

        // Modal cards
        if (game.hasModal) {
            a.id = game.modalId + '-link';
            a.href = '#';
            a.removeAttribute('target');
            a.removeAttribute('rel');
            a.addEventListener('click', (e) => {
                e.preventDefault();
                const bg = document.getElementById(game.modalId + '-modal-bg');
                if (bg) {
                    bg.style.display = 'flex';
                    bg.offsetHeight; // reflow
                    bg.classList.add('show');
                    document.body.style.overflow = 'hidden';
                }
            });
        }

        frag.appendChild(a);
    });

    grid.appendChild(frag);
}

// ── Génère les modales ─────────────────────────────────────────
function generateModals(games) {
    document.querySelectorAll('.modal-bg').forEach(m => m.remove());

    games.filter(g => g.hasModal).forEach(game => {
        const bg = document.createElement('div');
        bg.id = game.modalId + '-modal-bg';
        bg.className = 'modal-bg';
        bg.style.display = 'none';

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.role = 'dialog';
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', game.modalId + '-title');

        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-btn';
        closeBtn.setAttribute('aria-label', 'Fermer');
        closeBtn.textContent = '×';

        const h2 = document.createElement('h2');
        h2.id = game.modalId + '-title';
        h2.textContent = game.modalTitle;

        const content = document.createElement('div');
        content.innerHTML = game.modalContent || '';

        modal.appendChild(closeBtn);
        modal.appendChild(h2);
        modal.appendChild(content);
        bg.appendChild(modal);
        document.body.appendChild(bg);

        const close = () => {
            bg.classList.remove('show');
            setTimeout(() => { bg.style.display = 'none'; document.body.style.overflow = ''; }, 500);
        };
        closeBtn.addEventListener('click', close);
        bg.addEventListener('click', e => { if (e.target === bg) close(); });
        document.addEventListener('keydown', e => {
            if (bg.classList.contains('show') && e.key === 'Escape') close();
        });
    });
}

// ── Pagination ─────────────────────────────────────────────────
function renderPagination(total) {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    container.innerHTML = '';
    const pages = Math.ceil(total / GAMES_PER_PAGE);
    if (pages <= 1) return;

    const go = (p) => {
        currentPage = p;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        updateDisplay();
    };

    // Prev
    if (currentPage > 1) {
        const btn = document.createElement('button');
        btn.className = 'pagination-btn';
        btn.setAttribute('aria-label', 'Page précédente');
        btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
        btn.addEventListener('click', () => go(currentPage - 1));
        container.appendChild(btn);
    }

    // Numbers (smart ellipsis)
    let list = [];
    if (pages <= 7) {
        list = Array.from({ length: pages }, (_, i) => i + 1);
    } else {
        list = [1];
        if (currentPage > 3) list.push('…');
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(pages - 1, currentPage + 1); i++) list.push(i);
        if (currentPage < pages - 2) list.push('…');
        list.push(pages);
    }

    list.forEach(p => {
        if (p === '…') {
            const sep = document.createElement('span');
            sep.className = 'pagination-sep';
            sep.textContent = '…';
            container.appendChild(sep);
        } else {
            const btn = document.createElement('button');
            btn.className = 'pagination-btn' + (p === currentPage ? ' active' : '');
            btn.textContent = p;
            btn.setAttribute('aria-label', 'Page ' + p);
            if (p === currentPage) btn.setAttribute('aria-current', 'page');
            btn.addEventListener('click', () => go(p));
            container.appendChild(btn);
        }
    });

    // Next
    if (currentPage < pages) {
        const btn = document.createElement('button');
        btn.className = 'pagination-btn';
        btn.setAttribute('aria-label', 'Page suivante');
        btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
        btn.addEventListener('click', () => go(currentPage + 1));
        container.appendChild(btn);
    }
}

// ── Update results info ────────────────────────────────────────
function updateResultsInfo() {
    const el = document.getElementById('resultsInfo');
    if (!el) return;

    const total = filteredGames.length;

    if (total === 0) {
        el.innerHTML = 'Aucun jeu trouvé.';
    } else {
        el.innerHTML = '';
    }
}

// ── Full display update ────────────────────────────────────────
function updateDisplay() {
    generateGameElements(filteredGames);
    generateModals(filteredGames);
    renderPagination(filteredGames.length);
    updateResultsInfo();
}

// ── Apply search + filter ──────────────────────────────────────
function applyFilters() {
    const query = (document.getElementById('gameSearch')?.value || '').trim().toLowerCase();

    filteredGames = allGames.filter(game => {
        const title = (game.title || '').toLowerCase();
        const mode = game.mode || '';
        return title.includes(query) && (currentFilter === 'all' || mode === currentFilter);
    });

    currentPage = 1;
    updateDisplay();
}

// ── Loading state ──────────────────────────────────────────────
function showLoadingState() {
    const grid = document.getElementById('gamesGrid');
    if (!grid) return;
    grid.innerHTML = `
        <div class="games-loading" style="grid-column:1/-1">
            <span>Chargement des jeux</span>
            <div class="loading-dots">
                <span></span><span></span><span></span>
            </div>
        </div>`;
}

// ── Init ───────────────────────────────────────────────────────
async function initGamePage() {
    const grid = document.getElementById('gamesGrid');
    if (!grid) return;

    showLoadingState();

    const tryFetch = async (path) => {
        try {
            const res = await fetch(path, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                const games = Array.isArray(data) ? data : (data.games || data.items || []);
                if (games.length > 0) return games;
            }
        } catch (e) {
            console.warn('NovaPlay: échec de ' + path, e.message);
        }
        return null;
    };

    allGames = await tryFetch('games.json') ||
        await tryFetch('/games.json') ||
        await tryFetch('/api/games') ||
        [];

    if (allGames.length === 0) {
        grid.innerHTML = `
            <div class="coming-soon-message" style="grid-column:1/-1">
                <p>Oups ! Aucun jeu n'a été trouvé.</p>
                <p style="font-size:0.8rem;margin-top:10px;color:var(--text-muted)">
                    Vérifie que games.json est présent et accessible.
                </p>
            </div>`;
    }

    // Compute stats
    const solo = allGames.filter(g => g.mode === 'solo').length;
    const multi = allGames.filter(g => g.mode === 'multiplayer').length;

    window.dispatchEvent(new CustomEvent('novaplay:gamesLoaded', {
        detail: { count: allGames.length, solo, multi }
    }));

    filteredGames = [...allGames];
    applyFilters();

    // Search with debounce (200ms)
    const searchEl = document.getElementById('gameSearch');
    if (searchEl) {
        searchEl.addEventListener('input', () => {
            clearTimeout(searchDebounce);
            searchDebounce = setTimeout(applyFilters, 200);
        });
        // Support Escape to clear
        searchEl.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') { searchEl.value = ''; applyFilters(); }
        });
    }

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.getAttribute('data-filter');
            applyFilters();
        });
    });
}

// ── Boot ───────────────────────────────────────────────────────
if (document.body.classList.contains('page-jeux')) {
    initGamePage();
}