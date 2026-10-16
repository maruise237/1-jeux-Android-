"""Podcast « Mariuse × Claude », remontage avec la compétence montage-pro.

Type de vidéo : podcast/interview (§0 du skill). Choix appliqués :
- Mariuse à l'écran : image NATURELLE, multicam simulé (tourné sous un seul angle), sous-titres 1–3 mots
  sous le menton, texte derrière lui seulement 4 fois (PODCAST, RÉVOLUTION, KAMTECH, ABONNE-TOI).
- Claude parle (personne à l'écran) : motion design typographique, UNE composition par phrase,
  alternance nuit / papier, preuves réelles (transcription, forme d'onde, code de ce montage), vrai logo.
- Faits : « depuis Douala » est coupé de la voix de Claude (Mariuse vit à Yaoundé).

Usage : V=_court python3 podcast/pro.py   (V vide = version longue)
Sorties : podcast/pro{V}_muet.mp4 + podcast/evenements_pro{V}.json (pour son_pro.py)
"""
import json, os, re, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.dirname(ICI)
sys.path.insert(0, f'{RACINE}/outils')
from detourage import alphas
from logo import logo as logo_png

V = os.environ.get('V', '')
W, H, FPS = 1080, 1920, 30
SRC = f'{ICI}/source.mp4'
SW, SH = 432, 768
QUEUE = 2.0                                   # carte CTA finale
F = lambda n, s: ImageFont.truetype(f'{RACINE}/fonts/{n}', int(s))
SANS, SERIF_I, SERIF, MONO = 'InterTight-ExtraBold.ttf', 'InstrumentSerif-Italic.ttf', 'InstrumentSerif-Regular.ttf', 'JetBrainsMono-Medium.ttf'
NUIT = dict(fond=(14, 14, 16), txt=(244, 240, 232), acc=(224, 128, 96), doux=(150, 146, 140))
PAPIER = dict(fond=(239, 233, 223), txt=(22, 21, 20), acc=(196, 92, 60), doux=(120, 112, 104))
FOND = 0.45                                   # assombrissement léger (texte derrière seulement)

# ---------------------------------------------------------------- timeline + coupe « depuis Douala »
TL = json.load(open(f'{ICI}/timeline{V}.json'))
MOTS = TL['mots']
norm = lambda w: re.sub(r"[^a-zàâçéèêëîïôûùüÿœ0-9']", '', w.lower())
COUPES = []
for i, m in enumerate(MOTS):
    if norm(m[0]) == 'depuis' and i + 1 < len(MOTS) and norm(MOTS[i + 1][0]) == 'douala':
        COUPES.append((m[1], MOTS[i + 2][1]))


def nt(t):
    return t - sum(min(max(t - a, 0), b - a) for a, b in COUPES)


MOTS = [[w, nt(a), nt(b), qui, k] for w, a, b, qui, k in MOTS if not any(a0 <= a < b0 for a0, b0 in COUPES)]
SEGS = []
for s in TL['segs']:
    s = dict(s); s['t0'], s['t1'] = nt(s['t0']), nt(s['t1'])
    if 'tv' in s: s['tv'] = nt(s['tv'])
    for c in s.get('clips', []): c['t0'], c['t1'] = nt(c['t0']), nt(c['t1'])
    SEGS.append(s)
FIN_PAROLE = SEGS[-1]['t1']
DUREE = FIN_PAROLE + QUEUE
SEGS[-1]['clips'][-1]['t1'] = DUREE           # on tient le dernier plan pendant la carte CTA
EV = []                                      # bruitages : (t, type, intensité)


def seg_a(t):
    return next((s for s in SEGS if t < s['t1']), SEGS[-1])


def mot_t(seg, *cles, apres=None):
    """Temps de début du premier mot du segment qui commence par cles[0] (et suivants)."""
    ws = [m for m in MOTS if seg['t0'] - .01 <= m[1] < seg['t1'] and (apres is None or m[1] >= apres)]
    for i in range(len(ws)):
        if all(i + j < len(ws) and norm(ws[i + j][0]).startswith(norm(c)) for j, c in enumerate(cles)):
            return ws[i][1]
    return None


# ---------------------------------------------------------------- outils de dessin
def ease(x):
    x = max(0.0, min(1.0, x)); return 1 - (1 - x) ** 3


