// src/app/dashboard/settings/components/api-settings-tab.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, KeyRound, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { manageApiKey } from '@/ai/flows/manage-api-key-flow';

export function ApiSettingsTab() {
  const { company, companyId } = useAuth();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (company) {
      setApiKey(company.apiKey || null);
    }
  }, [company]);

  const handleGenerate = async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const result = await manageApiKey({ companyId, action: 'generate' });
      if (result.success && result.apiKey) {
        setApiKey(result.apiKey);
        toast({ title: 'API Key Generated', description: 'Your new API key has been created.' });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate API key.' });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const result = await manageApiKey({ companyId, action: 'revoke' });
      if (result.success) {
        setApiKey(null);
        toast({ title: 'API Key Revoked', description: 'The API key has been revoked and is no longer valid.' });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to revoke API key.' });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      toast({ title: 'Copied to Clipboard' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Settings</CardTitle>
        <CardDescription>
          Manage your API key for third-party integrations. This key provides access to your company's data, so keep it secure.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-w-lg">
        {apiKey ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input value={isKeyVisible ? apiKey : '•'.repeat(apiKey.length)} readOnly />
              <Button variant="outline" size="icon" onClick={() => setIsKeyVisible(!isKeyVisible)}>
                {isKeyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="destructive" onClick={handleRevoke} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Revoke Key
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-4">
            <p className="text-sm text-muted-foreground">You do not have an active API key.</p>
            <Button onClick={handleGenerate} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <KeyRound className="mr-2 h-4 w-4" /> Generate API Key
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
