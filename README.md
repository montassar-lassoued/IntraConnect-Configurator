# 🏗️ IntraConnect Configurator & Visualizer

Ein spezialisierter grafischer Editor zur Generierung komplexer **SystemConfig-Dateien (XML)** für Materialfluss-Steuerungssysteme (MFCS). Das Tool schließt die Lücke zwischen manuellem XML-Coding und intuitiver Anlagenplanung.

## 🌟 Kernkonzept
Anstatt tausende Zeilen XML-Konfiguration händisch zu pflegen, ermöglicht dieser Editor die visuelle Planung von Intralogistik-Anlagen. Er generiert automatisch validierte Strukturen für:
* **Kommunikationswege** (TCP/UDP, Processors)
* **Physisches Layout** (Gassen, RBGs, Fördertechnik)
* **Logische Prozesse** (Routing-Tabellen, Lagerplatz-Berechtigungen)

## 🛠️ Features & Module

### 🏗️ Layout & Visualisierung
* **Aisle-Management:** Platzierung von Gassen mit/ohne Regalbediengeräte (SRM/RBG).
* **Fördertechnik:** Zeichnen von Förderstrecken mit automatischer Generierung von **Nodes** und **Targets**.
* **Ebenen-Verwaltung:** Support für mehrere Stockwerke (Ebene 1, Ebene 2, etc.) innerhalb einer Konfiguration.

### 📡 Kommunikation (`Modules`)
* **Netzwerk-Konfiguration:** Definition von TCP/UDP-Connectables (Host, Port, Timeout).
* **Logical Mapping:** Zuweisung von Java-Prozessorklassen zu physischen oder logischen Endpunkten.

### 📦 Lagerlogik (`StockMovement`)
* **SRM/RBG Konfiguration:** Detaillierte Definition von Rack-Sides, Ranges und Gabel-Eigenschaften (LHD).
* **Loadunit-Management:** Definition von Kategorien (A, B, C) und physischen Abmessungen.
* **Permission-System:** Visuelle Zuweisung von Einlager-Berechtigungen auf Basis von Fachgrößen oder Gewichtsklassen.

## 📄 Output-Beispiel
Das Tool transformiert das grafische Layout in das MFCS-Zielformat:

```xml
<SystemConfig>
    <Modules>
        <Module name="TCP" enabled="true">
            <Connectable name="Controller_X" active="false">
                <Connection><Host>localhost</Host><Port>1200</Port></Connection>
                <Processor name="Data_processing" />
            </Connectable>
        </Module>
        <Module name="StockMovement" enabled="true">
            <Nodes>
                <Node point="S001" controller="Connectable_1">
                    <Target point="S002" direction="S" cost="100"/>
                </Node>
            </Nodes>
        </Module>
    </Modules>
</SystemConfig>
```
🚀 Technischer Stack
    Framework: Angular (Standalone Components)
    Grafik: SVG (Scalable Vector Graphics) für performante Echtzeit-Interaktion
    State: RxJS-basierter Service-Store
    
Hier siehst du einen Überblick, wie die Simulation eines Lager-Layouts sowie die Modul-Konfiguration in der Anwendung aussieht:

![Demo: Lager-Layout Simulation](./pfad/zu/deinem/video.gif)

* **Links:** Einstellung der Modul-Parameter (Regaltypen, Abstände).
* **Rechts:** Echtzeit-Visualisierung des resultierenden Layouts.

<img width="1594" height="884" alt="System-Konfigurator" src="https://github.com/user-attachments/assets/d38e8c0a-c2c7-47e9-829d-b7cb8c868692" />

## 🗺️ Roadmap & Geplante Module

Das Tool ist modular aufgebaut, um eine nahtlose Erweiterung der MFCS-Konfiguration zu ermöglichen. Folgende Schnittstellen und Module befinden sich in der Planung:

* **🔌 OPC UA Module:** Direkte Anbindung an speicherprogrammierbare Steuerungen (SPS).
* **📡 MQTT Broker Integration:** Für modernste IoT-Kommunikation im Lager.
* **💼 SAP Interface:** Konfiguration von IDoc- oder RFC-Schnittstellen zur ERP-Anbindung.
* **🌙 NightJob Manager:** Zeitgesteuerte Aufgaben wie Datenbank-Bereinigungen oder Reorganisationen.
* **📊 Inventory Dashboard:** Echtzeit-Visualisierung von Lagerbeständen direkt im Layout.

## 🛠️ Entwicklung & Installation

Wenn du das Projekt lokal starten möchtest:

1. Repository klonen
2. `npm install` ausführen
3. `ng serve` für einen Dev-Server
4. Navigiere zu `http://localhost:4200/`. Die App aktualisiert sich automatisch bei Code-Änderungen.

---

### ℹ️ Angular CLI Information
This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.17. 
To get more help on the Angular CLI use `ng help` or check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
