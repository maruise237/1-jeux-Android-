# Kit Montage Pro — KAMTECH / Mariuse

Tout le savoir-faire de montage vidéo short-form (Reels, TikTok, Shorts, pubs, podcasts) construit
à partir de 14 vidéos d'inspiration analysées (image + son + CTA) et de nos 7 projets livrés.
Chaque compétence est dans son propre fichier pour pouvoir piocher **seulement ce dont tu as besoin**.

## Comment s'en servir

1. **Dans un autre projet avec Claude** : copie le dossier `skill-claude/montage-pro/` dans
   `.claude/skills/` du nouveau projet. Claude le lira automatiquement dès que tu parles de montage.
   Copie aussi `04-outils/` et `05-ressources/` à la racine du projet si tu veux les scripts et polices.
2. **Pour toi (ou un monteur)** : commence par `00-principes/`, puis va directement à la fiche
   qui correspond à ton besoin (tableau ci-dessous).
3. **Pour démarrer un projet** : remplis `06-modeles/brief-video.md` et donne-le à Claude.

## Je veux… → je lis

| Besoin | Fichier(s) |
|---|---|
| Savoir quelles techniques utiliser pour MA vidéo | `00-principes/01-regle-mere-type-de-video.md` puis `02-recettes-par-type/` |
| Éviter l'effet « vidéo IA / template » | `00-principes/02-les-11-regles-anti-slop.md` |
| Vérifier une vidéo avant de la publier | `00-principes/03-checklist-avant-livraison.md` |
| Écrire un script / un hook qui accroche | `01-competences/A-ecriture-script/` |
| Faire gagner des abonnés et des commentaires | `01-competences/A-ecriture-script/03-cta-et-strategie-abonnes.md` |
| Rendre une vidéo plus dynamique (rythme, coupes) | `01-competences/B-image-montage/01-rythme-et-coupes.md` |
| Simuler plusieurs caméras avec un seul angle | `01-competences/B-image-montage/02-multicam-simule.md` |
| Mettre du texte derrière la personne | `01-competences/B-image-montage/03-texte-derriere-la-personne.md` |
| Montrer un outil / une appli / un site | `01-competences/B-image-montage/04-captures-logos-preuves.md` |
| B-roll, mèmes, illustrations | `01-competences/B-image-montage/05-broll-memes-illustrations.md` |
| Rallonger une vidéo trop courte sans remplissage | `01-competences/B-image-montage/06-rallonger-sans-remplissage.md` |
| Réutiliser la vidéo motion d'une marque | `01-competences/B-image-montage/07-reutiliser-motion-de-marque.md` |
| Choisir les polices, faire une belle typo | `01-competences/C-texte-typo/01-typographie.md` |
| Sous-titres pro | `01-competences/C-texte-typo/02-sous-titres.md` |
| Effets de texte (glow, négatif, vintage, poster) | `01-competences/C-texte-typo/03-effets-texte.md` |
| Musique | `01-competences/D-son/01-musique.md` |
| Bruitages | `01-competences/D-son/02-bruitages.md` |
| Volume, mixage, -14 LUFS, export | `01-competences/D-son/03-mixage-loudness-export.md` |
| Transcrire, couper les silences, caler au mot | `01-competences/D-son/04-transcription-et-coupes.md` |
| Légendes, hashtags par plateforme | `01-competences/E-diffusion/01-legendes-hashtags.md` |
| Mieux filmer (lumière, cadrage) | `01-competences/E-diffusion/02-tournage.md` |
| Mettre en avant MON produit sans faire pub | `02-recettes-par-type/06-mettre-son-produit-en-avant.md` |
| Voir comment font les créateurs qu'on aime | `03-inspirations/` |
| Les scripts (logos, détourage, bruitages…) | `04-outils/LISEZMOI-OUTILS.md` |
| Ce qu'on a appris projet par projet | `07-journal/journal.md` |

## Organisation

```
kit-montage-pro/
├── 00-principes/              les règles qui s'appliquent à TOUTES les vidéos
├── 01-competences/            une fiche par savoir-faire, classées par famille
│   ├── A-ecriture-script/     hook, structure, CTA
│   ├── B-image-montage/       rythme, multicam, détourage, captures, B-roll
│   ├── C-texte-typo/          polices, sous-titres, effets de texte
│   ├── D-son/                 musique, bruitages, mixage, transcription
│   └── E-diffusion/           légendes, hashtags, tournage
├── 02-recettes-par-type/      tuto, vulgarisation, business, podcast, pub, produit
├── 03-inspirations/           les 5 créateurs décortiqués + mesures
├── 04-outils/                 scripts Python + pipeline de rendu HTML
├── 05-ressources/             polices et logos officiels
├── 06-modeles/                brief vidéo, plan de montage, checklist imprimable
├── 07-journal/                historique des projets et leçons
└── skill-claude/montage-pro/  la compétence prête à copier dans .claude/skills/
```

## Faire grandir le kit
À la fin de chaque projet : ajouter une entrée dans `07-journal/journal.md`. Si une leçon devient
une règle générale, la mettre dans la bonne fiche de `01-competences/` et dans `skill-claude/`.
