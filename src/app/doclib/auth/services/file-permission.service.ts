import { Injectable } from '@angular/core';

export type FileOperation = 'preview' | 'download' | 'edit' | 'delete';

@Injectable({
  providedIn: 'root'
})
export class FilePermissionService {
  private readonly ROLE_PERMISSIONS: Record<string, FileOperation[]> = {
    'creator': ['preview', 'download', 'edit', 'delete'],
    'viewer': ['preview', 'download']
  };

  private currentRole = 'creator'; // This would normally come from auth service

  hasPermission(operation: FileOperation): boolean {
    const allowedOperations = this.ROLE_PERMISSIONS[this.currentRole] || [];
    return allowedOperations.includes(operation);
  }

  // For testing purposes
  setCurrentRole(role: string): void {
    this.currentRole = role;
  }
}