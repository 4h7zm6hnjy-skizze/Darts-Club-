# Jürgen Dartkasse · Dart Elite 3.2.0

Vollständiges, kostenloses, offline-fähiges GitHub-Pages-Paket auf Basis von Version 3.1.1. **Es enthält keine privaten Spielerdaten oder Kassenbuchungen.**

## Neu in 3.2.0

- **Dart Elite Center** mit eigener Seite: nur lesender Zugriff auf gespeicherte Spiel- und Trainingsdaten; **keine Änderung der Jürgen-Kassenlogik**.
- **Club-Elo:** alle echten, abgeschlossenen 1-gegen-1-X01-Partien werden chronologisch mit Ausgangswert 1000 und K=24 ausgewertet. Trainings, Mehrspieler-Matches mit mehr als 2 Personen, DartBot und nur manuell eingetragene Turniersiege zählen nicht. Zeitfilter: Neu-Bewertung ab 1000 innerhalb des jeweiligen Zeitraums (keine offizielle Rangliste).
- **DartCoach:** nachvollziehbare Trainingshinweise aus tatsächlich aufgezeichneten Darts; unter 30 Darts keine vorgetäuschte Leistungsbeurteilung.
- **Trefferverteilung:** Single/Double/Triple pro Feld und Fehlwürfe aus protokollierten X01-Aufnahmen.
- **Duellvergleich:** vergangene X01-Direktduelle, letzte Form und echte Spielwerte.
- **Checkout-Rechner:** Restpunktzahl, Finish-Regel und verbleibende Darts frei wählen. Alle Wege aus vorhandener Dart-Engine.
- **Partiebericht:** Anzeige chronologischer Aufnahmen, CSV-Export aller Aufnahmen und lokale Druckansicht für PDF.
- **TV-Scoreboard:** große Vollbild-Zuschaueransicht auf dem aktuellen Gerät, die bei lokal gespeicherten Änderungen mitläuft. Für eine eigenständige Zuschaueranzeige auf anderen Handys ist die bestehende LAN-Gastansicht nötig; diese bleibt Beta.

## Installation

1. Auf dem **Haupthandy zuerst ein vollständiges JSON-Backup** außerhalb des Browsers speichern und dessen Existenz prüfen.
2. ZIP entpacken. Alle Dateien im ZIP-Hauptordner in das bisherige GitHub-Repository hochladen; bestehende Dateien ersetzen.
3. In GitHub auf **Commit changes** drücken. GitHub Pages starten und auf Version 3.2.0 sowie alle vorhandenen Spieler/Kassenbuchungen prüfen.
4. Eine Test-Partie ohne Jürgen-Gebühren spielen; Elite Center, Checkout, TV-Modus, Offline-Neustart, Backup-Export und einen CSV-Bericht testen.

## Grenzen

- Keine Aussage, dass die App die **beste** am Markt ist oder alle Spielarten perfekt beherrscht.
- LAN-Pairing und lokale Speicherbeständigkeit auf einem **echten** iPhone/Android sind weiterhin gesondert zu prüfen.
- Elo ist ein Club-Modell, keine offizielle Wettbewerbswertung.
- Foto-Hilfe erfordert weiterhin manuelle Kalibrierung und Bestätigung; kein automatisches Kamera-Scoring.
- Private Browserdaten sind systembedingt nicht unbegrenzt garantiert. **JSON-Backup** bleibt notwendig.
