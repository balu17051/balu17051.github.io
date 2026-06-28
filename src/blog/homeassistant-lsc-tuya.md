---
title: "LSC Smart Connect in Home Assistant einbinden: Komplette Anleitung"
date: "2026-06-28"
description: "LSC-Geräte (Tuya-basiert) lokal in Home Assistant steuern — ohne Cloud, ohne Abhängigkeiten. Schritt für Schritt mit LocalTuya und Tuya v2 Integration."
tags: ["Smart Home", "Home Assistant", "LSC", "Tuya", "IoT", "Lokal"]
slug: "homeassistant-lsc-tuya"
emoji: "🏠"
---

## Warum LSC + Home Assistant?

LSC Smart Connect ist die Smart-Home-Eigenmarke von Action (Niederlande/Belgien). Die Geräte sind günstig — Steckdosen ab 8€, Lampen ab 12€, Sensoren ab 10€. Das Beste: Unter der Haube steckt Tuya, und das bedeutet: **Sie lassen sich lokal in Home Assistant integrieren.**

Keine Cloud-Abhängigkeit, keinbringen chinesisches Daten-Geflecht, keine App-Zwang — nur du und deine Geräte.

## Übersicht der LSC-Geräte

| Gerät | Tuya-Produkt | Lokal steuerbar |
|-------|-------------|----------------|
| LSC Smart-Steckdose (IP20) | Switch 1-Gang | ✅ Ja |
| LSC Smart-LED E27 RGB | RGBW Bulb | ✅ Ja |
| LSC Smart-LED E27 Weiß | Dimmable Bulb | ✅ Ja |
| LSC Smart-Bewegungsmelder | PIR Sensor | ✅ Ja |
| LSC Smart-Tür-/Fenstersensor | Door/Window Sensor | ✅ Ja |
| LSC Smart-Camera | IP Camera | ❌ Nur Cloud |
| LSC Smart-Steckdose (IP44) | Switch 1-Gang Outdoor | ✅ Ja |

## Methode 1: Tuya v2 Integration (Empfohlen)

Die offizielle Tuya v2 Integration in Home Assistant nutzt die Tuya Cloud API zur Geräteerkennung, steuert die Geräte dann aber **lokal** über LAN.

### Schritt 1: Tuya IoT Platform registrieren

