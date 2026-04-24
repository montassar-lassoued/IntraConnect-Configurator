import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditorStateService } from '../../services/editor-state.service';

@Component({
  selector: 'app-property-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './property-panel.component.html',
  styleUrls: ['./property-panel.component.scss']
})
export class PropertyPanelComponent {

  constructor(private editor: EditorStateService) {}

  @Input() selected: any[] = [];

  // Helfer-Funktionen
  isPoint(obj: any): boolean {
    return 'x' in obj && !('width' in obj) && !('fromX' in obj);
  }

  isRect(obj: any): boolean {
    return 'width' in obj && 'height' in obj;
  }

  isArrow(obj: any): boolean {
    return 'fromRectId' in obj && 'toRectId' in obj;
  }

 isAisle(obj: any): boolean {
    return 'positionOffset' in obj
  }

// Diese Methode triggert das Update im gesamten System
onArrowValueChange() {
  // Wir sagen dem Service: "Hier sind die aktuellen Listen, bitte alle Abonnenten informieren"
  // Da die Objekte im Array referenzgleich sind, reicht ein Push des aktuellen Zustands
  this.editor.updateArrows([...this.editor['arrows$'].value]);
}
onRecValueChange() {
  // Wir sagen dem Service: "Hier sind die aktuellen Listen, bitte alle Abonnenten informieren"
  // Da die Objekte im Array referenzgleich sind, reicht ein Push des aktuellen Zustands
  this.editor.updateRects([...this.editor['rects$'].value]);
}

onAisleValueChange() {
  // Wir sagen dem Service: "Hier sind die aktuellen Listen, bitte alle Abonnenten informieren"
  // Da die Objekte im Array referenzgleich sind, reicht ein Push des aktuellen Zustands
  this.editor.updateAisles([...this.editor['aisles$'].value]);
}

availableControllers(): string[]{
  return this.editor.getAvailableControllers()}
}
