# Analyse vidéo : feedback et « juice »

Référence : capture de 19 s d'un jeu du même genre, fournie par le client. Elle a été découpée image par image (2 à 8 images par seconde) pour isoler chaque effet. Aucun élément visuel ou sonore n'a été copié : seuls le rythme et l'intention de chaque effet ont été repris, puis refaits avec le style du jeu.

| Moment | Ce que montre la vidéo | Ce qui a été fait dans Shadow Strike |
|---|---|---|
| Ouverture | Fondu depuis le noir. La caméra part du haut du niveau et descend vers le héros. Un grand anneau cyan se resserre sur lui. | Fondu bleu nuit de 0,5 s. La caméra glisse du haut de la carte vers le héros, avec un suivi plus lent pendant l'intro. Un anneau de 4,2 cases se referme sur le héros. Son : souffle montant, puis « ping » au moment où l'anneau se pose. |
| Élimination | Gel bref de l'action, anneau rouge qui s'élargit, butin qui jaillit en gerbe puis est aspiré vers le héros. | Anneau de choc rouge. Les diamants sautent et rebondissent (hauteur et ombre) avant d'être aspirés. |
| Compteur de butin | « +1 », puis « +6 », puis « +10 » au-dessus du héros : le chiffre monte à chaque billet ramassé. | Compteur « +N » avec une icône de diamant au-dessus du héros. Il grossit brièvement à chaque gain et s'efface 1 s après le dernier. Remplace l'ancien chiffre fixe affiché à l'endroit du garde. |
| Son du butin | Petits « clings » rapprochés. | Chaque diamant consécutif monte un peu en hauteur de son, comme un jackpot. La série repart de zéro après 0,4 s de pause. |
| Coffre ou tas de butin | Il faut rester dessus : un cercle se remplit, puis une explosion verte libère le butin. | Remplissage circulaire de 0,45 s, avec des tics sonores qui montent. Le cercle se vide si on s'éloigne. À l'ouverture : anneau vert et gerbe de diamants plus large. |
| Dégâts reçus | Bords de l'écran rouges et chiffres de dégâts. | Le flash rouge plein écran est remplacé par un flash sur les bords : le centre reste lisible. |
| Roue de la chance | (détails de finition) | La flèche « claque » à chaque case, des ampoules clignotent sur le bord, la case gagnante pulse, le résultat apparaît avec un effet de rebond et une vibration. |
| Accessibilité | — | Avec « réduire les animations » activé dans le système, les secousses de caméra sont réduites à 35 %. |

À vérifier en test sur téléphone :
- la durée du remplissage du coffre (0,45 s) ;
- le volume du souffle de l'intro.

## Deuxième passe (retours du client)

- **Bulles au-dessus des gardes** (émoticônes « :D ») : supprimées, elles n'existent pas dans la référence.
- **Caisse de butin** : les diamants posés au sol sont remplacés par une petite caisse bleue cerclée d'or. Lumière qui filtre par la fente du couvercle, petit saut régulier pour attirer l'œil, halo chaud. Rester dans le grand cercle (1,15 case) le remplit depuis le centre en 0,8 s, pendant que la caisse tremble de plus en plus puis clignote en blanc. Ensuite : éclat, anneau vert, débris de planches et d'acier, diamants qui s'étalent légèrement, restent au sol un court instant, puis sont aspirés vers le héros. Contenu : 6 + niveau/4 diamants.
- **Corps** : les gardes éliminés restent au sol, comme dans la référence.
- **Réaction des gardes** : la jauge « œil » est supprimée. Un garde qui voit le héros passe en alerte tout de suite. Délai avant le tir : 50 % de son temps de réaction à bout portant, 95 % au bout de son champ de vision.
- **Couleur des diamants** : bleu saphir profond au lieu du cyan pâle, avec un halo bleu qui les suit en vol.
- **Bug corrigé** : un garde qui dégelait après une mine de glace pouvait obtenir une direction invalide et bloquer le jeu.

## Troisième passe (retours du client)

- **Corps des gardes** : ils ne restent plus au sol en gris foncé. Le corps tombe, reste 0,7 s, puis s'enfonce et se dissout en 0,45 s dans une petite bouffée de fumée. Seule la tache reste. Un garde gelé qui éclate disparaît tout de suite.
- **Difficulté relevée** :
  - gardes plus rapides (1,5 au lieu de 1,35 au départ, même plafond) ;
  - lampe torche plus longue (+0,25 case, même plafond) ;
  - dégâts de base 20 au lieu de 16 (le plafond qui garantit de survivre à 2 tirs ne change pas).

  Sur les niveaux 1 à 29 seulement :
  - tir 15 % plus rapide ;
  - délai avant le premier tir raccourci (40 % à 85 % du temps de réaction) ;
  - un garde qui crie alerte ses collègues jusqu'à 4,4 cases au lieu de 3,6.

  Les niveaux 30 à 60 étaient déjà à la limite de ce que le bot sait gagner : appliquer ces réglages partout rendait 5 niveaux impossibles. Les 60 niveaux sont revérifiés par le bot avec le héros le plus faible.
- **Son plus fort et plus « épique »** :
  - Le compresseur par défaut du navigateur écrasait tout le mixage d'environ 12 dB. Il est remplacé par un vrai bus master : compresseur doux, gain de compensation (+5,6 dB), puis limiteur pour éviter la saturation.
  - Tous les bruitages enregistrés sont normalisés au même niveau crête.
  - Un impact grave (sub-basse + choc sourd) est ajouté sous l'élimination, les dégâts reçus, l'ouverture de caisse, l'explosion, l'apparition du héros, les étoiles, la victoire et la défaite.
  - L'alerte « repéré » gagne une note grave menaçante.
  - Les tons synthétiques (diamants, tics, victoire) sont environ deux fois plus forts.
  - La musique passe de 0,2 à 0,26.
- **Mines** :
  - La mine explosive a un cœur rouge vif et un halo rouge au sol, qui perce la pénombre. Une fois déclenchée, elle fait « tit… tit… tit-tit-tit » pendant 1,6 s. Les bips accélèrent et montent, le voyant et le cœur flashent à chaque bip, une petite vibration accompagne chacun, et la zone d'explosion se remplit de rouge.
  - La mine de glace est bleu vif avec un halo bleu. Elle émet des bips aigus qui accélèrent pendant 0,8 s.
- **Défaite** : l'écran affiche « 0 » et « Mission échouée : rien n'est gagné » au lieu de « −57 ».
- **Logo et icône** :
  - « STRIKE » passe en rouge. Le bouton JOUER est rouge doux au lieu de jaune.
  - Le fond du menu est uni, sans dégradé.
  - L'icône Android montre le héros du jeu vu de dessus, couteau levé, sur fond rouge. Elle est générée par `tools/make-icon.mjs`.
- **Répartition et patrouilles des gardes** :
  - Les postes sont étalés sur toute la carte : pour chaque garde, le générateur choisit, parmi 16 tirages, le point le plus éloigné des autres gardes.
  - Chaque garde possède la zone la plus proche de son poste et y patrouille en boucle, avec des points de passage éloignés les uns des autres.
  - Un bruit n'attire plus que les 2 gardes les plus proches. Les autres tournent la tête vers le bruit un instant, puis reprennent leur ronde.
  - Une fouille dure 2 tours au lieu de 3, avec 1 s d'observation au lieu de 1,3 s, puis le garde retourne à sa ronde.
