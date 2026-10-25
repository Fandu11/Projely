# Projet M2 — Application complète de gestion de projet

## 1. Présentation du projet

### 1.1. Intitulé

**ProjectGestion** — plateforme collaborative de gestion d’équipes, de projets et de tâches.

### 1.2. Contexte

Les équipes ont besoin d’un espace unique pour organiser leurs projets, suivre l’avancement des tâches, communiquer et conserver l’historique des décisions. L’application doit proposer une expérience simple pour les utilisateurs tout en démontrant une architecture full-stack moderne, sécurisée, testable et évolutive.

### 1.3. Objectifs

- Centraliser la gestion des équipes, projets, tâches et sous-tâches.
- Visualiser l’avancement grâce à un tableau Kanban avec glisser-déposer.
- Faciliter la collaboration avec les commentaires, notifications et activités.
- Permettre la recherche, le filtrage et l’analyse des projets.
- Mettre en pratique une architecture web complète : interface, API, base de données, authentification, autorisation, tests et déploiement.
- Produire un projet présentable dans un portfolio et défendable lors d’une soutenance de M2.

### 1.4. Public cible

- Étudiants et équipes de projet.
- Petites équipes produit ou développement.
- Associations et organisations souhaitant suivre des actions.
- Responsable de projet ayant besoin d’une vue synthétique de l’activité.

### 1.5. Périmètre du MVP

Le MVP doit inclure :

1. Inscription, connexion, déconnexion et récupération de compte.
2. Gestion des profils et des rôles.
3. Création et gestion des équipes.
4. Création de projets liés à une équipe.
5. Création, modification et suivi des tâches.
6. Sous-tâches, priorités, échéances, étiquettes et assignation.
7. Tableau Kanban avec glisser-déposer.
8. Commentaires et journal d’activité.
9. Notifications internes.
10. Recherche et filtres.
11. Statistiques de base.
12. Interface responsive et accessible.
13. Tests automatisés et documentation technique.

Les fonctionnalités avancées pourront être ajoutées après validation du MVP.

---

## 2. Fonctionnalités détaillées

## 2.1. Authentification et compte utilisateur

### Fonctionnalités

- Inscription avec nom, adresse e-mail et mot de passe.
- Connexion et déconnexion.
- Vérification de l’adresse e-mail.
- Mot de passe oublié et réinitialisation sécurisée.
- Modification du profil : nom, avatar, fuseau horaire et préférences.
- Modification du mot de passe.
- Suppression du compte avec confirmation explicite.
- Gestion des sessions et possibilité de révoquer les sessions actives.

### Règles

- L’adresse e-mail doit être unique et normalisée.
- Le mot de passe doit respecter une politique documentée.
- Les mots de passe doivent être hachés ; ils ne doivent jamais être stockés en clair.
- Les jetons de réinitialisation doivent être temporaires, à usage unique et stockés sous forme hachée.
- Les erreurs de connexion ne doivent pas révéler si une adresse e-mail existe.

## 2.2. Équipes et membres

### Fonctionnalités

- Créer, modifier et archiver une équipe.
- Ajouter un membre par invitation e-mail ou lien d’invitation.
- Accepter ou refuser une invitation.
- Retirer un membre d’une équipe.
- Consulter la liste des membres et leur rôle.
- Transférer la propriété de l’équipe.
- Quitter une équipe, sauf si l’utilisateur est le dernier propriétaire.

### Rôles d’équipe

| Rôle | Droits principaux |
|---|---|
| Propriétaire | Gestion complète de l’équipe, des membres et des paramètres |
| Administrateur | Gestion des projets, membres et paramètres courants |
| Membre | Consultation et contribution aux projets autorisés |
| Invité | Accès limité aux projets explicitement partagés |

## 2.3. Projets

### Fonctionnalités

- Créer un projet avec nom, description, couleur, dates et statut.
- Modifier les informations du projet.
- Archiver et restaurer un projet.
- Définir les membres du projet.
- Définir le responsable du projet.
- Choisir une visibilité :
  - privée ;
  - visible par les membres de l’équipe ;
  - accessible aux invités autorisés.
