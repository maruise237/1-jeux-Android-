"""Reel « 3 meilleures applis pour un salon de beauté » → ChatGPT, Google Flow, puis Djoumi (djoumi.com).

Type (skill §0) : tuto outil / liste, l'outil de Mariuse en dernier (place de la chute), même format d'écran
partagé pour les 3. Pour Djoumi, on réutilise la vidéo motion officielle (vraies interfaces) : chaque phrase
a son passage (tableau de bord, relances WhatsApp, lien de réservation, bios, prise de RDV), recadré pour
enlever ses sous-titres incrustés, accéléré pour tenir dans la phrase.
Usage : python3 djoumi/montage.py → djoumi/muet.mp4 + evenements.json
"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ICI = os.path.dirname(os.path.abspath(__file__)); RACINE = os.path.dirname(ICI)
sys.path.insert(0, f'{RACINE}/outils')
from detourage import alphas

W, H, FPS = 1080, 1920, 30
SW, SH = 1296, 2304
F = lambda n, s: ImageFont.truetype(f'{RACINE}/fonts/{n}', s)
SANS, SERIF_I = 'InterTight-ExtraBold.ttf', 'InstrumentSerif-Italic.ttf'
CREME, ENCRE, GRIS, ROUGE, NUIT = (243, 238, 228), (20, 20, 20), (110, 104, 96), (200, 0, 53), (16, 16, 18)

SEGS = [(0.0, 3.65), (4.22, 7.55), (8.33, 22.50)]
OFF = []; o = 0
for a, b in SEGS: OFF.append((o, o + b - a, a - o)); o += b - a
FIN_VOIX = o; TENUE = .9; DUREE = FIN_VOIX + TENUE
def src(t):
    for o0, o1, d in OFF:
        if t < o1: return t + d
    return min(t + OFF[-1][2], SEGS[-1][1] - .05)
def sortie(ts):
    for (a, b), (o0, o1, d) in zip(SEGS, OFF):
        if a - .3 <= ts <= b + .3: return min(max(ts - d, o0), o1)

CORR = {'porter.': 'poster.', 'plus': 'puissent', 'prennent': 'prendre'}
MOTS = [(CORR.get(m['w'], m['w']), sortie(m['a'])) for m in json.load(open(f'{ICI}/mots.json'))]
def q(mot, n=0): return [a for w, a in MOTS if w.lower().strip('.,') == mot][n]
T = dict(salon=q('salon'), chatgpt=q('chatgpt'), google=q('google'), et=q('et'), djoumi=q('djoumi'), gerer=q('gérer'),
         tes2=q('tes', 2), un=q('un', 1), dans=q('dans'), tiktok=q('tiktok'), facebook=q('facebook'),
         instagram=q('instagram'), pour=q('pour', 3))
# écrans (début sortie, type, données)
ECRANS = [(0, 'hook', 0), (T['salon'] - .05, 'hook', 1), (T['chatgpt'] - .04, 'outil', 0), (T['google'] - .04, 'outil', 1),
          (T['et'] - .04, 'perso', 0), (T['djoumi'] - .04, 'marque', 0), (T['gerer'] - .04, 'motion', 0),
          (T['tes2'] - .04, 'motion', 1), (T['un'] - .04, 'motion', 2), (T['dans'] - .04, 'motion', 3),
          (T['pour'] - .04, 'motion', 4)]
# passages de la vidéo motion (début, fin) en secondes
CLIPS = [(2.2, 4.6), (13.7, 16.4), (17.5, 19.7), (19.9, 23.7), (24.0, 28.95)]
ZOOM_CLIP = {2: (1.3, .32)}     # le lien de réservation : on serre sur la carte
OUTILS = [dict(nom='ChatGPT', sous='tes images de pub', logo='chatgpt'), dict(nom='Google Flow', sous='anime tes images', logo=None)]

def ease(x): x = min(1, max(0, x)); return 1 - (1 - x) ** 3
def pop(x): x = min(1, max(0, x / .18)); return 1.1 * (1 - (1 - x) ** 3) if x < 1 else 1.0
def arrondi(im, r):
    m = Image.new('L', im.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, im.width - 1, im.height - 1), r, fill=255)
    im = im.convert('RGBA'); im.putalpha(Image.fromarray(np.minimum(np.asarray(im)[..., 3], np.asarray(m)))); return im
def ombre(im, r=30, a=90):
    pad = r * 2; o = Image.new('RGBA', (im.width + 2 * pad, im.height + 2 * pad), (0, 0, 0, 0))
    sh = Image.new('RGBA', im.size, (0, 0, 0, a)); sh.putalpha(Image.fromarray((np.asarray(im)[..., 3] * a / 255).astype(np.uint8)))
    o.paste(sh, (pad, pad + 14), sh); o = o.filter(ImageFilter.GaussianBlur(r)); o.alpha_composite(im, (pad, pad)); return o, pad
def logo(nom, taille):
    lg = Image.open(f'{RACINE}/assets/logos/{nom}.png').convert('RGBA'); lg.thumbnail((taille, taille), Image.LANCZOS); return lg
def pastille(nom, taille, s):
    if s <= 0: return None
    lg = logo(nom, max(2, int(taille * s))); m = int(lg.width * .2)
    f = Image.new('RGBA', (lg.width + 2 * m, lg.height + 2 * m), (0, 0, 0, 0))
    ImageDraw.Draw(f).rounded_rectangle((0, 0, f.width - 1, f.height - 1), m * 2, fill=(255, 255, 255, 245))
    f.alpha_composite(lg, (m, m)); return f


def titre_geant(petit, geant):
    tg = 420
    while F(SANS, tg).getlength(geant) > W * .92: tg -= 6
    fg = F(SANS, tg); bb = fg.getbbox(geant); fp = F(SERIF_I, int(min(tg * .34, 110))); bp = fp.getbbox(petit)
    hg, hp = bb[3] - bb[1], bp[3] - bp[1]
    im = Image.new('RGBA', (W, hg + hp + 90), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.text(((W - bp[2] + bp[0]) / 2 - bp[0], 16 - bp[1]), petit, font=fp, fill=(255, 255, 255, 235))
    y = 16 + hp + 14; d.text(((W - bb[2] + bb[0]) / 2 - bb[0], y - bb[1]), geant, font=fg, fill=(250, 248, 242, 255))
    l = im.filter(ImageFilter.GaussianBlur(16)); out = Image.new('RGBA', im.size, (0, 0, 0, 0))
    out.alpha_composite(Image.eval(l, lambda v: v // 3)); out.alpha_composite(im); return out, y, y + hg


# sous-titres 1–3 mots
def blocs():
    res, cur = [], []
    for k, (w, a) in enumerate(MOTS):
        cur.append(k)
        if len(cur) == 3 or w[-1] in '.,' or (len(cur) == 2 and len(MOTS[cur[0]][0] + w) > 11):
            res.append(cur); cur = []
    if cur: res.append(cur)
    return [(MOTS[b[0]][1], MOTS[res[i + 1][0]][1] if i + 1 < len(res) else FIN_VOIX, b) for i, b in enumerate(res)]
BLOCS = blocs()
ACCENT = {'beauté', 'publicité', 'animer', 'réservation', 'relances', 'personnel', 'rendez-vous'}
def sous_titre(img, t, y):
    b = next((b for b in BLOCS if b[0] - .02 <= t < b[1]), None)
    if not b: return
    d = ImageDraw.Draw(img); parts = []
    for k in b[2]:
        w = MOTS[k][0].strip('.,'); w = w.replace('-vous', ' -vous') if False else w
        parts.append((w, F(SERIF_I, 96) if w.lower() in ACCENT else F(SANS, 64), MOTS[k][1], w.startswith('-')))
    x = (W - sum(f.getlength(w) + (0 if c else 20) for w, f, _, c in parts) + 20) / 2
    for w, f, a, c in parts:
        if c: x -= 20
        if t >= a - .04:
            for dy in (5, 3): d.text((x, y + dy), w, font=f, fill=(0, 0, 0, 150), anchor='ls')
            d.text((x, y), w, font=f, fill=(255, 255, 255), anchor='ls')
        x += f.getlength(w) + 20


class Video:
    def __init__(s, chemin, w, h):
        s.w, s.h = w, h
        s.p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', chemin, '-vf', f'fps={FPS},scale={w}:{h}', '-f', 'rawvideo',
                                '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE); s.i = -1; s.img = None; s.cache = {}
    def get(s, ts):
        n = int(round(ts * FPS))
        while s.i < n:
            b = s.p.stdout.read(s.w * s.h * 3)
            if len(b) < s.w * s.h * 3: break
            s.img = b; s.i += 1
        return np.frombuffer(s.img, np.uint8).reshape(s.h, s.w, 3)
def cadre(z, xc, yc, w, h):
    cw = SW / z; ch = cw * h / w; cx = min(max(SW * xc, cw / 2), SW - cw / 2); y0 = min(max(0, SH * yc - ch * .45), SH - ch)
    return (cx - cw / 2, y0, cx + cw / 2, y0 + ch)


def charger_motion():
    """Toutes les images utiles de la vidéo motion, recadrées sous les sous-titres incrustés."""
    v = Video(f'{ICI}/motion.mp4', 1080, 1920); im = {}
    besoin = sorted({int(round(t * FPS)) for a, b in CLIPS for t in np.arange(a, b + .04, 1 / FPS)})
    for n in besoin:
        im[n] = Image.fromarray(v.get(n / FPS)).crop((0, 360, 1080, 1800))
    v.p.kill(); return im


def main():
    person = Video(f'{ICI}/source.mp4', SW, SH)
    AL = list(alphas(f'{ICI}/src_hook.mp4', 0, SEGS[0][1] + .05, FPS))
    titres = [titre_geant('les 3 meilleures', 'APPLIS'), titre_geant('si tu as un salon de', 'BEAUTÉ')]
    MO = charger_motion()
    flow = Image.open(f'{ICI}/flow_og.png').convert('RGB')
    flow = ombre(arrondi(flow.resize((960, int(960 * flow.height / flow.width)), Image.LANCZOS), 36), 30, 120)
    yy, xx = np.mgrid[0:H, 0:W]
    vign = (1 - .5 * (((xx - W / 2) / (W * .75)) ** 2 + ((yy - H * .42) / (H * .65)) ** 2)).clip(.3, 1)[..., None]
    ev = []; vu = set(); tete = {}
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
                            '-i', '-', '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-pix_fmt', 'yuv420p', f'{ICI}/muet.mp4'], stdin=subprocess.PIPE)
    for i in range(int(DUREE * FPS)):
        t = i / FPS; ts = src(t); fr = person.get(ts)
        k = max(j for j, e in enumerate(ECRANS) if t >= e[0]); e0, typ, x = ECRANS[k]
        e1 = ECRANS[k + 1][0] if k + 1 < len(ECRANS) else DUREE; te = t - e0; pr = min(1, te / (e1 - e0))
        if (k, typ) not in vu: vu.add((k, typ)); ev.append((e0, typ, x))
        if typ in ('hook', 'perso'):
            z = (1.0 if typ == 'hook' else 1.32) * (1 + .02 * pr)
            box = cadre(z, .5, .42 if typ == 'hook' else .44, W, H)
            img = np.asarray(Image.fromarray(fr).resize((W, H), Image.LANCZOS, box=box), np.float32)
            if typ == 'hook':
                a = AL[min(len(AL) - 1, int(round(ts * FPS)))]; ab = tuple(v * a.shape[1] / SW for v in box)
                al = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR, box=ab), np.float32)[..., None] / 255
                if x not in tete:
                    l = np.where(al[:, W // 3:2 * W // 3, 0].max(1) > .6)[0]; tete[x] = int(l[0]) if len(l) else 600
                ti, ht, bt = titres[x]; p = ease(te / .22); s = 1.12 - .12 * p + .02 * te
                tw, th = int(ti.width * s), int(ti.height * s); tr = np.asarray(ti.resize((tw, th), Image.LANCZOS), np.float32)
                ty = int(tete[x] + .45 * (bt - ht) * s - bt * s); tx = (W - tw) // 2
                c = np.zeros((H, W, 4), np.float32); y0, y1 = max(0, ty), min(H, ty + th)
                c[y0:y1, max(0, tx):max(0, tx) + min(W, tw)] = tr[y0 - ty:y1 - ty, max(0, -tx):max(0, -tx) + min(W, tw)]
                ta = c[..., 3:4] / 255 * p
                fond = np.asarray(Image.fromarray(img.astype(np.uint8)).filter(ImageFilter.GaussianBlur(3)), np.float32) * .45 * vign
                img = (fond * (1 - ta) + c[..., :3] * ta) * (1 - al) + img * al
            out = Image.fromarray(img.clip(0, 255).astype(np.uint8)).convert('RGBA')
            if typ == 'perso':
                ImageDraw.Draw(out).text((64, 210), '3.', font=F(SERIF_I, 130), fill=(255, 255, 255, 230), anchor='ls')
            sous_titre(out, t, 1320)
        elif typ == 'marque':                                       # Djoumi : coup de marque plein écran
            out = Image.new('RGBA', (W, H), ROUGE + (255,)); d = ImageDraw.Draw(out); s = pop(te)
            lg = Image.open(f'{RACINE}/assets/logos/djoumi.png').convert('RGBA').crop((40, 40, 472, 472))
            lg = lg.resize((max(2, int(330 * s)), max(2, int(330 * s))), Image.LANCZOS)
            out.alpha_composite(lg, (int(W / 2 - lg.width / 2), int(700 - lg.height / 2)))
            p = ease((te - .1) / .25)
            d.text((W / 2, 1060 + 20 * (1 - p)), 'djoumi', font=F(SANS, 170), fill=(255, 255, 255, int(255 * p)), anchor='ms')
            d.text((W / 2, 1160), 'rendez-vous WhatsApp pour salons', font=F(SERIF_I, 64), fill=(255, 220, 228, int(255 * ease((te - .2) / .25))), anchor='ms')
        else:                                                       # écran partagé : visuel en haut, personne en bas
            hb = 820 if typ == 'motion' else 900
            fond = ROUGE if typ == 'motion' else (CREME if x == 0 else NUIT)
            out = Image.new('RGBA', (W, H), fond + (255,))
            out.paste(Image.fromarray(fr).resize((W, hb), Image.LANCZOS, box=cadre(1.12, .54, .46, W, hb)), (0, H - hb))
            haut = Image.new('RGBA', (W, H - hb), fond + (255,)); d = ImageDraw.Draw(haut)
            if typ == 'motion':
                a, b = CLIPS[x]; r = a + (b - a) * pr; n = int(round(r * FPS)); n = min(MO, key=lambda m: abs(m - n))
                zc, cy = ZOOM_CLIP.get(x, (1.0, .5)); m = MO[n]; z = (H - hb) / m.height * zc * (1 + .015 * pr)
                m = m.resize((int(m.width * z), int(m.height * z)), Image.LANCZOS)
                haut.paste(m, (int(W / 2 - m.width / 2), int((H - hb) / 2 - m.height * cy)))
                if x == 3:                                          # logos des réseaux, au mot prononcé
                    for j, (nom, tm) in enumerate((('tiktok', T['tiktok']), ('facebook', T['facebook']), ('instagram', T['instagram']))):
                        pa = pastille(nom, 92, pop(t - tm + .02))
                        if pa: haut.alpha_composite(pa, (int(W - 90 - pa.width / 2), int(250 + j * 175 - pa.height / 2)))
                        if 0 <= t - tm + .02 < 1 / FPS: ev.append((tm, 'logo', j))
            else:
                o_ = OUTILS[x]; clair = x == 0; coul = ENCRE if clair else (245, 245, 245); gris = GRIS if clair else (170, 170, 175)
                p = ease(te / .32)
                if x == 0:                                          # ChatGPT : grande carte logo
                    c = Image.new('RGBA', (620, 560), (0, 0, 0, 0)); dc = ImageDraw.Draw(c)
                    dc.rounded_rectangle((0, 0, 619, 559), 60, fill=(255, 255, 255, 255))
                    lg = logo('chatgpt', 300); c.alpha_composite(lg, (310 - lg.width // 2, 230 - lg.height // 2))
                    dc.text((310, 480), 'ChatGPT', font=F(SANS, 64), fill=ENCRE, anchor='ms')
                    cs, pad = ombre(c, 30, 70); cs = cs.rotate(-2 * (1 - .3 * p), resample=Image.BICUBIC)
                    haut.alpha_composite(cs, (int(W / 2 - cs.width / 2), int(330 - pad + 240 * (1 - p))))
                else:                                               # Google Flow : visuel officiel
                    cs, pad = flow; z = 1 + .04 * pr; cs = cs.resize((int(cs.width * z), int(cs.height * z)), Image.LANCZOS)
                    haut.alpha_composite(cs, (int(W / 2 - cs.width / 2), int(360 - pad * z + 240 * (1 - p))))
                d = ImageDraw.Draw(haut); qq = ease((te - .05) / .25)
                d.text((64, 150), f'{x + 1}.', font=F(SERIF_I, 150), fill=gris + (255,), anchor='ls')
                d.text((200, 132 + 16 * (1 - qq)), o_['nom'], font=F(SANS, 92), fill=coul + (int(255 * qq),), anchor='ls')
                d.text((204, 206), o_['sous'], font=F(SERIF_I, 60), fill=gris + (int(255 * ease((te - .2) / .25)),), anchor='ls')
            out.paste(haut, (0, 0)); ImageDraw.Draw(out).line((0, H - hb, W, H - hb), fill=(25, 25, 25), width=4)
            sous_titre(out, t, H - 170)
            if t >= FIN_VOIX:                                       # fin : l'adresse, sobre
                s = pop(t - FIN_VOIX)
                pil = Image.new('RGBA', (560, 130), (0, 0, 0, 0)); dp = ImageDraw.Draw(pil)
                dp.rounded_rectangle((0, 0, 559, 129), 65, fill=(255, 255, 255, 255))
                dp.text((280, 66), 'djoumi.com', font=F(SANS, 64), fill=ROUGE, anchor='mm')
                pil = pil.resize((max(2, int(560 * s)), max(2, int(130 * s))), Image.LANCZOS)
                out.alpha_composite(pil, (int(W / 2 - pil.width / 2), int(H - hb - pil.height / 2)))
                if ('fin',) not in vu: vu.add(('fin',)); ev.append((t, 'fin', 0))
        enc.stdin.write(out.convert('RGB').tobytes())
        if i % 90 == 0: print(f'{t:.1f}/{DUREE:.1f}', flush=True)
    enc.stdin.close(); enc.wait()
    json.dump(dict(duree=DUREE, segs=SEGS, offs=OFF, fin_voix=FIN_VOIX, ecrans=ECRANS, ev=ev), open(f'{ICI}/evenements.json', 'w'), indent=1)


if __name__ == '__main__':
    main()
