import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PointNode } from '../domain/point-node.model';
import { RectShape } from '../domain/rectangle.model';
import { Arrow } from '../domain/arrow.model';
import { Aisle } from '../domain/aisle.model';
import { RBG } from '../domain/aisle.model';

export type EditorMode = 'select' | 'draw-point' | 'draw-rect' | 'draw-arrow' | 'drag' | 'resize' | 'draw-aisle';

@Injectable({ providedIn: 'root' })
export class EditorStateService {
  private mode$ = new BehaviorSubject<EditorMode>('select');
  private points$ = new BehaviorSubject<PointNode[]>([]);
  private rects$ = new BehaviorSubject<RectShape[]>([]);
  private arrows$ = new BehaviorSubject<Arrow[]>([]);
  private aisles$ = new BehaviorSubject<Aisle[]>([]);
  private rbgs$ = new BehaviorSubject<RBG[]>([]);
  private selected$ = new BehaviorSubject<any[]>([]);
  private fullXmlContent: string = '';
  private currentFileName: string = 'SystemConfig.xml';

  private availableControllers: string[] = [];

  /** Getter & Setter */
  setMode(m: EditorMode) { this.mode$.next(m); }
  getMode() { return this.mode$.value; }
  getPoints$() { return this.points$.asObservable(); }
  getRects$() { return this.rects$.asObservable(); }
  getArrows$() { return this.arrows$.asObservable(); }
  getAisles$() { return this.aisles$.asObservable(); }
  getRbgs$() { return this.rbgs$.asObservable(); }
  getSelected$() { return this.selected$.asObservable(); }
  setSelected(objs: any[]) { this.selected$.next(objs); }
  clearSelection() { this.selected$.next([]); }

  /** Daten-Updates */
  addRect(r: RectShape) { this.rects$.next([...this.rects$.value, r]); }
  addArrow(a: Arrow) { this.arrows$.next([...this.arrows$.value, a]); }
  addAisle(a: Aisle) { this.aisles$.next([...this.aisles$.value, a]); }
  updateArrows(arrows: Arrow[]) { this.arrows$.next(arrows); }
  updateAisles(aisles: Aisle[]) { this.aisles$.next(aisles); }
  updateRects(recs: RectShape[]) { this.rects$.next(recs); }

  getAvailableControllers(): string[]{
    return this.availableControllers;
    }

  deleteSelected() {
    const sel = this.selected$.value;
    this.rects$.next(this.rects$.value.filter(r => !sel.includes(r)));
    this.arrows$.next(this.arrows$.value.filter(a => !sel.includes(a)));
    this.aisles$.next(this.aisles$.value.filter(a => !sel.includes(a)));
    this.clearSelection();
  }

  /** --- XML LOGIK --- */

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
    const xmlDoc = this.stringToXml(xmlString);

    // ---Controller einlesen ---
      this.availableControllers = [];
      // Wir suchen alle Connectables, die als Controller markiert sind
      const allConnectables = xmlDoc.getElementsByTagName("Connectable");
      for (let i = 0; i < allConnectables.length; i++) {
        const conn = allConnectables[i] as Element;
        const isController = conn.getAttribute("isController") === "true";
        const name = conn.getAttribute("name");

        if (isController && name) {
          this.availableControllers.push(name);
        }
      }
    // --- VISU ---
    const visuTag = xmlDoc.getElementsByTagName("Visu")[0];

    if (!visuTag) return;

    const rects: RectShape[] = [];
    const rectElements = visuTag.getElementsByTagName("Rect");
    for (let i = 0; i < rectElements.length; i++) {
      const el = rectElements[i] as Element;
      rects.push({
        id: el.getAttribute("id") || '',
        name: el.getAttribute("name") || '',
        x: Number(el.getAttribute("x")),
        y: Number(el.getAttribute("y")),
        width: Number(el.getAttribute("width")),
        height: Number(el.getAttribute("height")),
        controller: el.getAttribute("controller") || ''
      } as RectShape);
    }

