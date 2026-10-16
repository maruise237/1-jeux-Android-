"""Démo « texte derrière la personne » sur le hook du podcast (0 à 10,7 s).

Calques par image : fond assombri + vignette → TITRE GÉANT → personne détourée (RVM) → sous-titres.
Usage : python3 outils/demo_derriere.py  → demo_texte_derriere.mp4
"""
import os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
sys.path.insert(0, os.path.dirname(__file__))
from detourage import alphas, taille

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = f'{RACINE}/podcast/source.mp4'
DEBUT, DUREE, FPS = 0.0, 10.75, 30
W, H = 1080, 1920
F = lambda n, s: ImageFont.truetype(f'{RACINE}/fonts/{n}', s)
SANS, SERIF_I = 'InterTight-ExtraBold.ttf', 'InstrumentSerif-Italic.ttf'

# (début, fin, petit texte au-dessus, MOT GÉANT, police du géant)
BEATS = [
    (0.00, 1.96, 'épisode 01', 'PODCAST', SANS),
    (1.96, 3.56, 'à voix', 'unique', SERIF_I),
    (3.56, 6.84, "c'est l'IA qui répond", 'CLAUDE', SANS),
    (6.84, 10.75, 'la', 'RÉVOLUTION', SANS),
]
# Tournage à UNE caméra : on simule le multicam en recadrant (zoom, centre x).
# Coupe sèche sur les respirations, micro-zoom continu (+2 %) dans chaque plan.
CAMS = {'large': (1.00, 0.50), 'serre': (1.22, 0.46), 'gros': (1.42, 0.52)}
PLANS = [(0.00, 'large'), (1.96, 'serre'), (3.56, 'large'), (4.42, 'gros'),
         (6.84, 'serre'), (7.86, 'gros'), (9.40, 'large')]
# mots à mettre en italique serif dans les sous-titres
# assombrissement du fond derrière le titre : léger, pour que le détourage ne se voie pas
# (0,30 était trop fort : la personne avait l'air « collée »). Flou léger aussi.
FOND = 0.45
ACCENT = {'podcast', 'unique.', 'claude', 'répondre.', 'révolution', 'opus', '5.5'}


