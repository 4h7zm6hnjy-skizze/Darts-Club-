# Darts-Club 3.8.0 – Champion-Turniere & Siegersterne

Vollständiges Update auf Basis von 3.7.0. Enthält den gesamten App-Code, keine persönlichen Spieler- oder Kassenbestände.

## Neu

- Vorlagen für Undisputed Darts Champion und Summerslam Champion. Voreinstellung für beide: 501, Double-Out, Best of 3, K.-o. Diese Regeln sind ein Vorschlag, keine vom Nutzer bestätigten Turnierregeln.
- Regeln und Teilnehmer vor Erstellung anpassbar. Champion-Turniere unterstützen K.-o. und Gruppen + K.-o.; freie Turniere behalten alle bisherigen Turnierarten.
- Goldener Kronenstern ★♛ für Undisputed, orangefarbener Sonnenstern ★☀ für Summerslam. Farbe, Symbol und Beschriftung unterscheiden die Titel.
- Nach einem abgeschlossenen Champion-Turnier erhält der Sieger genau einen Stern. Automatische Sterne verwenden das lokale Datum der erstmaligen abgeschlossenen Ergebniserfassung.
- Auf der Startseite: „Siegersterne vergeben“, mit Spieler, Titel und frei wählbarem Datum für historische Siege. Mehrfache gleiche Vergaben am selben Datum erfordern Bestätigung.
- Sterne stehen im Spielerprofil mit Anzahl und datiertem Verlauf. Manuelle Sterne können nach Bestätigung entfernt werden.
- Ergebnisänderungen passen automatische Sterne an. Wird das Turnier gelöscht oder wieder unvollständig, entfällt sein automatischer Stern. Manuelle Sterne bleiben erhalten.
- Vorhandene Champion-Namen und Bilder bleiben frei bearbeitbar. Aus einem vorhandenen Namen wird kein historischer Sieg oder Datum abgeleitet.
- Neue Felder sind Bestandteil des vollständigen JSON-Backups. Alte Backups ohne Sterne bleiben kompatibel. Bestehende Speicherschlüssel bleiben erhalten.

## Update installieren

1. In der bisherigen App ein vollständiges JSON-Backup sichern.
2. Dieses ZIP entpacken. Alle App-Dateien im bestehenden Repository `4h7zm6hnjy-skizze/Darts-Club-`, Branch `main`, ersetzen bzw. ergänzen; insbesondere die neue Datei `champion-stars.js` mit hochladen.
3. Die bestehende Adresse öffnen: https://4h7zm6hnjy-skizze.github.io/Darts-Club-/?app-refresh=3.8.0
4. Update laden und Versionsanzeige 3.8.0 prüfen. Auf der Startseite unter den Champion-Karten befinden sich die Vorlagen und die manuelle Vergabe.
5. Ein Testturnier mit zwei Spielern abschließen und den Siegerstern im Profil prüfen. Danach Backup exportieren.

Dieses Paket wurde erstellt, aber nicht auf der Website veröffentlicht.

## Prüfung dieser Version

Bestanden: JavaScript-Syntax aller Module; Referenzen auf lokale Dateien und Offline-Cache; Siegervergabe, Vermeidung doppelter Sterne, Siegerkorrektur, Wiederöffnung, Erhalt manueller Sterne, Ablehnung ungültiger Datumswerte; vollständige Backup-Validierung mit neuen Feldern und alten Daten.

Der visuelle Browser-Test konnte wegen einer technischen Beschränkung der Ausführungsumgebung nicht gestartet werden. Layout, Bedienung und Offline-Neustart dieser Version müssen daher noch im Browser und auf dem iPhone geprüft werden. Bestehende WebRTC-LAN-Funktionen bleiben Beta.
