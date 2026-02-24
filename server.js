const path = require("path");
const fs = require("fs/promises");
const crypto = require("crypto");

require("dotenv").config();

const express = require("express");
const helmet = require("helmet");

const app = express();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const DATA_FILE = path.join(__dirname, "games.json");

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: false }));

function okJson(res, status, payload) {
  res.status(status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.send(JSON.stringify(payload));
}

function timingSafeEqualString(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  // timingSafeEqual exige des buffers de même taille
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

async function readGames() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    if (err && (err.code === "ENOENT" || err.code === "ENOTDIR")) return [];
    throw err;
  }
}

async function writeGames(games) {
  const data = JSON.stringify(games, null, 4) + "\n";
  await fs.writeFile(DATA_FILE, data, "utf8");
}

function requireAdminPasswordSet(res) {
  if (!ADMIN_PASSWORD) {
    okJson(res, 500, { error: "ADMIN_PASSWORD non configuré (crée un fichier .env)" });
    return false;
  }
  return true;
}

function checkAdmin(req, res) {
  if (!requireAdminPasswordSet(res)) return false;
  const { adminPassword } = req.body || {};
  if (!timingSafeEqualString(String(adminPassword || ""), ADMIN_PASSWORD)) {
    okJson(res, 401, { error: "Mot de passe admin incorrect" });
    return false;
  }
  return true;
}

function sanitizeGame(game) {
  const g = game || {};
  const clean = {
    title: String(g.title || "").trim(),
    image: String(g.image || "").trim(),
    link: String(g.link || "").trim(),
    mode: g.mode === "multiplayer" ? "multiplayer" : "solo"
  };

  if (g.hasModal) {
    clean.hasModal = true;
    clean.modalId = String(g.modalId || clean.title.toLowerCase().replace(/\s+/g, "-"))
      .trim()
      .replace(/\s+/g, "-");
    clean.modalTitle = String(g.modalTitle || "Installation").trim();
    clean.modalContent = String(g.modalContent || "").trim();
    // les modales utilisent href="#"
    clean.link = clean.link || "#";
  }

  if (!clean.title || !clean.image || !clean.link || !clean.mode) return null;
  return clean;
}

// ==========================
// API
// ==========================
app.get("/api/games", async (req, res) => {
  try {
    const games = await readGames();
    return okJson(res, 200, games);
  } catch (err) {
    console.error("GET /api/games:", err);
    return okJson(res, 500, { error: "Impossible de charger les jeux" });
  }
});

app.post("/api/check-admin", (req, res) => {
  if (!requireAdminPasswordSet(res)) return;
  const { password } = req.body || {};
  if (timingSafeEqualString(String(password || ""), ADMIN_PASSWORD)) {
    return okJson(res, 200, { ok: true });
  }
  return okJson(res, 401, { error: "Mot de passe incorrect" });
});

app.post("/api/add-game", async (req, res) => {
  if (!checkAdmin(req, res)) return;
  const { game } = req.body || {};
  const clean = sanitizeGame(game);
  if (!clean) return okJson(res, 400, { error: "Jeu invalide (title, image, link, mode requis)" });

  try {
    const games = await readGames();
    // Vérifier si le titre existe déjà
    const exists = games.some(g => g.title.toLowerCase() === clean.title.toLowerCase());
    if (exists) return okJson(res, 400, { error: "Ce jeu est déjà présent dans la liste" });

    games.push(clean);
    await writeGames(games);
    return okJson(res, 200, { success: true, message: "Jeu ajouté." });
  } catch (err) {
    console.error("POST /api/add-game:", err);
    return okJson(res, 500, { error: "Erreur serveur" });
  }
});

app.post("/api/update-game", async (req, res) => {
  if (!checkAdmin(req, res)) return;
  const { index, game } = req.body || {};
  const i = Number.parseInt(index, 10);
  if (!Number.isFinite(i) || i < 0) return okJson(res, 400, { error: "Index invalide" });

  const clean = sanitizeGame(game);
  if (!clean) return okJson(res, 400, { error: "Jeu invalide (title, image, link, mode requis)" });

  try {
    const games = await readGames();
    if (i >= games.length) return okJson(res, 400, { error: "Index hors limite" });

    // Vérifier si le nouveau titre existe déjà ailleurs
    const exists = games.some((g, idx) => idx !== i && g.title.toLowerCase() === clean.title.toLowerCase());
    if (exists) return okJson(res, 400, { error: "Un autre jeu porte déjà ce nom" });

    games[i] = clean;
    await writeGames(games);
    return okJson(res, 200, { success: true, message: "Jeu modifié." });
  } catch (err) {
    console.error("POST /api/update-game:", err);
    return okJson(res, 500, { error: "Erreur serveur" });
  }
});

app.post("/api/delete-game", async (req, res) => {
  if (!checkAdmin(req, res)) return;
  const { index } = req.body || {};
  const i = Number.parseInt(index, 10);
  if (!Number.isFinite(i) || i < 0) return okJson(res, 400, { error: "Index invalide" });

  try {
    const games = await readGames();
    if (i >= games.length) return okJson(res, 400, { error: "Index hors limite" });
    games.splice(i, 1);
    await writeGames(games);
    return okJson(res, 200, { success: true, message: "Jeu supprimé." });
  } catch (err) {
    console.error("POST /api/delete-game:", err);
    return okJson(res, 500, { error: "Erreur serveur" });
  }
});

// ==========================
// Site statique (doit être après /api)
// ==========================
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`NovaPlay: http://localhost:${PORT}`);
  console.log(`API:      http://localhost:${PORT}/api/games`);
});

