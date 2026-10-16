"""Bruitages et instruments synthétisés (extraits de podcast/son.py) : whoosh, riser, impact, pop, tic,
touche, glitch, carillon, kick, basse, pluck, pad… Tous renvoient un tableau numpy mono à 44,1 kHz."""
import numpy as np, wave, subprocess
SR=44100; rng=np.random.default_rng(7)
def lire(p,filtre=None):
    a=['ffmpeg','-v','error','-i',p]+(['-af',filtre] if filtre else [])+['-ac','1','-ar',str(SR),'-f','s16le','-']
    return np.frombuffer(subprocess.run(a,capture_output=True,check=True).stdout,'<i2').astype(np.float64)/32768
def ecrire(p,L,R):
    x=(np.stack([L,R],1).clip(-1,1)*32767).astype('<i2')
    with wave.open(p,'wb') as w: w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes(x.tobytes())
t_=lambda d: np.arange(int(d*SR))/SR
def lp(x,fc,n=1):
    a=np.exp(-2*np.pi*fc/SR)
    for _ in range(n):
        y=np.empty_like(x); p=0.0
        for i,v in enumerate(x): p=(1-a)*v+a*p; y[i]=p
        x=y
    return x
def hp(x,fc): return x-lp(x,fc)
def kick(g=1.0):
    t=t_(.42); f=48+120*np.exp(-t*30)
    return (np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*8.5)+rng.standard_normal(len(t))*np.exp(-t*160)*.25)*g
def hat(g=1.0,d=.055):
    n=np.diff(rng.standard_normal(int(d*SR)),prepend=0)
    return hp(n,6000)*np.exp(-t_(d)*78)*g*.5
def clap(g=1.0):
    d=.26; t=t_(d); n=np.diff(rng.standard_normal(int(d*SR)),prepend=0)
    e=sum(np.exp(-np.maximum(t-o,0)*55)*(t>=o) for o in (0,.013,.026))*np.exp(-t*12)
    return hp(n,1200)*e*g*.4
def basse(f,d,g=1.0):
    t=t_(d); s=np.sin(2*np.pi*f*t)+.35*np.sin(4*np.pi*f*t)+.12*np.sin(6*np.pi*f*t)
    e=np.minimum(t/.008,1)*np.exp(-t*(2.2/max(d,.05)))
    return np.tanh(s*1.4)*e*g*.42
def pluck(f,d=.34,g=1.0):
    t=t_(d); s=sum(np.sin(2*np.pi*f*k*t)/k for k in (1,2,3,4,5))
    return s*np.exp(-t*8.5)*g*.14
def pad(f,d,g=1.0):
    t=t_(d); s=sum(np.sin(2*np.pi*f*r*t+p) for r,p in ((1,0),(1.5,1.1),(2,2.3),(3,.7)))
    e=np.minimum(t/.5,1)*np.minimum((d-t)/.8,1).clip(0)
    return lp(s,1400)*e*g*.07
def whoosh(d=.5,montant=True,g=1.0):
    t=t_(d); n=rng.standard_normal(len(t))
    f=np.linspace(260,5200,len(t)) if montant else np.linspace(5200,260,len(t))
    s=hp(n,400)*.45+np.sin(2*np.pi*np.cumsum(f)/SR)*.18
    return s*(np.sin(np.pi*np.clip(t/d,0,1))**1.6)*g*.55
def impact(g=1.0):
    t=t_(.9); f=120*np.exp(-t*9)+38
    corps=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*5.5)
    air=hp(rng.standard_normal(len(t)),900)*np.exp(-t*20)*.3
    return (corps+air)*g*.85
def pop(f=640,g=1.0,d=.14):
    t=t_(d); fr=f*(1+1.7*np.exp(-t*55))
    return np.sin(2*np.pi*np.cumsum(fr)/SR)*np.exp(-t*34)*g*.5
def tic(g=1.0):
    t=t_(.05); return (np.sin(2*np.pi*2400*t)+hp(rng.standard_normal(len(t)),3000)*.6)*np.exp(-t*110)*g*.3
def touche(g=1.0):
    t=t_(.09); return (np.sin(2*np.pi*1100*t)*.6+hp(rng.standard_normal(len(t)),2500)*.5)*np.exp(-t*60)*g*.35
def carillon(f=1320,d=1.7,g=1.0):
    t=t_(d); s=sum(a*np.sin(2*np.pi*f*r*t) for a,r in ((1,1),(.55,2.76),(.33,5.4),(.2,8.9)))
    return s*np.exp(-t*3.1)*g*.17
def caisse(g=1.0):
    s=np.zeros(int(1.5*SR))
    for i,(f,o) in enumerate([(1568,0),(2093,.06),(2637,.12)]):
        c=carillon(f,1.3,1.0); k=int(o*SR); s[k:k+len(c)]+=c*(1-i*.22)
    return s*g*.9
def riser(d=1.2,g=1.0):
    t=t_(d); n=rng.standard_normal(len(t)); f=np.linspace(180,5600,len(t))
    return (np.sin(2*np.pi*np.cumsum(f)/SR)*.35+hp(n,800)*.3)*(t/d)**2.2*g*.5
def etincelle(g=1.0):
    d=.6; t=t_(d)
    return sum(np.sin(2*np.pi*f*t)*np.exp(-t*(7+i*2.5)) for i,f in enumerate((2093,2637,3136,4186)))*g*.09

def glitch(d=.2,g=1.0):
    t=t_(d); n=len(t); s=np.sign(np.sin(2*np.pi*np.repeat(rng.uniform(180,1400,int(d*40)+1),int(SR/40))[:n]*t))
    gate=(np.sin(2*np.pi*32*t)>0).astype(float)
    bruit=np.round(rng.standard_normal(n)*3)/3
    return (s*.5+bruit*.35)*gate*np.exp(-t*6)*g*.22
def allumage(d=.4,g=1.0):
    t=t_(d); f=np.geomspace(180,1500,len(t))
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.sin(np.pi*t/d)**1.5*g*.2

# ---------- pistes ----------
