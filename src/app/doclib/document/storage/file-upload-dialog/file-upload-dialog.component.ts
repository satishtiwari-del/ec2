import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatIconModule } from '@angular/material/icon';

export interface FileMetadata {
  description: string;
  tags: string[];
}

export interface DialogData {
  fileName: string;
  metadata: FileMetadata;
}

@Component({
  selector: 'app-file-upload-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>File Upload: {{ data.fileName }}</h2>
    <mat-dialog-content>
      <div class="dialog-content">
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Description</mat-label>
          <textarea 
            matInput 
            [(ngModel)]="data.metadata.description" 
            placeholder="Enter file description"
            rows="3">
          </textarea>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Tags</mat-label>
          <mat-chip-grid #chipGrid aria-label="Tag selection">
            <mat-chip-row
              *ngFor="let tag of data.metadata.tags"
              (removed)="removeTag(tag)">
              {{tag}}
              <button matChipRemove>
                <mat-icon>cancel</mat-icon>
              </button>
            </mat-chip-row>
          </mat-chip-grid>
          <input
            placeholder="New tag..."
            [matChipInputFor]="chipGrid"
            [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
            (matChipInputTokenEnd)="addTag($event)">
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSubmit()">Upload</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      min-width: 400px;
      padding: 20px 0;
    }
    .full-width {
      width: 100%;
      margin-bottom: 15px;
    }
  `]
})
export class FileUploadDialogComponent {
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  constructor(
    public dialogRef: MatDialogRef<FileUploadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  addTag(event: any): void {
    const value = (event.value || '').trim();
    if (value) {
      this.data.metadata.tags.push(value);
    }
    event.chipInput!.clear();
  }

  removeTag(tag: string): void {
    const index = this.data.metadata.tags.indexOf(tag);
    if (index >= 0) {
      this.data.metadata.tags.splice(index, 1);
    }
  }

  onSubmit(): void {
    this.dialogRef.close(this.data.metadata);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}