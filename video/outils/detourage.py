"""Détourage vidéo image par image avec Robust Video Matting (RVM).

Sert à poser du texte DERRIÈRE la personne (effet magazine).
Testé sur la facecam du podcast (fond tissu à motifs) : RVM resnet50 > BiRefNet (trop lent, OOM)
> isnet / u2net_human_seg / mediapipe (trous, perd le corps). ~0,1 s par image en CPU.

Usage :
    python3 outils/detourage.py source.mp4 debut duree sortie_alpha.mp4 [fps]
Sortie : vidéo en niveaux de gris (blanc = personne) à la résolution source.
Le modèle est téléchargé au premier lancement dans ~/.cache/rvm/.
"""
import os, subprocess, sys, json, urllib.request
import numpy as np
import onnxruntime as ort

URL = 'https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_resnet50_fp32.onnx'
MODELE = os.path.expanduser('~/.cache/rvm/rvm_resnet50_fp32.onnx')


def taille(src):
    s = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height', '-of', 'json', src]))['streams'][0]
    return s['width'], s['height']


def alphas(src, debut, duree, fps=30):
    """Générateur : une matrice alpha float32 (H, W) par image."""
    if not os.path.exists(MODELE):
        os.makedirs(os.path.dirname(MODELE), exist_ok=True)
        urllib.request.urlretrieve(URL, MODELE)
    sess = ort.InferenceSession(MODELE, providers=['CPUExecutionProvider'])
    W, H = taille(src)
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-ss', str(debut), '-t', str(duree), '-i', src,
        '-vf', f'fps={fps}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    rec = [np.zeros([1, 1, 1, 1], np.float32)] * 4
    # 0.5 convient aux portraits ~400-800 px ; baisser (0.25) pour du 1080p+
    ds = np.array([0.5 if max(W, H) <= 1000 else 0.25], np.float32)
    while True:
        b = p.stdout.read(W * H * 3)
        if len(b) < W * H * 3:
            break
        x = np.frombuffer(b, np.uint8).reshape(H, W, 3).transpose(2, 0, 1)[None].astype(np.float32) / 255
        _, pha, *rec = sess.run([], {'src': x, 'r1i': rec[0], 'r2i': rec[1], 'r3i': rec[2],
                                     'r4i': rec[3], 'downsample_ratio': ds})
        yield pha[0, 0]


if __name__ == '__main__':
    src, debut, duree, sortie = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
    fps = int(sys.argv[5]) if len(sys.argv) > 5 else 30
    W, H = taille(src)
    out = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'gray',
        '-s', f'{W}x{H}', '-r', str(fps), '-i', '-', '-c:v', 'libx264', '-crf', '12',
        '-pix_fmt', 'yuv420p', sortie], stdin=subprocess.PIPE)
    for a in alphas(src, debut, duree, fps):
        out.stdin.write((a * 255).astype(np.uint8).tobytes())
    out.stdin.close(); out.wait()
