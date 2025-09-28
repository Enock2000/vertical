// src/components/support-chat.tsx
'use client';

import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HelpCircle, Send, Sparkles, User, Loader2 } from 'lucide-react';
import { askVira } from '@/ai/flows/support-chat-flow';
import { Skeleton } from './ui/skeleton';
import { Label } from './ui/label';

interface Message {
    sender: 'user' | 'vira';
    text: string;
}

export function SupportChat() {
    const [user, loadingAuth] = useAuthState(auth);
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'vira', text: "Hi! I'm Vira, your AI support assistant. How can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [guestInfo, setGuestInfo] = useState({ name: '', email: '' });
    const [isRegistered, setIsRegistered] = useState(false);

    const handleGuestSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (guestInfo.name.trim() && guestInfo.email.trim()) {
            setIsRegistered(true);
            setMessages([
                { sender: 'vira', text: `Thanks, ${guestInfo.name}! How can I help you today?` }
            ]);
        }
    };

    const handleSend = async () => {
        if (input.trim() === '') return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const result = await askVira(input);
            const viraMessage: Message = { sender: 'vira', text: result.answer };
            setMessages(prev => [...prev, viraMessage]);
        } catch (error) {
            const errorMessage: Message = { sender: 'vira', text: "Sorry, I'm having trouble connecting right now. Please try again later." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const showRegistration = !user && !isRegistered;

    return (
        <Popover onOpenChange={(open) => {
            if (open && !user && !isRegistered) {
                setMessages([{ sender: 'vira', text: "Welcome! To get started, please tell me your name and email." }]);
            } else if (open) {
                 setMessages([{ sender: 'vira', text: "Hi! I'm Vira, your AI support assistant. How can I help you today?" }]);
            }
        }}>
            <PopoverTrigger asChild>
                <Button
                    variant="default"
                    className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
                >
                    <HelpCircle className="h-6 w-6" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 mr-4" align="end">
                <div className="flex flex-col h-[28rem]">
                    <div className="flex items-center gap-2 p-3 border-b">
                        <div className="p-2 bg-primary/20 rounded-full">
                            <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold">Vira Support</p>
                            <p className="text-xs text-muted-foreground">AI Assistant</p>
                        </div>
                    </div>
                    <ScrollArea className="flex-1 p-3">
                        <div className="space-y-4">
                            {messages.map((message, index) => (
                                <div key={index} className={`flex items-start gap-2 ${message.sender === 'user' ? 'justify-end' : ''}`}>
                                    {message.sender === 'vira' && (
                                        <div className="flex-shrink-0 size-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                                            <Sparkles className="h-4 w-4" />
                                        </div>
                                    )}
                                    <div className={`rounded-lg px-3 py-2 text-sm ${message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                        {message.text}
                                    </div>
                                    {message.sender === 'user' && (
                                         <div className="flex-shrink-0 size-7 bg-muted text-muted-foreground rounded-full flex items-center justify-center">
                                            <User className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-start gap-2">
                                     <div className="flex-shrink-0 size-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                                        <Sparkles className="h-4 w-4" />
                                    </div>
                                    <div className="rounded-lg px-3 py-2 bg-muted space-y-2">
                                        <Skeleton className="h-3 w-24" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                    <div className="p-3 border-t">
                        {loadingAuth ? (
                            <div className="flex justify-center items-center h-10">
                                <Loader2 className="h-5 w-5 animate-spin"/>
                            </div>
                        ) : showRegistration ? (
                             <form onSubmit={handleGuestSubmit} className="space-y-3">
                                <div className="space-y-1">
                                    <Label htmlFor="guest-name">Name</Label>
                                    <Input
                                        id="guest-name"
                                        placeholder="Your Name"
                                        value={guestInfo.name}
                                        onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                                        required
                                    />
                                </div>
                                 <div className="space-y-1">
                                    <Label htmlFor="guest-email">Email</Label>
                                    <Input
                                        id="guest-email"
                                        type="email"
                                        placeholder="your@email.com"
                                        value={guestInfo.email}
                                        onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full">
                                    Start Chat
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                                <Input
                                    placeholder="Ask a question..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={isLoading}
                                />
                                <Button type="submit" size="icon" disabled={isLoading}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
