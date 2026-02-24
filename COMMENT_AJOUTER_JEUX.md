# 🎮 Comment Ajouter des Jeux à votre Site

Vous avez simplifié l'ajout de jeux ! Il suffit maintenant d'éditer l'array `GAMES_DATABASE` dans **game.js**.

## 📝 Ajouter un jeu simple

Ouvrez `game.js` et trouvez l'array `GAMES_DATABASE`. Ajoutez ceci avant la dernière accolade `];` :

```javascript
{
    title: "Nom du jeu",
    image: "URL de l'image (616x353)",
    link: "Lien de téléchargement",
    mode: "solo" ou "multiplayer"
}
```

### Exemple :
```javascript
{
    title: "Cyberpunk 2077",
    image: "https://example.com/image.jpg",
    link: "https://mega.nz/folder/xxxx",
    mode: "solo"
}
```

## 🔗 Ajouter un jeu avec Instructions (Modal)

Si votre jeu nécessite des instructions d'installation, ajoutez `hasModal`, `modalId`, `modalTitle` et `modalContent` :

```javascript
{
    title: "Mon Jeu",
    image: "URL",
    link: "#",  // Important: mettre "#" pour les jeux avec modal
    mode: "multiplayer",
    hasModal: true,
    modalId: "mon-jeu-unique",  // ID unique, sans espaces
    modalTitle: "Comment installer Mon Jeu ?",
    modalContent: `
        <ul>
            <li>Étape 1: Télécharger le fichier</li>
            <li>Étape 2: Extraire le ZIP</li>
        </ul>
        <div class="modal-btns">
            <a href="https://mega.nz/file/xxxxx" class="download-btn" target="_blank" rel="noopener">
                Télécharger le jeu
            </a>
        </div>
    `
}
```

## 📌 Points importants

| Propriété | Valeur | Exemple |
|-----------|--------|---------|
| `title` | Nom du jeu | `"Forza Horizon 4"` |
| `image` | URL image 616x353px | `"https://..."` |
| `link` | URL de téléchargement | `"https://gofile.io/d/xxx"` ou `"#"` si modal |
| `mode` | Type de jeu | `"solo"` ou `"multiplayer"` |
| `hasModal` | Affiche des instructions ? | `true` ou `false` |
| `modalId` | ID unique pour le modal | `"watch-dogs-2"` (unique !) |

## ⚙️ Comment ça marche ?

- Les jeux sont générés automatiquement au chargement de la page
- La barre de recherche fonctionne toujours
- Les fichiers HTML et CSS n'ont pas changé
- Les images doivent faire 616x353 pixels pour un rendu optimal

## 🚀 Conseil

Pour les URLs de téléchargement, vous pouvez obtenir les images de jeux depuis :
- Steam (steamstatic.com)
- IGDB
- Google Images

Gardez simplement les images avec le bon ratio 616x353 !

Amusez-vous bien ! 🎉
