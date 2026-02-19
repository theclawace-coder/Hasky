import { useEffect, useRef, useState } from 'react';
import { MapPin, LoaderCircle } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import {
  searchMapboxAddresses,
  type MapboxAddressSuggestion,
} from '../../lib/mapbox';
import { cn } from '../../lib/utils';
import { Input } from './Input';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: MapboxAddressSuggestion) => void;
  placeholder?: string;
  error?: unknown;
  disabled?: boolean;
  className?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Start typing an address',
  error,
  disabled,
  className,
}: AddressAutocompleteProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<MapboxAddressSuggestion[]>([]);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const debouncedValue = useDebounce(value, 300);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) {
        return;
      }
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener('mousedown', onClickOutside);
    return () => window.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const query = debouncedValue.trim();

    if (!query || query.length < 3) {
      return () => controller.abort();
    }

    setLoading(true);
    setLookupError(null);

    void searchMapboxAddresses(query, controller.signal)
      .then((results) => setSuggestions(results))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        setLookupError('Address suggestions unavailable');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [debouncedValue]);

  const showMenu = open && (loading || suggestions.length > 0 || Boolean(lookupError));

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Input
        value={value}
        onChange={(event) => {
          const nextValue = event.target.value;
          onChange(nextValue);
          if (nextValue.trim().length < 3) {
            setSuggestions([]);
            setLookupError(null);
          }
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        error={error}
        disabled={disabled}
        autoComplete="street-address"
      />

      {showMenu ? (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600">
              <LoaderCircle className="size-4 animate-spin" />
              Searching addresses...
            </div>
          ) : null}

          {!loading && lookupError ? (
            <p className="px-3 py-2 text-sm text-amber-700">{lookupError}. You can still enter manually.</p>
          ) : null}

          {!loading && !lookupError && suggestions.length ? (
            <ul className="max-h-64 overflow-y-auto py-1">
              {suggestions.map((suggestion) => (
                <li key={suggestion.id}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      onChange(suggestion.fullAddress);
                      onSelect?.(suggestion);
                      setOpen(false);
                    }}
                  >
                    <MapPin className="mt-0.5 size-4 shrink-0 text-slate-500" />
                    <span>{suggestion.fullAddress}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
