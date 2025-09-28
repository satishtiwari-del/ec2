import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-file-menu',
  standalone: true,
  imports: [
    CommonModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule
  ],
  template: `
    <div class="file-item" [class.active]="isActive">
      <div class="file-content">
        <ng-content></ng-content>
      </div>
      <button mat-icon-button [matMenuTriggerFor]="menu" class="menu-trigger">
        <mat-icon>more_vert</mat-icon>
      </button>
    </div>

    <mat-menu #menu="matMenu" class="file-menu">
      <button mat-menu-item (click)="onOpenInEditor()" style="color: #FFA000">
        <mat-icon style="color: inherit">edit</mat-icon>
        <span style="color: inherit">Open in editor</span>
      </button>

      <button mat-menu-item (click)="onAction('download')" style="color: #4CAF50">
        <mat-icon style="color: inherit">download</mat-icon>
        <span style="color: inherit">Download</span>
      </button>

      <mat-divider></mat-divider>

      <button mat-menu-item (click)="onAction('share')" *ngIf="canShare" style="color: #00BCD4">
        <mat-icon style="color: inherit">share</mat-icon>
        <span style="color: inherit">Share</span>
      </button>

      <mat-divider *ngIf="canDelete"></mat-divider>

      <button mat-menu-item (click)="onAction('delete')" *ngIf="canDelete" style="color: #F44336">
        <mat-icon style="color: inherit">delete</mat-icon>
        <span style="color: inherit">Delete</span>
      </button>
    </mat-menu>
  `,
  styles: [`
    .file-item {
      display: flex;
      align-items: center;
      padding: 8px 16px;
      border-radius: 4px;
      transition: background-color 0.2s;
      cursor: pointer;
      position: relative;
    }

    .file-item:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .file-item.active {
      background-color: rgba(0, 0, 0, 0.08);
    }

    .file-content {
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

    .file-item:hover .menu-trigger {
      opacity: 1;
    }

    /* Menu item styling */
    ::ng-deep .file-menu {
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
export class FileMenuComponent {
  @Input() isActive = false;
  @Input() canEdit = false;
  @Input() canShare = false;
  @Input() canDelete = false;
  @Output() actionTriggered = new EventEmitter<string>();

  onAction(action: string) {
    this.actionTriggered.emit(action);
  }

  onOpenInEditor() {
    // Emit 'edit' if allowed, otherwise fall back to 'preview' to keep existing parent handlers working
    this.onAction(this.canEdit ? 'edit' : 'preview');
  }
}