def texte_img(txt, police, taille, couleur, largeur_max=None, glow=False):
    f = F(police, taille)
    if largeur_max:
        while f.getbbox(txt)[2] - f.getbbox(txt)[0] > largeur_max and taille > 40:
            taille -= 6; f = F(police, taille)
    bb = f.getbbox(txt)
    im = Image.new('RGBA', (bb[2] - bb[0] + 40, bb[3] - bb[1] + 40), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((20 - bb[0], 20 - bb[1]), txt, font=f, fill=couleur + (255,))
    if glow:
        g = im.filter(ImageFilter.GaussianBlur(16)); g = Image.eval(g, lambda v: v // 3)
        im = Image.alpha_composite(g, im)
    return im


def coller(dst, im, x, y, alpha=1.0, echelle=1.0):
    if alpha <= 0: return
    if echelle != 1.0:
        im = im.resize((max(1, int(im.width * echelle)), max(1, int(im.height * echelle))), Image.BILINEAR)
    if alpha < 1:
        a = im.getchannel('A').point(lambda v: int(v * alpha)); im = im.copy(); im.putalpha(a)
    dst.alpha_composite(im, (int(x - im.width / 2), int(y - im.height / 2)))


def fond_carte(th, graine):
    r = np.random.default_rng(graine)
    if th is PAPIER:   # papier crème + formes organiques sombres floues dans les coins (Med)
        im = Image.new('RGB', (W, H), th['fond']); d = ImageDraw.Draw(im)
        for _ in range(3):
            cx, cy = r.choice([-80, W + 80]), r.uniform(-100, H + 100); rr = r.uniform(180, 340)
            d.ellipse((cx - rr, cy - rr * 1.3, cx + rr, cy + rr * 1.3), fill=(40, 36, 32))
        im = im.filter(ImageFilter.GaussianBlur(90))
        a = np.asarray(im, np.float32); a = a * 0.35 + np.array(th['fond'], np.float32) * 0.65
    else:              # nuit + halo corail très léger
        yy, xx = np.mgrid[0:H, 0:W]
        cx, cy = r.uniform(.2, .8) * W, r.uniform(.25, .6) * H
        halo = np.exp(-(((xx - cx) / 700) ** 2 + ((yy - cy) / 900) ** 2))[..., None]
        a = np.array(th['fond'], np.float32) + halo * np.array([46, 22, 12], np.float32)
    grain = r.normal(0, 5, (H, W, 1)).astype(np.float32)
    return Image.fromarray((a + grain).clip(0, 255).astype(np.uint8)).convert('RGBA')


# ---------------------------------------------------------------- ressources réelles (preuves)
def images_source(instants, taille):
    out = []
    for t in instants:
        png = subprocess.check_output(['ffmpeg', '-v', 'error', '-ss', str(t), '-i', SRC, '-frames:v', '1',
                                       '-vf', f'scale={taille[0]}:{taille[1]}:force_original_aspect_ratio=increase,crop={taille[0]}:{taille[1]}',
                                       '-f', 'image2pipe', '-vcodec', 'png', '-'])
        from io import BytesIO
        out.append(Image.open(BytesIO(png)).convert('RGBA'))
    return out


def onde_source(a, b, largeur, hauteur):
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(a), '-t', str(b - a), '-i', SRC, '-ac', '1', '-ar', '8000',
                          '-f', 's16le', '-'], capture_output=True).stdout
    x = np.abs(np.frombuffer(pcm, '<i2').astype(np.float32)) / 32768
    n = largeur // 6; k = len(x) // n
    return (x[:k * n].reshape(n, k).max(1) / (x.max() + 1e-6)) * hauteur / 2


MOTS_SRC = json.load(open(f'{ICI}/mots_source.json'))
CODE = [l.rstrip() for l in open(__file__).read().splitlines() if l.strip()][-200:]

