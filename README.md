# Jürgen Dartkasse – Update 1.7.0: eigener Dart-Spielmodus

## Installation

1. Zuerst in der bestehenden Dart-App **Mehr → Vollständiges JSON-Backup** ausführen und die Datei sicher speichern.
2. Die **acht Update-Dateien** aus der ZIP-Datei entpacken.
3. Alle acht Dateien einzeln in das Hauptverzeichnis des bestehenden Repositories `4h7zm6hnjy-skizze/Darts-Club-` hochladen; die vorhandenen gleichnamigen Dateien ersetzen.
4. Auf **Commit changes** tippen und anschließend GitHub Pages neu laden.
5. Unter **Mehr → Version & Update** prüfen, ob `1.7.0` angezeigt wird. **Nicht die bestehende Home-Bildschirm-App löschen oder den Browser-Speicher leeren.**

## Neu: Spielen

Der untere Navigationsbereich hat fünf Punkte: **Zählen · Spielen · Spieler · Kasse · Mehr**.

Unter **Spielen** gibt es elf regelbasierte Varianten mit manueller Dart-für-Dart-Erfassung:

- X01 (170/210–1501, Double-Out optional, Best of 1/3/5/7/9 Legs)
- Cricket
- No-Score Cricket
- Cut-Throat Cricket
- Tactics Cricket
- Count-Up
- Around the Clock
- Shanghai
- Half-It
- Bob’s 27
- 170 Checkout (Einzeltraining mit maximal neun Darts)

Bis zu sechs vorhandene Spieler können pro Partie gewählt werden (170 Checkout: ein Spieler). Es gibt Single/Double/Triple, Bull und Miss, eine Rücknahme der letzten Aufnahme, getrennte Spielverläufe und Statistiken.

### Statistiken
- X01: 3-Dart-Average, First-9, 100+/140+/180, Busts, Checkout und Highest Finish.
- Cricket: Marks, MPR und Punkte.
- Training: Runden, Darts, Punktzahl.
- Modusübergreifend: Spiele, Siege und verfügbare Vergleichswerte; Monats- und Jahresfilter aus vorhandenen Partien.

## Datensicherheit

Der Spielmodus nutzt die **vorhandenen Spielerprofile**. Spiele werden im bestehenden lokalen Zustand unter `dartMatches` gespeichert und im vollständigen JSON-Backup mitgesichert. Die bisherige Speicherung für Jürgen-Punkte, Papierlisten-Daten, Champions, Fotos und Kassenbuchungen bleibt unangetastet. **Dart-Partien erzeugen keine Jürgen-Gebühren.**

## Nicht enthalten

Diese Version ist **keine Kopie von Dartsmind** und enthält **kein Kamera-Autoscoring, keine Online-Lobby und keinen DartBot**. Weitere spezielle Spiele oder Sets können in weiteren Updates ergänzt werden. Die Regeln und die Offline-Spielmaske wurden automatisiert getestet, die iPhone-PWA muss nach dem Upload noch auf dem Gerät geprüft werden.
