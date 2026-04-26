import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorStateService } from '../../services/editor-state.service';
import { RectShape } from '../../domain/rectangle.model';
import { Arrow } from '../../domain/arrow.model';
import { Aisle } from '../../domain/aisle.model';

@Component({
  selector: 'app-svg-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './svg-canvas.component.html',
  styleUrls: ['./svg-canvas.component.scss']
})
export class SvgCanvasComponent {
  // Lokale Kopien der Daten für die Drag-Logik
  rects: RectShape[] = [];
  arrows: Arrow[] = [];
  aisles: Aisle[] = [];
  selected: any[] = [];

  currentView: string = '';

  // Drag & Interaction States
  public waypointTarget: { arrow: Arrow, index: number } | null = null;
  public dragTarget: any = null;
  public resizeTarget: RectShape | null = null;
  private startMouseX = 0;
  private startMouseY = 0;

  public hoveredRect: RectShape | null = null;
  public arrowStartPoint: { rect: RectShape, side: string, x: number, y: number } | null = null;
  public currentMousePos = { x: 0, y: 0 };

  constructor(public editor: EditorStateService) {
    // Abonnieren der Streams vom Service
    this.editor.getRects$().subscribe(r => this.rects = r);
    this.editor.getArrows$().subscribe(a => this.arrows = a);
    this.editor.getAisles$().subscribe(a => this.aisles = a);
    this.editor.getSelected$().subscribe(s => this.selected = s);

    //View abonnieren
    this.editor.getView$().subscribe(v => this.currentView = v);
  }

  // Hilfsmethode für Mauskoordinaten relativ zum SVG
  private pos(evt: MouseEvent) {
    const svg = (evt.currentTarget as HTMLElement).closest('svg')!;
    const r = svg.getBoundingClientRect();
    return { x: evt.clientX - r.left, y: evt.clientY - r.top };
  }

  trackById(_: number, item: any) { return item.id; }

select(obj: any) {
  this.editor.setSelected([obj]);
}
  isSelected(obj: any): boolean {
    return this.selected.some(s => s.id === obj.id);
  }

  onCanvasDown(evt: MouseEvent) {
    const { x, y } = this.pos(evt);
    const mode = this.editor.getMode();

    if (mode === 'draw-rect') {
      this.editor.addRect({
        id: 'R' + Date.now(),
        name: 'Node_' + (this.rects.length + 1),
        x: x - 40, y: y - 30, width: 80, height: 60
      });
      //this.editor.setMode('select');
    } else if (mode === 'draw-aisle-SRM') {
      this.editor.addAisle({
        id: 'G' + Date.now(),
        name: 'Gasse ' + (this.aisles.length + 1),
        x: x, y: y - 20,
        width: 200, height: 40,
        orientation: 'horizontal',
        rbg: {
          id: 'RBG' + Date.now(),
          name: 'RBG ' + (this.aisles.length + 1),
          controller: '',
          positionOffset: 0.2,
          width: 20, height: 30
        }
      });
      this.editor.setMode('select');
    }else if (mode === 'draw-aisle') {
           this.editor.addAisle({
             id: 'G' + Date.now(),
             name: 'Gasse ' + (this.aisles.length + 1),
             x: x, y: y - 20,
             width: 200, height: 40,
             orientation: 'horizontal'
           });
           this.editor.setMode('select');
      }else if (mode === 'draw-processor') {
      this.editor.addProcessor({ x, y });
      this.editor.setMode('select');
    } else {
      this.editor.clearSelection();
    }
  }

  startDrag(evt: MouseEvent, obj: any) {
    evt.stopPropagation();
    if (!this.isSelected(obj)) {
      this.editor.setSelected([obj]);
    }
    this.dragTarget = obj;
    const { x, y } = this.pos(evt);
    this.startMouseX = x;
    this.startMouseY = y;

    // Initial-Positionen für das Delta-Movement speichern
    this.selected.forEach(o => { o.initialX = o.x; o.initialY = o.y; });
  }

  startResize(evt: MouseEvent, r: RectShape) {
    evt.stopPropagation();
    this.resizeTarget = r;
  }

  onMouseMove(evt: MouseEvent) {
    const { x, y } = this.pos(evt);
    this.currentMousePos = { x, y };

    if (this.waypointTarget) {
      const wp = this.waypointTarget.arrow.waypoints[this.waypointTarget.index];
      wp.x = evt.shiftKey ? Math.round(x / 10) * 10 : x;
      wp.y = evt.shiftKey ? Math.round(y / 10) * 10 : y;
      this.editor.updateArrows([...this.arrows]);
      return;
    }

    if (this.dragTarget) {
      const dx = x - this.startMouseX;
      const dy = y - this.startMouseY;
      this.selected.forEach(obj => {
        if ('x' in obj) {
          obj.x = (obj.initialX || 0) + dx;
          obj.y = (obj.initialY || 0) + dy;
        }
      });
      // Service über Änderung informieren
      this.editor.updateRects([...this.rects]);
      this.editor.updateAisles([...this.aisles]);
      this.editor.updateProcessors();
    }

    if (this.resizeTarget) {
      this.resizeTarget.width = Math.max(20, x - this.resizeTarget.x);
      this.resizeTarget.height = Math.max(20, y - this.resizeTarget.y);
      this.editor.updateRects([...this.rects]);
      this.editor.updateAisles([...this.aisles]);
    }
  }

