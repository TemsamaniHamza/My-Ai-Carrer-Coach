'use client';

import { Plus, Trash2 } from 'lucide-react';
import { ExperienceItem } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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
        <Label>Experience</Label>
        <Button type="button" variant="link" size="sm" onClick={addItem} className="h-auto p-0">
          <Plus className="h-3.5 w-3.5" />
          Add experience
        </Button>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">No experience added yet.</p>
      )}

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="rounded-md border p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium uppercase text-muted-foreground">
                Entry {index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(index)}
                className="h-auto p-0 text-xs font-medium text-destructive hover:bg-transparent hover:text-destructive/80"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                placeholder="Company"
                value={item.company}
                onChange={(e) => updateItem(index, 'company', e.target.value)}
              />
              <Input
                placeholder="Role"
                value={item.role}
                onChange={(e) => updateItem(index, 'role', e.target.value)}
              />
              <Input
                placeholder="Duration (e.g. 2022–2024)"
                value={item.duration}
                onChange={(e) => updateItem(index, 'duration', e.target.value)}
                className="sm:col-span-2"
              />
              <Textarea
                placeholder="Description (optional)"
                value={item.description ?? ''}
                onChange={(e) => updateItem(index, 'description', e.target.value)}
                rows={2}
                className="sm:col-span-2"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
