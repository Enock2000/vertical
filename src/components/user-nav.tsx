'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, equalTo, update } from 'firebase/database';
import { useAuth } from '@/app/auth-provider';
import type { Notification } from '@/lib/data';
import { formatDistanceToNow } from 'date-fns';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { useTheme } from 'next-themes';
import { Moon, Sun, Bell, Check } from 'lucide-react';

export function UserNav() {
  const { user, employee, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { setTheme, theme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (user) {
      const notificationsQuery = query(
        ref(db, 'notifications'),
        orderByChild('userId'),
        equalTo(user.uid)
      );
      const unsubscribe = onValue(notificationsQuery, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list = Object.keys(data)
            .map(key => ({ id: key, ...data[key] }))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setNotifications(list);
        } else {
          setNotifications([]);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (employee?.role === 'Admin') {
        router.push('/login');
      } else {
        router.push('/employee-login');
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "An error occurred while logging out. Please try again.",
      });
    }
  };
  
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
        await update(ref(db, `notifications/${notification.id}`), { isRead: true });
    }
    if (notification.link && notification.link !== pathname) {
        router.push(notification.link);
    }
  };

  const getInitials = (nameOrEmail: string | null | undefined) => {
    if (!nameOrEmail) return 'U';
    const parts = nameOrEmail.split(' ');
    if (parts.length > 1) {
        return parts[0][0] + parts[parts.length - 1][0];
    }
    return nameOrEmail.substring(0, 2).toUpperCase();
  };
  
  if (loading) {
    return <Skeleton className="h-8 w-8 rounded-full" />;
  }
  
  if (!user || !employee) {
    return null;
  }
  
  const isAdmin = employee.role === 'Admin';

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>

       <Popover>
        <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 mr-4" align="end">
            <div className="p-3 border-b">
                <p className="font-semibold">Notifications</p>
            </div>
            <ScrollArea className="h-80">
                {notifications.length > 0 ? (
                    notifications.map(notif => (
                        <div 
                            key={notif.id} 
                            className="p-3 border-b hover:bg-muted cursor-pointer"
                            onClick={() => handleNotificationClick(notif)}
                        >
                            <p className={`font-medium ${!notif.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>{notif.title}</p>
                            <p className={`text-sm ${!notif.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>{notif.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}
                            </p>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-4">
                        <Check className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">You're all caught up!</p>
                    </div>
                )}
            </ScrollArea>
        </PopoverContent>
      </Popover>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={employee.avatar} alt={employee.name || ''} />
              <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{employee.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
           {isAdmin && (
            <DropdownMenuGroup>
                <DropdownMenuItem>
                Profile
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                Billing
                <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                Settings
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                </DropdownMenuItem>
            </DropdownMenuGroup>
           )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            Log out
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
