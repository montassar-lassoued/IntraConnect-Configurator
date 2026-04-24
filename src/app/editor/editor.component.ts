import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HostListener } from '@angular/core';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { SvgCanvasComponent } from './svg-canvas/svg-canvas.component';
import { PropertyPanelComponent } from './property-panel/property-panel.component';
import { EditorStateService } from '../services/editor-state.service';
import { CanComponentDeactivate } from '../guards/CanComponentDeactivate';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [
    CommonModule,
    ToolbarComponent,
    SvgCanvasComponent,
    PropertyPanelComponent
  ],
  template: `
    <div class="layout">
      <app-toolbar></app-toolbar>
      <app-svg-canvas></app-svg-canvas>
      <app-property-panel [selected]="(selected$ | async) ?? []"></app-property-panel>
    </div>
  `,
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements CanComponentDeactivate {
  selected$ = this.editor.getSelected$();
  constructor(private editor: EditorStateService) {}

    hasUnsavedChanges = true;

    canDeactivate(): boolean {
      if (!this.hasUnsavedChanges) return true;

      return confirm('Ungespeicherte Änderungen. Seite wirklich verlassen?');
    }

    @HostListener('window:beforeunload', ['$event'])
    unloadNotification($event: BeforeUnloadEvent) {
      if (this.hasUnsavedChanges) {
        $event.preventDefault();
        $event.returnValue = true;
      }
    }
}
