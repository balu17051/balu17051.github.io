---
title: "Passkeys selbst hosten: WebAuthn und Authelia für deine Dienste"
date: "2026-06-28"
description: "Passkeys sicher ausrollen — mit Authelia als Identity Provider und WebAuthn-Support. Wann Passkeys besser sind als traditionelle Passwörter, wie man sie selbst hostet und welche Fallstricke es gibt."
tags: ["Passkeys", "WebAuthn", "Authelia", "Sicherheit", "Self-Hosting"]
slug: "passkeys-selbst-hosten-webauthn"
emoji: "🔐"
---

## WebAuthn und Authelia für deine Dienste


![Passkeys Banner](/banner-passkeys.webp)

Passwörter sind tot. Das zumindest behaupten die Tech-Giganten. Und tatsächlich: **Passkeys** sind sicherer, schneller und komfortabler als jedes Passwort. Aber können sie auch selbst gehostet werden? Ja — und hier zeige ich dir wie.

## Was sind Passkeys?

Passkeys basieren auf **WebAuthn** (Web Authentication), einem W3C-Standard. Statt eines Passwörters nutzt man asymmetrische Kryptographie:

- Ein **privater Schlüssel** bleibt auf dem Gerät (Smartphone, Laptop, YubiKey)
- Ein **öffentlicher Schlüssel** wird beim Dienst registriert
- Bei der Anmeldung sendet der Dienst eine Challenge — das Gerät signiert sie mit dem privaten Schlüssel
- **Kein Passwort** wird jemals übertragen

Das Ergebnis: Kein Phishing möglich, kein Credential-Stuffing, kein Passwort-Diebstahl.

## Warum selbst hosten?

Die großen Anbieter (Apple, Google, Microsoft) bieten Passkeys an — aber oft nur innerhalb ihres eigenen Ökosystems. Wenn du eigene Dienste betreibst (Nextcloud, Wiki, WebApps), brauchst du einen **eigenen Identity Provider (IdP)** mit WebAuthn-Support.

## Authelia: Dein IdP

Authelia ist ein Open-Source-Identity-Provider, der:

- **Single Sign-On (SSO)** für alle Dienste bietet
- **WebAuthn** als 2FA-Methode unterstützt
- **Access Control** für rollenbasierte Berechtigungen hat
- **Docker-native** ist

## Docker Compose Setup

```yaml
version: '3.8'

services:
  authelia:
    image: authelia/authelia:latest
    container_name: authelia
    ports:
      - "9091:9091"
    volumes:
      - ./configuration.yml:/config/configuration.yml
      - ./users_database.yml:/config/users_database.yml
      - ./data:/data
    environment:
      - TZ=Europe/Berlin
      - AUTHELIA_JWT_SECRET=your_random_jwt_secret
      - AUTHELIA_SESSION_SECRET=your_session_secret
      - AUTHELIA_STORAGE_LOCAL_PATH=/data/db.sqlite3
    restart: always

  # Reverse Proxy (z.B. Nginx Proxy Manager) für SSO-Integration
  npm:
    image: jc21/nginx-proxy-manager:latest
    container_name: npm
    ports:
      - "80:80"
      - "443:443"
      - "81:81"  # Admin-UI
    volumes:
      - npm_data:/data
      - letsencrypt:/etc/letsencrypt
    restart: always
```

## Authelia Konfiguration

`configuration.yml`:

```yaml
host: 0.0.0.0
port: 9091
log_level: debug
default_redirection_url: https://auth.dein-domain.de

jwt_secret: your_random_jwt_secret

authentication_backend:
  file:
    path: /config/users_database.yml

access_control:
  default_policy: deny
  rules:
    - domain: "*.dein-domain.de"
      policy: two_factor
      subject: "group:users"

session:
  name: authelia_session
  secret: your_session_secret
  expiration: 1h
  inactivity: 5m
  domain: dein-domain.de

regulation:
  max_retries: 3
  find_time: 2m
  ban_time: 5m

storage:
  local:
    path: /data/db.sqlite3

notifier:
  filesystem:
    filename: /data/notifications.txt
```

`users_database.yml`:

```yaml
users:
  andreas:
    displayname: "Andreas"
    password: "$argon2id$v=19$m=65536,t=3,p=4$..."  # argon2id hash
    email: andreas@dein-domain.de
    groups:
      - users
      - admin
```

## Passkey-Registrierung

1. **Authelia-Web-UI** öffnen (`https://auth.dein-domain.de`)
2. **Second Factor** → **WebAuthn** → **Register**
3. **Gerät registrieren** — YubiKey, TouchID, Windows Hello oder Android
4. **Fertig** — ab jetzt ist Passkey-Login möglich

## WebAuthn-Sicherheitseinstellungen

| Einstellung | Empfehlung | Erklärung |
|-------------|-----------|-----------|
| Attestation | indirect | Datenschutz-freundlich |
| User Verification | preferred | Biometrie/PIN bevorzugen |
| Resident Key | required | Passkey auf Gerät gespeichert |
| Resident Key Requirement | required | Kein Fallback auf Passwort |

## Integration mit anderen Diensten

Authelia als SSO-IdP funktioniert mit:
- **Nextcloud** — via OIDC oder LDAP
- **Grafana** — via OAuth2
- **Jellyfin** — via Header-Auth
- **Portainer** — via OAuth2
- **Alle anderen** — via Reverse Proxy (Nginx, Traefik, Caddy)

## Passkeys vs. Passwörter

| Aspekt | Passwort | Passkey |
|--------|----------|---------|
| Phishing-Schutz | ❌ | ✅ |
| Brute-Force-Schutz | ❌ (schwache PWs) | ✅ |
| Benutzerfreundlichkeit | ❌ (merken) | ✅ (TouchID) |
| Wiederherstellbarkeit | ✅ (Reset) | ⚠️ (Device-bound) |
| Cross-Platform | ✅ | ⚠️ (Ökosystem) |

## Fazit

Passkeys selbst hosten ist **einfacher als gedacht**. Authelia + WebAuthn bietet eine vollständige SSO-Lösung mit modernster Sicherheit. Der einzige Nachteil: Wenn du dein Gerät verlierst, brauchst du einen Backup-Code.

> **Tipp:** Nutze mindestens 2 Passkeys (z.B. YubiKey + Smartphone) und speichere Backup-Codes sicher offline.
