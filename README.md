# Jürgen Dartkasse – Komplettupdate 3.0.0

**Stand: 17. November 2026.** Dieses ZIP enthält alle für die GitHub-Pages-Web-App benötigten Dateien im Stammverzeichnis. Version 2.3.0 muss nicht separat installiert werden; das Paket basiert bereits auf der Spielerprofil-Statistik dieser Version.

## Enthalten

1. **Profi-Center / Turniere:** Liga mit Jeder-gegen-jeden-Spielplan, K.-o.-Baum mit Freilosen, zwei Gruppen mit Halbfinale/Finale, Teamduell (2 gegen 2, manuelle Ergebniserfassung). Turnierpartien im X01-Modus können aus dem Profi-Center gestartet und nach Partieende automatisch ausgewertet werden. Manuelle Sieger werden getrennt gekennzeichnet.
2. **Offline-DartBot:** Gegner für X01, drei einstellbare Schwierigkeitsstufen. Der DartBot ist *kein* regulärer Jürgen-Spieler; er erzeugt keine Jürgen-Gebühren.
3. **Training:** 121 Checkout, Zufalls-Checkout, Doppeltraining und Präzision T20, einschließlich lokaler Verlaufsliste je Spieler. Die schon vorhandenen Trainingsmodi (u. a. Bob's 27 und 170 Checkout) bleiben im Spielcenter verfügbar.
4. **X01-Regeln:** Double-In, Double-Out, Master-Out, Straight-Out sowie manuelle Zuordnung, wer das Anwurf-Bull gewonnen hat.
5. **Spielerprofile:** Durchschnitt, First 9, Checkout, Highest Finish, 60+/100+/140+/180 sowie bestes und längstes gewonnenes Leg, Durchschnittsdarts pro gewonnenem Leg, Direktduelle, Segmenthäufigkeiten und Trainingsergebnisse.
6. **Berichte:** CSV-Export für Spieler und Turniere; HTML-Druckansicht, die sich über den Druckdialog auf kompatiblen Mobilgeräten als PDF speichern lässt.
7. **WLAN / Mehrspieler:** Nach Verbindungsabbruch kann dieselbe Sitzung über eine neue QR-Kopplung wiederverwendet werden. Der Spielleiter kann ein nicht mehr verbundenes Gerät erneut demselben Spielerprofil zuweisen. Wiederholte, bereits bestätigte Wurfkennungen werden auch über neue Verbindungen hinweg im selben Host-Prozess erkannt, um doppelte Buchungen zu vermeiden.
8. **Kamera-Ansicht:** Ein lokal aufgenommenes oder ausgewähltes Bild der Dartscheibe lässt sich ansehen. **Keine automatische Treffererkennung**; es wird nichts hochgeladen.
9. **Vorhandene Funktionen:** Jürgen-Kasse, perfekte Jürgen, Papierliste, Spielerfotos, Champions, Offline-Cache, JSON-Backup, Vollbild-Spielmodus und bisherigen Spielarten.

## Einschränkungen – wichtig

- **Keine automatische Kamera-Auswertung.** Das Foto wird nur lokal zur manuellen Kontrolle angezeigt.
- **Teamduelle** sind aktuell ein Turnierformat mit *manuell eingegebenem Sieger*; kein gemeinsamer 2-gegen-2-Wurfzähler mit Team-Score.
- **Lokales WLAN / WebRTC bleibt Beta.** WLAN-Router können direkte Verbindungen blockieren. Automatischer Wiederaufbau eines abgerissenen WebRTC-Kanals ohne Signalisierungsserver ist nicht garantiert. Erneutes Koppeln erfordert gegebenenfalls neue QR-Codes. Ein ungeklärter Wurf muss am Haupthandy geprüft werden, bevor er erneut gesendet wird.
- **PDF** wird über den Browser-Druckdialog erzeugt; es gibt keinen eigenständigen PDF-Generator.
- **DartBot** ist eine regelbasierte lokale Simulation mit Zufallstreffern, keine KI-Kamera oder Hardware-Erkennung.
- Diese App speichert Daten im Browser. Ein vollständiges JSON-Backup bleibt für Datenverlustschutz wichtig; Offline-Browser-Speicher kann vom System bereinigt werden.

## Sichere Installation über GitHub (Hauptbranch)

1. **Auf dem Haupthandy zuerst `Mehr → Vollständiges JSON-Backup`** verwenden und die Datei außerhalb der Web-App sichern.
2. ZIP auf dem Gerät entpacken.
3. Den Upload des Repositorys `4h7zm6hnjy-skizze/Darts-Club-` im Branch `main` öffnen.
4. **Alle Dateien aus diesem ZIP auf Root-Ebene** hochladen und vorhandene gleichnamige Dateien ersetzen; anschließend `Commit changes`.
5. Einmal online `https://4h7zm6hnjy-skizze.github.io/Darts-Club-/` in Safari / Chrome öffnen, die Version `3.0.0` prüfen und ein Testspiel durchführen.
6. Für den Offline-Dartabend die App auf jedem beteiligten Handy zuerst einmal bei bestehender Internetverbindung vollständig laden; später können alle Geräte denselben WLAN-Router ohne Internet benutzen.
7. Vor echten Turnier- und Kassenbuchungen die neuen Funktionen mit Testspielern oder einer Probe-Partie testen.

**Niemals Browserdaten löschen oder die installierte App entfernen, wenn vorhandene Kassen- und Spielerdaten nicht angezeigt werden.**

## Technische Prüfung

- 14 bestehende Spielregeltests bestanden.
- 16 zusätzliche Profi-Engine-Tests (Liga, Turniere, Gruppen, Bot, Regeln, Statistiken) bestanden.
- Browser-Simulation mit Testprofilen bestanden: App-Start, Turnier erstellen, Doppeltraining buchen, gespeicherte Statistik- und Turnierdaten erneut validieren, DartBot-Partie mit automatischem Bot-Wurf und Profilstatistik. Keine gemeldeten JavaScript-Ausnahmefehler.
- Browseransichten für 320×568, 390×844 und 844×390 geprüft; im Vollbild blieb die Seitennavigation gesperrt.
- Nicht geprüft: echte WLAN/WebRTC-Kopplung zwischen physischen iPhones und Android-Geräten; echter iOS-Safari-/Android-Chrome-Druckdialog; automatische System-Speicherbereinigung.

© Marcel Hentschel 2026
