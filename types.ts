
export interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
}

export type SidebarView = 'folders' | 'all-notes';

export type SortOrder = 'updatedAt' | 'createdAt' | 'alphabetical';
