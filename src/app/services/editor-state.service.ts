import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable,map,merge } from 'rxjs';
import { RectShape } from '../domain/rectangle.model';
import { Arrow } from '../domain/arrow.model';
import { Aisle } from '../domain/aisle.model';
import { LayerConfig } from '../domain/layer';
import { Processor } from '../domain/config/processor.model';
import { ConfigNode } from '../domain/config/module-rules.config';
import { MODULE_CONFIG_RULES } from '../domain/config/module-rules.config';
import { TagDefinition } from '../domain/config/module-rules.config';
import { ModuleRule } from '../domain/config/module-rules.config';


export type EditorMode = 'select' | 'draw-rect' | 'draw-arrow'
                         | 'draw-aisle-SRM' | 'draw-aisle'
                         | 'draw-processor';

export type ViewMode = 'processors' | 'modules' | 'visualization' | 'layer-overview';;

@Injectable({ providedIn: 'root' })
export class EditorStateService {

  // Check für Export
  public isDirty = false;
    // Visu -Layer Daten
    private layers$ = new BehaviorSubject<LayerConfig[]>([]);
    // Welches Layer in der Visu ist aktuell aktiv
    private activeLayerId$ = new BehaviorSubject<string | null>(null);
  // welche View ist aktiv
  private view$ = new BehaviorSubject<ViewMode>('visualization');
  private mode$ = new BehaviorSubject<EditorMode>('select');
  // Modules
  private modules$ = new BehaviorSubject<ConfigNode[]>([]);
  //Processors
  private processors$ = new BehaviorSubject<Processor[]>([]);
  // Subjects für die Daten
  private rects$ = new BehaviorSubject<RectShape[]>([]);
  private arrows$ = new BehaviorSubject<Arrow[]>([]);
  private aisles$ = new BehaviorSubject<Aisle[]>([]);
  //Selected
  private selected$ = new BehaviorSubject<any[]>([]);
  //weitere
  public availableControllers: string[] = [];
  private currentFileName = 'SystemConfig.xml';
  public fullXmlContent = '';

 constructor() {
    // Erstelle einen "Dirty-Check" Stream
    merge(
      this.modules$,
      this.processors$,
      this.rects$,
      this.arrows$,
      this.aisles$,
      this.layers$
    ).subscribe(() => {
      this.isDirty = true;
    });
  }

// setter -Aktives Visulayer
  setActiveLayer(id: string) {
    this.activeLayerId$.next(id);
    this.setView('visualization');
  }
// Layer getter
    getLayers$() { return this.layers$.asObservable(); }
    getActiveLayerId$() { return this.activeLayerId$.asObservable(); }
    getActiveLayerId(): string {return this.activeLayerId$.value || '';}
  // View & Mode Getter/Setter
  getModules$() { return this.modules$; }
  getView$() { return this.view$.asObservable(); }
  setView(v: ViewMode) { this.view$.next(v); }
  getMode$() { return this.mode$.asObservable(); }
  getMode(): EditorMode { return this.mode$.value; }
  setMode(m: EditorMode) { this.mode$.next(m); }
  // Daten Getter
  getRects$() { return this.rects$.asObservable().pipe(map(rects => rects.filter(r => r.layerId === this.getActiveLayerId()))); }
  getArrows$() { return this.arrows$.asObservable().pipe(map(arrows => arrows.filter(a => a.layerId === this.getActiveLayerId()))); }
  getAisles$() { return this.aisles$.asObservable().pipe(map(aisles => aisles.filter(ai => ai.layerId === this.getActiveLayerId()))); }
  getProcessors$() { return this.processors$.asObservable(); }
  getSelected$() { return this.selected$.asObservable(); }
  // Selektion
  setSelected(val: any[]) { this.selected$.next(val); }
  clearSelection() { this.selected$.next([]); }
  // --- HIER SIND DIE FEHLENDEN METHODEN (FIX FÜR DEINE FEHLER) ---
  /** Behebt TS2339: Property 'updateRects' */
  updateRects(r: RectShape[]) {this.rects$.next(r);}
  /** Behebt TS2339: Property 'updateArrows' */
  updateArrows(a: Arrow[]) {this.arrows$.next(a);}
  /** Behebt TS2339: Property 'updateAisles' */
  updateAisles(a: Aisle[]) {this.aisles$.next(a);}
  /** Behebt den Fehler in der Editor-Liste */
  updateProcessors() {this.processors$.next([...this.processors$.value]);}
  /** Behebt NG9: Property 'removeProcessor' */
  removeProcessor(p: Processor) {
    const updated = this.processors$.value.filter(proc => proc.id !== p.id);
    this.processors$.next(updated);
    this.clearSelection();
  }

