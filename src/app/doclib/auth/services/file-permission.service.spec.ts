import { TestBed } from '@angular/core/testing';
import { FilePermissionService, FileOperation } from './file-permission.service';

describe('FilePermissionService', () => {
  let service: FilePermissionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FilePermissionService]
    });
    service = TestBed.inject(FilePermissionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('setCurrentRole', () => {
    it('should set the current role', () => {
      // Arrange
      const role = 'viewer';

      // Act
      service.setCurrentRole(role);

      // Assert - we'll verify the role change through hasPermission
      expect(service.hasPermission('preview')).toBeTruthy();
      expect(service.hasPermission('download')).toBeTruthy();
      expect(service.hasPermission('edit')).toBeFalsy();
      expect(service.hasPermission('delete')).toBeFalsy();
    });
  });

  describe('hasPermission', () => {
    describe('when role is creator', () => {
      beforeEach(() => {
        service.setCurrentRole('creator');
      });

      it('should allow all operations', () => {
        const operations: FileOperation[] = ['preview', 'download', 'edit', 'delete'];
        operations.forEach(operation => {
          expect(service.hasPermission(operation)).toBeTruthy();
        });
      });
    });

    describe('when role is viewer', () => {
      beforeEach(() => {
        service.setCurrentRole('viewer');
      });

      it('should allow only preview and download operations', () => {
        // Should allow
        expect(service.hasPermission('preview')).toBeTruthy();
        expect(service.hasPermission('download')).toBeTruthy();

        // Should not allow
        expect(service.hasPermission('edit')).toBeFalsy();
        expect(service.hasPermission('delete')).toBeFalsy();
      });
    });

    describe('when role is invalid', () => {
      beforeEach(() => {
        service.setCurrentRole('invalid-role');
      });

      it('should not allow any operations', () => {
        const operations: FileOperation[] = ['preview', 'download', 'edit', 'delete'];
        operations.forEach(operation => {
          expect(service.hasPermission(operation)).toBeFalsy();
        });
      });
    });
  });
});