    const arrows: Arrow[] = [];
    const arrowElements = visuTag.getElementsByTagName("Arrow");
    for (let i = 0; i < arrowElements.length; i++) {
      const el = arrowElements[i] as Element;
      const wpAttr = el.getAttribute("waypoints");
      const waypoints = wpAttr ? wpAttr.split(';').filter(s => s).map(p => {
        const c = p.split(',');
        return { x: Number(c[0]), y: Number(c[1]) };
      }) : [];

      arrows.push({
        id: el.getAttribute("id") || '',
        fromRectId: el.getAttribute("from") || '',
        fromSide: el.getAttribute("fromSide") as any,
        toRectId: el.getAttribute("to") || '',
        toSide: el.getAttribute("toSide") as any,
        type: el.getAttribute("type") as any,
        speed: Number(el.getAttribute("speed") || 5),
        direction: el.getAttribute("direction") as any || 'S',
        cost: Number(el.getAttribute("cost") || 100),
        waypoints: waypoints
      } as Arrow);
    }

    // --- GASSEN EINLESEN ---
      const aisles: Aisle[] = [];
      const aisleElements = visuTag.getElementsByTagName("Aisle");

      for (let i = 0; i < aisleElements.length; i++) {
        const el = aisleElements[i] as Element;
        const rbgEl = el.getElementsByTagName("RBG")[0];

        const aisleObj: Aisle = {
          id: el.getAttribute("id") || 'G' + Date.now() + i,
          name: el.getAttribute("name") || '',
          x: Number(el.getAttribute("x")),
          y: Number(el.getAttribute("y")),
          width: Number(el.getAttribute("width")),
          height: Number(el.getAttribute("height")),
          orientation: (el.getAttribute("orientation") as any) || 'horizontal',
          rbg: {
            id: rbgEl?.getAttribute("id") || 'RBG' + Date.now(),
            name: rbgEl?.getAttribute("name") || 'RBG',
            controller: rbgEl?.getAttribute("controller") || 'RBG',
            positionOffset: Number(rbgEl?.getAttribute("positionOffset") || 0.5),
            width: Number(rbgEl?.getAttribute("width") || 20),
            height: Number(rbgEl?.getAttribute("height") || 30)
          }
        };
        aisles.push(aisleObj);
      }

