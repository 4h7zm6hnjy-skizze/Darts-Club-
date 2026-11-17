# Darts-Club 3.3.0 – Spielabend-Komfort

Vollständige Web-App auf Basis von 3.2.1. Kostenlos, offlinefähig nach erstmaligem Laden, ohne Account.

## Neue Funktionen
- **Schnellstart-Favoriten:** Bis zu acht häufige Spielkonfigurationen mit Spielmodus, Spielern, Finish-Regel, Legs/Sets, DartBot und Anwurf lokal im App-Datenbestand speichern. Favoriten lassen sich direkt starten, ersetzen und entfernen. Nicht mehr verfügbare Spieler verhindern den Start des Favoriten.
- **Partie fortsetzen:** Schnellzugriff auf die zuletzt angefangene, noch nicht beendete Partie; die gespeicherten Würfe bleiben erhalten.
- **Lesbarkeit:** Große, kontrastreiche Schnellstart-Schaltflächen mit mindestens 44 px Bedienfläche; mobil untereinander.
- **Backup-Kompatibilität:** Favoriten werden zusammen mit Spielern, Partien und der Kasse im bestehenden JSON-Backup exportiert und bei der Wiederherstellung geprüft. Alte Backups bleiben kompatibel.

## Wichtige Hinweise
- Keine privaten Daten im ZIP. Vor Upload vollständiges JSON-Backup außerhalb der App erstellen.
- Beim Start einer neuen Partie bleibt die vorhandene Bestätigungsfrage erhalten, falls eine Partie noch läuft.
- WLAN-Multiplayer bleibt Beta; iPhone/Android-Verbindung und Offline-Neustart sind nur auf echten Geräten endgültig prüfbar.
- Bei GitHub Pages alle Dateien im Wurzelverzeichnis hochladen und Commit changes bestätigen.
