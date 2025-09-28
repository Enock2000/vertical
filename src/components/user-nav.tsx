'use client';

import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/app/auth-provider';
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
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export function UserNav() {
  const { user, employee, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { setTheme, theme } = useTheme();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Determine redirect based on role before logging out
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
