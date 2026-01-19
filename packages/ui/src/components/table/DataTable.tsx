import { useEffect, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

import { IPageFilter, PaginationResponse } from "../../types/pagination";
import { DataTableFilter, IDataTableFilter, IDataTableFilterType } from "./DataTableFilter";
import { DataTablePagination } from "./DataTablePagination";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  availableFilters: IDataTableFilterType[];
  limitPerPage: number;
  getData: (filter: IPageFilter) => Promise<PaginationResponse<TData>>;
  classes?: string;
  allowRowSelection?: boolean;
  onRowSelected?: (selected: any[]) => void;
  refreshCounter?: number;
  hideIfEmpty?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  limitPerPage,
  availableFilters,
  getData,
  allowRowSelection,
  classes,
  refreshCounter,
  onRowSelected,
  hideIfEmpty,
}: DataTableProps<TData, TValue>) {
  const [data, setData] = useState<TData[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: limitPerPage, //customize the default page size
  });
  const [globalFilter, setGlobalFilter] = useState<IDataTableFilter>({});
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecord, setTotalRecord] = useState(0);
  const [rowSelection, setRowSelection] = useState({});
  useEffect(() => {
    getData({
      $page: pagination.pageIndex + 1,
      $limit: pagination.pageSize,
      sorting,
      filter: globalFilter,
    }).then(res => {
      setData(res.docs);
      setTotalRecord(res.totalDocs);
      setTotalPages(res.totalPages);
    });
  }, [refreshCounter, getData, pagination, sorting, globalFilter]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    manualPagination: true,
    pageCount: totalPages,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      pagination: pagination,
      globalFilter: globalFilter,
      rowSelection: rowSelection,
    },
  });

  // hide if no data
  if (hideIfEmpty && !data?.length) return null;
  return (
    <div>
      <div className="flex w-full flex-col justify-between">
        {allowRowSelection && (
          <div className="text-muted-foreground flex-1 text-sm">
            {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
            selected.
          </div>
        )}
        {availableFilters.length > 0 && (
          <>
            <div className="flex justify-end">
              <DataTableFilter availableFilters={availableFilters} table={table} />
            </div>
            <div>
              <Separator />
            </div>
          </>
        )}
        <div className="flex justify-end">
          <DataTablePagination totalRecord={totalRecord} table={table} />
        </div>
      </div>
      <div className="my-2 rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className={classes}>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div>
        {allowRowSelection && typeof onRowSelected == "function" && (
          <div className="flex items-end justify-end">
            <div className="flex gap-x-2">
              {table.getIsSomeRowsSelected() && (
                <Button
                  variant={"outline"}
                  onClick={() => {
                    table.resetRowSelection();
                  }}
                >
                  <span className="text-sm">Clear Selection</span>
                </Button>
              )}
              {table.getIsAllRowsSelected() && (
                <Button
                  variant={"outline"}
                  onClick={() => {
                    table.resetRowSelection();
                  }}
                >
                  <span className="text-sm">Deselect All</span>
                </Button>
              )}
              <Button
                onClick={() => {
                  const rows = table.getFilteredSelectedRowModel().rows;
                  onRowSelected(rows.map(row => row.original));
                }}
              >
                Select ({table.getFilteredSelectedRowModel().rows.length})
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
