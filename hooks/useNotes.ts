import { useState, useMemo, useCallback } from 'react';
import type { Note, Folder, SortOrder } from '../types';

const initialFolders: Record<string, Folder> = {
  'folder-1': { id: 'folder-1', name: 'Getting Started', parentId: null },
};

const initialNotes: Record<string, Note> = {
  'note-1': {
    id: 'note-1',
    title: 'Welcome',
    content: 'This is your first note in your Virtual Brain Wiki. Try clicking on terms like Virtual Brain Wiki to see what happens. You can create new notes from any word. Words that are already note titles will appear in blue, and folder titles like Getting Started will appear in purple.',
    folderId: 'folder-1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  'note-2': {
    id: 'note-2',
    title: 'Virtual Brain Wiki',
    content: 'A Virtual Brain Wiki is a personal knowledge management system that uses bidirectional links to connect ideas. This allows you to navigate your thoughts in a non-linear way, mimicking how a brain works.',
    folderId: 'folder-1',
    createdAt: Date.now() - 10000,
    updatedAt: Date.now() - 10000,
  },
  'note-3': {
    id: 'note-3',
    title: 'Getting Started',
    content: 'To get started, simply start writing! Select any text to create a new note or get an AI definition. Organize your notes into folders on the left.',
    folderId: 'folder-1',
    createdAt: Date.now() - 20000,
    updatedAt: Date.now() - 20000,
  },
};

const sortNotes = (notesToSort: Note[], order: SortOrder): Note[] => {
    return [...notesToSort].sort((a, b) => {
      switch (order) {
        case 'alphabetical':
          return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
        case 'createdAt':
          return b.createdAt - a.createdAt; // Newest first
        case 'updatedAt':
        default:
          return b.updatedAt - a.updatedAt; // Newest first
      }
    });
};

