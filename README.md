# Shadow Strike — by KamTech

Jeu mobile d'infiltration en vue du dessus. Tu es un assassin armé d'un couteau :
élimine tous les gardes sans entrer dans le faisceau de leur lampe torche.

- **Déplacement** : touche le sol (ou glisse le doigt), un chemin pointillé s'affiche.
- **Élimination** : touche un garde, ton héros le traque et l'élimine par surprise.
- **Gardes** : 5 types (pistolet, fusil, fusil à pompe…) avec lampe torche, alerte « ! »,
  recherche « ? » et réaction au bruit quand un collègue tombe.
- **Pièges** : lasers rouges clignotants, mines de glace qui gèlent les gardes.
- **Butin** : explosion de gemmes 💎 aspirées vers le héros, bonus et 1 à 3 étoiles par mission.
- **10 héros** à débloquer (+Vitesse / +Vie), dont Kami, le héros KamTech.
- **Sons et musique** synthétisés en direct (aucun fichier audio), vibrations, tremblement d'écran.
- **Niveaux infinis**, 3 décors (béton, brique, dalles), difficulté progressive.
- **Aucune publicité, aucun achat intégré.**

Code, nom et graphismes 100 % originaux, © KamTech Studio.

## Jouer dans le navigateur

Ouvre `www/index.html` dans Chrome, ou lance :

```bash
npm start
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
