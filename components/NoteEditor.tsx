import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Note } from '../types';
import { EditIcon, BookOpenIcon, TrashIcon, ArrowLeftIcon } from './Icons';

interface NoteEditorProps {
  note: Note | null;
  noteTitleMap: Map<string, string>;
  folderNameMap: Map<string, string>;
  sortedLinkableTerms: Array<{ type: 'note' | 'folder'; term: string; id: string }>;
  onWordClick: (term: string) => void;
  onNoteLinkClick: (noteId: string) => void;
  onFolderLinkClick: (folderId: string) => void;
  onUpdateContent: (noteId: string, content: string) => void;
  onUpdateNoteTitle: (noteId: string, newTitle: string) => boolean;
  onDeleteNote: (noteId: string) => void;
  navigationHistory: string[];
  onNavigateBack: () => void;
  onMobileBack: () => void;
  activeNotePath: string | null;
}

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const SuggestionPopup: React.FC<{
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}> = ({ suggestions, onSuggestionClick }) => {
  if (suggestions.length === 0) return null;
  return (
    <div className="absolute z-10 w-full max-w-sm bg-surface border border-gray-700 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
      <ul>
        {suggestions.map((suggestion, index) => (
          <li
            key={index}
            onMouseDown={(e) => { e.preventDefault(); onSuggestionClick(suggestion); }}
            className="px-4 py-2 text-sm text-text-secondary hover:bg-primary/20 cursor-pointer"
          >
            {suggestion}
          </li>
        ))}
      </ul>
    </div>
  );
};

const TextRenderer: React.FC<{ text: string; onWordClick: (word: string) => void; }> = ({ text, onWordClick }) => {
    return (
        <>
            {text.split(/(\s+)/).map((segment, index) => {
                if (segment.trim() === '') {
                    return <span key={index}>{segment}</span>;
                }
                return (
                    <span 
                        key={index} 
                        onClick={() => onWordClick(segment.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,""))}
                        className="cursor-pointer hover:bg-primary/20"
                    >
                        {segment}
                    </span>
                );
            })}
        </>
    );
};

