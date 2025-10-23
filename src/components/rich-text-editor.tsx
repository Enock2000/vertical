// src/components/rich-text-editor.tsx
'use client';

import * as React from 'react';
import { Bold, Italic, Underline, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toggle } from '@/components/ui/toggle';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const RichTextEditor = React.forwardRef<
  HTMLDivElement,
  RichTextEditorProps
>(({ value, onChange, placeholder }, ref) => {
  
  const handleCommand = (command: string) => {
    document.execCommand(command, false);
  };
  
  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    onChange(e.currentTarget.innerHTML);
  };

  return (
    <div className="rounded-md border border-input">
      <div className="border-b p-1">
        <div className="flex items-center gap-1">
          <Toggle size="sm" onPressedChange={() => handleCommand('bold')}>
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" onPressedChange={() => handleCommand('italic')}>
            <Italic className="h-4 w-4" />
          </Toggle>
           <Toggle size="sm" onPressedChange={() => handleCommand('underline')}>
            <Underline className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" onPressedChange={() => handleCommand('insertUnorderedList')}>
            <List className="h-4 w-4" />
          </Toggle>
        </div>
      </div>
       <div
        ref={ref}
        contentEditable
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value }}
        placeholder={placeholder}
        className="min-h-[160px] w-full rounded-b-md bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';