# Panneau admin, statistiques et annonces KamTech

## Comment ça marche

```
Téléphone (jeu, fonctionne sans internet)
  │  les stats anonymes sont gardées dans le téléphone
  │  et envoyées dès qu'il y a du réseau
  ▼
Vercel (dossier server/)
  ├─ /api/events      reçoit les stats (public, écriture seule)
  ├─ /api/promos      donne les annonces actives (public, lecture seule)
  ├─ /                panneau admin, protégé par mot de passe
  └─ /confidentialite politique de confidentialité exigée par Google Play
  ▼
Neon (base de données Postgres gratuite, ajoutée depuis Vercel)
```

Si `www/js/online-config.js` a une adresse `api` vide, le jeu reste 100 % hors ligne : rien n'est envoyé et aucune annonce ne s'affiche.

## En ligne

- **Panneau admin :** https://shadow-strike-admin.vercel.app (projet Vercel `shadow-strike-admin`, base Neon `shadow-strike-db` à Francfort).
- **Politique de confidentialité :** https://shadow-strike-admin.vercel.app/confidentialite
- Le jeu est relié au serveur dans `www/js/online-config.js`.
- **Mot de passe admin :** variable `ADMIN_PASSWORD` du projet Vercel. Pour le changer : Settings → Environment Variables, puis Redeploy.
- **Mettre à jour le serveur :** `cd server && npx vercel deploy --prod` (avec un jeton Vercel).

## Mise en route (une seule fois, déjà faite)

1. **Vercel.** Ouvre le projet `shadow-strike-admin`, puis **Storage → Create Database → Neon** (gratuit) et connecte-le au projet. Vercel ajoute `DATABASE_URL` tout seul.
2. **Mot de passe admin.** Dans **Settings → Environment Variables**, ajoute `ADMIN_PASSWORD` : au moins 10 caractères, à garder pour toi. Coche Production.
3. **Redéployer.** Dans **Deployments**, ouvre le menu « … » du dernier déploiement et choisis **Redeploy**, pour que les deux variables soient prises en compte.
4. **Première connexion.** Ouvre `https://<ton-projet>.vercel.app` et entre le mot de passe. Les tables se créent à ce moment-là.
5. **Relier le jeu.** Mets l'adresse dans `www/js/online-config.js` (`api: 'https://<ton-projet>.vercel.app'`), puis `npx cap sync android` et reconstruis l'APK.
6. **Google Play Console.** Remplis les déclarations (voir plus bas).

## Ce que montre le panneau

- **Joueurs.** Total, actifs sur 24 h et 7 jours, nouveaux joueurs par jour.
- **Rétention.** Part des joueurs qui reviennent le lendemain (J1) et après 7 jours (J7).
- **Difficulté par niveau.** Parties, victoires, défaites et temps moyen. Un niveau sous 35 % de victoires est marqué « Bloquant ».
- **Abandons.** Jusqu'à quel niveau vont les joueurs, pour voir où ils arrêtent.
- **Boutique.** Ce que les joueurs achètent avec leurs diamants.
- **Versions.** Combien de joueurs ont fait la mise à jour.
- **Annonces.** Créer, modifier, activer ou désactiver d'un clic, programmer des dates de début et de fin, voir les vues, les clics et le taux de clic. Un aperçu montre l'annonce telle qu'elle apparaîtra dans le jeu.

## Règles d'affichage des annonces (conformes Google Play)

- Uniquement dans le menu, **après** une partie. Jamais au lancement, jamais pendant un niveau.
- Une seule annonce par session au plus, et chaque annonce revient au plus toutes les 24 h (réglable).
- Marquée « Annonce KamTech » et fermable tout de suite (croix, « Plus tard », bouton retour Android).
- Lien en `https://` obligatoire, qui s'ouvre dans le navigateur du téléphone.
- Niveau minimum réglable (3 par défaut), pour ne pas déranger un joueur qui découvre le jeu.

## Google Play Console : ce qu'il faut déclarer

| Rubrique | Réponse |
|---|---|
| **Annonces** | **Oui, l'appli contient des annonces.** Google compte les pop-up qui font la promotion de tes propres produits comme des annonces. La fiche affichera « Contient des annonces ». |
| **Sécurité des données → Collecte** | Oui. *Activité dans l'appli → Interactions avec l'appli* et *Identifiants de l'appareil ou autres*. Finalité : *Données analytiques*. Non partagées. Chiffrées en transit : oui. |
| **Règles de confidentialité** | `https://<ton-projet>.vercel.app/confidentialite` (remplace d'abord `[ton e-mail de contact]` dans `server/confidentialite.html`). |
| **Public cible** | 13 ans et plus. En dessous, le jeu entrerait dans le programme Familles, aux règles publicitaires beaucoup plus strictes. |

## Tester en local

```bash
cd server && npm install
DATABASE_URL=postgres://… ADMIN_PASSWORD=un-mot-de-passe node dev-server.mjs   # http://localhost:3000
API=http://localhost:3000 node ../tools/test-online.mjs                        # test de bout en bout du jeu
```
