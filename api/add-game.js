// POST /api/add-game — ajoute un jeu (écrit dans GitHub via l’API)
module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { adminPassword, game } = req.body || {};
    if (!adminPassword || !game || !game.title || !game.image || !game.link || !game.mode) {
        return res.status(400).json({ error: 'Données manquantes (adminPassword + game avec title, image, link, mode)' });
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

        let current = [];
        let sha = null;

        const getRes = await fetch(`${apiBase}/games.json`, { headers });
        if (getRes.ok) {
            const file = await getRes.json();
            sha = file.sha;
            let decoded = Buffer.from(file.content, 'base64').toString('utf-8');
            decoded = decoded.replace(/\r\n/g, '\n').replace(/,(\s*[}\]])/g, '$1'); // enlève les virgules en trop (JSON invalide)
            let parsed;
            try {
                parsed = JSON.parse(decoded);
            } catch (parseErr) {
                throw new Error('games.json sur GitHub contient du JSON invalide: ' + parseErr.message);
            }
            current = Array.isArray(parsed) ? parsed : [];
        } else if (getRes.status !== 404) {
            const err = await getRes.text();
            throw new Error(`GitHub GET: ${getRes.status} ${err}`);
        }

        current.push(cleanGame);
        const content = Buffer.from(JSON.stringify(current, null, 4)).toString('base64');

        const putBody = {
            message: `Add game: ${cleanGame.title}`,
            content,
            branch
        };
        if (sha) putBody.sha = sha;

        const putRes = await fetch(`${apiBase}/games.json`, {
            method: 'PUT',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(putBody)
        });

        if (!putRes.ok) {
            const errText = await putRes.text();
            throw new Error(`GitHub PUT: ${putRes.status} ${errText}`);
        }

        return res.status(200).json({ success: true, message: 'Jeu ajouté.' });
    } catch (e) {
        console.error('api/add-game:', e.message);
        return res.status(500).json({ error: 'Erreur serveur: ' + e.message });
    }
}
