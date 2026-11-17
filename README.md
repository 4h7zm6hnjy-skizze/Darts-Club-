# Darts-Club 3.4.1 – Lesbarkeit im Spielmodus

Dieses vollständige Paket basiert auf **3.4.0 Dartabend LIVE**. Es enthält keine persönlichen Spieler-, Spiel- oder Kassendaten. Das Update verändert **nicht** die Spielberechnung, die Gebührenlogik oder das bestehende Speicherformat.

## Verbesserungen

- **Checkout-Hinweis:** Der Inhalt kann im iPhone-Vollbild mehrzeilig angezeigt werden, statt nach einer Zeile mit „…“ abgeschnitten zu werden. Der Hinweis bei zu hoher Restpunktzahl lautet kürzer „Noch kein Finish · Punkte senken“.
- **Spieleranzeigen:** Namen, Wurf-Durchschnitt, Restpunktzahl, Dart-Anzahl und Legs mit größerer, kontrastreicher Schrift.
- **X01-Karten:** Statt missverständlichem „Punkte 0“ erscheinen die bereits geworfenen Darts und gewonnenen Legs. Die Punktzahl bleibt groß in der Mitte.
- **Wurfeingabe:** Solange keine Darts eingetragen sind, zeigt die inaktive Taste „Wurf eingeben“. Nach einem Treffer heißt sie wieder „Nächster Spieler“. Inaktive Tasten bleiben deutlich lesbar und sind weiterhin nicht bedienbar.
- **Spieler am Zug:** Verbesserter Kontrast der Kennzeichnung und der Bedienelemente.
- **iPhone-Hoch- und Querformat:** Angepasste Größen bei sehr niedrigen verfügbaren Bildschirmhöhen. Auf besonders schmalen Displays wird der Spieltitel verkürzt, statt abgeschnitten.

## Installation

1. Vorher ein **vollständiges JSON-Backup** der Dartkasse außerhalb der App sichern.
2. ZIP-Datei entpacken und **alle 21 App-Dateien** in das Wurzelverzeichnis des GitHub-Pages-Repositories hochladen.
3. Bei GitHub „Commit changes“ bestätigen.
4. Version `3.4.1` im Browser und auf der installierten iPhone-App prüfen.
5. Vorhandene Spieler, Kassenbuchungen und offene Partien kontrollieren. Browserdaten oder installierte App nicht löschen.

## Tests und Einschränkungen

Automatisierte Tests prüfen Syntax, X01-Wurf- und Rücknahmeverhalten, Datenpersistenz sowie Textdarstellung bei mehreren Bildschirmgrößen. Die Darstellung auf einem tatsächlichen iPhone und die Geräte-zu-Geräte-LAN-Verbindung sind von hier aus nicht vollständig überprüfbar. Der LAN-Modus bleibt Beta.
