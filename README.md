# Shadow Strike — by KamTech

Jeu mobile d'infiltration en vue du dessus. Tu es un assassin armé d'un couteau :
élimine tous les gardes sans entrer dans le faisceau de leur lampe torche.

- **Déplacement** : touche le sol (ou glisse le doigt), un chemin pointillé s'affiche.
- **Élimination** : touche un garde, ton héros le traque et l'élimine par surprise.
- **Ennemis qui montent en puissance** :
  voyous (pistolet) → gardes du corps → évadés armés (fusil) → **gardes à bouclier**
  (invincibles de face : prends-les de dos ou gèle-les) → soldats → colosses blindés
  (fusil à pompe, gros dégâts mais lents) → commandos d'élite.
  Arsenal tenu à deux mains : pistolet, mitraillette, fusil d'assaut, fusil à pompe, fusil à énergie,
  canon lourd en T. Tous les 10 niveaux, l'équipement progresse : lampe tactique, puis lunette et
  visée laser, puis armes en or. Les gardes à bouclier sont armés et tirent si on les heurte de face.
  Certains gardes patrouillent en binôme.
  Lampe torche avec halo, alerte « ! », hésitation « ? » après un bruit, bulles de discussion
  entre gardes, flèches rouges vers les ennemis hors écran.
- **Pièges** : lasers rouges clignotants, mines de glace qui gèlent les gardes et, dès le niveau 12,
  **mines explosives** (rouges) : le héros les déclenche en passant dessus, puis doit fuir ;
  l'explosion tue les poursuivants, blesse le héros s'il est trop près et **détruit les murs**.
- **Mine de glace** : déclenchée par le héros, elle gèle tout autour après un court délai,
  y compris le héros s'il est resté trop près ; les gardes non gelés peuvent alors le tirer.
- **Herbe** : les carrés de gazon se traversent et cachent le héros des lampes torches.
- **Caisses de butin** (rester à côté pour les ouvrir) et **clés** : 3 clés ouvrent un coffre bonus.
- **Décor** : salles reliées par des passages balisés jaune/noir, clôtures, conteneurs, piliers,
  carrés de gazon, sol en béton taché ; les gardes éliminés laissent une tache au sol.
- **Interface** : compteur de cibles (viseur), points de vie en milliers et dégâts affichés,
  flèche orange vers la destination ou la cible.
- **Butin** : explosion de gemmes 💎 aspirées vers le héros, bonus et 1 à 3 étoiles par mission.
- **10 héros** à débloquer (+Vitesse / +Vie), dont Kami, le héros KamTech.
- **Héros détaillés** : visages, coiffures, tenues, couteaux de combat (lame dorée, de glace,
  rouge ou verte pour les héros premium).
- **Sons et musique** synthétisés en direct (aucun fichier audio), vibrations, tremblement d'écran.
- **Niveaux infinis**, 5 décors qui changent tous les 5 niveaux (intérieur carrelé à murs bleus,
  entrepôt, jardin à haies, béton, labo). Les premiers niveaux sont petits avec 2-3 gardes.
- **Combat de boss tous les 10 niveaux** : « Le Colosse » au masque à gaz, plus grand, armé d'un
  canon ; il faut plusieurs coups de couteau (il est sonné puis riposte), les mines l'affaiblissent.
- **Expérience des héros** : chaque élimination et victoire donne de l'XP ; chaque niveau de héros
  ajoute +4 % de vie et +1,5 % de vitesse (niveau 20 max).
- **Nouvel assassin** : chaque victoire remplit 25 % d'une jauge qui débloque gratuitement le
  prochain héros. **Roue de la chance** tous les 5 niveaux (gemmes, clé, XP), sans publicité.
- **Aucune publicité, aucun achat intégré.**

Code, nom et graphismes 100 % originaux, © KamTech Studio.

## Jouer dans le navigateur

Ouvre `www/index.html` dans Chrome, ou lance :

```bash
npm start
```

## Difficile, mais toujours gagnable

La difficulté augmente (plus de gardes, meilleurs équipements, cartes plus grandes),
avec des plafonds pour ne jamais rendre un niveau impossible :

