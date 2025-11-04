# Convertisseur PDF vers RTF avec Custom GPT

Site web simple et résilient pour convertir des PDFs en RTF en utilisant un Custom GPT OpenAI.

## Fonctionnalités

- Upload de multiples PDFs (jusqu'à 150 fichiers)
- Traitement séquentiel résilient avec retry automatique
- Sauvegarde de l'état pour reprendre après une interruption
- Interface web moderne et intuitive
- Support des Custom GPT OpenAI ou GPT-4 standard
- Suivi en temps réel de la progression

## Installation

### 1. Prérequis

- Python 3.8+
- Clé API OpenAI

### 2. Installation des dépendances

```bash
# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement virtuel
# Sur Linux/Mac:
source venv/bin/activate
# Sur Windows:
venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt
```

### 3. Configuration

Créer un fichier `.env` à la racine du projet:

```bash
cp .env.example .env
```

Éditer le fichier `.env` et ajouter votre clé API OpenAI:

```
OPENAI_API_KEY=sk-your-api-key-here
```

## Utilisation

### 1. Démarrer le serveur

```bash
python app.py
```

Le serveur démarre sur `http://localhost:5000`

### 2. Utiliser l'interface web

1. Ouvrez votre navigateur à `http://localhost:5000`
2. (Optionnel) Entrez l'ID de votre Custom GPT (ex: `asst_xxxxxxxxxxxxx`)
   - Laissez vide pour utiliser GPT-4 standard
3. Cliquez sur la zone d'upload ou glissez-déposez vos PDFs
4. Cliquez sur "Envoyer les fichiers"
5. Cliquez sur "Démarrer la conversion"
6. Suivez la progression en temps réel

### 3. Récupérer les fichiers convertis

Les fichiers RTF convertis sont sauvegardés dans le dossier `outputs/`

## Comment obtenir l'ID de votre Custom GPT

1. Allez sur [OpenAI Platform](https://platform.openai.com/)
2. Naviguez vers "Assistants"
3. Sélectionnez votre Custom GPT
4. Copiez l'ID qui commence par `asst_`

## Architecture technique

### Résilience

- **Retry automatique**: 3 tentatives avec backoff exponentiel (2s, 4s, 8s)
- **Sauvegarde d'état**: L'état du traitement est sauvegardé dans `processing_state.json`
- **Reprise après crash**: Si le serveur crash, relancez-le et le traitement reprendra automatiquement

### Structure des fichiers

```
csem/
├── app.py                    # Backend Flask
├── templates/
│   └── index.html           # Interface web
├── uploads/                 # PDFs uploadés (créé automatiquement)
├── outputs/                 # RTFs générés (créé automatiquement)
├── processing_state.json    # État du traitement (créé automatiquement)
├── requirements.txt         # Dépendances Python
├── .env                     # Configuration (à créer)
└── README.md               # Ce fichier
```

### Endpoints API

- `GET /` - Interface web
- `POST /upload` - Upload des PDFs
- `POST /start-processing` - Démarre la conversion
- `GET /status` - Récupère l'état actuel
- `POST /reset` - Réinitialise l'état
- `GET /download/<filename>` - Télécharge un fichier RTF

## Personnalisation

### Modifier le nombre max de fichiers

Dans `app.py`, ligne 13:

```python
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB max
```

### Modifier le nombre de retries

Dans `app.py`, ligne 44:

```python
def process_pdf_with_gpt(pdf_path, custom_gpt_id=None, max_retries=3):
```

### Traitement asynchrone

Pour un traitement asynchrone en arrière-plan (recommandé pour la production), considérez l'utilisation de:
- Celery avec Redis
- RQ (Redis Queue)
- Python asyncio

## Dépannage

### Erreur "OPENAI_API_KEY non configurée"

Vérifiez que:
1. Le fichier `.env` existe
2. La clé API est correcte
3. L'environnement virtuel est activé

### Les fichiers ne sont pas traités

1. Vérifiez les logs de la console
2. Consultez `processing_state.json` pour voir les erreurs
3. Vérifiez que l'ID du Custom GPT est correct

### Le serveur est lent

Le traitement est séquentiel par défaut. Pour accélérer:
1. Utilisez un traitement asynchrone (Celery)
2. Réduisez la taille des PDFs
3. Utilisez un serveur plus puissant

## Limites

- Les PDFs très volumineux (>20 MB) peuvent prendre du temps
- L'API OpenAI a des limites de taux (rate limits)
- La qualité de la conversion dépend du Custom GPT utilisé

## Sécurité

- Ne commitez JAMAIS votre fichier `.env`
- Utilisez HTTPS en production
- Limitez l'accès au serveur
- Validez les fichiers uploadés

## Licence

MIT