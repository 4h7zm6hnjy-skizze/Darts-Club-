# Jürgen Dartkasse – Update 1.5.0

Dieses Paket ergänzt das vorhandene GitHub-Pages-Projekt `4h7zm6hnjy-skizze/Darts-Club-`. **Nur Programmdateien, keine persönlichen Spielerdaten**, gehören auf GitHub.

## Neuer privater Import direkt in der App
- Unter **Mehr → Backup & Export → Papierliste 2026 importieren** lässt sich die separate private JSON-Datei aus der Dateien-App auswählen.
- Der Import übernimmt nur sicher dokumentierte Punkte und die exakt angegebenen Spieltage.
- `0` bedeutet anwesend, null Treffer; `%` bedeutet abwesend. Leere Papierfelder bleiben unbestimmt.
- Es werden **keine erfundenen Einzelwürfe, Kronen oder Zahlungen** angelegt. Der Kassenstand bleibt unverändert.
- Vorhandene Spieler werden nach Namen wiederverwendet, neue Spieler nur ergänzend hinzugefügt.
- Doppelte Importe werden ausgelassen. Ein bestehender Würfereintrag am selben Tag wird nicht mit der Papierzeile doppelt gezählt.

## Neue Profilfotos für jeden Spieler
- Unter **Spieler → Kamera-Symbol / Spieler bearbeiten** kann über **Kamera oder Mediathek** ein Bild ausgewählt werden.
- Die Fotoauswahl erfolgt über den Systemdialog des iPhones (Kamera/Mediathek, sofern verfügbar).
- Vor dem Speichern wird das Bild **lokal** auf 256 × 256 Pixel zugeschnitten und als JPEG komprimiert.
- Foto erscheint bei Spieler-Auswahl, Spielerstatistik und Spieltagsübersicht.
- Foto lässt sich ändern oder entfernen. Die lokale JSON-Datensicherung enthält auch die Profilbilder.

## Installation
1. In der vorhandenen App unter **Mehr** zuerst ein **vollständiges JSON-Backup** erzeugen.
2. Dieses ZIP entpacken und die **sechs enthaltenen Update-Dateien** im Hauptverzeichnis von GitHub hochladen; gleichnamige Dateien ersetzen und den Commit bestätigen.
3. Die veröffentlichte Web-App auf Version **1.5.0** aktualisieren, ohne die installierte App oder deren Speicher zu löschen.
4. Erst danach die **separate Datei `Juergenliste-2026-Privater-Import.json`** in der App über den neuen Papierlisten-Import auswählen.
5. Nach dem Import die Einträge unter **Spieler & Statistik → Importierte Spieltage** prüfen und erneut ein vollständiges Backup erstellen.

**Wichtig:** Die private JSON-Importdatei gehört nicht in das öffentliche GitHub-Repository. Die Dateien aus dem Update-ZIP enthalten keine persönlichen Daten.

## Kompatibilität und Grenzen
- Bisherige Schlüssel für `localStorage` und IndexedDB bleiben erhalten.
- Alte Backups ohne Profilbilder/Papierlisten sind kompatibel.
- Fotoauswahl und Offline-Update konnten im Chromium-Browser getestet werden; die Auswahloptionen im iOS-Dateidialog und das Verhalten der installierten iPhone-Web-App sind nach der Veröffentlichung zu prüfen.
- Safari und die installierte Home-Bildschirm-App können getrennte Datenspeicher haben; vor Änderungen immer ein Backup auf dem Gerät erzeugen.
