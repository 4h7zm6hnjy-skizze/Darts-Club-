# Jürgen – Dartkasse 5 · 20 · 1

**Offlinefähige Web-App (PWA)** für GitHub Pages, Version **1.0.0**.

## Funktionen

- 5, 20 und 1 jeweils Single, Double, Triple zählen
- Spieler anlegen, umbenennen und archivieren
- Grundpreis × Multiplikator oder neun individuelle Preise
- Treffergebühren, offene Beträge und tatsächlich eingezahltes Geld unterscheiden
- Spielerzahlungen, sonstige Einnahmen, Ausgaben und Kassenkorrekturen buchen
- Neue Spielabende, Statistik, Storno, CSV-Export
- Lokale Speicherung, JSON-Backup und Wiederherstellung
- Service Worker für Offlinebetrieb, Versionsanzeige und Update-Knopf

## In GitHub Pages veröffentlichen

1. Unter **https://github.com/new** ein **neues, separates Repository** erstellen, z. B. `Juergen-Dartkasse`. Bei GitHub Free muss es für GitHub Pages **Public** sein. Wähle `main` und erstelle am besten eine anfängliche README-Datei.
2. Lade die **entpackten Dateien aus diesem Projekt** in das Repository. Die `index.html` muss im Repo-Hauptverzeichnis liegen. **Nicht nur die ZIP-Datei hochladen.** Die `.github/workflows/deploy-pages.yml` ist die automatische Veröffentlichungs-Konfiguration.
3. Öffne **Settings → Pages → Build and deployment → Source → GitHub Actions**. GitHub sollte den Workflow nach dem nächsten Commit oder einem manuellen Start unter **Actions** ausführen.
4. Die veröffentlichte Adresse lautet normalerweise `https://4h7zm6hnjy-skizze.github.io/Darts-Club-/`. Prüfe die tatsächlich von GitHub angezeigte URL unter **Settings → Pages**.
5. Öffne die Seite einmal online. Am iPhone in Safari: **Teilen → Zum Home-Bildschirm**. Offlinebetrieb erst nach erfolgreicher erster Online-Installation testen.

### Updates

Bei jeder Änderung am Branch `main` wird die Website durch GitHub Actions neu veröffentlicht.

Bei einem **App-Update** die Versionsnummer *einheitlich* in `app.js` (`APP_VERSION`), `version.json`, `sw.js` (`CACHE_NAME`) sowie der Versionsanzeige in `index.html` ändern. Die App prüft die bereitgestellte `version.json` und bietet bei heruntergeladenem neuem Service Worker **Update installieren** an. Keine automatische Garantie für die Update-Anzeige auf jeder iOS-Version; falls nötig Seite online neu öffnen.

### Datenschutz und Datensicherung

**GitHub enthält nur die App-Dateien.** Spieler und Buchungen verbleiben im lokalen Browser-/App-Speicher (localStorage und IndexedDB), nicht im GitHub-Repository. Ein öffentliches GitHub Pages Repository macht dennoch *den Quellcode und darin abgelegte Dateien öffentlich* – keine persönlichen Daten oder Backups hineinladen.

**Backups:** in der App regelmäßig **JSON-Backup** herunterladen und privat aufbewahren. Browserdaten-Löschung, anderer Browser, anderer Origin oder neues Gerät übertragen gespeicherte Daten nicht automatisch. Bei einem Wechsel von Netlify oder einer lokal gespeicherten Datei zu GitHub Pages müssen die Daten mit JSON-Backup exportiert und auf der GitHub-Pages-App importiert werden.

**Kassenlogik:** Treffer erhöhen die Forderung, nicht das Bargeld. Nur eine Zahlung oder sonstige Einnahme erhöht den Kassenstand. Ausgaben und Korrekturen verändern den Kassenstand; Preisänderungen wirken erst für neue Treffer.

**Spielregeln:** Die App nutzt 5 / 20 / 1 und Single / Double / Triple als frei konfigurierbare Gebührenfelder. Weitere ortsübliche Regeln für „Jürgen“ sind nicht fest einprogrammiert.

### Technisches

Keine externen Bibliotheken, kein Backend, kein Login, keine Werbe-/Tracking-Skripte, keine kostenpflichtige API. Alle Asset-Pfade sind relativ, damit die App sowohl unter `/` als auch unter GitHub Pages Projekt-Pfaden (`/Juergen-Dartkasse/`) funktioniert. Der Webserver muss HTTPS verwenden, damit Installation und Service Worker aktiv werden.

## GitHub-Verbindung für dieses Repository

Falls GitHub beim automatischen Hochladen `403 Resource not accessible by integration` meldet, unter <https://github.com/settings/installations/178891315> die Installation konfigurieren: `Repository access` > `Only select repositories` > `Darts-Club-` hinzufügen > Speichern. Das ist eine Berechtigung für den Code-Zugriff, keine Veröffentlichung persönlicher Kassen- oder Spielerdaten.
