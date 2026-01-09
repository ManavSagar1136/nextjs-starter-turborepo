import * as React from "react";
import { Plus, MoreHorizontal } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface KanbanItem {
  id: string;
  title: string;
  description?: string;
  status: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  items: KanbanItem[];
}

export interface KanbanProps {
  columns: KanbanColumn[];
  onColumnsChange: (columns: KanbanColumn[]) => void;
  onAddItem?: (columnId: string) => void;
  onEditItem?: (item: KanbanItem) => void;
  onDeleteItem?: (itemId: string) => void;
  className?: string;
}

export function Kanban({ columns, onColumnsChange, onAddItem, onEditItem, onDeleteItem, className }: KanbanProps) {
  const handleDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const newColumns = [...columns];
    const sourceColumn = newColumns.find(col => col.id === source.droppableId);
    const destColumn = newColumns.find(col => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) return;

    const item = sourceColumn.items.find(item => item.id === draggableId);
    if (!item) return;

    // Remove from source
    sourceColumn.items.splice(source.index, 1);

    // Add to destination
    destColumn.items.splice(destination.index, 0, {
      ...item,
      status: destination.droppableId,
    });

    onColumnsChange(newColumns);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className={cn("flex gap-4 overflow-x-auto pb-4", className)}>
        {columns.map(column => (
          <div key={column.id} className="flex min-w-[300px] flex-col">
            <div className="flex items-center justify-between p-2">
              <h3 className="font-semibold">{column.title}</h3>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">{column.items.length}</span>
                {onAddItem && (
                  <Button size="sm" variant="ghost" onClick={() => onAddItem(column.id)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "flex min-h-[200px] flex-col gap-2 rounded-lg border-2 border-dashed p-2 transition-colors",
                    snapshot.isDraggingOver && "border-primary bg-primary/5"
                  )}
                >
                  {column.items.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={cn("cursor-grab transition-shadow", snapshot.isDragging && "shadow-lg")}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-sm">{item.title}</CardTitle>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  {onEditItem && (
                                    <DropdownMenuItem onClick={() => onEditItem(item)}>Edit</DropdownMenuItem>
                                  )}
                                  {onDeleteItem && (
                                    <DropdownMenuItem
                                      onClick={() => onDeleteItem(item.id)}
                                      className="text-destructive"
                                    >
                                      Delete
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardHeader>
                          {item.description && (
                            <CardContent className="pt-0">
                              <p className="text-muted-foreground text-sm">{item.description}</p>
                            </CardContent>
                          )}
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