- Afficher une page de synthèse du projet.

### Statuts de projet

- Planification.
- En cours.
- En pause.
- Terminé.
- Archivé.

## 2.4. Tâches et sous-tâches

### Données d’une tâche

- Titre obligatoire.
- Description enrichie en Markdown limité ou éditeur sécurisé.
- Statut.
- Priorité.
- Responsable.
- Créateur.
- Date de début facultative.
- Date d’échéance facultative.
- Étiquettes.
- Estimation en heures ou points.
- Position dans une colonne Kanban.
- Tâches parentes et sous-tâches.
- Date de création et de dernière modification.

### Fonctionnalités

- Créer, modifier, dupliquer et archiver une tâche.
- Assigner une tâche à un membre du projet.
- Ajouter ou retirer des étiquettes.
- Créer des sous-tâches.
- Marquer une sous-tâche comme terminée.
- Déplacer une tâche entre les colonnes.
- Réordonner les tâches dans une colonne.
- Définir ou modifier une échéance.
- Consulter les tâches en retard.
- Supprimer une tâche avec confirmation.

### Statuts par défaut

- À faire.
- En cours.
- En revue.
- Terminé.

Les colonnes doivent être configurables par les administrateurs du projet, tout en conservant un identifiant stable pour les opérations de tri et d’audit.

### Priorités

- Aucune.
- Basse.
- Normale.
- Haute.
- Urgente.

## 2.5. Tableau Kanban

### Fonctionnalités

- Afficher les tâches regroupées par statut.
- Déplacer une tâche par glisser-déposer.
- Réordonner les tâches.
- Mettre à jour le statut et la position sans recharger la page.
- Afficher un retour visuel pendant le déplacement.
- Gérer les erreurs réseau et restaurer la position précédente si nécessaire.
- Filtrer le tableau par responsable, priorité, étiquette et échéance.
- Rechercher une tâche depuis le tableau.

### Contraintes

- Le déplacement doit respecter les droits de l’utilisateur.
- Les positions doivent être persistées de façon cohérente.
- Deux déplacements concurrents ne doivent pas provoquer de doublon ou de perte silencieuse.
- L’interface doit rester utilisable au clavier, avec une alternative au glisser-déposer.

## 2.6. Commentaires et collaboration

- Ajouter un commentaire sur une tâche.
- Modifier ou supprimer ses propres commentaires.
- Autoriser un administrateur à modérer un commentaire.
- Mentionner un membre avec `@nom`.
- Notifier les utilisateurs mentionnés.
- Afficher les commentaires dans l’ordre chronologique.
- Conserver l’auteur et les dates de création/modification.
- Signaler visuellement les commentaires modifiés.

## 2.7. Notifications

### Événements notifiables

- Invitation dans une équipe.
- Ajout à un projet.
- Assignation d’une tâche.
- Mention dans un commentaire.
- Nouveau commentaire sur une tâche suivie.
- Modification importante d’une tâche.
- Échéance proche.
- Tâche en retard.

### Fonctionnalités

- Centre de notifications non lues/lues.
- Marquer une notification comme lue.
- Tout marquer comme lu.
- Lien direct vers la ressource concernée.
- Préférences par type de notification.
- Prévoir une extension future vers les e-mails et les notifications push.

## 2.8. Historique et audit

Le journal d’activité doit enregistrer les changements importants :

- création, modification et archivage d’un projet ;
- ajout ou retrait d’un membre ;
- création, modification, déplacement et suppression d’une tâche ;
- changement de statut, priorité, responsable ou échéance ;
- ajout, modification et suppression d’un commentaire ;
- changement de rôle.

Chaque entrée doit contenir :

- l’auteur de l’action ;
- le type d’action ;
- la ressource concernée ;
- un résumé lisible ;
- les valeurs avant/après lorsque cela est pertinent ;
- la date de l’action.

Les entrées d’audit ne doivent pas être modifiables par les utilisateurs standards.

## 2.9. Recherche et filtres

### Recherche

La recherche doit couvrir au minimum :

