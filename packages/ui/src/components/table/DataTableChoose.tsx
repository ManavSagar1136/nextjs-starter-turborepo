import { ColumnDef } from "@tanstack/table-core";

import { IPageFilter, PaginationResponse } from "@/types/pagination";

import { DataTable } from "@/components/table/DataTable";
import { IDataTableFilterType } from "@/components/table/DataTableFilter";
import { Checkbox } from "@/components/ui/checkbox";

interface DataTableChooseProps<T> {
  getData: (filter: IPageFilter) => Promise<PaginationResponse<T>>;
  columns: ColumnDef<T>[];
  filters: IDataTableFilterType[];
  onSelected: (selected: T[]) => void;
}

export default function DataTableChoose<T>({ filters, columns, getData, onSelected }: DataTableChooseProps<T>) {
  const finalColumns: ColumnDef<T>[] = [
    {
      id: "_id",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={value => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    ...columns,
  ];
  return (
    <DataTable
      columns={finalColumns}
      availableFilters={filters}
      allowRowSelection={true}
      limitPerPage={10}
      classes="w-full max-h-[50vh] overflow-y-auto"
      onRowSelected={(row: T[]) => {
        onSelected(row);
      }}
      getData={async function (filter: IPageFilter): Promise<PaginationResponse<T>> {
        return await getData(filter);
      }}
    />
  );
}