# ---------------------------------------------------------------- cartes de Claude (une par phrase)
# éléments : (texte, police, taille|'geant', déclencheur, rôle) ; rôle : txt | acc | doux
G = 'geant'
CARTES = [
    # (début de la phrase, thème, alignement, y centre, éléments, spécial)
    ("Ce montage, c'est moi qui l'ai fait", NUIT, 'c', 900, [("ce montage,", SERIF_I, 96, 'ce', 'doux'),
        ("C'EST MOI", SANS, G, 'moi', 'txt'), ("qui l'ai fait.", SERIF_I, 110, 'fait', 'acc')], 'logo_claude'),
    ("La vraie révolution", NUIT, 'c', 860, [("la vraie", SERIF_I, 110, 'la', 'doux'),
        ("RÉVOLUTION ?", SANS, G, 'révolution', 'txt')], None),
    ("Ce montage, c'est moi", PAPIER, 'g', 1060, [("ce montage,", SERIF_I, 100, 'ce', 'doux'),
        ("c'est moi", SANS, 150, 'moi', 'txt'), ("qui l'ai fait.", SERIF_I, 120, 'fait', 'acc')], 'pellicule'),
    ("Je lis ta voix", PAPIER, 'g', 1260, [("je lis ta voix", SANS, 96, 'lis', 'txt'),
        ("au mot près.", SERIF_I, 120, 'mot', 'acc')], 'transcription'),
    ("je coupe tes", NUIT, 'g', 1180, [("je coupe tes", SANS, 96, 'coupe', 'txt'),
        ("hésitations.", SERIF_I, 130, 'hésitations', 'acc')], 'onde'),
    ("je synchronise chaque", PAPIER, 'c', 900, [("je synchronise", SERIF_I, 100, 'synchronise', 'doux'),
        ("CHAQUE", SANS, 150, 'chaque', 'txt'), ("bruitage.", SERIF_I, 150, 'bruitage', 'acc')], None),
    ("et j'anime tout", NUIT, 'g', 1330, [("et j'anime tout", SANS, 96, 'anime', 'txt'),
        ("en code.", SERIF_I, 130, 'code', 'acc')], 'code'),
    ("Mais j'ai un aveu", NUIT, 'c', 880, [("un aveu :", SERIF_I, 100, 'aveu', 'acc'),
        ("je ne peux pas", SERIF_I, 100, 'ne', 'doux'), ("ENTENDRE", SANS, G, 'entendre', 'txt'),
        ("le son.", SERIF_I, 110, 'son', 'doux')], 'silence'),
    ("C'est toi qui valides", PAPIER, 'c', 880, [("c'est", SERIF_I, 120, "c'est", 'doux'),
        ("TOI", SANS, 420, 'toi', 'txt'), ("qui valides.", SERIF_I, 120, 'valides', 'acc')], None),
    ("L'IA monte, l'humain", NUIT, 'g', 860, [("L'IA MONTE,", SANS, 150, "l'ia", 'txt'),
        ("l'humain juge.", SERIF_I, 180, "l'humain", 'acc')], 'impact:juge'),
    ("Le monteur ne disparaît", PAPIER, 'c', 860, [("le monteur", SERIF_I, 120, 'monteur', 'doux'),
        ("NE DISPARAÎT", SANS, G, 'disparaît', 'txt'), ("PAS.", SANS, G, 'pas', 'acc')], None),
    ("Il monte d'un étage", NUIT, 'c', 940, [("il monte", SERIF_I, 120, 'monte', 'doux'),
        ("D'UN ÉTAGE ↑", SANS, G, 'étage', 'txt')], 'monte'),
    ("Couper les silences", PAPIER, 'g', 760, [("✓ couper les silences", SANS, 76, 'couper', 'txt'),
        ("✓ sous-titrer", SANS, 76, 'sous', 'txt'), ("✓ caler les effets", SANS, 76, 'caler', 'txt'),
        ("l'IA le fait en", SERIF_I, 110, "l'ia", 'doux'), ("quelques minutes.", SERIF_I, 130, 'minutes', 'acc')], 'coches'),
    ("Ce qui reste humain", NUIT, 'c', 860, [("ce qui reste humain :", SERIF_I, 100, 'humain', 'acc'),
        ("LE GOÛT", SANS, 170, 'goût', 'txt'), ("LE RYTHME", SANS, 170, 'rythme', 'txt'),
        ("ton public.", SERIF_I, 150, 'public', 'acc')], None),
    ("Le monteur devient réalisateur", PAPIER, 'c', 900, [("le monteur devient", SERIF_I, 110, 'devient', 'doux'),
        ("RÉALISATEUR.", SANS, G, 'réalisateur', 'txt')], 'impact:réalisateur'),
    ("Demain, une vidéo", NUIT, 'g', 1350, [("demain, une vidéo", SERIF_I, 110, 'demain', 'doux'),
        ("s'écrira comme", SANS, 110, "s'écrira", 'txt'), ("du code.", SERIF_I, 150, 'code', 'acc')], 'code'),
    ("Tu décris ton intention", PAPIER, 'g', 1390, [("tu décris,", SERIF_I, 100, 'décris', 'doux'),
        ("la machine propose dix versions,", SANS, 64, 'machine', 'txt'),
        ("toi, tu choisis.", SERIF_I, 130, 'choisis', 'acc')], 'grille'),
    ("Le motion design devient", NUIT, 'c', 880, [("le motion design", SERIF_I, 110, 'motion', 'doux'),
        ("ACCESSIBLE", SANS, G, 'accessible', 'txt'), ("à tous.", SERIF_I, 130, 'tous', 'acc')], None),
    ("Donc la différence", PAPIER, 'c', 880, [("le logiciel", SANS, 130, 'logiciel', 'doux'),
        ("L'IDÉE", SANS, 240, 'idée', 'txt'), ("et l'histoire.", SERIF_I, 150, 'histoire', 'acc')], 'barre:0'),
    ("Ce que fait Kamtek", NUIT, 'c', 900, [("ce que fait KAMTECH", SERIF_I, 100, 'kamtek', 'doux'),
        ("est", SERIF_I, 100, 'est', 'doux'), ("ESSENTIEL.", SANS, G, 'essentiel', 'txt')], None),
    ("Expliquer l'IA en", PAPIER, 'g', 880, [("expliquer l'IA", SERIF_I, 110, 'expliquer', 'doux'),
        ("EN FRANÇAIS,", SANS, 150, 'français', 'txt'), ("avec des exemples", SERIF_I, 100, 'avec', 'doux'),
        ("concrets.", SERIF_I, 160, 'concrets', 'acc')], None),
    ("Beaucoup en ont peur", NUIT, 'c', 900, [("beaucoup en ont", SERIF_I, 100, 'beaucoup', 'doux'),
        ("PEUR", SANS, 380, 'peur', 'txt'), ("ou croient à la magie.", SERIF_I, 100, 'magie', 'acc')], None),
    ("Montrer qu'elle s'apprend", PAPIER, 'c', 880, [("montrer qu'elle", SERIF_I, 100, 'montrer', 'doux'),
        ("S'APPREND", SANS, G, "s'apprend", 'txt'), ("et sert à travailler.", SERIF_I, 120, 'travailler', 'acc')], None),
    ("Et cette vidéo en", NUIT, 'c', 900, [("et cette vidéo", SERIF_I, 110, 'cette', 'doux'),
        ("en est", SERIF_I, 110, 'en', 'doux'), ("LA PREUVE.", SANS, G, 'preuve', 'txt')], 'impact:preuve'),
    ("Arrêtez de regarder", PAPIER, 'c', 900, [("arrêtez de", SERIF_I, 120, 'arrêtez', 'doux'),
        ("REGARDER", SANS, G, 'regarder', 'txt'), ("l'IA.", SERIF_I, 140, "l'ia", 'acc')], 'barre:1'),
    ("Utilisez-la", NUIT, 'c', 900, [("UTILISEZ-LA.", SANS, G, 'utilisez', 'txt')], 'impact:utilisez'),
    ("Choisissez une tâche", PAPIER, 'g', 860, [("1  une tâche", SANS, 92, 'tâche', 'txt'),
        ("2  chaque semaine", SANS, 92, 'semaine', 'txt'), ("3  testez-la", SANS, 92, 'testez', 'txt'),
        ("dès aujourd'hui.", SERIF_I, 140, "aujourd'hui", 'acc')], None),
    ("Vérifiez toujours", NUIT, 'c', 900, [("VÉRIFIEZ", SANS, G, 'vérifiez', 'txt'),
        ("toujours.", SERIF_I, 170, 'toujours', 'acc')], None),
    ("Ceux qui commencent", PAPIER, 'c', 880, [("ceux qui commencent", SERIF_I, 100, 'ceux', 'doux'),
        ("maintenant", SERIF_I, 150, 'maintenant', 'acc'), ("UNE LONGUEUR", SANS, G, 'longueur', 'txt'),
        ("D'AVANCE.", SANS, G, "d'avance", 'txt')], None),
]

