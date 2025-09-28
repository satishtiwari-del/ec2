import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FolderCreationDialogComponent } from './folder-creation-dialog.component';
import { FolderService } from '../folder.service';
import { of, throwError } from 'rxjs';
import { CommonModule } from '@angular/common';

describe('FolderCreationDialogComponent', () => {
  let component: FolderCreationDialogComponent;
  let fixture: ComponentFixture<FolderCreationDialogComponent>;
  let folderService: jasmine.SpyObj<FolderService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<FolderCreationDialogComponent>>;

  beforeEach(async () => {
    const mockFolder = {
      id: 'new-folder-123',
      name: 'Test Folder',
      path: '/Test Folder',
      createdBy: 'currentUser',
      createdAt: new Date(),
      updatedAt: new Date(),
      permissions: [{ userId: 'currentUser', accessLevel: 'admin' as const }]
    };

    const folderServiceSpy = jasmine.createSpyObj('FolderService', [
      'createRootFolder',
      'createSubfolder',
      'validateFolderName'
    ]);

    // Set up default return values for the spy methods
    folderServiceSpy.createRootFolder.and.returnValue(of(mockFolder));
    folderServiceSpy.createSubfolder.and.returnValue(of(mockFolder));
    folderServiceSpy.validateFolderName.and.returnValue(of(true));

    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        FolderCreationDialogComponent,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatChipsModule,
        NoopAnimationsModule,
        MatDialogModule,
        MatSelectModule,
        MatButtonModule
      ],
      providers: [
        { provide: FolderService, useValue: folderServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { parentFolderId: 'parent-123' } }
      ]
    }).compileComponents();

    folderService = TestBed.inject(FolderService) as jasmine.SpyObj<FolderService>;
    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<FolderCreationDialogComponent>>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FolderCreationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.folderForm.get('name')?.value).toBe('');
    expect(component.folderForm.get('icon')?.value).toBe('folder');
    expect(component.folderForm.get('description')?.value).toBe('');
    expect(component.folderForm.get('tags')?.value).toEqual([]);
  });

  it('should validate required fields', () => {
    const nameControl = component.folderForm.get('name');
    const iconControl = component.folderForm.get('icon');

    nameControl?.setValue('');
    expect(nameControl?.hasError('required')).toBeTruthy();

    nameControl?.setValue('Test Folder');
    expect(nameControl?.valid).toBeTruthy();
  });

  it('should validate folder name format', () => {
    const nameControl = component.folderForm.get('name');
    
    nameControl?.setValue('Invalid/Folder');
    expect(nameControl?.hasError('pattern')).toBeTruthy();

    nameControl?.setValue('Valid_Folder-123');
    expect(nameControl?.valid).toBeTruthy();
  });

  it('should validate folder name uniqueness', fakeAsync(() => {
    const nameControl = component.folderForm.get('name');
    folderService.validateFolderName.and.returnValue(of(false));

    nameControl?.setValue('Existing Folder');
    component.validateFolderName();
    tick(500); // Account for debounce time

    expect(nameControl?.hasError('duplicate')).toBeTruthy();
    expect(folderService.validateFolderName).toHaveBeenCalledWith('Existing Folder', 'parent-123');
  }));

  it('should handle tag input', () => {
    component.addTag('test-tag');
    expect(component.folderForm.get('tags')?.value).toContain('test-tag');

    component.removeTag('test-tag');
    expect(component.folderForm.get('tags')?.value).not.toContain('test-tag');
  });

  it('should create folder on form submit', fakeAsync(() => {
    const mockFolder = {
      id: 'new-folder-123',
      name: 'Test Folder',
      path: '/Test Folder',
      createdBy: 'currentUser',
      createdAt: new Date(),
      updatedAt: new Date(),
      permissions: [{ userId: 'currentUser', accessLevel: 'admin' as const }]
    };

    folderService.validateFolderName.and.returnValue(of(true));
    folderService.createRootFolder.and.returnValue(of(mockFolder));
    folderService.createSubfolder.and.returnValue(of(mockFolder));

    component.folderForm.patchValue({
      name: 'Test Folder',
      icon: 'folder',
      description: 'Test Description',
      tags: ['test']
    });

    component.onSubmit();
    tick();

    if (component.data.parentFolderId) {
      expect(folderService.createSubfolder).toHaveBeenCalledWith(component.data.parentFolderId, 'Test Folder');
    } else {
      expect(folderService.createRootFolder).toHaveBeenCalledWith('Test Folder', [{
        userId: 'currentUser',
        accessLevel: 'admin'
      }]);
    }
    expect(dialogRef.close).toHaveBeenCalledWith(mockFolder);
  }));

  it('should handle folder creation error', fakeAsync(() => {
    folderService.validateFolderName.and.returnValue(of(true));
    folderService.createRootFolder.and.returnValue(throwError(() => new Error('Creation failed')));
    folderService.createSubfolder.and.returnValue(throwError(() => new Error('Creation failed')));

    component.folderForm.patchValue({
      name: 'Test Folder',
      icon: 'folder'
    });

    component.onSubmit();
    tick();

    expect(component.error).toBe('Creation failed');
    expect(dialogRef.close).not.toHaveBeenCalled();
  }));

  it('should handle icon selection', () => {
    component.onIconSelected('folder_open');
    expect(component.folderForm.get('icon')?.value).toBe('folder_open');
  });

  it('should validate maximum tag limit', () => {
    const maxTags = 20;
    for (let i = 0; i < maxTags + 1; i++) {
      component.addTag(`tag-${i}`);
    }

    expect(component.folderForm.get('tags')?.value.length).toBe(maxTags);
    expect(component.error).toBe('Maximum number of tags (20) reached');
  });

  it('should trim whitespace from folder name', fakeAsync(() => {
    const nameControl = component.folderForm.get('name');
    nameControl?.setValue('  Test Folder  ');
    component.folderForm.patchValue({
      icon: 'folder'
    });
    
    folderService.validateFolderName.and.returnValue(of(true));
    const mockFolder = {
      id: 'new-folder-123',
      name: 'Test Folder',
      path: '/Test Folder',
      createdBy: 'currentUser',
      createdAt: new Date(),
      updatedAt: new Date(),
      permissions: [{ userId: 'currentUser', accessLevel: 'admin' as const }]
    };
    folderService.createRootFolder.and.returnValue(of(mockFolder));
    folderService.createSubfolder.and.returnValue(of(mockFolder));
    
    component.onSubmit();
    tick();
    
    if (component.data.parentFolderId) {
      expect(folderService.createSubfolder).toHaveBeenCalledWith(component.data.parentFolderId, 'Test Folder');
    } else {
      expect(folderService.createRootFolder).toHaveBeenCalledWith('Test Folder', [{
        userId: 'currentUser',
        accessLevel: 'admin'
      }]);
    }
    expect(dialogRef.close).toHaveBeenCalledWith(mockFolder);
  }));

  it('should validate description length', () => {
    const descControl = component.folderForm.get('description');
    const longDesc = 'a'.repeat(1001);
    
    descControl?.setValue(longDesc);
    expect(descControl?.hasError('maxlength')).toBeTruthy();

    descControl?.setValue('Valid description');
    expect(descControl?.valid).toBeTruthy();
  });
});