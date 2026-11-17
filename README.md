# Darts-Club 3.4.0 – Dartabend LIVE

Vollständiges, kostenloses GitHub-Pages-Update auf Basis von Version 3.3.0. Die bestehenden Spieler, Partien, Schnellstart-Favoriten, Trainer, Ranglisten und die Jürgen-Kasse bleiben Bestandteil der App. Das Paket enthält **keine persönlichen Spiel- oder Kassendaten**.

## Verbesserungen in 3.4.0

1. **Klare LAN-Anzeige:** Sichtbarer Verbindungszustand auf Haupthandy und Mitspieler-Handy (verbunden, wird aufgebaut, keine aktuellen Daten, unterbrochen). Ein regelmäßiges lokales Lebenszeichen hilft, stehen gebliebene Anzeigen zu erkennen. Nach Rückkehr in den Vordergrund wird der Spielstand neu angefordert.
2. **Verständliche Kopplung:** Schrittliste für Haupt- und Mitspieler-Handy, Einladung und Antwort werden nur im jeweils relevanten Schritt angezeigt. Mehrere Handys lassen sich einzeln aus der Sitzung trennen. Das Haupthandy gibt jedes Spielerprofil ausdrücklich frei.
3. **Lokaler Gerätecheck:** Prüft WebRTC, sicheren Kontext, QR-Bibliothek, QR-Komprimierung und lokale Wurf-Vormerkung. Er testet **nicht**, ob der WLAN-Router die Kommunikation zwischen Geräten zulässt.
4. **Nicht bestätigte Würfe:** Ein übertragener, aber noch nicht bestätigter Wurf mit unveränderlicher Wurf-ID und den eingegebenen Darts wird lokal vorgemerkt (sofern der Browser lokalen Speicher bereitstellt). Diese Vormerkung kann nach einem App-Neustart innerhalb von sieben Tagen wiederhergestellt werden. Sie ist **keine offiziell gebuchte Aufnahme**.
5. **Statusabgleich nach neuer Kopplung:** Nach Freigabe des Spielerprofils fragt das Mitspieler-Handy nach, ob der vorgemerkte Wurf am Haupthandy bereits gespeichert, zurückgenommen oder noch unbekannt ist. Nur im dritten Fall darf der Benutzer nach Kontrolle des Spielstands denselben Wurf erneut senden.
6. **Doppelbuchungs- und Rücknahme-Schutz:** Der Host erkennt bereits gespeicherte Wurf-IDs und Sperrkennungen zurückgenommener LAN-Aufnahmen. Ein Abbruch erzeugt keine neue Gebührenbuchung.
7. **Lesbarkeit:** Verbindungsstatus und Hinweise sind auf schmalen Handydisplays größer und kontrastreicher; in der LIVE-Ansicht lassen sich Inhalte bei Bedarf scrollen.

## Wichtige technische Grenzen

- **LAN bleibt Beta.** Ohne externen Signalisierungsserver erfordert eine neue Kopplung weiterhin den Austausch von Einladungs- und Antwort-Code per QR/Einfügen. Es gibt **keinen garantierten automatischen Wiederverbindungsaufbau**, und nicht jedes Heim-, Gäste- oder Camping-WLAN lässt eine direkte WebRTC-Verbindung zu.
- Beide Geräte müssen die App und ihre Offline-Dateien zuvor einmal vollständig online geladen haben. Auf iPhone und Android muss die Kommunikation **auf echten Geräten getestet** werden.
- Die Wurf-Vormerkung liegt nur auf dem Mitspieler-Gerät. Ein manuelles Verwerfen verändert keine Daten auf dem Haupthandy. Der Browser kann lokale Daten löschen; deshalb bleibt ein vollständiges **JSON-Backup des Haupthandys** unverzichtbar.
- Bei ausbleibender Bestätigung **nicht blind erneut senden**: Zuerst prüfen, was am Haupthandy wirklich gebucht wurde.
- Die offizielle Speicherung von Spielständen und Jürgen-Gebühren erfolgt ausschließlich auf dem Haupthandy. Keine Cloud, keine kostenpflichtige API.

## Installation

1. Auf dem Haupthandy ein JSON-Backup außerhalb der App sichern.
2. Das ZIP **entpacken** und alle App-Dateien direkt ins Wurzelverzeichnis des bestehenden GitHub-Repositories hochladen (nicht die ZIP selbst als App-Datei).
3. Auf GitHub **Commit changes** bestätigen. Die veröffentlichte Versionsdatei muss `3.4.0` anzeigen.
4. Zuerst auf dem Haupthandy in der App prüfen, ob Spieler, laufende Partien und Kassenbuchungen erhalten geblieben sind.
5. Eine Testpartie auf dem Haupthandy starten, unter **Dartabend LIVE** die lokale Sitzung starten, Einladung erstellen, mit dem zweiten Handy verbinden, Antwortcode übernehmen und das Spielerprofil freigeben. Einen kleinen Testwurf ohne Gebührenbuchung durchführen.

## Durchgeführte Prüfungen

- JavaScript-Syntaxprüfung aller Skripte und Konsistenz des Service-Worker-Caches.
- Browser-Simulation der Wurf-Verarbeitung: 180 Punkte werden genau einmal gebucht; derselbe Wurf mit gleicher Wurf-ID wird bestätigt, aber nicht doppelt gebucht. Nach Rücknahme verhindert eine gespeicherte Sperrkennung die Neubuchung.
- Prüfung von wiederhergestellten, unbestätigten Würfen, erneutem Senden mit identischer ID, Status „gebucht“/„zurückgenommen“, lokalem Verwerfen und der Sperre bei veralteten Verbindungsdaten.
- Mobile Browser-Darstellung bei 320, 390 und 844 Pixeln. Regressionstest für Schnellstart-Favoriten und „Partie fortsetzen“ bestanden.
- **Nicht bestanden bzw. nicht messbar:** In der Testumgebung liefert der echte WebRTC-Browser keine lokalen ICE-Verbindungskandidaten; die Ende-zu-Ende-Verbindung konnte daher **nicht** als bestätigt markiert werden. Praxischeck mit iPhone und Android bleibt erforderlich.
