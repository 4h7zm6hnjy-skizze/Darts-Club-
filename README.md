# Darts-Club 3.4.3 – Siegerkarte & Spielbericht

Vollständiges Update auf Basis von **Version 3.4.2**. Es werden keine privaten Spieler-, Kassen- oder Spielstanddaten mitgeliefert.

## Verbesserungen

- Die Siegerkarte nimmt im Vollbild nur noch die erforderliche Höhe ein. Der leere Raum oberhalb und unterhalb der Inhalte wird nicht künstlich gestreckt.
- Die Spielkopfzeile und „Rückgängig“ haben eine kräftigere, klarere Schrift und besser sichtbare Konturen.
- Bei abgeschlossenen Partien erscheint **„Spielbericht ansehen / PDF“** mit Vergleich aller Teilnehmer und vollständigem Aufnahmenverlauf.
- Im Bericht lassen sich die Resultate zunächst ansehen und dann über den iPhone-/Browser-Druckdialog als PDF sichern (abhängig von Gerät und Browser).
- Report und Druck sind lokal, ohne externe APIs oder Cloud. Bericht und Anzeige verändern die bestehende Partie, Statistiken und Jürgen-Kasse nicht.
- Die Revanche mit unveränderten Spielregeln und die bisherige Spielerhistorie bleiben erhalten.

## Installation

1. Auf dem Hauptgerät zuerst vollständiges JSON-Backup erstellen.
2. ZIP entpacken und die **21 Dateien im ZIP** im Stammverzeichnis des GitHub-Repositories hochladen; gleichnamige Dateien ersetzen.
3. GitHub **Commit changes** bestätigen.
4. App neu starten, **Version 3.4.3** prüfen, bisherige Spieler- und Kassendaten kontrollieren.
5. Eine Testpartie beenden und den Spielbericht öffnen; Druck- und PDF-Ablauf auf dem echten iPhone verifizieren.

**Hinweise:** Der lokale Offline-Web-Speicher kann vom iPhone bereinigt werden – deshalb zusätzlich unabhängige JSON-Backups aufbewahren. LAN-Verbindungen zwischen zwei echten Handys bleiben gesondert zu testen. Der PDF-Export erfolgt über die systemeigene Druckfunktion; es wird keine PDF-Datei automatisch in eine Cloud hochgeladen.
