# Jürgen Dartkasse – Reparaturupdate 3.1.1

Vollständiges Paket auf Basis v3.1.0. Enthält keine persönlichen Spielerdaten oder Kasseneinträge.

## Behobene Fehler

1. Ein noch nicht bestätigter LAN-Wurf wird bei erneuter Kopplung nicht mehr aus der laufenden App-Sitzung gelöscht. Dieselbe Wurf-ID kann nach Freigabe erneut gesendet werden.
2. Die Schaltfläche zum Wiederholen eines unbestätigten Wurfs bleibt sichtbar, auch wenn das Haupthandy inzwischen zum nächsten Spieler gewechselt hat.
3. Eine durch den Spielleiter rückgängig gemachte LAN-Aufnahme wird mit einer dauerhaften Sperrkennung versehen. Bei erneuter Übertragung wird sie abgewiesen, auch wenn die App neu gestartet wurde. Diese Sperrkennungen werden im JSON-Backup mitgesichert.
4. Im Checkout-Training werden nur die tatsächlich erfassten Darts gezählt. Es können höchstens neun Darts innerhalb eines Trainingsversuchs ausgewählt werden.

## Installation

1. **Unbedingt vorher ein vollständiges JSON-Backup** auf dem Haupthandy erstellen und außerhalb des Browser-Speichers sichern.
2. ZIP entpacken, alle Dateien aus dem ZIP-Hauptverzeichnis zu GitHub hochladen und gleichnamige Dateien ersetzen.
3. Version 3.1.1 im Browser prüfen, bestehende Profile und Kassenbeträge kontrollieren.
4. Ein Testspiel ohne Jürgen-Kassenbuchung durchführen, danach eine Test-LAN-Sitzung mit iPhone und Android.

## Weiterhin offen

- Der direkte LAN/WebRTC-Kanal zwischen echten iPhone- und Android-Geräten ist weiterhin nicht auf echter Hardware nachgewiesen.
- Bei einem kompletten Seitenneustart auf dem **Gastgerät** gehen nicht bestätigte, nur im Arbeitsspeicher gespeicherte Würfe verloren; das Haupthandy bleibt für bestätigte Würfe maßgeblich.
- Die iOS-Wiederherstellungspunkte und die Kamera-Kalibrierung erfordern weiterhin Prüfung auf echten Geräten.
- Die lokale Wiederherstellungshistorie ist kein Ersatz für exportierte JSON-Sicherungen.
