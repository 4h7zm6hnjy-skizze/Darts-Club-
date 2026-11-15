# Jürgen Dartkasse – Update 1.2.1

Update für das bestehende GitHub-Pages-Repository `4h7zm6hnjy-skizze/Darts-Club-`.

## Änderungen
- Die Schaltfläche **+ Neuer Abend** heißt jetzt **Datum: TT.MM.JJJJ**.
- Beim Antippen öffnet sich eine Datumsauswahl (auf dem iPhone die native Datumseingabe).
- Bereits gespeicherte Spieltage können erneut aufgerufen werden, ohne alte Punkte zu löschen.
- Ein neues Datum legt automatisch einen neuen Spieltag an.
- Die Punkteanzeige und der Jürgen-Verlauf beziehen sich auf das gewählte Datum.
- Alle bisherigen Zahlungen, offenen Gebühren, Kronen und der Kassenstand bleiben erhalten.
- Der einzige Preis pro Punkt und die Regeln für Jürgen/Perfekter Jürgen bleiben unverändert.

## Sichere Aktualisierung
1. In der bisher installierten App unter Mehr → Backup ein vollständiges JSON-Backup speichern.
2. Die Dateien aus dieser ZIP entpacken und **einzeln in das Hauptverzeichnis** des vorhandenen GitHub-Repositories hochladen (nicht nur ZIP-Datei hochladen).
3. Die gleichnamigen Dateien ersetzen und den Commit bestätigen.
4. Die Veröffentlichung in GitHub Pages abwarten und in der Web-App unter Mehr → Auf Update prüfen die Version 1.2.1 installieren, falls verfügbar.
5. Alte Spieler- und Kassenstände kontrollieren. Die App nicht löschen und den lokalen Browser-Speicher nicht leeren.

## Technische Kompatibilität
Die vorhandenen lokalen Speicher-Schlüssel `juergen-dartkasse-state-v1`, `juergen-dartkasse-before-import-v1` sowie die IndexedDB `juergen-dartkasse` bleiben bestehen. Die Datenstruktur bleibt `schemaVersion:1`; das optionale Feld `date` ergänzt lediglich neue Spieltage. Vorhandene Spielabende ohne Datumsfeld werden anhand ihres ursprünglichen Erstellungsdatums angezeigt. Die Dateiauswahl verändert frühere Buchungen nicht.

## Getestet
- Syntaxprüfung von `app.js`.
- Datumsauswahl, Wechsel zwischen vorhandenen/neuen Tagen, Erhalt von Punkten und Kassenständen, Krone bei perfektem Jürgen, Backup-Kompatibilität mit alten Sitzungen.
- Geräte-/Safari-Test nach der GitHub-Pages-Veröffentlichung steht noch aus.
