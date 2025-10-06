
import React, { useState } from 'react';
import type { Note } from '../types';

interface AllNotesViewProps {
  notes: Note[];
  onSelectNote: (noteId: string) => void;
}

const AllNotesView: React.FC<AllNotesViewProps> = ({ notes, onSelectNote }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-2 h-full flex flex-col">
      <input
        type="text"
        placeholder="Search all notes..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary mb-4"
      />
      <div className="overflow-y-auto flex-grow">
        {filteredNotes.map(note => (
          <div
            key={note.id}
            onClick={() => onSelectNote(note.id)}
            className="text-left text-sm p-2 rounded-md cursor-pointer hover:bg-gray-700 transition-colors"
          >
            {note.title}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllNotesView;
