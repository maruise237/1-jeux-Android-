#!/bin/bash
# planche.sh <dossier> <t1> <t2> ...
set -e
d=$1; shift
node rendu.mjs "$d" "$@" >/dev/null
n=$#; cols=$(( n<=9 ? 3 : 5 )); 
args=(); fc=""; lay=""; i=0
for t in "$@"; do
  args+=(-i "$d/planche/p$(printf %02d $i).jpg")
  fc+="[$i:v]scale=264:470,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${t}s':x=8:y=8:fontsize=24:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=6[v$i];"
  lay+="$(( (i%cols)*264 ))_$(( (i/cols)*470 ))|"
  i=$((i+1))
done
for j in $(seq 0 $((n-1))); do fc+="[v$j]"; done
ffmpeg -v error -y "${args[@]}" -filter_complex "${fc}xstack=inputs=$n:layout=${lay%|}" -frames:v 1 "$d/planche/planche.jpg"
echo "$d/planche/planche.jpg"
