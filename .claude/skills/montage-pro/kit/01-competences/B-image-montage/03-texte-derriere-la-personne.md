# Texte derrière la personne (effet magazine)

Marqueur n°1 du « pro » vs « template »… **à condition de ne pas en abuser.**

## Quand
- Seulement s'il y a de la place au-dessus de la tête (≥ 15 % de l'écran) et pas de mains devant le visage.
- **2 à 4 fois par vidéo** : hook, changements de chapitre, CTA. Le reste du temps : image naturelle.
- Sur un fond très chargé (pagne à motifs) : préférer une **étiquette crème inclinée** avec le mot,
  plutôt que du texte blanc flottant illisible.

## Calques (de l'arrière vers l'avant)
1. Fond (vidéo) **légèrement** assombri ×0,45 + flou 3 px + vignette. Jamais sous ×0,40
   (à ×0,30 on voyait que la personne était détourée). L'assombrissement arrive **progressivement avec le titre**.
2. TITRE GÉANT (~96 % de la largeur) : ~45 % du mot sous le haut de la tête (mesuré sur l'alpha).
3. Personne détourée.
4. Sous-titres.

Petit mot d'accompagnement au-dessus (« épisode 01 » + « PODCAST », « la » + « RÉVOLUTION »).

## Détourage : banc d'essai (fond tissu à motifs, pire cas)
| Outil | Résultat |
|---|---|
| rembg u2net_human_seg | perd la personne ✗ |
| rembg isnet-general-use | garde parfois seulement le visage ✗ |
| mediapipe selfie multiclass | masque flou, laisse passer le tissu ✗ |
| BiRefNet portrait | très propre mais 30 s/image, saturation mémoire ✗ |
| **RVM resnet50 (ONNX)** | **propre, cheveux OK, 0,1 s/image, stable dans le temps ✓** |
| RVM mobilenet | 0,05 s/image, pour les longues vidéos |

Image fixe (portrait) : remplissage depuis les bords (pub Valex v2).

## Code
`04-outils/python/detourage.py` (alpha vidéo) + `04-outils/python/demo_derriere.py` (exemple complet).