1. Gehe zu [iot.tuya.com](https://iot.tuya.com) und erstelle einen Account
2. Erstelle ein neues Projekt ("Cloud Development" → "Create Cloud Project")
3. Wähle als Data Center **Central Europe** (für LSC-Geräte in DE/NL/BE)
4. Notiere dir **Access ID** und **Access Secret**

### Schritt 2: Geräte verlinken

1. In der Tuya IoT Platform: Gehe zu "Device Management" → "Link Tuya App Account"
2. Scanne den QR-Code mit der LSC Smart Connect App (oder Tuya Smart App)
3. Deine LSC-Geräte erscheinen nun in der Platform

### Schritt 3: API-Berechtigungen aktivieren

1. Gehe zu "Project" → deiner Projekt → "API Group"
2. Aktiviere folgende Gruppen:
   - **Device Control** (zum Schalten)
   - **Device Management** (für Status)
   - **User Management** (für Auth)

### Schritt 4: Home Assistant konfigurieren

```yaml
# configuration.yaml
tuya:
  username: DEINE_TUYA_EMAIL
  password: DEIN_TUYA_PASSWORT
  country_code: "49"  # Deutschland
  platform: "tuya"    # Für LSC: "tuya" oder "lsc"
```

Oder über die UI: **Einstellungen → Geräte & Dienste → Integration hinzufügen → Tuya**

### Schritt 5: Lokale Steuerung aktivieren

Die Tuya v2 Integration erkennt automatisch, ob ein Gerät im lokalen Netzwerk erreichbar ist. Wenn ja, wird die Steuerung lokal durchgeführt.

Prüfen: **Einstellungen → Geräte & Dienste → Tuya → Gerät anklicken → "Lokale Verbindung: Ja"**

## Methode 2: LocalTuya (Reine Lokal-Steuerung)

Wenn du **komplett ohne Cloud** arbeiten willst, ist LocalTuya die beste Wahl. Diese Integration kommuniziert direkt über das LAN mit den Tuya-Geräten.

### Schritt 1: LocalTuya installieren

Via HACS (Home Assistant Community Store):

1. HACS → Integrationen → "Lokale Tuya" suchen
2. Installieren
3. Home Assistant neu starten

### Schritt 2: Device Key und Local Key ermitteln

Dafür brauchst du das Tool **tinytuya**:

```bash
pip install tinytuya

# Schcan nach Geräten im Netzwerk
python -m tinytuya scan

# Output Beispiel:
# Device 1: [LSC Smart Plug] at 192.168.178.45, ID: bfsdb234..., Key: abc123...
```

Alternativ: Tuya Cloud API abfragen:

```python
import tinytuya

# Mit Cloud-Credentials
c = tinytuya.Cloud(
    apiRegion="eu",    # Central Europe für LSC
    apiKey="DEIN_ACCESS_ID",
    apiSecret="DEIN_ACCESS_SECRET",
    apiDeviceID="DEIN_DEVICE_ID"
)

# Alle Geräte abrufen
devices = c.getdevices()
for dev in devices:
    print(f"{dev['name']}: ID={dev['id']}, Key={dev.get('local_key', '?')}")
```

### Schritt 3: LocalTuya in Home Assistant konfigurieren

Über die UI: **Einstellungen → Geräte & Dienste → Integration hinzufügen → LocalTuya**

Für jedes Gerät brauchst du:
- **Device ID**: Aus dem tinytuya-Scan
- **Local Key**: Aus dem tinytuya-Scan oder der Cloud API
- **IP-Adresse**: Aus dem Scan
- **Protocol Version**: Meist **3.3** für LSC-Geräte

### Schritt 4: DPS-Mapping (Data Points)

Jedes Tuya-Gerät hat DPS-Werte (Data Points). Die wichtigsten:

**LSC Smart-Steckdose:**

| DPS | Typ | Beschreibung |
|-----|-----|-------------|
| 1 | boolean | Ein/Aus |
| 2 | integer | Timer (Sekunden) |
| 5 | integer | Strom (0.01A) |
| 6 | integer | Spannung (0.1V) |
| 7 | integer | Leistung (0.1W) |

**LSC Smart-LED RGBW:**

| DPS | Typ | Beschreibung |
|-----|-----|-------------|
| 1 | boolean | Ein/Aus |
| 2 | string | Modus (white/colour/scene/music) |
| 3 | integer | Helligkeit (10-1000) |
| 5 | string | Farbe (HSV: h,s,v) |
| 6 | integer | Farbtemperatur (0-1000) |

Konfiguration in der LocalTuya-UI: Für jeden DPS einen Eintrag erstellen mit dem passenden HA-Platform-Typ (switch, light, sensor).

## Automatisierungen: Praktische Beispiele

### Bewegungsmelder → Licht

```yaml
automation:
  - alias: "LSC Bewegung → Licht an"
    trigger:
      - platform: state
        entity_id: binary_sensor.lsc_bewegungsmelder
        to: "on"
    action:
      - service: light.turn_on
        target:
          entity_id: light.lsc_led_wohnzimmer
        data:
          brightness_pct: 80
          kelvin: 4000
    mode: single
```

### Steckdose nach Stromverbrauch schalten

```yaml
automation:
  - alias: "Steckdose aus bei Standby"
    trigger:
      - platform: numeric_state
        entity_id: sensor.lsc_steckdose_leistung
        below: 2
        for:
          minutes: 10
    action:
      - service: switch.turn_off
        target:
          entity_id: switch.lsc_steckdose
```

### Tageszeit-basierte Farbtemperatur

```yaml
automation:
  - alias: "Warmes Licht am Abend"
    trigger:
      - platform: time
        at: "19:00:00"
    action:
      - service: light.turn_on
        target:
          entity_id: light.lsc_led_schlafzimmer
        data:
          kelvin: 2700
          brightness_pct: 50
          transition: 300  # 5 Minuten sanfter Übergang
```

## Troubleshooting

### Gerät wird nicht erkannt

1. **Stellen Sie sicher, dass das Gerät im selben WLAN-Netz** ist wie Home Assistant
2. **2.4 GHz Netzwerk** verwenden — LSC-Geräte unterstützen kein 5 GHz
3. Gerät einmal vom Strom trennen und neu verbinden
4. In der LSC-App prüfen, ob das Gerät noch verbunden ist

### LocalKey ist falsch

Der Local Key ändert sich, wenn ein Gerät **neu gepairt** wird. Nach jedem Neu-Pairing den Key neu ermitteln.

### Gerät geht offline

- Tuya-Geräte wechseln manchmal die IP. **Statische IP im Router vergeben** (DHCP-Reservierung)
- Manche LSC-Geräte aktualisieren ihre Firmware automatisch über die Cloud. Nach einem Update kann sich der DPS-Mapping ändern.

### DPS-Werte finden

Wenn du nicht weißt, welche DPS dein Gerät hat:

```bash
tinytuya wizard
# Folgt dem interaktiven Wizard, der alle DPS ausliest
```

Oder in Home Assistant: **Entwicklerwerkzeuge → Zustände → Gerät suchen** — dort werden alle Attribute angezeigt.

## Sicherheitshinweise

- **Lokale Steuerung** bedeutet: Keine Daten gehen an Tuya-Server (bei LocalTuya)
- Die Tuya v2 Integration nutzt die Cloud nur zur Authentifizierung, danach lokal
- **Blockiere Tuya-Server in deinem DNS-Filter** (z.B. Pi-hole), wenn du LocalTuya nutzt
- Firmware-Updates funktionieren dann nicht mehr — abwägen zwischen Privacy und Security

## Fazit

LSC Smart Connect Geräte sind ein Geheimtipp für Home-Assistant-Nutzer. Günstig, Tuya-kompatibel und mit LocalTuya komplett lokal steuerbar. Die Kombination aus LSC-Hardware und Home Assistant Automatisierung schlägt jedes kommerzielle Smart-Home-System — und du behältst die Kontrolle über deine Daten.