  getAvailableControllers(): string[] {
    return this.availableControllers;
  }
// visu-Layer
 addLayer(name: string) {
    if (!name) return;
    const newLayer: LayerConfig = {
      id: 'layer_' + Date.now(),
      name: name // Visu-name / ID
    };
    this.layers$.next([...this.layers$.value, newLayer]);
  }
  removeLayer(id: string) {
    const updated = this.layers$.value.filter(l => l.id !== id);
    this.layers$.next(updated);

    // WICHTIG: Wenn der aktive Layer gelöscht wird, ID zurücksetzen
    if (this.activeLayerId$.value === id) {
      this.activeLayerId$.next(null);
      this.setView('layer-overview');
    }

    // Daten dieses Layers löschen
    this.rects$.next(this.rects$.value.filter(r => r.layerId !== id));
    this.arrows$.next(this.arrows$.value.filter(a => a.layerId !== id));
    this.aisles$.next(this.aisles$.value.filter(a => a.layerId !== id));
  }

  /** Erweitertes addProcessor für Klicks auf Canvas oder Button */
  addProcessor(coords?: { x: number, y: number }) {
    const newProc: Processor = {
      id: 'P' + Date.now(),
      name: 'New_Processor_' + (this.processors$.value.length + 1),
      class: 'com.intra.Default',
      x: coords?.x ?? 100,
      y: coords?.y ?? 100
    };
    this.processors$.next([...this.processors$.value, newProc]);
  }
// Methode zum Hinzufügen eines Rechtecks
  addRect(rect: RectShape) {
    const newRect: RectShape = {
      id: 'R' + Date.now(),
      name: 'ST' + (this.rects$.value.length + 1),
      x: rect.x,
      y: rect.y,
      width: 45,
      height: 45,
      controller: '',
      layerId: this.activeLayerId$.value || '',
      transitPoint:false,
    };
    this.rects$.next([...this.rects$.value, newRect]);
  }
addAisle(aisle: Aisle) {
    this.aisles$.next([...this.aisles$.value, aisle]);
  }
// Methode zum Hinzufügen eines Pfeils
addArrow(arrow: Arrow) {
  const current = this.arrows$.value;
  // Wir erstellen eine KOPIE des Arrays. Das ist entscheidend für Angular!
  this.arrows$.next([...current, arrow]);
}

// --- MODUL LOGIK ---
  /** Fügt ein Hauptmodul (Persistence, TCP, etc.) hinzu */
  addModule(moduleName: string) {
      const newNode: ConfigNode = {
        id: 'M' + Date.now(),
        tag: 'Module',
        attributes: { name: moduleName, enabled: 'true' },
        children: [],
        isOpen: true
      };
      this.modules$.next([...this.modules$.value, newNode]);
    }

    updateModules() {
      this.modules$.next([...this.modules$.value]);
    }

