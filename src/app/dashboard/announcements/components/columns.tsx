// src/app/dashboard/announcements/components/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal, Trash2 } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { Announcement, Department } from "@/lib/data";
import { AddAnnouncementDialog } from "./add-announcement-dialog";

export const columns = (
    departments: Department[],
    handleDelete: (id: string) => void
): ColumnDef<Announcement>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Title
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.original.title}</div>,
  },
  {
    accessorKey: "authorName",
    header: "Author",
  },
  {
    accessorKey: "audience",
    header: "Audience",
    cell: ({ row }) => {
      const audience = row.original.audience;
      if (audience === 'all') {
        return <Badge>All Employees</Badge>;
      }
      const departmentNames = audience.map(deptId => {
          const dept = departments.find(d => d.id === deptId);
          return dept ? dept.name : 'Unknown Dept';
      }).join(', ');
      return <Badge variant="outline">{departmentNames}</Badge>;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Published Date",
    cell: ({ row }) => format(new Date(row.original.createdAt), "PPP"),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const announcement = row.original;
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
               <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <AddAnnouncementDialog departments={departments} announcement={announcement}>
                        <div className="w-full text-left">Edit</div>
                    </AddAnnouncementDialog>
                </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 focus:bg-destructive/10"
                onClick={() => handleDelete(announcement.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
