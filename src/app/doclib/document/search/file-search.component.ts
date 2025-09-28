import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LocalStorageService } from '../storage/local-storage.service';
import { LocalStorageFile } from '../storage/storage.model';
import { FilePreviewDialogComponent } from '../storage/file-preview-dialog/file-preview-dialog.component';
import { FilePreviewService } from '../services/file-preview.service';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

interface SearchResult extends LocalStorageFile {
  folderPath: string;
  folderName: string;
}

@Component({
  selector: 'app-file-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatSortModule,
    MatTooltipModule
  ],
  template: `
    <div class="search-container">
      <div class="search-header">
        <mat-form-field class="search-input">
          <mat-label>Search files</mat-label>
          <input matInput [(ngModel)]="searchQuery" (ngModelChange)="onSearch()" placeholder="Search by name, tag, or description">
          <mat-select [(ngModel)]="searchType" (selectionChange)="onSearch()" placeholder="Search in">
            <mat-option value="all">All</mat-option>
            <mat-option value="name">Name</mat-option>
            <mat-option value="tags">Tags</mat-option>
            <mat-option value="description">Description</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="table-container">
        <table mat-table [dataSource]="filteredFiles" matSort (matSortChange)="sortData($event)" class="mat-elevation-z8">
          <!-- Name Column -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
            <td mat-cell *matCellDef="let file">
              <div class="file-name clickable" 
                   (dblclick)="previewFile(file)"
                   [matTooltip]="'Double-click to preview'">
                <mat-icon [class]="'file-icon ' + getFileIcon(file).class">
                  {{ getFileIcon(file).icon }}
                </mat-icon>
                {{ file.name }}
              </div>
            </td>
          </ng-container>

          <!-- Location Column -->
          <ng-container matColumnDef="location">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Location</th>
            <td mat-cell *matCellDef="let file">
              <div class="file-location" [matTooltip]="file.folderPath">
                <mat-icon>folder</mat-icon>
                {{ file.folderPath }}
              </div>
            </td>
          </ng-container>

          <!-- Description Column -->
          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Description</th>
            <td mat-cell *matCellDef="let file">
              {{ file.metadata?.description || '-' }}
            </td>
          </ng-container>

          <!-- Tags Column -->
          <ng-container matColumnDef="tags">
            <th mat-header-cell *matHeaderCellDef>Tags</th>
            <td mat-cell *matCellDef="let file">
              <mat-chip-set *ngIf="file.metadata?.tags?.length">
                <mat-chip *ngFor="let tag of file.metadata.tags">{{ tag }}</mat-chip>
              </mat-chip-set>
              <span *ngIf="!file.metadata?.tags?.length">-</span>
            </td>
          </ng-container>

          <!-- Size Column -->
          <ng-container matColumnDef="size">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Size</th>
            <td mat-cell *matCellDef="let file">{{ formatFileSize(file.size) }}</td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let file">
              <button mat-icon-button (click)="previewFile(file)" matTooltip="Preview">
                <mat-icon>visibility</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

          <!-- No Results Row -->
          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell no-results" [attr.colspan]="displayedColumns.length">
              <mat-icon>search_off</mat-icon>
              <p>No files found matching your search criteria</p>
            </td>
          </tr>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .search-container {
      padding: 20px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .search-header {
      margin-bottom: 20px;
    }

    .search-input {
      width: 100%;
    }

    .table-container {
      flex: 1;
      overflow: auto;
    }

    table {
      width: 100%;
    }

    .file-name, .file-location {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .clickable {
      cursor: pointer;
      &:hover {
        color: #1976d2;
        .mat-icon {
          color: #1976d2;
        }
      }
    }

    .file-location {
      color: #666;
    }

    mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #666;
    }

    .no-results {
      padding: 40px !important;
      text-align: center;
      color: #666;
    }

    .no-results mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    mat-chip-set {
      max-width: 300px;
      overflow: hidden;
    }

    mat-chip {
      font-size: 12px;
      min-height: 24px;
    }

    .mat-column-actions {
      width: 60px;
      text-align: center;
    }

    .mat-column-size {
      width: 100px;
    }

    .mat-column-name {
      min-width: 200px;
    }

    .mat-column-location {
      min-width: 200px;
    }

    .mat-column-description {
      min-width: 200px;
    }

    .mat-column-tags {
      min-width: 200px;
    }

    .file-icon {
      &.pdf {
        color: #e53935; /* Material Red */
      }
      &.image {
        color: #43a047; /* Material Green */
      }
      &.markdown {
        color: #1e88e5; /* Material Blue */
      }
      &.text {
        color: #fb8c00; /* Material Orange */
      }
      &.audio {
        color: #8e24aa; /* Material Purple */
      }
      &.video {
        color: #d81b60; /* Material Pink */
      }
      &.archive {
        color: #6d4c41; /* Material Brown */
      }
      &.code {
        color: #546e7a; /* Material Blue Grey */
      }
      &.spreadsheet {
        color: #2e7d32; /* Material Dark Green */
      }
      &.presentation {
        color: #f4511e; /* Material Deep Orange */
      }
      &.document {
        color: #1565c0; /* Material Dark Blue */
      }
    }
  `]
})
export class FileSearchComponent implements OnInit {
  searchQuery = '';
  searchType = 'all';
  allFiles: SearchResult[] = [];
  filteredFiles: SearchResult[] = [];
  displayedColumns: string[] = ['name', 'location', 'description', 'tags', 'size', 'actions'];