    // Hilfsmethode für das HTML (type unknown fix)
getPossibleChildren(node: ConfigNode): string[] {
  // 1. Finde heraus, welche Sektionen für diesen Knoten laut Regel erlaubt sind
  let allowedSections: string[] = [];

  if (node.tag === 'Module') {
    const rule = this.getRuleForNode(node);
    allowedSections = rule ? rule.allowedTopLevelSections : [];
  } else {
    const def = this.getTagDefinition(node, node.tag);
    allowedSections = def ? def.childSections : [];
  }

  // 2. Filter die Liste: Wenn allowMultiple false ist, darf der Tag noch nicht existieren
  return allowedSections.filter((childTagName: string) => {
    const childDef = this.getTagDefinition(node, childTagName);

    // Wenn keine Definition gefunden oder Mehrfach erlaubt -> OK
    if (!childDef || childDef.allowMultiple) return true;

    // Wenn nur einer erlaubt -> Prüfen ob er schon in den Kindern existiert
    const alreadyExists = node.children.some(c => c.tag === childTagName);
    return !alreadyExists;
  });
}
hasTextChildren(node: ConfigNode): boolean {
  return node.children ? node.children.some(c => c.isTextTag) : false;
}
    private getActiveModuleContext(node: ConfigNode): string {
      // Durchsuche die Regeln nach dem Tag
      return Object.keys(MODULE_CONFIG_RULES).find(key =>
        MODULE_CONFIG_RULES[key].definitions[node.tag]
      ) || '';
    }

  addChildFromSchema(parent: ConfigNode, tagName: string) {
    const possible = this.getPossibleChildren(parent);
    if (!possible.includes(tagName)) {
      console.warn(`Tag ${tagName} ist hier nicht (mehr) erlaubt!`);
      return;
    }

    const context = this.getActiveModuleContext(parent) || parent.attributes['name'];
    const definition = MODULE_CONFIG_RULES[context]?.definitions[tagName];

    const newNode: ConfigNode = {
      id: 'ID' + Math.random(),
      tag: tagName,
      attributes: {},
      children: [],
      isOpen: true,
      // --- NEU: Reihenfolge aus der Config merken ---
      attributeOrder: definition?.attributes || []
    };

    if (definition?.attributes) {
      definition.attributes.forEach(a => newNode.attributes[a] = '');
    }

    // TextTags (wie Username)
    if (definition?.textTags) {
      definition.textTags.forEach(t => {
        newNode.children.push({
          id: 'T' + Math.random(),
          tag: t,
          attributes: {},
          children: [],
          textContent: '',
          isTextTag: true,
          attributeOrder: [] // TextTags haben meist keine Attribute
        });
      });
    }

    parent.children.push(newNode);
    this.updateModules();
  }

