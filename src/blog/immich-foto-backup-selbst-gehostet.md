---
title: "Immich: Dein Google Photos-Ersatz auf eigenem Server"
date: "2026-06-28"
description: "Immich selbst hosten und endlich Google Photos verlassen — mit Docker, Face-Erkennung, automatischer Sicherung und mobilem Backup. Schritt-für-Schritt-Anleitung inkl. Speicherplatz-Optimierung."
tags: ["Immich", "Foto-Backup", "Docker", "Self-Hosting", "Google Photos"]
slug: "immich-foto-backup-selbst-gehostet"
emoji: "📸"
---

## Dein Google Photos-Ersatz auf eigenem Server


![Immich Banner](/banner-immich.webp)

Immich ist eine **Open-Source-Fotomanagement-Plattform**, die wie Google Photos läuft — aber auf deinem eigenen Server. Keine Gebühren, keine KI-Analyse ohne Zustimmung, und deine Fotos bleiben wo sie hingehören: bei dir.

## Warum Google Photos verlassen?

Google scannt deine Fotos mit KI zur Gesichtserkennung, nutzt sie zur Datenanalyse und droht regelmäßig mit Löschungen. Und 15 GB reichen schnell nicht mehr. Ein eigenes NAS mit Immich bietet:

- **Unbegrenzter Speicherplatz** (beschränkt nur durch deine Festplatten)
- **Face-Erkennung** (drei Modelle: Voraus, Dlib, MediaPipe)
- **Metadaten-basierte Kartenansicht** (Wo wurde das Foto gemacht?)
- **Geteilte Alben** und Galerien für Familie & Freunde
- **Mobile automatische Sicherung** (App für Android & iOS)

## Was du brauchst

| Komponente | Empfehlung |
|-----------|-----------|
| Hardware | Raspberry Pi 4, NAS oder kleiner VPS |
| CPU | ARM64 oder x86_64 mit min. 2 Kernen |
| RAM | 4 GB minimum, 8 GB empfohlen |
| Speicher | Abhängig von der Fotoanzahl |
| Software | Docker + Docker Compose |

## Der Aufbau: 5 Container, ein Befehl

Immich nutzt eine Mikroservices-Architektur. Die wichtigsten Komponenten:

1. **immich-server** — Haupt-API und Web-UI
2. **immich-machine-learning** — Gesichtserkennung & Sucherkennung
3. **immich-database** — PostgreSQL mit pgvector
4. **immich-redis** — Caching und Queue-Management
5. **immich-typesense** — Volltextsuche

## Docker Compose Setup

Erstelle eine `docker-compose.yml`:

```yaml
version: '3.8'

services:
  immich-server:
    image: ghcr.io/immich-app/immich-server:release
    container_name: immich_server
    ports:
      - "2283:3001"
    volumes:
      - ./upload:/usr/src/app/upload
      - ./config:/usr/src/app/config
    environment:
      - DB_HOSTNAME=immich_database
      - DB_USERNAME=immich
      - DB_PASSWORD=your_secure_password
      - DB_DATABASE_NAME=immich
      - REDIS_HOSTNAME=immich_redis
      - TZ=Europe/Berlin
    depends_on:
      - immich-database
      - immich-redis
    restart: always

  immich-machine-learning:
    image: ghcr.io/immich-app/immich-machine-learning:release
    container_name: immich_ml
    volumes:
      - ./model-cache:/cache
    environment:
      - DB_HOSTNAME=immich_database
      - DB_USERNAME=immich
      - DB_PASSWORD=your_secure_password
      - DB_DATABASE_NAME=immich
    restart: always

  immich-database:
    image: postgres:15-alpine
    container_name: immich_db
    environment:
      - POSTGRES_USER=immich
      - POSTGRES_PASSWORD=your_secure_password
      - POSTGRES_DB=immich
    volumes:
      - ./data:/var/lib/postgresql/data
    restart: always

  immich-redis:
    image: redis:7-alpine
    container_name: immich_redis
    restart: always

  immich-typesense:
    image: typesense/typesense:0.25.2
    container_name: immich_typesense
    ports:
      - "8108:8108"
    volumes:
      - ./typesense-data:/data
    environment:
      - TYPESENSE_API_KEY=your_random_key
      - TYPESENSE_DATA_DIR=/data
    restart: always
```

Starten mit `docker compose up -d` und nach kurzer Zeit unter `http://dein-server:2283` erreichbar.

## Einrichtung & Erste Schritte

1. **Admin-Account anlegen** — beim ersten Besuch über die Web-UI (`/register`)
2. **Sicherung aktivieren** — In den Einstellungen: "Auto Backup" für den mobilen Upload
3. **Bibliothek importieren** — `/upload` Ordner einfach von außerhalb beschreiben
4. **ML-Modell auswählen** — CPU-basiert reicht für Gesichtserkennung

## Performance-Tipps

- **Raspberry Pi**: Nutze Caching auf SSD und deaktiviere Machine Learning wenn nötig
- **x86_64 Systeme**: ML läuft deutlich schneller — bis zu 10x
- **Speicher sparen**: Thumbnails werden automatisch skaliert; Rohdateien bleiben unverändert

## Vorteile gegenüber Google Photos

| Feature | Google Photos | Immich |
|---------|--------------|--------|
| Preis | 100 GB = 1,99€/Monat | Kostenlos (Hardware) |
| Privatsphäre | KI-Scan | Lokale Analyse |
| Backup-Lort | Google-Server | Dein Server |
| API | Eingeschränkt | Vollständig |

## Fazit

Immich ist **Fotofreiheit zur Ehren-Sache**. Keine Abo-Kosten, keine Überwachung, keine Cloud-Zwang. Allerdings brauchst du:
- Etwas Technik-Wissen für die Einreichung
- Einen Speicherplatz für den Upload
- Einen Backup-Server für 3-2-1-Strategie

---

> **Tipp:** Kombiniere Immich mit einem WireGuard-Zugang, um sicher Fotos auch unterwegs hochzuladen.
