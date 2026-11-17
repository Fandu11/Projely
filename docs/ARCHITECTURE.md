# Architecture globale du projet

## 1. Vue d’ensemble

Projely est une application web de gestion de projets construite avec Next.js
et l’App Router. L’application regroupe l’interface utilisateur, les actions
serveur, l’authentification et l’accès à la base de données dans le même
projet.

```text
Navigateur
    |
    v
Pages et composants Next.js
    |
    +--> Actions serveur
    |        |
    |        +--> Vérification de session
    |        +--> Validation des données
    |        +--> Prisma
    |
    +--> Route API d’authentification
             |
             +--> Better Auth
                      |
                      +--> PostgreSQL
```

## 2. Technologies principales

- **Next.js 16** avec l’App Router.
- **React 19** pour les composants d’interface.
- **TypeScript** en mode strict.
- **Tailwind CSS** pour les styles.
- **Better Auth** pour l’inscription, la connexion et les sessions.
- **Prisma** comme ORM.
- **PostgreSQL** comme base de données.
- **ESLint** pour la qualité du code.

## 3. Organisation des dossiers

```text
projely/
├── app/
│   ├── api/
│   │   └── auth/[...all]/route.ts
│   ├── calendar/
│   ├── components/
│   ├── dashboard/
│   ├── login/
│   ├── profile/
│   ├── projects/
│   ├── register/
│   ├── statistics/
│   ├── tasks/
│   ├── teams/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── docs/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── public/
├── src/
│   └── generated/prisma/
├── next.config.ts
├── package.json
└── tsconfig.json
```

## 4. Couche interface

Les pages sont organisées par fonctionnalité dans le dossier `app/`.
Les fichiers `page.tsx` définissent les écrans accessibles par une URL.

| Route | Rôle |
|---|---|
| `/` | Tableau de bord général de l’utilisateur |
| `/login` | Connexion |
| `/register` | Création de compte |
| `/profile` | Gestion du profil |
| `/teams` | Liste et création des équipes |
| `/teams/[id]` | Détail et gestion d’une équipe |
| `/projects` | Liste des projets |
| `/projects/new` | Création d’un projet |
| `/projects/[id]` | Détail d’un projet |
| `/projects/[id]/tasks/new` | Création d’une tâche |
| `/projects/[id]/tasks/[taskId]/edit` | Modification d’une tâche |
| `/tasks` | Liste globale des tâches |
| `/calendar` | Calendrier global |
| `/statistics` | Statistiques |

Le fichier `app/layout.tsx` fournit la structure commune de l’application :

- barre latérale ;
- barre de navigation ;
- zone principale de contenu ;
- états de chargement avec `Suspense`.

Les composants d’interface partagés se trouvent principalement dans
`app/components/`. Les composants propres à une fonctionnalité restent proches
de leur page, par exemple dans `app/projects/[id]/`.

## 5. Authentification

L’authentification est gérée par Better Auth dans
`app/lib/auth.ts`.

La route `app/api/auth/[...all]/route.ts` expose les handlers `GET` et `POST`
nécessaires à Better Auth.

Le fonctionnement général est le suivant :

1. l’utilisateur s’inscrit ou se connecte ;
2. Better Auth crée ou vérifie la session ;
3. les pages protégées récupèrent la session avec `auth.api.getSession` ;
4. un utilisateur non connecté est redirigé vers `/login` ;
5. les actions serveur réutilisent la même vérification avant toute écriture.

Les sessions, comptes et informations de vérification sont stockés dans la
base de données via l’adaptateur Prisma de Better Auth.

## 6. Actions serveur

Les opérations de création et de modification sont regroupées dans des fichiers
`actions.ts` marqués avec `"use server"`.

Exemples :

- `app/teams/actions.ts` : création, modification, suppression et gestion des
  membres d’une équipe ;
- `app/projects/actions.ts` : création des projets ;
- `app/projects/[id]/actions.ts` : opérations liées au projet ;
- `app/profile/action.ts` : modification du profil ;
- `app/projects/[id]/tasks/new/actions.ts` : création des tâches ;
- `app/projects/[id]/tasks/[taskId]/edit/actions.ts` : modification des tâches.

Une action serveur suit généralement ce flux :

