# Rythme et coupes

## Mesures (14 vidéos de pros)
- Changement de plan visible : **1,7 à 4,8 s**. Faro 1,7–2,4 s ; Med / Loucash ~3,8 s ; Wu 3,0 s.
- Jamais le même layout plus de ~4 s.
- Long format (2–3 min) : tenir **1 changement / 2 s** du début à la fin.

## Ce qui compte comme « changement »
Coupe de plan, punch-in (zoom), nouvelle typo, nouveau visuel, passage sombre ↔ clair, capture d'écran.

## Techniques
- **Coupe sèche sur les respirations / fins de phrase**.
- **Coupes image ≠ coupes son** : l'écran change un peu avant/après la phrase (ex. l'outil apparaît sur
  « utilise ça » et reste jusqu'au « génération de » suivant). Ça fait « monté à la main ».
- **Silences coupés** : la parole doit rester nerveuse (16,5 s → 11,5 s sur le reel KamForms).
- **Alterner les ambiances** : facecam sombre ↔ papier crème/blanc (formes organiques, objets 3D isolés)
  ↔ capture. Le contraste clair/sombre relance l'attention.
- **Micro-zoom continu** (+2 % par plan) pour que rien ne soit figé.
- **Écran partagé** crème : capture en haut, personne en bas.

## Mesurer le rythme d'une vidéo
`ffmpeg -i video.mp4 -vf "select='gt(scene,0.25)',showinfo" -f null -` (sous-estime les punch-ins et
les captures qui s'enchaînent → compter aussi sur la planche contact).
