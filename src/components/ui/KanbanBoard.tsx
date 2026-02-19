import { useMemo } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';

interface KanbanItem {
  id: string;
  title: string;
  status: string;
  subtitle?: string;
  amount?: string;
}

interface KanbanBoardProps {
  columns: string[];
  items: KanbanItem[];
  onMove: (id: string, status: string) => void;
}

function SortableCard({ item }: { item: KanbanItem }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
      <Card className="cursor-grab p-3">
        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
        {item.subtitle ? <p className="mt-1 text-xs text-slate-500">{item.subtitle}</p> : null}
        <div className="mt-2 flex items-center justify-between">
          <StatusBadge status={item.status} />
          {item.amount ? <span className="text-xs font-medium text-emerald-700">{item.amount}</span> : null}
        </div>
      </Card>
    </div>
  );
}

export function KanbanBoard({ columns, items, onMove }: KanbanBoardProps) {
  const sensors = useSensors(useSensor(PointerSensor));
  const grouped = useMemo(
    () =>
      columns.reduce<Record<string, KanbanItem[]>>((acc, column) => {
        acc[column] = items.filter((item) => item.status === column);
        return acc;
      }, {}),
    [columns, items],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const itemId = String(event.active.id);
    const overColumn = event.over?.id ? String(event.over.id) : null;
    if (!overColumn) {
      return;
    }

    if (columns.includes(overColumn)) {
      onMove(itemId, overColumn);
      return;
    }

    const target = items.find((item) => item.id === overColumn);
    if (target) {
      onMove(itemId, target.status);
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {columns.map((column) => (
          <div key={column} id={column} className="rounded-xl bg-slate-100 p-3" data-kanban-column={column}>
            <h3 className="mb-3 text-sm font-semibold capitalize text-slate-700">{column}</h3>
            <SortableContext items={grouped[column]?.map((item) => item.id) ?? []} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {(grouped[column] ?? []).map((item) => (
                  <SortableCard key={item.id} item={item} />
                ))}
              </div>
            </SortableContext>
          </div>
        ))}
      </div>
    </DndContext>
  );
}
