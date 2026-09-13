---
name: État des tests Bash du garde-fou Railway
description: Préserver les compteurs et rapports d'une simulation d'opération Railway multi-étapes
---

Dans les tests Bash d'opérations longues, les fonctions qui incrémentent un compteur
ou mettent à jour un rapport de garde doivent être appelées dans le shell courant.
Les substitutions de commande (`$(...)`) exécutent la fonction dans un sous-shell et
masquent ces changements d'état au test appelant.

**Why:** La vérification d'une relecture avant chaque mutation dépend de l'état
observé entre les étapes; un compteur perdu peut faire croire que le garde-fou
fonctionne sans prouver que la cible a été relue.

**How to apply:** Faire retourner le statut via `if ...; then ... else ... fi`,
stocker le rapport dans une variable d'état, et capturer uniquement la sortie
finale via un fichier si l'appel doit rester dans le shell courant.