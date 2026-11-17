# JÜRGEN DARTKASSE · Komplettupdate v3.1.0

## Enthalten

- Alle 18 Dateien aus v3.0.0 plus neues Modul `camera-assist.js` (vollständiges Update)
- Vollbild-Spiel: Bildschirm bei unterstützten Geräten optional wach halten; zielgerichtete D-Miss-Taste für explizite Fehlversuche auf Doppel
- Eine Aufnahme aus der LAN-Verbindung bekommt eine gespeicherte, eindeutige Wurf-ID. Erneute Sendungen können nach Wiederverbindung oder Seitenneustart auf bereits verbuchte Würfe geprüft werden; ein Button sendet denselben unbestätigten Wurf erneut
- Zentraler Spielleiter, lokale WLAN-/WebRTC-Kopplung (Beta), Zuschauer-Vollbild auf verbundenem Gastgerät, ohne Kassen- oder Backup-Übertragung
- Club-Rangliste, Form der letzten fünf X01-Partien und häufigstes Finish-Doppel direkt im Spielerprofil
- Nächste bereite Turnierbegegnung kann direkt gestartet werden
- Lokale IndexedDB-Sicherungshistorie (maximal fünf Datenstände, frühestens 30 Minuten auseinander); Auswahl und ausdrücklich bestätigte Wiederherstellung
- Diagnoseanzeige für lokalen Speicher, Service Worker und Offline-Cache – ohne Upload
- Kamera-Assistent: Foto lokal anzeigen, Bull und D20 kalibrieren, Treffer auf Foto antippen und Punktvorschlag manuell bestätigen. Keine automatische optische Treffererkennung und keine automatische Kassenbuchung

## Grenzen

- Eine stabile Verbindung ohne Internet zwischen echten iPhones und Android-Geräten ist weiterhin **nicht nachgewiesen**. Beide Geräte müssen im selben WLAN sein; der Router muss direkte Kommunikation zulassen. Ein erneutes Koppeln per QR/Code kann nötig sein.
- Das lokale Wiederherstellungsarchiv liegt **auf demselben Gerät** und schützt nicht vor Verlust oder Bereinigung sämtlicher Browserdaten. Vor jedem Update vollständiges JSON-Backup exportieren und außerhalb des Browsers ablegen.
- `D-Miss` ist ein ausdrücklich markierter verfehlter Doppelversuch; gewöhnliche Miss-Würfe können kein Checkout-Ziel zugeordnet bekommen. Historische Checkout-Quoten bleiben daher unvollständig.
- Der Kamera-Assistent ist eine experimentelle **manuell kalibrierte** Hilfe. Er erkennt Darts nicht selbst und erfordert menschliche Bestätigung. Perspektive und Kalibrierung beeinflussen das Ergebnis.
- Bildschirm-Wachhaltung steht nur zur Verfügung, wenn der Browser Screen Wake Lock unterstützt und die Freigabe erteilt.
- Kein unabhängiger Code-Audit durchgeführt, wie gewünscht.

## Installation

1. In bestehender App ein vollständiges JSON-Backup erstellen und an einem anderen Speicherort sichern.
2. ZIP entpacken und **alle Dateien aus der ZIP-Wurzel** in den `main`-Branch von `4h7zm6hnjy-skizze/Darts-Club-` hochladen.
3. Danach App online neu laden und Version `3.1.0` prüfen.
4. Vor einem echten Dartabend mit zwei Geräten eine Probe-Partie im WLAN testen.
5. Bei unsichtbaren bisherigen Daten **keine neuen Spieler anlegen und keine Browserdaten löschen**.
