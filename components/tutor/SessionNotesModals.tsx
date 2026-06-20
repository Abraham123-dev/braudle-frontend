'use client';

import React, { useState, useEffect } from 'react';

interface AddNoteModalProps {
  onClose: () => void;
  onSave: (title: string, content: string) => void;
}

export function AddNoteModal({ onClose, onSave }: AddNoteModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;
    onSave(title.trim(), content.trim());
    setTitle('');
    setContent('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-charcoal/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-gray-100 max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
        <div>
          <h4 className="font-bold text-sm text-brand-forest">Add Session Note</h4>
          <p className="text-[10px] text-gray-400">Save a custom note to your local session workspace</p>
        </div>
        
        <div className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-brand-forest/60">Note Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Core physics formula"
              className="w-full rounded-xl border border-gray-250 bg-gray-50/50 py-2 sm:py-2.5 px-3.5 text-base sm:text-xs font-medium text-brand-forest focus:border-brand-green focus:bg-white focus:outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-brand-forest/60">Content</label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type note details here..."
              className="w-full h-32 rounded-xl border border-gray-250 bg-gray-50/50 p-3 flex flex-col justify-start text-base sm:text-xs font-medium text-brand-forest focus:border-brand-green focus:bg-white focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || !content.trim()}
            className="px-5 py-2 rounded-xl bg-brand-green text-xs font-bold text-white hover:bg-brand-green/90 transition-all cursor-pointer disabled:opacity-40"
          >
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
}

interface EditNoteModalProps {
  note: { id: string; title: string; content: string; createdAt: string };
  onClose: () => void;
  onUpdate: (id: string, title: string, content: string) => void;
  onDelete: (id: string) => void;
}

export function EditNoteModal({ note, onClose, onUpdate, onDelete }: EditNoteModalProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
  }, [note]);

  const handleUpdate = () => {
    if (!title.trim() || !content.trim()) return;
    onUpdate(note.id, title.trim(), content.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-charcoal/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-gray-100 max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
        <div>
          <h4 className="font-bold text-sm text-brand-forest">View & Edit Note</h4>
          <p className="text-[10px] text-gray-400">Created on {new Date(note.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-brand-forest/60">Note Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 sm:py-2.5 px-3.5 text-base sm:text-xs font-medium text-brand-forest focus:border-brand-green focus:bg-white focus:outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-brand-forest/60">Content</label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-32 rounded-xl border border-gray-250 bg-gray-50/50 p-3.5 text-base sm:text-xs font-medium text-brand-forest focus:border-brand-green focus:bg-white focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <button
            onClick={() => onDelete(note.id)}
            className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold transition-all cursor-pointer"
          >
            Delete Note
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-250 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleUpdate}
              disabled={!title.trim() || !content.trim()}
              className="px-5 py-2 rounded-xl bg-brand-green text-xs font-bold text-white hover:bg-brand-green/90 transition-all cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