    removeModule(mod: ConfigNode) {
      this.modules$.next(this.modules$.value.filter(m => m !== mod));
    }

/** Entfernt einen Knoten aus einer Liste (z.B. eine Database aus einem Modul) */
removeNode(list: ConfigNode[], node: ConfigNode) {
  const index = list.indexOf(node);
  if (index > -1) {
    list.splice(index, 1);
    this.updateModules();
  }
}

private getRuleForNode(node: ConfigNode): ModuleRule | null {
  // Wenn der Knoten ein Modul ist, nimm den Namen aus den Attributen (z.B. "Persistence")
  if (node.tag === 'Module') {
    const modName = node.attributes['name'];
    return MODULE_CONFIG_RULES[modName] || null;
  }

  // Ansonsten suchen wir in allen Modulen nach der Definition für diesen Tag
  for (const mod in MODULE_CONFIG_RULES) {
    const rule = MODULE_CONFIG_RULES[mod];
    if (rule.definitions[node.tag]) {
      return rule;
    }
  }
  return null;
}

private getTagDefinition(node: ConfigNode, tagName: string): TagDefinition | null {
  const rule = this.getRuleForNode(node);
  return rule ? rule.definitions[tagName] : null;
}

deleteSelected() {
  const selectedIds = this.selected$.value.map(s => s.id);

  this.rects$.next(this.rects$.value.filter(r => !selectedIds.includes(r.id)));
  this.arrows$.next(this.arrows$.value.filter(a =>
    !selectedIds.includes(a.id) &&
    !selectedIds.includes(a.fromRectId) &&
    !selectedIds.includes(a.toRectId)
  ));
  this.aisles$.next(this.aisles$.value.filter(a => !selectedIds.includes(a.id)));
  this.processors$.next(this.processors$.value.filter(p => !selectedIds.includes(p.id)));

  this.clearSelection();
}

/******Speichern und Auslesen********* */
// --- IMPORT ---
    loadConfigXml(file: File) {
      this.currentFileName = file.name;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.fullXmlContent = e.target.result;
        this.importFromXml(this.fullXmlContent);
      };
      reader.readAsText(file);
    }
  private importFromXml(xmlString: string) {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");

      // alte Daten löschen
          this.modules$.next([]);       // XML-Module leeren
          this.rects$.next([]);         // Prozessoren (Rechtecke) leeren
          this.arrows$.next([]);        // Pfeile leeren
          this.aisles$.next([]);        // Gassen leeren
          this.selected$.next([]);      // Auswahl aufheben
          this.processors$.next([]); // Prozessoren leeren
          this.availableControllers = [];

      // 2. PROZESSOREN EINLESEN
        const processorsWrapper = xmlDoc.getElementsByTagName("Processors")[0];
        if (processorsWrapper) {
          const procElements = Array.from(processorsWrapper.getElementsByTagName("Processor"));
          const loadedProcessors: Processor[] = procElements.map(el => ({
            id: 'P' + Math.random().toString(36).substr(2, 9), // Neue ID generieren
            name: el.getAttribute("name") || 'Unnamed Processor',
            class: el.getAttribute("class") || '',
            // Falls du X/Y Koordinaten im XML hast, hier auslesen:
            x: Number(el.getAttribute("x")) || 100,
            y: Number(el.getAttribute("y")) || 100
          }));
          this.processors$.next(loadedProcessors);
        }

        // 3. CONTROLLER SCAN (Zuerst, damit Dropdowns Daten haben)
        this.scanControllers(xmlDoc);
      // 1. Module einlesen (Rekursiv für den Baum-Editor)
      const modulesContainer = xmlDoc.getElementsByTagName("Modules")[0];
      if (modulesContainer) {
        const moduleElements = Array.from(modulesContainer.children).filter(el => el.tagName === 'Module');
        const nodes = moduleElements.map(modEl => this.xmlToConfigNode(modEl as Element));
        this.modules$.next(nodes);
      }

      // 2. Visu-Daten extrahieren (Speziell für das UI-Modul)
      const allVisus = Array.from(xmlDoc.getElementsByTagName("Visu"));
        const allRects: RectShape[] = [];
        const allArrows: Arrow[] = [];
        const allAisles: any[] = []; // Typ Aisle[]
        const loadedLayers: LayerConfig[] = [];

        allVisus.forEach(visu => {
          // LAYER REGISTRIEREN
          const layerId = visu.getAttribute("layer") || ('layer_' + Math.random().toString(36).substr(2, 5));
          const layerName = visu.getAttribute("id") || 'Unbenannte Visu';

          loadedLayers.push({ id: layerId, name: layerName });

          // RECTS
          const rectEls = visu.getElementsByTagName("Rect");
          Array.from(rectEls).forEach(el => {
            allRects.push({
              id: el.getAttribute("id") || '',
              name: el.getAttribute("name") || '',
              x: Number(el.getAttribute("x")),
              y: Number(el.getAttribute("y")),
              width: Number(el.getAttribute("width")),
              height: Number(el.getAttribute("height")),
              controller: el.getAttribute("controller") || '',
              transitPoint: Boolean(el.getAttribute("transit-point") || 'false'),
              layerId: layerId // Wir nutzen die ID des aktuellen Visu-Tags
            });
          });

          // ARROWS
          const arrowEls = visu.getElementsByTagName("Arrow");
          Array.from(arrowEls).forEach(el => {
            const wpAttr = el.getAttribute("waypoints");
            allArrows.push({
              id: el.getAttribute("id") || '',
              fromRectId: el.getAttribute("from") || '',
              fromSide: el.getAttribute("fromSide") as any,
              toRectId: el.getAttribute("to") || '',
              toSide: el.getAttribute("toSide") as any,
              type: el.getAttribute("type") as any,
              speed: Number(el.getAttribute("speed") || 5),
              direction: el.getAttribute("direction") as any,
              cost: Number(el.getAttribute("cost") || 100),
              layerId: layerId,
              waypoints: wpAttr ? wpAttr.split(';').filter(s => s).map(p => {
                const c = p.split(',');
                return { x: Number(c[0]), y: Number(c[1]) };
              }) : []
            });
          });

          // AISLES (GASSEN) - KORRIGIERT
          const aisleEls = visu.getElementsByTagName('Aisle');
          Array.from(aisleEls).forEach(el => {
            const rbgList = el.getElementsByTagName("RBG");
            let rbgData = undefined;

            if (rbgList.length > 0) {
              const rEl = rbgList[0];
              rbgData = {
                id: rEl.getAttribute("id") || '',
                name: rEl.getAttribute("name") || '',
                controller: rEl.getAttribute("controller") || '',
                positionOffset: Number(rEl.getAttribute("positionOffset") || 0),
                width: Number(rEl.getAttribute("width") || 20),
                height: Number(rEl.getAttribute("height") || 30)
              };
            }

            allAisles.push({
              id: el.getAttribute("id") || '',
              name: el.getAttribute("name") || '',
              x: Number(el.getAttribute("x")),
              y: Number(el.getAttribute("y")),
              width: Number(el.getAttribute("width")),
              height: Number(el.getAttribute("height")),
              orientation: el.getAttribute("orientation") || 'horizontal',
              layerId: layerId,
              rbg: rbgData
            });
          });
        });

        // 4. DATEN AN STREAMS SENDEN
        this.layers$.next(loadedLayers);
        this.rects$.next(allRects);
        this.arrows$.next(allArrows);
        this.aisles$.next(allAisles);

      this.scanControllers(xmlDoc);
    }

