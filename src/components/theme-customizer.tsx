

'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import { useAuth } from '@/app/auth-provider';
import type { ThemeSettings } from '@/lib/data';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { RefreshCw, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';
import { debounce } from 'lodash';

function extractHsl(style: string) {
  const match = style.match(/hsl\(([\d.]+)\s*([\d.]+)%\s*([\d.]+)%\)/);
  if (match) {
    return { h: match[1], s: match[2], l: match[3] };
  }
  const singleValueMatch = style.match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)/);
   if (singleValueMatch) {
    return { h: singleValueMatch[1], s: singleValueMatch[2], l: singleValueMatch[3] };
  }
  return { h: '0', s: '0', l: '0' };
}


export function ThemeCustomizer() {
  const { toast } = useToast();
  const { employee } = useAuth();
  const [colors, setColors] = useState<ThemeSettings>({
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

  const saveThemeSettings = useCallback(
    debounce((newColors: ThemeSettings) => {
        if (employee?.id) {
            const employeeRef = ref(db, `employees/${employee.id}`);
            update(employeeRef, { themeSettings: newColors })
                .then(() => {
                     toast({
                        title: 'Theme Saved',
                        description: 'Your new theme colors have been saved.',
                    });
                })
                .catch((error) => {
                    console.error("Failed to save theme:", error);
                     toast({
                        variant: 'destructive',
                        title: 'Save Failed',
                        description: 'Could not save your theme settings.',
                    });
                });
        }
    }, 1000), [employee]
  );

  const handleColorChange = (themeColor: keyof ThemeSettings, property: 'h' | 's' | 'l', value: string) => {
    const newColors = { 
        ...colors, 
        [themeColor]: { ...colors[themeColor], [property]: value } 
    };
    setColors(newColors);

    const root = document.documentElement;
    root.style.setProperty(`--${themeColor}`, `${newColors[themeColor].h} ${newColors[themeColor].s}% ${newColors[themeColor].l}%`);
    saveThemeSettings(newColors);
  };
  
  const handleReset = () => {
    if(employee?.id) {
        const employeeRef = ref(db, `employees/${employee.id}`);
        update(employeeRef, { themeSettings: null });
    }
    const root = document.documentElement;
    root.style.removeProperty('--background');
    root.style.removeProperty('--primary');
    root.style.removeProperty('--accent');
    
    // Re-fetch computed styles after reset
    // A slight delay is needed to let the styles re-compute
    setTimeout(() => {
        const computedStyle = getComputedStyle(root);
        setColors({
            background: extractHsl(computedStyle.getPropertyValue('--background')),
            primary: extractHsl(computedStyle.getPropertyValue('--primary')),
            accent: extractHsl(computedStyle.getPropertyValue('--accent')),
        });
    }, 100);

     toast({
        title: 'Theme Reset',
        description: 'The theme has been reset to the default.',
    });
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Customize Theme</DialogTitle>
        <DialogDescription>
          Adjust the colors of your interface. Changes are saved automatically.
        </DialogDescription>
      </DialogHeader>
      <ScrollArea className="max-h-[70vh] pr-4">
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
                    onChange={(e) => handleColorChange(name as keyof ThemeSettings, 'h', e.target.value)}
                    />
                </div>
                <div>
                    <Label htmlFor={`${name}-s`} className="text-xs">S</Label>
                    <Input
                    id={`${name}-s`}
                    value={hsl.s}
                    onChange={(e) => handleColorChange(name as keyof ThemeSettings, 's', e.target.value)}
                    />
                </div>
                <div>
                    <Label htmlFor={`${name}-l`} className="text-xs">L</Label>
                    <Input
                    id={`${name}-l`}
                    value={hsl.l}
                    onChange={(e) => handleColorChange(name as keyof ThemeSettings, 'l', e.target.value)}
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
      </ScrollArea>
    </DialogContent>
  );
}
