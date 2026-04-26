import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorStateService, EditorMode, ViewMode } from '../../services/editor-state.service';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {
  currentMode: EditorMode = 'select';
  view: ViewMode = 'visualization';

  // WICHTIG: 'public' damit HTML zugreifen kann
  constructor(public editor: EditorStateService) {}

  ngOnInit() {
    this.editor.getView$().subscribe(v => this.view = v);
    this.editor.getMode$().subscribe(m => this.currentMode = m);
  }

  setView(v: ViewMode) { this.editor.setView(v); }
  setMode(m: EditorMode) { this.editor.setMode(m); }
}
