# Bruitages

## Quantité selon le type
| Type | Bruitages / minute |
|---|---|
| Tuto à captures | 60–80 (Toprak 81) |
| Vulgarisation | 20–40 |
| Long format | ~20 |

## Quel son pour quelle action
| Son | Quand |
|---|---|
| **whoosh** | Transition d'écran — environ **une coupe sur deux**, pas toutes |
| **clic / touche** | Chaque clic du curseur, chaque lettre tapée |
| **pop** | Apparition d'un logo, sticker, mot, bulle |
| **impact grave** | Mot géant, B-roll choc, nom du produit (Faro : 27 impacts sur une vidéo) |
| **riser** | 1–1,5 s avant la coupe qui lance la musique |
| **carillon** | Fin, URL, réussite |
| **glitch** | Effet tech / erreur |
| **tic** | Compteur, étape |

## Règles
- Un bruitage doit coller à une **action visible**.
- Pas de bruitage sur une coupe « invisible » (punch-in, multicam simulé).
- **Un whoosh ne masque jamais un mot** : le finir AVANT le mot (démarrer à t − 0,40 s).
- Caler les bruitages sur un fichier d'événements (`evenements.json` : temps + type) généré depuis l'animation.

## Code
`04-outils/python/bruitages.py` : `whoosh`, `riser`, `impact`, `pop`, `tic`, `touche`, `glitch`,
`carillon`, `caisse`, `etincelle`, `allumage` (numpy mono 44,1 kHz, synthétisés : aucun droit d'auteur).
