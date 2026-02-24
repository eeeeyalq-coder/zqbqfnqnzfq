// POST /api/update-game — modifie un jeu (index dans la liste)
module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { adminPassword, index, game } = req.body || {};
    if (adminPassword === undefined || index === undefined || !game || !game.title || !game.image || !game.link || !game.mode) {
        return res.status(400).json({ error: 'Données manquantes (adminPassword, index, game)' });
    }

    const expectedPassword = process.env.ADMIN_PASSWORD;
    if (!expectedPassword || adminPassword !== expectedPassword) {
        return res.status(401).json({ error: 'Mot de passe admin incorrect' });
    }

    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';

    if (!token || !repo) {
        return res.status(500).json({ error: 'GITHUB_TOKEN ou GITHUB_REPO non configuré sur Vercel' });
    }

    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) {
        return res.status(500).json({ error: 'GITHUB_REPO doit être au format owner/repo' });
    }

    const i = parseInt(index, 10);
    if (isNaN(i) || i < 0) {
        return res.status(400).json({ error: 'Index invalide' });
    }

    const cleanGame = {
        title: String(game.title).trim(),
        image: String(game.image).trim(),
        link: String(game.link).trim(),
        mode: game.mode === 'multiplayer' ? 'multiplayer' : 'solo'
    };
    if (game.hasModal && game.modalId && game.modalTitle) {
        cleanGame.hasModal = true;
        cleanGame.modalId = String(game.modalId).trim().replace(/\s+/g, '-');
        cleanGame.modalTitle = String(game.modalTitle).trim();
        cleanGame.modalContent = game.modalContent ? String(game.modalContent).trim() : '';
        cleanGame.link = cleanGame.link || '#';
    }

    try {
        const apiBase = `https://api.github.com/repos/${owner}/${repoName}/contents`;
        const headers = {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        };

        const getRes = await fetch(`${apiBase}/games.json`, { headers });
        if (!getRes.ok) {
            const err = await getRes.text();
            throw new Error(`GitHub GET: ${getRes.status} ${err}`);
        }

        const file = await getRes.json();
        let decoded = Buffer.from(file.content, 'base64').toString('utf-8');
        decoded = decoded.replace(/\r\n/g, '\n').replace(/,(\s*[}\]])/g, '$1');
        let current;
        try {
            current = JSON.parse(decoded);
        } catch (parseErr) {
            throw new Error('games.json invalide: ' + parseErr.message);
        }
        if (!Array.isArray(current)) current = [];
        if (i >= current.length) {
            return res.status(400).json({ error: 'Index hors limite' });
        }

        current[i] = cleanGame;
        const content = Buffer.from(JSON.stringify(current, null, 4)).toString('base64');

        const putRes = await fetch(`${apiBase}/games.json`, {
            method: 'PUT',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Update game: ${cleanGame.title}`,
                content,
                sha: file.sha,
                branch
            })
        });

        if (!putRes.ok) {
            const errText = await putRes.text();
            throw new Error(`GitHub PUT: ${putRes.status} ${errText}`);
        }

        return res.status(200).json({ success: true, message: 'Jeu modifié.' });
    } catch (e) {
        console.error('api/update-game:', e.message);
        return res.status(500).json({ error: 'Erreur serveur: ' + e.message });
    }
};
