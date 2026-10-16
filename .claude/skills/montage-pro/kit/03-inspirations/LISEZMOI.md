# Inspirations : 5 créateurs, 14 vidéos analysées (image + son + CTA)

Le détail plan par plan, les mesures et les tableaux son sont dans `analyse-complete-14-videos.md`.

| Créateur | Domaine | Ce qu'on lui prend | Meilleure vidéo |
|---|---|---|---|
| **MedTheDesigner** (@med.thedesigner) | Tutos CapCut | Choix typographiques, alternance facecam sombre ↔ papier crème, titres derrière la tête, cercle loupe sur captures | Font pairing : 7 096 likes (le hook EST la démo) |
| **Loucash** (@0xloucash) | Outils IA | Personnage masqué constant, une DA d'illustration (corail/crème/trait noir), logos au mot près, CTA dossier + MOT | Agent Hermes : 15 063 likes en 2 min 26 |
| **Fabien Faro** (@fabien_faro) | Vulgarisation psycho | 1 changement / 2 s, B-roll au-dessus de la tête, cartes-titres, études citées, grand-angle | Humour : 144 058 likes |
| **Toprak** (@toprak_kreator) | Marketing créateurs | Éclairage bicolore, numéro d'étape persistant, sous-titres sous le menton, zone de sécurité, clics UI | 3 paramètres Instagram : 22 653 likes |
| **Mickaël Wu** (@mickawu) | Business | DA couleur de marque, preuve sociale (DM clients), texte au sol, musique coupée sur punchline | Mentez à vos parents : 4 871 likes |

## Mesures globales
- Changement de plan : 1,7–4,8 s. Débit : 3,4–5,0 mots/s (médiane ~4). Loudness : -14,1 à -14,5 LUFS.
- CTA « commente MOT » : ×100 commentaires par like vs « abonne-toi » seul.

## Analyser une nouvelle inspiration
`yt-dlp` → transcription (Scribe ou faster-whisper) → planche contact horodatée → coupes
(`ffmpeg select='gt(scene,0.25)'`) → mots/s → loudness (ebur128) → son (`demucs --two-stems=vocals`,
spectrogramme) → CTA + légende + ratio commentaires/likes → nouvelle fiche.
Les vidéos brutes ne sont pas gardées (droits des créateurs), seulement l'analyse.
