# Jürgen Dartkasse – iPhone-Logo-Korrektur 1.5.3

**Ursache:** Das bisherige Layout nutzte den auf neueren iOS-Versionen problematischen Web-App-Statusleistenmodus `black-translucent`. Auf dem iPhone kann die Systemleiste den App-Kopf überdecken oder verschwimmen lassen.

**Änderungen:**
- Umstellung auf `apple-mobile-web-app-status-bar-style=default` (WebKit-Empfehlung)
- Durchgehender, deckender Header statt durchscheinendem Hintergrund
- Zusätzlich ein großes Dart-Logo mit Schriftzug und © Marcel Hentschel 2026 **im sichtbaren Inhaltsbereich** (auch bei alten Home-Bildschirm-Installationen)
- Kein Eingriff in Spielerdaten, importierte Papierliste, Champions, Preise oder Kassenstände
- App-Version 1.5.3 und neuer Service-Worker-Cache

**Installation:**
1. Vollständiges JSON-Backup in der bestehenden App erstellen.
2. ZIP entpacken und die sechs Dateien im GitHub-Repository `Darts-Club-` im Hauptordner ersetzen.
3. Commit bestätigen; App nach Veröffentlichung mit Internet öffnen und unter „Mehr“ das Update prüfen.
4. Die installierte App **nicht löschen**, bevor die lokale Sicherung überprüft wurde.

**Hinweis zu iOS:** Ein bereits installiertes Home-Bildschirm-Symbol kann frühere Web-App-Statusleisten-Einstellungen beibehalten. Deshalb wurde zusätzlich eine sichtbare Logo-Leiste unabhängig von der System-Kopfzeile eingebaut. Eine vollständige Korrektur der iOS-Systemüberlagerung kann durch Webcode allein nicht garantiert werden.
