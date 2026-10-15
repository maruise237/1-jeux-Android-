# Validation Google Play : audit et checklist

Audit réalisé le 15/10/2026 avec le [App Store Compliance Playbook](https://github.com/mjmirza/app-store-compliance), installé dans `~/repositories/app-store-compliance`, avec le skill Claude `app-store-compliance`.

Pour relancer l'analyse :

```bash
bash ~/repositories/app-store-compliance/agent-os/hooks/app-store-compliance-guard.sh .
```

## Résultat de l'analyse automatique : 0 risque critique

| Point signalé | Verdict | Ce qui a été fait |
|---|---|---|
| Pas de politique de confidentialité référencée | **Vrai manque, corrigé** | Bouton bouclier dans le menu : résumé lisible hors ligne et lien vers https://shadow-strike-admin.vercel.app/confidentialite |
| Sauvegarde Android sans règles | **Corrigé** | `data_extraction_rules.xml` et `backup_rules.xml` : seules la progression et les réglages du jeu sont sauvegardés (le joueur garde sa partie en changeant de téléphone) ; aucun identifiant de connexion n'est stocké |
| Lien « don » (`package-lock.json`) | Faux positif | Lien de parrainage d'un auteur de bibliothèque npm, absent de l'appli |
| `localStorage` dans `online.js` | Faux positif | Contient la progression et un identifiant aléatoire anonyme, aucune donnée personnelle. Un interrupteur « Statistiques anonymes » permet au joueur de tout couper : la file d'attente est vidée et l'identifiant remplacé |
| `sessionStorage` dans `server/admin.js` | Hors appli | Panneau admin web (pas dans l'APK). Le jeton est passé en `sessionStorage` : il s'efface à la fermeture du navigateur |
| Règle des 12 testeurs | À faire dans la Play Console | Voir plus bas |

Déjà conformes : API cible 36 (exigée depuis le 31/08/2026), optimisation R8 activée (`minifyEnabled true`), seule permission utilisée : Internet, aucun SDK publicitaire ou analytique tiers, aucun paiement réel, aucun compte à créer.

En plus : la roue de la chance affiche ses chances (« Gratuit · chaque case a 1 chance sur 8 »). Elle n'est pas achetable, mais Google demande la transparence sur les récompenses aléatoires.

## Ce que tu dois remplir dans la Play Console

| Rubrique | Réponse |
|---|---|
| **Règles de confidentialité** | `https://shadow-strike-admin.vercel.app/confidentialite`. |
| **Accès à l'appli** | Toutes les fonctionnalités sont disponibles sans restriction (aucune connexion). |
| **Annonces** | **Oui, l'appli contient des annonces** : les pop-up KamTech comptent comme des annonces maison pour Google. |
| **Classification du contenu (IARC)** | Catégorie Jeu. Violence : oui, **violence stylisée de dessin animé** (éliminations au couteau vues de dessus, sans sang réaliste). Pas de jeux d'argent : la roue est gratuite, sans argent réel, sans achat. Aucune interaction entre joueurs, aucun contenu généré par les utilisateurs, aucune position partagée, aucun achat. Résultat attendu : PEGI 12 ou équivalent. |
| **Public cible** | **13 ans et plus** (13-15, 16-17, 18+). Ne pas cocher moins de 13 ans, sinon le programme Familles s'applique, avec des règles publicitaires strictes. |
| **Sécurité des données → Collecte** | Oui. *Activité dans l'appli → Interactions avec l'appli*, et *Identifiants de l'appareil ou autres*. |
| ↳ Finalité | Données analytiques. |
| ↳ Partage avec des tiers | Non. Vercel et Neon sont des sous-traitants techniques, ce n'est pas du partage au sens de Google. |
| ↳ Chiffrement en transit | Oui (HTTPS). |
| ↳ Collecte facultative | Oui : le joueur peut désactiver les statistiques dans le jeu. |
| ↳ Suppression | Oui, sur demande par e-mail (indiquée dans la politique). |
| **Applis d'actualités, santé, finance, VPN, gouvernement** | Non. |

## Avant la mise en production

1. **Compte développeur personnel récent :** un **test fermé avec au moins 12 testeurs pendant 14 jours d'affilée** est obligatoire avant la production. Lance-le tôt (famille, amis, groupe WhatsApp).
2. Construis un **AAB signé** (Android Studio → Build → Generate Signed App Bundle) et active la **signature d'application par Play**.
3. Augmente `versionCode` à chaque envoi (`android/app/build.gradle`, actuellement 1).
4. **Fiche Play Store :**
   - icône 512 × 512 (déjà générée par `tools/make-icon.mjs`) ;
   - image de présentation 1024 × 500 ;
   - au moins 2 captures d'écran **en jeu**, pas l'écran de démarrage ;
   - une description qui ne promet que ce que le jeu fait vraiment ;
   - aucune mention d'iPhone ou d'autres boutiques.
5. Avant chaque mise à jour : `npx cap sync android`, puis relancer l'analyse ci-dessus.
