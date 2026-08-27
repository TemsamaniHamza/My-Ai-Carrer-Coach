'use client';

import { ExperienceItem } from '@/types/user';

interface ExperienceEditorProps {
  items: ExperienceItem[];
  onChange: (items: ExperienceItem[]) => void;
}

const EMPTY_ITEM: ExperienceItem = { company: '', role: '', duration: '', description: '' };

export function ExperienceEditor({ items, onChange }: ExperienceEditorProps) {
  function updateItem(index: number, field: keyof ExperienceItem, value: string) {
    const next = items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    onChange(next);
  }

  function addItem() {
    onChange([...items, { ...EMPTY_ITEM }]);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">Experience</label>
        <button
          type="button"
          onClick={addItem}
          className="text-sm font-medium text-blue-700 underline"
        >
          + Add experience
        </button>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-gray-400">No experience added yet.</p>
      )}

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="rounded-md border border-gray-300 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium uppercase text-gray-400">
                Entry {index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="text-xs font-medium text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Company"
                value={item.company}
                onChange={(e) => updateItem(index, 'company', e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Role"
                value={item.role}
                onChange={(e) => updateItem(index, 'role', e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Duration (e.g. 2022–2024)"
                value={item.duration}
                onChange={(e) => updateItem(index, 'duration', e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none sm:col-span-2"
              />
              <textarea
                placeholder="Description (optional)"
                value={item.description ?? ''}
                onChange={(e) => updateItem(index, 'description', e.target.value)}
                rows={2}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none sm:col-span-2"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