- projets ;
- tâches ;
- commentaires, si l’utilisateur dispose du droit de lecture.

### Filtres

- équipe ;
- projet ;
- statut ;
- priorité ;
- responsable ;
- étiquette ;
- date d’échéance ;
- tâches en retard ;
- tâches créées ou modifiées récemment.

Les filtres doivent être combinables et représentés dans l’URL afin de permettre le partage ou le rechargement d’une vue.

## 2.10. Statistiques et tableaux de bord

### Indicateurs MVP

- Nombre de tâches par statut.
- Tâches terminées sur une période.
- Tâches en retard.
- Répartition par priorité.
- Répartition par membre.
- Progression globale du projet.
- Nombre de tâches créées et terminées par semaine.

### Règles

- Les statistiques doivent respecter les permissions de l’utilisateur.
- Les périodes doivent être explicites : semaine, mois ou période personnalisée.
- Les valeurs sans données doivent être affichées comme zéro, sans erreur.
- Les graphiques doivent disposer d’un équivalent textuel accessible.

---

## 3. Parcours utilisateurs principaux

### 3.1. Premier accès

1. L’utilisateur crée son compte.
2. Il vérifie son adresse e-mail.
3. Il crée une équipe ou accepte une invitation.
4. Il crée son premier projet.
5. Il ajoute des membres.
6. Il crée des tâches et configure son tableau Kanban.

### 3.2. Suivi d’une tâche

1. L’utilisateur ouvre un projet.
2. Il recherche ou filtre une tâche.
3. Il consulte sa description, ses sous-tâches et son historique.
4. Il ajoute un commentaire ou mentionne un collègue.
5. Il modifie le statut ou déplace la tâche.
6. Les membres concernés reçoivent une notification.

### 3.3. Gestion hebdomadaire d’un responsable

1. Le responsable consulte le tableau de bord.
2. Il identifie les tâches en retard.
3. Il filtre les tâches par membre ou priorité.
4. Il réassigne les tâches nécessaires.
5. Il vérifie la progression dans les statistiques.

---

## 4. Architecture technique

## 4.1. Stack imposée

- **Frontend et backend :** Next.js avec App Router.
- **Langage :** TypeScript en mode strict.
- **Base de données :** PostgreSQL.
- **ORM :** Prisma.
- **Validation :** Zod ou solution équivalente déjà adoptée par le projet.
- **Authentification :** Auth.js/NextAuth ou solution équivalente documentée.
- **UI :** composants accessibles et responsive, avec Tailwind CSS ou système équivalent.
- **Tests unitaires et intégration :** Vitest ou Jest.
- **Tests end-to-end :** Playwright.
- **Qualité :** ESLint, Prettier et vérification TypeScript.
- **Déploiement cible :** plateforme compatible Next.js et PostgreSQL managé.

## 4.2. Organisation recommandée

```text
src/
  app/
    (auth)/
    (dashboard)/
    api/
  components/
  features/
    auth/
    teams/
    projects/
    tasks/
    notifications/
    analytics/
  lib/
    auth/
    db/
    permissions/
    validation/
  server/
    services/
    repositories/
  types/
prisma/
  schema.prisma
  migrations/
tests/
  unit/
  integration/
  e2e/
```

Cette organisation est indicative. Les conventions déjà présentes dans le projet doivent être conservées si elles sont cohérentes.

## 4.3. Principes d’architecture

- Séparer les composants d’interface, la logique métier et l’accès aux données.
- Valider les entrées côté serveur, même si elles sont déjà validées côté client.
- Centraliser les règles d’autorisation.
- Utiliser des transactions pour les opérations multi-étapes.
- Éviter les accès directs à la base depuis les composants d’interface.
- Prévoir la pagination pour les listes volumineuses.
- Ne jamais exposer de données d’une équipe ou d’un projet non autorisé.
- Retourner des erreurs structurées et compréhensibles par l’interface.

---

## 5. Modèle de données

### Entités principales

#### User

- `id`
- `email`
- `name`
- `avatarUrl`
- `passwordHash` ou relation vers le fournisseur d’authentification
- `timezone`
- `createdAt`
- `updatedAt`