# ---------------------------------------------------------------- Mariuse : titres derrière + étiquettes
DERRIERE = [  # (segment q, mot déclencheur, durée, petit texte, MOT GÉANT, police)
    (1, 'salut', 2.4, 'épisode 01', 'PODCAST', SANS),
    (1, 'révolution', 2.6, 'la', 'RÉVOLUTION', SANS),
    (4, 'kamtech', 2.4, 'le travail de', 'KAMTECH', SANS),
    (6, 'abonner', 2.6, 'n\'hésite pas à', 'T\'ABONNER', SANS),
]
CHAPITRES = {2: ('02', 'le métier de monteur'), 3: ('03', "l'avenir du montage"), 4: ('04', 'KAMTECH'),
             5: ('05', 'un dernier mot'), 6: ('06', 'le mot de la fin')}
CAMS = {'large': (1.00, 0.50), 'serre': (1.22, 0.47), 'gros': (1.42, 0.51)}
ACCENT = {'podcast', 'unique', 'claude', 'révolution', 'opus', '5.5', 'kamtech', 'intelligence', 'monteur',
          'avenir', 'motion', 'conseilles-tu', 'abonner', 'sensibilisez', 'design'}


def preparer():
    # cartes : temps de début réel de chaque phrase de Claude
    cartes = []
    claude = [s for s in SEGS if s['type'] == 'claude']
    for deb, th, al, yc, els, spec in CARTES:
        cles = deb.split()[:3]
        for s in claude:
            t = mot_t(s, *cles)
            if t is not None and not any(c['t0'] == t for c in cartes):
                if deb.startswith("Ce montage, c'est moi") and not s.get('accroche') and spec != 'pellicule':
                    continue
                if spec == 'pellicule' and s.get('accroche'):
                    continue
                cartes.append(dict(t0=t, seg=s, th=th, al=al, yc=yc, els=els, spec=spec)); break
    cartes.sort(key=lambda c: c['t0'])
    for c in cartes:  # une carte dure jusqu'à la suivante ou la fin du segment
        nxt = [d['t0'] for d in cartes if d['t0'] > c['t0'] and d['seg'] is c['seg']]
        c['t0'] = max(c['seg']['t0'], c['t0'] - 0.08) if c is not cartes[0] or c['seg']['t0'] > 0 else 0.0
        c['t1'] = min(nxt) - 0.08 if nxt else c['seg']['t1']
    for s in claude:  # le début du segment montre déjà la 1re carte
        cs = [c for c in cartes if c['seg'] is s]
        if cs: cs[0]['t0'] = s['t0']
    for i, c in enumerate(cartes):
        c['fond'] = fond_carte(c['th'], 100 + i)
        c['imgs'] = []
        for txt, pol, taille, decl, role in c['els']:
            tw = W * 0.86 if c['al'] == 'c' else W * 0.84
            im = texte_img(txt, pol, 330 if taille == G else taille, c['th'][role], largeur_max=tw,
                           glow=(c['th'] is NUIT and role == 'txt' and (taille == G or taille > 140)))
            td = mot_t(c['seg'], decl, apres=c['t0'] - 0.3) if decl else c['t0']
            ta = max(c['t0'], (td if td is not None else c['t0']) - 0.04)
            c['imgs'].append((im, c['t0'] if not c['imgs'] else ta))
    return cartes


def plans_lui(seg):
    """Multicam simulé : coupe au début de chaque clip et sur les fins de phrase/virgules (≥ 1,4 s)."""
    ordre = ['large', 'serre', 'gros', 'large', 'gros', 'serre']
    pts = [c['t0'] for c in seg['clips']]
    ws = [m for m in MOTS if seg['t0'] <= m[1] < seg['t1']]
    for i, m in enumerate(ws[:-1]):
        if m[0][-1] in '.,?' : pts.append(ws[i + 1][1] - 0.03)
    pts = sorted(set(round(p, 3) for p in pts))
    gard = []
    for p in pts:
        if not gard or p - gard[-1] >= 1.4: gard.append(p)
    out = []; k = seg['q'] % 3
    for p in gard:
        out.append((p, ordre[k % len(ordre)])); k += 1
    return out


