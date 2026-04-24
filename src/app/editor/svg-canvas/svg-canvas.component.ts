import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorStateService } from '../../services/editor-state.service';
import { RectShape } from '../../domain/rectangle.model';
import { Arrow } from '../../domain/arrow.model';
import { Aisle, RBG } from '../../domain/aisle.model';

@Component({
  selector: 'app-svg-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './svg-canvas.component.html',
  styleUrls: ['./svg-canvas.component.scss']
})
export class SvgCanvasComponent {
  rects: RectShape[] = [];
  arrows: Arrow[] = [];
  selected: any[] = [];
  aisles: Aisle[] = [];

  public waypointTarget: { arrow: Arrow, index: number } | null = null;
  public dragTarget: any = null;
  public resizeTarget: RectShape | null = null;
  private startMouseX = 0;
  private startMouseY = 0;

  public arrowDrawMode = true;
  public hoveredRect: RectShape | null = null;
  public arrowStartPoint: { rect: RectShape, side: string, x: number, y: number } | null = null;
  public currentMousePos = { x: 0, y: 0 };

  constructor(public editor: EditorStateService) {
    this.editor.getRects$().subscribe(r => this.rects = r);
    this.editor.getArrows$().subscribe(a => this.arrows = a);
    this.editor.getAisles$().subscribe(a => this.aisles = a);
    this.editor.getSelected$().subscribe(s => this.selected = s);
  }

  private pos(evt: MouseEvent) {
    const svg = (evt.currentTarget as HTMLElement).closest('svg')!;
    const r = svg.getBoundingClientRect();
    return { x: evt.clientX - r.left, y: evt.clientY - r.top };
  }

  trackById(_: number, item: any) { return item.id; }

  onCanvasDown(evt: MouseEvent) {
    const { x, y } = this.pos(evt);
    const mode = this.editor.getMode();

    if (mode === 'draw-rect') {
      this.editor.addRect({ id: 'R' + Date.now(), x: x - 40, y: y - 30, width: 30, height: 30 });
      this.editor.setMode('select'); // <-- Zurücksetzen nach dem Zeichnen
    } else if (mode === 'draw-aisle') {

        this.editor.addAisle({
              id: 'G' + Date.now(),
              name: 'Gasse ' + (this.aisles.length + 1),
              x: x,
              y: y - 20, // Zentrierung der Maus
              width: 200,
              height: 40,
              orientation: 'horizontal',
              rbg: {
                id: 'RBG' + Date.now(),
                name: 'RBG'+(this.aisles.length + 1),
                controller: '',
                positionOffset: 0.2,
                width: 20,
                height: 30
              }
            });
          this.editor.setMode('select'); // <-- Zurücksetzen nach dem Zeichnen
      }else {
        this.editor.clearSelection();
    }
  }

