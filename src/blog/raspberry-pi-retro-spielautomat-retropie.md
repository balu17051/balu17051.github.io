---
title: "Retro-Spieleautomat auf dem Raspberry Pi: RetroPie + Arcade-Setups"
date: "2026-06-28"
description: "Retropie auf Raspberry Pi (3B+/4/5) installieren, konfigurieren und mit Joysticks, Buttons und einem LCD-Display ausstatten. Von ROM-Management über Save-States bis hin zu Netplay — komplette Arcade-Anleitung."
tags: ["Raspberry Pi", "Retropie", "Gaming", "Retro", "Arcade"]
slug: "raspberry-pi-retro-spielautomat"
emoji: "�️"
---

## RetroPie + Arcade-Setups


![Retropie Banner](/banner-retropie.webp)

Retro-Gaming ist zurück. Aber Statt überteuerter Mini-Konsolen bauen wir unseren eigenen Retro-Spieleautomat — mit einem **Raspberry Pi**, **RetroPie** und ein paar Euro an Hardware. Das Ergebnis ist besser als jedes kommerzielle Gerät.

## Was ist RetroPie?

Retropie ist ein **Betriebssystem für Retro-Gaming** auf Basis von Raspberry Pi OS. Es bringt:

- **EmulationStation** — schöne Frontend mit Box-Art
- **RetroArch** — Multi-Emulator mit Shaders, Netplay, Rewind
- **Unterstützung für 50+ Konsolen** — von Atari bis PS1
- **Automatische ROM-Erkennung** und Scraping
- **Hotkey-System** — ein Tasten-Kombination für Save/Load

## Hardware-Liste

| Komponente | Empfehlung | Preis |
|-----------|-----------|-------|
| Raspberry Pi | 4 (4GB) oder 5 | 45-65€ |
| MicroSD | 32 GB (mindestens) | 8€ |
| Gehäuse | Retroflag NESPi oder GPi Case | 15-40€ |
| Controller | 8BitDo SN30 Pro oder USB-Arcade | 20-35€ |
| Netzteil | USB-C 5V/3A | 8€ |
| Kühlung | Heatsink + Lüfter | 5€ |
| HDMI-Kabel | Micro-HDMI auf HDMI | 5€ |
| **Gesamt** | | **~100-160€** |

## Optional: Arcade-Setup

Für den ult-Erlebnis:

- **Arcade-Buttons** (6x) + Joystick — ~25€
- **USB-Encoder** (Zero Delay) — ~8€
- **LCD-Display** (7" IPS, 1024x600) — ~40€
- **Gehäuse** (Holz oder 3D-Druck) — variiert
- **Lautsprecher** + Audio-HAT — ~15€

## Installation

### 1. RetroPie Image herunterladen & flashen

```bash
# Image herunterladen
wget https://retropie.org.uk/download/rpi4/retropie-buster-4.7.1-rpi4_64.img.xz

# Auf SD-Karte flashen (via Raspberry Pi Imager oder dd)
sudo dd if=retropie-buster-4.7.1-rpi4_64.img.xz of=/dev/sdX bs=4M status=progress
```

### 2. Erster Start & Controller-Setup

1. Raspberry Pi starten
2. Controller anschließen
3. **Hold any button** zum Konfigurieren
4. Buttons belegen (Hotkey, A, B, X, Y, Start, Select, L, R)
5. WiFi konfigurieren (optional)

### 3. ROMs hinzufügen

ROMs können hinzugefügt werden via:
- **USB-Stick** → `/home/pi/RetroPie/roms/`
- **SMB/NFS** → Netzwerkfreigabe
- **SCP/SFTP** → Direkt über SSH

```bash
# Via SCP
scp /pfad/zu/rom.zip pi@retropie.local:/home/pi/RetroPie/roms/snes/
unzip rom.zip && rm rom.zip
```

### 4. Scraping (Box-Art & Metadaten)

In EmulationStation:
- **Start** → **Scraper** → Quelle wählen (ScreenScraper, TheGamesDB)
- Automatisch: Cover, Beschreibung, Release-Datum

Oder via Skraper (Desktop-Tool):
```bash
# Skraper herunterladen von skraper.net
# ROM-Ordner auswählen → Scrape → Export
```

## Emulator-Einstellungen

### RetroArch Konfiguration

Wichtige Einstellungen in `/opt/retropie/configs/all/retroarch.cfg`:

```ini
# Save-State auf Knopfdruck
input_enable_hotkey_btn = "8"  # Select
input_save_state_btn = "0"     # A
input_load_state_btn = "1"     # B

# Shader (CRT-Effekt)
video_shader_enable = "true"
video_shader = "/opt/retropie/configs/all/retroarch/shaders/crt-pi.glslp"

# Rewind (Zurückspulen)
rewind_enable = "true"
rewind_buffer_size = 10
rewind_granularity = 2

# Run-Ahead (Input-Lag reduzieren)
run_ahead_enabled = "true"
run_ahead_frames = 1
```

### Performance-Tipps

| System | Emulator | Performance |
|--------|----------|-------------|
| NES/SNES/Genesis | lr-snes9x, lr-picodrive | Perfekt |
| GBA | lr-mgba | Perfekt |
| PS1 | lr-pcsx-rearmed | Gut (mit Overclock) |
| N64 | lr-mupen64plus | Variiert (manche Spiele langsam) |
| Dreamcast | lr-flycast | Experimentell |

## Overclocking (Raspberry Pi 4)

In `/boot/config.txt`:

```ini
# Mildes Overclocking
over_voltage=4
arm_freq=1800
gpu_freq=600

# Aggressives Overclockung (mit Kühlung!)
over_voltage=6
arm_freq=2000
gpu_freq=750
```

## Netplay: Online mit Freunden

1. **Netplay aktivieren** in RetroArch → Netplay → Host
2. **Portfreigabe** im Router (UDP 55435)
3. **Verbindung** → IP-Adresse eingeben
4. **Gleicher ROM** und gleicher Core nötig

## Fazit

Ein Retro-Spieleautomat auf dem Raspberry Pi ist **einfacher als gedacht** und bietet mehr Spass als jede gekaufte Mini-Konsole. Mit ~100€ und ein paar Stunden Aufbau hast du:

- 50+ Retro-Konsolen in einem Gerät
- Box-Art und Metadaten
- Save-States und Rewind
- Netplay für Multiplayer
- Shaders für authentisches Retro-Gefühl

> **Tipp:** Nutze 8BitDo Controller für kabelloses Gaming und einen Retroflag NESPi-Case für das authentische Aussehen.
