# Revue gameplay, UX, son et visuel — Shadow Strike

Démarche : recherche des bonnes pratiques → liste de modifications → **critique du chef produit
avant chaque choix** (gain joueur, risque, coût) → décision → implémentation une par une →
vérification automatique des 60 niveaux.

## Ce que dit la recherche

- **Game feel / « juice »** : flash, tremblement, texte flottant, son et particules transforment
  un jeu correct en jeu agréable, sans toucher à l'équilibrage. À doser : trop de tremblement
  fatigue. Arrêt sur image (« hit-stop ») de 50 à 100 ms sur les coups lourds ; plus long = saccade.
  L'intensité du retour doit suivre le poids de l'action.
- **Infiltration** : une jauge de détection progressive (et non vu/pas vu instantané), avec
  un délai de pardon, et un retour visuel qui montre *pourquoi* on est repéré.
  Les gardes doivent quitter leur ronde pour enquêter sur un bruit.
- **Son** : hiérarchie de mixage (effets du joueur au-dessus de la musique), musique qui baisse
  (« ducking ») sur les gros événements, 3 à 5 variantes par son, éviter la répétition et
  l'empilement du même son, formats compressés (MP3/AAC) sur mobile.
- **UX mobile** : zones tactiles d'au moins 44 pt, actions principales sous le pouce,
  apprendre en jouant (un mécanisme à la fois, astuces en contexte), premières victoires rapides ;
  la majorité des joueurs ne reviennent pas après une première session ratée.

## Liste des modifications, critique et décision

| # | Modification | Critique du chef produit | Décision |
|---|---|---|---|
| 1 | **Jauge de détection** au-dessus du garde : elle se remplit quand il te voit (vite de près, lentement de loin), le cône vire à l'orange ; pleine → alerte « ! ». Si tu sors du cône à temps, elle redescend et le garde vient vérifier. | + Le joueur comprend pourquoi il est repéré : c'est la 1ʳᵉ cause de frustration dans un jeu d'infiltration. − Risque de rendre le jeu trop facile. → Remplissage court (0,7 s au niveau 1, 0,35 s plus tard), instantané à bout portant. | **Retenu** |
| 2 | **Hit-stop** de 60 ms à chaque élimination au couteau + flash blanc sur la victime + petite secousse orientée. | + Chaque élimination « claque ». − Une pause trop longue ou répétée donne une impression de lag. → 60 ms max, pas de cumul, rien sur les éliminations par explosion (déjà un gros effet). | **Retenu** |
| 3 | **Séries d'éliminations** : « DOUBLE ! », « TRIPLE ! », « MULTI ×4 » si les éliminations s'enchaînent en moins de 2,5 s, avec gemmes bonus. | + Récompense le jeu rapide et donne des moments forts. − Peut pousser à foncer au lieu de s'infiltrer. → Bonus modeste (2 gemmes par niveau de série), aucune pénalité si on joue lentement. | **Retenu** |
| 4 | **Musique dynamique** : couche de tension (pulsation grave + charleston) quand un garde t'a repéré, qui retombe en douceur ; musique baissée pendant les explosions ; limitation du même son joué en rafale. | + L'oreille annonce le danger avant les yeux, le mix reste propre. − Un changement brutal agace. → Fondus progressifs, pas de coupure. | **Retenu** |
| 5 | **Battement de cœur** quand la vie est sous 35 %, en plus du vignettage rouge existant. | + Signal d'urgence clair, même sans regarder la barre de vie. − Peut devenir pénible. → Volume faible, uniquement en jeu, s'arrête dès qu'on remonte. | **Retenu** |
| 6 | **Option vibrations** (bouton 📳 dans le menu et la pause). | + Accessibilité et confort, attendu par les joueurs Play Store, économise la batterie. − Un bouton de plus. → Placé à côté de son/musique, même style. | **Retenu** |
| 7 | **Caméra qui anticipe** : elle se décale légèrement dans la direction du déplacement. | + On voit mieux les dangers devant soi sur un petit écran. − Peut donner le mal de mer. → Décalage limité à 1 case, lissé. | **Retenu** |
| 8 | **Retour tactile sur les boutons** (enfoncement) | Déjà présent (enfoncement de 3 à 5 px). Les zones tactiles font plus de 44 pt. | Rien à faire |
| 9 | **Pause automatique** quand on quitte l'app | Déjà présent (`visibilitychange`). | Rien à faire |
| 10 | **Bruit de pas du héros entendu par les gardes** | − Punirait le geste de base (toucher pour se déplacer) sans que le joueur comprenne pourquoi ; contraire à « simple à prendre en main ». | **Rejeté** |
| 11 | **Tutoriel guidé avec une main animée** au niveau 1 | + Utile. − Le niveau 1 a déjà une astuce en contexte et se gagne en quelques secondes ; coût élevé pour un gain faible aujourd'hui. | **Reporté** |

