# Audit UI/UX : menus et fenêtres

Outils utilisés : skills `impeccable` (audit + détecteur anti-slop), `game-ui-ux`, `web-design-guidelines`.
Captures de toutes les fenêtres en 360×640 et 412×915 : `node tools/ui-shots.mjs <dossier>`.

## Corrigé

| Gravité | Problème | Correction |
|---|---|---|
| P0 | En 360×640, le bouton DÉMARRER était sous le bord de l'écran. | Mise en page compacte pour les écrans de 720 px de haut ou moins, et bouton collé en bas. |
| P0 | Écran de victoire sur petit téléphone : le titre était coupé en haut et impossible à atteindre en défilant. | `justify-content: safe center` sur toutes les fenêtres, plus une version compacte. |
| P0 | Le bouton retour d'Android fermait l'application en pleine partie. | Plugin `@capacitor/app`. Retour : partie → pause → reprise, boutique/héros/résultat → menu, menu → quitter. Échap fait pareil sur PC. |
| P1 | Le conseil en jeu restait visible à travers l'écran de pause. | Masqué pendant la pause. |
| P1 | Boutons « trop cher » : texte blanc et rose sur gris clair, illisible. | Pastille sombre avec le prix en rouge, comme sur les cartes héros. |
| P1 | Pastille de mission en cours : bleu sur gris, faible contraste. | Pastille sombre, libellé lisible. |
| P1 | Libellés des cartes du menu avec un contour de 1 px, illisibles sur jaune, turquoise et rose. | Contour de 2 px, le même que les autres boutons. |
| P2 | Bandeau latéral jaune sur le conseil (signature typique d'une interface générée par IA). | Remplacé par une pastille « i » dessinée. |
| P2 | Croix de fermeture en caractère Unicode ✕. | Icône SVG dessinée. |
| P2 | « CHOISIS TON HÉROS » sur 2 lignes, qui passait sous le bouton fermer. Titre de la boutique en doublon de l'onglet actif. | Titres « ASSASSINS » et « BOUTIQUE », largeur limitée. |
| P2 | « MISSION RÉUSSIE » avec un « ! » seul sur sa ligne. | Espace insécable avant « ! ? : ; » (typographie française) et retour à la ligne équilibré. |
| P2 | Écran de défaite : conseil noyé dans la ligne de score, texte redondant, « +0 XP » inutile. | Score seul, conseil dans sa propre carte, « +0 XP » masqué. |
| P3 | Pas de focus visible (clavier/manette, Chromebook). | Contour de focus blanc, bouton « Entraîner » accessible au clavier. |

## Gardé volontairement (choix du genre, pas du « slop »)

- **Ombres pleines décalées, reflet brillant sur les boutons, titres inclinés.** C'est le langage visuel des jeux mobiles d'arcade (Hunter Assassin, Brawl Stars) que le menu de référence suivait.
- **Alertes « contraste faible » du détecteur sur les gros boutons.** Faux positifs : il mesure le texte blanc contre le haut du dégradé sans voir le contour noir de 2–3 px.
- **Ressort sur les étoiles et sur le gain de la roue.** C'est le moment de récompense : il doit rebondir.
