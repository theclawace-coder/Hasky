import { Link } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';
import { formatCurrency } from '../../lib/utils';
import { cn } from '../../lib/utils';
import type { Machine } from '../../types';

interface MachineCardProps {
  machine: Machine;
}

const STATUS_STRIP: Record<string, string> = {
  available:     'bg-emerald-500',
  on_hire:       'bg-amber-500',
  under_repair:  'bg-red-500',
  in_transit:    'bg-blue-500',
  decommissioned:'bg-slate-400',
};

export function MachineCard({ machine }: MachineCardProps) {
  const photo = machine.photo_urls?.[0];
  const isAvailable = machine.status === 'available';
  const strip = STATUS_STRIP[machine.status] ?? 'bg-slate-400';

  return (
    <Link to={`/fleet/${machine.id}`} className="block">
      <div
        className={cn(
          'flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
          isAvailable ? 'border-emerald-200' : 'border-slate-200',
        )}
      >
        {/* Coloured status strip across the top */}
        <div className={`h-1.5 w-full shrink-0 ${strip}`} />

        {/* Photo */}
        <div className="flex h-36 items-center justify-center overflow-hidden bg-slate-100">
          {photo ? (
            <img src={photo} alt={machine.name} className="h-full w-full object-cover" />
          ) : (
            <Truck className="size-8 text-slate-300" />
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold leading-tight text-slate-900">{machine.name}</h3>
            <StatusBadge status={machine.status} />
          </div>

          <p className="text-xs text-slate-500">{machine.machine_categories?.name ?? 'Uncategorised'}</p>

          {(machine.make || machine.model) && (
            <p className="text-xs text-slate-500">
              {[machine.make, machine.model].filter(Boolean).join(' ')}
              {machine.year ? ` (${machine.year})` : ''}
            </p>
          )}

          <div className="mt-auto flex items-end justify-between pt-2">
            <div>
              <span className="text-xl font-bold text-slate-900">
                {formatCurrency(Number(machine.daily_rate ?? 0))}
              </span>
              <span className="text-xs text-slate-400">/day</span>
            </div>
            {machine.location && (
              <span className="truncate max-w-[100px] text-right text-[11px] text-slate-400">
                📍 {machine.location}
              </span>
            )}
          </div>

          {isAvailable && (
            <div className="mt-1 rounded-lg bg-emerald-50 py-1.5 text-center text-xs font-semibold text-emerald-700">
              Available — tap to hire
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
