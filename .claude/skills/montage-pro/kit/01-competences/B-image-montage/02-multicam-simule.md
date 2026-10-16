# Multicam simulé (tournage à une seule caméra)

Quand la vidéo est filmée sous UN seul angle, on simule des changements de caméra par recadrage.

| Caméra virtuelle | Zoom | Centre x |
|---|---|---|
| large | ×1,00 | 0,50 |
| serré | ×1,22 | 0,46 (décalé) |
| gros plan | ×1,42 | 0,52 |

## Règles
- **Coupe sèche** sur les respirations / fins de phrase, toutes les 1–2,5 s.
- Jamais deux plans identiques d'affilée.
- Dans chaque plan : micro-zoom continu +2 %.
- **Gros plan sur les mots forts.**
- Limite de netteté : source 432 px de large → max ×1,45 ; source 1080 px+ → ×2 possible.
- Pas de bruitage sur ces coupes (coupe « invisible »).
- Si on a un titre derrière la tête, le recaler sur la tête à chaque plan.

## Alternative au tournage (Fabien Faro, 144 k likes avec 1 caméra)
Objectif ultra grand-angle posé bas : il **marche vers l'objectif** (plan pied → gros plan en 2 pas),
pousse sa tasse vers la lentille → profondeur énorme. Puis coupe sèche, il est de nouveau loin.

## Code
`04-outils/python/demo_derriere.py` : voir `CAMS` et `PLANS`.