def fenetres_derriere():
    out = []
    for q, mot, d, petit, geant, pol in DERRIERE:
        s = next((s for s in SEGS if s['type'] == 'lui' and s['q'] == q), None)
        if s is None: continue
        t = mot_t(s, mot)
        if t is None: continue
        t = max(s['t0'], t - 0.1)
        out.append(dict(t0=t, t1=min(s['t1'], t + d), petit=petit, geant=geant, pol=pol))
    return out


def calque_titre(petit, geant, pol):
    taille = 400
    while True:
        fg = F(pol, taille); bb = fg.getbbox(geant)
        if bb[2] - bb[0] <= W * 0.94 or taille < 80: break
        taille -= 8
    fp = F(SERIF_I, max(54, int(taille * 0.30))); bp = fp.getbbox(petit)
    hg, hp = bb[3] - bb[1], bp[3] - bp[1]
    im = Image.new('RGBA', (W, hg + hp + 120), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.text(((W - (bp[2] - bp[0])) / 2 - bp[0], 20 - bp[1]), petit, font=fp, fill=(255, 255, 255, 235))
    y = 20 + hp + 10
    d.text(((W - (bb[2] - bb[0])) / 2 - bb[0], y - bb[1]), geant, font=fg, fill=(250, 248, 242, 255))
    g = Image.eval(im.filter(ImageFilter.GaussianBlur(18)), lambda v: v // 3)
    return Image.alpha_composite(g, im), y, y + hg


# ---------------------------------------------------------------- sous-titres 1–3 mots
def blocs_sous_titres():
    blocs, cur = [], []
    for m in MOTS:
        if cur and (m[4] != cur[0][4]):
            blocs.append(cur); cur = []
        cur.append(m)
        if len(cur) == 3 or m[0][-1] in '.,?:' or (len(cur) == 2 and len(cur[0][0] + m[0]) > 13):
            blocs.append(cur); cur = []
    if cur: blocs.append(cur)
    out = []
    for i, b in enumerate(blocs):
        fin = blocs[i + 1][0][1] if i + 1 < len(blocs) and blocs[i + 1][0][4] == b[0][4] else b[-1][2] + 0.25
        out.append((b[0][1], fin, b))
    return out


def dessine_sous_titre(img, bloc, t, y, clair, discret=False):
    d = ImageDraw.Draw(img); parts = []
    for w, a, b, qui, _ in bloc:
        acc = norm(w) in ACCENT
        parts.append((w, F(SERIF_I, 66 if discret else 88) if acc else F(SANS, 44 if discret else 62), a))
    larg = sum(f.getlength(w) for w, f, _ in parts) + (14 if discret else 20) * (len(parts) - 1)
    x = (W - larg) / 2
    for w, f, a in parts:
        if t >= a - 0.05:
            if discret:
                d.text((x, y), w, font=f, fill=((120, 112, 104, 255) if clair else (165, 160, 152, 255)), anchor='ls')
            elif clair:
                d.text((x, y), w, font=f, fill=(22, 21, 20, 255), anchor='ls')
            else:
                d.text((x, y + 4), w, font=f, fill=(0, 0, 0, 150), anchor='ls')
                d.text((x, y), w, font=f, fill=(255, 255, 255, 255), anchor='ls')
        x += f.getlength(w) + (14 if discret else 20)


# ---------------------------------------------------------------- spéciaux des cartes
PELLICULE = None
PETIT_LOGO = Image.open(logo_png('Claude')).convert('RGBA'); PETIT_LOGO.thumbnail((58, 58))
GRAND_LOGO = Image.open(logo_png('Claude')).convert('RGBA'); GRAND_LOGO.thumbnail((230, 230))


def special(img, c, t, th):
    global PELLICULE
    sp = c['spec'] or ''; rel = t - c['t0']; d = ImageDraw.Draw(img)
    if sp == 'logo_claude':
        p = ease(rel / 0.2); s = 1.1 * p if rel < 0.2 else 1.0
        coller(img, GRAND_LOGO, W / 2, 520, alpha=min(1, rel / 0.1), echelle=max(0.05, s))
    elif sp == 'pellicule':
        if PELLICULE is None: PELLICULE = images_source([1.5, 9.0, 16.5, 30.0, 50.0], (210, 320))
        for i, fr in enumerate(PELLICULE):
            a = ease((rel - 0.08 * i) / 0.25)
            coller(img, fr, 118 + i * 211, 560 + (1 - a) * 40 + (i % 2) * 36, alpha=a)
    elif sp == 'transcription':   # la vraie transcription de Mariuse, le mot courant surligné
        f = F(MONO, 40); i0 = int(rel * 4.5) % (len(MOTS_SRC) - 7)
        for k in range(7):
            w, a, b = MOTS_SRC[i0 + k]; y = 420 + k * 78; cur = k == 3
            if cur: d.rounded_rectangle((70, y - 50, W - 70, y + 18), 12, fill=th['acc'] + (255,))
            col = (255, 255, 255, 255) if cur else th['txt'] + (255,)
            d.text((100, y), f'{a:6.2f}  →  {b:6.2f}', font=f, fill=col, anchor='ls')
            d.text((620, y), w, font=F(MONO, 44), fill=col, anchor='ls')
    elif sp == 'onde':            # la vraie forme d'onde, les hésitations coupées en rouge
        if 'onde' not in c: c['onde'] = onde_source(0, 21, W - 160, 380)
        o = c['onde']; yc = 560; n = len(o); trous = [(3.4, 3.5), (6.55, 6.78), (10.8, 13.05), (13.86, 14.44), (15.3, 15.74), (17.92, 18.6)]
        for i, v in enumerate(o):
            ts = i / n * 21; x = 80 + i * 6
            coupe = any(a <= ts < b for a, b in trous) and rel > 0.5
            col = th['acc'] if coupe else th['txt']
            d.rectangle((x, yc - v, x + 3, yc + v), fill=col + (255,))
        if rel > 0.5:
            for a, b in trous:
                x0, x1 = 80 + a / 21 * (W - 160), 80 + b / 21 * (W - 160)
                xm = (x0 + x1) / 2; d.polygon(((xm - 12, yc + 250), (xm + 12, yc + 250), (xm, yc + 232)), fill=th['acc'] + (255,))
        xp = 80 + min(1, rel / max(0.1, c['t1'] - c['t0'])) * (W - 160)
        d.line((xp, yc - 220, xp, yc + 220), fill=(255, 255, 255, 200), width=3)
    elif sp == 'code':            # le vrai code de ce montage, tapé à l'écran
        f = F(MONO, 30); n = int(rel * 70); y = 400; reste = n; vis = ''
        d.rounded_rectangle((60, 340, W - 60, 1060), 22, fill=(28, 28, 32, 255))
        for k in (0, 1, 2): d.ellipse((96 + k * 34, 366, 116 + k * 34, 386), fill=((235, 95, 87), (245, 190, 80), (98, 200, 85))[k])
        lignes = [l[:52] for l in CODE[40:55]]
        for l in lignes:
            if reste <= 0: break
            vis = l[:reste]; reste -= len(l)
            d.text((100, y + 40), vis, font=f, fill=(225, 220, 210, 255)); y += 42
        if (int(rel * 2) % 2) == 0: d.rectangle((100 + f.getlength(vis), y + 6, 116 + f.getlength(vis), y + 36), fill=th['acc'] + (255,))
    elif sp == 'grille':          # dix versions (vraies images), la meilleure sélectionnée
        if 'grille' not in c:
            ims = images_source([2 + 6.5 * i for i in range(10)], (180, 300)); c['grille'] = ims
        tsel = mot_t(c['seg'], 'meilleure') or c['t1']
        for i, fr in enumerate(c['grille']):
            a = ease((t - (mot_t(c['seg'], 'dix') or c['t0']) - 0.05 * i) / 0.2)
            x = 130 + (i % 5) * 205; y = 480 + (i // 5) * 330
            if t >= tsel and i != 6: a *= 0.35
            coller(img, fr, x, y, alpha=a)
        if t >= tsel:
            x, y = 130 + 1 * 205, 480 + 330; e = ease((t - tsel) / 0.2)
            bx = (x - 100 - 10 * (1 - e), y - 160, x + 100, y + 160)
            for k in range(int(bx[0]), int(bx[2]), 22): d.line((k, bx[1], min(k + 12, bx[2]), bx[1]), fill=th['acc'] + (255,), width=4); d.line((k, bx[3], min(k + 12, bx[2]), bx[3]), fill=th['acc'] + (255,), width=4)
            for k in range(int(bx[1]), int(bx[3]), 22): d.line((bx[0], k, bx[0], min(k + 12, bx[3])), fill=th['acc'] + (255,), width=4); d.line((bx[2], k, bx[2], min(k + 12, bx[3])), fill=th['acc'] + (255,), width=4)
            for px, py in ((bx[0], bx[1]), (bx[2], bx[1]), (bx[0], bx[3]), (bx[2], bx[3])):
                d.rectangle((px - 10, py - 10, px + 10, py + 10), fill=(255, 255, 255, 255), outline=th['acc'] + (255,), width=3)


def carte(c, t):
    th = c['th']; rel = t - c['t0']
    img = c['fond'].copy()
    # léger zoom continu dans la carte (vivant, pas figé)
    z = 1 + 0.025 * min(1, rel / max(0.5, c['t1'] - c['t0']))
    tot = sum(im.height - 2 for im, _ in c['imgs'])
    y = c['yc'] - tot / 2
    sp = c['spec'] or ''
    for k, (im, ta) in enumerate(c['imgs']):
        h = im.height - 2
        if t >= ta:
            p = ease((t - ta) / 0.18)
            dy = (1 - p) * 26
            if sp == 'monte': dy -= ease((t - c['imgs'][1][1]) / 0.6) * 40 if t >= c['imgs'][1][1] else 0
            x = W / 2 if c['al'] == 'c' else 70 + im.width / 2
            coller(img, im, W / 2 + (x - W / 2) * z, c['yc'] + (y + h / 2 - c['yc']) * z + dy, alpha=p, echelle=z * (0.94 + 0.06 * p))
            if sp.startswith('barre:') and k == int(sp[6:]) and t >= ta + 0.35:   # mot barré
                e = ease((t - ta - 0.35) / 0.25); d = ImageDraw.Draw(img)
                xc = W / 2 if c['al'] == 'c' else 70 + im.width / 2; yy = c['yc'] + (y + h / 2 - c['yc']) * z + 6
                d.line((xc - im.width / 2 + 20, yy, xc - im.width / 2 + 20 + (im.width - 40) * e, yy), fill=th['acc'] + (255,), width=12)
        y += h
    special(img, c, t, th)
    # étiquette « Claude répond » (même place à chaque carte)
    img.alpha_composite(PETIT_LOGO, (64, 214))
    d = ImageDraw.Draw(img)
    d.text((134, 262), 'Claude', font=F(SANS, 42), fill=th['txt'] + (255,), anchor='ls')
    d.text((134 + F(SANS, 42).getlength('Claude') + 14, 262), 'répond', font=F(SERIF_I, 46), fill=th['doux'] + (255,), anchor='ls')
    return img


# ---------------------------------------------------------------- rendu
def lecteur(src0, duree):
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-ss', str(src0), '-t', str(duree + 0.2), '-i', SRC,
                          '-vf', f'fps={FPS}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    der = None
    while True:
        b = p.stdout.read(SW * SH * 3)
        if len(b) < SW * SH * 3:
            while True: yield der            # on tient la dernière image (carte CTA)
        der = np.frombuffer(b, np.uint8).reshape(SH, SW, 3); yield der


def main():
    cartes = preparer()
    fen = fenetres_derriere()
    titres = {id(f): calque_titre(f['petit'], f['geant'], f['pol']) for f in fen}
    subs = blocs_sous_titres()
    plans = {s['q']: plans_lui(s) for s in SEGS if s['type'] == 'lui'}
    yy, xx = np.mgrid[0:H, 0:W]
    vignette = (1 - 0.45 * (((xx - W / 2) / (W * 0.75)) ** 2 + ((yy - H * 0.42) / (H * 0.65)) ** 2)).clip(0.35, 1)[..., None]
    sortie = f'{ICI}/pro{V}_muet.mp4'
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                            '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium',
                            '-pix_fmt', 'yuv420p', sortie], stdin=subprocess.PIPE)
    clip_cour, lect, alph, haut_tete = None, None, None, {}
    derniere_carte = None
    n_img = int(DUREE * FPS)
    for n in range(n_img):
        t = n / FPS
        s = seg_a(t)
        if n % 300 == 0: print(f'{t:6.1f}/{DUREE:.1f} s', flush=True)
        if s['type'] == 'claude':
            c = next((c for c in cartes if c['t0'] <= t < c['t1']), None) or derniere_carte
            if c is None: c = cartes[0]
            if c is not derniere_carte:
                EV.append((c['t0'], 'carte', 1 if c['th'] is NUIT else 0))
                for im, ta in c['imgs'][1:]: EV.append((ta, 'mot', 0))
            derniere_carte = c
            img = carte(c, t)
            for s0, s1, b in subs:
                if s0 <= t < s1 and b[0][3] == 'c' and not b[0][4] == 0 and t > 2.6:
                    dessine_sous_titre(img, b, t, 1640, c['th'] is PAPIER, discret=True)
            enc.stdin.write(img.convert('RGB').tobytes()); continue
        # ----- Mariuse
        c = next(c for c in s['clips'] if t < c['t1'] or c is s['clips'][-1])
        if c is not clip_cour:
            clip_cour = c
            src0 = c['src'][0]; dur = c['t1'] - c['t0']
            lect = lecteur(src0, dur)
            besoin = any(f['t0'] < c['t1'] and f['t1'] > c['t0'] for f in fen)
            alph = alphas(SRC, src0, min(dur, c['src'][1] - src0) + 0.1, FPS) if besoin else None
            EV.append((c['t0'], 'coupe_cam', 0))
        fr = next(lect)
        a = None
        if alph is not None:
            try: a = next(alph)
            except StopIteration: a = a if a is not None else np.zeros((SH, SW), np.float32)
        pl = plans[s['q']]
        k = max(i for i, p in enumerate(pl) if t >= p[0] - 1e-6) if t >= pl[0][0] else 0
        p0 = pl[k][0]; p1 = pl[k + 1][0] if k + 1 < len(pl) else s['t1']
        f_act = next((f for f in fen if f['t0'] <= t < f['t1']), None)
        cam = 'large' if f_act else pl[k][1]
        zc, xc = CAMS[cam]
        if t >= FIN_PAROLE: zc *= 1 + 0.06 * (t - FIN_PAROLE) / QUEUE
        z = zc * (1 + 0.02 * (t - p0) / max(0.3, p1 - p0))
        cw, ch = SW / z, SH / z
        cx = min(max(SW * xc, cw / 2), SW - cw / 2); top = max(0, SH * 0.42 - ch * 0.42)
        box = (cx - cw / 2, top, cx + cw / 2, top + ch)
        frf = np.asarray(Image.fromarray(fr).resize((W, H), Image.LANCZOS, box=box), np.float32)
        comp = frf
        if f_act is not None and a is not None:
            al = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR, box=box), np.float32)[..., None] / 255
            cle = id(f_act)
            if cle not in haut_tete:
                lignes = np.where(al[:, W // 3: 2 * W // 3, 0].max(axis=1) > 0.6)[0]
                haut_tete[cle] = int(lignes[0]) if len(lignes) else 600
                EV.append((f_act['t0'], 'titre', 0))
            rel = t - f_act['t0']; sortie_f = f_act['t1'] - t
            m = min(ease(rel / 0.25), ease(sortie_f / 0.25))           # entrée/sortie de l'assombrissement
            flou = np.asarray(Image.fromarray(frf.astype(np.uint8)).filter(ImageFilter.GaussianBlur(3)), np.float32)
            fond = frf * (1 - m) + flou * FOND * vignette * m
            ti, haut, bas = titres[cle]
            pp = ease(rel / 0.22); sc = (1.12 - 0.12 * pp)
            tw, th_ = int(ti.width * sc), int(ti.height * sc)
            tr = np.asarray(ti.resize((tw, th_), Image.LANCZOS), np.float32)
            ty = int(haut_tete[cle] + 0.45 * (bas - haut) * sc - bas * sc); tx = (W - tw) // 2
            couche = np.zeros((H, W, 4), np.float32)
            y0, y1 = max(0, ty), min(H, ty + th_); x0, x1 = max(0, tx), min(W, tx + tw)
            couche[y0:y1, x0:x1] = tr[y0 - ty:y1 - ty, x0 - tx:x1 - tx]
            ta = couche[..., 3:4] / 255 * pp * m
            fond = fond * (1 - ta) + couche[..., :3] * ta
            comp = fond * (1 - al) + frf * al
        img = Image.fromarray(comp.clip(0, 255).astype(np.uint8)).convert('RGBA')
        d = ImageDraw.Draw(img)
        # étiquettes : nom au premier passage, chapitre ensuite
        if s['q'] == 1 and not f_act and t < s['t1']:
            d.text((64, 262), 'Mariuse', font=F(SANS, 42), fill=(255, 255, 255, 255), anchor='ls')
            d.text((64 + F(SANS, 42).getlength('Mariuse') + 14, 262), 'KAMTECH', font=F(SERIF_I, 46), fill=(225, 220, 210, 255), anchor='ls')
        elif s['q'] in CHAPITRES and not f_act:
            num, lib = CHAPITRES[s['q']]
            if V == '_court':   # la version courte saute la question 3 : on renumérote
                num = {'04': '03', '05': '04', '06': '05'}.get(num, num)
            d.text((64, 262), num, font=F(SANS, 42), fill=(224, 128, 96, 255), anchor='ls')
            d.text((64 + F(SANS, 42).getlength(num) + 16, 262), lib, font=F(SERIF_I, 46), fill=(255, 255, 255, 255), anchor='ls')
        # logo Claude à la mention d'Opus 5.5 (mention rapide : pop sous le sous-titre)
        if s['q'] == 1:
            to = mot_t(s, 'opus')
            if to and to - 0.05 <= t < to + 1.4:
                from logo import coller as coller_logo
                coller_logo(img, 'Claude', (540, 1420), 130, t - to + 0.05)
                if not any(e[1] == 'logo' for e in EV): EV.append((to - 0.05, 'logo', 0))
        # carte CTA finale : champ de commentaire qui se tape (Toprak)
        if t >= FIN_PAROLE - 0.2:
            rel = t - FIN_PAROLE + 0.2; e = ease(rel / 0.25)
            d.text((W / 2, 1180 - 20 * (1 - e)), 'commente', font=F(SERIF_I, 96), fill=(224, 128, 96, int(255 * e)), anchor='ms')
            d.rounded_rectangle((90, 1230, W - 90, 1350), 60, fill=(255, 255, 255, int(245 * e)))
            d.ellipse((112, 1250, 192, 1330), fill=(224, 128, 96, int(255 * e)))
            msg = "la tâche que tu vas confier à l'IA"; vis = msg[:max(0, int((rel - 0.25) * 30))]
            d.text((216, 1306), vis, font=F(SANS, 44), fill=(30, 30, 30, int(255 * e)), anchor='ls')
            if int(rel * 3) % 2 == 0: d.rectangle((218 + F(SANS, 44).getlength(vis), 1262, 222 + F(SANS, 44).getlength(vis), 1316), fill=(30, 30, 30, int(255 * e)))
            if not any(e_[1] == 'cta' for e_ in EV): EV.append((FIN_PAROLE - 0.2, 'cta', 0))
        else:
            for s0, s1, b in subs:
                if s0 <= t < s1 and b[0][3] == 'l':
                    dessine_sous_titre(img, b, t, 1300, False)
        enc.stdin.write(img.convert('RGB').tobytes())
    enc.stdin.close(); enc.wait()
    # événements pour le son (+ silences de ponctuation et impacts)
    for c in cartes:
        sp = c['spec'] or ''
        if sp == 'silence': EV.append((c['t0'], 'silence', c['t1'] - c['t0']))
        if sp.startswith('impact:'):
            ti = mot_t(c['seg'], sp[7:], apres=c['t0'] - 0.3)
            if ti: EV.append((ti, 'impact', 0))
        if sp == 'code': EV.append((c['t0'], 'frappe', c['t1'] - c['t0']))
    json.dump(dict(duree=DUREE, coupes=COUPES, ev=sorted(EV), segs=[{k: v for k, v in s.items() if k != 'env'} for s in SEGS]),
              open(f'{ICI}/evenements_pro{V}.json', 'w'), ensure_ascii=False)
    print('ok', sortie, f'{DUREE:.2f} s')


if __name__ == '__main__':
    main()
