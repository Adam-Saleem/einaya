import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/Components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Input } from '@/Components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';

type Props<TData, TValue> = {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    searchPlaceholder?: string;
    searchableColumn?: string;
    initialPageSize?: number;
};

export function DataTable<TData, TValue>({
    columns,
    data,
    searchPlaceholder,
    searchableColumn,
    initialPageSize = 10,
}: Props<TData, TValue>) {
    const { t } = useTranslation('common');
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    const table = useReactTable({
        data,
        columns,
        state: { sorting, globalFilter },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: initialPageSize } },
    });

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={
                            searchableColumn
                                ? ((table.getColumn(searchableColumn)?.getFilterValue() as string) ??
                                  '')
                                : globalFilter
                        }
                        onChange={(event) => {
                            const value = event.target.value;
                            if (searchableColumn) {
                                table.getColumn(searchableColumn)?.setFilterValue(value);
                            } else {
                                setGlobalFilter(value);
                            }
                        }}
                        placeholder={searchPlaceholder ?? t('actions.search')}
                        className="ps-9"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="ms-auto h-9">
                            <SlidersHorizontal className="me-2 h-4 w-4" />
                            {t('table.columns')}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t('table.columns')}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    className="capitalize"
                                    checked={column.getIsVisible()}
                                    onCheckedChange={(value) =>
                                        column.toggleVisibility(Boolean(value))
                                    }
                                >
                                    {column.id}
                                </DropdownMenuCheckboxItem>
                            ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="rounded-lg border bg-card">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef.header,
                                                  header.getContext(),
                                              )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    {t('table.noResults')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {t('table.page', {
                        current: table.getState().pagination.pageIndex + 1,
                        total: Math.max(table.getPageCount(), 1),
                    })}
                </p>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                        <span className="ms-1">{t('actions.previous')}</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        <span className="me-1">{t('actions.next')}</span>
                        <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
