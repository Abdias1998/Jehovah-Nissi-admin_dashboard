# 🚀 Guide de Démarrage Rapide

## Installation

```bash
cd admin-dashboard
npm install
```

## Démarrage

### Option 1 : Script automatique
```bash
./start-dashboard.sh
```

### Option 2 : Commande npm
```bash
npm run dev
```

Le dashboard sera accessible sur **http://localhost:3001**

## Première connexion

1. Ouvrir http://localhost:3001
2. Se connecter avec un compte admin ou gestion
3. Vous serez redirigé vers le dashboard

### Créer un compte admin (via backend)

Si vous n'avez pas encore de compte admin, créez-en un via le backend :

```bash
# Dans le terminal du backend
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Admin",
    "lastName": "JNP",
    "email": "admin@jnp.com",
    "password": "Admin123!",
    "role": "admin"
  }'
```

Ou utilisez Postman/Insomnia pour créer le compte.

## Fonctionnalités disponibles

### ✅ Gestion des Utilisateurs
- `/dashboard/users`
- Recherche, filtres, modification de rôle, activation/désactivation

### ✅ Gestion des KYC
- `/dashboard/kyc`
- Visualisation des documents, approbation/rejet

### 🚧 En développement
- Gestion des Stations
- Gestion des Réservations
- Gestion des Transactions

## Dépannage

### Le dashboard ne se connecte pas au backend

Vérifier que :
1. Le backend est démarré sur le port 3000
2. Le fichier `.env.local` contient `NEXT_PUBLIC_API_URL=http://localhost:3000`
3. CORS est activé dans le backend

### Erreur 401 (Non autorisé)

- Vérifier que l'utilisateur a le rôle `admin` ou `gestion`
- Vérifier que le token JWT est valide

### Les images ne s'affichent pas

- Vérifier que les URLs des images sont accessibles
- Ajouter le domaine dans `next.config.js` si nécessaire

## Structure des pages

```
/                       → Redirection vers /dashboard ou /login
/login                  → Page de connexion
/dashboard              → Dashboard principal
/dashboard/users        → Gestion des utilisateurs
/dashboard/kyc          → Gestion des KYC
/dashboard/stations     → Gestion des stations (placeholder)
/dashboard/reservations → Gestion des réservations (placeholder)
/dashboard/transactions → Gestion des transactions (placeholder)
```

## Technologies

- **Next.js 14** - Framework React
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styles
- **Axios** - Requêtes HTTP
- **Lucide React** - Icônes

## Support

Pour toute question ou problème, consultez le README.md complet.