## Garde-fou

Après les modifications, le robot rejoue les 60 niveaux avec le héros le plus faible :
chaque niveau doit rester gagnable (`npm run verify-levels`).

## Sources

- [Wayline — Game Feel & Juice](https://www.wayline.io/learn/game-feel/1)
- [eastondev — Where does game feel come from](https://eastondev.com/blog/en/posts/dev/20260521-game-feedback-feel/)
- [Bugnet — Game feel: why juice matters](https://bugnet.io/blog/game-feel-why-juice-matters-and-how-to-add-it)
- [N2H Games — Mechanical breakdown: enemy behavior](https://n2h-games.itch.io/stealth-game-prototype/devlog/849809/mechanical-breakdown-enemy-behavior)
- [Godot genre stealth (guide)](https://skillselion.com/skills/thedivergentai/gd-agentic-skills/godot-genre-stealth)
- [Game Audio Principles](https://skills.sh/vudovn/antigravity-kit/game-audio)
- [UX Planet — Game Design UX Best Practices](https://uxplanet.org/game-design-ux-best-practices-the-ultimate-guide-4a3078c32099)
- [Adrian Crook — Best Practices For Mobile Game Onboarding](https://adriancrook.com/?p=8055)
- [PocketGamer.biz — First-time user experience](https://www.pocketgamer.biz/news/77289/pgc-digital-how-to-enhance-the-first-time-user-experience/)

## Passe visuelle « moins généré » (retours joueur)

| Retour | Correction |
|---|---|
| On gardait les diamants en mourant | Les diamants ramassés pendant le niveau sont perdus si on meurt ; l'écran d'échec affiche « −N » en rouge. On garde seulement l'XP. |
| Les diamants ressemblaient à des carrés | Vrai diamant taille brillant (facettes, éclat qui scintille, rotation quand il vole) ; même dessin en SVG pour l'icône du HUD et des menus. Les caisses vertes sont remplacées par des diamants posés au sol, ramassés au contact. |
| Pièges plats | Mine de glace : boîtier métal avec ombre portée, boulons, dôme de verre, givre et vapeur. Mine explosive : mine kaki à moitié enterrée, bord strié, plaque de pression, voyant. |
| Laser | Émetteur fixé au mur d'un côté, récepteur en face, faisceau lumineux qui scintille, poussière dans le rayon, lueur rouge au sol, préchauffe visible avant l'allumage. |
| Détails « faits par une IA » | Émojis remplacés par des icônes dessinées (son, musique, vibration, clé) ; plus de capitales espacées, de séparateurs « · » ni de pied de page en double ; textes d'astuce sans « ⚠ », « 👆 », « 💥 ». |

Pas de modèle CC0 vu de dessus trouvé pour ces objets (Kenney, OpenGameArt) : ils sont dessinés dans le code, dans le style des personnages.

## Audit du studio CCGS (game design, UX, direction artistique)

Quatre agents du kit Claude Code Game Studios ont audité le jeu : game-designer avec level-designer, ux-designer avec accessibility-specialist, art-director avec technical-artist, et qa-lead avec performance-analyst. Voici ce qui a été appliqué.

**Gameplay**
- **Foncer de face sur un garde ne garantit plus la victoire.** Le garde commence à viser pendant qu'il reconnaît le héros. La zone de repérage instantané passe de 1,3 à 0,9 case.
- **Le laser devient un fil d'alarme.**
  - Le toucher déclenche une alarme : les gardes à moins de 5 cases accourent.
  - Il brûle 8 % de la vie, quel que soit le héros.
  - Il arrête le déplacement du héros et ne coûte pas les 3 étoiles.
  - Le chemin tracé au toucher contourne les lasers quand c'est possible.
  - Le laser reste allumé plus longtemps au fil des niveaux : de 1,2 s à 2 s.
- **Ses propres explosions ne coûtent plus les 3 étoiles.** Les étoiles veulent dire « aucun garde ne m'a vu ».
- **Gardes à bouclier.** Toucher un garde à bouclier dirige vers la case derrière lui.
- **La difficulté continue de monter jusqu'au niveau 60.**
  - 3 lasers à partir du niveau 40.
  - Les patrouilles en binôme deviennent plus fréquentes.
  - 10 gardes au maximum à partir du niveau 45.
  - Un niveau de répit après chaque boss, avec 2 gardes de moins (niveaux 11, 21, 31…).
- **Économie.**
  - La barre « Nouvel assassin » ne donne plus que les héros à 150 diamants ou moins, et progresse de 20 % par victoire.
  - Nouveau bouton « Entraîner » : il fait gagner un niveau au héros pour 25 × son niveau en diamants.
  - Les missions rapportent selon la progression : 40 + 4 × le niveau atteint.
  - Héros rééquilibrés : Nova obtient +10 % de vie, Phantom +35 % de vitesse, Kami +40 % de vitesse et +60 % de vie. Le bonus de vitesse par niveau de héros passe de 1,5 % à 1 %.

**Interface et accessibilité**
- **Niveau 1.** L'astuce explique les faisceaux de lumière et l'attaque de dos. Elle reste au moins 4 s à l'écran.
- **Gardes en alerte.** Leur cône a un bord pointillé animé, pour que l'alerte ne repose plus seulement sur la couleur. Leur flèche hors écran est plus grande et porte un « ! ».
- **Boutique.** Elle affiche « Il manque N » quand on n'a pas assez de diamants.
- **Écran de défaite.** Il donne le nombre de gardes éliminés et un conseil.
- **Autres réglages.**
  - Barre de vie plus grande.
  - L'œil de détection ne se superpose plus à la bulle de dialogue.
  - Les boutons de mission indiquent « Récupérer ».
  - Les boutons ronds font 48 px.
  - `aria-pressed` sur les interrupteurs.
  - Respect de « réduire les animations ».

**Direction artistique**
- **Pénombre.** Une pénombre teintée selon le thème et un vignettage d'écran font lire les lampes torches comme de la vraie lumière.
- **Murs.**
  - Les murs ont une face avant, une arête éclairée et une ombre de contact.
  - Les ombres portées sont floues.
  - Chaque thème a son matériau : parpaings pour le béton, tôle ondulée pour l'entrepôt, panneaux blancs à liseré cyan pour le labo.
- **Sol.** Les dalles ont des nuances. L'entrepôt a des lignes jaunes au sol. Il y a moins de taches.
- **Pièges.**
  - La mine de glace est un vrai cylindre : flanc, ombre portée dans l'axe de la lumière.
  - La mine explosive est enterrée dans un trou, avec de la terre sur le rebord.
- **Diamants et héros.** Les diamants brillent dans le noir. Un anneau discret au sol permet de repérer le héros.

**QA et performance**
- La couche de pénombre est calculée en demi-résolution, et les cônes hors écran ne sont plus dessinés.
- La densité de pixels est plafonnée à 1,5 au lieu de 2. La mesure a donné environ 50 % de temps d'image en moins.
- Le niveau n'est plus redessiné derrière le menu, la pause et l'écran de résultat, ce qui économise la batterie.
- Une sauvegarde abîmée est mise de côté (`-bak`) et chaque champ est vérifié. Elle ne peut plus bloquer le jeu.
- La clé gagnée à la roue n'est plus perdue quand on en a déjà 2 : elle ouvre le coffre.
- Les minuteurs des traces au sol suivent le temps de jeu réel. Ils s'arrêtent en pause et ne dépendent plus de la fréquence d'écran.
- Vérification par le bot : les 60 niveaux restent gagnables avec le héros le plus faible.
