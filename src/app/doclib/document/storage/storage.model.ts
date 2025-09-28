export interface FileMetadata {
  description: string;
  tags: string[];
}

export interface FileContextMetadata {
  id: string;
  name: string;
  type: string;
  size: number;
  path: string;
}

export interface LocalStorageFile {
  id: string;
  name: string;
  content: string | ArrayBuffer;
  mimeType: string;
  type: string;
  size: number;
  path: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  folderId: string;
  metadata?: FileMetadata;
}

export interface LocalStorageFolder {
  id: string;
  name: string;
  path: string;
  parentId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  icon?: string;
  description?: string;
  tags?: string[];
}

export interface StorageHierarchy {
  folders: Record<string, LocalStorageFolder>;
  files: Record<string, LocalStorageFile>;
  rootFolderId: string;
}