export const useNotes = () => {
  const [notes, setNotes] = useState<Record<string, Note>>(initialNotes);
  const [folders, setFolders] = useState<Record<string, Folder>>(initialFolders);
  const [navigationHistory, setNavigationHistory] = useState<string[]>(['note-1']);
  const [activeFolderId, setActiveFolderId] = useState<string | null>('folder-1');
  const [sortOrder, setSortOrder] = useState<SortOrder>('updatedAt');

  const activeNoteId = useMemo(() => navigationHistory.length > 0 ? navigationHistory[navigationHistory.length - 1] : null, [navigationHistory]);

  const allNotes = useMemo(() => {
    const notesArray = Object.values(notes);
    return sortNotes(notesArray, sortOrder);
  }, [notes, sortOrder]);
  const allFolders = useMemo(() => Object.values(folders), [folders]);

  const noteTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    Object.values(notes).forEach(note => map.set(note.title.toLowerCase(), note.id));
    return map;
  }, [notes]);

  const folderNameMap = useMemo(() => {
    const map = new Map<string, string>();
    allFolders.forEach(folder => map.set(folder.name.toLowerCase(), folder.id));
    return map;
  }, [allFolders]);
  
  const folderMap = useMemo(() => {
    const map = new Map<string, Folder>();
    allFolders.forEach(folder => map.set(folder.id, folder));
    return map;
  }, [allFolders]);

  const sortedLinkableTerms = useMemo(() => {
    const noteTerms = Object.values(notes).map(n => ({ type: 'note' as const, term: n.title, id: n.id }));
    const folderTerms = allFolders.map(f => ({ type: 'folder' as const, term: f.name, id: f.id }));
    const uniqueFolderTerms = folderTerms.filter(f => !noteTitleMap.has(f.term.toLowerCase()));
    
    return [...noteTerms, ...uniqueFolderTerms].sort((a, b) => b.term.length - a.term.length);
  }, [notes, allFolders, noteTitleMap]);

  const selectNote = useCallback((noteId: string) => {
    setNavigationHistory([noteId]);
    const note = notes[noteId];
    if (note) {
      setActiveFolderId(note.folderId);
    }
  }, [notes]);

  const navigateToNote = useCallback((noteId: string) => {
    setNavigationHistory(prev => {
      if (prev.length > 0 && prev[prev.length - 1] === noteId) return prev;
      return [...prev, noteId];
    });
    const note = notes[noteId];
    if (note) {
      setActiveFolderId(note.folderId);
    }
  }, [notes]);

  const navigateBack = useCallback(() => {
    setNavigationHistory(prev => {
      if (prev.length > 1) {
        const newHistory = prev.slice(0, -1);
        const newActiveNoteId = newHistory[newHistory.length - 1];
        const note = notes[newActiveNoteId];
        if (note) {
          setActiveFolderId(note.folderId);
        }
        return newHistory;
      }
      return prev;
    });
  }, [notes]);

  const createNote = useCallback((title: string, content = '', folderId: string | null = activeFolderId): Note => {
    const lowerTitle = title.toLowerCase();
    if (noteTitleMap.has(lowerTitle)) {
        const existingId = noteTitleMap.get(lowerTitle)!;
        navigateToNote(existingId);
        return notes[existingId];
    }
    const newId = `note-${Date.now()}`;
    const newNote: Note = {
      id: newId,
      title,
      content,
      folderId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes(prev => ({ ...prev, [newId]: newNote }));
    setNavigationHistory([newId]);
    return newNote;
  }, [activeFolderId, notes, noteTitleMap, navigateToNote]);

  const updateNoteContent = useCallback((noteId: string, newContent: string) => {
    setNotes(prev => ({
      ...prev,
      [noteId]: { ...prev[noteId], content: newContent, updatedAt: Date.now() },
    }));
  }, []);

  const updateNoteTitle = useCallback((noteId: string, newTitle: string): boolean => {
    const lowerNewTitle = newTitle.toLowerCase();
    const existingNoteId = noteTitleMap.get(lowerNewTitle);
    if (existingNoteId && existingNoteId !== noteId) {
        alert('A note with this title already exists.');
        return false;
    }
    setNotes(prev => ({
        ...prev,
        [noteId]: { ...prev[noteId], title: newTitle, updatedAt: Date.now() },
    }));
    return true;
  }, [noteTitleMap]);

  const deleteNote = useCallback((noteId: string) => {
    if (activeNoteId === noteId) {
        navigateBack();
    }
    setNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[noteId];
        return newNotes;
    });
    setNavigationHistory(prev => prev.filter(id => id !== noteId));
  }, [activeNoteId, navigateBack]);
  
  const createFolder = useCallback((name: string, parentId: string | null) => {
    const newId = `folder-${Date.now()}`;
    const newFolder: Folder = { id: newId, name, parentId };
    setFolders(prev => ({ ...prev, [newId]: newFolder }));
    setActiveFolderId(newId);
    setNavigationHistory([]);
  }, []);

  const deleteFolder = useCallback((folderId: string) => {
    setFolders(prev => {
        const newFolders = { ...prev };
        delete newFolders[folderId];
        // This is a simple implementation: move orphaned children to root.
        Object.values(newFolders).forEach(f => {
            if (f.parentId === folderId) {
                newFolders[f.id] = { ...f, parentId: null };
            }
        });
        return newFolders;
    });
    setNotes(prev => {
        const newNotes = { ...prev };
        Object.values(newNotes).forEach(n => {
            if (n.folderId === folderId) {
                newNotes[n.id] = { ...n, folderId: null };
            }
        });
        return newNotes;
    });
    if (activeFolderId === folderId) {
        setActiveFolderId(null);
    }
  }, [activeFolderId]);
  
  const selectFolder = useCallback((folderId: string) => {
    setActiveFolderId(folderId);
    setNavigationHistory([]);
  }, []);

  const getNotesInFolder = useCallback((folderId: string | null) => {
    return allNotes.filter(note => note.folderId === folderId);
  }, [allNotes]);

  const activeNote = useMemo(() => activeNoteId ? notes[activeNoteId] : null, [activeNoteId, notes]);
  
  const activeNotePath = useMemo(() => {
    if (!activeNote || !activeNote.folderId) return null;
    
    const getPath = (folderId: string): string[] => {
        const folder = folderMap.get(folderId);
        if (!folder) return [];
        const parentPath = folder.parentId ? getPath(folder.parentId) : [];
        return [...parentPath, folder.name];
    };
    
    return getPath(activeNote.folderId).join(' / ');
  }, [activeNote, folderMap]);

  return {
    notes,
    folders: allFolders,
    allNotes,
    activeNote,
    activeNoteId,
    activeFolderId,
    setActiveFolderId: selectFolder,
    createNote,
    updateNoteContent,
    updateNoteTitle,
    deleteNote,
    createFolder,
    deleteFolder,
    getNotesInFolder,
    noteTitleMap,
    folderNameMap,
    sortedLinkableTerms,
    navigationHistory,
    selectNote,
    navigateToNote,
    navigateBack,
    activeNotePath,
    sortOrder,
    setSortOrder,
  };
};