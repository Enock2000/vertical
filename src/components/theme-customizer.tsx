
'use client';

import { useState, useEffect } from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Copy, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function extractHsl(style) {
  const match = style.match(/hsl\(([\d.]+)\s*([\d.]+)%\s*([\d.]+)%\)/);
  if (match) {
    return { h: match[1], s: match[2], l: match[3] };
  }
  const singleValueMatch = style.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
   if (singleValueMatch) {
    return { h: singleValueMatch[1], s: singleValueMatch[2], l: singleValueMatch[3] };
  }
  return { h: '0', s: '0', l: '0' };
}


export function ThemeCustomizer() {
  const { toast } = useToast();
  const [colors, setColors] = useState({
    background: { h: '0', s: '0', l: '0' },
    primary: { h: '0', s: '0', l: '0' },
    accent: { h: '0', s: '0', l: '0' },
  });

  useEffect(() => {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    setColors({
      background: extractHsl(computedStyle.getPropertyValue('--background')),
      primary: extractHsl(computedStyle.getPropertyValue('--primary')),
      accent: extractHsl(computedStyle.getPropertyValue('--accent')),
    });
  }, []);

  const handleColorChange = (themeColor, property, value) => {
    const newColors = { ...colors };
    newColors[themeColor][property] = value;
    setColors(newColors);

    const root = document.documentElement;
    root.style.setProperty(`--${themeColor}`, `${newColors[themeColor].h} ${newColors[themeColor].s}% ${newColors[themeColor].l}%`);
  };
  
  const handleReset = () => {
    const root = document.documentElement;
    root.style.removeProperty('--background');
    root.style.removeProperty('--primary');
    root.style.removeProperty('--accent');
    // Re-fetch computed styles after reset
    const computedStyle = getComputedStyle(root);
     setColors({
      background: extractHsl(computedStyle.getPropertyValue('--background')),
      primary: extractHsl(computedStyle.getPropertyValue('--primary')),
      accent: extractHsl(computedStyle.getPropertyValue('--accent')),
    });
     toast({
        title: 'Theme Reset',
        description: 'The theme has been reset to the system default.',
    });
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Customize Theme</DialogTitle>
        <DialogDescription>
          Adjust the colors of your interface. Changes are applied live.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-6 py-4">
        {Object.entries(colors).map(([name, hsl]) => (
          <div key={name} className="space-y-2">
            <Label className="capitalize">{name}</Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor={`${name}-h`} className="text-xs">H</Label>
                <Input
                  id={`${name}-h`}
                  value={hsl.h}
                  onChange={(e) => handleColorChange(name, 'h', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`${name}-s`} className="text-xs">S</Label>
                <Input
                  id={`${name}-s`}
                  value={hsl.s}
                  onChange={(e) => handleColorChange(name, 's', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`${name}-l`} className="text-xs">L</Label>
                <Input
                  id={`${name}-l`}
                  value={hsl.l}
                  onChange={(e) => handleColorChange(name, 'l', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
         <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset to Default
        </Button>
      </div>
    </DialogContent>
  );
}
