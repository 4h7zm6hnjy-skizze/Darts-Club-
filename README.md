# Jürgen Dartkasse – Dart Elite 3.2.1 (Lesbarkeit)

Vollständiges Update auf Basis von Version 3.2.0. Keine privaten Spieler- oder Kassendaten enthalten.

## Änderungen
- Die Zuschaueransicht beginnt auf iPhones deutlich unter der Statusleiste, auch wenn iOS den Safe-Area-Abstand mit 0 meldet.
- Überschrift, Schließen-Schaltfläche, Spielstände und Hinweise erhalten größere Schriften und hohen Kontrast.
- Falls keine Partie aktiv ist, erscheint eine klar erkennbare Meldung mit direktem Wechsel zu »Dart spielen«.
- Zuschaueransicht ist bei Hoch- und Querformat scrollbar, wenn der Platz für alle Spieler nicht ausreicht.
- Nebeninformationen und Beschriftungen in den Elite-Analysen sind besser lesbar. Die mobile Navigationsleiste verwendet flexiblere Breiten.
- Der Inhalt bleibt unverändert lokal, Kassen- und Spieldatenformat sind identisch zu 3.2.0.

## Installation
1. Vorher ein vollständiges JSON-Backup außerhalb der App erstellen.
2. ZIP vollständig entpacken und alle Dateien in das bisherige GitHub-Repository hochladen; »Commit changes« bestätigen.
3. Version 3.2.1 prüfen und Zuschaueransicht ohne und mit aktiver Partie im Hoch- und Querformat testen.
4. Danach Offline-Neustart sowie Kassen- und Spielerdaten kontrollieren.

## Grenzen
Die Layouttests sind Browser-Simulationen. Die iOS-Statusleiste und reale PWA-Safe-Area können nur auf dem iPhone abschließend beurteilt werden. Das Update ersetzt keine externe Datensicherung.
