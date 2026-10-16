# Outils réutilisables

Prérequis : Python 3 (numpy, Pillow, onnxruntime pour le détourage), ffmpeg, Node.js + playwright-core
(+ Chromium) pour le rendu HTML.

Les scripts cherchent les ressources relativement à la racine du projet (`assets/logos/`, `fonts/`) :
dans un nouveau projet, copier `python/` dans `outils/`, `05-ressources/logos/` dans `assets/logos/`
et `05-ressources/polices/` dans `fonts/`.

## python/
| Script | Rôle | Usage |
|---|---|---|
| `logo.py` | Vrai logo d'un outil (Wikimedia → Simple Icons → favicon), cache ; `coller()` = pastille + pop | `python3 outils/logo.py "CapCut" [capcut.com]` |
| `detourage.py` | Détourage vidéo RVM resnet50 (alpha par image, 0,1 s/image) | `python3 outils/detourage.py source.mp4 debut duree alpha.mp4 [fps]` |
| `demo_derriere.py` | Exemple complet : texte derrière la personne + multicam simulé + sous-titres | à adapter (`BEATS`, `CAMS`, `PLANS`, `FOND`) |
| `bruitages.py` | Bruitages et instruments synthétisés (whoosh, riser, impact, pop, touche, carillon, kick, basse, pad…) | `from bruitages import *` |
| `zone_securite.py` | Planche avec les zones cachées par les applis (optionnel) | `python3 outils/zone_securite.py video.mp4 sortie.jpg [t…]` |
| `son_pro.py` | Exemple de mix complet : musique, ducking, bruitages calés sur événements, coupes de musique | à adapter |
| `cartes_typo_pro.py` | Exemple « une phrase = un écran » : cartes typo nuit/papier déclenchées au mot | à adapter (`CARTES`) |
| `montage_reel_liste.py` + `son_reel_liste.py` + `finir.sh` | Reel « 3 outils » complet (Djoumi) | à adapter |

## rendu-html/
Pipeline motion design : une page `animation.html` expose `render(t)` (position de chaque élément à partir
du temps seul, déterministe), `window.DUREE` et `window.PRET`. Playwright prend une capture par image.

| Fichier | Rôle |
|---|---|
| `rendu.mjs` | `node rendu.mjs <dossier>` → images ; `node rendu.mjs <dossier> 0 3.5 7` → planche |
| `planche.sh` | `./planche.sh <dossier> 0 3.6 7.3 …` → planche contact à vérifier AVANT le rendu complet |
| `exemple-pub-valex/` | animation.html + son.py + mots.json de la pub Valex (exemple complet) |

Dans ce dépôt, le rendu se fait avec `video/rendu.mjs` (Chromium via CHROMIUM_PATH).
