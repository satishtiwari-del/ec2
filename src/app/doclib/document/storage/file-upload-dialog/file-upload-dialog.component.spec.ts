import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileUploadDialogComponent, DialogData } from './file-upload-dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatChipGridHarness } from '@angular/material/chips/testing';
import { MatButtonHarness } from '@angular/material/button/testing';

describe('FileUploadDialogComponent', () => {
  let component: FileUploadDialogComponent;
  let fixture: ComponentFixture<FileUploadDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<FileUploadDialogComponent>>;
  let loader: HarnessLoader;

  const mockDialogData: DialogData = {
    fileName: 'test.txt',
    metadata: {
      description: '',
      tags: ['test', 'sample']
    }
  };

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        FormsModule,
        FileUploadDialogComponent
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FileUploadDialogComponent);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with provided dialog data', () => {
      expect(component.data).toEqual(mockDialogData);
    });

    it('should display file name in dialog title', () => {
      const titleElement = fixture.nativeElement.querySelector('h2');
      expect(titleElement.textContent).toContain('test.txt');
    });
  });

  describe('Tag Management', () => {
    it('should add a new tag', () => {
      const event = {
        value: 'newtag',
        chipInput: { clear: jasmine.createSpy('clear') }
      } as unknown as MatChipInputEvent;

      component.addTag(event);

      expect(component.data.metadata.tags).toContain('newtag');
      expect(event.chipInput.clear).toHaveBeenCalled();
    });

    it('should not add empty or whitespace tags', () => {
      const initialTagCount = component.data.metadata.tags.length;
      const event = {
        value: '   ',
        chipInput: { clear: jasmine.createSpy('clear') }
      } as unknown as MatChipInputEvent;

      component.addTag(event);

      expect(component.data.metadata.tags.length).toBe(initialTagCount);
      expect(event.chipInput.clear).toHaveBeenCalled();
    });

    it('should remove a tag', () => {
      component.removeTag('test');
      expect(component.data.metadata.tags).not.toContain('test');
    });

    it('should handle removing non-existent tag gracefully', () => {
      const initialTags = [...component.data.metadata.tags];
      component.removeTag('nonexistent');
      expect(component.data.metadata.tags).toEqual(initialTags);
    });
  });

  describe('Form Interaction', () => {
    it('should update description when input changes', async () => {
      const input = await loader.getHarness(MatInputHarness.with({ selector: 'textarea' }));
      await input.setValue('New description');
      expect(component.data.metadata.description).toBe('New description');
    });

    it('should display existing tags', async () => {
      const chipGrid = await loader.getHarness(MatChipGridHarness);
      const rows = await chipGrid.getRows();
      expect(rows.length).toBe(2);
      
      const texts = await Promise.all(rows.map(row => row.getText()));
      expect(texts).toContain('test');
      expect(texts).toContain('sample');
    });
  });

  describe('Dialog Actions', () => {
    it('should close dialog with metadata on submit', async () => {
      const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Upload' }));
      await submitButton.click();
      
      expect(dialogRef.close).toHaveBeenCalledWith(component.data.metadata);
    });

    it('should close dialog without data on cancel', async () => {
      const cancelButton = await loader.getHarness(MatButtonHarness.with({ text: 'Cancel' }));
      await cancelButton.click();
      
      expect(dialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('Keyboard Interaction', () => {
    it('should have correct separator keys defined', () => {
      expect(component.separatorKeysCodes).toContain(13); // Enter key
      expect(component.separatorKeysCodes).toContain(188); // Comma key
    });
  });
});