  startDrag(evt: MouseEvent, obj: any) {
    evt.stopPropagation();
    if (!this.selected.includes(obj)) {
      this.selected = [obj];
      this.editor.setSelected(this.selected);
    }
    this.dragTarget = obj;
    const { x, y } = this.pos(evt);
    this.startMouseX = x;
    this.startMouseY = y;
    this.selected.forEach(o => { o.initialX = o.x; o.initialY = o.y; });
  }

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
      if (!this.arrowStartPoint) {
        this.arrowStartPoint = { rect, ...p };
      } else {
        if (this.arrowStartPoint.rect.id !== rect.id) {
          this.editor.addArrow({
              id: 'A' + Date.now(),
              fromRectId: this.arrowStartPoint.rect.id,
              fromSide: this.arrowStartPoint.side, // Jetzt speichern wir die Seite!
              toRectId: rect.id,
              toSide: p.side,                      // Und hier auch
              waypoints: [],                       // Initial leer
              type: 'roller',
              speed: 5,
              direction: 'S',
              cost: 100
            } as Arrow);
        }
        this.arrowStartPoint = null;
      }
    }

 // Pfadberechnung inkl. Waypoints
   getArrowPath(a: Arrow) {
     const r1 = this.rects.find(r => r.id === a.fromRectId);
     const r2 = this.rects.find(r => r.id === a.toRectId);
     if (!r1 || !r2) return '';

     const start = this.getConnectorPos(r1, a.fromSide || 'right');
     const end = this.getConnectorPos(r2, a.toSide || 'left');

     let path = `M ${start.x} ${start.y}`;
     if (a.waypoints) {
       a.waypoints.forEach(wp => {
         path += ` L ${wp.x} ${wp.y}`;
       });
     }
     path += ` L ${end.x} ${end.y}`;
     return path;
   }
 // Waypoint Interaktion
   startDragWaypoint(evt: MouseEvent, arrow: Arrow, index: number) {
     evt.stopPropagation();
     this.waypointTarget = { arrow, index };
   }

   addWaypoint(evt: MouseEvent, a: Arrow) {
     evt.stopPropagation();
     const { x, y } = this.pos(evt);
     if (!a.waypoints) a.waypoints = [];
     a.waypoints.push({ x, y });
     this.editor.updateArrows([...this.arrows]);
   }
 onMouseMove(evt: MouseEvent) {
     const { x, y } = this.pos(evt);
     this.currentMousePos = { x, y };

     // 1. Waypoint ziehen
     if (this.waypointTarget) {
       const wp = this.waypointTarget.arrow.waypoints[this.waypointTarget.index];
       // Einrasten (Snapping): Wenn Shift gedrückt, raste auf 10px ein
       wp.x = evt.shiftKey ? Math.round(x / 10) * 10 : x;
       wp.y = evt.shiftKey ? Math.round(y / 10) * 10 : y;
       return; // Dragging beendet
     }

     // 2. Normales Objekt ziehen
     if (this.dragTarget) {
       const dx = x - this.startMouseX;
       const dy = y - this.startMouseY;
       this.selected.forEach(obj => {
         if ('x' in obj) {
           obj.x = (obj.initialX || 0) + dx;
           obj.y = (obj.initialY || 0) + dy;
         }
       });
     }

     // 3. Resize
     if (this.resizeTarget) {
       this.resizeTarget.width = Math.max(20, x - this.resizeTarget.x);
       this.resizeTarget.height = Math.max(20, y - this.resizeTarget.y);
     }
   }

 /*private addAisle(x: number, y: number) {
     const newAisle: Aisle = {
       id: 'G' + Date.now(),
       name: 'Gasse',
       x: x,
       y: y,
       width: 200,
       height: 40,
       orientation: 'horizontal',
       rbg: {
         id: 'RBG' + Date.now(),
         name: 'RBG',
         positionOffset: 0.1, // Startet bei 10% der Länge
         width: 20,
         height: 30
       }
     };
     this.editor.addAisle(newAisle); // Methode im Service erstellen
   }*/

   // Hilfsmethode für die RBG Positionierung
   getRbgCoords(aisle: Aisle) {
     if (aisle.orientation === 'horizontal') {
       return {
         x: aisle.x + (aisle.width * aisle.rbg.positionOffset) - (aisle.rbg.width / 2),
         y: aisle.y + (aisle.height / 2) - (aisle.rbg.height / 2)
       };
     } else {
       return {
         x: aisle.x + (aisle.width / 2) - (aisle.rbg.width / 2),
         y: aisle.y + (aisle.height * aisle.rbg.positionOffset) - (aisle.rbg.height / 2)
       };
     }
   }


getRbgTransform(aisle: any): string {
  // Berechnung der X-Position basierend auf dem Offset (0.0 bis 1.0)
  const xPos = aisle.x + (aisle.width * (aisle.rbg.positionOffset || 0)) - (aisle.rbg.width / 2);
  // Vertikale Zentrierung innerhalb der Gasse
  const yPos = aisle.y + (aisle.height / 2) - (aisle.rbg.height / 2);

  return `translate(${xPos}, ${yPos})`;
}

 @HostListener('window:mouseup')
   onMouseUp() {
     this.dragTarget = null;
     this.resizeTarget = null;
     this.waypointTarget = null;
   }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    // 1. Prüfen, woher das Event kommt
      const target = event.target as HTMLElement;

      // 2. Wenn der Fokus in einem Eingabefeld liegt, nichts tun
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
        return;
      }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (this.selected.length > 0) {
        event.preventDefault();
        this.editor.deleteSelected();
      }
    }
  }
}
