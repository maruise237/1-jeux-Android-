# Transcription, coupes et calage au mot

## Transcrire
- **ElevenLabs Scribe** (le plus juste). Peu de crédits ? Découper l'audio en morceaux de 3 s (~1 crédit chacun).
- Secours local : `faster-whisper` modèle `small`, `word_timestamps=True`.
- Whisper se trompe sur les noms de marque (« formes » pour KamForms) et étire certains mots.

## Pièges vus
- **Premier mot coupé** : whisper donnait « ChatGPT » à 0,74 s alors que la voix démarrait à 0,13 s.
  → **Le point de coupe d'entrée se cale sur l'ÉNERGIE du signal (RMS par 50 ms)**, jamais sur le
  premier mot de whisper. Réécouter/retranscrire les 3 premières secondes du rendu.
- **Mot sauté** : si un mot dure > 0,8 s dans la transcription, réécouter (whisper avait avalé « à utiliser »).
- Transcrire aussi la SOURCE au même endroit pour savoir si un mot manque à cause de la coupe ou de whisper.

## Couper les silences
Garder une parole nerveuse : couper respirations et blancs, garder ~0,08–0,15 s autour des mots.

## Caler l'animation
Les timestamps mot à mot (`mots.json`) dictent les scènes : chaque élément visuel est déclenché au mot prononcé.
La voix off fournie dicte le rythme (pub motion).

## Voix de synthèse
ElevenLabs (voix « Brian », multilingual v2 sur le plan gratuit). Vérifier les faits personnels AVANT la voix off.
Si crédits épuisés et une phrase à retirer : coupe au mot près, vérifiée par retranscription.
