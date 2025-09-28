import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FolderBrowserComponent } from './folder-browser.component';
import { LocalStorageService } from './local-storage.service';
import { StorageAdapterService } from './storage-adapter.service';

@NgModule({
  imports: [
    CommonModule,
    FolderBrowserComponent
  ],
  exports: [
    FolderBrowserComponent
  ],
  providers: [
    LocalStorageService,
    StorageAdapterService
  ]
})
export class StorageModule { }