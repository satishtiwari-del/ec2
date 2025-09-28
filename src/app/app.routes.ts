import { Routes } from '@angular/router';
import { FolderBrowserComponent } from './doclib/document/storage/folder-browser.component';
import { FileSearchComponent } from './doclib/document/search/file-search.component';
import { LoginComponent } from './doclib/auth/login/login.component';
import { RoleGuard } from './doclib/auth/guards/role.guard';
import { SettingsComponent } from './doclib/auth/settings/settings.component';
import { FilePreviewPageComponent } from './doclib/document/file-preview/file-preview-page.component';
import { ProseMirrorEditorComponent } from './doclib/document/editor/prosemirror-editor.component';
import { MultiPreviewComponent } from './doclib/document/multi-file-preview/multi-preview.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'settings', component: SettingsComponent, canActivate: [RoleGuard] },
  {
    path: '',
    redirectTo: 'documents/files',
    pathMatch: 'full'
  },
  { path: 'documents/multi-preview', component: MultiPreviewComponent },
  {
    path: 'documents',
    canActivate: [RoleGuard],
    children: [
      { path: '', redirectTo: 'files', pathMatch: 'full' },
      { path: 'files', component: FolderBrowserComponent },
      { path: 'preview/:id', component: FilePreviewPageComponent },
      { path: 'editor', component: ProseMirrorEditorComponent },
      { path: 'search', component: FileSearchComponent },
      { path: 'shared', redirectTo: 'search', pathMatch: 'full' }
    ]
  },
  {
    path: 'users',
    loadChildren: () => import('./doclib/auth/user-management/user-management.module')
      .then(m => m.UserManagementModule)
  },
  { path: '**', redirectTo: 'documents/files' }
];
