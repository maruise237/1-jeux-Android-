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
