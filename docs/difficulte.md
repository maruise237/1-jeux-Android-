# Difficulté et progression

## Niveaux 1 à 30
Inchangés : la difficulté monte automatiquement. Vitesse, portée et dégâts des gardes, nouveaux types d'ennemis, armes tous les 10 niveaux, cartes plus grandes.

## Rythme par blocs de 10 (dès le niveau 31)

| Position | Rôle | Récompense | Taux de victoire visé |
|---|---|---|---|
| x1 | Respiration (2 gardes de moins) ; c'est là qu'apparaissent les nouvelles cartes | normale | ~90 % |
| x2–x4, x6–x8 | Normal | normale | ~75–80 % |
| x5 | **DIFFICILE** : 1 garde de plus, lasers un peu plus longs | butin ×1,5 | ~60 % |
| x9 | **TRÈS DIFFICILE** : 1 garde, 1 laser, 1 mine et 1 bouclier de plus | butin ×2 | ~45 % |
| x0 | Boss | normale | ~60 % |

Les niveaux difficiles sont annoncés : badge sur le bouton DÉMARRER, niveau en rouge dans l'interface de jeu, bandeau au début du niveau.

## Gardes adaptés à la puissance du joueur (dès le niveau 31, montée progressive jusqu'au 40)
- Puissance = vie réelle × vitesse réelle de l'assassin (niveau du héros, améliorations, bonus du héros), comparée à l'assassin de départ.
- Les gardes rattrapent environ un tiers de l'écart : **au plus +35 % de dégâts et des réactions 15 % plus rapides**. Leur vitesse ne change jamais.
- Nombre de tirs encaissés : débutant 3, équipement moyen 5, tout au maximum 7 à 8 (11 avant).
- Un joueur qui n'a rien acheté n'est pas concerné. Les niveaux vérifiés par le robot restent donc gagnables.

## Garde-fou
Après **3 défaites de suite sur le même niveau**, les gardes y deviennent 10 % moins dangereux (dégâts et réactions), jusqu'à la victoire. Rien n'est affiché.

## Paliers après le niveau 60 (plafond au niveau 100)

| Niveaux | Ajout |
|---|---|
| 61+ | Lasers allumés 0,2 s de plus |
| 71+ | 1 mine de glace de plus |
| 81+ | 1 garde à bouclier de plus autorisé |
| 91+ | 1 garde de plus (11) |
| 101+ | Plus aucune hausse : seulement de la variété (cartes 101–120 en boucle) |

## Nouvelles cartes (mêmes éléments de décor)

| Découverte | Carte | Principe |
|---|---|---|
| 51 | Le Jardin | Beaucoup d'herbes hautes, peu de murs |
| 61 | Les Docks | Allées de conteneurs |
| 71 | Le Laboratoire | Pièces reliées par des portes (2 par mur), avec les lasers dans les portes ; 1 garde de moins |
| 81 | La Cour | Place centrale entourée de piliers, herbe dans les coins |
| 91 | Le Champ de mines | Couloirs en zigzag (2 passages par mur), 1 mine explosive de plus ; 1 garde de moins |
| 100 | Le QG | Boss avec deux élites en escorte |

Après sa découverte, chaque carte entre dans la rotation : environ 40 % de cartes classiques et 60 % de cartes spéciales.

## Petites nouveautés
- **Garde endormi** (dès le niveau 33, environ 1 niveau sur 2) : il ne voit rien et des « z » flottent au-dessus de sa tête. Tout bruit proche le réveille.
- **Défi éclair** (dès le niveau 6) : chrono ⚡ dans l'interface de jeu. Finir avant la fin du chrono rapporte +10 + n° du niveau en diamants.
- **Bandeau « Nouvelle carte : … »** à chaque découverte.

## Vérification (faite le 15/10/2026)
- Niveaux 1–120 gagnés par le robot avec l'assassin le plus faible.
- Niveaux 31–120 gagnés aussi avec un assassin au maximum (Kami niveau 20, toutes les améliorations, couteau Plasma) face aux gardes adaptés.
- Au premier passage, le Laboratoire et le Champ de mines étaient trop chargés (6 niveaux impossibles) : ils ont été adoucis comme indiqué plus haut.

- `npm run verify-levels -- --from 31 --to 120` : le robot joue avec l'assassin le plus faible et garde, pour chaque niveau, la première carte qu'il arrive à gagner.
- `npm run verify-levels -- --from 31 --to 120 --max` : rejoue ces cartes avec un assassin au maximum, face aux gardes adaptés.
- Ensuite, ajuster avec les vrais chiffres du panneau admin : taux de victoire par niveau, comparé aux objectifs du tableau ci-dessus.
