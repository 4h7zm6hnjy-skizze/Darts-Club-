# Darts-Club 3.7.0 – Dartabend-Zentrale

Kostenlose offline-first PWA auf Basis der veröffentlichten Version **3.6.1**. Vollständiges Paket mit 28 Dateien, keine persönlichen Spieler- oder Kassenbestände im Paket.

## Neu

- **Dartabend-Planer:** Titel, Datum, 2–12 echte Spieler und optionale Notiz. Eindeutiger Jeder-gegen-jeden-Spielplan mit Runden und fairen Freilosen bei ungerader Spielerzahl.
- **Partien direkt starten und fortsetzen:** X01 (501, Double-Out, Best of 3 Legs) im bereits vorhandenen, getesteten Vollbild-Scorer. Eine geplante Begegnung ist mit genau einer echten Partie über deren unveränderliche ID verknüpft. Beendete Partie zeigt den tatsächlich berechneten Gewinner, niemals ein geratenes Ergebnis. Beim Löschen einer Partie bleibt die Paarung erhalten und darf neu gestartet werden.
- **Spielabend-Fortschritt und CSV-Bericht:** Runden, Spieler, Spielstatus und echte Gewinner; Archivieren und später wieder öffnen. Entfernen des Plans löscht keine Dartpartie und keine Kassenbuchungen.
- **Jürgen-Tagesübersicht:** Nur vorhandene, nicht stornierte Jürgen-Buchungen der für diesen Kalendertag angelegten Spieltage. Nicht automatisch dem Plan zugeordnet; Zahlungen/Papierlisten sind bewusst ausgeschlossen. Keine Abbuchung durch einen geplanten Dartwurf.
- **Lokale Datenprüfung:** Serialisiert den aktuellen App-Datensatz im Arbeitsspeicher, lässt ihn durch die bestehende strenge Backup-Validierung laufen und vergleicht Anzahl und Originalbeträge der Kassenbuchungen. **Kein Backup-Ersatz.** Vollständiger JSON-Export weiterhin unverändert.
- Alle bestehenden Vollbildansichten aus 3.6.1, Vereinsverwaltung, Training, offline LAN-Beta, Dart-Caller, Kassenbuch und Sicherungspunkte bleiben vorhanden.

## Datenschema, Kompatibilität

- Bestehender Speicherschlüssel `juergen-dartkasse-state-v1`, Schema `juergen-dartkasse`, Schema-Version 1.
- Neues **optionales** Feld `clubEvenings` mit max. 120 Veranstaltungen und validierten Paarungs- und Match-Verweisen. Frühere 3.6.1-Backups ohne dieses Feld werden akzeptiert, ohne die Daten neu anzulegen.
- Ein Dartabend-Plan ist ein Organizer, **kein neuer Live-Mehrspieler-Server**, kein Ersatz für die echte Jürgen-Erfassung. Er plant nur 1-gegen-1-Partien, nicht 2-gegen-2-Turniere. Spiele können an einem anderen Tag fortgesetzt werden; die Zuordnung erfolgt über die Match-ID statt über geschätzte Datumsvergleiche.
- Kasse, Preise, Buchungen, Papierliste und alte Spielstände werden beim Anlegen eines Plans nicht verändert.

## Update

1. Vorher vollständiges JSON-Backup aus der bisherigen App **außerhalb des iPhones** sichern.
2. ZIP entpacken und alle Dateien direkt in `4h7zm6hnjy-skizze/Darts-Club-` Branch `main` hochladen, Änderungen committen. Bestehende URL bleibt gleich.
3. `https://4h7zm6hnjy-skizze.github.io/Darts-Club-/?app-refresh=3.7.0` öffnen. **Dart spielen → Verein & Teams → Dartabende**.
4. Ein Testevent mit vier Spielern erstellen, Begegnung starten und den Score im Vollbild spielen. Danach zurück zur Dartabend-Zentrale, Sieger und Backup kontrollieren.

## Grenzen

- Browser-Tests und statische Prüfungen ersetzen keinen echten iPhone-PWA-Test. Offline-Wiederstart, Speicherbereinigung durch iOS und die Verbindung zweier physischer Handys müssen auf echten Geräten geprüft werden.
- Die WebRTC-LAN-Funktion bleibt Beta. Keine automatische Kamera-Erkennung und keine Cloud-Synchronisierung.
