# Admin jeux (Vercel + GitHub)

Pour que la page **admin** et l’API fonctionnent sur Vercel, configure ces variables d’environnement dans le projet Vercel.

## 1. Définir le mot de passe admin (et les autres variables)

1. Va sur **[vercel.com](https://vercel.com)** et connecte-toi.
2. Ouvre ton **projet** (celui du site NovaPlay).
3. Clique sur l’onglet **Settings** (Paramètres).
4. Dans le menu de gauche, clique sur **Environment Variables**.
5. Tu vois un formulaire :
   - **Key (Nom)** : tape `ADMIN_PASSWORD`
   - **Value (Valeur)** : tape ton mot de passe (celui que tu utiliseras sur la page admin)
   - Choisis **Production**, **Preview**, **Development** si tu veux que ça marche partout (ou au moins **Production**).
6. Clique sur **Save**.
7. **Important :** refais un déploiement (onglet **Deployments** → les 3 points sur le dernier déploiement → **Redeploy**) pour que la nouvelle variable soit prise en compte.

Résumé des variables à créer (même écran) :

| Key (Nom)        | Value (Valeur) |
|-------------------|----------------|
| `GITHUB_REPO`     | `ton-user/807shopc-main` (remplace par ton user et ton repo) |
| `GITHUB_BRANCH`   | `main` (optionnel) |
| `GITHUB_TOKEN`    | ton token GitHub (voir section 2) |
| `ADMIN_PASSWORD`  | le mot de passe pour la page admin |

## 2. Créer un token GitHub (obligatoire pour ajouter des jeux)

Si tu as une erreur **403 "Resource not accessible by personal access token"**, le token n’a pas les bons droits.

### Option A — Token classique (recommandé, plus simple)

1. GitHub → ton **avatar** (en haut à droite) → **Settings**.
2. Menu de gauche en bas → **Developer settings**.
3. **Personal access tokens** → **Tokens (classic)** → **Generate new token (classic)**.
4. Donne un nom (ex. `Vercel NovaPlay`).
5. **Expiration** : 90 days ou No expiration.
6. **Scopes** : coche **repo** (tout le bloc, ça donne accès aux repos).
7. **Generate token** → copie le token (il ne s’affichera plus). Colle-le dans `GITHUB_TOKEN` sur Vercel.

### Option B — Token fine-grained

1. **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
2. **Repository access** : choisis **Only select repositories** et sélectionne le repo du site (ex. `807shopc-main`).
3. **Permissions** → **Repository permissions** : pour **Contents**, mets **Read and write**.
4. Génère et copie le token → `GITHUB_TOKEN` sur Vercel.

Après avoir changé le token sur Vercel, refais un **Redeploy** pour que la nouvelle variable soit prise en compte.

## 3. Repo et fichier `games.json`

- Le site doit être déployé depuis un repo GitHub (ex. `807shopc-main`).
- Le fichier **`games.json`** doit être à la racine de ce repo (il est déjà dans le projet).
- `GITHUB_REPO` = exactement `utilisateur/nom-du-repo` (ex. `johndoe/807shopc-main`).

## 4. Utilisation

- **Page admin :** `https://ton-site.vercel.app/admin.html`
- Connecte-toi avec le mot de passe défini dans `ADMIN_PASSWORD`.
- Ajoute un jeu : après envoi, il est écrit dans `games.json` sur GitHub. Tous les visiteurs voient le nouveau jeu au prochain chargement.

Pas de base de données, tout est stocké dans le repo (gratuit, utilisation très large).