  constructor(
    private localStorage: LocalStorageService,
    private dialog: MatDialog,
    private previewService: FilePreviewService
  ) {}

  async ngOnInit() {
    await this.loadAllFiles();
  }

  private async loadAllFiles() {
    const hierarchy = await firstValueFrom(this.localStorage.getHierarchy());
    
    this.allFiles = Object.values(hierarchy.files).map(file => {
      const folder = hierarchy.folders[file.folderId];
      return {
        ...file as LocalStorageFile,
        folderPath: folder.path,
        folderName: folder.name
      };
    });
    
    this.filteredFiles = [...this.allFiles];
  }

  onSearch() {
    if (!this.searchQuery.trim()) {
      this.filteredFiles = [...this.allFiles];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredFiles = this.allFiles.filter(file => {
      if (this.searchType === 'all' || this.searchType === 'name') {
        if (file.name.toLowerCase().includes(query)) return true;
      }
      
      if (this.searchType === 'all' || this.searchType === 'tags') {
        if (file.metadata?.tags?.some(tag => tag.toLowerCase().includes(query))) return true;
      }
      
      if (this.searchType === 'all' || this.searchType === 'description') {
        if (file.metadata?.description?.toLowerCase().includes(query)) return true;
      }

      return false;
    });
  }

  sortData(sort: Sort) {
    const data = [...this.filteredFiles];
    if (!sort.active || sort.direction === '') {
      this.filteredFiles = data;
      return;
    }

    this.filteredFiles = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'name': return compare(a.name, b.name, isAsc);
        case 'location': return compare(a.folderPath, b.folderPath, isAsc);
        case 'description': return compare(a.metadata?.description || '', b.metadata?.description || '', isAsc);
        case 'size': return compare(a.size, b.size, isAsc);
        default: return 0;
      }
    });
  }

  getFileIcon(file: LocalStorageFile): { icon: string; class: string } {
    const name = file.name.toLowerCase();
    const mime = file.mimeType.toLowerCase();

    // PDF files
    if (name.endsWith('.pdf')) {
      return { icon: 'picture_as_pdf', class: 'pdf' };
    }

    // Markdown files
    if (name.endsWith('.md') || name.endsWith('.markdown')) {
      return { icon: 'article', class: 'markdown' };
    }

    // Image files
    if (mime.startsWith('image/') || 
        ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].some(ext => name.endsWith(ext))) {
      return { icon: 'image', class: 'image' };
    }

    // Text files
    if (mime.startsWith('text/') || 
        ['.txt', '.log', '.csv'].some(ext => name.endsWith(ext))) {
      return { icon: 'description', class: 'text' };
    }

    // Audio files
    if (mime.startsWith('audio/') || 
        ['.mp3', '.wav', '.ogg', '.m4a'].some(ext => name.endsWith(ext))) {
      return { icon: 'audio_file', class: 'audio' };
    }

    // Video files
    if (mime.startsWith('video/') || 
        ['.mp4', '.webm', '.avi', '.mov'].some(ext => name.endsWith(ext))) {
      return { icon: 'video_file', class: 'video' };
    }

    // Archive files
    if (['.zip', '.rar', '.7z', '.tar', '.gz'].some(ext => name.endsWith(ext))) {
      return { icon: 'folder_zip', class: 'archive' };
    }

    // Code files
    if (['.js', '.ts', '.py', '.java', '.cpp', '.cs', '.html', '.css'].some(ext => name.endsWith(ext))) {
      return { icon: 'code', class: 'code' };
    }

    // Spreadsheet files
    if (['.xlsx', '.xls', '.csv', '.ods'].some(ext => name.endsWith(ext))) {
      return { icon: 'table_chart', class: 'spreadsheet' };
    }

    // Presentation files
    if (['.pptx', '.ppt', '.odp'].some(ext => name.endsWith(ext))) {
      return { icon: 'slideshow', class: 'presentation' };
    }

    // Document files
    if (['.doc', '.docx', '.odt', '.rtf'].some(ext => name.endsWith(ext))) {
      return { icon: 'article', class: 'document' };
    }

    // Default
    return { icon: 'description', class: 'text' };
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  previewFile(file: LocalStorageFile) {
    this.previewService.openPreview({
      id: file.id,
      name: file.name,
      type: file.type,
      size: file.size,
      path: file.path
    }).subscribe();
  }
}

function compare(a: string | number, b: string | number, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}