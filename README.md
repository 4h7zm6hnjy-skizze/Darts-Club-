# Jürgen Dartkasse · Version 3.4.2 – Siegeransicht

Vollständiges Offline-Web-App-Update. Enthält **keine** persönlichen Spieler-, Spiel- oder Kassendaten.

## Neu

- Überarbeitete Siegeranzeige ohne großen Zwischenraum: Pokal, Gewinner, konkrete Spielregel (z. B. **501 Double-Out**), Average, geworfene Darts, letztes und bestes Finish.
- Tatsächliche Leg-/Set-Ergebnisse aus der gespeicherten Partie, auch bei mehreren Legs/Sets.
- **Revanche starten** erzeugt unmittelbar eine neue Partie mit denselben Spielern, Regeln, DartBot-Einstellungen und Anwurfreihenfolge. Die abgeschlossene Partie bleibt archiviert. Die Kasse erhält dadurch keine neuen Buchungen.
- **Andere Partie einstellen** öffnet die bekannte Spielkonfiguration mit den vorherigen Regeln.
- Layout im Hoch-/Querformat und auf kleinen Smartphones angepasst; lange Inhalte bleiben scrollbar. Keine Toastmeldung, die die Revanche-Schaltflächen überdeckt.

## Installation

Vorher auf dem Haupthandy ein vollständiges JSON-Backup erstellen und außerhalb der App sichern. Alle Dateien dieses Pakets entpacken und im GitHub-Pages-Repository an der Wurzel ersetzen. **Commit changes** abschließen. Version 3.4.2 und bisherige Daten prüfen. App-Daten und installierte PWA nicht löschen.

## Technische Hinweise

- Kein Server, keine bezahlte API, unverändertes persistiertes JSON-Schema.
- Die neue Siegerkarte nutzt ausschließlich berechnete Spielstände aus der bisherigen Engine und schreibt selbst keine Daten.
- Die Revanche speichert ausschließlich eine neue, leere Partie mit denselben Einstellungen. Vorheriges Match und Jürgen-Buchungen bleiben unverändert.
- LAN/WebRTC bleibt Beta und muss weiterhin auf echten iPhone-/Android-Geräten getestet werden.
