# Jürgen Dartkasse 2.1.0 – Dartabend LIVE (LAN-Beta)

**iPhone + Android ohne Internetdienst:** WebRTC DataChannel über ein gemeinsames WLAN. Ein lokaler Router ohne Internet ist möglich, sofern die Geräte miteinander kommunizieren dürfen. Auf jedem Handy die Web-App vorab einmal online in Safari/Chrome öffnen, damit sie offline gespeichert wird.

1. Bestehendes JSON-Backup auf dem Haupthandy erstellen.
2. Unter **Spielen** eine Partie starten; unter **Live** auf dem Haupthandy eine Sitzung starten.
3. **Weiteres Handy verbinden** erzeugt einen QR-Code. Der Mitspieler scannt ihn mit der normalen Handykamera und öffnet den Link (bzw. fügt den Code unter Live ein).
4. Auf dem Mitspielerhandy **Verbindung vorbereiten** und dessen Antwort-QR öffnen.
5. Der Spielleiter scannt den Antwortcode mit der normalen Handykamera, kopiert ihn und fügt ihn in der ursprünglichen App unter **Antwort übernehmen** ein.
6. Der Mitspieler fragt sein Profil an. Der Spielleiter bestätigt es. Danach erscheinen Punkte und aktive Partie live.
7. Jeder Spieler kann seinen Wurf erfassen. **Nur das Haupthandy speichert Partien, Jürgen-Punkte und Geldforderungen**. Keine Übertragung des Kassenbuchs an Teilnehmer.

**Wichtig:** Keine Garantie für jedes WLAN. Einige Hotspots/Router blockieren direkte Verbindungen (AP-Isolation, mDNS). Reine QR-Kopplung kann auf iOS den Wechsel zwischen Kamera/Safari und der PWA erfordern. Scannen der QR-Codes über die normale Kamera statt der nicht allgemein verfügbaren Safari-BarcodeDetector-API.

Das Paket enthält ausschließlich die geänderten Programmdateien, keine persönlichen Daten. Die App-Logos aus v2.0.0 bleiben vorhanden. Offline-WebRTC zwischen verschiedenen tatsächlichen iPhones und Android-Geräten ist **nicht** durch die automatisierten Tests abgedeckt; dies ist ein zu testender Beta-Modus.
