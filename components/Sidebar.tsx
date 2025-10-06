import React, { useState, useMemo } from 'react';
import type { Note, Folder, SidebarView, SortOrder } from '../types';
import { FolderIcon, DocumentIcon, PlusIcon, BookOpenIcon, EditIcon, TrashIcon } from './Icons';
import AllNotesView from './AllNotesView';
import CreateModal from './CreateModal';

interface SidebarProps {
  folders: Folder[];
  notes: Note[];
  activeNoteId: string | null;
  activeFolderId: string | null;
  onSelectNote: (noteId: string) => void;
  onSelectFolder: (folderId: string) => void;
  onCreateNote: (title: string, content: string) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onDeleteFolder: (folderId: string) => void;
  getNotesInFolder: (folderId: string | null) => Note[];
  onDeleteNote: (noteId:string) => void;
  onUpdateNoteTitle: (noteId: string, newTitle: string) => void;
  sortOrder: SortOrder;
  onSetSortOrder: (order: SortOrder) => void;
}

const FolderItem: React.FC<{
    folder: Folder;
    allFolders: Folder[];
    notesInFolder: Note[];
    level: number;
} & Omit<SidebarProps, 'folders'|'notes'|'onCreateNote'|'onCreateFolder'|'sortOrder'|'onSetSortOrder'>> = ({
    folder, allFolders, notesInFolder, level, activeNoteId, activeFolderId, onSelectNote, onSelectFolder, onDeleteFolder, onDeleteNote, onUpdateNoteTitle, getNotesInFolder
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const childFolders = allFolders.filter(f => f.parentId === folder.id);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelectFolder(folder.id);
        setIsExpanded(prev => !prev);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete folder "${folder.name}" and move its contents to the root?`)) {
            onDeleteFolder(folder.id);
        }
    };

    const handleUpdateNoteTitle = (noteId: string, currentTitle: string) => {
        const newTitle = prompt('Enter new note title:', currentTitle);
        if (newTitle && newTitle !== currentTitle) {
          onUpdateNoteTitle(noteId, newTitle);
        }
    };
    
    const handleDeleteNote = (noteId: string, noteTitle: string) => {
        if (window.confirm(`Are you sure you want to delete "${noteTitle}"?`)) {
          onDeleteNote(noteId);
        }
    };

    return (
        <div style={{ paddingLeft: `${level * 1}rem` }}>
            <div
                onClick={handleToggle}
                className={`group flex items-center justify-between gap-2 p-2 rounded-md cursor-pointer ${activeFolderId === folder.id ? 'bg-primary/30' : 'hover:bg-gray-700'}`}
            >
                <div className="flex items-center gap-2">
                    <FolderIcon className="w-5 h-5 text-primary" />
                    <span className="font-semibold">{folder.name}</span>
                </div>
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={handleDelete} className="p-1 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                </div>
            </div>
            {isExpanded && (
                <div className="pl-2 mt-1 border-l-2 border-gray-700">
                    {notesInFolder.map(note => (
                         <div
                            key={note.id}
                            className={`group flex items-center justify-between gap-2 p-2 rounded-md cursor-pointer truncate ${activeNoteId === note.id ? 'bg-accent/20 text-accent' : 'hover:bg-gray-700'}`}
                        >
                            <div onClick={() => onSelectNote(note.id)} className="flex items-center gap-2 truncate flex-1">
                              <DocumentIcon className="w-4 h-4 flex-shrink-0" />
                              <span className="text-sm truncate">{note.title}</span>
                            </div>
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={(e) => {e.stopPropagation(); handleUpdateNoteTitle(note.id, note.title);}} className="p-1 hover:text-white"><EditIcon className="w-4 h-4"/></button>
                              <button onClick={(e) => {e.stopPropagation(); handleDeleteNote(note.id, note.title);}} className="p-1 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                            </div>
                        </div>
                    ))}
                    {childFolders.map(child => (
                        <FolderItem 
                            key={child.id}
                            folder={child}
                            allFolders={allFolders}
                            notesInFolder={getNotesInFolder(child.id)}
                            level={level + 1}
                            {...{ activeNoteId, activeFolderId, onSelectNote, onSelectFolder, onDeleteFolder, getNotesInFolder, onDeleteNote, onUpdateNoteTitle }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

const Sidebar: React.FC<SidebarProps> = (props) => {
  const { folders, notes, onCreateNote, onCreateFolder, getNotesInFolder, sortOrder, onSetSortOrder } = props;
  const [view, setView] = useState<SidebarView>('folders');
  const [modalState, setModalState] = useState<{isOpen: boolean; type: 'note' | 'folder' | null}>({isOpen: false, type: null});

  const handleModalSubmit = (data: { name: string; content?: string; parentId?: string | null; }) => {
    if (modalState.type === 'note') {
      onCreateNote(data.name, data.content || '');
    } else if (modalState.type === 'folder') {
      onCreateFolder(data.name, data.parentId || null);
    }
    setModalState({ isOpen: false, type: null });
  };
  
  const rootFolders = useMemo(() => folders.filter(f => f.parentId === null), [folders]);

  const FolderView = () => (
    <div className="flex-grow overflow-y-auto">
        {rootFolders.map(folder => (
            <FolderItem
                key={folder.id}
                folder={folder}
                allFolders={folders}
                notesInFolder={getNotesInFolder(folder.id)}
                level={0}
                {...props}
            />
        ))}
    </div>
  );

  return (
    <>
      <aside className="w-72 bg-surface text-text-secondary p-4 flex flex-col border-r border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="text-xl font-bold text-text-primary">Virtual Brain</h1>
        </div>

        <div className="flex bg-gray-900 rounded-lg p-1 mb-4">
          <button onClick={() => setView('folders')} className={`w-1/2 p-2 text-sm rounded-md flex items-center justify-center gap-2 ${view === 'folders' ? 'bg-primary text-white' : ''}`}>
              <FolderIcon className="w-5 h-5"/> Folders
          </button>
          <button onClick={() => setView('all-notes')} className={`w-1/2 p-2 text-sm rounded-md flex items-center justify-center gap-2 ${view === 'all-notes' ? 'bg-primary text-white' : ''}`}>
              <BookOpenIcon className="w-5 h-5"/> All Notes
          </button>
        </div>
        
        <div className="mb-4">
            <label htmlFor="sort-order" className="block text-xs font-medium text-text-secondary mb-1 uppercase tracking-wider">Sort by</label>
            <div className="relative">
                <select
                    id="sort-order"
                    value={sortOrder}
                    onChange={(e) => onSetSortOrder(e.target.value as SortOrder)}
                    className="w-full pl-3 pr-8 py-2 bg-gray-900 border border-gray-700 rounded-md text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary appearance-none transition-colors"
                >
                    <option value="updatedAt">Last Updated</option>
                    <option value="createdAt">Date Created</option>
                    <option value="alphabetical">Title (A-Z)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
        </div>

        {view === 'folders' ? <FolderView /> : <AllNotesView notes={notes} onSelectNote={props.onSelectNote} />}
        
        {view === 'folders' && (
          <div className="mt-auto pt-4 border-t border-gray-700 flex gap-2">
              <button onClick={() => setModalState({ isOpen: true, type: 'note' })} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 text-sm rounded-md hover:bg-gray-600 transition-colors">
              <PlusIcon className="w-4 h-4" /> Note
              </button>
              <button onClick={() => setModalState({ isOpen: true, type: 'folder' })} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 text-sm rounded-md hover:bg-gray-600 transition-colors">
              <PlusIcon className="w-4 h-4" /> Folder
              </button>
          </div>
        )}
      </aside>
      <CreateModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        folders={folders}
        activeFolderId={props.activeFolderId}
        onClose={() => setModalState({ isOpen: false, type: null })}
        onSubmit={handleModalSubmit}
      />
    </>
  );
};

export default Sidebar;