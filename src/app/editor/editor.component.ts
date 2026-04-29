import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { SvgCanvasComponent } from './svg-canvas/svg-canvas.component';
import { PropertyPanelComponent } from './property-panel/property-panel.component';
import { EditorStateService } from '../services/editor-state.service';
import { MODULE_CONFIG_RULES } from '../domain/config/module-rules.config';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ToolbarComponent, SvgCanvasComponent, PropertyPanelComponent],
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent {
  view$ = this.editor.getView$();
  mode$ = this.editor.getMode$();
  processors$ = this.editor.getProcessors$();
  selected$ = this.editor.getSelected$();
  availableControllers: string[] = [];

  moduleTypeKeys = Object.keys(MODULE_CONFIG_RULES);
  activeModuleId: string | null = null; // Trackt, welches Modul im Detail editiert wird
  //public fullXmlContent: string = '';

  constructor(public editor: EditorStateService) {}

  setMode(m: any) { this.editor.setMode(m); }
  select(p: any) { this.editor.setSelected([p]); }


  //********File auswählen*********** */
  onFileSelected(event: any) {
      const file: File = event.target.files[0];
      if (file) {
        this.editor.loadConfigXml(file);
      }
    }
// Der Export-Aufruf
  save() {
    this.editor.saveToXml();
  }

  /** Navigation zur Modul-Übersicht */
  showAllModules() {
    this.editor.setView('modules');
    this.activeModuleId = null;
  }

  /** Sidebar Klick: Navigiert zum Modul oder erstellt es */
  handleModuleClick(typeName: string) {
    this.editor.setView('modules');
    const existing = this.editor.getModules$().value.find(m => m.attributes['name'] === typeName);

    if (existing) {
      this.activeModuleId = existing.id;
    } else {
      this.editor.addModule(typeName);
      // Kurzer Timeout, damit das neue Modul im State ankommt
      setTimeout(() => {
        const fresh = this.editor.getModules$().value.find(m => m.attributes['name'] === typeName);
        if (fresh) this.activeModuleId = fresh.id;
      }, 10);
    }
  }

  checkModuleExists(typeName: string): boolean {
    return this.editor.getModules$().value.some(m => m.attributes['name'] === typeName);
  }

  trackByKey(index: number, item: any): string {
    return item.key;
  }

  scrollToModule(moduleId: string) {
    this.activeModuleId = moduleId;
    setTimeout(() => {
      const element = document.getElementById(moduleId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        element.classList.add('highlight-flash');
        setTimeout(() => element.classList.remove('highlight-flash'), 2000);
      }
    }, 50);
  }
}
