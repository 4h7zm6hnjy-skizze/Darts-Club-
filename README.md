# Jürgen Dartkasse 2.2.0 – Vollbild-Spielmodus

**Änderung gegenüber v2.1.0:** Während eines Dartspiels öffnet sich automatisch eine feste Vollbild-Spielansicht. Keine Navigation und kein Scrollen durch die übrige App beim Werfen. Schließen bringt dich zur normalen App zurück. Der bestehende Spielmodus, LIVE-LAN und die Datenstruktur bleiben unverändert.

- Neue Spiele öffnen automatisch die Vollbildansicht.
- Gespeicherte Partien öffnen beim Antippen ebenfalls die Vollbildansicht.
- Die Schaltfläche „⛶ Vollbild spielen“ öffnet sie erneut.
- „✕ Schließen“ führt zurück zur App, ohne die Partie zu beenden.
- „↶ Rückgängig“ nimmt die letzte abgeschlossene Aufnahme nach Bestätigung zurück.
- Spielstände, Leg/Set, 3 Dart-Slots, Checkout, Trefferwahl und Jürgen-Schalter bleiben sichtbar.
- Das Spielbrett ist für Hoch- und Querformat als feste Ansicht angeordnet; keine Hintergrund-Scrollfunktion.
- Statistiken, Spielverlauf und Cricket-Detailtabelle sind während der Vollbildansicht ausgeblendet, bleiben nach dem Schließen erreichbar.
- Keine Änderung der lokalen Speicherstruktur, der gespeicherten Spieler-/Kassendaten oder des LIVE-Verbindungsprotokolls.

**Installation:** Auf dem Haupthandy zuerst JSON-Backup erstellen. ZIP entpacken; die 7 Dateien im Repository-Root auf GitHub hochladen. Keine anderen Dateien oder Verzeichnisse löschen. Danach App-Version 2.2.0 prüfen. Vor dem echten Dartabend auf iPhone und Android testen.

**Grenze:** Der Browser selbst (Safari/Chrome) kann seine Systemleisten einblenden. Die App kann das Betriebssystem nicht in einen nativen Kioskmodus versetzen. Der Vollbildmodus unterbindet das Scrollen innerhalb der App, aber keine Systemgesten.
