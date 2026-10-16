"""Bande son du remontage « pro » (règles §2bis du skill montage-pro).

- Hook SEC : la phrase d'accroche de Claude sans musique, un riser de 1 s mène à la 1re coupe,
  la musique démarre là (ouverture « tuto/podcast »).
- Musique 17 dB sous la voix (mesuré puis ajusté), deux textures : caméra (groove) / Claude (plus aéré).
- Ponctuation : musique COUPÉE pendant l'aveu « je ne peux pas entendre le son ».
- Bruitages sur des actions visibles seulement : whoosh aux changements caméra ↔ Claude et une carte sur
  deux, pop doux à l'apparition des mots, impact sur les titres derrière et les mots-chocs, touches
  quand le code s'écrit. Rien sur les coupes multicam (punch-ins invisibles).
Usage : V=_court python3 podcast/son_pro.py  → podcast/son_pro{V}.wav
"""
import json, os, sys
import numpy as np
ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, f'{os.path.dirname(ICI)}/outils')
from bruitages import *          # SR, lire, ecrire, whoosh, riser, impact, pop, tic, touche, kick, …

V = os.environ.get('V', '')
TL = json.load(open(f'{ICI}/timeline{V}.json'))
EV = json.load(open(f'{ICI}/evenements_pro{V}.json'))
DUREE = EV['duree']; N = int(SR * (DUREE + 0.3))
os.chdir(ICI)

# ---------- voix (même traitement que son.py), sur l'ancienne timeline puis coupe « depuis Douala »
N0 = int(SR * (TL['duree'] + 0.6)); VOIX = np.zeros(N0)
lui = lire('source.wav', 'highpass=f=90,afftdn=nf=-28,equalizer=f=3200:t=q:w=1.2:g=3,acompressor=threshold=-22dB:ratio=3:attack=8:release=120:makeup=4dB')
def rms_parole(x): a = np.abs(x); return np.sqrt((x[a > np.percentile(a, 60)] ** 2).mean())
Fd = int(.008 * SR)
for s in TL['segs']:
    if s['type'] == 'lui':
        for c in s['clips']:
            a, b = c['src']; m = lui[int(a * SR):int(b * SR)].copy(); m[:Fd] *= np.linspace(0, 1, Fd); m[-Fd:] *= np.linspace(1, 0, Fd)
            i = int(c['t0'] * SR); VOIX[i:i + len(m)] += m[:N0 - i]
r_lui = rms_parole(VOIX[VOIX != 0]); CL = np.zeros(N0)
for s in TL['segs']:
    if s['type'] == 'claude':
        v = lire(s['voix'], 'highpass=f=70,acompressor=threshold=-20dB:ratio=2.5:attack=6:release=100:makeup=2dB')
        i = int(s['tv'] * SR); CL[i:i + len(v)] += v[:N0 - i]
CL *= r_lui / rms_parole(CL[CL != 0]); VOIX += CL
for a, b in sorted(EV['coupes'], reverse=True):
    i, j = int(a * SR), int(b * SR); f = int(.012 * SR)
    VOIX[i - f:i] *= np.linspace(1, 0, f); VOIX[j:j + f] *= np.linspace(0, 1, f)
    VOIX = np.concatenate([VOIX[:i], VOIX[j:]])
VOIX = np.pad(VOIX, (0, max(0, N - len(VOIX))))[:N]

# ---------- musique
MUS_L = np.zeros(N); MUS_R = np.zeros(N); BR_L = np.zeros(N); BR_R = np.zeros(N)
def add(bl, br, sig, t, pan=0.0, g=1.0):
    i = int(t * SR)
    if i < 0 or i >= N: return
    s = sig[:N - i] * g; bl[i:i + len(s)] += s * min(1, 1 - pan); br[i:i + len(s)] += s * min(1, 1 + pan)