  @HostListener('window:mouseup')
  onMouseUp() {
    this.dragTarget = null;
    this.resizeTarget = null;
    this.waypointTarget = null;
  }

  // --- ARROW LOGIC ---
  getConnectors(r: RectShape) {
     return [
       { side: 'top', x: r.x + r.width / 2, y: r.y },
       { side: 'bottom', x: r.x + r.width / 2, y: r.y + r.height },
       { side: 'left', x: r.x, y: r.y + r.height / 2 },
       { side: 'right', x: r.x + r.width, y: r.y + r.height / 2 }
     ];
   }

 // Hilfsmethode für Connector-Positionen
   getConnectorPos(r: RectShape, side: string) {
     if (side === 'top') return { x: r.x + r.width / 2, y: r.y };
     if (side === 'bottom') return { x: r.x + r.width / 2, y: r.y + r.height };
     if (side === 'left') return { x: r.x, y: r.y + r.height / 2 };
     return { x: r.x + r.width, y: r.y + r.height / 2 }; // right
   }

onConnectorClick(evt: MouseEvent, p: any, rect: RectShape) {
  evt.stopPropagation();
  console.log("Connector geklickt! Seite:", p.side, "Rect-ID:", rect.id);

  if (!this.arrowStartPoint) {
    // ERSTER KLICK
    console.log("Startpunkt gesetzt.");
    this.arrowStartPoint = {
      rect,
      side: p.side as 'top' | 'bottom' | 'left' | 'right',
      x: p.x,
      y: p.y
    };
  } else {
    // ZWEITER KLICK
    console.log("Zweiter Klick registriert. Prüfe IDs:", this.arrowStartPoint.rect.id, "vs", rect.id);

    if (this.arrowStartPoint.rect.id !== rect.id) {
      const newArrow: Arrow = {
        id: 'A' + Date.now(),
        fromRectId: this.arrowStartPoint.rect.id,
        fromSide: this.arrowStartPoint.side as 'top' | 'bottom' | 'left' | 'right',
        toRectId: rect.id,
        toSide: p.side as 'top' | 'bottom' | 'left' | 'right',
        waypoints: [],
        type: 'roller',
        speed: 5,
        direction: 'S',
        cost: 100
      };

      this.editor.addArrow(newArrow);
      console.log("Pfeil erfolgreich im Service gespeichert!");
    } else {
      console.warn("Verbindung abgebrochen: Start und Ziel sind das gleiche Rechteck.");
    }

    // WICHTIG: Den Startpunkt IMMER zurücksetzen, damit die Linie verschwindet
    this.arrowStartPoint = null;
    console.log("Interaktion beendet, Linie sollte verschwinden.");
  }
}

 getArrowPath(a: Arrow) {
   // WICHTIG: Falls this.rects noch nicht durch das Subscription-Update gefüllt wurde,
   // holen wir uns die Daten direkt aus dem aktuellen Stand des Service.
   const sourceRects = this.rects.length > 0 ? this.rects : (this.editor as any).rects$.value;

   const r1 = sourceRects.find((r: any) => r.id === a.fromRectId);
   const r2 = sourceRects.find((r: any) => r.id === a.toRectId);

   if (!r1 || !r2) return '';

   const start = this.getConnectorPos(r1, a.fromSide || 'right');
   const end = this.getConnectorPos(r2, a.toSide || 'left');

   let path = `M ${start.x} ${start.y}`;
   if (a.waypoints && a.waypoints.length > 0) {
     a.waypoints.forEach(wp => path += ` L ${wp.x} ${wp.y}`);
   }
   path += ` L ${end.x} ${end.y}`;
   return path;
 }

  addWaypoint(evt: MouseEvent, a: Arrow) {
    evt.stopPropagation();
    const { x, y } = this.pos(evt);
    if (!a.waypoints) a.waypoints = [];
    a.waypoints.push({ x, y });
    this.editor.updateArrows([...this.arrows]);
  }

  startDragWaypoint(evt: MouseEvent, arrow: Arrow, index: number) {
    evt.stopPropagation();
    this.waypointTarget = { arrow, index };
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return;

    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (this.selected.length > 0) {
        event.preventDefault();
        this.editor.deleteSelected();
      }
    }
  }
}
