# PARALLAX Portal — Interface Web

Interface web du système de calcul distribué **PARALLAX**, développée pour l'[ENSPY](https://www.enspy.cm) (École Nationale Supérieure Polytechnique de Yaoundé).

PARALLAX fédère les machines hétérogènes sous-utilisées du campus en un supercalculateur local, sans dépendance à Internet. Ce portail permet aux chercheurs de soumettre leur code source annoté et aux gestionnaires de superviser l'ensemble du cluster en temps réel.

---

## Deux rôles, deux interfaces

| Rôle | Accès |
|---|---|
| **Chercheur** | Importe son code source, soumet le programme, suit la progression tâche par tâche, télécharge les résultats |
| **Gestionnaire** | Supervise tous les nœuds du cluster (métriques CPU/RAM, heartbeats), voit tous les programmes, peut annuler une exécution |

---

## Stack technique

- **React 19** + **Vite 8**
- **TanStack React Query 5** — gestion du state serveur, polling automatique sur les statuts actifs
- **Axios** — client HTTP avec intercepteurs JWT (refresh automatique, Bearer header)
- **React Router 6** — navigation côté client, guards RBAC par rôle
- **React Hook Form** — formulaires avec validation
- **Tailwind CSS 3** — styles utilitaires
- **Recharts** — graphes historique CPU/RAM des nœuds

---

## Fonctionnalités

### Chercheur
- Upload de code source (`.py`, `.c`, `.cpp`, `.java`, `.sh`, `.f90`, `.r`) ou d'archives (`.zip`, `.tar.gz`, `.tgz`) avec drag-and-drop
- Soumission pour exécution et suivi de la décomposition en sous-tâches atomiques
- Barre de progression en temps réel (polling toutes les 3 s quand actif)
- Visualisation des sous-tâches avec statut, nœud assigné, tentatives, durée
- Logs d'exécution complets
- Téléchargement des résultats en ZIP
- Indicateur de quota disque (1 Go par utilisateur)
- Filtrage et pagination de la liste de programmes

### Gestionnaire
- Tableau de bord cluster avec statistiques agrégées (nœuds actifs, surchargés, en panne, en maintenance ; tâches en cours / en attente), polling toutes les 4 s
- Liste complète des nœuds avec métriques temps réel (CPU, RAM, score d'élection, heartbeat)
- Fiche détaillée d'un nœud : profil matériel, graphe historique CPU/RAM (10 derniers heartbeats ou vue 30 min à la demande)
- Tâches actives par nœud
- Basculement en maintenance / réactivation d'un nœud
- Retrait définitif d'un nœud du cluster
- Supervision de tous les programmes avec filtrage par statut
- Sous-tâches atomiques d'un programme (nœud worker, tentatives)
- Annulation d'un programme en cours

---

## Architecture

```
PARALLAX Portal (ce dépôt)
        │
        │  HTTP + JWT Bearer
        ▼
Backend Flask  — http://localhost:5000
  /api/auth/*       Authentification
  /api/tasks/*      Projets (chercheur)
  /api/nodes/*      Supervision cluster
  /api/programmes/* Vue gestionnaire
```

Schéma JWT :

```
Login → access_token (15 min, en mémoire)
      + refresh_token (30 jours, localStorage)

401 → intercepteur Axios → POST /api/auth/refresh
      → nouveau access_token → retry automatique
```

---

## Installation

```bash
git clone https://github.com/<votre-org>/parallax-portal.git
cd parallax-portal

npm install
```

### Variable d'environnement

Créez un fichier `.env` à la racine (copiez `.env.example`) :

```env
# URL du backend Flask
VITE_API_URL=http://localhost:5000
```

En production, remplacez par l'IP du nœud maître :

```env
VITE_API_URL=http://192.168.1.100:5000
```

---

## Démarrage

```bash
# Développement (hot-reload)
npm run dev
# → http://localhost:5173

# Build de production
npm run build
npm run preview
```

> Le backend Flask doit être démarré en parallèle (`python run.py` depuis le dépôt backend).

---

## Routes de l'application

| Route | Rôle | Description |
|---|---|---|
| `/login` | Tous | Connexion |
| `/register` | Tous | Création de compte |
| `/dashboard` | Chercheur | Liste de mes programmes |
| `/programmes/import` | Chercheur | Importer un nouveau programme |
| `/programmes/:id` | Chercheur | Détail, progression, résultats |
| `/cluster` | Gestionnaire | Tableau de bord du cluster |
| `/cluster/nodes/:uuid` | Gestionnaire | Fiche détaillée d'un nœud |
| `/cluster/programmes` | Gestionnaire | Tous les programmes |
| `/cluster/programmes/:id` | Gestionnaire | Détail et sous-tâches (admin) |

---

## Structure du projet

```
src/
├── api/
│   ├── client.js              # Axios + intercepteurs JWT (refresh automatique)
│   └── authStore.js           # Access token en mémoire (hors localStorage)
├── config/
│   └── api.js                 # VITE_API_URL → API_BASE_URL
├── context/
│   └── AuthContext.jsx        # Session utilisateur, login, logout
├── hooks/
│   ├── useTasks.js            # Programmes chercheur (CRUD, submit, logs)
│   ├── useNodes.js            # Nœuds, stats, heartbeats, maintenance
│   └── useAdminProgrammes.js  # Programmes gestionnaire + sous-tâches
├── components/
│   ├── layout/
│   │   └── AppLayout.jsx      # Sidebar + Outlet
│   └── ui/
│       ├── StatusBadge.jsx
│       ├── ProgressBar.jsx
│       ├── MetricBar.jsx
│       ├── Pagination.jsx
│       ├── ConfirmModal.jsx
│       └── Toast.jsx
└── pages/
    ├── auth/
    │   ├── LoginPage.jsx
    │   └── RegisterPage.jsx
    ├── chercheur/
    │   ├── ChercheurDashboard.jsx
    │   ├── ImportPage.jsx
    │   └── ProgrammeDetailPage.jsx
    └── gestionnaire/
        ├── ClusterDashboard.jsx
        ├── NodeDetailPage.jsx
        ├── AdminProgrammesPage.jsx
        └── AdminProgrammeDetailPage.jsx
```

---

## Sécurité

- Access token stocké **uniquement en mémoire** (pas en localStorage) — disparaît au rechargement
- Refresh token en localStorage — survit au rechargement, révocable côté backend
- Intercepteur Axios : tout appel `401` déclenche un refresh transparent, puis retry automatique
- Guards RBAC côté React : toute route à rôle restreint redirige si le rôle ne correspond pas
- Aucune donnée sensible dans les logs console en production

---

## Dépôt backend

Le backend Flask qui alimente ce portail est disponible dans un dépôt séparé.
Voir aussi [`workflow.md`](https://github.com/BalaAndegue/backend_ui_parallax/blob/main/workflow.md) pour la documentation complète de l'intégration frontend ↔ backend.

---

## Licence

Projet académique — ENSPY, Département Génie Informatique.
