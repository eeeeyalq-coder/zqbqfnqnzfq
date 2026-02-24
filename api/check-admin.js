// POST /api/check-admin — vérifie le mot de passe admin (pour la page de connexion)
module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { password } = req.body || {};
    const expected = process.env.ADMIN_PASSWORD;

    if (!expected) {
        return res.status(500).json({ error: 'ADMIN_PASSWORD non configuré' });
    }

    if (password === expected) {
        return res.status(200).json({ ok: true });
    }

    return res.status(401).json({ error: 'Mot de passe incorrect' });
};