#### Team

- `id`
- `name`
- `slug`
- `description`
- `ownerId`
- `createdAt`
- `updatedAt`
- `archivedAt`

#### TeamMember

- `teamId`
- `userId`
- `role`
- `joinedAt`

Contrainte unique : `(teamId, userId)`.

#### Invitation

- `id`
- `teamId`
- `email`
- `role`
- `tokenHash`
- `expiresAt`
- `acceptedAt`
- `createdById`
- `createdAt`

#### Project

- `id`
- `teamId`
- `name`
- `slug`
- `description`
- `status`
- `visibility`
- `ownerId`
- `startDate`
- `dueDate`
- `createdAt`
- `updatedAt`
- `archivedAt`

#### ProjectMember

- `projectId`
- `userId`
- `role`
- `joinedAt`

#### BoardColumn

- `id`
- `projectId`
- `name`
- `key`
- `position`
- `color`
- `createdAt`
- `updatedAt`

#### Task

- `id`
- `projectId`
- `columnId`
- `parentTaskId`
- `title`
- `description`
- `priority`
- `assigneeId`
- `creatorId`
- `position`
- `estimate`
- `startDate`
- `dueDate`
- `completedAt`
- `createdAt`
- `updatedAt`
- `archivedAt`

#### Label et TaskLabel

- `Label`: `id`, `projectId`, `name`, `color`
- `TaskLabel`: `taskId`, `labelId`

#### Comment

- `id`
- `taskId`
- `authorId`
- `content`
- `createdAt`
- `updatedAt`
- `deletedAt`

#### Notification

- `id`
- `recipientId`
- `actorId`
- `type`
- `entityType`
- `entityId`
- `message`
- `readAt`
- `createdAt`

#### ActivityLog

- `id`
- `teamId`
- `projectId`
- `actorId`
- `entityType`
- `entityId`
- `action`
- `metadata`
- `createdAt`

### Relations et index

- Indexer les clés étrangères et les champs utilisés dans les filtres.
- Ajouter un index sur les tâches par `(projectId, columnId, position)`.
- Ajouter un index sur les notifications par `(recipientId, readAt, createdAt)`.
- Ajouter un index de recherche sur les titres de projets et de tâches.
- Utiliser des contraintes d’unicité pour les slugs et les relations d’appartenance.
- Définir explicitement les comportements de suppression ou d’archivage.

---

## 6. API et actions serveur

Les routes peuvent être implémentées avec des Route Handlers, des Server Actions ou une combinaison des deux. Le choix doit être cohérent et documenté.

### Authentification

```text
POST /api/auth/register
POST /api/auth/verify-email
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/session
```

### Équipes

```text
GET    /api/teams
POST   /api/teams
GET    /api/teams/:teamId
PATCH  /api/teams/:teamId
DELETE /api/teams/:teamId
GET    /api/teams/:teamId/members
POST   /api/teams/:teamId/invitations
DELETE /api/teams/:teamId/members/:userId
```

### Projets

```text
GET    /api/teams/:teamId/projects
POST   /api/teams/:teamId/projects
GET    /api/projects/:projectId
PATCH  /api/projects/:projectId
DELETE /api/projects/:projectId
GET    /api/projects/:projectId/members
```

### Tâches

```text
GET    /api/projects/:projectId/tasks
POST   /api/projects/:projectId/tasks
GET    /api/tasks/:taskId
PATCH  /api/tasks/:taskId
DELETE /api/tasks/:taskId
POST   /api/tasks/:taskId/reorder
POST   /api/tasks/:taskId/subtasks
```

### Commentaires, notifications et statistiques

```text
GET    /api/tasks/:taskId/comments
POST   /api/tasks/:taskId/comments
PATCH  /api/comments/:commentId
DELETE /api/comments/:commentId

GET    /api/notifications
PATCH  /api/notifications/:notificationId/read
POST   /api/notifications/read-all

GET    /api/projects/:projectId/statistics
GET    /api/search?q=...
```

### Format d’erreur recommandé

