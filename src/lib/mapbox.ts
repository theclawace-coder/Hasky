const FALLBACK_MAPBOX_ACCESS_TOKEN =
  '';

export const MAPBOX_ACCESS_TOKEN =
  (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined) || FALLBACK_MAPBOX_ACCESS_TOKEN;

export interface MapboxAddressSuggestion {
  id: string;
  fullAddress: string;
  city?: string;
  state?: string;
  stateCode?: string;
  country?: string;
}

interface MapboxContextEntry {
  id?: string;
  text?: string;
  short_code?: string;
}

interface MapboxFeature {
  id: string;
  place_name?: string;
  context?: MapboxContextEntry[];
}

interface MapboxResponse {
  features?: MapboxFeature[];
}

const findContext = (context: MapboxContextEntry[] | undefined, prefix: string) =>
  (context ?? []).find((entry) => typeof entry.id === 'string' && entry.id.startsWith(prefix));

const parseStateCode = (shortCode?: string) => {
  if (!shortCode) {
    return undefined;
  }

  const upper = shortCode.toUpperCase();
  if (!upper.includes('-')) {
    return upper;
  }
  return upper.split('-').at(-1);
};

export async function searchMapboxAddresses(
  query: string,
  signal?: AbortSignal,
): Promise<MapboxAddressSuggestion[]> {
  const normalized = query.trim();
  if (!normalized || normalized.length < 3 || !MAPBOX_ACCESS_TOKEN) {
    return [];
  }

  const params = new URLSearchParams({
    access_token: MAPBOX_ACCESS_TOKEN,
    autocomplete: 'true',
    limit: '6',
    language: 'en',
    types: 'address,street,place,postcode,locality,neighborhood',
  });
  const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(normalized)}.json?${params.toString()}`;

  const response = await fetch(endpoint, { signal });
  if (!response.ok) {
    throw new Error('Address lookup failed');
  }

  const payload = (await response.json()) as MapboxResponse;
  return (payload.features ?? []).map((feature) => {
    const context = feature.context ?? [];
    const cityEntry = findContext(context, 'place');
    const stateEntry = findContext(context, 'region');
    const countryEntry = findContext(context, 'country');
    const stateCode = parseStateCode(stateEntry?.short_code);

    return {
      id: feature.id,
      fullAddress: feature.place_name ?? '',
      city: cityEntry?.text,
      state: stateEntry?.text,
      stateCode,
      country: countryEntry?.text,
    };
  });
}
