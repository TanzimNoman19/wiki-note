import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import NoteEditor from './components/NoteEditor';
import AIPopup from './components/AIPopup';
import { useNotes } from './hooks/useNotes';

const App: React.FC = () => {
  const {
    folders,
    allNotes,
    activeNote,
    activeNoteId,
    activeFolderId,
    setActiveFolderId,
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
  } = useNotes();

  const [aiPopupTerm, setAiPopupTerm] = useState<string | null>(null);
  const [isNoteVisibleOnMobile, setIsNoteVisibleOnMobile] = useState(false);

  const handleSelectNote = useCallback((noteId: string) => {
    selectNote(noteId);
    setIsNoteVisibleOnMobile(true);
  }, [selectNote]);

  const handleNavigateToNote = useCallback((noteId: string) => {
    navigateToNote(noteId);
    setIsNoteVisibleOnMobile(true);
  }, [navigateToNote]);

  const handleMobileBack = useCallback(() => {
    setIsNoteVisibleOnMobile(false);
  }, []);

  const handleDeleteNote = useCallback((noteId: string) => {
    deleteNote(noteId);
    setIsNoteVisibleOnMobile(false);
  }, [deleteNote]);

  const handleWordClick = useCallback((term: string) => {
    const lowerTerm = term.toLowerCase();
    const noteId = noteTitleMap.get(lowerTerm);
    if (noteId) {
      handleNavigateToNote(noteId);
      return;
    }
    const folderId = folderNameMap.get(lowerTerm);
    if (folderId) {
        setActiveFolderId(folderId);
        return;
    }
    setAiPopupTerm(term);
  }, [noteTitleMap, folderNameMap, handleNavigateToNote, setActiveFolderId]);

  const handleFolderLinkClick = useCallback((folderId: string) => {
      setActiveFolderId(folderId);
      // On mobile, switch back to sidebar view to see the folder
      setIsNoteVisibleOnMobile(false);
  }, [setActiveFolderId]);

  const closeAiPopup = () => {
    setAiPopupTerm(null);
  };
  
  return (
    <div className="h-screen w-screen flex bg-background font-sans overflow-hidden">
      <div className={`
        w-full md:w-72 md:flex flex-col flex-shrink-0 h-full
        ${isNoteVisibleOnMobile && activeNoteId ? 'hidden' : 'flex'}
      `}>
        <Sidebar
          folders={folders}
          notes={allNotes}
          activeNoteId={activeNoteId}
          activeFolderId={activeFolderId}
          onSelectNote={handleSelectNote}
          onSelectFolder={setActiveFolderId}
          onCreateNote={createNote}
          onCreateFolder={createFolder}
          onDeleteFolder={deleteFolder}
          getNotesInFolder={getNotesInFolder}
          onDeleteNote={handleDeleteNote}
          onUpdateNoteTitle={updateNoteTitle}
          sortOrder={sortOrder}
          onSetSortOrder={setSortOrder}
        />
      </div>

      <div className={`
        flex-1 h-full
        ${isNoteVisibleOnMobile && activeNoteId ? 'flex' : 'hidden'} md:flex flex-col
      `}>
        <NoteEditor
          note={activeNote}
          noteTitleMap={noteTitleMap}
          folderNameMap={folderNameMap}
          sortedLinkableTerms={sortedLinkableTerms}
          onWordClick={handleWordClick}
          onNoteLinkClick={handleNavigateToNote}
          onFolderLinkClick={handleFolderLinkClick}
          onUpdateContent={updateNoteContent}
          onUpdateNoteTitle={updateNoteTitle}
          onDeleteNote={handleDeleteNote}
          navigationHistory={navigationHistory}
          onNavigateBack={navigateBack}
          activeNotePath={activeNotePath}
          onMobileBack={handleMobileBack}
        />
      </div>
      
      {aiPopupTerm && activeNote && (
        <AIPopup
          term={aiPopupTerm}
          context={activeNote.content}
          onClose={closeAiPopup}
          onCreateNote={createNote}
        />
      )}
    </div>
  );
};

export default App;