```text
Formulaire
    |
    v
Récupération de la session
    |
    v
Validation des champs
    |
    v
Vérification des droits
    |
    v
Écriture ou lecture avec Prisma
    |
    v
Revalidation des pages
    |
    v
Redirection avec un résultat
```

Les actions utilisent `revalidatePath` après une modification afin de
rafraîchir les pages concernées. Les utilisateurs non authentifiés sont
redirigés vers la page de connexion.

## 7. Accès aux données

Le client Prisma est configuré dans `app/lib/prisma.ts`.

```text
Action serveur ou page serveur
    |
    v
app/lib/prisma.ts
    |
    v
PrismaPg
    |
    v
DATABASE_URL
    |
    v
PostgreSQL
```

Le schéma de données est défini dans `prisma/schema.prisma`. Le client généré
est placé dans `src/generated/prisma/`.

Les principales entités sont :

- `User` : utilisateur ;
- `Team` : équipe ;
- `Project` : projet ;
- `Sprint` : sprint ;
- `Epic` : épopée ;
- `Story` : user story ;
- `Task` : tâche ou bug ;
- `Session`, `Account` et `Verification` : données d’authentification.

Les relations principales sont :

```text
User
 ├── possède des équipes
 ├── appartient à des équipes
 ├── possède des projets
 ├── appartient à des projets
 └── peut être responsable de tâches

Project
 ├── contient des sprints
 ├── contient des epics
 ├── contient des stories
 ├── contient des tâches
 └── est associé à des équipes

Epic
 └── contient des stories

Story
 └── contient des tâches

Sprint
 └── regroupe des stories et des tâches
```

Les suppressions en cascade sont utilisées pour certaines relations
hiérarchiques. Les relations facultatives d’une tâche vers une story, un sprint
ou un responsable sont conservées avec `SetNull`.

## 8. Flux fonctionnel principal

### Création d’un projet

1. L’utilisateur ouvre `/projects/new`.
2. Il complète le formulaire.
3. L’action serveur vérifie sa session.
4. Les champs sont contrôlés.
5. Prisma crée le projet et associe son propriétaire comme membre.
6. Les pages des projets sont revalidées.
7. L’utilisateur est redirigé vers `/projects`.

### Création d’une tâche

1. L’utilisateur ouvre la page de création d’une tâche depuis un projet.
2. Il saisit le titre, la description, le statut et la priorité.
3. L’action serveur vérifie l’utilisateur et le projet.
4. Prisma enregistre la tâche.
5. La page du projet est revalidée.
6. La tâche apparaît dans la vue du projet et dans les listes concernées.

### Consultation du tableau de bord

1. La page d’accueil vérifie la session.
2. Les projets accessibles à l’utilisateur sont chargés.
3. Les tâches sont regroupées par projet, story et epic.
4. Les tâches prioritaires et les sprints actifs sont calculés.
5. Les indicateurs et raccourcis sont affichés.

## 9. Règles d’architecture

- Les accès à Prisma doivent rester côté serveur.
- Les données privées doivent être filtrées selon l’utilisateur connecté.
- Les actions qui modifient les données doivent vérifier la session.
- Les droits doivent être vérifiés avant toute modification.
- Les validations de formulaire doivent être faites côté serveur.
- Les composants partagés doivent rester dans `app/components/`.
- Les composants propres à une fonctionnalité doivent rester dans son dossier.
- Les modifications doivent revalider les routes concernées.
- Les secrets et la chaîne `DATABASE_URL` doivent rester dans les variables
  d’environnement.

## 10. Configuration et commandes

Les scripts principaux sont définis dans `package.json` :

```bash
npm run dev       # serveur de développement
npm run build     # génération Prisma et build Next.js
npm run start     # démarrage en production
npm run lint      # vérification ESLint
```

La configuration TypeScript se trouve dans `tsconfig.json`. L’alias `@/*`
pointe vers la racine du projet et permet des imports comme
`@/app/lib/auth`.

## 11. Évolutions prévues

Les fonctionnalités suivantes pourront être ajoutées sans remettre en cause
la structure générale :

- commentaires et mentions ;
- notifications ;
- journal d’activité ;
- recherche avancée ;
- tests unitaires, d’intégration et end-to-end ;
- gestion plus fine des rôles et permissions ;
- pièces jointes ;
- intégrations externes ;
- notifications e-mail et push.