    this.updateRects(rects);
    this.updateArrows(arrows);
    this.updateAisles(aisles);
  }

  saveToXml() {
    if (!this.fullXmlContent) return;

    const xmlDoc = this.stringToXml(this.fullXmlContent);

    // --- TEIL 1: VISU AKTUALISIEREN ---
    const allModules = Array.from(xmlDoc.getElementsByTagName("Module")) as Element[];
    let uiModule = allModules.find(m => m.getAttribute("name") === "UI");

    if (uiModule) {
      const oldVisu = uiModule.getElementsByTagName("Visu")[0];
      if (oldVisu) uiModule.removeChild(oldVisu);

      const visuEl = xmlDoc.createElement("Visu");
      const rectsWrapper = xmlDoc.createElement("Rects");
      this.rects$.value.forEach(r => {
        const rEl = xmlDoc.createElement("Rect");
        rEl.setAttribute("id", r.id);
        rEl.setAttribute("name", r.name || "");
        rEl.setAttribute("x", Math.round(r.x).toString());
        rEl.setAttribute("y", Math.round(r.y).toString());
        rEl.setAttribute("width", Math.round(r.width).toString());
        rEl.setAttribute("height", Math.round(r.height).toString());
        rEl.setAttribute("controller", r.controller || "");
        rectsWrapper.appendChild(rEl);
      });
      visuEl.appendChild(rectsWrapper);

      const arrowsWrapper = xmlDoc.createElement("Arrows");
      this.arrows$.value.forEach(a => {
        const fEl = xmlDoc.createElement("Arrow");
        fEl.setAttribute("id", a.id);
        fEl.setAttribute("from", a.fromRectId);
        fEl.setAttribute("fromSide", a.fromSide || "");
        fEl.setAttribute("to", a.toRectId);
        fEl.setAttribute("toSide", a.toSide || "");
        fEl.setAttribute("type", a.type);
        fEl.setAttribute("direction", a.direction || "S");
        fEl.setAttribute("speed", (a.speed || 0).toString());
        fEl.setAttribute("cost", (a.cost || 0).toString());
        fEl.setAttribute("waypoints", a.waypoints?.map(w => `${Math.round(w.x)},${Math.round(w.y)}`).join(';') || "");
        arrowsWrapper.appendChild(fEl);
      });
      visuEl.appendChild(arrowsWrapper);
      // Gassen
      const aislesWrapper = xmlDoc.createElement("Aisles");
          this.aisles$.value.forEach(a => {
            const aEl = xmlDoc.createElement("Aisle");
            aEl.setAttribute("id", a.id);
            aEl.setAttribute("name", a.name);
            aEl.setAttribute("x", Math.round(a.x).toString());
            aEl.setAttribute("y", Math.round(a.y).toString());
            aEl.setAttribute("width", Math.round(a.width).toString());
            aEl.setAttribute("height", Math.round(a.height).toString());
            aEl.setAttribute("orientation", a.orientation);

            if (a.rbg) {
              const srEl = xmlDoc.createElement("RBG");
              srEl.setAttribute("id", a.rbg.id);
              srEl.setAttribute("name", a.rbg.name);
              srEl.setAttribute("positionOffset", a.rbg.positionOffset.toString());
              srEl.setAttribute("width", a.rbg.width.toString());
              srEl.setAttribute("height", a.rbg.height.toString());
              aEl.appendChild(srEl);
            }
            aislesWrapper.appendChild(aEl);
          });
          visuEl.appendChild(aislesWrapper);

      uiModule.appendChild(visuEl);
    }

    // --- TEIL 2: STOCKMOVEMENT (NODES) AKTUALISIEREN ---
    let stockModule = allModules.find(m => m.getAttribute("name") === "StockMovement");

    if (stockModule) {
      const oldNodes = stockModule.getElementsByTagName("Nodes")[0];
      if (oldNodes) stockModule.removeChild(oldNodes);

      const nodesEl = xmlDoc.createElement("Nodes");
      const rects = this.rects$.value;
      const arrows = this.arrows$.value;

      rects.forEach(r => {
        const nodeEl = xmlDoc.createElement("Node");
        nodeEl.setAttribute("point", r.name || "");
        nodeEl.setAttribute("controller", r.controller || "");

        arrows.filter(a => a.fromRectId === r.id).forEach(a => {
          const targetRect = rects.find(target => target.id === a.toRectId);
          const targetEl = xmlDoc.createElement("Target");
          targetEl.setAttribute("point", targetRect?.name || "");
          targetEl.setAttribute("direction", a.direction || "S");
          targetEl.setAttribute("cost", (a.cost || 100).toString());
          nodeEl.appendChild(targetEl);
        });
        nodesEl.appendChild(nodeEl);
      });
      stockModule.appendChild(nodesEl);
    }

    const finalXml = this.xmlToString(xmlDoc);
    this.downloadFile(finalXml, this.currentFileName, 'application/xml');
  }

  /** Hilfsmethoden für XML-Konvertierung */
  private stringToXml(xmlString: string): Document {
    const parser = new DOMParser();
    return parser.parseFromString(xmlString, "text/xml");
  }

  private xmlToString(xmlDoc: Document): string {
    const serializer = new XMLSerializer();
    const xmlString = serializer.serializeToString(xmlDoc);
    // Erzeugt Zeilenumbrüche für bessere Lesbarkeit
    return xmlString.replace(/>\s*</g, '>\n<');
  }

  private downloadFile(content: string, fileName: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
}
