# Jürgen Dartkasse – Update 1.3.0

Update für das bestehende GitHub-Pages-Repository `4h7zm6hnjy-skizze/Darts-Club-`.

## Änderungen
- Spieler können jetzt als **abwesend** markiert werden.
- Abwesende Spieler können nicht als Werfer ausgewählt werden.
- **Wichtig:** Bei einem **perfekten Jürgen** bekommen weiterhin **alle anderen gespeicherten Spieler** ihren Punkt – auch wenn sie abwesend markiert sind.
- Ganz oben gibt es jetzt zwei Champion-Bereiche:
  - **Undisputed Darts Champion**
  - **Summerslam Champion**
- Für beide Champion-Plätze kann ein **Name** und ein **Bild** gespeichert werden. Auf iPhone/iPad öffnet der Bild-Button die Fotoauswahl bzw. Kamera-/Mediathek-Auswahl des Systems.
- Jeder Spieler hat jetzt zusätzliche **Monats- und Jahresstatistiken**.
- Das Layout wurde stärker im **Dart-Stil** gestaltet.

## Sichere Aktualisierung
1. In der bisher installierten App unter **Mehr → Backup** ein vollständiges JSON-Backup speichern.
2. Die Dateien aus dieser ZIP entpacken und **einzeln in das Hauptverzeichnis** des vorhandenen GitHub-Repositories hochladen.
3. Die gleichnamigen Dateien ersetzen und den Commit bestätigen.
4. Die Veröffentlichung in GitHub Pages abwarten und in der Web-App unter **Mehr → Auf Update prüfen** die Version **1.3.0** installieren.
5. Die App nicht löschen und den lokalen Browser-Speicher nicht leeren.

## Technische Hinweise
- Der lokale Speicher-Schlüssel bleibt gleich und vorhandene Daten werden weiterverwendet.
- Die Datenstruktur bleibt kompatibel; neue Felder wie `absent` und `settings.champions` werden bei älteren Backups automatisch ergänzt.
- Die Update-Datei enthält nur die geänderten Web-App-Dateien.
