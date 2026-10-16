"""Bande son d'une vidéo Shadow Strike : musique + voix off (optionnelle) + bruitages calés sur sons.json.

Usage : python3 video/son.py <sons.json> <musique.wav> <debut_musique_s> <sortie.wav>
          [--voix voix.mp3 --voix-a 0.15] [--fondu-fin 0.6]
sons.json vient de video/rendu.mjs (la page liste ses bruitages avec sfx(type, t)).
Règles du kit montage-pro : musique 12-17 dB sous la voix (baisse automatique sous la voix),
un bruitage seulement sur une action visible, coupure nette de la musique sur 'coupe'
jusqu'au 'impact' suivant (ponctuation), -14 LUFS appliqué ensuite par ffmpeg (finir.sh).
"""
import sys, json, numpy as np, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'outils'))
from bruitages import SR, lire, ecrire, t_, hp, lp, whoosh, riser, impact, pop, touche, tic, glitch, carillon, rng

a = sys.argv
cues, musique, debut, sortie = json.load(open(a[1])), a[2], float(a[3]), a[4]
opt = lambda k, d=None: a[a.index(k) + 1] if k in a else d
voix, voix_a, fondu = opt('--voix'), float(opt('--voix-a', 0)), float(opt('--fondu-fin', .6))
N = int(cues['duree'] * SR)
db = lambda x: 10 ** (x / 20)
def rms(x): return np.sqrt(np.mean(x ** 2) + 1e-12)
def poser(piste, son, t, g=1.0):
    i = int(t * SR)
    if i >= len(piste): return
    if i < 0: son, i = son[-i:], 0
    n = min(len(son), len(piste) - i); piste[i:i + n] += son[:n] * g

# ---- bruitages propres au jeu ----
def alerte(g=1.0):  # deux bips qui montent : le garde a vu quelque chose
    s = np.zeros(int(.34 * SR))
    for k, f in enumerate((880, 1320)):
        t = t_(.13); b = np.sign(np.sin(2 * np.pi * f * t)) * .5 + np.sin(2 * np.pi * f * t) * .5
        poser(s, b * np.exp(-t * 12) * .32, k * .15)
    return lp(s, 5000) * g
def tir(g=1.0):  # coup de feu sec + grave
    t = t_(.35); n = rng.standard_normal(len(t))
    return (hp(n, 700) * np.exp(-t * 38) * .8 + np.sin(2 * np.pi * 70 * t) * np.exp(-t * 22) * .7) * g * .6
def lame(g=1.0):  # coup de couteau : souffle qui descend + petit tintement
    d = .22; t = t_(d); n = rng.standard_normal(len(t))
    souffle = hp(n, 1800) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2 * .5
    tint = np.sin(2 * np.pi * 3400 * t) * np.exp(-t * 30) * .18
    return (souffle + tint) * g
SONS = {'tap': lambda g: touche(g * .9), 'alerte': alerte, 'tir': tir, 'lame': lame, 'riser': lambda g: riser(1.3, g),
        'impact': impact, 'glitch': glitch, 'pop': lambda g: pop(700, g), 'carillon': carillon,
        'whoosh': lambda g: whoosh(.4, True, g), 'tic': tic}
AVANCE = {'whoosh': .3, 'riser': 0}  # un whoosh finit sur la coupe, il ne la suit pas

bruit = np.zeros(N)
for c in cues['sons']:
    if c['type'] in SONS:
        poser(bruit, SONS[c['type']](c['gain']), c['t'] - AVANCE.get(c['type'], 0))
bruit *= db(-20) / max(1e-9, np.max(np.abs(bruit))) * 4  # crêtes autour de -8 dBFS

# ---- voix ----
v = np.zeros(N)
if voix:
    x = lire(voix); x = x / rms(x[np.abs(x) > .02]) * db(-19)
    poser(v, x, voix_a)

# ---- musique : niveau, baisse sous la voix, coupures ----
m = lire(musique)[int(debut * SR):]
m = np.concatenate([m, np.zeros(max(0, N - len(m)))])[:N]
fort = m[np.abs(m) > np.percentile(np.abs(m), 60)]
m = m / rms(fort) * db(-23 if voix else -17)
env = np.convolve(np.abs(v), np.ones(int(.08 * SR)) / int(.08 * SR), 'same') > db(-38)
env = np.convolve(env.astype(float), np.ones(int(.25 * SR)) / int(.25 * SR), 'same')  # baisse douce
gain = 1 - env * (1 - db(-9))  # -9 dB sous la voix : ~15 dB d'écart voix / musique
impacts = sorted(c['t'] for c in cues['sons'] if c['type'] == 'impact')
for c in cues['sons']:
    if c['type'] == 'coupe':
        fin = next((t for t in impacts if t > c['t']), c['t'] + 1.5)
        i0, i1 = int(c['t'] * SR), int(fin * SR)
        gain[i0:i1] = 0; gain[i0 - 200:i0] *= np.linspace(1, 0, 200)
gain[-int(fondu * SR):] *= np.linspace(1, 0, int(fondu * SR)) if fondu > 0 else 1
m *= gain

mix = v + m + bruit
L = mix + np.roll(bruit, 220) * .15; R = mix - np.roll(bruit, 220) * .15  # un peu d'espace sur les bruitages
ecrire(sortie, L, R)
print(sortie, f"{N / SR:.1f} s", '| voix' if voix else '', f"| {len(cues['sons'])} bruitages")
