# Phase 9 — Architecture

## Synthèse

L’architecture sépare strictement le plan de contrôle et le plan média :

```text
Caméra IP privée → Camera Agent → MediaMTX → WHEP/WebRTC → navigateur
                                      ↑
                         contrôle Express sans frames vidéo
```

Express gère l’identité, l’ownership, l’enrôlement, les bindings, les
sessions média et les grants viewer. MediaMTX reçoit et sert le média. Le
frontend ne reçoit ni URL RTSP complète, ni mot de passe caméra, ni secret
MediaMTX.

## États

Les états de caméra, agent, stream et viewer sont distincts. Le viewer
possède des états `idle`, `connecting`, `live`, `reconnecting`, `offline` et
`error`. La distinction UI dédiée `access_denied` reste à finaliser.

## Limites

Les maps de grants viewer et de paths sont mono-instance. Une exploitation
multi-instance exige un état partagé et une observabilité commune. La preuve
réseau réelle et la preuve navigateur réelle sont encore manquantes.