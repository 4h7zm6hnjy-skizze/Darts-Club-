# JÜRGEN DARTKASSE – Update 1.9.0

Dieses Update enthält **alle Funktionen aus 1.8.0** und die Erweiterungen von 1.9.0. Version 1.8.0 muss vorher nicht separat installiert werden.

## Neu im Spielmodus

- **X01 Best-of-Sets:** Wahl zwischen 1, 3 und 5 Sets; ein Set besteht aus der gewählten Anzahl von Legs (Best of 1/3/5/7/9). Aktuelle Sets und Legs werden angezeigt.
- **Checkout-Anzeige:** mathematisch gültige Finish-Wege für bis zu drei verbleibende Darts, einschließlich Bullseye als Doppel-25. Für ausgewählte Werte sind häufig verwendete Wege hinterlegt. Die Anzeige gibt mögliche Wege, keinen garantierten Treffer an.
- **Live-Werte:** 3-Dart-Average des Werfers, mögliche Entwicklung mit den gerade erfassten Darts, Restpunkte und BUST-Hinweis.
- **Caller:** optional einschaltbare Sprachausgabe nach der Aufnahme; Verfügbarkeit und verwendete Stimme hängen von Safari/iOS bzw. dem Browser ab.
- **Spielerstatistik:** echte PPR-Verlaufsgrafik abgeschlossener X01-Legs, PPR, First-9, Checkout-%, höchste Finishes, Win-%, 60+/100+/140+/180 und Cricket MPR. Filter Letzte 10 / 100 / 1000 / Alle Spiele und Datum/Modus.
- **Jürgen im Spiel:** Nur passende drei Treffer werden mitgebucht: Zahlen 1, 5, 20 je Single/Double = Jürgen; T1/T5/T20 = Perfekter Jürgen. Die Buchung wird auf dem lokalen Datum der Partie erfasst. Beim Rückgängigmachen einer Aufnahme wird ihre verknüpfte Jürgen-Gebühr mit storniert; beim Löschen einer Partie wird dies ausdrücklich bestätigt.

## Unverändert

- Bisherige Spieler, Profilfotos, Papierliste, Champions, Spielstände und Kassenbuchungen bleiben gespeichert.
- Perfekter Jürgen: ein einmaliger Gesamtpreis, 1 Punkt für **alle anderen** gespeicherten Spieler, keiner für den Werfer.
- Kein Konto und keine externen Datenübertragungen. Die App speichert weiterhin im bisherigen lokalen Browser-Speicher.

## Installation auf GitHub

1. In der alten App unter **Mehr → Vollständiges JSON-Backup** zuerst eine Sicherung speichern.
2. ZIP entpacken.
3. Die **8 Dateien direkt im Hauptverzeichnis** von `Darts-Club-` hochladen und vorhandene Dateien ersetzen.
4. Änderungen committen und nach Veröffentlichung auf Version **1.9.0** prüfen.

## Teststand

- Tests mit Node.js für alle Checkout-Werte 1–170, 1–3 Darts, Double-Out, Best-of-3-Sets, Backup-Kompatibilität und Rücknahme: bestanden.
- JavaScript-Syntax und DOM-ID-Verknüpfungen: geprüft.
- Mobiler Browser-Funktionstest: **nicht abgeschlossen**; der lokale Webseitenaufruf wurde durch die Testumgebung blockiert. Bitte auf dem iPhone nach dem Upload prüfen.
- Die Sprachausgabe erfordert eine vom Gerät bereitgestellte Sprache; Offline-Unterstützung wird nicht garantiert.
