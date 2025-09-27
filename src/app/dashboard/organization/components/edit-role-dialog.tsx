// src/app/dashboard/organization/components/edit-role-dialog.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Department, Role, Permission } from '@/lib/data';
import { permissionsList } from '@/lib/data';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';


const formSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters.'),
  departmentId: z.string().min(1, 'Please select a department.'),
  permissions: z.array(z.string()).refine(value => value.some(item => item), {
    message: "You have to select at least one permission.",
  }),
});

type EditRoleFormValues = z.infer<typeof formSchema>;

interface EditRoleDialogProps {
  children: React.ReactNode;
  role: Role;
  departments: Department[];
  onRoleUpdated: () => void;
}

export function EditRoleDialog({
  children,
  role,
  departments,
  onRoleUpdated,
}: EditRoleDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<EditRoleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: role.name,
      departmentId: role.departmentId,
      permissions: role.permissions,
    },
  });

  async function onSubmit(values: EditRoleFormValues) {
    setIsLoading(true);
    try {
        const roleRef = ref(db, `roles/${role.id}`);
        const departmentName = departments.find(d => d.id === values.departmentId)?.name || '';

        const updatedRole: Omit<Role, 'id'> = {
            name: values.name,
            departmentId: values.departmentId,
            departmentName: departmentName,
            permissions: values.permissions as Permission[],
        };
        
        await update(roleRef, updatedRole);

        onRoleUpdated();
        setOpen(false);
        toast({
            title: 'Role Updated',
            description: `The role "${values.name}" has been successfully updated.`,
        });
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update role',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Role</DialogTitle>
          <DialogDescription>
            Modify the details for the "{role.name}" role.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., HR Manager" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="permissions"
                render={() => (
                    <FormItem>
                    <div className="mb-4">
                        <FormLabel className="text-base">Permissions</FormLabel>
                    </div>
                    <div className="space-y-2">
                    {permissionsList.map((item) => (
                        <FormField
                        key={item.id}
                        control={form.control}
                        name="permissions"
                        render={({ field }) => {
                            return (
                            <FormItem
                                key={item.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                            >
                                <FormControl>
                                <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                    return checked
                                        ? field.onChange([...field.value, item.id])
                                        : field.onChange(
                                            field.value?.filter(
                                            (value) => value !== item.id
                                            )
                                        )
                                    }}
                                />
                                </FormControl>
                                <FormLabel className="font-normal">
                                {item.label}
                                </FormLabel>
                            </FormItem>
                            )
                        }}
                        />
                    ))}
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
                />

            <DialogFooter className="sticky bottom-0 bg-background py-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