// --- EXPORT ---
  saveToXml() {
    const xmlDoc = document.implementation.createDocument(null, "SystemConfig");
    const root = xmlDoc.documentElement;
    //Prozessoren generieren
    const procWrapper = xmlDoc.createElement("Processors");
    this.processors$.value.forEach(proc => {
      const p = xmlDoc.createElement("Processor");
      p.setAttribute("name", proc.name);
      p.setAttribute("class", proc.class);
      procWrapper.appendChild(p);
    });
    root.appendChild(procWrapper);

    // 2. Module generieren
    const modulesWrapper = xmlDoc.createElement("Modules");
    this.modules$.value.forEach(modNode => {
      const modEl = this.configNodeToXml(xmlDoc, modNode);

      // Falls es das UI Modul ist, injizieren wir die aktuelle Visu
      if (modNode.attributes['name'] === 'UI') {
        this.injectVisu(xmlDoc, modEl);
      }
      // Falls es StockMovement ist, injizieren wir die Nodes
      if (modNode.attributes['name'] === 'StockMovement') {
        this.injectStockNodes(xmlDoc, modEl);
      }

      modulesWrapper.appendChild(modEl);
    });
    root.appendChild(modulesWrapper);

    const finalXml = '<?xml version="1.0" encoding="UTF-8"?>\n' + this.xmlToString(xmlDoc);
    this.downloadFile(finalXml, this.currentFileName, 'application/xml');
  }

  // --- REKURSIVE WANDLER ---
 private xmlToConfigNode(el: Element): ConfigNode {
   const node: ConfigNode = {
     id: crypto.randomUUID(),
     tag: el.tagName,
     attributes: {},
     children: [],
     textContent: '',
     isTextTag: false,
     attributeOrder: [] // Initial leer
   };

   // --- NEU: Regel suchen und Reihenfolge im Knoten cachen ---
   const rule = this.getRuleForNode(node);
   if (rule && rule.definitions[el.tagName]) {
     node.attributeOrder = rule.definitions[el.tagName].attributes;
   }

   Array.from(el.attributes).forEach(a => node.attributes[a.name] = a.value);

   if (el.children.length === 0 && el.textContent?.trim()) {
     node.textContent = el.textContent;
     node.isTextTag = true;
   } else {
     Array.from(el.children).forEach(child => {
       if (child.tagName !== 'Visualization' && child.tagName !== 'Nodes') {
         node.children.push(this.xmlToConfigNode(child));
       }
     });
   }
   return node;
 }

 private configNodeToXml(doc: Document, node: ConfigNode): Element {
   const el = doc.createElement(node.tag);
   Object.keys(node.attributes).forEach(k => el.setAttribute(k, node.attributes[k]));

   if (node.isTextTag) {
     // Falls node.textContent undefined ist, weise null zu (textContent akzeptiert null)
     el.textContent = node.textContent || null;
   } else {
     node.children.forEach(c => el.appendChild(this.configNodeToXml(doc, c)));
   }
   return el;
 }

  // --- INJEKTOREN ---
  private injectVisu(doc: Document, uiModule: Element) {
      // 1. Das Visualization-Wrapper-Tag finden oder erstellen
      let visWrapper = uiModule.getElementsByTagName("Visualization")[0];
      if (!visWrapper) {
        visWrapper = doc.createElement("Visualization");
        uiModule.appendChild(visWrapper);
      } else {
        visWrapper.innerHTML = '';
      }

      // 2. Über alle existierenden Layer iterieren
      this.layers$.value.forEach(layer => {
        const visuEl = doc.createElement("Visu");
        visuEl.setAttribute("layer", layer.id);
        visuEl.setAttribute("id", layer.name);

        // --- RECTS filtern ---
        const rs = doc.createElement("Rects");
        this.rects$.value
          .filter(r => r.layerId === layer.id) // Filter auf aktuellen Layer
          .forEach(r => {
            const re = doc.createElement("Rect");
            re.setAttribute("id", r.id || '');
            re.setAttribute("name", r.name || '');
            re.setAttribute("x", Math.round(r.x || 0).toString());
            re.setAttribute("y", Math.round(r.y || 0).toString());
            re.setAttribute("width", (r.width || 0).toString());
            re.setAttribute("height", (r.height || 0).toString());
            re.setAttribute("controller", r.controller || '');
             if(r.transitPoint === true){
                    re.setAttribute("transit-point", 'true');
                   }
            rs.appendChild(re);
          });
        if (rs.childNodes.length > 0) visuEl.appendChild(rs);

        // --- ARROWS filtern ---
        const ars = doc.createElement("Arrows");
        this.arrows$.value
          .filter(a => a.layerId === layer.id) // Filter auf aktuellen Layer
          .forEach(a => {
            const ae = doc.createElement("Arrow");
            ae.setAttribute("id", a.id || '');
            ae.setAttribute("from", a.fromRectId || '');
            ae.setAttribute("to", a.toRectId || '');
            ae.setAttribute("fromSide", a.fromSide || '');
            ae.setAttribute("toSide", a.toSide || '');
            ae.setAttribute("type", a.type || '');
            ae.setAttribute("direction", a.direction || '');
            ae.setAttribute("speed", (a.speed ?? 5).toString());
            ae.setAttribute("cost", (a.cost ?? 100).toString());

            const wpStr = (a.waypoints || [])
              .map(w => `${Math.round(w.x || 0)},${Math.round(w.y || 0)}`)
              .join(';');
            ae.setAttribute("waypoints", wpStr);
            ars.appendChild(ae);
          });
        if (ars.childNodes.length > 0) visuEl.appendChild(ars);

        // --- AISLES filtern ---
        const ails = doc.createElement("Aisles");
        this.aisles$.value
          .filter(aisle => aisle.layerId === layer.id) // Filter auf aktuellen Layer
          .forEach(aisle => {
            const ai = doc.createElement("Aisle");
            ai.setAttribute("id", aisle.id);
            ai.setAttribute("name", aisle.name);
            ai.setAttribute("x", aisle.x.toString());
            ai.setAttribute("y", aisle.y.toString());
            ai.setAttribute("width", aisle.width.toString());
            ai.setAttribute("height", aisle.height.toString());
            ai.setAttribute("orientation", aisle.orientation);

            if (aisle.rbg) {
              const rbgEl = doc.createElement("RBG");
              rbgEl.setAttribute("id", aisle.rbg.id);
              rbgEl.setAttribute("positionOffset", aisle.rbg.positionOffset.toString());
              rbgEl.setAttribute("width", aisle.rbg.width.toString());
              rbgEl.setAttribute("height", aisle.rbg.height.toString());
              ai.appendChild(rbgEl);
            }
            ails.appendChild(ai);
          });
        if (ails.childNodes.length > 0) visuEl.appendChild(ails);

        // Die fertige Visu dem Wrapper hinzufügen
        visWrapper.appendChild(visuEl);
      });
    }

 private injectStockNodes(doc: Document, stockModule: Element) {
   const nodesWrapper = doc.createElement("Nodes");

   // 1. Alle verfügbaren Rects holen
   const allRects = this.rects$.value;

   // 2. Wir gruppieren die Rects nach Namen, um physikalische Dubletten (wie Ü-Plätze)
   // zu einer logischen Einheit (Node) zusammenzufassen.
   const uniqueNodeNames = Array.from(new Set(allRects.map(r => r.name).filter(n => !!n)));

   uniqueNodeNames.forEach(nodeName => {
     //Finde alle Rects, die diesen Namen teilen (z.B. C in Ebene 1 und C in Ebene 2)
     const relatedRects = allRects.filter(r => r.name === nodeName);

     const isAnyTransit = relatedRects.some(r => r.transitPoint);
     if (isAnyTransit && relatedRects.length < 2) {
        console.warn(`Punkt ${nodeName} ist als Transit markiert, existiert aber nur in einem Layer!`);
     }

     const primary = relatedRects[0];

     const nodeEl = doc.createElement("Node");
     nodeEl.setAttribute("point", nodeName!);
     nodeEl.setAttribute("controller", primary.controller || '');

     // 3. Targets sammeln: Wir schauen uns die Pfeile ALLER beteiligten Rects an
     const targetMap = new Map<string, Element>();

     relatedRects.forEach(rect => {
       this.arrows$.value
         .filter(a => a.fromRectId === rect.id)
         .forEach(a => {
           const targetRect = allRects.find(tr => tr.id === a.toRectId);
           if (targetRect && targetRect.name) {
             // Nur hinzufügen, wenn dieses Target für diesen Node noch nicht existiert
             if (!targetMap.has(targetRect.name)) {
               const targetEl = doc.createElement("Target");
               targetEl.setAttribute("point", targetRect.name);
               targetEl.setAttribute("direction", a.direction || "");
               targetEl.setAttribute("cost", (a.cost ?? 100).toString());

               targetMap.set(targetRect.name, targetEl);
             }
           }
         });
     });

     // Alle gefundenen Targets an den Node hängen
     targetMap.forEach(tEl => nodeEl.appendChild(tEl));

     nodesWrapper.appendChild(nodeEl);
   });

   stockModule.insertBefore(nodesWrapper, stockModule.firstChild);
 }

  // --- HELPERS ---
  private scanControllers(xmlDoc: Document) {
    const conns = xmlDoc.getElementsByTagName("Connectable");
    this.availableControllers = Array.from(conns).map(c => c.getAttribute("name") || '').filter(n => n);
  }

  private xmlToString(xmlDoc: Document): string {
    const serializer = new XMLSerializer();
    return serializer.serializeToString(xmlDoc).replace(/>\s*</g, '>\n<');
  }

  private downloadFile(content: string, fileName: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
  }
}
