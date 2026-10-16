"""Vérifie une vidéo 9:16 contre la « zone de sécurité » des Reels/TikTok (astuce Toprak).

Superpose sur des images de la vidéo :
- zones de danger (hachures rouges) : en-tête en haut, légende + boutons en bas, colonne d'icônes à droite ;
- ligne des yeux (tiers haut) : les yeux du sujet doivent être dessus ;
- bande sous-titres (verte) : zone autorisée ; idéal = juste sous le menton (regard voit visage ET texte).

Usage : python3 outils/zone_securite.py video.mp4 sortie.jpg [t1 t2 ...]
Sortie : planche des images vérifiées (par défaut 4 instants répartis).
"""
import subprocess, sys
from io import BytesIO
from PIL import Image, ImageDraw

# proportions d'un écran 1080x1920 (UI Instagram/TikTok mesurée)
HAUT, BAS, DROITE = 0.11, 0.24, 0.13
YEUX = 1 / 3
SOUS_TITRES = (0.45, 0.74)  # bande autorisée ; idéal : la ligne juste sous le menton


def calque(w, h):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    hach = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    dh = ImageDraw.Draw(hach)
    for k in range(-h, w + h, 28):
        dh.line((k, 0, k + h, h), fill=(230, 30, 40, 120), width=6)
    masque = Image.new('L', (w, h), 0)
    dm = ImageDraw.Draw(masque)
    for r in ((0, 0, w, h * HAUT), (0, h * (1 - BAS), w, h), (w * (1 - DROITE), h * HAUT, w, h * (1 - BAS))):
        dm.rectangle(r, fill=255)
    im.paste(hach, (0, 0), masque)
    d = ImageDraw.Draw(im)
    d.line((0, h * YEUX, w, h * YEUX), fill=(255, 255, 255, 230), width=4)
    d.rectangle((w * 0.05, h * SOUS_TITRES[0], w * (1 - DROITE) - 10, h * SOUS_TITRES[1]),
                outline=(40, 220, 90, 255), width=5)
    return im


def main():
    src, sortie = sys.argv[1], sys.argv[2]
    duree = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                                           '-of', 'csv=p=0', src]))
    instants = [float(x) for x in sys.argv[3:]] or [duree * k / 5 for k in range(1, 5)]
    vignettes = []
    for t in instants:
        png = subprocess.check_output(['ffmpeg', '-v', 'error', '-ss', str(t), '-i', src, '-frames:v', '1',
                                       '-f', 'image2pipe', '-vcodec', 'png', '-'])
        im = Image.open(BytesIO(png)).convert('RGBA')
        im = Image.alpha_composite(im, calque(*im.size)).convert('RGB')
        vignettes.append(im.resize((im.width * 480 // im.height, 480)))
    planche = Image.new('RGB', (sum(v.width + 8 for v in vignettes), 480), 'black')
    x = 0
    for v in vignettes:
        planche.paste(v, (x, 0)); x += v.width + 8
    planche.save(sortie, quality=90)


if __name__ == '__main__':
    main()
