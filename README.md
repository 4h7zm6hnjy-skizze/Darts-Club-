# Jürgen Dartkasse – Update 1.3.1 / Safari-Reparatur

Dieses Paket ersetzt nur die sechs Programmdateien `index.html`, `app.js`, `styles.css`, `sw.js`, `version.json` und `README.md` im bestehenden Repository `4h7zm6hnjy-skizze/Darts-Club-`.

## Problem
Die iPhone-Web-App kann nach Veröffentlichung einer neuen Version in Safari / als Home-Bildschirm-App noch alte JavaScript- oder CSS-Dateien aus dem lokalen Service-Worker-Cache verwenden. Dann zeigt sie weiterhin v1.2.1, obwohl GitHub die neue Version meldet.

## Behebung
- HTML lädt nun `styles.css?v=1.3.1` und `app.js?v=1.3.1`, um alte Cache-Einträge zu umgehen.
- Der Service Worker lädt die App-Navigation ohne HTTP-Cache und hält versionsgebundene Dateien offline bereit.
- Ein neuer Button **Aktualisierte App-Dateien neu laden** öffnet die App mit einer frischen Adresse. Es wird kein lokaler Speicher gelöscht.
- Version 1.3.1 nutzt exakt dieselben lokalen Speicher-Schlüssel und die gleiche Datenstruktur. Alle Funktionen von 1.3.0 bleiben erhalten.

## Installation auf GitHub
1. In der alten App ein JSON-Backup erstellen.
2. ZIP-Datei entpacken.
3. Alle sechs Dateien in das **Hauptverzeichnis** von `Darts-Club-` hochladen und gleichnamige Dateien ersetzen.
4. Auf GitHub committen und die GitHub-Pages-Veröffentlichung abwarten.
5. Die Web-App **nicht löschen**. Zum ersten Test direkt in Safari öffnen: `https://4h7zm6hnjy-skizze.github.io/Darts-Club-/?app-refresh=1.3.1`.
6. Falls die installierte App weiter 1.2.1 anzeigt, wird das Update durch iOS noch nicht vollständig übernommen. Verwende zunächst das JSON-Backup und belasse die alte App unangetastet.
