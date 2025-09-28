import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { FolderService } from './doclib/folder/folder.service';
import { MockFolderService } from './doclib/folder/folder.service.mock';
import { environment } from '../environments/environment';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(),
    {
      provide: FolderService,
      useClass: environment.production ? FolderService : MockFolderService
    }
  ]
};
