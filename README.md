# 🤖 CSEM - Custom Selection Engine Manager

Gestionnaire de références de GPT personnalisés avec interface web intuitive.

## 📋 Fonctionnalités

- ➕ **Ajouter** des références de Custom GPT avec nom, référence et description
- 🗑️ **Supprimer** des références existantes
- ✓ **Sélectionner** une référence active parmi toutes celles enregistrées
- 💾 **Persistance automatique** des données avec LocalStorage
- 🎨 Interface moderne et responsive
- 🔔 Notifications pour chaque action

## 🚀 Installation

Aucune installation nécessaire ! Il s'agit d'une application web statique.

### Utilisation locale

1. Clonez le repository :
```bash
git clone https://github.com/suaniafluence/csem.git
cd csem
```

2. Ouvrez simplement `index.html` dans votre navigateur web préféré :
```bash
# Sur Linux/Mac
open index.html

# Ou avec un serveur local (optionnel)
python3 -m http.server 8000
# Puis ouvrez http://localhost:8000
```

## 💡 Utilisation

### Ajouter une référence

1. Remplissez le formulaire en haut de la page :
   - **Nom du GPT** : Le nom de votre Custom GPT (ex: "Analyseur de Code")
   - **Référence** : L'ID ou l'URL de votre GPT (ex: "g-abc123xyz" ou "https://...")
   - **Description** (optionnel) : Une description de ce que fait ce GPT

2. Cliquez sur le bouton "➕ Ajouter"

### Sélectionner une référence

- Cliquez sur le bouton "✓ Sélectionner" sur la référence de votre choix
- La référence sélectionnée apparaît dans la section "Référence sélectionnée" en bas de la page
- La référence sélectionnée est mise en surbrillance en vert dans la liste

### Supprimer une référence

- Cliquez sur le bouton "🗑️ Supprimer" sur la référence à supprimer
- Confirmez la suppression dans la boîte de dialogue

## 🏗️ Structure du projet

```
csem/
├── index.html      # Interface utilisateur
├── styles.css      # Styles et design
├── app.js          # Logique de l'application
└── README.md       # Documentation
```

## 🔧 Fonctionnalités techniques

- **Persistance** : Utilise LocalStorage du navigateur pour sauvegarder les données
- **Responsive** : S'adapte à tous les écrans (mobile, tablette, desktop)
- **Animations** : Transitions fluides et notifications élégantes
- **Validation** : Vérification des champs obligatoires
- **Sécurité** : Échappement HTML pour prévenir les injections XSS

## 📊 API JavaScript (pour développeurs)

L'application expose un objet global `gptManager` avec les méthodes suivantes :

```javascript
// Ajouter une référence
gptManager.addGPT();

// Supprimer une référence
gptManager.removeGPT(id);

// Sélectionner une référence
gptManager.selectGPT(id);

// Exporter les données (bonus)
gptManager.exportData();

// Importer des données (bonus)
gptManager.importData(file);
```

## 🎨 Personnalisation

Les couleurs peuvent être modifiées dans `styles.css` en changeant les variables CSS :

```css
:root {
    --primary-color: #2563eb;
    --success-color: #10b981;
    --danger-color: #ef4444;
    /* etc. */
}
```

## 🌐 Compatibilité

- Chrome/Edge (recommandé)
- Firefox
- Safari
- Tout navigateur moderne supportant ES6 et LocalStorage

## 📝 Licence

MIT

## 👤 Auteur

Suan (suan.tay.job@gmail.com)

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.
