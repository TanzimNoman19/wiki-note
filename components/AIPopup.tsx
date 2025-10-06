
import React, { useState, useEffect } from 'react';
import { getTermDefinition } from '../services/geminiService';
import { CloseIcon } from './Icons';

interface AIPopupProps {
  term: string;
  context: string;
  onClose: () => void;
  onCreateNote: (title: string, content?: string) => void;
}

const AIPopup: React.FC<AIPopupProps> = ({ term, context, onClose, onCreateNote }) => {
  const [definition, setDefinition] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDefinition = async () => {
      setIsLoading(true);
      const result = await getTermDefinition(term, context);
      setDefinition(result);
      setIsLoading(false);
    };
    fetchDefinition();
  }, [term, context]);

  const handleCreateNote = () => {
    onCreateNote(term, definition);
    onClose();
  };

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
        onClick={onClose}
    >
      <div 
        className="bg-surface rounded-lg shadow-2xl p-6 w-full max-w-2xl relative border border-gray-700 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors">
          <CloseIcon className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-primary mb-4 capitalize">{term}</h2>
        <div className="text-text-secondary max-h-[50vh] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap leading-relaxed">{definition}</p>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-3">
            <button
                onClick={handleCreateNote}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-500 transition-colors font-semibold shadow-md"
            >
                Create Note for "{term}"
            </button>
        </div>
      </div>
    </div>
  );
};

export default AIPopup;