```json
{
  "error": {
    "code": "TASK_FORBIDDEN",
    "message": "Vous n'avez pas les droits pour modifier cette tâche.",
    "fieldErrors": {}
  }
}
```

Les codes d’erreur doivent être stables et l’interface doit afficher un message utilisateur sans exposer de détails sensibles.

---

## 7. Sécurité et autorisation

- Vérifier l’authentification sur chaque opération privée.
- Vérifier l’appartenance à l’équipe et au projet côté serveur.
- Appliquer le principe du moindre privilège.
- Centraliser les permissions dans des fonctions réutilisables.
- Protéger les formulaires contre les requêtes CSRF selon le mécanisme d’authentification retenu.
- Limiter les tentatives de connexion, d’invitation et de réinitialisation.
- Valider et nettoyer les contenus utilisateur pour éviter les injections et le XSS.
- Ne jamais faire confiance à un identifiant fourni par le client pour déterminer l’utilisateur courant.
- Ne jamais inclure les secrets dans le dépôt ou le code client.
- Utiliser des variables d’environnement et documenter uniquement les noms attendus.
- Journaliser les événements de sécurité importants sans enregistrer de mot de passe ni de jeton.
- Utiliser HTTPS en production.
- Prévoir une politique de sauvegarde et de restauration de PostgreSQL.

---

## 8. Interface et expérience utilisateur

### Écrans principaux

1. Page d’accueil / présentation.
2. Inscription.
3. Connexion.
4. Réinitialisation du mot de passe.
5. Tableau de bord personnel.
6. Liste des équipes.
7. Détail d’une équipe et gestion des membres.
8. Liste des projets.
9. Vue synthèse d’un projet.
10. Tableau Kanban.
11. Vue liste des tâches.
12. Détail d’une tâche.
13. Centre de notifications.
14. Page de recherche.
15. Statistiques du projet.
16. Paramètres du compte et de l’équipe.

### Exigences UX

- Design responsive mobile, tablette et desktop.
- Navigation cohérente et retour visuel après chaque action.
- États de chargement, vide, erreur et succès pour chaque écran.
- Confirmation avant les actions destructives.
- Formulaires accessibles avec labels, erreurs et focus gérés.
- Navigation clavier complète.
- Contrastes conformes aux recommandations WCAG 2.1 AA.
- Dates et heures affichées selon le fuseau horaire de l’utilisateur.
- Interface en français pour le MVP ; prévoir une structure compatible avec l’internationalisation.

---

## 9. Qualité, tests et observabilité

### Tests unitaires

Tester notamment :

- validation des schémas ;
- calcul des permissions ;
- transitions de statut ;
- calcul des statistiques ;
- normalisation des positions Kanban ;
- création des notifications ;
- règles de date et de retard.

### Tests d’intégration

Tester :

- inscription et connexion ;
- création d’une équipe et invitation ;
- création d’un projet ;
- création et modification d’une tâche ;
- déplacement Kanban ;
- commentaires et notifications ;
- contrôle d’accès entre deux équipes différentes.

### Tests end-to-end

Scénario minimal :

1. Créer un compte.
2. Créer une équipe.
3. Créer un projet.
4. Ajouter une colonne et une tâche.
5. Déplacer la tâche vers « En cours » puis « Terminé ».
6. Ajouter un commentaire.
7. Vérifier la notification et la statistique de progression.

### Qualité automatisée

Le pipeline doit exécuter :

