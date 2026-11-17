# Jürgen Dartkasse v2.2.1 – iPhone-Kopfzeile repariert

**Ursache:** Auf iPhones konnte die obere Spielsteuerung im Statusbereich hinter einer unscharfen Systemüberblendung liegen.

**Behoben:** Der Vollbild-Spielmodus reserviert jetzt je nach Bildschirmhöhe einen verlässlichen oberen Sicherheitsabstand. Titel und Schließen/Rückgängig bleiben unter der Statusleiste und erhalten einen deckenden Hintergrund ohne Blur. Auch bestehende Fokus-Animationen der normalen Seiten werden im Spielmodus abgeschaltet.

**Sicherheitsumfang:** Nur `index.html`, `styles.css`, `app.js`, `sw.js`, `version.json` und diese README sind verändert. Die Spiel-Engine, der Multiplayer-Code und die Speicherung von Spielern, Partien und Kassenbuchungen bleiben unverändert.

**Installation:** Vorher JSON-Backup erstellen; ZIP entpacken und fünf Programmdateien in der Wurzel des GitHub-Repositories ersetzen. Webseite in Safari neu öffnen. Kein Löschen der App oder der Safari-Daten.
