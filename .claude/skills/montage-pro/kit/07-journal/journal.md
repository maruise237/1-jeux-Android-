# Journal des projets

Une entrée par projet : ce qui a été livré, le retour de Mariuse, la leçon. Les plus récents en haut.

---

## 2026-10 — Podcast « Mariuse × Claude » remonté avec la compétence (versions courte et longue)
- Demande : « refais le podcast avec ta nouvelle compétence », puis « fais les deux versions ».
- Type identifié (§0) : podcast. Choix : Mariuse en image NATURELLE + multicam simulé + sous-titres sous le
  menton ; texte derrière seulement 4 fois (PODCAST, RÉVOLUTION, KAMTECH, T'ABONNER) ; Claude (personne
  à l'écran) = motion design typo, une composition par phrase, alternance nuit / papier crème, preuves
  réelles (transcription au mot près, forme d'onde avec les hésitations coupées, vrai code du montage,
  10 vraies images + cadre de sélection), vrai logo Claude (étiquette « Claude répond » + pop sur « Opus 5.5 »).
- Son (§2bis) : hook sec + riser → musique à la 1re coupe, musique mesurée à 17 dB sous la voix, musique
  COUPÉE pendant « je ne peux pas entendre le son », bruitages seulement sur actions visibles (88 en 90 s),
  rien sur les coupes multicam. -14,2 LUFS.
- Faits : « depuis Douala » coupé dans la voix de Claude (crédits ElevenLabs épuisés → coupe au mot près,
  vérifiée par retranscription : « Expliquer l'IA en français, avec des exemples concrets »).
- CTA : Mariuse dit « abonnez-vous, likez, partagez » ; ajout à l'écran d'un champ commentaire qui se tape
  (« la tâche que tu vas confier à l'IA ») : pas de promesse de ressource qui n'existe pas.
- Fichiers : `podcast/pro.py` (image), `podcast/son_pro.py` (son), `podcast/finir_pro.sh`,
  `outils/bruitages.py` (bruitages réutilisables) → `podcast_claude_court_pro.mp4`, `podcast_claude_pro.mp4`.
- Corrigé après la 1re planche : (1) cartes vides 0,3–0,6 s en attendant le 1er mot déclencheur → le 1er
  élément apparaît dès la coupe ; (2) sous-titres blancs gras sur les cartes typo = doublon criard →
  sous-titres discrets (plus petits, couleur douce) quand le texte géant porte déjà la phrase.
- Leçons : sur une carte typo, ne jamais laisser l'écran vide ; prévisualiser toutes les cartes en planche
  AVANT le rendu complet (fait : a évité des chevauchements de lignes et une pellicule qui débordait).

---

## 2026-10 — Retours de Mariuse : contexte, logos, assombrissement, son, abonnés
- « Toutes les techniques ne vont pas sur toutes les vidéos » → §0 du skill : tableau type de vidéo →
  techniques à utiliser / à éviter, conditions par technique.
- « Pas d'usine à gaz pour la zone Instagram » → règle simplifiée (sous le menton), outil optionnel.
- « L'assombrissement se voit, on voit le détourage » → `FOND` 0,30 → 0,45, flou 5 → 3. Démo re-rendue.
- « Quand je cite un outil, mettre son VRAI logo » → `outils/logo.py` (Wikimedia → Simple Icons → favicon,
  cache `assets/logos/`, `coller()` pour le pop). 1er essai : Instagram renvoyait un logo Instagram+Threads
  → filtrage des titres resserré. Leçon : toujours regarder le logo téléchargé.
- « Tu n'as rien appris sur les bruitages, la musique, les abonnés » : juste, je n'avais analysé que l'image.
  Fait : séparation demucs des 14 vidéos + spectrogrammes → §2bis (deux ouvertures selon le type,
  ponctuation musicale, bruitages sur actions visibles) et stratégie abonnés chiffrée (§3).
- Leçon : analyser une inspiration = image + **son** + **CTA/légende**, pas seulement l'image.

---

## 2026-10 — 6 nouvelles inspirations (Fabien Faro, Toprak, Mickaël Wu)
- Livré : créateurs C–E dans `inspirations.md` (14 vidéos au total), règle 11 (look pro au tournage),
  `outils/zone_securite.py`.
- Découverte : Faro (144 k likes) n'a qu'une caméra, comme Mariuse. Il fait ses gros plans en
  **marchant vers son grand-angle**, ce qui confirme la piste des micro-zooms et donne une option au tournage.
- **Erreur trouvée sur notre démo** grâce à l'astuce de Toprak : sous-titres à y = 1480 (77 %) = dans la
  zone des boutons Instagram. Corrigé à y = 1300 (sous le menton), démo re-rendue et vérifiée.
- Outil : quota ElevenLabs épuisé en cours d'analyse (7 crédits restants) → faster-whisper local en secours.
- Leçon : passer la vérification de zone de sécurité sur CHAQUE rendu, pas seulement le contenu.

---

## 2026-10 — Texte derrière la personne (détourage vidéo)
- Retour de Mariuse : « on a déjà fait du détourage, ne te limite pas, essaie plusieurs façons ».
  J'avais écrit « pas encore construit » alors que la pub Valex v2 avait un portrait détouré. Erreur d'oubli.
- Banc d'essai sur la facecam du podcast (fond tissu à motifs, le pire cas) :
  - rembg u2net_human_seg : perd la personne sur certaines images. ✗
  - rembg isnet-general-use : garde parfois seulement le visage. ✗
  - mediapipe selfie multiclass : masque flou, laisse passer le tissu (besoin de `apt install libegl1`). ✗
  - BiRefNet portrait : très propre mais 30 s/image et saturation mémoire au 2e passage. ✗
  - **RVM resnet50 (ONNX) : propre, cheveux OK, 0,1 s/image, stable dans le temps. ✓ retenu**
  - RVM mobilenet : 0,05 s/image, pour les longues vidéos.
- Livré : `outils/detourage.py`, `outils/demo_derriere.py`, `demo_texte_derriere.mp4` (10,7 s, hook du podcast).
- Leçon : relire le journal AVANT de dire qu'une technique manque, et tester plusieurs outils.
- Retour suivant de Mariuse : la vidéo est tournée sous un seul angle → simuler les changements de caméra
  par micro-zooms. Fait : 3 caméras virtuelles (large/serré/gros plan), 7 plans en 10,7 s, coupes sur les
  phrases, titre recalé sur la tête à chaque plan.

---

## 2026-10 — Analyse de 8 vidéos d'inspiration (MedTheDesigner, Loucash)
- Livré : ce skill + `inspirations.md`.
- Demande de Mariuse : des vidéos comme les vrais pros, pas du slop IA ; une compétence qui grandit.
- **Autocritique de nos vidéos passées face à ces références** :
  - Podcast Claude : layout identique pendant toutes les réponses (logo centré + titre + fenêtre de code)
    → trop « gabarit ». Les pros changent de composition à chaque idée.
  - Sous-titres karaoké jaune/corail mot par mot → plus « app auto-sous-titres » que « créateur ».
    Les pros : 1–3 mots blancs propres, emphase par la taille ou l'italique serif.
  - Une seule police (Poppins) → pas de contraste typographique. Il faut un duo sans serré + serif italique.
  - Aucun plan clair : tout était sombre. Il manque l'alternance sombre/clair.
  - Icônes SVG génériques → remplacer par de vraies captures, des logos réels, ou une DA d'illustration unique.
  - Ce qui était bien : rythme des coupes, logo qui réagit à la voix, mix à -14 LUFS, hook placé en tête.
- À construire : détourage de la personne (texte derrière le sujet), kit de polices, cercle loupe sur captures,
  composant CTA « dossier + MOT ».

## 2026-10 — Podcast « Mariuse × Claude » (versions 2 min 05 et 1 min 30)
- Livré : `podcast_claude_partage.mp4`, `podcast_claude_court_partage.mp4` (pipeline `podcast/`).
- Retour : « travail impeccable ». Erreur : j'ai dit « depuis Douala », Mariuse vit à **Yaoundé**.
- Leçons : vérifier les faits personnels avant la voix off ; Mariuse confond parfois temps de rendu et durée
  → toujours annoncer la durée finale de la vidéo clairement ; voix Claude = Brian (ElevenLabs), Antoine
  indisponible sur le plan gratuit.

## 2026-10 — Pub motion design « Valex L'infographiste » (v1 sans voix, v2 voix off)
- Livré : `valex_motion_design.mp4`, `valex_pub_voix*.mp4`.
- Leçon : la voix off fournie dicte le rythme ; caler les animations sur les timestamps des mots.

## 2026-10 — Reel « 3 outils IA » qui met KamForms en avant (sans faire pub)
- Brief : mettre kamforms.com (outil de Mariuse) en avant « sans avoir l'air d'une vidéo publicitaire,
  grâce à la preuve sociale ». Source : facecam 1728x3072, 16,5 s, 3 phrases « si tu veux faire de la
  génération de vidéos / photos / formulaires, utilise ça » + « les liens sont en description, commente l'outil ».
- Type (§0) : tuto outil / liste. Choix faits :
  - **Preuve sociale par association** : KamForms est le 3e d'une liste avec KlingAI et Nano Banana (Google),
    **même format d'écran, même durée**, vraie capture du site, vrai logo. Il ne se distingue que parce
    qu'il est en dernier (place de la chute) et dans le CTA (le champ commentaire tape « KamForms »).
  - Aucun « mon outil », aucun chiffre ni témoignage inventé (le site n'affiche pas de stats réelles).
  - Silences coupés : 16,5 s → 11,5 s. Écrans décalés des coupes audio (l'outil apparaît sur « utilise ça »
    et reste jusqu'au « génération de » suivant) : coupes image ≠ coupes son, ça fait monté à la main.
  - Texte derrière la tête **sur le hook seulement** (« VIDÉOS »). Les mots des étapes 2 et 3 sont sur une
    **étiquette crème inclinée** : sur un pagne très chargé, du texte blanc flottant est illisible et on ne
    veut pas assombrir l'image à chaque étape.
  - Écran partagé crème (capture en haut, personne en bas) = ambiance claire qui alterne avec la facecam.
- Outils : captures mobiles via Playwright + proxy (`--ignore-certificate-errors`, `waitUntil: domcontentloaded`,
  8 s d'attente) ; logo Gemini recadré depuis la capture officielle (`assets/logos/geminisparkle.png`).
- Fichiers : `kamforms/montage.py` (image), `kamforms/son.py`, `kamforms/finir.sh` → `reel_kamforms.mp4`.
- À faire si Mariuse fournit de VRAIES preuves (capture du tableau de bord, messages clients) : les ajouter
  sur l'écran KamForms. Ne jamais en fabriquer.

## 2026-10 — Reel « ChatGPT / KamForms » rallongé (7,5 s → 10,5 s)
- Prise : « ChatGPT génère des photos personnalisées. KamForms génère des formulaires interactifs
  directement sur WhatsApp. » Demande : « trouver un moyen de faire un peu durer la vidéo ».
- Transcription : whisper se trompait (« formes », « je l'ai pour mes… ») ; **Scribe sur des morceaux de 3 s**
  (≈ 1 crédit chacun) a donné la vraie phrase. Avec peu de crédits : découper l'audio, pas tout envoyer.
- **Comment rallonger sans remplissage** (règle à retenir) :
  1. couper quand même les silences (la parole doit rester nerveuse) ;
  2. ajouter une **démo réelle** après la phrase produit : l'animation du téléphone de kamforms.com, capturée
     image par image (Playwright, `page.screenshot` en boucle + horodatage), **accélérée sur les temps morts**
     (×4 pendant l'attente, ×2 pendant la frappe, ×1 sur la réponse) ;
  3. des étapes écrites à lire pendant la démo (« 1. tu décris / 2. l'IA crée / 3. tu partages ») ;
  4. la musique remonte de 6 dB quand la voix s'arrête (ponctuation), pop sur chaque bulle ;
  5. finir sur l'URL en pastille, la musique s'arrête sur un carillon.
- Hook : ChatGPT = mention rapide → logo officiel qui pop sous le sous-titre ; « PHOTOS » derrière la tête,
  assombrissement qui arrive **progressivement** avec le titre (pas avant).
- Note loudness : sur une vidéo < 10 s, `loudnorm` en un passage reste ~1 dB trop bas → viser -12,8 pour
  obtenir -14,2 (vérifier avec ebur128).
- Le site a une page « études de cas » (Amina à Abidjan, Seydou à Dakar, Chez Mado à Douala) : NE PAS
  l'utiliser comme preuve sociale en vidéo tant que Mariuse n'a pas confirmé que ce sont de vrais clients.
- Fichiers : `kamforms2/montage.py`, `kamforms2/son.py`, `kamforms2/finir.sh` → `reel_kamforms_2.mp4`.
- Retour de Mariuse : « ChatGPT » était coupé au début. Cause : je me suis fié à l'horodatage de whisper
  (0,74 s) alors que la voix démarre à 0,13 s (« Tchat-dji-pi-ti » dure ~1 s). **Leçon : le point de coupe
  d'entrée se cale sur l'ÉNERGIE du signal (RMS par 50 ms), jamais sur le premier mot de whisper**, et on
  réécoute/retranscrit les 3 premières secondes du rendu avant de livrer.

## 2026-10 — Reel Djoumi « 3 meilleures applis pour un salon de beauté » (22 s)
- Prise 22,9 s : ChatGPT (images de pub) → Google Flow (animer) → **Djoumi** (réservations, relances, lien
  personnel dans la bio). Mariuse a fourni la pub motion officielle de Djoumi (29 s, vraies interfaces).
- Même recette que le reel KamForms : liste, l'outil de Mariuse en dernier, écrans partagés identiques.
- **Réutiliser une vidéo motion de la marque** : planche 1 image/s pour lire ses sous-titres incrustés, puis
  associer chaque phrase de la voix à SON passage (tableau de bord ↔ « gérer ta réservation », rappel WhatsApp ↔
  « relances », carte du lien ↔ « un lien personnel », bios ↔ « TikTok, Facebook, Instagram », parcours
  cliente ↔ « prennent rendez-vous »). Recadrer sous les sous-titres incrustés (y > 360 sur 1920), accélérer
  le passage pour qu'il tienne dans la phrase, serrer (×1,3) quand l'élément est petit (carte du lien).
- Couleur de marque Djoumi : **#C70136** (theme-color du site) ; logo = `djoumi.com/icon.svg` recoloré blanc
  sur pastille rouge (`assets/logos/djoumi.png`). Google Flow : pas de logo propre → visuel officiel og-image.
- Ponctuation : musique coupée sur « et ensuite le tout dernier outil », riser, impact + écran rouge plein
  sur « Djoumi », la musique repart.
- Erreurs évitées / vues :
  - whisper avait sauté « à utiliser » (il étirait « si » sur 1,3 s) → si un mot dure > 0,8 s, réécouter.
  - un whoosh sur la 1re syllabe masque le mot (« Chat-GPT ») → whoosh fini AVANT le mot (t − 0,40).
  - transcrire aussi la SOURCE au même endroit pour savoir si un mot manque à cause de la coupe ou de whisper.
- Fichiers : `djoumi/montage.py`, `djoumi/son.py`, `djoumi/finir.sh` → `reel_djoumi.mp4`.

## 2026-10 — Légendes et hashtags par plateforme (5 vidéos)
- Livré : `publications/legendes.html` (page avec bouton copier, compteurs de caractères et de hashtags).
- Règles 2026 vérifiées sur le web (4 oct. 2026) :
  - Instagram : **5 hashtags max** (limite imposée depuis déc. 2025), dans la légende, CTA en 1re ligne (~125 car. visibles).
  - TikTok : la légende est lue par la recherche → mots-clés que les gens tapent ; 3–5 hashtags précis, pas #fyp.
  - YouTube Shorts : titre 60–80 car. sans hashtag ; 3–5 hashtags en fin de description dont #shorts
    (les 3 premiers s'affichent au-dessus du titre) ; liens de description NON cliquables → « vidéo associée ».
- Chaque légende reprend le CTA « commente MOT » de la vidéo (ou en ajoute un) ; vérifier dans la timeline que
  ce qu'on annonce est bien dans la version publiée (ex. la réponse r2 est dans la version courte du podcast).
