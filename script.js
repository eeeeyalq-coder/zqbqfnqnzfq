// ============================================
// NOVAPLAY — script.js v3
// Effets UI communs (mouse follower géré inline dans index.html)
// ============================================

// ── Discord notification (page d'accueil) ──────────────────────
function initDiscordNotification() {
    if (!document.body.classList.contains('page-accueil')) return;

    const notification = document.getElementById('discordNotification');
    const closeBtn     = document.getElementById('discordNotificationClose');
    if (!notification) return;

    if (!sessionStorage.getItem('discordNotificationClosed')) {
        setTimeout(() => notification.classList.add('show'), 600);
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
            sessionStorage.setItem('discordNotificationClosed', '1');
        });
    }
}

// ── Typewriter (page d'accueil) ────────────────────────────────
function initTypewriterEffect() {
    if (!document.body.classList.contains('page-accueil')) return;

    const el = document.getElementById('animatedTitle');
    if (!el) return;

    const text = 'NovaPlay';
    let i      = 0;
    let del    = false;

    function tick() {
        el.textContent = del ? text.slice(0, i - 1) : text.slice(0, i + 1);
        del ? i-- : i++;

        if (!del && i === text.length)         { del = true;  return setTimeout(tick, 2200); }
        if (del  && i === 0)                   { del = false; return setTimeout(tick, 600);  }
        setTimeout(tick, del ? 90 : 145);
    }
    tick();
}

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initDiscordNotification();
    initTypewriterEffect();
});