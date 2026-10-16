# Montrer, pas illustrer : captures, logos, preuves

## Captures d'écran
- Vraies captures (Google, CapCut, GitHub, sites, pages de tarifs) avec **curseur visible**.
- **Cercle loupe** blanc 2 px sur le réglage dont on parle ; valeur qui change (100 % → 85 %).
- Zoom progressif (scale 1 → 1,3).
- Capture posée dans un cadre de téléphone/tablette sur fond clair.
- Clic / interrupteur qui bascule + bruitage « touche » à chaque clic.
- Capture d'un site en mobile : Playwright (`waitUntil: domcontentloaded`, 8 s d'attente,
  `--ignore-certificate-errors` derrière un proxy).
- **Démo animée d'un site** : `page.screenshot` en boucle + horodatage, puis accélérer les temps morts
  (×4 attente, ×2 frappe, ×1 réponse).

## Logos : outil cité = son VRAI logo
Jamais une forme inventée ni une icône générique. `python3 04-outils/python/logo.py "Nom" [domaine.com]`
(Wikimedia → Simple Icons → favicon, cache dans `05-ressources/logos/`). **Regarder le PNG** avant
(Instagram renvoyait d'abord un logo Instagram+Threads).

Deux usages :
- **Mention rapide** : petit logo (~120–160 px) qui **pop** (0,18 s) à côté ou ~120 px sous le sous-titre
  pendant 1–1,5 s, ou collé au mot dans le titre.
- **L'outil est le sujet** : grande carte (fond blanc ou couleur de la marque, coins arrondis) avec le logo
  complet dans le tiers haut, puis captures.
- Pas de logo si le mot géant à l'écran est déjà le nom de l'outil (doublon).
- Pas de logo propre ? Recadrer depuis le visuel officiel (og-image, capture officielle) ; recolorer
  l'icône SVG du site en blanc sur pastille de la couleur de marque (`theme-color` du site).

## Preuves
- Étude datée + revue + photo du chercheur avec étiquette nom (Faro). Sources dans la légende.
- Capture des messages clients sur un téléphone, fond couleur de marque, phrase clé en gros (Wu).
- **Jamais de preuve fabriquée.** Pas de chiffres, témoignages ou « études de cas » non confirmés.
