---
name: Packs Git temporaires abandonnés
description: Fichiers temporaires Git volumineux pouvant rester après un checkpoint interrompu dans ce workspace Replit.
---

Après des échecs de checkpoint Replit, `.git/objects/pack` peut contenir des fichiers `tmp_pack_*` très volumineux que `git count-objects -vH` signale comme déchets. Ce sont des temporaires non indexés, pas les packs `.pack` sauvegardés.

**Why:** ces temporaires ont rempli le quota de stockage et bloqué les checkpoints, alors que les packs Git valides étaient beaucoup plus petits.

**How to apply:** avant de supprimer, vérifier qu’aucun processus Git n’est actif et que les candidats sont âgés de plus de dix minutes. Ne supprimer que les noms temporaires `tmp_pack_*` / `tmp_obj_*`; préserver les `*.pack`, `*.idx`, l’historique et les fichiers récents.
