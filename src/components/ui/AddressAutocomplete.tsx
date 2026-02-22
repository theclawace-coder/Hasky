import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  const [open, setOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const debouncedValue = useDebounce(value, 300);
  const queryText = debouncedValue.trim();
  const canLookup = queryText.length >= 3;

  const addressQuery = useQuery({
    queryKey: ['address_lookup', queryText],
    queryFn: ({ signal }) => searchMapboxAddresses(queryText, signal),
    enabled: canLookup,
    staleTime: 30_000,
  });

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

  const loading = canLookup && addressQuery.isFetching;
  const suggestions: MapboxAddressSuggestion[] = canLookup ? (addressQuery.data ?? []) : [];
  const lookupError = canLookup && addressQuery.isError ? 'Address suggestions unavailable' : null;
  const showMenu = open && (loading || suggestions.length > 0 || Boolean(lookupError));

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Input
        value={value}
        onChange={(event) => {
          const nextValue = event.target.value;
          onChange(nextValue);
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
