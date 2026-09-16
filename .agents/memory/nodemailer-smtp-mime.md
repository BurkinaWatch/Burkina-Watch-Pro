---
name: Nodemailer SMTP MIME tests
description: Durable expectations for asserting Nodemailer messages captured by a local SMTP server.
---

Les messages Nodemailer capturés au niveau SMTP doivent être analysés comme du MIME, pas comparés comme du texte brut : les corps UTF-8 peuvent être quoted-printable et les noms de fichiers simples peuvent être émis sans guillemets.

**Why:** Une assertion directe sur les accents ou `filename="..."` produit de faux échecs alors que le message est conforme et que la pièce jointe est intacte.

**How to apply:** Décoder le transfer encoding avant d’asserter le HTML, accepter les formes MIME valides avec ou sans guillemets, puis comparer exactement le contenu décodé des pièces jointes.