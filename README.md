# Darts-Club 3.6.0 – Verein & Teams

**Vollständiges Offline-Web-App-Update** auf Basis der veröffentlichten Darts-Club-Version 3.5.0. Das Paket enthält keine Spieler-, Kassen- oder Profildaten. Kostenlose PWA für iPhone, Android und Desktop; bestehende URL bleibt unverändert.

## Neu in 3.6.0

1. **Echter 2-gegen-2-X01-Scorer:** Vier unterschiedliche Spieler, gemeinsame Team-Punktstände, wechselnde Werfer, 301/501/701, Double-Out/Master-Out/Straight-Out, Best of 1/3/5/7 Legs, legweiser Wechsel des Anwurfs, gespeicherte Aufnahmen, Rückgängig und CSV-Wurfprotokoll. Diese Mannschaftspartien sind **getrennt** von Einzelpartien, Elo und Jürgen-Gebühren.
2. **Profi-Center-Verknüpfung:** Ein bestehendes *Teamduell*-Turnier kann direkt mit dem neuen 2v2-Scorer gespielt werden. Der Sieger wird nach dem letzten Leg übernommen. Wird der entscheidende Wurf rückgängig gemacht, wird die automatisch zugehörige Turnierwertung ebenfalls zurückgenommen. Die bisherige manuelle Teamwertung bleibt als Alternative erhalten.
3. **Vereinssaison und Kalender:** Saisons anlegen, vorhandene Turniere zuordnen, Termine planen, Fortschritt aus den vorhandenen Turnierpartien anzeigen, Saison archivieren/reaktivieren. Bereits erfasste Turniere und Ergebnisse werden nicht verändert.
4. **Persönliche Wochenziele:** Je Spieler und Trainingsart 1–14 gespeicherte Trainingseinheiten pro Woche als Ziel, Fortschritt und Erfolgszahl ausschließlich aus dem realen Trainingsverlauf; Direktzugang zur passenden Übung im Profi-Center.
5. **Geräte- und Datenbereich:** Lokal ausführbarer Gerätecheck (WebRTC, QR, Speicher und benötigte Browserfunktionen), direkter vollständiger JSON-Export und Abkürzungen zu Dartabend LIVE, Speicherdiagnose und Foto-Kalibrierung.
6. **Lesbarkeit:** Neue Verein-Ansicht mit großen Eingabetasten und gut sichtbarer Kopfzeile. Bei 320 px, 390 px und im Querformat im Browser getestet.

## Daten & Sicherheit

- Das bestehende Schema `juergen-dartkasse`, **Schema-Version 1**, bleibt erhalten. Neue optionale Felder: `clubDuels`, `clubSeasons`, `clubPlans`. Frühere 3.5.0-Backups ohne diese Felder lassen sich weiterhin importieren.
- Die Eingaben werden in der bisherigen lokalen App-Datenhaltung gespeichert und im **vollständigen JSON-Backup** mitgenommen. Die ursprünglichen Felder für Spieler, alte Dartpartien, Geld und Jürgen werden nicht automatisch geändert.
- Ein Teamduell erzeugt **keine** Jürgen-Buchung. Teamspielwertungen werden nicht als reguläre Einzelspieler-Elo oder individuelle X01-Partie gewertet.
- Vor jedem Update und vor der Wiederherstellung eines Backups **vollständiges JSON-Backup außerhalb der App sichern**. Browserdaten auf dem iPhone nicht löschen. Ein Offline-Browser kann gespeicherte Daten unter Umständen bereinigen.

## Was noch nicht enthalten oder bestätigt ist

- **Keine** vollautomatische Kamera-Treffererkennung. Die bestehende Foto-Hilfe benötigt manuelle Kalibrierung und Bestätigung.
- Die direkte WebRTC-Verbindung zwischen zwei physischen iPhone/Android-Geräten ist weiterhin **Beta**. Der Gerätecheck beweist **keine** erfolgreiche Verbindung; erneute QR-Kopplung kann nötig sein.
- Keine Cloud-Synchronisierung, keine smarten Bluetooth-Dartboard-Treiber, keine Online-Partien über das Internet. Kein App-Store-Paket.
- Die neue Ansicht und Logik wurden in der Browser-Simulation getestet, **nicht** auf dem tatsächlichen iPhone des Nutzers installiert oder gegen dessen persönliche Daten ausgeführt.

## Veröffentlichung (GitHub Pages)

1. **Vorher** die bereits installierte Darts-Club-App öffnen und ein komplettes JSON-Backup erstellen, sicher außerhalb der App ablegen.
2. Dieses ZIP entpacken, alle enthaltenen Dateien in das Repository-Root `4h7zm6hnjy-skizze/Darts-Club-` auf Branch `main` hochladen; Dateien überschreiben und auf GitHub „Commit changes“ bestätigen.
3. Die bestehende Website öffnen: `https://4h7zm6hnjy-skizze.github.io/Darts-Club-/?app-refresh=3.6.0`.
4. Im Menü **Verein & Teams** aufrufen (auf einem schmalen iPhone über **Dart spielen → Verein & Teams**). Version prüfen, vorhandene Spieler und Kasse kontrollieren, mit Testduell beginnen.
5. Offlinebetrieb und das Wiederöffnen einer Teamaufnahme auf dem eigenen Gerät testen. Zwei-Geräte-LAN-Beta erst prüfen, wenn ein zweites Handy vorhanden ist.

## Prüfungen im Entwicklungspaket

- Node-Syntaxprüfung aller JS-Dateien.
- Regeltests: Werferwechsel, 501/301, Checkout, Bust, Double-/Straight-Out, Legs, Undo, ungültige Würfe, Alt-Daten-Validierung, Saisontermine und Wochenziele.
- Chromium-Browsertests mit eingebetteten Quelltexten: alter 3.5-Datenstand, gespeicherter Team-Checkout, Undo, Neustart-Simulation, Termine und Ziele, automatisches Teamturnierergebnis inkl. Rücknahme, unveränderte Kassenbuchungen, Gerätecheck und vollständiger JSON-Export.
- Layouttests mit 320, 390 und 844 Pixel Bildschirmbreite. Ein echter iOS-PWA- oder WebRTC-Zwei-Geräte-Test konnte in dieser Umgebung nicht durchgeführt werden.
