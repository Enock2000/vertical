"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ChevronDown,
  Filter,
  X,
  Building2,
  MapPin,
  Briefcase,
  FileText,
  DollarSign,
  Search,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

interface FilterOption {
  value: string;
  label: string;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  departments?: FilterOption[]
  branches?: FilterOption[]
  roles?: FilterOption[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
  departments = [],
  branches = [],
  roles = [],
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")

  // Advanced filters
  const [selectedDepartments, setSelectedDepartments] = React.useState<string[]>([])
  const [selectedBranches, setSelectedBranches] = React.useState<string[]>([])
  const [selectedRoles, setSelectedRoles] = React.useState<string[]>([])
  const [selectedContractTypes, setSelectedContractTypes] = React.useState<string[]>([])
  const [salaryRange, setSalaryRange] = React.useState<{ min: string; max: string }>({ min: "", max: "" })
  const [showFilters, setShowFilters] = React.useState(false)

  const contractTypes: FilterOption[] = [
    { value: "Permanent", label: "Permanent" },
    { value: "Fixed-Term", label: "Fixed-Term" },
    { value: "Internship", label: "Internship" },
    { value: "Part-Time", label: "Part-Time" },
    { value: "Contract", label: "Contract" },
  ]

  // Apply custom filters
  const filteredData = React.useMemo(() => {
    let result = [...data] as any[];

    // Department filter
    if (selectedDepartments.length > 0) {
      result = result.filter(item =>
        selectedDepartments.includes(item.departmentName) ||
        selectedDepartments.includes(item.department)
      );
    }

    // Branch filter
    if (selectedBranches.length > 0) {
      result = result.filter(item =>
        selectedBranches.includes(item.branchName) ||
        selectedBranches.includes(item.branch)
      );
    }

    // Role filter
    if (selectedRoles.length > 0) {
      result = result.filter(item =>
        selectedRoles.includes(item.role) ||
        selectedRoles.includes(item.jobTitle)
      );
    }

    // Contract type filter
    if (selectedContractTypes.length > 0) {
      result = result.filter(item =>
        selectedContractTypes.includes(item.contractType)
      );
    }

    // Salary range filter
    const minSalary = parseFloat(salaryRange.min) || 0;
    const maxSalary = parseFloat(salaryRange.max) || Infinity;
    if (salaryRange.min || salaryRange.max) {
      result = result.filter(item => {
        const salary = parseFloat(item.salary) || 0;
        return salary >= minSalary && salary <= maxSalary;
      });
    }

    return result as TData[];
  }, [data, selectedDepartments, selectedBranches, selectedRoles, selectedContractTypes, salaryRange]);

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  })

  const activeFilterCount =
    selectedDepartments.length +
    selectedBranches.length +
    selectedRoles.length +
    selectedContractTypes.length +
    (salaryRange.min || salaryRange.max ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedDepartments([]);
    setSelectedBranches([]);
    setSelectedRoles([]);
    setSelectedContractTypes([]);
    setSalaryRange({ min: "", max: "" });
    setGlobalFilter("");
  };

  const toggleFilter = (
    value: string,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (selected.includes(value)) {
      setSelected(selected.filter(v => v !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  const FilterBadges = () => {
    const badges: React.ReactNode[] = [];

    selectedDepartments.forEach(d => {
      badges.push(
        <Badge key={`dept-${d}`} variant="secondary" className="gap-1 text-xs">
          <Building2 className="h-3 w-3" />
          {d}
          <button onClick={() => toggleFilter(d, selectedDepartments, setSelectedDepartments)}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      );
    });

    selectedBranches.forEach(b => {
      badges.push(
        <Badge key={`branch-${b}`} variant="secondary" className="gap-1 text-xs">
          <MapPin className="h-3 w-3" />
          {b}
          <button onClick={() => toggleFilter(b, selectedBranches, setSelectedBranches)}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      );
    });

    selectedRoles.forEach(r => {
      badges.push(
        <Badge key={`role-${r}`} variant="secondary" className="gap-1 text-xs">
          <Briefcase className="h-3 w-3" />
          {r}
          <button onClick={() => toggleFilter(r, selectedRoles, setSelectedRoles)}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      );
    });

    selectedContractTypes.forEach(c => {
      badges.push(
        <Badge key={`contract-${c}`} variant="secondary" className="gap-1 text-xs">
          <FileText className="h-3 w-3" />
          {c}
          <button onClick={() => toggleFilter(c, selectedContractTypes, setSelectedContractTypes)}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      );
    });

    if (salaryRange.min || salaryRange.max) {
      badges.push(
        <Badge key="salary" variant="secondary" className="gap-1 text-xs">
          <DollarSign className="h-3 w-3" />
          {salaryRange.min || '0'} - {salaryRange.max || '∞'}
          <button onClick={() => setSalaryRange({ min: "", max: "" })}>
            <X className="h-3 w-3" />
          </button>
        </Badge>
      );
    }

    return badges.length > 0 ? (
      <div className="flex flex-wrap gap-2 mt-2">
        {badges}
        <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6 text-xs">
          Clear all
        </Button>
      </div>
    ) : null;
  };

  return (
    <div className="w-full">
      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-4 py-4">
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters Button */}
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Filters</h4>
                  <p className="text-sm text-muted-foreground">
                    Filter employees by various criteria
                  </p>
                </div>
                <Separator />

                {/* Department Filter */}
                {departments.length > 0 && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Building2 className="h-4 w-4" /> Department
                    </Label>
                    <ScrollArea className="h-24 rounded border p-2">
                      {departments.map((dept) => (
                        <div key={dept.value} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`dept-${dept.value}`}
                            checked={selectedDepartments.includes(dept.label)}
                            onCheckedChange={() => toggleFilter(dept.label, selectedDepartments, setSelectedDepartments)}
                          />
                          <label htmlFor={`dept-${dept.value}`} className="text-sm cursor-pointer">
                            {dept.label}
                          </label>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                )}

                {/* Branch Filter */}
                {branches.length > 0 && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className="h-4 w-4" /> Branch
                    </Label>
                    <ScrollArea className="h-24 rounded border p-2">
                      {branches.map((branch) => (
                        <div key={branch.value} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`branch-${branch.value}`}
                            checked={selectedBranches.includes(branch.label)}
                            onCheckedChange={() => toggleFilter(branch.label, selectedBranches, setSelectedBranches)}
                          />
                          <label htmlFor={`branch-${branch.value}`} className="text-sm cursor-pointer">
                            {branch.label}
                          </label>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                )}

                {/* Role Filter */}
                {roles.length > 0 && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Briefcase className="h-4 w-4" /> Role/Position
                    </Label>
                    <ScrollArea className="h-24 rounded border p-2">
                      {roles.map((role) => (
                        <div key={role.value} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`role-${role.value}`}
                            checked={selectedRoles.includes(role.label)}
                            onCheckedChange={() => toggleFilter(role.label, selectedRoles, setSelectedRoles)}
                          />
                          <label htmlFor={`role-${role.value}`} className="text-sm cursor-pointer">
                            {role.label}
                          </label>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                )}

                {/* Contract Type Filter */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4" /> Contract Type
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {contractTypes.map((type) => (
                      <div key={type.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`contract-${type.value}`}
                          checked={selectedContractTypes.includes(type.value)}
                          onCheckedChange={() => toggleFilter(type.value, selectedContractTypes, setSelectedContractTypes)}
                        />
                        <label htmlFor={`contract-${type.value}`} className="text-sm cursor-pointer">
                          {type.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Salary Range Filter */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <DollarSign className="h-4 w-4" /> Salary Range (ZMW)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={salaryRange.min}
                      onChange={(e) => setSalaryRange(prev => ({ ...prev, min: e.target.value }))}
                      className="w-24"
                    />
                    <span className="flex items-center">-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={salaryRange.max}
                      onChange={(e) => setSalaryRange(prev => ({ ...prev, max: e.target.value }))}
                      className="w-24"
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    Clear All
                  </Button>
                  <Button size="sm" onClick={() => setShowFilters(false)}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Active Filter Badges */}
        <FilterBadges />
      </div>

      {/* Results count */}
      {activeFilterCount > 0 && (
        <div className="text-sm text-muted-foreground mb-2">
          Showing {filteredData.length} of {data.length} employees
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
