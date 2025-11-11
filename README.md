# JNP Admin Dashboard

Dashboard d'administration web pour la plateforme JNP Station Service.

## 🚀 Technologies

- **Next.js 14** - Framework React avec App Router
- **TypeScript** - Typage statique
- **Tailwind CSS** - Framework CSS utility-first
- **Axios** - Client HTTP
- **Lucide React** - Icônes

## 📦 Installation

```bash
cd admin-dashboard
npm install
```

## 🔧 Configuration

Créer un fichier `.env.local` :

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 🏃 Démarrage

```bash
# Mode développement (port 3001)
npm run dev

# Build production
npm run build

# Démarrer en production
npm start
```

Le dashboard sera accessible sur **http://localhost:3001**

## 👥 Accès

Seuls les utilisateurs avec les rôles suivants peuvent se connecter :
- **admin** - Accès complet à toutes les fonctionnalités
- **gestion** - Accès limité à la gestion des stations

## 📱 Fonctionnalités

### ✅ Implémentées

#### 1. Authentification
- Connexion sécurisée avec JWT
- Vérification du rôle (admin/gestion)
- Déconnexion

#### 2. Dashboard Principal
- Vue d'ensemble avec statistiques
- Cartes de navigation
- Activité récente
- Actions rapides

#### 3. Gestion des Utilisateurs
- Liste complète des utilisateurs
- Recherche par nom, email, téléphone
- Filtres : Rôle (user/gestion/admin), KYC (vérifié/non vérifié)
- Statistiques : Total, Vérifiés, Actifs
- Actions :
  - Modifier le rôle
  - Activer/Désactiver un compte
- Affichage : Email, téléphone, pays, solde portefeuille

#### 4. Gestion des KYC
- Liste des demandes de vérification
- Recherche par nom, email, numéro de document
- Filtres : Statut (en attente/approuvé/rejeté)
- Statistiques : Total, En attente, Approuvées
- Visualisation des documents :
  - Photo recto du document
  - Photo verso (si disponible)
  - Photo selfie
  - Zoom sur les images
- Actions :
  - Approuver une demande
  - Rejeter avec raison
- Types de documents supportés :
  - Carte d'identité
  - Passeport
  - Permis de conduire
  - Carte biométrique
  - CIP

### 🚧 En cours de développement

- Gestion des Stations (CRUD complet)
- Gestion des Réservations
- Gestion des Transactions

## 🎨 Design

- Interface moderne et responsive
- Palette de couleurs :
  - Primaire : `#28a745` (vert JNP)
  - Secondaire : `#6c757d` (gris)
- Composants réutilisables
- Navigation latérale (sidebar)

## 📂 Structure du projet

```
admin-dashboard/
├── app/
│   ├── dashboard/
│   │   ├── users/          # Gestion utilisateurs
│   │   ├── kyc/            # Gestion KYC
│   │   ├── stations/       # Gestion stations (placeholder)
│   │   ├── reservations/   # Gestion réservations (placeholder)
│   │   ├── transactions/   # Gestion transactions (placeholder)
│   │   ├── layout.tsx      # Layout dashboard
│   │   └── page.tsx        # Page principale
│   ├── login/
│   │   └── page.tsx        # Page de connexion
│   ├── layout.tsx          # Layout global
│   ├── page.tsx            # Page d'accueil (redirection)
│   └── globals.css         # Styles globaux
├── components/
│   └── Sidebar.tsx         # Navigation latérale
├── lib/
│   └── api.ts              # Client API
├── public/                 # Assets statiques
├── .env.local              # Variables d'environnement
├── next.config.js          # Configuration Next.js
├── tailwind.config.ts      # Configuration Tailwind
├── tsconfig.json           # Configuration TypeScript
└── package.json            # Dépendances
```

## 🔌 API Backend

Le dashboard communique avec le backend NestJS sur `http://localhost:3000`

### Endpoints utilisés

#### Authentification
- `POST /auth/login` - Connexion

#### Utilisateurs
- `GET /users` - Liste des utilisateurs
- `GET /users/:id` - Détails d'un utilisateur
- `PATCH /users/:id/role` - Modifier le rôle
- `PATCH /users/:id/active` - Activer/Désactiver

#### KYC
- `GET /kyc/pending` - Liste des demandes KYC
- `GET /kyc/:id` - Détails d'une demande
- `PUT /kyc/:id/review` - Approuver/Rejeter

## 🔐 Sécurité

- Token JWT stocké dans localStorage
- Intercepteur Axios pour ajouter le token automatiquement
- Redirection automatique vers login si non authentifié (401)
- Vérification du rôle côté serveur

## 🎯 Prochaines étapes

1. **Gestion des Stations**
   - CRUD complet (Create, Read, Update, Delete)
   - Upload de photos
   - Gestion des prix carburants
   - Gestion des services
   - Horaires d'ouverture

2. **Gestion des Réservations**
   - Liste des réservations
   - Filtres par station, statut, date
   - Détails des réservations
   - Statistiques

3. **Gestion des Transactions**
   - Historique complet
   - Filtres par type, statut, date
   - Export CSV/Excel
   - Statistiques financières

4. **Améliorations**
   - Dashboard avec graphiques (Chart.js)
   - Notifications en temps réel
   - Export de données
   - Logs d'activité
   - Gestion des permissions avancées

## 📝 Notes

- Le dashboard est optimisé pour les écrans desktop
- Responsive design pour tablettes et mobiles
- Support des navigateurs modernes (Chrome, Firefox, Safari, Edge)

## 🐛 Débogage

Si vous rencontrez des problèmes :

1. Vérifier que le backend est démarré sur le port 3000
2. Vérifier les variables d'environnement dans `.env.local`
3. Vérifier la console du navigateur pour les erreurs
4. Vérifier que l'utilisateur a le rôle admin ou gestion

## 📄 Licence

© 2024 JNP Station Service. Tous droits réservés.
