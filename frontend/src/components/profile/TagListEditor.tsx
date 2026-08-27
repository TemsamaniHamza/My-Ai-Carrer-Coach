'use client';

import { KeyboardEvent, useState } from 'react';
import { X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

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
      <Label className="mb-1.5 block">{label}</Label>
      <div className="flex flex-wrap gap-2 rounded-md border border-input bg-transparent p-2">
        {items.map((item, index) => (
          <Badge key={item} variant="secondary" className="gap-1 py-1 pl-3 pr-1.5 text-sm font-normal">
            {item}
            <button
              type="button"
              onClick={() => removeItem(index)}
              aria-label={`Remove ${item}`}
              className="rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addItem}
          placeholder={placeholder}
          className="min-w-[8rem] flex-1 border-none bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Press Enter or comma to add.</p>
    </div>
  );
}