def calque_titre(petit, geant, police):
    """Titre pré-rendu sur fond transparent, largeur ~96 % de l'écran."""
    taille_g = 400
    while True:
        fg = F(police, taille_g)
        bb = fg.getbbox(geant)
        if bb[2] - bb[0] <= W * 0.94 or taille_g < 80:
            break
        taille_g -= 8
    fp = F(SERIF_I, max(54, int(taille_g * 0.30)))
    bp = fp.getbbox(petit)
    hg, hp = bb[3] - bb[1], bp[3] - bp[1]
    im = Image.new('RGBA', (W, hg + hp + 120), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.text(((W - (bp[2] - bp[0])) / 2 - bp[0], 20 - bp[1]), petit, font=fp, fill=(255, 255, 255, 235))
    y = 20 + hp + 10
    d.text(((W - (bb[2] - bb[0])) / 2 - bb[0], y - bb[1]), geant, font=fg, fill=(250, 248, 242, 255))
    lueur = im.filter(ImageFilter.GaussianBlur(18))
    out = Image.alpha_composite(Image.new('RGBA', im.size, (0, 0, 0, 0)),
                                Image.eval(lueur, lambda v: v // 3))
    return Image.alpha_composite(out, im), y, y + hg  # haut et bas du mot géant


def sous_titres():
    import json
    mots = [m for m in json.load(open(f'{RACINE}/podcast/mots_source.json')) if m[1] < DUREE]
    blocs, cur = [], []
    for m in mots:
        cur.append(m)
        if len(cur) == 3 or m[0][-1] in '.,?' or (len(cur) == 2 and len(cur[0][0] + m[0]) > 12):
            blocs.append(cur); cur = []
    if cur: blocs.append(cur)
    return [(b[0][1], (blocs[i + 1][0][1] if i + 1 < len(blocs) else DUREE), b) for i, b in enumerate(blocs)]


def dessine_sous_titre(img, bloc, t):
    d = ImageDraw.Draw(img)
    parts = []
    for w, a, _ in bloc:
        accent = w.lower().strip('?,') in ACCENT or w.lower() in ACCENT
        f = F(SERIF_I, 92) if accent else F(SANS, 66)
        parts.append((w.strip('?') if w != '?' else '?', f, a))
    largeur = sum(f.getlength(w) for w, f, _ in parts) + 22 * (len(parts) - 1)
    x, y = (W - largeur) / 2, 1300  # sous le menton, hors zone boutons (bas 24 %)
    for w, f, a in parts:
        if t >= a - 0.05:  # le mot apparaît quand il est prononcé
            for dx, dy in ((0, 5), (0, 3)):
                d.text((x + dx, y + dy), w, font=f, fill=(0, 0, 0, 140), anchor='ls')
            d.text((x, y), w, font=f, fill=(255, 255, 255, 255), anchor='ls')
        x += f.getlength(w) + 22


def ease(x):
    x = max(0.0, min(1.0, x)); return 1 - (1 - x) ** 3


def main():
    sw, sh = taille(SRC)
    lecteur = subprocess.Popen(['ffmpeg', '-v', 'error', '-ss', str(DEBUT), '-t', str(DUREE), '-i', SRC,
        '-vf', f'fps={FPS}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    titres = [calque_titre(p, g, f) for _, _, p, g, f in BEATS]
    subs = sous_titres()
    yy, xx = np.mgrid[0:H, 0:W]
    vignette = (1 - 0.55 * (((xx - W / 2) / (W * 0.75)) ** 2 + ((yy - H * 0.42) / (H * 0.65)) ** 2)).clip(0.25, 1)[..., None]
    sortie = 'demo_texte_derriere_muet.mp4'
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
        '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-crf', '17', '-preset', 'medium',
        '-pix_fmt', 'yuv420p', sortie], stdin=subprocess.PIPE)
    haut_tete = {}
    for i, a in enumerate(alphas(SRC, DEBUT, DUREE, FPS)):
        t = i / FPS
        img = np.frombuffer(lecteur.stdout.read(sw * sh * 3), np.uint8).reshape(sh, sw, 3)
        k = max(j for j, b in enumerate(BEATS) if t >= b[0])
        t0, t1 = BEATS[k][:2]
        n = max(j for j, pl in enumerate(PLANS) if t >= pl[0])
        p0 = PLANS[n][0]; p1 = PLANS[n + 1][0] if n + 1 < len(PLANS) else DUREE
        zc, xc = CAMS[PLANS[n][1]]
        z = zc * (1 + 0.02 * (t - p0) / (p1 - p0))
        # recadrage appliqué pareil à l'image et au détourage
        cw, ch = sw / z, sh / z
        cx, cy = min(max(sw * xc, cw / 2), sw - cw / 2), sh * 0.42
        box = (cx - cw / 2, max(0, cy - ch * 0.42), cx + cw / 2, max(0, cy - ch * 0.42) + ch)
        fr = np.asarray(Image.fromarray(img).resize((W, H), Image.LANCZOS, box=box), np.float32)
        al = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR, box=box),
                        np.float32)[..., None] / 255
        # haut de la tête (fixé au début de chaque plan pour éviter que le titre tremble)
        if n not in haut_tete:
            lignes = np.where(al[:, W // 3: 2 * W // 3, 0].max(axis=1) > 0.6)[0]
            haut_tete[n] = int(lignes[0]) if len(lignes) else 600
        flou = np.asarray(Image.fromarray(fr.astype(np.uint8)).filter(ImageFilter.GaussianBlur(3)), np.float32)
        fond = flou * FOND * vignette
        # titre : pop d'entrée (échelle 1.12 → 1) + légère dérive
        p = ease((t - t0) / 0.22)
        ti, haut, bas = titres[k]
        s = (1.12 - 0.12 * p) * (1 + 0.025 * (t - t0) / (t1 - t0))
        tw, th = int(ti.width * s), int(ti.height * s)
        tr = np.asarray(ti.resize((tw, th), Image.LANCZOS), np.float32)
        # ~45 % du mot géant passe derrière la tête
        ty = int(haut_tete[n] * (1 + 0.02 * (t - p0) / (p1 - p0)) + 0.45 * (bas - haut) * s - bas * s)
        tx = (W - tw) // 2
        couche = np.zeros((H, W, 4), np.float32)
        y0, y1 = max(0, ty), min(H, ty + th); x0, x1 = max(0, tx), min(W, tx + tw)
        couche[y0:y1, x0:x1] = tr[y0 - ty:y1 - ty, x0 - tx:x1 - tx]
        ta = couche[..., 3:4] / 255 * p
        fond = fond * (1 - ta) + couche[..., :3] * ta
        comp = fond * (1 - al) + fr * al
        out = Image.fromarray(comp.clip(0, 255).astype(np.uint8))
        for s0, s1, bloc in subs:
            if s0 <= t < s1:
                dessine_sous_titre(out, bloc, t)
        enc.stdin.write(out.tobytes())
    enc.stdin.close(); enc.wait()
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', sortie, '-ss', str(DEBUT), '-t', str(DUREE), '-i', SRC,
        '-map', '0:v', '-map', '1:a', '-af', f'afade=t=out:st={DUREE - 0.4}:d=0.4,loudnorm=I=-14:TP=-1.5',
        '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', 'demo_texte_derriere.mp4'], check=True)
    os.remove(sortie)


if __name__ == '__main__':
    main()
