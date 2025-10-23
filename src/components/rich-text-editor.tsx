// src/components/rich-text-editor.tsx
'use client';

import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const RichTextEditor = React.forwardRef<
  HTMLTextAreaElement,
  RichTextEditorProps
>(({ value, onChange, placeholder }, ref) => {
  // Using a simple Textarea is more stable than a basic contentEditable div.
  // This avoids the conflicting updates and provides a reliable editing experience.
  // For true rich text, a dedicated library would be the next step.
  return (
    <Textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="min-h-[160px] w-full"
    />
  );
});

RichTextEditor.displayName = 'RichTextEditor';