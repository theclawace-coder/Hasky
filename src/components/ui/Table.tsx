import type { PropsWithChildren, TableHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export function TableContainer({ children }: PropsWithChildren) {
  return <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">{children}</div>;
}

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn('min-w-full text-left text-sm', className)} {...props} />;
}
