import { Routes } from '@angular/router';
import { EditorComponent } from './editor/editor.component';
import { PendingChangesGuard } from './guards/pending-changes.guard';

export const routes: Routes = [
  {
    path: 'editor',
    component: EditorComponent,
    canDeactivate: [PendingChangesGuard]
  }
];
