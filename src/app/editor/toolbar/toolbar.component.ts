import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorStateService, EditorMode } from '../../services/editor-state.service';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl:'./toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent {
  currentMode: EditorMode = 'select';

  constructor(private editor: EditorStateService) {
    // Optional: Den aktuellen Modus abonnieren für CSS-Klassen
     //this.editor.getMode$().subscribe(m => this.currentMode = m);
  }

  set(m: EditorMode) {
    this.editor.setMode(m);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.editor.loadConfigXml(file); // Ruft die Methode im Service auf
    }
  }

  onSaveXml() {
    this.editor.saveToXml(); // Ruft die Methode im Service auf
  }

}
