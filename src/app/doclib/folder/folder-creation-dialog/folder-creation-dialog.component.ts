import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FolderService } from '../folder.service';

import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

interface FolderIcon {
  value: string;
  label: string;
  color: string;
  description: string;
}

@Component({
  selector: 'app-folder-creation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule
  ],

  template: `
    <h2 mat-dialog-title>{{ data.mode === 'edit' ? 'Edit Folder' : 'Create New Folder' }}</h2>
    
    <form [formGroup]="folderForm" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <div class="form-content">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Folder Name</mat-label>
            <input matInput formControlName="name" required>
            <mat-error *ngIf="folderForm.get('name')?.hasError('required')">
              Name is required
            </mat-error>
            <mat-error *ngIf="folderForm.get('name')?.hasError('pattern')">
              Invalid characters in folder name
            </mat-error>
            <mat-error *ngIf="folderForm.get('name')?.hasError('duplicate')">
              A folder with this name already exists
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Folder Type</mat-label>
            <mat-select formControlName="icon" required>
              <mat-option *ngFor="let icon of folderIcons" [value]="icon.value">
                <div class="icon-option">
                  <mat-icon [style.color]="icon.color">folder</mat-icon>
                  <span class="icon-label">{{ icon.label }}</span>
                  <small class="icon-description">{{ icon.description }}</small>
                </div>
              </mat-option>
            </mat-select>
            <mat-error *ngIf="folderForm.get('icon')?.hasError('required')">
              Folder type is required
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Description</mat-label>
            <textarea matInput formControlName="description" rows="3"></textarea>
            <mat-error *ngIf="folderForm.get('description')?.hasError('maxlength')">
              Description cannot exceed 1000 characters
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Tags</mat-label>
            <mat-chip-grid #chipGrid>
              <mat-chip-row *ngFor="let tag of folderForm.get('tags')?.value"
                           (removed)="removeTag(tag)">
                {{tag}}
                <button matChipRemove>
                  <mat-icon>cancel</mat-icon>
                </button>
              </mat-chip-row>
            </mat-chip-grid>
            <input placeholder="New tag..."
                   [matChipInputFor]="chipGrid"
                   (matChipInputTokenEnd)="addTag($event)">
          </mat-form-field>

          <div *ngIf="error" class="error-message">
            {{ error }}
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="folderForm.invalid">
          {{ data.mode === 'edit' ? 'Save' : 'Create' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .form-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 400px;
    }
    .full-width {
      width: 100%;
    }
    .error-message {
      color: red;
      font-size: 12px;
    }
    .icon-option {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .icon-label {
      font-weight: 500;
    }
    .icon-description {
      color: rgba(0, 0, 0, 0.6);
      margin-left: auto;
    }
  `]
})
export class FolderCreationDialogComponent implements OnInit {
  folderForm: FormGroup;
  error = '';

  folderIcons: FolderIcon[] = [
    { value: 'folder_default', label: 'Default Folder', color: '#FFA000', description: 'Standard folder for general use' },
    { value: 'folder_important', label: 'Important', color: '#F44336', description: 'High priority content' },
    { value: 'folder_shared', label: 'Shared', color: '#4CAF50', description: 'Shared with others' },
    { value: 'folder_project', label: 'Project', color: '#2196F3', description: 'Project-related content' },
    { value: 'folder_archive', label: 'Archive', color: '#9E9E9E', description: 'Archived content' },
    { value: 'folder_personal', label: 'Personal', color: '#9C27B0', description: 'Personal documents' },
    { value: 'folder_secure', label: 'Secure', color: '#FF5722', description: 'Confidential content' },
    { value: 'folder_team', label: 'Team', color: '#00BCD4', description: 'Team collaboration' }
  ];

  constructor(
    private fb: FormBuilder,
    private folderService: FolderService,
    public dialogRef: MatDialogRef<FolderCreationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      parentFolderId?: string;
      mode?: 'create' | 'edit';
      folder?: any;
    }
  ) {
    this.folderForm = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.pattern(/^[^\\/:*?"<>|]+$/)
      ]],
      icon: ['folder_default', Validators.required],
      description: ['', Validators.maxLength(1000)],
      tags: [[]]
    });
  }

  ngOnInit() {
    if (this.data.mode === 'edit' && this.data.folder) {
      this.folderForm.patchValue({
        name: this.data.folder.name,
        icon: this.data.folder.icon,
        description: this.data.folder.description,
        tags: this.data.folder.tags
      });
    }

    // Set up name validation
    this.folderForm.get('name')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.validateFolderName();
    });
  }

  validateFolderName() {
    const nameControl = this.folderForm.get('name');
    if (nameControl?.valid && nameControl.value) {
      const validateName = this.folderService.validateFolderName(
        nameControl.value,
        this.data.parentFolderId || ''
      );

      validateName.subscribe({
        next: isValid => {
          if (!isValid) {
            nameControl.setErrors({ duplicate: true });
          } else {
            // Clear the duplicate error if the name is valid
            const errors = nameControl.errors;
            if (errors) {
              delete errors['duplicate'];
              nameControl.setErrors(Object.keys(errors).length ? errors : null);
            }
          }
        },
        error: () => {
          nameControl.setErrors({ duplicate: true });
        }
      });
    }
  }

  addTag(event: any | string) {
    const currentTags = this.folderForm.get('tags')?.value || [];
    if (currentTags.length >= 20) {
      this.error = 'Maximum number of tags (20) reached';
      return;
    }

    let value = '';
    if (typeof event === 'string') {
      value = event.trim();
    } else {
      value = (event.value || '').trim();
      if (event.input) {
        event.input.value = '';
      }
    }

    if (value && currentTags.length < 20) {
      this.folderForm.patchValue({
        tags: [...currentTags, value]
      });
    }
  }

  removeTag(tag: string) {
    const currentTags = this.folderForm.get('tags')?.value || [];
    this.folderForm.patchValue({
      tags: currentTags.filter((t: string) => t !== tag)
    });
    this.error = '';
  }

  onSubmit() {
    if (this.folderForm.valid) {
      const formValue = this.folderForm.value;
      const name = formValue.name?.trim() || '';

      if (!name) {
        this.error = 'Name is required';
        return;
      }

      const permissions = [{ userId: 'currentUser', accessLevel: 'admin' as const }];
      const icon = formValue.icon;
      const createFolder = this.data.parentFolderId ? 
        this.folderService.createSubfolder(this.data.parentFolderId, name, icon) :
        this.folderService.createRootFolder(name, permissions, icon);

      console.log('Creating folder with:', { name, parentId: this.data.parentFolderId });
      createFolder.subscribe({
        next: (folder) => {
          console.log('Folder created successfully:', folder);
          this.dialogRef.close(folder);
        },
        error: (error) => {
          console.error('Error creating folder:', error);
          this.error = error.message || 'Creation failed';
        }
      });
    }
  }

  onIconSelected(icon: string) {
    this.folderForm.patchValue({ icon });
  }
}