const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  noteTitleMap,
  folderNameMap,
  sortedLinkableTerms,
  onWordClick,
  onNoteLinkClick,
  onFolderLinkClick,
  onUpdateContent,
  onUpdateNoteTitle,
  onDeleteNote,
  navigationHistory,
  onNavigateBack,
  onMobileBack,
  activeNotePath,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [editTitle, setEditTitle] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (note) {
            setEditContent(note.content);
            setEditTitle(note.title);
            setIsEditing(false);
        } else {
            setIsEditing(false);
        }
        setSuggestions([]);
    }, [note]);

    const handleSave = () => {
        if (!note) return;
        const trimmedTitle = editTitle.trim();
        if (!trimmedTitle) {
            alert("Title cannot be empty.");
            return;
        }
        const titleChanged = trimmedTitle !== note.title;
        if (titleChanged) {
            const success = onUpdateNoteTitle(note.id, trimmedTitle);
            if (!success) return; 
        }
        if (editContent !== note.content) {
            onUpdateContent(note.id, editContent);
        }
        setIsEditing(false);
        setSuggestions([]);
    };

    const handleCancel = () => {
        if (note) {
            setEditContent(note.content);
            setEditTitle(note.title);
        }
        setIsEditing(false);
        setSuggestions([]);
    };

    const handleDelete = () => {
      if (note && window.confirm(`Are you sure you want to delete "${note.title}"?`)) {
        onDeleteNote(note.id);
      }
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { value, selectionStart } = e.target;
        setEditContent(value);
    
        const textBeforeCursor = value.substring(0, selectionStart);
        const currentWordMatch = textBeforeCursor.match(/\S+$/);
        const currentWord = currentWordMatch ? currentWordMatch[0] : '';
    
        if (currentWord.length > 1) {
          const filteredSuggestions = sortedLinkableTerms
            .map(t => t.term)
            .filter(term => term.toLowerCase().startsWith(currentWord.toLowerCase()) && term.toLowerCase() !== currentWord.toLowerCase());
          setSuggestions(filteredSuggestions.slice(0, 7)); // Limit suggestions
        } else {
          setSuggestions([]);
        }
    };
    
    const handleSuggestionClick = (suggestion: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
    
        const { value, selectionStart } = textarea;
        const textBeforeCursor = value.substring(0, selectionStart);
        const currentWordMatch = textBeforeCursor.match(/\S+$/);
        
        if (currentWordMatch) {
            const currentWord = currentWordMatch[0];
            const startIndex = selectionStart - currentWord.length;
            const newValue = value.substring(0, startIndex) + suggestion + value.substring(selectionStart);
            setEditContent(newValue);
            
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(startIndex + suggestion.length, startIndex + suggestion.length);
            }, 0);
        }
        setSuggestions([]);
    };
  
    const parsedContent = useMemo(() => {
        if (!note || !note.content) return [];
        if (sortedLinkableTerms.length === 0) {
            return [{ type: 'text' as const, content: note.content }];
        }
        const termsRegex = new RegExp(`(${sortedLinkableTerms.map(t => escapeRegExp(t.term)).join('|')})`, 'gi');
        const parts = note.content.split(termsRegex);
        
        return parts.filter(part => part).map((part) => {
            const lowerPart = part.toLowerCase();
            const noteId = noteTitleMap.get(lowerPart);
            if (noteId && noteId !== note.id) {
                return { type: 'note' as const, content: part, id: noteId };
            }
            const folderId = folderNameMap.get(lowerPart);
            if (folderId) {
                return { type: 'folder' as const, content: part, id: folderId };
            }
            return { type: 'text' as const, content: part };
        });
    }, [note, sortedLinkableTerms, noteTitleMap, folderNameMap]);

    if (!note) {
        return (
            <main className="flex-1 hidden md:flex items-center justify-center text-text-secondary">
                <div className="text-center p-4">
                    <BookOpenIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                    <h2 className="text-2xl font-semibold">Select a note</h2>
                    <p>Choose a note from the sidebar to view or edit it.</p>
                </div>
            </main>
        );
    }

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
        <div className="max-w-4xl mx-auto w-full p-4 md:p-8 flex flex-col h-full">
            {isEditing ? (
                 <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6">
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="text-3xl md:text-4xl font-bold text-text-primary bg-transparent focus:outline-none border-b-2 border-gray-700 focus:border-primary w-full mr-4 transition-colors"
                            placeholder="Note Title"
                        />
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-md hover:bg-indigo-500 transition-colors shadow-md"
                            >
                                Save
                            </button>
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 bg-gray-600 text-white text-sm font-semibold rounded-md hover:bg-gray-500 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                    <div className="relative flex-1">
                        <textarea
                            ref={textareaRef}
                            value={editContent}
                            onChange={handleContentChange}
                            onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                            className="w-full h-full bg-gray-900 text-lg p-4 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed resize-none"
                            placeholder="Start writing your note..."
                        />
                        <SuggestionPopup suggestions={suggestions} onSuggestionClick={handleSuggestionClick} />
                    </div>
                </div>
            ) : (
                <>
                    <div className="mb-6 pb-4 border-b border-gray-700">
                      <div className="flex justify-between items-start">
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                              <button
                                  onClick={onMobileBack}
                                  title="Back to list"
                                  className="p-2 -ml-2 rounded-full text-text-secondary hover:bg-gray-700 hover:text-text-primary transition-colors md:hidden"
                              >
                                  <ArrowLeftIcon className="w-5 h-5" />
                              </button>
                              <h1 className="text-3xl md:text-4xl font-bold text-text-primary break-words truncate mr-4">{note.title}</h1>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                              {navigationHistory.length > 1 && (
                                <button
                                  onClick={onNavigateBack}
                                  title="Go back"
                                  className="p-2 rounded-full text-text-secondary hover:bg-gray-700 hover:text-text-primary transition-colors"
                                >
                                  <ArrowLeftIcon className="w-5 h-5" />
                                </button>
                              )}
                              <button
                                  onClick={() => setIsEditing(true)}
                                  title="Edit note"
                                  className="p-2 rounded-full text-text-secondary hover:bg-gray-700 hover:text-text-primary transition-colors"
                              >
                                  <EditIcon className="w-5 h-5" />
                              </button>
                              <button
                                  onClick={handleDelete}
                                  title="Delete note"
                                  className="p-2 rounded-full text-text-secondary hover:bg-gray-700 hover:text-red-400 transition-colors"
                              >
                                  <TrashIcon className="w-5 h-5" />
                              </button>
                          </div>
                      </div>
                      {activeNotePath && (
                          <div className="text-sm text-text-secondary mt-3 font-mono truncate">
                              {activeNotePath} / <span className="text-text-primary font-semibold">{note.title}</span>
                          </div>
                      )}
                    </div>

                    <div className="prose prose-invert lg:prose-xl max-w-none text-lg text-text-secondary leading-relaxed flex-1 overflow-y-auto py-4">
                        {parsedContent.length > 0 && note.content.trim() !== '' ? (
                            parsedContent.map((part, index) => {
                                if (part.type === 'note' && part.id) {
                                    return (
                                        <span
                                            key={index}
                                            onClick={() => onNoteLinkClick(part.id!)}
                                            className="text-accent font-semibold cursor-pointer hover:underline"
                                        >
                                            {part.content}
                                        </span>
                                    );
                                }
                                if (part.type === 'folder' && part.id) {
                                    return (
                                        <span
                                            key={index}
                                            onClick={() => onFolderLinkClick(part.id!)}
                                            className="text-secondary font-semibold cursor-pointer hover:underline"
                                        >
                                            {part.content}
                                        </span>
                                    );
                                }
                                return <TextRenderer key={index} text={part.content} onWordClick={onWordClick} />;
                            })
                        ) : (
                            <div className="text-center text-gray-500 italic mt-10">
                                This note is empty. Click the edit button to add content.
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    </main>
  );
};

export default NoteEditor;
