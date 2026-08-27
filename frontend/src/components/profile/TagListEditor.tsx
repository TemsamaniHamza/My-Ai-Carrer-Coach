'use client';

import { KeyboardEvent, useState } from 'react';

interface TagListEditorProps {
  label: string;
  placeholder: string;
  items: string[];
  onChange: (items: string[]) => void;
}

/** Add/remove editor for simple string lists — used for both skills and languages. */
export function TagListEditor({ label, placeholder, items, onChange }: TagListEditorProps) {
  const [draft, setDraft] = useState('');

  function addItem() {
    const value = draft.trim();
    if (!value || items.includes(value)) {
      setDraft('');
      return;
    }
    onChange([...items, value]);
    setDraft('');
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addItem();
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex flex-wrap gap-2 rounded-md border border-gray-300 p-2">
        {items.map((item, index) => (
          <span
            key={item}
            className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800"
          >
            {item}
            <button
              type="button"
              onClick={() => removeItem(index)}
              aria-label={`Remove ${item}`}
              className="text-gray-400 hover:text-gray-700"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addItem}
          placeholder={placeholder}
          className="min-w-[8rem] flex-1 border-none px-1 py-1 text-sm focus:outline-none"
        />
      </div>
      <p className="mt-1 text-xs text-gray-400">Press Enter or comma to add.</p>
    </div>
  );
}
