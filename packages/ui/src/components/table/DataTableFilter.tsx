import { useState } from "react";
import { PlusCircleIcon } from "lucide-react";
import { Table } from "@tanstack/react-table";
import { CheckIcon, XIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

import { cn } from "../../lib/utils";

export interface IDataTableFilter {
  [key: string]: any;
}

export interface IDataTableFilterType {
  type: "text" | "number" | "select" | "boolean" | "date-range";
  key: string;
  label: string;
  selectOptions?: {
    type: "boolean" | "string";
    options: {
      label: string;
      value: string;
      icon?: any;
    }[];
  };
  defaultRange?: DateRange;
  children?: (resetFilter: () => void) => any;
}

interface DataTableFilterProps<TData> {
  table: Table<TData>;
  availableFilters: IDataTableFilterType[];
}
export function DataTableFilter<TData>({ table, availableFilters }: DataTableFilterProps<TData>) {
  const [appliedFilters, setAppliedFilters] = useState<IDataTableFilter>({});
  const resetFunctions: (() => void)[] = [];

  function resetAllFields() {
    resetFunctions.forEach(reset => {
      if (typeof reset == "function") {
        reset();
      }
    });
  }
  return (
    <div className="mb-2">
      <div className="flex flex-wrap items-center justify-end gap-2 px-2 py-2">
        {availableFilters.map(filter => {
          if (filter.type == "select") {
            return (
              <div className="flex items-center space-x-2" key={filter.key}>
                <ISelectFilter
                  key={filter.key}
                  label={filter.label}
                  selectOptions={filter.selectOptions}
                  type={filter.type}
                  onChange={value => {
                    if (filter.selectOptions?.type == "string") {
                      const newFilter = { ...appliedFilters };
                      if (value) {
                        newFilter[filter.key] = { $in: value.split(",") };
                      } else {
                        delete newFilter[filter.key];
                      }
                      setAppliedFilters(newFilter);
                      table.setGlobalFilter(newFilter);
                    } else if (filter.selectOptions?.type == "boolean") {
                      const newFilter = { ...appliedFilters };
                      if (value) {
                        newFilter[filter.key] = {
                          $in: value.split(",").map(v => v == "true"),
                        };
                      } else {
                        delete newFilter[filter.key];
                      }
                      setAppliedFilters(newFilter);
                      table.setGlobalFilter(newFilter);
                    }
                  }}
                >
                  {resetFilter => {
                    resetFunctions.push(resetFilter);
                    return <></>;
                  }}
                </ISelectFilter>
              </div>
            );
          } else if (filter.type == "text") {
            return (
              <div className="flex items-center space-x-2" key={filter.key}>
                <ITextFilter
                  key={filter.key}
                  label={filter.label}
                  type={filter.type}
                  onChange={value => {
                    const newFilter = { ...appliedFilters };
                    if (value) {
                      newFilter[filter.key] = { $regex: value, $options: "i" };
                    } else {
                      delete newFilter[filter.key];
                    }
                    setAppliedFilters(newFilter);
                    table.setGlobalFilter(newFilter);
                  }}
                >
                  {resetFilter => {
                    resetFunctions.push(resetFilter);
                    return <></>;
                  }}
                </ITextFilter>
              </div>
            );
          } else if (filter.type == "date-range") {
            return (
              <div className="flex items-center space-x-2" key={filter.key}>
                <IDateRangeFilter
                  key={filter.key}
                  label={filter.label}
                  type={filter.type}
                  onChange={value => {
                    const newFilter = { ...appliedFilters };
                    if (value) {
                      newFilter[filter.key] = {
                        $gte: value.from,
                        $lte: value.to,
                      };
                    } else {
                      delete newFilter[filter.key];
                    }
                    setAppliedFilters(newFilter);
                    table.setGlobalFilter(newFilter);
                  }}
                >
                  {resetFilter => {
                    resetFunctions.push(resetFilter);
                    return <></>;
                  }}
                </IDateRangeFilter>
              </div>
            );
          } else if (filter.type == "boolean") {
            return (
              <div className="flex items-center space-x-2" key={filter.key}>
                <IBooleanFilter
                  key={filter.key}
                  label={filter.label}
                  type={filter.type}
                  onChange={value => {
                    const newFilter = { ...appliedFilters };
                    if (value == "true") {
                      newFilter[filter.key] = true;
                    } else {
                      delete newFilter[filter.key];
                    }
                    setAppliedFilters(newFilter);
                    table.setGlobalFilter(newFilter);
                  }}
                >
                  {resetFilter => {
                    resetFunctions.push(resetFilter);
                    return <></>;
                  }}
                </IBooleanFilter>
              </div>
            );
          }
        })}
      </div>
      {Object.keys(table.getState().globalFilter).length > 0 && (
        <div className="flex justify-end">
          <Button
            size="sm"
            startIcon={<XIcon />}
            onClick={() => {
              resetAllFields();
              setAppliedFilters({});
              table.setGlobalFilter({});
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}

interface IBooleanFilterProps extends IDataTableFilterType {
  onChange?: (value: string) => void;
}

function IBooleanFilter(props: IBooleanFilterProps) {
  const { key, label, onChange, children } = props;
  const [value, setValue] = useState<boolean>();
  function reset() {
    setValue(false);
  }
  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-2">
        <Checkbox
          id={key}
          checked={value}
          className="form-input"
          onCheckedChange={checked => {
            setValue(checked ? true : false);
            onChange?.(checked ? "true" : "false");
          }}
        />
        <Label htmlFor={key} className="text-sm">
          {label}
        </Label>
      </div>
      {children?.(reset)}
    </div>
  );
}

interface IDateRangeFilterProps extends IDataTableFilterType {
  onChange?: (value: DateRange) => void;
}
function IDateRangeFilter(props: IDateRangeFilterProps) {
  const { key, label, defaultRange, onChange, children } = props;
  const [value, setValue] = useState<DateRange | null>(null);
  function reset() {
    setValue({
      from: undefined,
      to: undefined,
    });
  }
  return (
    <div className="border-border flex items-center space-x-2 rounded-full border border-dashed pl-3">
      <div className="flex items-center space-x-2">
        <Label className="text-sm">{label}</Label>
        <DatePickerWithRange
          start={value?.from}
          end={value?.to}
          className=""
          onChange={value => {
            setValue(value);
            onChange?.(value);
          }}
        />
      </div>
      {children?.(reset)}
    </div>
  );
}

interface ITextFilterProps extends IDataTableFilterType {
  onChange?: (value: string) => void;
}
function ITextFilter(props: ITextFilterProps) {
  const { key, label, onChange, children } = props;
  const [value, setValue] = useState("");
  function reset() {
    setValue("");
  }
  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-2">
        <Input
          type="text"
          className="form-input w-32"
          placeholder={label}
          value={value}
          onChange={e => {
            setValue(e.target.value);
            onChange?.(e.target.value);
          }}
        />
      </div>
      {children?.(reset)}
    </div>
  );
}

interface ISelectFilterProps extends IDataTableFilterType {
  onChange?: (value: string) => void;
}

function ISelectFilter(props: ISelectFilterProps) {
  const { key, label, selectOptions, children, onChange } = props;
  const options = selectOptions!;
  const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set<string>());
  function reset() {
    setSelectedValues(new Set<string>());
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircleIcon className="mr-2 h-4 w-4" />
          {label}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options.options
                    .filter(option => selectedValues.has(option.value))
                    .map(option => (
                      <Badge variant="secondary" key={option.value} className="rounded-sm px-1 font-normal">
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={label} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.options.map(option => {
                const isSelected = selectedValues.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      if (isSelected) {
                        selectedValues.delete(option.value);
                      } else {
                        selectedValues.add(option.value);
                      }
                      const filterValues = Array.from(selectedValues);
                      setSelectedValues(new Set(filterValues));
                      onChange?.(filterValues.join(","));
                    }}
                  >
                    <div
                      className={cn(
                        "border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                        isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <CheckIcon className={cn("h-4 w-4")} aria-hidden="true" />
                    </div>
                    {option.icon && <option.icon className="text-muted-foreground mr-2 h-4 w-4" aria-hidden="true" />}
                    <span>{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      selectedValues.clear();
                      setSelectedValues(new Set());
                      onChange?.("");
                    }}
                    className="justify-center text-center"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
      {children?.(reset)}
    </Popover>
  );
}
