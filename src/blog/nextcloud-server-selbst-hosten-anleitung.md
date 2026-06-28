---
title: "Nextcloud selbst hosten: Komplettes Setup für deine private Cloud"
date: "2026-06-28"
description: "Nextcloud auf einem 5€ VPS oder Raspberry Pi aufsetzen — mit collabora Office, Fail2Ban, automatischen Backups und verschlüsselter Synchronisation. Die echte Alternative zu Dropbox, Google Drive und iCloud."
tags: ["Nextcloud", "Self-Hosting", "Cloud", "Docker", "Datenschutz"]
slug: "nextcloud-server-selbst-hosten"
emoji: "☁️"
---

## Komplettes Setup für deine private Cloud


![Nextcloud Banner](/banner-nextcloud.webp)

Google Drive is praktisch. Dropbox auch. Aber was wenn du nicht mehr möchtest, dass deine Dateien auf amerikanischen Servern liegen? Die Antwort: **Nextcloud**. Eine Open-Source-Cloud, die du auf deinem eigenen Server betreibst — mit Büro-Anwendungen, Kalender, Kontakten und vieles mehr.

## Was ist Nextcloud?

Nextcloud ist eine selbst gehostete Plattform für die Zusammenarbeit. Ursprünglich als Fork von ownCloud gestartet, hat es sich zur **beliebteste Self-Hosting-Lösung** weltweit entwickelt:

- **Datei-Synchronisation** — wie Dropbox/Google Drive
- **Collabora OnlyOffice** — Office-Dokumente im Browser
- **Kalender & Kontakte** — CalDAV/CardDAV kompatibel
- **Talk** — Video-Chats und Kollaboration
- **Apps** — 200+ Erweiterungen im Store

## Hardware-Was du brauchst

| Setup | Empfehlung | Kosten (Einrichtung) |
|-------|-----------|---|---|
| Raspberry Pi 4 | 4 GB + externe SSD | ~50€ |
| Mini PC (z.B. Beelink) | 8 GB RAM + SSD | ~150€ |
| VPS (z.B. Hetzner) | 2 vCPU + 4 GB RAM | ~4€/Monat |
| TrueNAS | Bestehendes NAS + Container | Kostenlos |

## Docker Compose Setup

Die einfachste Installation nutzt Docker Compose:

```yaml
version: '3.8'

services:
  nextcloud:
    image: nextcloud:stable
    container_name: nextcloud
    ports:
      - "8080:80"
    volumes:
      - nextcloud_data:/var/www/html
      - nextcloud_config:/var/www/html/config
      - nextcloud_apps:/var/www/html/custom_apps
      - uploads:/var/www/html/data
    environment:
      - MYSQL_HOST=db
      - MYSQL_DATABASE=nextcloud
      - MYSQL_USER=nextcloud
      - MYSQL_PASSWORD=your_password
      - OVERWRITEHOST=your-domain.com
      - OVERWRITEPROTOCOL=https
    depends_on:
      - db
      - redis
    restart: always

  db:
    image: mariadb:10.11
    container_name: nextcloud_db
    environment:
      - MYSQL_ROOT_PASSWORD=root_password
      - MYSQL_DATABASE=nextcloud
      - MYSQL_USER= - MYSQL_PASSWORD=your_password
    volumes:
      - db_data:/var/lib/mysql
    restart: always

  redis:
    image: redis:7-alpine
    container_name: nextcloud_redis
    restart: always
```

Einrichten mit `docker compose up -d` und aufrufen unter `http://server:8080`.

## Der richtige Betrieb: SSL, Domains & Security

Für den produktiven Betrieb brauchst du zwingend:

1. **HTTPS** — via Nginx Proxy Manager oder Traefik mit Let's Encrypt
2. **Fail2Ban** — Schutz vor Brute-Force (Nextcloud hat eigenes Login-Schutz integriert)
3. **Cron-Jobs** — für Hintergrund-Tasks (relevant für große Installationen)
4. **Sicherung** — Datenbank + Data-Ordner + Konfiguration

Nginx-Proxy Beispiele:

```nginx
server {
    listen 443 ssl http2;
    server_name cloud.dein-domain.de;

    ssl_certificate /etc/letsencrypt/live/dein-domain.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dein-domain.de/privkey.pem;

    client_max_body_size 4G;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Apps, die du installieren solltest

| App | Funktion |
|-----|----------|
| **Collabora** | LibreOffice im Browser (Google Docs Alternative) |
| **Calendar** | Kalender mit CalDAV-Synchronisation |
| **Contacts** | Adressbuch mit CardDAV |
| **Notes** | Notizen-App mit Markdown |
| **Tasks** | To-Do-Listen mit Kalender-Sync |
| **Memories** | Zeitleiste-Ansicht für Fotos (ähnlich Google Photos) |
| **Two-factor** | 2FA für mehr Sicherheit |
| **OnlyOffice** | Alternative zu Collabora (schneller bei großen Dokumenten) |

## Nextcloud vs. Google Drive vs. Dropbox

| Feature | Google Drive | Dropbox | Nextcloud |
|---------|-------------|---------|-----------|
| Preis (1 TB) | 5,99€/Monat | 11,99€/Monat | Kostenlos (Hardware) |
| Datenschutz | Google-Server | Dropbox-Server | Dein Server |
| Office | Google Docs | Paper | Collabora/OnlyOffice |
| Apps | Google Workspace | Begrenzt | 200+ Erweiterungen |
| API | Eingeschränkt | Gut | Vollständig |

## Fazit

Nextcloud ist die **beste Alternative zu Google Drive und Dropbox**, wenn du Wert auf Datenschutz und Kontrolle legst. Die Einrichtung ist einfach, die Erweiterungsmöglichkeiten riesig, und die laufenden Kosten minimal.

> **Tipp:** Nutze Nextcloud mit einem Raspberry Pi 4 und einer externen SSD als günstige Starter-Lösung (~60€ einmalig).
