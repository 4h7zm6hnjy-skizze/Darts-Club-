# Jürgen Dartkasse – Update 1.3.2

Update für das bestehende GitHub-Pages-Repository `4h7zm6hnjy-skizze/Darts-Club-`.

## Änderungen
- **Jürgen:** 1 Punkt für den Werfer und einmal der eingestellte Preis.
- **Perfekter Jürgen:** Jeder andere gespeicherte Spieler erhält 1 Punkt, auch abwesende und archivierte Spieler. Der Werfer bekommt nur eine Krone, keinen Punkt.
- **Nur ein Gesamtpreis pro perfektem Jürgen:** Der einstellbare Preis wird genau einmal verbucht, egal wie viele Mitspieler einen Punkt erhalten. Die Centbeträge werden gleichmäßig auf deren Spielerforderungen verteilt; unteilbare Rest-Cent werden in der Spieler-Reihenfolge verteilt (Beispiel: 0,30 € bei zwei Mitspielern = 0,15 € pro Spieler).
- **Anzeige:** Statt „2 × 0,30 €“ steht nur noch der Gesamtpreis „0,30 €“ am perfekten Jürgen.
- **Zoom:** Die PWA versucht das versehentliche Pinch- und Doppel-Tipp-Zoom auf dem iPhone zu unterbinden, auch bei Eingabefeldern. iOS-Bedienungshilfen sowie Browser-Verhalten können nicht vollständig blockiert werden.
- **Version 1.3.2:** Versionskennung, Service-Worker-Cache sowie JS/CSS-Versionen angepasst.

## Daten und Sicherheit
- Alte Spieler, Champions, Zahlungen und Kassendaten bleiben unter denselben Speicher-Schlüsseln gespeichert.
- Bereits erfasste perfekte Jürgen **werden nicht rückwirkend umgebucht**. Bestehende Buchungen behalten ihre ursprünglichen Werte. Möchtest du einen alten Eintrag ändern, kannst du ihn stornieren und mit neuer Regel erneut erfassen. Beachte dabei ggf. schon geleistete Zahlungen.
- Vor dem Update unter **Mehr → Vollständiges JSON-Backup** sichern. App nicht löschen und keine Website-Daten löschen.

## Update einspielen
1. ZIP entpacken und alle **sechs Dateien** ins Hauptverzeichnis von `Darts-Club-` hochladen, vorhandene gleichnamige Dateien ersetzen. Nicht die ZIP-Datei hochladen.
2. GitHub Pages veröffentlichen lassen.
3. App mit Internetverbindung öffnen und unter **Mehr → Auf Update prüfen** aktualisieren. Bei festhängender installierter App ggf. die vorhandene Schaltfläche **Aktualisierte App-Dateien neu laden** nutzen.
4. Prüfen, ob Version **1.3.2** und der neue Gesamtpreis auf dem perfekten Jürgen angezeigt werden.
