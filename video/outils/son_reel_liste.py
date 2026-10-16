"""Bande son du reel Djoumi (type tuto outil / liste). Hook sec, riser vers ChatGPT, musique 17 dB sous la voix.
Ponctuation : la musique se COUPE sur « et ensuite le tout dernier outil » et repart sur un impact à « Djoumi ».
Bruitages : whoosh à l'entrée de chaque outil et un passage motion sur deux, pop des logos, carillon sur l'adresse.
Usage : python3 djoumi/son.py → djoumi/son.wav"""
import json, os, sys
import numpy as np
ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, f'{os.path.dirname(ICI)}/outils')
from bruitages import *
os.chdir(ICI)
EV = json.load(open('evenements.json')); DUREE = EV['duree']; N = int(SR * (DUREE + .2))
src = lire('source.wav', 'highpass=f=80,afftdn=nf=-30,equalizer=f=3000:t=q:w=1.2:g=2.5,acompressor=threshold=-22dB:ratio=3:attack=8:release=120:makeup=4dB')
VOIX = np.zeros(N); F = int(.01 * SR)
for (a, b), (o0, o1, d) in zip(EV['segs'], EV['offs']):
    m = src[int(a * SR):int(b * SR)].copy(); m[:F] *= np.linspace(0, 1, F); m[-F:] *= np.linspace(1, 0, F)
    i = int(o0 * SR); VOIX[i:i + len(m)] += m[:N - i]
ML, MR, BL, BR = (np.zeros(N) for _ in range(4))
def add(l, r, s, t, pan=0, g=1):
    i = int(t * SR)
    if 0 <= i < N: s = s[:N - i] * g; l[i:i + len(s)] += s * min(1, 1 - pan); r[i:i + len(s)] += s * min(1, 1 + pan)
mus = lambda s, t, pan=0, g=1: add(ML, MR, s, t, pan, g)
bru = lambda s, t, pan=0, g=1: add(BL, BR, s, t, pan, g)
ec = EV['ecrans']; T1 = ec[2][0]; T_PERSO = ec[4][0]; T_MARQUE = ec[5][0]; FIN = next(t for t, k, x in EV['ev'] if k == 'fin')
NOIRE = 60 / 118; ACC = [55.0, 65.41, 49.0, 43.65]
ARP = {55.0: [220, 261.6, 329.6, 440], 65.41: [261.6, 329.6, 392, 523.3], 49.0: [196, 246.9, 293.7, 392], 43.65: [174.6, 220, 261.6, 349.2]}
def boucle(t0, t1, m0=0):
    t, m = t0, m0
    while t < t1:
        f = ACC[m % 4]; mus(pad(f * 4, 4 * NOIRE + .3), t, 0, .55)
        for b in range(4):
            tb = t + b * NOIRE
            if tb >= t1: break
            if b in (0, 2): mus(kick(.9), tb)
            if b in (1, 3): mus(clap(.6), tb, .05)
            mus(hat(.4), tb + NOIRE / 2, .2); mus(basse(f, NOIRE * .5), tb)
            mus(pluck(ARP[f][(b + m) % 4], .3, .5), tb + NOIRE / 2, (-.3, .3)[b % 2])
        t += 4 * NOIRE; m += 1
boucle(T1, T_PERSO + .1); boucle(T_MARQUE, FIN + .1, 2)
mus(riser(1.0, .8), T1 - 1.12); mus(riser(.9, .6), T_MARQUE - .9)
n_mo = 0
for t, k, x in EV['ev']:
    if k == 'hook': bru(impact(.6 if x == 0 else .45), t + .03)
    elif k == 'outil': bru(whoosh(.34, True, .7), t - .40, (.3, -.3)[x]); bru(pop(900, .55), t + .08)
    elif k == 'marque': bru(impact(.9), t); bru(pop(760, .5), t + .02)
    elif k == 'motion':
        if n_mo % 2 == 0: bru(whoosh(.3, False, .6), t - .18, (-.25, .25)[(n_mo // 2) % 2])
        n_mo += 1
    elif k == 'logo': bru(pop((880, 940, 1000)[x], .5), t, (.2, 0, -.2)[x])
    elif k == 'fin': bru(pop(820, .6), t); bru(carillon(1320, 1.4, .35), t + .03)
blk = int(SR * .01); nb = N // blk + 1
e = np.sqrt((np.pad(VOIX, (0, nb * blk - N)) ** 2).reshape(nb, blk).mean(1)); e /= np.percentile(e, 95) + 1e-9
sm = np.zeros(nb); p = 0
for i, v in enumerate(e): p = v if v > p else p * .93 + v * .07; sm[i] = p
duck = np.interp(np.arange(N) / blk, np.arange(nb), 1 - .5 * np.clip(sm * 1.8, 0, 1))
tt = np.arange(N) / SR; g = np.ones(N)
g[(tt > T_PERSO + .08) & (tt < T_MARQUE - .9)] = 0                      # silence musical avant Djoumi (le riser reste)
g[tt > FIN + .4] = np.clip(1 - (tt[tt > FIN + .4] - FIN - .4) / .3, 0, 1)
duck *= g
db = lambda x: 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12)
parle = np.repeat(sm > .3, blk)[:N]; mm = (ML + MR) / 2 * duck
GM = 10 ** ((db(VOIX[parle]) - 17 - db(mm[parle])) / 20)
GB = 10 ** ((db(VOIX[parle]) - 13 - db(((BL + BR) / 2)[np.abs(BL) > 1e-4])) / 20)
L = VOIX + ML * GM * duck + BL * GB; R = VOIX + MR * GM * duck + BR * GB
pk = max(np.abs(L).max(), np.abs(R).max()); L /= pk / .89; R /= pk / .89
ecrire('son.wav', L, R)
print(f'musique sous la voix : {db(VOIX[parle]) - db(mm[parle] * GM):.1f} dB')
