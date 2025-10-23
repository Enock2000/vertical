// src/components/rich-text-editor.tsx
'use client';

import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// This is a placeholder for a real rich text editor.
// A full implementation would involve a library like Tiptap, Slate, or Quill.
export const RichTextEditor = React.forwardRef<
  HTMLTextAreaElement,
  RichTextEditorProps
>(({ value, onChange, placeholder }, ref) => {
  return (
    <div className="rounded-md border border-input">
      <div className="border-b p-1">
        {/* Placeholder for toolbar */}
        <div className="flex items-center gap-1">
          <button type="button" className="p-1.5 rounded hover:bg-muted">B</button>
          <button type="button" className="p-1.5 rounded hover:bg-muted italic">I</button>
          <button type="button" className="p-1.5 rounded hover:bg-muted underline">U</button>
        </div>
      </div>
      <Textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-40 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';
