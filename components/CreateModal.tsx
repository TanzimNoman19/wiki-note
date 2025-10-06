import React, { useState, useEffect } from 'react';
import { CloseIcon, FolderIcon, ChevronRightIcon } from './Icons';
import type { Folder } from '../types';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; content?: string; parentId?: string | null }) => void;
  type: 'note' | 'folder' | null;
  folders: Folder[];
  activeFolderId: string | null;
}

const FolderPickerItem: React.FC<{
  folder: Folder;
  allFolders: Folder[];
  level: number;
  selectedParentId: string | null;
  onSelectParentId: (id: string | null) => void;
}> = ({ folder, allFolders, level, selectedParentId, onSelectParentId }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const childFolders = allFolders.filter(f => f.parentId === folder.id);

  return (
    <div>
      <div className="flex items-center group my-1">
        <button 
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} 
          className={`flex-shrink-0 w-6 h-6 p-1 rounded-full hover:bg-gray-700 ${childFolders.length === 0 ? 'invisible' : ''}`}
          aria-label={isExpanded ? `Collapse ${folder.name}` : `Expand ${folder.name}`}
        >
          <ChevronRightIcon className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
        </button>
        <div
          onClick={() => onSelectParentId(folder.id)}
          className={`flex items-center gap-2 p-2 rounded-md cursor-pointer flex-grow ${selectedParentId === folder.id ? 'bg-primary/30' : 'hover:bg-gray-700'}`}
        >
          <FolderIcon className="w-5 h-5 text-primary flex-shrink-0" />
          <span className="text-sm truncate">{folder.name}</span>
        </div>
      </div>
      {isExpanded && childFolders.length > 0 && (
        <div className="pl-6 border-l-2 border-gray-600 ml-3">
          {childFolders.map(child => (
            <FolderPickerItem
              key={child.id}
              folder={child}
              allFolders={allFolders}
              level={level + 1}
              selectedParentId={selectedParentId}
              onSelectParentId={onSelectParentId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CreateModal: React.FC<CreateModalProps> = ({ isOpen, onClose, onSubmit, type, folders, activeFolderId }) => {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setContent('');
      setParentId(activeFolderId);
    }
  }, [isOpen, activeFolderId]);

  if (!isOpen || !type) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit({ name: name.trim(), content, parentId });
    }
  };

  const title = type === 'note' ? 'Create New Note' : 'Create New Folder';
  const label = type === 'note' ? 'Note Title' : 'Folder Name';
  const rootFolders = folders.filter(f => f.parentId === null);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-lg shadow-2xl p-6 w-full max-w-md relative border border-gray-700 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors">
          <CloseIcon className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-text-primary mb-4">{title}</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
                <label htmlFor="itemName" className="block text-sm font-medium text-text-secondary mb-2">
                    {label}
                </label>
                <input
                    id="itemName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                />
            </div>

            {type === 'note' && (
                <div>
                    <label htmlFor="itemContent" className="block text-sm font-medium text-text-secondary mb-2">
                        Content (Optional)
                    </label>
                    <textarea
                        id="itemContent"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={5}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                    />
                </div>
            )}

            {type === 'folder' && (
                 <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                        Parent Folder
                    </label>
                    <div className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md max-h-48 overflow-y-auto">
                        <div
                            onClick={() => setParentId(null)}
                            className={`p-2 rounded-md cursor-pointer text-sm font-medium ${parentId === null ? 'bg-primary/30' : 'hover:bg-gray-700'}`}
                        >
                            None (Root Folder)
                        </div>
                        {rootFolders.map(folder => (
                            <FolderPickerItem
                                key={folder.id}
                                folder={folder}
                                allFolders={folders}
                                level={0}
                                selectedParentId={parentId}
                                onSelectParentId={setParentId}
                            />
                        ))}
                    </div>
                </div>
            )}

          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-500 transition-colors font-semibold shadow-md disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateModal;
