#!/bin/bash
# finir.sh <dossier images> <son.wav> <sortie.mp4> : image + son, -14 LUFS (true peak -1.5), plus une copie 720p
# légère pour WhatsApp (<sortie>-720p.mp4). Format de sortie : celui des images (1080x1920 ou 1920x1080), 30 i/s.
set -e
img=$1; son=$2; out=$3
lufs() { ffmpeg -i "$1" -af ebur128 -f null - 2>&1 | grep -A1 'Integrated loudness' | tail -1 | awk '{print $2}'; }
# one loudnorm pass can land ~1 dB off: measure the mix alone and aim so that the result is -14
ffmpeg -v error -y -i "$son" -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 "${out%.mp4}-essai.wav"
cible=$(python3 -c "print(round(-14 + (-14 - float('$(lufs "${out%.mp4}-essai.wav")')), 1))")
rm -f "${out%.mp4}-essai.wav"
ffmpeg -v error -y -framerate 30 -i "$img/f%05d.jpg" -i "$son" -map 0:v -map 1:a \
  -af "loudnorm=I=$cible:TP=-1.5:LRA=11" -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -movflags +faststart \
  -c:a aac -b:a 192k -ar 48000 -shortest "$out"
w=$(ffprobe -v error -select_streams v -show_entries stream=width -of csv=p=0 "$out")
[ "$w" -gt 1100 ] && sc=1280:720 || sc=720:1280
ffmpeg -v error -y -i "$out" -vf scale=$sc -c:v libx264 -crf 23 -preset medium -c:a copy -movflags +faststart "${out%.mp4}-720p.mp4"
echo "$out : $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out") s, $(ffmpeg -i "$out" -af ebur128 -f null - 2>&1 | grep -A1 'Integrated loudness' | tail -1 | xargs)"