- les gardes sont toujours **plus lents que le héros le plus lent** ;
- aucun tir ne tue d'un coup : le héros de base **survit toujours à 2 tirs** ;
- les gardes ont un **temps de réaction** (0,35 s minimum) pour qu'on puisse s'échapper ;
- le point de départ n'est **jamais visible** par une patrouille, et au moins
  **65 % de la carte est dans l'ombre** au départ ;
- au plus **un garde pour 16 cases libres**, et la carte s'agrandit avec les niveaux ;
- une **mine de glace est garantie** dès qu'il y a des gardes à bouclier.

En plus, chaque niveau publié est **vérifié automatiquement** : un robot joue tous les
niveaux de 1 à 60 avec le héros de base (le plus faible). Si le robot ne gagne pas,
une autre disposition de carte est essayée jusqu'à en trouver une gagnable
(`www/js/levels.js`). Au-delà du niveau 60, toutes les difficultés sont à leur plafond :
le jeu réutilise des cartes vérifiées, avec l'équipement ennemi qui continue d'évoluer.

Après toute modification de l'équilibrage, relance la vérification :

```bash
npm install
npx playwright install chromium   # une seule fois
npm run verify-levels
```

## Léger par conception

- Le jeu (`www/`) pèse **~95 Ko** police comprise : pas de moteur, pas de bibliothèque,
  pas d'image ni de son embarqués, tout est dessiné et synthétisé par le code.
- Fonctionne **100 % hors ligne**, **aucune permission** demandée.
- Build release optimisé (`minifyEnabled` + `shrinkResources`).
- Publié en `.aab`, chaque téléphone ne télécharge que les ressources de sa taille d'écran
  (environ 3 à 4 Mo installé, l'essentiel étant le socle Android/Capacitor).

## Créer l'app Android

Prérequis : [Node.js 22+](https://nodejs.org) et [Android Studio](https://developer.android.com/studio).
Le projet Android (`android/`) est déjà généré et configuré : portrait, icône KamTech,
écran de démarrage, `targetSdk 36` (conforme aux exigences actuelles du Play Store).

```bash
npm install
npm run android:sync     # copie le jeu dans le projet Android (après chaque modification de www/)
npm run android:open     # ouvre Android Studio
```

Dans Android Studio : **Run ▶** pour tester sur ton téléphone (mode développeur + débogage USB activés).

Pour changer l'icône : modifie `assets/icon.svg`, exporte-la en `assets/icon-only.png` (1024×1024),
puis lance `npx @capacitor/assets generate --android`.

## Signer l'APK au nom de KamTech (Play Store)

1. Crée ta clé de signature (une seule fois, **garde-la précieusement** : sans elle, impossible de publier des mises à jour) :

   ```bash
   keytool -genkey -v -keystore kamtech-release.jks -alias kamtech \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -dname "CN=KamTech Studio, O=KamTech"
   ```

2. Dans Android Studio : **Build → Generate Signed App Bundle / APK**, choisis
   `kamtech-release.jks` et l'alias `kamtech`.
3. Envoie le fichier `.aab` sur la [Google Play Console](https://play.google.com/console)
   (inscription unique de 25 $).

Les fichiers `.jks` sont exclus de Git (`.gitignore`) : ne publie jamais ta clé.

## Checklist Play Store

- [ ] Compte développeur Google Play (25 $, une fois).
- [ ] `.aab` signé (voir ci-dessus). Avant chaque mise à jour, augmente `versionCode`
      dans `android/app/build.gradle`.
- [ ] **Politique de confidentialité** : `docs/privacy-policy.html`. Remplace
      `[TON EMAIL DE CONTACT]`, puis publie-la (ex. GitHub Pages) et colle l'URL dans la Play Console.
- [ ] **Sécurité des données** : « Aucune donnée collectée ni partagée ».
- [ ] **Classification du contenu** : questionnaire IARC (violence stylisée, sans sang réaliste).
- [ ] Fiche : icône 512×512 (`assets/icon-only.png` redimensionnée), bannière 1024×500,
      au moins 2 captures d'écran téléphone.
- [ ] **Nouveau compte personnel** : Google impose un test fermé avec au moins 12 testeurs
      pendant 14 jours avant la mise en production.

## Crédits

Police Lilita One par Juan Montoreano, licence SIL Open Font License (`www/fonts/OFL.txt`).
