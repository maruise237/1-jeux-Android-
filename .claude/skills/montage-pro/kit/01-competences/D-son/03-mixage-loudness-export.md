# Mixage, loudness et export

## Cibles
- **-14 LUFS intégré** (les 14 vidéos de pros : -14,1 à -14,5, sans exception). True peak -1,5.
- Voix devant ; musique 12–25 dB dessous.
- Vidéo < 10 s : `loudnorm` en un passage reste ~1 dB trop bas → viser -12,8 pour obtenir -14,2.

## Formats
- 9:16 **1080×1920**, 30 i/s (24/30/60 vus chez les pros ; Loucash 1440×2560).
- Carré 1080×1080 possible (Wu).
- Copie légère **720p** pour WhatsApp (< 30 Mo).

## Commandes
```bash
# image + son, normalisé
ffmpeg -y -i muet.mp4 -i son.wav -map 0:v -map 1:a -af "loudnorm=I=-14:TP=-1.5:LRA=11" \
  -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest final.mp4

# à partir d'images
ffmpeg -y -framerate 30 -i images/f%05d.jpg -i son.wav -af loudnorm=I=-14:TP=-1.5:LRA=11 \
  -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 192k -shortest final.mp4

# copie WhatsApp
ffmpeg -y -i final.mp4 -vf scale=720:1280 -c:v libx264 -crf 22 -preset medium -c:a copy partage.mp4

# vérifier le loudness
ffmpeg -i final.mp4 -af ebur128 -f null - 2>&1 | grep -A1 "Integrated loudness" | tail -1
```

## Fin de vidéo
Pas de fondu au noir : la vidéo boucle proprement.
