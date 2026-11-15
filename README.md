# Darts-Club – Jürgen Dartkasse

**Version 1.2.0** – eigenständige, offlinefähige Web-App (PWA) für GitHub Pages.

## Neue Spielregeln

- **Jürgen:** Ein Tipp gibt dem ausgewählten Werfer **1 Punkt**.
- **Perfekter Jürgen:** Ein Tipp gibt **jedem anderen gespeicherten Spieler 1 Punkt**, aber **nie dem Werfer selbst**. Das gilt ausdrücklich auch für archivierte Spieler. Ein perfekter Jürgen ist nur möglich, wenn mindestens eine weitere Person gespeichert ist.
- **Kronen:** Für jeden eigenen perfekten Jürgen bekommt der Werfer eine Krone in der Statistik.
- **Preis:** Ein einziger, frei änderbarer Preis **pro Punkt**, gleich bei beiden Buttons. Ein perfekter Jürgen berechnet den Preis für jeden anderen Spieler einzeln. Preisänderungen wirken sich nur auf neue Buchungen aus.
- **Rückgängig:** Ein perfekter Jürgen wird als gemeinsames Ereignis mit allen zugehörigen Punkten und Kosten zurückgenommen.

Die neun Single-/Double-/Triple-Buttons wurden durch **zwei große Schaltflächen** ersetzt. Die Eingabe des genauen getroffenene Feldes entfällt.

## Kassenlogik

Die Punkte erzeugen zunächst offene Beiträge pro Spieler. Nur **tatsächliche Zahlungen** und sonstige Einnahmen erhöhen den Kassenstand. Ausgaben mindern ihn. Im Kassenbuch können Zahlungen verbucht, Ausgaben und Einnahmen gespeichert und Korrekturen vorgenommen werden.

## Bestehende Daten

Die App benutzt unverändert den lokalen Speicher-Namen `juergen-dartkasse-state-v1` sowie die IndexedDB `juergen-dartkasse`. Dadurch können vorhandene Spieler und Kassenbuchungen aus v1.0.x/v1.1.0 erhalten bleiben. Alte Einträge werden nicht automatisch neu abgerechnet. Die älteren JSON-Backups lassen sich weiterhin importieren.

**Wichtig:** Vor jedem Update aus der bisherigen App ein JSON-Backup erstellen. Die App bei einem Update nicht deinstallieren und die Safari-Website-Daten nicht löschen.

## GitHub Pages – Update aufspielen

1. Diese ZIP-Datei **entpacken**.
2. `https://github.com/4h7zm6hnjy-skizze/Darts-Club-/upload/main` öffnen.
3. Die **entpackten Dateien** im Stammverzeichnis von `main` hochladen bzw. bestehende Dateien gleichen Namens ersetzen. Mindestens `index.html`, `app.js`, `styles.css`, `sw.js`, `version.json`, `icon.svg`, `icon-192.png`, `icon-512.png` und `apple-touch-icon.png` müssen aktualisiert werden. Die ZIP-Datei selbst ist nicht die Website.
4. Commit ausführen. GitHub Pages ist für **Deploy from a branch → main → /(root)** vorgesehen.
5. Website: `https://4h7zm6hnjy-skizze.github.io/Darts-Club-/`.
6. Nach der Veröffentlichung in der App **Mehr → Auf Update prüfen** auswählen. Der Browser kann das Update erst installieren, sobald der neue Service Worker zur Verfügung steht.

## Datenschutz

Spieler, Treffer, Gebühren und Zahlungen bleiben im lokalen Gerätespeicher. GitHub enthält nur den App-Code. Die Datensicherung ist ein lokaler JSON-Dateiexport; CSV-Export ist ebenfalls möglich.
