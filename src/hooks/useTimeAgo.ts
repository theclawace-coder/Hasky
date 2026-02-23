import { useEffect, useState } from 'react';

function getTimeAgo(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getInterval(date: Date): number {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 5_000;
  if (seconds < 3600) return 30_000;
  return 60_000;
}

/**
 * Returns a live-updating relative timestamp string.
 * Ticks faster for recent times, slower for older.
 */
export function useTimeAgo(date: Date | string | null | undefined): string | null {
  const d = date ? (typeof date === 'string' ? new Date(date) : date) : null;
  const [text, setText] = useState(() => (d ? getTimeAgo(d) : null));

  useEffect(() => {
    if (!d) {
      setText(null);
      return;
    }
    setText(getTimeAgo(d));
    let timer: ReturnType<typeof setTimeout>;

    function tick() {
      setText(getTimeAgo(d!));
      timer = setTimeout(tick, getInterval(d!));
    }

    timer = setTimeout(tick, getInterval(d));
    return () => clearTimeout(timer);
  }, [d?.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps

  return text;
}