```text
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

Les scripts et leurs variantes doivent être définis dans `package.json`.

### Observabilité

- Journaliser les erreurs serveur avec un identifiant de corrélation.
- Ne pas exposer de stack trace en production.
- Suivre les erreurs d’interface et d’API.
- Mesurer les temps de réponse des opérations importantes.
- Prévoir des contrôles de santé de l’application et de la base de données.

---

## 10. Performance et évolutivité

- Paginer les listes de tâches, commentaires, membres et activités.
- Éviter les requêtes N+1 avec Prisma.
- Charger les statistiques à la demande ou les mettre en cache si nécessaire.
- Utiliser des Server Components lorsque cela réduit le JavaScript côté client.
- Réserver les composants client aux interactions nécessaires.
- Optimiser les images et avatars.
- Débouncer la recherche côté interface.
- Prévoir une stratégie de cache et d’invalidation documentée.
- Tester l’application avec des volumes réalistes de tâches et de membres.

---

## 11. Livrables attendus

1. Code source complet.
2. Schéma Prisma et migrations PostgreSQL.
3. Interface responsive.
4. API ou Server Actions documentées.
5. Jeu de données de démonstration reproductible.
6. Tests unitaires, intégration et end-to-end.
7. Pipeline CI exécutant lint, types, tests et build.
8. Documentation d’installation et de configuration.
9. Documentation de l’architecture et des choix techniques.
10. Présentation ou démonstration du projet.
11. Rapport M2 : problématique, conception, réalisation, tests, limites et perspectives.

---

## 12. Phasage de réalisation

### Phase 0 — Cadrage

- Valider les personas et les parcours.
- Définir le périmètre MVP.
- Produire les maquettes principales.
- Définir le modèle de données initial.

### Phase 1 — Socle technique

- Initialiser Next.js et TypeScript strict.
- Configurer PostgreSQL, Prisma et les migrations.
- Configurer l’authentification.
- Mettre en place ESLint, Prettier et les premiers tests.

### Phase 2 — Équipes et projets

- Implémenter les équipes, membres, rôles et invitations.
- Implémenter les projets et leurs permissions.

### Phase 3 — Tâches et Kanban

- Implémenter les tâches, sous-tâches, étiquettes et statuts.
- Implémenter le tableau Kanban et la persistance du réordonnancement.

### Phase 4 — Collaboration

- Ajouter commentaires, mentions, notifications et historique.

### Phase 5 — Recherche et statistiques

- Ajouter la recherche, les filtres et le tableau de bord analytique.

### Phase 6 — Qualité et déploiement

- Compléter les tests.
- Corriger les problèmes d’accessibilité.
- Réaliser les tests de performance et de sécurité.
- Configurer la CI/CD.
- Déployer une version de démonstration.

---

## 13. Critères d’acceptation du MVP

Le MVP est considéré comme terminé lorsque :

- un utilisateur peut créer un compte et se connecter ;
- un propriétaire peut créer une équipe et inviter un membre ;
- un membre autorisé peut créer un projet ;
- un projet possède des colonnes Kanban configurables ;
- une tâche peut être créée, assignée, filtrée et déplacée ;
- les sous-tâches sont visibles et leur progression est calculée ;
- les commentaires et mentions fonctionnent ;
- les notifications apparaissent pour les événements prévus ;
- l’historique affiche les actions importantes ;
- les statistiques sont cohérentes avec les tâches ;
- un utilisateur ne peut pas accéder aux données d’une autre équipe ;
- l’interface est utilisable sur mobile et desktop ;
- les tests automatisés couvrent les parcours critiques ;
- lint, vérification TypeScript, tests et build passent dans un environnement propre ;
- l’installation du projet est décrite et reproductible.

---

## 14. Fonctionnalités hors MVP et perspectives

- Notifications e-mail et push.
- Application mobile ou PWA complète.
- Vue calendrier et diagramme de Gantt.
- Dépendances entre tâches.
- Temps passé et feuilles de temps.
- Pièces jointes avec stockage objet.
- Intégration GitHub/GitLab.
- Import/export CSV.
- Recherche plein texte PostgreSQL avancée.
- Automatisations personnalisées.
- Système de modèles de projets.
- Multi-langue.
- SSO entreprise.
- Audit de conformité avancé.

---

## 15. Décisions à documenter pendant le développement

Pour chaque décision importante, conserver une trace courte dans la documentation technique :

- choix de la solution d’authentification ;
- choix entre Server Actions et Route Handlers ;
- stratégie de positionnement des cartes Kanban ;
- stratégie d’archivage et de suppression ;
- modèle de permissions ;
- stratégie de recherche ;
- stratégie de cache ;
- choix de déploiement ;
- compromis entre fonctionnalités, sécurité, performance et délai.

