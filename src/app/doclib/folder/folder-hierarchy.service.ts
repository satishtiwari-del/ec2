import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FolderService, FolderHierarchy } from './folder.service';
import { MockFolderService } from './folder.service.mock';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
  useClass: environment.production ? FolderService : MockFolderService
})
export class FolderHierarchyService {
  constructor(private folderService: FolderService | MockFolderService) {}

  getFolderHierarchy(rootId?: string): Observable<FolderHierarchy> {
    return this.folderService.getFolderHierarchy(rootId);
  }
}