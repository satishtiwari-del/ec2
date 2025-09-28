import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-folder-menu',
  standalone: true,
  imports: [
    CommonModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule
  ],
  template: `
    <div class="folder-item" [class.active]="isActive">
      <div class="folder-content">
        <ng-content></ng-content>
      </div>
      <button mat-icon-button [matMenuTriggerFor]="menu" class="menu-trigger">
        <mat-icon>more_vert</mat-icon>
      </button>
    </div>

    <mat-menu #menu="matMenu" class="folder-menu">
      <button mat-menu-item (click)="onAction('new')" style="color: #4CAF50">
        <mat-icon style="color: inherit">create_new_folder</mat-icon>
        <span style="color: inherit">New Folder</span>
      </button>

      <button mat-menu-item (click)="onAction('upload')" style="color: #2196F3">
        <mat-icon style="color: inherit">upload_file</mat-icon>
        <span style="color: inherit">Upload Files</span>
      </button>

      <mat-divider></mat-divider>

      <button mat-menu-item (click)="onAction('edit')" style="color: #FFA000">
        <mat-icon style="color: inherit">edit</mat-icon>
        <span style="color: inherit">Edit</span>
      </button>

      <button mat-menu-item (click)="onAction('rename')" style="color: #FF5722">
        <mat-icon style="color: inherit">drive_file_rename_outline</mat-icon>
        <span style="color: inherit">Rename</span>
      </button>

      <button mat-menu-item (click)="onAction('move')" style="color: #9C27B0">
        <mat-icon style="color: inherit">drive_file_move</mat-icon>
        <span style="color: inherit">Move</span>
      </button>

      <button mat-menu-item (click)="onAction('copy')" style="color: #00BCD4">
        <mat-icon style="color: inherit">file_copy</mat-icon>
        <span style="color: inherit">Copy</span>
      </button>

      <mat-divider></mat-divider>

      <button mat-menu-item (click)="onAction('delete')" style="color: #F44336">
        <mat-icon style="color: inherit">delete</mat-icon>
        <span style="color: inherit">Delete</span>
      </button>
    </mat-menu>
  `,
  styles: [`
    .folder-item {
      display: flex;
      align-items: center;
      padding: 8px 16px;
      border-radius: 4px;
      transition: background-color 0.2s;
      cursor: pointer;
      position: relative;
    }

    .folder-item:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .folder-item.active {
      background-color: rgba(0, 0, 0, 0.08);
    }

    .folder-content {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .menu-trigger {
      opacity: 0;
      transition: opacity 0.2s;
    }

    .folder-item:hover .menu-trigger {
      opacity: 1;
    }

    /* Menu item styling */
    ::ng-deep .folder-menu {
      .mat-mdc-menu-item {
        min-height: 40px;
        line-height: 40px;
      }

      .mat-mdc-menu-item .mdc-list-item__primary-text {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      mat-icon {
        margin-right: 0;
        width: 20px;
        height: 20px;
        font-size: 20px;
      }

      /* Menu item spacing */

      mat-divider {
        margin: 8px 0;
      }
    }
  `]
})
export class FolderMenuComponent {
  @Input() isActive = false;
  @Output() actionTriggered = new EventEmitter<string>();

  onAction(action: string) {
    this.actionTriggered.emit(action);
  }
}