mus = lambda sig, t, pan=0, g=1: add(MUS_L, MUS_R, sig, t, pan, g)
bru = lambda sig, t, pan=0, g=1: add(BR_L, BR_R, sig, t, pan, g)
SEGS = EV['segs']; HOOK = SEGS[0]['t1']
type_a = lambda t: next((s for s in SEGS if t < s['t1']), SEGS[-1])
NOIRE = .6; ACC = [55.0, 43.65, 65.41, 49.0]
ARP = {55.0: [220, 261.6, 329.6, 440], 43.65: [174.6, 220, 261.6, 349.2], 65.41: [261.6, 329.6, 392, 523.3], 49.0: [196, 246.9, 293.7, 392]}
t = HOOK; mes = 0
while t < DUREE - .3:
    f = ACC[mes % 4]; s = type_a(t + .01); cla = s['type'] == 'claude'
    mus(pad(f * 4, 4 * NOIRE + .4), t, 0, 1.0 if cla else .5)
    for b in range(4):
        tb = t + b * NOIRE
        if tb >= DUREE - .2: break
        if cla:   # texture Claude : aérée
            if b in (0, 2): mus(kick(.45), tb)
            mus(basse(f, NOIRE * .8, .45), tb)
            mus(pluck(ARP[f][(b * 2) % 4] * 2, .3, .55), tb + NOIRE / 2, (-.35, .35)[b % 2])
        else:     # texture caméra : groove
            if b in (0, 2): mus(kick(.9), tb)
            if b in (1, 3): mus(clap(.7), tb, .06)
            mus(hat(.45), tb + NOIRE / 2, .2)
            mus(basse(f, NOIRE * .45), tb); mus(pluck(ARP[f][b % 4], .3, .5), tb + NOIRE / 2, .35)
    t += 4 * NOIRE; mes += 1

# ---------- bruitages (actions visibles seulement)
n_carte = 0
for t, kind, x in EV['ev']:
    if kind == 'carte':
        s = type_a(t + .01)
        if abs(t - s['t0']) < .05 and t > .1:          # changement caméra ↔ Claude
            bru(whoosh(.34, True, .8), t - .22, (.3, -.3)[n_carte % 2])
        elif n_carte % 2 == 1:                          # une carte sur deux
            bru(whoosh(.26, False, .35), t - .16, (-.25, .25)[n_carte % 2])
        n_carte += 1
    elif kind == 'coupe_cam':
        s = type_a(t + .01)
        if abs(t - s['t0']) < .05 and t > .1: bru(whoosh(.34, False, .8), t - .22, -.3)
    elif kind == 'mot':  bru(pop(560 + 80 * (int(t * 7) % 4), .28, .1), t, (.15, -.15)[int(t * 3) % 2])
    elif kind == 'titre': bru(impact(.75), t + .05)
    elif kind == 'impact': bru(impact(.6), t)
    elif kind == 'logo': bru(pop(900, .6), t); bru(tic(.4), t + .02)
    elif kind == 'frappe':
        for c in np.arange(0, x - .1, .085): bru(touche(.16), t + c, .3)
    elif kind == 'cta':
        bru(pop(760, .6), t + .05)
        for c in np.arange(.3, 1.4, .07): bru(touche(.18), t + c, .2)
mus(riser(1.0, .8), HOOK - 1.0, 0, 1.0)           # le hook sec monte vers la 1re coupe
bru(impact(.5), HOOK)

# ---------- ponctuation : musique coupée pendant l'aveu
gate = np.ones(N)
for t, kind, x in EV['ev']:
    if kind == 'silence':
        i, j = int((t + .3) * SR), int((t + x) * SR); f = int(.05 * SR)
        gate[i:j] = 0; gate[i - f:i] = np.linspace(1, 0, f); gate[j:j + f] = np.minimum(gate[j:j + f], np.linspace(0, 1, f))
# ---------- mixage : ducking puis musique calée à 17 dB sous la voix
blk = int(SR * .01); nb = N // blk + 1
e = np.sqrt((np.pad(VOIX, (0, nb * blk - N)) ** 2).reshape(nb, blk).mean(1)); e = e / (np.percentile(e, 95) + 1e-9)
sm = np.zeros(nb); p = 0
for i, v in enumerate(e): p = v if v > p else p * .93 + v * .07; sm[i] = p
duck = 1 - .55 * np.clip(sm * 1.8, 0, 1); duck = np.interp(np.arange(N) / blk, np.arange(nb), duck) * gate
db = lambda x: 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12)
parle = np.repeat(sm > .3, blk)[:N]
mm = (MUS_L + MUS_R) / 2 * duck
G_MUS = 10 ** ((db(VOIX[parle]) - 17 - db(mm[parle])) / 20)
G_BRU = 10 ** ((db(VOIX[parle]) - 14 - db(((BR_L + BR_R) / 2)[np.abs(BR_L) > 1e-4])) / 20)
L = VOIX + MUS_L * G_MUS * duck + BR_L * G_BRU; R = VOIX + MUS_R * G_MUS * duck + BR_R * G_BRU
pk = max(np.abs(L).max(), np.abs(R).max()); L /= pk / .89; R /= pk / .89
ecrire(f'son_pro{V}.wav', L, R)
print(f'musique sous la voix : {db(VOIX[parle]) - db(mm[parle] * G_MUS):.1f} dB | bruitages : {len(EV["ev"])} événements')
