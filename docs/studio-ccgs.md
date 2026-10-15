# Studio d'agents CCGS

Le dossier `.claude/` contient le kit **Claude Code Game Studios** (licence MIT, voir `.claude/CCGS-LICENSE`). Il est adapté au jeu.

- **Agents** : 34 rôles se trouvent dans `.claude/agents/`. Ce sont notamment game-designer, level-designer, economy-designer, ux-designer, art-director, technical-artist, qa-lead, performance-analyst et accessibility-specialist. Les spécialistes Godot, Unity et Unreal ont été retirés, car le jeu est en HTML5 Canvas et Capacitor.
- **Skills** : 74 commandes se trouvent dans `.claude/skills/`. Exemples utiles : `/balance-check`, `/playtest-report`, `/perf-profile`, `/ux-review`, `/smoke-check`, `/release-checklist`, `/launch-checklist`, `/patch-notes`.
- **Configuration** : `project.yaml`. Le moteur est déclaré en `html5-canvas`, la cible en `android`, avec un objectif de 60 i/s.
- Les hooks bloquants de CCGS (validation de commit et de push) **ne sont pas branchés**, car `settings.json` n'a pas été copié. Les scripts restent disponibles pour les skills qui en ont besoin.

Les comptes rendus d'audit des agents sont consignés dans `docs/revue-gameplay.md`.
